from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from database import db
from auth import get_current_user

router = APIRouter()

@router.get("/health/sleep")
async def get_sleep_data(user=Depends(get_current_user)):
    uid = user['id']
    real_sleep = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.cmd": 0x53, "data.sleep_stages": {"$exists": True, "$ne": []}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    if real_sleep:
        stages = []
        for r in reversed(real_sleep):
            stages.extend(r['data'].get('sleep_stages', []))
        if stages:
            normalized = [1 if s == 1 else 2 if s == 2 else 3 if s == 3 else 0 for s in stages]
            deep = normalized.count(1)
            light = normalized.count(2)
            rem = normalized.count(3)
            awake = normalized.count(0)
            total = len(normalized)
            quality = min(100, int((deep * 2 + rem * 1.5 + light * 0.8) / max(total, 1) * 100))
            return {"stages": normalized, "total_minutes": total, "deep_minutes": deep, "light_minutes": light, "rem_minutes": rem, "awake_minutes": awake, "sleep_quality": quality, "cycles": max(1, deep // 15), "sleep_duration": round(total / 60, 1), "date": real_sleep[0]['timestamp'], "source": "bracelet"}
    latest = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet", "data.sleep_duration_min": {"$gt": 0}},
        {"_id": 0}, sort=[("timestamp", -1)]
    )
    if latest and latest.get("data", {}).get("sleep_duration_min", 0) > 0:
        dd = latest["data"]
        deep = dd.get("deep_sleep_min", 0)
        light = dd.get("light_sleep_min", 0)
        rem = dd.get("rem_sleep_min", 0)
        total = dd.get("sleep_duration_min", 0)
        quality = dd.get("sleep_quality", 0)
        inter = dd.get("sleep_interruptions", 0)
        stages = []
        cycles = max(1, round(total / 90))
        for c in range(cycles):
            for _ in range(max(1, light // cycles)): stages.append(2)
            for _ in range(max(1, deep // cycles)): stages.append(1)
            for _ in range(max(1, rem // cycles)): stages.append(3)
            if c < cycles - 1 and inter > 0: stages.append(0)
        return {"stages": stages, "total_minutes": total, "deep_minutes": deep, "light_minutes": light, "rem_minutes": rem, "awake_minutes": inter, "sleep_quality": quality, "cycles": cycles, "sleep_duration": round(total / 60, 1), "date": latest.get("timestamp", ""), "source": "simulated"}
    return {"stages": [], "total_minutes": 0, "deep_minutes": 0, "light_minutes": 0, "rem_minutes": 0, "awake_minutes": 0, "sleep_quality": 0, "cycles": 0, "sleep_duration": 0, "date": datetime.now(timezone.utc).isoformat(), "source": "none"}


@router.get("/health/sleep/history")
async def get_sleep_history(user=Depends(get_current_user)):
    uid = user['id']
    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "data.sleep": {"$exists": True}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(7)
    history = []
    for r in reversed(readings):
        s = r['data']['sleep']
        history.append({"date": r['timestamp'], "duration": s.get('sleep_duration', 0), "quality": s.get('sleep_quality', 0), "deep": s.get('deep_minutes', 0), "light": s.get('light_minutes', 0), "rem": s.get('rem_minutes', 0), "awake": s.get('awake_minutes', 0), "interruptions": s.get('sleep_interruptions', 0)})
    if len(history) < 7:
        extra = await db.device_readings.find(
            {"user_id": uid, "device_type": "bracelet", "data.sleep_duration_min": {"$gt": 0}},
            {"_id": 0}
        ).sort("timestamp", -1).to_list(7)
        existing_dates = set(h.get("date", "")[:10] for h in history)
        for r in reversed(extra):
            dd = r.get("data", {})
            dt = r.get("timestamp", "")
            if dt[:10] not in existing_dates:
                history.append({"date": dt, "duration": dd.get("sleep_duration_min", 0), "quality": dd.get("sleep_quality", 0), "deep": dd.get("deep_sleep_min", 0), "light": dd.get("light_sleep_min", 0), "rem": dd.get("rem_sleep_min", 0), "awake": dd.get("sleep_interruptions", 0)})
                existing_dates.add(dt[:10])
    return sorted(history, key=lambda h: h.get("date", ""))[-7:]
