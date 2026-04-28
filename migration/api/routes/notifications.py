"""Routes notifications + Web Push subscriptions."""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.notifications import Notification, PushSubscription

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/notifications")
async def list_notifications(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Notification)
        .where(Notification.user_id == user["id"])
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return [row_to_dict(n) for n in res.scalars().all()]


@router.get("/notifications/unread-count")
async def unread_count(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy import func
    res = await session.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user["id"], Notification.read == False  # noqa: E712
        )
    )
    return {"count": int(res.scalar() or 0)}


@router.put("/notifications/{notif_id}/read")
async def mark_read(
    notif_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        update(Notification)
        .where(Notification.id == notif_id, Notification.user_id == user["id"])
        .values(read=True)
    )
    await session.commit()
    return {"status": "ok"}


@router.put("/notifications/read-all")
async def mark_all_read(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        update(Notification)
        .where(Notification.user_id == user["id"], Notification.read == False)  # noqa: E712
        .values(read=True)
    )
    await session.commit()
    return {"status": "ok"}


async def create_notification(
    session: AsyncSession,
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    icon: str = "ri-notification-3-line",
    color: str = "#3B82F6",
    data: dict | None = None,
) -> dict:
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        icon=icon,
        color=color,
        data=data or {},
        read=False,
        created_at=utcnow(),
    )
    session.add(notif)
    await session.commit()
    return row_to_dict(notif)


@router.post("/notifications/subscribe-push")
async def subscribe_push(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    subscription = data.get("subscription")
    if not subscription:
        return {"status": "error", "message": "subscription required"}
    endpoint = (subscription or {}).get("endpoint", "")
    res = await session.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user["id"],
        )
    )
    for existing in res.scalars().all():
        if (existing.subscription or {}).get("endpoint") == endpoint:
            return {"status": "already_subscribed"}
    sub = PushSubscription(
        id=str(uuid.uuid4()),
        user_id=user["id"],
        subscription=subscription,
        created_at=utcnow(),
    )
    session.add(sub)
    await session.commit()
    return {"status": "subscribed"}
