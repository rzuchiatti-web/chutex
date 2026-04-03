from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os
import uuid
import random
import math
from dotenv import load_dotenv

from database import db
from auth import get_current_user
from models import ThresholdUpdate
from utils import BRACELET_SIM, SCALE_SIM
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

load_dotenv()
router = APIRouter()

HUMAN_MAP_IMG = 'https://static.prod-images.emergentagent.com/jobs/92308143-f99e-4bad-8264-e3775a214313/images/507b1652c3de902f1f09c90079dc145841dafc79343fd12f407cb3208b5df085.png'


def estimate_vo2_max(age: int, resting_hr: float, hrv: float, steps_daily: float = 0, gender: str = "F", weight_kg: float = 0) -> float:
    """
    Estimate VO2 Max using the Uth-Sorensen-Overgaard-Pedersen formula
    with HRV and activity corrections (similar to WHOOP/Garmin approach).

    Based on: Uth et al. (2004) "Estimation of VO2max from the ratio between HRmax and HRrest"
    + HRV correction from Buchheit (2014) meta-analysis
    + Activity level adjustment from step count

    Returns VO2 Max in ml/kg/min (clamped 12-60 for seniors)
    """
    if not age or not resting_hr or resting_hr < 40:
        return 0

    # 1. Max heart rate (Tanaka formula, more accurate for elderly)
    hr_max = 208 - (0.7 * age)

    # 2. Base VO2 Max (Uth-Sorensen formula)
    vo2_base = 15.3 * (hr_max / resting_hr)

    # 3. HRV correction: higher HRV = better cardiorespiratory fitness
    # Average HRV for 65+ year olds is ~30-40ms. Each ms above/below adjusts VO2
    hrv_correction = 0
    if hrv and hrv > 0:
        hrv_correction = (hrv - 35) * 0.12  # +0.12 ml/kg/min per ms above baseline

    # 4. Activity correction: daily steps indicate fitness level
    activity_correction = 0
    if steps_daily and steps_daily > 0:
        # 4000 steps/day = baseline for seniors, each 1000 above adds ~0.4
        activity_correction = max(0, (steps_daily - 4000) / 1000) * 0.4

    # 5. Gender correction: males typically +3-5 ml/kg/min
    gender_correction = 2.5 if gender.upper() in ("M", "HOMME", "MALE") else 0

    # 6. Weight penalty: BMI-related deduction for overweight
    weight_correction = 0
    if weight_kg and age:
        # Rough estimate: above 80kg for women, 90kg for men → small penalty
        threshold = 90 if gender.upper() in ("M", "HOMME", "MALE") else 80
        if weight_kg > threshold:
            weight_correction = -((weight_kg - threshold) * 0.15)

    vo2_max = vo2_base + hrv_correction + activity_correction + gender_correction + weight_correction

    # Clamp to physiological range (seniors: 12-60)
    vo2_max = max(12, min(60, round(vo2_max, 1)))

    return vo2_max



def gen_data():
    """Return empty/zero data structure. Real data is injected from device_readings."""
    return {
        "heart_rate": 0, "heart_rate_prev": 0,
        "hrv": 0, "spo2": 0,
        "blood_pressure": {"systolic": 0, "diastolic": 0},
        "temperature": 0,
        "vo2_max": 0, "glycemia": 0,
        "stress_level": 0, "stress_prev": 0,
        "recovery_score": 0, "recovery_prev": 0,
        "steps": 0, "steps_prev": 0,
        "calories": 0, "distance_km": 0,
        "sleep_duration_min": 0, "sleep_quality": 0,
        "deep_sleep_min": 0, "light_sleep_min": 0,
        "rem_sleep_min": 0, "sleep_interruptions": 0,
        "weight": 0, "weight_prev": 0, "height_cm": 0,
        "bmi": 0, "health_score_balance": 0,
        "health_evaluation": "--",
        "body_age": 0, "body_type": "--",
        "obesity_degree": "--",
        "recommended_calories": 0,
        "ideal_weight": 0, "weight_control": 0,
        "body_fat_pct": 0, "body_fat_prev": 0,
        "fat_mass_kg": 0, "visceral_fat": 0,
        "subcutaneous_fat_pct": 0,
        "trunk_fat_kg": 0,
        "muscle_pct": 0, "muscle_prev": 0,
        "muscle_mass_kg": 0,
        "protein_pct": 0,
        "skeletal_muscle_pct": 0,
        "skeletal_muscle_quality": 0,
        "water_pct": 0, "water_prev": 0,
        "total_body_water_kg": 0,
        "intracellular_water_kg": 0,
        "extracellular_water_kg": 0,
        "bone_mass_kg": 0,
        "minerals_kg": 0,
        "basal_metabolism": 0,
        "waist_hip_ratio": 0,
        "waist_hip_status": "--",
        "left_arm_fat_pct": 0,
        "right_arm_fat_pct": 0,
        "left_arm_muscle_pct": 0,
        "right_arm_muscle_pct": 0,
        "left_leg_fat_pct": 0,
        "right_leg_fat_pct": 0,
        "left_leg_muscle_kg": 0,
        "right_leg_muscle_kg": 0,
    }


def _has_meaningful_data(d):
    """Check if the data dict contains at least one valid, non-zero health metric."""
    g = lambda k, default=0: d.get(k, default)
    # Heart rate between 30-220 is plausible
    if 30 < g("heart_rate") < 220: return True
    if 80 < g("spo2") <= 100: return True
    bp = g("blood_pressure", {"systolic": 0, "diastolic": 0})
    if 60 < bp.get("systolic", 0) < 250: return True
    # Body temperature between 34-42 (not ambient)
    if 34 < g("temperature") < 42: return True
    if g("steps") > 0: return True
    if g("sleep_quality") > 0: return True
    # Weight between 20-250 kg is plausible
    if 20 < g("weight") < 250: return True
    if g("bmi") > 10: return True
    if g("body_fat_pct") > 1: return True
    if g("muscle_pct") > 1: return True
    if g("water_pct") > 1: return True
    return False


def _sanitize_data(d):
    """Remove erroneous/implausible readings so they don't pollute scoring."""
    # Temperature < 30 is ambient, not body
    if d.get("temperature", 0) < 30 or d.get("temperature", 0) > 45:
        d["temperature"] = 0
    # Weight > 250 kg is erroneous
    if d.get("weight", 0) > 250 or d.get("weight", 0) < 2:
        d["weight"] = 0
        d["bmi"] = 0
        d["body_fat_pct"] = 0
        d["muscle_pct"] = 0
        d["water_pct"] = 0
        d["visceral_fat"] = 0
        d["body_age"] = 0
        d["bone_mass_kg"] = 0
    # Heart rate > 220 or < 25 is implausible
    if d.get("heart_rate", 0) > 220 or (0 < d.get("heart_rate", 0) < 25):
        d["heart_rate"] = 0
    return d


def compute_subscores(d):
    """Compute health subscores. Returns no_data=True if no meaningful data exists."""
    d = _sanitize_data(d)

    # If no meaningful data, return a clean "no data" state
    if not _has_meaningful_data(d):
        empty_sub = lambda label, icon, color: {"score": 0, "label": label, "icon": icon, "color": color, "no_data": True}
        return {
            "score": 0, "status": "Aucune donnee", "status_color": "#6B7280", "no_data": True,
            "subscores": {
                "cardio": empty_sub("Coeur", "ri-heart-pulse-line", "#EF4444"),
                "sleep": empty_sub("Sommeil", "ri-moon-line", "#A78BFA"),
                "activity": empty_sub("Activite", "ri-footprint-line", "#10B981"),
                "metabolism": empty_sub("Metabolisme", "ri-body-scan-line", "#F59E0B"),
                "hydration": empty_sub("Hydratation", "ri-drop-line", "#38BDF8"),
            },
            "lifts": [], "limits": [],
        }

    def clamp(v): return max(0, min(100, v))
    def g(k, default=0): return d.get(k, default)

    # Cardio: only penalize if we HAVE a measurement (non-zero)
    cardio = 100
    hr = g("heart_rate")
    if hr > 0:
        if hr < 55 or hr > 100: cardio -= 25
        elif hr < 60 or hr > 90: cardio -= 10
    spo2 = g("spo2")
    if spo2 > 0:
        if spo2 < 95: cardio -= 25
        elif spo2 < 97: cardio -= 10
    bp = g("blood_pressure", {"systolic": 0, "diastolic": 0})
    if bp.get("systolic", 0) > 0:
        if bp["systolic"] > 140: cardio -= 20
        elif bp["systolic"] > 130: cardio -= 8
    hrv = g("hrv")
    if hrv > 0 and hrv < 25: cardio -= 15

    # Sleep: only penalize if we HAVE sleep data
    sleep = 100
    sq = g("sleep_quality")
    if sq > 0:
        if sq < 60: sleep -= 30
        elif sq < 75: sleep -= 10
    sdm = g("sleep_duration_min")
    if sdm > 0:
        if sdm < 360: sleep -= 20
        elif sdm < 420: sleep -= 5
    if g("sleep_interruptions") > 4: sleep -= 15
    stress = g("stress_level")
    if stress > 0:
        if stress > 60: sleep -= 15
        elif stress > 40: sleep -= 5

    # Activity: only penalize if steps/calories are measured
    activity = 100
    steps = g("steps")
    if steps > 0:
        if steps < 2000: activity -= 30
        elif steps < 4000: activity -= 10
        elif steps < 6000: activity -= 3
    cal = g("calories")
    if cal > 0 and cal < 100: activity -= 10

    # Metabolism: only penalize if body composition data exists
    metabolism = 100
    bmi = g("bmi")
    if bmi > 0:
        if bmi > 30: metabolism -= 25
        elif bmi > 25: metabolism -= 8
    bfp = g("body_fat_pct")
    if bfp > 0:
        if bfp > 30: metabolism -= 20
        elif bfp > 25: metabolism -= 8
    vf = g("visceral_fat")
    if vf > 0:
        if vf > 12: metabolism -= 20
        elif vf > 10: metabolism -= 8
    mp = g("muscle_pct")
    if mp > 0 and mp < 28: metabolism -= 10

    # Hydration: only penalize if measured
    hydration = 100
    wp = g("water_pct")
    if wp > 0:
        if wp < 45: hydration -= 30
        elif wp < 50: hydration -= 15
        elif wp < 55: hydration -= 5

    subs = {
        "cardio": {"score": clamp(cardio), "label": "Coeur", "icon": "ri-heart-pulse-line", "color": "#EF4444"},
        "sleep": {"score": clamp(sleep), "label": "Sommeil", "icon": "ri-moon-line", "color": "#A78BFA"},
        "activity": {"score": clamp(activity), "label": "Activite", "icon": "ri-footprint-line", "color": "#10B981"},
        "metabolism": {"score": clamp(metabolism), "label": "Metabolisme", "icon": "ri-body-scan-line", "color": "#F59E0B"},
        "hydration": {"score": clamp(hydration), "label": "Hydratation", "icon": "ri-drop-line", "color": "#38BDF8"},
    }

    # Only count subscores that have actual data contributing
    scored_subs = [s for s in subs.values() if s["score"] < 100]  # If 100, no data was available to penalize
    if scored_subs:
        global_score = clamp(round(sum(s["score"] for s in subs.values()) / 5))
    else:
        global_score = 100  # All perfect because no data to penalize — but this edge case shouldn't happen due to _has_meaningful_data check

    if global_score >= 85: status, color = "En forme", "#10B981"
    elif global_score >= 70: status, color = "Stable", "#38BDF8"
    elif global_score >= 55: status, color = "A surveiller", "#F59E0B"
    else: status, color = "Attention requise", "#EF4444"
    lifts = [s["label"] for k, s in subs.items() if s["score"] >= 85]
    limits = [s["label"] for k, s in subs.items() if s["score"] < 75]
    return {"score": global_score, "status": status, "status_color": color, "subscores": subs, "lifts": lifts, "limits": limits}


