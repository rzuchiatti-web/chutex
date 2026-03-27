from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid, os

from auth import get_current_user, get_effective_role, sanitize_user
from database import db

router = APIRouter()

UPLOAD_DIR = "/app/backend/uploads"


@router.get("/pro/beneficiary-nutrition/{beneficiary_id}")
async def get_beneficiary_nutrition(beneficiary_id: str, user=Depends(get_current_user)):
    """Get nutrition targets for a beneficiary (kcal, macros, water)."""
    require_pro(user)
    cached = await db.minceur_daily_cache.find_one(
        {"user_id": beneficiary_id}, {"_id": 0}, sort=[("date", -1)]
    )
    if cached and cached.get("recommendations"):
        recs = cached["recommendations"]
        return {
            "daily_calories": recs.get("daily_calories", 0),
            "water_ml": recs.get("water_ml", 0),
            "macros": recs.get("macros", {}),
        }
    u = await db.users.find_one({"id": beneficiary_id}, {"_id": 0})
    if not u:
        return {"daily_calories": 0, "water_ml": 0, "macros": {}}
    weight = u.get("weight_kg") or 70
    return {
        "daily_calories": int(weight * 25),
        "water_ml": int(weight * 30),
        "macros": {"proteines_g": int(weight * 1.5), "glucides_g": int(weight * 3), "lipides_g": int(weight * 0.8)},
    }


@router.get("/pro/beneficiary-weight-goal/{beneficiary_id}")
async def get_beneficiary_weight_goal(beneficiary_id: str, user=Depends(get_current_user)):
    """Get weight goal status for a beneficiary (for guardian view)."""
    require_pro(user)
    goal = await db.minceur_goals.find_one({"user_id": beneficiary_id}, {"_id": 0})
    if not goal:
        return {"has_goal": False}
    u = await db.users.find_one({"id": beneficiary_id}, {"_id": 0})
    current_weight = u.get("weight_kg", 0) if u else 0
    # Try to get latest scale reading
    latest_scale = await db.device_readings.find_one(
        {"user_id": beneficiary_id, "device_type": "scale"}, {"_id": 0},
        sort=[("timestamp", -1)]
    )
    if latest_scale and latest_scale.get("data", {}).get("weight"):
        current_weight = latest_scale["data"]["weight"]
    # Get weight history for progress
    history = await db.device_readings.find(
        {"user_id": beneficiary_id, "device_type": "scale"},
        {"_id": 0, "data.weight": 1, "timestamp": 1}
    ).sort("timestamp", -1).to_list(30)
    weights = [{"weight": h["data"]["weight"], "date": h["timestamp"]} for h in history if h.get("data", {}).get("weight")]
    start_weight = weights[-1]["weight"] if weights else current_weight
    target = goal.get("target_kg", 0)
    progress = 0
    if start_weight and target and start_weight != target:
        progress = round(((start_weight - current_weight) / (start_weight - target)) * 100, 1)
        progress = max(0, min(100, progress))
    return {
        "has_goal": True,
        "target_kg": target,
        "current_kg": current_weight,
        "start_kg": start_weight,
        "weeks": goal.get("weeks", 0),
        "progress_pct": progress,
        "created_at": goal.get("created_at", ""),
        "recent_weights": weights[:10],
    }



