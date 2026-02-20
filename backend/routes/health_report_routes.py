from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid, random, math
from dotenv import load_dotenv

from database import db
from auth import get_current_user

load_dotenv()
router = APIRouter()


def generate_simulated_health_data():
    """Generate ALL health data from bracelet Elio + balance Vita"""
    now = datetime.now(timezone.utc)
    hour = now.hour
    base_hr = 68 + int(8 * math.sin(hour / 24 * math.pi * 2))
    weight = round(72.4 + random.random() * 0.3, 1)
    height_cm = 173
    bmi = round(weight / (height_cm / 100) ** 2, 1)
    body_fat_pct = round(22.3 + random.random() * 0.5, 1)
    muscle_pct = round(33.8 + random.random() * 0.3, 1)
    water_pct = round(55.2 + random.random() * 0.5, 1)

    return {
        # ── BRACELET ELIO ──
        "heart_rate": base_hr + random.randint(-3, 3),
        "heart_rate_prev": base_hr + random.randint(-2, 4),
        "hrv": random.randint(35, 55),
        "spo2": random.choice([96, 97, 97, 98, 98, 99]),
        "blood_pressure": {"systolic": 125 + random.randint(-5, 5), "diastolic": 78 + random.randint(-3, 3)},
        "temperature": round(36.4 + random.random() * 0.5, 1),
        "vo2_max": round(28 + random.random() * 4, 1),
        "glycemia": round(0.95 + random.random() * 0.15, 2),
        "stress_level": random.randint(25, 45),
        "stress_prev": random.randint(28, 50),
        "recovery_score": random.randint(70, 95),
        "recovery_prev": random.randint(65, 90),
        # Activite
        "steps": 3842 + random.randint(0, 500),
        "steps_prev": 3200 + random.randint(0, 600),
        "calories": 154 + random.randint(0, 30),
        "distance_km": round(2.7 + random.random() * 0.5, 1),
        # Sommeil
        "sleep_duration_min": random.randint(400, 480),
        "sleep_quality": random.randint(75, 92),
        "deep_sleep_min": random.randint(110, 150),
        "light_sleep_min": random.randint(200, 260),
        "rem_sleep_min": random.randint(50, 80),
        "sleep_interruptions": random.randint(1, 4),
        # ── BALANCE VITA ──
        "weight": weight,
        "weight_prev": round(weight + random.uniform(-0.4, 0.4), 1),
        "height_cm": height_cm,
        "bmi": bmi,
        "health_score_balance": random.randint(75, 95),
        "health_evaluation": random.choice(["Bonne", "Tres bonne", "Bonne"]),
        "body_age": random.randint(60, 66),
        "body_type": random.choice(["Type standard", "Type musculaire standard", "Manque de type d'exercice"]),
        "obesity_degree": random.choice(["Standard", "Standard", "Legerement eleve"]),
        "adiposity_level": round(body_fat_pct + random.uniform(-1, 1), 1),
        "recommended_calories": random.randint(1800, 2200),
        "normal_weight": round(height_cm * height_cm / 10000 * 22, 1),
        "ideal_weight": round(height_cm * height_cm / 10000 * 21, 1),
        "weight_control": round(weight - height_cm * height_cm / 10000 * 22, 1),
        "fat_control": round(body_fat_pct * weight / 100 - 15, 1),
        "muscle_control": round(muscle_pct * weight / 100 - 28, 1),
        # Graisse
        "body_fat_pct": body_fat_pct,
        "body_fat_prev": round(body_fat_pct + random.uniform(-0.3, 0.5), 1),
        "fat_mass_kg": round(body_fat_pct * weight / 100, 1),
        "visceral_fat": random.choice([8, 9, 9, 10]),
        "subcutaneous_fat_pct": round(body_fat_pct - random.uniform(3, 5), 1),
        "subcutaneous_fat_kg": round((body_fat_pct - 4) * weight / 100, 1),
        "trunk_fat_kg": round(body_fat_pct * 0.4 * weight / 100, 1),
        # Muscles / Proteines
        "muscle_pct": muscle_pct,
        "muscle_prev": round(muscle_pct + random.uniform(-0.3, 0.2), 1),
        "muscle_mass_kg": round(muscle_pct * weight / 100, 1),
        "protein_pct": round(16 + random.random() * 2, 1),
        "protein_mass_kg": round(16.5 * weight / 100, 1),
        "skeletal_muscle_pct": round(muscle_pct - 5 + random.random(), 1),
        "skeletal_muscle_kg": round((muscle_pct - 5) * weight / 100, 1),
        "skeletal_muscle_quality": random.randint(85, 100),
        # Hydratation
        "water_pct": water_pct,
        "water_prev": round(water_pct + random.uniform(-0.3, 0.3), 1),
        "total_body_water_kg": round(water_pct * weight / 100, 1),
        "intracellular_water_kg": round(water_pct * 0.6 * weight / 100, 1),
        "extracellular_water_kg": round(water_pct * 0.4 * weight / 100, 1),
        # Os / Mineraux
        "bone_mass_kg": round(3.0 + random.random() * 0.2, 1),
        "minerals_kg": round(3.8 + random.random() * 0.2, 1),
        # Composition avancee
        "basal_metabolism": random.randint(1450, 1650),
        "cell_body_mass_kg": round(32 + random.random() * 3, 1),
        "waist_hip_ratio": round(0.82 + random.random() * 0.06, 2),
        "waist_hip_status": random.choice(["Standard", "Standard", "Legerement eleve"]),
        # Segmentaire
        "left_arm_fat_pct": round(20 + random.random() * 4, 1),
        "right_arm_fat_pct": round(20 + random.random() * 4, 1),
        "left_arm_fat_kg": round(0.8 + random.random() * 0.3, 1),
        "right_arm_fat_kg": round(0.8 + random.random() * 0.3, 1),
        "left_arm_muscle_pct": round(32 + random.random() * 3, 1),
        "right_arm_muscle_pct": round(32 + random.random() * 3, 1),
        "left_leg_fat_pct": round(24 + random.random() * 4, 1),
        "right_leg_fat_pct": round(24 + random.random() * 4, 1),
        "left_leg_muscle_kg": round(8 + random.random(), 1),
        "right_leg_muscle_kg": round(8 + random.random(), 1),
    }


