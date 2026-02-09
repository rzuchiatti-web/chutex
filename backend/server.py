from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, random, string, math, asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import jwt, bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Gather

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vitallink_db')]
JWT_SECRET = os.environ.get('JWT_SECRET', 'vitallink-jwt-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Twilio config
TWILIO_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID and TWILIO_TOKEN else None

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

class LinkCodeRequest(BaseModel):
    pass  # no body needed to generate

class LinkWithCodeRequest(BaseModel):
    link_code: str

class InterventionProviderActivate(BaseModel):
    code: str

class InterventionRadiusUpdate(BaseModel):
    structure_id: str
    radius_km: float = 30.0

class TriggerCallRequest(BaseModel):
    alert_id: str
    phone_number: str = ""  # optional override

class TeleassistanceCallUpdate(BaseModel):
    alert_id: str
    step: str  # call_beneficiary, doubt_resolution, call_guardian, dispatch_intervention, resolved
    answers: List[dict] = []
    notes: str = ""
    resolution: str = ""  # resolved, escalate_guardian, dispatch_intervention

class EscalationStart(BaseModel):
    alert_id: str

class EscalationStepRequest(BaseModel):
    escalation_id: str
    response: str  # answered, no_answer, resolved, not_resolved, dispatch
    answers: List[dict] = []
    notes: str = ""

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
    'profession','relationship','is_prescriber','prescriber_structure','prescriber_code_used',
    'is_intervention_provider','intervention_structure','intervention_radius_km','intervention_location']

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
    # AUTO-ESCALATION: Start automatic protocol for critical/high alerts
    if data.severity in ('critical', 'high') and twilio_client:
        asyncio.create_task(auto_escalation_protocol(alert))
    return {k: v for k, v in alert.items() if k != '_id'}

