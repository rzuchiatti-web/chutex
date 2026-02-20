from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid, random, math
from dotenv import load_dotenv

from database import db
from auth import get_current_user

load_dotenv()
router = APIRouter()


def generate_simulated_health_data():
    """Generate comprehensive simulated health data from bracelet + balance"""
    now = datetime.now(timezone.utc)
    hour = now.hour
    base_hr = 68 + int(8 * math.sin(hour / 24 * math.pi * 2))

    return {
        "heart_rate": base_hr + random.randint(-3, 3),
        "spo2": random.choice([96, 97, 97, 98, 98, 99]),
        "blood_pressure": {"systolic": 125 + random.randint(-5, 5), "diastolic": 78 + random.randint(-3, 3)},
        "temperature": round(36.4 + random.random() * 0.5, 1),
        "steps": 3842 + random.randint(0, 500),
        "calories": 154 + random.randint(0, 30),
        "distance_km": round(2.7 + random.random() * 0.5, 1),
        "weight": round(72.4 + random.random() * 0.3, 1),
        "weight_prev": round(72.8 + random.random() * 0.3, 1),
        "bmi": round(24.1 + random.random() * 0.2, 1),
        "body_fat": round(22.3 + random.random() * 0.5, 1),
        "body_fat_prev": round(22.8 + random.random() * 0.5, 1),
        "muscle_mass": round(33.8 + random.random() * 0.3, 1),
        "muscle_mass_prev": round(33.5 + random.random() * 0.3, 1),
        "water_pct": round(55.2 + random.random() * 0.5, 1),
        "bone_mass": round(3.1 + random.random() * 0.1, 1),
        "visceral_fat": random.choice([8, 9, 9, 10]),
        "metabolic_age": random.choice([62, 63, 64]),
        "sleep_duration_min": random.randint(400, 480),
        "sleep_quality": random.randint(75, 92),
        "deep_sleep_min": random.randint(110, 150),
        "light_sleep_min": random.randint(200, 260),
        "rem_sleep_min": random.randint(50, 80),
        "stress_level": random.choice([25, 30, 35, 40, 45]),
        "recovery_score": random.randint(70, 95),
    }


def compute_health_score(data: dict) -> dict:
    """Compute a health score /100 from all vitals"""
    score = 100
    reasons = []

    hr = data["heart_rate"]
    if hr < 55 or hr > 100:
        score -= 15
        reasons.append("FC hors norme")
    elif hr < 60 or hr > 90:
        score -= 5

    if data["spo2"] < 95:
        score -= 20
        reasons.append("SpO2 basse")
    elif data["spo2"] < 97:
        score -= 5

    bp = data["blood_pressure"]
    if bp["systolic"] > 140 or bp["diastolic"] > 90:
        score -= 15
        reasons.append("Tension elevee")
    elif bp["systolic"] > 130:
        score -= 5

    if data["bmi"] > 30:
        score -= 15
        reasons.append("IMC eleve")
    elif data["bmi"] > 25:
        score -= 5

    if data["sleep_quality"] < 60:
        score -= 15
        reasons.append("Sommeil insuffisant")
    elif data["sleep_quality"] < 75:
        score -= 5

    if data["steps"] < 2000:
        score -= 10
        reasons.append("Activite faible")
    elif data["steps"] < 4000:
        score -= 3

    if data["body_fat"] > 30:
        score -= 10
    elif data["body_fat"] > 25:
        score -= 3

    if data["stress_level"] > 60:
        score -= 10
        reasons.append("Stress eleve")

    score = max(0, min(100, score))

    if score >= 85:
        status = "En forme"
        status_color = "#10B981"
    elif score >= 70:
        status = "Stable"
        status_color = "#38BDF8"
    elif score >= 55:
        status = "A surveiller"
        status_color = "#F59E0B"
    else:
        status = "Attention requise"
        status_color = "#EF4444"

    return {"score": score, "status": status, "status_color": status_color, "reasons": reasons}


