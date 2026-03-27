"""
CARE WATCH - Moteur d'orchestration d'appels vocaux IA
Machine a etats pour le traitement automatique des alertes
"""
import uuid, asyncio, logging, math, random, re, base64, os
from datetime import datetime, timezone
from database import db, twilio_client, TWILIO_NUMBER, EMERGENT_LLM_KEY
from emergentintegrations.llm.chat import LlmChat, UserMessage
from twilio.twiml.voice_response import VoiceResponse, Gather
from services.elevenlabs_service import generate_speech
from services.carewatch_config import CARE_WATCH_CONFIG, VOICE_SCRIPTS

logger = logging.getLogger(__name__)
BASE_URL = os.environ.get("APP_URL", "https://prospace-ui-sync.preview.emergentagent.com")


def _pick_script(key: str, **kwargs) -> str:
    """Pick a random script variant and fill placeholders"""
    variants = VOICE_SCRIPTS.get(key, [key])
    text = random.choice(variants) if isinstance(variants, list) else variants
    for k, v in kwargs.items():
        text = text.replace(f"{{{k}}}", str(v))
    return text


def _norm_phone(p: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', (p or '').strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    if not cleaned.startswith('+'):
        cleaned = '+33' + cleaned
    return cleaned


def _now():
    return datetime.now(timezone.utc).isoformat()


async def _log_event(incident_id: str, state: str, detail: str, data: dict = None):
    """Log an event to the incident timeline"""
    event = {
        "timestamp": _now(), "state": state, "detail": detail,
        "data": data or {},
    }
    await db.incidents.update_one(
        {"id": incident_id},
        {"$push": {"timeline": event}, "$set": {"state": state, "updated_at": _now()}}
    )
    logger.info(f"[CARE WATCH] Incident {incident_id[:8]}: {state} - {detail}")


async def _generate_and_cache_audio(key: str, text: str) -> bool:
    """Generate ElevenLabs audio and cache in DB"""
    try:
        audio = generate_speech(text)
        if audio:
            await db.audio_cache.update_one(
                {"key": key},
                {"$set": {"key": key, "audio_b64": base64.b64encode(audio).decode(), "text": text}},
                upsert=True
            )
            return True
    except Exception as e:
        logger.error(f"Audio generation error for {key}: {e}")
    return False


async def _classify_speech(speech_text: str, context: str = "") -> dict:
    """Classify speech response using GPT-5.2"""
    result = {"intent": "intent_uncertain", "confidence": 0.0, "summary": ""}
    if not speech_text or len(speech_text.strip()) < 2:
        return {"intent": "no_speech", "confidence": 1.0, "summary": "Pas de parole detectee"}

    # Check for voicemail
    voicemail_words = ["messagerie", "laissez un message", "apres le bip", "boite vocale", "indisponible"]
    if any(w in speech_text.lower() for w in voicemail_words):
        return {"intent": "voicemail_detected", "confidence": 0.9, "summary": "Repondeur vocal detecte"}

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"classify-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Tu es un classificateur de reponses vocales pour un service de teleassistance medicale. "
                "Classe la reponse en UNE categorie parmi: intent_ok, intent_help, intent_uncertain, no_speech. "
                "Reponds UNIQUEMENT en JSON: "
                '{"intent": "intent_ok|intent_help|intent_uncertain|no_speech", "confidence": 0.0-1.0, "summary": "resume en 5 mots max"}'
            )
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=f'Reponse vocale: "{speech_text}". {context}'))
        import json
        clean = resp.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1].strip()
            if clean.startswith("json"):
                clean = clean[4:].strip()
        result = json.loads(clean)
    except Exception as e:
        logger.error(f"Speech classification error: {e}")
        # Fallback keyword-based
        lower = speech_text.lower()
        if any(w in lower for w in ['bien', 'va bien', 'oui', 'ok', 'ca va', 'rien', 'fausse']):
            result = {"intent": "intent_ok", "confidence": 0.6, "summary": "Mots positifs detectes"}
        elif any(w in lower for w in ['aide', 'mal', 'secours', 'tombe', 'non', 'urgence', 'douleur']):
            result = {"intent": "intent_help", "confidence": 0.6, "summary": "Mots de detresse detectes"}
    return result


