from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid
import re
import asyncio

from database import db
from auth import get_current_user
from models import DeviceSyncRequest
from utils import check_anomalies
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

    # Store REAL data sent by BLE device — no simulation
    device_data = data.data if data.data else {}
    now = datetime.now(timezone.utc).isoformat()
    update_fields: dict = {"connected": True, "last_sync": now}
    if device_data.get("battery"):
        update_fields["battery"] = device_data["battery"]
    await db.devices.update_one({"user_id": user['id'], "device_type": data.device_type}, {"$set": update_fields})
    if device_data:
        await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user['id'], "device_type": data.device_type, "data": device_data, "timestamp": now})
    # Check anomalies on real data only
    anomalies = []
    if device_data:
        anomalies = check_anomalies(data.device_type, device_data)
        for an in anomalies:
            alert_id = str(uuid.uuid4())
            await db.alerts.insert_one({
                "id": alert_id, "beneficiary_id": user['id'], "beneficiary_name": user['name'],
                "alert_type": "anomaly", "severity": an['severity'], "message": an['message'], "device_type": data.device_type,
                "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
            })
            guardians = await db.users.find({"beneficiaries": user['id']}, {"_id": 0, "id": 1}).to_list(20)
            guardian_ids = [g['id'] for g in guardians]
            if guardian_ids:
                asyncio.create_task(notify_health_threshold(user['name'], an.get('metric', data.device_type), an.get('value', 0), guardian_ids))
    batt = device_data.get("battery", 0) if device_data else 0
    if batt and batt <= 20:
        asyncio.create_task(notify_low_battery(user['id'], data.device_type, batt))
    return {"status": "synced", "data": device_data, "anomalies": anomalies, "battery": batt, "timestamp": now}


@router.get("/devices")
async def get_devices(user=Depends(get_current_user)):
    uid = user.get('beneficiaries', []) if user['role'] == 'guardian' else [user['id']]
    devices = await db.devices.find(
        {"user_id": {"$in": uid}, "removed": {"$ne": True}}, {"_id": 0}
    ).to_list(100)
    # Compute real-time connected status based on last_sync freshness
    now = datetime.now(timezone.utc)
    for d in devices:
        if d.get('last_sync'):
            try:
                ls = datetime.fromisoformat(d['last_sync'].replace('Z', '+00:00'))
                threshold = 30 if d.get('device_type') == 'vest' else 120
                d['connected'] = (now - ls).total_seconds() < threshold
            except:
                d['connected'] = False
        else:
            d['connected'] = False
    return devices


