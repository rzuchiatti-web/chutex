from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os
import uuid

from database import db
from auth import get_current_user
from routes.program_helpers import transform_task_text, enrich_tasks_interactive
from routes.program_seed_data import SEED_PROGRAMS
from routes.program_team_routes import _emit_team_activity

router = APIRouter()

@router.on_event("startup")
async def seed_programs():
    for p in SEED_PROGRAMS:
        existing = await db.programs.find_one({"id": p["id"]})
        if existing:
            # Update metadata ONLY — never overwrite daily_tasks_template (contains generated guided_steps)
            update = {k: v for k, v in p.items() if k not in ("id", "daily_tasks_template")}
            if update:
                await db.programs.update_one({"id": p["id"]}, {"$set": update})
        else:
            await db.programs.insert_one(p)


@router.get("/programs/catalog")
async def get_program_catalog(user=Depends(get_current_user)):
    """Get available programs"""
    programs = await db.programs.find({}, {"_id": 0, "daily_tasks_template": 0}).to_list(20)
    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    return {"programs": programs, "active_enrollment": active}


@router.get("/programs/detail/{program_id}")
async def get_program_detail(program_id: str):
    """Get full program details for presentation screen (no auth)"""
    program = await db.programs.find_one({"id": program_id}, {"_id": 0, "daily_tasks_template": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")
    return program


@router.get("/programs/daily-feedback")
async def get_daily_feedback(user=Depends(get_current_user)):
    """Generate AI feedback based on bracelet/scale data for active program"""
    uid = user['id']
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not enrollment:
        return {"has_feedback": False}

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        return {"has_feedback": False}

    # Build enriched context using Nora
    from services.nora_context import build_nora_context, format_nora_context_for_prompt
    nora_ctx = await build_nora_context(user)
    user_context = format_nora_context_for_prompt(nora_ctx)

    # Build program-specific context
    ctx_parts = [f"Programme: {program.get('title','')}, Jour {enrollment.get('current_day', 1)}/{program.get('duration_days', 21)}."]

    # Onboarding context
    onb = enrollment.get("onboarding", {})
    if onb.get("goal"): ctx_parts.append(f"Objectif: {onb['goal']}.")
    if onb.get("wake_time"): ctx_parts.append(f"Reveil cible: {onb['wake_time']}.")

    program_ctx = " ".join(ctx_parts)
    has_data = nora_ctx.get("has_any_data", False)

    feedback = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json

            if has_data:
                prompt = f"""Medecin specialiste du sommeil et de la longevite. Contexte patient et programme:

PATIENT:
{user_context}

PROGRAMME EN COURS: {program_ctx}

Genere un feedback quotidien personnalise en JSON. Base-toi UNIQUEMENT sur les donnees reelles du patient. Vouvoyez le patient. Pas d'emoji.
{{"message": "2-3 phrases medicalement pertinentes basees sur les donnees reelles, adaptees au jour du programme et a l'age du patient", "mood_indicator": "good/neutral/warning", "tip": "1 recommandation concrete et scientifiquement prouvee pour ameliorer le sommeil, adaptee au profil du patient"}}"""
            else:
                prompt = f"""Medecin specialiste du sommeil. Le patient suit le programme "{program.get('title','')}" (jour {enrollment.get('current_day', 1)}/{program.get('duration_days', 21)}) mais n'a PAS encore de donnees de sante mesurees.

PATIENT: {nora_ctx['user_profile'].get('name', 'Patient')}, {nora_ctx.get('age', '?')} ans.

Genere un feedback qui reconnait l'absence de donnees et encourage a connecter les appareils. JSON uniquement. Vouvoyez. Pas d'emoji.
{{"message": "2 phrases: reconnaitre l'absence de donnees + encourager la mesure", "mood_indicator": "neutral", "tip": "1 conseil pour le programme du jour, meme sans donnees"}}"""

            chat = LlmChat(api_key=api_key, session_id=f"fb-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin du sommeil et longevite. JSON uniquement. Pas d'emoji. Ton professionnel.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            feedback = json.loads(r.strip())
        except Exception as e:
            print(f"Daily feedback AI err: {e}")

    if not feedback:
        if has_data:
            feedback = {"message": "Votre regularite dans le programme est essentielle pour observer des ameliorations mesurables.", "mood_indicator": "neutral", "tip": "Maintenez un horaire de coucher regulier ce soir."}
        else:
            feedback = {"message": "Connectez votre bracelet Elio pour que Nora puisse analyser votre sommeil et personnaliser vos recommandations.", "mood_indicator": "neutral", "tip": "Appliquez les conseils du programme meme sans donnees — les benefices viendront."}

    return {"has_feedback": True, "feedback": feedback}


@router.post("/programs/start/{program_id}")
async def start_program(program_id: str, data: dict = {}, user=Depends(get_current_user)):
    """Start a program with optional onboarding data + save health snapshot"""
    program = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    active = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}
    )
    if active:
        raise HTTPException(status_code=400, detail="Vous avez deja un programme actif. Terminez-le d'abord.")

    # Capture health snapshot at start
    snapshot = await _capture_health_snapshot(user['id'])

    enrollment_id = str(uuid.uuid4())
    enrollment = {
        "id": enrollment_id,
        "user_id": user['id'],
        "program_id": program_id,
        "status": "active",
        "current_day": 1,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "streak": 0,
        "completed_days": [],
        "checkins": [],
        "mode": data.get("mode", "solo"),
        "onboarding": data.get("onboarding", {}),
        "health_snapshot_start": snapshot,
    }
    await db.program_enrollments.insert_one(enrollment)
    enrollment.pop("_id", None)
    return {"status": "started", "enrollment": enrollment}


async def _capture_health_snapshot(user_id: str) -> dict:
    """Capture current health metrics for before/after comparison."""
    snapshot = {"captured_at": datetime.now(timezone.utc).isoformat()}
    bracelet = await db.device_readings.find_one(
        {"user_id": user_id, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    scale = await db.device_readings.find_one(
        {"user_id": user_id, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if bracelet and bracelet.get("data"):
        bd = bracelet["data"]
        for k in ["heart_rate", "hrv", "spo2", "steps", "calories", "stress_level", "recovery_score", "sleep_quality", "temperature"]:
            if bd.get(k): snapshot[k] = bd[k]
        if bd.get("blood_pressure"): snapshot["blood_pressure"] = bd["blood_pressure"]
    if scale and scale.get("data"):
        sd = scale["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age"]:
            if sd.get(k): snapshot[k] = sd[k]
    return snapshot


@router.get("/programs/active")
async def get_active_program(user=Depends(get_current_user), day: int = 0):
    """Get active program with today's tasks. Use ?day=X to simulate a specific day."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        return {"active": False}

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        return {"active": False}

    # Calculate current day - allow override for simulation
    if day > 0:
        current_day = min(day, program["duration_days"])
    else:
        try:
            started_str = enrollment.get("started_at") or enrollment.get("start_date", "")
            started = datetime.fromisoformat(started_str.replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - started).days + 1
            current_day = min(days_since, program["duration_days"])
        except:
            current_day = enrollment.get("current_day", 1)

    # Update current day
    if current_day != enrollment.get("current_day"):
        await db.program_enrollments.update_one(
            {"id": enrollment["id"]}, {"$set": {"current_day": current_day}}
        )

    # Check if program is completed
    if current_day > program["duration_days"]:
        await db.program_enrollments.update_one(
            {"id": enrollment["id"]}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"active": False, "just_completed": True, "program_title": program["title"]}

    # Get today's tasks
    day_key = str(current_day)
    tasks_template = program.get("daily_tasks_template", {})
    today_tasks = tasks_template.get(day_key, None)

    # If no specific tasks for this day, generate with AI
    if not today_tasks:
        today_tasks = {
            "focus": f"Jour {current_day} - Continue tes efforts",
            "tasks": ["Applique les habitudes apprises", "Note tes observations", "Felicite-toi pour ta regularite"],
            "tip": "La constance est la cle du succes.",
        }

    # ── Personalize tasks with Nora based on user profile ──
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"{enrollment['id']}_{today_str}_{day_key}"
    cached_personalized = await db.personalized_tasks_cache.find_one({"cache_key": cache_key}, {"_id": 0})

    if cached_personalized and cached_personalized.get("tasks"):
        today_tasks = cached_personalized["tasks"]
        # ALWAYS reload guided_steps from the original template (never from cache)
        original_gs = tasks_template.get(day_key, {}).get("guided_steps", {})
        if original_gs:
            today_tasks["guided_steps"] = original_gs
    else:
        # Save original guided_steps BEFORE personalization
        original_guided_steps = tasks_template.get(day_key, {}).get("guided_steps", {})

        # Personalize text via GPT
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if api_key:
            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage
                import json as _json

                age = None
                dob = user.get('date_of_birth', '')
                if dob:
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
                        try:
                            born = datetime.strptime(dob, fmt)
                            age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                            break
                        except ValueError:
                            continue

                profile = f"Age: {age or '?'} ans, Sexe: {user.get('gender', '?')}, Poids: {user.get('weight_kg', '?')}kg, Taille: {user.get('height_cm', '?')}cm"
                if user.get('medical_conditions'):
                    profile += f", Pathologies: {user['medical_conditions']}"
                if user.get('allergies') and user['allergies'].lower() != 'aucune':
                    profile += f", Allergies: {user['allergies']}"

                tasks_list = today_tasks.get("tasks", [])
                prompt = f"""Adapte ce programme au profil. JSON. Garde exactement {len(tasks_list)} taches.

PROFIL: {profile}
PROGRAMME: {program['title']}, Jour {day_key}
FOCUS: {today_tasks.get('focus', '')}
TACHES: {_json.dumps(tasks_list, ensure_ascii=False)}
TIP: {today_tasks.get('tip', '')}

Adapte intensite, duree, precautions selon le profil (age, pathologies).
Vouvoiement pour +50 ans. Precautions si pathologie grave.
JSON: {{"focus": "...", "mission": "1-2 phrases contexte medical", "tasks": ["tache 1 adaptee", "tache 2 adaptee", "tache 3 adaptee"], "tip": "conseil adapte"}}"""

                chat = LlmChat(api_key=api_key, session_id=f"pt-{cache_key[:16]}",
                    system_message="Nora. Adapte programme sante au profil. JSON uniquement. Court.").with_model("openai", "gpt-5.2")
                r = (await chat.send_message(UserMessage(text=prompt))).strip()
                if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
                if r.endswith("```"): r = r[:-3]
                personalized = _json.loads(r.strip())

                if personalized.get("tasks") and isinstance(personalized["tasks"], list):
                    # Ensure tasks are strings
                    clean_tasks = []
                    for t in personalized["tasks"]:
                        if isinstance(t, str):
                            clean_tasks.append(t)
                        elif isinstance(t, dict):
                            clean_tasks.append(t.get("title") or t.get("task") or str(t))
                    personalized["tasks"] = clean_tasks
                    # DO NOT store guided_steps in cache — always use template original
                    personalized.pop("guided_steps", None)
                    today_tasks = personalized

                    await db.personalized_tasks_cache.update_one(
                        {"cache_key": cache_key},
                        {"$set": {"cache_key": cache_key, "tasks": today_tasks, "created_at": today_str}},
                        upsert=True
                    )
                    # Re-inject guided_steps from template AFTER caching
                    today_tasks["guided_steps"] = original_guided_steps
            except Exception as e:
                print(f"Program personalization error: {e}")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_checkin = await db.program_checkins.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )

    # Calculate streak
    completed_days = enrollment.get("completed_days", [])
    streak = len(completed_days)

    # Current phase
    current_phase = None
    for phase in program.get("phases", []):
        if phase["days"][0] <= current_day <= phase["days"][1]:
            current_phase = phase
            break

    # Team info if in a team (skip for solo mode)
    team_info = None
    team = None
    if enrollment.get("mode") != "solo":
        team = await db.team_programs.find_one(
            {"members.user_id": user['id'], "program_id": program["id"], "status": {"$in": ["waiting", "active"]}}, {"_id": 0}
        )
    if team:
        today_str_team = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        team_members = []
        for m in team.get("members", []):
            # Get today's checkin for each member
            m_checkin = await db.program_checkins.find_one(
                {"user_id": m["user_id"], "date": today_str_team}, {"_id": 0}
            )
            team_members.append({
                "name": m["name"],
                "user_id": m["user_id"],
                "is_me": m["user_id"] == user['id'],
                "checked_in_today": bool(m_checkin),
                "tasks_done_today": len(m_checkin.get("tasks_done", [])) if m_checkin else 0,
                "mood_today": m_checkin.get("mood") if m_checkin else None,
            })
        team_info = {
            "team_id": team["id"],
            "invite_code": team["invite_code"],
            "members": team_members,
            "members_count": len(team_members),
        }

    # Enrich tasks with interactive types AND transform text to reference in-app features
    task_list = today_tasks.get("tasks", [])
    today_tasks["tasks"] = [transform_task_text(t) for t in task_list]
    today_tasks["interactive"] = enrich_tasks_interactive(today_tasks["tasks"], program.get("category", ""))
    # Also transform focus/mission
    if today_tasks.get("focus"):
        today_tasks["focus"] = transform_task_text(today_tasks["focus"])
    if today_tasks.get("mission"):
        today_tasks["mission"] = transform_task_text(today_tasks["mission"])
    if today_tasks.get("tip"):
        today_tasks["tip"] = transform_task_text(today_tasks["tip"])

    # Load saved task progress for today (auto-saved tasks)
    today_str_prog = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    task_progress = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str_prog}, {"_id": 0}
    )

    return {
        "active": True,
        "enrollment_id": enrollment["id"],
        "program": {
            "id": program["id"],
            "title": program["title"],
            "icon": program["icon"],
            "color": program["color"],
            "duration_days": program["duration_days"],
            "phases": program.get("phases", []),
        },
        "current_day": current_day,
        "current_phase": current_phase,
        "today_tasks": today_tasks,
        "today_checkin": today_checkin,
        "task_progress": task_progress,
        "streak": streak,
        "progress_pct": round((current_day / program["duration_days"]) * 100),
        "started_at": enrollment.get("started_at") or enrollment.get("start_date", ""),
        "team": team_info,
    }


@router.post("/programs/save-task")
async def save_task_progress(data: dict, user=Depends(get_current_user)):
    """Save individual task completion immediately (auto-save)."""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Aucun programme actif")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    task_index = data.get("task_index", -1)
    rating = data.get("rating", 0)
    notes = data.get("notes", {})

    existing = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )

    if existing:
        indices = existing.get("tasks_done_indices", [])
        if task_index >= 0 and task_index not in indices:
            indices.append(task_index)
        ratings = existing.get("task_ratings", {})
        if task_index >= 0 and rating > 0:
            ratings[str(task_index)] = rating
        all_notes = existing.get("notes", {})
        all_notes.update(notes)
        await db.program_task_progress.update_one(
            {"enrollment_id": enrollment["id"], "date": today_str},
            {"$set": {"tasks_done_indices": indices, "task_ratings": ratings, "notes": all_notes, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.program_task_progress.insert_one({
            "enrollment_id": enrollment["id"],
            "user_id": user['id'],
            "date": today_str,
            "day": enrollment.get("current_day", 1),
            "tasks_done_indices": [task_index] if task_index >= 0 else [],
            "task_ratings": {str(task_index): rating} if task_index >= 0 and rating > 0 else {},
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Emit team activity (skip for solo mode)
    if enrollment.get("mode") != "solo":
        task_detail = f"Action {task_index + 1} validee"
        await _emit_team_activity(user['id'], user.get('name', 'Membre'), enrollment["program_id"], "task_done", task_detail, "ri-check-line", "#10B981")

    return {"status": "saved"}



async def apply_onboarding_to_app(data: dict, user=Depends(get_current_user)):
    """Apply onboarding answers to app features (reminders, objectives, health data)."""
    onboarding = data.get("onboarding", {})
    program_id = data.get("program_id", "")
    actions_done = []

    # Bedtime → create reminder
    if onboarding.get("bedtime_current"):
        bedtime = onboarding["bedtime_current"]
        await db.reminders.update_one(
            {"user_id": user['id'], "type": "programme_coucher"},
            {"$set": {
                "id": str(uuid.uuid4()),
                "user_id": user['id'],
                "type": "programme_coucher",
                "title": "Heure de coucher programme",
                "message": f"Il est temps de commencer votre rituel du soir",
                "time": bedtime,
                "enabled": True,
                "days": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source": "programme",
                "program_id": program_id,
            }},
            upsert=True,
        )
        actions_done.append({"type": "reminder", "label": f"Rappel coucher a {bedtime}"})

    # Wake time → create wake reminder
    if onboarding.get("wake_time"):
        wake = onboarding["wake_time"]
        await db.reminders.update_one(
            {"user_id": user['id'], "type": "programme_reveil"},
            {"$set": {
                "id": str(uuid.uuid4()),
                "user_id": user['id'],
                "type": "programme_reveil",
                "title": "Reveil programme",
                "message": "Bonjour ! Pensez a vous exposer a la lumiere naturelle dans les 30 prochaines minutes",
                "time": wake,
                "enabled": True,
                "days": ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source": "programme",
                "program_id": program_id,
            }},
            upsert=True,
        )
        actions_done.append({"type": "reminder", "label": f"Rappel reveil a {wake}"})

    # Save onboarding data as health baseline
    if onboarding.get("sleep_quality") or onboarding.get("diet_quality"):
        await db.program_health_baselines.update_one(
            {"user_id": user['id'], "program_id": program_id},
            {"$set": {
                "user_id": user['id'],
                "program_id": program_id,
                "onboarding": onboarding,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        actions_done.append({"type": "baseline", "label": "Donnees initiales enregistrees"})

    return {"status": "ok", "actions": actions_done}


async def program_checkin(data: dict, user=Depends(get_current_user)):
    """Submit daily check-in for active program"""
    enrollment = await db.program_enrollments.find_one(
        {"user_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Aucun programme actif")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Merge with auto-saved task progress (using indices)
    saved_progress = await db.program_task_progress.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}, {"_id": 0}
    )
    submitted_indices = data.get("tasks_done_indices", [])
    if saved_progress:
        saved_indices = saved_progress.get("tasks_done_indices", [])
        merged_indices = list(set(submitted_indices + saved_indices))
    else:
        merged_indices = submitted_indices

    # Check if already checked in today
    existing = await db.program_checkins.find_one(
        {"enrollment_id": enrollment["id"], "date": today_str}
    )
    if existing:
        # Update existing
        await db.program_checkins.update_one(
            {"enrollment_id": enrollment["id"], "date": today_str},
            {"$set": {"mood": data.get("mood", 3), "note": data.get("note", ""), "tasks_done_indices": merged_indices, "sleep_quality": data.get("sleep_quality"), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": "updated"}

    checkin = {
        "id": str(uuid.uuid4()),
        "enrollment_id": enrollment["id"],
        "user_id": user['id'],
        "date": today_str,
        "day": enrollment.get("current_day", 1),
        "mood": data.get("mood", 3),
        "note": data.get("note", ""),
        "tasks_done_indices": merged_indices,
        "sleep_quality": data.get("sleep_quality"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.program_checkins.insert_one(checkin)

    # Update streak
    await db.program_enrollments.update_one(
        {"id": enrollment["id"]},
        {"$addToSet": {"completed_days": today_str}, "$inc": {"streak": 1}}
    )

    # Generate AI feedback
    feedback = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
            prompt = f"""L'utilisateur fait son check-in du jour {enrollment.get('current_day', 1)} du programme "{program.get('title', '')}".
Humeur: {data.get('mood', 3)}/5. Note: {data.get('note', 'aucune')}. Taches completees: {data.get('tasks_done', [])}.
Genere UNE phrase factuelle et medicalement pertinente (max 20 mots). Vouvoyez le patient. Pas d'emoji. Pas d'encouragement excessif."""
            chat = LlmChat(api_key=api_key, session_id=f"fb-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. 1 phrase courte, professionnelle. Pas d'emoji.").with_model("openai", "gpt-5.2")
            feedback = (await chat.send_message(UserMessage(text=prompt))).strip()
        except Exception as e:
            print(f"Checkin AI error: {e}")

    if not feedback:
        feedback = "Votre regularite est un facteur cle pour l'efficacite du programme."

    # Emit team activity for checkin
    mood_labels = {1: "Difficile", 2: "Bof", 3: "OK", 4: "Bien", 5: "Super"}
    mood_icons = {1: "ri-emotion-sad-line", 2: "ri-emotion-unhappy-line", 3: "ri-emotion-normal-line", 4: "ri-emotion-line", 5: "ri-emotion-happy-line"}
    mood_colors = {1: "#EF4444", 2: "#F59E0B", 3: "#FCD34D", 4: "#34D399", 5: "#10B981"}
    m = data.get("mood", 3)
    if enrollment.get("mode") != "solo":
        await _emit_team_activity(user['id'], user.get('name', 'Membre'), enrollment["program_id"], "checkin", f"Bilan du jour — Humeur : {mood_labels.get(m, 'OK')}", mood_icons.get(m, "ri-emotion-normal-line"), mood_colors.get(m, "#FCD34D"))

    return {"status": "created", "feedback": feedback}


@router.post("/programs/stop")
async def stop_program(user=Depends(get_current_user)):
    """Stop/abandon active program"""
    result = await db.program_enrollments.update_one(
        {"user_id": user['id'], "status": "active"},
        {"$set": {"status": "abandoned", "stopped_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Aucun programme actif")
    return {"status": "stopped"}


@router.get("/programs/completion-report/{enrollment_id}")
async def get_completion_report(enrollment_id: str, user=Depends(get_current_user)):
    """Generate a comprehensive before/after completion report with health data comparison"""
    enrollment = await db.program_enrollments.find_one(
        {"id": enrollment_id, "user_id": user['id']}, {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscription non trouvee")

    program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Programme non trouve")

    # Get all checkins for this enrollment
    checkins = await db.program_checkins.find(
        {"enrollment_id": enrollment_id}, {"_id": 0}
    ).sort("date", 1).to_list(100)

    total_days = program.get("duration_days", 21)
    completed_days = len(checkins)
    moods = [c.get("mood", 3) for c in checkins if c.get("mood")]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    best_mood = max(moods) if moods else 0
    streak = enrollment.get("streak", completed_days)

    # Mood evolution (first half vs second half)
    mid = len(moods) // 2
    first_half_mood = round(sum(moods[:mid]) / max(len(moods[:mid]), 1), 1) if moods else 0
    second_half_mood = round(sum(moods[mid:]) / max(len(moods[mid:]), 1), 1) if moods else 0

    # Before/After health data comparison
    snapshot_start = enrollment.get("health_snapshot_start", {})
    snapshot_end = await _capture_health_snapshot(user['id'])
    
    # Build health comparison
    tracked_metrics = program.get("tracked_metrics", [])
    health_comparison = []
    metric_labels = {
        "sleep_quality": {"label": "Qualite du sommeil", "unit": "%", "better": "higher"},
        "sleep_duration_min": {"label": "Duree du sommeil", "unit": "min", "better": "higher"},
        "deep_sleep_min": {"label": "Sommeil profond", "unit": "min", "better": "higher"},
        "heart_rate": {"label": "Frequence cardiaque", "unit": "bpm", "better": "lower"},
        "hrv": {"label": "Variabilite cardiaque", "unit": "ms", "better": "higher"},
        "stress_level": {"label": "Niveau de stress", "unit": "/100", "better": "lower"},
        "steps": {"label": "Pas quotidiens", "unit": "pas", "better": "higher"},
        "calories": {"label": "Calories", "unit": "kcal", "better": "higher"},
        "weight": {"label": "Poids", "unit": "kg", "better": "lower"},
        "body_fat_pct": {"label": "Masse grasse", "unit": "%", "better": "lower"},
        "muscle_pct": {"label": "Masse musculaire", "unit": "%", "better": "higher"},
        "blood_pressure": {"label": "Tension", "unit": "mmHg", "better": "lower"},
        "recovery_score": {"label": "Recuperation", "unit": "/100", "better": "higher"},
    }
    for mk in tracked_metrics:
        meta = metric_labels.get(mk, {"label": mk, "unit": "", "better": "higher"})
        before_val = snapshot_start.get(mk)
        after_val = snapshot_end.get(mk)
        if before_val is not None and after_val is not None:
            if isinstance(before_val, dict):
                continue  # Skip complex types like blood_pressure for now
            diff = round(after_val - before_val, 1)
            improved = (diff > 0 and meta["better"] == "higher") or (diff < 0 and meta["better"] == "lower")
            health_comparison.append({
                "metric": mk, "label": meta["label"], "unit": meta["unit"],
                "before": before_val, "after": after_val,
                "diff": diff, "improved": improved,
            })

    # Generate AI completion report
    ai_report = None
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json
            prompt = f"""L'utilisateur a termine le programme "{program.get('title', '')}".
Stats: {completed_days}/{total_days} jours completes, humeur moyenne {avg_mood}/5 (debut {first_half_mood}/5 -> fin {second_half_mood}/5), meilleur streak {streak} jours.
Notes des check-ins: {'; '.join(c.get('note', '') for c in checkins[-5:] if c.get('note'))}.
Genere un bilan medical de fin de programme en JSON. Ton professionnel, pas d'emoji, vouvoyez le patient:
{{"title": "titre sobre et factuel", "summary": "3-4 phrases de bilan medical objectif avec les resultats mesurables", "achievements": ["resultat 1", "resultat 2", "resultat 3"], "before_after": {{"mood": {{"before": {first_half_mood}, "after": {second_half_mood}}}, "regularity": {{"before": "debut", "after": "{completed_days} jours"}}}}, "next_steps": ["recommandation medicale 1", "recommandation 2"], "celebration": "phrase de conclusion professionnelle"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"cr-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. JSON uniquement. Pas d'emoji. Ton medical professionnel.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            ai_report = json.loads(r.strip())
        except Exception as e:
            print(f"Completion report AI err: {e}")

    if not ai_report:
        ai_report = {
            "title": "Programme termine !",
            "summary": f"Tu as complete {completed_days} jours sur {total_days}. Ta regularite est impressionnante !",
            "achievements": ["Programme suivi avec regularite", f"Humeur moyenne de {avg_mood}/5", f"Streak de {streak} jours"],
            "before_after": {"mood": {"before": first_half_mood, "after": second_half_mood}, "regularity": {"before": "debut", "after": f"{completed_days} jours"}},
            "next_steps": ["Continue tes bonnes habitudes", "Lance un nouveau programme"],
            "celebration": "Programme termine. Les habitudes acquises constituent une base solide pour votre sante.",
        }

    return {
        "enrollment": enrollment,
        "program": {"id": program["id"], "title": program["title"], "icon": program["icon"], "color": program["color"], "duration_days": total_days},
        "stats": {
            "completed_days": completed_days, "total_days": total_days,
            "completion_pct": round((completed_days / total_days) * 100),
            "avg_mood": avg_mood, "best_mood": best_mood, "streak": streak,
            "first_half_mood": first_half_mood, "second_half_mood": second_half_mood,
        },
        "report": ai_report,
        "health_comparison": health_comparison,
        "checkins": checkins,
    }



BADGE_DEFS = [
    {"id": "streak-3", "title": "3 jours", "icon": "ri-fire-line", "color": "#F59E0B", "condition": "streak >= 3", "description": "3 jours consecutifs"},
    {"id": "streak-7", "title": "1 semaine", "icon": "ri-fire-fill", "color": "#EF4444", "condition": "streak >= 7", "description": "7 jours consecutifs"},
    {"id": "streak-14", "title": "2 semaines", "icon": "ri-medal-line", "color": "#A78BFA", "condition": "streak >= 14", "description": "14 jours consecutifs"},
    {"id": "streak-21", "title": "Programme complet", "icon": "ri-trophy-line", "color": "#22D3EE", "condition": "streak >= 21", "description": "Programme termine !"},
    {"id": "first-checkin", "title": "Premier pas", "icon": "ri-footprint-line", "color": "#10B981", "condition": "total_checkins >= 1", "description": "Premier check-in"},
    {"id": "mood-5", "title": "Jour parfait", "icon": "ri-emotion-happy-line", "color": "#F59E0B", "condition": "had_mood_5", "description": "Humeur 5/5 atteinte"},
]


@router.get("/programs/badges")
async def get_badges(user=Depends(get_current_user)):
    """Get earned badges"""
    uid = user['id']
    checkins = await db.program_checkins.find({"user_id": uid}, {"_id": 0}).to_list(500)
    enrollments = await db.program_enrollments.find({"user_id": uid}, {"_id": 0}).to_list(50)

    total_checkins = len(checkins)
    max_streak = max((e.get("streak", 0) for e in enrollments), default=0)
    had_mood_5 = any(c.get("mood") == 5 for c in checkins)
    completed = any(e.get("status") == "completed" for e in enrollments)

    earned = []
    for b in BADGE_DEFS:
        cond = b["condition"]
        unlocked = False
        if "streak >= 21" in cond: unlocked = max_streak >= 21 or completed
        elif "streak >= 14" in cond: unlocked = max_streak >= 14
        elif "streak >= 7" in cond: unlocked = max_streak >= 7
        elif "streak >= 3" in cond: unlocked = max_streak >= 3
        elif "total_checkins >= 1" in cond: unlocked = total_checkins >= 1
        elif "had_mood_5" in cond: unlocked = had_mood_5
        earned.append({**{k: v for k, v in b.items() if k != "condition"}, "unlocked": unlocked})

    return {"badges": earned, "stats": {"total_checkins": total_checkins, "max_streak": max_streak, "programs_completed": sum(1 for e in enrollments if e.get("status") == "completed")}}


@router.get("/programs/weekly-report")
async def get_weekly_report(user=Depends(get_current_user)):
    """Generate AI-powered weekly health report"""
    uid = user['id']
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    # Get this week's and last week's check-ins
    this_week = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)
    last_week = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": two_weeks_ago.isoformat(), "$lt": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)

    # Stats
    this_moods = [c.get("mood", 3) for c in this_week if c.get("mood")]
    last_moods = [c.get("mood", 3) for c in last_week if c.get("mood")]
    avg_mood_this = round(sum(this_moods) / len(this_moods), 1) if this_moods else 0
    avg_mood_last = round(sum(last_moods) / len(last_moods), 1) if last_moods else 0
    checkins_this = len(this_week)
    checkins_last = len(last_week)

    # Active program info
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_info = ""
    if enrollment:
        program = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
        if program:
            program_info = f"Programme actif: {program['title']}, jour {enrollment.get('current_day', 1)}/{program['duration_days']}."

    # Health summary
    summary = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})
    health_info = f"Score sante: {summary.get('score', '?')}/100." if summary else ""

    # Generate AI report
    ai_report = None
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            prompt = f"""Genere un bilan hebdomadaire de sante en JSON. Ton medical, professionnel, pas d'emoji. Vouvoyez.
Donnees: {checkins_this} check-ins cette semaine (vs {checkins_last} la semaine derniere). Humeur moyenne: {avg_mood_this}/5 (vs {avg_mood_last}/5). {program_info} {health_info}
JSON: {{"title": "titre factuel du bilan", "summary": "2-3 phrases d'analyse medicale objective", "wins": ["point positif mesurable 1", "point positif 2"], "improvements": ["axe d'amelioration medical"], "next_week_goal": "objectif concret et mesurable pour la semaine prochaine", "motivation": "rappel professionnel sobre"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"wr-{uuid.uuid4().hex[:6]}",
                           system_message="Medecin. JSON uniquement. Pas d'emoji. Vouvoyez.").with_model("openai", "gpt-5.2")
            import json
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            ai_report = json.loads(r.strip())
        except Exception as e:
            print(f"Weekly report AI err: {e}")

    if not ai_report:
        ai_report = {
            "title": "Bilan de la semaine",
            "summary": f"Tu as fait {checkins_this} check-ins cette semaine. Continue comme ca !",
            "wins": ["Tu es regulier dans tes check-ins"],
            "improvements": ["Essaie de maintenir une humeur positive"],
            "next_week_goal": "Faire au moins 5 check-ins la semaine prochaine",
            "motivation": "Chaque jour compte !",
        }

    return {
        "report": ai_report,
        "stats": {
            "checkins_this_week": checkins_this,
            "checkins_last_week": checkins_last,
            "avg_mood_this_week": avg_mood_this,
            "avg_mood_last_week": avg_mood_last,
            "mood_trend": "up" if avg_mood_this > avg_mood_last else "down" if avg_mood_this < avg_mood_last else "stable",
        },
        "generated_at": now.isoformat(),
    }


# ═══════════════════════════════════════
#  PARTAGE BILAN + PROGRAMMES EN EQUIPE
# ═══════════════════════════════════════

@router.post("/programs/share-report")
async def share_weekly_report(user=Depends(get_current_user)):
    """Generate a shareable link for weekly health report"""
    uid = user['id']
    share_id = uuid.uuid4().hex[:12]
    # Get fresh weekly report data
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    checkins = await db.program_checkins.find(
        {"user_id": uid, "created_at": {"$gte": week_ago.isoformat()}}, {"_id": 0}
    ).to_list(50)
    moods = [c.get("mood", 3) for c in checkins if c.get("mood")]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_title = ""
    if enrollment:
        prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
        if prog: program_title = prog.get("title", "")
    summary = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})

    share_doc = {
        "id": share_id, "user_id": uid, "user_name": user.get("name", "Utilisateur"),
        "created_at": now.isoformat(), "expires_at": (now + timedelta(days=7)).isoformat(),
        "data": {
            "score": summary.get("score") if summary else None,
            "status": summary.get("status") if summary else None,
            "checkins_count": len(checkins), "avg_mood": avg_mood,
            "program_title": program_title,
            "current_day": enrollment.get("current_day") if enrollment else None,
        }
    }
    await db.shared_reports.insert_one(share_doc)
    return {"share_id": share_id, "share_url": f"/shared-report/{share_id}"}


@router.get("/programs/shared-report/{share_id}")
async def get_shared_report(share_id: str):
    """Public endpoint - get shared report (no auth required)"""
    report = await db.shared_reports.find_one({"id": share_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Rapport non trouve ou expire")
    # Check expiry
    try:
        expires = datetime.fromisoformat(report["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=410, detail="Ce rapport a expire")
    except (KeyError, ValueError):
        pass
    return report


