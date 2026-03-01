"""
Chutex Care — Advanced features routes
Weekly reports, predictive alerts, streaks, enhanced morning briefing, intervenant mode, Nora TTS
"""
"""
Chutex Care — Advanced features routes
Weekly reports, predictive alerts, streaks, enhanced morning briefing, intervenant mode
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import os, uuid

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

router = APIRouter()


# ═══════════════════════════════════════════
#  1. WEEKLY REPORT EMAIL
# ═══════════════════════════════════════════

@router.post("/nora/send-weekly-report")
async def send_weekly_report(user=Depends(get_current_user)):
    """Generate and send weekly health report email via Mailjet"""
    uid = user['id']
    email = user.get('email', '')
    if not email:
        return {"status": "no_email", "message": "Pas d'adresse email configuree"}

    nora_ctx = await build_nora_context(user)
    hd = nora_ctx["health_data"]

    # Build trends from last 7 days
    now = datetime.now(timezone.utc)
    seven_ago = (now - timedelta(days=7)).isoformat()
    fourteen_ago = (now - timedelta(days=14)).isoformat()

    br_this = await db.device_readings.find({"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_ago}}, {"_id": 0}).to_list(50)
    br_prev = await db.device_readings.find({"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": fourteen_ago, "$lt": seven_ago}}, {"_id": 0}).to_list(50)

    def avg_metric(readings, key):
        vals = [r.get("data", {}).get(key, 0) for r in readings if r.get("data", {}).get(key)]
        return round(sum(vals) / len(vals), 1) if vals else 0

    trends = []
    for key, label in [("heart_rate", "FC repos"), ("spo2", "SpO2"), ("sleep_quality", "Sommeil"), ("steps", "Pas/jour"), ("stress_level", "Stress")]:
        curr = avg_metric(br_this, key)
        prev = avg_metric(br_prev, key)
        if curr > 0:
            better_low = key in ("heart_rate", "stress_level")
            diff = round(curr - prev, 1) if prev > 0 else 0
            trend = "down" if diff < 0 else "up" if diff > 0 else "stable"
            good = (trend == "down" and better_low) or (trend == "up" and not better_low) or trend == "stable"
            unit = {"heart_rate": "bpm", "spo2": "%", "sleep_quality": "%", "steps": "pas", "stress_level": "/100"}.get(key, "")
            trends.append({"label": label, "value": f"{curr} {unit}", "trend": trend, "good": good})

    # Active program info
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_info = {}
    if enrollment:
        prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0, "daily_tasks_template": 0})
        if prog:
            phase = next((p for p in prog.get("phases", []) if p["days"][0] <= enrollment.get("current_day", 1) <= p["days"][1]), None)
            program_info = {"title": prog["title"], "day": enrollment.get("current_day", 1), "total": prog["duration_days"], "phase": phase["name"] if phase else "", "progress": round((enrollment.get("current_day", 1) / prog["duration_days"]) * 100)}

    # Get streak
    streak_doc = await db.user_streaks.find_one({"user_id": uid}, {"_id": 0})
    streak = streak_doc.get("current_streak", 0) if streak_doc else 0

    # Alerts this week
    week_alerts = await db.alerts.find({"user_id": uid, "created_at": {"$gte": seven_ago}}, {"_id": 0}).to_list(20)
    alerts_summary = f"{len(week_alerts)} alerte(s) cette semaine." if week_alerts else "Aucune alerte cette semaine."

    # AI advice
    nora_advice = "Continuez vos bonnes habitudes pour maintenir votre sante."
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key and nora_ctx.get("has_any_data"):
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            ctx_str = format_nora_context_for_prompt(nora_ctx)
            prompt = f"Medecin. Donnees patient:\n{ctx_str}\nGenere 1 conseil medical personnalise en 2 phrases max pour la semaine prochaine. Vouvoyez. Pas d'emoji."
            chat = LlmChat(api_key=api_key, session_id=f"wr-{uuid.uuid4().hex[:6]}", system_message="Medecin. 2 phrases max. Pas d'emoji.").with_model("openai", "gpt-5.2")
            nora_advice = (await chat.send_message(UserMessage(text=prompt))).strip()
        except Exception as e:
            print(f"Weekly report AI err: {e}")

    # Compute score
    from routes.health_report_routes import gen_data, compute_subscores
    d = gen_data()
    if hd.get("has_bracelet_data"):
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "hrv"]:
            if hd["bracelet"].get(k): d[k] = hd["bracelet"][k]
    si = compute_subscores(d)

    report_data = {
        "score": si["score"], "status": si["status"],
        "trends": trends, "program": program_info,
        "streak": streak, "alerts_summary": alerts_summary,
        "nora_advice": nora_advice,
    }

    # Send email
    import asyncio
    from services.email_service import send_weekly_report_email
    asyncio.create_task(send_weekly_report_email(user.get("name", ""), email, report_data))

    # Also send to guardians
    guardian_ids = user.get("guardians", [])
    for gid in guardian_ids:
        guardian = await db.users.find_one({"id": gid}, {"_id": 0})
        if guardian and guardian.get("email"):
            asyncio.create_task(send_weekly_report_email(
                guardian.get("name", ""), guardian["email"],
                {**report_data, "beneficiary_name": user.get("name", "")}
            ))

    return {"status": "sent", "message": "Rapport hebdomadaire envoye", "recipients": 1 + len(guardian_ids)}


# ═══════════════════════════════════════════
#  2. ENHANCED MORNING BRIEFING
# ═══════════════════════════════════════════

@router.get("/nora/morning-briefing")
async def get_morning_briefing(user=Depends(get_current_user)):
    """Generate enriched morning briefing with real data, program info, and Nora advice"""
    uid = user['id']
    nora_ctx = await build_nora_context(user)
    hd = nora_ctx["health_data"]

    # Active program
    enrollment = await db.program_enrollments.find_one({"user_id": uid, "status": "active"}, {"_id": 0})
    program_info = None
    if enrollment:
        prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0, "daily_tasks_template": 0})
        if prog:
            day_key = str(enrollment.get("current_day", 1))
            full_prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0})
            today_focus = full_prog.get("daily_tasks_template", {}).get(day_key, {}).get("focus", "") if full_prog else ""
            program_info = {"title": prog["title"], "day": enrollment.get("current_day", 1), "total": prog["duration_days"], "today_focus": today_focus, "color": prog.get("color", "#A78BFA"), "icon": prog.get("icon", "")}

    # Streak
    streak_doc = await db.user_streaks.find_one({"user_id": uid}, {"_id": 0})
    streak = streak_doc.get("current_streak", 0) if streak_doc else 0

    # Predictive alerts
    pred_alerts = await db.predictive_alerts.find({"user_id": uid, "status": "active", "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()}}, {"_id": 0}).to_list(5)

    # Build briefing data
    briefing = {
        "user_name": user.get("name", "").split(" ")[0],
        "has_data": nora_ctx["has_any_data"],
        "health": {},
        "program": program_info,
        "streak": streak,
        "predictive_alerts": pred_alerts,
        "objectives": [],
        "nora_message": "",
    }

    if hd.get("has_bracelet_data"):
        bd = hd["bracelet"]
        briefing["health"] = {
            "heart_rate": bd.get("heart_rate", 0),
            "spo2": bd.get("spo2", 0),
            "sleep_quality": bd.get("sleep_quality", 0),
            "sleep_duration_min": bd.get("sleep_duration_min", 0),
            "steps": bd.get("steps", 0),
            "stress_level": bd.get("stress_level", 0),
            "recovery_score": bd.get("recovery_score", 0),
            "temperature": bd.get("temperature", 0),
        }

    # Generate Nora message via AI
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json
            ctx_str = format_nora_context_for_prompt(nora_ctx)
            prog_str = f"Programme actif: {program_info['title']} jour {program_info['day']}/{program_info['total']} — focus: {program_info['today_focus']}" if program_info else "Aucun programme actif"
            alerts_str = f"Alertes predictives: {'; '.join(a.get('message','') for a in pred_alerts)}" if pred_alerts else ""

            prompt = f"""Nora, assistante sante. Genere le briefing du matin en JSON.

