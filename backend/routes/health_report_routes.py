from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os, uuid, random, math
from dotenv import load_dotenv

from database import db
from auth import get_current_user

load_dotenv()
router = APIRouter()

HUMAN_MAP_IMG = 'https://static.prod-images.emergentagent.com/jobs/92308143-f99e-4bad-8264-e3775a214313/images/507b1652c3de902f1f09c90079dc145841dafc79343fd12f407cb3208b5df085.png'


def gen_data():
    now = datetime.now(timezone.utc)
    h = now.hour
    hr = 68 + int(8 * math.sin(h / 24 * math.pi * 2)) + random.randint(-3, 3)
    w = round(72.4 + random.random() * 0.3, 1)
    bf = round(22.3 + random.random() * 0.5, 1)
    mp = round(33.8 + random.random() * 0.3, 1)
    wp = round(55.2 + random.random() * 0.5, 1)
    return {
        "heart_rate": hr, "heart_rate_prev": hr + random.randint(-2, 4),
        "hrv": random.randint(35, 55), "spo2": random.choice([96, 97, 97, 98, 98, 99]),
        "blood_pressure": {"systolic": 125 + random.randint(-5, 5), "diastolic": 78 + random.randint(-3, 3)},
        "temperature": round(36.4 + random.random() * 0.5, 1),
        "vo2_max": round(28 + random.random() * 4, 1), "glycemia": round(0.95 + random.random() * 0.15, 2),
        "stress_level": random.randint(25, 45), "stress_prev": random.randint(28, 50),
        "recovery_score": random.randint(70, 95), "recovery_prev": random.randint(65, 90),
        "steps": 3842 + random.randint(0, 500), "steps_prev": 3200 + random.randint(0, 600),
        "calories": 154 + random.randint(0, 30), "distance_km": round(2.7 + random.random() * 0.5, 1),
        "sleep_duration_min": random.randint(400, 480), "sleep_quality": random.randint(75, 92),
        "deep_sleep_min": random.randint(110, 150), "light_sleep_min": random.randint(200, 260),
        "rem_sleep_min": random.randint(50, 80), "sleep_interruptions": random.randint(1, 4),
        "weight": w, "weight_prev": round(w + random.uniform(-0.4, 0.4), 1), "height_cm": 173,
        "bmi": round(w / (1.73 ** 2), 1), "health_score_balance": random.randint(75, 95),
        "health_evaluation": random.choice(["Bonne", "Tres bonne"]),
        "body_age": random.randint(60, 66), "body_type": random.choice(["Type standard", "Type musculaire standard"]),
        "obesity_degree": random.choice(["Standard", "Standard", "Legerement eleve"]),
        "recommended_calories": random.randint(1800, 2200),
        "ideal_weight": round(1.73 ** 2 * 21, 1), "weight_control": round(w - 1.73 ** 2 * 22, 1),
        "body_fat_pct": bf, "body_fat_prev": round(bf + random.uniform(-0.3, 0.5), 1),
        "fat_mass_kg": round(bf * w / 100, 1), "visceral_fat": random.choice([8, 9, 9, 10]),
        "subcutaneous_fat_pct": round(bf - random.uniform(3, 5), 1),
        "trunk_fat_kg": round(bf * 0.4 * w / 100, 1),
        "muscle_pct": mp, "muscle_prev": round(mp + random.uniform(-0.3, 0.2), 1),
        "muscle_mass_kg": round(mp * w / 100, 1),
        "protein_pct": round(16 + random.random() * 2, 1),
        "skeletal_muscle_pct": round(mp - 5 + random.random(), 1),
        "skeletal_muscle_quality": random.randint(85, 100),
        "water_pct": wp, "water_prev": round(wp + random.uniform(-0.3, 0.3), 1),
        "total_body_water_kg": round(wp * w / 100, 1),
        "intracellular_water_kg": round(wp * 0.6 * w / 100, 1),
        "extracellular_water_kg": round(wp * 0.4 * w / 100, 1),
        "bone_mass_kg": round(3.0 + random.random() * 0.2, 1),
        "minerals_kg": round(3.8 + random.random() * 0.2, 1),
        "basal_metabolism": random.randint(1450, 1650),
        "waist_hip_ratio": round(0.82 + random.random() * 0.06, 2),
        "waist_hip_status": random.choice(["Standard", "Standard", "Legerement eleve"]),
        "left_arm_fat_pct": round(20 + random.random() * 4, 1),
        "right_arm_fat_pct": round(20 + random.random() * 4, 1),
        "left_arm_muscle_pct": round(32 + random.random() * 3, 1),
        "right_arm_muscle_pct": round(32 + random.random() * 3, 1),
        "left_leg_fat_pct": round(24 + random.random() * 4, 1),
        "right_leg_fat_pct": round(24 + random.random() * 4, 1),
        "left_leg_muscle_kg": round(8 + random.random(), 1),
        "right_leg_muscle_kg": round(8 + random.random(), 1),
    }