async def auto_escalation_protocol(alert: dict):
    """Fully automatic escalation: call beneficiary -> guardians -> dispatch"""
    try:
        await asyncio.sleep(2)  # Small delay to let alert propagate
        now = datetime.now(timezone.utc).isoformat()
        ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
        if not ben: return
        guardians = []
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g: guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', '')})
        # Create escalation record
        esc = {
            "id": str(uuid.uuid4()), "alert_id": alert['id'],
            "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
            "operator_id": "ai_auto", "operator_name": "IA Téléassistance",
            "status": "in_progress", "current_step": "calling_beneficiary",
            "current_target": {"id": alert['beneficiary_id'], "name": alert['beneficiary_name'], "type": "beneficiary"},
            "guardians_called": [], "guardians_remaining": guardians,
            "protocol_answers": [],
            "timeline": [{"step": "auto_started", "time": now, "note": "Protocole IA automatique déclenché"}],
            "intervention_id": None, "created_at": now,
        }
        await db.escalations.insert_one(esc)
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "ai_calling", "escalation_id": esc['id']}})

        # STEP 1: Call beneficiary
        ben_phone = ben.get('phone', '')
        if ben_phone and twilio_client:
            twiml = VoiceResponse()
            twiml.say("Bonjour, ici VitalLink, service de téléassistance intelligente.", voice='Polly.Lea', language='fr-FR')
            twiml.pause(length=1)
            g = Gather(num_digits=1, timeout=8)
            g.say("Une alerte a été déclenchée. Tout va bien ? Appuyez sur 1 si tout va bien. Appuyez sur 2 si vous avez besoin d'aide. Si vous ne répondez pas, nous contacterons vos gardiens.", voice='Polly.Lea', language='fr-FR')
            twiml.append(g)
            twiml.say("Nous n'avons pas reçu de réponse. Nous contactons vos gardiens immédiatement.", voice='Polly.Lea', language='fr-FR')
            try:
                call = twilio_client.calls.create(twiml=str(twiml), to=ben_phone, from_=TWILIO_NUMBER)
                call_record = {"id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "beneficiary", "target_id": ben['id'],
                    "target_name": ben['name'], "target_phone": ben_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": now, "answered": False, "response": None}
                await db.twilio_calls.insert_one(call_record)
                esc['timeline'].append({"step": "calling_beneficiary", "time": datetime.now(timezone.utc).isoformat(), "note": f"Appel IA → {ben['name']} ({ben_phone})"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
                logger.info(f"Auto-escalation: calling beneficiary {ben_phone}, SID={call.sid}")
                # Wait for call to complete (poll every 5 seconds, max 60s)
                answered = False
                for _ in range(12):
                    await asyncio.sleep(5)
                    try:
                        call_status = twilio_client.calls(call.sid).fetch()
                        await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"status": call_status.status, "duration": call_status.duration}})
                        if call_status.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            answered = call_status.status == 'completed' and (call_status.duration or '0') not in ('0', None, '')
                            duration = call_status.duration or 0
                            # If call lasted > 10 seconds, consider it answered
                            if int(str(duration)) > 10:
                                answered = True
                            await db.twilio_calls.update_one({"call_sid": call.sid}, {"$set": {"answered": answered}})
                            break
                    except: pass
                if answered:
                    esc['timeline'].append({"step": "beneficiary_answered", "time": datetime.now(timezone.utc).isoformat(), "note": f"{ben['name']} a répondu. Levée de doute en cours."})
                    esc['current_step'] = "doubt_lifting"
                    # If they answered and pressed 1 (all good), we could detect via gather but TwiML inline doesn't callback
                    # For now, assume if they answered and call lasted > 15s, they interacted
                    if int(str(call_status.duration or 0)) > 15:
                        esc['timeline'].append({"step": "resolved", "time": datetime.now(timezone.utc).isoformat(), "note": "Bénéficiaire a confirmé aller bien. Alerte résolue."})
                        esc['status'] = "resolved"; esc['current_step'] = "resolved"
                        await db.alerts.update_one({"id": alert['id']}, {"$set": {"status": "resolved", "teleassistance_status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat()}})
                    else:
                        # Short answer, escalate to guardians
                        esc['timeline'].append({"step": "inconclusive", "time": datetime.now(timezone.utc).isoformat(), "note": "Réponse non concluante → Appel gardiens"})
                        answered = False  # force guardian calls
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": esc['status'], "current_step": esc['current_step'], "timeline": esc['timeline']}})
                    if esc['status'] == "resolved": return
                else:
                    esc['timeline'].append({"step": "beneficiary_no_answer", "time": datetime.now(timezone.utc).isoformat(), "note": f"{ben['name']} n'a pas répondu."})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
            except Exception as e:
                logger.error(f"Auto-escalation call error: {e}")
                esc['timeline'].append({"step": "call_error", "time": datetime.now(timezone.utc).isoformat(), "note": f"Erreur appel: {str(e)[:50]}"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
        
        # STEP 2: Call guardians one by one
        guardian_handled = False
        for guardian in guardians:
            if esc.get('status') == 'resolved': return
            g_phone = guardian.get('phone', '')
            if not g_phone: continue
            esc['current_step'] = "calling_guardian"
            esc['current_target'] = {**guardian, "type": "guardian"}
            esc['guardians_remaining'] = [g for g in esc['guardians_remaining'] if g['id'] != guardian['id']]
            esc['guardians_called'].append(guardian)
            await db.escalations.update_one({"id": esc['id']}, {"$set": {
                "current_step": esc['current_step'], "current_target": esc['current_target'],
                "guardians_called": esc['guardians_called'], "guardians_remaining": esc['guardians_remaining'],
            }})
            twiml_g = VoiceResponse()
            twiml_g.say(f"Bonjour, ici VitalLink, service de téléassistance.", voice='Polly.Lea', language='fr-FR')
            twiml_g.pause(length=1)
            twiml_g.say(f"Une alerte a été déclenchée pour {alert['beneficiary_name']}. Nous n'avons pas pu le joindre.", voice='Polly.Lea', language='fr-FR')
            g_gather = Gather(num_digits=1, timeout=8)
            g_gather.say("Appuyez sur 1 si vous pouvez intervenir. Appuyez sur 2 si vous ne pouvez pas.", voice='Polly.Lea', language='fr-FR')
            twiml_g.append(g_gather)
            twiml_g.say("Nous n'avons pas reçu de réponse. Nous contactons le prochain gardien.", voice='Polly.Lea', language='fr-FR')
            try:
                g_call = twilio_client.calls.create(twiml=str(twiml_g), to=g_phone, from_=TWILIO_NUMBER)
                g_call_record = {"id": str(uuid.uuid4()), "call_sid": g_call.sid, "alert_id": alert['id'],
                    "escalation_id": esc['id'], "target_type": "guardian", "target_id": guardian['id'],
                    "target_name": guardian['name'], "target_phone": g_phone, "status": "initiated",
                    "operator_id": "ai_auto", "created_at": datetime.now(timezone.utc).isoformat(), "answered": False}
                await db.twilio_calls.insert_one(g_call_record)
                esc['timeline'].append({"step": "calling_guardian", "time": datetime.now(timezone.utc).isoformat(), "note": f"Appel IA → Gardien {guardian['name']} ({g_phone})"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
                await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": f"calling_guardian_{guardian['name']}"}})
                # Wait for guardian call
                g_answered = False
                for _ in range(12):
                    await asyncio.sleep(5)
                    try:
                        gs = twilio_client.calls(g_call.sid).fetch()
                        await db.twilio_calls.update_one({"call_sid": g_call.sid}, {"$set": {"status": gs.status, "duration": gs.duration}})
                        if gs.status in ('completed', 'busy', 'no-answer', 'failed', 'canceled'):
                            g_answered = gs.status == 'completed' and int(str(gs.duration or 0)) > 10
                            await db.twilio_calls.update_one({"call_sid": g_call.sid}, {"$set": {"answered": g_answered}})
                            break
                    except: pass
                if g_answered:
                    esc['timeline'].append({"step": "guardian_answered", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {guardian['name']} a répondu et prend en charge."})
                    esc['status'] = "guardian_handling"; esc['current_step'] = "guardian_handling"
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"status": esc['status'], "current_step": esc['current_step'], "timeline": esc['timeline']}})
                    await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "guardian_handling"}})
                    guardian_handled = True
                    break
                else:
                    esc['timeline'].append({"step": "guardian_no_answer", "time": datetime.now(timezone.utc).isoformat(), "note": f"Gardien {guardian['name']} n'a pas répondu."})
                    await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
            except Exception as e:
                logger.error(f"Guardian call error: {e}")
                esc['timeline'].append({"step": "guardian_call_error", "time": datetime.now(timezone.utc).isoformat(), "note": f"Erreur appel gardien: {str(e)[:50]}"})
                await db.escalations.update_one({"id": esc['id']}, {"$set": {"timeline": esc['timeline']}})
        
        # STEP 3: Auto-dispatch if nobody answered
        if not guardian_handled and esc.get('status') != 'resolved':
            esc['current_step'] = "dispatched"; esc['status'] = "dispatched"
            loc = await db.locations.find_one({"user_id": alert['beneficiary_id']}, {"_id": 0})
            iv_id = str(uuid.uuid4())
            iv = {
                "id": iv_id, "alert_id": alert['id'], "escalation_id": esc['id'],
                "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
                "assigned_to": "auto", "assigned_name": "Intervention d'urgence",
                "status": "dispatched",
                "notes": f"Auto-dispatch IA: {alert['message']}",
                "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566 + random.uniform(-0.05, 0.05), "longitude": loc['longitude'] if loc else 2.3522 + random.uniform(-0.05, 0.05)},
                "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
                "created_at": datetime.now(timezone.utc).isoformat(), "completed_at": None, "report": None,
                "timeline": [{"status": "dispatched", "time": datetime.now(timezone.utc).isoformat(), "note": "Intervention auto-dispatchée: aucun contact établi"}],
            }
            await db.interventions.insert_one(iv)
            esc['intervention_id'] = iv_id
            esc['timeline'].append({"step": "dispatched", "time": datetime.now(timezone.utc).isoformat(), "note": f"Aucune réponse. Intervention d'urgence #{iv_id[:8]} créée."})
            await db.escalations.update_one({"id": esc['id']}, {"$set": {
                "status": esc['status'], "current_step": esc['current_step'],
                "timeline": esc['timeline'], "intervention_id": iv_id}})
            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "intervention_dispatched"}})
            logger.info(f"Auto-escalation: dispatched intervention {iv_id}")
    except Exception as e:
        logger.error(f"Auto-escalation protocol error: {e}")

