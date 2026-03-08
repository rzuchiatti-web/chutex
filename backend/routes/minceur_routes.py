from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid, os, json, logging, math

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, is_male: bool) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation."""
    if is_male:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def validate_weight_goal(current_kg: float, target_kg: float, days: int) -> dict:
    """Validate if weight loss goal is realistic. Returns recommendation."""
    diff = current_kg - target_kg
    if diff <= 0:
        return {"valid": False, "reason": "Le poids cible doit etre inferieur au poids actuel."}
    weeks = days / 7
    kg_per_week = diff / weeks if weeks > 0 else 99

    if kg_per_week > 1.0:
        # Too aggressive — recommend safe pace
        safe_weeks = math.ceil(diff / 0.7)
        safe_days = safe_weeks * 7
        return {
            "valid": False,
            "reason": f"Perdre {diff:.1f}kg en {days} jours ({kg_per_week:.1f}kg/sem) est trop rapide. Maximum recommande: 0.7kg/semaine.",
            "recommended_days": safe_days,
            "recommended_weeks": safe_weeks,
            "kg_per_week": round(kg_per_week, 1),
        }
    if kg_per_week < 0.2:
        return {
            "valid": True,
            "note": "Objectif tres progressif. Vous pouvez raccourcir la duree si vous le souhaitez.",
            "kg_per_week": round(kg_per_week, 1),
        }
    return {"valid": True, "kg_per_week": round(kg_per_week, 1)}


@router.post("/minceur/create")
async def create_minceur_program(data: dict, user=Depends(get_current_user)):
    """Create a personalized weight loss program."""
    uid = user["id"]
    target_kg = data.get("target_kg", 0)
    days = data.get("days", 90)

    # Get current weight from last scale reading
    last_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    current_kg = data.get("current_kg", 0) or (last_reading.get("weight", 0) if last_reading else 0)
    if current_kg <= 0:
        raise HTTPException(400, "Poids actuel requis. Pesez-vous d'abord.")
    if target_kg <= 0 or target_kg >= current_kg:
        raise HTTPException(400, "Poids cible invalide.")

    # Validate goal
    validation = validate_weight_goal(current_kg, target_kg, days)
    if not validation.get("valid"):
        if validation.get("recommended_days"):
            # Auto-correct to recommended duration
            days = validation["recommended_days"]
        else:
            raise HTTPException(400, validation.get("reason", "Objectif non valide."))

    # User profile
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    height_cm = u.get("height_cm", 170)
    age = 65
    if u.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(u["date_of_birth"].replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - dob).days // 365
        except:
            pass
    is_male = u.get("gender", "").lower() in ("m", "male", "homme", "masculin")

    # Calculate calorie targets
    bmr = mifflin_st_jeor(current_kg, height_cm, age, is_male)
    tdee = bmr * 1.3  # Light activity multiplier for elderly
    diff_kg = current_kg - target_kg
    weeks = days / 7
    kg_per_week = diff_kg / weeks
    # 1kg fat = ~7700 kcal, so daily deficit = (kg_per_week * 7700) / 7
    daily_deficit = (kg_per_week * 7700) / 7
    daily_calories = max(1200, round(tdee - daily_deficit))  # Never below 1200

    now = datetime.now(timezone.utc).isoformat()

    # Mark any existing active program as replaced
    await db.minceur_programs.update_many(
        {"user_id": uid, "status": "active"},
        {"$set": {"status": "replaced", "updated_at": now}}
    )

    # Generate AI daily tips
    daily_tip = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(
                api_key=api_key,
                session_id=f"minceur-{uuid.uuid4().hex[:6]}",
                system_message="Nutritionniste expert. JSON. Pas d'emoji. Vouvoiement."
            ).with_model("openai", "gpt-5.2")
            r = await chat.send_message(UserMessage(text=f"""Patient: {current_kg}kg, objectif {target_kg}kg en {days} jours ({kg_per_week:.1f}kg/sem).
