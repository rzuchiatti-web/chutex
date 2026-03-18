"""
CARE WATCH - API Routes
Webhooks Twilio, endpoints incidents, reporting
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid, logging

from database import db, EMERGENT_LLM_KEY
from auth import get_current_user, get_effective_role
from emergentintegrations.llm.chat import LlmChat, UserMessage
from services.carewatch_config import CARE_WATCH_CONFIG, VOICE_SCRIPTS
from services.carewatch_engine import _classify_speech, _classify_guardian_response, _log_event, _pick_script, _generate_and_cache_audio
from twilio.twiml.voice_response import VoiceResponse, Gather
from services.elevenlabs_service import generate_speech_base64

logger = logging.getLogger(__name__)
router = APIRouter()
BASE_URL = "https://alert-live-activity.preview.emergentagent.com"


# ─── TWILIO WEBHOOKS ───

@router.post("/carewatch/patient-response")
async def carewatch_patient_response(request: Request):
    """Twilio webhook: patient's vocal response during CARE WATCH protocol"""
    form = await request.form()
    call_sid = form.get('CallSid', '')
    speech_text = form.get('SpeechResult', '')
    confidence = form.get('Confidence', '0')
    incident_id = request.query_params.get('incident_id', '')

    logger.info(f"[CARE WATCH] Patient response: '{speech_text}' (conf: {confidence})")

    classification = await _classify_speech(speech_text, "Reponse du patient a une alerte")

    # Store speech response
    await db.speech_responses.insert_one({
        "call_sid": call_sid, "text": speech_text,
        "confidence": float(confidence) if confidence else 0,
        "incident_id": incident_id, "target_type": "patient",
        "classification": classification,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await db.twilio_calls.update_one(
        {"call_sid": call_sid},
        {"$set": {"response": speech_text, "answered": True, "classification": classification}}
    )

    intent = classification.get("intent", "intent_uncertain")
    resp = VoiceResponse()

    if intent == "intent_ok":
        # Patient OK - play confirmation
        ok_key = f"carewatch_ok_{call_sid[:8]}"
        ok_text = _pick_script("patient_ok_response", prenom="")
        await _generate_and_cache_audio(ok_key, ok_text)
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{ok_key}")

    elif intent == "intent_help":
        # Patient needs help
        help_key = f"carewatch_help_{call_sid[:8]}"
        help_text = _pick_script("patient_help_response", prenom="")
        await _generate_and_cache_audio(help_key, help_text)
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{help_key}")

    else:
        # Ambiguous - reformulate once
        reform_key = f"carewatch_reform_{call_sid[:8]}"
        reform_text = _pick_script("patient_unclear_first", prenom="")
        await _generate_and_cache_audio(reform_key, reform_text)
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{reform_key}")
        gather = Gather(
            input='speech', language='fr-FR', timeout=8, speech_timeout=5,
            action=f"{BASE_URL}/api/carewatch/patient-reformulation?incident_id={incident_id}"
        )
        resp.append(gather)
        # If still no response after reformulation
        esc_key = f"carewatch_esc_{call_sid[:8]}"
        esc_text = _pick_script("patient_unclear_escalate", prenom="")
        await _generate_and_cache_audio(esc_key, esc_text)
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{esc_key}")

    from starlette.responses import Response
    return Response(content=str(resp), media_type="application/xml")


@router.post("/carewatch/patient-reformulation")
async def carewatch_patient_reformulation(request: Request):
    """Twilio webhook: patient's 2nd response after reformulation"""
    form = await request.form()
    call_sid = form.get('CallSid', '')
    speech_text = form.get('SpeechResult', '')
    confidence = form.get('Confidence', '0')
    incident_id = request.query_params.get('incident_id', '')

    classification = await _classify_speech(speech_text)

    await db.speech_responses.insert_one({
        "call_sid": call_sid, "text": speech_text,
        "confidence": float(confidence) if confidence else 0,
        "incident_id": incident_id, "target_type": "patient",
        "classification": classification, "is_reformulation": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    intent = classification.get("intent", "intent_uncertain")
    resp = VoiceResponse()

    if intent == "intent_ok":
        ok_key = f"carewatch_ok2_{call_sid[:8]}"
        await _generate_and_cache_audio(ok_key, _pick_script("patient_ok_response", prenom=""))
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{ok_key}")
    else:
        # Still unclear → escalate by precaution
        esc_key = f"carewatch_esc2_{call_sid[:8]}"
        await _generate_and_cache_audio(esc_key, _pick_script("patient_unclear_escalate", prenom=""))
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{esc_key}")

    from starlette.responses import Response
    return Response(content=str(resp), media_type="application/xml")


@router.post("/carewatch/guardian-response")
async def carewatch_guardian_response(request: Request):
    """Twilio webhook: guardian's vocal response during CARE WATCH protocol"""
    form = await request.form()
    call_sid = form.get('CallSid', '')
    speech_text = form.get('SpeechResult', '')
    confidence = form.get('Confidence', '0')
    incident_id = request.query_params.get('incident_id', '')
    guardian_id = request.query_params.get('guardian_id', '')

    classification = await _classify_guardian_response(speech_text)

    await db.speech_responses.insert_one({
        "call_sid": call_sid, "text": speech_text,
        "confidence": float(confidence) if confidence else 0,
        "incident_id": incident_id, "guardian_id": guardian_id,
        "target_type": "guardian", "classification": classification,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await db.twilio_calls.update_one(
        {"call_sid": call_sid},
        {"$set": {"response": speech_text, "answered": True, "guardian_will_intervene": classification.get("will_intervene", False)}}
    )

    resp = VoiceResponse()
    if classification.get("will_intervene"):
        acc_key = f"carewatch_gacc_{call_sid[:8]}"
        await _generate_and_cache_audio(acc_key, _pick_script("guardian_accepted", prenom_gardien=""))
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{acc_key}")
    elif classification.get("cannot_intervene"):
        dec_key = f"carewatch_gdec_{call_sid[:8]}"
        await _generate_and_cache_audio(dec_key, _pick_script("guardian_declined", prenom_gardien=""))
        resp.play(f"{BASE_URL}/api/elevenlabs/audio/{dec_key}")
    else:
        resp.say("Merci. Nous notons votre reponse. Au revoir.", voice='Polly.Lea', language='fr-FR')

    from starlette.responses import Response as R
    return R(content=str(resp), media_type="application/xml")


# ─── INCIDENT ENDPOINTS ───

@router.get("/carewatch/incidents")
async def get_incidents(user=Depends(get_current_user)):
    """Get all incidents for the plateau d'ecoute"""
    incidents = await db.incidents.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return incidents


@router.get("/carewatch/incidents/active")
async def get_active_incidents(user=Depends(get_current_user)):
    """Get active (non-resolved) incidents"""
    active = await db.incidents.find(
        {"state": {"$nin": ["RESOLVED", "FAILED"]}}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return active


@router.get("/carewatch/incident/{iid}")
async def get_incident_detail(iid: str, user=Depends(get_current_user)):
    """Get full incident detail"""
    incident = await db.incidents.find_one({"id": iid}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve")
    # Enrich with calls
    calls = await db.twilio_calls.find({"incident_id": iid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    incident["calls_detail"] = calls
    return incident


@router.post("/carewatch/incident/{iid}/note")
async def add_incident_note(iid: str, data: dict, user=Depends(get_current_user)):
    """Operator adds a note to an incident"""
    note = {
        "text": data.get("note", ""),
        "operator_id": user['id'],
        "operator_name": user.get('name', ''),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.incidents.update_one({"id": iid}, {"$push": {"operator_notes": note}})
    await _log_event(iid, "OPERATOR_NOTE", f"Note de {user.get('name', '')}: {data.get('note', '')[:100]}")
    return {"status": "ok"}


@router.post("/carewatch/incident/{iid}/takeover")
async def takeover_incident(iid: str, user=Depends(get_current_user)):
    """Operator takes manual control of an incident"""
    await _log_event(iid, "MANUAL_CONTROL", f"Reprise en main par {user.get('name', '')}")
    return {"status": "manual_control"}


@router.post("/carewatch/incident/{iid}/resolve")
async def resolve_incident(iid: str, data: dict, user=Depends(get_current_user)):
    """Operator resolves an incident"""
    incident = await db.incidents.find_one({"id": iid}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident non trouve")
    now = datetime.now(timezone.utc).isoformat()
    resolution = data.get("resolution", "RESOLVED")
    motif = data.get("motif", "Cloture operateur")
    await db.incidents.update_one({"id": iid}, {"$set": {
        "state": "RESOLVED", "resolution": resolution, "resolved_at": now, "updated_at": now,
    }, "$push": {"timeline": {"timestamp": now, "state": "RESOLVED", "detail": f"Cloture par {user.get('name', '')}: {motif}"}}})
    if incident.get("alert_id"):
        await db.alerts.update_one({"id": incident['alert_id']}, {"$set": {
            "status": "resolved", "teleassistance_status": "RESOLVED",
            "resolved_at": now, "resolved_by": user['id'],
        }})
    return {"status": "resolved"}


@router.post("/carewatch/incident/{iid}/recall")
async def recall_incident(iid: str, data: dict, user=Depends(get_current_user)):
    """Operator re-triggers a call for an incident"""
    target = data.get("target", "patient")
    await _log_event(iid, "MANUAL_RECALL", f"Relance appel {target} par {user.get('name', '')}")
    return {"status": "recall_initiated", "target": target}


# ─── REPORTING ───

@router.get("/carewatch/stats")
async def get_carewatch_stats(user=Depends(get_current_user)):
    """Dashboard statistics for Care Watch"""
    total = await db.incidents.count_documents({})
    active = await db.incidents.count_documents({"state": {"$nin": ["RESOLVED", "FAILED"]}})
    resolved = await db.incidents.count_documents({"state": "RESOLVED"})
    dispatched = await db.incidents.count_documents({"state": "CARE_DISPATCHED"})

    # Response rates
    patient_responded = await db.incidents.count_documents({"state": {"$in": ["PATIENT_CONFIRMED_OK", "PATIENT_NEEDS_HELP"]}})
    patient_no_response = await db.incidents.count_documents({"state": "PATIENT_NO_RESPONSE"})
    guardian_accepted = await db.incidents.count_documents({"state": "GUARDIAN_INTERVENTION_ACCEPTED"})

    # Calculate rates
    total_patient_calls = patient_responded + patient_no_response
    patient_response_rate = (patient_responded / total_patient_calls * 100) if total_patient_calls > 0 else 0

    return {
        "total_incidents": total,
        "active_incidents": active,
        "resolved_incidents": resolved,
        "care_dispatched": dispatched,
        "patient_response_rate": round(patient_response_rate, 1),
        "guardian_acceptance_count": guardian_accepted,
        "incidents_today": await db.incidents.count_documents({
            "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()}
        }),
    }


@router.get("/carewatch/config")
async def get_carewatch_config(user=Depends(get_current_user)):
    """Get current CARE WATCH configuration"""
    return CARE_WATCH_CONFIG


@router.put("/carewatch/config")
async def update_carewatch_config(data: dict, user=Depends(get_current_user)):
    """Update CARE WATCH configuration"""
    for key in data:
        if key in CARE_WATCH_CONFIG:
            CARE_WATCH_CONFIG[key] = data[key]
    return CARE_WATCH_CONFIG