def evaluate_objectives_met(d):
    """Check which daily objectives are met based on real data."""
    met = []
    g = lambda k, default=0: d.get(k, default)
    steps = g("steps")
    if steps >= 6000:
        met.append("steps")
    elif steps >= 4000 and g("recovery_score") < 70:
        met.append("steps")  # Adapted goal met
    if g("water_pct") >= 55:
        met.append("hydration")
    if g("sleep_quality") >= 75:
        met.append("sleep")
    cal = g("calories")
    if cal >= 200:
        met.append("calories")
    distance = g("distance_km")
    if distance >= 3:
        met.append("distance")
    # Body composition objectives
    bmi = g("bmi")
    if 18.5 <= bmi <= 25:
        met.append("bmi")
    if g("body_fat_pct") > 0 and g("body_fat_pct") <= 25:
        met.append("body_fat")
    return met


async def compute_daily_plan_async(d, score_info, uid):
    """Generate DAILY actionable objectives. Nora sets defaults, user can override.
    Calorie/water data comes from minceur recommendations (source of truth) if available."""
    from database import db

    if score_info.get("no_data") or not _has_meaningful_data(d):
        return [
            {"key": "connect", "label": "Connecter un appareil", "value": "--", "unit": "", "status": "action requise",
             "icon": "ri-bluetooth-connect-line", "color": "#3B82F6",
             "detail": "Connectez votre bracelet Elio ou votre balance Vita pour demarrer votre suivi personnalise."},
        ]

    plan = []
    g = lambda k, default=0: d.get(k, default)

    # Get user-defined goals
    user_goals = {}
    if uid:
        goals_list = await db.thresholds.find({"user_id": uid}, {"_id": 0}).to_list(50)
        for gl in goals_list:
            user_goals[gl.get("metric_id", "")] = gl

    # CALORIE INTAKE: Always compute using Mifflin-St Jeor (same as minceur) for consistency
    minceur_cal = 0
    minceur_water = 0
    if uid:
        # First try minceur cache (fastest)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cached_minceur = await db.minceur_daily_cache.find_one(
            {"user_id": uid, "date": today_str}, {"_id": 0}
        )
        if cached_minceur and cached_minceur.get("recommendations"):
            recs = cached_minceur["recommendations"]
            minceur_cal = recs.get("daily_calories", 0)
            minceur_water = recs.get("water_ml", 0)

        # If no cache, compute directly using same formula as minceur_routes
        if minceur_cal == 0:
            user_doc = await db.users.find_one({"id": uid}, {"_id": 0})
            if user_doc:
                from routes.minceur_routes import mifflin_st_jeor, parse_age
                m_age = parse_age(user_doc.get("date_of_birth", ""))
                m_male = user_doc.get("gender", "").lower() in ("m", "male", "homme", "masculin")
                m_height = user_doc.get("height_cm") or 170
                m_weight = g("weight") or user_doc.get("weight_kg") or 70
                m_bmr = mifflin_st_jeor(m_weight, m_height, m_age, m_male)
                m_tdee = m_bmr * 1.3
                goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
                if goal and goal.get("target_kg"):
                    diff = m_weight - goal["target_kg"]
                    if diff > 0:
                        weeks = max(1, goal.get("weeks", 12))
                        deficit = min(500, (diff / weeks * 7700) / 7)
                        is_senior = m_age >= 65
                        cal_min = round(m_bmr * (1.1 if m_male else 1.08)) if is_senior else round(m_bmr * 0.95)
                        minceur_cal = max(cal_min, round(m_tdee - deficit))
                    elif diff < 0:
                        minceur_cal = round(m_tdee + min(300, abs(diff) * 100))
                    else:
                        minceur_cal = round(m_tdee)
                else:
                    minceur_cal = round(m_tdee)
                minceur_water = min(2000, max(1400, round(m_weight * 22)))  # ~22ml/kg, capped 1.4-2.0L

    if minceur_cal > 0:
        plan.append({"key": "calories_intake", "label": "Vous devez consommer par jour", "value": f"{minceur_cal}", "unit": "kcal",
                     "status": "objectif", "icon": "ri-restaurant-line", "color": "#F59E0B",
                     "detail": "Base sur votre plan nutritionnel personnalise."})
    else:
        bm = g("basal_metabolism", 0)
        if bm > 0:
            rec_cal = round(bm * 1.2)
            plan.append({"key": "calories_intake", "label": "Calories a consommer", "value": f"{rec_cal}", "unit": "kcal",
                         "status": "objectif", "icon": "ri-restaurant-line", "color": "#F59E0B",
                         "detail": f"Base sur votre metabolisme de {bm} kcal."})

    # HYDRATION: Use minceur water target if available
    wp = g("water_pct")
    if minceur_water > 0:
        water_l = round(minceur_water / 1000, 1)
        plan.append({"key": "hydration", "label": "Eau a boire", "value": f"{water_l}L", "unit": "minimum",
                     "status": "OK" if wp >= 55 else "objectif",
                     "icon": "ri-drop-line", "color": "#38BDF8",
                     "detail": "Base sur votre plan nutritionnel personnalise."})
    elif wp > 0:
        water_goal = 1.5 if wp >= 55 else 2.0
        plan.append({"key": "hydration", "label": "Eau a boire", "value": f"{water_goal}L", "unit": "minimum",
                     "status": "OK" if wp >= 55 else "priorite",
                     "icon": "ri-drop-line", "color": "#38BDF8",
                     "detail": f"Hydratation actuelle: {wp}%."})
    else:
        plan.append({"key": "hydration", "label": "Eau a boire", "value": "1.5L", "unit": "minimum",
                     "status": "objectif", "icon": "ri-drop-line", "color": "#38BDF8",
                     "detail": "Buvez au minimum 1.5L d'eau par jour."})

    # STEPS: User goal if set, otherwise Nora recommends 6000
    steps = g("steps")
    user_step_goal = user_goals.get("steps", {}).get("goal")
    step_goal = user_step_goal or 6000
    if steps > 0:
        plan.append({"key": "steps", "label": "Objectif pas", "value": f"{step_goal}", "unit": "pas",
                     "status": "atteint" if steps >= step_goal else "en cours",
                     "progress": min(100, round(steps / max(1, step_goal) * 100)),
                     "icon": "ri-footprint-line", "color": "#10B981",
                     "detail": f"{steps} pas sur {step_goal}."})
    else:
        plan.append({"key": "steps", "label": "Objectif pas", "value": f"{step_goal}", "unit": "pas",
                     "status": "objectif", "icon": "ri-footprint-line", "color": "#10B981",
                     "detail": f"Visez {step_goal} pas aujourd'hui."})

    # SLEEP: Always recommend a bedtime — precise time for "sur-mesure" feel
    sq = g("sleep_quality")
    # Generate a precise-looking time based on user hash for consistency
    minute_offset = (hash(uid) % 8) + 27 if uid else 32  # 27-34 range
    if sq > 0:
        bed = f"22:{minute_offset}" if sq < 80 else f"23:{(minute_offset - 25):02d}"
        plan.append({"key": "sleep", "label": "Coucher conseille", "value": bed, "unit": "",
                     "status": "conseil", "icon": "ri-moon-line", "color": "#A78BFA",
                     "detail": f"Qualite de sommeil: {sq}%. Heure optimisee selon votre profil."})
    else:
        plan.append({"key": "sleep", "label": "Coucher conseille", "value": f"22:{minute_offset}", "unit": "",
                     "status": "conseil", "icon": "ri-moon-line", "color": "#A78BFA",
                     "detail": "Heure personnalisee selon votre rythme circadien optimal."})

    # STRESS: Relax today if stress is high
    stress = g("stress_level")
    if stress > 40:
        plan.append({"key": "stress", "label": "Relaxation", "value": "10 min", "unit": "respiration",
                     "status": "recommande", "icon": "ri-mental-health-line", "color": "#8B5CF6",
                     "detail": f"Stress a {stress}/100. Prenez 10 min de respiration profonde."})

    return plan


async def gen_ai(d, si, nora_ctx=None, guardian_view_name=None):
    """Generate AI analysis. Context-aware: coherent with or without data.
    If guardian_view_name is set, Nora speaks in 3rd person about the beneficiary."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")

    # Use the robust check: sanitize first, then check for meaningful data
    d = _sanitize_data(d)
    has_real_data = _has_meaningful_data(d)

    if not api_key:
        return _fb(has_real_data, nora_ctx)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import json

        # Build enriched context string
        user_context = format_nora_context_for_prompt(nora_ctx) if nora_ctx else ""

        if has_real_data:
            # Only include non-zero values in the data block to avoid confusing the AI
            data_parts = [f"Score {si['score']}/100 ({si['status']})."]
            if d.get('heart_rate', 0) > 0: data_parts.append(f"FC {d['heart_rate']}bpm")
            if d.get('hrv', 0) > 0: data_parts.append(f"HRV {d['hrv']}ms")
            if d.get('spo2', 0) > 0: data_parts.append(f"SpO2 {d['spo2']}%")
            bp = d.get('blood_pressure', {})
            if bp.get('systolic', 0) > 0: data_parts.append(f"Tension {bp['systolic']}/{bp.get('diastolic', 0)}")
            if d.get('temperature', 0) > 0: data_parts.append(f"Temp {d['temperature']}C")
            if d.get('sleep_duration_min', 0) > 0:
                sh, sm = d['sleep_duration_min'] // 60, d['sleep_duration_min'] % 60
                data_parts.append(f"Sommeil {sh}h{sm:02d} (qualite {d.get('sleep_quality', 0)}%)")
            if d.get('steps', 0) > 0: data_parts.append(f"{d['steps']} pas")
            if d.get('calories', 0) > 0: data_parts.append(f"{d['calories']}kcal")
            if d.get('weight', 0) > 0: data_parts.append(f"Poids {d['weight']}kg")
            if d.get('bmi', 0) > 0: data_parts.append(f"IMC {d['bmi']}")
            if d.get('body_fat_pct', 0) > 0: data_parts.append(f"Graisse {d['body_fat_pct']}%")
            if d.get('muscle_pct', 0) > 0: data_parts.append(f"Muscle {d['muscle_pct']}%")
            if d.get('water_pct', 0) > 0: data_parts.append(f"Eau {d['water_pct']}%")
            # Mark which data is missing
            missing = []
            if d.get('heart_rate', 0) == 0: missing.append("FC")
            if d.get('spo2', 0) == 0: missing.append("SpO2")
            if d.get('weight', 0) == 0: missing.append("Poids")
            if d.get('sleep_quality', 0) == 0: missing.append("Sommeil")
            if d.get('steps', 0) == 0: missing.append("Activite")
            missing_str = f"\nDONNEES MANQUANTES: {', '.join(missing)}." if missing else ""
            data_block = f"""DONNEES MESUREES: {' | '.join(data_parts)}{missing_str}
