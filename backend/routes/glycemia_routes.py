"""
Chutex Care — Glycemia Estimation Algorithm V1
Non-invasive blood glucose estimation based on physiological correlations.
Uses: HRV, resting heart rate, visceral fat, BMI, body fat %, SpO2, sleep, activity, temperature.
NOT a medical device. Estimation only.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os, logging, math

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def estimate_glycemia(profile: dict, bracelet: dict, scale: dict, calibrations: list) -> dict:
    """
    V1 Glycemia estimation algorithm based on published physiological correlations.
    Returns estimated glycemia zone and confidence score.
    
    Scientific basis:
    - HRV inversely correlated with insulin resistance (Frontiers Endocrinology, 2019)
    - Resting HR positively correlated with fasting glucose (Diabetes Care, 2016)
    - Visceral fat strongest predictor of type 2 diabetes (Diabetologia, 2012)
    - SpO2 drops correlated with glucose dysregulation (Sleep Medicine Reviews, 2020)
    - Poor sleep quality increases insulin resistance (Lancet Diabetes, 2015)
    """
    
    # Collect available inputs
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
    
    # Count available data sources for confidence
    data_points = 0
    risk_score = 0.0  # 0 = low risk, 100 = high risk
    
    # === HRV Factor (strongest correlation with insulin resistance) ===
    if hrv > 0:
        data_points += 1
        # Low HRV = higher insulin resistance = higher glucose
        if hrv < 20:
            risk_score += 25
        elif hrv < 30:
            risk_score += 15
        elif hrv < 50:
            risk_score += 8
        else:
            risk_score += 2
    
    # === Resting Heart Rate ===
    if hr_rest > 0:
        data_points += 1
        if hr_rest > 90:
            risk_score += 18
        elif hr_rest > 80:
            risk_score += 12
        elif hr_rest > 72:
            risk_score += 6
        else:
            risk_score += 2
    
    # === Visceral Fat (strongest diabetes predictor) ===
    if visceral_fat > 0:
        data_points += 1
        if visceral_fat > 15:
            risk_score += 22
        elif visceral_fat > 12:
            risk_score += 15
        elif visceral_fat > 9:
            risk_score += 8
        else:
            risk_score += 2
    
    # === BMI ===
    if bmi > 0:
        data_points += 1
        if bmi > 30:
            risk_score += 15
        elif bmi > 25:
            risk_score += 8
        elif bmi > 22:
            risk_score += 3
        else:
            risk_score += 1
    
    # === Body Fat % ===
    if body_fat_pct > 0:
        data_points += 1
        threshold = 33 if not is_male else 25
        if body_fat_pct > threshold + 10:
            risk_score += 12
        elif body_fat_pct > threshold:
            risk_score += 6
        else:
            risk_score += 1
    
    # === SpO2 ===
    if spo2 > 0:
        data_points += 1
        if spo2 < 93:
            risk_score += 10
        elif spo2 < 95:
            risk_score += 5
        else:
            risk_score += 1
    
    # === Sleep Quality ===
    if sleep_quality > 0:
        data_points += 1
        if sleep_quality < 40:
            risk_score += 10
        elif sleep_quality < 60:
            risk_score += 5
        else:
            risk_score += 1
    
    # === Activity (steps) ===
    if steps > 0:
        data_points += 1
        if steps < 2000:
            risk_score += 8
        elif steps < 5000:
            risk_score += 4
        else:
            risk_score += 0  # Activity lowers glucose
    
    # === Age Factor ===
    data_points += 1
    if age > 70:
        risk_score += 8
    elif age > 60:
        risk_score += 5
    elif age > 50:
        risk_score += 3
    
    # === Known diabetes risk ===
    if has_diabetes_risk:
        risk_score += 12
    
    # === Normalize risk score ===
    if data_points == 0:
        return {"status": "insufficient_data", "zone": None, "message": "Pas assez de donnees"}
    
    max_possible = data_points * 25  # Theoretical max per factor
    normalized_risk = min(100, (risk_score / max_possible) * 100) if max_possible > 0 else 50
    
    # === Apply calibration correction if available ===
    calibration_offset = 0.0
    last_calibration = None
    if calibrations:
        # Use the most recent calibration to adjust
        latest = calibrations[0]
        last_calibration = latest.get("date")
        real_value = latest.get("glycemia_value", 0)
        if real_value > 0:
            # Map real value to risk score and compute offset
            if real_value < 1.0:
                expected_risk = 30
            elif real_value < 1.26:
                expected_risk = 55
            else:
                expected_risk = 80
            calibration_offset = expected_risk - normalized_risk
            normalized_risk += calibration_offset * 0.7  # Partial correction
    
    # === Determine zone ===
    if normalized_risk < 35:
        zone = "normal"
        zone_label = "Zone normale"
        zone_color = "#10B981"
        message = "Vos indicateurs de sante suggerent un metabolisme glucidique dans la norme."
        estimated_range = "0.70 - 1.00 g/L"
    elif normalized_risk < 60:
        zone = "vigilance"
        zone_label = "Zone de vigilance"
        zone_color = "#F59E0B"
        message = "Certains indicateurs meritent attention. Parlez-en a votre medecin lors de votre prochain rendez-vous."
        estimated_range = "1.00 - 1.26 g/L"
    else:
        zone = "alert"
        zone_label = "Zone d'alerte"
        zone_color = "#EF4444"
        message = "Plusieurs indicateurs suggerent un risque. Nous vous recommandons un bilan sanguin."
        estimated_range = "> 1.26 g/L"
    
    # Confidence based on data points available
    confidence = min(95, 30 + (data_points * 8))
    
    # Contributing factors (for transparency)
    factors = []
    if hrv > 0:
        factors.append({"name": "Variabilite cardiaque", "value": f"{hrv} ms", "impact": "high" if hrv < 30 else "normal"})
    if hr_rest > 0:
        factors.append({"name": "Frequence cardiaque repos", "value": f"{hr_rest} bpm", "impact": "high" if hr_rest > 80 else "normal"})
    if visceral_fat > 0:
        factors.append({"name": "Graisse viscerale", "value": str(visceral_fat), "impact": "high" if visceral_fat > 12 else "normal"})
    if bmi > 0:
        factors.append({"name": "IMC", "value": f"{bmi}", "impact": "high" if bmi > 30 else "normal"})
    if spo2 > 0:
        factors.append({"name": "SpO2", "value": f"{spo2}%", "impact": "high" if spo2 < 95 else "normal"})
    if sleep_quality > 0:
        factors.append({"name": "Qualite sommeil", "value": f"{sleep_quality}%", "impact": "high" if sleep_quality < 50 else "normal"})
    
    return {
        "status": "estimated",
        "zone": zone,
        "zone_label": zone_label,
        "zone_color": zone_color,
        "message": message,
        "estimated_range": estimated_range,
        "confidence_pct": confidence,
        "risk_score": round(normalized_risk, 1),
        "data_points_used": data_points,
        "factors": factors,
        "last_calibration": last_calibration,
        "calibrations_count": len(calibrations),
    }


@router.get("/glycemia/estimate")
async def get_glycemia_estimate(user=Depends(get_current_user)):
    """Get non-invasive glycemia estimation based on available health data."""
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
        except:
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
        {"_id": 0}
    )
    bracelet = bracelet_reading.get("data", {}) if bracelet_reading else {}
    
    # Get latest scale data
    scale_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"},
        {"_id": 0}
    )
    scale_data = scale_reading.get("data", {}) if scale_reading else {}
    
    # Compute BMI if not in scale data
    if not scale_data.get("bmi") and scale_data.get("weight") and u.get("height_cm"):
        h = u["height_cm"] / 100
        scale_data["bmi"] = round(scale_data["weight"] / (h * h), 1)
    
    # Get calibrations (user-entered real glycemia values)
    calibrations = await db.glycemia_calibrations.find(
        {"user_id": uid},
        {"_id": 0}
    ).sort("date", -1).to_list(12)
    
    result = estimate_glycemia(profile, bracelet, scale_data, calibrations)
    return result


@router.post("/glycemia/calibrate")
async def add_glycemia_calibration(data: dict, user=Depends(get_current_user)):
    """Add a real glycemia measurement (finger prick) for calibration."""
    uid = user["id"]
    value = data.get("glycemia_value")
    if not value or value <= 0:
        raise HTTPException(400, "Valeur de glycemie requise (en g/L)")
    if value > 5:
        raise HTTPException(400, "Valeur invraisemblable. Saisissez en g/L (ex: 1.05)")
    
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": uid,
        "glycemia_value": round(value, 2),
        "unit": "g/L",
        "date": now.isoformat(),
        "source": "manual_capillary",
    }
    await db.glycemia_calibrations.insert_one(doc)
    
    # Count total calibrations
    count = await db.glycemia_calibrations.count_documents({"user_id": uid})
    
    return {
        "status": "saved",
        "glycemia_value": round(value, 2),
        "total_calibrations": count,
        "message": f"Calibration enregistree. {count} mesure(s) au total.",
    }


@router.get("/glycemia/calibrations")
async def get_calibrations(user=Depends(get_current_user)):
    """Get user's glycemia calibration history."""
    uid = user["id"]
    calibrations = await db.glycemia_calibrations.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("date", -1).to_list(24)
    return {"calibrations": calibrations, "count": len(calibrations)}