async def _make_call(phone: str, twiml: VoiceResponse, incident_id: str,
                      target_type: str, target_id: str, target_name: str) -> dict:
    """Make a Twilio call and record it"""
    if not twilio_client:
        logger.error("Twilio not configured")
        return {"success": False, "error": "Twilio non configure"}
    try:
        call = twilio_client.calls.create(
            twiml=str(twiml), to=phone, from_=TWILIO_NUMBER,
            status_callback=f"{BASE_URL}/api/twilio/status",
            status_callback_event=['completed', 'busy', 'no-answer', 'failed'],
            timeout=CARE_WATCH_CONFIG["ring_timeout_seconds"],
        )
        record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid,
            "incident_id": incident_id, "target_type": target_type,
            "target_id": target_id, "target_name": target_name,
            "target_phone": phone, "status": "initiated",
            "operator_id": "carewatch_ai", "created_at": _now(),
            "answered": False, "response": None,
            "voice_engine": "elevenlabs", "input_mode": "speech",
        }
        await db.twilio_calls.insert_one(record)
        return {"success": True, "call_sid": call.sid, "call_id": record["id"]}
    except Exception as e:
        logger.error(f"Call error: {e}")
        return {"success": False, "error": str(e)}


async def _wait_for_call_result(call_sid: str, max_wait: int = 60) -> dict:
    """Wait for a call to complete and return result"""
    for _ in range(max_wait // 5):
        await asyncio.sleep(5)
        try:
            cs = twilio_client.calls(call_sid).fetch()
            await db.twilio_calls.update_one(
                {"call_sid": call_sid},
                {"$set": {"status": cs.status, "duration": str(cs.duration or 0)}}
            )
            if cs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                answered = cs.status == 'completed' and int(str(cs.duration or 0)) > 5
                # Check for speech response
                speech = await db.speech_responses.find_one({"call_sid": call_sid}, {"_id": 0})
                return {
                    "status": cs.status, "duration": int(str(cs.duration or 0)),
                    "answered": answered, "speech": speech,
                }
        except Exception as e:
            logger.error(f"Call status check error: {e}")
    return {"status": "timeout", "duration": 0, "answered": False, "speech": None}


# =============================================
# MAIN ORCHESTRATION ENGINE
# =============================================
async def carewatch_orchestrate(alert: dict):
    """
    CARE WATCH - Protocole d'orchestration complet
    Machine a etats: NEW_ALERT -> CALLING_PATIENT -> ... -> RESOLVED/CARE_DISPATCHED
    """
    try:
        await asyncio.sleep(2)  # Brief delay before starting

        ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
        if not ben:
            logger.error(f"Beneficiary not found: {alert['beneficiary_id']}")
            return

        prenom = ben.get('name', '').split(' ')[0]
        phone = _norm_phone(ben.get('phone', ''))

        # Get guardians ordered by priority
        guardians = []
        guardian_order = ben.get('guardian_order', ben.get('guardians', []))
        for gid in guardian_order:
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({
                    "id": g['id'], "name": g['name'],
                    "phone": g.get('phone', ''), "prenom": g['name'].split(' ')[0],
                })
        # Add any guardians not in order
        for gid in ben.get('guardians', []):
            if gid not in guardian_order:
                g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
                if g:
                    guardians.append({
                        "id": g['id'], "name": g['name'],
                        "phone": g.get('phone', ''), "prenom": g['name'].split(' ')[0],
                    })

        # Create incident record
        incident = {
            "id": str(uuid.uuid4()),
            "alert_id": alert['id'],
            "alert_type": alert.get('alert_type', 'sos'),
            "alert_message": alert.get('message', ''),
            "severity": alert.get('alert_type', 'sos'),
            "beneficiary_id": ben['id'],
            "beneficiary_name": ben['name'],
            "beneficiary_phone": phone,
            "beneficiary_address": ben.get('address', ''),
            "beneficiary_medical": ben.get('medical_conditions', ''),
            "beneficiary_allergies": ben.get('allergies', ''),
            "state": "NEW_ALERT",
            "guardians": guardians,
            "guardians_contacted": [],
            "assigned_guardian": None,
            "care_provider": None,
            "intervention_id": None,
            "calls": [],
            "transcriptions": [],
            "timeline": [{"timestamp": _now(), "state": "NEW_ALERT", "detail": f"Alerte {alert.get('alert_type', 'SOS')} recue pour {ben['name']}"}],
            "config": CARE_WATCH_CONFIG.copy(),
            "created_at": _now(),
            "updated_at": _now(),
            "resolved_at": None,
            "resolution": None,
            "operator_notes": [],
        }
        await db.incidents.insert_one(incident)
        iid = incident["id"]

        await db.alerts.update_one(
            {"id": alert['id']},
            {"$set": {"teleassistance_status": "CALLING_PATIENT", "incident_id": iid}}
        )

        # Update live status
        try:
            from routes.live_status_routes import advance_live_status
            await advance_live_status(alert['id'], "ai_calling", "Appel IA en cours - levee de doute")
        except Exception:
            pass

        # ─── STEP 1: CALL PATIENT ───
        await _log_event(iid, "CALLING_PATIENT", f"Appel du beneficiaire {ben['name']} ({phone})")

        if not phone or len(phone) < 10 or not twilio_client:
            await _log_event(iid, "PATIENT_NO_RESPONSE", "Numero invalide ou Twilio non configure")
        else:
            # Build TwiML with natural ElevenLabs voice
            greeting_text = _pick_script("patient_greeting", prenom=prenom)
            audio_key = f"incident_{iid}_patient_greeting"
            await _generate_and_cache_audio(audio_key, greeting_text)

            twiml = VoiceResponse()
            twiml.play(f"{BASE_URL}/api/elevenlabs/audio/{audio_key}")
            gather = Gather(
                input='speech', language='fr-FR',
                timeout=CARE_WATCH_CONFIG["speech_timeout"],
                speech_timeout=CARE_WATCH_CONFIG["speech_silence_timeout"],
                action=f"{BASE_URL}/api/carewatch/patient-response?incident_id={iid}"
            )
            twiml.append(gather)
            # No response fallback
            no_resp_key = f"incident_{iid}_no_response"
            no_resp_text = _pick_script("patient_no_response", prenom=prenom)
            await _generate_and_cache_audio(no_resp_key, no_resp_text)
            twiml.play(f"{BASE_URL}/api/elevenlabs/audio/{no_resp_key}")

            result = await _make_call(phone, twiml, iid, "beneficiary", ben['id'], ben['name'])
            if result["success"]:
                await _log_event(iid, "CALLING_PATIENT", f"Appel en cours (SID: {result['call_sid'][:12]}...)")
                call_result = await _wait_for_call_result(result["call_sid"])

                if call_result["answered"] and call_result.get("speech"):
                    speech = call_result["speech"]
                    classification = await _classify_speech(
                        speech.get("text", ""),
                        f"Alerte: {alert.get('message', '')}. Patient: {ben['name']}"
                    )
                    await db.incidents.update_one({"id": iid}, {"$push": {"transcriptions": {
                        "type": "patient", "text": speech.get("text", ""),
                        "classification": classification, "timestamp": _now()
                    }}})

                    intent = classification.get("intent", "intent_uncertain")

                    if intent == "intent_ok":
                        # Patient confirms OK → RESOLVED
                        ok_text = _pick_script("patient_ok_response", prenom=prenom)
                        await _log_event(iid, "PATIENT_CONFIRMED_OK",
                            f"Patient confirme aller bien: \"{speech.get('text', '')}\" → {classification.get('summary', '')}")
                        await _resolve_incident(iid, alert['id'], "PATIENT_CONFIRMED_OK",
                            f"Patient a confirme aller bien par la voix")
                        return

                    elif intent == "intent_help":
                        # Patient needs help → escalate to guardians
                        await _log_event(iid, "PATIENT_NEEDS_HELP",
                            f"Patient a besoin d'aide: \"{speech.get('text', '')}\" → {classification.get('summary', '')}")
                        # Continue to guardian escalation below

                    elif intent == "voicemail_detected":
                        await _log_event(iid, "PATIENT_NO_RESPONSE",
                            "Repondeur vocal detecte - escalade aux gardiens")

                    else:
                        # Ambiguous - try one reformulation
                        await _log_event(iid, "PATIENT_AMBIGUOUS",
                            f"Reponse ambigue: \"{speech.get('text', '')}\" → reformulation")
                        # The reformulation is handled by the Twilio webhook
                        # Wait a bit more for the second attempt
                        await asyncio.sleep(15)
                        # Check if a second speech response came in
                        speech2 = await db.speech_responses.find_one(
                            {"call_sid": result["call_sid"], "is_reformulation": True}, {"_id": 0}
                        )
                        if speech2:
                            class2 = await _classify_speech(speech2.get("text", ""))
                            if class2.get("intent") == "intent_ok":
                                await _log_event(iid, "PATIENT_CONFIRMED_OK", "Confirme OK apres reformulation")
                                await _resolve_incident(iid, alert['id'], "PATIENT_CONFIRMED_OK", "Confirme apres reformulation")
                                return
                        # Still ambiguous → escalate by precaution
                        await _log_event(iid, "PATIENT_NEEDS_HELP", "Reponse toujours ambigue - escalade par precaution")

                elif not call_result["answered"]:
                    await _log_event(iid, "PATIENT_NO_RESPONSE",
                        f"Patient n'a pas repondu (statut: {call_result['status']})")
            else:
                await _log_event(iid, "PATIENT_NO_RESPONSE", f"Erreur appel: {result.get('error', 'inconnu')}")

        # ─── STEP 2: CALL GUARDIANS IN CASCADE ───
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "CALLING_GUARDIANS"}})

        guardian_accepted = False
        for idx, guardian in enumerate(guardians):
            # Check if incident was resolved externally (e.g., via app)
            incident_check = await db.incidents.find_one({"id": iid}, {"_id": 0, "state": 1})
            if incident_check and incident_check.get("state") in ("RESOLVED", "GUARDIAN_INTERVENTION_ACCEPTED"):
                return

            g_phone = _norm_phone(guardian.get('phone', ''))
            if not g_phone or len(g_phone) < 10:
                await _log_event(iid, f"CALLING_GUARDIAN_{idx+1}", f"Gardien {guardian['name']}: numero invalide, passage au suivant")
                continue

            state_name = f"CALLING_GUARDIAN_{idx+1}" if idx < 2 else "CALLING_GUARDIAN_N"
            await _log_event(iid, state_name, f"Appel du gardien {idx+1}: {guardian['name']} ({g_phone})")
            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": state_name}})

            # Build guardian TwiML
            g_greeting = _pick_script("guardian_greeting", prenom_gardien=guardian['prenom'], prenom_patient=prenom)
            g_ask = _pick_script("guardian_ask_intervention", prenom_patient=prenom)
            full_text = f"{g_greeting} {g_ask}"
            g_audio_key = f"incident_{iid}_guardian_{guardian['id']}"
            await _generate_and_cache_audio(g_audio_key, full_text)

            twiml_g = VoiceResponse()
            twiml_g.play(f"{BASE_URL}/api/elevenlabs/audio/{g_audio_key}")
            gather_g = Gather(
                input='speech', language='fr-FR',
                timeout=CARE_WATCH_CONFIG["speech_timeout"],
                speech_timeout=CARE_WATCH_CONFIG["speech_silence_timeout"],
                action=f"{BASE_URL}/api/carewatch/guardian-response?incident_id={iid}&guardian_id={guardian['id']}"
            )
            twiml_g.append(gather_g)
            twiml_g.say("Pas de reponse. Merci.", voice='Polly.Lea', language='fr-FR')

            g_result = await _make_call(g_phone, twiml_g, iid, "guardian", guardian['id'], guardian['name'])
            if g_result["success"]:
                g_call = await _wait_for_call_result(g_result["call_sid"], max_wait=CARE_WATCH_CONFIG["guardian_ring_timeout_seconds"] + 30)

                await db.incidents.update_one({"id": iid}, {"$push": {"guardians_contacted": {
                    "id": guardian['id'], "name": guardian['name'],
                    "answered": g_call["answered"], "timestamp": _now(),
                }}})

                if g_call["answered"]:
                    speech = g_call.get("speech")
                    if speech:
                        g_class = await _classify_guardian_response(speech.get("text", ""))
                        await db.incidents.update_one({"id": iid}, {"$push": {"transcriptions": {
                            "type": "guardian", "guardian_name": guardian['name'],
                            "text": speech.get("text", ""), "classification": g_class, "timestamp": _now()
                        }}})

                        if g_class.get("will_intervene"):
                            await _log_event(iid, "GUARDIAN_INTERVENTION_ACCEPTED",
                                f"Gardien {guardian['name']} accepte d'intervenir: \"{speech.get('text', '')}\"")
                            await db.incidents.update_one({"id": iid}, {"$set": {"assigned_guardian": guardian}})
                            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "GUARDIAN_INTERVENTION_ACCEPTED"}})

                            # Wait for app confirmation
                            await _log_event(iid, "GUARDIAN_INTERVENTION_ACCEPTED",
                                f"En attente de confirmation dans l'app par {guardian['name']}")
                            guardian_accepted = True
                            break
                    else:
                        await _log_event(iid, state_name, f"Gardien {guardian['name']} a decroche mais pas de reponse vocale")
                else:
                    await _log_event(iid, "GUARDIAN_UNREACHABLE", f"Gardien {guardian['name']}: {g_call['status']}")
            else:
                await _log_event(iid, "GUARDIAN_UNREACHABLE", f"Gardien {guardian['name']}: erreur appel")

        # ─── STEP 3: DISPATCH CARE IF NEEDED ───
        if not guardian_accepted:
            await _dispatch_care(iid, alert, ben, guardians)

    except Exception as e:
        logger.error(f"CARE WATCH orchestration error: {e}", exc_info=True)
        try:
            await _log_event(incident['id'], "FAILED", f"Erreur systeme: {str(e)[:200]}")
        except:
            pass


