from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, logging, math, asyncio

from database import db, EMERGENT_LLM_KEY
from auth import get_current_user, hash_password, sanitize_user
from models import (
    MedicationCreate, TeleconsultSubmit, InterventionCreate, InterventionUpdate,
    LocationUpdate, LocationSharingUpdate, ReminderCreate, DataSharingPrefs,
    GeofenceCreate, SedentaritySettings, LinkCodeRequest, LinkWithCodeRequest,
)
from utils import send_email
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== AI ====================
@router.post("/ai/recommendations")
async def get_ai_recommendations(user=Depends(get_current_user)):
    latest = {}
    for dt in ["bracelet", "scale"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r:
            latest[dt] = r['data']
    if not latest:
        return {"recommendation": "Synchronisez vos appareils pour des recommandations.", "generated_at": datetime.now(timezone.utc).isoformat()}
    meds = await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rec-{uuid.uuid4().hex[:8]}",
                        system_message="Assistant sante preventive IA. Recommandations en francais."
                        ).with_model("openai", "gpt-5.2")
        rec = await chat.send_message(UserMessage(text=f"Donnees sante {user['name']}: {latest}\nMeds: {[m['name'] for m in meds]}\n4 recommandations courtes en francais."))
    except:
        rec = "- Hydratez-vous (8 verres/jour)\n- 15 min de marche\n- Prenez vos medicaments\n- Repos suffisant"
    await db.recommendations.insert_one({"id": str(uuid.uuid4()), "user_id": user['id'], "recommendation": rec, "generated_at": datetime.now(timezone.utc).isoformat()})
    return {"recommendation": rec, "generated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/ai/recommendations/latest")
async def get_latest_recommendation(user=Depends(get_current_user)):
    r = await db.recommendations.find_one({"user_id": user['id']}, {"_id": 0}, sort=[("generated_at", -1)])
    return {"recommendation": r['recommendation'] if r else "Synchronisez vos appareils.", "generated_at": r['generated_at'] if r else None}


@router.post("/ai/metric-advice")
async def get_metric_advice(body: dict, user=Depends(get_current_user)):
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"adv-{uuid.uuid4().hex[:8]}",
                        system_message="Assistant sante. Conseil court en francais."
                        ).with_model("openai", "gpt-5.2")
        return {"advice": await chat.send_message(UserMessage(text=f"Conseil: {body.get('metric_name', '')} = {body.get('current_value', 0)}"))}
    except:
        return {"advice": f"Votre {body.get('metric_name', '')} est de {body.get('current_value', 0)}. Consultez un professionnel."}


# ==================== MEDICATIONS ====================
@router.post("/medications")
async def create_medication(data: MedicationCreate, user=Depends(get_current_user)):
    med = {"id": str(uuid.uuid4()), "user_id": user['id'], "name": data.name, "dosage": data.dosage,
           "frequency": data.frequency, "times": data.times, "notes": data.notes, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.medications.insert_one(med)
    return {k: v for k, v in med.items() if k != '_id'}


@router.get("/medications")
async def get_medications(user=Depends(get_current_user)):
    return await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)


@router.delete("/medications/{med_id}")
async def delete_medication(med_id: str, user=Depends(get_current_user)):
    await db.medications.update_one({"id": med_id, "user_id": user['id']}, {"$set": {"active": False}})
    return {"status": "deleted"}


# ==================== TELECONSULTATION ====================
TELECONSULT_QUESTIONS = [
    {"id": "q1", "question": "Quel est le motif de votre consultation ?", "type": "choice", "options": ["Douleur ou gene", "Suivi de traitement", "Renouvellement ordonnance", "Question de sante", "Urgence ressentie"]},
    {"id": "q2", "question": "Depuis quand ressentez-vous ces symptomes ?", "type": "choice", "options": ["Aujourd'hui", "Quelques jours", "Une semaine ou plus", "Chronique"]},
    {"id": "q3", "question": "Niveau de douleur/gene ?", "type": "scale", "min": 0, "max": 10},
    {"id": "q4", "question": "Avez-vous de la fievre ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q5", "question": "Prenez-vous des medicaments ?", "type": "choice", "options": ["Oui", "Non"]},
    {"id": "q6", "question": "Avez-vous des allergies ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q7", "question": "Precisions supplementaires ?", "type": "text"},
]


@router.get("/teleconsult/questions")
async def get_teleconsult_questions():
    return TELECONSULT_QUESTIONS


