from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, logging, struct

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def calc_crc(data: bytes) -> int:
    return sum(data) & 0xFF


def build_cmd(cmd: int, payload: bytes = b'') -> bytes:
    """Build a 16-byte command packet for bracelet 2208A"""
    pkt = bytes([cmd]) + payload + b'\x00' * (14 - len(payload))
    return pkt + bytes([calc_crc(pkt)])


def parse_bracelet_response(data: bytes) -> dict:
    """Parse 16-byte response from bracelet 2208A"""
    if len(data) < 16:
        return {"raw": data.hex(), "error": "packet too short"}
    cmd = data[0]
    result = {"cmd": cmd, "raw": data.hex()}

    # 0x09: Real-time step data
    if cmd == 0x09:
        steps = int.from_bytes(data[1:5], 'little')
        cals = int.from_bytes(data[5:9], 'little') / 100
        dist = int.from_bytes(data[9:13], 'little') / 100
        hr = data[13]
        result.update({"steps": steps, "calories": cals, "distance_km": dist, "heart_rate": hr})

    # 0x28: Health measurement response
    elif cmd == 0x28:
        result.update({
            "measurement_type": data[1],
            "heart_rate": data[2],
            "spo2": data[3],
            "hrv": data[4],
            "stress": data[5],
            "systolic": data[6],
            "diastolic": data[7],
            "temperature": (data[8] | (data[9] << 8)) / 10,
        })

    # 0x0D: Battery
    elif cmd == 0x0D:
        result["battery"] = data[1]

    # 0x51/0x52: Step data (historical / today)
    elif cmd in (0x51, 0x52):
        steps = data[1] | (data[2] << 8) | (data[3] << 16)
        cals = data[4] | (data[5] << 8)
        dist = data[6] | (data[7] << 8)
        result.update({"steps": steps, "calories": cals, "distance": dist})

    # 0x54/0x55: Heart rate data (historical / today)
    elif cmd in (0x54, 0x55):
        result["heart_rate"] = data[1]
        if data[2] > 0:
            result["heart_rate_min"] = data[2]
        if data[3] > 0:
            result["heart_rate_max"] = data[3]

    # 0x53: Sleep data response
    elif cmd == 0x53:
        # Sleep data packets contain minute-by-minute sleep stages
        # Each byte after cmd represents a sleep stage: 01=Deep, 02=Light, 03=REM, other=Awake
        stages = []
        for i in range(1, 15):
            if data[i] != 0xFF and data[i] != 0x00:
                stages.append(data[i])
        result["sleep_stages"] = stages

    return result