def compute_subscores(d):
    def clamp(v): return max(0, min(100, v))
    cardio = 100
    if d["heart_rate"] < 55 or d["heart_rate"] > 100: cardio -= 25
    elif d["heart_rate"] < 60 or d["heart_rate"] > 90: cardio -= 10
    if d["spo2"] < 95: cardio -= 25
    elif d["spo2"] < 97: cardio -= 10
    bp = d["blood_pressure"]
    if bp["systolic"] > 140: cardio -= 20
    elif bp["systolic"] > 130: cardio -= 8
    if d["hrv"] < 25: cardio -= 15

    sleep = 100
    if d["sleep_quality"] < 60: sleep -= 30
    elif d["sleep_quality"] < 75: sleep -= 10
    if d["sleep_duration_min"] < 360: sleep -= 20
    elif d["sleep_duration_min"] < 420: sleep -= 5
    if d["sleep_interruptions"] > 4: sleep -= 15
    if d["stress_level"] > 60: sleep -= 15
    elif d["stress_level"] > 40: sleep -= 5

    activity = 100
    if d["steps"] < 2000: activity -= 30
    elif d["steps"] < 4000: activity -= 10
    elif d["steps"] < 6000: activity -= 3
    if d["calories"] < 100: activity -= 10

    metabolism = 100
    if d["bmi"] > 30: metabolism -= 25
    elif d["bmi"] > 25: metabolism -= 8
    if d["body_fat_pct"] > 30: metabolism -= 20
    elif d["body_fat_pct"] > 25: metabolism -= 8
    if d["visceral_fat"] > 12: metabolism -= 20
    elif d["visceral_fat"] > 10: metabolism -= 8
    if d["muscle_pct"] < 28: metabolism -= 10

    hydration = 100
    if d["water_pct"] < 45: hydration -= 30
    elif d["water_pct"] < 50: hydration -= 15
    elif d["water_pct"] < 55: hydration -= 5

    subs = {
        "cardio": {"score": clamp(cardio), "label": "Coeur", "icon": "ri-heart-pulse-line", "color": "#EF4444"},
        "sleep": {"score": clamp(sleep), "label": "Sommeil", "icon": "ri-moon-line", "color": "#A78BFA"},
        "activity": {"score": clamp(activity), "label": "Activite", "icon": "ri-footprint-line", "color": "#10B981"},
        "metabolism": {"score": clamp(metabolism), "label": "Metabolisme", "icon": "ri-body-scan-line", "color": "#F59E0B"},
        "hydration": {"score": clamp(hydration), "label": "Hydratation", "icon": "ri-drop-line", "color": "#38BDF8"},
    }
    global_score = clamp(round(sum(s["score"] for s in subs.values()) / 5))
    if global_score >= 85: status, color = "En forme", "#10B981"
    elif global_score >= 70: status, color = "Stable", "#38BDF8"
    elif global_score >= 55: status, color = "A surveiller", "#F59E0B"
    else: status, color = "Attention requise", "#EF4444"
    # What lifts / limits the score
    lifts = [s["label"] for k, s in subs.items() if s["score"] >= 85]
    limits = [s["label"] for k, s in subs.items() if s["score"] < 75]
    return {"score": global_score, "status": status, "status_color": color, "subscores": subs, "lifts": lifts, "limits": limits}


