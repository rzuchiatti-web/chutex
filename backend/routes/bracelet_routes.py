from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta, timedelta
import uuid, logging, struct

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# ═══════════════════════════════════════════
#  V6 BRACELET - BLE GATT Standard Services
# ═══════════════════════════════════════════
# The V6 bracelet uses standard BLE GATT health profiles:
# - Heart Rate Service (0x180D) -> HR, RR-interval (for HRV)
# - Blood Pressure Service (0x1810) -> systolic, diastolic, MAP
# - Pulse Oximeter (0x1822) -> SpO2, pulse rate
# - Health Thermometer (0x1809) -> temperature
# - Custom PPG Service -> raw PPG waveform data
# - Custom ECG Service -> raw ECG waveform

V6_BLE_CONFIG = {
    "device_name_prefixes": ["V6", "Elio-V6", "ChutexV6", "HB6", "2358"],
    "services": {
        "heart_rate": {"uuid": "0000180d-0000-1000-8000-00805f9b34fb", "char_measurement": "00002a37-0000-1000-8000-00805f9b34fb"},
        "blood_pressure": {"uuid": "00001810-0000-1000-8000-00805f9b34fb", "char_measurement": "00002a35-0000-1000-8000-00805f9b34fb"},
        "spo2": {"uuid": "00001822-0000-1000-8000-00805f9b34fb", "char_measurement": "00002a5e-0000-1000-8000-00805f9b34fb"},
        "temperature": {"uuid": "00001809-0000-1000-8000-00805f9b34fb", "char_measurement": "00002a1c-0000-1000-8000-00805f9b34fb"},
        "battery": {"uuid": "0000180f-0000-1000-8000-00805f9b34fb", "char_level": "00002a19-0000-1000-8000-00805f9b34fb"},
        "device_info": {"uuid": "0000180a-0000-1000-8000-00805f9b34fb"},
        "ppg_custom": {"uuid": "0000ffe0-0000-1000-8000-00805f9b34fb", "char_data": "0000ffe1-0000-1000-8000-00805f9b34fb", "char_control": "0000ffe2-0000-1000-8000-00805f9b34fb"},
        "ecg_custom": {"uuid": "0000fff0-0000-1000-8000-00805f9b34fb", "char_data": "0000fff1-0000-1000-8000-00805f9b34fb", "char_control": "0000fff2-0000-1000-8000-00805f9b34fb"},
    },
    "4g_api": {
        "base_url": "https://api.v6health.com",
        "data_endpoint": "/api/v1/device/{device_id}/data",
        "realtime_endpoint": "/api/v1/device/{device_id}/realtime",
    },
}


def parse_v6_heart_rate(data: bytes) -> dict:
    """Parse BLE Heart Rate Measurement (0x2A37)"""
    if len(data) < 2:
        return {}
    flags = data[0]
    hr_format_16bit = flags & 0x01
    rr_present = (flags >> 4) & 0x01

    result = {}
    offset = 1
    if hr_format_16bit:
        result["heart_rate"] = int.from_bytes(data[offset:offset+2], 'little')
        offset += 2
    else:
        result["heart_rate"] = data[offset]
        offset += 1

    # RR intervals (for HRV calculation)
    if rr_present and offset + 1 < len(data):
        rr_intervals = []
        while offset + 1 < len(data):
            rr = int.from_bytes(data[offset:offset+2], 'little') / 1024.0 * 1000  # Convert to ms
            rr_intervals.append(round(rr, 1))
            offset += 2
        result["rr_intervals"] = rr_intervals
        if len(rr_intervals) >= 2:
            diffs = [abs(rr_intervals[i+1] - rr_intervals[i]) for i in range(len(rr_intervals)-1)]
            result["hrv"] = round(sum(diffs) / len(diffs), 1)  # RMSSD approximation

    return result


def parse_v6_blood_pressure(data: bytes) -> dict:
    """Parse BLE Blood Pressure Measurement (0x2A35)"""
    if len(data) < 7:
        return {}
    flags = data[0]
    systolic = struct.unpack_from('<H', data, 1)[0] / 10.0
    diastolic = struct.unpack_from('<H', data, 3)[0] / 10.0
    mean_ap = struct.unpack_from('<H', data, 5)[0] / 10.0
    return {"systolic": round(systolic), "diastolic": round(diastolic), "mean_arterial": round(mean_ap)}


