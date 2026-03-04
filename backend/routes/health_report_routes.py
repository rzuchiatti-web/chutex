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


def compute_daily_plan(d, score_info):
    """Generate daily plan. Only includes items with actual measured data."""
    # If no meaningful data, return a simple "connect device" plan
    if score_info.get("no_data") or not _has_meaningful_data(d):
        return [
            {"key": "connect", "label": "Connecter un appareil", "value": "--", "unit": "", "status": "action requise",
             "icon": "ri-bluetooth-connect-line", "color": "#3B82F6",
             "detail": "Connectez votre bracelet Elio ou votre balance Vita pour demarrer votre suivi personnalise."},
        ]

    plan = []
    g = lambda k, default=0: d.get(k, default)

    # Only add calorie plan if we have basal metabolism data
    bm = g("basal_metabolism", 0)
    rec_cal = g("recommended_calories", bm if bm > 0 else 0)
    if rec_cal > 0:
        plan.append({"key": "calories", "label": "Apport calorique", "value": f"{rec_cal}", "unit": "kcal", "status": "objectif", "icon": "ri-fire-line", "color": "#F59E0B",
                     "detail": f"Votre metabolisme de base est de {bm} kcal. Visez {rec_cal} kcal aujourd'hui."})

    # Only add steps plan if we have step data
    steps = g("steps")
    if steps > 0:
        step_goal = 6000 if g("recovery_score") >= 70 else 4000
        plan.append({"key": "steps", "label": "Objectif pas", "value": f"{step_goal}", "unit": "pas", "status": "en cours" if steps < step_goal else "atteint",
                     "progress": min(100, round(steps / max(1, step_goal) * 100)), "icon": "ri-footprint-line", "color": "#10B981",
                     "detail": f"Vous etes a {steps} pas. Objectif adapte a votre recuperation ({g('recovery_score')}/100)."})

    # Only add hydration plan if we have water data
    wp = g("water_pct")
    if wp > 0:
        water_goal = 1.5 if wp >= 55 else 2.0
        plan.append({"key": "hydration", "label": "Hydratation", "value": f"{water_goal}L", "unit": "minimum", "status": "priorite" if wp < 55 else "OK",
                     "icon": "ri-drop-line", "color": "#38BDF8",
                     "detail": f"Votre taux d'hydratation est de {wp}%."})

    # Only add sleep plan if we have sleep data
    sq = g("sleep_quality")
    if sq > 0:
        bed = "22:30" if sq < 80 else "23:00"
        plan.append({"key": "sleep", "label": "Coucher conseille", "value": bed, "unit": "", "status": "conseil",
                     "icon": "ri-moon-line", "color": "#A78BFA",
                     "detail": f"Qualite de sommeil hier: {sq}%."})

    # If no plan items, add a generic one
    if not plan:
        plan.append({"key": "measure", "label": "Realiser une mesure", "value": "--", "unit": "", "status": "en attente",
                     "icon": "ri-pulse-line", "color": "#3B82F6",
                     "detail": "Portez votre bracelet ou montez sur la balance pour obtenir des recommandations personnalisees."})

    return plan


