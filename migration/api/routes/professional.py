"""Routes Espace Professionnel (étendues) — Templates, beneficiaries, programs.

Couverture pragmatique des endpoints les plus utilisés par l'app mobile :
profil, bénéficiaires, exercise/meal/reminder templates CRUD, programs,
assignments, dashboard.
"""
from __future__ import annotations

import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.auth import User
from app.models.health import LatestVitals, Weighing
from app.models.notifications import Reminder
from app.models.pro import (
    ProAssignedExercise,
    ProAssignedMeal,
    ProAssignedReminder,
    ProExerciseTemplate,
    ProMeal,
    ProMealTemplate,
    ProProgram,
    ProReminderTemplate,
)
from app.models.programs import MinceurGoal

router = APIRouter()

UPLOAD_DIR = "/app/uploads/pro"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _ensure_pro(user: dict) -> None:
    if user.get("role") not in ("professional", "admin"):
        raise HTTPException(403, "Reserve aux professionnels")


# ---------------- Profile ------------------------------------------------
@router.get("/pro/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if not me:
        raise HTTPException(404, "Profil introuvable")
    d = row_to_dict(me)
    d.pop("password_hash", None)
    return d


@router.put("/pro/profile")
async def update_profile(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    allowed = {
        "name", "phone", "address", "bio", "specialty", "professional_type",
        "structure_name", "siret", "adeli_rpps", "intervention_radius_km",
        "latitude", "longitude", "diploma", "diploma_year",
    }
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if not me:
        raise HTTPException(404, "Profil introuvable")
    for k, v in data.items():
        if k in allowed and hasattr(me, k):
            setattr(me, k, v)
    await session.commit()
    return {"status": "updated"}


# ---------------- Beneficiaries ------------------------------------------
@router.get("/pro/beneficiaries")
async def list_beneficiaries(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if not me:
        return []
    bids = list(me.beneficiaries or [])
    if not bids:
        return []
    bres = await session.execute(select(User).where(User.id.in_(bids)))
    out = []
    for b in bres.scalars().all():
        d = row_to_dict(b)
        d.pop("password_hash", None)
        out.append(d)
    return out


@router.get("/pro/beneficiary-nutrition/{beneficiary_id}")
async def get_beneficiary_nutrition(
    beneficiary_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == beneficiary_id))
    lv = lvr.scalar_one_or_none()
    wr = await session.execute(
        select(Weighing).where(Weighing.user_id == beneficiary_id)
        .order_by(Weighing.timestamp.desc()).limit(10)
    )
    weighings = [row_to_dict(w) for w in wr.scalars().all()]
    return {
        "latest_vitals": row_to_dict(lv) if lv else None,
        "weighings": weighings,
    }


@router.get("/pro/beneficiary-weight-goal/{beneficiary_id}")
async def get_weight_goal(
    beneficiary_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(MinceurGoal).where(MinceurGoal.user_id == beneficiary_id))
    g = res.scalar_one_or_none()
    return row_to_dict(g) if g else {"active": False}


# ---------------- Image upload -------------------------------------------
@router.post("/pro/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    _ensure_pro(user)
    if not file.filename:
        raise HTTPException(400, "Fichier requis")
    ext = (file.filename.rsplit(".", 1)[-1] or "jpg").lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(415, "Format image non supporte")
    fname = f"{uuid.uuid4().hex}.{ext}"
    fp = os.path.join(UPLOAD_DIR, fname)
    with open(fp, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/api/pro/images/{fname}"}


# ---------------- Exercise templates -------------------------------------
@router.get("/pro/exercise-templates")
async def list_exercise_templates(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(
        select(ProExerciseTemplate).where(
            or_(ProExerciseTemplate.professional_id == user["id"],
                ProExerciseTemplate.professional_id.is_(None))
        ).limit(200)
    )
    return [row_to_dict(t) for t in res.scalars().all()]


@router.post("/pro/exercise-templates")
async def create_exercise_template(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    tid = str(uuid.uuid4())
    t = ProExerciseTemplate(
        id=tid, professional_id=user["id"], is_template=True,
        title=data.get("title", "Sans titre"),
        description=data.get("description"),
        category=data.get("category"),
        difficulty=data.get("difficulty"),
        muscle_group=data.get("muscle_group"),
        sets=data.get("sets"),
        repetitions=data.get("repetitions"),
        rest_seconds=data.get("rest_seconds"),
        equipment=data.get("equipment"),
        steps=data.get("steps") or [],
        image=data.get("image"),
        video_url=data.get("video_url"),
        notes=data.get("notes"),
        created_at=utcnow(),
    )
    session.add(t)
    await session.commit()
    return row_to_dict(t)


@router.put("/pro/exercise-templates/{tid}")
async def update_exercise_template(
    tid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(ProExerciseTemplate).where(ProExerciseTemplate.id == tid))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Template introuvable")
    allowed = {"title", "description", "category", "difficulty", "muscle_group",
               "sets", "repetitions", "rest_seconds", "equipment", "steps",
               "image", "video_url", "notes"}
    for k, v in data.items():
        if k in allowed and hasattr(t, k):
            setattr(t, k, v)
    await session.commit()
    return row_to_dict(t)


@router.delete("/pro/exercise-templates/{tid}")
async def delete_exercise_template(
    tid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProExerciseTemplate).where(ProExerciseTemplate.id == tid))
    await session.commit()
    return {"status": "deleted"}


# ---------------- Meal templates -----------------------------------------
@router.get("/pro/meal-templates")
async def list_meal_templates(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(
        select(ProMealTemplate).where(
            or_(ProMealTemplate.professional_id == user["id"],
                ProMealTemplate.professional_id.is_(None))
        ).limit(200)
    )
    return [row_to_dict(t) for t in res.scalars().all()]


@router.post("/pro/meal-templates")
async def create_meal_template(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    tid = str(uuid.uuid4())
    t = ProMealTemplate(
        id=tid, professional_id=user["id"], is_template=True,
        title=data.get("title", "Sans titre"),
        meal_type=data.get("meal_type"),
        image=data.get("image"),
        items=data.get("items") or [],
        ingredients=data.get("ingredients") or [],
        steps=data.get("steps") or [],
        calories=data.get("calories"),
        proteins=data.get("proteins"),
        glucides=data.get("glucides"),
        lipides=data.get("lipides"),
        notes=data.get("notes"),
        created_at=utcnow(),
    )
    session.add(t)
    await session.commit()
    return row_to_dict(t)


@router.put("/pro/meal-templates/{tid}")
async def update_meal_template(
    tid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(ProMealTemplate).where(ProMealTemplate.id == tid))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Template introuvable")
    for k, v in data.items():
        if hasattr(t, k):
            setattr(t, k, v)
    await session.commit()
    return row_to_dict(t)


@router.delete("/pro/meal-templates/{tid}")
async def delete_meal_template(
    tid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProMealTemplate).where(ProMealTemplate.id == tid))
    await session.commit()
    return {"status": "deleted"}


# ---------------- Reminder templates -------------------------------------
@router.get("/pro/reminder-templates")
async def list_reminder_templates(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(
        select(ProReminderTemplate).where(
            or_(ProReminderTemplate.professional_id == user["id"],
                ProReminderTemplate.professional_id.is_(None))
        ).limit(200)
    )
    return [row_to_dict(t) for t in res.scalars().all()]


@router.post("/pro/reminder-templates")
async def create_reminder_template(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    tid = str(uuid.uuid4())
    t = ProReminderTemplate(
        id=tid, professional_id=user["id"], is_template=True,
        title=data.get("title", "Sans titre"),
        reminder_type=data.get("reminder_type"),
        dosage=data.get("dosage"),
        time=data.get("time"),
        notes=data.get("notes"),
        image=data.get("image"),
        created_at=utcnow(),
    )
    session.add(t)
    await session.commit()
    return row_to_dict(t)


@router.put("/pro/reminder-templates/{tid}")
async def update_reminder_template(
    tid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(ProReminderTemplate).where(ProReminderTemplate.id == tid))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Template introuvable")
    for k, v in data.items():
        if hasattr(t, k):
            setattr(t, k, v)
    await session.commit()
    return row_to_dict(t)


@router.delete("/pro/reminder-templates/{tid}")
async def delete_reminder_template(
    tid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProReminderTemplate).where(ProReminderTemplate.id == tid))
    await session.commit()
    return {"status": "deleted"}


# ---------------- Programs (pro_programs) --------------------------------
@router.get("/pro/programs")
async def list_pro_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(
        select(ProProgram).where(ProProgram.professional_id == user["id"])
        .order_by(ProProgram.created_at.desc())
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/pro/programs/{beneficiary_id}")
async def list_programs_for_beneficiary(
    beneficiary_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(
        select(ProProgram).where(
            ProProgram.professional_id == user["id"],
            ProProgram.beneficiary_id == beneficiary_id,
        ).order_by(ProProgram.created_at.desc())
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.post("/pro/programs/{beneficiary_id}")
async def create_program_for_beneficiary(
    beneficiary_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    pid = str(uuid.uuid4())
    p = ProProgram(
        id=pid,
        professional_id=user["id"],
        professional_name=user.get("name", ""),
        professional_type=user.get("professional_type", ""),
        beneficiary_id=beneficiary_id,
        beneficiary_name=data.get("beneficiary_name", ""),
        title=data.get("title", ""),
        description=data.get("description"),
        frequency=data.get("frequency"),
        duration_weeks=data.get("duration_weeks"),
        category=data.get("category"),
        status="active",
        sessions=data.get("sessions") or [],
        created_at=utcnow(),
    )
    session.add(p)
    await session.commit()
    return row_to_dict(p)


@router.put("/pro/programs/edit/{program_id}")
async def edit_program(
    program_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(ProProgram).where(ProProgram.id == program_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Programme introuvable")
    for k, v in data.items():
        if hasattr(p, k):
            setattr(p, k, v)
    await session.commit()
    return row_to_dict(p)


@router.delete("/pro/programs/edit/{program_id}")
async def delete_program(
    program_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProProgram).where(ProProgram.id == program_id))
    await session.commit()
    return {"status": "deleted"}


@router.get("/pro/all-programs")
async def all_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    res = await session.execute(select(ProProgram).order_by(ProProgram.created_at.desc()).limit(200))
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/pro/my-programs")
async def my_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProProgram).where(ProProgram.beneficiary_id == user["id"])
        .order_by(ProProgram.created_at.desc())
    )
    return [row_to_dict(p) for p in res.scalars().all()]


# ---------------- Dashboard ----------------------------------------------
@router.get("/pro/dashboard")
async def pro_dashboard(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    from sqlalchemy import func
    progs_count = (await session.execute(
        select(func.count(ProProgram.id)).where(ProProgram.professional_id == user["id"])
    )).scalar() or 0
    ex_count = (await session.execute(
        select(func.count(ProAssignedExercise.id)).where(ProAssignedExercise.professional_id == user["id"])
    )).scalar() or 0
    meal_count = (await session.execute(
        select(func.count(ProAssignedMeal.id)).where(ProAssignedMeal.professional_id == user["id"])
    )).scalar() or 0
    rem_count = (await session.execute(
        select(func.count(ProAssignedReminder.id)).where(ProAssignedReminder.professional_id == user["id"])
    )).scalar() or 0
    me_res = await session.execute(select(User).where(User.id == user["id"]))
    me = me_res.scalar_one_or_none()
    bens = len((me.beneficiaries or [])) if me else 0
    return {
        "beneficiaries_count": bens,
        "programs_count": int(progs_count),
        "exercises_assigned": int(ex_count),
        "meals_assigned": int(meal_count),
        "reminders_assigned": int(rem_count),
    }


# ---------------- Assignments (assign-reminder, assign-meal) -------------
@router.post("/pro/assign-reminder")
async def assign_reminder(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    aid = str(uuid.uuid4())
    a = ProAssignedReminder(
        id=aid,
        reminder_template_id=data.get("template_id"),
        professional_id=user["id"],
        beneficiary_id=data.get("beneficiary_id"),
        payload=data,
        active=True,
        created_at=utcnow(),
    )
    session.add(a)
    await session.commit()
    return row_to_dict(a)


@router.get("/pro/assigned-reminders/{beneficiary_id}")
async def list_assigned_reminders_pro(
    beneficiary_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedReminder).where(
            ProAssignedReminder.beneficiary_id == beneficiary_id,
            ProAssignedReminder.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.delete("/pro/assigned-reminders/{aid}")
async def delete_assigned_reminder(
    aid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProAssignedReminder).where(ProAssignedReminder.id == aid))
    await session.commit()
    return {"status": "deleted"}


@router.post("/pro/assign-meal")
async def assign_meal(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    aid = str(uuid.uuid4())
    a = ProAssignedMeal(
        id=aid,
        meal_template_id=data.get("template_id"),
        professional_id=user["id"],
        beneficiary_id=data.get("beneficiary_id"),
        payload=data,
        active=True,
        created_at=utcnow(),
    )
    session.add(a)
    await session.commit()
    return row_to_dict(a)


@router.get("/pro/assigned-meals/{beneficiary_id}")
async def list_assigned_meals_pro(
    beneficiary_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedMeal).where(
            ProAssignedMeal.beneficiary_id == beneficiary_id,
            ProAssignedMeal.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.delete("/pro/assigned-meals/{aid}")
async def delete_assigned_meal(
    aid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_pro(user)
    await session.execute(delete(ProAssignedMeal).where(ProAssignedMeal.id == aid))
    await session.commit()
    return {"status": "deleted"}


# ---------------- Today reminders/meals ----------------------------------
@router.get("/pro/beneficiary-today-reminders")
async def beneficiary_today_reminders(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedReminder).where(
            ProAssignedReminder.beneficiary_id == user["id"],
            ProAssignedReminder.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.get("/pro/beneficiary-today-meals")
async def beneficiary_today_meals(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProAssignedMeal).where(
            ProAssignedMeal.beneficiary_id == user["id"],
            ProAssignedMeal.active == True,  # noqa: E712
        )
    )
    return [row_to_dict(a) for a in res.scalars().all()]