Age {age} ans, {height_cm}cm, {'homme' if is_male else 'femme'}. BMR={bmr:.0f}kcal, objectif {daily_calories}kcal/jour.
JSON: {{"tip": "1 conseil nutritionnel personnalise pour demarrer", "meal_plan": "suggestion repas type d'une journee en 3 lignes max", "warning": "mise en garde si necessaire ou vide"}}"""))
            text = r.strip()
            if "```json" in text: text = text.split("```json")[1].split("```")[0]
            elif "```" in text: text = text.split("```")[1].split("```")[0]
            daily_tip = json.loads(text.strip())
        except Exception as e:
            logger.error(f"Minceur AI tip error: {e}")

    program = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "status": "active",
        "current_kg": current_kg,
        "target_kg": target_kg,
        "days": days,
        "start_date": now,
        "end_date": (datetime.now(timezone.utc) + timedelta(days=days)).isoformat(),
        "kg_per_week": round(kg_per_week, 2),
        "bmr": round(bmr),
        "tdee": round(tdee),
        "daily_calories": daily_calories,
        "daily_deficit": round(daily_deficit),
        "height_cm": height_cm,
        "age": age,
        "is_male": is_male,
        "weigh_ins": [{"date": now, "weight": current_kg, "note": "Debut du programme"}],
        "ai_tip": daily_tip or {},
        "created_at": now,
        "updated_at": now,
        "validation": validation,
    }
    await db.minceur_programs.insert_one(program)
    program.pop("_id", None)
    return program


@router.get("/minceur/active")
async def get_active_minceur(user=Depends(get_current_user)):
    """Get the active weight loss program."""
    uid = user["id"]
    prog = await db.minceur_programs.find_one(
        {"user_id": uid, "status": "active"}, {"_id": 0}
    )
    if not prog:
        return {"active": False}

    # Compute progress
    weigh_ins = prog.get("weigh_ins", [])
    current = weigh_ins[-1]["weight"] if weigh_ins else prog["current_kg"]
    lost = prog["current_kg"] - current
    total_to_lose = prog["current_kg"] - prog["target_kg"]
    progress_pct = min(100, round((lost / total_to_lose) * 100)) if total_to_lose > 0 else 0

    # Days elapsed
    try:
        start = datetime.fromisoformat(prog["start_date"].replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - start).days
    except:
        elapsed = 0

    # Daily tasks
    tasks = [
        {"icon": "ri-restaurant-line", "label": f"Objectif calorique", "value": f"{prog['daily_calories']} kcal", "color": "#F59E0B"},
        {"icon": "ri-drop-line", "label": "Hydratation", "value": "1.5L d'eau minimum", "color": "#60A5FA"},
        {"icon": "ri-walk-line", "label": "Activite", "value": "30 min de marche", "color": "#10B981"},
        {"icon": "ri-scales-3-line", "label": "Pesee", "value": "Se peser le matin a jeun", "color": "#A78BFA"},
    ]

    prog["progress"] = {
        "current_kg": current,
        "lost_kg": round(lost, 1),
        "progress_pct": progress_pct,
        "days_elapsed": elapsed,
        "days_remaining": max(0, prog["days"] - elapsed),
    }
    prog["daily_tasks"] = tasks
    prog["active"] = True
    return prog


@router.post("/minceur/weigh-in")
async def add_weigh_in(data: dict, user=Depends(get_current_user)):
    """Add a new weigh-in to the active program."""
    uid = user["id"]
    weight = data.get("weight", 0)
    if weight <= 0:
        raise HTTPException(400, "Poids requis.")

    prog = await db.minceur_programs.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not prog:
        raise HTTPException(404, "Aucun programme minceur actif.")

    now = datetime.now(timezone.utc).isoformat()
    weigh_in = {"date": now, "weight": weight, "note": data.get("note", "")}

    await db.minceur_programs.update_one(
        {"id": prog["id"]},
        {"$push": {"weigh_ins": weigh_in}, "$set": {"updated_at": now}}
    )

    # Check if goal reached
    if weight <= prog["target_kg"]:
        await db.minceur_programs.update_one(
            {"id": prog["id"]},
            {"$set": {"status": "completed", "updated_at": now}}
        )
        return {"status": "completed", "message": "Felicitations ! Objectif atteint !"}

    lost = prog["current_kg"] - weight
    return {"status": "ok", "weight": weight, "lost_total": round(lost, 1)}


@router.get("/minceur/daily-tip")
async def get_daily_tip(user=Depends(get_current_user)):
    """Get a personalized daily nutrition tip from Nora."""
    uid = user["id"]
    prog = await db.minceur_programs.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not prog:
        return {"tip": "", "meal_plan": ""}

    weigh_ins = prog.get("weigh_ins", [])
    current = weigh_ins[-1]["weight"] if weigh_ins else prog["current_kg"]
    lost = prog["current_kg"] - current
    days_elapsed = 0
    try:
        start = datetime.fromisoformat(prog["start_date"].replace("Z", "+00:00"))
        days_elapsed = (datetime.now(timezone.utc) - start).days
    except:
        pass

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return {"tip": "Buvez au moins 1.5L d'eau aujourd'hui.", "meal_plan": ""}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"minceur-tip-{uuid.uuid4().hex[:6]}",
            system_message="Nutritionniste expert sante senior. Pas d'emoji. Vouvoiement. JSON."
        ).with_model("openai", "gpt-5.2")

        r = await chat.send_message(UserMessage(text=f"""Programme minceur jour {days_elapsed}: {current}kg (depart {prog['current_kg']}kg, objectif {prog['target_kg']}kg). Perdu {lost:.1f}kg.
