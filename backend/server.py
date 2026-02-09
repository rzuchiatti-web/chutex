from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'vitallink_db')]

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'vitallink-jwt-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="VitalLink AI API")
api_router = APIRouter(prefix="/api")

# Configure logging
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

# ==================== AUTH UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

def sanitize_user(user: dict) -> dict:
    return {
        "id": user['id'],
        "email": user['email'],
        "name": user['name'],
        "phone": user.get('phone', ''),
        "role": user['role'],
        "created_at": user['created_at'],
        "beneficiaries": user.get('beneficiaries', []),
        "guardians": user.get('guardians', []),
    }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "beneficiaries": [],
        "guardians": [],
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.role)
    
    if data.role == "beneficiary":
        await create_initial_devices(user_id)
    
    return {"token": token, "user": sanitize_user(user)}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user['id'], user['role'])
    return {"token": token, "user": sanitize_user(user)}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return sanitize_user(user)

# ==================== DEVICE FUNCTIONS ====================

async def create_initial_devices(user_id: str):
    devices = [
        {"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "bracelet", "name": "Bracelet Santé", "connected": False, "battery": 85, "last_sync": None},
        {"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "scale", "name": "Balance Connectée", "connected": False, "battery": 92, "last_sync": None},
        {"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "vest", "name": "Gilet Anti-Chute", "connected": False, "battery": 78, "last_sync": None},
    ]
    await db.devices.insert_many(devices)

def generate_bracelet_data():
    return {
        "heart_rate": random.randint(62, 95),
        "blood_pressure_systolic": random.randint(115, 138),
        "blood_pressure_diastolic": random.randint(72, 88),
        "spo2": random.randint(95, 99),
        "temperature": round(random.uniform(36.3, 37.2), 1),
        "steps": random.randint(800, 6000),
        "calories": random.randint(300, 1500),
    }

def generate_scale_data():
    return {
        "weight": round(random.uniform(58, 88), 1),
        "bmi": round(random.uniform(19, 28), 1),
        "body_fat": round(random.uniform(18, 32), 1),
        "muscle_mass": round(random.uniform(28, 42), 1),
        "hydration": round(random.uniform(48, 62), 1),
    }

def generate_vest_data():
    return {
        "fall_detected": False,
        "posture_score": random.randint(65, 98),
        "activity_level": random.choice(["faible", "modéré", "élevé"]),
        "movement_count": random.randint(20, 400),
    }

def check_anomalies(device_type: str, data: dict) -> list:
    anomalies = []
    if device_type == "bracelet":
        hr = data.get('heart_rate', 75)
        if hr > 120 or hr < 50:
            anomalies.append({"severity": "high", "message": f"Fréquence cardiaque anormale: {hr} bpm"})
        spo2 = data.get('spo2', 97)
        if spo2 < 92:
            anomalies.append({"severity": "critical", "message": f"SpO2 bas: {spo2}%"})
        temp = data.get('temperature', 37)
        if temp > 38.5:
            anomalies.append({"severity": "high", "message": f"Température élevée: {temp}°C"})
        sys_bp = data.get('blood_pressure_systolic', 120)
        if sys_bp > 160:
            anomalies.append({"severity": "high", "message": f"Tension artérielle élevée: {sys_bp}/{data.get('blood_pressure_diastolic', 80)}"})
    elif device_type == "vest":
        if data.get('fall_detected', False):
            anomalies.append({"severity": "critical", "message": "Chute détectée!"})
    return anomalies

# ==================== DEVICE ROUTES ====================

@api_router.post("/devices/sync")
async def sync_device(data: DeviceSyncRequest, user=Depends(get_current_user)):
    device = await db.devices.find_one(
        {"user_id": user['id'], "device_type": data.device_type}, {"_id": 0}
    )
    if not device:
        raise HTTPException(status_code=404, detail="Appareil non trouvé")
    
    generators = {"bracelet": generate_bracelet_data, "scale": generate_scale_data, "vest": generate_vest_data}
    device_data = data.data if data.data else generators.get(data.device_type, lambda: {})()
    
    now = datetime.now(timezone.utc).isoformat()
    battery = random.randint(20, 100)
    
    await db.devices.update_one(
        {"user_id": user['id'], "device_type": data.device_type},
        {"$set": {"connected": True, "last_sync": now, "battery": battery}}
    )
    
    reading = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "device_type": data.device_type,
        "data": device_data,
        "timestamp": now,
    }
    await db.device_readings.insert_one(reading)
    
    anomalies = check_anomalies(data.device_type, device_data)
    if anomalies:
        for anomaly in anomalies:
            alert = {
                "id": str(uuid.uuid4()),
                "beneficiary_id": user['id'],
                "beneficiary_name": user['name'],
                "alert_type": "anomaly",
                "severity": anomaly['severity'],
                "message": anomaly['message'],
                "device_type": data.device_type,
                "status": "active",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
            }
            await db.alerts.insert_one(alert)
    
    return {"status": "synced", "data": device_data, "anomalies": anomalies, "battery": battery, "timestamp": now}

@api_router.get("/devices")
async def get_devices(user=Depends(get_current_user)):
    if user['role'] == 'guardian':
        beneficiary_ids = user.get('beneficiaries', [])
        devices = await db.devices.find({"user_id": {"$in": beneficiary_ids}}, {"_id": 0}).to_list(100)
    else:
        devices = await db.devices.find({"user_id": user['id']}, {"_id": 0}).to_list(100)
    return devices

@api_router.get("/devices/latest")
async def get_latest_readings(user=Depends(get_current_user)):
    user_id = user['id']
    readings = {}
    for device_type in ["bracelet", "scale", "vest"]:
        reading = await db.device_readings.find_one(
            {"user_id": user_id, "device_type": device_type},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        if reading:
            readings[device_type] = reading
    return readings

# ==================== ALERT ROUTES ====================

@api_router.post("/alerts")
async def create_alert(data: AlertCreate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    alert = {
        "id": str(uuid.uuid4()),
        "beneficiary_id": user['id'],
        "beneficiary_name": user['name'],
        "alert_type": data.alert_type,
        "severity": data.severity,
        "message": data.message or f"Alerte {data.alert_type}",
        "device_type": data.device_type,
        "status": "active",
        "created_at": now,
        "resolved_at": None,
        "resolved_by": None,
    }
    await db.alerts.insert_one(alert)
    return {k: v for k, v in alert.items() if k != '_id'}

@api_router.get("/alerts")
async def get_alerts(user=Depends(get_current_user)):
    if user['role'] == 'guardian':
        beneficiary_ids = user.get('beneficiaries', [])
        query = {"beneficiary_id": {"$in": beneficiary_ids + [user['id']]}}
    else:
        query = {"beneficiary_id": user['id']}
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return alerts

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id']}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return {"status": "resolved"}

# ==================== MEDICATION ROUTES ====================

@api_router.post("/medications")
async def create_medication(data: MedicationCreate, user=Depends(get_current_user)):
    medication = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "name": data.name,
        "dosage": data.dosage,
        "frequency": data.frequency,
        "times": data.times,
        "notes": data.notes,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.medications.insert_one(medication)
    return {k: v for k, v in medication.items() if k != '_id'}

@api_router.get("/medications")
async def get_medications(user=Depends(get_current_user)):
    meds = await db.medications.find({"user_id": user['id'], "active": True}, {"_id": 0}).to_list(100)
    return meds

@api_router.delete("/medications/{med_id}")
async def delete_medication(med_id: str, user=Depends(get_current_user)):
    result = await db.medications.update_one(
        {"id": med_id, "user_id": user['id']},
        {"$set": {"active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Médicament non trouvé")
    return {"status": "deleted"}

# ==================== AI ROUTES ====================

@api_router.post("/ai/recommendations")
async def get_ai_recommendations(user=Depends(get_current_user)):
    latest_readings = {}
    for device_type in ["bracelet", "scale"]:
        reading = await db.device_readings.find_one(
            {"user_id": user['id'], "device_type": device_type},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        if reading:
            latest_readings[device_type] = reading['data']
    
    medications = await db.medications.find(
        {"user_id": user['id'], "active": True}, {"_id": 0}
    ).to_list(100)
    
    if not latest_readings:
        return {
            "recommendation": "Synchronisez vos appareils pour recevoir des recommandations de santé personnalisées.",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    prompt = f"""Analyse les données de santé suivantes pour {user['name']} et fournis des recommandations préventives en français.

Données vitales: {str(latest_readings)}
Médicaments: {[m['name'] + ' ' + m['dosage'] for m in medications] if medications else 'Aucun'}

Fournis 3-4 recommandations préventives courtes et actionables. Format: liste à puces. Inclus hydratation, activité physique, bien-être. Réponds en français uniquement, max 200 mots."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"health-rec-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un assistant de santé préventive IA. Tu analyses les données de santé et fournis des recommandations bienveillantes et pratiques en français. Ne fais pas de diagnostic médical."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        recommendation = response
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        recommendation = "• Pensez à bien vous hydrater aujourd'hui (8 verres d'eau)\n• Faites une promenade de 15 minutes si possible\n• N'oubliez pas vos médicaments aux heures prévues\n• Reposez-vous suffisamment cette nuit"
    
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "recommendation": recommendation,
        "vitals_snapshot": latest_readings,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.recommendations.insert_one(rec)
    
    return {"recommendation": recommendation, "generated_at": rec['generated_at']}

@api_router.get("/ai/recommendations/latest")
async def get_latest_recommendation(user=Depends(get_current_user)):
    rec = await db.recommendations.find_one(
        {"user_id": user['id']}, {"_id": 0},
        sort=[("generated_at", -1)]
    )
    if not rec:
        return {"recommendation": "Synchronisez vos appareils pour des recommandations IA.", "generated_at": None}
    return {"recommendation": rec['recommendation'], "generated_at": rec['generated_at']}

# ==================== GUARDIAN ROUTES ====================

@api_router.post("/guardian/link")
async def link_beneficiary(data: LinkBeneficiaryRequest, user=Depends(get_current_user)):
    if user['role'] != 'guardian':
        raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    
    beneficiary = await db.users.find_one({"email": data.beneficiary_email, "role": "beneficiary"}, {"_id": 0})
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé avec cet email")
    
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": beneficiary['id']}})
    await db.users.update_one({"id": beneficiary['id']}, {"$addToSet": {"guardians": user['id']}})
    
    return {"status": "linked", "beneficiary": {"id": beneficiary['id'], "name": beneficiary['name'], "email": beneficiary['email']}}

@api_router.get("/guardian/beneficiaries")
async def get_beneficiaries(user=Depends(get_current_user)):
    if user['role'] != 'guardian':
        raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    
    # Refresh user data to get latest beneficiaries list
    current_user = await db.users.find_one({"id": user['id']}, {"_id": 0})
    beneficiary_ids = current_user.get('beneficiaries', [])
    beneficiaries = []
    
    for bid in beneficiary_ids:
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            latest = await db.device_readings.find_one(
                {"user_id": bid, "device_type": "bracelet"},
                {"_id": 0}, sort=[("timestamp", -1)]
            )
            alert_count = await db.alerts.count_documents({"beneficiary_id": bid, "status": "active"})
            b['latest_vitals'] = latest['data'] if latest else None
            b['active_alerts'] = alert_count
            b['last_sync'] = latest['timestamp'] if latest else None
            beneficiaries.append(b)
    
    return beneficiaries

@api_router.post("/guardian/prescriptions")
async def create_prescription(data: PrescriptionCreate, user=Depends(get_current_user)):
    if user['role'] != 'guardian':
        raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    
    prescription = {
        "id": str(uuid.uuid4()),
        "guardian_id": user['id'],
        "guardian_name": user['name'],
        "beneficiary_name": data.beneficiary_name,
        "beneficiary_email": data.beneficiary_email,
        "beneficiary_phone": data.beneficiary_phone,
        "subscription_type": data.subscription_type,
        "notes": data.notes,
        "status": "pending",
        "commission": 15.0 if data.subscription_type == "standard" else 25.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.prescriptions.insert_one(prescription)
    return {k: v for k, v in prescription.items() if k != '_id'}

@api_router.get("/guardian/prescriptions")
async def get_prescriptions(user=Depends(get_current_user)):
    if user['role'] != 'guardian':
        raise HTTPException(status_code=403, detail="Réservé aux gardiens")
    prescriptions = await db.prescriptions.find(
        {"guardian_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return prescriptions

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/stats")
async def get_admin_stats():
    total_users = await db.users.count_documents({})
    total_beneficiaries = await db.users.count_documents({"role": "beneficiary"})
    total_guardians = await db.users.count_documents({"role": "guardian"})
    total_alerts = await db.alerts.count_documents({})
    active_alerts = await db.alerts.count_documents({"status": "active"})
    total_prescriptions = await db.prescriptions.count_documents({})
    
    return {
        "total_users": total_users,
        "total_beneficiaries": total_beneficiaries,
        "total_guardians": total_guardians,
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "total_prescriptions": total_prescriptions,
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
