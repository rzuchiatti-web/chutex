from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid, random, asyncio, logging, os, math

from database import db, twilio_client, TWILIO_NUMBER, EMERGENT_LLM_KEY
from auth import get_current_user
from models import TeleassistanceCallUpdate, EscalationStart, EscalationStepRequest, TriggerCallRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage
from twilio.twiml.voice_response import VoiceResponse, Gather

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
        b['latest_vitals'] = latest['data'] if latest else None
        b['active_alerts'] = ac
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
        loc = await db.locations.find_one({"user_id": esc['beneficiary_id']}, {"_id": 0})
        iv_id = str(uuid.uuid4())
        iv = {
            "id": iv_id, "alert_id": esc['alert_id'], "escalation_id": esc['id'],
            "beneficiary_id": esc['beneficiary_id'], "beneficiary_name": esc['beneficiary_name'],
            "assigned_to": user['id'], "assigned_name": "Structure partenaire",
            "status": "dispatched",
            "notes": f"Auto-dispatch: {alert['message'] if alert else 'Alerte'}",
            "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566, "longitude": loc['longitude'] if loc else 2.3522},
            "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
            "created_at": now, "completed_at": None, "report": None,
            "timeline": [{"status": "dispatched", "time": now, "note": "Intervention auto-dispatchee via teleassistance"}],
        }
        await db.interventions.insert_one(iv)
        esc['intervention_id'] = iv_id
        esc['status'] = "dispatched"
        esc['current_step'] = "dispatched"
        esc['timeline'].append({"step": "dispatched", "time": now, "note": f"Intervention #{iv_id[:8]} creee"})
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


# ==================== TWILIO REAL CALLS ====================
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
    try:
        twiml = VoiceResponse()
        twiml.say("Bonjour, ici Chutex, service de teleassistance.", voice='Polly.Lea', language='fr-FR')
        twiml.pause(length=1)
        g = Gather(num_digits=1, timeout=10)
        g.say("Une alerte a ete declenchee. Appuyez sur 1 si tout va bien. Appuyez sur 2 pour de l'aide.", voice='Polly.Lea', language='fr-FR')
        twiml.append(g)
        call = twilio_client.calls.create(twiml=str(twiml), to=phone, from_=TWILIO_NUMBER)
        now = datetime.now(timezone.utc).isoformat()
        call_record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": data.alert_id,
            "target_type": "beneficiary", "target_id": ben['id'], "target_name": ben['name'],
            "target_phone": phone, "status": "initiated", "operator_id": user['id'],
            "created_at": now, "answered": False, "response": None,
        }
        await db.twilio_calls.insert_one(call_record)
        return {"call_sid": call.sid, "call_id": call_record['id'], "status": "initiated", "phone": phone}
    except Exception as e:
        logger.error(f"Twilio call error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/twilio/twiml/beneficiary")
async def twiml_beneficiary(request: Request):
    alert_id = request.query_params.get('alert_id', '')
    resp = VoiceResponse()
    resp.say("Bonjour, ici Chutex, service de teleassistance intelligente.", voice='Polly.Lea', language='fr-FR')
    resp.pause(length=1)
    g = Gather(num_digits=1, timeout=10)
    g.say("Une alerte a ete declenchee. Appuyez sur 1 si tout va bien. Appuyez sur 2 pour de l'aide.", voice='Polly.Lea', language='fr-FR')
    resp.append(g)
    resp.say("Nous n'avons pas recu de reponse. Nous contactons vos gardiens.", voice='Polly.Lea', language='fr-FR')
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


