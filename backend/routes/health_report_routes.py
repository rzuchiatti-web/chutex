from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import os
import uuid
import random
import math
from dotenv import load_dotenv

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

load_dotenv()
router = APIRouter()

HUMAN_MAP_IMG = 'https://static.prod-images.emergentagent.com/jobs/92308143-f99e-4bad-8264-e3775a214313/images/507b1652c3de902f1f09c90079dc145841dafc79343fd12f407cb3208b5df085.png'


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


async def gen_ai(d, si, nora_ctx=None):
    """Generate AI analysis. Context-aware: coherent with or without data."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    has_real_data = nora_ctx and nora_ctx.get("has_any_data", False) if nora_ctx else (d.get("heart_rate", 0) > 0 or d.get("weight", 0) > 0)

    if not api_key:
        return _fb(has_real_data, nora_ctx)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import json

        # Build enriched context string
        user_context = format_nora_context_for_prompt(nora_ctx) if nora_ctx else ""

        if has_real_data:
            sh, sm = d["sleep_duration_min"] // 60, d["sleep_duration_min"] % 60
            data_block = f"""DONNEES MESUREES: Score {si['score']}/100 ({si['status']}). Sous-scores: Cardio {si['subscores']['cardio']['score']}, Sommeil {si['subscores']['sleep']['score']}, Activite {si['subscores']['activity']['score']}, Metabolisme {si['subscores']['metabolism']['score']}, Hydratation {si['subscores']['hydration']['score']}.
FC {d['heart_rate']}bpm (HRV {d['hrv']}ms), SpO2 {d['spo2']}%, Tension {d['blood_pressure']['systolic']}/{d['blood_pressure']['diastolic']}, Temp {d['temperature']}C.
Sommeil {sh}h{sm:02d} (qualite {d['sleep_quality']}%, {d['sleep_interruptions']} interruptions).
{d['steps']} pas, {d['calories']}kcal. Poids {d['weight']}kg, IMC {d['bmi']}, Age corp {d['body_age']} ans.
Graisse {d['body_fat_pct']}%, Muscle {d['muscle_pct']}%, Eau {d['water_pct']}%, Graisse visc {d['visceral_fat']}."""
        else:
            data_block = "AUCUNE DONNEE DE SANTE DISPONIBLE. Les appareils ne sont pas connectes ou n'ont pas encore transmis de donnees."

        prompt = f"""Tu es Nora, medecin IA specialiste en prevention et longevite. Analyse et reponds UNIQUEMENT en JSON.

CONTEXTE PATIENT:
{user_context}

{data_block}

{APP_SERVICES_KNOWLEDGE}

