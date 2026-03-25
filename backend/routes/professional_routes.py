from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid, os

from auth import get_current_user, get_effective_role, sanitize_user
from database import db

router = APIRouter()

UPLOAD_DIR = "/app/backend/uploads"

@router.post("/pro/upload-image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload an image for pro content (programmes, meals). Returns URL."""
    require_pro(user)
    ext = (file.filename or '').split('.')[-1] or 'jpg'
    if ext.lower() not in ('jpg', 'jpeg', 'png', 'webp', 'gif'):
        raise HTTPException(status_code=400, detail="Format non supporte (jpg, png, webp)")
    fname = f"{uuid.uuid4().hex}.{ext.lower()}"
    path = os.path.join(UPLOAD_DIR, fname)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop volumineuse (max 5MB)")
    with open(path, "wb") as f:
        f.write(content)
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
    media_url: str = ""
    media_type: str = ""  # video, image
    duration_min: int = 30
    repetitions: int = 0
    sets: int = 0
    rest_sec: int = 0
    notes: str = ""

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
        "category": data.category if hasattr(data, 'category') else '',
        "media_url": data.media_url,
        "media_type": data.media_type,
        "duration_min": data.duration_min,
        "repetitions": data.repetitions,
        "sets": data.sets,
        "rest_sec": data.rest_sec,
        "notes": data.notes,
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