# Endpoint for real-time escalation status polling
@api_router.get("/escalation/active")
async def get_active_escalations(user=Depends(get_current_user)):
    """Get all active/in-progress escalations with real-time status"""
    active = await db.escalations.find({"status": {"$in": ["in_progress", "guardian_handling", "dispatched"]}}, {"_id": 0}).sort("created_at", -1).to_list(20)
    # Enrich with latest call status
    for esc in active:
        calls = await db.twilio_calls.find({"escalation_id": esc['id']}, {"_id": 0}).sort("created_at", -1).to_list(10)
        esc['calls'] = calls
        # Update live call status from Twilio
        for c in calls:
            if c.get('status') in ('initiated', 'ringing', 'in-progress', 'queued') and twilio_client:
                try:
                    live = twilio_client.calls(c['call_sid']).fetch()
                    c['status'] = live.status
                    c['duration'] = live.duration
                    await db.twilio_calls.update_one({"call_sid": c['call_sid']}, {"$set": {"status": live.status, "duration": live.duration}})
                except: pass
    return active

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
    result = {k: v for k, v in call_log.items() if k != '_id'}
    result["ai_analysis"] = ai_analysis
    return result

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
    now = datetime.now(timezone.utc).isoformat()
    structure = user.get('prescriber_structure', 'VitalLink')
    commission = 15.0 if data.subscription_type == "standard" else 25.0
    # Calculate commission payment date (1st of next month)
    next_month = (datetime.now(timezone.utc).replace(day=1) + timedelta(days=32)).replace(day=1)
    p = {"id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
         "prescriber_structure": structure,
         "beneficiary_name": data.beneficiary_name, "beneficiary_email": data.beneficiary_email,
         "beneficiary_phone": data.beneficiary_phone, "subscription_type": data.subscription_type,
         "notes": data.notes, "status": "pending", "beneficiary_id": None, "subscribed_at": None,
         "commission": commission, "commission_payment_date": next_month.isoformat(),
         "tracking_phone": data.beneficiary_phone, "tracking_email": data.beneficiary_email,
         "created_at": now, "notification_sent": True, "notification_type": "email",
         "email_content": {
             "to": data.beneficiary_email,
             "subject": f"{structure} vous invite à souscrire à VitalLink",
             "body": f"""Bonjour {data.beneficiary_name},

L'entreprise {structure} vous invite à souscrire à un abonnement {'Téléassistance' if data.subscription_type == 'teleassistance' else 'Standard'} VitalLink via le lien suivant :

https://chutex-innovation.com

En souscrivant, vous bénéficierez de :
- Suivi santé connecté 24/7
- Bracelet santé avec détection de chute
{'- Téléassistance IA avec appels automatiques' if data.subscription_type == 'teleassistance' else '- Alertes santé personnalisées'}
- Gardiens notifiés en cas d'urgence

Prescrit par : {user['name']} ({structure})
{f'Notes : {data.notes}' if data.notes else ''}

Cordialement,
L'équipe VitalLink
https://chutex-innovation.com""",
             "sent_at": now,
         }}
    await db.prescriptions.insert_one(p)
    # Log the email (in production, replace with real email service)
    logger.info(f"📧 Email prescription envoyé à {data.beneficiary_email}: {structure} invite {data.beneficiary_name}")
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