# ==================== AUTO ESCALATION ====================
async def auto_escalation_protocol(alert: dict):
    """Fully automatic escalation: call beneficiary -> guardians -> dispatch"""
    try:
        await asyncio.sleep(2)
        now = datetime.now(timezone.utc).isoformat()
        ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
        if not ben:
            return
        guardians = []
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', '')})
        esc = {
            "id": str(uuid.uuid4()), "alert_id": alert['id'],
            "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
            "operator_id": "ai_auto", "operator_name": "IA Teleassistance",
            "status": "in_progress", "current_step": "calling_beneficiary",
            "current_target": {"id": alert['beneficiary_id'], "name": alert['beneficiary_name'], "type": "beneficiary"},
            "guardians_called": [], "guardians_remaining": guardians,
            "protocol_answers": [],
            "timeline": [{"step": "auto_started", "time": now, "note": "Protocole IA automatique declenche"}],
            "intervention_id": None, "created_at": now,
        }
        await db.escalations.insert_one(esc)
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "ai_calling", "escalation_id": esc['id']}})

        ben_phone = ben.get('phone', '')
        if ben_phone and twilio_client:
            twiml = VoiceResponse()
            twiml.say("Bonjour, ici Chutex, service de teleassistance intelligente.", voice='Polly.Lea', language='fr-FR')
            g = Gather(num_digits=1, timeout=8)
            g.say("Une alerte a ete declenchee. Appuyez sur 1 si tout va bien. Appuyez sur 2 pour de l'aide.", voice='Polly.Lea', language='fr-FR')
            twiml.append(g)
            try:
                call = twilio_client.calls.create(twiml=str(twiml), to=ben_phone, from_=TWILIO_NUMBER)
                await db.twilio_calls.insert_one({
                    "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "beneficiary", "target_id": ben['id'],
                    "target_name": ben['name'], "target_phone": ben_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": now, "answered": False, "response": None,
                })
                esc['timeline'].append({"step": "calling_beneficiary", "time": datetime.now(timezone.utc).isoformat(), "note": f"Appel IA -> {ben['name']}"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
                answered = False
                for _ in range(12):
                    await asyncio.sleep(5)
                    try:
                        cs = twilio_client.calls(call.sid).fetch()
                        await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"status": cs.status, "duration": cs.duration}})
                        if cs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            answered = cs.status == 'completed' and int(str(cs.duration or 0)) > 15
                            await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"answered": answered}})
                            break
                    except:
                        pass
                if answered:
                    esc['timeline'].append({"step": "resolved", "time": datetime.now(timezone.utc).isoformat(), "note": "Beneficiaire a confirme aller bien."})
                    esc['status'] = "resolved"
                    esc['current_step'] = "resolved"
                    await db.alerts.update_one({"id": alert['id']}, {"$set": {"status": "resolved", "teleassistance_status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "resolved", "current_step": "resolved", "timeline": esc['timeline']}})
                    return
                else:
                    esc['timeline'].append({"step": "beneficiary_no_answer", "time": datetime.now(timezone.utc).isoformat(), "note": f"{ben['name']} n'a pas repondu."})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
            except Exception as e:
                logger.error(f"Auto-escalation call error: {e}")

        # Call guardians
        guardian_handled = False
        for guardian in guardians:
            if esc.get('status') == 'resolved':
                return
            g_phone = guardian.get('phone', '')
            if not g_phone or not twilio_client:
                continue
            esc['current_step'] = "calling_guardian"
            esc['current_target'] = {**guardian, "type": "guardian"}
            await db.escalations.update_one({"id": esc['id']}, {"$set": {"current_step": "calling_guardian", "current_target": esc['current_target']}})
            try:
                twiml_g = VoiceResponse()
                twiml_g.say(f"Bonjour, ici Chutex. Une alerte pour {alert['beneficiary_name']}.", voice='Polly.Lea', language='fr-FR')
                g_call = twilio_client.calls.create(twiml=str(twiml_g), to=g_phone, from_=TWILIO_NUMBER)
                await db.twilio_calls.insert_one({
                    "id": str(uuid.uuid4()), "call_sid": g_call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "guardian", "target_id": guardian['id'],
                    "target_name": guardian['name'], "target_phone": g_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": datetime.now(timezone.utc).isoformat(), "answered": False,
                })
                g_answered = False
                for _ in range(12):
                    await asyncio.sleep(5)
                    try:
                        gs = twilio_client.calls(g_call.sid).fetch()
                        if gs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            g_answered = gs.status == 'completed' and int(str(gs.duration or 0)) > 10
                            break
                    except:
                        pass
                if g_answered:
                    esc['timeline'].append({"step": "guardian_answered", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {guardian['name']} prend en charge."})
                    esc['status'] = "guardian_handling"
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "guardian_handling", "timeline": esc['timeline']}})
                    guardian_handled = True
                    break
            except Exception as e:
                logger.error(f"Guardian call error: {e}")

        if not guardian_handled and esc.get('status') != 'resolved':
            esc['status'] = "dispatched"
            esc['current_step'] = "dispatched"
            loc = await db.locations.find_one({"user_id": alert['beneficiary_id']}, {"_id": 0})
            iv_id = str(uuid.uuid4())
            iv = {
                "id": iv_id, "alert_id": alert['id'], "escalation_id": esc['id'],
                "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
                "assigned_to": "auto", "assigned_name": "Intervention d'urgence",
                "status": "dispatched", "notes": f"Auto-dispatch IA: {alert['message']}",
                "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566, "longitude": loc['longitude'] if loc else 2.3522},
                "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
                "created_at": datetime.now(timezone.utc).isoformat(), "completed_at": None, "report": None,
                "timeline": [{"status": "dispatched", "time": datetime.now(timezone.utc).isoformat(), "note": "Intervention auto-dispatchee"}],
            }
            await db.interventions.insert_one(iv)
            esc['intervention_id'] = iv_id
            esc['timeline'].append({"step": "dispatched", "time": datetime.now(timezone.utc).isoformat(), "note": f"Intervention #{iv_id[:8]} creee."})
            await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": "dispatched", "current_step": "dispatched", "timeline": esc['timeline'], "intervention_id": iv_id}})
            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "intervention_dispatched"}})
    except Exception as e:
        logger.error(f"Auto-escalation protocol error: {e}")
