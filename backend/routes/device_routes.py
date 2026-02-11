from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, re

from database import db
from auth import get_current_user
from models import DeviceSyncRequest
from utils import generate_bracelet_data, generate_scale_data, generate_vest_data, check_anomalies

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
