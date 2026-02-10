from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, logging, math

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
    iv['intervener_location'] = {"latitude": iv['beneficiary_location']['latitude'] + random.uniform(-0.005, 0.005), "longitude": iv['beneficiary_location']['longitude'] + random.uniform(-0.005, 0.005)}
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
async def update_reminder(rid: str, data: ReminderCreate, user=Depends(get_current_user)):
    await db.reminders.update_one({"id": rid, "user_id": user['id']}, {"$set": {
        "reminder_type": data.reminder_type, "title": data.title, "time": data.time,
        "days": data.days, "notes": data.notes, "active": data.active,
    }})
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
    return u.get('data_sharing_prefs', {"share_vitals": True, "share_location": True, "share_alerts": True, "share_medications": True, "share_devices": True, "share_reports": True})


# ==================== LINK CODE ====================
@router.post("/beneficiary/generate-link-code")
async def generate_link_code(user=Depends(get_current_user)):
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    await db.link_codes.update_one({"user_id": user['id']}, {"$set": {"user_id": user['id'], "code": code, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"code": code}


@router.post("/guardian/link-with-code")
async def link_with_code(data: LinkWithCodeRequest, user=Depends(get_current_user)):
    lc = await db.link_codes.find_one({"code": data.link_code.upper()}, {"_id": 0})
    if not lc:
        raise HTTPException(status_code=404, detail="Code invalide")
    ben = await db.users.find_one({"id": lc['user_id']}, {"_id": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": ben['id']}})
    await db.users.update_one({"id": ben['id']}, {"$addToSet": {"guardians": user['id']}})
    return {"status": "linked", "beneficiary_name": ben['name']}


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
    gf = {
        "id": str(uuid.uuid4()), "user_id": user['id'], "name": data.name,
        "latitude": data.latitude, "longitude": data.longitude, "radius_m": data.radius_m,
        "active": data.active, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.geofences.insert_one(gf)
    return {k: v for k, v in gf.items() if k != '_id'}


@router.get("/geofence")
async def get_geofences(user=Depends(get_current_user)):
    return await db.geofences.find({"user_id": user['id']}, {"_id": 0}).to_list(50)


@router.put("/geofence/{gid}/toggle")
async def toggle_geofence(gid: str, user=Depends(get_current_user)):
    gf = await db.geofences.find_one({"id": gid, "user_id": user['id']}, {"_id": 0})
    if gf:
        await db.geofences.update_one({"id": gid}, {"$set": {"active": not gf.get('active', True)}})
    return {"status": "toggled"}


@router.delete("/geofence/{gid}")
async def delete_geofence(gid: str, user=Depends(get_current_user)):
    await db.geofences.delete_one({"id": gid, "user_id": user['id']})
    return {"status": "deleted"}


@router.post("/geofence/check")
async def check_geofence(user=Depends(get_current_user)):
    loc = await db.locations.find_one({"user_id": user['id']}, {"_id": 0})
    if not loc:
        return {"status": "no_location", "violations": []}
    fences = await db.geofences.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(50)
    violations = []
    for f in fences:
        dist = _haversine(loc['latitude'], loc['longitude'], f['latitude'], f['longitude'])
        if dist > f['radius_m']:
            violations.append({"fence_name": f['name'], "distance_m": round(dist), "radius_m": f['radius_m']})
            await db.alerts.insert_one({
                "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
                "alert_type": "geofence", "severity": "medium", "message": f"Sortie de zone: {f['name']} ({round(dist)}m / {f['radius_m']}m)",
                "device_type": "gps", "status": "active", "created_at": datetime.now(timezone.utc).isoformat(),
                "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
            })
    return {"status": "checked", "violations": violations, "total_fences": len(fences)}


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