@router.post("/teleconsult/submit")
async def submit_teleconsult(data: TeleconsultSubmit, user=Depends(get_current_user)):
    c = {"id": str(uuid.uuid4()), "user_id": user['id'], "user_name": user['name'], "answers": data.answers, "notes": data.notes,
         "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(), "call_number": "+33 1 23 45 67 89"}
    await db.teleconsults.insert_one(c)
    return {k: v for k, v in c.items() if k != '_id'}


@router.get("/teleconsult/history")
async def get_teleconsult_history(user=Depends(get_current_user)):
    return await db.teleconsults.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(50)


# ==================== INTERVENTIONS ====================
@router.post("/interventions")
async def create_intervention(data: InterventionCreate, user=Depends(get_current_user)):
    ben = await db.users.find_one({"id": data.beneficiary_id}, {"_id": 0})
    loc = await db.locations.find_one({"user_id": data.beneficiary_id}, {"_id": 0})
    iv = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id, "beneficiary_id": data.beneficiary_id,
        "beneficiary_name": ben['name'] if ben else "Inconnu", "assigned_to": user['id'], "assigned_name": user['name'],
        "status": "en_route", "notes": data.notes,
        "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566, "longitude": loc['longitude'] if loc else 2.3522},
        "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
        "created_at": datetime.now(timezone.utc).isoformat(), "completed_at": None, "report": None,
        "timeline": [{"status": "created", "time": datetime.now(timezone.utc).isoformat(), "note": "Intervention creee"}],
    }
    await db.interventions.insert_one(iv)
    return {k: v for k, v in iv.items() if k != '_id'}


