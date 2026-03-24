"""
J2358 Bracelet V6 4G — TCP Server
Receives binary packets from the bracelet, parses health data,
GPS coordinates, SOS alerts, and stores everything in MongoDB.
Protocol spec: J2358_2500606_server_API.pdf
"""
import asyncio
import struct
import logging
import uuid
import os
from datetime import datetime, timezone
from database import db

logger = logging.getLogger("j2358_tcp")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("[J2358-TCP] %(asctime)s %(levelname)s %(message)s"))
logger.addHandler(handler)

TCP_PORT = int(os.environ.get("J2358_TCP_PORT", "9001"))

# Protocol constants
FRAME_START = b'\x0a\x0d'
FRAME_END = b'\x0d\x0a'
HEADER_LEN = 21  # 2(start) + 1(enc) + 1(resp) + 1(type) + 6(dev_type) + 8(dev_id) + 2(biz_len)
CRC_LEN = 4
FOOTER_LEN = 2

# ── CRC32 (standard ISO 3309, same as zlib) ──
import zlib

def crc32(data: bytes) -> int:
    return zlib.crc32(data) & 0xFFFFFFFF

# ── Packet parser ──
def parse_packet(raw: bytes) -> dict | None:
    """Parse a J2358 binary frame. Returns dict or None if invalid."""
    if len(raw) < HEADER_LEN + CRC_LEN + FOOTER_LEN:
        return None
    if raw[:2] != FRAME_START or raw[-2:] != FRAME_END:
        return None

    enc = raw[2]
    resp_required = raw[3]
    data_type = raw[4]  # 0=device upload, 1=command reply
    device_type_bytes = raw[5:11]
    device_id_bytes = raw[11:19]
    biz_len = struct.unpack(">H", raw[19:21])[0]
    biz_data = raw[21:21 + biz_len]
    crc_received = struct.unpack(">I", raw[21 + biz_len:21 + biz_len + 4])[0]

    # Verify CRC32
    crc_payload = raw[19:21 + biz_len]  # biz_len bytes + biz_data
    crc_calc = crc32(crc_payload)
    if crc_calc != crc_received:
        logger.warning(f"CRC mismatch: calc={crc_calc:#010x} recv={crc_received:#010x}")
        # Don't reject — some devices use non-standard CRC. Log and continue.

    # Device ID: try to decode as ASCII (IMEI) or hex
    try:
        device_id = device_id_bytes.decode('ascii').strip('\x00')
    except UnicodeDecodeError:
        device_id = device_id_bytes.hex()

    device_type_hex = device_type_bytes.hex()

    return {
        "encrypted": enc,
        "response_required": resp_required,
        "data_type": data_type,
        "device_type_hex": device_type_hex,
        "device_id": device_id,
        "biz_len": biz_len,
        "biz_data": biz_data,
        "raw": raw,
    }


# ── Build response frame ──
def build_response(device_type_bytes: bytes, device_id_bytes: bytes, biz_data: bytes) -> bytes:
    """Build a response frame to send back to the device."""
    biz_len = struct.pack(">H", len(biz_data))
    crc_payload = biz_len + biz_data
    crc = struct.pack(">I", crc32(crc_payload))
    frame = (FRAME_START +
             b'\x00' +  # no encryption
             b'\x00' +  # no response needed
             b'\x01' +  # data_type=1 (command reply)
             device_type_bytes +
             device_id_bytes +
             biz_len +
             biz_data +
             crc +
             FRAME_END)
    return frame


