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
        base_url = os.environ.get("APP_URL", "https://lefu-metrics.preview.emergentagent.com")
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
        base_url = os.environ.get("APP_URL", "https://lefu-metrics.preview.emergentagent.com")
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
    base_url = os.environ.get("APP_URL", "https://lefu-metrics.preview.emergentagent.com")
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

    base_url = os.environ.get("APP_URL", "https://lefu-metrics.preview.emergentagent.com")
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

    base_url = os.environ.get("APP_URL", "https://lefu-metrics.preview.emergentagent.com")
    resp_twiml = VoiceResponse()
    if will_intervene:
        resp_twiml.play(f"{base_url}/api/elevenlabs/audio/guardian_followup")
    elif cannot_intervene:
        resp_twiml.say("Merci de votre reponse. Nous contactons un autre gardien. Au revoir.", voice='Polly.Lea', language='fr-FR')
    else:
        resp_twiml.say("Merci. Nous notons votre reponse. Ouvrez l'application Chutex si necessaire. Au revoir.", voice='Polly.Lea', language='fr-FR')

    from starlette.responses import Response as StarletteResponse