def compute_health_score(d: dict) -> dict:
    score = 100
    reasons = []
    hr = d["heart_rate"]
    if hr < 55 or hr > 100: score -= 15; reasons.append("FC hors norme")
    elif hr < 60 or hr > 90: score -= 5
    if d["spo2"] < 95: score -= 20; reasons.append("SpO2 basse")
    elif d["spo2"] < 97: score -= 5
    bp = d["blood_pressure"]
    if bp["systolic"] > 140 or bp["diastolic"] > 90: score -= 15; reasons.append("Tension elevee")
    elif bp["systolic"] > 130: score -= 5
    if d["bmi"] > 30: score -= 15; reasons.append("IMC eleve")
    elif d["bmi"] > 25: score -= 5
    if d["sleep_quality"] < 60: score -= 15; reasons.append("Sommeil insuffisant")
    elif d["sleep_quality"] < 75: score -= 5
    if d["steps"] < 2000: score -= 10; reasons.append("Activite faible")
    elif d["steps"] < 4000: score -= 3
    if d["body_fat_pct"] > 30: score -= 10
    elif d["body_fat_pct"] > 25: score -= 3
    if d["stress_level"] > 60: score -= 10; reasons.append("Stress eleve")
    if d["visceral_fat"] > 12: score -= 10; reasons.append("Graisse viscerale elevee")
    if d["water_pct"] < 50: score -= 5; reasons.append("Hydratation basse")
    score = max(0, min(100, score))
    if score >= 85: status, color = "En forme", "#10B981"
    elif score >= 70: status, color = "Stable", "#38BDF8"
    elif score >= 55: status, color = "A surveiller", "#F59E0B"
    else: status, color = "Attention requise", "#EF4444"
    return {"score": score, "status": status, "status_color": color, "reasons": reasons}