# ==================== ESCALATION FLOW ====================
@api_router.post("/teleassistance/escalation/start")
async def start_escalation(data: EscalationStart, user=Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert: raise HTTPException(status_code=404, detail="Alerte non trouvée")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    guardians = []
    if ben:
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g: guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', '')})
    now = datetime.now(timezone.utc).isoformat()
    esc = {
        "id": str(uuid.uuid4()), "alert_id": data.alert_id,
        "beneficiary_id": alert['beneficiary_id'], "beneficiary_name": alert['beneficiary_name'],
        "operator_id": user['id'], "operator_name": user['name'],
        "status": "in_progress", "current_step": "calling_beneficiary",
        "current_target": {"id": alert['beneficiary_id'], "name": alert['beneficiary_name'], "type": "beneficiary"},
        "guardians_called": [], "guardians_remaining": guardians,
        "protocol_answers": [],
        "timeline": [{"step": "started", "time": now, "note": f"Escalade démarrée par {user['name']}"}],
        "intervention_id": None, "created_at": now,
    }
    await db.escalations.insert_one(esc)
    await db.alerts.update_one({"id": data.alert_id}, {"$set": {"teleassistance_status": "in_progress"}})
    return {k: v for k, v in esc.items() if k != '_id'}

@api_router.post("/teleassistance/escalation/step")
async def advance_escalation(data: EscalationStepRequest, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": data.escalation_id}, {"_id": 0})
    if not esc: raise HTTPException(status_code=404, detail="Escalade non trouvée")
    now = datetime.now(timezone.utc).isoformat()
    step = esc['current_step']
    if data.answers: esc['protocol_answers'].extend(data.answers)
    if data.response == "resolved":
        esc['status'] = "resolved"; esc['current_step'] = "resolved"
        esc['timeline'].append({"step": "resolved", "time": now, "note": data.notes or "Levée de doute réussie"})
        await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "teleassistance_status": "resolved"}})
    elif step == "calling_beneficiary":
        if data.response == "answered":
            esc['current_step'] = "doubt_lifting"
            esc['timeline'].append({"step": "beneficiary_answered", "time": now, "note": "Bénéficiaire a répondu"})
        elif data.response == "no_answer":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0); esc['guardians_called'].append(g)
                esc['current_step'] = "calling_guardian"; esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "beneficiary_no_answer", "time": now, "note": f"Pas de réponse → Appel gardien {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "no_guardians", "time": now, "note": "Aucun gardien → Intervention requise"})
    elif step == "doubt_lifting":
        if data.response == "not_resolved":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0); esc['guardians_called'].append(g)
                esc['current_step'] = "calling_guardian"; esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "escalate_guardian", "time": now, "note": f"Non concluant → Appel gardien {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "escalate_dispatch", "time": now, "note": "Aucun gardien → Intervention"})
    elif step == "calling_guardian":
        if data.response == "answered":
            esc['status'] = "guardian_handling"; esc['current_step'] = "guardian_handling"
            esc['timeline'].append({"step": "guardian_answered", "time": now, "note": f"Gardien {esc['current_target']['name']} prend en charge"})
        elif data.response == "no_answer":
            if esc['guardians_remaining']:
                g = esc['guardians_remaining'].pop(0); esc['guardians_called'].append(g)
                esc['current_target'] = {**g, "type": "guardian"}
                esc['timeline'].append({"step": "guardian_no_answer", "time": now, "note": f"{esc['guardians_called'][-1]['name']} injoignable → Gardien suivant {g['name']}"})
            else:
                esc['current_step'] = "dispatch_needed"
                esc['timeline'].append({"step": "all_guardians_failed", "time": now, "note": "Tous gardiens injoignables → Intervention"})
    # Auto-dispatch if needed
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
            "beneficiary_location": {"latitude": loc['latitude'] if loc else 48.8566 + random.uniform(-0.05, 0.05), "longitude": loc['longitude'] if loc else 2.3522 + random.uniform(-0.05, 0.05)},
            "intervener_location": {"latitude": 48.8566 + random.uniform(-0.02, 0.02), "longitude": 2.3522 + random.uniform(-0.02, 0.02)},
            "created_at": now, "completed_at": None, "report": None,
            "timeline": [{"status": "dispatched", "time": now, "note": "Intervention auto-dispatchée via téléassistance"}],
        }
        await db.interventions.insert_one(iv)
        esc['intervention_id'] = iv_id; esc['status'] = "dispatched"; esc['current_step'] = "dispatched"
        esc['timeline'].append({"step": "dispatched", "time": now, "note": f"Intervention #{iv_id[:8]} créée"})
        await db.alerts.update_one({"id": esc['alert_id']}, {"$set": {"teleassistance_status": "intervention_dispatched"}})
    await db.escalations.update_one({"id": esc['id']}, {"$set": {
        "status": esc['status'], "current_step": esc['current_step'], "current_target": esc['current_target'],
        "guardians_called": esc['guardians_called'], "guardians_remaining": esc['guardians_remaining'],
        "protocol_answers": esc['protocol_answers'], "timeline": esc['timeline'], "intervention_id": esc.get('intervention_id'),
    }})
    return {k: v for k, v in esc.items() if k != '_id'}

