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


@router.get("/health/metric-history/{key}")
async def get_metric_history(key: str, user=Depends(get_current_user)):
    """30 days of simulated history for a specific metric + AI analysis"""
    import math
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    days = 30
    history = []

    generators = {
        "heart_rate": lambda i: 68 + int(6 * math.sin(i / 7 * math.pi)) + random.randint(-3, 3),
        "hrv": lambda i: 42 + int(5 * math.sin(i / 10 * math.pi)) + random.randint(-3, 3),
        "spo2": lambda i: random.choice([96, 97, 97, 98, 98, 99]),
        "bp_systolic": lambda i: 122 + int(4 * math.sin(i / 8 * math.pi)) + random.randint(-3, 3),
        "bp_diastolic": lambda i: 76 + int(3 * math.sin(i / 8 * math.pi)) + random.randint(-2, 2),
        "temperature": lambda i: round(36.5 + 0.3 * math.sin(i / 5 * math.pi) + random.uniform(-0.1, 0.1), 1),
        "vo2_max": lambda i: round(29 + 0.5 * i / days + random.uniform(-0.5, 0.5), 1),
        "glycemia": lambda i: round(0.98 + 0.08 * math.sin(i / 6 * math.pi) + random.uniform(-0.03, 0.03), 2),
        "stress_level": lambda i: max(10, min(80, 35 + int(10 * math.sin(i / 5 * math.pi)) + random.randint(-5, 5))),
        "recovery_score": lambda i: max(50, min(100, 80 + int(8 * math.sin(i / 6 * math.pi)) + random.randint(-4, 4))),
        "steps": lambda i: max(500, 4000 + int(2000 * math.sin(i / 4 * math.pi)) + random.randint(-500, 500)),
        "calories": lambda i: max(50, 160 + int(60 * math.sin(i / 4 * math.pi)) + random.randint(-20, 20)),
        "distance_km": lambda i: round(max(0.3, 2.8 + 1.2 * math.sin(i / 4 * math.pi) + random.uniform(-0.3, 0.3)), 1),
        "weight": lambda i: round(72.8 - 0.015 * i + random.uniform(-0.2, 0.2), 1),
        "body_fat_pct": lambda i: round(22.8 - 0.02 * i + random.uniform(-0.2, 0.2), 1),
        "muscle_pct": lambda i: round(33.2 + 0.015 * i + random.uniform(-0.15, 0.15), 1),
        "water_pct": lambda i: round(54.8 + 0.5 * math.sin(i / 7 * math.pi) + random.uniform(-0.2, 0.2), 1),
        "visceral_fat": lambda i: random.choice([8, 9, 9, 9, 10]),
        "bone_mass_kg": lambda i: round(3.05 + random.uniform(-0.05, 0.05), 2),
        "sleep_quality": lambda i: max(50, min(100, 80 + int(8 * math.sin(i / 5 * math.pi)) + random.randint(-5, 5))),
        "sleep_duration_min": lambda i: max(300, min(540, 440 + int(30 * math.sin(i / 6 * math.pi)) + random.randint(-15, 15))),
        "deep_sleep_min": lambda i: max(60, min(180, 130 + int(20 * math.sin(i / 5 * math.pi)) + random.randint(-10, 10))),
        "light_sleep_min": lambda i: max(150, min(300, 240 + int(20 * math.sin(i / 7 * math.pi)) + random.randint(-10, 10))),
        "rem_sleep_min": lambda i: max(30, min(100, 65 + int(15 * math.sin(i / 6 * math.pi)) + random.randint(-5, 5))),
        "sleep_interruptions": lambda i: random.choice([1, 1, 2, 2, 3, 3, 4]),
        "basal_metabolism": lambda i: random.randint(1480, 1620),
        "recommended_calories": lambda i: random.randint(1850, 2150),
        "bmi": lambda i: round(24.2 - 0.01 * i + random.uniform(-0.1, 0.1), 1),
    }

    # Fallback
    gen = generators.get(key, lambda i: round(50 + 10 * math.sin(i / 5 * math.pi) + random.uniform(-2, 2), 1))

    for i in range(days):
        dt = now - timedelta(days=days - 1 - i)
        val = gen(i)
        # For sleep, add phases
        entry = {"date": dt.strftime("%Y-%m-%d"), "value": val}
        if key == "sleep_duration_min":
            deep = max(60, min(180, 130 + random.randint(-15, 15)))
            light = max(150, min(300, 240 + random.randint(-15, 15)))
            rem = max(30, min(100, 65 + random.randint(-8, 8)))
            entry["deep"] = deep
            entry["light"] = light
            entry["rem"] = rem
        if key in ("bp_systolic", "heart_rate") and key == "heart_rate":
            # Add intraday for ECG-like
            entry["intraday"] = [68 + int(10 * math.sin(h / 3)) + random.randint(-2, 2) for h in range(24)]
        history.append(entry)

    vals = [h["value"] for h in history]
    avg = round(sum(vals) / len(vals), 1) if vals else 0
    mn, mx = (min(vals), max(vals)) if vals else (0, 0)
    trend = round(vals[-1] - vals[0], 1) if len(vals) >= 2 else 0

    # Metric meta
    meta = {
        "heart_rate": {"title": "Frequence cardiaque", "unit": "bpm", "graph_type": "ecg", "normal_min": 60, "normal_max": 80, "color": "#EF4444", "explain": "Le pouls au repos mesure le nombre de battements par minute. Un rythme entre 60 et 80 bpm est considere comme sain pour un adulte. Une frequence plus basse peut indiquer une bonne condition physique. Une frequence elevee au repos peut etre liee au stress, a la deshydratation ou a un manque de sommeil."},
        "hrv": {"title": "Variabilite cardiaque", "unit": "ms", "graph_type": "scatter", "normal_min": 30, "normal_max": 60, "color": "#A78BFA", "explain": "La variabilite de frequence cardiaque (HRV) mesure l'intervalle entre chaque battement. Plus elle est elevee, meilleure est votre capacite d'adaptation au stress. C'est un marqueur cle de recuperation et de sante globale."},
        "spo2": {"title": "Saturation en oxygene", "unit": "%", "graph_type": "area_threshold", "normal_min": 95, "normal_max": 100, "color": "#38BDF8", "explain": "Le SpO2 mesure le pourcentage d'hemoglobine saturee en oxygene dans le sang. Au-dessus de 95% est normal. En dessous de 92% necessite une attention medicale."},
        "stress_level": {"title": "Niveau de stress", "unit": "/100", "graph_type": "area_gradient", "normal_min": 0, "normal_max": 40, "color": "#F59E0B", "explain": "Score de stress mesure par le bracelet via l'analyse du HRV. En dessous de 40 indique un etat detendu. Au-dessus de 60, votre corps est en tension et la recuperation est compromise."},
        "recovery_score": {"title": "Score de recuperation", "unit": "/100", "graph_type": "area_gradient", "normal_min": 70, "normal_max": 100, "color": "#10B981", "explain": "Capacite de votre corps a recuperer apres l'effort et le stress quotidien. Au-dessus de 70 est favorable. Ce score est influence par le sommeil, le stress et l'activite physique."},
        "steps": {"title": "Nombre de pas", "unit": "pas", "graph_type": "bars", "normal_min": 4000, "normal_max": 10000, "color": "#10B981", "explain": "L'objectif recommande est de 6000 a 10000 pas par jour. La marche reguliere ameliore la sante cardiovasculaire, le metabolisme et reduit le stress."},
        "calories": {"title": "Depense energetique", "unit": "kcal", "graph_type": "bars", "normal_min": 100, "normal_max": 400, "color": "#F59E0B", "explain": "Calories brulees par l'activite physique. Ce chiffre s'ajoute au metabolisme de base pour calculer votre depense totale."},
        "weight": {"title": "Poids", "unit": "kg", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Votre poids est une donnee globale. Il est important de le croiser avec la composition corporelle (graisse, muscle, eau) pour comprendre les variations. Le poids seul ne reflète pas votre sante."},
        "body_fat_pct": {"title": "Pourcentage de graisse", "unit": "%", "graph_type": "smooth_curve", "color": "#F59E0B", "explain": "Part de graisse dans votre corps. Normal : 15-25% pour un homme, 20-30% pour une femme. Au-dela, le risque cardiovasculaire et metabolique augmente."},
        "muscle_pct": {"title": "Masse musculaire", "unit": "%", "graph_type": "smooth_curve", "color": "#10B981", "explain": "La masse musculaire est essentielle pour le metabolisme, l'equilibre et la mobilite. Un pourcentage eleve indique un bon etat physique general."},
        "water_pct": {"title": "Taux d'hydratation", "unit": "%", "graph_type": "bars_threshold", "normal_min": 50, "normal_max": 65, "color": "#38BDF8", "explain": "Pourcentage d'eau dans votre corps. Normal entre 50 et 65%. L'hydratation impacte l'energie, la recuperation, la concentration et la sante renale."},
        "sleep_quality": {"title": "Qualite du sommeil", "unit": "%", "graph_type": "area_gradient", "normal_min": 75, "normal_max": 100, "color": "#A78BFA", "explain": "Score base sur la duree, les cycles de sommeil et les interruptions. Au-dessus de 80% indique un sommeil reparateur."},
        "sleep_duration_min": {"title": "Duree du sommeil", "unit": "min", "graph_type": "hypnogram", "color": "#6D28D9", "explain": "Duree totale du sommeil. 7 a 9 heures sont recommandees. Le sommeil est compose de phases profondes (recuperation physique), legeres et paradoxales (REM, memoire et emotions)."},
        "temperature": {"title": "Temperature corporelle", "unit": "°C", "graph_type": "smooth_curve", "normal_min": 36.3, "normal_max": 37.5, "color": "#F59E0B", "explain": "La temperature corporelle varie naturellement au cours de la journee. Une augmentation peut indiquer une inflammation, une infection ou un effort physique intense."},
        "glycemia": {"title": "Glycemie", "unit": "g/L", "graph_type": "smooth_curve", "normal_min": 0.7, "normal_max": 1.1, "color": "#F59E0B", "explain": "Taux de glucose dans le sang. A jeun, une glycemie entre 0.7 et 1.1 g/L est normale. Au-dessus de 1.26 a jeun peut indiquer un diabete."},
        "bmi": {"title": "Indice de masse corporelle", "unit": "", "graph_type": "smooth_curve", "color": "#38BDF8", "explain": "Rapport poids/taille. Normal entre 18.5 et 25. Au-dessus de 25 : surpoids. L'IMC est un indicateur general, a croiser avec la composition corporelle."},
    }

    m = meta.get(key, {"title": key.replace("_", " ").title(), "unit": "", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Donnee de sante mesuree par vos appareils connectes."})

    return {
        "key": key, "meta": m, "history": history,
        "stats": {"avg": avg, "min": mn, "max": mx, "trend": trend, "count": len(vals)},
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

    # Simulated last weighings with FULL balance data
    weighings = []
    from datetime import timedelta
    for i in range(5):
        wt = round(d["weight"] + random.uniform(-0.5, 0.5), 1)
        bf = round(d["body_fat_pct"] + random.uniform(-0.3, 0.3), 1)
        mp = round(d["muscle_pct"] + random.uniform(-0.2, 0.2), 1)
        wp = round(d["water_pct"] + random.uniform(-0.3, 0.3), 1)
        sc_val = random.randint(75, 95)
        st = "Bonne" if sc_val >= 80 else "A surveiller"
        dt = (datetime.now(timezone.utc) - timedelta(days=i * 3 + random.randint(0, 2))).isoformat()
        weighings.append({
            "id": f"w-{i}", "date": dt, "weight": wt, "score": sc_val, "status": st,
            "bmi": round(wt / (1.73 ** 2), 1),
            "body_fat_pct": bf, "fat_mass_kg": round(bf * wt / 100, 1),
            "muscle_pct": mp, "muscle_mass_kg": round(mp * wt / 100, 1),
            "water_pct": wp, "total_body_water_kg": round(wp * wt / 100, 1),
            "bone_mass_kg": round(3.0 + random.uniform(-0.1, 0.1), 1),
            "visceral_fat": random.choice([8, 9, 9, 10]),
            "subcutaneous_fat_pct": round(bf - random.uniform(3, 5), 1),
            "trunk_fat_kg": round(bf * 0.4 * wt / 100, 1),
            "protein_pct": round(16 + random.random() * 2, 1),
            "skeletal_muscle_pct": round(mp - 5 + random.random(), 1),
            "skeletal_muscle_quality": random.randint(85, 100),
            "basal_metabolism": random.randint(1480, 1620),
            "recommended_calories": random.randint(1850, 2150),
            "body_age": random.randint(60, 66),
            "body_type": random.choice(["Standard", "Musculaire standard"]),
            "waist_hip_ratio": round(0.82 + random.random() * 0.06, 2),
            "minerals_kg": round(3.8 + random.uniform(-0.1, 0.1), 1),
            "intracellular_water_kg": round(wp * 0.6 * wt / 100, 1),
            "extracellular_water_kg": round(wp * 0.4 * wt / 100, 1),
            "left_arm_fat_pct": round(20 + random.random() * 4, 1),
            "right_arm_fat_pct": round(20 + random.random() * 4, 1),
            "left_arm_muscle_pct": round(32 + random.random() * 3, 1),
            "right_arm_muscle_pct": round(32 + random.random() * 3, 1),
            "left_leg_fat_pct": round(24 + random.random() * 4, 1),
            "right_leg_fat_pct": round(24 + random.random() * 4, 1),
            "left_leg_muscle_kg": round(8 + random.random(), 1),
            "right_leg_muscle_kg": round(8 + random.random(), 1),
        })

    # Analysis phase (7-day onboarding)
    first_device = await db.devices.find_one({"user_id": uid}, {"_id": 0}, sort=[("created_at", 1)])
    analysis_phase = None
    if first_device and first_device.get("created_at"):
        try:
            created = datetime.fromisoformat(first_device["created_at"].replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - created).days
            if days_since < 7:
                day = days_since + 1
                messages = {
                    1: "Debut de l'analyse",
                    2: "Collecte des premieres tendances",
                    3: "Ajustement de votre profil",
                    4: "Analyse des habitudes",
                    5: "Correlation des donnees",
                    6: "Finalisation du profil",
                    7: "Preparation du Score Sante IA",
                }
                analysis_phase = {"day": day, "total": 7, "message": messages.get(day, "Analyse en cours"), "progress_pct": round((day / 7) * 100)}
        except:
            pass
    # Demo fallback: always show analysis phase for demo
    if analysis_phase is None:
        analysis_phase = {"day": 5, "total": 7, "message": "Correlation des donnees", "progress_pct": 71}

    return {
        "score": si["score"], "status": si["status"], "status_color": si["status_color"],
        "subscores": si["subscores"], "lifts": si["lifts"], "limits": si["limits"],
        "data": d, "ai": ai, "daily_plan": plan, "sparklines": sparks,
        "weighings": weighings, "human_map_img": HUMAN_MAP_IMG,
        "analysis_phase": analysis_phase,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