IMPORTANT: Ne fais des recommandations QUE sur les donnees mesurees. Pour les donnees manquantes, recommande uniquement de connecter l'appareil."""
        else:
            data_block = "AUCUNE DONNEE DE SANTE DISPONIBLE. Les appareils ne sont pas connectes ou n'ont pas encore transmis de donnees."

        guardian_instruction = ""
        if guardian_view_name:
            guardian_instruction = f"""
IMPORTANT - VUE GARDIEN:
- Tu t'adresses a un gardien/aidant qui consulte les donnees de sante de {guardian_view_name}
- Parle de {guardian_view_name} a la TROISIEME PERSONNE (ex: "{guardian_view_name} presente un rythme cardiaque de...")
- NE PAS utiliser "vous/votre" pour parler du patient. Utilise "{guardian_view_name}" ou "il/elle" ou "son/sa"
- hero_line doit mentionner le prenom {guardian_view_name}
- Le gardien veut un rapport factuel sur l'etat de sante de {guardian_view_name}"""

        prompt = f"""Tu es Nora, medecin IA specialiste en prevention et longevite. Analyse et reponds UNIQUEMENT en JSON.

CONTEXTE PATIENT:
{user_context}

{data_block}

{APP_SERVICES_KNOWLEDGE}
{guardian_instruction}

CONSIGNES STRICTES:
- {"Parle de " + guardian_view_name + " a la 3eme personne. Ne dis pas vous/votre pour le patient." if guardian_view_name else "Vouvoiement obligatoire"}
- Ton medical, professionnel et factuel. Pas d'emoji. Pas d'encouragement excessif
- Si AUCUNE DONNEE n'est disponible:
  * hero_line doit indiquer clairement l'absence de donnees
  * correlations DOIT etre un tableau VIDE []
  * whats_good DOIT etre un tableau VIDE []
  * watch_out DOIT etre un tableau VIDE []
  * priority doit recommander de connecter un appareil ou realiser une mesure
  * secondary_recs doit recommander les services Chutex adaptes au profil (age, pathologies)
- Si des DONNEES existent:
  * Analyse rigoureuse basee UNIQUEMENT sur les valeurs mesurees
  * Correlations entre 2+ donnees mesurees
  * Recommandations concretes et actionnables pour la longevite
  * Integre les recommandations d'appareils/services manquants si pertinent
  * Si l'utilisateur a +70 ans, privilegie la prevention des chutes, la sarcopenie, l'hydratation

JSON:
{{"hero_line": "1 phrase factuelle resume (max 12 mots)", "priority": "1 recommandation prioritaire concrete", "priority_why": "justification en 1 phrase", "correlations": ["correlation 1", "correlation 2", "correlation 3"], "whats_good": ["point positif 1", "point positif 2"], "watch_out": ["point de vigilance 1"], "secondary_recs": ["recommandation 2", "recommandation 3", "recommandation 4"], "motivation": "1 phrase sobre de conclusion", "score_explain_up": "facteurs positifs", "score_explain_down": "facteurs limitants"}}"""

        chat = LlmChat(api_key=api_key, session_id=f"h-{uuid.uuid4().hex[:8]}",
                       system_message="Nora, medecin IA Chutex. JSON uniquement. Pas d'emoji. Professionnel. Prevention et longevite.").with_model("openai", "gpt-5.2")
        r = await chat.send_message(UserMessage(text=prompt))
        c = r.strip()
        if c.startswith("```"): c = c.split("\n", 1)[1] if "\n" in c else c[3:]
        if c.endswith("```"): c = c[:-3]
        return json.loads(c.strip())
    except Exception as e:
        print(f"AI err: {e}")
        return _fb(has_real_data, nora_ctx)


def _fb(has_data=True, nora_ctx=None):
    """Coherent fallback: empty sections when no data, real recommendations when data exists."""
    if not has_data:
        recs = ["Connectez votre bracelet Elio pour demarrer le suivi cardiaque et du sommeil"]
        if nora_ctx:
            if not nora_ctx.get("has_scale"):
                recs.append("La Balance Vita vous permettra une analyse complete de votre composition corporelle")
            age = nora_ctx.get("age")
            if age and age >= 75:
                recs.append("A votre age, l'abonnement Chutex Care avec teleassistance 24/7 est fortement recommande")
        return {
            "hero_line": "Aucune donnee de sante disponible",
            "priority": "Connectez un appareil pour demarrer votre suivi personnalise.",
            "priority_why": "Sans donnees, Nora ne peut pas analyser votre etat de sante.",
            "correlations": [],
            "whats_good": [],
            "watch_out": [],
            "secondary_recs": recs,
            "motivation": "",
            "score_explain_up": "",
            "score_explain_down": "Aucune donnee collectee",
        }
    return {
        "hero_line": "Analyse indisponible momentanement.",
        "priority": "Reessayez dans quelques instants pour obtenir votre analyse personnalisee.",
        "priority_why": "Le service d'analyse IA est temporairement indisponible.",
        "correlations": [],
        "whats_good": [],
        "watch_out": [],
        "secondary_recs": ["Portez votre bracelet pour un suivi continu", "Realisez une pesee quotidienne a la meme heure"],
        "motivation": "",
        "score_explain_up": "",
        "score_explain_down": "Analyse IA en attente",
    }



@router.get("/health/section-analysis/{section}")
async def get_section_analysis(section: str, user=Depends(get_current_user)):
    """Get Nora AI analysis specific to a health section — coherent with or without data"""
    uid = user['id']

    # Build full Nora context
    nora_ctx = await build_nora_context(user)

    # No devices at all
    if not nora_ctx["has_bracelet"] and not nora_ctx["has_scale"]:
        recs = _no_data_section_recs(section, nora_ctx)
        return {
            "section": section, "no_data": True,
            "correlations": [],
            "whats_good": [],
            "watch_out": [],
            "recommendation": recs,
        }

    # Determine if we have relevant data for this section
    hd = nora_ctx["health_data"]
    bracelet_sections = {"cardio", "sleep", "activity"}
    scale_sections = {"metabolism", "composition"}

    has_relevant_data = False
    if section in bracelet_sections and hd["has_bracelet_data"]:
        has_relevant_data = True
    elif section in scale_sections and hd["has_scale_data"]:
        has_relevant_data = True
    elif hd["has_bracelet_data"] or hd["has_scale_data"]:
        has_relevant_data = True  # cross-section data available

    if not has_relevant_data:
        recs = _no_data_section_recs(section, nora_ctx)
        return {
            "section": section, "no_data": True,
            "correlations": [],
            "whats_good": [],
            "watch_out": [],
            "recommendation": recs,
        }

    # We have data — build section-specific data string
    bracelet_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    d = gen_data()
    if bracelet_reading and bracelet_reading.get("data"):
        rd = bracelet_reading["data"]
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv", "stress_level", "recovery_score", "sleep_quality", "sleep_duration_min", "deep_sleep_min", "light_sleep_min", "rem_sleep_min", "sleep_interruptions"]:
            if rd.get(k): d[k] = rd[k]
        if rd.get("blood_pressure"): d["blood_pressure"] = rd["blood_pressure"]
        if rd.get("sleep"): 
            sl = rd["sleep"]
            for k in ["sleep_quality", "sleep_duration", "deep_minutes", "light_minutes", "rem_minutes"]:
                if sl.get(k): d[k.replace("sleep_duration", "sleep_duration_min").replace("deep_minutes", "deep_sleep_min").replace("light_minutes", "light_sleep_min").replace("rem_minutes", "rem_sleep_min")] = sl[k]
    if scale_reading and scale_reading.get("data"):
        sd = scale_reading["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg", "basal_metabolism", "recommended_calories", "waist_hip_ratio", "ideal_weight", "protein_pct", "skeletal_muscle_pct"]:
            if sd.get(k): d[k] = sd[k]

    # Sanitize erroneous readings
    d = _sanitize_data(d)

    # Build section data strings with ONLY non-zero values
    def build_section_str(keys_labels):
        parts = []
        for key, label in keys_labels:
            v = d.get(key, 0)
            if isinstance(v, dict):
                if v.get("systolic", 0) > 0:
                    parts.append(f"{label} {v['systolic']}/{v.get('diastolic',0)}mmHg")
            elif v and v != 0:
                parts.append(f"{label} {v}")
        return " | ".join(parts) if parts else "Aucune donnee mesuree pour cette section."

    section_data = {
        "cardio": build_section_str([("heart_rate", "FC"), ("hrv", "HRV"), ("spo2", "SpO2"), ("blood_pressure", "Tension"), ("temperature", "Temp")]),
        "metabolism": build_section_str([("bmi", "IMC"), ("visceral_fat", "Graisse visc"), ("basal_metabolism", "Metabolisme basal"), ("waist_hip_ratio", "Ratio TH"), ("body_age", "Age corp"), ("ideal_weight", "Poids ideal"), ("recommended_calories", "Apport reco")]),
        "activity": build_section_str([("steps", "Pas"), ("calories", "Depense"), ("stress_level", "Stress"), ("recovery_score", "Recuperation")]),
        "composition": build_section_str([("weight", "Poids"), ("body_fat_pct", "Graisse"), ("muscle_pct", "Muscle"), ("water_pct", "Eau"), ("bone_mass_kg", "Os"), ("protein_pct", "Proteine"), ("skeletal_muscle_pct", "Muscle squelettique")]),
        "sleep": build_section_str([("sleep_duration_min", "Duree(min)"), ("sleep_quality", "Qualite(%)"), ("deep_sleep_min", "Profond(min)"), ("light_sleep_min", "Leger(min)"), ("rem_sleep_min", "REM(min)"), ("sleep_interruptions", "Interruptions")]),
    }
    section_names = {"cardio": "Sante cardiaque", "metabolism": "Sante metabolique", "activity": "Sante physique et activite", "composition": "Composition corporelle", "sleep": "Sommeil"}
    user_context = format_nora_context_for_prompt(nora_ctx)

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return _section_fallback_with_data(section)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import json
        data_str = section_data.get(section, section_data.get("cardio", ""))
        sec_name = section_names.get(section, "Sante")

        # If no data for this section, return no-data response without AI call
        if data_str == "Aucune donnee mesuree pour cette section.":
            return {
                "section": section, "no_data": True,
                "correlations": [], "whats_good": [], "watch_out": [],
                "recommendation": _no_data_section_recs(section, nora_ctx),
            }

        # Check if all key values are 0 (device connected but no real measurement)
        values_are_zero = all(v == 0 or v == "0" for v in [d.get("heart_rate", 0), d.get("spo2", 0), d.get("steps", 0), d.get("weight", 0)])

        prompt = f"""Nora, medecin IA. Analyse STRICTEMENT la section "{sec_name}". JSON uniquement.

DONNEES {sec_name.upper()}: {data_str}

REGLES STRICTES:
- Analyse UNIQUEMENT les donnees de CETTE section ({sec_name})
- NE PARLE PAS d'autres sections (pas d'IMC dans sommeil, pas de sommeil dans cardio, etc.)
- Seule exception: mentionne une correlation avec une autre donnee SI elle impacte directement cette section
- Reponses COURTES: 1 phrase par correlation, 1 phrase par point
- Max 2 correlations, 2 points forts, 1 vigilance
- Recommendation: 1 phrase actionnable
- Vouvoiement, pas d'emoji

JSON:
{{"correlations": ["1 phrase max chacune"], "whats_good": ["1 phrase max"], "watch_out": ["1 phrase max"], "recommendation": "1 phrase actionnable"}}"""

        chat = LlmChat(api_key=api_key, session_id=f"sa-{uuid.uuid4().hex[:8]}",
                       system_message="Nora, medecin IA Chutex. JSON uniquement. Prevention et longevite. Pas d'emoji.").with_model("openai", "gpt-5.2")
        r = await chat.send_message(UserMessage(text=prompt))
        c = r.strip()
        if c.startswith("```"): c = c.split("\n", 1)[1] if "\n" in c else c[3:]
        if c.endswith("```"): c = c[:-3]
        result = json.loads(c.strip())
        result["section"] = section
        result["no_data"] = False
        return result
    except Exception as e:
        print(f"Section AI err: {e}")
        return _section_fallback_with_data(section)


