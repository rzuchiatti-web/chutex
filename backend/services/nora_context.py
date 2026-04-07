"""
Nora AI Context Builder
Aggregates full user context for intelligent, personalized AI responses.
"""
from datetime import datetime, timezone
from database import db


async def build_nora_context(user: dict) -> dict:
    """Build a comprehensive context dict for Nora AI from user data and app state."""
    uid = user['id']
    ctx = {
        "user_profile": {},
        "subscription": None,
        "devices": [],
        "has_bracelet": False,
        "has_scale": False,
        "has_vest": False,
        "has_any_data": False,
        "health_data": {},
        "active_program": None,
        "age": None,
        "recommendations": [],
    }

    # ── User profile ──
    name = user.get('name', 'Inconnu')
    gender = user.get('gender', '')
    dob = user.get('date_of_birth', '')
    age = None
    if dob:
        try:
            for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
                try:
                    born = datetime.strptime(dob, fmt)
                    age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                    break
                except ValueError:
                    continue
        except Exception:
            pass
    ctx["age"] = age
    ctx["user_profile"] = {
        "name": name, "gender": gender, "age": age,
        "date_of_birth": dob,
        "height_cm": user.get('height_cm'),
        "weight_kg": user.get('weight_kg'),
        "blood_type": user.get('blood_type', ''),
        "medical_conditions": user.get('medical_conditions', ''),
        "allergies": user.get('allergies', ''),
        "doctor_name": user.get('doctor_name', ''),
    }

    # ── Subscription ──
    sub = await db.subscriptions.find_one(
        {"beneficiary_id": uid, "status": "active"}, {"_id": 0}
    )
    if not sub:
        sub = await db.subscriptions.find_one(
            {"beneficiary_id": uid}, {"_id": 0}
        )
    ctx["subscription"] = sub

    # ── Devices ──
    devices = await db.devices.find({"user_id": uid}, {"_id": 0}).to_list(10)
    ctx["devices"] = devices
    ctx["has_bracelet"] = any(d.get("device_type") == "bracelet" for d in devices)
    ctx["has_scale"] = any(d.get("device_type") == "scale" for d in devices)
    ctx["has_vest"] = any(d.get("device_type") == "vest" for d in devices)

    # ── Latest readings ──
    bracelet_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0},
        sort=[("timestamp", -1)]
    )
    scale_reading = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0},
        sort=[("timestamp", -1)]
    )
    has_bracelet_data = bool(bracelet_reading and bracelet_reading.get("data"))
    has_scale_data = bool(scale_reading and scale_reading.get("data"))
    ctx["has_any_data"] = has_bracelet_data or has_scale_data

    # Get Nora's AI-computed body age
    body_age_cache = await db.body_age_cache.find_one({"user_id": uid}, {"_id": 0})
    nora_body_age = body_age_cache.get("body_age") if body_age_cache else None

    scale_data = scale_reading.get("data", {}) if scale_reading else {}
    if nora_body_age:
        scale_data["body_age"] = nora_body_age  # Override with Nora's value

    ctx["health_data"] = {
        "bracelet": bracelet_reading.get("data", {}) if bracelet_reading else {},
        "scale": scale_data,
        "has_bracelet_data": has_bracelet_data,
        "has_scale_data": has_scale_data,
        "nora_body_age": nora_body_age,
    }

    # ── Active program ──
    enrollment = await db.program_enrollments.find_one(
        {"user_id": uid, "status": "active"}, {"_id": 0}
    )
    if enrollment:
        program = await db.programs.find_one(
            {"id": enrollment["program_id"]}, {"_id": 0, "daily_tasks_template": 0}
        )
        ctx["active_program"] = {
            "title": program.get("title", "") if program else "",
            "category": program.get("category", "") if program else "",
            "current_day": enrollment.get("current_day", 1),
            "duration_days": program.get("duration_days", 21) if program else 21,
        }

    # ── Weight goal ──
    weight_goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})
    ctx["weight_goal"] = weight_goal

    # ── Today's exercises ──
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day_names = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    today_day = day_names[datetime.now(timezone.utc).weekday()]
    assigned = await db.pro_assigned_exercises.find(
        {"beneficiary_id": uid, "status": "active"}, {"_id": 0}
    ).to_list(30)
    today_exercises = []
    for ex in assigned:
        days = ex.get("days", [])
        if not days or today_day in days:
            done = any(
                c.get("date", "").startswith(today_str) and c.get("status") == "done"
                for c in ex.get("completions", [])
            )
            today_exercises.append({
                "id": ex.get("id", ""),
                "title": ex.get("title", ""),
                "sets": ex.get("sets", 0),
                "repetitions": ex.get("repetitions", 0),
                "completed_today": done,
                "nora_assigned": ex.get("nora_assigned", False),
                "self_assigned": ex.get("self_assigned", False),
                "professional_name": ex.get("professional_name", ""),
            })
    ctx["today_exercises"] = today_exercises

    # ── Today's nutrition ──
    daily_cache = await db.minceur_daily_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )
    nutrition_today = None
    if daily_cache and daily_cache.get("recommendations"):
        recs = daily_cache["recommendations"]
        meals = recs.get("meals", [])
        validated_meals = sum(1 for m in meals if m.get("validated"))
        nutrition_today = {
            "daily_calories": recs.get("daily_calories", 0),
            "macros": recs.get("macros", {}),
            "total_meals": len(meals),
            "validated_meals": validated_meals,
            "has_meal_plan": len(meals) > 0,
            "meal_names": [m.get("name", m.get("label", "")) for m in meals],
        }
    ctx["nutrition_today"] = nutrition_today

    # ── Glycemia estimation ──
    glycemia_cals = await db.glycemia_calibrations.count_documents({"user_id": uid})
    ctx["glycemia_calibrations"] = glycemia_cals

    # ── Sleep data ──
    sleep_reading = None
    if bracelet_reading and bracelet_reading.get("data", {}).get("sleep_quality", 0) > 0:
        sleep_reading = bracelet_reading["data"]
    # Also fetch dedicated sleep history for richer context
    if not sleep_reading:
        sleep_hist = await db.device_readings.find(
            {"user_id": uid, "device_type": "bracelet", "data_type": {"$in": ["sleep", "sleep_segment"]}},
            {"_id": 0}
        ).sort("timestamp", -1).to_list(1)
        if sleep_hist:
            sd = sleep_hist[0].get("data", {})
            if sd.get("deep_sleep_min", 0) > 0 or sd.get("light_sleep_min", 0) > 0:
                sleep_reading = sd
    ctx["sleep_data"] = sleep_reading

    # ── Smart recommendations ──
    recs = []
    sub_type = sub.get("subscription_type", "") if sub else ""

    # Age-based: 75+ → recommend Care teleassistance
    if age and age >= 75 and sub_type != "care":
        recs.append("RECOMMANDER_CARE: L'utilisateur a plus de 75 ans et n'a pas l'abonnement Care avec teleassistance 24/7. Recommande l'abonnement Chutex Care (bracelet Elio + teleassistance, detection de chute, bouton SOS, plateau d'ecoute 24/7).")

    # No subscription at all
    if not sub or sub.get("status") != "active":
        recs.append("RECOMMANDER_ABONNEMENT: L'utilisateur n'a pas d'abonnement actif. Explique les offres : Standard (Bracelet Elio, 24.90EUR/mois) pour le suivi sante, ou Care (39.90EUR/mois) pour la teleassistance 24/7.")

    # No scale → recommend for complete body analysis
    if not ctx["has_scale"]:
        recs.append("RECOMMANDER_BALANCE: L'utilisateur n'a pas de balance connectee. Recommande la Balance Vita (8 electrodes) pour une analyse complete de la composition corporelle (poids, masse grasse, masse musculaire, hydratation, age corporel).")

    # No bracelet
    if not ctx["has_bracelet"]:
        recs.append("RECOMMANDER_BRACELET: L'utilisateur n'a pas de bracelet Elio. C'est l'appareil principal pour le suivi cardiaque, SpO2, sommeil, activite et temperature.")

    # No active program and has data → recommend starting one
    if not ctx["active_program"] and ctx["has_any_data"]:
        recs.append("RECOMMANDER_PROGRAMME: L'utilisateur n'a pas de programme actif. Selon ses donnees, propose un programme adapte : '21 jours pour mieux dormir' (sommeil), '14 jours pour stabiliser sa tension' (cardiovasculaire), ou '30 jours pour bouger plus' (activite).")

    # Has health issues → recommend specific programs
    conditions = user.get('medical_conditions', '').lower()
    if 'hypertension' in conditions and not ctx["active_program"]:
        recs.append("RECOMMANDER_PROGRAMME_TENSION: L'utilisateur a de l'hypertension. Recommande le programme '14 jours pour stabiliser sa tension'.")

    ctx["recommendations"] = recs
    return ctx


