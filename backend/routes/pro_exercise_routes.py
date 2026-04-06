"""
Pro Exercise Routes — Extracted from professional_routes.py during pre-production audit.
Handles exercise templates, assignments, completions, and library.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from auth import get_current_user, get_effective_role
from database import db

router = APIRouter()

DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
DAYS_EN_TO_FR = {"monday": "lundi", "tuesday": "mardi", "wednesday": "mercredi", "thursday": "jeudi", "friday": "vendredi", "saturday": "samedi", "sunday": "dimanche"}
DAYS_IDX = {d: i for i, d in enumerate(DAYS_FR)}


def require_pro(user):
    pro_type = user.get('professional_type', '')
    role = user.get('active_role') or user.get('role', '')
    if pro_type in ('coach', 'physio') or role == 'professional':
        return get_effective_role(user)
    raise HTTPException(status_code=403, detail="Reserve aux professionnels")


class AssignExerciseCreate(BaseModel):
    exercise_template_id: str
    beneficiary_id: str
    days: List[str] = []
    repetitions: int = 12
    sets: int = 3
    rest_seconds: int = 60


class AssignExerciseUpdate(BaseModel):
    days: Optional[List[str]] = None
    repetitions: Optional[int] = None
    sets: Optional[int] = None
    rest_seconds: Optional[int] = None
    active: Optional[bool] = None


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
        "exercise_template_id": data.exercise_template_id,
        "professional_id": user['id'],
        "beneficiary_id": data.beneficiary_id,
        "title": tpl.get("title", ""),
        "description": tpl.get("description", ""),
        "image": tpl.get("image", ""),
        "video_url": tpl.get("video_url", ""),
        "category": tpl.get("category", "general"),
        "difficulty": tpl.get("difficulty", "moyen"),
        "muscle_group": tpl.get("muscle_group", ""),
        "equipment": tpl.get("equipment", ""),
        "steps": tpl.get("steps", []),
        "icon": tpl.get("icon", "ri-heart-pulse-line"),
        "days": [d.lower() for d in data.days],
        "repetitions": data.repetitions,
        "sets": data.sets,
        "rest_seconds": data.rest_seconds,
        "active": True,
        "completions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_assigned_exercises.insert_one(assignment)
    assignment.pop('_id', None)

    await db.pro_notifications.insert_one({
        "id": str(uuid.uuid4()), "professional_id": user['id'],
        "beneficiary_id": data.beneficiary_id, "type": "exercise_assigned",
        "message": f"Exercice '{tpl['title']}' assigne",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return assignment


@router.get("/pro/assigned-exercises/{beneficiary_id}")
async def list_assigned_exercises(beneficiary_id: str, user=Depends(get_current_user)):
    """List all exercises assigned to a beneficiary"""
    return await db.pro_assigned_exercises.find(
        {"beneficiary_id": beneficiary_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)


@router.get("/pro/assigned-exercise-detail/{assignment_id}")
async def get_assigned_exercise_detail(assignment_id: str, user=Depends(get_current_user)):
    """Get detailed info about an assigned exercise, including completion history"""
    a = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Exercice non trouve")
    return a


@router.put("/pro/assigned-exercises/{assignment_id}")
async def update_assigned_exercise(assignment_id: str, data: AssignExerciseUpdate, user=Depends(get_current_user)):
    """Update an assigned exercise"""
    updates = {}
    if data.days is not None:
        updates["days"] = [d.lower() for d in data.days]
    if data.repetitions is not None:
        updates["repetitions"] = data.repetitions
    if data.sets is not None:
        updates["sets"] = data.sets
    if data.rest_seconds is not None:
        updates["rest_seconds"] = data.rest_seconds
    if data.active is not None:
        updates["active"] = data.active
    if updates:
        await db.pro_assigned_exercises.update_one({"id": assignment_id}, {"$set": updates})
    a = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    return a


@router.delete("/pro/assigned-exercises/{assignment_id}")
async def delete_assigned_exercise(assignment_id: str, user=Depends(get_current_user)):
    """Delete an assigned exercise"""
    result = await db.pro_assigned_exercises.delete_one({"id": assignment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercice non trouve")
    return {"status": "deleted"}


@router.get("/pro/beneficiary-today-exercises")
async def get_beneficiary_today_exercises(user=Depends(get_current_user)):
    """Get exercises assigned to the beneficiary for today"""
    uid = user['id']
    import locale
    today = datetime.now(timezone.utc)
    day_idx = today.weekday()
    today_fr = DAYS_FR[day_idx]
    today_str = today.strftime("%Y-%m-%d")

    exercises = await db.pro_assigned_exercises.find(
        {"beneficiary_id": uid, "active": True}, {"_id": 0}
    ).to_list(100)

    today_exercises = []
    for ex in exercises:
        days = [d.lower() for d in ex.get("days", [])]
        if today_fr in days or not days:
            done = any(c.get("date", "")[:10] == today_str and c.get("status") == "done" for c in ex.get("completions", []))
            today_exercises.append({**ex, "done_today": done})

    today_exercises.sort(key=lambda x: (x.get("done_today", False), x.get("title", "")))
    return today_exercises


@router.get("/pro/beneficiary-all-exercises")
async def get_beneficiary_all_exercises(user=Depends(get_current_user)):
    """Get ALL exercises assigned to the beneficiary (not just today)"""
    uid = user['id']
    return await db.pro_assigned_exercises.find(
        {"beneficiary_id": uid, "active": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)


@router.get("/pro/exercise-library")
async def get_exercise_library(user=Depends(get_current_user)):
    """Get the exercise library — pro templates + all available templates for beneficiary."""
    uid = user['id']
    guardians = await db.guardian_links.find(
        {"beneficiary_id": uid, "status": "accepted"}, {"_id": 0}
    ).to_list(20)
    guardian_ids = [g['guardian_id'] for g in guardians]

    pro_subscriptions = await db.pro_subscriptions.find(
        {"beneficiary_id": uid, "status": "active"}, {"_id": 0}
    ).to_list(10)
    pro_ids = [s['professional_id'] for s in pro_subscriptions]

    all_pro_ids = list(set(guardian_ids + pro_ids))

    # Fetch pro-specific templates
    pro_templates = []
    if all_pro_ids:
        pro_templates = await db.pro_exercise_templates.find(
            {"professional_id": {"$in": all_pro_ids}}, {"_id": 0}
        ).sort("created_at", -1).to_list(200)

    # Also fetch ALL available templates as global library (like reminder suggestions)
    all_templates = await db.pro_exercise_templates.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)

    # Merge: pro templates first, then global (deduplicate by id)
    seen_ids = set()
    result = []
    for t in pro_templates:
        tid = t.get("id", "")
        if tid and tid not in seen_ids:
            t["source"] = "pro"
            result.append(t)
            seen_ids.add(tid)
    for t in all_templates:
        tid = t.get("id", "")
        if tid and tid not in seen_ids:
            t["source"] = "library"
            result.append(t)
            seen_ids.add(tid)

    return result


@router.post("/pro/self-assign-exercise")
async def self_assign_exercise(data: dict, user=Depends(get_current_user)):
    """Beneficiary self-assigns an exercise from the library"""
    uid = user['id']
    tpl_id = data.get("exercise_template_id")
    if not tpl_id:
        raise HTTPException(status_code=400, detail="exercise_template_id requis")

    tpl = await db.pro_exercise_templates.find_one({"id": tpl_id}, {"_id": 0})
    if not tpl:
        raise HTTPException(status_code=404, detail="Template non trouve")

    existing = await db.pro_assigned_exercises.find_one(
        {"beneficiary_id": uid, "exercise_template_id": tpl_id, "active": True}, {"_id": 0}
    )
    if existing:
        return {"status": "already_assigned", "assignment": existing}

    days = data.get("days", DAYS_FR[:5])
    assignment = {
        "id": str(uuid.uuid4()),
        "exercise_template_id": tpl_id,
        "professional_id": tpl.get("professional_id", uid),
        "beneficiary_id": uid,
        "title": tpl.get("title", ""),
        "description": tpl.get("description", ""),
        "image": tpl.get("image", ""),
        "video_url": tpl.get("video_url", ""),
        "category": tpl.get("category", "general"),
        "difficulty": tpl.get("difficulty", "moyen"),
        "muscle_group": tpl.get("muscle_group", ""),
        "equipment": tpl.get("equipment", ""),
        "steps": tpl.get("steps", []),
        "icon": tpl.get("icon", "ri-heart-pulse-line"),
        "days": [d.lower() for d in days],
        "repetitions": data.get("repetitions", tpl.get("repetitions", 12)),
        "sets": data.get("sets", tpl.get("sets", 3)),
        "rest_seconds": data.get("rest_seconds", tpl.get("rest_seconds", 60)),
        "active": True,
        "self_assigned": True,
        "completions": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_assigned_exercises.insert_one(assignment)
    assignment.pop('_id', None)
    return assignment


@router.post("/pro/exercises/{assignment_id}/complete")
async def complete_exercise(assignment_id: str, data: dict = {}, user=Depends(get_current_user)):
    """Mark an exercise as done for today"""
    uid = user['id']
    a = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Exercice non trouve")
    if a.get("beneficiary_id") != uid:
        raise HTTPException(status_code=403, detail="Non autorise")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    already_done = any(c.get("date", "")[:10] == today_str and c.get("status") == "done" for c in a.get("completions", []))
    if already_done:
        return {"status": "already_done"}

    completion = {
        "date": datetime.now(timezone.utc).isoformat(),
        "status": "done",
        "sets_done": data.get("sets_done", a.get("sets", 3)),
        "reps_done": data.get("reps_done", a.get("repetitions", 12)),
        "weight_used": data.get("weight_used"),
        "notes": data.get("notes", ""),
    }
    await db.pro_assigned_exercises.update_one(
        {"id": assignment_id},
        {"$push": {"completions": completion}}
    )
    return {"status": "completed", "completion": completion}


@router.put("/pro/assigned-exercises/{assignment_id}/update-params")
async def update_exercise_params(assignment_id: str, data: dict, user=Depends(get_current_user)):
    """Beneficiary updates their exercise parameters (sets, reps, rest)"""
    uid = user['id']
    a = await db.pro_assigned_exercises.find_one({"id": assignment_id})
    if not a or a.get("beneficiary_id") != uid:
        raise HTTPException(status_code=404)
    updates = {}
    if "sets" in data:
        updates["sets"] = data["sets"]
    if "repetitions" in data:
        updates["repetitions"] = data["repetitions"]
    if "rest_seconds" in data:
        updates["rest_seconds"] = data["rest_seconds"]
    if "days" in data:
        updates["days"] = [d.lower() for d in data["days"]]
    if updates:
        await db.pro_assigned_exercises.update_one({"id": assignment_id}, {"$set": updates})
    updated = await db.pro_assigned_exercises.find_one({"id": assignment_id}, {"_id": 0})
    return updated


@router.put("/pro/assigned-exercises/{assignment_id}/save-weight")
async def save_exercise_weight(assignment_id: str, data: dict, user=Depends(get_current_user)):
    """Save/update the weight used for the last completion of an exercise"""
    uid = user['id']
    a = await db.pro_assigned_exercises.find_one({"id": assignment_id})
    if not a or a.get("beneficiary_id") != uid:
        raise HTTPException(status_code=404)
    weight = data.get("weight_used")
    if weight is None:
        raise HTTPException(status_code=400, detail="weight_used requis")
    completions = a.get("completions", [])
    if completions:
        completions[-1]["weight_used"] = weight
        await db.pro_assigned_exercises.update_one(
            {"id": assignment_id},
            {"$set": {"completions": completions}}
        )
    return {"status": "saved"}


@router.get("/pro/notifications")
async def get_pro_notifications(user=Depends(get_current_user)):
    """Get pro notifications"""
    return await db.pro_notifications.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)


@router.get("/pro/notifications/unread-count")
async def get_unread_notification_count(user=Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.pro_notifications.count_documents(
        {"professional_id": user['id'], "read": False}
    )
    return {"count": count}


@router.put("/pro/notifications/mark-read")
async def mark_notifications_read(user=Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.pro_notifications.update_many(
        {"professional_id": user['id'], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}


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


@router.get("/pro/has-active-programs")
async def check_active_pro_programs(user=Depends(get_current_user)):
    """Beneficiary checks if they have active pro programs"""
    count = await db.pro_programs.count_documents(
        {"beneficiary_id": user['id'], "status": "active"}
    )
    return {"has_programs": count > 0, "count": count}


@router.get("/pro/bilan/{beneficiary_id}")
async def generate_bilan(beneficiary_id: str, period: str = "week", user=Depends(get_current_user)):
    """Generate a Nora-powered bilan for a beneficiary"""
    eff = get_effective_role(user)
    if eff not in ('professional', 'beneficiary'):
        raise HTTPException(status_code=403)

    ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")

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

    programs = await db.pro_programs.find(
        {"beneficiary_id": beneficiary_id, "status": "active"}, {"_id": 0}
    ).to_list(10)
    program_summary = []
    for p in programs:
        sessions = p.get('sessions', [])
        done = sum(1 for s in sessions if any(c.get('status') == 'done' for c in s.get('completions', [])))
        program_summary.append({"title": p['title'], "exercises": len(sessions), "completed": done})

    pro_reminders = await db.reminders.find(
        {"user_id": beneficiary_id, "created_by_pro": {"$exists": True}, "reminder_type": "medication"}, {"_id": 0}
    ).to_list(20)
    supp_summary = [{"name": r['title'], "dosage": r.get('dosage', ''), "active": r.get('active', True)} for r in pro_reminders]

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
    except Exception:
        bilan_text = f"Bilan {period} pour {ben.get('name', 'le patient')}:\n\n"
        bilan_text += f"Donnees vitales: FC {vitals_summary.get('avg_heart_rate', '--')} bpm, SpO2 {vitals_summary.get('avg_spo2', '--')}%, Temp {vitals_summary.get('avg_temperature', '--')}C\n"
        bilan_text += f"Pas moyens: {vitals_summary.get('avg_steps', '--')}/jour\n\n"
        if program_summary:
            bilan_text += "Programmes:\n"
            for p in program_summary:
                bilan_text += f"- {p['title']}: {p['completed']}/{p['exercises']} exercices completes\n"

    return {
        "beneficiary_name": ben.get('name', ''),
        "period": period,
        "vitals": vitals_summary,
        "programs": program_summary,
        "supplements": supp_summary,
        "bilan_text": bilan_text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