def parse_v6_spo2(data: bytes) -> dict:
    """Parse SpO2 measurement"""
    if len(data) < 4:
        return {}
    spo2 = struct.unpack_from('<H', data, 0)[0] / 10.0
    pulse = struct.unpack_from('<H', data, 2)[0] / 10.0
    return {"spo2": round(spo2), "pulse_rate": round(pulse)}


def parse_v6_temperature(data: bytes) -> dict:
    """Parse BLE Health Thermometer (0x2A1C)"""
    if len(data) < 5:
        return {}
    flags = data[0]
    # IEEE-11073 FLOAT (4 bytes)
    mantissa = int.from_bytes(data[1:4], 'little', signed=True)
    exponent = struct.unpack_from('b', data, 4)[0]
    temp = mantissa * (10 ** exponent)
    return {"temperature": round(temp, 1)}


@router.post("/bracelet/v6/4g/push")
async def push_v6_4g_data(request_body: dict):
    """Receive V6 bracelet data via 4G firmware webhook (no auth required).
    The bracelet pushes data directly to our server. User identified by IMEI/MAC."""
    imei = request_body.get("imei", request_body.get("device_id", ""))
    mac = request_body.get("mac", "")
    now = datetime.now(timezone.utc).isoformat()

    # Find user by IMEI or MAC
    device = await db.devices.find_one(
        {"device_type": "bracelet", "$or": [{"imei": imei}, {"ble_device_id": mac}, {"mac_address": mac}, {"ble_device_id": imei}]},
        {"_id": 0}
    )
    user_id = device.get("user_id") if device else None

    # Parse all vitals from the payload
    hr = request_body.get("heart_rate", request_body.get("heartRate", 0))
    spo2 = request_body.get("spo2", request_body.get("bloodOxygen", 0))
    temp = request_body.get("temperature", request_body.get("bodyTemp", 0))
    systolic = request_body.get("systolic", request_body.get("bloodPressureHigh", 0))
    diastolic = request_body.get("diastolic", request_body.get("bloodPressureLow", 0))
    steps = request_body.get("steps", 0)
    calories = request_body.get("calories", 0)
    hrv = request_body.get("hrv", 0)
    battery = request_body.get("battery", request_body.get("bat", 0))
    sleep_data = request_body.get("sleep", None)
    timestamp = request_body.get("timestamp", now)

    # Store consolidated reading
    reading = {
        "id": str(uuid.uuid4()), "user_id": user_id,
        "device_type": "bracelet", "device_model": "v6",
        "device_id": imei or mac, "data_type": "consolidated", "source": "4g",
        "data": {
            "heart_rate": hr, "spo2": spo2, "temperature": temp,
            "systolic": systolic, "diastolic": diastolic,
            "steps": steps, "calories": calories, "hrv": hrv, "battery": battery,
        },
        "timestamp": timestamp, "raw_data": request_body,
    }
    await db.device_readings.insert_one({k: v for k, v in reading.items() if k != '_id'})

    # Store individual readings for metric history
    if hr > 0:
        await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "bracelet", "device_model": "v6", "data_type": "heart_rate", "data": {"heart_rate": hr, "hrv": hrv}, "source": "4g", "timestamp": timestamp})
    if spo2 > 0:
        await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "bracelet", "device_model": "v6", "data_type": "spo2", "data": {"spo2": spo2}, "source": "4g", "timestamp": timestamp})
    if systolic > 0:
        await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "bracelet", "device_model": "v6", "data_type": "blood_pressure", "data": {"systolic": systolic, "diastolic": diastolic}, "source": "4g", "timestamp": timestamp})
    if sleep_data:
        await db.device_readings.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "device_type": "bracelet", "device_model": "v6", "data_type": "sleep", "data": sleep_data, "source": "4g", "timestamp": timestamp})

    # Update device status
    update_fields = {"connected": True, "last_sync": now, "model": "v6", "imei": imei}
    if hr > 0: update_fields["last_heart_rate"] = hr
    if spo2 > 0: update_fields["last_spo2"] = spo2
    if temp > 30: update_fields["last_temperature"] = temp
    if systolic > 0: update_fields["last_systolic"] = systolic; update_fields["last_diastolic"] = diastolic
    if steps > 0: update_fields["last_steps"] = steps
    if calories > 0: update_fields["last_calories"] = calories
    if hrv > 0: update_fields["last_hrv"] = hrv
    if battery > 0: update_fields["battery"] = battery

    if user_id:
        await db.devices.update_one(
            {"user_id": user_id, "device_type": "bracelet"},
            {"$set": update_fields}, upsert=True
        )
    else:
        # Store for later association
        await db.devices.update_one(
            {"imei": imei, "device_type": "bracelet"},
            {"$set": {**update_fields, "device_type": "bracelet"}}, upsert=True
        )

    # Anomaly detection
    if hr > 120 or (hr > 0 and hr < 50):
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": user_id or "",
            "alert_type": "anomaly", "severity": "high",
            "message": f"Frequence cardiaque anormale: {hr} bpm (V6 4G)",
            "device_type": "bracelet", "device_model": "v6", "status": "active",
            "created_at": now, "resolved_at": None,
        })
    if spo2 > 0 and spo2 < 92:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": user_id or "",
            "alert_type": "anomaly", "severity": "critical",
            "message": f"SpO2 critique: {spo2}% (V6 4G)",
            "device_type": "bracelet", "device_model": "v6", "status": "active",
            "created_at": now, "resolved_at": None,
        })

    return {"code": 0, "msg": "success", "user_matched": user_id is not None}