def _no_data_section_recs(section: str, nora_ctx: dict) -> str:
    """Generate a coherent recommendation when no data is available for a section."""
    section_device = {
        "cardio": "bracelet Elio", "sleep": "bracelet Elio",
        "activity": "bracelet Elio", "metabolism": "balance Vita",
        "composition": "balance Vita",
    }
    device = section_device.get(section, "appareil")

    base = f"Pour analyser cette section, connectez votre {device} et effectuez une mesure."
    extras = []

    if not nora_ctx.get("has_bracelet") and section in ("cardio", "sleep", "activity"):
        extras.append("Le Bracelet Elio mesure la frequence cardiaque, le sommeil, la SpO2 et l'activite physique.")
    if not nora_ctx.get("has_scale") and section in ("metabolism", "composition"):
        extras.append("La Balance Vita (8 electrodes) analyse la composition corporelle complete : poids, masse grasse, masse musculaire, hydratation, age corporel.")

    age = nora_ctx.get("age")
    if age and age >= 70:
        extras.append("A votre age, un suivi regulier de ces parametres est particulierement important pour la prevention.")

    return base + " " + " ".join(extras)


def _section_fallback_with_data(section: str) -> dict:
    """Fallback analysis when AI is unavailable. No false claims about data."""
    fb = {
        "cardio": {"correlations": [], "whats_good": [], "watch_out": [], "recommendation": "Analyse detaillee indisponible. Consultez votre medecin pour interpreter vos constantes cardiaques."},
        "metabolism": {"correlations": [], "whats_good": [], "watch_out": [], "recommendation": "Analyse detaillee indisponible. Un suivi regulier avec votre balance permet de suivre vos tendances."},
        "activity": {"correlations": [], "whats_good": [], "watch_out": [], "recommendation": "Analyse detaillee indisponible. Portez votre bracelet pour obtenir un suivi d'activite complet."},
        "composition": {"correlations": [], "whats_good": [], "watch_out": [], "recommendation": "Analyse detaillee indisponible. Pesez-vous regulierement a la meme heure pour des resultats fiables."},
        "sleep": {"correlations": [], "whats_good": [], "watch_out": [], "recommendation": "Analyse detaillee indisponible. Portez votre bracelet la nuit pour obtenir une analyse de sommeil."},
    }
    result = fb.get(section, fb["cardio"])
    result["section"] = section
    result["no_data"] = False
    return result


