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


def validate_weight_goal(current_kg: float, target_kg: float, days: int) -> dict:
    diff = current_kg - target_kg
    if diff <= 0:
        return {"valid": False, "reason": "Le poids cible doit etre inferieur au poids actuel."}
    weeks = days / 7
    kg_per_week = diff / weeks if weeks > 0 else 99
    if kg_per_week > 1.0:
        safe_weeks = math.ceil(diff / 0.7)
        return {
            "valid": False,
            "reason": f"Perdre {diff:.1f}kg en {days} jours ({kg_per_week:.1f}kg/sem) est trop rapide.",
            "recommended_days": safe_weeks * 7, "recommended_weeks": safe_weeks, "kg_per_week": round(kg_per_week, 1),
        }
    return {"valid": True, "kg_per_week": round(kg_per_week, 1)}


@router.post("/minceur/validate-goal")
async def validate_goal(data: dict, user=Depends(get_current_user)):
    current_kg = data.get("current_kg", 0)
    target_kg = data.get("target_kg", 0)
    days = data.get("days", 90)
    if current_kg <= 0 or target_kg <= 0:
        raise HTTPException(400, "Poids requis.")
    if target_kg >= current_kg:
        raise HTTPException(400, "Le poids cible doit etre inferieur au poids actuel.")
    validation = validate_weight_goal(current_kg, target_kg, days)
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    height_cm = u.get("height_cm", 170)
    age = 70
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
    return {**validation, "daily_calories": daily_calories, "bmr": round(bmr), "tdee": round(tdee), "daily_deficit": round(daily_deficit), "final_days": final_days}


@router.post("/minceur/create")
async def create_minceur_program(data: dict, user=Depends(get_current_user)):
    uid = user["id"]
    target_kg = data.get("target_kg", 0)
    days = data.get("days", 56)

    last_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    current_kg = data.get("current_kg", 0) or (last_reading.get("weight", 0) if last_reading else 0)
    if current_kg <= 0:
        raise HTTPException(400, "Poids actuel requis. Pesez-vous d'abord.")
    if target_kg <= 0 or target_kg >= current_kg:
        raise HTTPException(400, "Poids cible invalide.")

    validation = validate_weight_goal(current_kg, target_kg, days)
    if not validation.get("valid") and validation.get("recommended_days"):
        days = validation["recommended_days"]

    u = await db.users.find_one({"id": uid}, {"_id": 0})
    height_cm = u.get("height_cm", 170)
    age = 70
    if u.get("date_of_birth"):
        try:
            dob = datetime.fromisoformat(u["date_of_birth"].replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - dob).days // 365
        except:
            pass
    is_male = u.get("gender", "").lower() in ("m", "male", "homme", "masculin")
    bmr = mifflin_st_jeor(current_kg, height_cm, age, is_male)
    tdee = bmr * 1.3
    diff_kg = current_kg - target_kg
    weeks_total = days / 7
    kg_per_week = diff_kg / weeks_total
    daily_deficit = (kg_per_week * 7700) / 7
    daily_calories = max(1200, round(tdee - daily_deficit))
    now = datetime.now(timezone.utc).isoformat()

    await db.minceur_programs.update_many({"user_id": uid, "status": "active"}, {"$set": {"status": "replaced", "updated_at": now}})

    # Generate 7-day plan with GPT (repeats each week)
    week_plan = []
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(api_key=api_key, session_id=f"minc-{uuid.uuid4().hex[:6]}",
                system_message="Coach minceur senior expert. JSON strict. Pas d'emoji."
            ).with_model("openai", "gpt-5.2")
            prompt = f"""Genere un programme minceur 7 jours pour: {'Homme' if is_male else 'Femme'}, {age} ans, {current_kg}kg, objectif {target_kg}kg.
Budget calorique: {daily_calories}kcal/jour. Exercices adaptes a une personne agee (pas de Dorsi, pas de course).

JSON STRICT — tableau de 7 jours:
[{{
  "day": 1,
  "meals": {{
    "breakfast": {{"name": "...", "calories": 300, "desc": "description courte"}},
    "lunch": {{"name": "...", "calories": 450, "desc": "..."}},
    "snack": {{"name": "...", "calories": 100, "desc": "..."}},
    "dinner": {{"name": "...", "calories": 350, "desc": "..."}}
  }},
  "exercises": [
    {{"name": "...", "duration": "15 min", "icon": "ri-walk-line", "desc": "...", "intensity": "leger"}},
    {{"name": "...", "duration": "10 min", "icon": "ri-heart-pulse-line", "desc": "...", "intensity": "modere"}}
  ],
  "tip": "conseil du jour personnalise",
  "water_ml": 1500
}}]

Exercices possibles: marche, gainage adapte, squats chaise, lever de jambes, etirements, montee de marches, equilibre, pompes murales, rotation du tronc, bras avec bouteilles d'eau.
Icones: ri-walk-line, ri-heart-pulse-line, ri-boxing-line, ri-run-line, ri-body-scan-line, ri-armchair-line.
Varie les repas et exercices chaque jour. Repas equilibres, mediteraneens, adaptes seniors."""
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if "```json" in r: r = r.split("```json")[1].split("```")[0]
            elif "```" in r: r = r.split("```")[1].split("```")[0]
            week_plan = json.loads(r.strip())
        except Exception as e:
            logger.error(f"Minceur plan gen error: {e}")

    # Fallback plan if GPT fails
    if not week_plan:
        for d in range(1, 8):
            week_plan.append({
                "day": d, "tip": "Buvez 1.5L d'eau et marchez 30 minutes.", "water_ml": 1500,
                "meals": {
                    "breakfast": {"name": "Yaourt & fruits", "calories": 280, "desc": "Yaourt nature, fruits frais, muesli"},
                    "lunch": {"name": "Poulet & legumes", "calories": 420, "desc": "Blanc de poulet grille, legumes vapeur, riz complet"},
                    "snack": {"name": "Pomme & amandes", "calories": 120, "desc": "1 pomme, 10 amandes"},
                    "dinner": {"name": "Soupe & poisson", "calories": 380, "desc": "Soupe de legumes, filet de poisson, salade"},
                },
                "exercises": [
                    {"name": "Marche", "duration": "30 min", "icon": "ri-walk-line", "desc": "Marche rapide en exterieur", "intensity": "leger"},
                    {"name": "Gainage", "duration": "10 min", "icon": "ri-body-scan-line", "desc": "Planche 3x30s, gainage lateral", "intensity": "modere"},
                ],
            })

    program = {
        "id": str(uuid.uuid4()), "user_id": uid, "status": "active",
        "current_kg": current_kg, "target_kg": target_kg, "days": days,
        "start_date": now, "end_date": (datetime.now(timezone.utc) + timedelta(days=days)).isoformat(),
        "kg_per_week": round(kg_per_week, 2), "bmr": round(bmr), "tdee": round(tdee),
        "daily_calories": daily_calories, "daily_deficit": round(daily_deficit),
        "height_cm": height_cm, "age": age, "is_male": is_male,
        "week_plan": week_plan,
        "weigh_ins": [{"date": now, "weight": current_kg}],
        "created_at": now, "updated_at": now,
    }
    await db.minceur_programs.insert_one(program)
    program.pop("_id", None)
    return program


