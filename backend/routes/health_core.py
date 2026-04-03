"""
Health Core — Shared utility functions for all health modules.
Extracted from health_report_routes.py during pre-production audit refactoring.
"""
from datetime import datetime, timezone, timedelta
import os
import uuid
import math

from database import db
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

HUMAN_MAP_IMG = 'https://static.prod-images.emergentagent.com/jobs/92308143-f99e-4bad-8264-e3775a214313/images/507b1652c3de902f1f09c90079dc145841dafc79343fd12f407cb3208b5df085.png'


def estimate_vo2_max(age: int, resting_hr: float, hrv: float, steps_daily: float = 0, gender: str = "F", weight_kg: float = 0) -> float:
    """Estimate VO2 Max using the Uth-Sorensen-Overgaard-Pedersen formula."""
    if not age or not resting_hr or resting_hr < 40:
        return 0
    hr_max = 208 - (0.7 * age)
    vo2_base = 15.3 * (hr_max / resting_hr)
    hrv_correction = (hrv - 35) * 0.12 if hrv and hrv > 0 else 0
    activity_correction = max(0, (steps_daily - 4000) / 1000) * 0.4 if steps_daily and steps_daily > 0 else 0
    gender_correction = 2.5 if gender.upper() in ("M", "HOMME", "MALE") else 0
    weight_correction = 0
    if weight_kg and age:
        threshold = 90 if gender.upper() in ("M", "HOMME", "MALE") else 80
        if weight_kg > threshold:
            weight_correction = -((weight_kg - threshold) * 0.15)
    vo2_max = vo2_base + hrv_correction + activity_correction + gender_correction + weight_correction
    return max(12, min(60, round(vo2_max, 1)))


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


def has_meaningful_data(d):
    """Check if the data dict contains at least one valid, non-zero health metric."""
    g = d.get
    if 30 < g("heart_rate", 0) < 220:
        return True
    if 80 < g("spo2", 0) <= 100:
        return True
    bp = g("blood_pressure", {"systolic": 0, "diastolic": 0})
    if 60 < bp.get("systolic", 0) < 250:
        return True
    if 34 < g("temperature", 0) < 42:
        return True
    if g("steps", 0) > 0:
        return True
    if g("sleep_quality", 0) > 0:
        return True
    if 20 < g("weight", 0) < 250:
        return True
    if g("bmi", 0) > 10:
        return True
    if g("body_fat_pct", 0) > 1:
        return True
    if g("muscle_pct", 0) > 1:
        return True
    if g("water_pct", 0) > 1:
        return True
    return False


def sanitize_data(d):
    """Remove erroneous/implausible readings so they don't pollute scoring."""
    if d.get("temperature", 0) < 30 or d.get("temperature", 0) > 45:
        d["temperature"] = 0
    if d.get("weight", 0) > 250 or d.get("weight", 0) < 2:
        d["weight"] = 0
        d["bmi"] = 0
        d["body_fat_pct"] = 0
        d["muscle_pct"] = 0
        d["water_pct"] = 0
        d["visceral_fat"] = 0
        d["body_age"] = 0
        d["bone_mass_kg"] = 0
    if d.get("heart_rate", 0) > 220 or (0 < d.get("heart_rate", 0) < 25):
        d["heart_rate"] = 0
    return d


