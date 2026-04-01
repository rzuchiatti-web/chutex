"""
Nora AI Action Executors
Handles nutrition and exercise actions triggered by Nora's chat responses.
"""
from datetime import datetime, timezone
from database import db
import uuid


async def check_weight_goal(uid: str) -> dict:
    """Check if user has an active weight goal."""
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
    if goal and goal.get("target_kg"):
        return {
            "has_goal": True,
            "target_kg": goal["target_kg"],
            "weeks": goal.get("weeks", 12),
            "created_at": goal.get("created_at", ""),
        }
    return {"has_goal": False}


async def update_daily_calories(uid: str, daily_calories: int, macros: dict = None) -> dict:
    """Update daily calorie target and optionally macros. Only if no weight goal active."""
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
    if goal and goal.get("target_kg"):
        return {
            "success": False,
            "reason": "objectif_poids_actif",
            "message": "Impossible de modifier les calories : un objectif de poids est en cours.",
        }

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    update_fields = {"daily_calories": daily_calories}
    if macros:
        update_fields["macros"] = macros

    # Update today's cache
    existing = await db.minceur_daily_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )
    if existing and existing.get("recommendations"):
        recs = existing["recommendations"]
        recs["daily_calories"] = daily_calories
        if macros:
            recs["macros"] = macros
        await db.minceur_daily_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {"recommendations": recs}}
        )
    else:
        default_macros = macros or {
            "proteines_g": int(daily_calories * 0.2 / 4),
            "glucides_g": int(daily_calories * 0.5 / 4),
            "lipides_g": int(daily_calories * 0.3 / 9),
        }
        await db.minceur_daily_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {
                "user_id": uid,
                "date": today_str,
                "recommendations": {
                    "daily_calories": daily_calories,
                    "macros": default_macros,
                    "nora_adjusted": True,
                    "adjusted_at": datetime.now(timezone.utc).isoformat(),
                },
            }},
            upsert=True,
        )

    return {
        "success": True,
        "daily_calories": daily_calories,
        "macros": macros or update_fields.get("macros"),
    }


async def adjust_macros(uid: str, proteines_g: int = None, glucides_g: int = None, lipides_g: int = None) -> dict:
    """Adjust individual macros. Only if no weight goal active."""
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
    if goal and goal.get("target_kg"):
        return {
            "success": False,
            "reason": "objectif_poids_actif",
            "message": "Impossible de modifier les macros : un objectif de poids est en cours.",
        }

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.minceur_daily_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )

    current_macros = {}
    if existing and existing.get("recommendations", {}).get("macros"):
        current_macros = existing["recommendations"]["macros"]

    new_macros = {
        "proteines_g": proteines_g if proteines_g is not None else current_macros.get("proteines_g", 65),
        "glucides_g": glucides_g if glucides_g is not None else current_macros.get("glucides_g", 200),
        "lipides_g": lipides_g if lipides_g is not None else current_macros.get("lipides_g", 55),
    }

    if existing and existing.get("recommendations"):
        recs = existing["recommendations"]
        recs["macros"] = new_macros
        await db.minceur_daily_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {"recommendations": recs}}
        )
    else:
        await db.minceur_daily_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {
                "user_id": uid,
                "date": today_str,
                "recommendations": {
                    "macros": new_macros,
                    "nora_adjusted": True,
                    "adjusted_at": datetime.now(timezone.utc).isoformat(),
                },
            }},
            upsert=True,
        )

    return {"success": True, "macros": new_macros}


