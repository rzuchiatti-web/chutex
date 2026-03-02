from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, logging, asyncio

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def parse_vest_data(raw: str) -> dict:
    """Parse S-AIRBAG vest BLE data format: @&key=value&key=value&#"""
    data = {}
    cleaned = raw.strip()
    if cleaned.startswith('@'):
        cleaned = cleaned[1:]
    if cleaned.endswith('#'):
        cleaned = cleaned[:-1]
    parts = cleaned.split('&')
    for part in parts:
        if '=' in part:
            key, val = part.split('=', 1)
            key = key.strip()
            if not key:
                continue
            try:
                if key in ('accx', 'accy', 'accz', 'gyrox', 'gyroy', 'gyroz', 'roll',
                           'bat', 'csq', 'step', 'no', 'sos', 'fault', 'type', 'mod',
                           'firstflag', 'secondflag', 'lac', 'cid'):
                    data[key] = int(val)
                elif key in ('latt', 'lng'):
                    data[key] = float(val)
                else:
                    data[key] = val
            except (ValueError, TypeError):
                data[key] = val
    return data


@router.post("/vest/data")
async def receive_vest_data(user=Depends(get_current_user)):
    """Receive raw BLE data from the S-AIRBAG vest"""
    from fastapi import Request
    # This will be called from frontend with parsed data
    pass


@router.post("/vest/push")
async def push_vest_data(request_body: dict, user=Depends(get_current_user)):
    """Receive parsed vest data from the frontend BLE connection"""
    raw_data = request_body.get('raw', '')
    parsed = request_body.get('parsed', {})
    device_id = request_body.get('device_id', '')

    if raw_data and not parsed:
        parsed = parse_vest_data(raw_data)

    if not parsed:
        raise HTTPException(status_code=400, detail="Aucune donnee")

    data_type = parsed.get('type', 0)
    now = datetime.now(timezone.utc).isoformat()

    reading = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "device_type": "vest",
        "device_id": parsed.get('id', device_id),
        "data_type": data_type,
        "data": parsed,
        "raw": raw_data,
        "timestamp": now,
    }

    # type=1: Normal data (battery, steps, location)
    if data_type == 1:
        reading['battery'] = parsed.get('bat', 0)
        reading['steps'] = parsed.get('step', 0)
        reading['wear_location'] = 'belt' if parsed.get('no', 0) < 20 else 'vest'
        await db.device_readings.insert_one(reading)
        # Update device status
        await db.devices.update_one(
            {"user_id": user['id'], "device_type": "vest", "removed": {"$ne": True}},
            {"$set": {
                "connected": True,
                "last_sync": now,
                "battery": parsed.get('bat', 0),
                "ble_device_id": parsed.get('id', ''),
                "wear_location": reading['wear_location'],
            }}
        )
        return {k: v for k, v in reading.items() if k != '_id'}

    # type=2: SOS or Fault alarm
    if data_type == 2:
        is_sos = parsed.get('sos', 0) == 1
        is_fault = parsed.get('fault', 0) == 1
        await db.device_readings.insert_one(reading)

        if is_sos:
            alert_id = str(uuid.uuid4())
            alert = {
                "id": alert_id,
                "beneficiary_id": user['id'],
                "beneficiary_name": user.get('name', ''),
                "alert_type": "sos",
                "severity": "critical",
                "message": f"SOS declenche depuis le gilet anti-chute ({parsed.get('id', 'inconnu')})",
                "device_type": "vest",
                "status": "active",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
                "teleassistance_status": "pending",
            }
            await db.alerts.insert_one(alert)
            # Trigger auto escalation if available
            try:
                from routes.teleassistance_routes import auto_escalation_protocol
                asyncio.create_task(auto_escalation_protocol(alert))
            except Exception as e:
                logger.error(f"Auto escalation error: {e}")

            return {"alert": "sos", "alert_id": alert_id, "message": "Alerte SOS creee"}

        if is_fault:
            await db.alerts.insert_one({
                "id": str(uuid.uuid4()),
                "beneficiary_id": user['id'],
                "beneficiary_name": user.get('name', ''),
                "alert_type": "anomaly",
                "severity": "medium",
                "message": f"Panne detectee sur le gilet ({parsed.get('id', 'inconnu')})",
                "device_type": "vest",
                "status": "active",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
                "teleassistance_status": "pending",
            })
            return {"alert": "fault", "message": "Alerte panne gilet creee"}

        return {k: v for k, v in reading.items() if k != '_id'}

    # type=3: Sensor data (accelerometer, gyroscope)
    if data_type == 3:
        await db.device_readings.insert_one(reading)
        return {k: v for k, v in reading.items() if k != '_id'}

    # Unknown type - store anyway
    await db.device_readings.insert_one(reading)
    return {k: v for k, v in reading.items() if k != '_id'}


@router.get("/vest/status")
async def get_vest_status(user=Depends(get_current_user)):
    """Get current vest connection status and latest data"""
    device = await db.devices.find_one(
        {"user_id": user['id'], "device_type": "vest"}, {"_id": 0}
    )
    latest = await db.device_readings.find_one(
        {"user_id": user['id'], "device_type": "vest"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    # Check if vest is really connected (data received in last 60 seconds)
    is_connected = False
    bat = 0
    if device and device.get('last_sync'):
        try:
            last_sync = datetime.fromisoformat(device['last_sync'].replace('Z', '+00:00'))
            diff = (datetime.now(timezone.utc) - last_sync).total_seconds()
            is_connected = diff < 60  # 1 minute
            bat = device.get('battery', 0)
        except:
            pass
    return {
        "device": device,
        "latest_reading": latest,
        "connected": is_connected,
        "battery": bat,
        "last_sync": device.get('last_sync') if device else None,
    }


@router.get("/vest/history")
async def get_vest_history(user=Depends(get_current_user), limit: int = 50):
    """Get vest data history"""
    readings = await db.device_readings.find(
        {"user_id": user['id'], "device_type": "vest"},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return readings


@router.post("/vest/unpair")
async def unpair_vest(user=Depends(get_current_user)):
    """Remove vest pairing from user account"""
    await db.devices.update_one(
        {"user_id": user['id'], "device_type": "vest"},
        {"$set": {"connected": False, "ble_device_id": "", "last_sync": None, "battery": 0}}
    )
    return {"status": "unpaired"}


# BLE Protocol constants for frontend reference
@router.get("/vest/ble-config")
async def get_vest_ble_config():
    """Return BLE configuration for the S-AIRBAG vest"""
    return {
        "device_name_prefix": "Elder",
        "services": [
            {
                "uuid": "0000ffe0-0000-1000-8000-00805f9b34fb",
                "characteristics": {
                    "notify": "0000ffe4-0000-1000-8000-00805f9b34fb",
                }
            },
            {
                "uuid": "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
                "characteristics": {
                    "notify": "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
                    "write": "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
                }
            },
        ],
        "data_format": {
            "start": "@",
            "end": "#",
            "separator": "&",
            "types": {
                "1": "Donnees normales (batterie, pas, localisation)",
                "2": "Alarme SOS ou panne",
                "3": "Donnees capteurs (accelerometre, gyroscope)",
            }
        },
        "wear_locations": {
            "10": "Ceinture",
            "20": "Gilet",
            "30": "Gilet",
        },
        "time_write_format": "time&YYYY-MM-DD-HH-mm-ss",
    }
