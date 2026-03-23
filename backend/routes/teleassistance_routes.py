from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid, random, asyncio, logging, os, math

from database import db, twilio_client, TWILIO_NUMBER, EMERGENT_LLM_KEY
from auth import get_current_user
from models import TeleassistanceCallUpdate, EscalationStart, EscalationStepRequest, TriggerCallRequest, InterventionAcceptRequest, InterventionCloseRequest, InterventionLocationUpdate
from emergentintegrations.llm.chat import LlmChat, UserMessage
from twilio.twiml.voice_response import VoiceResponse, Gather
from services.elevenlabs_service import generate_speech_base64, generate_speech, MESSAGES, get_contextual_message

logger = logging.getLogger(__name__)
router = APIRouter()

DOUBT_QUESTIONS = [
    {"id": "d1", "question": "Bonjour, ici le service Chutex. Comment vous sentez-vous ?", "options": ["Bien, fausse alerte", "Un peu mal", "Tres mal", "Je ne peux pas repondre"]},
    {"id": "d2", "question": "Pouvez-vous vous deplacer ?", "options": ["Oui, sans difficulte", "Avec difficulte", "Non, je ne peux pas"]},
    {"id": "d3", "question": "Avez-vous des douleurs ?", "options": ["Non", "Legeres", "Moderees", "Severes"]},
    {"id": "d4", "question": "Avez-vous besoin qu'on contacte vos proches ?", "options": ["Non, tout va bien", "Oui, par precaution", "Oui, c'est urgent"]},
]

GUARDIAN_PROTOCOL = [
    {"id": "g1", "question": "Nous vous contactons pour {beneficiary_name}. Une alerte a ete declenchee: {alert_message}. Pouvez-vous vous rendre sur place ?", "options": ["Oui, j'y vais", "Non, je ne peux pas", "Je contacte quelqu'un d'autre"]},
    {"id": "g2", "question": "Connaissez-vous l'etat de sante habituel de cette personne ?", "options": ["Oui, c'est normal", "Non, c'est inhabituel", "Je ne sais pas"]},
]


