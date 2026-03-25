from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid, asyncio, logging, math, os

from database import db, twilio_client, TWILIO_NUMBER, EMERGENT_LLM_KEY
from auth import get_current_user
from models import EscalationStart, EscalationStepRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage
from services.elevenlabs_service import generate_speech_base64, generate_speech, MESSAGES, get_contextual_message
from twilio.twiml.voice_response import VoiceResponse, Gather

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== ESCALATION ====================
@router.post("/teleassistance/escalation/start")
async def start_escalation(data: EscalationStart, user=Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    guardians = []
    if ben:
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', '')})
    now = datetime.now(timezone.utc).isoformat()
    esc = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id,
        "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
        "operator_id": user['id'], "operator_name": user['name'],
        "status": "in_progress", "current_step": "calling_beneficiary",
        "current_target": {"id": alert['beneficiary_id'], "name": alert['beneficiary_name'], "type": "beneficiary"},
        "guardians_called": [], "guardians_remaining": guardians,
        "protocol_answers": [],
        "timeline": [{"step": "started", "time": now, "note": f"Escalade demarree par {user['name']}"}],
        "intervention_id": None, "created_at": now,
    }
    await db.escalations.insert_one(esc)
    await db.alerts.update_one({"id": data.alert_id}, {"$set": {"teleassistance_status": "in_progress"}})
    return {k: v for k, v in esc.items() if k != '_id'}


