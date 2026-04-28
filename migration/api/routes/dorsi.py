"""Routes Dorsi (bilan + programs)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.devices import DorsiBilan, DorsiProgram

router = APIRouter()


@router.post("/dorsi/bilan")
async def create_bilan(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    bid = str(uuid.uuid4())
    b = DorsiBilan(
        id=bid, user_id=user["id"],
        flexion_score=data.get("flexion_score"),
        extension_score=data.get("extension_score"),
        lateral_left_score=data.get("lateral_left_score"),
        lateral_right_score=data.get("lateral_right_score"),
        rotation_left_score=data.get("rotation_left_score"),
        rotation_right_score=data.get("rotation_right_score"),
        overall_score=data.get("overall_score"),
        timestamp=utcnow(),
    )
    session.add(b)
    await session.commit()
    return row_to_dict(b)


@router.get("/dorsi/bilans")
async def list_bilans(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(DorsiBilan).where(DorsiBilan.user_id == user["id"])
        .order_by(DorsiBilan.timestamp.desc()).limit(50)
    )
    return [row_to_dict(b) for b in res.scalars().all()]


@router.get("/dorsi/bilan/{bilan_id}")
async def get_bilan(
    bilan_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(DorsiBilan).where(DorsiBilan.id == bilan_id))
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Bilan introuvable")
    return row_to_dict(b)


@router.post("/dorsi/program")
async def create_program(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    pid = str(uuid.uuid4())
    p = DorsiProgram(
        id=pid, user_id=user["id"],
        bilan_id=data.get("bilan_id"),
        status="active",
        current_day=1,
        days=data.get("days") or [],
        created_at=utcnow(),
    )
    session.add(p)
    await session.commit()
    return row_to_dict(p)


@router.get("/dorsi/programs")
async def list_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(DorsiProgram).where(DorsiProgram.user_id == user["id"])
        .order_by(DorsiProgram.created_at.desc())
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/dorsi/program/{program_id}")
async def get_program(
    program_id: str, session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(DorsiProgram).where(DorsiProgram.id == program_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Programme introuvable")
    return row_to_dict(p)


@router.put("/dorsi/program/{program_id}/session")
async def update_session(
    program_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(DorsiProgram).where(DorsiProgram.id == program_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Programme introuvable")
    days = list(p.days or [])
    day_idx = data.get("day_index", p.current_day - 1)
    if 0 <= day_idx < len(days):
        days[day_idx] = {**days[day_idx], **(data.get("session") or {})}
    p.days = days
    p.current_day = data.get("current_day", p.current_day)
    await session.commit()
    return {"status": "updated"}


@router.get("/dorsi/score-history")
async def score_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(DorsiBilan).where(DorsiBilan.user_id == user["id"])
        .order_by(DorsiBilan.timestamp.asc()).limit(100)
    )
    return [
        {"timestamp": b.timestamp.isoformat() if b.timestamp else None,
         "score": b.overall_score}
        for b in res.scalars().all()
    ]