# ── Business data parsers ──
def parse_health_data(cmd: int, data: bytes) -> dict:
    """Parse health-related business data based on command code."""
    result = {"command": f"0x{cmd:02x}"}

    if cmd == 0x51:  # Total step count
        if len(data) >= 8:
            steps = struct.unpack(">I", data[0:4])[0]
            calories = struct.unpack(">I", data[4:8])[0] if len(data) >= 8 else 0
            distance = struct.unpack(">I", data[8:12])[0] if len(data) >= 12 else 0
            result.update({"steps": steps, "calories": calories, "distance_m": distance})

    elif cmd == 0x55:  # Heart rate
        if len(data) >= 1:
            result["heart_rate"] = data[0]

    elif cmd == 0x56:  # HRV
        if len(data) >= 5:
            result["hrv"] = data[0]
            result["fatigue"] = data[1]
            result["stress"] = data[2]
            if len(data) >= 4:
                result["blood_pressure_high"] = data[3]
                result["blood_pressure_low"] = data[4]

    elif cmd == 0x66:  # Blood oxygen
        if len(data) >= 1:
            result["spo2"] = data[0]

    elif cmd == 0x62:  # Temperature
        if len(data) >= 2:
            temp_raw = struct.unpack(">H", data[0:2])[0]
            result["temperature"] = temp_raw / 10.0

    elif cmd == 0x28:  # Health measurement result (multi-type)
        if len(data) >= 2:
            measure_type = data[0]
            # 0x01=HR, 0x02=SpO2, 0x03=BP, 0x04=HRV, 0x05=Temp, 0x06=ECG, 0x07=BG
            type_map = {1: "heart_rate", 2: "spo2", 3: "blood_pressure", 4: "hrv", 5: "temperature", 6: "ecg", 7: "blood_glucose"}
            result["measure_type"] = type_map.get(measure_type, f"unknown_{measure_type}")
            if measure_type == 1 and len(data) >= 2:
                result["heart_rate"] = data[1]
            elif measure_type == 2 and len(data) >= 2:
                result["spo2"] = data[1]
            elif measure_type == 3 and len(data) >= 3:
                result["blood_pressure"] = {"systolic": data[1], "diastolic": data[2]}
            elif measure_type == 5 and len(data) >= 3:
                temp_raw = struct.unpack(">H", data[1:3])[0]
                result["temperature"] = temp_raw / 10.0

    elif cmd == 0x52:  # Detailed step data (per-minute)
        result["detailed_steps"] = True
        # Variable format — store raw for now
        result["raw_hex"] = data.hex()

    elif cmd == 0x5C:  # Movement data (pace, speed)
        if len(data) >= 4:
            pace_min = data[0]
            pace_sec = data[1]
            speed = struct.unpack(">H", data[2:4])[0] / 100.0
            result.update({"pace_min": pace_min, "pace_sec": pace_sec, "speed_kmh": speed})

    return result


def parse_gps_data(data: bytes) -> dict:
    """Parse GPS/location data from positioning commands (0x92, 0x93)."""
    result = {}
    if len(data) < 21:
        return result
    positioning_method = data[0]  # 0=Wifi, 1=GNSS, 2=Cellular
    method_map = {0: "wifi", 1: "gnss", 2: "cellular"}
    result["positioning_method"] = method_map.get(positioning_method, f"unknown_{positioning_method}")

    # Longitude: 8 bytes double (big-endian)
    if len(data) >= 9:
        result["longitude"] = struct.unpack(">d", data[1:9])[0]
    # Latitude: 8 bytes double
    if len(data) >= 17:
        result["latitude"] = struct.unpack(">d", data[9:17])[0]
    # Precision: 4 bytes float
    if len(data) >= 21:
        result["precision"] = struct.unpack(">f", data[17:21])[0]

    return result