@router.post("/teleassistance/escalation/step")
async def advance_escalation(data: EscalationStepRequest, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": data.escalation_id}, {"_id": 0})
    if not esc:
        raise HTTPException(status_code=404, detail="Escalade non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    step = esc['current_step']
    if data.answers:
        esc['protocol_answers'].extend(data.answers)
    if data.response == "resolved":
        esc['status'] = "resolved"
        esc['current_step'] = "resolved"
        esc['timeline'].append({"step": "resolved", "time": now, "note": data.notes or "Levee de doute reussie"})
        await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "teleassistance_status": "resolved"}})
    elif step == "calling_beneficiary":
        if data.response == "answered":
            esc['current_step'] = "doubt_lifting"
            esc['timeline'].append({"step": "beneficiary_answered", "time": now, "note": "Beneficiaire a repondu"})
        elif data.response == "no_answer":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0)
                esc['guardians_called'].append(g)
                esc['current_step'] = "calling_guardian"
                esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "beneficiary_no_answer", "time": now, "note": f"Pas de reponse -> Appel gardien {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "no_guardians", "time": now, "note": "Aucun gardien -> Intervention requise"})
    elif step == "doubt_lifting":
        if data.response == "not_resolved":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0)
                esc['guardians_called'].append(g)
                esc['current_step'] = "calling_guardian"
                esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "escalate_guardian", "time": now, "note": f"Non concluant -> Appel gardien {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "escalate_dispatch", "time": now, "note": "Aucun gardien -> Intervention"})
    elif step == "calling_guardian":
        if data.response == "answered":
            esc['status'] = "guardian_handling"
            esc['current_step'] = "guardian_handling"
            esc['timeline'].append({"step": "guardian_answered", "time": now, "note": f"Gardien {esc['current_target']['name']} prend en charge"})
        elif data.response == "no_answer":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0)
                esc['guardians_called'].append(g)
                esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "guardian_no_answer", "time": now, "note": f"Injoignable -> Gardien suivant {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "all_guardians_failed", "time": now, "note": "Tous gardiens injoignables -> Intervention"})
    if esc['current_step'] == "dispatch_needed" or data.response == "dispatch":
        alert = await db.alerts.find_one({"id": esc['alert_id']}, {"_id": 0})
        ben = await db.users.find_one({"id": esc['beneficiary_id']}, {"_id": 0})
        ben_lat = ben.get('latitude', 45.4737) if ben else 45.4737
        ben_lng = ben.get('longitude', 4.5134) if ben else 4.5134

        # Find nearest intervention CODE (structure) by finding nearest intervention provider
        interveners = await db.users.find({"is_intervention_provider": True}, {"_id": 0, "password_hash": 0}).to_list(200)
        # Group by intervention_code (prescriber_code_used or structure)
        code_groups = {}
        for iv_user in interveners:
            code = iv_user.get('intervention_code') or iv_user.get('prescriber_code_used') or iv_user.get('structure_name') or iv_user.get('id')
            iv_lat = iv_user.get('latitude')
            iv_lng = iv_user.get('longitude')
            if iv_lat and iv_lng:
                dist = math.sqrt((ben_lat - iv_lat) ** 2 + (ben_lng - iv_lng) ** 2) * 111
                radius = iv_user.get('intervention_radius_km', 30)
                if dist <= radius:
                    if code not in code_groups or dist < code_groups[code]['min_dist']:
                        code_groups[code] = {'min_dist': dist, 'members': [], 'nearest': iv_user}
                    code_groups[code]['members'].append(iv_user)

        # Find the nearest code group
        nearest_code = None
        nearest_dist = float('inf')
        for code, group in code_groups.items():
            if group['min_dist'] < nearest_dist:
                nearest_dist = group['min_dist']
                nearest_code = code

        all_recipients = code_groups[nearest_code]['members'] if nearest_code else []
        nearest = code_groups[nearest_code]['nearest'] if nearest_code else None
        structure_name = nearest.get('structure_name', nearest.get('name', '')) if nearest else "Structure partenaire"
        distance_note = f" ({nearest_dist:.1f}km)" if nearest else ""

        iv_id = str(uuid.uuid4())
        iv = {
            "id": iv_id, "alert_id": esc['alert_id'], "escalation_id": esc['id'],
            "beneficiary_id": esc['beneficiary_id'], "beneficiary_name": esc['beneficiary_name'],
            "intervention_code": nearest_code or "",
            "structure_name": structure_name,
            "recipients": [{"id": r['id'], "name": r['name'], "phone": r.get('phone', '')} for r in all_recipients],
            "assigned_to": None, "assigned_name": None,
            "status": "pending_acceptance",
            "notes": f"Auto-dispatch: {alert['message'] if alert else 'Alerte'}",
            "alert_type": alert.get('alert_type', 'sos') if alert else 'sos',
            "alert_message": alert.get('message', '') if alert else '',
            "beneficiary_info": {
                "name": ben.get('name', '') if ben else '', "phone": ben.get('phone', '') if ben else '',
                "address": ben.get('address', '') if ben else '',
                "medical_conditions": ben.get('medical_conditions', '') if ben else '',
                "allergies": ben.get('allergies', '') if ben else '',
                "emergency_contact_name": ben.get('emergency_contact_name', '') if ben else '',
                "emergency_contact_phone": ben.get('emergency_contact_phone', '') if ben else '',
            },
            "beneficiary_location": {"latitude": ben_lat, "longitude": ben_lng, "address": ben.get('address', '') if ben else ''},
            "distance_km": round(nearest_dist, 1) if nearest else None,
            "created_at": now, "accepted_at": None, "completed_at": None,
            "report": None, "report_answers": [],
            "timeline": [{"status": "pending_acceptance", "time": now, "note": f"Demande envoyee a {len(all_recipients)} intervenant(s) Care - {structure_name}{distance_note}"}],
        }
        await db.interventions.insert_one(iv)
        esc['intervention_id'] = iv_id
        esc['status'] = "dispatched"
        esc['current_step'] = "dispatched"
        esc['timeline'].append({"step": "dispatched", "time": now, "note": f"Intervenant Care {structure_name}{distance_note} - {len(all_recipients)} notifie(s) - Intervention #{iv_id[:8]}"})
        await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"teleassistance_status": "intervention_dispatched"}})
    await db.escalations.update_one({"id": esc['id']}, {"$set": {
        "status": esc['status'], "current_step": esc['current_step'], "current_target": esc['current_target'],
        "guardians_called": esc['guardians_called'], "guardians_remaining": esc['guardians_remaining'],
        "protocol_answers": esc['protocol_answers'], "timeline": esc['timeline'], "intervention_id": esc.get('intervention_id'),
    }})
    return {k: v for k, v in esc.items() if k != '_id'}


@router.get("/teleassistance/escalation/{eid}")
async def get_escalation(eid: str, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": eid}, {"_id": 0})
    if not esc:
        raise HTTPException(status_code=404, detail="Escalade non trouvee")
    return esc


@router.get("/teleassistance/escalations")
async def get_escalations(user=Depends(get_current_user)):
    return await db.escalations.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)


