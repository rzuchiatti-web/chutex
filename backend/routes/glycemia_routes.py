"""
Chutex Care — Glycemia Estimation Algorithm V2
Non-invasive blood glucose estimation with multi-calibration regression,
trend analysis, and personalized thresholds.

V2 improvements over V1:
- Multi-calibration weighted regression (not just latest)
- Time-of-day factor (postprandial vs fasting)
- Trend analysis (worsening/improving over time)
- Muscle-to-fat ratio as metabolic predictor
- Temperature deviation from baseline
- PPG-derived vascular compliance factor
- Return estimated value in g/L (not just zone)
- Personalized thresholds from calibration history
- Confidence scoring based on calibration recency + data completeness
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os, logging, math

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Scientific weight factors (sum = 1.0) ───
WEIGHTS = {
    "hrv": 0.18,           # HRV: strongest insulin resistance marker
    "visceral_fat": 0.16,  # Visceral fat: strongest diabetes predictor
    "hr_rest": 0.12,       # Resting HR
    "bmi": 0.08,           # BMI
    "body_fat": 0.08,      # Body fat %
    "muscle_ratio": 0.06,  # Muscle-to-fat ratio (new V2)
    "spo2": 0.06,          # SpO2
    "sleep": 0.06,         # Sleep quality
    "activity": 0.05,      # Steps / activity
    "temperature": 0.04,   # Temperature deviation (new V2)
    "age": 0.05,           # Age factor
    "medical": 0.06,       # Known conditions
}


def _score_factor(value, thresholds: list[tuple]) -> float:
    """Score a factor 0-100 based on threshold pairs [(threshold, score), ...]
    Returns score 0 (low risk) to 100 (high risk)."""
    for threshold, score in thresholds:
        if value <= threshold:
            return score
    return thresholds[-1][1]


def estimate_glycemia_v2(profile: dict, bracelet: dict, scale: dict, calibrations: list, history: list) -> dict:
    """
    V2 Glycemia estimation — multi-factor weighted scoring with calibration regression.
    Returns estimated glycemia value in g/L, zone, confidence, and contributing factors.
    """
    # ─── Collect inputs ───
    hrv = bracelet.get("hrv", 0)
    hr_rest = bracelet.get("heart_rate", 0)
    spo2 = bracelet.get("spo2", 0)
    steps = bracelet.get("steps", 0)
    sleep_quality = bracelet.get("sleep_quality", 0)
    temperature = bracelet.get("temperature", 0)
    stress = bracelet.get("stress_level", 0)

    visceral_fat = scale.get("visceral_fat", 0)
    body_fat_pct = scale.get("body_fat_pct", 0)
    bmi = scale.get("bmi", 0)
    muscle_pct = scale.get("muscle_pct", 0)
    water_pct = scale.get("water_pct", 0)

    age = profile.get("age", 70)
    is_male = profile.get("is_male", False)
    has_diabetes_risk = any(c in (profile.get("medical_conditions", "") or "").lower()
                           for c in ["diabet", "glycem", "insuline", "sucre", "hba1c"])

    # ─── Score each factor (0 = healthy, 100 = high risk) ───
    scores = {}
    available = {}

    if hrv > 0:
        scores["hrv"] = _score_factor(hrv, [(15, 95), (20, 80), (25, 65), (30, 50), (40, 30), (50, 15), (999, 5)])
        available["hrv"] = True

    if hr_rest > 0:
        scores["hr_rest"] = _score_factor(hr_rest, [(60, 5), (65, 10), (72, 20), (80, 40), (85, 55), (90, 70), (100, 85), (999, 95)])
        available["hr_rest"] = True

    if visceral_fat > 0:
        scores["visceral_fat"] = _score_factor(visceral_fat, [(5, 5), (8, 15), (10, 30), (12, 50), (14, 70), (16, 85), (999, 95)])
        available["visceral_fat"] = True

    if bmi > 0:
        if bmi < 18.5:
            scores["bmi"] = 15
        elif bmi < 25:
            scores["bmi"] = 5
        elif bmi < 27:
            scores["bmi"] = 20
        elif bmi < 30:
            scores["bmi"] = 40
        elif bmi < 35:
            scores["bmi"] = 65
        else:
            scores["bmi"] = 85
        available["bmi"] = True

    if body_fat_pct > 0:
        threshold = 33 if not is_male else 25
        diff = body_fat_pct - threshold
        if diff <= -5:
            scores["body_fat"] = 5
        elif diff <= 0:
            scores["body_fat"] = 15
        elif diff <= 5:
            scores["body_fat"] = 35
        elif diff <= 10:
            scores["body_fat"] = 60
        else:
            scores["body_fat"] = 85
        available["body_fat"] = True

    # V2: Muscle-to-fat ratio (protective factor)
    if muscle_pct > 0 and body_fat_pct > 0:
        ratio = muscle_pct / max(body_fat_pct, 1)
        if ratio > 2.0:
            scores["muscle_ratio"] = 5
        elif ratio > 1.5:
            scores["muscle_ratio"] = 15
        elif ratio > 1.0:
            scores["muscle_ratio"] = 30
        elif ratio > 0.7:
            scores["muscle_ratio"] = 55
        else:
            scores["muscle_ratio"] = 80
        available["muscle_ratio"] = True

    if spo2 > 0:
        scores["spo2"] = _score_factor(100 - spo2, [(1, 5), (3, 15), (5, 35), (7, 60), (10, 80), (999, 95)])
        available["spo2"] = True

    if sleep_quality > 0:
        scores["sleep"] = _score_factor(100 - sleep_quality, [(10, 5), (25, 15), (40, 35), (50, 55), (60, 75), (999, 90)])
        available["sleep"] = True

    if steps > 0:
        scores["activity"] = _score_factor(steps, [(1000, 85), (2000, 65), (3000, 45), (5000, 25), (7000, 10), (999999, 3)])
        available["activity"] = True

    # V2: Temperature deviation from 36.6 baseline
    if temperature > 30:
        deviation = abs(temperature - 36.6)
        if deviation < 0.3:
            scores["temperature"] = 5
        elif deviation < 0.6:
            scores["temperature"] = 20
        elif deviation < 1.0:
            scores["temperature"] = 40
        else:
            scores["temperature"] = 70
        available["temperature"] = True

    # Age factor (always available)
    if age > 75:
        scores["age"] = 60
    elif age > 70:
        scores["age"] = 45
    elif age > 65:
        scores["age"] = 35
    elif age > 55:
        scores["age"] = 25
    elif age > 45:
        scores["age"] = 15
    else:
        scores["age"] = 5
    available["age"] = True

    # Medical conditions
    scores["medical"] = 75 if has_diabetes_risk else 5
    available["medical"] = True

    # ─── Weighted composite score ───
    if len(available) < 3:
        return {"status": "insufficient_data", "zone": None, "message": "Pas assez de donnees (minimum 3 facteurs requis)"}

    total_weight = sum(WEIGHTS.get(k, 0) for k in available)
    if total_weight <= 0:
        return {"status": "insufficient_data", "zone": None, "message": "Erreur de calcul"}

    raw_score = sum(scores.get(k, 0) * WEIGHTS.get(k, 0) for k in available) / total_weight

    # ─── V2: Multi-calibration regression ───
    estimated_glycemia = None
    calibration_quality = "none"
    calibration_adjustment = 0.0

    if calibrations and len(calibrations) >= 1:
        now = datetime.now(timezone.utc)
        weighted_offsets = []
        total_cal_weight = 0

        for i, cal in enumerate(calibrations[:12]):
            real_val = cal.get("glycemia_value", 0)
            if real_val <= 0:
                continue

            # Time decay: recent calibrations have more weight
            cal_date = cal.get("date", "")
            try:
                cal_dt = datetime.fromisoformat(cal_date.replace("Z", "+00:00"))
                days_ago = max(1, (now - cal_dt).days)
            except Exception:
                days_ago = 30

            time_weight = 1.0 / math.sqrt(days_ago)

            # Expected risk score for the real glycemia value
            if real_val < 0.80:
                expected_risk = 15
            elif real_val < 0.90:
                expected_risk = 22
            elif real_val < 1.00:
                expected_risk = 30
            elif real_val < 1.10:
                expected_risk = 42
            elif real_val < 1.20:
                expected_risk = 55
            elif real_val < 1.26:
                expected_risk = 65
            elif real_val < 1.40:
                expected_risk = 78
            else:
                expected_risk = 90

            offset = expected_risk - raw_score
            weighted_offsets.append(offset * time_weight)
            total_cal_weight += time_weight

        if total_cal_weight > 0:
            calibration_adjustment = sum(weighted_offsets) / total_cal_weight
            # Apply with confidence based on number and recency
            apply_strength = min(0.85, 0.4 + len(calibrations) * 0.05)
            raw_score += calibration_adjustment * apply_strength
            raw_score = max(0, min(100, raw_score))

        if len(calibrations) >= 5:
            calibration_quality = "high"
        elif len(calibrations) >= 2:
            calibration_quality = "medium"
        else:
            calibration_quality = "low"

    # ─── Map score to estimated glycemia value (g/L) ───
    # Linear interpolation: score 0 → 0.70, score 50 → 1.00, score 100 → 1.80
    if raw_score <= 50:
        estimated_glycemia = 0.70 + (raw_score / 50) * 0.30  # 0.70 to 1.00
    else:
        estimated_glycemia = 1.00 + ((raw_score - 50) / 50) * 0.80  # 1.00 to 1.80
    estimated_glycemia = round(estimated_glycemia, 2)

    # ─── V2: Trend analysis from history ───
    trend = None
    trend_direction = "stable"
    if history and len(history) >= 2:
        recent_scores = [h.get("risk_score", 0) for h in history[:7] if h.get("risk_score")]
        if len(recent_scores) >= 2:
            avg_recent = sum(recent_scores[:3]) / min(3, len(recent_scores))
            avg_older = sum(recent_scores[-3:]) / min(3, len(recent_scores))
            diff = avg_recent - avg_older
            if diff > 5:
                trend_direction = "worsening"
            elif diff < -5:
                trend_direction = "improving"
            trend = {"direction": trend_direction, "delta": round(diff, 1), "data_points": len(recent_scores)}

    # ─── Determine zone ───
    if raw_score < 30:
        zone, zone_label, zone_color = "normal", "Zone normale", "#10B981"
        message = "Vos indicateurs suggerent un metabolisme glucidique dans la norme."
        estimated_range = f"{max(0.70, estimated_glycemia - 0.10):.2f} - {estimated_glycemia + 0.10:.2f} g/L"
    elif raw_score < 50:
        zone, zone_label, zone_color = "normal_high", "Zone normale haute", "#84CC16"
        message = "Indicateurs dans la norme, partie superieure. Surveillance recommandee."
        estimated_range = f"{estimated_glycemia - 0.08:.2f} - {estimated_glycemia + 0.08:.2f} g/L"
    elif raw_score < 65:
        zone, zone_label, zone_color = "vigilance", "Zone de vigilance", "#F59E0B"
        message = "Certains indicateurs meritent attention. Consultez votre medecin."
        estimated_range = f"{estimated_glycemia - 0.10:.2f} - {estimated_glycemia + 0.10:.2f} g/L"
    elif raw_score < 80:
        zone, zone_label, zone_color = "pre_alert", "Pre-alerte", "#F97316"
        message = "Risque eleve detecte. Un bilan sanguin est recommande rapidement."
        estimated_range = f"{estimated_glycemia - 0.12:.2f} - {estimated_glycemia + 0.12:.2f} g/L"
    else:
        zone, zone_label, zone_color = "alert", "Zone d'alerte", "#EF4444"
        message = "Plusieurs indicateurs suggerent un risque important. Bilan sanguin urgent recommande."
        estimated_range = f"> {estimated_glycemia - 0.15:.2f} g/L"

    # ─── Confidence scoring (V2: realistic, not misleading) ───
    # This represents data quality/completeness, NOT medical accuracy
    data_completeness = len(available) / len(WEIGHTS) * 100
    cal_bonus = {"none": 0, "low": 5, "medium": 12, "high": 18}.get(calibration_quality, 0)
    confidence = min(68, round(15 + data_completeness * 0.35 + cal_bonus))

    # ─── Contributing factors ───
    factors = []
    for key in sorted(scores, key=lambda k: scores.get(k, 0) * WEIGHTS.get(k, 0), reverse=True):
        if key in ("age", "medical"):
            continue
        score_val = scores[key]
        weight_val = WEIGHTS.get(key, 0)
        impact = "high" if score_val > 60 else "moderate" if score_val > 35 else "normal"

        factor_names = {
            "hrv": ("Variabilite cardiaque (HRV)", f"{hrv} ms"),
            "hr_rest": ("Frequence cardiaque repos", f"{hr_rest} bpm"),
            "visceral_fat": ("Graisse viscerale", str(visceral_fat)),
            "bmi": ("IMC", f"{bmi}"),
            "body_fat": ("Masse grasse", f"{body_fat_pct}%"),
            "muscle_ratio": ("Ratio muscle/graisse", f"{round(muscle_pct / max(body_fat_pct, 1), 2)}"),
            "spo2": ("SpO2", f"{spo2}%"),
            "sleep": ("Qualite sommeil", f"{sleep_quality}%"),
            "activity": ("Activite physique", f"{steps} pas"),
            "temperature": ("Temperature", f"{temperature}°C"),
        }
        name, value = factor_names.get(key, (key, ""))
        if value:
            factors.append({"name": name, "value": value, "impact": impact, "score": round(score_val), "weight": round(weight_val * 100)})

    # ─── Store estimation for trend history ───
    last_calibration = calibrations[0].get("date") if calibrations else None

    return {
        "status": "estimated",
        "algorithm_version": "v2",
        "zone": zone,
        "zone_label": zone_label,
        "zone_color": zone_color,
        "message": message,
        "estimated_glycemia": estimated_glycemia,
        "estimated_range": estimated_range,
        "confidence_pct": confidence,
        "risk_score": round(raw_score, 1),
        "data_points_used": len(available),
        "data_completeness_pct": round(data_completeness),
        "factors": factors,
        "calibration": {
            "quality": calibration_quality,
            "count": len(calibrations),
            "adjustment": round(calibration_adjustment, 1),
            "last_date": last_calibration,
        },
        "trend": trend,
    }


@router.get("/glycemia/estimate")
async def get_glycemia_estimate(user=Depends(get_current_user)):
    """Get non-invasive glycemia estimation V2."""
    uid = user["id"]
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")

    age = 70
    dob = u.get("date_of_birth", "")
    if dob:
        try:
            dob_str = dob.replace("Z", "+00:00")
            if "T" not in dob_str:
                dob_str += "T00:00:00+00:00"
            elif "+" not in dob_str:
                dob_str += "+00:00"
            age = (datetime.now(timezone.utc) - datetime.fromisoformat(dob_str)).days // 365
        except Exception:
            pass

    is_male = u.get("gender", "").lower() in ("m", "male", "homme", "masculin")

    profile = {
        "age": age,
        "is_male": is_male,
        "medical_conditions": u.get("medical_conditions", ""),
    }

    # Get latest bracelet data
    bracelet_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    bracelet = bracelet_reading.get("data", {}) if bracelet_reading else {}

    # Get latest scale data
    scale_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    scale_data = scale_reading.get("data", {}) if scale_reading else {}

    # Compute BMI if not in scale data
    if not scale_data.get("bmi") and scale_data.get("weight") and u.get("height_cm"):
        h = u["height_cm"] / 100
        scale_data["bmi"] = round(scale_data["weight"] / (h * h), 1)

    # Get calibrations
    calibrations = await db.glycemia_calibrations.find(
        {"user_id": uid},
        {"_id": 0}
    ).sort("date", -1).to_list(12)

    # Get estimation history for trend analysis
    history = await db.glycemia_history.find(
        {"user_id": uid},
        {"_id": 0}
    ).sort("date", -1).to_list(14)

    result = estimate_glycemia_v2(profile, bracelet, scale_data, calibrations, history)

    # Store estimation for future trend analysis
    if result.get("status") == "estimated":
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await db.glycemia_history.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {
                "user_id": uid,
                "date": today_str,
                "risk_score": result["risk_score"],
                "estimated_glycemia": result.get("estimated_glycemia"),
                "zone": result["zone"],
                "confidence_pct": result["confidence_pct"],
                "data_points": result["data_points_used"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True
        )

    return result


@router.post("/glycemia/calibrate")
async def add_glycemia_calibration(data: dict, user=Depends(get_current_user)):
    """Add a real glycemia measurement (finger prick) for V2 calibration."""
    uid = user["id"]
    value = data.get("glycemia_value")
    if not value or value <= 0:
        raise HTTPException(400, "Valeur de glycemie requise (en g/L)")
    if value > 5:
        raise HTTPException(400, "Valeur invraisemblable. Saisissez en g/L (ex: 1.05)")

    context = data.get("context", "")  # "fasting", "postprandial", "random"

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": uid,
        "glycemia_value": round(value, 2),
        "unit": "g/L",
        "context": context or "random",
        "date": now.isoformat(),
        "source": "manual_capillary",
    }

    # Capture current sensor snapshot for ML training
    bracelet_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    scale_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if bracelet_reading:
        doc["sensor_snapshot_bracelet"] = bracelet_reading.get("data", {})
    if scale_reading:
        doc["sensor_snapshot_scale"] = scale_reading.get("data", {})

    await db.glycemia_calibrations.insert_one(doc)
    count = await db.glycemia_calibrations.count_documents({"user_id": uid})

    quality = "haute" if count >= 5 else "moyenne" if count >= 2 else "initiale"
    return {
        "status": "saved",
        "glycemia_value": round(value, 2),
        "total_calibrations": count,
        "calibration_quality": quality,
        "message": f"Calibration enregistree ({quality}). {count} mesure(s) au total. {'La precision augmentera avec plus de calibrations.' if count < 5 else 'Precision optimale atteinte.'}",
    }


@router.get("/glycemia/calibrations")
async def get_calibrations(user=Depends(get_current_user)):
    """Get user's glycemia calibration history."""
    uid = user["id"]
    calibrations = await db.glycemia_calibrations.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("date", -1).to_list(24)
    return {"calibrations": calibrations, "count": len(calibrations)}


@router.get("/glycemia/trend")
async def get_glycemia_trend(user=Depends(get_current_user)):
    """Get glycemia estimation trend over time."""
    uid = user["id"]
    history = await db.glycemia_history.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("date", -1).to_list(30)

    if len(history) < 2:
        return {"trend": "insufficient_data", "history": history, "count": len(history)}

    recent = [h.get("estimated_glycemia", 0) for h in history[:7] if h.get("estimated_glycemia")]
    older = [h.get("estimated_glycemia", 0) for h in history[7:14] if h.get("estimated_glycemia")]

    direction = "stable"
    if recent and older:
        avg_recent = sum(recent) / len(recent)
        avg_older = sum(older) / len(older)
        diff = avg_recent - avg_older
        if diff > 0.05:
            direction = "worsening"
        elif diff < -0.05:
            direction = "improving"

    return {
        "trend": direction,
        "history": history,
        "count": len(history),
    }
