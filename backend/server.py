from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import jwt, bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vitallink_db')]

JWT_SECRET = os.environ.get('JWT_SECRET', 'vitallink-jwt-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="VitalLink AI API")
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    role: str = "beneficiary"

class UserLogin(BaseModel):
    email: str
    password: str

class DeviceSyncRequest(BaseModel):
    device_type: str
    data: dict = {}

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    times: List[str]
    notes: str = ""

class AlertCreate(BaseModel):
    alert_type: str
    severity: str = "medium"
    message: str = ""
    device_type: str = "bracelet"

class PrescriptionCreate(BaseModel):
    beneficiary_name: str
    beneficiary_email: str
    beneficiary_phone: str
    subscription_type: str
    notes: str = ""

class LinkBeneficiaryRequest(BaseModel):
    beneficiary_email: str

class ThresholdUpdate(BaseModel):
    metric_id: str
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    goal: Optional[float] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class LocationSharingUpdate(BaseModel):
    mode: str  # "always", "alert_only", "never"

class TeleconsultSubmit(BaseModel):
    answers: List[dict]
    notes: str = ""

class InterventionCreate(BaseModel):
    alert_id: str
    beneficiary_id: str
    notes: str = ""

class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    report: Optional[str] = None

# ==================== AUTH UTILITIES ====================
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())