@router.post("/bracelet/v6/push")
async def push_v6_data(request_body: dict, user=Depends(get_current_user)):
    """Receive parsed V6 bracelet data from frontend BLE or 4G relay"""
    data_type = request_body.get("data_type", "")  # heart_rate, blood_pressure, spo2, temperature, ppg, ecg, steps
    raw_data = request_body.get("data", {})
    device_id = request_body.get("device_id", "")
    source = request_body.get("source", "ble")  # ble or 4g

    if not data_type or not raw_data:
        raise HTTPException(400, "data_type et data requis")

    now = datetime.now(timezone.utc).isoformat()
    uid = user["id"]

    # Build reading document
    reading = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "device_type": "bracelet",
        "device_model": "v6",
        "device_id": device_id,
        "data_type": data_type,
        "data": raw_data,
        "source": source,
        "timestamp": now,
    }

    # Update device status with latest values
    update_fields = {"connected": True, "last_sync": now, "ble_device_id": device_id, "model": "v6"}
    if data_type == "heart_rate":
        if raw_data.get("heart_rate", 0) > 0:
            update_fields["last_heart_rate"] = raw_data["heart_rate"]
        if raw_data.get("hrv", 0) > 0:
            update_fields["last_hrv"] = raw_data["hrv"]
        if raw_data.get("rr_intervals"):
            update_fields["last_rr_intervals"] = raw_data["rr_intervals"]
    elif data_type == "blood_pressure":
        if raw_data.get("systolic", 0) > 0:
            update_fields["last_systolic"] = raw_data["systolic"]
            update_fields["last_diastolic"] = raw_data.get("diastolic", 0)
    elif data_type == "spo2":
        if raw_data.get("spo2", 0) > 0:
            update_fields["last_spo2"] = raw_data["spo2"]
    elif data_type == "temperature":
        if raw_data.get("temperature", 0) > 30:
            update_fields["last_temperature"] = raw_data["temperature"]
    elif data_type == "steps":
        if raw_data.get("steps", 0) > 0:
            update_fields["last_steps"] = raw_data["steps"]
        if raw_data.get("calories", 0) > 0:
            update_fields["last_calories"] = raw_data["calories"]
    elif data_type == "battery":
        if raw_data.get("battery", 0) > 0:
            update_fields["battery"] = raw_data["battery"]
    elif data_type == "ppg":
        update_fields["last_ppg_timestamp"] = now
    elif data_type == "ecg":
        update_fields["last_ecg_timestamp"] = now

    await db.devices.update_one(
        {"user_id": uid, "device_type": "bracelet", "removed": {"$ne": True}},
        {"$set": update_fields},
        upsert=True
    )

    # Store reading
    await db.device_readings.insert_one(reading)

    # Also store a consolidated "bracelet" reading for health report compatibility
    consolidated = {}
    if data_type == "heart_rate":
        consolidated["heart_rate"] = raw_data.get("heart_rate", 0)
        consolidated["hrv"] = raw_data.get("hrv", 0)
    elif data_type == "blood_pressure":
        consolidated["blood_pressure"] = {"systolic": raw_data.get("systolic", 0), "diastolic": raw_data.get("diastolic", 0)}
    elif data_type == "spo2":
        consolidated["spo2"] = raw_data.get("spo2", 0)
    elif data_type == "temperature":
        consolidated["temperature"] = raw_data.get("temperature", 0)
    elif data_type == "steps":
        consolidated["steps"] = raw_data.get("steps", 0)
        consolidated["calories"] = raw_data.get("calories", 0)

    if consolidated:
        existing = await db.device_readings.find_one(
            {"user_id": uid, "device_type": "bracelet", "device_model": "v6", "data_type": "consolidated", "timestamp": {"$gte": now[:10]}},
            {"_id": 0}
        )
        if existing:
            merged = {**existing.get("data", {}), **consolidated}
            await db.device_readings.update_one(
                {"id": existing["id"]},
                {"$set": {"data": merged, "timestamp": now}}
            )
        else:
            await db.device_readings.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "device_type": "bracelet",
                "device_model": "v6",
                "data_type": "consolidated",
                "data": consolidated,
                "timestamp": now,
            })

    # Anomaly detection
    hr = raw_data.get("heart_rate", 0)
    spo2 = raw_data.get("spo2", 0)

    if hr > 120 or (hr > 0 and hr < 50):
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "high",
            "message": f"Frequence cardiaque anormale: {hr} bpm (V6)",
            "device_type": "bracelet", "device_model": "v6", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })

    if spo2 > 0 and spo2 < 92:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "critical",
            "message": f"SpO2 critique: {spo2}% (V6)",
            "device_type": "bracelet", "device_model": "v6", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })

    return {k: v for k, v in reading.items() if k != "_id"}