@router.get("/pro/assigned-meal-detail/{assignment_id}")
async def get_assigned_meal_detail(assignment_id: str, user=Depends(get_current_user)):
    """Get full detail of an assigned meal, merged with latest template data."""
    doc = await db.pro_assigned_meals.find_one({"id": assignment_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Repas assigne non trouve")
    tpl_id = doc.get("meal_template_id")
    if tpl_id:
        tpl = await db.pro_meal_templates.find_one({"id": tpl_id}, {"_id": 0})
        if tpl:
            for k in ["image", "ingredients", "steps", "calories", "proteins", "glucides", "lipides", "notes", "items"]:
                if tpl.get(k):
                    doc[k] = tpl[k]
    return doc


@router.get("/pro/meal-template-detail/{template_id}")
async def get_meal_template_detail(template_id: str, user=Depends(get_current_user)):
    """Get full detail of a meal template."""
    require_pro(user)
    doc = await db.pro_meal_templates.find_one({"id": template_id, "professional_id": user['id']}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Template repas non trouve")
    return doc


@router.put("/pro/exercise-templates/{template_id}")
async def update_exercise_template(template_id: str, data: dict, user=Depends(get_current_user)):
    """Update an exercise template."""
    require_pro(user)
    update = {}
    for k in ["title", "description", "image", "video_url", "category", "difficulty", "muscle_group", "sets", "repetitions", "duration_min", "rest_seconds", "steps", "equipment", "notes"]:
        if k in data:
            update[k] = data[k]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pro_exercise_templates.update_one({"id": template_id, "professional_id": user['id']}, {"$set": update})
    doc = await db.pro_exercise_templates.find_one({"id": template_id}, {"_id": 0})
    return doc


@router.post("/pro/upload-image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload an image or video for pro content. Returns URL."""
    require_pro(user)
    ext = (file.filename or '').split('.')[-1] or 'jpg'
    ext_lower = ext.lower()
    is_video = ext_lower in ('mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v')
    is_image = ext_lower in ('jpg', 'jpeg', 'png', 'webp', 'gif')
    if not is_video and not is_image:
        raise HTTPException(status_code=400, detail="Format non supporte (jpg, png, webp, mp4, mov, webm)")
    max_size = 50 * 1024 * 1024 if is_video else 5 * 1024 * 1024
    fname = f"{uuid.uuid4().hex}.{ext_lower}"
    path = os.path.join(UPLOAD_DIR, fname)
    total = 0
    with open(path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 512)
            if not chunk:
                break
            total += len(chunk)
            if total > max_size:
                os.remove(path)
                raise HTTPException(status_code=400, detail=f"Fichier trop volumineux (max {'50MB' if is_video else '5MB'})")
            f.write(chunk)
    return {"url": f"/api/uploads/{fname}"}


# ── Models ──

class ProgramCreate(BaseModel):
    title: str
    description: str = ""
    frequency: str = ""  # e.g. "3x/semaine"
    duration_weeks: int = 4
    category: str = "general"  # general, rehab, strength, cardio, flexibility

class SessionCreate(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    image: str = ""
    video_url: str = ""
    media_url: str = ""
    media_type: str = ""  # video, image
    duration_min: int = 30
    repetitions: int = 0
    sets: int = 0
    rest_sec: int = 0
    rest_seconds: int = 60
    steps: List[str] = []
    difficulty: str = "moyen"
    muscle_group: str = ""
    equipment: str = ""
    notes: str = ""
    from_template_id: str = ""

class SessionCompletion(BaseModel):
    status: str = "done"  # done, partial, skipped
    pain_level: Optional[int] = None  # 1-10, for physio
    patient_notes: str = ""

class ProProfileUpdate(BaseModel):
    specialties: List[str] = []
    certifications: List[str] = []
    bio: str = ""
    hourly_rate: float = 0
    professional_type: str = "coach"  # coach, physio

class AssignExerciseCreate(BaseModel):
    exercise_template_id: str
    beneficiary_id: str
    days: List[str] = []  # ["lundi", "mardi", etc.]
    repetitions: int = 12
    sets: int = 3
    rest_seconds: int = 60


# ── Helpers ──

def require_pro(user):
    """Check user is a professional (coach or physio) - either by role or professional_type"""
    pro_type = user.get('professional_type', '')
    role = user.get('active_role') or user.get('role', '')
    if pro_type in ('coach', 'physio') or role == 'professional':
        return get_effective_role(user)
    raise HTTPException(status_code=403, detail="Reserve aux professionnels")


# ── Pro Profile ──

@router.get("/pro/profile")
async def get_pro_profile(user=Depends(get_current_user)):
    require_pro(user)
    u = await db.users.find_one({"id": user['id']}, {"_id": 0, "password_hash": 0})
    return {
        "id": u['id'],
        "name": u.get('name', ''),
        "phone": u.get('phone', ''),
        "professional_type": u.get('professional_type', 'coach'),
        "specialties": u.get('specialties', []),
        "certifications": u.get('certifications', []),
        "bio": u.get('bio', ''),
        "hourly_rate": u.get('hourly_rate', 0),
        "avatar_url": u.get('avatar_url', ''),
        "beneficiary_count": len(u.get('beneficiaries', [])),
    }

@router.put("/pro/profile")
async def update_pro_profile(data: ProProfileUpdate, user=Depends(get_current_user)):
    require_pro(user)
    await db.users.update_one({"id": user['id']}, {"$set": {
        "professional_type": data.professional_type,
        "specialties": data.specialties,
        "certifications": data.certifications,
        "bio": data.bio,
        "hourly_rate": data.hourly_rate,
    }})
    return {"status": "updated"}


# ── Pro Beneficiaries (reuses guardian logic) ──

@router.get("/pro/beneficiaries")
async def get_pro_beneficiaries(user=Depends(get_current_user)):
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    result = []
    for bid in cu.get('beneficiaries', []):
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            latest = await db.device_readings.find_one(
                {"user_id": bid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
            )
            b['latest_vitals'] = latest['data'] if latest else None
            # Count active programs
            prog_count = await db.pro_programs.count_documents({
                "professional_id": user['id'], "beneficiary_id": bid, "status": "active"
            })
            b['active_programs'] = prog_count
            result.append(b)
    return result


# ── Programs CRUD ──

@router.get("/pro/programs")
async def list_programs(user=Depends(get_current_user)):
    require_pro(user)
    programs = await db.pro_programs.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return programs

@router.post("/pro/programs/template")
async def create_template_program(data: ProgramCreate, user=Depends(get_current_user)):
    """Create a template program in the library (not assigned to any beneficiary)"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    program = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": cu.get('name', ''),
        "professional_type": cu.get('professional_type', 'coach'),
        "beneficiary_id": "__template__",
        "beneficiary_name": "Bibliotheque",
        "title": data.title,
        "description": data.description,
        "frequency": data.frequency,
        "duration_weeks": data.duration_weeks,
        "category": data.category,
        "status": "active",
        "sessions": [],
        "is_template": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_programs.insert_one(program)
    program.pop('_id', None)
    return program



@router.get("/pro/programs/{beneficiary_id}")
async def list_programs_for_beneficiary(beneficiary_id: str, user=Depends(get_current_user)):
    require_pro(user)
    programs = await db.pro_programs.find(
        {"professional_id": user['id'], "beneficiary_id": beneficiary_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return programs

@router.post("/pro/programs/{beneficiary_id}")
async def create_program(beneficiary_id: str, data: ProgramCreate, user=Depends(get_current_user)):
    require_pro(user)
    # Verify beneficiary is linked
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0, "password_hash": 0})
    program = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": cu.get('name', ''),
        "professional_type": cu.get('professional_type', 'coach'),
        "beneficiary_id": beneficiary_id,
        "beneficiary_name": ben.get('name', '') if ben else '',
        "title": data.title,
        "description": data.description,
        "frequency": data.frequency,
        "duration_weeks": data.duration_weeks,
        "category": data.category,
        "status": "active",
        "sessions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_programs.insert_one(program)
    program.pop('_id', None)
    return program

@router.post("/pro/programs/duplicate/{program_id}/{beneficiary_id}")
async def duplicate_program(program_id: str, beneficiary_id: str, user=Depends(get_current_user)):
    """Duplicate an existing program and assign it to a different beneficiary"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    src = await db.pro_programs.find_one({"id": program_id, "professional_id": user['id']}, {"_id": 0})
    if not src:
        raise HTTPException(status_code=404, detail="Programme source non trouve")
    ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0, "name": 1})
    now = datetime.now(timezone.utc).isoformat()
    new_prog = {
        **src,
        "id": str(uuid.uuid4()),
        "beneficiary_id": beneficiary_id,
        "beneficiary_name": ben.get('name', '') if ben else '',
        "status": "active",
        "sessions": [
            {**s, "id": str(uuid.uuid4()), "completed": False, "completed_at": None}
            for s in src.get('sessions', [])
        ],
        "created_at": now,
        "updated_at": now,
        "duplicated_from": program_id,
    }
    await db.pro_programs.insert_one(new_prog)
    new_prog.pop('_id', None)
    return new_prog


@router.get("/pro/programs/detail/{program_id}")
async def get_pro_program_detail(program_id: str, user=Depends(get_current_user)):
    """Get full details of a single pro program"""
    require_pro(user)
    prog = await db.pro_programs.find_one(
        {"id": program_id, "professional_id": user['id']}, {"_id": 0}
    )
    if not prog:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    return prog


@router.get("/pro/all-programs")
async def get_all_pro_programs(user=Depends(get_current_user)):
    """Get ALL programs created by this professional (for template reuse)"""
    require_pro(user)
    programs = await db.pro_programs.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return programs


@router.put("/pro/programs/edit/{program_id}")
async def update_program(program_id: str, data: ProgramCreate, user=Depends(get_current_user)):
    require_pro(user)
    prog = await db.pro_programs.find_one({"id": program_id, "professional_id": user['id']})
    if not prog:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    await db.pro_programs.update_one({"id": program_id}, {"$set": {
        "title": data.title, "description": data.description,
        "frequency": data.frequency, "duration_weeks": data.duration_weeks,
        "category": data.category, "updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {"status": "updated"}

@router.delete("/pro/programs/edit/{program_id}")
async def delete_program(program_id: str, user=Depends(get_current_user)):
    require_pro(user)
    result = await db.pro_programs.delete_one({"id": program_id, "professional_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    return {"status": "deleted"}


# ── Sessions CRUD ──

@router.post("/pro/programs/{program_id}/sessions")
async def add_session(program_id: str, data: SessionCreate, user=Depends(get_current_user)):
    require_pro(user)
    prog = await db.pro_programs.find_one({"id": program_id, "professional_id": user['id']})
    if not prog:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    session = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "image": data.image,
        "video_url": data.video_url,
        "media_url": data.media_url,
        "media_type": data.media_type,
        "duration_min": data.duration_min,
        "repetitions": data.repetitions,
        "sets": data.sets,
        "rest_sec": data.rest_sec,
        "rest_seconds": data.rest_seconds,
        "steps": data.steps,
        "difficulty": data.difficulty,
        "muscle_group": data.muscle_group,
        "equipment": data.equipment,
        "notes": data.notes,
        "from_template_id": data.from_template_id,
        "completions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_programs.update_one(
        {"id": program_id},
        {"$push": {"sessions": session}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return session

@router.put("/pro/sessions/{program_id}/{session_id}")
async def update_session(program_id: str, session_id: str, data: SessionCreate, user=Depends(get_current_user)):
    require_pro(user)
    prog = await db.pro_programs.find_one({"id": program_id, "professional_id": user['id']})
    if not prog:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    sessions = prog.get('sessions', [])
    for s in sessions:
        if s['id'] == session_id:
            s['title'] = data.title
            s['description'] = data.description
            s['media_url'] = data.media_url
            s['media_type'] = data.media_type
            s['duration_min'] = data.duration_min
            s['repetitions'] = data.repetitions
            s['sets'] = data.sets
            s['rest_sec'] = data.rest_sec
            s['notes'] = data.notes
            break
    await db.pro_programs.update_one({"id": program_id}, {"$set": {"sessions": sessions, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "updated"}

@router.delete("/pro/sessions/{program_id}/{session_id}")
async def delete_session(program_id: str, session_id: str, user=Depends(get_current_user)):
    require_pro(user)
    await db.pro_programs.update_one(
        {"id": program_id, "professional_id": user['id']},
        {"$pull": {"sessions": {"id": session_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "deleted"}


# ── Session Completions (by beneficiary) ──

@router.post("/pro/sessions/{program_id}/{session_id}/complete")
async def complete_session(program_id: str, session_id: str, data: SessionCompletion, user=Depends(get_current_user)):
    """Beneficiary marks a session as done/partial/skipped"""
    prog = await db.pro_programs.find_one({"id": program_id, "beneficiary_id": user['id']})
    if not prog:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    completion = {
        "id": str(uuid.uuid4()),
        "date": datetime.now(timezone.utc).isoformat(),
        "status": data.status,
        "pain_level": data.pain_level,
        "patient_notes": data.patient_notes,
    }
    await db.pro_programs.update_one(
        {"id": program_id, "sessions.id": session_id},
        {"$push": {"sessions.$.completions": completion}}
    )
    return completion


# ── Beneficiary view: my prescribed programs ──

@router.get("/pro/my-programs")
async def get_my_programs(user=Depends(get_current_user)):
    """Beneficiary gets their prescribed programs with sessions"""
    programs = await db.pro_programs.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    # Include professional name for each program
    for prog in programs:
        pro = await db.users.find_one({"id": prog.get('professional_id')}, {"_id": 0, "name": 1})
        prog['professional_name'] = pro.get('name', '') if pro else ''
    return programs


# ── Pro Dashboard Stats ──

@router.get("/pro/dashboard")
async def pro_dashboard(user=Depends(get_current_user)):
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    ben_ids = cu.get('beneficiaries', [])
    total_programs = await db.pro_programs.count_documents({"professional_id": user['id']})
    active_programs = await db.pro_programs.count_documents({"professional_id": user['id'], "status": "active"})
    return {
        "beneficiary_count": len(ben_ids),
        "total_programs": total_programs,
        "active_programs": active_programs,
        "professional_type": cu.get('professional_type', 'coach'),
        "name": cu.get('name', ''),
    }



# ── Pro Reminders (supplements + hydration → beneficiary reminders) ──

class ProReminderCreate(BaseModel):
    reminder_type: str = "medication"  # medication, hydration
    title: str
    time: str = "08:00"
    days: List[str] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]
    notes: str = ""
    dosage: str = ""

@router.post("/pro/reminders/{beneficiary_id}")
async def create_pro_reminder(beneficiary_id: str, data: ProReminderCreate, user=Depends(get_current_user)):
    """Pro creates a reminder (medication/hydration) directly in beneficiary's reminders"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    if data.reminder_type not in ("medication", "hydration"):
        raise HTTPException(status_code=400, detail="Type doit etre medication ou hydration")
    rem = {
        "id": str(uuid.uuid4()),
        "user_id": beneficiary_id,
        "reminder_type": data.reminder_type,
        "title": data.title,
        "time": data.time,
        "days": data.days,
        "notes": data.notes,
        "dosage": data.dosage,
        "active": True,
        "completed": False,
        "created_by_pro": user['id'],
        "pro_name": cu.get('name', ''),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reminders.insert_one(rem)
    rem.pop('_id', None)
    return rem

@router.get("/pro/reminders/{beneficiary_id}")
async def list_pro_reminders(beneficiary_id: str, user=Depends(get_current_user)):
    """Pro lists reminders they created for a beneficiary"""
    require_pro(user)
    rems = await db.reminders.find(
        {"user_id": beneficiary_id, "created_by_pro": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return rems

@router.delete("/pro/reminders/{reminder_id}")
async def delete_pro_reminder(reminder_id: str, user=Depends(get_current_user)):
    """Pro deletes a reminder they created"""
    require_pro(user)
    result = await db.reminders.delete_one({"id": reminder_id, "created_by_pro": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rappel non trouve")
    return {"status": "deleted"}


# ── Reminder Templates ──

class ReminderTemplateCreate(BaseModel):
    reminder_type: str = "medication"
    title: str
    time: str = "08:00"
    dosage: str = ""
    notes: str = ""

@router.post("/pro/reminder-templates")
async def create_reminder_template(data: ReminderTemplateCreate, user=Depends(get_current_user)):
    """Create a reminder template in the library"""
    require_pro(user)
    tpl = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "reminder_type": data.reminder_type,
        "title": data.title,
        "time": data.time,
        "dosage": data.dosage,
        "notes": data.notes,
        "is_template": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_reminder_templates.insert_one(tpl)
    tpl.pop('_id', None)
    return tpl

@router.get("/pro/reminder-templates")
async def list_reminder_templates(user=Depends(get_current_user)):
    """List all reminder templates for this pro"""
    require_pro(user)
    return await db.pro_reminder_templates.find({"professional_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

@router.delete("/pro/reminder-templates/{template_id}")
async def delete_reminder_template(template_id: str, user=Depends(get_current_user)):
    """Delete a reminder template"""
    require_pro(user)
    result = await db.pro_reminder_templates.delete_one({"id": template_id, "professional_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Complement non trouve")
    return {"status": "deleted"}

@router.put("/pro/reminder-templates/{template_id}")
async def update_reminder_template(template_id: str, data: dict, user=Depends(get_current_user)):
    """Update a reminder template."""
    require_pro(user)
    update = {}
    for k in ["reminder_type", "title", "time", "dosage", "notes"]:
        if k in data:
            update[k] = data[k]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pro_reminder_templates.update_one({"id": template_id, "professional_id": user['id']}, {"$set": update})
    doc = await db.pro_reminder_templates.find_one({"id": template_id}, {"_id": 0})
    return doc




# ── Pro Meals Management ──

class ProMealCreate(BaseModel):
    meal_type: str = "dejeuner"
    items: List[str] = []
    calories: int = 0
    proteins: int = 0
    notes: str = ""

class MealTemplateCreate(BaseModel):
    meal_type: str = "dejeuner"
    title: str = ""
    image: str = ""
    ingredients: List[dict] = []
    steps: List[str] = []
    calories: int = 0
    proteins: int = 0
    glucides: int = 0
    lipides: int = 0
    notes: str = ""
    items: List[str] = []

@router.post("/pro/meal-templates")
async def create_meal_template(data: MealTemplateCreate, user=Depends(get_current_user)):
    """Create a meal template in the library"""
    require_pro(user)
    tpl = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "meal_type": data.meal_type,
        "title": data.title,
        "image": data.image,
        "ingredients": data.ingredients,
        "steps": data.steps,
        "items": data.items,
        "calories": data.calories,
        "proteins": data.proteins,
        "glucides": data.glucides,
        "lipides": data.lipides,
        "notes": data.notes,
        "is_template": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_meal_templates.insert_one(tpl)
    tpl.pop('_id', None)
    return tpl

@router.get("/pro/meal-templates")
async def list_meal_templates(user=Depends(get_current_user)):
    """List all meal templates for this pro"""
    require_pro(user)
    return await db.pro_meal_templates.find({"professional_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)

@router.delete("/pro/meal-templates/{template_id}")
async def delete_meal_template(template_id: str, user=Depends(get_current_user)):
    """Delete a meal template"""
    require_pro(user)
    result = await db.pro_meal_templates.delete_one({"id": template_id, "professional_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repas non trouve")
    return {"status": "deleted"}

@router.put("/pro/meal-templates/{template_id}")
async def update_meal_template(template_id: str, data: dict, user=Depends(get_current_user)):
    """Update a meal template."""
    require_pro(user)
    update = {}
    for k in ["meal_type", "title", "image", "ingredients", "steps", "items", "calories", "proteins", "glucides", "lipides", "notes"]:
        if k in data:
            update[k] = data[k]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pro_meal_templates.update_one({"id": template_id, "professional_id": user['id']}, {"$set": update})
    doc = await db.pro_meal_templates.find_one({"id": template_id}, {"_id": 0})
    return doc



@router.get("/pro/meals/{beneficiary_id}")
async def get_beneficiary_meals(beneficiary_id: str, user=Depends(get_current_user)):
    """Pro gets the beneficiary's current meal plan (from minceur cache + pro overrides)"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Check for pro meal overrides first
    pro_meals = await db.pro_meals.find_one(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "date": today_str}, {"_id": 0}
    )
    if pro_meals and pro_meals.get('meals'):
        return {"meals": pro_meals['meals'], "source": "pro"}
    # Fallback to minceur cache
    cached = await db.minceur_daily_cache.find_one(
        {"user_id": beneficiary_id, "date": today_str}, {"_id": 0}
    )
    if cached and cached.get('recommendations', {}).get('meals'):
        return {"meals": cached['recommendations']['meals'], "source": "minceur"}
    return {"meals": [], "source": "none"}

@router.post("/pro/meals/{beneficiary_id}")
async def add_pro_meal(beneficiary_id: str, data: ProMealCreate, user=Depends(get_current_user)):
    """Pro adds a meal to the beneficiary's plan for today"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    meal = {
        "meal_type": data.meal_type,
        "items": data.items,
        "calories": data.calories,
        "proteins": data.proteins,
        "notes": data.notes,
        "created_by_pro": user['id'],
        "pro_name": cu.get('name', ''),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Get or create pro_meals doc for today
    existing = await db.pro_meals.find_one(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "date": today_str}
    )
    if existing:
        await db.pro_meals.update_one(
            {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "date": today_str},
            {"$push": {"meals": meal}}
        )
    else:
        cached = await db.minceur_daily_cache.find_one(
            {"user_id": beneficiary_id, "date": today_str}, {"_id": 0}
        )
        base_meals = cached.get('recommendations', {}).get('meals', []) if cached else []
        base_meals.append(meal)
        await db.pro_meals.insert_one({
            "beneficiary_id": beneficiary_id,
            "professional_id": user['id'],
            "date": today_str,
            "meals": base_meals,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"status": "added", "meal": meal}

@router.delete("/pro/meals/{beneficiary_id}/{meal_index}")
async def delete_pro_meal(beneficiary_id: str, meal_index: int, user=Depends(get_current_user)):
    """Pro deletes a meal from the beneficiary's plan (by index)"""
    require_pro(user)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.pro_meals.find_one(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "date": today_str}
    )
    if not existing:
        # Create override from minceur cache first
        cached = await db.minceur_daily_cache.find_one(
            {"user_id": beneficiary_id, "date": today_str}, {"_id": 0}
        )
        base_meals = cached.get('recommendations', {}).get('meals', []) if cached else []
        if meal_index < 0 or meal_index >= len(base_meals):
            raise HTTPException(status_code=404, detail="Repas non trouve")
        base_meals.pop(meal_index)
        await db.pro_meals.insert_one({
            "beneficiary_id": beneficiary_id,
            "professional_id": user['id'],
            "date": today_str,
            "meals": base_meals,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        meals = existing.get('meals', [])
        if meal_index < 0 or meal_index >= len(meals):
            raise HTTPException(status_code=404, detail="Repas non trouve")
        meals.pop(meal_index)
        await db.pro_meals.update_one(
            {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "date": today_str},
            {"$set": {"meals": meals}}
        )
    return {"status": "deleted"}


# ── Assigned Reminders (like exercises) ──

class AssignReminderCreate(BaseModel):
    reminder_template_id: str
    beneficiary_id: str
    days: List[str] = []
    time: str = "08:00"
    dosage: str = ""
    notes: str = ""

@router.post("/pro/assign-reminder")
async def assign_reminder(data: AssignReminderCreate, user=Depends(get_current_user)):
    """Assign a reminder template to a beneficiary with custom days/time/dosage"""
    require_pro(user)
    tpl = await db.pro_reminder_templates.find_one(
        {"id": data.reminder_template_id, "professional_id": user['id']}, {"_id": 0}
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Modele de rappel non trouve")
    assigned = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": user.get('name', ''),
        "beneficiary_id": data.beneficiary_id,
        "reminder_template_id": data.reminder_template_id,
        "title": tpl.get("title", ""),
        "reminder_type": tpl.get("reminder_type", "medication"),
        "image": tpl.get("image", ""),
        "days": data.days,
        "time": data.time,
        "dosage": data.dosage or tpl.get("dosage", ""),
        "notes": data.notes or tpl.get("notes", ""),
        "status": "active",
        "completions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_assigned_reminders.insert_one(assigned)
    assigned.pop('_id', None)
    # Notify beneficiary
    try:
        from routes.notification_routes import create_notification
        pro_name = user.get('name', 'Votre coach')
        rtype = "Rappel hydratation" if tpl.get("reminder_type") == "hydration" else "Nouveau complement"
        await create_notification(
            user_id=data.beneficiary_id,
            notif_type="reminder",
            title=rtype,
            body=f"{pro_name} vous a prescrit : {tpl.get('title', '')}",
            icon="ri-capsule-line" if tpl.get("reminder_type") != "hydration" else "ri-drop-line",
            color="#F59E0B" if tpl.get("reminder_type") != "hydration" else "#38BDF8",
            data={"assignment_id": assigned["id"], "type": "reminder"},
        )
    except Exception:
        pass
    return assigned

@router.get("/pro/assigned-reminders/{beneficiary_id}")
async def list_assigned_reminders(beneficiary_id: str, user=Depends(get_current_user)):
    """List assigned reminders for a beneficiary"""
    return await db.pro_assigned_reminders.find(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "status": "active"}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

@router.put("/pro/assigned-reminders/{assignment_id}")
async def update_assigned_reminder(assignment_id: str, user=Depends(get_current_user), data: dict = {}):
    require_pro(user)
    update = {}
    for k in ["days", "time", "dosage"]:
        if k in data:
            update[k] = data[k]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pro_assigned_reminders.update_one({"id": assignment_id, "professional_id": user['id']}, {"$set": update})
    updated = await db.pro_assigned_reminders.find_one({"id": assignment_id}, {"_id": 0})
    return updated

@router.delete("/pro/assigned-reminders/{assignment_id}")
async def delete_assigned_reminder(assignment_id: str, user=Depends(get_current_user)):
    require_pro(user)
    result = await db.pro_assigned_reminders.delete_one({"id": assignment_id, "professional_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rappel assigne non trouve")
    return {"status": "deleted"}


# ── Assigned Meals (like exercises) ──

class AssignMealCreate(BaseModel):
    meal_template_id: str
    beneficiary_id: str
    days: List[str] = []
    meal_type: str = "dejeuner"

@router.post("/pro/assign-meal")
async def assign_meal(data: AssignMealCreate, user=Depends(get_current_user)):
    """Assign a meal template to a beneficiary with custom days"""
    require_pro(user)
    tpl = await db.pro_meal_templates.find_one(
        {"id": data.meal_template_id, "professional_id": user['id']}, {"_id": 0}
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Modele de repas non trouve")
    assigned = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "beneficiary_id": data.beneficiary_id,
        "meal_template_id": data.meal_template_id,
        "title": tpl.get("title", ""),
        "meal_type": data.meal_type,
        "image": tpl.get("image", ""),
        "items": tpl.get("items", []),
        "ingredients": tpl.get("ingredients", []),
        "steps": tpl.get("steps", []),
        "calories": tpl.get("calories", 0),
        "proteins": tpl.get("proteins", 0),
        "glucides": tpl.get("glucides", 0),
        "lipides": tpl.get("lipides", 0),
        "notes": tpl.get("notes", ""),
        "days": data.days,
        "status": "active",
        "completions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_assigned_meals.insert_one(assigned)
    assigned.pop('_id', None)
    # Notify beneficiary
    try:
        from routes.notification_routes import create_notification
        pro_name = user.get('name', 'Votre coach')
        await create_notification(
            user_id=data.beneficiary_id,
            notif_type="meal",
            title="Nouveau repas assigne",
            body=f"{pro_name} vous a prescrit : {tpl.get('title', '')}",
            icon="ri-restaurant-line",
            color="#10B981",
            data={"assignment_id": assigned["id"], "type": "meal"},
        )
    except Exception:
        pass
    return assigned

@router.get("/pro/assigned-meals/{beneficiary_id}")
async def list_assigned_meals(beneficiary_id: str, user=Depends(get_current_user)):
    """List assigned meals for a beneficiary"""
    return await db.pro_assigned_meals.find(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "status": "active"}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

@router.put("/pro/assigned-meals/{assignment_id}")
async def update_assigned_meal(assignment_id: str, data: dict, user=Depends(get_current_user)):
    require_pro(user)
    update = {}
    for k in ["days", "meal_type"]:
        if k in data:
            update[k] = data[k]
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pro_assigned_meals.update_one({"id": assignment_id, "professional_id": user['id']}, {"$set": update})
    updated = await db.pro_assigned_meals.find_one({"id": assignment_id}, {"_id": 0})
    return updated

@router.delete("/pro/assigned-meals/{assignment_id}")
async def delete_assigned_meal(assignment_id: str, user=Depends(get_current_user)):
    require_pro(user)
    result = await db.pro_assigned_meals.delete_one({"id": assignment_id, "professional_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repas assigne non trouve")
    return {"status": "deleted"}


# ── Beneficiary today's reminders & meals ──

@router.get("/pro/beneficiary-today-reminders")
async def beneficiary_today_reminders(user=Depends(get_current_user)):
    """Beneficiary gets reminders assigned for today"""
    DAYS_FR_LOCAL = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]
    today_idx = datetime.now(timezone.utc).weekday()
    today_fr = DAYS_FR_LOCAL[today_idx]
    rems = await db.pro_assigned_reminders.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).to_list(100)
    return [r for r in rems if today_fr in r.get("days", [])]

@router.get("/pro/beneficiary-today-meals")
async def beneficiary_today_meals(user=Depends(get_current_user)):
    """Beneficiary gets meals assigned for today"""
    DAYS_FR_LOCAL = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"]
    today_idx = datetime.now(timezone.utc).weekday()
    today_fr = DAYS_FR_LOCAL[today_idx]
    meals = await db.pro_assigned_meals.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).to_list(100)
    return [m for m in meals if today_fr in m.get("days", [])]


# ── Seed default templates ──

@router.post("/pro/seed-templates")
async def seed_templates(user=Depends(get_current_user)):
    """Seed the library with default reminder, meal and exercise templates for this pro"""
    require_pro(user)
    pid = user['id']
    now = datetime.now(timezone.utc).isoformat()

    # Check if already seeded
    existing_rem = await db.pro_reminder_templates.count_documents({"professional_id": pid})
    existing_meal = await db.pro_meal_templates.count_documents({"professional_id": pid})
    existing_ex = await db.pro_exercise_templates.count_documents({"professional_id": pid})

    added_rem, added_meal, added_ex = 0, 0, 0

    # ── Seed exercise templates ──
    if existing_ex == 0:
        ex_templates = [
            {"title": "Squat", "description": "Flexion des genoux, dos droit, descendre jusqu'a 90 degres", "category": "force", "difficulty": "moyen", "muscle_group": "Quadriceps, Fessiers", "icon": "ri-body-scan-line", "sets": 4, "repetitions": 12, "rest_seconds": 90, "equipment": "Barre", "steps": ["Placer la barre sur les trapezes", "Pieds largeur d'epaules", "Descendre en poussant les genoux vers l'exterieur", "Remonter en poussant sur les talons"]},
            {"title": "Developpe couche", "description": "Exercice de base pour les pectoraux", "category": "force", "difficulty": "moyen", "muscle_group": "Pectoraux, Triceps", "icon": "ri-arrow-up-down-line", "sets": 4, "repetitions": 10, "rest_seconds": 90, "equipment": "Banc, Barre", "steps": ["S'allonger sur le banc", "Saisir la barre largeur epaules +", "Descendre la barre au niveau de la poitrine", "Pousser vers le haut"]},
            {"title": "Soulevé de terre", "description": "Exercice polyarticulaire complet pour le dos et les jambes", "category": "force", "difficulty": "difficile", "muscle_group": "Dorsaux, Ischio-jambiers, Fessiers", "icon": "ri-arrow-up-line", "sets": 4, "repetitions": 8, "rest_seconds": 120, "equipment": "Barre", "steps": ["Pieds largeur de hanches", "Saisir la barre en pronation", "Dos plat, pousser le sol", "Extension complete des hanches"]},
            {"title": "Tractions", "description": "Exercice au poids de corps pour le dos", "category": "force", "difficulty": "difficile", "muscle_group": "Dorsaux, Biceps", "icon": "ri-drag-move-line", "sets": 4, "repetitions": 8, "rest_seconds": 90, "equipment": "Barre de traction", "steps": ["Saisir la barre en pronation", "Tirer le menton au-dessus de la barre", "Descendre de maniere controlee"]},
            {"title": "Pompes", "description": "Exercice de base au poids du corps", "category": "force", "difficulty": "facile", "muscle_group": "Pectoraux, Triceps, Epaules", "icon": "ri-arrow-down-line", "sets": 3, "repetitions": 15, "rest_seconds": 60, "equipment": "Aucun", "steps": ["Position planche, mains largeur epaules", "Descendre la poitrine vers le sol", "Pousser vers le haut en gardant le corps gaine"]},
            {"title": "Fentes marchees", "description": "Travail unilateral des jambes", "category": "force", "difficulty": "moyen", "muscle_group": "Quadriceps, Fessiers", "icon": "ri-walk-line", "sets": 3, "repetitions": 12, "rest_seconds": 60, "equipment": "Halteres", "steps": ["Debout, halteres en main", "Avancer un pied et flechir les deux genoux a 90 degres", "Pousser sur le talon avant", "Enchainer avec l'autre jambe"]},
            {"title": "Rowing barre", "description": "Tirage horizontal pour le dos", "category": "force", "difficulty": "moyen", "muscle_group": "Dorsaux, Trapeze", "icon": "ri-arrow-left-right-line", "sets": 4, "repetitions": 10, "rest_seconds": 90, "equipment": "Barre", "steps": ["Penche a 45 degres, dos plat", "Tirer la barre vers le nombril", "Serrer les omoplates en haut", "Redescendre lentement"]},
            {"title": "Presse a cuisses", "description": "Exercice guide pour les quadriceps", "category": "force", "difficulty": "facile", "muscle_group": "Quadriceps, Fessiers", "icon": "ri-corner-down-right-line", "sets": 4, "repetitions": 12, "rest_seconds": 90, "equipment": "Machine guidee", "steps": ["S'asseoir dans la machine", "Pieds largeur epaules sur la plateforme", "Descendre en controlant", "Remonter sans verrouiller les genoux"]},
            {"title": "Curl biceps", "description": "Isolation des biceps", "category": "force", "difficulty": "facile", "muscle_group": "Biceps", "icon": "ri-contrast-line", "sets": 3, "repetitions": 12, "rest_seconds": 60, "equipment": "Halteres", "steps": ["Debout, halteres en main, bras le long du corps", "Flechir les coudes en montant les halteres", "Serrer en haut", "Redescendre lentement"]},
            {"title": "Extensions triceps", "description": "Isolation des triceps a la poulie", "category": "force", "difficulty": "facile", "muscle_group": "Triceps", "icon": "ri-arrow-down-s-line", "sets": 3, "repetitions": 12, "rest_seconds": 60, "equipment": "Poulie", "steps": ["Debout face a la poulie", "Saisir la corde ou la barre", "Etendre les bras vers le bas", "Contracter en bas, remonter lentement"]},
            {"title": "Developpe militaire", "description": "Exercice d'epaules debout", "category": "force", "difficulty": "moyen", "muscle_group": "Epaules", "icon": "ri-arrow-up-double-line", "sets": 4, "repetitions": 10, "rest_seconds": 90, "equipment": "Barre", "steps": ["Debout, barre au niveau des clavicules", "Pousser la barre au-dessus de la tete", "Verrouiller en haut", "Redescendre lentement"]},
            {"title": "Planche gainage", "description": "Exercice isometrique de gainage", "category": "mobilite", "difficulty": "facile", "muscle_group": "Abdominaux, Obliques", "icon": "ri-layout-horizontal-line", "sets": 3, "repetitions": 1, "duration_min": 1, "rest_seconds": 60, "equipment": "Tapis", "steps": ["Position sur les avant-bras et les orteils", "Corps aligne de la tete aux talons", "Contracter les abdominaux", "Maintenir la position"]},
            {"title": "Crunchs", "description": "Exercice classique pour les abdos", "category": "force", "difficulty": "facile", "muscle_group": "Abdominaux", "icon": "ri-flashlight-line", "sets": 3, "repetitions": 20, "rest_seconds": 45, "equipment": "Tapis", "steps": ["Allonge sur le dos, genoux flechis", "Mains derriere la tete", "Monter les epaules en contractant les abdos", "Redescendre sans relacher"]},
            {"title": "Hip thrust", "description": "Exercice cible pour les fessiers", "category": "force", "difficulty": "moyen", "muscle_group": "Fessiers", "icon": "ri-arrow-up-circle-line", "sets": 4, "repetitions": 12, "rest_seconds": 90, "equipment": "Banc, Barre", "steps": ["Dos appuye contre le banc", "Barre sur les hanches", "Pousser les hanches vers le plafond", "Serrer les fessiers en haut"]},
            {"title": "Mollets debout", "description": "Travail des mollets", "category": "force", "difficulty": "facile", "muscle_group": "Mollets", "icon": "ri-footprint-line", "sets": 4, "repetitions": 15, "rest_seconds": 45, "equipment": "Machine guidee", "steps": ["Debout sur la machine", "Monter sur la pointe des pieds", "Redescendre lentement en etirant"]},
            {"title": "Course a pied", "description": "Cardio endurance", "category": "cardio", "difficulty": "moyen", "muscle_group": "Cardio, Full Body", "icon": "ri-run-line", "sets": 1, "repetitions": 1, "duration_min": 30, "rest_seconds": 0, "equipment": "Aucun", "steps": ["Echauffement 5 min marche rapide", "Courir a allure moderee 20 min", "Retour au calme 5 min"]},
            {"title": "Velo / Spinning", "description": "Cardio faible impact", "category": "cardio", "difficulty": "moyen", "muscle_group": "Cardio, Quadriceps", "icon": "ri-riding-line", "sets": 1, "repetitions": 1, "duration_min": 30, "rest_seconds": 0, "equipment": "Velo", "steps": ["Echauffement 5 min resistance faible", "Intervalles: 1 min haute resistance / 2 min basse", "Repeter 8 cycles", "Retour au calme"]},
            {"title": "Corde a sauter", "description": "Cardio haute intensite", "category": "cardio", "difficulty": "moyen", "muscle_group": "Cardio, Mollets", "icon": "ri-skip-forward-line", "sets": 5, "repetitions": 1, "duration_min": 2, "rest_seconds": 60, "equipment": "Corde a sauter", "steps": ["2 min de sauts reguliers", "1 min de repos", "Repeter 5 fois"]},
            {"title": "Burpees", "description": "Exercice full body haute intensite", "category": "cardio", "difficulty": "difficile", "muscle_group": "Full Body", "icon": "ri-pulse-line", "sets": 4, "repetitions": 10, "rest_seconds": 60, "equipment": "Aucun", "steps": ["Position debout", "Descendre en squat, mains au sol", "Sauter les pieds en arriere (planche)", "Pompe", "Sauter les pieds vers les mains", "Sauter en l'air bras tendus"]},
            {"title": "Etirements complets", "description": "Seance d'etirements pour la mobilite", "category": "souplesse", "difficulty": "facile", "muscle_group": "Full Body, Mobilite", "icon": "ri-mind-map", "sets": 1, "repetitions": 1, "duration_min": 15, "rest_seconds": 0, "equipment": "Tapis", "steps": ["Etirement quadriceps 30s chaque cote", "Etirement ischio-jambiers 30s", "Etirement pectoraux 30s", "Etirement dorsaux 30s", "Etirement epaules 30s chaque cote", "Position du pigeon 30s chaque cote"]},
        ]
        for ex in ex_templates:
            ex["id"] = str(uuid.uuid4())
            ex["professional_id"] = pid
            ex["is_template"] = True
            ex["created_at"] = now
            ex["image"] = ""
            ex["video_url"] = ""
            ex["notes"] = ""
        await db.pro_exercise_templates.insert_many(ex_templates)
        added_ex = len(ex_templates)

    REM_IMG_MEDICATION = "https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/y3xje768_traitement.png"
    REM_IMG_HYDRATION = "https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png"

    if existing_rem == 0:
        rem_templates = [
            {"title": "Creatine monohydrate", "reminder_type": "medication", "dosage": "5g/jour", "time": "08:00", "notes": "Prendre avec un verre d'eau, tous les jours", "image": REM_IMG_MEDICATION},
            {"title": "Whey Protein", "reminder_type": "medication", "dosage": "30g post-training", "time": "18:00", "notes": "Melanger avec 300ml d'eau ou lait", "image": REM_IMG_MEDICATION},
            {"title": "BCAA", "reminder_type": "medication", "dosage": "10g intra-training", "time": "17:30", "notes": "Diluer dans 500ml d'eau pendant l'entrainement", "image": REM_IMG_MEDICATION},
            {"title": "Omega 3", "reminder_type": "medication", "dosage": "2 capsules/jour", "time": "12:00", "notes": "Prendre pendant le repas", "image": REM_IMG_MEDICATION},
            {"title": "Vitamine D3", "reminder_type": "medication", "dosage": "1000 UI/jour", "time": "08:00", "notes": "Prendre le matin avec le petit-dejeuner", "image": REM_IMG_MEDICATION},
            {"title": "Magnesium", "reminder_type": "medication", "dosage": "300mg/jour", "time": "21:00", "notes": "Prendre le soir pour favoriser le sommeil", "image": REM_IMG_MEDICATION},
            {"title": "Zinc", "reminder_type": "medication", "dosage": "15mg/jour", "time": "20:00", "notes": "Prendre loin des repas riches en calcium", "image": REM_IMG_MEDICATION},
            {"title": "Multivitamines", "reminder_type": "medication", "dosage": "1 comprime/jour", "time": "08:00", "notes": "Prendre avec le petit-dejeuner", "image": REM_IMG_MEDICATION},
            {"title": "Collagene", "reminder_type": "medication", "dosage": "10g/jour", "time": "07:30", "notes": "Melanger dans un jus ou cafe. Bon pour les articulations", "image": REM_IMG_MEDICATION},
            {"title": "Glutamine", "reminder_type": "medication", "dosage": "5g post-training", "time": "18:30", "notes": "Aide a la recuperation musculaire", "image": REM_IMG_MEDICATION},
            {"title": "Boire 2L d'eau", "reminder_type": "hydration", "dosage": "2 litres", "time": "08:00", "notes": "Repartir tout au long de la journee", "image": REM_IMG_HYDRATION},
            {"title": "Pre-workout", "reminder_type": "medication", "dosage": "1 dose", "time": "16:30", "notes": "30 min avant l'entrainement. Ne pas depasser 1 dose", "image": REM_IMG_MEDICATION},
        ]
        for r in rem_templates:
            r["id"] = str(uuid.uuid4())
            r["professional_id"] = pid
            r["is_template"] = True
            r["created_at"] = now
        await db.pro_reminder_templates.insert_many(rem_templates)
        added_rem = len(rem_templates)

    MEAL_IMG_BREAKFAST = "https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png"
    MEAL_IMG_LUNCH = "https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png"
    MEAL_IMG_SNACK = "https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png"
    MEAL_IMG_DINNER = "https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png"

    if existing_meal == 0:
        meal_templates = [
            {
                "title": "Petit-dej proteines", "meal_type": "petit_dejeuner",
                "image": MEAL_IMG_BREAKFAST,
                "items": ["3 oeufs brouilles", "Flocons d'avoine 60g", "Banane", "Miel"],
                "ingredients": [
                    {"name": "Oeufs", "quantity": "3", "unit": "pc"},
                    {"name": "Flocons d'avoine", "quantity": "60", "unit": "g"},
                    {"name": "Banane", "quantity": "1", "unit": "pc"},
                    {"name": "Miel", "quantity": "15", "unit": "g"},
                ],
                "steps": [
                    "Battre les oeufs dans un bol avec une pincee de sel",
                    "Cuire les oeufs brouilles a feu doux en remuant doucement",
                    "Preparer les flocons d'avoine avec de l'eau chaude ou du lait",
                    "Couper la banane en rondelles et disposer sur les flocons",
                    "Ajouter un filet de miel et servir avec les oeufs",
                ],
                "calories": 550, "proteins": 35, "glucides": 65, "lipides": 18,
                "notes": "Ideal pour un debut de journee energetique",
            },
            {
                "title": "Overnight oats", "meal_type": "petit_dejeuner",
                "image": MEAL_IMG_BREAKFAST,
                "items": ["Flocons d'avoine 60g", "Lait d'amande 200ml", "Graines de chia 15g", "Myrtilles", "Beurre de cacahuete 15g"],
                "ingredients": [
                    {"name": "Flocons d'avoine", "quantity": "60", "unit": "g"},
                    {"name": "Lait d'amande", "quantity": "200", "unit": "ml"},
                    {"name": "Graines de chia", "quantity": "15", "unit": "g"},
                    {"name": "Myrtilles", "quantity": "80", "unit": "g"},
                    {"name": "Beurre de cacahuete", "quantity": "15", "unit": "g"},
                ],
                "steps": [
                    "Melanger les flocons d'avoine, le lait d'amande et les graines de chia dans un bocal",
                    "Bien remuer pour homogeneiser le melange",
                    "Couvrir et placer au refrigerateur toute la nuit (8h minimum)",
                    "Le matin, ajouter les myrtilles et le beurre de cacahuete",
                    "Deguster froid directement du bocal",
                ],
                "calories": 480, "proteins": 18, "glucides": 58, "lipides": 20,
                "notes": "Preparer la veille au frigo",
            },
            {
                "title": "Bowl acai", "meal_type": "petit_dejeuner",
                "image": MEAL_IMG_BREAKFAST,
                "items": ["Puree d'acai 100g", "Banane", "Granola 40g", "Fruits rouges", "Noix de coco rapee"],
                "ingredients": [
                    {"name": "Puree d'acai surgelee", "quantity": "100", "unit": "g"},
                    {"name": "Banane", "quantity": "1", "unit": "pc"},
                    {"name": "Granola", "quantity": "40", "unit": "g"},
                    {"name": "Fruits rouges", "quantity": "60", "unit": "g"},
                    {"name": "Noix de coco rapee", "quantity": "10", "unit": "g"},
                ],
                "steps": [
                    "Mixer la puree d'acai avec la moitie de la banane et un peu de lait",
                    "Verser la preparation epaisse dans un bol",
                    "Couper le reste de la banane en rondelles",
                    "Disposer le granola, les fruits rouges et la banane sur le dessus",
                    "Saupoudrer de noix de coco rapee et servir immediatement",
                ],
                "calories": 420, "proteins": 12, "glucides": 62, "lipides": 14,
                "notes": "Riche en antioxydants",
            },
            {
                "title": "Poulet riz legumes", "meal_type": "dejeuner",
                "image": MEAL_IMG_LUNCH,
                "items": ["Blanc de poulet 200g", "Riz basmati 80g", "Brocolis 150g", "Huile d'olive 10ml"],
                "ingredients": [
                    {"name": "Blanc de poulet", "quantity": "200", "unit": "g"},
                    {"name": "Riz basmati", "quantity": "80", "unit": "g"},
                    {"name": "Brocolis", "quantity": "150", "unit": "g"},
                    {"name": "Huile d'olive", "quantity": "10", "unit": "ml"},
                    {"name": "Sel, poivre", "quantity": "1", "unit": "pc"},
                ],
                "steps": [
                    "Rincer le riz et le cuire selon les instructions du paquet",
                    "Couper le poulet en morceaux et assaisonner de sel et poivre",
                    "Faire chauffer l'huile d'olive dans une poele a feu vif",
                    "Saisir le poulet 5-6 min de chaque cote jusqu'a coloration doree",
                    "Cuire les brocolis a la vapeur 5-7 min (ils doivent rester croquants)",
                    "Dresser le riz dans une assiette, ajouter le poulet et les brocolis",
                ],
                "calories": 620, "proteins": 48, "glucides": 65, "lipides": 14,
                "notes": "Le classique du sportif",
            },
            {
                "title": "Saumon quinoa", "meal_type": "dejeuner",
                "image": MEAL_IMG_LUNCH,
                "items": ["Pave de saumon 180g", "Quinoa 70g", "Epinards 100g", "Avocat 1/2", "Citron"],
                "ingredients": [
                    {"name": "Pave de saumon", "quantity": "180", "unit": "g"},
                    {"name": "Quinoa", "quantity": "70", "unit": "g"},
                    {"name": "Epinards frais", "quantity": "100", "unit": "g"},
                    {"name": "Avocat", "quantity": "0.5", "unit": "pc"},
                    {"name": "Citron", "quantity": "0.5", "unit": "pc"},
                ],
                "steps": [
                    "Rincer le quinoa et le cuire dans 2 volumes d'eau pendant 12 min",
                    "Assaisonner le saumon de sel, poivre et un filet de citron",
                    "Cuire le saumon a la poele cote peau 4 min, retourner 3 min",
                    "Laver les epinards et les faire tomber rapidement a la poele",
                    "Couper l'avocat en tranches fines",
                    "Dresser le quinoa, ajouter les epinards, le saumon et l'avocat",
                ],
                "calories": 680, "proteins": 42, "glucides": 52, "lipides": 28,
                "notes": "Riche en omega 3",
            },
            {
                "title": "Salade Caesar proteines", "meal_type": "dejeuner",
                "image": MEAL_IMG_LUNCH,
                "items": ["Poulet grille 180g", "Salade romaine", "Parmesan 20g", "Croutons complets", "Sauce Caesar legere"],
                "ingredients": [
                    {"name": "Blanc de poulet", "quantity": "180", "unit": "g"},
                    {"name": "Salade romaine", "quantity": "150", "unit": "g"},
                    {"name": "Parmesan rape", "quantity": "20", "unit": "g"},
                    {"name": "Pain complet (croutons)", "quantity": "30", "unit": "g"},
                    {"name": "Sauce Caesar legere", "quantity": "30", "unit": "ml"},
                ],
                "steps": [
                    "Griller le poulet a la poele avec un filet d'huile d'olive",
                    "Couper le pain complet en des et les faire dorer au four 5 min a 200C",
                    "Laver et essorer la salade romaine, la couper en morceaux",
                    "Emincer le poulet grille en tranches",
                    "Assembler la salade avec le poulet, les croutons et le parmesan",
                    "Napper de sauce Caesar legere et servir",
                ],
                "calories": 520, "proteins": 42, "glucides": 28, "lipides": 22,
                "notes": "Frais et rassasiant",
            },
            {
                "title": "Steak patate douce", "meal_type": "dejeuner",
                "image": MEAL_IMG_LUNCH,
                "items": ["Steak de boeuf 5% 180g", "Patate douce 200g", "Haricots verts 150g", "Beurre 10g"],
                "ingredients": [
                    {"name": "Steak de boeuf 5%", "quantity": "180", "unit": "g"},
                    {"name": "Patate douce", "quantity": "200", "unit": "g"},
                    {"name": "Haricots verts", "quantity": "150", "unit": "g"},
                    {"name": "Beurre", "quantity": "10", "unit": "g"},
                ],
                "steps": [
                    "Prechauffer le four a 200C et eplucher la patate douce",
                    "Couper la patate douce en frites et enfourner 25 min",
                    "Cuire les haricots verts a la vapeur 8-10 min",
                    "Saisir le steak a feu vif 2-3 min de chaque cote selon cuisson souhaitee",
                    "Laisser reposer la viande 2 min avant de servir",
                    "Dresser le steak avec les frites de patate douce et les haricots au beurre",
                ],
                "calories": 640, "proteins": 44, "glucides": 55, "lipides": 20,
                "notes": "Pour les jours d'entrainement intensif",
            },
            {
                "title": "Collation post-training", "meal_type": "collation",
                "image": MEAL_IMG_SNACK,
                "items": ["Whey protein 30g", "Banane", "Beurre de cacahuete 15g"],
                "ingredients": [
                    {"name": "Whey protein", "quantity": "30", "unit": "g"},
                    {"name": "Banane", "quantity": "1", "unit": "pc"},
                    {"name": "Beurre de cacahuete", "quantity": "15", "unit": "g"},
                ],
                "steps": [
                    "Mixer la whey avec 250ml d'eau froide ou de lait",
                    "Couper la banane en rondelles",
                    "Accompagner le shake d'une tartine de beurre de cacahuete ou l'ajouter au shake",
                ],
                "calories": 320, "proteins": 28, "glucides": 32, "lipides": 10,
                "notes": "Dans les 30 min apres l'entrainement",
            },
            {
                "title": "Fromage blanc proteines", "meal_type": "collation",
                "image": MEAL_IMG_SNACK,
                "items": ["Fromage blanc 0% 250g", "Amandes 20g", "Miel 10g"],
                "ingredients": [
                    {"name": "Fromage blanc 0%", "quantity": "250", "unit": "g"},
                    {"name": "Amandes", "quantity": "20", "unit": "g"},
                    {"name": "Miel", "quantity": "10", "unit": "g"},
                ],
                "steps": [
                    "Verser le fromage blanc dans un bol",
                    "Concasser grossierement les amandes",
                    "Ajouter les amandes et le miel sur le fromage blanc",
                    "Melanger legerement et deguster",
                ],
                "calories": 280, "proteins": 24, "glucides": 22, "lipides": 10,
                "notes": "Collation riche en caseine",
            },
            {
                "title": "Poisson blanc legumes", "meal_type": "diner",
                "image": MEAL_IMG_DINNER,
                "items": ["Cabillaud 200g", "Courgettes grillees 200g", "Riz complet 60g", "Herbes de Provence"],
                "ingredients": [
                    {"name": "Filet de cabillaud", "quantity": "200", "unit": "g"},
                    {"name": "Courgettes", "quantity": "200", "unit": "g"},
                    {"name": "Riz complet", "quantity": "60", "unit": "g"},
                    {"name": "Herbes de Provence", "quantity": "1", "unit": "cs"},
                    {"name": "Huile d'olive", "quantity": "5", "unit": "ml"},
                ],
                "steps": [
                    "Cuire le riz complet selon les instructions (environ 20 min)",
                    "Couper les courgettes en rondelles et les griller a la poele avec un filet d'huile",
                    "Assaisonner le cabillaud de sel, poivre et herbes de Provence",
                    "Cuire le poisson a la poele 3-4 min de chaque cote a feu moyen",
                    "Dresser le riz, ajouter les courgettes grillees et le poisson",
                ],
                "calories": 450, "proteins": 40, "glucides": 42, "lipides": 8,
                "notes": "Leger et digestible pour le soir",
            },
            {
                "title": "Omelette du soir", "meal_type": "diner",
                "image": MEAL_IMG_DINNER,
                "items": ["4 oeufs", "Champignons 100g", "Epinards 80g", "Fromage rape 20g"],
                "ingredients": [
                    {"name": "Oeufs", "quantity": "4", "unit": "pc"},
                    {"name": "Champignons", "quantity": "100", "unit": "g"},
                    {"name": "Epinards", "quantity": "80", "unit": "g"},
                    {"name": "Fromage rape", "quantity": "20", "unit": "g"},
                ],
                "steps": [
                    "Emincer les champignons et les faire revenir a la poele 5 min",
                    "Ajouter les epinards et laisser tomber 2 min",
                    "Battre les oeufs dans un bol avec sel et poivre",
                    "Verser les oeufs sur les legumes dans la poele",
                    "Cuire a feu doux 3-4 min, ajouter le fromage rape",
                    "Replier l'omelette et servir",
                ],
                "calories": 420, "proteins": 32, "glucides": 6, "lipides": 28,
                "notes": "Rapide a preparer, riche en proteines",
            },
            {
                "title": "Bowl poke maison", "meal_type": "dejeuner",
                "image": MEAL_IMG_LUNCH,
                "items": ["Riz sushi 80g", "Saumon cru 150g", "Avocat", "Edamame 50g", "Sauce soja", "Sesame"],
                "ingredients": [
                    {"name": "Riz sushi", "quantity": "80", "unit": "g"},
                    {"name": "Saumon frais (sushi)", "quantity": "150", "unit": "g"},
                    {"name": "Avocat", "quantity": "0.5", "unit": "pc"},
                    {"name": "Edamame", "quantity": "50", "unit": "g"},
                    {"name": "Sauce soja", "quantity": "15", "unit": "ml"},
                    {"name": "Graines de sesame", "quantity": "5", "unit": "g"},
                ],
                "steps": [
                    "Cuire le riz sushi et le laisser refroidir a temperature ambiante",
                    "Couper le saumon en des de 2cm",
                    "Mariner le saumon dans la sauce soja 10 min",
                    "Couper l'avocat en tranches fines",
                    "Dresser le riz dans un bol, disposer le saumon, l'avocat et les edamame",
                    "Saupoudrer de graines de sesame et servir",
                ],
                "calories": 580, "proteins": 36, "glucides": 58, "lipides": 22,
                "notes": "Frais et equilibre",
            },
        ]
        for m in meal_templates:
            m["id"] = str(uuid.uuid4())
            m["professional_id"] = pid
            m["is_template"] = True
            m["created_at"] = now
        await db.pro_meal_templates.insert_many(meal_templates)
        added_meal = len(meal_templates)

    return {"status": "seeded", "reminders_added": added_rem, "meals_added": added_meal, "exercises_added": added_ex}

DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
DAYS_EN_TO_FR = {"monday": "lundi", "tuesday": "mardi", "wednesday": "mercredi", "thursday": "jeudi", "friday": "vendredi", "saturday": "samedi", "sunday": "dimanche"}
DAYS_IDX = {d: i for i, d in enumerate(DAYS_FR)}

@router.post("/pro/assign-exercise")
async def assign_exercise(data: AssignExerciseCreate, user=Depends(get_current_user)):
    """Assign an exercise template to a beneficiary with custom days/reps/rest"""
    require_pro(user)
    tpl = await db.pro_exercise_templates.find_one(
        {"id": data.exercise_template_id, "professional_id": user['id']}, {"_id": 0}
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Exercice template non trouve")
    assignment = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": user.get('name', ''),
        "beneficiary_id": data.beneficiary_id,
        "exercise_template_id": data.exercise_template_id,
        "title": tpl["title"],
        "description": tpl.get("description", ""),
        "image": tpl.get("image", ""),
        "video_url": tpl.get("video_url", ""),
        "steps": tpl.get("steps", []),
        "category": tpl.get("category", "general"),
        "difficulty": tpl.get("difficulty", "moyen"),
        "muscle_group": tpl.get("muscle_group", ""),
        "equipment": tpl.get("equipment", ""),
        "icon": tpl.get("icon", ""),
        "days": data.days,
        "repetitions": data.repetitions,
        "sets": data.sets,
        "rest_seconds": data.rest_seconds,
        "completions": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_assigned_exercises.insert_one(assignment)
    assignment.pop('_id', None)
    # Notify beneficiary
    try:
        from routes.notification_routes import create_notification
        pro_name = user.get('name', 'Votre coach')
        await create_notification(
            user_id=data.beneficiary_id,
            notif_type="exercise",
            title="Nouvel exercice assigne",
            body=f"{pro_name} vous a assigne : {tpl['title']}",
            icon="ri-run-line",
            color="#EF4444",
            data={"assignment_id": assignment["id"], "type": "exercise"},
        )
    except Exception:
        pass
    return assignment

@router.get("/pro/assigned-exercises/{beneficiary_id}")
async def get_assigned_exercises(beneficiary_id: str, user=Depends(get_current_user)):
    """Get all exercises assigned to a beneficiary (coach view)"""
    require_pro(user)
    exs = await db.pro_assigned_exercises.find(
        {"beneficiary_id": beneficiary_id, "professional_id": user['id'], "status": "active"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return exs

@router.get("/pro/assigned-exercise-detail/{assignment_id}")
async def get_assigned_exercise_detail(assignment_id: str, user=Depends(get_current_user)):
    """Get a single assigned exercise by its ID, merged with latest template data"""
    ex = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    if not ex:
        raise HTTPException(status_code=404, detail="Exercice assigne non trouve")
    # Merge latest template data (image, video, steps, description may have been updated)
    tpl_id = ex.get("exercise_template_id")
    if tpl_id:
        tpl = await db.pro_exercise_templates.find_one({"id": tpl_id}, {"_id": 0})
        if tpl:
            for k in ["image", "video_url", "steps", "description", "icon", "equipment", "muscle_group", "difficulty", "category"]:
                if tpl.get(k):
                    ex[k] = tpl[k]
    return ex

class AssignExerciseUpdate(BaseModel):
    days: List[str] = []
    repetitions: int = 12
    sets: int = 3
    rest_seconds: int = 60

@router.put("/pro/assigned-exercises/{assignment_id}")
async def update_assigned_exercise(assignment_id: str, data: AssignExerciseUpdate, user=Depends(get_current_user)):
    """Update an assigned exercise (days, reps, sets, rest)"""
    require_pro(user)
    ex = await db.pro_assigned_exercises.find_one(
        {"id": assignment_id, "professional_id": user['id']}, {"_id": 0}
    )
    if not ex:
        raise HTTPException(status_code=404, detail="Exercice assigne non trouve")
    await db.pro_assigned_exercises.update_one(
        {"id": assignment_id},
        {"$set": {
            "days": data.days,
            "repetitions": data.repetitions,
            "sets": data.sets,
            "rest_seconds": data.rest_seconds,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    updated = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    return updated

@router.delete("/pro/assigned-exercises/{assignment_id}")
async def delete_assigned_exercise(assignment_id: str, user=Depends(get_current_user)):
    """Remove an exercise assignment"""
    require_pro(user)
    result = await db.pro_assigned_exercises.delete_one(
        {"id": assignment_id, "professional_id": user['id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercice assigne non trouve")
    return {"status": "deleted"}

@router.get("/pro/beneficiary-today-exercises")
async def beneficiary_today_exercises(user=Depends(get_current_user)):
    """Get exercises scheduled for today (beneficiary view)"""
    import locale
    today_idx = datetime.now(timezone.utc).weekday()  # 0=Monday
    today_fr = DAYS_FR[today_idx]
    exs = await db.pro_assigned_exercises.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).to_list(100)
    today_exs = [e for e in exs if today_fr in e.get('days', [])]
    # Add completion status for today
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    for e in today_exs:
        comps = e.get('completions', [])
        e['completed_today'] = any(c.get('date', '').startswith(today_str) and c.get('status') == 'done' for c in comps)
    return today_exs

@router.get("/pro/beneficiary-all-exercises")
async def beneficiary_all_exercises(user=Depends(get_current_user)):
    """Get all exercises assigned to this beneficiary"""
    exs = await db.pro_assigned_exercises.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).to_list(100)
    return exs

@router.post("/pro/exercises/{assignment_id}/complete")
async def complete_exercise(assignment_id: str, data: SessionCompletion, user=Depends(get_current_user)):
    """Beneficiary marks exercise as done/partial/skipped"""
    completion = {
        "date": datetime.now(timezone.utc).isoformat(),
        "status": data.status,
        "pain_level": data.pain_level,
        "patient_notes": data.patient_notes,
        "completed_by": user['id'],
    }
    ex = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    if not ex:
        raise HTTPException(status_code=404, detail="Exercice non trouve")
    await db.pro_assigned_exercises.update_one(
        {"id": assignment_id},
        {"$push": {"completions": completion}}
    )
    # Notify the coach
    status_label = {"done": "termine", "partial": "partiellement fait", "skipped": "passe"}.get(data.status, data.status)
    await db.pro_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "professional_id": ex.get("professional_id"),
        "beneficiary_id": user['id'],
        "beneficiary_name": user.get('name', ''),
        "type": "exercise_completion",
        "exercise_title": ex.get("title", ""),
        "status": data.status,
        "message": f"{user.get('name', 'Un beneficiaire')} a {status_label} l'exercice \"{ex.get('title', '')}\"",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "ok", "completion": completion}

@router.get("/pro/notifications")
async def get_pro_notifications(user=Depends(get_current_user)):
    """Get notifications for the professional"""
    require_pro(user)
    notifs = await db.pro_notifications.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifs

@router.get("/pro/notifications/unread-count")
async def get_unread_count(user=Depends(get_current_user)):
    """Get unread notification count"""
    require_pro(user)
    count = await db.pro_notifications.count_documents(
        {"professional_id": user['id'], "read": False}
    )
    return {"count": count}

@router.put("/pro/notifications/mark-read")
async def mark_notifications_read(user=Depends(get_current_user)):
    """Mark all notifications as read"""
    require_pro(user)
    await db.pro_notifications.update_many(
        {"professional_id": user['id'], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}

class ExerciseTemplateCreate(BaseModel):
    title: str
    description: str = ""
    image: str = ""
    video_url: str = ""
    category: str = "general"
    difficulty: str = "moyen"
    muscle_group: str = ""
    sets: int = 3
    repetitions: int = 12
    duration_min: int = 0
    rest_seconds: int = 60
    steps: List[str] = []
    equipment: str = ""
    notes: str = ""

@router.post("/pro/exercise-templates")
async def create_exercise_template(data: ExerciseTemplateCreate, user=Depends(get_current_user)):
    """Create an exercise template in the library"""
    require_pro(user)
    tpl = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "title": data.title,
        "description": data.description,
        "image": data.image,
        "video_url": data.video_url,
        "category": data.category,
        "difficulty": data.difficulty,
        "muscle_group": data.muscle_group,
        "sets": data.sets,
        "repetitions": data.repetitions,
        "duration_min": data.duration_min,
        "rest_seconds": data.rest_seconds,
        "steps": data.steps,
        "equipment": data.equipment,
        "notes": data.notes,
        "is_template": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_exercise_templates.insert_one(tpl)
    tpl.pop('_id', None)
    return tpl

@router.get("/pro/exercise-templates")
async def list_exercise_templates(user=Depends(get_current_user)):
    """List all exercise templates for this pro"""
    require_pro(user)
    return await db.pro_exercise_templates.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)

@router.delete("/pro/exercise-templates/{template_id}")
async def delete_exercise_template(template_id: str, user=Depends(get_current_user)):
    """Delete an exercise template"""
    require_pro(user)
    result = await db.pro_exercise_templates.delete_one(
        {"id": template_id, "professional_id": user['id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercice non trouve")
    return {"status": "deleted"}


# ── Check if beneficiary has active pro programs ──

@router.get("/pro/has-active-programs")
async def check_active_pro_programs(user=Depends(get_current_user)):
    """Beneficiary checks if they have active pro programs (to hide minceur exercises)"""
    count = await db.pro_programs.count_documents(
        {"beneficiary_id": user['id'], "status": "active"}
    )
    return {"has_programs": count > 0, "count": count}


# ── Bilans (Nora-powered reports) ──

@router.get("/pro/bilan/{beneficiary_id}")
async def generate_bilan(beneficiary_id: str, period: str = "week", user=Depends(get_current_user)):
    """Generate a Nora-powered bilan for a beneficiary"""
    eff = get_effective_role(user)
    if eff not in ('professional', 'beneficiary'):
        raise HTTPException(status_code=403)

    # Gather data
    ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")

    # Latest vitals
    readings = await db.device_readings.find(
        {"user_id": beneficiary_id, "device_type": "bracelet"}, {"_id": 0}
    ).sort("timestamp", -1).limit(30).to_list(30)
    vitals_summary = {}
    if readings:
        hrs = [r['data'].get('heart_rate', 0) for r in readings if r.get('data', {}).get('heart_rate')]
        spo2s = [r['data'].get('spo2', 0) for r in readings if r.get('data', {}).get('spo2')]
        temps = [r['data'].get('temperature', 0) for r in readings if r.get('data', {}).get('temperature', 0) > 30]
        steps = [r['data'].get('steps', 0) for r in readings if r.get('data', {}).get('steps')]
        vitals_summary = {
            "avg_heart_rate": round(sum(hrs) / len(hrs)) if hrs else None,
            "avg_spo2": round(sum(spo2s) / len(spo2s)) if spo2s else None,
            "avg_temperature": round(sum(temps) / len(temps), 1) if temps else None,
            "avg_steps": round(sum(steps) / len(steps)) if steps else None,
            "readings_count": len(readings),
        }

    # Programs and completion
    programs = await db.pro_programs.find(
        {"beneficiary_id": beneficiary_id, "status": "active"}, {"_id": 0}
    ).to_list(10)
    program_summary = []
    for p in programs:
        sessions = p.get('sessions', [])
        done = sum(1 for s in sessions if any(c.get('status') == 'done' for c in s.get('completions', [])))
        program_summary.append({"title": p['title'], "exercises": len(sessions), "completed": done})

    # Supplements tracking (from reminders created by pros)
    pro_reminders = await db.reminders.find(
        {"user_id": beneficiary_id, "created_by_pro": {"$exists": True}, "reminder_type": "medication"}, {"_id": 0}
    ).to_list(20)
    supp_summary = [{"name": r['title'], "dosage": r.get('dosage', ''), "active": r.get('active', True)} for r in pro_reminders]

    # Generate with Nora (GPT)
    try:
        from emergentintegrations.llm.chat import Chat, Message, Model
        import os
        chat = Chat(os.environ.get('EMERGENT_LLM_KEY', ''), Model.GPT_5_2)
        prompt = f"""Tu es Nora, assistante sante IA de CHUTEX. Genere un bilan {period} pour {ben.get('name', 'le patient')}.

Donnees de sante ({period}):
- Frequence cardiaque moyenne: {vitals_summary.get('avg_heart_rate', 'N/A')} bpm
- SpO2 moyenne: {vitals_summary.get('avg_spo2', 'N/A')}%
- Temperature moyenne: {vitals_summary.get('avg_temperature', 'N/A')} C
- Pas moyens/jour: {vitals_summary.get('avg_steps', 'N/A')}

Programmes d'exercices: {program_summary if program_summary else 'Aucun'}
Complements prescrits: {[s['name'] + (' (' + s['dosage'] + ')' if s.get('dosage') else '') for s in supp_summary] if supp_summary else 'Aucun'}

Genere un bilan structure avec:
1. Resume general (2-3 phrases)
2. Points positifs (liste)
3. Points d'attention (liste)
4. Recommandations pour la semaine suivante (liste)

Reponds en francais, de maniere concise et bienveillante. Format en texte simple avec des tirets pour les listes."""

        chat.add_message(Message(role="system", content="Tu es Nora, assistante sante IA bienveillante et professionnelle."))
        resp = await chat.send_async(prompt)
        bilan_text = resp
    except Exception as e:
        # Fallback if no LLM key
        bilan_text = f"Bilan {period} pour {ben.get('name', 'le patient')}:\n\n"
        bilan_text += f"Donnees vitales: FC {vitals_summary.get('avg_heart_rate', '--')} bpm, SpO2 {vitals_summary.get('avg_spo2', '--')}%, Temp {vitals_summary.get('avg_temperature', '--')}C\n"
        bilan_text += f"Pas moyens: {vitals_summary.get('avg_steps', '--')}/jour\n\n"
        if program_summary:
            bilan_text += "Programmes:\n"
            for p in program_summary:
                bilan_text += f"- {p['title']}: {p['completed']}/{p['exercises']} exercices completes\n"
        if supp_summary:
            bilan_text += "\nComplements prescrits:\n"
            for s in supp_summary:
                bilan_text += f"- {s['name']}{' (' + s['dosage'] + ')' if s.get('dosage') else ''}\n"

    return {
        "beneficiary_name": ben.get('name', ''),
        "period": period,
        "vitals": vitals_summary,
        "programs": program_summary,
        "supplements": supp_summary,
        "bilan_text": bilan_text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