def compute_daily_plan(d, score_info):
    plan = []
    plan.append({"key": "calories", "label": "Apport calorique", "value": f"{d['recommended_calories']}", "unit": "kcal", "status": "objectif", "icon": "ri-fire-line", "color": "#F59E0B",
                 "detail": f"Ton metabolisme de base est de {d['basal_metabolism']} kcal. Avec ton activite, vise {d['recommended_calories']} kcal aujourd'hui."})
    step_goal = 6000 if d["recovery_score"] >= 70 else 4000
    plan.append({"key": "steps", "label": "Objectif pas", "value": f"{step_goal}", "unit": "pas", "status": "en cours" if d["steps"] < step_goal else "atteint",
                 "progress": min(100, round(d["steps"] / step_goal * 100)), "icon": "ri-footprint-line", "color": "#10B981",
                 "detail": f"Tu es a {d['steps']} pas. Objectif adapte a ta recuperation ({d['recovery_score']}/100)."})
    water_goal = 1.5 if d["water_pct"] >= 55 else 2.0
    plan.append({"key": "hydration", "label": "Hydratation", "value": f"{water_goal}L", "unit": "minimum", "status": "priorite" if d["water_pct"] < 55 else "OK",
                 "icon": "ri-drop-line", "color": "#38BDF8",
                 "detail": f"Ton taux d'hydratation est de {d['water_pct']}%. {'Augmente ta consommation d eau.' if d['water_pct'] < 55 else 'Continue a bien t hydrater.'}"})
    bed = "22:30" if d["sleep_quality"] < 80 else "23:00"
    plan.append({"key": "sleep", "label": "Coucher conseille", "value": bed, "unit": "", "status": "conseil",
                 "icon": "ri-moon-line", "color": "#A78BFA",
                 "detail": f"Qualite de sommeil hier: {d['sleep_quality']}%. {'Un coucher plus tot ameliorera ta recuperation.' if d['sleep_quality'] < 80 else 'Ton sommeil est bon, maintiens ce rythme.'}"})
    return plan


async def gen_ai(d, si):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return _fb()
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        sh, sm = d["sleep_duration_min"] // 60, d["sleep_duration_min"] % 60
        prompt = f"""Coach sante bienveillant. Analyse et reponds UNIQUEMENT en JSON (pas de markdown).

DONNEES: Score {si['score']}/100 ({si['status']}). Sous-scores: Cardio {si['subscores']['cardio']['score']}, Sommeil {si['subscores']['sleep']['score']}, Activite {si['subscores']['activity']['score']}, Metabolisme {si['subscores']['metabolism']['score']}, Hydratation {si['subscores']['hydration']['score']}.
FC {d['heart_rate']}bpm (HRV {d['hrv']}ms), SpO2 {d['spo2']}%, Tension {d['blood_pressure']['systolic']}/{d['blood_pressure']['diastolic']}, VO2max {d['vo2_max']}, Stress {d['stress_level']}/100, Recup {d['recovery_score']}/100.
Sommeil {sh}h{sm:02d} (qualite {d['sleep_quality']}%, {d['sleep_interruptions']} interruptions).
{d['steps']} pas, {d['calories']}kcal. Poids {d['weight']}kg (hier {d['weight_prev']}), IMC {d['bmi']}, Age corp {d['body_age']} ans.
Graisse {d['body_fat_pct']}% (hier {d['body_fat_prev']}%), Muscle {d['muscle_pct']}% (hier {d['muscle_prev']}%), Eau {d['water_pct']}%, Visc {d['visceral_fat']}, Ratio TH {d['waist_hip_ratio']}.
Apport reco {d['recommended_calories']}kcal, Metabolisme basal {d['basal_metabolism']}kcal.

CONSIGNES: Tutoiement, bienveillant, motivant, personnalise. Mets en avant la progression. Explique les LIENS entre donnees.

JSON:
{{"hero_line": "1 phrase resume ultra courte pour le hero (max 12 mots)", "priority": "1 action prioritaire concrete pour aujourd'hui", "priority_why": "pourquoi c'est la priorite en 1 phrase", "correlations": ["insight 1 liant 2+ donnees", "insight 2", "insight 3"], "whats_good": ["point positif 1", "point positif 2"], "watch_out": ["attention 1"], "secondary_recs": ["conseil 2", "conseil 3", "conseil 4"], "motivation": "1 phrase motivante courte", "score_explain_up": "ce qui tire le score vers le haut", "score_explain_down": "ce qui limite le score"}}"""

        chat = LlmChat(api_key=api_key, session_id=f"h-{uuid.uuid4().hex[:8]}",
                       system_message="Coach sante. JSON uniquement.").with_model("openai", "gpt-4.1-mini")
        r = await chat.send_message(UserMessage(text=prompt))
        import json
        c = r.strip()
        if c.startswith("```"): c = c.split("\n", 1)[1] if "\n" in c else c[3:]
        if c.endswith("```"): c = c[:-3]
        return json.loads(c.strip())
    except Exception as e:
        print(f"AI err: {e}")
        return _fb()