@router.post("/devices/associate")
async def associate_device(data: dict, user=Depends(get_current_user)):
    """Associate/pair a new device for the user. Creates the device record."""
    device_type = data.get("device_type", "")
    if device_type not in ("bracelet", "scale", "vest", "dorsi"):
        raise HTTPException(status_code=400, detail="Type d'appareil invalide")

    uid = user["id"]

    # Check subscription for bracelet
    if device_type == "bracelet":
        sub = await db.subscriptions.find_one(
            {"beneficiary_id": uid, "status": "active"}, {"_id": 0}
        )
        if not sub:
            phone = user.get("phone", "")
            if phone:
                sub = await db.subscriptions.find_one(
                    {"beneficiary_phone": normalize_phone(phone), "status": "active"}, {"_id": 0}
                )
            if not sub:
                raise HTTPException(status_code=403, detail="Abonnement requis pour le bracelet Elio")

    # Check if already associated (non-removed)
    existing = await db.devices.find_one(
        {"user_id": uid, "device_type": device_type, "removed": {"$ne": True}}, {"_id": 0}
    )
    if existing:
        # Re-activate (keep real battery/connected state, just mark as non-removed)
        await db.devices.update_one(
            {"user_id": uid, "device_type": device_type, "removed": {"$ne": True}},
            {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
        )
        updated = await db.devices.find_one(
            {"user_id": uid, "device_type": device_type, "removed": {"$ne": True}}, {"_id": 0}
        )
        return {"status": "reconnected", "device": updated}

    names = {"bracelet": "Bracelet Elio", "scale": "Balance Vita", "vest": "Gilet Elder", "dorsi": "Coussin Dorsi"}
    now = datetime.now(timezone.utc).isoformat()
    device = {
        "id": str(uuid.uuid4()), "user_id": uid, "device_type": device_type,
        "name": names.get(device_type, device_type), "connected": False,
        "battery": 0, "last_sync": now,
        "firmware_version": "1.0", "mac_address": data.get("mac_address", ""),
    }
    await db.devices.insert_one(device)
    device.pop("_id", None)

    return {"status": "associated", "device": device}


@router.delete("/devices/{device_id}/remove")
async def remove_device(device_id: str, user=Depends(get_current_user)):
    """Remove/dissociate a device"""
    uid = user["id"]
    await db.devices.delete_one({"id": device_id, "user_id": uid})
    await db.device_readings.delete_many({"device_id": device_id})
    return {"status": "removed"}


@router.post("/devices/remove-by-type")
async def remove_device_by_type(data: dict, user=Depends(get_current_user)):
    uid = user["id"]
    device_type = data.get("device_type", "")
    await db.devices.delete_many({"user_id": uid, "device_type": device_type})
    field_map = {"bracelet": "bracelet", "vest": "vest", "scale": "scale", "dorsi": "dorsi"}
    field = field_map.get(device_type)
    if field:
        await db.dashboard_summary.update_one({"user_id": uid}, {"$set": {f"{field}.connected": False, f"{field}.battery": 0}}, upsert=True)
    return {"status": "removed"}



@router.get("/devices/latest")
async def get_latest_readings(user=Depends(get_current_user)):
    readings = {}
    for dt in ["bracelet", "scale", "vest", "dorsi"]:
        r = await db.device_readings.find_one({"user_id": user['id'], "device_type": dt}, {"_id": 0}, sort=[("timestamp", -1)])
        if r:
            readings[dt] = r
    return readings


@router.get("/devices/dashboard-summary")
async def get_dashboard_summary(user=Depends(get_current_user)):
    """Device summary using REAL data from device_readings. No simulation."""
    uid = user['id']
    bracelet_dev = await db.devices.find_one({"user_id": uid, "device_type": "bracelet", "removed": {"$ne": True}}, {"_id": 0})
    scale_dev = await db.devices.find_one({"user_id": uid, "device_type": "scale", "removed": {"$ne": True}}, {"_id": 0})
    vest_dev = await db.devices.find_one({"user_id": uid, "device_type": "vest", "removed": {"$ne": True}}, {"_id": 0})

    now = datetime.now(timezone.utc)

    # Get last REAL readings from DB
    last_bracelet_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    last_scale_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    last_vest_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "vest"}, {"_id": 0}, sort=[("timestamp", -1)]
    )

    br_data = {}
    if last_bracelet_reading:
        br_data = (last_bracelet_reading or {}).get("data", {})
    # Fallback: use device fields for latest vitals if reading doesn't have them
    if bracelet_dev:
        if not br_data.get("heart_rate") and bracelet_dev.get("last_heart_rate"):
            br_data["heart_rate"] = bracelet_dev["last_heart_rate"]
        if not br_data.get("spo2") and bracelet_dev.get("last_spo2"):
            br_data["spo2"] = bracelet_dev["last_spo2"]
        if not br_data.get("temperature") and bracelet_dev.get("last_temperature"):
            br_data["temperature"] = bracelet_dev["last_temperature"]
        if not br_data.get("steps") and bracelet_dev.get("last_steps"):
            br_data["steps"] = bracelet_dev["last_steps"]
        if not br_data.get("calories") and bracelet_dev.get("last_calories"):
            br_data["calories"] = bracelet_dev["last_calories"]
        if not br_data.get("blood_pressure") and bracelet_dev.get("last_systolic"):
            br_data["blood_pressure"] = {"systolic": bracelet_dev["last_systolic"], "diastolic": bracelet_dev.get("last_diastolic", 0)}
    sc_data = (last_scale_reading or {}).get("data", {}) if last_scale_reading else {}
    vs_data = (last_vest_reading or {}).get("data", {}) if last_vest_reading else {}
    br_connected = False
    if bracelet_dev and bracelet_dev.get('last_sync'):
        try:
            ls = datetime.fromisoformat(bracelet_dev['last_sync'].replace('Z', '+00:00'))
            br_connected = (now - ls).total_seconds() < 120
        except: pass
    sc_connected = False
    if scale_dev and scale_dev.get('last_sync'):
        try:
            ls = datetime.fromisoformat(scale_dev['last_sync'].replace('Z', '+00:00'))
            sc_connected = (now - ls).total_seconds() < 120
        except: pass
    vs_connected = False
    if vest_dev and vest_dev.get('last_sync'):
        try:
            ls = datetime.fromisoformat(vest_dev['last_sync'].replace('Z', '+00:00'))
            vs_connected = (now - ls).total_seconds() < 30
        except: pass
    has_br_data = bool(br_data) or br_connected
    has_sc_data = bool(sc_data) or sc_connected

    bracelet = {
        "connected": br_connected,
        "battery": bracelet_dev.get("battery", 0) if bracelet_dev else 0,
        "name": "Bracelet Elio",
        "heart_rate": br_data.get("heart_rate", 0),
        "spo2": br_data.get("spo2", 0),
        "blood_pressure": br_data.get("blood_pressure", {"systolic": 0, "diastolic": 0}),
        "temperature": br_data.get("temperature", 0),
        "steps": br_data.get("steps", 0),
        "calories": br_data.get("calories", 0),
        "distance_km": br_data.get("distance_km", 0),
        "last_sync": (bracelet_dev.get("last_sync") if bracelet_dev else None) or (last_bracelet_reading.get("timestamp") if last_bracelet_reading else None),
        "heart_rate_history": br_data.get("heart_rate_history", []),
        "paired": br_connected or (bracelet_dev.get("battery", 0) > 0 if bracelet_dev else False),
    }

    scale = {
        "connected": sc_connected,
        "battery": scale_dev.get("battery", 0) if scale_dev else 0,
        "name": "Balance Vita",
        "weight": sc_data.get("weight", 0),
        "bmi": sc_data.get("bmi", 0),
        "body_fat": sc_data.get("body_fat_pct", sc_data.get("body_fat", 0)),
        "muscle_mass": sc_data.get("muscle_pct", sc_data.get("muscle_mass", 0)),
        "water_pct": sc_data.get("water_pct", 0),
        "bone_mass": sc_data.get("bone_mass_kg", sc_data.get("bone_mass", 0)),
        "visceral_fat": sc_data.get("visceral_fat", 0),
        "metabolic_age": sc_data.get("body_age", sc_data.get("metabolic_age", 0)),
        "last_sync": (scale_dev.get("last_sync") if scale_dev else None) or (last_scale_reading.get("timestamp") if last_scale_reading else None),
        "weight_history": [],
        "paired": sc_connected or (scale_dev.get("battery", 0) > 0 if scale_dev else False),
    }

    # Build weight history from real readings
    scale_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}
    ).sort("timestamp", -1).to_list(10)
    if scale_readings:
        scale["weight_history"] = [
            {"date": r.get("timestamp", "")[:10], "value": r.get("data", {}).get("weight", 0)}
            for r in reversed(scale_readings) if r.get("data", {}).get("weight", 0) > 0
        ]

    vest = {
        "connected": vs_connected,
        "battery": vest_dev.get("battery", 0) if vest_dev else 0,
        "name": "Gilet Elder",
        "fall_detected": vs_data.get("fall_detected", False),
        "posture_score": vs_data.get("posture_score", 0),
        "chest_temp": vs_data.get("chest_temp", 0),
        "impact_events_today": vs_data.get("impact_events_today", 0),
        "wearing_hours_today": vs_data.get("wearing_hours_today", 0),
        "last_fall_check": vs_data.get("last_fall_check", None),
        "last_sync": (vest_dev.get("last_sync") if vest_dev else None) or (last_vest_reading.get("timestamp") if last_vest_reading else None),
        "alerts_today": 0,
        "paired": vs_connected or (vest_dev.get("battery", 0) > 0 if vest_dev else False),
    }

    # Sleep from real bracelet data only
    sleep = None
    if last_bracelet_reading and br_data.get("sleep"):
        sleep = br_data["sleep"]

    return {
        "bracelet": bracelet, "scale": scale, "vest": vest, "sleep": sleep,
        "has_data": has_br_data or has_sc_data,
        "last_updated": now.isoformat(),
    }