async def _classify_guardian_response(text: str) -> dict:
    """Classify guardian's vocal response"""
    result = {"will_intervene": False, "cannot_intervene": False, "summary": ""}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"g-classify-{uuid.uuid4().hex[:8]}",
            system_message='Classe la reponse d\'un gardien. JSON: {"will_intervene": bool, "cannot_intervene": bool, "summary": "5 mots max"}'
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=f'Le gardien a dit: "{text}"'))
        import json
        clean = resp.strip()
        if "```" in clean:
            clean = clean.split("```")[1].strip()
            if clean.startswith("json"):
                clean = clean[4:].strip()
        result = json.loads(clean)
    except:
        lower = text.lower()
        result["will_intervene"] = any(w in lower for w in ['oui', "j'y vais", 'arrive', "d'accord", 'ok', 'interviens'])
        result["cannot_intervene"] = any(w in lower for w in ['non', 'peux pas', 'indisponible', 'pas possible'])
        result["summary"] = "Analyse par mots-cles"
    return result


async def _resolve_incident(incident_id: str, alert_id: str, resolution: str, detail: str):
    """Mark incident as resolved"""
    now = _now()
    await db.incidents.update_one({"id": incident_id}, {"$set": {
        "state": "RESOLVED", "resolution": resolution,
        "resolved_at": now, "updated_at": now,
    }, "$push": {"timeline": {"timestamp": now, "state": "RESOLVED", "detail": detail}}})
    await db.alerts.update_one({"id": alert_id}, {"$set": {
        "status": "resolved", "teleassistance_status": "RESOLVED",
        "resolved_at": now,
    }})