@router.get("/bracelet/v6/config")
async def get_v6_ble_config():
    """BLE configuration for V6 bracelet — used by frontend to discover and connect"""
    return V6_BLE_CONFIG


@router.get("/bracelet/v6/ppg-history")
async def get_ppg_history(user=Depends(get_current_user)):
    """Get recent PPG waveform data — used for ML glycemia estimation"""
    uid = user["id"]
    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data_type": "ppg"},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    return {"readings": readings, "count": len(readings)}


@router.get("/bracelet/v6/ecg-history")
async def get_ecg_history(user=Depends(get_current_user)):
    """Get recent ECG waveform data"""
    uid = user["id"]
    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data_type": "ecg"},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(20)
    return {"readings": readings, "count": len(readings)}


# ═══════════════════════════════════════════
#  LEGACY 2208A BRACELET (unchanged)
# ═══════════════════════════════════════════


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


# ═══════════════════════════════════════════
#  V8 BRACELET — JStyle BLE SDK V8
# ═══════════════════════════════════════════
# JCVital V8: ECG + PPG multi-spectral + blood glucose + VO2max
# Same JStyle proprietary BLE protocol (0xFFF0), extended commands

V8_BLE_CONFIG = {
    "device_name_prefixes": ["V8", "JCV8", "Elio-V8", "HB8", "2301"],
    "services": {
        "main": {"uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
                 "char_notify": "0000fff7-0000-1000-8000-00805f9b34fb",
                 "char_write": "0000fff6-0000-1000-8000-00805f9b34fb"},
        "heart_rate": {"uuid": "0000180d-0000-1000-8000-00805f9b34fb",
                       "char_measurement": "00002a37-0000-1000-8000-00805f9b34fb"},
        "battery": {"uuid": "0000180f-0000-1000-8000-00805f9b34fb",
                    "char_level": "00002a19-0000-1000-8000-00805f9b34fb"},
        "ppg_custom": {"uuid": "0000ffe0-0000-1000-8000-00805f9b34fb",
                       "char_data": "0000ffe1-0000-1000-8000-00805f9b34fb"},
    },
    "commands": {
        "set_time": 0x01,
        "get_battery": 0x0D,
        "realtime_step": 0x09,
        "get_total_data": 0x51,
        "get_today_steps": 0x52,
        "get_sleep": 0x53,
        "get_today_hr": 0x55,
        "start_measurement": 0x28,  # sub: 1=HRV+BP, 2=HR, 3=SpO2
        "start_ecg": 0x32,
        "stop_ecg": 0x33,
        "get_blood_glucose": 0x50,
        "get_hrv_data": 0x29,
        "get_temperature": 0x26,
        "get_sport_data": 0x43,
        "start_sport": 0x44,
        "stop_sport": 0x45,
    },
    "sport_modes": {
        0: "course", 1: "velo", 2: "badminton", 3: "football", 4: "tennis",
        5: "yoga", 6: "respiration", 7: "danse", 8: "basketball", 9: "marche",
        10: "musculation", 11: "cricket", 12: "randonnee", 13: "aerobic", 14: "ping-pong",
    },
}