def parse_sleep_data(data: bytes) -> dict:
    """Parse sleep instruction data."""
    result = {}
    if len(data) < 7:
        return result
    # YY MM DD HH mm SS LEN SD1...SDn
    result["date"] = f"20{data[0]:02d}-{data[1]:02d}-{data[2]:02d}"
    result["time"] = f"{data[3]:02d}:{data[4]:02d}:{data[5]:02d}"
    count = data[6]
    sleep_minutes = list(data[7:7 + count]) if len(data) >= 7 + count else list(data[7:])
    # 0=awake, 1=light sleep, 2=deep sleep, 3=REM
    result["sleep_minutes"] = sleep_minutes
    deep = sum(1 for s in sleep_minutes if s == 2)
    light = sum(1 for s in sleep_minutes if s == 1)
    rem = sum(1 for s in sleep_minutes if s == 3)
    awake = sum(1 for s in sleep_minutes if s == 0)
    total = deep + light + rem
    result["deep_sleep_min"] = deep
    result["light_sleep_min"] = light
    result["rem_sleep_min"] = rem
    result["awake_min"] = awake
    result["total_sleep_min"] = total
    if total > 0:
        result["sleep_quality"] = min(100, round((deep * 2 + rem * 1.5 + light) / total * 50))
    return result


