"""Routes Programs : catalog, detail, start, stop, active, save-task."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.programs import (
    Program,
    ProgramCheckin,
    ProgramEnrollment,
    ProgramHealthBaseline,
    ProgramTaskProgress,
)

router = APIRouter()


@router.get("/programs/catalog")
async def get_programs_catalog(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Program))
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/programs/detail/{program_id}")
async def get_program_detail(
    program_id: str, session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Program).where(Program.id == program_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Programme introuvable")
    return row_to_dict(p)


@router.post("/programs/start/{program_id}")
async def start_program(
    program_id: str,
    data: dict | None = None,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    pres = await session.execute(select(Program).where(Program.id == program_id))
    program = pres.scalar_one_or_none()
    if not program:
        raise HTTPException(404, "Programme introuvable")

    eid = str(uuid.uuid4())
    now = utcnow()
    enroll = ProgramEnrollment(
        id=eid,
        user_id=user["id"],
        program_id=program_id,
        status="active",
        current_day=1,
        streak=0,
        completed_days=[],
        checkins=[],
        mode=(data or {}).get("mode"),
        onboarding=(data or {}).get("onboarding") or {},
        health_snapshot_start=(data or {}).get("health_snapshot") or {},
        started_at=now,
    )
    session.add(enroll)
    if (data or {}).get("onboarding"):
        session.add(ProgramHealthBaseline(
            program_id=program_id, user_id=user["id"],
            captured_at=now, onboarding=data["onboarding"],
        ))
    await session.commit()
    return {"enrollment_id": eid, "status": "started", "program_id": program_id}


@router.get("/programs/active")
async def get_active_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProgramEnrollment).where(
            ProgramEnrollment.user_id == user["id"],
            ProgramEnrollment.status == "active",
        )
    )
    return [row_to_dict(e) for e in res.scalars().all()]


@router.post("/programs/save-task")
async def save_task(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    enrollment_id = data.get("enrollment_id")
    date = data.get("date") or utcnow().strftime("%Y-%m-%d")
    if not enrollment_id:
        raise HTTPException(400, "enrollment_id required")
    stmt = pg_insert(ProgramTaskProgress).values(
        enrollment_id=enrollment_id,
        date=date,
        user_id=user["id"],
        day=data.get("day"),
        tasks_done_indices=data.get("tasks_done_indices") or [],
        task_ratings=data.get("task_ratings") or {},
        notes=data.get("notes") or {},
    ).on_conflict_do_update(
        index_elements=[ProgramTaskProgress.enrollment_id, ProgramTaskProgress.date],
        set_={
            "tasks_done_indices": data.get("tasks_done_indices") or [],
            "task_ratings": data.get("task_ratings") or {},
            "notes": data.get("notes") or {},
            "day": data.get("day"),
        },
    )
    await session.execute(stmt)
    await session.commit()
    return {"status": "saved"}


@router.post("/programs/stop")
async def stop_program(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    enrollment_id = data.get("enrollment_id")
    res = await session.execute(
        select(ProgramEnrollment).where(
            ProgramEnrollment.id == enrollment_id,
            ProgramEnrollment.user_id == user["id"],
        )
    )
    e = res.scalar_one_or_none()
    if not e:
        raise HTTPException(404, "Inscription introuvable")
    e.status = "stopped"
    e.stopped_at = utcnow()
    await session.commit()
    return {"status": "stopped"}


@router.post("/programs/checkin")
async def add_checkin(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    program_id = data.get("program_id")
    if not program_id:
        raise HTTPException(400, "program_id required")
    session.add(ProgramCheckin(
        id=str(uuid.uuid4()),
        user_id=user["id"], program_id=program_id,
        day=int(data.get("day") or 1),
        mood=data.get("mood"),
        note=data.get("note"),
        completed_tasks=data.get("completed_tasks"),
        timestamp=utcnow(),
    ))
    await session.commit()
    return {"status": "saved"}