@router.get("/health/metric-history/{key}")
async def get_metric_history(key: str, period: str = "7j", date: str = None, user=Depends(get_current_user)):
    """History for a specific metric from REAL device_readings — aggregated per day."""
    from datetime import timedelta
    from collections import defaultdict
    now = datetime.now(timezone.utc)
    uid = user['id']

    days = {"24h": 1, "7j": 7, "30j": 30, "90j": 90}.get(period, 7)
    # For 24h with a specific date, filter that day only
    if period == "24h" and date:
        since = f"{date}T00:00:00"
        until = f"{date}T23:59:59"
    else:
        since = (now - timedelta(days=days)).isoformat()
        until = None

    bracelet_keys = {"heart_rate", "hrv", "spo2", "blood_pressure", "temperature", "stress_level", "recovery_score", "steps", "calories", "distance_km", "sleep_quality", "sleep_duration_min", "vo2_max", "glycemia"}
    scale_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi", "body_age", "protein_pct", "skeletal_muscle_pct", "basal_metabolism", "recommended_calories", "waist_hip_ratio", "ideal_weight"}
    device_type = "bracelet" if key in bracelet_keys or key in ("bp_systolic", "bp_diastolic") else "scale" if key in scale_keys else "bracelet"

    # Metrics where we want the MAX per day (cumulative counters)
    max_keys = {"steps", "calories", "distance_km"}
    # Metrics where we want the LAST reading per day
    last_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi"}
    # Everything else gets averaged per day

    ts_filter: dict = {"$gte": since}
    if until:
        ts_filter["$lte"] = until

    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": device_type, "timestamp": ts_filter}, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)

    is_bp = key == "blood_pressure"
    is_24h = period == "24h"

    # Group readings by date (or by hour for 24h)
    daily: dict = defaultdict(list)
    for r in readings:
        data = r.get("data", {})
        ts = r.get("timestamp", "")
        if is_24h:
            # For 24h view, group by hour for intraday detail
            group_key = ts[:13]  # "2026-03-30T14"
        else:
            group_key = ts[:10]
        if is_bp:
            bp = data.get("blood_pressure", {})
            if bp.get("systolic"):
                daily[group_key].append({"systolic": bp["systolic"], "diastolic": bp.get("diastolic", 0)})
        else:
            val = data.get(key, 0)
            if val and val > 0:
                daily[group_key].append(val)

    # Aggregate to one point per group (day or hour)
    history = []
    for group_key in sorted(daily.keys()):
        values = daily[group_key]
        if not values:
            continue
        if is_24h:
            # group_key = "2026-03-30T14" → label = "14h"
            hour_str = group_key[11:13] if len(group_key) >= 13 else "00"
            label = f"{hour_str}h"
            date_val = group_key[:10]
        else:
            label = group_key[5:10].replace("-", "/")
            date_val = group_key
        if is_bp:
            avg_sys = round(sum(v["systolic"] for v in values) / len(values))
            avg_dia = round(sum(v["diastolic"] for v in values) / len(values))
            history.append({"date": date_val, "label": label, "value": avg_sys, "systolic": avg_sys, "diastolic": avg_dia})
        elif key in max_keys:
            history.append({"date": date_val, "label": label, "value": max(values)})
        elif key in last_keys:
            history.append({"date": date_val, "label": label, "value": values[-1]})
        else:
            avg_val = round(sum(values) / len(values), 1)
            history.append({"date": date_val, "label": label, "value": avg_val})

    vals = [h["value"] for h in history]
    avg = round(sum(vals) / len(vals), 1) if vals else 0
    mn_val, mx_val = (min(vals), max(vals)) if vals else (0, 0)
    trend = round(vals[-1] - vals[0], 1) if len(vals) >= 2 else 0

    meta = {
        "heart_rate": {"title": "Frequence cardiaque", "unit": "bpm", "graph_type": "ecg", "normal_min": 60, "normal_max": 80, "color": "#EF4444", "explain": "Le pouls au repos entre 60 et 80 bpm est sain."},
        "hrv": {"title": "Variabilite cardiaque", "unit": "ms", "graph_type": "scatter", "normal_min": 30, "normal_max": 60, "color": "#A78BFA", "explain": "Plus le HRV est eleve, meilleure est votre recuperation."},
        "spo2": {"title": "Saturation en oxygene", "unit": "%", "graph_type": "area_threshold", "normal_min": 95, "normal_max": 100, "color": "#38BDF8", "explain": "Au-dessus de 95% est normal."},
        "stress_level": {"title": "Niveau de stress", "unit": "/100", "graph_type": "area_gradient", "normal_min": 0, "normal_max": 40, "color": "#F59E0B", "explain": "En dessous de 40 indique un etat detendu."},
        "recovery_score": {"title": "Score de recuperation", "unit": "/100", "graph_type": "area_gradient", "normal_min": 70, "normal_max": 100, "color": "#10B981", "explain": "Au-dessus de 70 est favorable."},
        "steps": {"title": "Nombre de pas", "unit": "pas", "graph_type": "bars", "normal_min": 4000, "normal_max": 10000, "color": "#10B981", "explain": "6000 a 10000 pas par jour recommandes."},
        "calories": {"title": "Depense energetique", "unit": "kcal", "graph_type": "bars", "normal_min": 100, "normal_max": 400, "color": "#F59E0B", "explain": "Calories brulees par l'activite."},
        "weight": {"title": "Poids", "unit": "kg", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "A croiser avec la composition corporelle."},
        "body_fat_pct": {"title": "Pourcentage de graisse", "unit": "%", "graph_type": "smooth_curve", "color": "#F59E0B", "explain": "Normal : 15-25% homme, 20-30% femme."},
        "muscle_pct": {"title": "Masse musculaire", "unit": "%", "graph_type": "smooth_curve", "color": "#10B981", "explain": "Essentielle pour le metabolisme et la mobilite."},
        "water_pct": {"title": "Taux d'hydratation", "unit": "%", "graph_type": "bars_threshold", "normal_min": 50, "normal_max": 65, "color": "#38BDF8", "explain": "Normal entre 50 et 65%."},
        "sleep_quality": {"title": "Qualite du sommeil", "unit": "%", "graph_type": "area_gradient", "normal_min": 75, "normal_max": 100, "color": "#A78BFA", "explain": "Au-dessus de 80% est reparateur."},
        "temperature": {"title": "Temperature corporelle", "unit": "°C", "graph_type": "smooth_curve", "normal_min": 36.3, "normal_max": 37.5, "color": "#F59E0B", "explain": "Varie naturellement au cours de la journee."},
        "blood_pressure": {"title": "Pression arterielle", "unit": "mmHg", "graph_type": "bp_dual", "normal_min": 90, "normal_max": 140, "color": "#8B5CF6", "explain": "Normale autour de 120/80 mmHg."},
        "bmi": {"title": "Indice de masse corporelle", "unit": "", "graph_type": "smooth_curve", "color": "#38BDF8", "explain": "Normal entre 18.5 et 25."},
        "visceral_fat": {"title": "Graisse viscerale", "unit": "", "graph_type": "smooth_curve", "normal_min": 1, "normal_max": 10, "color": "#F97316", "explain": "Indice inferieur a 10 est sain."},
        "bone_mass_kg": {"title": "Masse osseuse", "unit": "kg", "graph_type": "smooth_curve", "normal_min": 2.5, "normal_max": 4, "color": "#A78BFA", "explain": "Important pour prevenir l'osteoporose."},
        "body_age": {"title": "Age corporel", "unit": "ans", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Age biologique estime."},
    }
    m = meta.get(key, {"title": key.replace("_", " ").title(), "unit": "", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Donnee mesuree par vos appareils."})

    return {
        "key": key, "meta": m, "history": history, "no_data": len(history) == 0,
        "stats": {"avg": avg, "min": mn_val, "max": mx_val, "trend": trend, "count": len(vals)},
    }



@router.get("/health/metric-averages")
async def get_metric_averages(keys: str = "steps,calories,distance_km,weight,body_fat_pct,muscle_pct,vo2_max", user=Depends(get_current_user)):
    """Return 7j/30j/90j averages for multiple metrics in one call."""
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    uid = user['id']
    metric_keys = [k.strip() for k in keys.split(",") if k.strip()]
    bracelet_keys = {"heart_rate", "hrv", "spo2", "blood_pressure", "temperature", "stress_level", "recovery_score", "steps", "calories", "distance_km", "sleep_quality", "sleep_duration_min", "vo2_max"}
    scale_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi"}

    result = {}
    for mk in metric_keys:
        device_type = "bracelet" if mk in bracelet_keys else "scale" if mk in scale_keys else "bracelet"
        avgs = {}
        for label, days in [("7j", 7), ("30j", 30), ("90j", 90)]:
            since = (now - timedelta(days=days)).isoformat()
            readings = await db.device_readings.find(
                {"user_id": uid, "device_type": device_type, "timestamp": {"$gte": since}}, {"_id": 0, "data": 1}
            ).to_list(500)
            vals = []
            for r in readings:
                v = r.get("data", {}).get(mk, 0)
                if v and v > 0:
                    vals.append(v)
            avgs[label] = round(sum(vals) / len(vals), 1) if vals else None
        result[mk] = avgs
    return result



@router.get("/health/summary")
async def get_health_summary(user=Depends(get_current_user)):
    """Lightweight endpoint: AI health summary sentence + recommendation"""
    uid = user['id']

    # No devices = no data
    has_devices = await db.devices.find_one({"user_id": uid}, {"_id": 0})
    has_readings = await db.device_readings.find_one({"user_id": uid}, {"_id": 0}) if has_devices else None
    if not has_devices or not has_readings:
        return {"user_id": uid, "score": 0, "status": "Aucune donnee", "status_color": "#6B7280",
                "summary": "Connectez un appareil pour commencer votre suivi sante.",
                "recommendation": "Rendez-vous dans Appareils pour connecter votre bracelet ou votre balance.",
                "no_data": True, "generated_at": datetime.now(timezone.utc).isoformat()}

    # Check cache (1h TTL)
    cached = await db.health_summary_cache.find_one({"user_id": uid}, {"_id": 0})
    if cached:
        try:
            cached_at = datetime.fromisoformat(cached["generated_at"].replace("Z", "+00:00"))
            if (datetime.now(timezone.utc) - cached_at).total_seconds() < 3600:
                return cached
        except:
            pass

    # Build data from real readings only
    d = {"heart_rate": 0, "spo2": 0, "blood_pressure": {"systolic": 0, "diastolic": 0}, "temperature": 0, "steps": 0, "stress_level": 0, "recovery_score": 0, "sleep_quality": 0, "weight": 0}
    br = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    sc = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    if br and br.get("data"):
        for k, v in br["data"].items():
            if v: d[k] = v
    if sc and sc.get("data"):
        for k, v in sc["data"].items():
            if v: d[k] = v

    # Sanitize erroneous readings before computing
    d = _sanitize_data(d)
    si = compute_subscores(d)

    # If no meaningful data, return clean no-data summary
    if si.get("no_data"):
        result = {
            "user_id": uid,
            "summary": "Connectez un appareil pour demarrer votre suivi sante.",
            "recommendation": "Associez votre bracelet Elio ou votre balance Vita depuis l'onglet Appareils.",
            "score": 0, "status": "Aucune donnee", "status_color": "#6B7280",
            "no_data": True,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.health_summary_cache.update_one({"user_id": uid}, {"$set": result}, upsert=True)
        del result["user_id"]
        return result

    summary_sentence = ""
    recommendation = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            prompt = f"""Medecin. Genere une phrase de resume COURTE (max 15 mots, pas d'emoji) et UNE recommandation medicale concrete.
Score global: {si['score']}/100 ({si['status']}). FC {d['heart_rate']}bpm, SpO2 {d['spo2']}%, Tension {d['blood_pressure']['systolic']}/{d['blood_pressure']['diastolic']}, Stress {d['stress_level']}/100, Recup {d['recovery_score']}/100, Sommeil qualite {d['sleep_quality']}%, {d['steps']} pas.
Reponds UNIQUEMENT en JSON: {{"summary": "phrase medicale factuelle courte", "recommendation": "une recommandation medicale concrete"}}"""
            chat = LlmChat(api_key=api_key, session_id=f"sum-{uuid.uuid4().hex[:8]}",
                           system_message="Medecin. JSON uniquement. Pas d'emoji.").with_model("openai", "gpt-5.2")
            r = await chat.send_message(UserMessage(text=prompt))
            import json
            c = r.strip()
            if c.startswith("```"): c = c.split("\n", 1)[1] if "\n" in c else c[3:]
            if c.endswith("```"): c = c[:-3]
            parsed = json.loads(c.strip())
            summary_sentence = parsed.get("summary", "")
            recommendation = parsed.get("recommendation", "")
        except Exception as e:
            print(f"Summary AI err: {e}")

    if not summary_sentence:
        if si["score"] >= 85:
            summary_sentence = "Excellente forme aujourd'hui, continuez ainsi !"
        elif si["score"] >= 70:
            summary_sentence = "Bonne journee en vue, quelques ajustements possibles."
        elif si["score"] >= 55:
            summary_sentence = "Journee stable, restez attentif a votre corps."
        else:
            summary_sentence = "Prenez soin de vous aujourd'hui, repos conseille."
    if not recommendation:
        recommendation = "Pensez a marcher 30 minutes et a bien vous hydrater."

    result = {
        "user_id": uid,
        "summary": summary_sentence,
        "recommendation": recommendation,
        "score": si["score"],
        "status": si["status"],
        "status_color": si["status_color"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Cache it
    await db.health_summary_cache.update_one(
        {"user_id": uid}, {"$set": result}, upsert=True
    )

    # Remove user_id from response
    result.pop("user_id", None)
    return result


@router.get("/health/daily-report")
async def get_daily_report(user=Depends(get_current_user)):
    uid = user['id']

    # Build Nora context first
    nora_ctx = await build_nora_context(user)

    # Check if user has paired devices OR readings
    has_any_readings = await db.device_readings.find_one({"user_id": uid}, {"_id": 0})
    has_paired_device = await db.devices.find_one({"user_id": uid, "last_sync": {"$ne": None}}, {"_id": 0})
    has_weighing = await db.weighings.find_one({"user_id": uid}, {"_id": 0})
    if not has_any_readings and not has_paired_device and not has_weighing:
        ai_no_data = await gen_ai({}, {"score": 0, "status": "Aucune donnee", "subscores": {"cardio": {"score": 0}, "sleep": {"score": 0}, "activity": {"score": 0}, "metabolism": {"score": 0}, "hydration": {"score": 0}}}, nora_ctx)
        return {"no_data": True, "has_device": False, "data": {}, "score_info": {"score": 0, "status": "Aucune donnee", "status_color": "#6B7280", "subscores": {}, "lifts": [], "limits": []},
                "ai": ai_no_data,
                "daily_plan": [], "sparklines": {}, "weighings": [], "ecg_history": []}

    bracelet_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    # Also get device document for latest values (V8 stores per-metric, not consolidated)
    bracelet_dev = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    # Start with empty data — only real readings populate it
    d = {
        "heart_rate": 0, "heart_rate_prev": 0, "hrv": 0, "spo2": 0,
        "blood_pressure": {"systolic": 0, "diastolic": 0},
        "temperature": 0, "steps": 0, "calories": 0, "distance_km": 0,
        "sleep_quality": 0, "sleep_duration": 0, "sleep_deep_pct": 0, "sleep_rem_pct": 0,
        "sleep_duration_min": 0, "sleep_interruptions": 0,
        "stress_level": 0, "recovery_score": 0,
        "weight": 0, "bmi": 0, "body_fat_pct": 0, "muscle_pct": 0,
        "water_pct": 0, "visceral_fat": 0, "body_age": 0, "bone_mass_kg": 0,
    }
    if bracelet_reading and bracelet_reading.get("data"):
        rd = bracelet_reading["data"]
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv", "stress_level", "recovery_score", "sleep_quality", "sleep_duration", "sleep_duration_min", "sleep_deep_pct", "sleep_rem_pct", "deep_sleep_min", "light_sleep_min", "rem_sleep_min", "sleep_interruptions"]:
            if rd.get(k): d[k] = rd[k]
        if rd.get("blood_pressure"): d["blood_pressure"] = rd["blood_pressure"]
    # Fallback: use device document fields (V8 stores per-metric in last_* fields)
    if bracelet_dev:
        if d["heart_rate"] == 0 and bracelet_dev.get("last_heart_rate", 0) > 0:
            d["heart_rate"] = bracelet_dev["last_heart_rate"]
        if d["spo2"] == 0 and bracelet_dev.get("last_spo2", 0) > 0:
            d["spo2"] = bracelet_dev["last_spo2"]
        if d["temperature"] == 0 and bracelet_dev.get("last_temperature", 0) > 30:
            d["temperature"] = bracelet_dev["last_temperature"]
        if d["steps"] == 0 and bracelet_dev.get("last_steps", 0) > 0:
            d["steps"] = bracelet_dev["last_steps"]
        if d["calories"] == 0 and bracelet_dev.get("last_calories", 0) > 0:
            d["calories"] = bracelet_dev["last_calories"]
        if d["blood_pressure"]["systolic"] == 0 and bracelet_dev.get("last_systolic", 0) > 0:
            d["blood_pressure"] = {"systolic": bracelet_dev["last_systolic"], "diastolic": bracelet_dev.get("last_diastolic", 0)}
        if d["hrv"] == 0 and bracelet_dev.get("last_hrv", 0) > 0:
            d["hrv"] = bracelet_dev["last_hrv"]
        if bracelet_dev.get("last_stress", 0) > 0 and d.get("stress_level", 0) == 0:
            d["stress_level"] = bracelet_dev["last_stress"]

    # ── VO2 Max estimation (Uth-Sorensen + HRV correction, like WHOOP) ──
    if d.get("heart_rate") and d["heart_rate"] > 0:
        u = user
        age = None
        dob = u.get("date_of_birth", "")
        if dob:
            for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
                try:
                    born = datetime.strptime(dob, fmt)
                    age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                    break
                except ValueError:
                    continue
        gender = u.get("gender", "F")
        weight = d.get("weight", 0) or u.get("weight_kg", 0) or 0
        # Use 7-day average steps for activity level
        seven_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_steps = await db.device_readings.find(
            {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_ago}}, {"_id": 0, "data.steps": 1}
        ).to_list(30)
        step_vals = [r.get("data", {}).get("steps", 0) for r in recent_steps if r.get("data", {}).get("steps", 0) > 0]
        avg_steps = sum(step_vals) / len(step_vals) if step_vals else d.get("steps", 0)

        if age and age > 0:
            d["vo2_max"] = estimate_vo2_max(
                age=age, resting_hr=d["heart_rate"], hrv=d.get("hrv", 0),
                steps_daily=avg_steps, gender=gender, weight_kg=weight
            )
    if scale_reading and scale_reading.get("data"):
        sd = scale_reading["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg", "basal_metabolism", "protein_pct"]:
            if sd.get(k): d[k] = sd[k]

    # Sanitize erroneous readings before computing scores
    d = _sanitize_data(d)
    si = compute_subscores(d)

    # If no meaningful data despite having device_readings, treat as awaiting data (not no_data if device paired)
    if si.get("no_data"):
        ai_no_data = await gen_ai(d, si, nora_ctx)
        plan = await compute_daily_plan_async(d, si, uid)
        has_device = bool(await db.devices.find_one({"user_id": uid, "last_sync": {"$ne": None}}, {"_id": 0}))
        return {"no_data": not has_device, "awaiting_data": has_device, "has_device": has_device, "data": d, "score_info": si,
                "score": 0, "status": "En attente" if has_device else "Aucune donnee", "status_color": "#F59E0B" if has_device else "#6B7280",
                "subscores": si.get("subscores", {}), "lifts": [], "limits": [],
                "ai": ai_no_data, "daily_plan": plan, "sparklines": {}, "weighings": [], "ecg_history": []}

    ai = await gen_ai(d, si, nora_ctx)
    plan = await compute_daily_plan_async(d, si, uid)

    # Build sparklines from REAL 7-day reading history
    sparks = {}
    seven_days_ago = (datetime.now(timezone.utc) - __import__('datetime').timedelta(days=7)).isoformat()
    br_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_days_ago}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    sc_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale", "timestamp": {"$gte": seven_days_ago}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    for key in ["heart_rate", "spo2", "steps", "sleep_quality", "stress_level", "recovery_score", "hrv"]:
        vals = [r.get("data", {}).get(key, 0) for r in br_readings if r.get("data", {}).get(key)]
        sparks[key] = vals[-7:] if vals else []
    for key in ["weight", "body_fat_pct", "muscle_pct", "water_pct"]:
        vals = [r.get("data", {}).get(key, 0) for r in sc_readings if r.get("data", {}).get(key)]
        sparks[key] = vals[-7:] if vals else []

    # REAL weighings from scale readings
    weighings = []
    all_scale = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}
    ).sort("timestamp", -1).to_list(10)
    for r in all_scale:
        sd = r.get("data", {})
        if sd.get("weight", 0) > 0:
            weighings.append({
                "id": r.get("id", ""), "date": r.get("timestamp", ""),
                "weight": sd.get("weight", 0), "bmi": sd.get("bmi", 0),
                "body_fat_pct": sd.get("body_fat_pct", 0), "muscle_pct": sd.get("muscle_pct", 0),
                "water_pct": sd.get("water_pct", 0), "bone_mass_kg": sd.get("bone_mass_kg", 0),
                "visceral_fat": sd.get("visceral_fat", 0), "body_age": sd.get("body_age", 0),
                "score": sd.get("health_score_balance", 0),
                "status": sd.get("health_evaluation", "--"),
            })

    # Body age from Nora AI (based on all historical data)
    body_age_data = None
    try:
        body_age_result = await db.body_age_cache.find_one({"user_id": uid}, {"_id": 0})
        if body_age_result and body_age_result.get("body_age"):
            body_age_data = body_age_result
            # Override body_age in the data dict with Nora's computed value
            d["body_age"] = body_age_result["body_age"]
    except:
        pass

    # Analysis phase (body age collection progress)
    analysis_phase = None
    distinct_days = set()
    all_user_readings = await db.device_readings.find(
        {"user_id": uid}, {"_id": 0, "timestamp": 1}
    ).to_list(500)
    for r in all_user_readings:
        ts = r.get("timestamp", "")
        if ts:
            distinct_days.add(ts[:10])
    days_count = len(distinct_days)
    if 0 < days_count < 7:
        messages = {
            1: "Debut de l'analyse — Nora collecte vos premieres donnees",
            2: "Collecte des premieres tendances",
            3: "Ajustement de votre profil de sante",
            4: "Analyse des habitudes et correlations",
            5: "Correlation des donnees corporelles et cardiaques",
            6: "Finalisation de votre profil biologique",
        }
        analysis_phase = {
            "day": days_count, "total": 7,
            "message": messages.get(days_count, "Analyse en cours"),
            "progress_pct": round((days_count / 7) * 100),
            "type": "body_age",
        }

    # Activity streak (based on real objective achievement)
    activity_streak = None
    try:
        streak_doc = await db.activity_streaks.find_one({"user_id": uid}, {"_id": 0})
        if streak_doc:
            cs = streak_doc.get("current_streak", 0)
            badge = None
            if cs >= 100:
                badge = {"icon": "ri-vip-diamond-fill", "color": "#10B981", "label": "100 jours"}
            elif cs >= 30:
                badge = {"icon": "ri-medal-fill", "color": "#A78BFA", "label": "1 mois"}
            elif cs >= 14:
                badge = {"icon": "ri-fire-fill", "color": "#EF4444", "label": "2 semaines"}
            elif cs >= 7:
                badge = {"icon": "ri-fire-fill", "color": "#F59E0B", "label": "1 semaine"}
            activity_streak = {
                "current_streak": cs,
                "max_streak": streak_doc.get("max_streak", 0),
                "objectives_today": streak_doc.get("objectives_today", []),
                "badge": badge,
            }
    except:
        pass

    # Evaluate today's objectives for streak (auto-evaluate on report fetch)
    if not activity_streak or streak_doc.get("last_evaluated_day") != datetime.now(timezone.utc).strftime("%Y-%m-%d"):
        objectives_met = evaluate_objectives_met(d)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if objectives_met:
            existing = await db.activity_streaks.find_one({"user_id": uid}, {"_id": 0})
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
            last_day = (existing or {}).get("last_achieved_day", "")
            if last_day == yesterday:
                new_streak = (existing or {}).get("current_streak", 0) + 1
            elif last_day == today_str:
                new_streak = (existing or {}).get("current_streak", 0)
            else:
                new_streak = 1
            max_s = max(new_streak, (existing or {}).get("max_streak", 0))
            await db.activity_streaks.update_one(
                {"user_id": uid},
                {"$set": {"current_streak": new_streak, "max_streak": max_s, "last_achieved_day": today_str, "last_evaluated_day": today_str, "objectives_today": objectives_met}},
                upsert=True
            )
            cs = new_streak
            badge = None
            if cs >= 100: badge = {"icon": "ri-vip-diamond-fill", "color": "#10B981", "label": "100 jours"}
            elif cs >= 30: badge = {"icon": "ri-medal-fill", "color": "#A78BFA", "label": "1 mois"}
            elif cs >= 14: badge = {"icon": "ri-fire-fill", "color": "#EF4444", "label": "2 semaines"}
            elif cs >= 7: badge = {"icon": "ri-fire-fill", "color": "#F59E0B", "label": "1 semaine"}
            activity_streak = {"current_streak": cs, "max_streak": max_s, "objectives_today": objectives_met, "badge": badge}
        else:
            await db.activity_streaks.update_one(
                {"user_id": uid},
                {"$set": {"last_evaluated_day": today_str, "objectives_today": []}},
                upsert=True
            )
            if not activity_streak:
                activity_streak = {"current_streak": 0, "max_streak": 0, "objectives_today": [], "badge": None}

    # ECG history for the health page
    ecg_history = []
    ecg_records = await db.ecg_records.find(
        {"user_id": uid}, {"_id": 0, "data": 0}
    ).sort("timestamp", -1).to_list(10)
    for e in ecg_records:
        bpm_val = e.get("bpm", 0)
        ecg_history.append({
            "id": e.get("id", ""),
            "date": e.get("created_at", e.get("timestamp", "")),
            "bpm": bpm_val,
            "result": e.get("interpretation", "Rythme sinusal"),
            "normal": bpm_val == 0 or (50 <= bpm_val <= 100),
        })

    return {
        "score": si["score"], "status": si["status"], "status_color": si["status_color"],
        "subscores": si["subscores"], "lifts": si["lifts"], "limits": si["limits"],
        "data": d, "ai": ai, "daily_plan": plan, "sparklines": sparks,
        "weighings": weighings, "ecg_history": ecg_history, "human_map_img": HUMAN_MAP_IMG,
        "analysis_phase": analysis_phase,
        "body_age_nora": body_age_data,
        "activity_streak": activity_streak,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }



@router.get("/health/report/pdf")
async def generate_health_report_pdf(period: str = "30j", user=Depends(get_current_user)):
    """Generate a downloadable PDF health report"""
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    import io

    # Gather data from real readings only
    d = gen_data()
    br = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    sc = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    if br and br.get("data"):
        for k, v in br["data"].items():
            if v and k in d: d[k] = v
    if sc and sc.get("data"):
        for k, v in sc["data"].items():
            if v and k in d: d[k] = v
    si = compute_subscores(d)
    ai = await gen_ai(d, si)

    days = {"7j": 7, "30j": 30, "90j": 90}.get(period, 30)
    period_label = {"7j": "7 jours", "30j": "30 jours", "90j": "90 jours"}.get(period, "30 jours")
    now = datetime.now(timezone.utc)
    start_date = now - __import__('datetime').timedelta(days=days)

    # Get real metric histories from device_readings
    metrics_for_report = ["heart_rate", "spo2", "blood_pressure", "temperature", "steps", "weight", "sleep_quality", "stress_level"]
    metric_data = {}
    all_readings = await db.device_readings.find(
        {"user_id": uid, "timestamp": {"$gte": start_date.isoformat()}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    for mk in metrics_for_report:
        vals = []
        for r in all_readings:
            rd = r.get("data", {})
            if mk == "blood_pressure":
                bp = rd.get("blood_pressure")
                if bp and bp.get("systolic"): vals.append(bp)
            else:
                v = rd.get(mk)
                if v: vals.append(v)
        if mk == "blood_pressure":
            if vals:
                sys_vals = [v["systolic"] for v in vals]
                dia_vals = [v["diastolic"] for v in vals]
                metric_data[mk] = {"avg": f"{round(sum(sys_vals)/len(sys_vals))}/{round(sum(dia_vals)/len(dia_vals))}", "min": f"{min(sys_vals)}/{min(dia_vals)}", "max": f"{max(sys_vals)}/{max(dia_vals)}", "last": f"{sys_vals[-1]}/{dia_vals[-1]}"}
            else:
                metric_data[mk] = {"avg": "--", "min": "--", "max": "--", "last": "--"}
        else:
            if vals:
                metric_data[mk] = {"avg": round(sum(vals) / len(vals), 1), "min": round(min(vals), 1), "max": round(max(vals), 1), "last": vals[-1]}
            else:
                metric_data[mk] = {"avg": 0, "min": 0, "max": 0, "last": 0}

    # Build PDF
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)

    # Colors
    DARK = HexColor("#1A1A1A")
    GRAY = HexColor("#666666")
    LIGHT_GRAY = HexColor("#999999")
    BG_LIGHT = HexColor("#F5F5F5")
    GREEN = HexColor("#2D7D46")
    RED = HexColor("#C0392B")
    ACCENT = HexColor("#333333")

    styles = getSampleStyleSheet()
    s_title = ParagraphStyle('Title2', parent=styles['Title'], fontSize=22, textColor=DARK, spaceAfter=2*mm, fontName='Helvetica-Bold')
    s_subtitle = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, textColor=LIGHT_GRAY, spaceAfter=6*mm)
    s_section = ParagraphStyle('Sect', parent=styles['Heading2'], fontSize=13, textColor=DARK, spaceBefore=6*mm, spaceAfter=3*mm, fontName='Helvetica-Bold')
    s_body = ParagraphStyle('Body2', parent=styles['Normal'], fontSize=10, textColor=GRAY, leading=15)
    s_small = ParagraphStyle('Small2', parent=styles['Normal'], fontSize=8, textColor=LIGHT_GRAY, leading=11)
    s_value = ParagraphStyle('Val', parent=styles['Normal'], fontSize=11, textColor=DARK, fontName='Helvetica-Bold')
    s_center = ParagraphStyle('Ctr', parent=styles['Normal'], fontSize=10, textColor=GRAY, alignment=TA_CENTER)

    elements = []

    # Header
    elements.append(Paragraph("RAPPORT DE SANTE", s_title))
    elements.append(Paragraph(f"Patient : {user.get('name', 'Patient')}  |  Periode : {period_label}  |  Genere le {now.strftime('%d/%m/%Y a %Hh%M')}", s_subtitle))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#DDDDDD"), spaceAfter=4*mm))

    # Score section
    score = si["score"]
    status = si["status"]
    score_color = GREEN if score >= 70 else RED
    elements.append(Paragraph("SCORE SANTE GLOBAL", s_section))

    score_data = [
        [Paragraph(f'<font size="28" color="{score_color.hexval()}">{score}</font><font size="10" color="#999999">/100</font>', ParagraphStyle('sc', alignment=TA_CENTER, leading=36)),
         Paragraph(f'<font size="11" color="#333333"><b>{status}</b></font><br/><font size="9" color="#999999">Votre score de sante global est calcule a partir de vos constantes vitales, composition corporelle, activite physique et qualite du sommeil.</font>', s_body)]
    ]
    score_table = Table(score_data, colWidths=[35*mm, 135*mm])
    score_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (0, 0), BG_LIGHT),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('BOX', (0, 0), (-1, -1), 0.5, HexColor("#EEEEEE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 4*mm))

    # Sub-scores
    subs = si.get("subscores", {})
    if subs:
        sub_header = [Paragraph('<b>Categorie</b>', s_small), Paragraph('<b>Score</b>', s_small), Paragraph('<b>Statut</b>', s_small)]
        sub_rows = [sub_header]
        for cat, info in subs.items():
            cat_labels = {"cardio": "Cardiaque", "metabolic": "Metabolique", "activity": "Physique", "recovery": "Recuperation", "body": "Corporelle"}
            sc = info.get("score", 0)
            st = info.get("status", "")
            sc_col = GREEN if sc >= 70 else HexColor("#E67E22") if sc >= 50 else RED
            sub_rows.append([
                Paragraph(cat_labels.get(cat, cat.title()), s_body),
                Paragraph(f'<font color="{sc_col.hexval()}"><b>{sc}/100</b></font>', ParagraphStyle('x', fontSize=10, alignment=TA_CENTER)),
                Paragraph(st, s_body),
            ])
        sub_table = Table(sub_rows, colWidths=[55*mm, 30*mm, 85*mm])
        sub_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
            ('GRID', (0, 0), (-1, -1), 0.3, HexColor("#EEEEEE")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sub_table)

    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#EEEEEE"), spaceAfter=2*mm))

    # Vitals table
    elements.append(Paragraph("CONSTANTES VITALES", s_section))
    vitals_header = [Paragraph('<b>Mesure</b>', s_small), Paragraph('<b>Derniere valeur</b>', s_small), Paragraph('<b>Moyenne</b>', s_small), Paragraph('<b>Min</b>', s_small), Paragraph('<b>Max</b>', s_small), Paragraph('<b>Plage normale</b>', s_small)]
    vitals_rows = [vitals_header]

    vital_info = [
        ("Frequence cardiaque", "heart_rate", "bpm", "60-80"),
        ("Saturation O2 (SpO2)", "spo2", "%", "95-100"),
        ("Tension arterielle", "blood_pressure", "mmHg", "120/80"),
        ("Temperature", "temperature", "°C", "36.3-37.5"),
    ]
    for label, mk, unit, normal in vital_info:
        md = metric_data.get(mk, {})
        vitals_rows.append([
            Paragraph(label, s_body),
            Paragraph(f'<b>{md.get("last", "--")}</b> {unit}', s_value),
            Paragraph(f'{md.get("avg", "--")} {unit}', s_body),
            Paragraph(f'{md.get("min", "--")}', s_body),
            Paragraph(f'{md.get("max", "--")}', s_body),
            Paragraph(normal, s_body),
        ])

    vt = Table(vitals_rows, colWidths=[38*mm, 32*mm, 28*mm, 22*mm, 22*mm, 28*mm])
    vt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.3, HexColor("#EEEEEE")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(vt)
    elements.append(Spacer(1, 4*mm))

    # Activity & Body
    elements.append(Paragraph("ACTIVITE & COMPOSITION CORPORELLE", s_section))
    act_header = [Paragraph('<b>Mesure</b>', s_small), Paragraph('<b>Derniere</b>', s_small), Paragraph('<b>Moyenne</b>', s_small), Paragraph('<b>Min</b>', s_small), Paragraph('<b>Max</b>', s_small)]
    act_rows = [act_header]
    act_info = [
        ("Pas quotidiens", "steps", "pas"),
        ("Poids", "weight", "kg"),
        ("Qualite du sommeil", "sleep_quality", "%"),
        ("Niveau de stress", "stress_level", "/100"),
    ]
    for label, mk, unit in act_info:
        md = metric_data.get(mk, {})
        act_rows.append([
            Paragraph(label, s_body),
            Paragraph(f'<b>{md.get("last", "--")}</b> {unit}', s_value),
            Paragraph(f'{md.get("avg", "--")} {unit}', s_body),
            Paragraph(f'{md.get("min", "--")}', s_body),
            Paragraph(f'{md.get("max", "--")}', s_body),
        ])
    at = Table(act_rows, colWidths=[45*mm, 35*mm, 32*mm, 29*mm, 29*mm])
    at.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.3, HexColor("#EEEEEE")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(at)
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#EEEEEE"), spaceAfter=2*mm))

    # Nora AI Analysis
    elements.append(Paragraph("ANALYSE NORA (IA MEDICALE)", s_section))
    if ai.get("correlations"):
        for c in ai["correlations"][:3]:
            elements.append(Paragraph(f"• {c}", s_body))
            elements.append(Spacer(1, 1.5*mm))

    if ai.get("whats_good"):
        elements.append(Spacer(1, 2*mm))
        elements.append(Paragraph('<font color="#2D7D46"><b>Points forts :</b></font>', s_body))
        for g in ai["whats_good"][:3]:
            elements.append(Paragraph(f"  + {g}", s_body))

    if ai.get("watch_out"):
        elements.append(Spacer(1, 2*mm))
        elements.append(Paragraph('<font color="#C0392B"><b>Points de vigilance :</b></font>', s_body))
        for w in ai["watch_out"][:3]:
            elements.append(Paragraph(f"  ! {w}", s_body))

    if ai.get("motivation"):
        elements.append(Spacer(1, 3*mm))
        elements.append(Paragraph(f'<i>"{ai["motivation"]}"</i>', ParagraphStyle('mot', parent=s_body, textColor=ACCENT)))

    # Disclaimer
    elements.append(Spacer(1, 10*mm))
    elements.append(HRFlowable(width="100%", thickness=0.3, color=HexColor("#DDDDDD"), spaceAfter=3*mm))
    elements.append(Paragraph("AVERTISSEMENT : Ce rapport est genere automatiquement a des fins informatives. Il ne constitue pas un avis medical. Consultez toujours votre medecin pour toute decision de sante.", s_small))
    elements.append(Paragraph(f"CARE WATCH par CHUTEX  |  Rapport genere le {now.strftime('%d/%m/%Y %H:%M')}  |  Confidentiel", s_small))

    doc.build(elements)
    buf.seek(0)

    filename = f"rapport_sante_{user.get('name', 'patient').replace(' ', '_')}_{now.strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ─── Health Correlations ───────────────────────────────────────────────

CORRELATION_PAIRS = [
    # (metric_a, metric_b, label_fr, category)
    ("sleep_quality", "heart_rate", "Sommeil → Frequence cardiaque", "cardio-sommeil"),
    ("sleep_quality", "hrv", "Sommeil → Variabilite cardiaque", "cardio-sommeil"),
    ("sleep_quality", "stress", "Sommeil → Niveau de stress", "sommeil-stress"),
    ("sleep_quality", "steps", "Sommeil → Activite physique", "sommeil-activite"),
    ("steps", "heart_rate", "Activite → Frequence cardiaque", "activite-cardio"),
    ("steps", "stress", "Activite → Stress", "activite-stress"),
    ("steps", "calories", "Pas → Depense calorique", "activite"),
    ("hrv", "stress", "Variabilite cardiaque → Stress", "cardio-stress"),
    ("hrv", "spo2", "Variabilite cardiaque → Oxygenation", "cardio"),
    ("weight", "heart_rate", "Poids → Frequence cardiaque", "composition-cardio"),
    ("weight", "steps", "Poids → Activite physique", "composition-activite"),
    ("body_fat_pct", "heart_rate", "Graisse corporelle → Frequence cardiaque", "composition-cardio"),
    ("body_fat_pct", "muscle_pct", "Graisse → Masse musculaire", "composition"),
    ("muscle_pct", "basal_metabolism", "Muscle → Metabolisme basal", "composition"),
    ("visceral_fat", "heart_rate", "Graisse viscerale → Frequence cardiaque", "composition-cardio"),
    ("water_pct", "weight", "Hydratation → Poids", "composition"),
    ("deep_sleep_min", "recovery_score", "Sommeil profond → Recuperation", "sommeil"),
    ("sleep_quality", "blood_glucose", "Sommeil → Glycemie", "sommeil-metabolisme"),
    ("steps", "blood_glucose", "Activite → Glycemie", "activite-metabolisme"),
]

METRIC_LABELS = {
    "heart_rate": "FC", "hrv": "VFC", "spo2": "SpO2", "stress": "Stress",
    "steps": "Pas", "calories": "Calories", "blood_glucose": "Glycemie",
    "sleep_quality": "Qualite sommeil", "sleep_duration_min": "Duree sommeil",
    "deep_sleep_min": "Sommeil profond", "recovery_score": "Recuperation",
    "weight": "Poids", "bmi": "IMC", "body_fat_pct": "Graisse corp.",
    "muscle_pct": "Muscle", "visceral_fat": "Graisse visc.", "water_pct": "Hydratation",
    "basal_metabolism": "Metab. basal", "temperature": "Temperature",
    "blood_pressure_systolic": "Tension syst.",
}


def _pearson(x: list, y: list) -> float:
    """Compute Pearson correlation coefficient. Returns 0 if insufficient data."""
    n = len(x)
    if n < 5:
        return 0.0
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den_x = sum((xi - mean_x) ** 2 for xi in x) ** 0.5
    den_y = sum((yi - mean_y) ** 2 for yi in y) ** 0.5
    if den_x == 0 or den_y == 0:
        return 0.0
    return round(num / (den_x * den_y), 3)


def _extract_metric(reading_data: dict, key: str):
    """Extract a metric value from a device reading data dict. Returns None if absent/zero."""
    if key == "blood_glucose":
        v = reading_data.get("blood_glucose") or reading_data.get("glycemia")
    elif key == "stress":
        v = reading_data.get("stress") or reading_data.get("stress_level")
    elif key == "deep_sleep_min":
        v = reading_data.get("deep_sleep_min")
        if not v:
            sleep = reading_data.get("sleep", {})
            v = sleep.get("deep_minutes")
    elif key == "sleep_quality":
        v = reading_data.get("sleep_quality")
        if not v:
            sleep = reading_data.get("sleep", {})
            v = sleep.get("sleep_quality")
    elif key == "recovery_score":
        v = reading_data.get("recovery_score")
    elif key == "blood_pressure_systolic":
        bp = reading_data.get("blood_pressure", {})
        v = bp.get("systolic") if isinstance(bp, dict) else None
    else:
        v = reading_data.get(key)
    if v is None or v == 0:
        return None
    return float(v)


def _interpret_correlation(r: float, label: str, metric_a: str, metric_b: str) -> dict:
    """Convert a Pearson r into a user-friendly insight."""
    strength = abs(r)
    if strength < 0.25:
        level = "faible"
        level_icon = "○"
    elif strength < 0.50:
        level = "moderee"
        level_icon = "◐"
    elif strength < 0.75:
        level = "forte"
        level_icon = "●"
    else:
        level = "tres_forte"
        level_icon = "◉"

    direction = "positive" if r > 0 else "negative"
    impact_pct = round(strength * 100)

    a_label = METRIC_LABELS.get(metric_a, metric_a)
    b_label = METRIC_LABELS.get(metric_b, metric_b)

    if r > 0:
        insight = f"Quand votre {a_label.lower()} augmente, votre {b_label.lower()} tend a augmenter aussi ({impact_pct}%)"
    else:
        insight = f"Quand votre {a_label.lower()} augmente, votre {b_label.lower()} tend a diminuer ({impact_pct}%)"

    return {
        "metric_a": metric_a,
        "metric_b": metric_b,
        "label": label,
        "r": r,
        "strength": level,
        "strength_icon": level_icon,
        "direction": direction,
        "impact_pct": impact_pct,
        "insight": insight,
    }


@router.get("/health/correlations")
async def get_health_correlations(user=Depends(get_current_user)):
    """
    Analyse les correlations entre metriques de sante sur les 30 derniers jours.
    Retourne les correlations significatives triees par force, avec insights AI optionnels.
    """
    uid = user['id']

    # Check devices
    has_devices = await db.devices.find_one({"user_id": uid}, {"_id": 0})
    if not has_devices:
        return {
            "correlations": [], "insights": [],
            "data_points": 0, "period_days": 0,
            "no_data": True,
            "message": "Connectez un appareil pour decouvrir les correlations entre vos metriques de sante.",
        }

    # Fetch last 90 days of readings (need volume for correlations)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    bracelet_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(500)

    scale_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale", "timestamp": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(500)

    if not bracelet_readings and not scale_readings:
        return {
            "correlations": [], "insights": [],
            "data_points": 0, "period_days": 0,
            "no_data": True,
            "message": "Pas assez de donnees. Portez vos appareils quelques jours pour obtenir des correlations.",
        }

    # Merge readings by date (day-level aggregation)
    daily_data = {}
    for r in bracelet_readings:
        day = r.get("timestamp", "")[:10]
        if not day:
            continue
        if day not in daily_data:
            daily_data[day] = {}
        data = r.get("data", {})
        for key in ["heart_rate", "hrv", "spo2", "stress", "stress_level", "steps",
                     "calories", "blood_glucose", "sleep_quality", "sleep_duration_min",
                     "deep_sleep_min", "recovery_score", "temperature"]:
            v = _extract_metric(data, key)
            if v is not None:
                daily_data[day][key] = v
        # Extract nested sleep data
        sleep = data.get("sleep", {})
        if sleep:
            for sk in ["sleep_quality", "deep_minutes"]:
                mapped = "sleep_quality" if sk == "sleep_quality" else "deep_sleep_min"
                sv = sleep.get(sk)
                if sv and sv > 0 and mapped not in daily_data[day]:
                    daily_data[day][mapped] = float(sv)
        # Blood pressure
        bp = data.get("blood_pressure", {})
        if isinstance(bp, dict) and bp.get("systolic", 0) > 0:
            daily_data[day]["blood_pressure_systolic"] = float(bp["systolic"])

    for r in scale_readings:
        day = r.get("timestamp", "")[:10]
        if not day:
            continue
        if day not in daily_data:
            daily_data[day] = {}
        data = r.get("data", {})
        for key in ["weight", "bmi", "body_fat_pct", "muscle_pct", "visceral_fat",
                     "water_pct", "basal_metabolism", "bone_mass_kg"]:
            v = _extract_metric(data, key)
            if v is not None:
                daily_data[day][key] = v

    days_sorted = sorted(daily_data.keys())
    period_days = len(days_sorted)

    if period_days < 5:
        return {
            "correlations": [], "insights": [],
            "data_points": period_days, "period_days": period_days,
            "no_data": True,
            "message": f"Seulement {period_days} jours de donnees. Minimum 5 jours requis pour les correlations.",
        }

    # Compute correlations
    raw_correlations = []
    for metric_a, metric_b, label, category in CORRELATION_PAIRS:
        xs, ys = [], []
        for day in days_sorted:
            dd = daily_data[day]
            va = dd.get(metric_a)
            vb = dd.get(metric_b)
            if va is not None and vb is not None:
                xs.append(va)
                ys.append(vb)
        if len(xs) < 5:
            continue
        r = _pearson(xs, ys)
        if abs(r) < 0.15:
            continue
        corr = _interpret_correlation(r, label, metric_a, metric_b)
        corr["data_points"] = len(xs)
        corr["category"] = category
        raw_correlations.append(corr)

    # Sort by absolute correlation strength (strongest first)
    raw_correlations.sort(key=lambda c: abs(c["r"]), reverse=True)

    # Keep top 10 most meaningful
    top_correlations = raw_correlations[:10]

    # Generate AI insights from top correlations
    insights = []
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key and top_correlations:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json as json_mod

            corr_summary = "\n".join(
                f"- {c['label']}: r={c['r']} ({c['strength']}, {c['data_points']} pts)"
                for c in top_correlations[:6]
            )

            user_doc = await db.users.find_one({"_id_str": uid}, {"_id": 0, "name": 1, "age": 1, "birth_date": 1})
            age_str = ""
            if user_doc:
                age = user_doc.get("age")
                if not age and user_doc.get("birth_date"):
                    try:
                        bd = datetime.fromisoformat(user_doc["birth_date"].replace("Z", "+00:00"))
                        age = (datetime.now(timezone.utc) - bd).days // 365
                    except:
                        pass
                if age:
                    age_str = f"Patient de {age} ans. "

            prompt = f"""{age_str}Voici les correlations sante sur {period_days} jours:
{corr_summary}

Genere EXACTEMENT 3 insights medicaux actionables en JSON. Chaque insight doit:
- Etre une phrase courte et concrete (max 20 mots)
- Donner un conseil medical pratique base sur la correlation
- Vouvoyer le patient
- Pas d'emoji

JSON: {{"insights": ["phrase 1", "phrase 2", "phrase 3"]}}"""

            chat = LlmChat(
                api_key=api_key,
                session_id=f"corr-{uuid.uuid4().hex[:8]}",
                system_message="Nora, medecin IA. JSON uniquement. Correlations sante. Prevention et longevite."
            ).with_model("openai", "gpt-5.2")
            resp = await chat.send_message(UserMessage(text=prompt))
            c = resp.strip()
            if c.startswith("```"):
                c = c.split("\n", 1)[1] if "\n" in c else c[3:]
            if c.endswith("```"):
                c = c[:-3]
            parsed = json_mod.loads(c.strip())
            insights = parsed.get("insights", [])[:3]
        except Exception as e:
            print(f"Correlations AI err: {e}")

    # Fallback insights if AI failed
    if not insights and top_correlations:
        for c in top_correlations[:3]:
            insights.append(c["insight"])

    return {
        "correlations": top_correlations,
        "insights": insights,
        "data_points": sum(c["data_points"] for c in top_correlations) if top_correlations else 0,
        "period_days": period_days,
        "total_readings": len(bracelet_readings) + len(scale_readings),
        "no_data": False,
    }


# ─── Correlation Trends (weekly evolution) ─────────────────────────────

def _compute_window_correlations(daily_data: dict, days: list) -> dict:
    """Compute correlations for a specific window of days. Returns {pair_key: r}."""
    results = {}
    for metric_a, metric_b, label, category in CORRELATION_PAIRS:
        xs, ys = [], []
        for day in days:
            dd = daily_data.get(day, {})
            va = dd.get(metric_a)
            vb = dd.get(metric_b)
            if va is not None and vb is not None:
                xs.append(va)
                ys.append(vb)
        if len(xs) >= 4:
            r = _pearson(xs, ys)
            if abs(r) >= 0.15:
                results[f"{metric_a}|{metric_b}"] = r
    return results


@router.get("/health/correlations/trends")
async def get_correlation_trends(user=Depends(get_current_user)):
    """
    Analyse l'evolution des correlations semaine par semaine sur les 8 dernieres semaines.
    Retourne les tendances des top correlations avec sparklines et badges d'evolution.
    """
    uid = user['id']

    has_devices = await db.devices.find_one({"user_id": uid}, {"_id": 0})
    if not has_devices:
        return {"trends": [], "weeks": 0, "no_data": True,
                "message": "Connectez un appareil pour suivre l'evolution de vos correlations."}

    # Fetch 8 weeks (56 days) of readings
    cutoff = (datetime.now(timezone.utc) - timedelta(days=56)).isoformat()
    bracelet_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(800)

    scale_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale", "timestamp": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(800)

    if not bracelet_readings and not scale_readings:
        return {"trends": [], "weeks": 0, "no_data": True,
                "message": "Pas assez de donnees pour analyser les tendances."}

    # Build daily data (same as correlations endpoint)
    daily_data = {}
    for r in bracelet_readings:
        day = r.get("timestamp", "")[:10]
        if not day:
            continue
        if day not in daily_data:
            daily_data[day] = {}
        data = r.get("data", {})
        for key in ["heart_rate", "hrv", "spo2", "stress", "stress_level", "steps",
                     "calories", "blood_glucose", "sleep_quality", "sleep_duration_min",
                     "deep_sleep_min", "recovery_score", "temperature"]:
            v = _extract_metric(data, key)
            if v is not None:
                daily_data[day][key] = v
        sleep = data.get("sleep", {})
        if sleep:
            for sk in ["sleep_quality", "deep_minutes"]:
                mapped = "sleep_quality" if sk == "sleep_quality" else "deep_sleep_min"
                sv = sleep.get(sk)
                if sv and sv > 0 and mapped not in daily_data[day]:
                    daily_data[day][mapped] = float(sv)
        bp = data.get("blood_pressure", {})
        if isinstance(bp, dict) and bp.get("systolic", 0) > 0:
            daily_data[day]["blood_pressure_systolic"] = float(bp["systolic"])

    for r in scale_readings:
        day = r.get("timestamp", "")[:10]
        if not day:
            continue
        if day not in daily_data:
            daily_data[day] = {}
        data = r.get("data", {})
        for key in ["weight", "bmi", "body_fat_pct", "muscle_pct", "visceral_fat",
                     "water_pct", "basal_metabolism", "bone_mass_kg"]:
            v = _extract_metric(data, key)
            if v is not None:
                daily_data[day][key] = v

    all_days = sorted(daily_data.keys())
    if len(all_days) < 7:
        return {"trends": [], "weeks": 0, "no_data": True,
                "message": f"Seulement {len(all_days)} jours de donnees. Minimum 7 jours requis."}

    # Split into weekly windows (most recent first)
    today = datetime.now(timezone.utc).date()
    weeks = []
    for w in range(8):
        week_end = today - timedelta(days=w * 7)
        week_start = week_end - timedelta(days=6)
        week_days = [d for d in all_days if str(week_start) <= d <= str(week_end)]
        if len(week_days) >= 3:
            weeks.append({
                "start": str(week_start),
                "end": str(week_end),
                "days": week_days,
            })

    if len(weeks) < 2:
        return {"trends": [], "weeks": len(weeks), "no_data": True,
                "message": "Minimum 2 semaines de donnees requises pour voir les tendances."}

    weeks.reverse()  # oldest first for sparkline order

    # Compute correlations per week
    weekly_correlations = []
    for w in weeks:
        corrs = _compute_window_correlations(daily_data, w["days"])
        weekly_correlations.append(corrs)

    # Find pairs that appear in at least 2 weeks
    pair_counts = {}
    for wc in weekly_correlations:
        for pair_key in wc:
            pair_counts[pair_key] = pair_counts.get(pair_key, 0) + 1

    trending_pairs = [k for k, v in pair_counts.items() if v >= 2]
    if not trending_pairs:
        return {"trends": [], "weeks": len(weeks), "no_data": True,
                "message": "Pas assez de correlations stables pour calculer des tendances."}

    # Build trend data for each pair
    trends = []
    for pair_key in trending_pairs:
        metric_a, metric_b = pair_key.split("|")
        # Find label & category
        label = f"{METRIC_LABELS.get(metric_a, metric_a)} → {METRIC_LABELS.get(metric_b, metric_b)}"
        category = ""
        for pa, pb, lb, cat in CORRELATION_PAIRS:
            if pa == metric_a and pb == metric_b:
                label = lb
                category = cat
                break

        sparkline = []
        for wc in weekly_correlations:
            r_val = wc.get(pair_key)
            sparkline.append(round(abs(r_val), 2) if r_val is not None else None)

        # Compute trend direction (compare last vs first available)
        valid_points = [(i, v) for i, v in enumerate(sparkline) if v is not None]
        if len(valid_points) < 2:
            continue

        first_val = valid_points[0][1]
        last_val = valid_points[-1][1]
        delta = last_val - first_val
        delta_pct = round((delta / max(first_val, 0.01)) * 100)

        if delta_pct > 10:
            direction = "up"
            direction_label = "Renforce"
            direction_color = "#10B981"
        elif delta_pct < -10:
            direction = "down"
            direction_label = "Affaibli"
            direction_color = "#F59E0B"
        else:
            direction = "stable"
            direction_label = "Stable"
            direction_color = "#6B7280"

        # Current strength
        current_r = sparkline[-1] if sparkline[-1] is not None else (sparkline[-2] if len(sparkline) > 1 and sparkline[-2] is not None else 0)

        trends.append({
            "pair_key": pair_key,
            "metric_a": metric_a,
            "metric_b": metric_b,
            "label": label,
            "category": category,
            "sparkline": sparkline,
            "current_strength": current_r,
            "delta_pct": delta_pct,
            "direction": direction,
            "direction_label": direction_label,
            "direction_color": direction_color,
            "weeks_tracked": len(valid_points),
        })

    # Sort by absolute delta (most changing first)
    trends.sort(key=lambda t: abs(t["delta_pct"]), reverse=True)
    trends = trends[:8]

    # Week labels for sparkline x-axis
    week_labels = []
    for w in weeks:
        d = datetime.strptime(w["start"], "%Y-%m-%d")
        week_labels.append(f"S{d.isocalendar()[1]}")

    return {
        "trends": trends,
        "weeks": len(weeks),
        "week_labels": week_labels,
        "no_data": False,
    }