def parse_v8_ecg(data: bytes) -> dict:
    """Parse V8 ECG data packet — raw waveform + derived values."""
    if len(data) < 4:
        return {}
    result = {"ecg_raw": []}
    cmd_sub = data[0] if len(data) > 0 else 0
    # ECG waveform: 2-byte signed samples at 250Hz
    for i in range(1, len(data) - 1, 2):
        if i + 1 < len(data):
            sample = int.from_bytes(data[i:i+2], 'little', signed=True)
            result["ecg_raw"].append(sample)
    return result


def parse_v8_ecg_result(data: bytes) -> dict:
    """Parse V8 ECG analysis result."""
    if len(data) < 10:
        return {}
    return {
        "ecg_hr": data[1],
        "ecg_hrv": data[2],
        "ecg_breath_rate": data[3],
        "ecg_stress": data[4],
        "ecg_mood": data[5],
        "ecg_systolic": data[6],
        "ecg_diastolic": data[7],
        "ecg_vascular_aging": data[8],
        "ecg_av_block": data[9] if len(data) > 9 else 0,
        "ecg_quality": data[10] if len(data) > 10 else 0,
    }


def parse_v8_blood_glucose(data: bytes) -> dict:
    """Parse V8 blood glucose estimation from PPG multi-spectral."""
    if len(data) < 4:
        return {}
    # Blood glucose: progress byte + value (mmol/L * 10)
    progress = data[1]
    if progress < 100:
        return {"glucose_progress": progress}
    raw_value = (data[2] | (data[3] << 8))
    glucose_mmol = raw_value / 10.0
    glucose_mgdl = round(glucose_mmol * 18.0)
    return {
        "blood_glucose_mmol": round(glucose_mmol, 1),
        "blood_glucose_mgdl": glucose_mgdl,
        "glucose_progress": 100,
    }


def parse_v8_temperature(data: bytes) -> dict:
    """Parse V8 3-NTC temperature."""
    if len(data) < 4:
        return {}
    temp_raw = data[1] | (data[2] << 8)
    temp = temp_raw / 10.0
    axillary_raw = data[3] | (data[4] << 8) if len(data) > 4 else 0
    axillary = axillary_raw / 10.0 if axillary_raw > 0 else None
    result = {"temperature": round(temp, 1)}
    if axillary and axillary > 30:
        result["axillary_temperature"] = round(axillary, 1)
    return result