PATIENT: {ctx_str}
{prog_str}
{alerts_str}
Streak: {streak} jours

CONSIGNES: Vouvoyez. 2-3 phrases max pour le message. Objectifs concrets et mesurables. Pas d'emoji.
JSON: {{"message": "briefing personnalise 2-3 phrases", "objectives": [{{"icon": "ri-xxx", "color": "#hex", "label": "nom", "value": "valeur", "detail": "1 phrase"}}]}}"""

            chat = LlmChat(api_key=api_key, session_id=f"mb-{uuid.uuid4().hex[:6]}", system_message="Nora. JSON. Pas d'emoji. Vouvoyez.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            parsed = json.loads(r.strip())
            briefing["nora_message"] = parsed.get("message", "")
            briefing["objectives"] = parsed.get("objectives", [])
        except Exception as e:
            print(f"Morning briefing AI err: {e}")

    if not briefing["nora_message"]:
        briefing["nora_message"] = f"Bonjour {briefing['user_name']}, bienvenue dans votre journee."

    return briefing


# ═══════════════════════════════════════════
#  3. STREAK SYSTEM
# ═══════════════════════════════════════════

@router.post("/nora/checkin-daily")
async def daily_checkin(user=Depends(get_current_user)):
    """Record daily activity and update streak. Called when user opens the app."""
    uid = user['id']
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    streak_doc = await db.user_streaks.find_one({"user_id": uid}, {"_id": 0})
    if not streak_doc:
        streak_doc = {"user_id": uid, "current_streak": 0, "max_streak": 0, "last_checkin": "", "total_days": 0, "badges": []}
        await db.user_streaks.insert_one(streak_doc)

    if streak_doc.get("last_checkin") == today:
        return {"status": "already_checked", "streak": streak_doc["current_streak"], "max_streak": streak_doc["max_streak"], "badges": streak_doc.get("badges", [])}

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    if streak_doc.get("last_checkin") == yesterday:
        new_streak = streak_doc["current_streak"] + 1
    else:
        new_streak = 1

    max_streak = max(new_streak, streak_doc.get("max_streak", 0))
    total_days = streak_doc.get("total_days", 0) + 1

    # Check for new badges
    badges = streak_doc.get("badges", [])
    streak_badges = [
        {"id": "streak-7", "threshold": 7, "title": "1 semaine", "icon": "ri-fire-fill", "color": "#F59E0B"},
        {"id": "streak-14", "threshold": 14, "title": "2 semaines", "icon": "ri-fire-fill", "color": "#EF4444"},
        {"id": "streak-30", "threshold": 30, "title": "1 mois", "icon": "ri-medal-fill", "color": "#A78BFA"},
        {"id": "streak-60", "threshold": 60, "title": "2 mois", "icon": "ri-trophy-fill", "color": "#22D3EE"},
        {"id": "streak-100", "threshold": 100, "title": "100 jours", "icon": "ri-vip-diamond-fill", "color": "#10B981"},
    ]
    new_badges = []
    for sb in streak_badges:
        if new_streak >= sb["threshold"] and sb["id"] not in [b.get("id") for b in badges]:
            badge = {**sb, "unlocked_at": today}
            badges.append(badge)
            new_badges.append(badge)

    await db.user_streaks.update_one(
        {"user_id": uid},
        {"$set": {"current_streak": new_streak, "max_streak": max_streak, "last_checkin": today, "total_days": total_days, "badges": badges}},
        upsert=True
    )

    return {"status": "checked_in", "streak": new_streak, "max_streak": max_streak, "total_days": total_days, "new_badges": new_badges, "badges": badges}


@router.get("/nora/streak")
async def get_streak(user=Depends(get_current_user)):
    """Get current streak and badges"""
    streak_doc = await db.user_streaks.find_one({"user_id": user['id']}, {"_id": 0})
    if not streak_doc:
        return {"current_streak": 0, "max_streak": 0, "total_days": 0, "badges": []}
    return {
        "current_streak": streak_doc.get("current_streak", 0),
        "max_streak": streak_doc.get("max_streak", 0),
        "total_days": streak_doc.get("total_days", 0),
        "badges": streak_doc.get("badges", []),
        "last_checkin": streak_doc.get("last_checkin", ""),
    }


# ═══════════════════════════════════════════
#  4. PREDICTIVE ALERTS
# ═══════════════════════════════════════════

@router.get("/nora/predictive-check")
async def predictive_health_check(user=Depends(get_current_user)):
    """Analyze 7-day trends and generate predictive alerts BEFORE problems occur"""
    uid = user['id']
    now = datetime.now(timezone.utc)
    seven_ago = (now - timedelta(days=7)).isoformat()

    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_ago}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(100)

    if len(readings) < 3:
        return {"alerts": [], "message": "Pas assez de donnees pour une analyse predictive (minimum 3 jours)."}

    # Analyze trends
    alerts = []

    def get_trend(key):
        vals = [r.get("data", {}).get(key, 0) for r in readings if r.get("data", {}).get(key)]
        if len(vals) < 3:
            return None, 0, 0
        recent = vals[-3:]
        older = vals[:-3] if len(vals) > 3 else vals[:1]
        avg_recent = sum(recent) / len(recent)
        avg_older = sum(older) / len(older) if older else avg_recent
        trend = avg_recent - avg_older
        return round(trend, 1), round(avg_recent, 1), round(avg_older, 1)

    # FC repos increasing → stress or health issue
    hr_trend, hr_recent, hr_older = get_trend("heart_rate")
    if hr_trend and hr_trend > 5:
        alerts.append({
            "id": str(uuid.uuid4()), "type": "heart_rate_rising",
            "severity": "warning", "icon": "ri-heart-pulse-line", "color": "#EF4444",
            "title": "Frequence cardiaque en hausse",
            "message": f"Votre FC repos a augmente de {hr_older} a {hr_recent} bpm ces derniers jours. Cela peut indiquer un stress accru, un debut d'infection ou un manque de recuperation.",
            "recommendation": "Privilegiez le repos et la coherence cardiaque. Si la tendance persiste plus de 3 jours, consultez votre medecin.",
        })

    # HRV decreasing → reduced recovery
    hrv_trend, hrv_recent, hrv_older = get_trend("hrv")
    if hrv_trend and hrv_trend < -5:
        alerts.append({
            "id": str(uuid.uuid4()), "type": "hrv_declining",
            "severity": "warning", "icon": "ri-pulse-line", "color": "#F59E0B",
            "title": "Variabilite cardiaque en baisse",
            "message": f"Votre HRV a baisse de {hrv_older} a {hrv_recent} ms. Cela indique une baisse de la capacite de recuperation.",
            "recommendation": "Reduisez l'intensite de vos activites, dormez plus et pratiquez la coherence cardiaque.",
        })

    # Sleep quality declining
    sleep_trend, sleep_recent, sleep_older = get_trend("sleep_quality")
    if sleep_trend and sleep_trend < -8:
        alerts.append({
            "id": str(uuid.uuid4()), "type": "sleep_declining",
            "severity": "warning", "icon": "ri-moon-line", "color": "#A78BFA",
            "title": "Qualite de sommeil en degradation",
            "message": f"Votre qualite de sommeil est passee de {sleep_older}% a {sleep_recent}% cette semaine.",
            "recommendation": "Revoyez votre hygiene du sommeil : ecrans, temperature de la chambre, heure de coucher. Le programme '21 jours pour mieux dormir' peut vous aider.",
        })

    # Stress level increasing
    stress_trend, stress_recent, stress_older = get_trend("stress_level")
    if stress_trend and stress_trend > 10:
        alerts.append({
            "id": str(uuid.uuid4()), "type": "stress_rising",
            "severity": "info", "icon": "ri-mental-health-line", "color": "#8B5CF6",
            "title": "Niveau de stress en augmentation",
            "message": f"Votre stress est passe de {stress_older} a {stress_recent}/100. Un stress chronique impacte le sommeil et le systeme immunitaire.",
            "recommendation": "5 minutes de coherence cardiaque 3 fois par jour. Le programme 'Apaiser l'esprit' peut vous aider.",
        })

    # Steps declining significantly
    steps_trend, steps_recent, steps_older = get_trend("steps")
    if steps_trend and steps_trend < -1500 and steps_older > 0:
        alerts.append({
            "id": str(uuid.uuid4()), "type": "activity_declining",
            "severity": "info", "icon": "ri-footprint-line", "color": "#10B981",
            "title": "Activite physique en baisse",
            "message": f"Vos pas quotidiens sont passes de {int(steps_older)} a {int(steps_recent)}. Une baisse d'activite augmente les risques cardiovasculaires.",
            "recommendation": "Essayez de maintenir au moins 4000 pas par jour. Une marche de 20 minutes suffit.",
        })

    # Save active alerts
    for a in alerts:
        a["user_id"] = uid
        a["status"] = "active"
        a["created_at"] = now.isoformat()
        existing = await db.predictive_alerts.find_one({"user_id": uid, "type": a["type"], "status": "active"})
        if not existing:
            await db.predictive_alerts.insert_one(a)

    return {"alerts": [{k: v for k, v in a.items() if k != "user_id"} for a in alerts], "analyzed_readings": len(readings)}


@router.post("/nora/predictive-alerts/{alert_id}/dismiss")
async def dismiss_predictive_alert(alert_id: str, user=Depends(get_current_user)):
    """Dismiss a predictive alert"""
    await db.predictive_alerts.update_one(
        {"id": alert_id, "user_id": user['id']},
        {"$set": {"status": "dismissed", "dismissed_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "dismissed"}


# ═══════════════════════════════════════════
#  5. INTERVENANT A DOMICILE MODE
# ═══════════════════════════════════════════

@router.get("/intervenant/visit/{beneficiary_id}")
async def get_visit_data(beneficiary_id: str, user=Depends(get_current_user)):
    """Get beneficiary health data for an intervenant's home visit"""
    # Check if user is an intervention provider or guardian
    role = user.get("active_role") or user.get("role", "")
    is_provider = user.get("is_intervention_provider", False)
    is_guardian = role == "guardian"
    is_company = role in ("prescriber_company", "company")

    if not is_provider and not is_guardian and not is_company:
        raise HTTPException(status_code=403, detail="Acces reserve aux intervenants, gardiens et structures")

    ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")

    # Get latest health data
    bracelet = await db.device_readings.find_one({"user_id": beneficiary_id, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale = await db.device_readings.find_one({"user_id": beneficiary_id, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])

    # Recent alerts
    recent_alerts = await db.alerts.find({"user_id": beneficiary_id}, {"_id": 0}).sort("created_at", -1).to_list(5)

    # Active program
    enrollment = await db.program_enrollments.find_one({"user_id": beneficiary_id, "status": "active"}, {"_id": 0})
    program = None
    if enrollment:
        prog = await db.programs.find_one({"id": enrollment["program_id"]}, {"_id": 0, "daily_tasks_template": 0})
        if prog:
            program = {"title": prog["title"], "day": enrollment.get("current_day", 1), "total": prog["duration_days"]}

    # Previous visit observations
    observations = await db.visit_observations.find({"beneficiary_id": beneficiary_id}, {"_id": 0}).sort("created_at", -1).to_list(10)

    # Medications/reminders
    reminders = await db.reminders.find({"user_id": beneficiary_id, "reminder_type": "medication"}, {"_id": 0}).to_list(20)

    return {
        "beneficiary": {
            "id": ben["id"], "name": ben.get("name", ""),
            "age": None,
            "date_of_birth": ben.get("date_of_birth", ""),
            "medical_conditions": ben.get("medical_conditions", ""),
            "allergies": ben.get("allergies", ""),
            "doctor_name": ben.get("doctor_name", ""),
            "address": ben.get("address", ""),
        },
        "vitals": {
            "bracelet": bracelet.get("data", {}) if bracelet else {},
            "bracelet_timestamp": bracelet.get("timestamp", "") if bracelet else "",
            "scale": scale.get("data", {}) if scale else {},
            "scale_timestamp": scale.get("timestamp", "") if scale else "",
        },
        "recent_alerts": recent_alerts[:5],
        "active_program": program,
        "medications": reminders,
        "previous_observations": observations[:5],
    }


@router.post("/intervenant/visit/{beneficiary_id}/observation")
async def add_visit_observation(beneficiary_id: str, data: dict, user=Depends(get_current_user)):
    """Add an observation during a home visit"""
    role = user.get("active_role") or user.get("role", "")
    is_provider = user.get("is_intervention_provider", False)
    is_guardian = role == "guardian"
    is_company = role in ("prescriber_company", "company")

    if not is_provider and not is_guardian and not is_company:
        raise HTTPException(status_code=403, detail="Acces reserve aux intervenants")

    observation = {
        "id": str(uuid.uuid4()),
        "beneficiary_id": beneficiary_id,
        "observer_id": user['id'],
        "observer_name": user.get("name", ""),
        "observer_role": role,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "general_state": data.get("general_state", ""),  # bon, moyen, preoccupant
        "mobility": data.get("mobility", ""),
        "mood": data.get("mood", ""),
        "appetite": data.get("appetite", ""),
        "pain_level": data.get("pain_level", 0),
        "notes": data.get("notes", ""),
        "vitals_manual": data.get("vitals_manual", {}),  # manual BP, temp, etc.
        "medication_taken": data.get("medication_taken", True),
        "alert_doctor": data.get("alert_doctor", False),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.visit_observations.insert_one(observation)
    observation.pop("_id", None)

    # If alert_doctor is true, create a notification
    if data.get("alert_doctor"):
        ben = await db.users.find_one({"id": beneficiary_id}, {"_id": 0})
        doctor_name = ben.get("doctor_name", "le medecin traitant") if ben else "le medecin traitant"
        await db.alerts.insert_one({
            "id": str(uuid.uuid4()), "user_id": beneficiary_id,
            "alert_type": "intervenant_observation", "status": "active",
            "message": f"Observation de visite: etat {data.get('general_state', 'preoccupant')} — l'intervenant {user.get('name','')} recommande de contacter {doctor_name}.",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"status": "saved", "observation": observation}


@router.get("/intervenant/visit-history/{beneficiary_id}")
async def get_visit_history(beneficiary_id: str, user=Depends(get_current_user)):
    """Get visit observation history for a beneficiary"""
    observations = await db.visit_observations.find(
        {"beneficiary_id": beneficiary_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return observations