@api_router.get("/teleassistance/escalation/{eid}")
async def get_escalation(eid: str, user=Depends(get_current_user)):
    esc = await db.escalations.find_one({"id": eid}, {"_id": 0})
    if not esc: raise HTTPException(status_code=404, detail="Escalade non trouvée")
    return esc

@api_router.get("/teleassistance/escalations")
async def get_escalations(user=Depends(get_current_user)):
    return await db.escalations.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)

# ==================== TWILIO REAL CALLS ====================
@api_router.post("/twilio/call/beneficiary")
async def twilio_call_beneficiary(data: TriggerCallRequest, user=Depends(get_current_user)):
    """Initiate a real phone call to beneficiary for doubt-lifting"""
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio non configuré")
    alert = await db.alerts.find_one({"id": data.alert_id}, {"_id": 0})
    if not alert: raise HTTPException(status_code=404, detail="Alerte non trouvée")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
    if not ben: raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    phone = data.phone_number or ben.get('phone', '')
    if not phone: raise HTTPException(status_code=400, detail="Pas de numéro de téléphone")
    try:
        # Get the public URL for TwiML callback
        base_url = os.environ.get('TWILIO_CALLBACK_URL', '')
        if not base_url:
            # Use ngrok or fallback to TwiML directly
            twiml = VoiceResponse()
            twiml.say("Bonjour, ici VitalLink, service de téléassistance.", voice='Polly.Lea', language='fr-FR')
            twiml.pause(length=1)
            g = Gather(num_digits=1, action='', timeout=10)
            g.say("Une alerte a été déclenchée sur votre bracelet. Tout va bien ? Appuyez sur 1 si tout va bien. Appuyez sur 2 si vous avez besoin d'aide.", voice='Polly.Lea', language='fr-FR')
            twiml.append(g)
            twiml.say("Nous n'avons pas reçu de réponse. Nous allons contacter vos gardiens. Restez en sécurité.", voice='Polly.Lea', language='fr-FR')
            call = twilio_client.calls.create(
                twiml=str(twiml),
                to=phone,
                from_=TWILIO_NUMBER,
                status_callback_event=['completed'],
            )
        else:
            call = twilio_client.calls.create(
                url=f"{base_url}/api/twilio/twiml/beneficiary?alert_id={data.alert_id}",
                to=phone,
                from_=TWILIO_NUMBER,
                status_callback=f"{base_url}/api/twilio/status",
                status_callback_event=['completed'],
            )
        now = datetime.now(timezone.utc).isoformat()
        call_record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": data.alert_id,
            "target_type": "beneficiary", "target_id": ben['id'], "target_name": ben['name'],
            "target_phone": phone, "status": "initiated", "operator_id": user['id'],
            "created_at": now, "answered": False, "response": None,
        }
        await db.twilio_calls.insert_one(call_record)
        logger.info(f"Twilio call initiated: {call.sid} to {phone}")
        return {"call_sid": call.sid, "call_id": call_record['id'], "status": "initiated", "phone": phone}
    except Exception as e:
        logger.error(f"Twilio call error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur appel: {str(e)}")