# ==================== LEFU WIFI SCALE ENDPOINTS ====================

@router.post("/scale/register-member")
async def register_scale_member(data: dict, user=Depends(get_current_user)):
    """Register current user as a member on a shared scale.
    Multiple beneficiaries can share one scale — each gets their own memberid.
    The scale identifies who is weighing by weight proximity."""
    uid = user['id']
    mac = data.get('mac', '')
    reference_weight = data.get('reference_weight', user.get('weight_kg', 0))
    now = datetime.now(timezone.utc).isoformat()

    member_id = str(uuid.uuid4())
    await db.scale_members.update_one(
        {"user_id": uid, "mac": mac},
        {"$set": {
            "user_id": uid, "mac": mac, "member_id": member_id,
            "reference_weight": float(reference_weight),
            "user_name": user.get('name', ''),
            "gender": user.get('gender', ''),
            "height_cm": user.get('height_cm', 170),
            "date_of_birth": user.get('date_of_birth', ''),
            "updated_at": now,
        }},
        upsert=True
    )
    # Also ensure the scale device is linked
    await db.devices.update_one(
        {"user_id": uid, "device_type": "scale"},
        {"$set": {"mac_address": mac, "last_sync": now, "shared": True}},
        upsert=True
    )
    return {"status": "ok", "member_id": member_id, "reference_weight": reference_weight}


