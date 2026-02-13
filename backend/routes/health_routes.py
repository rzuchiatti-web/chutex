from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import random

from database import db
from auth import get_current_user
from models import ThresholdUpdate
from utils import BRACELET_SIM, SCALE_SIM

router = APIRouter()


@router.get("/health/history/{metric_id}")
async def get_health_history(metric_id: str, user=Depends(get_current_user)):
    dt = "bracelet" if metric_id in BRACELET_SIM else "scale" if metric_id in SCALE_SIM else None
    if not dt:
        raise HTTPException(status_code=404, detail="Metrique non trouvee")
    readings = await db.device_readings.find({"user_id": user['id'], "device_type": dt}, {"_id": 0}).sort("timestamp", -1).to_list(30)
    history = [{"value": r['data'].get(metric_id), "date": r['timestamp']} for r in reversed(readings) if r['data'].get(metric_id) is not None]
    if len(history) < 7:
        sim = BRACELET_SIM if dt == "bracelet" else SCALE_SIM
        lo, hi = sim[metric_id]
        now = datetime.now(timezone.utc)
        syn = [{"value": round(random.uniform(lo, hi), 1) if isinstance(lo, float) else random.randint(lo, hi), "date": (now - timedelta(days=i)).isoformat()} for i in range(7, 0, -1)]
        history = (syn[:7 - len(history)] + history) if history else syn
    vals = [h['value'] for h in history]
    return {
        "metric_id": metric_id, "history": history[-7:],
        "stats": {"current": vals[-1] if vals else 0, "average": round(sum(vals) / len(vals), 1) if vals else 0, "min": round(min(vals), 1) if vals else 0, "max": round(max(vals), 1) if vals else 0},
    }


@router.post("/health/thresholds")
async def set_threshold(data: ThresholdUpdate, user=Depends(get_current_user)):
    await db.thresholds.update_one(
        {"user_id": user['id'], "metric_id": data.metric_id},
        {"$set": {"user_id": user['id'], "metric_id": data.metric_id, "min_val": data.min_val, "max_val": data.max_val, "goal": data.goal}},
        upsert=True,
    )
    return {"status": "saved"}


@router.put("/health/thresholds")
async def update_threshold(data: ThresholdUpdate, user=Depends(get_current_user)):
    await db.thresholds.update_one(
        {"user_id": user['id'], "metric_id": data.metric_id},
        {"$set": {"user_id": user['id'], "metric_id": data.metric_id, "min_val": data.min_val, "max_val": data.max_val, "goal": data.goal}},
        upsert=True,
    )
    return {"status": "saved"}



@router.get("/health/thresholds")
async def get_thresholds(user=Depends(get_current_user)):
    return await db.thresholds.find({"user_id": user['id']}, {"_id": 0}).to_list(200)


@router.get("/health/thresholds/{metric_id}")
async def get_threshold(metric_id: str, user=Depends(get_current_user)):
    t = await db.thresholds.find_one({"user_id": user['id'], "metric_id": metric_id}, {"_id": 0})
    return t or {"metric_id": metric_id, "min_val": None, "max_val": None, "goal": None}


@router.get("/health/sleep")
async def get_sleep_data(user=Depends(get_current_user)):
    """Get sleep hypnogram data - real bracelet data first, then simulated"""
    # Try to find real sleep data from bracelet (cmd 0x53)
    real_sleep = await db.device_readings.find(
        {"user_id": user['id'], "device_type": "bracelet", "data.cmd": 0x53, "data.sleep_stages": {"$exists": True, "$ne": []}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)

    if real_sleep:
        # Combine all sleep stage packets into one hypnogram
        stages = []
        for r in reversed(real_sleep):
            stages.extend(r['data'].get('sleep_stages', []))
        if stages:
            # Convert to standard format: 1=deep, 2=light, 3=REM, 0=awake
            normalized = []
            for s in stages:
                if s == 1: normalized.append(1)  # deep
                elif s == 2: normalized.append(2)  # light
                elif s == 3: normalized.append(3)  # REM
                else: normalized.append(0)  # awake

            deep = normalized.count(1)
            light = normalized.count(2)
            rem = normalized.count(3)
            awake = normalized.count(0)
            total = len(normalized)
            quality = min(100, int((deep * 2 + rem * 1.5 + light * 0.8) / max(total, 1) * 100))
            return {
                "stages": normalized,
                "total_minutes": total,
                "deep_minutes": deep,
                "light_minutes": light,
                "rem_minutes": rem,
                "awake_minutes": awake,
                "sleep_quality": quality,
                "cycles": max(1, deep // 15),
                "sleep_duration": round(total / 60, 1),
                "date": real_sleep[0]['timestamp'],
                "source": "bracelet",
            }

    # No real data available
    return {
        "stages": [],
        "total_minutes": 0,
        "deep_minutes": 0,
        "light_minutes": 0,
        "rem_minutes": 0,
        "awake_minutes": 0,
        "sleep_quality": 0,
        "cycles": 0,
        "sleep_duration": 0,
        "date": datetime.now(timezone.utc).isoformat(),
        "source": "none",
    }


@router.get("/health/sleep/history")
async def get_sleep_history(user=Depends(get_current_user)):
    """Get sleep history (last 7 days)"""
    readings = await db.device_readings.find(
        {"user_id": user['id'], "device_type": "bracelet", "data.sleep": {"$exists": True}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(7)
    history = []
    for r in reversed(readings):
        s = r['data']['sleep']
        history.append({
            "date": r['timestamp'],
            "duration": s.get('sleep_duration', 0),
            "quality": s.get('sleep_quality', 0),
            "deep": s.get('deep_minutes', 0),
            "light": s.get('light_minutes', 0),
            "rem": s.get('rem_minutes', 0),
            "awake": s.get('awake_minutes', 0),
        })
    if len(history) < 7:
        from utils import generate_sleep_hypnogram
        now = datetime.now(timezone.utc)
        for i in range(7 - len(history), 0, -1):
            s = generate_sleep_hypnogram()
            history.insert(0, {
                "date": (now - timedelta(days=i)).isoformat(),
                "duration": s['sleep_duration'],
                "quality": s['sleep_quality'],
                "deep": s['deep_minutes'],
                "light": s['light_minutes'],
                "rem": s['rem_minutes'],
                "awake": s['awake_minutes'],
            })
    return history[-7:]
