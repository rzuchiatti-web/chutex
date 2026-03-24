from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from auth import get_current_user, get_effective_role, sanitize_user
from database import db

router = APIRouter()


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
    eff = get_effective_role(user)
    if eff != 'professional':
        raise HTTPException(status_code=403, detail="Reserve aux professionnels")
    return eff


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
    """Beneficiary gets their prescribed programs"""
    programs = await db.pro_programs.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
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