@router.post("/bracelet/push")
async def push_bracelet_data(request_body: dict, user=Depends(get_current_user)):
    """Receive parsed bracelet data from frontend BLE"""
    parsed = request_body.get('parsed', {})
    raw_hex = request_body.get('raw_hex', '')
    device_id = request_body.get('device_id', '')

    if not parsed and raw_hex:
        try:
            parsed = parse_bracelet_response(bytes.fromhex(raw_hex))
        except:
            pass

    if not parsed:
        raise HTTPException(status_code=400, detail="No data")

    now = datetime.now(timezone.utc).isoformat()
    cmd = parsed.get('cmd', 0)

    reading = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "device_type": "bracelet",
        "device_id": device_id,
        "cmd": cmd,
        "data": parsed,
        "raw_hex": raw_hex,
        "timestamp": now,
    }

    # Update device status
    update_fields = {"connected": True, "last_sync": now, "ble_device_id": device_id}
    if 'battery' in parsed:
        update_fields['battery'] = parsed['battery']
    if 'heart_rate' in parsed and parsed['heart_rate'] > 0:
        update_fields['last_heart_rate'] = parsed['heart_rate']
    if 'spo2' in parsed and parsed['spo2'] > 0:
        update_fields['last_spo2'] = parsed['spo2']
    if 'temperature' in parsed and parsed['temperature'] > 30:
        update_fields['last_temperature'] = parsed['temperature']
    if 'steps' in parsed and parsed['steps'] > 0:
        update_fields['last_steps'] = parsed['steps']
    if 'calories' in parsed and parsed['calories'] > 0:
        update_fields['last_calories'] = parsed['calories']
    if 'systolic' in parsed and parsed['systolic'] > 0:
        update_fields['last_systolic'] = parsed['systolic']
        update_fields['last_diastolic'] = parsed.get('diastolic', 0)
    if 'hrv' in parsed and parsed['hrv'] > 0:
        update_fields['last_hrv'] = parsed['hrv']
    if 'stress' in parsed and parsed['stress'] > 0:
        update_fields['last_stress'] = parsed['stress']

    await db.devices.update_one(
        {"user_id": user['id'], "device_type": "bracelet", "removed": {"$ne": True}},
        {"$set": update_fields}
    )

    # Store reading
    await db.device_readings.insert_one(reading)

    # Check for anomalies
    hr = parsed.get('heart_rate', 0)
    spo2 = parsed.get('spo2', 0)
    temp = parsed.get('temperature', 0)

    if hr > 120 or (hr > 0 and hr < 50):
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user.get('name', ''),
            "alert_type": "anomaly", "severity": "high",
            "message": f"Frequence cardiaque anormale: {hr} bpm",
            "device_type": "bracelet", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })

    if spo2 > 0 and spo2 < 92:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user.get('name', ''),
            "alert_type": "anomaly", "severity": "critical",
            "message": f"SpO2 critique: {spo2}%",
            "device_type": "bracelet", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })

    return {k: v for k, v in reading.items() if k != '_id'}


@router.get("/bracelet/status")
async def get_bracelet_status(user=Depends(get_current_user)):
    """Get bracelet connection status and latest vitals"""
    device = await db.devices.find_one(
        {"user_id": user['id'], "device_type": "bracelet"}, {"_id": 0}
    )
    is_connected = False
    if device and device.get('last_sync'):
        try:
            last = datetime.fromisoformat(device['last_sync'].replace('Z', '+00:00'))
            is_connected = (datetime.now(timezone.utc) - last).total_seconds() < 60
        except:
            pass

    return {
        "device": device,
        "connected": is_connected,
        "battery": device.get('battery', 0) if device else 0,
        "heart_rate": device.get('last_heart_rate', 0) if device else 0,
        "spo2": device.get('last_spo2', 0) if device else 0,
        "temperature": device.get('last_temperature', 0) if device else 0,
        "steps": device.get('last_steps', 0) if device else 0,
        "systolic": device.get('last_systolic', 0) if device else 0,
        "diastolic": device.get('last_diastolic', 0) if device else 0,
        "last_sync": device.get('last_sync') if device else None,
        "paired": bool(device and device.get('last_sync')),
    }


@router.post("/bracelet/unpair")
async def unpair_bracelet(user=Depends(get_current_user)):
    await db.devices.update_one(
        {"user_id": user['id'], "device_type": "bracelet"},
        {"$set": {"connected": False, "ble_device_id": "", "last_sync": None, "battery": 0,
                  "last_heart_rate": 0, "last_spo2": 0, "last_temperature": 0, "last_steps": 0}}
    )
    return {"status": "unpaired"}


@router.get("/bracelet/ble-config")
async def get_bracelet_ble_config():
    """BLE configuration for bracelet 2208A"""
    return {
        "commands": {
            "get_battery": "0D00000000000000000000000000000D",
            "get_time": "0100000000000000000000000000 01",
            "start_realtime": "09010100000000000000000000000B",
            "stop_realtime": "09000000000000000000000000000009",
            "start_heart_rate": "28020100000000000000000000002B",
            "start_spo2": "28030100000000000000000000002C",
            "start_hrv": "28010100000000000000000000002A",
            "get_steps": "51000000000000000000000000000051",
            "get_sleep": "53000000000000000000000000000053",
            "get_heart_rate": "54000000000000000000000000000054",
        },
        "packet_size": 16,
        "crc": "sum of first 15 bytes & 0xFF",
    }
