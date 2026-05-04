"""Algorithmes de scoring santé Chutex.

Tous les calculs sont **stateless** (input = dict, output = dict).
La couche route est responsable de la persistance en BDD.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


# ─────────────────────────────────────────────────────────────────────
# 1) Cardio score (0-100)
# ─────────────────────────────────────────────────────────────────────
def cardio_score(*, heart_rate: Optional[float] = None, hrv: Optional[float] = None,
                 spo2: Optional[float] = None, age: Optional[int] = None) -> dict:
    """Score cardiovasculaire 0-100 basé sur FC, HRV, SpO2 et âge."""
    score = 50
    factors = []

    if heart_rate:
        # FC repos optimale: 60-70 bpm. Score décroît si trop bas/haut
        if 55 <= heart_rate <= 75:
            score += 20
            factors.append({"name": "FC", "good": True, "value": heart_rate})
        elif 75 < heart_rate <= 90:
            score += 10
            factors.append({"name": "FC", "good": True, "value": heart_rate})
        elif heart_rate > 100 or heart_rate < 50:
            score -= 10
            factors.append({"name": "FC", "good": False, "value": heart_rate})

    if hrv:
        # HRV: plus c'est haut, mieux c'est. Référence ajustée par âge.
        ref = 50 if age and age > 60 else 70 if age and age > 40 else 90
        if hrv >= ref:
            score += 15
            factors.append({"name": "HRV", "good": True, "value": hrv})
        elif hrv >= ref * 0.7:
            score += 5
        else:
            score -= 5
            factors.append({"name": "HRV", "good": False, "value": hrv})

    if spo2:
        if spo2 >= 96:
            score += 15
            factors.append({"name": "SpO2", "good": True, "value": spo2})
        elif spo2 >= 93:
            score += 5
        else:
            score -= 15
            factors.append({"name": "SpO2", "good": False, "value": spo2})

    score = max(0, min(100, score))
    return {"score": score, "factors": factors}


# ─────────────────────────────────────────────────────────────────────
# 2) Sleep score (0-100)
# ─────────────────────────────────────────────────────────────────────
def sleep_score(*, duration_min: Optional[float] = None,
                deep_min: Optional[float] = None,
                rem_min: Optional[float] = None,
                quality_pct: Optional[float] = None,
                wake_count: Optional[int] = None) -> dict:
    """Score sommeil 0-100 basé sur durée, profondeur, REM, réveils."""
    score = 50
    factors = []

    if duration_min:
        h = duration_min / 60
        if 7 <= h <= 9:
            score += 25
            factors.append({"name": "Duree", "good": True, "value": round(h, 1)})
        elif 6 <= h < 7 or 9 < h <= 10:
            score += 10
        else:
            score -= 10
            factors.append({"name": "Duree", "good": False, "value": round(h, 1)})

    if deep_min and duration_min:
        deep_pct = (deep_min / duration_min) * 100
        if deep_pct >= 20:
            score += 15
            factors.append({"name": "Profond", "good": True, "value": round(deep_pct, 1)})
        elif deep_pct >= 13:
            score += 5
        else:
            score -= 5

    if rem_min and duration_min:
        rem_pct = (rem_min / duration_min) * 100
        if rem_pct >= 20:
            score += 10
        elif rem_pct < 10:
            score -= 5

    if quality_pct is not None:
        # Use raw quality if device provides
        score = round((score + quality_pct) / 2)

    if wake_count is not None:
        if wake_count <= 2:
            score += 5
        elif wake_count >= 5:
            score -= 10
            factors.append({"name": "Reveils", "good": False, "value": wake_count})

    score = max(0, min(100, score))
    return {"score": score, "factors": factors}


# ─────────────────────────────────────────────────────────────────────
# 3) Activity score (0-100)
# ─────────────────────────────────────────────────────────────────────
def activity_score(*, steps: Optional[int] = None,
                   active_min: Optional[float] = None,
                   calories: Optional[float] = None,
                   age: Optional[int] = None) -> dict:
    """Score activité 0-100 basé sur pas, minutes actives, calories."""
    score = 30
    factors = []

    if steps:
        # Adapté par âge : senior 5000, adulte 8000-10000
        target = 5000 if age and age > 65 else 7500 if age and age > 50 else 9000
        ratio = steps / target
        if ratio >= 1:
            score += 35
            factors.append({"name": "Pas", "good": True, "value": steps})
        elif ratio >= 0.7:
            score += 25
        elif ratio >= 0.4:
            score += 10
        else:
            score -= 5
            factors.append({"name": "Pas", "good": False, "value": steps})

    if active_min:
        if active_min >= 30:
            score += 20
        elif active_min >= 15:
            score += 10
        else:
            score -= 5

    if calories:
        # Senior: 1500-2000 kcal/j, adulte: 2000-2500
        target_cal = 1700 if age and age > 65 else 2200
        if calories >= target_cal * 0.9:
            score += 15

    score = max(0, min(100, score))
    return {"score": score, "factors": factors}


# ─────────────────────────────────────────────────────────────────────
# 4) Stress score (0-100, 100 = stress faible = bon)
# ─────────────────────────────────────────────────────────────────────
def stress_score(*, hrv: Optional[float] = None,
                 stress_level: Optional[float] = None,
                 age: Optional[int] = None) -> dict:
    """Score stress (inversé : 100 = stress faible)."""
    score = 60
    factors = []
    if stress_level is not None:
        # stress_level 0-100 (capteur), inverser
        score = round(100 - stress_level)
        factors.append({"name": "Stress capteur", "good": stress_level < 50, "value": stress_level})
    elif hrv:
        ref = 50 if age and age > 60 else 70 if age and age > 40 else 90
        if hrv >= ref:
            score = 80
        elif hrv >= ref * 0.7:
            score = 60
        else:
            score = 35
            factors.append({"name": "HRV bas", "good": False, "value": hrv})
    return {"score": max(0, min(100, score)), "factors": factors}


# ─────────────────────────────────────────────────────────────────────
# 5) Body age estimation
# ─────────────────────────────────────────────────────────────────────
def body_age(*, age: int, weight_kg: Optional[float] = None,
             height_cm: Optional[float] = None,
             body_fat_pct: Optional[float] = None,
             muscle_pct: Optional[float] = None,
             water_pct: Optional[float] = None,
             visceral_fat: Optional[float] = None) -> dict:
    """Estimation simple de l'âge biologique corporel.
    Formule pragmatique basée sur composition corporelle vs normes par âge.
    """
    if not age:
        return {"body_age": None, "delta": 0}
    bonus_years = 0

    if body_fat_pct is not None and height_cm and weight_kg:
        # Référence : 18-25% homme, 25-32% femme (on prend 22% milieu)
        fat_norm = 22
        delta_fat = body_fat_pct - fat_norm
        if delta_fat > 5:
            bonus_years += min(8, int(delta_fat / 2))
        elif delta_fat < -3:
            bonus_years -= min(3, int(abs(delta_fat) / 3))

    if muscle_pct is not None:
        # Plus de muscle = plus jeune
        if muscle_pct < 30:
            bonus_years += 4
        elif muscle_pct >= 40:
            bonus_years -= 3

    if visceral_fat is not None:
        if visceral_fat >= 13:
            bonus_years += 5
        elif visceral_fat >= 10:
            bonus_years += 2

    if water_pct is not None:
        if water_pct < 50:
            bonus_years += 2

    if weight_kg and height_cm:
        bmi = weight_kg / ((height_cm / 100) ** 2)
        if bmi >= 30:
            bonus_years += 4
        elif bmi >= 25:
            bonus_years += 1
        elif bmi < 18.5:
            bonus_years += 2

    body_age_value = max(15, age + bonus_years)
    return {"body_age": body_age_value, "delta": bonus_years, "real_age": age}


# ─────────────────────────────────────────────────────────────────────
# 6) Daily report aggregator
# ─────────────────────────────────────────────────────────────────────
def daily_report(*, vitals: list[dict] | None = None,
                 latest_scale: dict | None = None,
                 age: Optional[int] = None,
                 height_cm: Optional[float] = None) -> dict:
    """Agrège des vitals d'une journée en sous-scores + score global."""
    vitals = vitals or []
    if not vitals:
        return {
            "samples": 0,
            "global_score": 0,
            "subscores": {"cardio": 0, "sleep": 0, "activity": 0, "stress": 50},
            "summary": "Aucune donnée enregistrée aujourd'hui.",
        }

    # Moyennes
    def _avg(key):
        vals = [v.get(key) for v in vitals if v.get(key) is not None]
        return sum(vals) / len(vals) if vals else None

    avg_hr = _avg("heart_rate")
    avg_spo2 = _avg("spo2")
    avg_hrv = _avg("hrv")
    total_steps = sum(v.get("steps", 0) or 0 for v in vitals)
    total_cal = sum(v.get("calories", 0) or 0 for v in vitals)
    sleep_dur = max((v.get("sleep_duration_min") or 0) for v in vitals)
    sleep_qual = max((v.get("sleep_quality") or 0) for v in vitals)

    cardio = cardio_score(heart_rate=avg_hr, hrv=avg_hrv, spo2=avg_spo2, age=age)
    sleep = sleep_score(duration_min=sleep_dur, quality_pct=sleep_qual)
    activity = activity_score(steps=total_steps, calories=total_cal, age=age)
    stress = stress_score(hrv=avg_hrv, age=age)

    global_score = round(
        (cardio["score"] * 0.30 + sleep["score"] * 0.30
         + activity["score"] * 0.25 + stress["score"] * 0.15)
    )

    # Body age (si scale data)
    ba = None
    if latest_scale:
        ba = body_age(
            age=age or 50,
            weight_kg=latest_scale.get("weight"),
            height_cm=height_cm,
            body_fat_pct=latest_scale.get("body_fat_pct"),
            muscle_pct=latest_scale.get("muscle_pct"),
            water_pct=latest_scale.get("water_pct"),
            visceral_fat=latest_scale.get("visceral_fat"),
        )

    return {
        "samples": len(vitals),
        "global_score": global_score,
        "subscores": {
            "cardio": cardio["score"], "sleep": sleep["score"],
            "activity": activity["score"], "stress": stress["score"],
        },
        "averages": {
            "heart_rate": round(avg_hr, 1) if avg_hr else None,
            "spo2": round(avg_spo2, 1) if avg_spo2 else None,
            "hrv": round(avg_hrv, 1) if avg_hrv else None,
            "total_steps": total_steps,
            "total_calories": round(total_cal, 0) if total_cal else 0,
            "sleep_duration_min": round(sleep_dur, 0) if sleep_dur else 0,
        },
        "body_age": ba,
        "factors": cardio["factors"] + sleep["factors"] + activity["factors"] + stress["factors"],
    }


# ─────────────────────────────────────────────────────────────────────
# 7) Aging score (fragility / longevity composite)
# ─────────────────────────────────────────────────────────────────────
def aging_score(*, body_age_value: Optional[int] = None,
                real_age: Optional[int] = None,
                global_score: Optional[int] = None) -> dict:
    """Indice de longévité / vieillissement (0-100 = jeune)."""
    if not real_age:
        return {"score": None, "level": "unknown"}

    bg = body_age_value or real_age
    delta = bg - real_age

    # Plus on est jeune biologiquement, plus le score est haut
    base = 100 - (delta * 5)
    if global_score:
        base = round((base + global_score) / 2)
    base = max(0, min(100, base))

    if base >= 80:
        level = "excellent"
    elif base >= 65:
        level = "bon"
    elif base >= 50:
        level = "moyen"
    elif base >= 35:
        level = "preoccupant"
    else:
        level = "critique"

    return {"score": base, "level": level, "biological_delta": delta}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