def format_nora_context_for_prompt(ctx: dict) -> str:
    """Format the context dict into a string for AI prompts."""
    parts = []

    # Profile
    p = ctx["user_profile"]
    profile_str = f"Patient: {p['name']}"
    if p['age']:
        profile_str += f", {p['age']} ans"
    if p['gender']:
        profile_str += f", {p['gender']}"
    parts.append(profile_str + ".")

    if p.get('height_cm'):
        parts.append(f"Taille: {p['height_cm']}cm.")
    if p.get('weight_kg'):
        parts.append(f"Poids declare: {p['weight_kg']}kg.")
    if p.get('medical_conditions'):
        parts.append(f"Pathologies connues: {p['medical_conditions']}.")
    if p.get('allergies'):
        parts.append(f"Allergies: {p['allergies']}.")

    # Subscription
    sub = ctx["subscription"]
    if sub and sub.get("status") == "active":
        st = sub.get("subscription_type", "standard")
        parts.append(f"Abonnement actif: {'Chutex Care (teleassistance 24/7)' if st == 'care' else 'Standard (Bracelet Elio)'}.")
    else:
        parts.append("Aucun abonnement actif.")

    # Devices
    dev_names = []
    if ctx["has_bracelet"]:
        dev_names.append("Bracelet Elio")
    if ctx["has_scale"]:
        dev_names.append("Balance Vita")
    if ctx["has_vest"]:
        dev_names.append("Gilet Elder")
    if dev_names:
        parts.append(f"Appareils connectes: {', '.join(dev_names)}.")
    else:
        parts.append("Aucun appareil connecte.")

    # Health data
    hd = ctx["health_data"]
    if hd["has_bracelet_data"]:
        bd = hd["bracelet"]
        bracelet_parts = []
        if bd.get("heart_rate"):
            bracelet_parts.append(f"FC {bd['heart_rate']}bpm")
        if bd.get("spo2"):
            bracelet_parts.append(f"SpO2 {bd['spo2']}%")
        if bd.get("blood_pressure", {}).get("systolic"):
            bracelet_parts.append(f"Tension {bd['blood_pressure']['systolic']}/{bd['blood_pressure'].get('diastolic', '?')}mmHg")
        if bd.get("temperature"):
            bracelet_parts.append(f"Temp {bd['temperature']}C")
        if bd.get("steps"):
            bracelet_parts.append(f"{bd['steps']} pas")
        if bd.get("hrv"):
            bracelet_parts.append(f"HRV {bd['hrv']}ms")
        if bracelet_parts:
            parts.append(f"Donnees bracelet: {', '.join(bracelet_parts)}.")
    else:
        if ctx["has_bracelet"]:
            parts.append("Bracelet associe mais AUCUNE donnee recue encore.")
        else:
            parts.append("PAS de bracelet — aucune donnee cardiaque, sommeil ou activite.")

    if hd["has_scale_data"]:
        sd = hd["scale"]
        scale_parts = []
        if sd.get("weight"):
            scale_parts.append(f"Poids {sd['weight']}kg")
        if sd.get("bmi"):
            scale_parts.append(f"IMC {sd['bmi']}")
        if sd.get("body_fat_pct"):
            scale_parts.append(f"Graisse {sd['body_fat_pct']}%")
        if sd.get("muscle_pct"):
            scale_parts.append(f"Muscle {sd['muscle_pct']}%")
        if sd.get("water_pct"):
            scale_parts.append(f"Eau {sd['water_pct']}%")
        if sd.get("visceral_fat"):
            scale_parts.append(f"Graisse visc. {sd['visceral_fat']}")
        if hd.get("nora_body_age"):
            scale_parts.append(f"Age corporel (estime par Nora) {hd['nora_body_age']} ans")
        elif sd.get("body_age"):
            scale_parts.append(f"Age corporel {sd['body_age']} ans")
        if scale_parts:
            parts.append(f"Donnees balance: {', '.join(scale_parts)}.")
    else:
        if ctx["has_scale"]:
            parts.append("Balance associee mais AUCUNE pesee effectuee.")
        else:
            parts.append("PAS de balance — aucune donnee de composition corporelle.")

    # Active program
    if ctx["active_program"]:
        ap = ctx["active_program"]
        parts.append(f"Programme actif: '{ap['title']}' — Jour {ap['current_day']}/{ap['duration_days']}.")
    else:
        parts.append("Aucun programme de prevention en cours.")

    # Weight goal
    wg = ctx.get("weight_goal")
    if wg and wg.get("target_kg"):
        parts.append(f"Objectif poids: {wg['target_kg']}kg en {wg.get('weeks', 12)} semaines.")

    # Today's exercises
    tex = ctx.get("today_exercises", [])
    if tex:
        done_ex = sum(1 for e in tex if e["completed_today"])
        ex_lines = []
        for e in tex:
            status = "FAIT" if e["completed_today"] else "A FAIRE"
            source = "Nora" if e.get("nora_assigned") else ("Auto" if e.get("self_assigned") else e.get("professional_name", "Coach"))
            ex_lines.append(f"  - {e['title']} ({e['sets']}x{e['repetitions']}) [{status}] (prescrit par: {source}, id:{e['id']})")
        parts.append(f"Exercices aujourd'hui: {done_ex}/{len(tex)} completes.\n" + "\n".join(ex_lines))
    else:
        parts.append("Aucun exercice assigne aujourd'hui.")

    # Today's nutrition
    nt = ctx.get("nutrition_today")
    if nt and nt.get("daily_calories"):
        macros = nt.get("macros", {})
        macro_str = f"P:{macros.get('proteines_g', '?')}g G:{macros.get('glucides_g', '?')}g L:{macros.get('lipides_g', '?')}g" if macros else ""
        meal_status = f"{nt['validated_meals']}/{nt['total_meals']} repas valides" if nt.get("has_meal_plan") else "Pas de plan repas"
        parts.append(f"Nutrition aujourd'hui: {nt['daily_calories']} kcal/jour, {macro_str}. {meal_status}.")
        if nt.get("meal_names"):
            parts.append(f"Repas prevus: {', '.join(nt['meal_names'])}.")
    else:
        parts.append("Aucun plan nutritionnel pour aujourd'hui.")

    # Glycemia
    gc = ctx.get("glycemia_calibrations", 0)
    if gc > 0:
        parts.append(f"Glycemie: {gc} calibrations capillaires effectuees. L'estimation glycemique s'ameliore.")

    # Sleep
    sd = ctx.get("sleep_data")
    if sd:
        sq = sd.get("sleep_quality", 0)
        dur = sd.get("sleep_duration_min", 0)
        deep = sd.get("deep_sleep_min", 0)
        if sq > 0:
            parts.append(f"Sommeil: qualite {sq}%, duree {dur}min, sommeil profond {deep}min.")

    # Body age
    ba = hd.get("nora_body_age")
    if ba:
        parts.append(f"Age biologique estime: {ba} ans (age reel: {ctx.get('age', '?')} ans).")

    # Recommendations
    if ctx["recommendations"]:
        parts.append("\nRECOMMANDATIONS POUR CE PATIENT (a integrer dans tes reponses si pertinent):")
        for r in ctx["recommendations"]:
            parts.append(f"- {r}")

    return "\n".join(parts)