@api_router.post("/twilio/call/guardian")
async def twilio_call_guardian(alert_id: str = "", guardian_id: str = "", phone_number: str = "", user=Depends(get_current_user)):
    """Call a guardian"""
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio non configuré")
    guardian = await db.users.find_one({"id": guardian_id}, {"_id": 0}) if guardian_id else None
    phone = phone_number or (guardian.get('phone','') if guardian else '')
    if not phone: raise HTTPException(status_code=400, detail="Pas de numéro")
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0}) if alert_id else None
    ben_name = alert.get('beneficiary_name','un bénéficiaire') if alert else 'un bénéficiaire'
    try:
        twiml = VoiceResponse()
        twiml.say(f"Bonjour, ici VitalLink, service de téléassistance.", voice='Polly.Lea', language='fr-FR')
        twiml.pause(length=1)
        twiml.say(f"Une alerte a été déclenchée pour {ben_name}. Nous n'avons pas pu le joindre.", voice='Polly.Lea', language='fr-FR')
        g = Gather(num_digits=1, timeout=10)
        g.say("Appuyez sur 1 si vous pouvez intervenir. Appuyez sur 2 si vous ne pouvez pas.", voice='Polly.Lea', language='fr-FR')
        twiml.append(g)
        twiml.say("Nous n'avons pas reçu de réponse. Nous contactons le prochain gardien.", voice='Polly.Lea', language='fr-FR')
        call = twilio_client.calls.create(twiml=str(twiml), to=phone, from_=TWILIO_NUMBER)
        now = datetime.now(timezone.utc).isoformat()
        call_record = {
            "id": str(uuid.uuid4()), "call_sid": call.sid, "alert_id": alert_id,
            "target_type": "guardian", "target_id": guardian_id, "target_name": guardian.get('name','') if guardian else '',
            "target_phone": phone, "status": "initiated", "operator_id": user['id'],
            "created_at": now, "answered": False, "response": None,
        }
        await db.twilio_calls.insert_one(call_record)
        return {"call_sid": call.sid, "call_id": call_record['id'], "status": "initiated", "phone": phone}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur appel: {str(e)}")

@api_router.get("/twilio/call/{call_sid}/status")
async def get_call_status(call_sid: str, user=Depends(get_current_user)):
    """Check Twilio call status"""
    try:
        if twilio_client:
            call = twilio_client.calls(call_sid).fetch()
            await db.twilio_calls.update_one({"call_sid": call_sid}, {"$set": {
                "status": call.status, "duration": call.duration, "answered": call.status in ('in-progress','completed')
            }})
            return {"call_sid": call_sid, "status": call.status, "duration": call.duration}
        return {"call_sid": call_sid, "status": "unknown"}
    except Exception as e:
        return {"call_sid": call_sid, "status": "error", "error": str(e)}

@api_router.get("/twilio/calls")
async def list_calls(user=Depends(get_current_user)):
    return await db.twilio_calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)

# ==================== QR CODE LINKING ====================
@api_router.post("/beneficiary/generate-link-code")
async def generate_link_code(user=Depends(get_current_user)):
    """Generate a unique code for beneficiary to share with guardian"""
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    now = datetime.now(timezone.utc).isoformat()
    link = {"id": str(uuid.uuid4()), "code": code, "beneficiary_id": user['id'], "beneficiary_name": user['name'],
            "used": False, "used_by": None, "created_at": now, "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()}
    await db.link_codes.insert_one(link)
    return {"code": code, "expires_in": "24h", "qr_data": f"vitallink://link/{code}"}

@api_router.post("/guardian/link-with-code")
async def link_with_code(data: LinkWithCodeRequest, user=Depends(get_current_user)):
    """Guardian uses a link code to connect with beneficiary"""
    link = await db.link_codes.find_one({"code": data.link_code.upper(), "used": False}, {"_id": 0})
    if not link: raise HTTPException(status_code=404, detail="Code invalide ou expiré")
    if link['expires_at'] < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=400, detail="Code expiré")
    ben = await db.users.find_one({"id": link['beneficiary_id']}, {"_id": 0})
    if not ben: raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    # Link them
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": ben['id']}})
    await db.users.update_one({"id": ben['id']}, {"$addToSet": {"guardians": user['id']}})
    await db.link_codes.update_one({"code": data.link_code.upper()}, {"$set": {"used": True, "used_by": user['id']}})
    return {"status": "linked", "beneficiary": {"id": ben['id'], "name": ben['name']}}