def calculate_vo2max(hr_rest: int, hr_max: int, age: int, weight: float, gender: str = "male") -> dict:
    """Calculate VO2max from HRV + HR data (Uth et al. method + Astrand correction)."""
    if hr_rest <= 0 or hr_max <= 0 or hr_rest >= hr_max:
        return {"vo2max": 0, "level": "insuffisant", "confidence": "low"}
    # Uth–Sørensen–Overgaard–Pedersen method
    vo2max = 15.3 * (hr_max / hr_rest)
    # Age correction (declines ~1% per year after 25)
    if age > 25:
        vo2max *= (1 - 0.005 * (age - 25))
    # Gender adjustment
    if gender == "female":
        vo2max *= 0.85
    vo2max = round(max(10, min(80, vo2max)), 1)
    # Classification (ACSM norms)
    if gender == "female":
        if vo2max >= 42: level = "excellent"
        elif vo2max >= 35: level = "bon"
        elif vo2max >= 28: level = "moyen"
        elif vo2max >= 22: level = "faible"
        else: level = "tres_faible"
    else:
        if vo2max >= 48: level = "excellent"
        elif vo2max >= 40: level = "bon"
        elif vo2max >= 33: level = "moyen"
        elif vo2max >= 27: level = "faible"
        else: level = "tres_faible"
    return {"vo2max": vo2max, "level": level, "confidence": "high" if hr_max > hr_rest * 1.3 else "medium"}


@router.get("/bracelet/v8/config")
async def get_v8_ble_config():
    """BLE configuration for V8 bracelet — used by frontend to discover and connect."""
    return V8_BLE_CONFIG