async def generate_ai_analysis(data: dict, score_info: dict) -> dict:
    """Generate AI health analysis using LLM"""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {
            "summary": "Vos constantes sont dans les normes. Continuez vos bonnes habitudes.",
            "correlations": ["Votre sommeil de bonne qualite favorise une FC stable.", "Votre activite physique reguliere contribue a maintenir un poids sain."],
            "primary_recommendation": "Augmentez votre hydratation a 8 verres par jour pour ameliorer votre recuperation.",
            "secondary_recommendations": ["Visez 6000 pas par jour cette semaine.", "Essayez de vous coucher avant 23h.", "Ajoutez 10 minutes d'etirements le matin."],
        }

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        sleep_h = data["sleep_duration_min"] // 60
        sleep_m = data["sleep_duration_min"] % 60

        prompt = f"""Tu es un assistant sante bienveillant. Analyse ces donnees et reponds UNIQUEMENT en JSON valide (pas de markdown, pas de ```).

Donnees du jour:
- Score sante: {score_info['score']}/100 ({score_info['status']})
- FC: {data['heart_rate']} bpm, SpO2: {data['spo2']}%, Tension: {data['blood_pressure']['systolic']}/{data['blood_pressure']['diastolic']}
- Poids: {data['weight']}kg (hier: {data['weight_prev']}kg), IMC: {data['bmi']}
- Masse grasse: {data['body_fat']}% (hier: {data['body_fat_prev']}%), Muscle: {data['muscle_mass']}% (hier: {data['muscle_mass_prev']}%)
- Hydratation: {data['water_pct']}%, Graisse viscerale: {data['visceral_fat']}
- Sommeil: {sleep_h}h{sleep_m:02d}, qualite {data['sleep_quality']}%, profond {data['deep_sleep_min']}min
- Pas: {data['steps']}, Calories: {data['calories']}, Distance: {data['distance_km']}km
- Stress: {data['stress_level']}/100, Recuperation: {data['recovery_score']}/100

Reponds avec ce JSON exact:
{{"summary": "2-3 phrases de synthese en langage simple et rassurant", "correlations": ["correlation 1 entre 2 donnees", "correlation 2"], "primary_recommendation": "1 seule recommandation prioritaire actionnable", "secondary_recommendations": ["reco 2", "reco 3", "reco 4"]}}"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"health-report-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un assistant sante professionnel. Reponds uniquement en JSON valide, sans markdown."
        ).with_model("openai", "gpt-4.1-mini")

        response = await chat.send_message(UserMessage(text=prompt))

        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
        result = json.loads(clean)
        return result
    except Exception as e:
        print(f"AI analysis error: {e}")
        return {
            "summary": "Vos constantes sont globalement stables. Votre sommeil et activite physique sont dans les normes.",
            "correlations": ["Un bon sommeil favorise une frequence cardiaque stable au repos.", "L'activite physique reguliere aide a maintenir un poids sain."],
            "primary_recommendation": "Augmentez progressivement votre nombre de pas quotidien de 500 pas cette semaine.",
            "secondary_recommendations": ["Buvez au moins 1.5L d'eau par jour.", "Privilegiez un coucher avant 23h.", "Faites 10 minutes d'etirements le matin."],
        }


@router.get("/health/daily-report")
async def get_daily_report(user=Depends(get_current_user)):
    """Generate comprehensive daily health report with AI analysis"""
    uid = user['id']

    # Try to get real data, fall back to simulated
    bracelet = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])

    data = generate_simulated_health_data()

    # Override with real data if available
    if bracelet and bracelet.get("last_heart_rate", 0) > 0:
        data["heart_rate"] = bracelet.get("last_heart_rate", data["heart_rate"])
        data["spo2"] = bracelet.get("last_spo2", data["spo2"])
        data["steps"] = bracelet.get("last_steps", data["steps"])

    if scale_reading and scale_reading.get("weight", 0) > 0:
        data["weight"] = scale_reading.get("weight", data["weight"])
        data["bmi"] = scale_reading.get("bmi", data["bmi"])
        data["body_fat"] = scale_reading.get("body_fat_pct", data["body_fat"])
        data["muscle_mass"] = scale_reading.get("muscle_mass", data["muscle_mass"])

    score_info = compute_health_score(data)
    ai = await generate_ai_analysis(data, score_info)

    # Sparkline data (7 days simulated)
    sparklines = {}
    for key, base, var in [
        ("weight", data["weight"], 0.5), ("body_fat", data["body_fat"], 0.3),
        ("muscle_mass", data["muscle_mass"], 0.2), ("heart_rate", data["heart_rate"], 5),
        ("steps", data["steps"], 800), ("sleep_quality", data["sleep_quality"], 8),
        ("water_pct", data["water_pct"], 0.3), ("stress_level", data["stress_level"], 10),
    ]:
        sparklines[key] = [round(base + random.uniform(-var, var), 1) for _ in range(7)]

    return {
        "score": score_info["score"],
        "status": score_info["status"],
        "status_color": score_info["status_color"],
        "data": data,
        "ai": ai,
        "sparklines": sparklines,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
