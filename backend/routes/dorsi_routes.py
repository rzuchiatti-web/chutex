from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

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