async def generate_ai_analysis(d: dict, score_info: dict) -> dict:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return _fallback_analysis()
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        sl_h, sl_m = d["sleep_duration_min"] // 60, d["sleep_duration_min"] % 60
        prompt = f"""Tu es un coach sante bienveillant et intelligent. Analyse ces donnees de sante et reponds UNIQUEMENT en JSON valide (pas de markdown).

DONNEES DU JOUR:
Score: {score_info['score']}/100 ({score_info['status']})
BRACELET: FC {d['heart_rate']}bpm, HRV {d['hrv']}ms, SpO2 {d['spo2']}%, Tension {d['blood_pressure']['systolic']}/{d['blood_pressure']['diastolic']}, Temp {d['temperature']}C, VO2max {d['vo2_max']}, Glycemie {d['glycemia']}g/L, Stress {d['stress_level']}/100, Recuperation {d['recovery_score']}/100
ACTIVITE: {d['steps']} pas (hier: {d['steps_prev']}), {d['calories']}kcal, {d['distance_km']}km
SOMMEIL: {sl_h}h{sl_m:02d}, qualite {d['sleep_quality']}%, profond {d['deep_sleep_min']}min, {d['sleep_interruptions']} interruptions
BALANCE: Poids {d['weight']}kg (hier: {d['weight_prev']}kg), IMC {d['bmi']}, Age corporel {d['body_age']} ans, Type: {d['body_type']}
COMPOSITION: Graisse {d['body_fat_pct']}% (hier: {d['body_fat_prev']}%), Muscle {d['muscle_pct']}% (hier: {d['muscle_prev']}%), Eau {d['water_pct']}%, Os {d['bone_mass_kg']}kg
AVANCE: Graisse viscerale {d['visceral_fat']}, Ratio taille-hanche {d['waist_hip_ratio']} ({d['waist_hip_status']}), Metabolisme basal {d['basal_metabolism']}kcal, Apport recommande {d['recommended_calories']}kcal
OBJECTIFS: Controle poids {d['weight_control']:+.1f}kg, Controle graisse {d['fat_control']:+.1f}kg, Controle muscle {d['muscle_control']:+.1f}kg

CONSIGNES:
- Ton bienveillant, rassurant, motivant (coach, pas medecin)
- Explique les LIENS entre donnees (sommeil→stress, activite→cardio, poids→composition)
- Donne des conseils PERSONNALISES basees sur CES donnees, pas generiques
- Mets en avant la PROGRESSION meme petite
- Utilise le tutoiement

Reponds avec ce JSON:
{{"summary": "3-4 phrases de synthese en langage simple, motivant et personnalise", "whats_good": ["ce qui va bien 1", "ce qui va bien 2"], "watch_out": ["point d'attention 1"], "correlations": ["correlation 1 entre 2+ donnees", "correlation 2", "correlation 3"], "primary_recommendation": "1 seule action concrete prioritaire pour aujourd'hui", "secondary_recommendations": ["action 2", "action 3", "action 4"], "motivation": "1 phrase motivante sur la progression"}}"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"health-{uuid.uuid4().hex[:8]}",
            system_message="Tu es un coach sante bienveillant. JSON uniquement, pas de markdown."
        ).with_model("openai", "gpt-4.1-mini")
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean = response.strip()
        if clean.startswith("```"): clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
        if clean.endswith("```"): clean = clean[:-3]
        return json.loads(clean.strip())
    except Exception as e:
        print(f"AI error: {e}")
        return _fallback_analysis()


def _fallback_analysis():
    return {
        "summary": "Tes constantes sont stables aujourd'hui. Ton sommeil et ton activite physique contribuent a maintenir un bon equilibre. Continue comme ca !",
        "whats_good": ["Frequence cardiaque au repos saine", "Hydratation correcte"],
        "watch_out": ["Augmente legerement ton activite physique"],
        "correlations": ["Un bon sommeil favorise une FC stable au repos", "L'activite physique reguliere aide a maintenir un poids sain"],
        "primary_recommendation": "Augmente progressivement tes pas de 500 par jour cette semaine.",
        "secondary_recommendations": ["Bois au moins 1.5L d'eau", "Couche-toi avant 23h", "10 min d'etirements le matin"],
        "motivation": "Chaque petit pas compte. Tu es sur la bonne voie !",
    }


@router.get("/health/daily-report")
async def get_daily_report(user=Depends(get_current_user)):
    uid = user['id']
    bracelet = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    d = generate_simulated_health_data()
    if bracelet and bracelet.get("last_heart_rate", 0) > 0:
        d["heart_rate"] = bracelet.get("last_heart_rate", d["heart_rate"])
        d["spo2"] = bracelet.get("last_spo2", d["spo2"])
        d["steps"] = bracelet.get("last_steps", d["steps"])
    if scale_reading and scale_reading.get("weight", 0) > 0:
        d["weight"] = scale_reading.get("weight", d["weight"])
        d["bmi"] = scale_reading.get("bmi", d["bmi"])
        d["body_fat_pct"] = scale_reading.get("body_fat_pct", d["body_fat_pct"])
        d["muscle_pct"] = scale_reading.get("muscle_mass", d["muscle_pct"])

    score_info = compute_health_score(d)
    ai = await generate_ai_analysis(d, score_info)

    # Sparklines 7 jours
    sparks = {}
    for key, base, var in [
        ("weight", d["weight"], 0.5), ("body_fat_pct", d["body_fat_pct"], 0.3),
        ("muscle_pct", d["muscle_pct"], 0.2), ("heart_rate", d["heart_rate"], 5),
        ("steps", d["steps"], 800), ("sleep_quality", d["sleep_quality"], 8),
        ("water_pct", d["water_pct"], 0.3), ("stress_level", d["stress_level"], 10),
        ("recovery_score", d["recovery_score"], 8), ("hrv", d["hrv"], 5),
    ]:
        sparks[key] = [round(base + random.uniform(-var, var), 1) for _ in range(7)]

    return {
        "score": score_info["score"], "status": score_info["status"],
        "status_color": score_info["status_color"],
        "data": d, "ai": ai, "sparklines": sparks,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