def create_token(uid: str, role: str) -> str:
    return jwt.encode({'user_id': uid, 'role': role, 'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Token manquant")
    try:
        payload = jwt.decode(authorization.split(' ')[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user: raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

def sanitize_user(u: dict) -> dict:
    return {k: u.get(k, [] if k in ('beneficiaries','guardians') else '') for k in ('id','email','name','phone','role','created_at','beneficiaries','guardians','location_sharing')}

# ==================== DATA GENERATORS ====================
BRACELET_SIM = {
    'heart_rate': (62, 95), 'hrv': (25, 80), 'stress': (15, 65), 'vo2max': (22, 48),
    'spo2': (95, 99), 'blood_pressure_systolic': (115, 138), 'blood_pressure_diastolic': (72, 88),
    'blood_glucose': (78, 125), 'sleep_duration': (5.5, 8.5), 'sleep_quality': (55, 95),
    'sleep_cycles': (3, 6), 'sleep_interruptions': (0, 4), 'temperature': (36.2, 37.3),
    'calories': (800, 2200), 'steps': (1500, 9000),
}

SCALE_SIM = {
    'weight': (58, 88), 'bmi': (19, 28), 'body_fat_pct': (15, 32), 'fat_mass': (8, 22),
    'visceral_fat': (3, 14), 'bone_mass': (2.2, 3.8), 'subcutaneous_fat_pct': (12, 28),
    'subcutaneous_fat_mass': (6, 18), 'muscle_pct': (28, 48), 'muscle_mass': (22, 42),
    'skeletal_muscle_mass': (18, 38), 'skeletal_mass': (2.5, 4.5), 'skeletal_muscle_quality': (55, 95),
    'hydration_pct': (48, 62), 'total_body_water': (30, 48), 'intracellular_water': (18, 28),
    'extracellular_water': (12, 20), 'protein_pct': (14, 20), 'protein_mass': (8, 14),
    'basal_metabolism': (1200, 2000), 'recommended_calories': (1600, 2400),
    'right_arm_fat_ratio': (12, 28), 'left_arm_fat_ratio': (12, 28),
    'right_arm_muscle_rate': (28, 42), 'left_arm_muscle_rate': (28, 42),
    'right_arm_muscle_mass': (1.8, 3.5), 'left_arm_muscle_mass': (1.8, 3.5),
    'right_leg_fat_ratio': (18, 32), 'left_leg_fat_ratio': (18, 32),
    'right_leg_fat_mass': (2.5, 7), 'left_leg_fat_mass': (2.5, 7),
    'right_foot_muscle_rate': (32, 48), 'left_foot_muscle_rate': (32, 48),
    'trunk_fat_mass': (4, 10), 'trunk_muscle_rate': (28, 42), 'trunk_muscle_mass': (12, 22),
    'body_type': (1, 9), 'body_age': (35, 70), 'health_score': (55, 95),
    'obesity_degree': (5, 25), 'adiposity_level': (1, 5),
    'fat_control': (-5, 3), 'muscle_control': (0, 8), 'weight_control': (-8, 5),
    'normal_weight': (55, 78), 'ideal_weight': (55, 72),
    'body_cell_mass': (22, 38), 'minerals': (2.8, 4.2), 'waist_hip_ratio': (0.72, 0.92),
    'body_fat_overall': (15, 32),
}

def gen_data(sim_dict, custom_data=None):
    if custom_data: return custom_data
    d = {}
    for k, (lo, hi) in sim_dict.items():
        if isinstance(lo, int) and isinstance(hi, int):
            d[k] = random.randint(lo, hi)
        else:
            d[k] = round(random.uniform(lo, hi), 1)
    return d

def generate_bracelet_data(custom=None): return gen_data(BRACELET_SIM, custom)
def generate_scale_data(custom=None): return gen_data(SCALE_SIM, custom)
def generate_vest_data():
    return {"connected": True, "battery": random.randint(20, 100), "fall_detected": False}

def gen_history(sim_dict, days=7):
    history = []
    now = datetime.now(timezone.utc)
    for i in range(days, 0, -1):
        d = gen_data(sim_dict)
        d['_date'] = (now - timedelta(days=i)).isoformat()
        history.append(d)
    return history

def check_anomalies(dtype, data):
    anomalies = []
    if dtype == "bracelet":
        hr = data.get('heart_rate', 75)
        if hr > 120 or hr < 50: anomalies.append({"severity": "high", "message": f"Fréquence cardiaque anormale: {hr} bpm"})
        if data.get('spo2', 97) < 92: anomalies.append({"severity": "critical", "message": f"SpO2 bas: {data['spo2']}%"})
        if data.get('temperature', 37) > 38.5: anomalies.append({"severity": "high", "message": f"Température élevée: {data['temperature']}°C"})
        if data.get('blood_pressure_systolic', 120) > 160: anomalies.append({"severity": "high", "message": f"Tension élevée: {data['blood_pressure_systolic']}/{data.get('blood_pressure_diastolic',80)}"})
        if data.get('blood_glucose', 100) > 180: anomalies.append({"severity": "high", "message": f"Glycémie élevée: {data['blood_glucose']} mg/dL"})
    elif dtype == "vest":
        if data.get('fall_detected'): anomalies.append({"severity": "critical", "message": "Chute détectée!"})
    return anomalies

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(data: UserRegister):
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    uid = str(uuid.uuid4())
    user = {"id": uid, "email": data.email, "password_hash": hash_password(data.password),
            "name": data.name, "phone": data.phone, "role": data.role,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "beneficiaries": [], "guardians": [], "location_sharing": "alert_only"}
    await db.users.insert_one(user)
    if data.role == "beneficiary":
        for dt, nm in [("bracelet","Bracelet Santé"),("scale","Balance Connectée"),("vest","Gilet Anti-Chute")]:
            await db.devices.insert_one({"id": str(uuid.uuid4()), "user_id": uid, "device_type": dt, "name": nm, "connected": False, "battery": random.randint(60, 95), "last_sync": None})
    return {"token": create_token(uid, data.role), "user": sanitize_user(user)}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    return {"token": create_token(user['id'], user['role']), "user": sanitize_user(user)}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return sanitize_user(user)

# ==================== DEVICE ROUTES ====================
@api_router.post("/devices/sync")
async def sync_device(data: DeviceSyncRequest, user=Depends(get_current_user)):
    device = await db.devices.find_one({"user_id": user['id'], "device_type": data.device_type}, {"_id": 0})
    if not device: raise HTTPException(status_code=404, detail="Appareil non trouvé")
    generators = {"bracelet": lambda: generate_bracelet_data(data.data if data.data else None),
                  "scale": lambda: generate_scale_data(data.data if data.data else None),
                  "vest": generate_vest_data}
    device_data = generators.get(data.device_type, lambda: data.data)()
    now = datetime.now(timezone.utc).isoformat()
    batt = random.randint(20, 100)
    await db.devices.update_one({"user_id": user['id'], "device_type": data.device_type},
        {"$set": {"connected": True, "last_sync": now, "battery": batt}})
    reading = {"id": str(uuid.uuid4()), "user_id": user['id'], "device_type": data.device_type,
               "data": device_data, "timestamp": now}
    await db.device_readings.insert_one(reading)
    anomalies = check_anomalies(data.device_type, device_data)
    for a in anomalies:
        await db.alerts.insert_one({"id": str(uuid.uuid4()), "beneficiary_id": user['id'],
            "beneficiary_name": user['name'], "alert_type": "anomaly", "severity": a['severity'],
            "message": a['message'], "device_type": data.device_type, "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None})
    return {"status": "synced", "data": device_data, "anomalies": anomalies, "battery": batt, "timestamp": now}

@api_router.get("/devices")
async def get_devices(user=Depends(get_current_user)):
    uid = user.get('beneficiaries', []) if user['role'] == 'guardian' else [user['id']]
    return await db.devices.find({"user_id": {"$in": uid}}, {"_id": 0}).to_list(100)

@api_router.get("/devices/latest")
async def get_latest_readings(user=Depends(get_current_user)):
    readings = {}
    for dt in ["bracelet", "scale", "vest"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r: readings[dt] = r
    return readings

# ==================== HEALTH DATA ROUTES ====================
@api_router.get("/health/history/{metric_id}")
async def get_health_history(metric_id: str, user=Depends(get_current_user)):
    # Determine device type
    device_type = "bracelet" if metric_id in BRACELET_SIM else "scale" if metric_id in SCALE_SIM else None
    if not device_type:
        raise HTTPException(status_code=404, detail="Métrique non trouvée")
    # Get real readings
    readings = await db.device_readings.find(
        {"user_id": user['id'], "device_type": device_type},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(30)
    history = []
    for r in reversed(readings):
        val = r['data'].get(metric_id)
        if val is not None:
            history.append({"value": val, "date": r['timestamp']})
    # If not enough real data, generate synthetic history
    if len(history) < 7:
        sim = BRACELET_SIM if device_type == "bracelet" else SCALE_SIM
        lo, hi = sim[metric_id]
        now = datetime.now(timezone.utc)
        synthetic = []
        for i in range(7, 0, -1):
            v = round(random.uniform(lo, hi), 1) if isinstance(lo, float) else random.randint(lo, hi)
            synthetic.append({"value": v, "date": (now - timedelta(days=i)).isoformat()})
        # Append real data at end
        if history:
            synthetic = synthetic[:7-len(history)] + history
        history = synthetic
    # Compute stats
    values = [h['value'] for h in history]
    return {
        "metric_id": metric_id,
        "history": history[-7:],
        "stats": {
            "current": values[-1] if values else 0,
            "average": round(sum(values)/len(values), 1) if values else 0,
            "min": round(min(values), 1) if values else 0,
            "max": round(max(values), 1) if values else 0,
        }
    }

# ==================== THRESHOLDS ROUTES ====================
@api_router.post("/health/thresholds")
async def set_threshold(data: ThresholdUpdate, user=Depends(get_current_user)):
    threshold = {"user_id": user['id'], "metric_id": data.metric_id,
                 "min_val": data.min_val, "max_val": data.max_val, "goal": data.goal,
                 "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.thresholds.update_one(
        {"user_id": user['id'], "metric_id": data.metric_id},
        {"$set": threshold}, upsert=True)
    return {"status": "saved"}

@api_router.get("/health/thresholds")
async def get_thresholds(user=Depends(get_current_user)):
    thresholds = await db.thresholds.find({"user_id": user['id']}, {"_id": 0}).to_list(200)
    return thresholds

@api_router.get("/health/thresholds/{metric_id}")
async def get_threshold(metric_id: str, user=Depends(get_current_user)):
    t = await db.thresholds.find_one({"user_id": user['id'], "metric_id": metric_id}, {"_id": 0})
    return t or {"metric_id": metric_id, "min_val": None, "max_val": None, "goal": None}

# ==================== ALERT ROUTES ====================
@api_router.post("/alerts")
async def create_alert(data: AlertCreate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    alert = {"id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
             "alert_type": data.alert_type, "severity": data.severity,
             "message": data.message or f"Alerte {data.alert_type}",
             "device_type": data.device_type, "status": "active",
             "created_at": now, "resolved_at": None, "resolved_by": None}
    await db.alerts.insert_one(alert)
    return {k: v for k, v in alert.items() if k != '_id'}

@api_router.get("/alerts")
async def get_alerts(user=Depends(get_current_user)):
    if user['role'] == 'guardian':
        bids = user.get('beneficiaries', []) + [user['id']]
        q = {"beneficiary_id": {"$in": bids}}
    else:
        q = {"beneficiary_id": user['id']}
    return await db.alerts.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    r = await db.alerts.update_one({"id": alert_id},
        {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat(), "resolved_by": user['id']}})
    if r.modified_count == 0: raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"status": "resolved"}

# ==================== MEDICATION ROUTES ====================
@api_router.post("/medications")
async def create_medication(data: MedicationCreate, user=Depends(get_current_user)):
    med = {"id": str(uuid.uuid4()), "user_id": user['id'], "name": data.name, "dosage": data.dosage,
           "frequency": data.frequency, "times": data.times, "notes": data.notes, "active": True,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.medications.insert_one(med)
    return {k: v for k, v in med.items() if k != '_id'}

@api_router.get("/medications")
async def get_medications(user=Depends(get_current_user)):
    return await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)

@api_router.delete("/medications/{med_id}")
async def delete_medication(med_id: str, user=Depends(get_current_user)):
    r = await db.medications.update_one({"id": med_id, "user_id": user['id']}, {"$set": {"active": False}})
    if r.modified_count == 0: raise HTTPException(status_code=404, detail="Médicament non trouvé")
    return {"status": "deleted"}

# ==================== AI ROUTES ====================
@api_router.post("/ai/recommendations")
async def get_ai_recommendations(user=Depends(get_current_user)):
    latest = {}
    for dt in ["bracelet", "scale"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r: latest[dt] = r['data']
    meds = await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)
    if not latest:
        return {"recommendation": "Synchronisez vos appareils pour des recommandations personnalisées.", "generated_at": datetime.now(timezone.utc).isoformat()}
    prompt = f"Analyse les données de santé pour {user['name']}:\n{str(latest)}\nMédicaments: {[m['name']+' '+m['dosage'] for m in meds] if meds else 'Aucun'}\nFournis 4 recommandations préventives courtes en français. Format: liste à puces. Max 200 mots."
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rec-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un assistant santé préventive IA. Recommandations bienveillantes en français. Pas de diagnostic médical."
        ).with_model("openai", "gpt-5.2")
        recommendation = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"AI error: {e}")
        recommendation = "• Hydratez-vous régulièrement (8 verres/jour)\n• 15 min de marche recommandées\n• Prenez vos médicaments aux heures prévues\n• Reposez-vous suffisamment"
    rec = {"id": str(uuid.uuid4()), "user_id": user['id'], "recommendation": recommendation,
           "generated_at": datetime.now(timezone.utc).isoformat()}
    await db.recommendations.insert_one(rec)
    return {"recommendation": recommendation, "generated_at": rec['generated_at']}

@api_router.get("/ai/recommendations/latest")
async def get_latest_recommendation(user=Depends(get_current_user)):
    r = await db.recommendations.find_one({"user_id": user['id']}, {"_id": 0}, sort=[("generated_at", -1)])
    if not r: return {"recommendation": "Synchronisez vos appareils pour des recommandations IA.", "generated_at": None}
    return {"recommendation": r['recommendation'], "generated_at": r['generated_at']}

@api_router.post("/ai/metric-advice")
async def get_metric_advice(body: dict, user=Depends(get_current_user)):
    metric_id = body.get('metric_id', '')
    current_value = body.get('current_value', 0)
    metric_name = body.get('metric_name', metric_id)
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"metric-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un assistant santé. Donne un conseil court (2-3 phrases) en français sur la métrique de santé demandée. Pas de diagnostic."
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=f"Conseil pour {user['name']}: {metric_name} = {current_value}. Que recommandes-tu?"))
        return {"advice": resp}
    except Exception as e:
        return {"advice": f"Votre {metric_name} est de {current_value}. Consultez un professionnel pour une analyse approfondie."}

# ==================== LOCATION ROUTES ====================
@api_router.post("/location/update")
async def update_location(data: LocationUpdate, user=Depends(get_current_user)):
    await db.locations.update_one({"user_id": user['id']},
        {"$set": {"user_id": user['id'], "latitude": data.latitude, "longitude": data.longitude,
                  "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"status": "updated"}

@api_router.get("/location/{user_id}")
async def get_location(user_id: str, user=Depends(get_current_user)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target: raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    sharing = target.get('location_sharing', 'alert_only')
    if sharing == 'never' and user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Localisation non partagée")
    if sharing == 'alert_only' and user['id'] != user_id:
        active = await db.alerts.count_documents({"beneficiary_id": user_id, "status": "active"})
        if active == 0: raise HTTPException(status_code=403, detail="Localisation partagée uniquement en cas d'alerte")
    loc = await db.locations.find_one({"user_id": user_id}, {"_id": 0})
    if not loc:
        # Return simulated location (Paris area)
        loc = {"user_id": user_id, "latitude": 48.8566 + random.uniform(-0.05, 0.05),
               "longitude": 2.3522 + random.uniform(-0.05, 0.05), "updated_at": datetime.now(timezone.utc).isoformat()}
    return loc

@api_router.put("/location/sharing")
async def update_sharing(data: LocationSharingUpdate, user=Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"location_sharing": data.mode}})
    return {"status": "updated", "mode": data.mode}

# ==================== GUARDIAN ROUTES ====================
@api_router.post("/guardian/link")
async def link_beneficiary(data: LinkBeneficiaryRequest, user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    b = await db.users.find_one({"email": data.beneficiary_email, "role": "beneficiary"}, {"_id": 0})
    if not b: raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": b['id']}})
    await db.users.update_one({"id": b['id']}, {"$addToSet": {"guardians": user['id']}})
    return {"status": "linked", "beneficiary": {"id": b['id'], "name": b['name'], "email": b['email']}}

@api_router.get("/guardian/beneficiaries")
async def get_beneficiaries(user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    bids = cu.get('beneficiaries', [])
    result = []
    for bid in bids:
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            latest = await db.device_readings.find_one({"user_id": bid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
            ac = await db.alerts.count_documents({"beneficiary_id": bid, "status": "active"})
            b['latest_vitals'] = latest['data'] if latest else None
            b['active_alerts'] = ac
            b['last_sync'] = latest['timestamp'] if latest else None
            loc = await db.locations.find_one({"user_id": bid}, {"_id": 0})
            b['location'] = loc
            result.append(b)
    return result

@api_router.post("/guardian/prescriptions")
async def create_prescription(data: PrescriptionCreate, user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    p = {"id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
         "beneficiary_name": data.beneficiary_name, "beneficiary_email": data.beneficiary_email,
         "beneficiary_phone": data.beneficiary_phone, "subscription_type": data.subscription_type,
         "notes": data.notes, "status": "pending",
         "commission": 15.0 if data.subscription_type == "standard" else 25.0,
         "created_at": datetime.now(timezone.utc).isoformat()}
    await db.prescriptions.insert_one(p)
    return {k: v for k, v in p.items() if k != '_id'}

@api_router.get("/guardian/prescriptions")
async def get_prescriptions(user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    return await db.prescriptions.find({"guardian_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

# ==================== TELECONSULTATION ROUTES ====================
TELECONSULT_QUESTIONS = [
    {"id": "q1", "question": "Quel est le motif de votre consultation ?", "type": "choice",
     "options": ["Douleur ou gêne", "Suivi de traitement", "Renouvellement ordonnance", "Question de santé", "Urgence ressentie"]},
    {"id": "q2", "question": "Depuis quand ressentez-vous ces symptômes ?", "type": "choice",
     "options": ["Aujourd'hui", "Quelques jours", "Une semaine ou plus", "Chronique (récurrent)"]},
    {"id": "q3", "question": "Quel est votre niveau de douleur/gêne ?", "type": "scale", "min": 0, "max": 10},
    {"id": "q4", "question": "Avez-vous de la fièvre ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q5", "question": "Prenez-vous actuellement des médicaments ?", "type": "choice", "options": ["Oui", "Non"]},
    {"id": "q6", "question": "Avez-vous des allergies connues ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q7", "question": "Souhaitez-vous préciser quelque chose ?", "type": "text"},
]

@api_router.get("/teleconsult/questions")
async def get_teleconsult_questions():
    return TELECONSULT_QUESTIONS

@api_router.post("/teleconsult/submit")
async def submit_teleconsult(data: TeleconsultSubmit, user=Depends(get_current_user)):
    consult = {"id": str(uuid.uuid4()), "user_id": user['id'], "user_name": user['name'],
               "answers": data.answers, "notes": data.notes, "status": "pending",
               "created_at": datetime.now(timezone.utc).isoformat(), "doctor_assigned": None, "call_number": "+33 1 23 45 67 89"}
    await db.teleconsults.insert_one(consult)
    return {k: v for k, v in consult.items() if k != '_id'}

@api_router.get("/teleconsult/history")
async def get_teleconsult_history(user=Depends(get_current_user)):
    return await db.teleconsults.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(50)

# ==================== INTERVENTION ROUTES ====================
@api_router.post("/interventions")
async def create_intervention(data: InterventionCreate, user=Depends(get_current_user)):
    ben = await db.users.find_one({"id": data.beneficiary_id}, {"_id": 0})
    loc = await db.locations.find_one({"user_id": data.beneficiary_id}, {"_id": 0})
    intervention = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id,
        "beneficiary_id": data.beneficiary_id, "beneficiary_name": ben['name'] if ben else "Inconnu",
        "assigned_to": user['id'], "assigned_name": user['name'],
        "status": "en_route", "notes": data.notes,
        "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566, "longitude": loc['longitude'] if loc else 2.3522},
        "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None, "report": None,
        "timeline": [{"status": "created", "time": datetime.now(timezone.utc).isoformat(), "note": "Intervention créée"}]
    }
    await db.interventions.insert_one(intervention)
    return {k: v for k, v in intervention.items() if k != '_id'}

@api_router.get("/interventions")
async def get_interventions(user=Depends(get_current_user)):
    if user['role'] == 'guardian':
        bids = (await db.users.find_one({"id": user['id']}, {"_id": 0})).get('beneficiaries', [])
        q = {"$or": [{"assigned_to": user['id']}, {"beneficiary_id": {"$in": bids}}]}
    else:
        q = {"beneficiary_id": user['id']}
    return await db.interventions.find(q, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/interventions/{intervention_id}")
async def get_intervention(intervention_id: str, user=Depends(get_current_user)):
    iv = await db.interventions.find_one({"id": intervention_id}, {"_id": 0})
    if not iv: raise HTTPException(status_code=404, detail="Intervention non trouvée")
    # Simulate movement
    iv['intervener_location'] = {"latitude": iv['beneficiary_location']['latitude'] + random.uniform(-0.005, 0.005),
                                  "longitude": iv['beneficiary_location']['longitude'] + random.uniform(-0.005, 0.005)}
    return iv

@api_router.put("/interventions/{intervention_id}")
async def update_intervention(intervention_id: str, data: InterventionUpdate, user=Depends(get_current_user)):
    updates = {}
    if data.status:
        updates['status'] = data.status
        if data.status == 'completed':
            updates['completed_at'] = datetime.now(timezone.utc).isoformat()
    if data.report: updates['report'] = data.report
    if data.latitude and data.longitude:
        updates['intervener_location'] = {"latitude": data.latitude, "longitude": data.longitude}
    if updates:
        await db.interventions.update_one({"id": intervention_id}, {"$set": updates,
            "$push": {"timeline": {"status": data.status or "update", "time": datetime.now(timezone.utc).isoformat(), "note": data.report or "Mise à jour"}}})
    return {"status": "updated"}

# ==================== BACKOFFICE ROUTES ====================
@api_router.get("/backoffice/stats")
async def get_bo_stats():
    return {
        "total_users": await db.users.count_documents({}),
        "beneficiaries": await db.users.count_documents({"role": "beneficiary"}),
        "guardians": await db.users.count_documents({"role": "guardian"}),
        "total_alerts": await db.alerts.count_documents({}),
        "active_alerts": await db.alerts.count_documents({"status": "active"}),
        "prescriptions": await db.prescriptions.count_documents({}),
        "interventions": await db.interventions.count_documents({}),
        "teleconsults": await db.teleconsults.count_documents({}),
    }

@api_router.get("/backoffice/users")
async def get_bo_users():
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users

@api_router.get("/backoffice/alerts")
async def get_bo_alerts():
    return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.get("/backoffice/interventions")
async def get_bo_interventions():
    return await db.interventions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

# ==================== SETUP ====================
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
