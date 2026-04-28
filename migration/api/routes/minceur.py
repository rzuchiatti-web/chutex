"""Routes Minceur : objectifs poids, suivi quotidien, cache."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.programs import (
    MinceurDailyCache,
    MinceurGoal,
    MinceurProgram,
    MinceurTracking,
)

router = APIRouter()


@router.post("/minceur/weight-goal")
async def set_weight_goal(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    stmt = pg_insert(MinceurGoal).values(
        user_id=user["id"],
        target_kg=data.get("target_kg"),
        weeks=data.get("weeks"),
    ).on_conflict_do_update(
        index_elements=[MinceurGoal.user_id],
        set_={"target_kg": data.get("target_kg"), "weeks": data.get("weeks")},
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved"}


@router.delete("/minceur/weight-goal")
async def delete_weight_goal(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(delete(MinceurGoal).where(MinceurGoal.user_id == user["id"]))
    await session.commit()
    return {"status": "deleted"}


@router.get("/minceur/weight-goal-status")
async def get_weight_goal_status(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(MinceurGoal).where(MinceurGoal.user_id == user["id"]))
    g = res.scalar_one_or_none()
    if not g:
        return {"active": False}
    return {"active": True, "goal": row_to_dict(g)}


@router.post("/minceur/track")
async def track_today(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    date = data.get("date") or utcnow().strftime("%Y-%m-%d")
    completed = data.get("completed") or {}
    stmt = pg_insert(MinceurTracking).values(
        user_id=user["id"], date=date, completed=completed, updated_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[MinceurTracking.user_id, MinceurTracking.date],
        set_={"completed": completed, "updated_at": utcnow()},
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved"}


@router.get("/minceur/today-tracking")
async def get_today_tracking(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    date = utcnow().strftime("%Y-%m-%d")
    res = await session.execute(
        select(MinceurTracking).where(
            MinceurTracking.user_id == user["id"],
            MinceurTracking.date == date,
        )
    )
    t = res.scalar_one_or_none()
    return row_to_dict(t) if t else {"date": date, "completed": {}}