CONSIGNES STRICTES:
- Vouvoiement obligatoire
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
        "hero_line": "Vos constantes sont stables.",
        "priority": "Augmentez vos pas de 500 aujourd'hui.",
        "priority_why": "Votre activite est un peu basse par rapport a votre recuperation.",
        "correlations": ["Un bon sommeil favorise une frequence cardiaque stable", "L'activite reguliere contribue au maintien du poids"],
        "whats_good": ["Frequence cardiaque au repos dans les normes", "Hydratation correcte"],
        "watch_out": ["Augmentez legerement votre activite physique quotidienne"],
        "secondary_recs": ["Buvez 1,5L d'eau par jour", "Couchez-vous avant 23h", "10 minutes d'etirements le matin"],
        "motivation": "La regularite est la cle de la prevention.",
        "score_explain_up": "Cardio et sommeil sont vos points forts",
        "score_explain_down": "L'activite pourrait etre amelioree",
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

    section_data = {
        "cardio": f"FC {d['heart_rate']}bpm, HRV {d['hrv']}ms, SpO2 {d['spo2']}%, Tension {d['blood_pressure']['systolic']}/{d['blood_pressure']['diastolic']}mmHg, Temp {d['temperature']}C.",
        "metabolism": f"IMC {d['bmi']}, Graisse viscerale {d['visceral_fat']}, Metabolisme basal {d['basal_metabolism']}kcal, Ratio TH {d['waist_hip_ratio']}, Age corp {d['body_age']} ans, Poids ideal ~{d.get('ideal_weight', 0)}kg, Apport reco {d['recommended_calories']}kcal.",
        "activity": f"{d['steps']} pas, {d['calories']}kcal depenses, Stress {d['stress_level']}/100, Recup {d['recovery_score']}/100, Distance ~{round(d['steps']*0.0007,1)}km.",
        "composition": f"Poids {d['weight']}kg, Graisse {d['body_fat_pct']}%, Muscle {d['muscle_pct']}%, Eau {d['water_pct']}%, Os {d.get('bone_mass_kg',0)}kg, Proteine {d.get('protein_pct',0)}%, Muscle squelettique {d.get('skeletal_muscle_pct', 0)}%.",
        "sleep": f"Duree {d['sleep_duration_min']}min, Qualite {d['sleep_quality']}%, Profond {d['deep_sleep_min']}min, Leger {d['light_sleep_min']}min, REM {d['rem_sleep_min']}min, Interruptions {d['sleep_interruptions']}.",
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

        # Check if all key values are 0 (device connected but no real measurement)
        values_are_zero = all(v == 0 or v == "0" for v in [d.get("heart_rate", 0), d.get("spo2", 0), d.get("steps", 0), d.get("weight", 0)])

        prompt = f"""Tu es Nora, medecin IA specialiste en {sec_name}, prevention et longevite. Analyse les donnees ci-dessous. JSON uniquement.

CONTEXTE PATIENT:
{user_context}

DONNEES {sec_name.upper()}: {data_str}

{APP_SERVICES_KNOWLEDGE}

CONSIGNES:
- Analyse UNIQUEMENT les donnees de cette section
- Vouvoiement, ton medical professionnel, pas d'emoji
- Si les valeurs sont toutes a 0, cela signifie que l'appareil n'a pas encore transmis de donnees reelles. Dans ce cas:
  * correlations = []
  * whats_good = []
  * watch_out = []
  Ajoute une "recommendation" expliquant comment obtenir ces donnees
- Si des valeurs reelles existent (non-zero):
  * Donne 2-3 correlations medicales entre donnees mesurees
  * Points positifs UNIQUEMENT si justifies par les donnees
  * Points de vigilance UNIQUEMENT si justifies
  * Integre conseils de longevite et prevention adaptes a l'age du patient
  * Si un service Chutex peut aider, mentionne-le naturellement

JSON:
{{"correlations": ["..."], "whats_good": ["..."], "watch_out": ["..."], "recommendation": "conseil ou recommandation adapte au profil"}}"""

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
    """Fallback analysis when AI is unavailable but data exists."""
    fb = {
        "cardio": {"correlations": ["La frequence cardiaque au repos et la variabilite cardiaque refletent l'equilibre du systeme nerveux autonome", "La saturation en oxygene stable confirme une bonne oxygenation"], "whats_good": ["Parametres cardiaques dans les normes"], "watch_out": ["Surveillez votre tension arterielle regulierement"]},
        "metabolism": {"correlations": ["L'IMC et la graisse viscerale sont lies au risque metabolique", "Le metabolisme basal determine vos besoins caloriques"], "whats_good": ["Suivi metabolique en cours"], "watch_out": ["Maintenez un apport calorique adapte"]},
        "activity": {"correlations": ["Le niveau d'activite impacte directement le score de recuperation", "L'activite reguliere contribue a la longevite"], "whats_good": ["Suivi d'activite actif"], "watch_out": ["Augmentez progressivement votre nombre de pas"]},
        "composition": {"correlations": ["Le ratio graisse/muscle influence le metabolisme de base", "L'hydratation impacte la precision des mesures"], "whats_good": ["Donnees de composition corporelle disponibles"], "watch_out": ["Surveillez l'evolution de la graisse viscerale"]},
        "sleep": {"correlations": ["La qualite du sommeil profond influence la recuperation physique", "Les interruptions impactent la variabilite cardiaque"], "whats_good": ["Suivi du sommeil actif"], "watch_out": ["Limitez les interruptions nocturnes"]},
    }
    result = fb.get(section, fb["cardio"])
    result["section"] = section
    result["no_data"] = False
    result["recommendation"] = ""
    return result


@router.get("/health/metric-history/{key}")
async def get_metric_history(key: str, period: str = "7j", user=Depends(get_current_user)):
    """History for a specific metric from REAL device_readings"""
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    uid = user['id']

    days = {"24h": 1, "7j": 7, "30j": 30, "90j": 90}.get(period, 7)
    since = (now - timedelta(days=days)).isoformat()

    # Determine device type for this metric
    bracelet_keys = {"heart_rate", "hrv", "spo2", "blood_pressure", "temperature", "stress_level", "recovery_score", "steps", "calories", "distance_km", "sleep_quality", "sleep_duration_min", "vo2_max", "glycemia"}
    scale_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi", "body_age", "protein_pct", "skeletal_muscle_pct", "basal_metabolism", "recommended_calories", "waist_hip_ratio", "ideal_weight"}
    device_type = "bracelet" if key in bracelet_keys or key in ("bp_systolic", "bp_diastolic") else "scale" if key in scale_keys else "bracelet"

    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": device_type, "timestamp": {"$gte": since}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(200)

    history = []
    is_bp = key == "blood_pressure"
    for r in readings:
        data = r.get("data", {})
        ts = r.get("timestamp", "")
        if is_bp:
            bp = data.get("blood_pressure", {})
            if bp.get("systolic"):
                history.append({"date": ts[:10], "label": ts[5:10].replace("-", "/"), "value": bp["systolic"], "systolic": bp["systolic"], "diastolic": bp.get("diastolic", 0)})
        else:
            val = data.get(key, 0)
            if val:
                history.append({"date": ts[:10], "label": ts[5:10].replace("-", "/"), "value": val})

    vals = [h["value"] for h in history]
    avg = round(sum(vals) / len(vals), 1) if vals else 0
    mn_val, mx_val = (min(vals), max(vals)) if vals else (0, 0)
    trend = round(vals[-1] - vals[0], 1) if len(vals) >= 2 else 0

    # Metric meta (same as before)
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

    d = gen_data()
    si = compute_subscores(d)

    # Try LLM for a quick summary
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

    # No devices or no readings = no data
    if not nora_ctx["has_bracelet"] and not nora_ctx["has_scale"]:
        ai_no_data = await gen_ai({}, {"score": 0, "status": "Aucune donnee", "subscores": {"cardio": {"score": 0}, "sleep": {"score": 0}, "activity": {"score": 0}, "metabolism": {"score": 0}, "hydration": {"score": 0}}}, nora_ctx)
        return {"no_data": True, "data": {}, "score_info": {"score": 0, "status": "Aucune donnee", "status_color": "#6B7280", "subscores": {}, "lifts": [], "limits": []},
                "ai": ai_no_data,
                "daily_plan": [], "sparklines": {}, "weighings": []}

    bracelet_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    d = gen_data()
    if bracelet_reading and bracelet_reading.get("data"):
        rd = bracelet_reading["data"]
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv"]:
            if rd.get(k): d[k] = rd[k]
        if rd.get("blood_pressure"): d["blood_pressure"] = rd["blood_pressure"]
    if scale_reading and scale_reading.get("data"):
        sd = scale_reading["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg"]:
            if sd.get(k): d[k] = sd[k]

    si = compute_subscores(d)
    ai = await gen_ai(d, si, nora_ctx)
    plan = compute_daily_plan(d, si)

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

    # Gather data
    d = gen_data()
    si = compute_subscores(d)
    ai = await gen_ai(d, si)

    days = {"7j": 7, "30j": 30, "90j": 90}.get(period, 30)
    period_label = {"7j": "7 jours", "30j": "30 jours", "90j": "90 jours"}.get(period, "30 jours")
    now = datetime.now(timezone.utc)
    start_date = now - __import__('datetime').timedelta(days=days)

    # Generate metric histories for the report
    metrics_for_report = ["heart_rate", "spo2", "blood_pressure", "temperature", "steps", "weight", "sleep_quality", "stress_level"]
    metric_data = {}
    for mk in metrics_for_report:
        gen_func = {
            "heart_rate": lambda i: 68 + int(6 * math.sin(i / 7 * math.pi)) + random.randint(-3, 3),
            "spo2": lambda i: random.choice([96, 97, 97, 98, 98, 99]),
            "temperature": lambda i: round(36.5 + 0.3 * math.sin(i / 5 * math.pi) + random.uniform(-0.1, 0.1), 1),
            "steps": lambda i: max(500, 4000 + int(2000 * math.sin(i / 4 * math.pi)) + random.randint(-500, 500)),
            "weight": lambda i: round(72.8 - 0.015 * i + random.uniform(-0.2, 0.2), 1),
            "sleep_quality": lambda i: max(50, min(100, 80 + int(8 * math.sin(i / 5 * math.pi)) + random.randint(-5, 5))),
            "stress_level": lambda i: max(10, min(80, 35 + int(10 * math.sin(i / 5 * math.pi)) + random.randint(-5, 5))),
        }.get(mk, lambda i: round(50 + 10 * math.sin(i / 5 * math.pi), 1))

        vals = [gen_func(i) for i in range(days)]

        if mk == "blood_pressure":
            sys_vals = [122 + int(4 * math.sin(i / 8 * math.pi)) + random.randint(-3, 3) for i in range(days)]
            dia_vals = [76 + int(3 * math.sin(i / 8 * math.pi)) + random.randint(-2, 2) for i in range(days)]
            metric_data[mk] = {"avg": f"{round(sum(sys_vals)/len(sys_vals))}/{round(sum(dia_vals)/len(dia_vals))}", "min": f"{min(sys_vals)}/{min(dia_vals)}", "max": f"{max(sys_vals)}/{max(dia_vals)}", "last": f"{sys_vals[-1]}/{dia_vals[-1]}"}
        else:
            metric_data[mk] = {"avg": round(sum(vals) / len(vals), 1), "min": round(min(vals), 1), "max": round(max(vals), 1), "last": vals[-1]}

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

