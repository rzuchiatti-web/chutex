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
    ctx["health_data"] = {
        "bracelet": bracelet_reading.get("data", {}) if bracelet_reading else {},
        "scale": scale_reading.get("data", {}) if scale_reading else {},
        "has_bracelet_data": has_bracelet_data,
        "has_scale_data": has_scale_data,
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
        if sd.get("body_age"):
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

    # Recommendations
    if ctx["recommendations"]:
        parts.append("\nRECOMMANDATIONS POUR CE PATIENT (a integrer dans tes reponses si pertinent):")
        for r in ctx["recommendations"]:
            parts.append(f"- {r}")

    return "\n".join(parts)


# ── App services knowledge base for Nora ──
APP_SERVICES_KNOWLEDGE = """
SERVICES DE L'APPLICATION CHUTEX CARE WATCH:

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
   - Envoi d'intervenants Care en cas d'urgence
   - Suivi GPS en temps reel
   - Notifications automatiques aux gardiens
   - Rapports de cloture d'intervention
   - RECOMMANDE pour les personnes de +70 ans vivant seules

3. BALANCE VITA (appareil complementaire):
   - Balance connectee 8 electrodes
   - Mesure: poids, IMC, masse grasse, masse musculaire, hydratation, masse osseuse, graisse viscerale, age corporel, proteines, muscle squelettique
   - Indispensable pour une analyse complete de la composition corporelle
   - Se connecte automatiquement a l'app

4. PROGRAMMES DE PREVENTION (gratuits avec abonnement):
   - "21 jours pour mieux dormir" — Programme sommeil progressif en 3 phases
   - "14 jours pour stabiliser sa tension" — Programme cardiovasculaire
   - "30 jours pour bouger plus" — Programme activite physique adaptee
   - Check-ins quotidiens, badges, suivi de progression
   - Possibilite de faire les programmes en equipe

5. NORA — Assistante IA medicale:
   - Analyse en temps reel des donnees de sante
   - Recommandations personnalisees basees sur les donnees reelles
   - Chat medical disponible 24/7
   - Rapports de sante hebdomadaires et quotidiens

6. ESPACE GARDIEN:
   - Suivi en temps reel de la sante du beneficiaire
   - Reception des alertes SOS et chutes
   - Coordination des interventions
   - Notifications automatiques
"""
