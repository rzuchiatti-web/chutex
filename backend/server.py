from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, random, string
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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    role: str = "beneficiary"
    # Beneficiary fields
    date_of_birth: str = ""
    gender: str = ""
    address: str = ""
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: str = ""
    allergies: str = ""
    medical_conditions: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    doctor_name: str = ""
    # Guardian fields
    guardian_type: str = ""  # particular, professional
    structure_name: str = ""
    siret: str = ""
    profession: str = ""
    relationship: str = ""
    prescriber_code: str = ""

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
    mode: str

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

class ActivationCodeCreate(BaseModel):
    structure_name: str
    max_uses: int = 50

class ActivatePrescriberRequest(BaseModel):
    code: str

class TeleassistanceCallUpdate(BaseModel):
    alert_id: str
    step: str  # call_beneficiary, doubt_resolution, call_guardian, dispatch_intervention, resolved
    answers: List[dict] = []
    notes: str = ""
    resolution: str = ""  # resolved, escalate_guardian, dispatch_intervention

# ==================== AUTH ====================
def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h): return bcrypt.checkpw(p.encode(), h.encode())
def create_token(uid, role): return jwt.encode({'user_id': uid, 'role': role, 'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Token manquant")
    try:
        payload = jwt.decode(authorization.split(' ')[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user: raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError: raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError: raise HTTPException(status_code=401, detail="Token invalide")

SAFE_FIELDS = ['id','email','name','phone','role','created_at','beneficiaries','guardians','location_sharing',
    'date_of_birth','gender','address','height_cm','weight_kg','blood_type','allergies','medical_conditions',
    'emergency_contact_name','emergency_contact_phone','doctor_name','guardian_type','structure_name','siret',
    'profession','relationship','is_prescriber','prescriber_structure','prescriber_code_used']

def sanitize_user(u):
    r = {}
    for k in SAFE_FIELDS:
        if k in u: r[k] = u[k]
        elif k in ('beneficiaries','guardians'): r[k] = []
        elif k in ('is_prescriber',): r[k] = False
    return r

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

def gen_data(sim, custom=None):
    if custom: return custom
    d = {}
    for k, (lo, hi) in sim.items():
        d[k] = random.randint(lo, hi) if isinstance(lo, int) and isinstance(hi, int) else round(random.uniform(lo, hi), 1)
    return d

def generate_bracelet_data(c=None): return gen_data(BRACELET_SIM, c)
def generate_scale_data(c=None): return gen_data(SCALE_SIM, c)
def generate_vest_data(): return {"connected": True, "battery": random.randint(20, 100), "fall_detected": False}

def check_anomalies(dt, data):
    a = []
    if dt == "bracelet":
        hr = data.get('heart_rate', 75)
        if hr > 120 or hr < 50: a.append({"severity": "high", "message": f"FC anormale: {hr} bpm"})
        if data.get('spo2', 97) < 92: a.append({"severity": "critical", "message": f"SpO2 bas: {data['spo2']}%"})
        if data.get('temperature', 37) > 38.5: a.append({"severity": "high", "message": f"Temp. élevée: {data['temperature']}°C"})
        if data.get('blood_pressure_systolic', 120) > 160: a.append({"severity": "high", "message": f"Tension élevée: {data['blood_pressure_systolic']}"})
        if data.get('blood_glucose', 100) > 180: a.append({"severity": "high", "message": f"Glycémie élevée: {data['blood_glucose']} mg/dL"})
    elif dt == "vest":
        if data.get('fall_detected'): a.append({"severity": "critical", "message": "Chute détectée!"})
    return a

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(data: UserRegister):
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    uid = str(uuid.uuid4())
    user = {
        "id": uid, "email": data.email, "password_hash": hash_password(data.password),
        "name": data.name, "phone": data.phone, "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "beneficiaries": [], "guardians": [], "location_sharing": "alert_only",
        "date_of_birth": data.date_of_birth, "gender": data.gender, "address": data.address,
        "height_cm": data.height_cm, "weight_kg": data.weight_kg, "blood_type": data.blood_type,
        "allergies": data.allergies, "medical_conditions": data.medical_conditions,
        "emergency_contact_name": data.emergency_contact_name,
        "emergency_contact_phone": data.emergency_contact_phone,
        "doctor_name": data.doctor_name,
        "guardian_type": data.guardian_type, "structure_name": data.structure_name,
        "siret": data.siret, "profession": data.profession, "relationship": data.relationship,
        "is_prescriber": False, "prescriber_structure": "", "prescriber_code_used": "",
    }
    # Auto-activate prescriber if code provided
    if data.role == "guardian" and data.prescriber_code:
        code = await db.activation_codes.find_one({"code": data.prescriber_code, "active": True}, {"_id": 0})
        if code and code.get('uses_count', 0) < code.get('max_uses', 50):
            user['is_prescriber'] = True
            user['prescriber_structure'] = code.get('structure_name', '')
            user['prescriber_code_used'] = data.prescriber_code
            await db.activation_codes.update_one({"code": data.prescriber_code}, {"$inc": {"uses_count": 1}})
    await db.users.insert_one(user)
    if data.role == "beneficiary":
        for dt, nm in [("bracelet","Bracelet Santé"),("scale","Balance Connectée"),("vest","Gilet Anti-Chute")]:
            await db.devices.insert_one({"id": str(uuid.uuid4()), "user_id": uid, "device_type": dt, "name": nm, "connected": False, "battery": random.randint(60, 95), "last_sync": None})
        # Check if phone matches a pending prescription → auto-link
        if data.phone:
            presc = await db.prescriptions.find_one({"beneficiary_phone": data.phone, "status": "pending"}, {"_id": 0})
            if presc:
                await db.prescriptions.update_one({"id": presc['id']}, {"$set": {"status": "subscribed", "beneficiary_id": uid, "subscribed_at": datetime.now(timezone.utc).isoformat()}})
                await db.users.update_one({"id": presc['guardian_id']}, {"$addToSet": {"beneficiaries": uid}})
                await db.users.update_one({"id": uid}, {"$addToSet": {"guardians": presc['guardian_id']}})
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
                  "scale": lambda: generate_scale_data(data.data if data.data else None), "vest": generate_vest_data}
    device_data = generators.get(data.device_type, lambda: data.data)()
    now = datetime.now(timezone.utc).isoformat()
    batt = random.randint(20, 100)
    await db.devices.update_one({"user_id": user['id'], "device_type": data.device_type}, {"$set": {"connected": True, "last_sync": now, "battery": batt}})
    await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user['id'], "device_type": data.device_type, "data": device_data, "timestamp": now})
    anomalies = check_anomalies(data.device_type, device_data)
    for an in anomalies:
        alert_id = str(uuid.uuid4())
        await db.alerts.insert_one({"id": alert_id, "beneficiary_id": user['id'], "beneficiary_name": user['name'],
            "alert_type": "anomaly", "severity": an['severity'], "message": an['message'], "device_type": data.device_type,
            "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending"})
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

# ==================== HEALTH ROUTES ====================
@api_router.get("/health/history/{metric_id}")
async def get_health_history(metric_id: str, user=Depends(get_current_user)):
    dt = "bracelet" if metric_id in BRACELET_SIM else "scale" if metric_id in SCALE_SIM else None
    if not dt: raise HTTPException(status_code=404, detail="Métrique non trouvée")
    readings = await db.device_readings.find({"user_id": user['id'], "device_type": dt}, {"_id": 0}).sort("timestamp", -1).to_list(30)
    history = [{"value": r['data'].get(metric_id), "date": r['timestamp']} for r in reversed(readings) if r['data'].get(metric_id) is not None]
    if len(history) < 7:
        sim = BRACELET_SIM if dt == "bracelet" else SCALE_SIM
        lo, hi = sim[metric_id]
        now = datetime.now(timezone.utc)
        syn = [{"value": round(random.uniform(lo, hi), 1) if isinstance(lo, float) else random.randint(lo, hi), "date": (now - timedelta(days=i)).isoformat()} for i in range(7, 0, -1)]
        history = (syn[:7-len(history)] + history) if history else syn
    vals = [h['value'] for h in history]
    return {"metric_id": metric_id, "history": history[-7:], "stats": {"current": vals[-1] if vals else 0, "average": round(sum(vals)/len(vals), 1) if vals else 0, "min": round(min(vals), 1) if vals else 0, "max": round(max(vals), 1) if vals else 0}}

@api_router.post("/health/thresholds")
async def set_threshold(data: ThresholdUpdate, user=Depends(get_current_user)):
    await db.thresholds.update_one({"user_id": user['id'], "metric_id": data.metric_id},
        {"$set": {"user_id": user['id'], "metric_id": data.metric_id, "min_val": data.min_val, "max_val": data.max_val, "goal": data.goal}}, upsert=True)
    return {"status": "saved"}

@api_router.get("/health/thresholds")
async def get_thresholds(user=Depends(get_current_user)):
    return await db.thresholds.find({"user_id": user['id']}, {"_id": 0}).to_list(200)

@api_router.get("/health/thresholds/{metric_id}")
async def get_threshold(metric_id: str, user=Depends(get_current_user)):
    t = await db.thresholds.find_one({"user_id": user['id'], "metric_id": metric_id}, {"_id": 0})
    return t or {"metric_id": metric_id, "min_val": None, "max_val": None, "goal": None}

# ==================== ALERT ROUTES ====================
@api_router.post("/alerts")
async def create_alert(data: AlertCreate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    alert = {"id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
             "alert_type": data.alert_type, "severity": data.severity, "message": data.message or f"Alerte {data.alert_type}",
             "device_type": data.device_type, "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None,
             "teleassistance_status": "pending"}
    await db.alerts.insert_one(alert)
    return {k: v for k, v in alert.items() if k != '_id'}

@api_router.get("/alerts")
async def get_alerts(user=Depends(get_current_user)):
    if user['role'] in ('teleassistance', 'admin'):
        return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    if user['role'] == 'guardian':
        bids = user.get('beneficiaries', []) + [user['id']]
        return await db.alerts.find({"beneficiary_id": {"$in": bids}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return await db.alerts.find({"beneficiary_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat(), "resolved_by": user['id']}})
    return {"status": "resolved"}

# ==================== MEDICATION ROUTES ====================
@api_router.post("/medications")
async def create_medication(data: MedicationCreate, user=Depends(get_current_user)):
    med = {"id": str(uuid.uuid4()), "user_id": user['id'], "name": data.name, "dosage": data.dosage,
           "frequency": data.frequency, "times": data.times, "notes": data.notes, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.medications.insert_one(med)
    return {k: v for k, v in med.items() if k != '_id'}

@api_router.get("/medications")
async def get_medications(user=Depends(get_current_user)):
    return await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)

@api_router.delete("/medications/{med_id}")
async def delete_medication(med_id: str, user=Depends(get_current_user)):
    await db.medications.update_one({"id": med_id, "user_id": user['id']}, {"$set": {"active": False}})
    return {"status": "deleted"}

# ==================== AI ROUTES ====================
@api_router.post("/ai/recommendations")
async def get_ai_recommendations(user=Depends(get_current_user)):
    latest = {}
    for dt in ["bracelet", "scale"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r: latest[dt] = r['data']
    if not latest:
        return {"recommendation": "Synchronisez vos appareils pour des recommandations.", "generated_at": datetime.now(timezone.utc).isoformat()}
    meds = await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rec-{uuid.uuid4().hex[:8]}",
            system_message="Assistant santé préventive IA. Recommandations en français. Pas de diagnostic."
        ).with_model("openai", "gpt-5.2")
        rec = await chat.send_message(UserMessage(text=f"Données santé {user['name']}: {latest}\nMéds: {[m['name'] for m in meds]}\n4 recommandations courtes en français."))
    except: rec = "• Hydratez-vous (8 verres/jour)\n• 15 min de marche\n• Prenez vos médicaments\n• Repos suffisant"
    await db.recommendations.insert_one({"id": str(uuid.uuid4()), "user_id": user['id'], "recommendation": rec, "generated_at": datetime.now(timezone.utc).isoformat()})
    return {"recommendation": rec, "generated_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/ai/recommendations/latest")
async def get_latest_recommendation(user=Depends(get_current_user)):
    r = await db.recommendations.find_one({"user_id": user['id']}, {"_id": 0}, sort=[("generated_at", -1)])
    return {"recommendation": r['recommendation'] if r else "Synchronisez vos appareils.", "generated_at": r['generated_at'] if r else None}

@api_router.post("/ai/metric-advice")
async def get_metric_advice(body: dict, user=Depends(get_current_user)):
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"adv-{uuid.uuid4().hex[:8]}",
            system_message="Assistant santé. Conseil court (2-3 phrases) en français. Pas de diagnostic."
        ).with_model("openai", "gpt-5.2")
        return {"advice": await chat.send_message(UserMessage(text=f"Conseil: {body.get('metric_name','')} = {body.get('current_value',0)} pour {user['name']}"))}
    except: return {"advice": f"Votre {body.get('metric_name','')} est de {body.get('current_value',0)}. Consultez un professionnel."}

# ==================== TELEASSISTANCE AI CALL PROTOCOL ====================
DOUBT_QUESTIONS = [
    {"id": "d1", "question": "Bonjour, ici le service VitalLink. Comment vous sentez-vous ?", "options": ["Bien, fausse alerte", "Un peu mal", "Très mal", "Je ne peux pas répondre"]},
    {"id": "d2", "question": "Pouvez-vous vous déplacer ?", "options": ["Oui, sans difficulté", "Avec difficulté", "Non, je ne peux pas"]},
    {"id": "d3", "question": "Avez-vous des douleurs ?", "options": ["Non", "Légères", "Modérées", "Sévères"]},
    {"id": "d4", "question": "Avez-vous besoin qu'on contacte vos proches ?", "options": ["Non, tout va bien", "Oui, par précaution", "Oui, c'est urgent"]},
]

GUARDIAN_PROTOCOL = [
    {"id": "g1", "question": "Nous vous contactons pour {beneficiary_name}. Une alerte a été déclenchée: {alert_message}. Pouvez-vous vous rendre sur place ?", "options": ["Oui, j'y vais", "Non, je ne peux pas", "Je contacte quelqu'un d'autre"]},
    {"id": "g2", "question": "Connaissez-vous l'état de santé habituel de cette personne ?", "options": ["Oui, c'est normal", "Non, c'est inhabituel", "Je ne sais pas"]},
]

@api_router.get("/teleassistance/protocol/beneficiary")
async def get_beneficiary_protocol():
    return DOUBT_QUESTIONS

@api_router.get("/teleassistance/protocol/guardian")
async def get_guardian_protocol():
    return GUARDIAN_PROTOCOL

@api_router.post("/teleassistance/call")
async def process_teleassistance_call(data: TeleassistanceCallUpdate, user=Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert: raise HTTPException(status_code=404, detail="Alerte non trouvée")
    now = datetime.now(timezone.utc).isoformat()
    call_log = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id,
        "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
        "operator_id": user['id'], "operator_name": user['name'],
        "step": data.step, "answers": data.answers, "notes": data.notes,
        "resolution": data.resolution, "created_at": now,
    }
    await db.teleassistance_calls.insert_one(call_log)
    # Update alert teleassistance status
    ta_status = "resolved" if data.resolution == "resolved" else "guardian_called" if data.resolution == "escalate_guardian" else "intervention_dispatched" if data.resolution == "dispatch_intervention" else "in_progress"
    await db.alerts.update_one({"id": data.alert_id}, {"$set": {"teleassistance_status": ta_status}})
    if data.resolution == "resolved":
        await db.alerts.update_one({"id": data.alert_id}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id']}})
    # AI analysis of the call
    ai_analysis = ""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"ta-{uuid.uuid4().hex[:8]}",
            system_message="Tu analyses les appels de téléassistance. Donne une synthèse courte (2 phrases) en français."
        ).with_model("openai", "gpt-5.2")
        ai_analysis = await chat.send_message(UserMessage(text=f"Appel pour {alert['beneficiary_name']}, alerte: {alert['message']}. Réponses: {data.answers}. Résolution: {data.resolution}. Notes: {data.notes}"))
    except: ai_analysis = "Analyse non disponible."
    return {k: v for k, v in call_log.items() if k != '_id', **{"ai_analysis": ai_analysis}}

@api_router.get("/teleassistance/calls")
async def get_teleassistance_calls(user=Depends(get_current_user)):
    return await db.teleassistance_calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/teleassistance/subscribers")
async def get_all_subscribers():
    bens = await db.users.find({"role": "beneficiary"}, {"_id": 0, "password_hash": 0}).to_list(500)
    for b in bens:
        latest = await db.device_readings.find_one({"user_id": b['id'], "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
        ac = await db.alerts.count_documents({"beneficiary_id": b['id'], "status": "active"})
        b['latest_vitals'] = latest['data'] if latest else None
        b['active_alerts'] = ac
    return bens

# ==================== LOCATION ROUTES ====================
@api_router.post("/location/update")
async def update_location(data: LocationUpdate, user=Depends(get_current_user)):
    await db.locations.update_one({"user_id": user['id']}, {"$set": {"user_id": user['id'], "latitude": data.latitude, "longitude": data.longitude, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"status": "updated"}

@api_router.get("/location/{user_id}")
async def get_location(user_id: str, user=Depends(get_current_user)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target: raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    sharing = target.get('location_sharing', 'alert_only')
    if sharing == 'never' and user['id'] != user_id and user['role'] not in ('admin','teleassistance'):
        raise HTTPException(status_code=403, detail="Localisation non partagée")
    loc = await db.locations.find_one({"user_id": user_id}, {"_id": 0})
    if not loc: loc = {"user_id": user_id, "latitude": 48.8566 + random.uniform(-0.05, 0.05), "longitude": 2.3522 + random.uniform(-0.05, 0.05), "updated_at": datetime.now(timezone.utc).isoformat()}
    return loc

@api_router.put("/location/sharing")
async def update_sharing(data: LocationSharingUpdate, user=Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"location_sharing": data.mode}})
    return {"status": "updated", "mode": data.mode}

# ==================== GUARDIAN / PRESCRIBER ROUTES ====================
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
    result = []
    for bid in cu.get('beneficiaries', []):
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            latest = await db.device_readings.find_one({"user_id": bid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
            ac = await db.alerts.count_documents({"beneficiary_id": bid, "status": "active"})
            b['latest_vitals'] = latest['data'] if latest else None
            b['active_alerts'] = ac
            b['last_sync'] = latest['timestamp'] if latest else None
            result.append(b)
    return result

@api_router.post("/guardian/prescriptions")
async def create_prescription(data: PrescriptionCreate, user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    if not user.get('is_prescriber'): raise HTTPException(status_code=403, detail="Mode prescripteur non activé. Entrez un code d'activation.")
    p = {"id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
         "prescriber_structure": user.get('prescriber_structure', ''),
         "beneficiary_name": data.beneficiary_name, "beneficiary_email": data.beneficiary_email,
         "beneficiary_phone": data.beneficiary_phone, "subscription_type": data.subscription_type,
         "notes": data.notes, "status": "pending", "beneficiary_id": None, "subscribed_at": None,
         "commission": 15.0 if data.subscription_type == "standard" else 25.0,
         "tracking_phone": data.beneficiary_phone, "tracking_email": data.beneficiary_email,
         "created_at": datetime.now(timezone.utc).isoformat(),
         "notification_sent": True, "notification_type": "sms_email"}
    await db.prescriptions.insert_one(p)
    return {k: v for k, v in p.items() if k != '_id'}

@api_router.get("/guardian/prescriptions")
async def get_prescriptions(user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    return await db.prescriptions.find({"guardian_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/guardian/activate-prescriber")
async def activate_prescriber(data: ActivatePrescriberRequest, user=Depends(get_current_user)):
    if user['role'] != 'guardian': raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    code = await db.activation_codes.find_one({"code": data.code, "active": True}, {"_id": 0})
    if not code: raise HTTPException(status_code=404, detail="Code invalide ou expiré")
    if code.get('uses_count', 0) >= code.get('max_uses', 50):
        raise HTTPException(status_code=400, detail="Code épuisé (nombre max d'utilisations atteint)")
    await db.users.update_one({"id": user['id']}, {"$set": {"is_prescriber": True, "prescriber_structure": code['structure_name'], "prescriber_code_used": data.code}})
    await db.activation_codes.update_one({"code": data.code}, {"$inc": {"uses_count": 1}})
    return {"status": "activated", "structure": code['structure_name']}

# ==================== TELECONSULTATION ROUTES ====================
TELECONSULT_QUESTIONS = [
    {"id": "q1", "question": "Quel est le motif de votre consultation ?", "type": "choice", "options": ["Douleur ou gêne", "Suivi de traitement", "Renouvellement ordonnance", "Question de santé", "Urgence ressentie"]},
    {"id": "q2", "question": "Depuis quand ressentez-vous ces symptômes ?", "type": "choice", "options": ["Aujourd'hui", "Quelques jours", "Une semaine ou plus", "Chronique"]},
    {"id": "q3", "question": "Niveau de douleur/gêne ?", "type": "scale", "min": 0, "max": 10},
    {"id": "q4", "question": "Avez-vous de la fièvre ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q5", "question": "Prenez-vous des médicaments ?", "type": "choice", "options": ["Oui", "Non"]},
    {"id": "q6", "question": "Avez-vous des allergies ?", "type": "choice", "options": ["Oui", "Non", "Je ne sais pas"]},
    {"id": "q7", "question": "Précisions supplémentaires ?", "type": "text"},
]

@api_router.get("/teleconsult/questions")
async def get_teleconsult_questions(): return TELECONSULT_QUESTIONS

@api_router.post("/teleconsult/submit")
async def submit_teleconsult(data: TeleconsultSubmit, user=Depends(get_current_user)):
    c = {"id": str(uuid.uuid4()), "user_id": user['id'], "user_name": user['name'], "answers": data.answers, "notes": data.notes,
         "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(), "call_number": "+33 1 23 45 67 89"}
    await db.teleconsults.insert_one(c)
    return {k: v for k, v in c.items() if k != '_id'}

@api_router.get("/teleconsult/history")
async def get_teleconsult_history(user=Depends(get_current_user)):
    return await db.teleconsults.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(50)

# ==================== INTERVENTION ROUTES ====================
@api_router.post("/interventions")
async def create_intervention(data: InterventionCreate, user=Depends(get_current_user)):
    ben = await db.users.find_one({"id": data.beneficiary_id}, {"_id": 0})
    loc = await db.locations.find_one({"user_id": data.beneficiary_id}, {"_id": 0})
    iv = {"id": str(uuid.uuid4()), "alert_id": data.alert_id, "beneficiary_id": data.beneficiary_id,
          "beneficiary_name": ben['name'] if ben else "Inconnu", "assigned_to": user['id'], "assigned_name": user['name'],
          "status": "en_route", "notes": data.notes,
          "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566, "longitude": loc['longitude'] if loc else 2.3522},
          "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
          "created_at": datetime.now(timezone.utc).isoformat(), "completed_at": None, "report": None,
          "timeline": [{"status": "created", "time": datetime.now(timezone.utc).isoformat(), "note": "Intervention créée"}]}
    await db.interventions.insert_one(iv)
    return {k: v for k, v in iv.items() if k != '_id'}

@api_router.get("/interventions")
async def get_interventions(user=Depends(get_current_user)):
    if user['role'] in ('admin', 'teleassistance'):
        return await db.interventions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    if user['role'] == 'guardian':
        cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
        bids = cu.get('beneficiaries', [])
        return await db.interventions.find({"$or": [{"assigned_to": user['id']}, {"beneficiary_id": {"$in": bids}}]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return await db.interventions.find({"beneficiary_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.get("/interventions/{iid}")
async def get_intervention(iid: str, user=Depends(get_current_user)):
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv: raise HTTPException(status_code=404, detail="Non trouvée")
    iv['intervener_location'] = {"latitude": iv['beneficiary_location']['latitude'] + random.uniform(-0.005, 0.005), "longitude": iv['beneficiary_location']['longitude'] + random.uniform(-0.005, 0.005)}
    return iv

@api_router.put("/interventions/{iid}")
async def update_intervention(iid: str, data: InterventionUpdate, user=Depends(get_current_user)):
    u = {}
    if data.status:
        u['status'] = data.status
        if data.status == 'completed': u['completed_at'] = datetime.now(timezone.utc).isoformat()
    if data.report: u['report'] = data.report
    if u:
        await db.interventions.update_one({"id": iid}, {"$set": u, "$push": {"timeline": {"status": data.status or "update", "time": datetime.now(timezone.utc).isoformat(), "note": data.report or "MAJ"}}})
    return {"status": "updated"}

# ==================== ACTIVATION CODES (ADMIN) ====================
@api_router.post("/admin/activation-codes")
async def create_activation_code(data: ActivationCodeCreate, user=Depends(get_current_user)):
    if user['role'] != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    doc = {"id": str(uuid.uuid4()), "code": code, "structure_name": data.structure_name, "max_uses": data.max_uses,
           "uses_count": 0, "active": True, "created_at": datetime.now(timezone.utc).isoformat(), "created_by": user['id']}
    await db.activation_codes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/admin/activation-codes")
async def get_activation_codes(user=Depends(get_current_user)):
    if user['role'] != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    return await db.activation_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.delete("/admin/activation-codes/{code_id}")
async def deactivate_code(code_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    await db.activation_codes.update_one({"id": code_id}, {"$set": {"active": False}})
    return {"status": "deactivated"}

# ==================== BACKOFFICE ROUTES ====================
@api_router.get("/backoffice/stats")
async def get_bo_stats():
    return {
        "total_users": await db.users.count_documents({}), "beneficiaries": await db.users.count_documents({"role": "beneficiary"}),
        "guardians": await db.users.count_documents({"role": "guardian"}), "prescribers": await db.users.count_documents({"is_prescriber": True}),
        "total_alerts": await db.alerts.count_documents({}), "active_alerts": await db.alerts.count_documents({"status": "active"}),
        "prescriptions": await db.prescriptions.count_documents({}), "subscribed_prescriptions": await db.prescriptions.count_documents({"status": "subscribed"}),
        "interventions": await db.interventions.count_documents({}), "teleconsults": await db.teleconsults.count_documents({}),
        "teleassistance_calls": await db.teleassistance_calls.count_documents({}), "activation_codes": await db.activation_codes.count_documents({"active": True}),
    }

@api_router.get("/backoffice/users")
async def get_bo_users(): return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)

@api_router.get("/backoffice/alerts")
async def get_bo_alerts(): return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.get("/backoffice/interventions")
async def get_bo_interventions(): return await db.interventions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/backoffice/prescriptions")
async def get_bo_prescriptions(): return await db.prescriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

# ==================== SETUP ====================
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client(): client.close()
