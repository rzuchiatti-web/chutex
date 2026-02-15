from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, re, asyncio

from database import db
from auth import get_current_user
from models import DeviceSyncRequest
from utils import generate_bracelet_data, generate_scale_data, generate_vest_data, check_anomalies
from routes.push_routes import notify_low_battery, notify_health_threshold

router = APIRouter()


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


@router.post("/devices/sync")
async def sync_device(data: DeviceSyncRequest, user=Depends(get_current_user)):
    device = await db.devices.find_one({"user_id": user['id'], "device_type": data.device_type}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Appareil non trouve")

    # Check subscription for bracelet
    if data.device_type == "bracelet":
        sub = await db.subscriptions.find_one(
            {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
        )
        if not sub:
            phone = user.get('phone', '')
            if phone:
                sub = await db.subscriptions.find_one(
                    {"beneficiary_phone": normalize_phone(phone), "status": "active"}, {"_id": 0}
                )
        if not sub:
            raise HTTPException(
                status_code=403,
                detail="Abonnement requis pour utiliser le bracelet Elio. Veuillez souscrire a un abonnement Standard ou Care."
            )

    generators = {
        "bracelet": lambda: generate_bracelet_data(data.data if data.data else None),
        "scale": lambda: generate_scale_data(data.data if data.data else None),
        "vest": generate_vest_data,
    }
    device_data = generators.get(data.device_type, lambda: data.data)()
    now = datetime.now(timezone.utc).isoformat()
    batt = random.randint(20, 100)
    await db.devices.update_one({"user_id": user['id'], "device_type": data.device_type}, {"$set": {"connected": True, "last_sync": now, "battery": batt}})
    await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user['id'], "device_type": data.device_type, "data": device_data, "timestamp": now})
    anomalies = check_anomalies(data.device_type, device_data)
    for an in anomalies:
        alert_id = str(uuid.uuid4())
        await db.alerts.insert_one({
            "id": alert_id, "beneficiary_id": user['id'], "beneficiary_name": user['name'],
            "alert_type": "anomaly", "severity": an['severity'], "message": an['message'], "device_type": data.device_type,
            "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })
        # Push notification for health threshold anomalies
        guardians = await db.users.find({"beneficiaries": user['id']}, {"_id": 0, "id": 1}).to_list(20)
        guardian_ids = [g['id'] for g in guardians]
        if guardian_ids:
            asyncio.create_task(notify_health_threshold(user['name'], an.get('metric', data.device_type), an.get('value', 0), guardian_ids))
    
    # Low battery notification
    if batt <= 20:
        asyncio.create_task(notify_low_battery(user['id'], data.device_type, batt))
    
    return {"status": "synced", "data": device_data, "anomalies": anomalies, "battery": batt, "timestamp": now}


@router.get("/devices")
async def get_devices(user=Depends(get_current_user)):
    uid = user.get('beneficiaries', []) if user['role'] == 'guardian' else [user['id']]
    return await db.devices.find({"user_id": {"$in": uid}}, {"_id": 0}).to_list(100)


@router.get("/devices/latest")
async def get_latest_readings(user=Depends(get_current_user)):
    readings = {}
    for dt in ["bracelet", "scale", "vest"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r:
            readings[dt] = r
    return readings



# ==================== LEFU WIFI SCALE ENDPOINTS ====================
@router.post("/lefu/wifi/register")
async def lefu_register(data: dict):
    """Lefu WiFi scale registration endpoint - called by the scale itself"""
    mac = data.get('mac', '')
    model = data.get('model', '')
    now = datetime.now(timezone.utc).isoformat()
    await db.lefu_devices.update_one({"mac": mac}, {"$set": {
        "mac": mac, "model": model, "registered_at": now, "status": "active",
    }}, upsert=True)
    return {"code": 0, "msg": "success"}


@router.post("/lefu/wifi/weighing")
async def lefu_weighing(data: dict):
    """Lefu WiFi scale measurement endpoint - called by the scale after weighing"""
    mac = data.get('mac', '')
    now = datetime.now(timezone.utc).isoformat()
    # Find which user has this scale
    device = await db.devices.find_one({"mac_address": mac, "device_type": "scale"}, {"_id": 0})
    user_id = device.get('user_id') if device else None
    measurement = {
        "id": str(uuid.uuid4()), "mac": mac, "user_id": user_id,
        "device_type": "scale", "timestamp": now,
        "weight": data.get('weight', 0), "bmi": data.get('bmi', 0),
        "body_fat_pct": data.get('bodyFat', data.get('body_fat_pct', 0)),
        "muscle_mass": data.get('muscle', data.get('muscle_mass', 0)),
        "bone_mass": data.get('bone', data.get('bone_mass', 0)),
        "hydration_pct": data.get('water', data.get('hydration_pct', 0)),
        "visceral_fat": data.get('visceralFat', data.get('visceral_fat', 0)),
        "basal_metabolism": data.get('bmr', data.get('basal_metabolism', 0)),
        "body_age": data.get('bodyAge', data.get('body_age', 0)),
        "protein_pct": data.get('protein', data.get('protein_pct', 0)),
        "health_score": data.get('score', data.get('health_score', 0)),
        "raw_data": data,
    }
    await db.device_readings.insert_one(measurement)
    return {"code": 0, "msg": "success"}


@router.get("/devices/scale/history")
async def get_scale_history(user=Depends(get_current_user)):
    """Get scale measurement history for the user"""
    uid = user['id']
    if user.get('role') == 'guardian' and user.get('beneficiaries'):
        uid = user['beneficiaries'][0]
    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale"},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(90)
    return readings


@router.post("/devices/scale/seed-history")
async def seed_scale_history(user=Depends(get_current_user)):
    """Seed demo scale history data for the user"""
    uid = user['id']
    existing = await db.device_readings.count_documents({"user_id": uid, "device_type": "scale"})
    if existing >= 10:
        return {"status": "already_seeded", "count": existing}
    base_weight = 72.5
    import math
    for i in range(30):
        day_offset = 29 - i
        from datetime import timedelta
        ts = (datetime.now(timezone.utc) - timedelta(days=day_offset)).isoformat()
        w = base_weight + math.sin(i * 0.3) * 1.5 - i * 0.05 + random.uniform(-0.3, 0.3)
        w = round(w, 1)
        fat = round(22.5 + math.sin(i * 0.2) * 1.2 - i * 0.03 + random.uniform(-0.3, 0.3), 1)
        muscle = round(35.2 + i * 0.02 + random.uniform(-0.2, 0.2), 1)
        reading = {
            "id": str(uuid.uuid4()), "user_id": uid, "device_type": "scale", "timestamp": ts,
            "weight": w, "bmi": round(w / (1.75 ** 2), 1),
            "body_fat_pct": fat, "muscle_mass": muscle,
            "bone_mass": round(3.1 + random.uniform(-0.1, 0.1), 1),
            "hydration_pct": round(55.0 + random.uniform(-1, 1), 1),
            "visceral_fat": round(8 + random.uniform(-0.5, 0.5), 1),
            "basal_metabolism": round(1650 + random.uniform(-30, 30)),
            "body_age": 48 + random.randint(-2, 2),
            "protein_pct": round(17.0 + random.uniform(-0.5, 0.5), 1),
            "health_score": round(75 + random.uniform(-3, 3)),
        }
        await db.device_readings.insert_one(reading)
    return {"status": "seeded", "count": 30}
