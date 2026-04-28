"""Routes Espace Pro : conversations, messages, exercices/repas/rappels assignés."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.pro import (
    ProAssignedExercise,
    ProAssignedMeal,
    ProAssignedReminder,
    ProConversation,
    ProMessage,
    ProNotification,
)

router = APIRouter()


# ---------------- Conversations ------------------------------------------
@router.get("/pro/conversations")
async def list_conversations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProConversation).where(
            (ProConversation.professional_id == user["id"])
            | (ProConversation.beneficiary_id == user["id"])
        ).order_by(ProConversation.last_message_at.desc())
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.get("/pro/conversations/{conv_id}/messages")
async def list_messages(
    conv_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProMessage).where(ProMessage.conversation_id == conv_id)
        .order_by(ProMessage.created_at.asc()).limit(200)
    )
    return [row_to_dict(m) for m in res.scalars().all()]


@router.post("/pro/conversations/{conv_id}/messages")
async def send_message(
    conv_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    mid = str(uuid.uuid4())
    msg = ProMessage(
        id=mid, conversation_id=conv_id,
        sender_id=user["id"], sender_name=user.get("name", ""),
        content=data.get("content"),
        message_type=data.get("type", "text"),
        attachment_url=data.get("attachment_url"),
        read=False, created_at=utcnow(),
    )
    session.add(msg)
    # Update conversation last_message
    cres = await session.execute(select(ProConversation).where(ProConversation.id == conv_id))
    conv = cres.scalar_one_or_none()
    if conv:
        conv.last_message = data.get("content")
        conv.last_message_at = utcnow()
        if conv.professional_id == user["id"]:
            conv.unread_ben = (conv.unread_ben or 0) + 1
        else:
            conv.unread_pro = (conv.unread_pro or 0) + 1
    await session.commit()
    return row_to_dict(msg)


# ---------------- Exercises (assigned) ------------------------------------
@router.get("/pro/exercises")
async def list_assigned_exercises(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedExercise).where(
            ProAssignedExercise.beneficiary_id == user["id"],
            ProAssignedExercise.active == True,  # noqa: E712
        ).order_by(ProAssignedExercise.created_at.desc())
    )
    return [row_to_dict(e) for e in res.scalars().all()]


@router.post("/pro/exercises")
async def assign_exercise(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eid = str(uuid.uuid4())
    ex = ProAssignedExercise(
        id=eid,
        professional_id=user["id"],
        beneficiary_id=data.get("beneficiary_id") or user["id"],
        title=data.get("title"),
        description=data.get("description"),
        category=data.get("category"),
        difficulty=data.get("difficulty"),
        muscle_group=data.get("muscle_group"),
        equipment=data.get("equipment"),
        steps=data.get("steps") or [],
        days=data.get("days") or [],
        repetitions=data.get("repetitions"),
        sets=data.get("sets"),
        rest_seconds=data.get("rest_seconds"),
        active=True,
        completions=[],
        created_at=utcnow(),
    )
    session.add(ex)
    await session.commit()
    return row_to_dict(ex)


# ---------------- Meals --------------------------------------------------
@router.get("/pro/meals")
async def list_assigned_meals(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedMeal).where(
            ProAssignedMeal.beneficiary_id == user["id"],
            ProAssignedMeal.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(m) for m in res.scalars().all()]


# ---------------- Reminders (pro-assigned) -------------------------------
@router.get("/pro/reminders")
async def list_assigned_reminders(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedReminder).where(
            ProAssignedReminder.beneficiary_id == user["id"],
            ProAssignedReminder.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(r) for r in res.scalars().all()]


@router.get("/pro/notifications")
async def list_pro_notifications(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProNotification).where(ProNotification.professional_id == user["id"])
        .order_by(ProNotification.created_at.desc()).limit(50)
    )
    return [row_to_dict(n) for n in res.scalars().all()]