@router.get("/minceur/active")
async def get_active_minceur(user=Depends(get_current_user)):
    uid = user["id"]
    prog = await db.minceur_programs.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not prog:
        return {"active": False}

    weigh_ins = prog.get("weigh_ins", [])
    current = weigh_ins[-1]["weight"] if weigh_ins else prog["current_kg"]
    lost = prog["current_kg"] - current
    total_to_lose = prog["current_kg"] - prog["target_kg"]
    progress_pct = min(100, round((lost / total_to_lose) * 100)) if total_to_lose > 0 else 0
    try:
        start = datetime.fromisoformat(prog["start_date"].replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - start).days
    except:
        elapsed = 0

    # Get today's plan from week_plan (cycle weekly)
    day_of_week = (elapsed % 7) + 1
    week_plan = prog.get("week_plan", [])
    today_plan = next((d for d in week_plan if d.get("day") == day_of_week), week_plan[0] if week_plan else {})

    # Check for new weigh-in from scale
    last_scale = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if last_scale and last_scale.get("weight"):
        last_wi_date = weigh_ins[-1].get("date", "") if weigh_ins else ""
        scale_ts = last_scale.get("timestamp", "")
        if scale_ts > last_wi_date:
            new_wi = {"date": scale_ts, "weight": last_scale["weight"], "auto": True}
            await db.minceur_programs.update_one({"id": prog["id"]}, {"$push": {"weigh_ins": new_wi}})
            weigh_ins.append(new_wi)
            current = last_scale["weight"]
            lost = prog["current_kg"] - current
            progress_pct = min(100, round((lost / total_to_lose) * 100)) if total_to_lose > 0 else 0

    prog["progress"] = {
        "current_kg": round(current, 1), "lost_kg": round(lost, 1),
        "progress_pct": progress_pct, "days_elapsed": elapsed,
        "days_remaining": max(0, prog["days"] - elapsed), "day_of_week": day_of_week,
    }
    prog["today"] = today_plan
    prog["active"] = True
    return prog


@router.post("/minceur/weigh-in")
async def add_weigh_in(data: dict, user=Depends(get_current_user)):
    uid = user["id"]
    weight = data.get("weight", 0)
    if weight <= 0:
        raise HTTPException(400, "Poids requis.")
    prog = await db.minceur_programs.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    if not prog:
        raise HTTPException(404, "Aucun programme minceur actif.")
    now = datetime.now(timezone.utc).isoformat()
    await db.minceur_programs.update_one({"id": prog["id"]}, {"$push": {"weigh_ins": {"date": now, "weight": weight}}, "$set": {"updated_at": now}})
    if weight <= prog["target_kg"]:
        await db.minceur_programs.update_one({"id": prog["id"]}, {"$set": {"status": "completed", "updated_at": now}})
        return {"status": "completed", "message": "Objectif atteint !"}
    return {"status": "ok", "weight": weight, "lost_total": round(prog["current_kg"] - weight, 1)}


@router.post("/minceur/stop")
async def stop_minceur(user=Depends(get_current_user)):
    uid = user["id"]
    result = await db.minceur_programs.update_one(
        {"user_id": uid, "status": "active"},
        {"$set": {"status": "stopped", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Aucun programme actif.")
    return {"status": "stopped"}