@router.get("/teleassistance/subscriber/{subscriber_id}")
async def get_subscriber_detail(subscriber_id: str, user=Depends(get_current_user)):
    """Full subscriber detail page data - used by frontend subscriber-detail.tsx"""
    sub = await db.users.find_one({"id": subscriber_id}, {"_id": 0, "password_hash": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonne non trouve")
    alerts = await db.alerts.find({"beneficiary_id": subscriber_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    escalations = await db.escalations.find({"beneficiary_id": subscriber_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    calls = await db.twilio_calls.find({"target_id": subscriber_id}, {"_id": 0}).sort("created_at", -1).to_list(30)
    interventions = await db.interventions.find({"beneficiary_id": subscriber_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    readings = await db.device_readings.find({"user_id": subscriber_id}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    guardians = []
    for gid in sub.get('guardians', []):
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g:
            guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', ''), "email": g.get('email', '')})
    active_alerts = sum(1 for a in alerts if a['status'] == 'active')
    return {
        "user": sub, "alerts": alerts, "escalations": escalations, "calls": calls,
        "interventions": interventions, "latest_readings": readings, "guardians": guardians,
        "stats": {
            "active_alerts": active_alerts, "total_alerts": len(alerts),
            "total_escalations": len(escalations), "total_interventions": len(interventions),
        },
    }


@router.get("/teleassistance/protocol/beneficiary")
async def get_beneficiary_protocol():
    return DOUBT_QUESTIONS


@router.get("/teleassistance/protocol/guardian")
async def get_guardian_protocol():
    return GUARDIAN_PROTOCOL


@router.post("/teleassistance/call")
async def process_teleassistance_call(data: TeleassistanceCallUpdate, user=Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    call_log = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id,
        "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
        "operator_id": user['id'], "operator_name": user['name'],
        "step": data.step, "answers": data.answers, "notes": data.notes,
        "resolution": data.resolution, "created_at": now,
    }
    await db.teleassistance_calls.insert_one(call_log)
    ta_status = "resolved" if data.resolution == "resolved" else "guardian_called" if data.resolution == "escalate_guardian" else "intervention_dispatched" if data.resolution == "dispatch_intervention" else "in_progress"
    await db.alerts.update_one({"id": data.alert_id}, {"$set": {"teleassistance_status": ta_status}})
    if data.resolution == "resolved":
        await db.alerts.update_one({"id": data.alert_id}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id']}})
    ai_analysis = ""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"ta-{uuid.uuid4().hex[:8]}",
                        system_message="Tu analyses les appels de teleassistance. Synthese courte en francais."
                        ).with_model("openai", "gpt-5.2")
        ai_analysis = await chat.send_message(UserMessage(text=f"Appel pour {alert['beneficiary_name']}, alerte: {alert['message']}. Reponses: {data.answers}. Resolution: {data.resolution}."))
    except:
        ai_analysis = "Analyse non disponible."
    result = {k: v for k, v in call_log.items() if k != '_id'}
    result["ai_analysis"] = ai_analysis
    return result


@router.get("/teleassistance/calls")
async def get_teleassistance_calls(user=Depends(get_current_user)):
    return await db.teleassistance_calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.get("/teleassistance/subscribers")
async def get_all_subscribers():
    bens = await db.users.find({"role": "beneficiary"}, {"_id": 0, "password_hash": 0}).to_list(500)
    for b in bens:
        latest = await db.device_readings.find_one({"user_id": b['id'], "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
        ac = await db.alerts.count_documents({"beneficiary_id": b['id'], "status": "active"})
        sub = await db.subscriptions.find_one({"beneficiary_id": b['id'], "status": "active"}, {"_id": 0})
        b['latest_vitals'] = latest['data'] if latest else None
        b['active_alerts'] = ac
        b['subscription_type'] = sub.get('subscription_type', 'none') if sub else 'none'
        b['has_subscription'] = sub is not None
    return bens


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


# ==================== ELEVENLABS AUDIO ENDPOINT ====================
@router.get("/elevenlabs/audio/{message_key}")
async def get_elevenlabs_audio(message_key: str):
    """Serve pre-generated ElevenLabs audio for Twilio to play"""
    from starlette.responses import Response
    text = MESSAGES.get(message_key, '')
    if not text:
        raise HTTPException(status_code=404, detail="Message not found")
    # Check cache in DB
    cached = await db.audio_cache.find_one({"key": message_key}, {"_id": 0})
    if cached and cached.get('audio_b64'):
        import base64
        audio = base64.b64decode(cached['audio_b64'])
        return Response(content=audio, media_type="audio/mpeg")
    # Generate and cache
    audio_b64 = generate_speech_base64(text)
    if audio_b64:
        await db.audio_cache.update_one(
            {"key": message_key},
            {"$set": {"key": message_key, "audio_b64": audio_b64, "text": text}},
            upsert=True
        )
        import base64
        return Response(content=base64.b64decode(audio_b64), media_type="audio/mpeg")
    raise HTTPException(status_code=500, detail="Audio generation failed")


# ==================== TWILIO REAL CALLS WITH ELEVENLABS ====================
@router.post("/twilio/call/beneficiary")
async def twilio_call_beneficiary(data: TriggerCallRequest, user=Depends(get_current_user)):
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio non configure")
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    phone = data.phone_number or ben.get('phone', '')
    if not phone:
        raise HTTPException(status_code=400, detail="Pas de numero de telephone")

    alert_type = alert.get('alert_type', 'sos')
    message_key = 'sos_manual'
    if alert_type == 'fall' or 'chute' in alert.get('message', '').lower():
        message_key = 'fall_detected'
    elif alert_type == 'heart_rate' or 'cardiaque' in alert.get('message', '').lower():
        message_key = 'heart_anomaly'
    elif alert_type == 'spo2':
        message_key = 'spo2_low'
    elif 'inactiv' in alert.get('message', '').lower():
        message_key = 'inactivity_alert'

    try:
        base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")
        twiml = VoiceResponse()
        twiml.play(f"{base_url}/api/elevenlabs/audio/{message_key}")
        gather = Gather(input='speech', language='fr-FR', timeout=10, speech_timeout=5,
                        action=f"{base_url}/api/twilio/speech-response")
        twiml.append(gather)
        twiml.play(f"{base_url}/api/elevenlabs/audio/no_response")

        call = twilio_client.calls.create(twiml=str(twiml), to=phone, from_=TWILIO_NUMBER,
                                           status_callback=f"{base_url}/api/twilio/status",
                                           status_callback_event=['completed', 'busy', 'no-answer', 'failed'])
        now = datetime.now(timezone.utc).isoformat()
        call_record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": data.alert_id,
            "target_type": "beneficiary", "target_id": ben['id'], "target_name": ben['name'],
            "target_phone": phone, "status": "initiated", "operator_id": user['id'],
            "created_at": now, "answered": False, "response": None,
            "voice_engine": "elevenlabs", "input_mode": "speech", "message_key": message_key,
        }
        await db.twilio_calls.insert_one(call_record)
        return {"call_sid": call.sid, "call_id": call_record['id'], "status": "initiated", "phone": phone, "message_key": message_key}
    except Exception as e:
        logger.error(f"Twilio call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/twilio/call/guardian")
async def twilio_call_guardian(request: Request, user=Depends(get_current_user)):
    """Appel vocal IA au gardien - reconnaissance vocale, pas de touches"""
    body = await request.json()
    alert_id = body.get('alert_id', '')
    guardian_id = body.get('guardian_id', '')
    phone_number = body.get('phone_number', '')

    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio non configure")
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    guardian = await db.users.find_one({"id": guardian_id}, {"_id": 0})
    phone = phone_number or (guardian.get('phone', '') if guardian else '')
    if not phone:
        raise HTTPException(status_code=400, detail="Pas de numero de telephone")
    ben_name = alert.get('beneficiary_name', 'votre proche') if alert else 'votre proche'
    alert_msg = alert.get('message', 'une alerte') if alert else 'une alerte'

    try:
        base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")
        # Generate dynamic guardian message with ElevenLabs
        guardian_audio_key = f"guardian_call_{alert_id}_{guardian_id}"
        guardian_text = (
            f"Bonjour, ici le plateau d'ecoute Chutex. "
            f"Une alerte a ete declenchee pour {ben_name}. {alert_msg}. "
            f"Nous n'avons pas pu confirmer que tout va bien. "
            f"Pouvez-vous intervenir ? Dites oui si vous pouvez vous rendre sur place, "
            f"ou non si vous ne pouvez pas."
        )
        audio = generate_speech(guardian_text)
        if audio:
            import base64
            await db.audio_cache.update_one(
                {"key": guardian_audio_key},
                {"$set": {"key": guardian_audio_key, "audio_b64": base64.b64encode(audio).decode(), "text": guardian_text}},
                upsert=True
            )

        twiml = VoiceResponse()
        if audio:
            twiml.play(f"{base_url}/api/elevenlabs/audio/{guardian_audio_key}")
        else:
            twiml.say(guardian_text, voice='Polly.Lea', language='fr-FR')

        # Listen for guardian's vocal response
        gather = Gather(input='speech', language='fr-FR', timeout=10, speech_timeout=5,
                        action=f"{base_url}/api/twilio/guardian-speech-response?alert_id={alert_id}&guardian_id={guardian_id}")
        twiml.append(gather)
        # No response
        twiml.say("Nous n'avons pas recu de reponse. Nous contactons un autre gardien. Merci.", voice='Polly.Lea', language='fr-FR')

        call = twilio_client.calls.create(twiml=str(twiml), to=phone, from_=TWILIO_NUMBER,
                                           status_callback=f"{base_url}/api/twilio/status",
                                           status_callback_event=['completed', 'busy', 'no-answer', 'failed'])
        now = datetime.now(timezone.utc).isoformat()
        call_record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": alert_id,
            "target_type": "guardian", "target_id": guardian_id,
            "target_name": guardian['name'] if guardian else 'Gardien',
            "target_phone": phone, "status": "initiated", "operator_id": user['id'],
            "created_at": now, "answered": False, "response": None,
            "voice_engine": "elevenlabs", "input_mode": "speech",
        }
        await db.twilio_calls.insert_one(call_record)
        return {"call_sid": call.sid, "call_id": call_record['id'], "status": "initiated", "phone": phone}
    except Exception as e:
        logger.error(f"Twilio guardian call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/twilio/twiml/beneficiary")
async def twiml_beneficiary(request: Request):
    """TwiML for beneficiary call - speech recognition, no DTMF"""
    base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")
    resp = VoiceResponse()
    resp.play(f"{base_url}/api/elevenlabs/audio/fall_detected")
    gather = Gather(input='speech', language='fr-FR', timeout=10, speech_timeout=5,
                    action=f"{base_url}/api/twilio/speech-response")
    resp.append(gather)
    resp.play(f"{base_url}/api/elevenlabs/audio/no_response")
    from starlette.responses import Response
    return Response(content=str(resp), media_type="application/xml")


@router.post("/twilio/status")
async def twilio_status(request: Request):
    form = await request.form()
    call_sid = form.get('CallSid', '')
    status = form.get('CallStatus', '')
    duration = form.get('CallDuration', '0')
    if call_sid:
        answered = status == 'completed' and int(str(duration)) > 10
        await db.twilio_calls.update_one({"call_sid": call_sid}, {"$set": {"status": status, "duration": duration, "answered": answered}})
    return {"status": "ok"}


@router.post("/twilio/speech-response")
async def twilio_speech_response(request: Request):
    """Handle Twilio speech recognition - analyze with GPT-5.2 for intent"""
    form = await request.form()
    call_sid = form.get('CallSid', '')
    speech_result = form.get('SpeechResult', '')
    confidence = form.get('Confidence', '0')

    logger.info(f"Speech response from {call_sid}: '{speech_result}' (confidence: {confidence})")

    # Use GPT-5.2 to analyze the speech for intent, sentiment, and urgency
    ai_analysis = {"confirmed_ok": False, "needs_help": False, "urgency": "unknown", "sentiment": "neutral", "summary": ""}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"speech-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Tu es un assistant medical IA pour le service de teleassistance Chutex. "
                "Analyse la reponse vocale d'un beneficiaire apres une alerte. "
                "Reponds UNIQUEMENT en JSON avec ces champs: "
                '{"confirmed_ok": bool, "needs_help": bool, "urgency": "none|low|medium|high|critical", '
                '"sentiment": "calm|worried|distressed|confused|pain", "summary": "resume en 1 phrase"}'
            )
        ).with_model("openai", "gpt-5.2")

        # Get alert context
        call_record = await db.twilio_calls.find_one({"call_sid": call_sid}, {"_id": 0})
        alert_context = ""
        if call_record:
            alert = await db.alerts.find_one({"id": call_record.get('alert_id', '')}, {"_id": 0})
            if alert:
                alert_context = f" L'alerte etait: {alert.get('message', '')} (type: {alert.get('alert_type', '')})."

        prompt = f"Le beneficiaire a dit: \"{speech_result}\".{alert_context} Confiance reconnaissance: {confidence}. Analyse cette reponse."
        resp = await chat.send_message(UserMessage(text=prompt))

        # Parse JSON response
        import json
        try:
            resp_clean = resp.strip()
            if resp_clean.startswith("```"):
                resp_clean = resp_clean.split("```")[1].strip()
                if resp_clean.startswith("json"):
                    resp_clean = resp_clean[4:].strip()
            ai_analysis = json.loads(resp_clean)
        except:
            # Fallback to keyword analysis
            speech_lower = (speech_result or '').lower()
            ai_analysis["confirmed_ok"] = any(w in speech_lower for w in ['bien', 'va bien', 'oui', 'ok', 'ca va', 'rien'])
            ai_analysis["needs_help"] = any(w in speech_lower for w in ['aide', 'mal', 'secours', 'tombe', 'urgence', 'non'])
            ai_analysis["summary"] = f"Analyse par mots-cles: {speech_result[:100]}"
    except Exception as e:
        logger.error(f"AI speech analysis error: {e}")
        speech_lower = (speech_result or '').lower()
        ai_analysis["confirmed_ok"] = any(w in speech_lower for w in ['bien', 'va bien', 'oui', 'ok'])
        ai_analysis["needs_help"] = any(w in speech_lower for w in ['aide', 'mal', 'secours', 'tombe'])

    confirmed_ok = ai_analysis.get("confirmed_ok", False) and not ai_analysis.get("needs_help", False)
    needs_help = ai_analysis.get("needs_help", False)

    # Store speech response with AI analysis
    await db.speech_responses.insert_one({
        "call_sid": call_sid,
        "text": speech_result,
        "confidence": float(confidence) if confidence else 0,
        "confirmed_ok": confirmed_ok,
        "needs_help": needs_help,
        "ai_analysis": ai_analysis,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    await db.twilio_calls.update_one(
        {"call_sid": call_sid},
        {"$set": {
            "response": speech_result, "answered": True,
            "speech_confirmed_ok": confirmed_ok,
            "ai_analysis": ai_analysis,
        }}
    )

    base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")
    resp_twiml = VoiceResponse()
    if confirmed_ok:
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/confirmed_ok")
    elif needs_help:
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/help_requested")
    else:
        # Unclear response - ask again with clearer instructions
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/unclear_response")
        gather = Gather(input='speech', language='fr-FR', timeout=8, speech_timeout=5, action=f"{base_url}/api/twilio/speech-response")
        resp_twiml.append(gather)
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/no_response")

    from starlette.responses import Response as StarletteResponse
    return StarletteResponse(content=str(resp_twiml), media_type="application/xml")


@router.post("/twilio/guardian-speech-response")
async def twilio_guardian_speech_response(request: Request):
    """Handle guardian's vocal response - analyze with GPT-5.2 to determine if they'll intervene"""
    form = await request.form()
    call_sid = form.get('CallSid', '')
    speech_result = form.get('SpeechResult', '')
    confidence = form.get('Confidence', '0')
    alert_id = request.query_params.get('alert_id', '')
    guardian_id = request.query_params.get('guardian_id', '')

    logger.info(f"Guardian speech from {call_sid}: '{speech_result}' (confidence: {confidence})")

    # Analyze guardian response with GPT-5.2
    will_intervene = False
    cannot_intervene = False
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"guardian-speech-{uuid.uuid4().hex[:8]}",
            system_message=(
                "Tu analyses la reponse vocale d'un gardien apres une alerte pour un proche. "
                "Reponds UNIQUEMENT en JSON: "
                '{"will_intervene": bool, "cannot_intervene": bool, "summary": "resume en 1 phrase"}'
            )
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=f'Le gardien a dit: "{speech_result}". Va-t-il intervenir ?'))
        import json
        try:
            resp_clean = resp.strip()
            if resp_clean.startswith("```"):
                resp_clean = resp_clean.split("```")[1].strip()
                if resp_clean.startswith("json"):
                    resp_clean = resp_clean[4:].strip()
            analysis = json.loads(resp_clean)
            will_intervene = analysis.get("will_intervene", False)
            cannot_intervene = analysis.get("cannot_intervene", False)
        except:
            speech_lower = (speech_result or '').lower()
            will_intervene = any(w in speech_lower for w in ['oui', "j'y vais", 'interviens', 'arrive', "j'arrive", 'ok', "d'accord"])
            cannot_intervene = any(w in speech_lower for w in ['non', 'pas possible', 'peux pas', 'ne peux pas', 'indisponible'])
    except Exception as e:
        logger.error(f"Guardian speech analysis error: {e}")
        speech_lower = (speech_result or '').lower()
        will_intervene = any(w in speech_lower for w in ['oui', "j'y vais", 'interviens', 'arrive'])
        cannot_intervene = any(w in speech_lower for w in ['non', 'pas possible', 'peux pas'])

    # Store response
    await db.speech_responses.insert_one({
        "call_sid": call_sid, "text": speech_result,
        "confidence": float(confidence) if confidence else 0,
        "target_type": "guardian", "guardian_id": guardian_id, "alert_id": alert_id,
        "will_intervene": will_intervene, "cannot_intervene": cannot_intervene,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await db.twilio_calls.update_one(
        {"call_sid": call_sid},
        {"$set": {"response": speech_result, "answered": True, "guardian_will_intervene": will_intervene}}
    )

    base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")
    resp_twiml = VoiceResponse()
    if will_intervene:
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/guardian_followup")
    elif cannot_intervene:
        resp_twiml.say("Merci de votre reponse. Nous contactons un autre gardien. Au revoir.", voice='Polly.Lea', language='fr-FR')
    else:
        resp_twiml.say("Merci. Nous notons votre reponse. Ouvrez l'application Chutex si necessaire. Au revoir.", voice='Polly.Lea', language='fr-FR')

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
        base_url = os.environ.get("APP_URL", "https://permission-mgmt-ui.preview.emergentagent.com")

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


# ==================== INTERVENTION CARE ENDPOINTS ====================

INTERVENTION_CLOSE_QCM = [
    {"id": "q1", "question": "Etat du beneficiaire a votre arrivee ?", "options": ["Conscient et lucide", "Conscient mais confus", "Inconscient", "Blesse legerement", "Blesse gravement"]},
    {"id": "q2", "question": "Le beneficiaire pouvait-il se deplacer ?", "options": ["Oui, sans aide", "Oui, avec aide", "Non, immobilise"]},
    {"id": "q3", "question": "Quelle etait la cause de l'alerte ?", "options": ["Chute confirmee", "Malaise", "Fausse alerte", "Probleme technique", "Autre"]},
    {"id": "q4", "question": "Actions effectuees sur place ?", "options": ["Rassure et accompagne", "Premiers soins administres", "Appel SAMU/pompiers", "Mise en securite", "Aucune action necessaire"]},
    {"id": "q5", "question": "Un suivi medical est-il necessaire ?", "options": ["Non, tout va bien", "Consultation medecin recommandee", "Oui, urgence medicale", "Deja pris en charge par les secours"]},
    {"id": "q6", "question": "Recommandations pour la suite ?", "options": ["Aucune, situation normale", "Surveillance renforcee les prochaines heures", "Visite medicale sous 24h", "Hospitalisation recommandee", "Adaptation du domicile necessaire"]},
]


@router.get("/intervention/close-qcm")
async def get_intervention_close_qcm():
    """Get the QCM questions for closing an intervention"""
    return INTERVENTION_CLOSE_QCM


@router.get("/interventions/pending")
async def get_pending_interventions(user=Depends(get_current_user)):
    """Get all pending interventions for the current intervention provider or SAAD guardian"""
    pending = await db.interventions.find(
        {"status": {"$in": ["pending_acceptance", "in_progress"]},
         "recipients.id": user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    # Also get interventions assigned directly to the user
    assigned = await db.interventions.find(
        {"status": {"$in": ["pending_acceptance", "in_progress"]},
         "assigned_to": user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)

    # SAAD-dispatched interventions: match by company_id or agency_id
    saad_company_id = user.get('saad_company_id') or user.get('prescriber_company_id')
    agency_id = user.get('agency_id')
    saad_ivs = []
    if saad_company_id or agency_id:
        # Check intervenant space is not deactivated
        link = await db.saad_guardian_links.find_one(
            {"guardian_id": user['id'], "status": "accepted"}, {"_id": 0}
        )
        intervenant_active = not (link or {}).get('intervenant_deactivated', False)
        if intervenant_active:
            saad_query = {"status": {"$in": ["pending_acceptance"]}, "intervener_type": "saad"}
            or_clauses = []
            if saad_company_id:
                or_clauses.append({"company_id": saad_company_id})
            if agency_id:
                or_clauses.append({"agency_id": agency_id})
            if or_clauses:
                saad_query["$or"] = or_clauses
                saad_ivs = await db.interventions.find(saad_query, {"_id": 0}).sort("created_at", -1).to_list(20)

    # Merge without duplicates
    seen = set()
    result = []
    for iv in pending + assigned + saad_ivs:
        if iv['id'] not in seen:
            seen.add(iv['id'])
            result.append(iv)
    return result


@router.post("/intervention/accept")
async def accept_intervention(data: InterventionAcceptRequest, user=Depends(get_current_user)):
    """Intervenant clicks 'J'INTERVIENS' to accept the intervention"""
    iv = await db.interventions.find_one({"id": data.intervention_id}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    if iv['status'] not in ['pending_acceptance', 'dispatched']:
        raise HTTPException(status_code=400, detail="Intervention deja prise en charge")
    now = datetime.now(timezone.utc).isoformat()
    await db.interventions.update_one({"id": data.intervention_id}, {"$set": {
        "status": "in_progress",
        "assigned_to": user['id'],
        "assigned_name": user['name'],
        "accepted_at": now,
        "intervener_location": {
            "latitude": user.get('latitude', 0),
            "longitude": user.get('longitude', 0),
            "address": user.get('address', ''),
        },
    }, "$push": {"timeline": {"status": "accepted", "time": now, "note": f"{user['name']} a accepte l'intervention"}}})
    # Update alert
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {"teleassistance_status": "intervenant_en_route"}})
    return {"status": "in_progress", "accepted_by": user['name'], "intervention_id": data.intervention_id}


@router.post("/intervention/location")
async def update_intervener_location(data: InterventionLocationUpdate, user=Depends(get_current_user)):
    """Update the intervener's live location during intervention"""
    now = datetime.now(timezone.utc).isoformat()
    await db.interventions.update_one(
        {"id": data.intervention_id, "assigned_to": user['id']},
        {"$set": {"intervener_location.latitude": data.latitude, "intervener_location.longitude": data.longitude, "last_location_update": now}}
    )
    return {"status": "ok"}


@router.get("/intervention/{iid}")
async def get_intervention_detail(iid: str, user=Depends(get_current_user)):
    """Get full intervention detail with beneficiary info"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    return iv


@router.post("/intervention/close")
async def close_intervention(data: InterventionCloseRequest, user=Depends(get_current_user)):
    """Close an intervention with mandatory QCM report"""
    iv = await db.interventions.find_one({"id": data.intervention_id}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    if not data.answers or len(data.answers) < len(INTERVENTION_CLOSE_QCM):
        raise HTTPException(status_code=400, detail=f"Veuillez repondre aux {len(INTERVENTION_CLOSE_QCM)} questions du compte-rendu")
    now = datetime.now(timezone.utc).isoformat()
    report = {
        "closed_by": user['id'],
        "closed_by_name": user['name'],
        "answers": data.answers,
        "notes": data.notes,
        "closed_at": now,
    }
    await db.interventions.update_one({"id": data.intervention_id}, {"$set": {
        "status": "completed",
        "completed_at": now,
        "report": report,
        "report_answers": data.answers,
    }, "$push": {"timeline": {"status": "completed", "time": now, "note": f"Intervention cloturee par {user['name']} - Compte-rendu soumis"}}})
    # Resolve the associated alert
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "teleassistance_status": "resolved"}})
    # Resolve the escalation
    if iv.get('escalation_id'):
        await db.escalations.update_one({"id": iv['escalation_id']}, {"$set": {"status": "resolved"}, "$push": {"timeline": {"step": "intervention_completed", "time": now, "note": f"Intervention cloturee par {user['name']}"}}})
    return {"status": "completed", "report": report}