@router.post("/bracelet/v8/push")
async def push_v8_data(request_body: dict, user=Depends(get_current_user)):
    """Receive V8 bracelet data from frontend BLE."""
    data_type = request_body.get("data_type", "")
    raw_data = request_body.get("data", {})
    device_id = request_body.get("device_id", "")

    if not data_type or not raw_data:
        raise HTTPException(400, "data_type et data requis")

    now = datetime.now(timezone.utc).isoformat()
    uid = user["id"]

    reading = {
        "id": str(uuid.uuid4()), "user_id": uid,
        "device_type": "bracelet", "device_model": "v8",
        "device_id": device_id, "data_type": data_type,
        "data": raw_data, "source": "ble", "timestamp": now,
    }

    # Update device status
    update_fields: dict = {"connected": True, "last_sync": now, "ble_device_id": device_id, "model": "v8"}

    if data_type == "heart_rate":
        if raw_data.get("heart_rate", 0) > 0:
            update_fields["last_heart_rate"] = raw_data["heart_rate"]
        if raw_data.get("hrv", 0) > 0:
            update_fields["last_hrv"] = raw_data["hrv"]
    elif data_type == "blood_pressure":
        if raw_data.get("systolic", 0) > 0:
            update_fields["last_systolic"] = raw_data["systolic"]
            update_fields["last_diastolic"] = raw_data.get("diastolic", 0)
    elif data_type == "spo2":
        if raw_data.get("spo2", 0) > 0:
            update_fields["last_spo2"] = raw_data["spo2"]
    elif data_type == "temperature":
        if raw_data.get("temperature", 0) > 30:
            update_fields["last_temperature"] = raw_data["temperature"]
    elif data_type == "steps":
        if raw_data.get("steps", 0) > 0:
            update_fields["last_steps"] = raw_data["steps"]
        if raw_data.get("calories", 0) > 0:
            update_fields["last_calories"] = raw_data["calories"]
    elif data_type == "battery":
        if raw_data.get("battery", 0) > 0:
            update_fields["battery"] = raw_data["battery"]
    elif data_type == "ecg":
        update_fields["last_ecg_timestamp"] = now
        if raw_data.get("ecg_hr", 0) > 0:
            update_fields["last_heart_rate"] = raw_data["ecg_hr"]
        if raw_data.get("ecg_hrv", 0) > 0:
            update_fields["last_hrv"] = raw_data["ecg_hrv"]
    elif data_type == "ecg_result":
        update_fields["last_ecg_result"] = now
        for k in ["ecg_hr", "ecg_hrv", "ecg_breath_rate", "ecg_stress", "ecg_mood",
                   "ecg_systolic", "ecg_diastolic", "ecg_vascular_aging"]:
            if raw_data.get(k, 0) > 0:
                update_fields[f"last_{k}"] = raw_data[k]
    elif data_type == "blood_glucose":
        if raw_data.get("blood_glucose_mgdl", 0) > 0:
            update_fields["last_blood_glucose"] = raw_data["blood_glucose_mgdl"]
    elif data_type == "ppg":
        update_fields["last_ppg_timestamp"] = now

    await db.devices.update_one(
        {"user_id": uid, "device_type": "bracelet", "removed": {"$ne": True}},
        {"$set": update_fields}, upsert=True
    )

    await db.device_readings.insert_one(reading)

    # Consolidated reading for health report compatibility
    consolidated = {}
    if data_type == "heart_rate":
        consolidated["heart_rate"] = raw_data.get("heart_rate", 0)
        consolidated["hrv"] = raw_data.get("hrv", 0)
    elif data_type == "blood_pressure":
        consolidated["blood_pressure"] = {"systolic": raw_data.get("systolic", 0), "diastolic": raw_data.get("diastolic", 0)}
    elif data_type == "spo2":
        consolidated["spo2"] = raw_data.get("spo2", 0)
    elif data_type == "temperature":
        consolidated["temperature"] = raw_data.get("temperature", 0)
    elif data_type == "steps":
        consolidated["steps"] = raw_data.get("steps", 0)
        consolidated["calories"] = raw_data.get("calories", 0)
    elif data_type == "blood_glucose":
        consolidated["blood_glucose"] = raw_data.get("blood_glucose_mgdl", 0)
    elif data_type == "ecg_result":
        consolidated["heart_rate"] = raw_data.get("ecg_hr", 0)
        consolidated["hrv"] = raw_data.get("ecg_hrv", 0)
        consolidated["blood_pressure"] = {"systolic": raw_data.get("ecg_systolic", 0), "diastolic": raw_data.get("ecg_diastolic", 0)}
        consolidated["stress"] = raw_data.get("ecg_stress", 0)

    if consolidated:
        existing = await db.device_readings.find_one(
            {"user_id": uid, "device_type": "bracelet", "device_model": "v8", "data_type": "consolidated", "timestamp": {"$gte": now[:10]}},
            {"_id": 0}
        )
        if existing:
            merged = {**existing.get("data", {}), **consolidated}
            await db.device_readings.update_one({"id": existing["id"]}, {"$set": {"data": merged, "timestamp": now}})
        else:
            await db.device_readings.insert_one({
                "id": str(uuid.uuid4()), "user_id": uid,
                "device_type": "bracelet", "device_model": "v8",
                "data_type": "consolidated", "data": consolidated, "timestamp": now,
            })

    # Anomaly detection
    hr = raw_data.get("heart_rate", raw_data.get("ecg_hr", 0))
    spo2 = raw_data.get("spo2", 0)
    glucose = raw_data.get("blood_glucose_mgdl", 0)

    if hr > 120 or (hr > 0 and hr < 50):
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "high",
            "message": f"Frequence cardiaque anormale: {hr} bpm (V8)",
            "device_type": "bracelet", "device_model": "v8", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })
    if spo2 > 0 and spo2 < 92:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "critical",
            "message": f"SpO2 critique: {spo2}% (V8)",
            "device_type": "bracelet", "device_model": "v8", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })
    if glucose > 250:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "high",
            "message": f"Glycemie elevee: {glucose} mg/dL (V8)",
            "device_type": "bracelet", "device_model": "v8", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })
    if glucose > 0 and glucose < 60:
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "beneficiary_id": uid, "beneficiary_name": user.get("name", ""),
            "alert_type": "anomaly", "severity": "critical",
            "message": f"Hypoglycemie: {glucose} mg/dL (V8)",
            "device_type": "bracelet", "device_model": "v8", "status": "active",
            "created_at": now, "resolved_at": None, "resolved_by": None, "teleassistance_status": "pending",
        })

    return {k: v for k, v in reading.items() if k != "_id"}