def _fb():
    return {
        "hero_line": "Tes constantes sont stables, continue comme ca !",
        "priority": "Augmente tes pas de 500 aujourd'hui.",
        "priority_why": "Ton activite est un peu basse par rapport a ta recuperation.",
        "correlations": ["Ton bon sommeil favorise une FC stable", "L'activite aide a maintenir ton poids"],
        "whats_good": ["FC au repos saine", "Hydratation correcte"],
        "watch_out": ["Augmente legerement ton activite"],
        "secondary_recs": ["Bois 1.5L d'eau", "Couche-toi avant 23h", "10 min d'etirements"],
        "motivation": "Chaque petit pas compte !",
        "score_explain_up": "Cardio et sommeil sont tes points forts",
        "score_explain_down": "L'activite pourrait etre amelioree",
    }


@router.get("/health/daily-report")
async def get_daily_report(user=Depends(get_current_user)):
    uid = user['id']
    bracelet = await db.devices.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0})
    scale = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    d = gen_data()
    if bracelet and bracelet.get("last_heart_rate", 0) > 0:
        d["heart_rate"] = bracelet.get("last_heart_rate", d["heart_rate"])
        d["spo2"] = bracelet.get("last_spo2", d["spo2"])
        d["steps"] = bracelet.get("last_steps", d["steps"])
    if scale and scale.get("weight", 0) > 0:
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct"]:
            if k in scale: d[k] = scale[k]

    si = compute_subscores(d)
    ai = await gen_ai(d, si)
    plan = compute_daily_plan(d, si)

    sparks = {}
    for key, base, var in [("weight", d["weight"], 0.5), ("body_fat_pct", d["body_fat_pct"], 0.3),
        ("muscle_pct", d["muscle_pct"], 0.2), ("heart_rate", d["heart_rate"], 5),
        ("steps", d["steps"], 800), ("sleep_quality", d["sleep_quality"], 8),
        ("water_pct", d["water_pct"], 0.3), ("stress_level", d["stress_level"], 10),
        ("recovery_score", d["recovery_score"], 8), ("hrv", d["hrv"], 5)]:
        sparks[key] = [round(base + random.uniform(-var, var), 1) for _ in range(7)]

    # Simulated last weighings
    weighings = []
    for i in range(5):
        wt = round(d["weight"] + random.uniform(-0.5, 0.5), 1)
        bf = round(d["body_fat_pct"] + random.uniform(-0.3, 0.3), 1)
        wp = round(d["water_pct"] + random.uniform(-0.3, 0.3), 1)
        sc_val = random.randint(75, 95)
        st = "Bonne" if sc_val >= 80 else "A surveiller"
        from datetime import timedelta
        dt = (datetime.now(timezone.utc) - timedelta(days=i * 3 + random.randint(0, 2))).isoformat()
        weighings.append({"date": dt, "weight": wt, "body_fat_pct": bf, "water_pct": wp, "score": sc_val, "status": st})

    return {
        "score": si["score"], "status": si["status"], "status_color": si["status_color"],
        "subscores": si["subscores"], "lifts": si["lifts"], "limits": si["limits"],
        "data": d, "ai": ai, "daily_plan": plan, "sparklines": sparks,
        "weighings": weighings, "human_map_img": HUMAN_MAP_IMG,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
