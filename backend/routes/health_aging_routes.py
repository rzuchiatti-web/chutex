from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt

load_dotenv()
router = APIRouter()

def evaluate_objectives_met(data: dict) -> bool:
    """Check if daily activity objectives are met based on sensor data."""
    steps = data.get("steps", 0) or 0
    calories = data.get("calories", 0) or 0
    return steps >= 3000 or calories >= 150


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




@router.get("/health/aging-rate")
async def get_aging_rate(user=Depends(get_current_user)):
    """
    V2 — Scientific biological age & aging rate estimation.
    Level 1: Bracelet only (HRV-weighted Klemera-Doubal simplified)
    Level 2: Bracelet + Balance (impedance biomarkers, clinical weighting)
    Level 3: Temporal trends (30/60/90 days) + age/sex reference norms
    """
    uid = user['id']
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        return {"rate": None, "status": "no_user"}

    # === Chronological age ===
    real_age = 0
    dob = u.get("date_of_birth", "")
    if dob:
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                born = datetime.strptime(dob.replace("Z", "").split("T")[0], fmt)
                real_age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                break
            except ValueError:
                continue
    if real_age <= 0:
        return {"rate": None, "status": "no_dob"}

    gender = u.get("gender", "F").upper()[:1]  # M or F

    # === Gather readings (last 90 days for trends) ===
    cutoff_90d = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    bracelet_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": cutoff_90d}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    scale_readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "scale", "timestamp": {"$gte": cutoff_90d}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(200)

    has_bracelet = len(bracelet_readings) > 0
    has_scale = len(scale_readings) > 0

    if not has_bracelet and not has_scale:
        return {"rate": None, "status": "no_data", "real_age": real_age, "level": 0}

    # === Extract latest + averages ===
    def extract_values(readings, key):
        return [r["data"].get(key, 0) for r in readings if r.get("data", {}).get(key, 0) > 0]

    # Bracelet metrics
    hrvs = extract_values(bracelet_readings, "hrv")
    hrs = extract_values(bracelet_readings, "heart_rate")
    spo2s = extract_values(bracelet_readings, "spo2")
    sleeps = extract_values(bracelet_readings, "sleep_quality")
    steps_list = extract_values(bracelet_readings, "steps")
    stresses = extract_values(bracelet_readings, "stress_level")

    # Scale metrics
    bmis = extract_values(scale_readings, "bmi")
    body_fats = extract_values(scale_readings, "body_fat_pct")
    muscles = extract_values(scale_readings, "muscle_pct")
    waters = extract_values(scale_readings, "water_pct")
    visceral_fats = extract_values(scale_readings, "visceral_fat")
    bone_masses = extract_values(scale_readings, "bone_mass_kg")
    scale_body_ages = extract_values(scale_readings, "body_age")

    def avg(lst): return round(sum(lst) / len(lst), 1) if lst else 0
    def latest(lst): return lst[-1] if lst else 0

    # ═══════════════════════════════════════════════
    # REFERENCE NORMS by age group and sex
    # Based on WHO, American Heart Association, clinical literature
    # ═══════════════════════════════════════════════
    def get_age_bracket(age):
        if age < 40: return "30-39"
        if age < 50: return "40-49"
        if age < 60: return "50-59"
        if age < 70: return "60-69"
        if age < 80: return "70-79"
        return "80+"

    bracket = get_age_bracket(real_age)

    # HRV norms (ms) — higher = younger/healthier (Shaffer & Ginsberg 2017)
    HRV_NORMS = {
        "M": {"30-39": 60, "40-49": 45, "50-59": 35, "60-69": 28, "70-79": 22, "80+": 18},
        "F": {"30-39": 55, "40-49": 42, "50-59": 33, "60-69": 26, "70-79": 20, "80+": 16},
    }
    # Resting HR norms (bpm) — lower = younger/healthier (AHA)
    HR_NORMS = {
        "M": {"30-39": 68, "40-49": 70, "50-59": 72, "60-69": 72, "70-79": 73, "80+": 74},
        "F": {"30-39": 72, "40-49": 73, "50-59": 74, "60-69": 74, "70-79": 75, "80+": 76},
    }
    # Body fat % norms — lower = healthier within range (ACE)
    BF_NORMS = {
        "M": {"30-39": 18, "40-49": 20, "50-59": 22, "60-69": 23, "70-79": 24, "80+": 25},
        "F": {"30-39": 25, "40-49": 27, "50-59": 29, "60-69": 30, "70-79": 31, "80+": 32},
    }
    # Muscle % norms — higher = healthier (Janssen 2000)
    MUSCLE_NORMS = {
        "M": {"30-39": 38, "40-49": 36, "50-59": 34, "60-69": 32, "70-79": 30, "80+": 28},
        "F": {"30-39": 32, "40-49": 30, "50-59": 28, "60-69": 27, "70-79": 25, "80+": 23},
    }
    # Steps norms — (Tudor-Locke 2011)
    STEPS_NORM = 7000
    # Visceral fat norm (1-12 healthy, 13+ high risk)
    VF_NORM = 9

    g = gender if gender in ("M", "F") else "F"

    # ═══════════════════════════════════════════════
    # BIOMARKER SCORING (0-100 per biomarker)
    # Score > 50 = younger than age norm
    # Score < 50 = older than age norm
    # ═══════════════════════════════════════════════
    scores = {}
    weights = {}
    details = {}

    def score_higher_better(val, norm, name, spread=20):
        """HRV, muscle, steps, sleep, SpO2, water — higher = better"""
        if val <= 0: return None
        pct = ((val - norm) / spread) * 50 + 50
        s = max(0, min(100, round(pct)))
        details[name] = {"value": round(val, 1), "norm": norm, "score": s, "direction": "higher_better"}
        return s

    def score_lower_better(val, norm, name, spread=15):
        """HR, body fat, visceral fat, stress, BMI — lower = better"""
        if val <= 0: return None
        pct = ((norm - val) / spread) * 50 + 50
        s = max(0, min(100, round(pct)))
        details[name] = {"value": round(val, 1), "norm": norm, "score": s, "direction": "lower_better"}
        return s

    # === Level 1: Bracelet-only biomarkers ===
    if hrvs:
        s = score_higher_better(avg(hrvs), HRV_NORMS[g].get(bracket, 30), "hrv", 25)
        if s is not None: scores["hrv"] = s
    if hrs:
        hr_vals = [h for h in hrs if 40 < h < 150]
        if hr_vals:
            s = score_lower_better(avg(hr_vals), HR_NORMS[g].get(bracket, 72), "resting_hr", 15)
            if s is not None: scores["resting_hr"] = s
    if spo2s:
        s = score_higher_better(avg(spo2s), 96, "spo2", 3)
        if s is not None: scores["spo2"] = s
    if sleeps:
        s = score_higher_better(avg(sleeps), 70, "sleep_quality", 20)
        if s is not None: scores["sleep_quality"] = s
    if steps_list:
        s = score_higher_better(avg(steps_list), STEPS_NORM, "steps", 4000)
        if s is not None: scores["steps"] = s
    if stresses:
        s = score_lower_better(avg(stresses), 40, "stress", 25)
        if s is not None: scores["stress"] = s

    # === Level 2: Balance biomarkers ===
    if body_fats:
        s = score_lower_better(avg(body_fats), BF_NORMS[g].get(bracket, 25), "body_fat", 10)
        if s is not None: scores["body_fat"] = s
    if muscles:
        s = score_higher_better(avg(muscles), MUSCLE_NORMS[g].get(bracket, 30), "muscle_mass", 8)
        if s is not None: scores["muscle_mass"] = s
    if visceral_fats:
        s = score_lower_better(avg(visceral_fats), VF_NORM, "visceral_fat", 6)
        if s is not None: scores["visceral_fat"] = s
    if bmis:
        bmi_val = avg(bmis)
        # BMI optimal is 22 for elderly (Flicker 2010)
        bmi_optimal = 22.5
        bmi_dev = abs(bmi_val - bmi_optimal)
        bmi_score = max(0, min(100, round(100 - bmi_dev * 10)))
        scores["bmi"] = bmi_score
        details["bmi"] = {"value": bmi_val, "norm": bmi_optimal, "score": bmi_score, "direction": "closer_better"}
    if waters:
        s = score_higher_better(avg(waters), 55, "hydration", 10)
        if s is not None: scores["hydration"] = s

    # === Determine level ===
    bracelet_keys = {"hrv", "resting_hr", "spo2", "sleep_quality", "steps", "stress"}
    scale_keys_set = {"body_fat", "muscle_mass", "visceral_fat", "bmi", "hydration"}
    has_bracelet_scores = any(k in scores for k in bracelet_keys)
    has_scale_scores = any(k in scores for k in scale_keys_set)

    if has_bracelet_scores and has_scale_scores:
        level = 2
        # Level 2 weights (Bracelet + Balance)
        weights = {
            "hrv": 0.20, "visceral_fat": 0.20, "muscle_mass": 0.15,
            "resting_hr": 0.10, "body_fat": 0.10, "sleep_quality": 0.08,
            "steps": 0.07, "bmi": 0.05, "hydration": 0.03, "spo2": 0.02,
        }
    elif has_bracelet_scores:
        level = 1
        # Level 1 weights (Bracelet only — HRV dominant)
        weights = {
            "hrv": 0.30, "resting_hr": 0.20, "sleep_quality": 0.15,
            "steps": 0.15, "spo2": 0.10, "stress": 0.10,
        }
    else:
        level = 2
        # Scale-only fallback
        weights = {
            "visceral_fat": 0.30, "muscle_mass": 0.25, "body_fat": 0.20,
            "bmi": 0.15, "hydration": 0.10,
        }

    # === Weighted composite score (0-100) ===
    weighted_sum = 0
    weight_total = 0
    for key, w in weights.items():
        if key in scores:
            weighted_sum += scores[key] * w
            weight_total += w
    composite_score = round(weighted_sum / weight_total) if weight_total > 0 else 50

    # === Convert composite score to biological age offset ===
    # Score 50 = exact age, each 10 points = ~2 years difference
    age_offset = (50 - composite_score) / 5  # ±10 years max range
    bio_age = max(30, min(100, round(real_age + age_offset)))

    # Override with Nora AI body_age if available (higher confidence)
    body_age_cache = await db.body_age_cache.find_one({"user_id": uid}, {"_id": 0})
    nora_bio_age = None
    if body_age_cache and body_age_cache.get("body_age") and body_age_cache.get("status") == "computed":
        nora_bio_age = body_age_cache["body_age"]
        # Blend: 60% Nora AI + 40% algorithm (when both available)
        bio_age = round(nora_bio_age * 0.6 + bio_age * 0.4)

    # Also use scale body_age as reference
    if scale_body_ages and not nora_bio_age:
        scale_ba = round(avg(scale_body_ages))
        if 30 <= scale_ba <= 100:
            # Blend: 40% scale + 60% algorithm
            bio_age = round(scale_ba * 0.4 + bio_age * 0.6)

    # === Compute aging rate (ratio) ===
    base_rate = bio_age / real_age if real_age > 0 else 1.0

    # === Level 3: Temporal trends (30/60/90 days) ===
    trends = {}
    trend_adjustment = 0.0

    def compute_trend(values, timestamps, key):
        """Compute trend direction and magnitude over available time window."""
        if len(values) < 4: return None
        n = len(values)
        mid = n // 2
        first_half_avg = sum(values[:mid]) / mid
        second_half_avg = sum(values[mid:]) / (n - mid)
        if first_half_avg == 0: return None
        change_pct = ((second_half_avg - first_half_avg) / abs(first_half_avg)) * 100
        return {"first_avg": round(first_half_avg, 1), "recent_avg": round(second_half_avg, 1),
                "change_pct": round(change_pct, 1), "improving": None, "period_days": len(set(t[:10] for t in timestamps))}

    # HRV trend (improving = going up)
    if hrvs and len(hrvs) >= 4:
        ts = [r["timestamp"] for r in bracelet_readings if r.get("data", {}).get("hrv", 0) > 0]
        t = compute_trend(hrvs, ts, "hrv")
        if t:
            t["improving"] = t["change_pct"] > 0
            trends["hrv"] = t
            if t["change_pct"] > 10: trend_adjustment -= 0.04  # improving a lot
            elif t["change_pct"] > 3: trend_adjustment -= 0.02
            elif t["change_pct"] < -10: trend_adjustment += 0.04  # degrading
            elif t["change_pct"] < -3: trend_adjustment += 0.02

    # Resting HR trend (improving = going down)
    if hrs and len(hrs) >= 4:
        hr_valid = [(h, r["timestamp"]) for r, h in zip(bracelet_readings, [r.get("data", {}).get("heart_rate", 0) for r in bracelet_readings]) if 40 < h < 150]
        if len(hr_valid) >= 4:
            hr_vals, hr_ts = zip(*hr_valid)
            t = compute_trend(list(hr_vals), list(hr_ts), "resting_hr")
            if t:
                t["improving"] = t["change_pct"] < 0
                trends["resting_hr"] = t
                if t["change_pct"] < -5: trend_adjustment -= 0.02
                elif t["change_pct"] > 5: trend_adjustment += 0.02

    # Steps trend (improving = going up)
    if steps_list and len(steps_list) >= 4:
        ts = [r["timestamp"] for r in bracelet_readings if r.get("data", {}).get("steps", 0) > 0]
        t = compute_trend(steps_list, ts, "steps")
        if t:
            t["improving"] = t["change_pct"] > 0
            trends["steps"] = t
            if t["change_pct"] > 15: trend_adjustment -= 0.02
            elif t["change_pct"] < -15: trend_adjustment += 0.02

    # Body fat trend (improving = going down)
    if body_fats and len(body_fats) >= 3:
        ts = [r["timestamp"] for r in scale_readings if r.get("data", {}).get("body_fat_pct", 0) > 0]
        t = compute_trend(body_fats, ts, "body_fat")
        if t:
            t["improving"] = t["change_pct"] < 0
            trends["body_fat"] = t
            if t["change_pct"] < -3: trend_adjustment -= 0.02
            elif t["change_pct"] > 3: trend_adjustment += 0.02

    # Muscle trend (improving = going up)
    if muscles and len(muscles) >= 3:
        ts = [r["timestamp"] for r in scale_readings if r.get("data", {}).get("muscle_pct", 0) > 0]
        t = compute_trend(muscles, ts, "muscle_mass")
        if t:
            t["improving"] = t["change_pct"] > 0
            trends["muscle_mass"] = t
            if t["change_pct"] > 3: trend_adjustment -= 0.02
            elif t["change_pct"] < -3: trend_adjustment += 0.02

    # Final rate with trend adjustment
    rate = round(max(0.1, min(3.0, base_rate + trend_adjustment)), 2)

    # Label
    if rate < 0.7:
        label, color = "Tres lent", "#10B981"
    elif rate < 0.9:
        label, color = "Lent", "#84CC16"
    elif rate <= 1.1:
        label, color = "Normal", "#F59E0B"
    elif rate <= 1.5:
        label, color = "Rapide", "#F97316"
    else:
        label, color = "Tres rapide", "#EF4444"

    # Confidence
    data_points = len(bracelet_readings) + len(scale_readings)
    if data_points > 60 and len(scores) >= 6:
        confidence = "haute"
    elif data_points > 20 and len(scores) >= 3:
        confidence = "moyenne"
    else:
        confidence = "basse"

    # Trend summary
    improving_count = sum(1 for t in trends.values() if t.get("improving"))
    degrading_count = sum(1 for t in trends.values() if t.get("improving") is False)
    if improving_count > degrading_count + 1:
        trend_label = "En amelioration"
        trend_color = "#10B981"
    elif degrading_count > improving_count + 1:
        trend_label = "En degradation"
        trend_color = "#EF4444"
    elif trends:
        trend_label = "Stable"
        trend_color = "#F59E0B"
    else:
        trend_label = "Donnees insuffisantes"
        trend_color = "rgba(255,255,255,0.3)"

    # Cache the bio_age
    await db.body_age_cache.update_one(
        {"user_id": uid},
        {"$set": {
            "user_id": uid, "body_age": bio_age, "status": "computed",
            "explanation": f"Age biologique estime a {bio_age} ans (niveau {level}, confiance {confidence}).",
            "computed_at": datetime.now(timezone.utc).isoformat(),
            "last_reading_ts": datetime.now(timezone.utc).isoformat(),
            "algorithm_version": "v2",
        }},
        upsert=True
    )

    return {
        "rate": rate,
        "label": label,
        "color": color,
        "bio_age": bio_age,
        "real_age": real_age,
        "diff": real_age - bio_age,
        "status": "computed",
        "level": level,
        "level_label": ["", "Bracelet seul", "Bracelet + Balance"][level],
        "confidence": confidence,
        "composite_score": composite_score,
        "data_sources": {
            "bracelet_readings": len(bracelet_readings),
            "scale_readings": len(scale_readings),
            "biomarkers_scored": len(scores),
        },
        "biomarkers": details,
        "weights_used": {k: v for k, v in weights.items() if k in scores},
        "trends": trends,
        "trend_summary": {"label": trend_label, "color": trend_color,
                          "improving": improving_count, "degrading": degrading_count},
        "factors": {
            "stress": latest(stresses),
            "sleep_quality": latest(sleeps),
            "steps": latest(steps_list),
        },
        "reference_norms": {
            "age_bracket": bracket,
            "gender": g,
            "hrv_norm": HRV_NORMS[g].get(bracket),
            "hr_norm": HR_NORMS[g].get(bracket),
            "body_fat_norm": BF_NORMS[g].get(bracket),
            "muscle_norm": MUSCLE_NORMS[g].get(bracket),
        },
    }



# ═══════════════════════════════════════════════════════════════
# Endpoints migrated from health_routes.py
# ═══════════════════════════════════════════════════════════════

