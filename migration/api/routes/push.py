"""Routes Push (Expo) : tokens, preferences, history, send helpers."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.database import AsyncSessionLocal
from app.models.notifications import (
    PushHistory,
    PushLog,
    PushPreference,
    PushToken,
)

logger = logging.getLogger(__name__)
router = APIRouter()

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def _upsert_push_token(session: AsyncSession, user_id: str, token: str) -> None:
    stmt = pg_insert(PushToken).values(
        user_id=user_id, push_token=token, updated_at=utcnow()
    ).on_conflict_do_update(
        index_elements=[PushToken.user_id],
        set_={"push_token": token, "updated_at": utcnow()},
    )
    await session.execute(stmt)


@router.post("/push/register")
async def register_push_token(
    body: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    token = body.get("push_token")
    if not token:
        raise HTTPException(400, "push_token required")
    await _upsert_push_token(session, user["id"], token)
    await session.commit()
    return {"status": "registered"}


@router.post("/push/unregister")
async def unregister_push_token(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(delete(PushToken).where(PushToken.user_id == user["id"]))
    await session.commit()
    return {"status": "unregistered"}


@router.get("/push/preferences")
async def get_push_preferences(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(PushPreference).where(PushPreference.user_id == user["id"])
    )
    prefs = res.scalar_one_or_none()
    if not prefs:
        prefs = PushPreference(user_id=user["id"])
        session.add(prefs)
        await session.commit()
        await session.refresh(prefs)
    return row_to_dict(prefs)


@router.put("/push/preferences")
async def update_push_preferences(
    body: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    allowed = {
        "sos_alerts", "health_thresholds", "fall_detection", "low_battery",
        "reminders_hydration", "reminders_medication", "reminders_alarm",
        "interventions", "guardian_requests",
    }
    payload = {k: v for k, v in body.items() if k in allowed}
    res = await session.execute(
        select(PushPreference).where(PushPreference.user_id == user["id"])
    )
    prefs = res.scalar_one_or_none()
    if not prefs:
        prefs = PushPreference(user_id=user["id"], **payload)
        session.add(prefs)
    else:
        for k, v in payload.items():
            setattr(prefs, k, v)
    await session.commit()
    return {"status": "updated"}


async def send_push_to_user(
    user_id: str,
    title: str,
    body: str,
    data: dict | None = None,
    category: str = "general",
) -> bool:
    """Standalone helper (re-creates its own session)."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(PushToken).where(PushToken.user_id == user_id)
        )
        token_doc = res.scalar_one_or_none()
        if not token_doc or not token_doc.push_token:
            return False
        message: dict = {
            "to": token_doc.push_token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "categoryIdentifier": category,
        }
        if data:
            message["data"] = data
        if category in ("sos", "fall", "intervention"):
            message["badge"] = 1
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    EXPO_PUSH_URL, json=message,
                    headers={"Accept": "application/json", "Content-Type": "application/json"},
                )
                session.add(PushLog(
                    user_id=user_id, title=title, body=body,
                    category=category, sent_at=utcnow(),
                    success=resp.status_code == 200,
                ))
                await session.commit()
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"Push error for {user_id}: {e}")
            return False


async def send_push_to_users(
    user_ids: list,
    title: str,
    body: str,
    data: dict | None = None,
    category: str = "general",
    pref_key: str | None = None,
) -> None:
    for uid in user_ids:
        if pref_key:
            async with AsyncSessionLocal() as session:
                res = await session.execute(
                    select(PushPreference).where(PushPreference.user_id == uid)
                )
                prefs = res.scalar_one_or_none()
                if prefs and not getattr(prefs, pref_key, True):
                    continue
        await send_push_to_user(uid, title, body, data, category)


@router.post("/push/test")
async def test_push(user: dict = Depends(get_current_user)):
    await send_push_to_user(
        user["id"], "Test Notification CHUTEX",
        "Les notifications fonctionnent !", {"type": "test"}, "test",
    )
    return {"status": "sent"}


@router.get("/push/history")
async def push_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(PushLog)
        .where(PushLog.user_id == user["id"])
        .order_by(PushLog.sent_at.desc())
        .limit(20)
    )
    return [row_to_dict(p) for p in res.scalars().all()]