def compute_subscores(d):
    """Compute health subscores. Returns no_data=True if no meaningful data exists."""
    d = sanitize_data(d)

    if not has_meaningful_data(d):
        def empty_sub(label, icon, color):
            return {"score": 0, "label": label, "icon": icon, "color": color, "no_data": True}
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

    def clamp(v):
        return max(0, min(100, v))

    def g(k, default=0):
        return d.get(k, default)

    cardio = 100
    hr = g("heart_rate")
    if hr > 0:
        if hr < 55 or hr > 100:
            cardio -= 25
        elif hr < 60 or hr > 90:
            cardio -= 10
    spo2 = g("spo2")
    if spo2 > 0:
        if spo2 < 95:
            cardio -= 25
        elif spo2 < 97:
            cardio -= 10
    bp = g("blood_pressure", {"systolic": 0, "diastolic": 0})
    if bp.get("systolic", 0) > 0:
        if bp["systolic"] > 140:
            cardio -= 20
        elif bp["systolic"] > 130:
            cardio -= 8
    hrv = g("hrv")
    if hrv > 0 and hrv < 25:
        cardio -= 15

    sleep = 100
    sq = g("sleep_quality")
    if sq > 0:
        if sq < 60:
            sleep -= 30
        elif sq < 75:
            sleep -= 10
    sdm = g("sleep_duration_min")
    if sdm > 0:
        if sdm < 360:
            sleep -= 20
        elif sdm < 420:
            sleep -= 5
    if g("sleep_interruptions") > 4:
        sleep -= 15
    stress = g("stress_level")
    if stress > 0:
        if stress > 60:
            sleep -= 15
        elif stress > 40:
            sleep -= 5

    activity = 100
    steps = g("steps")
    if steps > 0:
        if steps < 2000:
            activity -= 30
        elif steps < 4000:
            activity -= 10
        elif steps < 6000:
            activity -= 3
    cal = g("calories")
    if cal > 0 and cal < 100:
        activity -= 10

    metabolism = 100
    bmi = g("bmi")
    if bmi > 0:
        if bmi > 30:
            metabolism -= 25
        elif bmi > 25:
            metabolism -= 8
    bfp = g("body_fat_pct")
    if bfp > 0:
        if bfp > 30:
            metabolism -= 20
        elif bfp > 25:
            metabolism -= 8
    vf = g("visceral_fat")
    if vf > 0:
        if vf > 12:
            metabolism -= 20
        elif vf > 10:
            metabolism -= 8
    mp = g("muscle_pct")
    if mp > 0 and mp < 28:
        metabolism -= 10

    hydration = 100
    wp = g("water_pct")
    if wp > 0:
        if wp < 45:
            hydration -= 30
        elif wp < 50:
            hydration -= 15
        elif wp < 55:
            hydration -= 5

    subs = {
        "cardio": {"score": clamp(cardio), "label": "Coeur", "icon": "ri-heart-pulse-line", "color": "#EF4444"},
        "sleep": {"score": clamp(sleep), "label": "Sommeil", "icon": "ri-moon-line", "color": "#A78BFA"},
        "activity": {"score": clamp(activity), "label": "Activite", "icon": "ri-footprint-line", "color": "#10B981"},
        "metabolism": {"score": clamp(metabolism), "label": "Metabolisme", "icon": "ri-body-scan-line", "color": "#F59E0B"},
        "hydration": {"score": clamp(hydration), "label": "Hydratation", "icon": "ri-drop-line", "color": "#38BDF8"},
    }

    scored_subs = [s for s in subs.values() if s["score"] < 100]
    if scored_subs:
        global_score = clamp(round(sum(s["score"] for s in subs.values()) / 5))
    else:
        global_score = 100

    if global_score >= 85:
        status, color = "En forme", "#10B981"
    elif global_score >= 70:
        status, color = "Stable", "#38BDF8"
    elif global_score >= 55:
        status, color = "A surveiller", "#F59E0B"
    else:
        status, color = "Attention requise", "#EF4444"
    lifts = [s["label"] for k, s in subs.items() if s["score"] >= 85]
    limits = [s["label"] for k, s in subs.items() if s["score"] < 75]
    return {"score": global_score, "status": status, "status_color": color, "subscores": subs, "lifts": lifts, "limits": limits}


def evaluate_objectives_met(d):
    """Check which daily objectives are met based on real data."""
    met = []
    g = d.get
    steps = g("steps", 0)
    if steps >= 6000:
        met.append("steps")
    elif steps >= 4000 and g("recovery_score", 0) < 70:
        met.append("steps")
    if g("water_pct", 0) >= 55:
        met.append("hydration")
    if g("sleep_quality", 0) >= 75:
        met.append("sleep")
    if g("calories", 0) >= 200:
        met.append("calories")
    if g("distance_km", 0) >= 3:
        met.append("distance")
    bmi = g("bmi", 0)
    if 18.5 <= bmi <= 25:
        met.append("bmi")
    if 0 < g("body_fat_pct", 0) <= 25:
        met.append("body_fat")
    return met
