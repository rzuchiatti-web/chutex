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

    # Available games
    games = [
        {
            "game_id": "dodge",
            "name": "Esquive Lombaire",
            "description": "Esquivez les obstacles en inclinant le bassin a gauche et a droite.",
            "icon": "ri-ghost-line",
            "directions": ["left", "right"],
            "color": "#22D3EE",
        },
        {
            "game_id": "balance",
            "name": "Equilibre Dorsal",
            "description": "Maintenez la bille au centre en equilibrant votre bassin dans toutes les directions.",
            "icon": "ri-focus-3-line",
            "directions": ["forward", "backward", "left", "right"],
            "color": "#A78BFA",
        },
        {
            "game_id": "target",
            "name": "Cible Posturale",
            "description": "Atteignez les cibles en inclinant le bassin dans la direction indiquee.",
            "icon": "ri-crosshair-2-line",
            "directions": ["forward", "backward", "left", "right"],
            "color": "#10B981",
        },
    ]

    days = []
    for day_num in range(1, 11):
        is_reassessment = day_num in [3, 6, 9]
        sessions = []
        for session_num in range(1, 3):
            # Rotate through games
            game_idx = ((day_num - 1) * 2 + (session_num - 1)) % len(games)
            game = games[game_idx]
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

    # Check no active program exists
    existing = await db.dorsi_programs.find_one(
        {"user_id": user["id"], "status": "active"}, {"_id": 0}
    )
    if existing:
        raise HTTPException(400, "Un programme actif existe deja. Terminez-le d'abord.")

    now = datetime.now(timezone.utc).isoformat()
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