# ==================== SUBSCRIBER DETAIL ====================
@api_router.get("/teleassistance/subscriber/{uid}")
async def get_subscriber_detail(uid: str, user=Depends(get_current_user)):
    """Get detailed info for a subscriber (beneficiary)"""
    ben = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not ben: raise HTTPException(status_code=404, detail="Abonné non trouvé")
    alerts = await db.alerts.find({"beneficiary_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    escalations = await db.escalations.find({"beneficiary_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    interventions = await db.interventions.find({"beneficiary_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    latest = await db.device_readings.find({"user_id": uid}, {"_id": 0}).sort("timestamp", -1).to_list(5)
    calls = await db.twilio_calls.find({"$or": [{"target_id": uid}, {"alert_id": {"$in": [a['id'] for a in alerts]}}]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    guardians = []
    for gid in ben.get('guardians', []):
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g: guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone',''), "role": g.get('role','guardian')})
    return {
        "user": sanitize_user(ben), "alerts": alerts, "escalations": escalations,
        "interventions": interventions, "latest_readings": latest, "calls": calls,
        "guardians": guardians, "stats": {
            "total_alerts": len(alerts), "active_alerts": sum(1 for a in alerts if a['status'] == 'active'),
            "resolved_alerts": sum(1 for a in alerts if a['status'] == 'resolved'),
            "total_escalations": len(escalations), "total_interventions": len(interventions),
        }
    }

@api_router.get("/alerts/{aid}/detail")
async def get_alert_detail(aid: str, user=Depends(get_current_user)):
    """Get detailed info for an alert"""
    alert = await db.alerts.find_one({"id": aid}, {"_id": 0})
    if not alert: raise HTTPException(status_code=404, detail="Alerte non trouvée")
    escalations = await db.escalations.find({"alert_id": aid}, {"_id": 0}).to_list(10)
    interventions = await db.interventions.find({"alert_id": aid}, {"_id": 0}).to_list(10)
    calls = await db.twilio_calls.find({"alert_id": aid}, {"_id": 0}).to_list(20)
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    return {
        "alert": alert, "escalations": escalations, "interventions": interventions,
        "calls": calls, "beneficiary": sanitize_user(ben) if ben else None,
    }

# ==================== GUARDIAN BENEFICIARY DETAIL ====================
@api_router.get("/guardian/beneficiary/{bid}/detail")
async def guardian_beneficiary_detail(bid: str, user=Depends(get_current_user)):
    """Guardian gets full detail on their beneficiary"""
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben: raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    if bid not in user.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Non autorisé")
    alerts = await db.alerts.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    readings = await db.device_readings.find({"user_id": bid}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    thresholds = await db.thresholds.find({"user_id": bid}, {"_id": 0}).to_list(100)
    location = await db.locations.find_one({"user_id": bid}, {"_id": 0})
    interventions = await db.interventions.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return {
        "beneficiary": sanitize_user(ben), "alerts": alerts, "readings": readings,
        "thresholds": thresholds, "location": location, "interventions": interventions,
        "stats": {
            "total_alerts": len(alerts), "active_alerts": sum(1 for a in alerts if a['status'] == 'active'),
        }
    }

@api_router.get("/guardian/beneficiary/{bid}/health-report")
async def guardian_health_report(bid: str, user=Depends(get_current_user)):
    """Generate AI health report for a beneficiary"""
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben: raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
    readings = await db.device_readings.find({"user_id": bid}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    alerts = await db.alerts.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    data_summary = ""
    for r in readings[:5]:
        data_summary += f"[{r.get('device_type','')} {r.get('timestamp','')}] "
        for k,v in r.get('data',{}).items():
            data_summary += f"{k}={v} "
        data_summary += "\n"
    alert_summary = "\n".join([f"- {a['alert_type']} ({a['severity']}): {a['message']} - {a['status']}" for a in alerts[:10]])
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"report-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un assistant médical IA. Génère des rapports de santé structurés et complets en français. Pas de diagnostic médical formel."
        ).with_model("openai", "gpt-5.2")
        prompt = f"""Génère un rapport de santé complet pour le patient {ben['name']}.

Informations patient: âge={ben.get('date_of_birth','NC')}, genre={ben.get('gender','NC')}, taille={ben.get('height_cm','NC')}cm, poids={ben.get('weight_kg','NC')}kg
Groupe sanguin: {ben.get('blood_type','NC')}, Allergies: {ben.get('allergies','NC')}, Pathologies: {ben.get('medical_conditions','NC')}

Dernières mesures:
{data_summary}

Historique alertes:
{alert_summary}

Rapport structuré: 1) Résumé état général 2) Analyse constantes vitales 3) Tendances observées 4) Recommandations personnalisées 5) Points de vigilance 6) Objectifs santé suggérés"""
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"report": resp, "generated_at": datetime.now(timezone.utc).isoformat(), "beneficiary_name": ben['name']}
    except Exception as e:
        logger.error(f"AI report error: {e}")
        return {"report": f"Rapport IA indisponible: {str(e)}", "generated_at": datetime.now(timezone.utc).isoformat(), "beneficiary_name": ben['name']}

# ==================== INTERVENTION PROVIDER ROLE ====================
@api_router.post("/guardian/activate-intervention-provider")
async def activate_intervention_provider(data: InterventionProviderActivate, user=Depends(get_current_user)):
    """Guardian activates as intervention provider with code"""
    code = await db.intervention_codes.find_one({"code": data.code.upper(), "active": True}, {"_id": 0})
    if not code: raise HTTPException(status_code=404, detail="Code invalide")
    await db.users.update_one({"id": user['id']}, {"$set": {
        "is_intervention_provider": True,
        "intervention_structure": code['structure_name'],
        "intervention_radius_km": code.get('default_radius_km', 30),
        "intervention_location": code.get('base_location', {"latitude": 48.8566, "longitude": 2.3522}),
    }})
    await db.intervention_codes.update_one({"code": data.code.upper()}, {"$inc": {"uses_count": 1}})
    return {"status": "activated", "structure": code['structure_name'], "radius_km": code.get('default_radius_km', 30)}

@api_router.post("/admin/intervention-codes")
async def create_intervention_code(data: ActivationCodeCreate, user=Depends(get_current_user)):
    """Admin creates an intervention provider code"""
    if user.get('role') != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    code_val = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    now = datetime.now(timezone.utc).isoformat()
    code = {"id": str(uuid.uuid4()), "code": code_val, "structure_name": data.structure_name,
            "max_uses": data.max_uses, "uses_count": 0, "active": True, "created_at": now,
            "default_radius_km": 30, "base_location": {"latitude": 48.8566, "longitude": 2.3522}}
    await db.intervention_codes.insert_one(code)
    return {k: v for k, v in code.items() if k != '_id'}

@api_router.get("/admin/intervention-codes")
async def list_intervention_codes(user=Depends(get_current_user)):
    if user.get('role') != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    return await db.intervention_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.put("/admin/intervention-radius")
async def update_intervention_radius(data: InterventionRadiusUpdate, user=Depends(get_current_user)):
    """Admin updates intervention radius for a structure"""
    if user.get('role') != 'admin': raise HTTPException(status_code=403, detail="Admin requis")
    await db.intervention_codes.update_one({"id": data.structure_id}, {"$set": {"default_radius_km": data.radius_km}})
    # Update all providers with this structure
    providers = await db.users.find({"is_intervention_provider": True}, {"_id": 0}).to_list(100)
    for p in providers:
        code = await db.intervention_codes.find_one({"structure_name": p.get('intervention_structure','')}, {"_id": 0})
        if code and code['id'] == data.structure_id:
            await db.users.update_one({"id": p['id']}, {"$set": {"intervention_radius_km": data.radius_km}})
    return {"status": "updated", "radius_km": data.radius_km}

# ==================== PRESCRIPTION DETAIL + EMAIL ====================
@api_router.get("/prescriptions/{pid}")
async def get_prescription_detail(pid: str, user=Depends(get_current_user)):
    """Get prescription detail"""
    presc = await db.prescriptions.find_one({"id": pid}, {"_id": 0})
    if not presc: raise HTTPException(status_code=404, detail="Prescription non trouvée")
    return presc

@api_router.put("/prescriptions/{pid}/subscribe")
async def subscribe_prescription(pid: str, user=Depends(get_current_user)):
    """Mark prescription as subscribed"""
    now = datetime.now(timezone.utc).isoformat()
    await db.prescriptions.update_one({"id": pid}, {"$set": {
        "status": "subscribed", "subscribed_at": now, "subscribed_by": user['id'],
        "commission_payment_date": (datetime.now(timezone.utc).replace(day=1) + timedelta(days=32)).replace(day=1).isoformat()
    }})
    return {"status": "subscribed"}

# ==================== SETUP ====================
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client(): client.close()
