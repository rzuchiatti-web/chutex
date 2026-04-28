"""Routes Misc : geofences, settings, medications, recommendations, RGPD, streaks."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.devices import Geofence
from app.models.misc import (
    ActivityStreak,
    Medication,
    Recommendation,
    RgpdRequest,
    Setting,
    UserConsent,
    UserStreak,
)

router = APIRouter()


# ---------------- Geofences ----------------------------------------------
@router.get("/geofences")
async def list_geofences(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Geofence).where(Geofence.user_id == user["id"])
    )
    return [row_to_dict(g) for g in res.scalars().all()]


@router.post("/geofences")
async def create_geofence(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    gid = str(uuid.uuid4())
    g = Geofence(
        id=gid, user_id=user["id"],
        name=data.get("name", "Zone"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        radius_m=data.get("radius_m", 500),
        active=data.get("active", True),
        created_at=utcnow(),
    )
    session.add(g)
    await session.commit()
    return row_to_dict(g)


@router.put("/geofences/{gid}")
async def update_geofence(
    gid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Geofence).where(Geofence.id == gid, Geofence.user_id == user["id"])
    )
    g = res.scalar_one_or_none()
    if not g:
        raise HTTPException(404, "Zone introuvable")
    for k in ("name", "latitude", "longitude", "radius_m", "active"):
        if k in data:
            setattr(g, k, data[k])
    await session.commit()
    return row_to_dict(g)


@router.delete("/geofences/{gid}")
async def delete_geofence(
    gid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(Geofence).where(Geofence.id == gid, Geofence.user_id == user["id"])
    )
    await session.commit()
    return {"status": "deleted"}


# ---------------- Settings ------------------------------------------------
@router.get("/settings/{key}")
async def get_setting(
    key: str, session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Setting).where(Setting.key == key))
    s = res.scalar_one_or_none()
    return row_to_dict(s) if s else {"key": key, "value": None}


@router.put("/settings/{key}")
async def set_setting(
    key: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    stmt = pg_insert(Setting).values(
        key=key, value=data.get("value"), updated_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[Setting.key],
        set_={"value": data.get("value"), "updated_at": utcnow()},
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved"}


# ---------------- Medications --------------------------------------------
@router.get("/medications")
async def list_medications(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Medication).where(Medication.user_id == user["id"]))
    return [row_to_dict(m) for m in res.scalars().all()]


@router.post("/medications")
async def create_medication(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    mid = str(uuid.uuid4())
    m = Medication(
        id=mid, user_id=user["id"],
        name=data.get("name", ""),
        dosage=data.get("dosage"),
        frequency=data.get("frequency"),
        times=data.get("times") or [],
        notes=data.get("notes"),
        created_at=utcnow(),
    )
    session.add(m)
    await session.commit()
    return row_to_dict(m)


@router.delete("/medications/{mid}")
async def delete_medication(
    mid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(Medication).where(Medication.id == mid, Medication.user_id == user["id"])
    )
    await session.commit()
    return {"status": "deleted"}


# ---------------- Recommendations ----------------------------------------
@router.get("/recommendations")
async def list_recommendations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Recommendation).where(Recommendation.user_id == user["id"])
        .order_by(Recommendation.created_at.desc()).limit(20)
    )
    return [row_to_dict(r) for r in res.scalars().all()]


# ---------------- Streaks -------------------------------------------------
@router.get("/streaks")
async def get_streaks(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(UserStreak).where(UserStreak.user_id == user["id"]))
    s = res.scalar_one_or_none()
    res2 = await session.execute(select(ActivityStreak).where(ActivityStreak.user_id == user["id"]))
    a = res2.scalar_one_or_none()
    return {
        "user_streak": row_to_dict(s) if s else None,
        "activity_streak": row_to_dict(a) if a else None,
    }


# ---------------- RGPD ----------------------------------------------------
@router.post("/rgpd/request")
async def create_rgpd_request(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rid = str(uuid.uuid4())
    r = RgpdRequest(
        id=rid, user_id=user["id"],
        type=data.get("type", "export"),
        status="pending",
        payload=data,
        created_at=utcnow(),
    )
    session.add(r)
    await session.commit()
    return row_to_dict(r)


@router.get("/rgpd/my-requests")
async def my_rgpd_requests(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(RgpdRequest).where(RgpdRequest.user_id == user["id"])
        .order_by(RgpdRequest.created_at.desc())
    )
    return [row_to_dict(r) for r in res.scalars().all()]


@router.post("/consent")
async def save_consent(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    stmt = pg_insert(UserConsent).values(
        user_id=user["id"],
        type=data.get("type", "general"),
        accepted=data.get("accepted", True),
        accepted_at=utcnow(),
        payload=data,
    ).on_conflict_do_update(
        index_elements=[UserConsent.user_id, UserConsent.type],
        set_={
            "accepted": data.get("accepted", True),
            "accepted_at": utcnow(),
            "payload": data,
        },
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved"}