# ── App services knowledge base for Nora ──
APP_SERVICES_KNOWLEDGE = """
SERVICES CHUTEX (JAMAIS "CareWatch"):

1. STANDARD (24,90EUR/mois): Bracelet Elio — suivi FC/HRV/SpO2/sommeil/temp/pas/calories/chute + historique + Nora IA. Soit 12,45EUR apres credit impot 50%.
2. CHUTEX CARE (39,90EUR/mois): Standard + SOS bracelet + teleassistance 24/7 + GPS + envoi intervenants + notifications gardiens. Recommande +70 ans seuls. Soit 19,95EUR apres credit impot.
3. BRACELET ELIO V6: 4G, FC/HRV/SpO2/temp/tension/pas/calories/sommeil, detection chute, SOS (avec Care).
4. BALANCE VITA: WiFi 8 electrodes, poids/IMC/graisse/muscle/eau/os/graisse viscerale/age corporel/proteines/muscle squelettique. Multi-utilisateurs.
5. PROGRAMMES PREVENTION (gratuits avec abo): Chutes 21j, Sommeil 21j, Tension 14j, Activite 30j — check-ins quotidiens, badges, equipe possible. Dorsi: bilan lombaire + reeducation.
6. NORA IA: analyse temps reel, recommandations, chat 24/7, briefing matinal, estimation glycemie/age bio/vieillissement, correlations predictives.
7. ESPACE GARDIEN: suivi beneficiaire temps reel, alertes SOS/chutes, interventions, notifications, multi-beneficiaires.
8. ESPACE MINCEUR: objectif poids, suivi calories/hydratation, recommandations nutrition, plans repas.
9. TELEASSISTANCE: plateforme alertes SAAD, gestion interventions urgence, historique.
10. HEBERGEMENT: Serveurs HDS classe 6 (Hebergeur Donnees Sante), en France chez Free (Groupe Iliad). Donnees ne quittent jamais la France. Conforme RGPD et reglementation europeenne.

REGLES: Ne JAMAIS recommander a un beneficiaire de devenir gardien. Ne JAMAIS dire "CareWatch". Recommandations = dispositifs, programmes, abonnement, suivi medical uniquement.
"""
