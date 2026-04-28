"""Routes Devices : sync, list, associate, latest readings.

Le modèle Device migration utilise (user_id, type) comme PK composite (pas de
champ `id`/`removed` autonome). Les anciennes routes Mongo gèrent un champ
`removed` ; ici on supprime simplement la ligne quand l'utilisateur déconnecte.
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.devices import Device
from app.models.health import DeviceReading
from app.models.shop import Subscription

logger = logging.getLogger(__name__)
router = APIRouter()


class DeviceSyncRequest(BaseModel):
    device_type: str
    data: dict | None = None


def _normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\.\(\)]", "", (phone or "").strip())
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+33" + cleaned[1:]
    return cleaned


async def _has_active_subscription(session: AsyncSession, user: dict) -> bool:
    res = await session.execute(
        select(Subscription).where(
            Subscription.beneficiary_id == user["id"],
            Subscription.status == "active",
        )
    )
    if res.scalar_one_or_none():
        return True
    phone = user.get("phone")
    if phone:
        res2 = await session.execute(
            select(Subscription).where(
                Subscription.beneficiary_phone == _normalize_phone(phone),
                Subscription.status == "active",
            )
        )
        if res2.scalar_one_or_none():
            return True
    return False


@router.post("/devices/sync")
async def sync_device(
    data: DeviceSyncRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Device).where(Device.user_id == user["id"], Device.type == data.device_type)
    )
    device = res.scalar_one_or_none()
    if not device:
        raise HTTPException(404, "Appareil non trouve")
    if data.device_type == "bracelet" and not await _has_active_subscription(session, user):
        raise HTTPException(403, "Abonnement requis pour utiliser le bracelet Elio")

    device_data = data.data or {}
    now = utcnow()
    device.connected = True
    device.last_sync = now
    if device_data.get("battery") is not None:
        device.battery = device_data["battery"]
    if device_data:
        # Stocke un DeviceReading typé (champs typiques) + raw_data
        session.add(DeviceReading(
            id=str(uuid.uuid4()),
            user_id=user["id"],
            device_type=data.device_type,
            timestamp=now,
            weight=device_data.get("weight"),
            bmi=device_data.get("bmi"),
            body_fat_pct=device_data.get("body_fat_pct"),
            muscle_pct=device_data.get("muscle_pct"),
            water_pct=device_data.get("water_pct"),
            heart_rate=device_data.get("heart_rate"),
            health_score=device_data.get("health_score"),
            raw_data=device_data,
        ))
    await session.commit()
    return {
        "status": "synced",
        "data": device_data,
        "anomalies": [],
        "battery": device_data.get("battery", 0),
        "timestamp": now.isoformat(),
    }


@router.get("/devices")
async def get_devices(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uids = user.get("beneficiaries", []) if user.get("role") == "guardian" else [user["id"]]
    res = await session.execute(select(Device).where(Device.user_id.in_(uids)))
    rows = res.scalars().all()
    now = datetime.now(timezone.utc)
    out = []
    for d in rows:
        rec = row_to_dict(d)
        if d.last_sync:
            threshold = 30 if d.type == "vest" else 120
            rec["connected"] = (now - d.last_sync).total_seconds() < threshold
        else:
            rec["connected"] = False
        out.append(rec)
    return out


@router.post("/devices/associate")
async def associate_device(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    device_type = data.get("device_type", "")
    if device_type not in ("bracelet", "scale", "vest", "dorsi"):
        raise HTTPException(400, "Type d'appareil invalide")
    if device_type == "bracelet" and not await _has_active_subscription(session, user):
        raise HTTPException(403, "Abonnement requis pour le bracelet Elio")

    names = {"bracelet": "Bracelet Elio", "scale": "Balance Vita", "vest": "Gilet Elder", "dorsi": "Coussin Dorsi"}
    now = utcnow()
    stmt = pg_insert(Device).values(
        user_id=user["id"], type=device_type,
        name=names.get(device_type, device_type),
        connected=False, paired=True, battery=0, last_sync=now,
    ).on_conflict_do_update(
        index_elements=[Device.user_id, Device.type],
        set_={"name": names.get(device_type, device_type), "paired": True, "last_sync": now},
    )
    await session.execute(stmt)
    await session.commit()
    res = await session.execute(
        select(Device).where(Device.user_id == user["id"], Device.type == device_type)
    )
    return {"status": "associated", "device": row_to_dict(res.scalar_one_or_none())}


@router.delete("/devices/{device_type}/remove")
async def remove_device(
    device_type: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(Device).where(Device.user_id == user["id"], Device.type == device_type)
    )
    await session.commit()
    return {"status": "removed"}


@router.post("/devices/remove-by-type")
async def remove_device_by_type(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    device_type = data.get("device_type", "")
    await session.execute(
        delete(Device).where(Device.user_id == user["id"], Device.type == device_type)
    )
    await session.commit()
    return {"status": "removed"}


@router.get("/devices/latest")
async def get_latest_readings(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    out = {}
    for dt in ("bracelet", "scale", "vest", "dorsi"):
        res = await session.execute(
            select(DeviceReading)
            .where(DeviceReading.user_id == user["id"], DeviceReading.device_type == dt)
            .order_by(DeviceReading.timestamp.desc())
            .limit(1)
        )
        r = res.scalar_one_or_none()
        if r:
            out[dt] = row_to_dict(r)
    return out


@router.get("/devices/scale/history")
@router.get("/scale/history")
async def get_scale_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(DeviceReading)
        .where(DeviceReading.user_id == user["id"], DeviceReading.device_type == "scale")
        .order_by(DeviceReading.timestamp.desc())
        .limit(20)
    )
    return [row_to_dict(r) for r in res.scalars().all()]