# ── Process a complete parsed packet ──
async def process_packet(pkt: dict, writer: asyncio.StreamWriter):
    """Process a parsed J2358 packet: store data, trigger alerts, send ACK."""
    device_id = pkt["device_id"]
    biz = pkt["biz_data"]
    now = datetime.now(timezone.utc).isoformat()

    if len(biz) < 1:
        logger.warning(f"[{device_id}] Empty business data")
        return

    cmd = biz[0]
    cmd_data = biz[1:] if len(biz) > 1 else b''
    logger.info(f"[{device_id}] CMD=0x{cmd:02x} len={len(cmd_data)}")

    # Find the user linked to this device
    device_doc = await db.devices.find_one(
        {"$or": [{"imei": device_id}, {"serial": device_id}, {"mac_address": device_id}]},
        {"_id": 0, "user_id": 1, "device_type": 1}
    )
    user_id = device_doc["user_id"] if device_doc else None

    # ── Heartbeat (0x17) ──
    if cmd == 0x17:
        logger.info(f"[{device_id}] Heartbeat received")
        if device_doc:
            await db.devices.update_one(
                {"$or": [{"imei": device_id}, {"serial": device_id}]},
                {"$set": {"last_heartbeat": now, "connected": True, "last_sync": now}}
            )
        # ACK heartbeat
        if pkt["response_required"]:
            ack = build_response(pkt["raw"][5:11], pkt["raw"][11:19], bytes([0x17, 0x00]))
            writer.write(ack)
            await writer.drain()
        return

    # ── Time request (0x41) ──
    if cmd == 0x41:
        # Device asks for current time — respond with BCD-encoded time
        t = datetime.now(timezone.utc)
        time_bcd = bytes([
            t.year % 100, t.month, t.day, t.hour, t.minute, t.second
        ])
        resp_biz = bytes([0x01]) + time_bcd  # cmd 0x01 = set time
        resp = build_response(pkt["raw"][5:11], pkt["raw"][11:19], resp_biz)
        writer.write(resp)
        await writer.drain()
        logger.info(f"[{device_id}] Sent time sync")
        return

    # ── GPS/Location (0x92 timed location, 0x93 SOS) ──
    if cmd in (0x92, 0x93):
        gps = parse_gps_data(cmd_data)
        if gps and user_id:
            # Store GPS reading
            await db.device_readings.insert_one({
                "id": str(uuid.uuid4()), "user_id": user_id,
                "device_type": "bracelet_v6", "device_id": device_id,
                "data": {"gps": gps, "type": "sos" if cmd == 0x93 else "periodic"},
                "timestamp": now,
            })
            # Update device location
            await db.devices.update_one(
                {"$or": [{"imei": device_id}, {"serial": device_id}]},
                {"$set": {"last_location": gps, "last_sync": now}}
            )
            logger.info(f"[{device_id}] GPS: lat={gps.get('latitude')}, lon={gps.get('longitude')}")

            # SOS → create high-severity alert
            if cmd == 0x93:
                user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1})
                await db.alerts.insert_one({
                    "id": str(uuid.uuid4()), "beneficiary_id": user_id,
                    "beneficiary_name": user.get("name", "Inconnu") if user else "Inconnu",
                    "alert_type": "sos", "severity": "critical",
                    "message": f"SOS declenche par bracelet V6 — Position: {gps.get('latitude', '?')}, {gps.get('longitude', '?')}",
                    "device_type": "bracelet_v6", "status": "active",
                    "created_at": now, "resolved_at": None, "resolved_by": None,
                    "teleassistance_status": "pending", "location": gps,
                })
                logger.warning(f"[{device_id}] 🚨 SOS ALERT CREATED for user {user_id}")

        if pkt["response_required"]:
            ack = build_response(pkt["raw"][5:11], pkt["raw"][11:19], bytes([cmd, 0x00]))
            writer.write(ack)
            await writer.drain()
        return

    # ── Health data commands ──
    health_cmds = {0x51, 0x52, 0x55, 0x56, 0x66, 0x62, 0x28, 0x5C}
    if cmd in health_cmds:
        parsed = parse_health_data(cmd, cmd_data)
        if user_id and parsed:
            # Map to standard device_readings format
            reading_data = {}
            if "heart_rate" in parsed: reading_data["heart_rate"] = parsed["heart_rate"]
            if "spo2" in parsed: reading_data["spo2"] = parsed["spo2"]
            if "temperature" in parsed: reading_data["temperature"] = parsed["temperature"]
            if "steps" in parsed: reading_data["steps"] = parsed["steps"]
            if "calories" in parsed: reading_data["calories"] = parsed["calories"]
            if "distance_m" in parsed: reading_data["distance_km"] = round(parsed["distance_m"] / 1000, 2)
            if "hrv" in parsed: reading_data["hrv"] = parsed["hrv"]
            if "stress" in parsed: reading_data["stress_level"] = parsed["stress"]
            if "blood_pressure" in parsed: reading_data["blood_pressure"] = parsed["blood_pressure"]
            if "blood_pressure_high" in parsed:
                reading_data["blood_pressure"] = {"systolic": parsed["blood_pressure_high"], "diastolic": parsed.get("blood_pressure_low", 0)}
            if "speed_kmh" in parsed: reading_data["speed_kmh"] = parsed["speed_kmh"]

            if reading_data:
                await db.device_readings.insert_one({
                    "id": str(uuid.uuid4()), "user_id": user_id,
                    "device_type": "bracelet_v6", "device_id": device_id,
                    "data": reading_data, "timestamp": now,
                })
                await db.devices.update_one(
                    {"$or": [{"imei": device_id}, {"serial": device_id}]},
                    {"$set": {"last_sync": now, "connected": True}}
                )
                logger.info(f"[{device_id}] Health data stored: {list(reading_data.keys())}")

        if pkt["response_required"]:
            ack = build_response(pkt["raw"][5:11], pkt["raw"][11:19], bytes([cmd, 0x00]))
            writer.write(ack)
            await writer.drain()
        return

    # ── Sleep data (cmd varies, usually part of 0x52 or custom) ──
    # The sleep data format: YY MM DD HH mm SS LEN SD1..SDn
    # We detect it by checking if the data looks like a date prefix
    if cmd == 0x53 or (len(cmd_data) >= 7 and 1 <= cmd_data[0] <= 99 and 1 <= cmd_data[1] <= 12):
        sleep = parse_sleep_data(cmd_data)
        if user_id and sleep.get("total_sleep_min", 0) > 0:
            await db.device_readings.insert_one({
                "id": str(uuid.uuid4()), "user_id": user_id,
                "device_type": "bracelet_v6", "device_id": device_id,
                "data": {
                    "sleep_quality": sleep.get("sleep_quality", 0),
                    "sleep_duration_min": sleep.get("total_sleep_min", 0),
                    "deep_sleep_min": sleep.get("deep_sleep_min", 0),
                    "light_sleep_min": sleep.get("light_sleep_min", 0),
                    "rem_sleep_min": sleep.get("rem_sleep_min", 0),
                    "sleep_interruptions": sleep.get("awake_min", 0),
                },
                "timestamp": now,
            })
            logger.info(f"[{device_id}] Sleep data stored: {sleep.get('total_sleep_min')}min")

        if pkt["response_required"]:
            ack = build_response(pkt["raw"][5:11], pkt["raw"][11:19], bytes([cmd, 0x00]))
            writer.write(ack)
            await writer.drain()
        return

    # ── Software version (0x27) ──
    if cmd == 0x27:
        try:
            version = cmd_data.decode('ascii').strip('\x00')
        except:
            version = cmd_data.hex()
        if device_doc:
            await db.devices.update_one(
                {"$or": [{"imei": device_id}, {"serial": device_id}]},
                {"$set": {"firmware_version": version, "last_sync": now}}
            )
        logger.info(f"[{device_id}] Firmware version: {version}")
        return

    # ── Device power (0x13) ──
    if cmd == 0x13:
        if len(cmd_data) >= 1:
            battery = cmd_data[0]
            if device_doc:
                await db.devices.update_one(
                    {"$or": [{"imei": device_id}, {"serial": device_id}]},
                    {"$set": {"battery": battery, "last_sync": now}}
                )
            logger.info(f"[{device_id}] Battery: {battery}%")
        return

    # ── Unknown command — log it ──
    logger.info(f"[{device_id}] Unhandled CMD=0x{cmd:02x} data={cmd_data[:20].hex()}")
    # Still ACK if required
    if pkt["response_required"]:
        ack = build_response(pkt["raw"][5:11], pkt["raw"][11:19], bytes([cmd, 0x00]))
        writer.write(ack)
        await writer.drain()