async def _dispatch_care(incident_id: str, alert: dict, ben: dict, guardians: list):
    """Dispatch intervention to nearest SAAD company's intervenants"""
    now = _now()
    await _log_event(incident_id, "CARE_DISPATCHED", "Aucun gardien disponible - dispatch intervention Care")
    await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "CARE_DISPATCHED"}})

    ben_lat = ben.get('latitude', 45.4737)
    ben_lng = ben.get('longitude', 4.5134)

    # Find ALL care providers with their company info
    interveners = await db.users.find({"is_intervention_provider": True}, {"_id": 0, "password_hash": 0}).to_list(200)

    # Group by company and find nearest company
    company_groups = {}
    independents = []
    for iv in interveners:
        iv_lat = iv.get('latitude')
        iv_lng = iv.get('longitude')
        if iv_lat and iv_lng:
            dist = math.sqrt((ben_lat - iv_lat)**2 + (ben_lng - iv_lng)**2) * 111
            iv['_distance'] = dist
            cid = iv.get('prescriber_company_id')
            if cid:
                if cid not in company_groups:
                    company_groups[cid] = []
                company_groups[cid].append(iv)
            else:
                radius = iv.get('intervention_radius_km', 30)
                if dist <= radius:
                    independents.append(iv)

    # Find nearest company (average distance of its intervenants)
    best_company_id = None
    best_company_dist = float('inf')
    for cid, members in company_groups.items():
        in_range = [m for m in members if m['_distance'] <= m.get('intervention_radius_km', 30)]
        if in_range:
            avg_dist = sum(m['_distance'] for m in in_range) / len(in_range)
            if avg_dist < best_company_dist:
                best_company_dist = avg_dist
                best_company_id = cid

    # Select recipients: all intervenants of the nearest company, or independents
    all_recipients = []
    dispatch_company_id = None
    if best_company_id:
        all_recipients = [m for m in company_groups[best_company_id] if m['_distance'] <= m.get('intervention_radius_km', 30)]
        dispatch_company_id = best_company_id
    if not all_recipients:
        all_recipients = independents

    all_recipients.sort(key=lambda x: x.get('_distance', 999))
    nearest = all_recipients[0] if all_recipients else None

    # Get company info
    company_info = None
    if dispatch_company_id:
        company_user = await db.users.find_one({"id": dispatch_company_id}, {"_id": 0, "password_hash": 0})
        if company_user:
            company_info = {"id": dispatch_company_id, "name": company_user.get('structure_name', company_user.get('name', ''))}

    # Create intervention
    iv_id = str(uuid.uuid4())
    intervention = {
        "id": iv_id, "alert_id": alert['id'], "incident_id": incident_id,
        "beneficiary_id": ben['id'], "beneficiary_name": ben['name'],
        "company_id": dispatch_company_id,
        "company_name": company_info['name'] if company_info else None,
        "structure_name": nearest.get('structure_name', nearest.get('name', '')) if nearest else "Service Care",
        "recipients": [{"id": r['id'], "name": r['name'], "phone": r.get('phone', ''), "distance_km": round(r.get('_distance', 0), 1)} for r in all_recipients],
        "assigned_to": None, "assigned_name": None,
        "status": "pending_acceptance",
        "alert_type": alert.get('alert_type', 'sos'),
        "alert_message": alert.get('message', ''),
        "notes": f"Escalade CARE WATCH - Aucun gardien n'a pu intervenir",
        "beneficiary_info": {
            "name": ben.get('name', ''), "phone": ben.get('phone', ''),
            "address": ben.get('address', ''),
            "medical_conditions": ben.get('medical_conditions', ''),
            "allergies": ben.get('allergies', ''),
            "blood_type": ben.get('blood_type', ''),
            "date_of_birth": ben.get('date_of_birth', ''),
            "emergency_contact_name": ben.get('emergency_contact_name', ''),
            "emergency_contact_phone": ben.get('emergency_contact_phone', ''),
            "doctor_name": ben.get('doctor_name', ''),
        },
        "beneficiary_location": {"latitude": ben_lat, "longitude": ben_lng, "address": ben.get('address', '')},
        "intervenant_location": None,
        "distance_km": round(nearest.get('_distance', 0), 1) if nearest else None,
        "created_at": now, "accepted_at": None, "completed_at": None,
        "report": None, "report_answers": [],
        "timeline": [{"status": "pending_acceptance", "time": now,
                      "note": f"Mission Care envoyee a {company_info['name'] if company_info else 'intervenants independants'} - {len(all_recipients)} intervenant(s) notifie(s)"}],
    }
    await db.interventions.insert_one(intervention)
    await db.incidents.update_one({"id": incident_id}, {"$set": {
        "intervention_id": iv_id, "care_provider": nearest.get('name', '') if nearest else None,
    }})
    await _log_event(incident_id, "CARE_DISPATCHED",
        f"Intervention #{iv_id[:8]} creee - {company_info['name'] if company_info else 'independants'} - {len(all_recipients)} intervenant(s) - {nearest.get('name', '')} ({nearest.get('_distance', 0):.1f}km)" if nearest else "Aucun intervenant Care disponible")
