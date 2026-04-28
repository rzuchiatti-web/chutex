"""Routes Health thresholds + simple history sur device_readings."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict
from app.models.health import DeviceReading, Threshold

router = APIRouter()

# Mêmes listes que /app/backend/utils.py
BRACELET_METRICS = {
    "heart_rate", "spo2", "blood_pressure", "temperature", "steps",
    "calories", "distance_km", "sleep_quality", "sleep_duration_min",
    "hrv", "respiratory_rate", "stress_level",
}
SCALE_METRICS = {
    "weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct",
    "visceral_fat", "bone_mass", "basal_metabolism", "metabolic_age",
    "protein_pct",
}


class ThresholdUpdate(BaseModel):
    metric_id: str
    min_val: float | None = None
    max_val: float | None = None
    goal: float | None = None


@router.get("/health/history/{metric_id}")
async def get_health_history(
    metric_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if metric_id in BRACELET_METRICS:
        dt = "bracelet"
    elif metric_id in SCALE_METRICS:
        dt = "scale"
    else:
        raise HTTPException(status_code=404, detail="Metrique non trouvee")
    res = await session.execute(
        select(DeviceReading)
        .where(DeviceReading.user_id == user["id"], DeviceReading.device_type == dt)
        .order_by(DeviceReading.timestamp.desc())
        .limit(30)
    )
    readings = list(res.scalars().all())
    history = []
    for r in reversed(readings):
        # On préfère les colonnes typées, sinon raw_data
        val = getattr(r, metric_id, None)
        if val is None and r.raw_data:
            val = (r.raw_data or {}).get(metric_id)
        if val is not None:
            history.append({"value": val, "date": r.timestamp.isoformat() if r.timestamp else None})
    if not history:
        return {
            "metric_id": metric_id, "history": [],
            "stats": {"current": 0, "average": 0, "min": 0, "max": 0},
        }
    vals = [h["value"] for h in history]
    return {
        "metric_id": metric_id,
        "history": history[-7:],
        "stats": {
            "current": vals[-1] if vals else 0,
            "average": round(sum(vals) / len(vals), 1) if vals else 0,
            "min": round(min(vals), 1) if vals else 0,
            "max": round(max(vals), 1) if vals else 0,
        },
    }


async def _upsert_threshold(session: AsyncSession, user_id: str, data: ThresholdUpdate):
    stmt = pg_insert(Threshold).values(
        user_id=user_id, metric_id=data.metric_id,
        min_val=data.min_val, max_val=data.max_val, goal=data.goal,
    ).on_conflict_do_update(
        index_elements=[Threshold.user_id, Threshold.metric_id],
        set_={"min_val": data.min_val, "max_val": data.max_val, "goal": data.goal},
    )
    await session.execute(stmt)


@router.post("/health/thresholds")
async def set_threshold(
    data: ThresholdUpdate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _upsert_threshold(session, user["id"], data)
    await session.commit()
    return {"status": "saved"}


@router.put("/health/thresholds")
async def update_threshold(
    data: ThresholdUpdate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _upsert_threshold(session, user["id"], data)
    await session.commit()
    return {"status": "saved"}


@router.get("/health/thresholds")
async def get_thresholds(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Threshold).where(Threshold.user_id == user["id"]).limit(200)
    )
    return [row_to_dict(t) for t in res.scalars().all()]


@router.get("/health/thresholds/{metric_id}")
async def get_threshold(
    metric_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Threshold).where(
            Threshold.user_id == user["id"], Threshold.metric_id == metric_id
        )
    )
    t = res.scalar_one_or_none()
    if not t:
        return {"metric_id": metric_id, "min_val": None, "max_val": None, "goal": None}
    return row_to_dict(t)


@router.delete("/health/thresholds/{metric_id}")
async def delete_threshold(
    metric_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(Threshold).where(
            Threshold.user_id == user["id"], Threshold.metric_id == metric_id
        )
    )
    await session.commit()
    return {"status": "deleted"}
