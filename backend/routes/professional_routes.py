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



# ── Supplements CRUD ──

class SupplementCreate(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""  # e.g. "1x/jour matin"
    notes: str = ""

@router.post("/pro/supplements/{beneficiary_id}")
async def create_supplement(beneficiary_id: str, data: SupplementCreate, user=Depends(get_current_user)):
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    supp = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": cu.get('name', ''),
        "beneficiary_id": beneficiary_id,
        "name": data.name,
        "dosage": data.dosage,
        "frequency": data.frequency,
        "notes": data.notes,
        "status": "active",
        "tracking": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_supplements.insert_one(supp)
    supp.pop('_id', None)
    return supp

@router.get("/pro/supplements/{beneficiary_id}")
async def list_supplements(beneficiary_id: str, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    query = {"beneficiary_id": beneficiary_id, "status": "active"}
    if eff == 'professional':
        query["professional_id"] = user['id']
    supps = await db.pro_supplements.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return supps

@router.delete("/pro/supplements/delete/{supplement_id}")
async def delete_supplement(supplement_id: str, user=Depends(get_current_user)):
    require_pro(user)
    await db.pro_supplements.delete_one({"id": supplement_id, "professional_id": user['id']})
    return {"status": "deleted"}

@router.get("/pro/my-supplements")
async def get_my_supplements(user=Depends(get_current_user)):
    """Beneficiary gets their prescribed supplements"""
    supps = await db.pro_supplements.find(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return supps

@router.post("/pro/supplements/track/{supplement_id}")
async def track_supplement(supplement_id: str, user=Depends(get_current_user)):
    """Beneficiary marks supplement as taken today"""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    supp = await db.pro_supplements.find_one({"id": supplement_id, "beneficiary_id": user['id']})
    if not supp:
        raise HTTPException(status_code=404, detail="Complement non trouve")
    tracking = supp.get('tracking', [])
    if today in tracking:
        tracking.remove(today)
    else:
        tracking.append(today)
    await db.pro_supplements.update_one({"id": supplement_id}, {"$set": {"tracking": tracking}})
    return {"status": "tracked", "tracking": tracking}


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

    # Supplements tracking
    supps = await db.pro_supplements.find(
        {"beneficiary_id": beneficiary_id, "status": "active"}, {"_id": 0}
    ).to_list(20)
    supp_summary = [{"name": s['name'], "tracked_days": len(s.get('tracking', []))} for s in supps]

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
Complements alimentaires: {supp_summary if supp_summary else 'Aucun'}

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
            bilan_text += "\nComplements:\n"
            for s in supp_summary:
                bilan_text += f"- {s['name']}: {s['tracked_days']} jours de prise\n"

    return {
        "beneficiary_name": ben.get('name', ''),
        "period": period,
        "vitals": vitals_summary,
        "programs": program_summary,
        "supplements": supp_summary,
        "bilan_text": bilan_text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