@router.post("/teleassistance/escalation/{eid}/takeover")
async def manual_takeover(eid: str, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": eid}, {"_id": 0})
    if not esc:
        raise HTTPException(status_code=404, detail="Escalade non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    esc.setdefault('timeline', []).append({"step": "manual_takeover", "time": now, "note": f"Reprise en main manuelle par {user.get('name', 'Operateur')}"})
    await db.escalations.update_one({"id": eid}, {"$set": {"status": "manual_control", "manual_operator": user.get('name', user['id']), "timeline": esc['timeline']}})
    await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"teleassistance_status": "manual_control"}})
    return {"status": "manual_control", "operator": user.get('name', '')}


@router.post("/teleassistance/escalation/{eid}/resolve")
async def resolve_escalation(eid: str, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": eid}, {"_id": 0})
    if not esc:
        raise HTTPException(status_code=404, detail="Escalade non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    esc.setdefault('timeline', []).append({"step": "resolved", "time": now, "note": f"Resolu par {user.get('name', 'Operateur')}"})
    await db.escalations.update_one({"id": eid}, {"$set": {"status": "resolved", "resolved_at": now, "timeline": esc['timeline']}})
    await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "teleassistance_status": "resolved"}})
    return {"status": "resolved"}


@router.get("/escalation/active")
async def get_active_escalations(user=Depends(get_current_user)):
    active = await db.escalations.find({"status": {"$in": ["in_progress", "guardian_handling", "dispatched"]}}, {"_id": 0}).sort("created_at", -1).to_list(20)
    for esc in active:
        calls = await db.twilio_calls.find({"escalation_id": esc['id']}, {"_id": 0}).sort("created_at", -1).to_list(10)
        esc['calls'] = calls
    return active



    from starlette.responses import Response as StarletteResponse
    return StarletteResponse(content=str(resp_twiml), media_type="application/xml")
async def ai_analyze_speech(data: dict, user=Depends(get_current_user)):
    """Manually analyze a speech response with AI"""
    speech_text = data.get("text", "")
    alert_id = data.get("alert_id", "")
    if not speech_text:
        raise HTTPException(status_code=400, detail="Texte requis")

    alert_context = ""
    if alert_id:
        alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
        if alert:
            ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
            alert_context = (
                f"Alerte: {alert.get('message', '')} (type: {alert.get('alert_type', '')}, severite: {alert.get('severity', '')}). "
                f"Beneficiaire: {alert.get('beneficiary_name', '')}."
            )
            if ben:
                alert_context += f" Pathologies: {ben.get('medical_conditions', 'aucune')}. Allergies: {ben.get('allergies', 'aucune')}."

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"analysis-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Tu es un assistant medical IA expert en teleassistance. "
                "Analyse la situation et donne des recommandations claires et concises en francais."
            )
        ).with_model("openai", "gpt-5.2")
        prompt = f"Analyse cette reponse vocale du beneficiaire: \"{speech_text}\". Contexte: {alert_context}. Donne ton evaluation de la situation, le niveau d'urgence, et tes recommandations pour l'operateur."
        analysis = await chat.send_message(UserMessage(text=prompt))
        return {"analysis": analysis, "speech_text": speech_text}
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {"analysis": f"Analyse IA indisponible: {str(e)}", "speech_text": speech_text}


