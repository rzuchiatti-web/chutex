from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid, os, json, logging, math

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def mifflin_st_jeor(weight_kg: float, height_cm: float, age: int, is_male: bool) -> float:
    if is_male:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def calc_bmi(weight_kg: float, height_cm: float) -> float:
    if height_cm <= 0:
        return 0
    h_m = height_cm / 100
    return round(weight_kg / (h_m * h_m), 1)


def bmi_category(bmi: float) -> dict:
    if bmi < 18.5:
        return {"label": "Insuffisance ponderale", "color": "#60A5FA", "level": "low"}
    elif bmi < 25:
        return {"label": "Poids normal", "color": "#10B981", "level": "normal"}
    elif bmi < 30:
        return {"label": "Surpoids", "color": "#F59E0B", "level": "high"}
    elif bmi < 35:
        return {"label": "Obesite moderee", "color": "#F97316", "level": "very_high"}
    else:
        return {"label": "Obesite severe", "color": "#EF4444", "level": "severe"}


def parse_age(date_of_birth: str) -> int:
    if not date_of_birth:
        return 70
    try:
        dob = datetime.fromisoformat(date_of_birth.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dob).days // 365
    except Exception:
        return 70


async def get_weight_history(user_id: str) -> list:
    """Get weight history from device_readings (scale), filtering out outliers"""
    readings = await db.device_readings.find(
        {"user_id": user_id, "device_type": "scale"},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(60)

    history = []
    for r in readings:
        data = r.get("data", {})
        w = data.get("weight", 0)
        if w and 30 < w < 200:  # Filter unreasonable weights
            history.append({
                "date": r.get("timestamp", ""),
                "weight": round(w, 1),
                "bmi": data.get("bmi"),
                "body_fat_pct": data.get("body_fat_pct"),
                "muscle_pct": data.get("muscle_pct"),
                "water_pct": data.get("water_pct"),
                "visceral_fat": data.get("visceral_fat"),
                "bone_mass_kg": data.get("bone_mass_kg"),
                "body_age": data.get("body_age"),
                "basal_metabolism": data.get("basal_metabolism"),
                "protein_pct": data.get("protein_pct"),
            })
    return history


async def generate_daily_recommendations(user_id: str, user_data: dict, latest_reading: dict, goal: dict | None) -> dict | None:
    """Generate or return cached daily AI recommendations"""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check cache
    cached = await db.minceur_daily_cache.find_one(
        {"user_id": user_id, "date": today_str},
        {"_id": 0}
    )
    if cached and cached.get("recommendations"):
        return cached["recommendations"]

    # Generate new recommendations
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return None

    age = parse_age(user_data.get("date_of_birth", ""))
    is_male = user_data.get("gender", "").lower() in ("m", "male", "homme", "masculin")
    weight = latest_reading.get("weight", user_data.get("weight_kg", 75))
    height = user_data.get("height_cm", 170)
    bmi = calc_bmi(weight, height)
    bmr = mifflin_st_jeor(weight, height, age, is_male)
    tdee = bmr * 1.3
    body_fat = latest_reading.get("body_fat_pct", 0)
    muscle = latest_reading.get("muscle_pct", 0)

    goal_context = ""
    daily_target_cal = round(tdee)
    if goal and goal.get("target_kg"):
        diff = weight - goal["target_kg"]
        if diff > 0:
            weeks = max(1, goal.get("weeks", 12))
            kg_per_week = diff / weeks
            daily_deficit = min(500, (kg_per_week * 7700) / 7)
            daily_target_cal = max(1200, round(tdee - daily_deficit))
            goal_context = f"\nOBJECTIF: Atteindre {goal['target_kg']}kg (actuellement {weight}kg, -{diff:.1f}kg en {weeks} semaines). Budget calorique: {daily_target_cal}kcal/jour."
        elif diff < 0:
            surplus = min(300, abs(diff) * 100)
            daily_target_cal = round(tdee + surplus)
            goal_context = f"\nOBJECTIF: Prise de poids vers {goal['target_kg']}kg (actuellement {weight}kg). Budget calorique: {daily_target_cal}kcal/jour."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"wn-{user_id[:8]}-{today_str}",
            system_message="Tu es un nutritionniste-coach sportif specialise seniors. Reponds en JSON strict uniquement. Pas d'emoji. Francais."
        ).with_model("openai", "gpt-5.2")

        prompt = f"""Profil patient: {'Homme' if is_male else 'Femme'}, {age} ans, {weight}kg, {height}cm, IMC {bmi}.
{'Masse grasse: ' + str(body_fat) + '%' if body_fat else ''}
{'Masse musculaire: ' + str(muscle) + '%' if muscle else ''}
Metabolisme de base: {round(bmr)}kcal. Depense totale estimee: {round(tdee)}kcal.
{goal_context}

Genere un plan nutritionnel et sportif QUOTIDIEN personnalise. JSON strict:
{{
  "daily_calories": {daily_target_cal},
  "macros": {{"proteines_g": 65, "glucides_g": 200, "lipides_g": 55}},
  "meals": [
    {{
      "type": "breakfast",
      "label": "Petit-dejeuner",
      "name": "Nom du repas",
      "description": "Description detaillee des ingredients et portions",
      "calories": 350,
      "time": "07:30"
    }},
    {{
      "type": "lunch",
      "label": "Dejeuner",
      "name": "Nom du repas",
      "description": "Description detaillee",
      "calories": 500,
      "time": "12:30"
    }},
    {{
      "type": "snack",
      "label": "Collation",
      "name": "Nom de la collation",
      "description": "Description",
      "calories": 150,
      "time": "16:00"
    }},
    {{
      "type": "dinner",
      "label": "Diner",
      "name": "Nom du repas",
      "description": "Description detaillee",
      "calories": 400,
      "time": "19:30"
    }}
  ],
  "exercises": [
    {{
      "name": "Nom de l'exercice",
      "duration": "20 min",
      "intensity": "leger",
      "description": "Instructions claires et detaillees, adaptees a une personne agee",
      "calories_burned": 80,
      "category": "cardio"
    }},
    {{
      "name": "Nom de l'exercice",
      "duration": "15 min",
      "intensity": "modere",
      "description": "Instructions detaillees",
      "calories_burned": 60,
      "category": "renforcement"
    }}
  ],
  "water_ml": 1500,
  "tip_of_the_day": "Conseil sante personnalise base sur le profil du patient",
  "nora_insight": "Analyse courte et bienveillante de Nora sur l'etat de sante actuel du patient et les progres"
}}

REGLES STRICTES:
- Exercices adaptes seniors a domicile: marche, gainage adapte sur chaise, squats chaise, lever de jambes, etirements, montee de marches, equilibre, pompes murales, rotation du tronc, bras avec bouteilles d'eau, tai-chi. PAS de course ni exercices intenses.
- Repas equilibres, mediterraneens, simples a preparer, adaptes seniors
- Calories des 4 repas = total daily_calories
- Varier par rapport aux jours precedents
- Sois precis sur les portions (ex: 150g de poulet, 1 pomme, 2 cuilleres a soupe d'huile d'olive)"""

        r = (await chat.send_message(UserMessage(text=prompt))).strip()
        if "```json" in r:
            r = r.split("```json")[1].split("```")[0]
        elif "```" in r:
            r = r.split("```")[1].split("```")[0]
        recommendations = json.loads(r.strip())

        # Cache for today
        await db.minceur_daily_cache.update_one(
            {"user_id": user_id, "date": today_str},
            {"$set": {
                "user_id": user_id,
                "date": today_str,
                "recommendations": recommendations,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )
        return recommendations

    except Exception as e:
        logger.error(f"AI recommendation gen error: {e}")
        return None


@router.get("/minceur/weight-details")
async def get_weight_details(user=Depends(get_current_user)):
    """Main endpoint: returns complete weight & nutrition dashboard data"""
    uid = user["id"]
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")

    age = parse_age(u.get("date_of_birth", ""))
    is_male = u.get("gender", "").lower() in ("m", "male", "homme", "masculin")
    height_cm = u.get("height_cm") or 170
    profile_weight = u.get("weight_kg") or 0

    # Weight history from scale
    history = await get_weight_history(uid)

    # Latest reading
    latest = history[0] if history else {}
    current_weight = latest.get("weight") or profile_weight
    current_bmi = latest.get("bmi") or calc_bmi(current_weight, height_cm) if current_weight > 0 else 0
    bmi_info = bmi_category(current_bmi) if current_bmi > 0 else None

    # Body composition from latest scale reading
    body_composition = {
        "body_fat_pct": latest.get("body_fat_pct"),
        "muscle_pct": latest.get("muscle_pct"),
        "water_pct": latest.get("water_pct"),
        "visceral_fat": latest.get("visceral_fat"),
        "bone_mass_kg": latest.get("bone_mass_kg"),
        "body_age": latest.get("body_age"),
        "protein_pct": latest.get("protein_pct"),
    }

    # Metabolic data
    bmr = round(mifflin_st_jeor(current_weight, height_cm, age, is_male)) if current_weight > 0 else 0
    tdee = round(bmr * 1.3) if bmr > 0 else 0

    # Weight goal (optional)
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})

    # Weight evolution stats
    weight_stats = {}
    if len(history) >= 2:
        weights = [h["weight"] for h in history]
        first_w = history[-1]["weight"]
        last_w = history[0]["weight"]
        weight_stats = {
            "total_change": round(last_w - first_w, 1),
            "min_weight": min(weights),
            "max_weight": max(weights),
            "readings_count": len(history),
            "first_date": history[-1].get("date"),
            "last_date": history[0].get("date"),
        }
        if len(history) >= 2:
            w_7d = [h for h in history if h.get("date", "") >= (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()]
            if len(w_7d) >= 2:
                weight_stats["week_change"] = round(w_7d[0]["weight"] - w_7d[-1]["weight"], 1)

    # AI recommendations (cached daily)
    recommendations = await generate_daily_recommendations(uid, u, latest, goal)

    return {
        "profile": {
            "name": u.get("name", ""),
            "age": age,
            "gender": "Homme" if is_male else "Femme",
            "height_cm": height_cm,
        },
        "current": {
            "weight": current_weight,
            "bmi": current_bmi,
            "bmi_info": bmi_info,
            "bmr": bmr,
            "tdee": tdee,
        },
        "body_composition": body_composition,
        "weight_history": history[:30],
        "weight_stats": weight_stats,
        "goal": {
            "target_kg": goal["target_kg"],
            "weeks": goal.get("weeks"),
            "created_at": goal.get("created_at"),
        } if goal else None,
        "recommendations": recommendations,
        "last_reading_date": history[0].get("date") if history else None,
    }


@router.post("/minceur/weight-goal")
async def set_weight_goal(data: dict, user=Depends(get_current_user)):
    """Set or update an optional weight goal"""
    uid = user["id"]
    target_kg = data.get("target_kg")
    weeks = data.get("weeks", 12)

    if not target_kg or target_kg <= 0:
        raise HTTPException(400, "Poids cible requis")
    if weeks < 2 or weeks > 52:
        raise HTTPException(400, "Duree entre 2 et 52 semaines")

    now = datetime.now(timezone.utc).isoformat()
    await db.minceur_goals.update_one(
        {"user_id": uid},
        {"$set": {
            "user_id": uid,
            "target_kg": round(target_kg, 1),
            "weeks": weeks,
            "created_at": now,
            "updated_at": now,
        }},
        upsert=True
    )

    # Invalidate today's cache so recommendations refresh with new goal
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.minceur_daily_cache.delete_one({"user_id": uid, "date": today_str})

    return {"status": "saved", "target_kg": round(target_kg, 1), "weeks": weeks}


@router.delete("/minceur/weight-goal")
async def delete_weight_goal(user=Depends(get_current_user)):
    """Remove weight goal"""
    uid = user["id"]
    await db.minceur_goals.delete_one({"user_id": uid})

    # Invalidate cache
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.minceur_daily_cache.delete_one({"user_id": uid, "date": today_str})

    return {"status": "deleted"}


@router.post("/minceur/refresh-recommendations")
async def refresh_recommendations(user=Depends(get_current_user)):
    """Force refresh AI recommendations"""
    uid = user["id"]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.minceur_daily_cache.delete_one({"user_id": uid, "date": today_str})
    return {"status": "cache_cleared"}