async def list_exercise_library(uid: str) -> dict:
    """List available exercises from the user's library."""
    linked = await db.users.find(
        {"beneficiaries": uid, "role": {"$in": ["guardian", "professional"]}},
        {"_id": 0, "id": 1}
    ).to_list(50)
    guardian_ids = [g["id"] for g in linked]

    templates = []
    if guardian_ids:
        templates = await db.pro_exercise_templates.find(
            {"professional_id": {"$in": guardian_ids}}, {"_id": 0}
        ).sort("title", 1).to_list(200)
    if not templates:
        templates = await db.pro_exercise_templates.find(
            {}, {"_id": 0}
        ).sort("title", 1).to_list(200)
        seen = set()
        unique = []
        for t in templates:
            if t.get("title") not in seen:
                seen.add(t.get("title"))
                unique.append(t)
        templates = unique

    exercises = [
        {
            "id": t.get("id", ""),
            "title": t.get("title", ""),
            "category": t.get("category", ""),
            "muscle_group": t.get("muscle_group", ""),
        }
        for t in templates[:30]
    ]
    return {"exercises": exercises, "count": len(exercises)}


async def add_exercise(uid: str, user: dict, exercise_info: dict) -> dict:
    """
    Add an exercise for the beneficiary. Can use template_id or create custom.
    NEVER removes exercises prescribed by guardians.
    """
    now = datetime.now(timezone.utc).isoformat()
    tpl_id = exercise_info.get("template_id", "")
    days = exercise_info.get("days", ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"])

    if tpl_id and tpl_id != "__custom__":
        tpl = await db.pro_exercise_templates.find_one({"id": tpl_id}, {"_id": 0})
        if not tpl:
            return {"success": False, "message": "Template d'exercice non trouve."}
        assignment = {
            "id": str(uuid.uuid4()),
            "professional_id": uid,
            "professional_name": "Nora (IA)",
            "beneficiary_id": uid,
            "exercise_template_id": tpl_id,
            "title": tpl.get("title", ""),
            "category": tpl.get("category", ""),
            "image": tpl.get("image", ""),
            "icon": tpl.get("icon", "ri-run-line"),
            "sets": exercise_info.get("sets", tpl.get("sets", 3)),
            "repetitions": exercise_info.get("repetitions", tpl.get("repetitions", 12)),
            "rest_seconds": exercise_info.get("rest_seconds", tpl.get("rest_seconds", 60)),
            "days": days,
            "completions": [],
            "status": "active",
            "self_assigned": True,
            "nora_assigned": True,
            "created_at": now,
        }
    else:
        title = exercise_info.get("title", "Exercice recommande par Nora")
        assignment = {
            "id": str(uuid.uuid4()),
            "professional_id": uid,
            "professional_name": "Nora (IA)",
            "beneficiary_id": uid,
            "exercise_template_id": "",
            "title": title,
            "category": exercise_info.get("category", "general"),
            "image": "",
            "icon": "ri-run-line",
            "sets": exercise_info.get("sets", 3),
            "repetitions": exercise_info.get("repetitions", 12),
            "rest_seconds": exercise_info.get("rest_seconds", 60),
            "equipment": exercise_info.get("equipment", ""),
            "muscle_group": exercise_info.get("muscle_group", ""),
            "description": exercise_info.get("description", ""),
            "days": days,
            "completions": [],
            "status": "active",
            "self_assigned": True,
            "nora_assigned": True,
            "created_at": now,
        }

    await db.pro_assigned_exercises.insert_one(assignment)
    assignment.pop("_id", None)
    return {
        "success": True,
        "exercise_id": assignment["id"],
        "title": assignment["title"],
        "sets": assignment["sets"],
        "repetitions": assignment["repetitions"],
    }


# ── Action registry ──
NORA_ACTIONS = {
    "CHECK_WEIGHT_GOAL": {
        "handler": check_weight_goal,
        "needs_user": False,
    },
    "UPDATE_CALORIES": {
        "handler": update_daily_calories,
        "needs_user": False,
    },
    "ADJUST_MACROS": {
        "handler": adjust_macros,
        "needs_user": False,
    },
    "LIST_EXERCISES": {
        "handler": list_exercise_library,
        "needs_user": False,
    },
    "ADD_EXERCISE": {
        "handler": add_exercise,
        "needs_user": True,
    },
}