@router.post("/ai/protocol-summary")
async def ai_protocol_summary(data: dict, user=Depends(get_current_user)):
    """Generate an AI summary of the entire alert protocol execution"""
    alert_id = data.get("alert_id", "")
    if not alert_id:
        raise HTTPException(status_code=400, detail="alert_id requis")

    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")

    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    escalations = await db.escalations.find({"alert_id": alert_id}, {"_id": 0}).sort("created_at", -1).to_list(5)
    calls = await db.twilio_calls.find({"alert_id": alert_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    interventions = await db.interventions.find({"alert_id": alert_id}, {"_id": 0}).to_list(5)
    speech_responses = []
    for c in calls:
        sr = await db.speech_responses.find_one({"call_sid": c.get('call_sid', '')}, {"_id": 0})
        if sr:
            speech_responses.append(sr)

    context = f"ALERTE: {alert.get('message', '')} (type: {alert.get('alert_type', '')}, severite: {alert.get('severity', '')})\n"
    context += f"BENEFICIAIRE: {alert.get('beneficiary_name', '')}\n"
    if ben:
        context += f"Pathologies: {ben.get('medical_conditions', 'aucune')}, Allergies: {ben.get('allergies', 'aucune')}\n"
    context += f"STATUT: {alert.get('status', '')}, Statut TA: {alert.get('teleassistance_status', '')}\n\n"

    if escalations:
        context += "ESCALADES:\n"
        for esc in escalations:
            for t in esc.get('timeline', []):
                context += f"- [{t.get('time', '')[:19]}] {t.get('note', '')}\n"
    if calls:
        context += f"\nAPPELS ({len(calls)}):\n"
        for c in calls:
            context += f"- {c.get('target_name', '')} ({c.get('target_type', '')}): {c.get('status', '')} - Reponse: {c.get('response', 'aucune')}\n"
    if speech_responses:
        context += "\nREPONSES VOCALES:\n"
        for sr in speech_responses:
            context += f"- \"{sr.get('text', '')}\" (confiance: {sr.get('confidence', 0):.0%}) -> OK: {sr.get('confirmed_ok', False)}, Aide: {sr.get('needs_help', False)}\n"
            if sr.get('ai_analysis'):
                context += f"  Analyse IA: urgence={sr['ai_analysis'].get('urgency', '?')}, sentiment={sr['ai_analysis'].get('sentiment', '?')}\n"
    if interventions:
        context += f"\nINTERVENTIONS ({len(interventions)}):\n"
        for iv in interventions:
            context += f"- {iv.get('assigned_name', 'non assigne')} ({iv.get('structure_name', '')}): {iv.get('status', '')}\n"

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Tu es un expert en teleassistance medicale. "
                "Genere un resume structure du protocole d'alerte execute. "
                "Inclus: 1) Resume de la situation, 2) Actions effectuees, 3) Evaluation du risque actuel, 4) Recommandations. "
                "Sois concis et professionnel."
            )
        ).with_model("openai", "gpt-5.2")
        summary = await chat.send_message(UserMessage(text=f"Genere le resume du protocole pour cette alerte:\n{context}"))
        return {"summary": summary, "alert_id": alert_id, "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Protocol summary error: {e}")
        return {"summary": f"Resume IA indisponible: {str(e)}", "alert_id": alert_id}