@router.get("/scale/members")
async def get_scale_members(mac: str = '', user=Depends(get_current_user)):
    """Get all members registered on a scale (for the devices page)"""
    query = {"mac": mac} if mac else {"user_id": user['id']}
    members = await db.scale_members.find(query, {"_id": 0}).to_list(20)
    return members


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
    """Lefu WiFi scale measurement endpoint - called by the scale after weighing.
    Format from Lefu doc: { bat, list: [{ data: [{impedance},...], heartRate, memberid, timestamp, userid, weight }], mac, scaleType, sn, type }"""
    mac = data.get('mac', '')
    sn = data.get('sn', '')
    scale_type = data.get('scaleType', 0)  # 0=4-electrode, 1=8-electrode
    now = datetime.now(timezone.utc).isoformat()

    measurements_list = data.get('list', [])
    if not measurements_list:
        measurements_list = [data]

    results = []
    for entry in measurements_list:
        weight = entry.get('weight', 0)
        heart_rate = entry.get('heartRate', 0)
        timestamp = entry.get('timestamp', 0)
        lefu_member_id = entry.get('memberid', '')
        lefu_user_id = entry.get('userid', '')
        ts_str = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat() if timestamp else now

        # ── RESOLVE USER: memberid → weight proximity → MAC fallback ──
        user_id = None
        user_profile = None
        device = None

        # 1. Try memberid mapping
        if lefu_member_id:
            member = await db.scale_members.find_one({"member_id": lefu_member_id}, {"_id": 0})
            if member:
                user_id = member['user_id']

        # 2. Try weight proximity (for shared scales)
        if not user_id and weight > 0:
            members = await db.scale_members.find({"mac": mac}, {"_id": 0}).to_list(10)
            if members:
                best_match = min(members, key=lambda m: abs(m.get('reference_weight', 0) - weight))
                if abs(best_match.get('reference_weight', 0) - weight) < 15:  # within 15kg tolerance
                    user_id = best_match['user_id']
                    # Update memberid mapping for future
                    if lefu_member_id:
                        await db.scale_members.update_one(
                            {"user_id": user_id, "mac": mac},
                            {"$set": {"member_id": lefu_member_id, "reference_weight": weight}}
                        )

        # 3. Fallback: MAC → device owner
        if not user_id:
            device = await db.devices.find_one({"mac_address": {"$in": [mac, sn]}, "device_type": "scale"}, {"_id": 0})
            if device:
                user_id = device.get('user_id')

        # Always fetch device record for last_sync update
        if user_id and not device:
            device = await db.devices.find_one({"user_id": user_id, "device_type": "scale"}, {"_id": 0})

        if user_id:
            user_profile = await db.users.find_one({"id": user_id}, {"_id": 0})

        # Parse impedance array
        impedance_data = entry.get('data', [])
        impedances = [int(d.get('impedance', 0)) for d in impedance_data] if impedance_data else []
        primary_impedance = impedances[0] if impedances else int(entry.get('impedance', 0) or 0)

        body_data = {}
        if primary_impedance and user_profile:
            try:
                from services.lefu_service import calculate_body_data
                height = user_profile.get('height_cm', 170)
                age = 50
                if user_profile.get('date_of_birth'):
                    try:
                        dob = datetime.fromisoformat(user_profile['date_of_birth'].replace('Z', '+00:00'))
                        age = (datetime.now(timezone.utc) - dob).days // 365
                    except: pass
                sex = 1 if user_profile.get('gender', '').lower() in ('m', 'male', 'homme', 'masculin') else 0
                body_data = await calculate_body_data(weight, primary_impedance, height, age, sex)
            except: pass

        # Build impedance segments for 8-electrode scales
        impedance_segments = {}
        if scale_type == 1 and len(impedances) >= 10:
            impedance_segments = {
                "right_arm_20khz": impedances[0], "right_arm_100khz": impedances[1],
                "left_arm_20khz": impedances[2], "left_arm_100khz": impedances[3],
                "trunk_20khz": impedances[4], "trunk_100khz": impedances[5],
                "right_leg_20khz": impedances[6], "right_leg_100khz": impedances[7],
                "left_leg_20khz": impedances[8], "left_leg_100khz": impedances[9],
            }

        measurement = {
            "id": str(uuid.uuid4()), "mac": mac, "sn": sn, "user_id": user_id,
            "device_type": "scale", "source": "wifi", "timestamp": ts_str,
            "weight": body_data.get('weight', weight),
            "bmi": body_data.get('bmi', 0),
            "body_fat_pct": body_data.get('body_fat_pct', 0),
            "muscle_pct": body_data.get('muscle_rate', 0),
            "water_pct": body_data.get('hydration_pct', 0),
            "bone_mass": body_data.get('bone_mass', 0),
            "visceral_fat": body_data.get('visceral_fat', 0),
            "metabolic_age": body_data.get('body_age', 0),
            "basal_metabolism": body_data.get('basal_metabolism', 0),
            "protein_pct": body_data.get('protein_pct', 0),
            "health_score": body_data.get('health_score', 0),
            "heart_rate": heart_rate,
            "impedance": primary_impedance,
            "impedance_segments": impedance_segments,
            "scale_type": scale_type,
            "health_evaluation": "Normal" if body_data.get('bmi', 0) > 0 and 18.5 <= body_data.get('bmi', 0) <= 25 else "A surveiller",
            "raw_data": entry,
        }

        # Store as weighing
        await db.weighings.insert_one({k: v for k, v in measurement.items() if k != '_id'})
        # Store as device reading
        await db.device_readings.insert_one({k: v for k, v in measurement.items() if k != '_id'})

        # Update device last_sync
        if device:
            await db.devices.update_one(
                {"user_id": user_id, "device_type": "scale"},
                {"$set": {"connected": True, "last_sync": ts_str, "battery": int(float(data.get('bat', 0)) * 100) if data.get('bat') else 0}}
            )

        results.append({"id": measurement["id"], "weight": weight})

    return {"code": 0, "msg": "success", "count": len(results)}