# ── TCP connection handler ──
class J2358Protocol:
    """Handles a single TCP connection from a J2358 bracelet."""

    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader = reader
        self.writer = writer
        self.buffer = b''
        addr = writer.get_extra_info('peername')
        self.addr = f"{addr[0]}:{addr[1]}" if addr else "unknown"
        self.device_id = "unknown"

    async def handle(self):
        logger.info(f"[{self.addr}] New connection")
        try:
            while True:
                data = await asyncio.wait_for(self.reader.read(4096), timeout=300)
                if not data:
                    break
                self.buffer += data
                await self._process_buffer()
        except asyncio.TimeoutError:
            logger.info(f"[{self.addr}] Connection timeout (5min idle)")
        except ConnectionResetError:
            logger.info(f"[{self.addr}] Connection reset by device")
        except Exception as e:
            logger.error(f"[{self.addr}] Error: {e}")
        finally:
            logger.info(f"[{self.addr}] Connection closed (device={self.device_id})")
            self.writer.close()
            try:
                await self.writer.wait_closed()
            except:
                pass

    async def _process_buffer(self):
        """Extract complete frames from buffer and process them."""
        while True:
            start_idx = self.buffer.find(FRAME_START)
            if start_idx == -1:
                self.buffer = b''
                return
            if start_idx > 0:
                self.buffer = self.buffer[start_idx:]

            end_idx = self.buffer.find(FRAME_END, 2)
            if end_idx == -1:
                return  # Wait for more data

            frame = self.buffer[:end_idx + 2]
            self.buffer = self.buffer[end_idx + 2:]

            pkt = parse_packet(frame)
            if pkt:
                self.device_id = pkt["device_id"]
                await process_packet(pkt, self.writer)
            else:
                logger.warning(f"[{self.addr}] Invalid frame: {frame[:30].hex()}")


# ── TCP Server ──
async def handle_connection(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    proto = J2358Protocol(reader, writer)
    await proto.handle()


async def start_tcp_server():
    """Start the J2358 TCP server on the configured port."""
    server = await asyncio.start_server(handle_connection, '0.0.0.0', TCP_PORT)
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    logger.info(f"J2358 TCP Server listening on {addrs}")
    async with server:
        await server.serve_forever()


def run_tcp_server():
    """Entry point — runs the TCP server in an asyncio event loop."""
    asyncio.run(start_tcp_server())


if __name__ == "__main__":
    run_tcp_server()
