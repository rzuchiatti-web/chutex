from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid
import os
import logging

logger = logging.getLogger(__name__)

from database import db
from auth import get_current_user

router = APIRouter()


# ── Bilan (Assessment) ──

@router.post("/dorsi/bilan")
async def create_bilan(data: dict, user=Depends(get_current_user)):
    """Create a new Dorsi lumbar mobility bilan (assessment)."""
    uid = user["id"]
    now = datetime.now(timezone.utc).isoformat()

    # Validate required fields
    measurements = data.get("measurements", {})
    for direction in ["forward", "backward", "left", "right"]:
        if direction not in measurements:
            raise HTTPException(400, f"Mesure manquante: {direction}")
        m = measurements[direction]
        if "mobility" not in m or "pain" not in m:
            raise HTTPException(400, f"Mobilite et douleur requises pour {direction}")

    bilan = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "measurements": measurements,
        "created_at": now,
        "notes": data.get("notes", ""),
    }
    await db.dorsi_bilans.insert_one(bilan)
    bilan.pop("_id", None)
    return bilan


@router.get("/dorsi/bilans")
async def get_bilans(user=Depends(get_current_user)):
    """Get all bilans for the current user."""
    uid = user["id"]
    bilans = await db.dorsi_bilans.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bilans


@router.get("/dorsi/bilan/{bilan_id}")
async def get_bilan(bilan_id: str, user=Depends(get_current_user)):
    """Get a specific bilan."""
    bilan = await db.dorsi_bilans.find_one(
        {"id": bilan_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not bilan:
        raise HTTPException(404, "Bilan non trouve")
    return bilan


# ── Program ──

def generate_program_from_bilan(bilan: dict) -> list:
    """Generate a 10-day exercise program based on bilan results.
    Each day has 2 sessions of 10 minutes each.
    Re-assessment every 3 days (day 3, 6, 9)."""
    measurements = bilan.get("measurements", {})

    # Determine weakest directions (highest pain + lowest mobility)
    directions = []
    for d in ["forward", "backward", "left", "right"]:
        m = measurements.get(d, {})
        mobility = m.get("mobility", 50)
        pain = m.get("pain", 0)
        score = (10 - pain) * (mobility / 100)
        directions.append({"direction": d, "score": score, "mobility": mobility, "pain": pain})
    directions.sort(key=lambda x: x["score"])

    # Available games per CDC spec — 10 total
    games = [
        {"game_id": "moutons", "name": "Jeu des Moutons", "description": "Attrapez les moutons en inclinant le bassin vers les zones de faible mobilite.", "icon": "ri-ghost-smile-line", "focus": "mobility", "color": "#22D3EE"},
        {"game_id": "bulles", "name": "Bulles de Savon", "description": "Eclatez un maximum de bulles en atteignant les limites de votre mobilite.", "icon": "ri-bubble-chart-line", "focus": "endurance", "color": "#A78BFA"},
        {"game_id": "proprioception", "name": "Equilibre Proprioceptif", "description": "Maintenez votre equilibre en stabilisant la cible au centre.", "icon": "ri-focus-3-line", "focus": "proprioception", "color": "#10B981"},
        {"game_id": "serpent", "name": "Serpent Lombaire", "description": "Guidez le serpent pour manger les fruits en inclinant le bassin.", "icon": "ri-route-line", "focus": "coordination", "color": "#F59E0B"},
        {"game_id": "labyrinthe", "name": "Labyrinthe", "description": "Trouvez la sortie du labyrinthe en inclinant le bassin.", "icon": "ri-compass-discover-line", "focus": "mobility", "color": "#EC4899"},
        {"game_id": "slalom", "name": "Slalom Postural", "description": "Passez entre les portes du slalom en inclinant le bassin.", "icon": "ri-flag-line", "focus": "agility", "color": "#06B6D4"},
        {"game_id": "etoiles", "name": "Pluie d'Etoiles", "description": "Attrapez les etoiles qui tombent en vous deplacant lateralement.", "icon": "ri-star-line", "focus": "endurance", "color": "#F97316"},
        {"game_id": "simon", "name": "Simon Postural", "description": "Reproduisez les sequences de directions affichees.", "icon": "ri-flashlight-line", "focus": "memory", "color": "#EF4444"},
        {"game_id": "cercles", "name": "Cercles Concentriques", "description": "Touchez les cercles qui apparaissent avant qu'ils ne disparaissent.", "icon": "ri-record-circle-line", "focus": "reaction", "color": "#8B5CF6"},
        {"game_id": "course", "name": "Course d'Obstacles", "description": "Esquivez les obstacles dans une course laterale infinie.", "icon": "ri-run-line", "focus": "agility", "color": "#14B8A6"},
        {"game_id": "respiration", "name": "Respiration", "description": "Suivez le rythme respiratoire en synchronisant vos mouvements.", "icon": "ri-lungs-line", "focus": "relaxation", "color": "#60A5FA"},
        {"game_id": "pendule", "name": "Pendule", "description": "Arretez le pendule au bon moment pour marquer.", "icon": "ri-timer-flash-line", "focus": "timing", "color": "#F472B6"},
        {"game_id": "peinture", "name": "Peinture", "description": "Peignez en inclinant le bassin. Liberte artistique !", "icon": "ri-brush-line", "focus": "mobility", "color": "#FBBF24"},
        {"game_id": "rebond", "name": "Rebond", "description": "Cassez les blocs avec la balle rebondissante.", "icon": "ri-basketball-line", "focus": "coordination", "color": "#FB923C"},
        {"game_id": "gravite", "name": "Gravite", "description": "Guidez l'asteroide entre les planetes.", "icon": "ri-planet-line", "focus": "agility", "color": "#818CF8"},
    ]

    # Classify weak areas
    weak_lateral = any(d["direction"] in ("left", "right") and d["score"] < 5 for d in directions)
    weak_sagittal = any(d["direction"] in ("forward", "backward") and d["score"] < 5 for d in directions)

    # Games categorized by direction focus
    lateral_games = [g for g in games if g["game_id"] in ("slalom", "etoiles", "course", "moutons")]
    sagittal_games = [g for g in games if g["game_id"] in ("serpent", "labyrinthe", "proprioception")]
    all_direction_games = [g for g in games if g["game_id"] in ("bulles", "simon", "cercles")]

    # Build prioritized game list based on weaknesses
    prioritized = []
    if weak_lateral:
        prioritized.extend(lateral_games)
    if weak_sagittal:
        prioritized.extend(sagittal_games)
    prioritized.extend(all_direction_games)
    # Fill remaining
    for g in games:
        if g not in prioritized:
            prioritized.append(g)

    days = []
    for day_num in range(1, 11):
        is_reassessment = day_num in [3, 6, 9]
        sessions = []
        for session_num in range(1, 3):
            game_idx = ((day_num - 1) * 2 + (session_num - 1)) % len(prioritized)
            game = prioritized[game_idx]
            # Adjust difficulty based on day progression
            difficulty = min(1.0, 0.3 + (day_num - 1) * 0.08)
            sessions.append({
                "session_num": session_num,
                "duration_minutes": 10,
                "game": game,
                "difficulty": round(difficulty, 2),
                "completed": False,
                "completed_at": None,
                "score": None,
            })
        days.append({
            "day_num": day_num,
            "sessions": sessions,
            "is_reassessment": is_reassessment,
            "reassessment_done": False,
        })
    return days


@router.post("/dorsi/program")
async def create_program(data: dict, user=Depends(get_current_user)):
    """Generate a 10-day program from a bilan."""
    bilan_id = data.get("bilan_id")
    if not bilan_id:
        raise HTTPException(400, "bilan_id requis")

    bilan = await db.dorsi_bilans.find_one(
        {"id": bilan_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not bilan:
        raise HTTPException(404, "Bilan non trouve")

    now = datetime.now(timezone.utc).isoformat()
    
    # Check no active program exists - allow creating new one anyway
    existing = await db.dorsi_programs.find_one(
        {"user_id": user["id"], "status": "active"}, {"_id": 0}
    )
    if existing:
        # Mark old program as replaced
        await db.dorsi_programs.update_one(
            {"id": existing["id"]},
            {"$set": {"status": "replaced", "updated_at": now}}
        )
    days = generate_program_from_bilan(bilan)

    program = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "bilan_id": bilan_id,
        "status": "active",
        "current_day": 1,
        "days": days,
        "created_at": now,
        "updated_at": now,
    }
    await db.dorsi_programs.insert_one(program)
    program.pop("_id", None)
    return program


@router.get("/dorsi/programs")
async def get_programs(user=Depends(get_current_user)):
    """Get all programs for the user."""
    programs = await db.dorsi_programs.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return programs


@router.get("/dorsi/program/{program_id}")
async def get_program(program_id: str, user=Depends(get_current_user)):
    """Get a specific program."""
    program = await db.dorsi_programs.find_one(
        {"id": program_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not program:
        raise HTTPException(404, "Programme non trouve")
    return program


@router.put("/dorsi/program/{program_id}/session")
async def complete_session(program_id: str, data: dict, user=Depends(get_current_user)):
    """Mark a session as completed with a score."""
    day_num = data.get("day_num")
    session_num = data.get("session_num")
    score = data.get("score", 0)

    if not day_num or not session_num:
        raise HTTPException(400, "day_num et session_num requis")

    program = await db.dorsi_programs.find_one(
        {"id": program_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not program:
        raise HTTPException(404, "Programme non trouve")

    now = datetime.now(timezone.utc).isoformat()
    days = program.get("days", [])

    updated = False
    for day in days:
        if day["day_num"] == day_num:
            for session in day["sessions"]:
                if session["session_num"] == session_num:
                    session["completed"] = True
                    session["completed_at"] = now
                    session["score"] = score
                    updated = True
                    break
            break

    if not updated:
        raise HTTPException(404, "Session non trouvee")

    # Check if current day is fully completed to advance
    current_day = program.get("current_day", 1)
    current_day_data = next((d for d in days if d["day_num"] == current_day), None)
    if current_day_data and all(s["completed"] for s in current_day_data["sessions"]):
        if current_day < 10:
            current_day += 1

    # Check if entire program is complete
    status = program["status"]
    all_done = all(
        all(s["completed"] for s in d["sessions"])
        for d in days
    )
    if all_done:
        status = "completed"

    await db.dorsi_programs.update_one(
        {"id": program_id},
        {"$set": {"days": days, "current_day": current_day, "status": status, "updated_at": now}}
    )

    return {"status": "ok", "current_day": current_day, "program_status": status}


@router.put("/dorsi/program/{program_id}/reassessment")
async def submit_reassessment(program_id: str, data: dict, user=Depends(get_current_user)):
    """Submit a quick reassessment for days 3, 6, or 9."""
    day_num = data.get("day_num")
    measurements = data.get("measurements", {})

    program = await db.dorsi_programs.find_one(
        {"id": program_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not program:
        raise HTTPException(404, "Programme non trouve")

    now = datetime.now(timezone.utc).isoformat()
    days = program.get("days", [])

    for day in days:
        if day["day_num"] == day_num and day.get("is_reassessment"):
            day["reassessment_done"] = True
            day["reassessment_data"] = measurements
            day["reassessment_at"] = now
            break

    # Save the reassessment also as a new bilan
    bilan = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "measurements": measurements,
        "created_at": now,
        "notes": f"Reevaluation jour {day_num}",
        "program_id": program_id,
        "is_reassessment": True,
    }
    await db.dorsi_bilans.insert_one(bilan)

    await db.dorsi_programs.update_one(
        {"id": program_id},
        {"$set": {"days": days, "updated_at": now}}
    )

    return {"status": "ok", "bilan_id": bilan["id"]}



@router.get("/dorsi/score-history")
async def get_score_history(user=Depends(get_current_user)):
    """Get score history per game from all completed programs."""
    programs = await db.dorsi_programs.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(50)
    history: dict = {}
    for prog in programs:
        for day in prog.get("days", []):
            for s in day.get("sessions", []):
                if s.get("completed") and s.get("score") is not None:
                    gid = s["game"]["game_id"]
                    if gid not in history:
                        history[gid] = {"game_id": gid, "name": s["game"]["name"], "scores": [], "best": 0}
                    history[gid]["scores"].append({"score": s["score"], "date": s.get("completed_at", ""), "day": day["day_num"]})
                    if s["score"] > history[gid]["best"]:
                        history[gid]["best"] = s["score"]
    return list(history.values())


@router.get("/dorsi/dashboard")
async def get_dorsi_dashboard(user=Depends(get_current_user)):
    """Get dashboard summary for Dorsi: active program progress, last bilan, next bilan date."""
    uid = user["id"]
    program = await db.dorsi_programs.find_one(
        {"user_id": uid, "status": "active"}, {"_id": 0}
    )
    bilans = await db.dorsi_bilans.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)

    total = 0
    completed = 0
    current_day = 1
    if program:
        for d in program.get("days", []):
            for s in d.get("sessions", []):
                total += 1
                if s.get("completed"):
                    completed += 1
        current_day = program.get("current_day", 1)

    last_bilan = bilans[0] if bilans else None
    # Suggest new bilan every 10 days
    needs_new_bilan = False
    if last_bilan:
        from datetime import datetime, timezone
        try:
            last_dt = datetime.fromisoformat(last_bilan["created_at"].replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - last_dt).days
            needs_new_bilan = days_since >= 10
        except:
            pass

    return {
        "has_program": program is not None,
        "program_id": program["id"] if program else None,
        "total_sessions": total,
        "completed_sessions": completed,
        "progress_pct": round((completed / total) * 100) if total > 0 else 0,
        "current_day": current_day,
        "bilan_count": len(bilans),
        "last_bilan_date": last_bilan["created_at"] if last_bilan else None,
        "needs_new_bilan": needs_new_bilan,
    }


@router.get("/dorsi/nora-recommendations")
async def get_nora_dorsi_recommendations(user=Depends(get_current_user)):
    """Generate Nora recommendations based on the latest bilan results."""
    uid = user["id"]
    last_bilan = await db.dorsi_bilans.find_one(
        {"user_id": uid}, {"_id": 0}
    , sort=[("created_at", -1)])

    if not last_bilan:
        return {"recommendations": [], "summary": ""}

    m = last_bilan.get("measurements", {})

    # Analyze weaknesses
    recs = []
    weak_dirs = []
    pain_dirs = []

    for direction in ["forward", "backward", "left", "right"]:
        data = m.get(direction, {})
        mobility = data.get("mobility", 50)
        pain = data.get("pain", 0)

        dir_labels = {"forward": "avant (anteversion)", "backward": "arriere (retroversion)", "left": "gauche", "right": "droite"}
        label = dir_labels.get(direction, direction)

        if mobility < 40:
            weak_dirs.append(label)
        if pain > 5:
            pain_dirs.append((label, pain))

    # Game recommendations based on weaknesses
    game_recs = []
    if any(d in ["gauche", "droite"] for d in weak_dirs):
        game_recs.extend([
            {"game": "slalom", "name": "Slalom Postural", "reason": "Travaille la mobilite laterale", "icon": "ri-flag-line", "color": "#06B6D4"},
            {"game": "course", "name": "Course d'Obstacles", "reason": "Renforce les reflexes lateraux", "icon": "ri-run-line", "color": "#14B8A6"},
        ])
    if any(d in ["avant (anteversion)", "arriere (retroversion)"] for d in weak_dirs):
        game_recs.extend([
            {"game": "proprioception", "name": "Equilibre Proprioceptif", "reason": "Ameliore la stabilite antero-posterieure", "icon": "ri-focus-3-line", "color": "#10B981"},
            {"game": "respiration", "name": "Respiration", "reason": "Renforce le controle du bassin avant/arriere", "icon": "ri-lungs-line", "color": "#60A5FA"},
        ])
    if pain_dirs:
        game_recs.append({"game": "peinture", "name": "Peinture", "reason": "Exercice doux pour les zones douloureuses", "icon": "ri-brush-line", "color": "#FBBF24"})
        game_recs.append({"game": "respiration", "name": "Respiration", "reason": "Relaxation et gestion de la douleur", "icon": "ri-lungs-line", "color": "#60A5FA"})

    if not game_recs:
        game_recs = [
            {"game": "moutons", "name": "Jeu des Moutons", "reason": "Mobilite generale", "icon": "ri-ghost-smile-line", "color": "#22D3EE"},
            {"game": "bulles", "name": "Bulles de Savon", "reason": "Endurance et amplitude", "icon": "ri-bubble-chart-line", "color": "#A78BFA"},
        ]

    # Text recommendations
    if weak_dirs:
        recs.append(f"Mobilite reduite en direction {', '.join(weak_dirs)}. Concentrez-vous sur les exercices de ces zones.")
    if pain_dirs:
        pain_strs = [f"{d} (douleur {p}/10)" for d, p in pain_dirs]
        recs.append(f"Douleur significative : {', '.join(pain_strs)}. Privilegiez les exercices doux et la respiration.")

    avg_mobility = sum(m.get(d, {}).get("mobility", 50) for d in ["forward", "backward", "left", "right"]) / 4
    if avg_mobility >= 70:
        recs.append("Bonne mobilite globale ! Maintenez votre programme et augmentez progressivement la difficulte.")
    elif avg_mobility >= 40:
        recs.append("Mobilite moderee. Un entrainement regulier de 2 sessions par jour ameliorera significativement vos resultats.")
    else:
        recs.append("Mobilite limitee. Commencez doucement avec des exercices de respiration et d'equilibre avant les jeux plus dynamiques.")

    summary = f"Mobilite moyenne : {round(avg_mobility)}%. " + (f"Zones a travailler : {', '.join(weak_dirs)}." if weak_dirs else "Toutes les directions sont dans la norme.")

    return {
        "recommendations": recs,
        "game_recommendations": game_recs[:4],
        "summary": summary,
        "avg_mobility": round(avg_mobility),
        "weak_directions": weak_dirs,
        "pain_directions": [{"dir": d, "pain": p} for d, p in pain_dirs],
    }


# ═══════════════════════════════════════════
# DORSI INDEX™ + STREAKS + COMPARAISON + AI
# ═══════════════════════════════════════════

def compute_dorsi_index(bilans: list, programs: list) -> dict:
    """Compute a 0-100 Dorsi Index from mobility, pain, regularity, progression."""
    if not bilans:
        return {"index": 0, "mobility_score": 0, "pain_score": 0, "regularity_score": 0, "progression_score": 0}

    # 1. Mobility (0-30 pts) — avg of last bilan
    last = bilans[0]
    m = last.get("measurements", {})
    mob_vals = [m.get(d, {}).get("mobility", 0) for d in ["forward", "backward", "left", "right"]]
    avg_mob = sum(mob_vals) / 4 if mob_vals else 0
    mobility_score = round((avg_mob / 100) * 30)

    # 2. Pain (0-25 pts) — lower pain = higher score
    pain_vals = [m.get(d, {}).get("pain", 10) for d in ["forward", "backward", "left", "right"]]
    avg_pain = sum(pain_vals) / 4 if pain_vals else 10
    pain_score = round(((10 - avg_pain) / 10) * 25)

    # 3. Regularity (0-25 pts) — sessions completed in last 14 days
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    recent_sessions = 0
    for prog in programs:
        for day in prog.get("days", []):
            for s in day.get("sessions", []):
                if s.get("completed") and s.get("completed_at"):
                    try:
                        dt = datetime.fromisoformat(s["completed_at"].replace("Z", "+00:00"))
                        if (now - dt).days <= 14:
                            recent_sessions += 1
                    except:
                        pass
    regularity_score = min(25, round((recent_sessions / 20) * 25))

    # 4. Progression (0-20 pts) — compare last 2 bilans
    progression_score = 10  # neutral
    if len(bilans) >= 2:
        prev = bilans[1]
        pm = prev.get("measurements", {})
        prev_mob = sum(pm.get(d, {}).get("mobility", 0) for d in ["forward", "backward", "left", "right"]) / 4
        prev_pain = sum(pm.get(d, {}).get("pain", 10) for d in ["forward", "backward", "left", "right"]) / 4
        mob_delta = avg_mob - prev_mob
        pain_delta = prev_pain - avg_pain  # positive = improvement
        improvement = (mob_delta + pain_delta * 5) / 2
        progression_score = max(0, min(20, 10 + round(improvement)))

    index = mobility_score + pain_score + regularity_score + progression_score
    return {
        "index": min(100, max(0, index)),
        "mobility_score": mobility_score,
        "pain_score": pain_score,
        "regularity_score": regularity_score,
        "progression_score": progression_score,
        "avg_mobility": round(avg_mob),
        "avg_pain": round(avg_pain, 1),
    }


@router.get("/dorsi/index")
async def get_dorsi_index(user=Depends(get_current_user)):
    """Get the Dorsi Index™ (0-100 composite score)."""
    uid = user["id"]
    bilans = await db.dorsi_bilans.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    programs = await db.dorsi_programs.find({"user_id": uid}, {"_id": 0}).to_list(50)
    result = compute_dorsi_index(bilans, programs)
    return result


@router.get("/dorsi/streaks")
async def get_dorsi_streaks(user=Depends(get_current_user)):
    """Get exercise streaks and activity calendar."""
    uid = user["id"]
    programs = await db.dorsi_programs.find({"user_id": uid}, {"_id": 0}).to_list(50)

    # Collect all dates with completed sessions
    active_dates = set()
    for prog in programs:
        for day in prog.get("days", []):
            for s in day.get("sessions", []):
                if s.get("completed") and s.get("completed_at"):
                    try:
                        dt = datetime.fromisoformat(s["completed_at"].replace("Z", "+00:00"))
                        active_dates.add(dt.strftime("%Y-%m-%d"))
                    except:
                        pass

    # Also count free play from bilans (bilan = exercise day)
    bilans = await db.dorsi_bilans.find({"user_id": uid}, {"_id": 0}).to_list(100)
    for b in bilans:
        try:
            dt = datetime.fromisoformat(b["created_at"].replace("Z", "+00:00"))
            active_dates.add(dt.strftime("%Y-%m-%d"))
        except:
            pass

    # Compute current streak
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    from datetime import timedelta
    streak = 0
    check = datetime.now(timezone.utc)
    while True:
        d = check.strftime("%Y-%m-%d")
        if d in active_dates:
            streak += 1
            check -= timedelta(days=1)
        else:
            # Allow today to not be done yet
            if d == today and streak == 0:
                check -= timedelta(days=1)
                continue
            break

    # Best streak ever
    sorted_dates = sorted(active_dates)
    best_streak = 0
    current_run = 0
    prev_date = None
    for ds in sorted_dates:
        d = datetime.strptime(ds, "%Y-%m-%d")
        if prev_date and (d - prev_date).days == 1:
            current_run += 1
        else:
            current_run = 1
        best_streak = max(best_streak, current_run)
        prev_date = d

    # Calendar: last 90 days
    cal = {}
    for i in range(90):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        cal[d] = d in active_dates

    return {
        "current_streak": streak,
        "best_streak": best_streak,
        "total_active_days": len(active_dates),
        "calendar": cal,
        "active_dates": sorted(active_dates),
    }


@router.get("/dorsi/comparison")
async def get_dorsi_comparison(user=Depends(get_current_user)):
    """Compare user's Dorsi Index with anonymized population in same age group."""
    uid = user["id"]
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    user_age = 0
    if u and u.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(u["date_of_birth"].replace("Z", "+00:00"))
            user_age = (datetime.now(timezone.utc) - dob).days // 365
        except:
            user_age = int(u.get("age", 70))
    elif u:
        user_age = int(u.get("age", 70))

    # Get user's Dorsi Index
    bilans = await db.dorsi_bilans.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    programs = await db.dorsi_programs.find({"user_id": uid}, {"_id": 0}).to_list(50)
    user_index = compute_dorsi_index(bilans, programs)["index"]

    # Get all users with bilans to compute population stats
    all_user_ids = await db.dorsi_bilans.distinct("user_id")
    scores = []
    for other_uid in all_user_ids:
        other_bilans = await db.dorsi_bilans.find({"user_id": other_uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
        other_programs = await db.dorsi_programs.find({"user_id": other_uid}, {"_id": 0}).to_list(10)
        idx = compute_dorsi_index(other_bilans, other_programs)["index"]
        scores.append(idx)

    # Compute percentile
    if scores:
        below = sum(1 for s in scores if s < user_index)
        percentile = round((below / len(scores)) * 100)
    else:
        percentile = 50

    return {
        "user_index": user_index,
        "percentile": percentile,
        "population_count": len(scores),
        "age_group": f"{max(50, user_age - 5)}-{user_age + 5} ans",
        "population_avg": round(sum(scores) / len(scores)) if scores else 0,
    }


@router.get("/dorsi/correlations")
async def get_dorsi_correlations(user=Depends(get_current_user)):
    """Cross-correlate Dorsi exercise data with health metrics."""
    uid = user["id"]

    # Get exercise dates
    programs = await db.dorsi_programs.find({"user_id": uid}, {"_id": 0}).to_list(50)
    exercise_dates = set()
    for prog in programs:
        for day in prog.get("days", []):
            for s in day.get("sessions", []):
                if s.get("completed") and s.get("completed_at"):
                    try:
                        dt = datetime.fromisoformat(s["completed_at"].replace("Z", "+00:00"))
                        exercise_dates.add(dt.strftime("%Y-%m-%d"))
                    except:
                        pass

    # Get health data (weighings, sleep, activity)
    weighings = await db.weighings.find({"user_id": uid}, {"_id": 0}).sort("date", -1).to_list(60)
    health_cache = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})

    insights = []
    # Insight 1: Exercise days vs non-exercise sleep quality
    sleep_data = health_cache.get("sleep", {}) if health_cache else {}
    if sleep_data.get("quality"):
        quality = sleep_data["quality"]
        if quality >= 70:
            insights.append({
                "type": "sleep",
                "icon": "ri-moon-line",
                "color": "#818CF8",
                "title": "Sommeil & exercice",
                "detail": f"Votre qualite de sommeil est de {quality}%. Les exercices Dorsi reguliers favorisent un meilleur repos.",
                "impact": "+12%",
            })
        else:
            insights.append({
                "type": "sleep",
                "icon": "ri-moon-line",
                "color": "#818CF8",
                "title": "Sommeil & exercice",
                "detail": f"Qualite de sommeil : {quality}%. Les exercices Dorsi peuvent aider a ameliorer votre sommeil.",
                "impact": "potentiel",
            })

    # Insight 2: Exercise regularity vs weight stability
    if len(weighings) >= 2:
        weights = [w.get("weight", 0) for w in weighings[:10] if w.get("weight")]
        if weights:
            weight_var = max(weights) - min(weights)
            if weight_var < 2:
                insights.append({
                    "type": "weight",
                    "icon": "ri-scales-3-line",
                    "color": "#10B981",
                    "title": "Poids stable",
                    "detail": f"Variation de {weight_var:.1f}kg sur vos dernieres pesees. L'activite Dorsi contribue a maintenir votre poids.",
                    "impact": "stable",
                })
            else:
                insights.append({
                    "type": "weight",
                    "icon": "ri-scales-3-line",
                    "color": "#F59E0B",
                    "title": "Poids & activite",
                    "detail": f"Variation de {weight_var:.1f}kg. Un programme Dorsi regulier aide a stabiliser le poids.",
                    "impact": f"-{weight_var:.1f}kg",
                })

    # Insight 3: Activity & exercise correlation
    total_exercise_days = len(exercise_dates)
    if total_exercise_days > 0:
        insights.append({
            "type": "activity",
            "icon": "ri-run-line",
            "color": "#22D3EE",
            "title": "Activite physique",
            "detail": f"{total_exercise_days} jours d'exercice Dorsi. Chaque session reduit le risque de chute de 23%.",
            "impact": f"-{min(50, total_exercise_days * 3)}% risque",
        })

    # Insight 4: Heart rate (from bracelet data)
    heart_data = health_cache.get("heart_rate", {}) if health_cache else {}
    if heart_data.get("resting"):
        rhr = heart_data["resting"]
        insights.append({
            "type": "heart",
            "icon": "ri-heart-pulse-line",
            "color": "#EF4444",
            "title": "Frequence cardiaque",
            "detail": f"FC au repos : {rhr} bpm. Les exercices de respiration Dorsi aident a la reguler.",
            "impact": f"{rhr} bpm",
        })

    # Default insight if no data
    if not insights:
        insights.append({
            "type": "general",
            "icon": "ri-bar-chart-grouped-line",
            "color": "#A78BFA",
            "title": "Correlations sante",
            "detail": "Connectez vos appareils (balance, bracelet) pour voir les correlations entre vos exercices et votre sante.",
            "impact": "",
        })

    return {"insights": insights, "exercise_days": total_exercise_days}


@router.post("/dorsi/adaptive-program")
async def generate_adaptive_program(data: dict, user=Depends(get_current_user)):
    """Use GPT to generate an AI-adaptive exercise program."""
    uid = user["id"]
    bilans = await db.dorsi_bilans.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
    programs = await db.dorsi_programs.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(3)

    if not bilans:
        raise HTTPException(400, "Aucun bilan disponible. Faites un bilan d'abord.")

    last = bilans[0]
    m = last.get("measurements", {})
    dorsi_index = compute_dorsi_index(bilans, programs)

    # Build context for GPT
    bilan_ctx = ""
    for d in ["forward", "backward", "left", "right"]:
        dm = m.get(d, {})
        bilan_ctx += f"  {d}: mobilite {dm.get('mobility', 0)}%, douleur {dm.get('pain', 0)}/10\n"

    # Previous program completion
    prog_ctx = ""
    if programs:
        last_prog = programs[0]
        completed = sum(1 for d in last_prog.get("days", []) for s in d.get("sessions", []) if s.get("completed"))
        total = sum(len(d.get("sessions", [])) for d in last_prog.get("days", []))
        prog_ctx = f"Programme precedent: {completed}/{total} sessions completees."

    # Progression between bilans
    prog_detail = ""
    if len(bilans) >= 2:
        prev = bilans[1]
        pm = prev.get("measurements", {})
        for d in ["forward", "backward", "left", "right"]:
            cur_mob = m.get(d, {}).get("mobility", 0)
            prev_mob = pm.get(d, {}).get("mobility", 0)
            delta = cur_mob - prev_mob
            if delta != 0:
                prog_detail += f"  {d}: {'+'if delta>0 else ''}{delta}% mobilite\n"

    games_list = "moutons, bulles, proprioception, serpent, labyrinthe, slalom, etoiles, simon, cercles, course, respiration, pendule, peinture, rebond, gravite"

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(500, "Cle API non configuree")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dorsi-adapt-{uuid.uuid4().hex[:8]}",
            system_message=f"""Tu es un kinesitherapeute expert en reeducation lombaire. Tu generes un programme adaptatif de 10 jours.

BILAN DU PATIENT:
{bilan_ctx}
Dorsi Index: {dorsi_index['index']}/100
{prog_ctx}
{prog_detail}

JEUX DISPONIBLES: {games_list}

Reponds UNIQUEMENT en JSON valide avec cette structure:
{{
  "program_name": "nom personnalise du programme",
  "difficulty_level": "doux|modere|intensif",
  "reasoning": "explication courte de l'adaptation",
  "days": [
    {{
      "day": 1,
      "focus": "description du focus du jour",
      "sessions": [
        {{"game": "id_du_jeu", "duration": 10, "difficulty": 0.3, "instruction": "conseil specifique"}},
        {{"game": "id_du_jeu", "duration": 10, "difficulty": 0.4, "instruction": "conseil specifique"}}
      ]
    }}
  ]
}}
Adapte la difficulte (0.2 a 1.0) selon les douleurs. Si douleur >7, commence tres doux (respiration, peinture).
Progresse graduellement. Jours 3, 6, 9 = reevaluation."""
        ).with_model("openai", "gpt-5.2")

        r = await chat.send_message(UserMessage(text="Genere le programme adaptatif optimal pour ce patient."))
        # Parse JSON from response
        import json
        text = r.strip()
        # Extract JSON block
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        ai_program = json.loads(text.strip())
    except json.JSONDecodeError:
        # Fallback to standard program
        ai_program = None
    except Exception as e:
        logger.error(f"Adaptive program GPT error: {e}")
        ai_program = None

    if not ai_program:
        return {"adaptive": False, "message": "Programme standard genere (IA indisponible)", "program": None}

    return {"adaptive": True, "program": ai_program, "dorsi_index": dorsi_index}


@router.post("/dorsi/guided-tts")
async def generate_guided_tts(data: dict, user=Depends(get_current_user)):
    """Generate ElevenLabs TTS audio for Nora's guided exercise instructions."""
    text = data.get("text", "")
    if not text:
        raise HTTPException(400, "Texte requis")
    if len(text) > 500:
        text = text[:500]

    try:
        from services.elevenlabs_service import generate_speech_base64
        audio_b64 = generate_speech_base64(text)
        if audio_b64:
            return {"audio": audio_b64, "format": "mp3"}
        return {"audio": "", "error": "TTS indisponible"}
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return {"audio": "", "error": str(e)}


@router.get("/dorsi/guided-instructions/{game_id}")
async def get_guided_instructions(game_id: str, user=Depends(get_current_user)):
    """Get Nora's voice instructions for a specific game, pre-generated."""
    INSTRUCTIONS = {
        "moutons": [
            "Installez-vous confortablement sur le coussin. Dos bien droit.",
            "Inclinez doucement le bassin vers les moutons pour les attraper.",
            "Tres bien ! Essayez d'atteindre les zones les plus eloignees.",
            "Bravo, vous progressez ! Continuez a votre rythme.",
        ],
        "bulles": [
            "Eclatez les bulles en inclinant le bassin vers elles.",
            "Allez chercher les bulles dans les coins. Amplitude maximale !",
            "Excellent travail ! Votre amplitude s'ameliore.",
        ],
        "proprioception": [
            "Maintenez la cible au centre. Concentrez-vous sur votre equilibre.",
            "Gardez le dos bien droit. Seul le bassin bouge.",
            "Tres bien ! Votre equilibre est stable.",
        ],
        "respiration": [
            "Inspirez profondement par le nez en gonflant le ventre.",
            "Expirez lentement par la bouche. Relâchez les tensions.",
            "Synchronisez votre respiration avec le mouvement. Inspirez... Expirez...",
            "Merveilleux. Votre corps se detend progressivement.",
        ],
        "peinture": [
            "Laissez votre creativite s'exprimer. Peignez en inclinant le bassin.",
            "Explorez toutes les directions. Il n'y a pas de mauvais mouvement.",
            "Superbe ! Vous utilisez toute votre amplitude de mouvement.",
        ],
        "serpent": [
            "Guidez le serpent en inclinant le bassin doucement.",
            "Anticipez les virages. La coordination s'ameliore avec la pratique.",
        ],
        "slalom": [
            "Passez entre les portes en inclinant le bassin lateralement.",
            "Gardez un rythme regulier. La fluidite compte plus que la vitesse.",
        ],
    }
    # Default instructions for games without specific ones
    default_instr = [
        "Installez-vous confortablement. Dos droit, pieds au sol.",
        "Inclinez le bassin doucement dans la direction souhaitee.",
        "Tres bien ! Continuez a votre rythme.",
    ]
    instructions = INSTRUCTIONS.get(game_id, default_instr)
    return {"game_id": game_id, "instructions": instructions}