@router.post("/lefu/wifi/record")
async def lefu_wifi_record(data: dict):
    """V2/V3 protocol - single weighing upload. Official Lefu endpoint.
    Format: { sn, type, mac, charge, weight, impedance, timestamp, heartRate }"""
    mac = data.get('mac', '')
    sn = data.get('sn', '')
    now = datetime.now(timezone.utc).isoformat()

    device = await db.devices.find_one({"mac_address": mac, "device_type": "scale"}, {"_id": 0})
    if not device:
        device = await db.devices.find_one({"mac_address": sn, "device_type": "scale"}, {"_id": 0})
    user_id = device.get('user_id') if device else None

    weight = float(data.get('weight', 0))
    impedance = int(data.get('impedance', 0))
    heart_rate = int(data.get('heartRate', 0))
    charge = data.get('charge', '0')
    ts = data.get('timestamp', '')
    ts_str = now
    if ts:
        try:
            ts_int = int(ts)
            if ts_int > 1e12:
                ts_int = ts_int // 1000
            ts_str = datetime.fromtimestamp(ts_int, tz=timezone.utc).isoformat()
        except: pass

    body_data = {}
    if impedance and user_id:
        user_profile = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_profile:
            try:
                from services.lefu_service import calculate_body_data
                height = user_profile.get('height_cm', 170)
                age = 50
                if user_profile.get('date_of_birth'):
                    try:
                        dob = datetime.fromisoformat(user_profile['date_of_birth'].replace('Z', '+00:00'))
                        age = (datetime.now(timezone.utc) - dob).days // 365
                    except: pass
                sex = 1 if user_profile.get('gender', '').lower() in ('m', 'male', 'homme', 'masculin') else 0
                body_data = await calculate_body_data(weight, impedance, height, age, sex)
            except: pass

    measurement = {
        "id": str(uuid.uuid4()), "mac": mac, "sn": sn, "user_id": user_id,
        "device_type": "scale", "source": "wifi", "timestamp": ts_str,
        "weight": body_data.get('weight', weight),
        "bmi": body_data.get('bmi', 0),
        "body_fat_pct": body_data.get('body_fat_pct', 0),
        "muscle_pct": body_data.get('muscle_rate', 0),
        "water_pct": body_data.get('hydration_pct', 0),
        "bone_mass": body_data.get('bone_mass', 0),
        "visceral_fat": body_data.get('visceral_fat', 0),
        "metabolic_age": body_data.get('body_age', 0),
        "heart_rate": heart_rate,
        "impedance": impedance,
        "health_evaluation": "Normal" if body_data.get('bmi', 0) > 0 and 18.5 <= body_data.get('bmi', 0) <= 25 else "",
        "raw_data": data,
    }

    await db.weighings.insert_one({k: v for k, v in measurement.items() if k != '_id'})
    await db.device_readings.insert_one({k: v for k, v in measurement.items() if k != '_id'})

    if device:
        battery = int(float(charge) * 100) if charge else 0
        await db.devices.update_one(
            {"user_id": user_id, "device_type": "scale"},
            {"$set": {"connected": True, "last_sync": ts_str, "battery": battery}}
        )

    return {"errorCode": 0, "text": "success"}