# ==================== AUTO ESCALATION WITH ELEVENLABS ====================
async def auto_escalation_protocol(alert: dict):
    """Full AI escalation: ElevenLabs voice + speech recognition + guardian cascade"""
    try:
        await asyncio.sleep(2)
        now = datetime.now(timezone.utc).isoformat()
        ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
        if not ben:
            return

        # Get guardians ordered by priority
        guardians = []
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', '')})

        # Determine alert type for the right message
        alert_type = alert.get('alert_type', 'sos')
        if alert_type == 'sos' or 'chute' in alert.get('message', '').lower() or 'fall' in alert.get('message', '').lower():
            message_key = 'fall_detected'
        elif 'inactiv' in alert.get('message', '').lower():
            message_key = 'inactivity_alert'
        else:
            message_key = 'sos_manual'

        # Helper to normalize phone numbers
        def norm_phone(p):
            import re
            cleaned = re.sub(r'[\s\-\.\(\)]', '', (p or '').strip())
            if cleaned.startswith('0') and len(cleaned) == 10:
                cleaned = '+33' + cleaned[1:]
            if not cleaned.startswith('+'):
                cleaned = '+33' + cleaned
            return cleaned

        # Create escalation record
        esc = {
            "id": str(uuid.uuid4()), "alert_id": alert['id'],
            "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert.get('beneficiary_name', ''),
            "operator_id": "ai_auto", "operator_name": "IA Teleassistance ElevenLabs",
            "status": "in_progress", "current_step": "calling_beneficiary",
            "current_target": {"id": alert['beneficiary_id'], "name": alert.get('beneficiary_name', ''), "type": "beneficiary"},
            "guardians_called": [], "guardians_remaining": guardians,
            "protocol_answers": [],
            "timeline": [{"step": "auto_started", "time": now, "note": "Protocole IA automatique declenche (ElevenLabs)"}],
            "intervention_id": None, "created_at": now,
        }
        await db.escalations.insert_one(esc)
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "ai_calling", "escalation_id": esc['id']}})

        # Build base URL for audio
        base_url = os.environ.get("APP_URL", "https://coach-payment-portal.preview.emergentagent.com")

        # STEP 1: Call beneficiary with ElevenLabs voice + speech recognition
        ben_phone = norm_phone(ben.get('phone', ''))
        ben_confirmed_ok = False
        if ben_phone and twilio_client:
            twiml = VoiceResponse()
            # Play ElevenLabs audio
            twiml.play(f"{base_url}/api/elevenlabs/audio/{message_key}")
            # Listen for voice response (speech recognition in French)
            gather = Gather(
                input='speech',
                language='fr-FR',
                timeout=10,
                speech_timeout=5,
                action=f"{base_url}/api/twilio/speech-response",
            )
            twiml.append(gather)
            # No response -> play no_response message
            twiml.play(f"{base_url}/api/elevenlabs/audio/no_response")

            try:
                call = twilio_client.calls.create(twiml=str(twiml), to=ben_phone, from_=TWILIO_NUMBER)
                call_record = {
                    "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "beneficiary", "target_id": ben['id'],
                    "target_name": ben['name'], "target_phone": ben_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": now, "answered": False, "response": None,
                    "voice_engine": "elevenlabs",
                }
                await db.twilio_calls.insert_one(call_record)
                esc['timeline'].append({"step": "calling_beneficiary", "time": datetime.now(timezone.utc).isoformat(), "note": f"Appel IA ElevenLabs -> {ben['name']} ({ben_phone})"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})

                # Wait for call to complete (max 60s)
                for _ in range(12):
                    await asyncio.sleep(5)
                    try:
                        cs = twilio_client.calls(call.sid).fetch()
                        await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"status": cs.status, "duration": cs.duration}})
                        if cs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            # Check if speech response was recorded
                            speech_rec = await db.speech_responses.find_one({"call_sid": call.sid}, {"_id": 0})
                            if speech_rec and speech_rec.get('confirmed_ok'):
                                ben_confirmed_ok = True
                                await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"answered": True, "response": speech_rec.get('text', '')}})
                            elif cs.status == 'completed' and int(str(cs.duration or 0)) > 20:
                                # Call was long enough, beneficiary likely spoke but we didn't catch confirmation
                                pass
                            break
                    except:
                        pass

                if ben_confirmed_ok:
                    esc['timeline'].append({"step": "resolved", "time": datetime.now(timezone.utc).isoformat(), "note": "Beneficiaire a confirme aller bien par la voix."})
                    esc['status'] = "resolved"
                    await db.alerts.update_one({"id": alert['id']}, {"$set": {"status": "resolved", "teleassistance_status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "resolved", "current_step": "resolved", "timeline": esc['timeline']}})
                    return
                else:
                    esc['timeline'].append({"step": "beneficiary_no_confirm", "time": datetime.now(timezone.utc).isoformat(), "note": f"{ben['name']} n'a pas confirme aller bien. Escalade aux gardiens."})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
            except Exception as e:
                logger.error(f"Auto-escalation beneficiary call error: {e}")
                esc['timeline'].append({"step": "call_error", "time": datetime.now(timezone.utc).isoformat(), "note": f"Erreur appel: {str(e)[:100]}"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})

        # STEP 2: Call guardians one by one until someone intervenes via the app
        for guardian in guardians:
            if esc.get('status') == 'resolved':
                return

            # Check if a guardian already intervened via the app
            intervention = await db.interventions.find_one({"alert_id": alert['id'], "status": {"$in": ["accepted", "en_route", "on_site"]}}, {"_id": 0})
            if intervention:
                esc['timeline'].append({"step": "guardian_intervened_app", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {intervention.get('guardian_name', '')} intervient via l'app."})
                esc['status'] = "guardian_handling"
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "guardian_handling", "current_step": "guardian_handling", "timeline": esc['timeline']}})
                return

            g_phone = norm_phone(guardian.get('phone', ''))
            if not g_phone or len(g_phone) < 10 or not twilio_client:
                continue

            esc['current_step'] = "calling_guardian"
            esc['current_target'] = {**guardian, "type": "guardian"}
            await db.escalations.update_one({"id": esc['id']}, {"$set": {"current_step": "calling_guardian", "current_target": esc['current_target']}})

            try:
                ben_name = alert.get('beneficiary_name', 'votre proche')
                alert_msg = alert.get('message', 'une alerte')
                guardian_text = (
                    f"Bonjour, ici le plateau d'ecoute Chutex. "
                    f"Une alerte a ete declenchee pour {ben_name}. {alert_msg}. "
                    f"Nous n'avons pas pu confirmer que tout va bien. "
                    f"Pouvez-vous intervenir ? Dites oui si vous y allez, ou non sinon."
                )
                from services.elevenlabs_service import generate_speech
                audio = generate_speech(guardian_text)

                import base64
                audio_key = f"guardian_call_{esc['id']}_{guardian['id']}"
                if audio:
                    await db.audio_cache.update_one(
                        {"key": audio_key},
                        {"$set": {"key": audio_key, "audio_b64": base64.b64encode(audio).decode(), "text": guardian_text}},
                        upsert=True
                    )

                twiml_g = VoiceResponse()
                if audio:
                    twiml_g.play(f"{base_url}/api/elevenlabs/audio/{audio_key}")
                else:
                    twiml_g.say(guardian_text, voice='Polly.Lea', language='fr-FR')

                # Use speech recognition for guardian response
                gather_g = Gather(
                    input='speech', language='fr-FR', timeout=10, speech_timeout=5,
                    action=f"{base_url}/api/twilio/guardian-speech-response?alert_id={alert['id']}&guardian_id={guardian['id']}"
                )
                twiml_g.append(gather_g)
                twiml_g.say("Nous n'avons pas recu de reponse. Nous contactons un autre gardien.", voice='Polly.Lea', language='fr-FR')

                g_call = twilio_client.calls.create(twiml=str(twiml_g), to=g_phone, from_=TWILIO_NUMBER)
                await db.twilio_calls.insert_one({
                    "id": str(uuid.uuid4()), "call_sid": g_call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "guardian", "target_id": guardian['id'],
                    "target_name": guardian['name'], "target_phone": g_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": datetime.now(timezone.utc).isoformat(), "answered": False,
                    "voice_engine": "elevenlabs",
                })
                esc['guardians_called'].append(guardian)
                esc['timeline'].append({"step": "calling_guardian", "time": datetime.now(timezone.utc).isoformat(), "note": f"Appel IA -> Gardien {guardian['name']} ({g_phone})"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {
                    "guardians_called": esc['guardians_called'], "timeline": esc['timeline']
                }})

                # Wait for guardian to answer
                for _ in range(10):
                    await asyncio.sleep(5)
                    try:
                        gs = twilio_client.calls(g_call.sid).fetch()
                        if gs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            g_answered = gs.status == 'completed' and int(str(gs.duration or 0)) > 5
                            await db.twilio_calls.update_one({"call_sid": g_call.sid}, {"$set": {"answered": g_answered, "status": gs.status}})
                            if g_answered:
                                esc['timeline'].append({"step": "guardian_notified", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {guardian['name']} a decroche. En attente d'intervention via l'app."})
                                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
                            break
                    except:
                        pass

                # Wait 30s for guardian to intervene via app
                for _ in range(6):
                    await asyncio.sleep(5)
                    intervention = await db.interventions.find_one({"alert_id": alert['id'], "status": {"$in": ["accepted", "en_route", "on_site"]}}, {"_id": 0})
                    if intervention:
                        esc['timeline'].append({"step": "guardian_intervened_app", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {intervention.get('guardian_name', '')} intervient via l'app."})
                        esc['status'] = "guardian_handling"
                        await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "guardian_handling", "current_step": "guardian_handling", "timeline": esc['timeline']}})
                        return

            except Exception as e:
                logger.error(f"Guardian call error: {e}")

        # STEP 3: No guardian responded - dispatch emergency
        esc['timeline'].append({"step": "no_guardian_response", "time": datetime.now(timezone.utc).isoformat(), "note": "Aucun gardien n'a repondu. Situation critique."})
        esc['status'] = "dispatched"
        esc['current_step'] = "dispatched"
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "dispatched", "severity": "critical"}})
        await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "dispatched", "current_step": "dispatched", "timeline": esc['timeline']}})

    except Exception as e:
        logger.error(f"Auto-escalation protocol error: {e}")