@router.get("/interventions")
async def get_interventions(user=Depends(get_current_user)):
    if user['role'] in ('admin', 'teleassistance'):
        return await db.interventions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if user['role'] == 'guardian':
        cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
        bids = cu.get('beneficiaries', [])
        return await db.interventions.find({"$or": [{"assigned_to": user['id']}, {"beneficiary_id": {"$in": bids}}]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return await db.interventions.find({"beneficiary_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(50)


@router.get("/interventions/{iid}")
async def get_intervention(iid: str, user=Depends(get_current_user)):
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Non trouvee")
    # Enrich with beneficiary info
    if iv.get('beneficiary_id'):
        ben = await db.users.find_one({"id": iv['beneficiary_id']}, {"_id": 0, "password_hash": 0})
        if ben:
            iv['beneficiary_info'] = {k: ben.get(k) for k in ['name','phone','address','date_of_birth','blood_type','medical_conditions','allergies','doctor_name','emergency_contact_name','emergency_contact_phone','gender','height_cm','weight_kg','latitude','longitude']}
            iv['beneficiary_location'] = {"latitude": ben.get('latitude', 45.47), "longitude": ben.get('longitude', 4.51)}
    # Enrich with alert info
    if iv.get('alert_id'):
        alert = await db.alerts.find_one({"id": iv['alert_id']}, {"_id": 0})
        if alert:
            iv['alert_info'] = {k: alert.get(k) for k in ['id','alert_type','severity','message','device_type','status','created_at','teleassistance_status']}
    # Enrich with intervener info
    if iv.get('assigned_to'):
        intervener = await db.users.find_one({"id": iv['assigned_to']}, {"_id": 0, "password_hash": 0})
        if intervener:
            iv['intervener_full'] = {k: intervener.get(k) for k in ['name','phone','email','role','guardian_type','structure_name','profession','latitude','longitude']}
    # Simulate intervener location near beneficiary
    ben_loc = iv.get('beneficiary_location', {})
    if ben_loc and ben_loc.get('latitude'):
        iv['intervener_location'] = {"latitude": ben_loc['latitude'] + random.uniform(-0.005, 0.005), "longitude": ben_loc['longitude'] + random.uniform(-0.005, 0.005)}
    return iv


@router.put("/interventions/{iid}")
async def update_intervention(iid: str, data: InterventionUpdate, user=Depends(get_current_user)):
    u = {}
    if data.status:
        u['status'] = data.status
        if data.status == 'completed':
            u['completed_at'] = datetime.now(timezone.utc).isoformat()
    if data.report:
        u['report'] = data.report
    if u:
        await db.interventions.update_one({"id": iid}, {"$set": u, "$push": {"timeline": {"status": data.status or "update", "time": datetime.now(timezone.utc).isoformat(), "note": data.report or "MAJ"}}})
    return {"status": "updated"}


@router.post("/interventions/{iid}/accept")
async def accept_intervention(iid: str, user=Depends(get_current_user)):
    """First intervenant to accept locks the intervention"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    if iv.get('status') != 'pending_acceptance':
        raise HTTPException(status_code=409, detail="Intervention deja acceptee par un autre intervenant")
    # Check user is in recipients
    recipient_ids = [r['id'] for r in iv.get('recipients', [])]
    if user['id'] not in recipient_ids:
        raise HTTPException(status_code=403, detail="Vous n'etes pas destinataire de cette intervention")
    now = datetime.now(timezone.utc).isoformat()
    # Get user's location
    user_full = await db.users.find_one({"id": user['id']}, {"_id": 0, "password_hash": 0})
    iv_location = None
    if user_full:
        iv_location = {"latitude": user_full.get('latitude', 45.44), "longitude": user_full.get('longitude', 4.39)}
    result = await db.interventions.update_one(
        {"id": iid, "status": "pending_acceptance"},
        {"$set": {
            "status": "en_route", "assigned_to": user['id'], "assigned_name": user.get('name', ''),
            "accepted_at": now, "intervenant_location": iv_location,
        }, "$push": {"timeline": {"status": "accepted", "time": now, "note": f"{user.get('name', '')} a accepte l'intervention"}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="Intervention deja acceptee par un autre intervenant")
    # Update incident
    if iv.get('incident_id'):
        await db.incidents.update_one({"id": iv['incident_id']}, {"$set": {"care_provider": user.get('name', ''), "assigned_guardian": {"id": user['id'], "name": user.get('name', '')}}})
    # Update alert
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {"teleassistance_status": "INTERVENANT_EN_ROUTE"}})
    return {"status": "accepted", "intervention_id": iid}


@router.post("/interventions/{iid}/position")
async def update_intervention_position(iid: str, data: dict, user=Depends(get_current_user)):
    """Update intervenant's live position during intervention"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv or iv.get('assigned_to') != user['id']:
        raise HTTPException(status_code=403, detail="Non autorise")
    lat = data.get('latitude')
    lng = data.get('longitude')
    if lat and lng:
        await db.interventions.update_one({"id": iid}, {"$set": {
            "intervenant_location": {"latitude": lat, "longitude": lng, "updated_at": datetime.now(timezone.utc).isoformat()}
        }})
        # Also update user's location
        await db.locations.update_one({"user_id": user['id']}, {"$set": {"user_id": user['id'], "latitude": lat, "longitude": lng, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"status": "updated"}


@router.get("/interventions/{iid}/tracking")
async def get_intervention_tracking(iid: str, user=Depends(get_current_user)):
    """Get live tracking data for an intervention - for followers"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    # Simulate slight movement if no real GPS
    ben_loc = iv.get('beneficiary_location', {})
    iv_loc = iv.get('intervenant_location')
    if iv_loc and iv.get('status') == 'en_route':
        # Simulate movement towards beneficiary
        iv_loc = {
            "latitude": iv_loc.get('latitude', ben_loc.get('latitude', 45.47)) + random.uniform(-0.002, 0.002),
            "longitude": iv_loc.get('longitude', ben_loc.get('longitude', 4.51)) + random.uniform(-0.002, 0.002),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    return {
        "intervention_id": iid,
        "status": iv.get('status'),
        "beneficiary_location": ben_loc,
        "intervenant_location": iv_loc,
        "intervenant_name": iv.get('assigned_name'),
        "beneficiary_name": iv.get('beneficiary_name'),
        "beneficiary_info": iv.get('beneficiary_info'),
        "alert_type": iv.get('alert_type'),
        "alert_message": iv.get('alert_message'),
        "distance_km": iv.get('distance_km'),
        "accepted_at": iv.get('accepted_at'),
        "timeline": iv.get('timeline', []),
    }


@router.get("/interventions/{iid}/detail")
async def get_intervention_full_detail(iid: str, user=Depends(get_current_user)):
    """Get full intervention detail with alert, beneficiary, intervenant info"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    # Get alert info
    alert = None
    if iv.get('alert_id'):
        alert = await db.alerts.find_one({"id": iv['alert_id']}, {"_id": 0})
    # Get intervenant info
    intervenant = None
    if iv.get('assigned_to'):
        iu = await db.users.find_one({"id": iv['assigned_to']}, {"_id": 0, "password_hash": 0})
        if iu:
            intervenant = {"name": iu.get('name',''), "phone": iu.get('phone',''), "email": iu.get('email',''), "address": iu.get('address',''), "profession": iu.get('profession',''), "structure_name": iu.get('structure_name','') or iu.get('intervention_structure',''), "guardian_type": iu.get('guardian_type',''), "is_prescriber": iu.get('is_prescriber',False), "intervention_radius_km": iu.get('intervention_radius_km'), "agency_id": iu.get('agency_id','')}
    # Enrich recipients
    enriched_recipients = []
    for r in iv.get('recipients', []):
        ru = await db.users.find_one({"id": r.get('id')}, {"_id": 0, "password_hash": 0})
        er = {**r}
        if ru:
            er.update({"email": ru.get('email',''), "address": ru.get('address',''), "profession": ru.get('profession',''), "structure_name": ru.get('structure_name','') or ru.get('intervention_structure',''), "guardian_type": ru.get('guardian_type',''), "is_prescriber": ru.get('is_prescriber',False), "intervention_radius_km": ru.get('intervention_radius_km')})
        enriched_recipients.append(er)
    iv['recipients'] = enriched_recipients
    # Get beneficiary full info
    beneficiary = None
    if iv.get('beneficiary_id'):
        beneficiary = await db.users.find_one({"id": iv['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    return {
        "intervention": iv,
        "alert": alert,
        "intervenant": intervenant,
        "beneficiary": beneficiary,
    }


@router.post("/interventions/{iid}/complete")
async def complete_intervention(iid: str, data: dict, user=Depends(get_current_user)):
    """Complete intervention with report - by intervenant OR guardian"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    # Allow assigned intervenant OR guardian of the beneficiary
    is_assigned = iv.get('assigned_to') == user['id']
    is_guardian = user['id'] in (await db.users.find_one({"id": iv.get('beneficiary_id')}, {"_id": 0}) or {}).get('guardians', []) if iv.get('beneficiary_id') else False
    if not is_assigned and not is_guardian and user.get('role') not in ('admin', 'teleassistance'):
        raise HTTPException(status_code=403, detail="Non autorise a cloturer cette intervention")
    now = datetime.now(timezone.utc).isoformat()
    report = {
        "description": data.get('description', ''),
        "actions_taken": data.get('actions_taken', ''),
        "patient_condition": data.get('patient_condition', ''),
        "follow_up_needed": data.get('follow_up_needed', False),
        "follow_up_notes": data.get('follow_up_notes', ''),
        "completed_by": user.get('name', ''),
        "completed_at": now,
    }
    await db.interventions.update_one({"id": iid}, {"$set": {
        "status": "completed", "completed_at": now, "report": report,
    }, "$push": {"timeline": {"status": "completed", "time": now, "note": f"Intervention terminee par {user.get('name', '')} - {data.get('patient_condition', '')}"}}})
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {
            "status": "resolved", "resolved_at": now,
            "teleassistance_status": "RESOLVED",
            "resolution": f"Intervention completee par {user.get('name', '')}",
            "intervention_report": report,
        }})
    if iv.get('incident_id'):
        await db.incidents.update_one({"id": iv['incident_id']}, {"$set": {
            "state": "RESOLVED", "resolved_at": now,
            "resolution": f"Intervention completee par {user.get('name', '')}",
        }, "$push": {"timeline": {"timestamp": now, "state": "RESOLVED", "detail": f"Intervention terminee - {data.get('patient_condition', '')}"}}})
    return {"status": "completed", "report": report}


@router.post("/alerts/{alert_id}/complete-with-report")
async def complete_alert_with_report(alert_id: str, data: dict, user=Depends(get_current_user)):
    """Complete an alert with report - for guardians without linked intervention"""
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    report = {
        "description": data.get('description', ''),
        "actions_taken": data.get('actions_taken', ''),
        "patient_condition": data.get('patient_condition', ''),
        "follow_up_needed": data.get('follow_up_needed', False),
        "follow_up_notes": data.get('follow_up_notes', ''),
        "completed_by": user.get('name', ''),
        "completed_at": now,
    }
    await db.alerts.update_one({"id": alert_id}, {"$set": {
        "status": "resolved", "resolved_at": now,
        "teleassistance_status": "RESOLVED",
        "resolution": f"Cloture par {user.get('name', '')}",
        "intervention_report": report,
    }})
    # Also complete any linked intervention
    iv = await db.interventions.find_one({"alert_id": alert_id, "status": {"$ne": "completed"}}, {"_id": 0})
    if iv:
        await db.interventions.update_one({"id": iv['id']}, {"$set": {
            "status": "completed", "completed_at": now, "report": report,
        }, "$push": {"timeline": {"status": "completed", "time": now, "note": f"Cloture par {user.get('name', '')}"}}})
    return {"status": "resolved", "report": report}


# ==================== LOCATION ====================
@router.post("/location/update")
async def update_location(data: LocationUpdate, user=Depends(get_current_user)):
    await db.locations.update_one({"user_id": user['id']}, {"$set": {"user_id": user['id'], "latitude": data.latitude, "longitude": data.longitude, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"status": "updated"}


@router.get("/location/{user_id}")
async def get_location(user_id: str, user=Depends(get_current_user)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    sharing = target.get('location_sharing', 'alert_only')
    if sharing == 'never' and user['id'] != user_id and user['role'] not in ('admin', 'teleassistance'):
        raise HTTPException(status_code=403, detail="Localisation non partagee")
    loc = await db.locations.find_one({"user_id": user_id}, {"_id": 0})
    if not loc:
        loc = {"user_id": user_id, "latitude": 48.8566 + random.uniform(-0.05, 0.05), "longitude": 2.3522 + random.uniform(-0.05, 0.05), "updated_at": datetime.now(timezone.utc).isoformat()}
    return loc


@router.put("/location/sharing")
async def update_sharing(data: LocationSharingUpdate, user=Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"location_sharing": data.mode}})
    return {"status": "updated", "mode": data.mode}


# ==================== REMINDERS ====================
@router.post("/reminders")
async def create_reminder(data: ReminderCreate, user=Depends(get_current_user)):
    rem = {
        "id": str(uuid.uuid4()), "user_id": user['id'],
        "reminder_type": data.reminder_type, "title": data.title, "time": data.time,
        "days": data.days, "notes": data.notes, "active": data.active,
        "completed": False, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reminders.insert_one(rem)
    return {k: v for k, v in rem.items() if k != '_id'}


@router.get("/reminders")
async def get_reminders(user=Depends(get_current_user)):
    return await db.reminders.find({"user_id": user['id']}, {"_id": 0}).to_list(100)


@router.put("/reminders/{rid}")
async def update_reminder(rid: str, data: dict, user=Depends(get_current_user)):
    update = {}
    for key in ['title', 'time', 'days', 'dosage', 'notes', 'active', 'reminder_type']:
        if key in data:
            update[key] = data[key]
    if update:
        await db.reminders.update_one({"id": rid, "user_id": user['id']}, {"$set": update})
    return {"status": "updated"}


@router.delete("/reminders/{rid}")
async def delete_reminder(rid: str, user=Depends(get_current_user)):
    await db.reminders.delete_one({"id": rid, "user_id": user['id']})
    return {"status": "deleted"}


@router.put("/reminders/{rid}/complete")
async def complete_reminder(rid: str, user=Depends(get_current_user)):
    await db.reminders.update_one({"id": rid, "user_id": user['id']}, {"$set": {"completed": True}})
    return {"status": "completed"}


@router.put("/reminders/{rid}/toggle")
async def toggle_reminder(rid: str, user=Depends(get_current_user)):
    rem = await db.reminders.find_one({"id": rid, "user_id": user['id']}, {"_id": 0})
    if rem:
        await db.reminders.update_one({"id": rid}, {"$set": {"active": not rem.get('active', True)}})
    return {"status": "toggled"}


# ==================== DATA SHARING ====================
@router.put("/settings/data-sharing")
async def update_data_sharing(data: DataSharingPrefs, user=Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"data_sharing_prefs": data.dict()}})
    return {"status": "updated"}


@router.get("/settings/data-sharing")
async def get_data_sharing(user=Depends(get_current_user)):
    u = await db.users.find_one({"id": user['id']}, {"_id": 0})
    return u.get('data_sharing_prefs', {"health_sharing": "all", "share_location": True, "share_alerts": True})


# ==================== LINK CODE ====================
@router.post("/beneficiary/generate-link-code")
async def generate_link_code(user=Depends(get_current_user)):
    # Return existing code if already generated, otherwise create one
    existing = await db.link_codes.find_one({"user_id": user['id']}, {"_id": 0})
    if existing and existing.get('code'):
        return {"code": existing['code']}
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    await db.link_codes.update_one({"user_id": user['id']}, {"$set": {"user_id": user['id'], "code": code, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"code": code}


@router.post("/guardian/link-with-code")
async def link_with_code(data: dict, user=Depends(get_current_user)):
    link_code = data.get('link_code', '').upper()
    relationship = data.get('relationship', '')
    lc = await db.link_codes.find_one({"code": link_code}, {"_id": 0})
    if not lc:
        raise HTTPException(status_code=404, detail="Code invalide")
    ben = await db.users.find_one({"id": lc['user_id']}, {"_id": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    if user['id'] in ben.get('guardians', []):
        return {"status": "already_linked", "message": f"Vous etes deja gardien de {ben['name']}"}
    existing = await db.guardian_requests.find_one({"guardian_id": user['id'], "beneficiary_id": ben['id'], "status": "pending"})
    if existing:
        return {"status": "pending", "message": "Demande deja en attente"}
    req_id = str(uuid.uuid4())
    await db.guardian_requests.insert_one({
        "id": req_id, "guardian_id": user['id'], "guardian_name": user['name'],
        "guardian_phone": user.get('phone', ''), "guardian_email": user.get('email', ''),
        "beneficiary_id": ben['id'], "beneficiary_name": ben['name'],
        "relationship": relationship,
        "method": "code", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "pending", "message": f"Demande envoyee a {ben['name']}. En attente d'acceptation.", "request_id": req_id}


@router.post("/guardian/link-with-phone")
async def link_with_phone(data: dict, user=Depends(get_current_user)):
    """Guardian requests to link with a beneficiary by phone number."""
    from services.smsmode_service import send_sms
    phone = data.get('phone', '').strip()
    relationship = data.get('relationship', '')
    if not phone:
        raise HTTPException(status_code=400, detail="Numero de telephone requis")
    cleaned = phone.replace(' ', '').replace('.', '').replace('-', '')
    if cleaned.startswith('0') and len(cleaned) >= 10:
        cleaned = '+33' + cleaned[1:]
    if len(cleaned) < 10:
        raise HTTPException(status_code=400, detail="Numero de telephone invalide (min 10 chiffres)")

    ben = await db.users.find_one({"phone": cleaned, "role": "beneficiary"}, {"_id": 0})
    if not ben and len(cleaned) >= 9:
        ben = await db.users.find_one({"phone": {"$regex": cleaned[-9:]}, "role": "beneficiary"}, {"_id": 0})

    if not ben:
        # Beneficiary not found — send real SMS invitation
        await send_sms(cleaned, f"Bonjour, {user['name']} souhaite vous ajouter comme beneficiaire sur Chutex Care. Telechargez l'app : https://apps.apple.com/app/chutex/id6759215592")
        logger.info(f"[SMS] Invitation beneficiaire envoyee au {cleaned} par {user['name']}")
        await db.sms_invitations.insert_one({
            "id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
            "phone": cleaned, "relationship": relationship, "status": "sms_sent",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "sms_sent", "message": f"Aucun compte trouve. Un SMS d'invitation a ete envoye au {phone}."}

    if user['id'] in ben.get('guardians', []):
        return {"status": "already_linked", "message": f"Vous etes deja gardien de {ben['name']}"}

    existing = await db.guardian_requests.find_one({"guardian_id": user['id'], "beneficiary_id": ben['id'], "status": "pending"})
    if existing:
        return {"status": "pending", "message": f"Demande deja envoyee a {ben['name']}. En attente d'acceptation."}

    req_id = str(uuid.uuid4())
    await db.guardian_requests.insert_one({
        "id": req_id, "guardian_id": user['id'], "guardian_name": user['name'],
        "guardian_phone": user.get('phone', ''), "guardian_email": user.get('email', ''),
        "beneficiary_id": ben['id'], "beneficiary_name": ben['name'],
        "relationship": relationship,
        "method": "phone", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "pending", "message": f"Demande envoyee a {ben['name']}. Il recevra une notification pour accepter.", "request_id": req_id}


@router.get("/beneficiary/guardian-requests")
async def get_guardian_requests(user=Depends(get_current_user)):
    """Beneficiary sees pending guardian requests"""
    requests = await db.guardian_requests.find(
        {"beneficiary_id": user['id'], "status": "pending"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return requests


@router.post("/beneficiary/invite-guardian")
async def beneficiary_invite_guardian(data: dict, user=Depends(get_current_user)):
    """Beneficiary invites a guardian by phone number."""
    from services.smsmode_service import send_sms as sms_send
    phone = data.get('phone', '').strip()
    relationship = data.get('relationship', '')
    if not phone:
        raise HTTPException(status_code=400, detail="Numero de telephone requis")
    cleaned = phone.replace(' ', '').replace('.', '').replace('-', '')
    if cleaned.startswith('0') and len(cleaned) >= 10:
        cleaned = '+33' + cleaned[1:]
    if len(cleaned) < 10:
        raise HTTPException(status_code=400, detail="Numero de telephone invalide (min 10 chiffres)")
    guardian = await db.users.find_one(
        {"phone": {"$regex": cleaned[-9:]}, "role": "guardian"}, {"_id": 0, "password_hash": 0}
    )
    if not guardian:
        await sms_send(cleaned, f"Bonjour, {user['name']} souhaite vous ajouter comme gardien sur Chutex Care. Telechargez l'app : https://apps.apple.com/app/chutex/id6759215592")
        logger.info(f"[SMS] Invitation gardien envoyee au {cleaned} par {user['name']}")
        return {"status": "sms_sent", "message": f"Aucun compte gardien trouve. Un SMS d'invitation a ete envoye au {phone}."}
    if user['id'] in (guardian.get('beneficiaries') or []):
        return {"status": "already_linked", "message": f"{guardian['name']} est deja votre gardien."}
    existing = await db.guardian_requests.find_one(
        {"guardian_id": guardian['id'], "beneficiary_id": user['id'], "status": "pending"}
    )
    if existing:
        return {"status": "pending", "message": f"Demande deja envoyee a {guardian['name']}."}
    PROS = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide a domicile', 'Professionnel de sante',
            'Infirmier(e) liberale', 'Coach sportif', 'Preparateur physique']
    req_id = str(uuid.uuid4())
    now_ts = datetime.now(timezone.utc).isoformat()
    await db.guardian_requests.insert_one({
        "id": req_id, "guardian_id": guardian['id'], "guardian_name": guardian['name'],
        "guardian_phone": guardian.get('phone', ''), "guardian_email": guardian.get('email', ''),
        "beneficiary_id": user['id'], "beneficiary_name": user['name'],
        "relationship": relationship, "relationship_type": 'professional' if relationship in PROS else 'personal',
        "method": "beneficiary_invite", "status": "pending",
        "created_at": now_ts,
    })
    # Also create guardian_invitation so guardian sees it in their invitations list
    await db.guardian_invitations.insert_one({
        "id": str(uuid.uuid4()),
        "beneficiary_id": user['id'], "beneficiary_name": user['name'],
        "guardian_id": guardian['id'], "guardian_name": guardian['name'],
        "guardian_phone": guardian.get('phone', ''),
        "relationship": relationship, "status": "pending",
        "created_at": now_ts,
    })
    return {"status": "pending", "message": f"Invitation envoyee a {guardian['name']}. Il recevra une notification.", "request_id": req_id}


@router.post("/beneficiary/guardian-requests/{req_id}/accept")
async def accept_guardian_request(req_id: str, user=Depends(get_current_user)):
    """Beneficiary accepts a guardian request"""
    req = await db.guardian_requests.find_one({"id": req_id, "beneficiary_id": user['id']}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvee")
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"guardians": req.get('guardian_id', '')}})
    if req.get('guardian_id'):
        await db.users.update_one({"id": req['guardian_id']}, {"$addToSet": {"beneficiaries": user['id']}})
    await db.guardian_requests.update_one({"id": req_id}, {"$set": {"status": "accepted"}})
    relationship = req.get('relationship', '')
    PROFESSIONAL_LIST = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide à domicile', 'Professionnel de santé']
    relationship_type = 'professional' if relationship in PROFESSIONAL_LIST else 'personal'
    await db.guardian_relationships.update_one(
        {"guardian_id": req.get('guardian_id', ''), "beneficiary_id": user['id']},
        {"$set": {"relationship": relationship, "relationship_type": relationship_type, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "accepted", "message": f"{req.get('guardian_name', 'Le gardien')} est maintenant votre gardien."}


@router.post("/beneficiary/guardian-requests/{req_id}/reject")
async def reject_guardian_request(req_id: str, user=Depends(get_current_user)):
    """Beneficiary rejects a guardian request"""
    await db.guardian_requests.update_one({"id": req_id, "beneficiary_id": user['id']}, {"$set": {"status": "rejected"}})
    return {"status": "rejected"}


# ==================== PRESCRIPTIONS DETAIL ====================
@router.get("/prescriptions/{pid}")
async def get_prescription_detail(pid: str, user=Depends(get_current_user)):
    p = await db.prescriptions.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Prescription non trouvee")
    return p


@router.put("/prescriptions/{pid}/subscribe")
async def subscribe_prescription(pid: str, user=Depends(get_current_user)):
    p = await db.prescriptions.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Prescription non trouvee")
    now = datetime.now(timezone.utc).isoformat()
    await db.prescriptions.update_one({"id": pid}, {"$set": {"status": "subscribed", "beneficiary_id": user['id'], "subscribed_at": now}})
    await db.users.update_one({"id": p['guardian_id']}, {"$addToSet": {"beneficiaries": user['id']}})
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"guardians": p['guardian_id']}})
    return {"status": "subscribed"}


# ==================== EMAILS ====================
@router.get("/emails")
async def get_sent_emails(user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    return await db.sent_emails.find({}, {"_id": 0}).sort("sent_at", -1).to_list(100)


# ==================== GEOFENCING ====================
@router.post("/geofence")
async def create_geofence(data: GeofenceCreate, user=Depends(get_current_user)):
    radius_raw = data.radius_m if data.radius_m is not None else 500
    radius_m = max(50, min(float(radius_raw), 10000))
    gf = {
        "id": str(uuid.uuid4()), "user_id": user['id'], "name": data.name,
        "latitude": data.latitude, "longitude": data.longitude, "radius_m": radius_m,
        "active": data.active, "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.geofences.insert_one(gf)
    return {k: v for k, v in gf.items() if k != '_id'}


@router.get("/geofence")
async def get_geofences(user=Depends(get_current_user)):
    return await db.geofences.find({"user_id": user['id']}, {"_id": 0}).to_list(50)


@router.put("/geofence/{gid}/toggle")
async def toggle_geofence(gid: str, user=Depends(get_current_user)):
    gf = await db.geofences.find_one({"id": gid, "user_id": user['id']}, {"_id": 0})
    if not gf:
        raise HTTPException(status_code=404, detail="Zone non trouvee")
    new_active = not gf.get('active', True)
    await db.geofences.update_one(
        {"id": gid, "user_id": user['id']},
        {"$set": {"active": new_active, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "toggled", "active": new_active}


@router.put("/geofence/{gid}")
async def update_geofence(gid: str, data: dict, user=Depends(get_current_user)):
    gf = await db.geofences.find_one({"id": gid, "user_id": user['id']}, {"_id": 0})
    if not gf:
        raise HTTPException(status_code=404, detail="Zone non trouvee")

    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if "name" in data and data.get("name"):
        update["name"] = str(data.get("name")).strip()
    if "latitude" in data:
        try:
            update["latitude"] = float(data.get("latitude"))
        except Exception:
            raise HTTPException(status_code=400, detail="Latitude invalide")
    if "longitude" in data:
        try:
            update["longitude"] = float(data.get("longitude"))
        except Exception:
            raise HTTPException(status_code=400, detail="Longitude invalide")
    radius_value = data.get("radius_m", data.get("radius_meters"))
    if radius_value is not None:
        try:
            update["radius_m"] = max(50, min(float(radius_value), 10000))
        except Exception:
            raise HTTPException(status_code=400, detail="Rayon invalide")
    if "active" in data:
        update["active"] = bool(data.get("active"))

    await db.geofences.update_one({"id": gid, "user_id": user['id']}, {"$set": update})
    updated = await db.geofences.find_one({"id": gid, "user_id": user['id']}, {"_id": 0})
    return updated


@router.delete("/geofence/{gid}")
async def delete_geofence(gid: str, user=Depends(get_current_user)):
    await db.geofences.delete_one({"id": gid, "user_id": user['id']})
    return {"status": "deleted"}


@router.post("/geofence/check")
async def check_geofence(user=Depends(get_current_user)):
    loc = await db.locations.find_one({"user_id": user['id']}, {"_id": 0})
    if not loc:
        return {"status": "no_location", "in_zone": False, "violations": [], "total_fences": 0}
    fences = await db.geofences.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(50)
    violations = []
    for f in fences:
        dist = _haversine(loc['latitude'], loc['longitude'], f['latitude'], f['longitude'])
        if dist > f['radius_m']:
            alert_id = str(uuid.uuid4())
            violations.append({"fence_name": f['name'], "zone_name": f['name'], "distance_m": round(dist), "radius_m": f['radius_m']})
            await db.alerts.insert_one({
                "id": alert_id, "beneficiary_id": user['id'], "beneficiary_name": user['name'],
                "alert_type": "geofence", "severity": "medium", "message": f"Sortie de zone: {f['name']} ({round(dist)}m / {f['radius_m']}m)",
                "device_type": "gps", "status": "active", "created_at": datetime.now(timezone.utc).isoformat(),
                "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
            })
            # Push notification to guardians
            guardian_ids = user.get('guardians', [])
            if not guardian_ids:
                guardians = await db.users.find({"beneficiaries": user['id']}, {"_id": 0, "id": 1}).to_list(20)
                guardian_ids = [g['id'] for g in guardians]
            if guardian_ids:
                from routes.push_routes import notify_geofence_exit
                asyncio.create_task(notify_geofence_exit(user['name'], f['name'], alert_id, guardian_ids))
    return {"status": "checked", "in_zone": len(violations) == 0, "violations": violations, "total_fences": len(fences)}


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ==================== ECG ====================
@router.post("/ecg/start")
async def start_ecg(user=Depends(get_current_user)):
    ecg_data = [round(random.uniform(-0.5, 1.5), 3) for _ in range(500)]
    peaks = sorted(random.sample(range(50, 450), 6))
    for p in peaks:
        ecg_data[p] = round(random.uniform(1.0, 2.5), 3)
        if p + 1 < 500:
            ecg_data[p + 1] = round(random.uniform(-0.8, -0.2), 3)
    intervals = [peaks[i + 1] - peaks[i] for i in range(len(peaks) - 1)]
    avg_interval = sum(intervals) / len(intervals) if intervals else 100
    bpm = round(60 / (avg_interval * 0.02))
    irregularity = max(intervals) - min(intervals) if intervals else 0
    interpretation = "Rythme sinusal normal" if 60 <= bpm <= 100 and irregularity < 15 else "Anomalie detectee - consulter un medecin" if bpm > 100 or bpm < 50 else "Irregularite legere - surveillance recommandee"
    ecg_record = {
        "id": str(uuid.uuid4()), "user_id": user['id'], "data": ecg_data,
        "bpm": bpm, "interpretation": interpretation, "irregularity": irregularity,
        "peaks": peaks, "timestamp": datetime.now(timezone.utc).isoformat(), "duration_seconds": 10,
    }
    await db.ecg_records.insert_one(ecg_record)
    return {k: v for k, v in ecg_record.items() if k != '_id'}


@router.get("/ecg/history")
async def get_ecg_history(user=Depends(get_current_user)):
    return await db.ecg_records.find({"user_id": user['id']}, {"_id": 0, "data": 0}).sort("timestamp", -1).to_list(20)


@router.get("/ecg/{ecg_id}")
async def get_ecg_detail(ecg_id: str, user=Depends(get_current_user)):
    ecg = await db.ecg_records.find_one({"id": ecg_id}, {"_id": 0})
    if not ecg:
        raise HTTPException(status_code=404, detail="ECG non trouve")
    return ecg


# ==================== SEDENTARITY ====================
@router.put("/settings/sedentarity")
async def update_sedentarity(data: SedentaritySettings, user=Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"sedentarity_settings": data.dict()}})
    return {"status": "updated"}


@router.get("/settings/sedentarity")
async def get_sedentarity(user=Depends(get_current_user)):
    u = await db.users.find_one({"id": user['id']}, {"_id": 0})
    return u.get('sedentarity_settings', {"enabled": True, "max_inactive_minutes": 60, "start_hour": 8, "end_hour": 20})


@router.post("/sedentarity/check")
async def check_sedentarity(user=Depends(get_current_user)):
    settings = (await db.users.find_one({"id": user['id']}, {"_id": 0})).get('sedentarity_settings', {"enabled": True, "max_inactive_minutes": 60})
    if not settings.get('enabled', True):
        return {"status": "disabled"}
    latest = await db.device_readings.find_one({"user_id": user['id'], "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    if not latest:
        return {"status": "no_data"}
    steps = latest.get('data', {}).get('steps', 0)
    max_inactive = settings.get('max_inactive_minutes', 60)
    is_sedentary = steps < 100
    if is_sedentary:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
            "alert_type": "inactivity", "severity": "low", "message": f"Inactivite detectee ({steps} pas). Bougez un peu!",
            "device_type": "bracelet", "status": "active", "created_at": datetime.now(timezone.utc).isoformat(),
            "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })
    return {"status": "checked", "is_sedentary": is_sedentary, "steps": steps, "threshold_minutes": max_inactive}
