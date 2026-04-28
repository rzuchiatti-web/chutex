"""Routes Reminders : CRUD rappels (médicaments / hydratation / etc.)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.notifications import Reminder

router = APIRouter()


@router.get("/reminders")
async def list_reminders(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Reminder).where(Reminder.user_id == user["id"]).order_by(Reminder.created_at.desc())
    )
    return [row_to_dict(r) for r in res.scalars().all()]


@router.post("/reminders")
async def create_reminder(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rid = str(uuid.uuid4())
    r = Reminder(
        id=rid, user_id=user["id"],
        type=data.get("type"), time=data.get("time"),
        enabled=data.get("enabled", True),
        label=data.get("label"), days=data.get("days") or [],
        notes=data.get("notes"), dosage=data.get("dosage"),
        volume=data.get("volume"), benefits=data.get("benefits"),
        ingredients=data.get("ingredients"),
        created_at=utcnow(),
    )
    session.add(r)
    await session.commit()
    return row_to_dict(r)


@router.put("/reminders/{rid}")
async def update_reminder(
    rid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Reminder).where(Reminder.id == rid, Reminder.user_id == user["id"])
    )
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Rappel introuvable")
    allowed = {"type", "time", "enabled", "label", "days", "notes", "dosage", "volume", "benefits", "ingredients"}
    for k, v in data.items():
        if k in allowed:
            setattr(r, k, v)
    await session.commit()
    return row_to_dict(r)


@router.delete("/reminders/{rid}")
async def delete_reminder(
    rid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(Reminder).where(Reminder.id == rid, Reminder.user_id == user["id"])
    )
    await session.commit()
    return {"status": "deleted"}
