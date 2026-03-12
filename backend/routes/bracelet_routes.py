from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
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