@router.get("/lefu/wifi/config")
async def lefu_wifi_config(sn: str = '', mac: str = ''):
    """V2/V3 protocol - device config sync. Called by scale on boot."""
    now = datetime.now(timezone.utc)
    return {
        "errorCode": 0,
        "text": "success",
        "unit": 1,
        "time": int(now.timestamp()),
        "timeZone": 1
    }


@router.post("/lefu/wifi/torre/register")
async def lefu_torre_register(data: dict):
    """Torre/V4.0 protocol - device registration"""
    mac = data.get('mac', '')
    sn = data.get('sn', '')
    now = datetime.now(timezone.utc).isoformat()
    await db.lefu_devices.update_one({"mac": mac}, {"$set": {
        "mac": mac, "sn": sn, "model": data.get('type', ''), "protocol": "torre",
        "registered_at": now, "status": "active",
    }}, upsert=True)
    return {"code": 0, "msg": "success"}


@router.post("/lefu/wifi/torre/config")
async def lefu_torre_config(data: dict):
    """Torre/V4.0 protocol - device config sync"""
    now = datetime.now(timezone.utc)
    return {"code": 0, "data": {"unit": 1, "time": int(now.timestamp()), "timeZone": 1}}


@router.post("/lefu/wifi/torre/record")
async def lefu_torre_record(data: dict):
    """Torre/V4.0 protocol - weighing upload. Redirects to main handler."""
    return await lefu_weighing(data)


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


@router.get("/scale/history")
async def get_scale_history_alias(user=Depends(get_current_user)):
    """Backward-compatible alias for legacy clients."""
    return await get_scale_history(user)