Objectif {prog['daily_calories']}kcal/jour. Age {prog.get('age',65)} ans.
JSON: {{"tip": "conseil du jour adapte a la progression (2 phrases)", "meal_plan": "suggestion repas (petit-dej / dejeuner / diner) en 3 lignes courtes"}}"""))
        text = r.strip()
        if "```json" in text: text = text.split("```json")[1].split("```")[0]
        elif "```" in text: text = text.split("```")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(f"Minceur daily tip error: {e}")
        return {"tip": f"Jour {days_elapsed}: Restez a {prog['daily_calories']}kcal. Buvez de l'eau.", "meal_plan": ""}


@router.post("/minceur/validate-goal")
async def validate_goal(data: dict, user=Depends(get_current_user)):
    """Pre-validate a weight loss goal before creating the program."""
    current_kg = data.get("current_kg", 0)
    target_kg = data.get("target_kg", 0)
    days = data.get("days", 90)

    if current_kg <= 0 or target_kg <= 0:
        raise HTTPException(400, "Poids requis.")
    if target_kg >= current_kg:
        raise HTTPException(400, "Le poids cible doit etre inferieur au poids actuel.")

    validation = validate_weight_goal(current_kg, target_kg, days)

    # Also compute what the calorie target would be
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    height_cm = u.get("height_cm", 170)
    age = 65
    if u.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(u["date_of_birth"].replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - dob).days // 365
        except:
            pass
    is_male = u.get("gender", "").lower() in ("m", "male", "homme", "masculin")
    bmr = mifflin_st_jeor(current_kg, height_cm, age, is_male)
    tdee = bmr * 1.3

    final_days = validation.get("recommended_days", days) if not validation.get("valid") else days
    weeks = final_days / 7
    kg_per_week = (current_kg - target_kg) / weeks if weeks > 0 else 0
    daily_deficit = (kg_per_week * 7700) / 7
    daily_calories = max(1200, round(tdee - daily_deficit))

    return {
        **validation,
        "daily_calories": daily_calories,
        "bmr": round(bmr),
        "tdee": round(tdee),
        "daily_deficit": round(daily_deficit),
        "final_days": final_days,
    }