async def gen_ai(d, si, nora_ctx=None):
    """Generate AI analysis. Context-aware: coherent with or without data."""
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

    # No devices or no readings = no data
    has_any_readings = await db.device_readings.find_one({"user_id": uid}, {"_id": 0})
    if not has_any_readings:
        ai_no_data = await gen_ai({}, {"score": 0, "status": "Aucune donnee", "subscores": {"cardio": {"score": 0}, "sleep": {"score": 0}, "activity": {"score": 0}, "metabolism": {"score": 0}, "hydration": {"score": 0}}}, nora_ctx)
        return {"no_data": True, "data": {}, "score_info": {"score": 0, "status": "Aucune donnee", "status_color": "#6B7280", "subscores": {}, "lifts": [], "limits": []},
                "ai": ai_no_data,
                "daily_plan": [], "sparklines": {}, "weighings": []}

    bracelet_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
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
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv", "stress_level", "recovery_score", "sleep_quality", "sleep_duration", "sleep_deep_pct", "sleep_rem_pct"]:
            if rd.get(k): d[k] = rd[k]
        if rd.get("blood_pressure"): d["blood_pressure"] = rd["blood_pressure"]
    if scale_reading and scale_reading.get("data"):
        sd = scale_reading["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg"]:
            if sd.get(k): d[k] = sd[k]

    # Sanitize erroneous readings before computing scores
    d = _sanitize_data(d)
    si = compute_subscores(d)

    # If no meaningful data despite having device_readings, treat as no_data
    if si.get("no_data"):
        ai_no_data = await gen_ai(d, si, nora_ctx)
        plan = compute_daily_plan(d, si)
        return {"no_data": True, "data": d, "score_info": si,
                "score": 0, "status": "Aucune donnee", "status_color": "#6B7280",
                "subscores": si.get("subscores", {}), "lifts": [], "limits": [],
                "ai": ai_no_data, "daily_plan": plan, "sparklines": {}, "weighings": []}

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

    return {
        "score": si["score"], "status": si["status"], "status_color": si["status_color"],
        "subscores": si["subscores"], "lifts": si["lifts"], "limits": si["limits"],
        "data": d, "ai": ai, "daily_plan": plan, "sparklines": sparks,
        "weighings": weighings, "human_map_img": HUMAN_MAP_IMG,
        "analysis_phase": analysis_phase,
        "body_age_nora": body_age_data,
        "activity_streak": activity_streak,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/activity-streak")
async def get_activity_streak(user=Depends(get_current_user)):
    """Get activity streak based on real objective achievement."""
    uid = user['id']
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    streak_doc = await db.activity_streaks.find_one({"user_id": uid}, {"_id": 0})
    if not streak_doc:
        streak_doc = {"user_id": uid, "current_streak": 0, "max_streak": 0, "last_achieved_day": "", "objectives_today": [], "history": []}

    # Check if today's objectives need evaluation
    if streak_doc.get("last_evaluated_day") != today:
        # Get today's readings
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        br = await db.device_readings.find_one(
            {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": today_start}}, {"_id": 0},
            sort=[("timestamp", -1)]
        )
        sc = await db.device_readings.find_one(
            {"user_id": uid, "device_type": "scale", "timestamp": {"$gte": today_start}}, {"_id": 0},
            sort=[("timestamp", -1)]
        )
        d = {}
        if br and br.get("data"):
            d.update(br["data"])
        if sc and sc.get("data"):
            d.update(sc["data"])

        objectives_met = evaluate_objectives_met(d)

        if objectives_met:
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
            last_day = streak_doc.get("last_achieved_day", "")
            if last_day == yesterday:
                new_streak = streak_doc.get("current_streak", 0) + 1
            elif last_day == today:
                new_streak = streak_doc.get("current_streak", 0)
            else:
                new_streak = 1

            max_streak = max(new_streak, streak_doc.get("max_streak", 0))
            history = streak_doc.get("history", [])
            if not any(h.get("date") == today for h in history):
                history.append({"date": today, "objectives": objectives_met})
            history = history[-30:]  # Keep last 30 days

            await db.activity_streaks.update_one(
                {"user_id": uid},
                {"$set": {
                    "current_streak": new_streak, "max_streak": max_streak,
                    "last_achieved_day": today, "last_evaluated_day": today,
                    "objectives_today": objectives_met, "history": history,
                }},
                upsert=True
            )
            streak_doc = {"current_streak": new_streak, "max_streak": max_streak, "objectives_today": objectives_met, "last_achieved_day": today}
        else:
            await db.activity_streaks.update_one(
                {"user_id": uid},
                {"$set": {"last_evaluated_day": today, "objectives_today": []}},
                upsert=True
            )
            streak_doc["objectives_today"] = []

    # Badges
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

    return {
        "current_streak": streak_doc.get("current_streak", 0),
        "max_streak": streak_doc.get("max_streak", 0),
        "objectives_today": streak_doc.get("objectives_today", []),
        "badge": badge,
    }


@router.get("/health/body-age")
async def get_body_age(user=Depends(get_current_user)):
    """
    Compute biological body age using Nora AI.
    Based on ALL health data since registration.
    Requires at least 7 days of data collection before returning a value.
    """
    uid = user['id']

    # Check cache (24h TTL or until new measurement)
    cached = await db.body_age_cache.find_one({"user_id": uid}, {"_id": 0})
    if cached:
        try:
            cached_at = datetime.fromisoformat(cached["computed_at"].replace("Z", "+00:00"))
            last_reading = await db.device_readings.find_one(
                {"user_id": uid}, {"_id": 0, "timestamp": 1}, sort=[("timestamp", -1)]
            )
            last_ts = last_reading["timestamp"] if last_reading else ""
            # Use cache if < 24h old AND no new reading since cache
            if (datetime.now(timezone.utc) - cached_at).total_seconds() < 86400:
                if not last_ts or last_ts <= cached.get("last_reading_ts", ""):
                    return cached
        except:
            pass

    # Gather ALL device readings since registration
    all_readings = await db.device_readings.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)

    if not all_readings:
        return {
            "user_id": uid, "body_age": None, "status": "no_data",
            "message": "Aucune donnee de sante disponible. Connectez vos appareils pour commencer.",
            "days_collected": 0, "days_required": 7, "progress_pct": 0,
        }

    # Count distinct days with readings
    distinct_days = set()
    for r in all_readings:
        ts = r.get("timestamp", "")
        if ts:
            distinct_days.add(ts[:10])

    days_collected = len(distinct_days)
    first_day = min(distinct_days) if distinct_days else ""
    last_day = max(distinct_days) if distinct_days else ""

    if days_collected < 7:
        return {
            "user_id": uid, "body_age": None, "status": "collecting",
            "message": f"Jour {days_collected} sur 7 : Nora collecte vos donnees pour estimer votre age corporel.",
            "days_collected": days_collected, "days_required": 7,
            "progress_pct": round((days_collected / 7) * 100),
            "first_day": first_day, "last_day": last_day,
        }

    # We have >= 7 days of data — build a comprehensive health profile for Nora
    # Aggregate key metrics across all readings
    weights, bmis, body_fats, muscles, waters, heart_rates = [], [], [], [], [], []
    spo2s, temperatures, steps_list, stress_list, sleep_quals = [], [], [], [], []
    visceral_fats, bone_masses, hrv_list = [], [], []

    for r in all_readings:
        d = r.get("data", {})
        if d.get("weight", 0) > 3: weights.append(d["weight"])
        if d.get("bmi", 0) > 10: bmis.append(d["bmi"])
        if d.get("body_fat_pct", 0) > 1: body_fats.append(d["body_fat_pct"])
        if d.get("muscle_pct", 0) > 1: muscles.append(d["muscle_pct"])
        if d.get("water_pct", 0) > 1: waters.append(d["water_pct"])
        if d.get("visceral_fat", 0) > 0: visceral_fats.append(d["visceral_fat"])
        if d.get("bone_mass_kg", 0) > 0: bone_masses.append(d["bone_mass_kg"])
        if 30 < d.get("heart_rate", 0) < 220: heart_rates.append(d["heart_rate"])
        if 80 < d.get("spo2", 0) <= 100: spo2s.append(d["spo2"])
        if 34 < d.get("temperature", 0) < 42: temperatures.append(d["temperature"])
        if d.get("steps", 0) > 0: steps_list.append(d["steps"])
        if d.get("stress_level", 0) > 0: stress_list.append(d["stress_level"])
        if d.get("sleep_quality", 0) > 0: sleep_quals.append(d["sleep_quality"])
        if d.get("hrv", 0) > 0: hrv_list.append(d["hrv"])

    def avg(lst): return round(sum(lst) / len(lst), 1) if lst else 0
    def trend(lst): return round(lst[-1] - lst[0], 1) if len(lst) >= 2 else 0

    # User profile
    profile = user
    real_age = None
    dob = profile.get("date_of_birth", "")
    if dob:
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                born = datetime.strptime(dob, fmt)
                real_age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                break
            except ValueError:
                continue

    gender = profile.get("gender", "")
    height = profile.get("height_cm", 0)
    conditions = profile.get("medical_conditions", "")

    # Build data summary for Nora
    data_summary_parts = []
    data_summary_parts.append(f"Periode d'analyse: {first_day} a {last_day} ({days_collected} jours de donnees)")
    if real_age: data_summary_parts.append(f"Age chronologique: {real_age} ans")
    if gender: data_summary_parts.append(f"Sexe: {gender}")
    if height: data_summary_parts.append(f"Taille: {height} cm")
    if conditions: data_summary_parts.append(f"Pathologies: {conditions}")

    if weights: data_summary_parts.append(f"Poids: moy {avg(weights)}kg, tendance {trend(weights):+.1f}kg, {len(weights)} mesures")
    if bmis: data_summary_parts.append(f"IMC: moy {avg(bmis)}")
    if body_fats: data_summary_parts.append(f"Graisse corporelle: moy {avg(body_fats)}%")
    if muscles: data_summary_parts.append(f"Masse musculaire: moy {avg(muscles)}%")
    if waters: data_summary_parts.append(f"Hydratation: moy {avg(waters)}%")
    if visceral_fats: data_summary_parts.append(f"Graisse viscerale: moy {avg(visceral_fats)}")
    if bone_masses: data_summary_parts.append(f"Masse osseuse: moy {avg(bone_masses)}kg")
    if heart_rates: data_summary_parts.append(f"Frequence cardiaque repos: moy {avg(heart_rates)}bpm, tendance {trend(heart_rates):+.1f}")
    if spo2s: data_summary_parts.append(f"SpO2: moy {avg(spo2s)}%")
    if temperatures: data_summary_parts.append(f"Temperature: moy {avg(temperatures)}C")
    if steps_list: data_summary_parts.append(f"Pas quotidiens: moy {avg(steps_list)}")
    if stress_list: data_summary_parts.append(f"Stress: moy {avg(stress_list)}/100")
    if sleep_quals: data_summary_parts.append(f"Qualite sommeil: moy {avg(sleep_quals)}%")
    if hrv_list: data_summary_parts.append(f"HRV: moy {avg(hrv_list)}ms")

    data_summary = "\n".join(data_summary_parts)

    # Call Nora AI to estimate biological age
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    body_age = None
    explanation = ""
    factors_positive = []
    factors_negative = []

    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json

            prompt = f"""Tu es Nora, medecin IA specialisee en longevite et prevention. Tu dois estimer l'AGE BIOLOGIQUE (age corporel) de ce patient en te basant sur TOUTES ses donnees de sante collectees depuis son inscription.

PROFIL ET DONNEES DU PATIENT:
{data_summary}

METHODE D'ESTIMATION:
- Compare chaque parametre aux normes pour l'age chronologique du patient
- Composition corporelle: IMC, graisse, muscle, hydratation, graisse viscerale
- Sante cardiovasculaire: FC repos, HRV, SpO2, tension
- Activite physique: pas quotidiens, depense calorique
- Recuperation: qualite sommeil, stress, recuperation
- Tendances: amelioration ou degradation dans le temps
- Un bon IMC, bon taux musculaire, bonne hydratation, bonne FC repos = age corporel INFERIEUR a l'age chronologique
- Un IMC eleve, faible muscle, mauvais sommeil, stress eleve = age corporel SUPERIEUR a l'age chronologique
- L'age corporel doit etre un entier entre 30 et 100 ans

IMPORTANT: Sois precis et medical. Pas d'emoji. L'age corporel est different de l'age chronologique. Un patient de 70 ans en excellente forme peut avoir un age corporel de 58 ans.

Reponds UNIQUEMENT en JSON:
{{"body_age": <entier>, "explanation": "1 phrase justificative courte", "factors_positive": ["facteur 1", "facteur 2"], "factors_negative": ["facteur 1"], "confidence": "haute/moyenne/basse"}}"""

            chat = LlmChat(api_key=api_key, session_id=f"ba-{uuid.uuid4().hex[:8]}",
                           system_message="Nora, medecin IA. Estimation age biologique. JSON uniquement. Pas d'emoji.").with_model("openai", "gpt-5.2")
            r = await chat.send_message(UserMessage(text=prompt))
            c = r.strip()
            if c.startswith("```"): c = c.split("\n", 1)[1] if "\n" in c else c[3:]
            if c.endswith("```"): c = c[:-3]
            parsed = json.loads(c.strip())
            body_age = parsed.get("body_age")
            explanation = parsed.get("explanation", "")
            factors_positive = parsed.get("factors_positive", [])
            factors_negative = parsed.get("factors_negative", [])
        except Exception as e:
            print(f"Body age AI err: {e}")

    # Fallback if AI fails
    if body_age is None and real_age:
        bmi_adj = 0
        if bmis:
            bmi_val = avg(bmis)
            if bmi_val > 30: bmi_adj = 5
            elif bmi_val > 25: bmi_adj = 2
            elif bmi_val < 20: bmi_adj = -1
        muscle_adj = 0
        if muscles:
            mp = avg(muscles)
            if mp > 35: muscle_adj = -3
            elif mp < 25: muscle_adj = 3
        activity_adj = 0
        if steps_list:
            sp = avg(steps_list)
            if sp > 8000: activity_adj = -3
            elif sp < 3000: activity_adj = 3
        body_age = max(30, min(100, real_age + bmi_adj + muscle_adj + activity_adj))
        explanation = "Estimation basee sur la composition corporelle et l'activite physique."

    last_reading_ts = all_readings[-1].get("timestamp", "") if all_readings else ""

    result = {
        "user_id": uid, "body_age": body_age, "status": "computed",
        "real_age": real_age, "explanation": explanation,
        "factors_positive": factors_positive, "factors_negative": factors_negative,
        "days_collected": days_collected, "days_required": 7, "progress_pct": 100,
        "first_day": first_day, "last_day": last_day,
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "last_reading_ts": last_reading_ts,
    }

    # Cache result
    await db.body_age_cache.update_one(
        {"user_id": uid}, {"$set": result}, upsert=True
    )

    return result


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