@router.post("/devices/scale/link")
async def link_scale_to_user(body: dict, user=Depends(get_current_user)):
    """Link a BLE scale to the user by MAC address or device ID"""
    mac = body.get('mac', body.get('device_id', ''))
    name = body.get('name', 'Balance Lefu')
    if not mac:
        from fastapi import HTTPException
        raise HTTPException(400, "mac or device_id required")
    
    now = datetime.now(timezone.utc).isoformat()
    # Ensure scale device exists for user
    existing = await db.devices.find_one({"user_id": user['id'], "device_type": "scale"}, {"_id": 0})
    if existing:
        await db.devices.update_one(
            {"user_id": user['id'], "device_type": "scale"},
            {"$set": {"mac_address": mac, "name": name, "connected": True, "last_sync": now}}
        )
    else:
        await db.devices.insert_one({
            "id": str(uuid.uuid4()), "user_id": user['id'], "device_type": "scale",
            "mac_address": mac, "name": name, "connected": True, "battery": 100,
            "last_sync": now, "firmware_version": "1.0"
        })
    return {"status": "linked", "mac": mac}


@router.post("/devices/scale/ble-measurement")
async def ble_scale_measurement(body: dict, user=Depends(get_current_user)):
    """Store a BLE measurement from the app (when user weighs via Bluetooth)"""
    now = datetime.now(timezone.utc).isoformat()
    weight = body.get('weight', 0)
    impedance = body.get('impedance', 0)
    
    # Reject false readings (e.g. just touching the scale)
    if weight < 20:
        raise HTTPException(status_code=400, detail="Poids trop faible - mesure ignoree")
    
    # Try Lefu API for body composition
    body_data = {}
    if impedance:
        from services.lefu_service import calculate_body_data
        height = user.get('height_cm', 170)
        age = 50
        if user.get('date_of_birth'):
            try:
                dob = datetime.fromisoformat(user['date_of_birth'].replace('Z', '+00:00'))
                age = (datetime.now(timezone.utc) - dob).days // 365
            except: pass
        sex = 1 if user.get('gender', '').lower() in ('m', 'male', 'homme', 'masculin') else 0
        body_data = await calculate_body_data(weight, impedance, height, age, sex)
    
    # Use local BIA formulas as fallback
    if not body_data and weight > 0:
        height = user.get('height_cm', 170) / 100
        age = 50
        sex = 1 if user.get('gender', '').lower() in ('m', 'male', 'homme', 'masculin') else 0
        # Standard BIA formulas
        bmi = round(weight / (height ** 2), 1)
        fat_pct = round((1.20 * bmi) + (0.23 * age) - (10.8 * sex) - 5.4, 1) if sex == 1 else round((1.20 * bmi) + (0.23 * age) - 5.4, 1)
        fat_pct = max(5, min(60, fat_pct))
        lean = weight * (1 - fat_pct / 100)
        body_data = {
            "weight": weight, "bmi": bmi, "body_fat_pct": fat_pct,
            "muscle_mass": round(lean * 0.55, 1), "bone_mass": round(lean * 0.05, 1),
            "hydration_pct": round(lean / weight * 73, 1),
            "visceral_fat": round(max(1, bmi - 15), 1),
            "basal_metabolism": round(10 * weight + 6.25 * (height * 100) - 5 * age + (5 if sex == 1 else -161)),
            "body_age": max(18, age + round((bmi - 22) * 0.8)),
            "protein_pct": round(lean / weight * 20, 1),
            "health_score": round(max(40, min(100, 100 - abs(bmi - 22) * 3 - max(0, fat_pct - 25) * 1.5))),
        }
    
    _fat_kg = body_data.get('fat_kg', round(weight * body_data.get('body_fat_pct', 0) / 100, 1) if body_data.get('body_fat_pct') else 0)
    _muscle_rate = body_data.get('muscle_rate', round(body_data.get('muscle_mass', 0) / max(weight, 1) * 100, 1) if weight > 0 else 0)
    _lean = body_data.get('lean_body_mass', round(weight * (1 - body_data.get('body_fat_pct', 0) / 100), 1) if body_data.get('body_fat_pct') else 0)
    _skel_pct = body_data.get('skeletal_muscle_pct', 0)
    _skel_kg = body_data.get('skeletal_muscle_kg', 0)
    measurement = {
        "id": str(uuid.uuid4()), "user_id": user['id'], "device_type": "scale", "timestamp": now,
        "weight": body_data.get('weight', weight),
        "bmi": body_data.get('bmi', 0), "body_fat_pct": body_data.get('body_fat_pct', 0),
        "muscle_mass": body_data.get('muscle_mass', 0), "bone_mass": body_data.get('bone_mass', 0),
        "hydration_pct": body_data.get('hydration_pct', 0), "visceral_fat": body_data.get('visceral_fat', 0),
        "basal_metabolism": body_data.get('basal_metabolism', 0), "body_age": body_data.get('body_age', 0),
        "protein_pct": body_data.get('protein_pct', 0), "health_score": body_data.get('health_score', 0),
        "muscle_rate": _muscle_rate,
        "skeletal_muscle_kg": _skel_kg,
        "skeletal_muscle_pct": _skel_pct,
        "fat_kg": _fat_kg,
        "fat_control_kg": body_data.get('fat_control_kg', 0),
        "muscle_control_kg": body_data.get('muscle_control_kg', 0),
        "ideal_weight": body_data.get('ideal_weight', 0),
        "obesity_level": body_data.get('obesity_level', 0),
        "subcutaneous_fat": body_data.get('subcutaneous_fat', 0),
        "lean_body_mass": _lean,
        "body_type": body_data.get('body_type', 0),
        "heart_rate": body_data.get('heart_rate', 0),
        "impedance": impedance, "source": "ble",
        # Aliases for mobile app compatibility (old field names)
        "fat_mass": _fat_kg,
        "skeletal_muscle_rate": _skel_pct or _skel_kg,
        "fat_free_weight": _lean,
        "fat_control": body_data.get('fat_control_kg', 0),
        "muscle_control": body_data.get('muscle_control_kg', 0),
        "weight_control": body_data.get('weight_control_kg', 0),
        "standard_weight": body_data.get('standard_weight', 0),
        "body_shape": body_data.get('body_shape', 0),
        # Report page aliases
        "fat_mass_kg": _fat_kg,
        "muscle_mass_kg": body_data.get('muscle_mass', 0),
        "subcutaneous_fat_pct": body_data.get('subcutaneous_fat', 0),
        "skeletal_muscle_pct": _skel_pct,
        "score": body_data.get('health_score', 0),
        "status": "Bonne" if body_data.get('health_score', 0) >= 60 else "A surveiller",
        "date": now,
        "data": {
            "weight": body_data.get('weight', weight),
            "bmi": body_data.get('bmi', 0), "body_fat_pct": body_data.get('body_fat_pct', 0),
            "muscle_pct": round(body_data.get('muscle_mass', 0) / max(weight, 1) * 100, 1) if weight > 0 else 0,
            "water_pct": body_data.get('hydration_pct', 0), "visceral_fat": body_data.get('visceral_fat', 0),
            "body_age": body_data.get('body_age', 0), "bone_mass_kg": body_data.get('bone_mass', 0),
            "basal_metabolism": body_data.get('basal_metabolism', 0),
            "protein_pct": body_data.get('protein_pct', 0),
            "health_score_balance": body_data.get('health_score', 0),
            "skeletal_muscle_kg": body_data.get('skeletal_muscle_kg', 0),
            "skeletal_muscle_pct": _skel_pct,
            "fat_kg": _fat_kg,
            "fat_mass_kg": _fat_kg,
            "muscle_mass_kg": body_data.get('muscle_mass', 0),
            "ideal_weight": body_data.get('ideal_weight', 0),
            "subcutaneous_fat": body_data.get('subcutaneous_fat', 0),
            "subcutaneous_fat_pct": body_data.get('subcutaneous_fat', 0),
            "lean_body_mass": _lean,
        },
        # Segmental data (8-electrode)
        "segmental": {k: body_data[k] for k in body_data if k.startswith(('right_', 'left_', 'trunk_')) and body_data[k]},
        # All raw Lefu metrics for future use
        "all_lefu_metrics": body_data.get('all_lefu_metrics', {}),
    }
    await db.device_readings.insert_one(measurement)
    # Update device last_sync
    await db.devices.update_one(
        {"user_id": user['id'], "device_type": "scale"},
        {"$set": {"connected": True, "last_sync": now}}
    )
    return {k: v for k, v in measurement.items() if k != '_id'}
