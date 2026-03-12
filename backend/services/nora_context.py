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

    # ── Glycemia estimation ──
    glycemia_cals = await db.glycemia_calibrations.count_documents({"user_id": uid})
    ctx["glycemia_calibrations"] = glycemia_cals

    # ── Sleep data ──
    sleep_reading = None
    if bracelet_reading and bracelet_reading.get("data", {}).get("sleep_quality", 0) > 0:
        sleep_reading = bracelet_reading["data"]
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
SERVICES DE L'APPLICATION CHUTEX:

L'application s'appelle Chutex (PAS "CareWatch", PAS "Care Watch", PAS "Chutex Care Watch"). Chutex Care est UNIQUEMENT le nom du service de teleassistance 24/7.

1. ABONNEMENT STANDARD — Bracelet Elio (24,90 EUR/mois):
   - Suivi cardiaque en continu (FC, HRV, SpO2)
   - Suivi du sommeil (phases, qualite, duree)
   - Temperature corporelle
   - Compteur de pas et calories
   - Detection de chute
   - Historique complet dans l'app
   - Analyse IA Nora personnalisee

2. ABONNEMENT CHUTEX CARE — Teleassistance 24/7 (39,90 EUR/mois):
   - Tout le Standard +
   - Bouton SOS sur le bracelet
   - Plateau d'ecoute professionnel 24h/24, 7j/7
   - Envoi d'intervenants en cas d'urgence
   - Suivi GPS en temps reel
   - Notifications automatiques aux gardiens
   - Rapports de cloture d'intervention
   - RECOMMANDE pour les personnes de +70 ans vivant seules

3. BRACELET ELIO V6 (appareil principal):
   - Bracelet connecte 4G
   - Mesure: frequence cardiaque, HRV, SpO2, temperature, tension arterielle, pas, calories, sommeil
   - Detection de chute automatique
   - Bouton SOS (avec abonnement Chutex Care)

4. BALANCE VITA (appareil complementaire):
   - Balance connectee WiFi 8 electrodes
   - Mesure: poids, IMC, masse grasse, masse musculaire, hydratation, masse osseuse, graisse viscerale, age corporel, proteines, muscle squelettique
   - Multi-utilisateurs (une balance pour tout le foyer)
   - Se connecte automatiquement a l'app via WiFi

5. PROGRAMMES DE PREVENTION (gratuits avec abonnement):
   - "21 jours pour prevenir les chutes" — Programme equilibre et renforcement en 3 phases
   - "21 jours pour mieux dormir" — Programme sommeil progressif en 3 phases
   - "14 jours pour stabiliser sa tension" — Programme cardiovasculaire
   - "30 jours pour bouger plus" — Programme activite physique adaptee
   - Check-ins quotidiens, badges, suivi de progression
   - Possibilite de faire les programmes en equipe
   - Jeux de rehabilitation (Dorsi pour le dos)

6. NORA — Intelligence Artificielle Chutex:
   - Analyse en temps reel des donnees de sante
   - Recommandations personnalisees basees sur les donnees reelles
   - Chat IA disponible 24/7
   - Briefing matinal quotidien personnalise
   - Estimation glycemie, age biologique, taux de vieillissement
   - Correlations et alertes predictives

7. BILAN LOMBAIRE DORSI:
   - Evaluation de la mobilite lombaire (4 directions: avant, arriere, gauche, droite)
   - Mesure de l'amplitude et de la douleur
   - Generation de programme de reeducation adapte
   - Suivi de progression dans le temps

8. ESPACE GARDIEN:
   - Suivi en temps reel de la sante du beneficiaire
   - Reception des alertes SOS et chutes
   - Coordination des interventions
   - Notifications automatiques
   - Possibilite de rattacher plusieurs beneficiaires

9. ESPACE MINCEUR:
   - Objectif poids avec suivi sur plusieurs semaines
   - Suivi calories, hydratation
   - Recommandations nutritionnelles
   - Plans de repas personnalises

10. TELEASSISTANCE:
    - Plateforme d'alerte en temps reel pour les structures SAAD
    - Gestion des interventions d'urgence
    - Historique des alertes et rapports

REGLES STRICTES:
- Ne JAMAIS recommander au beneficiaire d'activer un espace ou role gardien. Le beneficiaire est un patient, pas un gardien.
- Ne JAMAIS suggerer de "devenir gardien" ou "activer le role gardien" a un beneficiaire.
- Ne JAMAIS dire "CareWatch", "Care Watch" ou "Chutex Care Watch" — ca n'existe pas. L'app s'appelle Chutex.
- Les recommandations doivent porter uniquement sur: les dispositifs de sante, les programmes de prevention, l'abonnement, et le suivi medical.
"""
