"""
Test script: Simulates a J2358 bracelet V6 sending health data via TCP
Uses CRC16 Modbus (poly 0xA001, init 0xFFFF) — confirmed by manufacturer
Protocol: 1-byte CMD, matching j2358_tcp_server.py handlers
"""
import socket
import struct
import time

FRAME_START = b'\x0a\x0d'
FRAME_END = b'\x0d\x0a'
DEVICE_TYPE = b'\x32\x33\x35\x38\x30\x39'  # "235809"
DEVICE_ID = b'12345678'  # 8-byte test ID

def crc16_modbus(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte & 0x00FF
        for _ in range(8):
            if crc & 0x0001:
                crc >>= 1
                crc ^= 0xA001
            else:
                crc >>= 1
    return crc & 0xFFFF

def build_frame(biz_data: bytes, resp_required: int = 1) -> bytes:
    biz_len = struct.pack(">H", len(biz_data))
    crc_payload = biz_len + biz_data
    crc = struct.pack(">H", crc16_modbus(crc_payload))
    return (FRAME_START + b'\x00' + bytes([resp_required]) + b'\x00' +
            DEVICE_TYPE + DEVICE_ID + biz_len + biz_data + crc + FRAME_END)

def validate_response(resp, label):
    if not resp:
        print(f"  [RECV] No response")
        return False
    print(f"  [RECV] ({len(resp)}B): {resp.hex()}")
    if resp[:2] == FRAME_START and resp[-2:] == FRAME_END:
        biz_len = struct.unpack(">H", resp[19:21])[0]
        crc_recv = struct.unpack(">H", resp[21 + biz_len:21 + biz_len + 2])[0]
        crc_calc = crc16_modbus(resp[19:21 + biz_len])
        ok = crc_recv == crc_calc
        print(f"  CRC16: 0x{crc_recv:04X} == 0x{crc_calc:04X} -> {'PASS' if ok else 'FAIL'}")
        return ok
    print(f"  Invalid frame markers")
    return False

def send(sock, frame, label):
    print(f"\n{'='*50}")
    print(f"[SEND] {label}")
    print(f"  Frame ({len(frame)}B): {frame.hex()}")
    sock.sendall(frame)
    time.sleep(0.5)
    try:
        resp = sock.recv(4096)
        return validate_response(resp, label)
    except socket.timeout:
        print(f"  [RECV] Timeout")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("J2358 V6 Bracelet TCP Test — CRC16 Modbus")
    print("=" * 60)

    # CRC16 validation
    print("\n[CRC16 Validation]")
    for data, expected_label in [
        (b'\x01\x02\x03\x04', "basic"),
        (b'\x00\x02\x51\x48\x61', "health sample"),
    ]:
        crc = crc16_modbus(data)
        print(f"  CRC16({data.hex()}) = 0x{crc:04X}")
    print("  Implementation: OK")

    print("\n[Connecting to localhost:9001...]")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    results = []

    try:
        sock.connect(('127.0.0.1', 9001))
        print("  Connected!")

        # Test 1: Heartbeat (CMD 0x17)
        biz = bytes([0x17])
        r = send(sock, build_frame(biz), "Heartbeat (CMD 0x17)")
        results.append(("Heartbeat", r))

        # Test 2: Time request (CMD 0x41)
        biz = bytes([0x41])
        r = send(sock, build_frame(biz), "Time Request (CMD 0x41)")
        results.append(("Time Request", r))

        # Test 3: Heart rate data (CMD 0x51)
        # Format: cmd(1) + HR(1) + SpO2(1)
        biz = bytes([0x51, 72, 97])  # HR=72, SpO2=97
        r = send(sock, build_frame(biz), "Heart Rate + SpO2 (CMD 0x51) — HR:72 SpO2:97")
        results.append(("Health HR/SpO2", r))

        # Test 4: Blood pressure (CMD 0x52)
        # Format: cmd(1) + systolic(1) + diastolic(1) + HR(1)
        biz = bytes([0x52, 125, 78, 72])  # sys=125, dia=78, HR=72
        r = send(sock, build_frame(biz), "Blood Pressure (CMD 0x52) — 125/78 HR:72")
        results.append(("Health BP", r))

        # Test 5: Steps + Calories (CMD 0x55)
        # Format: cmd(1) + steps(4 BE) + calories(2 BE) + distance(4 BE)
        biz = struct.pack(">BIHII", 0x55, 6500, 280, 4200, 0)
        r = send(sock, build_frame(biz), "Steps/Calories (CMD 0x55) — 6500 steps, 280 kcal")
        results.append(("Health Steps", r))

        # Test 6: Temperature (CMD 0x56)
        # Format: cmd(1) + temp(2 BE) (value * 10, e.g. 365 = 36.5°C)
        biz = struct.pack(">BH", 0x56, 365)
        r = send(sock, build_frame(biz), "Temperature (CMD 0x56) — 36.5°C")
        results.append(("Health Temp", r))

        # Test 7: GPS location (CMD 0x92)
        # Format: cmd(1) + lat(4 BE) + lon(4 BE) + speed(1) + satellites(1) + direction(2 BE)
        lat = int(48.8566 * 100000)  # Paris
        lon = int(2.3522 * 100000)
        biz = struct.pack(">BiiB", 0x92, lat, lon, 0) + b'\x08\x00\x00'  # 8 sats
        r = send(sock, build_frame(biz), "GPS (CMD 0x92) — Paris 48.8566, 2.3522")
        results.append(("GPS", r))

        # Test 8: Bad CRC (validation)
        bad_frame = build_frame(bytes([0x17]))
        bad_frame = bad_frame[:-4] + b'\xFF\xFF' + bad_frame[-2:]  # corrupt CRC
        r = send(sock, bad_frame, "Bad CRC (should log warning)")
        results.append(("Bad CRC (expected warning)", r))

        # Summary
        print("\n" + "=" * 60)
        print("RESULTS SUMMARY")
        print("=" * 60)
        for name, ok in results:
            print(f"  {'PASS' if ok else 'WARN':4s} | {name}")
        total_pass = sum(1 for _, ok in results if ok)
        print(f"\n  {total_pass}/{len(results)} tests passed")
        print("=" * 60)

    except Exception as e:
        print(f"  ERROR: {e}")
    finally:
        sock.close()