@router.get("/bracelet/v8/vo2max")
async def get_vo2max(user=Depends(get_current_user)):
    """Calculate VO2max from V8 bracelet HR + HRV data."""
    uid = user["id"]
    device = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    if not device:
        return {"vo2max": 0, "level": "insuffisant", "message": "Aucun bracelet connecte"}

    # Get resting HR (lowest from last 7 days of readings)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    hr_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data_type": {"$in": ["heart_rate", "consolidated"]}, "timestamp": {"$gte": cutoff}},
        {"_id": 0, "data": 1}
    ).to_list(200)

    hr_values = [r["data"].get("heart_rate", 0) for r in hr_readings if r.get("data", {}).get("heart_rate", 0) > 40]
    if not hr_values:
        return {"vo2max": 0, "level": "insuffisant", "message": "Pas assez de donnees FC"}

    hr_rest = min(hr_values)
    hr_max = max(hr_values)

    # Get user age/gender
    user_doc = await db.users.find_one({"_id_str": uid}, {"_id": 0, "age": 1, "birth_date": 1, "gender": 1})
    age = 40
    gender = "male"
    if user_doc:
        age = user_doc.get("age", 40)
        if not age and user_doc.get("birth_date"):
            try:
                bd = datetime.fromisoformat(user_doc["birth_date"].replace("Z", "+00:00"))
                age = (datetime.now(timezone.utc) - bd).days // 365
            except:
                pass
        gender = user_doc.get("gender", "male")

    result = calculate_vo2max(hr_rest, hr_max, age, 70, gender)
    result["hr_rest"] = hr_rest
    result["hr_max"] = hr_max
    result["data_points"] = len(hr_values)
    return result


@router.get("/bracelet/v8/ecg-history")
async def get_v8_ecg_history(user=Depends(get_current_user)):
    """Get V8 ECG waveform + result history."""
    uid = user["id"]
    results = await db.device_readings.find(
        {"user_id": uid, "device_model": "v8", "data_type": {"$in": ["ecg", "ecg_result"]}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(30)
    return {"readings": results, "count": len(results)}


@router.get("/bracelet/v8/glucose-history")
async def get_v8_glucose_history(user=Depends(get_current_user)):
    """Get V8 blood glucose estimation history."""
    uid = user["id"]
    readings = await db.device_readings.find(
        {"user_id": uid, "device_model": "v8", "data_type": "blood_glucose", "data.blood_glucose_mgdl": {"$gt": 0}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return {"readings": readings, "count": len(readings)}


@router.get("/bracelet/v8/dashboard")
async def get_v8_dashboard(user=Depends(get_current_user)):
    """Complete V8 dashboard — all latest vitals + VO2max + trends."""
    uid = user["id"]
    device = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    if not device:
        return {"connected": False, "vitals": {}, "message": "Aucun bracelet connecte"}

    is_connected = False
    if device.get("last_sync"):
        try:
            last = datetime.fromisoformat(device["last_sync"].replace("Z", "+00:00"))
            is_connected = (datetime.now(timezone.utc) - last).total_seconds() < 60
        except:
            pass

    vitals = {
        "heart_rate": device.get("last_heart_rate", 0),
        "hrv": device.get("last_hrv", 0),
        "spo2": device.get("last_spo2", 0),
        "temperature": device.get("last_temperature", 0),
        "steps": device.get("last_steps", 0),
        "calories": device.get("last_calories", 0),
        "systolic": device.get("last_systolic", 0),
        "diastolic": device.get("last_diastolic", 0),
        "stress": device.get("last_stress", 0),
        "blood_glucose": device.get("last_blood_glucose", 0),
        "battery": device.get("battery", 0),
        "ecg_hr": device.get("last_ecg_hr", 0),
        "ecg_hrv": device.get("last_ecg_hrv", 0),
        "ecg_breath_rate": device.get("last_ecg_breath_rate", 0),
        "ecg_stress": device.get("last_ecg_stress", 0),
        "ecg_vascular_aging": device.get("last_ecg_vascular_aging", 0),
    }

    return {
        "connected": is_connected,
        "model": device.get("model", "v8"),
        "vitals": vitals,
        "last_sync": device.get("last_sync"),
        "last_ecg": device.get("last_ecg_result"),
        "last_ppg": device.get("last_ppg_timestamp"),
    }
