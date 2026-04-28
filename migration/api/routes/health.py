"""Routes Health : vitals (latest, history), ECG, glycémie, weighings."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.health import (
    DeviceReading,
    EcgRecord,
    GlycemiaCalibration,
    GlycemiaHistory,
    HealthVital,
    LatestVitals,
    Weighing,
)

router = APIRouter()


# ---------------- Vitals --------------------------------------------------
@router.get("/health/vitals/latest")
async def get_latest_vitals(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(LatestVitals).where(LatestVitals.user_id == user["id"])
    )
    lv = res.scalar_one_or_none()
    return row_to_dict(lv) if lv else {}


@router.post("/health/vitals")
async def push_vitals(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = utcnow()
    payload = {
        k: data.get(k)
        for k in (
            "heart_rate", "blood_pressure_sys", "blood_pressure_dia", "spo2",
            "temperature", "steps", "calories", "sleep_hours", "sleep_quality",
            "hrv", "respiratory_rate", "weight_kg", "source",
        )
    }
    session.add(HealthVital(user_id=user["id"], timestamp=now, **payload))
    stmt = pg_insert(LatestVitals).values(
        user_id=user["id"], last_updated=now, **payload,
    ).on_conflict_do_update(
        index_elements=[LatestVitals.user_id],
        set_={**payload, "last_updated": now},
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "stored", "timestamp": now.isoformat()}


@router.get("/health/vitals/history")
async def get_vitals_history(
    limit: int = 50,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(HealthVital).where(HealthVital.user_id == user["id"])
        .order_by(HealthVital.timestamp.desc()).limit(min(limit, 200))
    )
    return [row_to_dict(v) for v in res.scalars().all()]


# ---------------- ECG -----------------------------------------------------
@router.post("/ecg")
async def push_ecg(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eid = data.get("id") or str(uuid.uuid4())
    now = utcnow()
    rec = EcgRecord(
        id=eid, user_id=user["id"], timestamp=now, created_at=now,
        data=data.get("data") or {},
        bpm=data.get("bpm"), hrv=data.get("hrv"),
        breath_rate=data.get("breath_rate"), stress=data.get("stress"),
        mood=data.get("mood"), systolic=data.get("systolic"),
        diastolic=data.get("diastolic"), vascular_aging=data.get("vascular_aging"),
        interpretation=data.get("interpretation"),
        rhythm=data.get("rhythm"), status=data.get("status"),
        duration_sec=data.get("duration_sec"),
        samples_count=data.get("samples_count"),
        sample_rate=data.get("sample_rate"),
        source=data.get("source"),
    )
    session.add(rec)
    await session.commit()
    return {"status": "stored", "id": eid}


@router.get("/ecg/history")
async def get_ecg_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(EcgRecord).where(EcgRecord.user_id == user["id"])
        .order_by(EcgRecord.timestamp.desc()).limit(50)
    )
    return [row_to_dict(e) for e in res.scalars().all()]


# ---------------- Glycemia ------------------------------------------------
@router.get("/glycemia/history")
async def get_glycemia_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(GlycemiaHistory).where(GlycemiaHistory.user_id == user["id"])
        .order_by(GlycemiaHistory.timestamp.desc()).limit(60)
    )
    return [row_to_dict(g) for g in res.scalars().all()]


@router.post("/glycemia/calibration")
async def push_glycemia_calibration(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cal = GlycemiaCalibration(
        user_id=user["id"],
        measured_value=data.get("measured_value"),
        estimated_value=data.get("estimated_value"),
        delta=(data.get("measured_value") or 0) - (data.get("estimated_value") or 0),
        timestamp=utcnow(),
    )
    session.add(cal)
    await session.commit()
    return {"status": "stored"}


# ---------------- Weighings ------------------------------------------------
@router.get("/weighings")
async def get_weighings(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Weighing).where(Weighing.user_id == user["id"])
        .order_by(Weighing.timestamp.desc()).limit(50)
    )
    return [row_to_dict(w) for w in res.scalars().all()]
