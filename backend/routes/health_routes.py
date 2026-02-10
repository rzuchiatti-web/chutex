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


@router.get("/health/thresholds")
async def get_thresholds(user=Depends(get_current_user)):
    return await db.thresholds.find({"user_id": user['id']}, {"_id": 0}).to_list(200)


@router.get("/health/thresholds/{metric_id}")
async def get_threshold(metric_id: str, user=Depends(get_current_user)):
    t = await db.thresholds.find_one({"user_id": user['id'], "metric_id": metric_id}, {"_id": 0})
    return t or {"metric_id": metric_id, "min_val": None, "max_val": None, "goal": None}
