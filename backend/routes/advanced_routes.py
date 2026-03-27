"""
Chutex Care — Advanced features routes
Weekly reports, predictive alerts, streaks, enhanced morning briefing, intervenant mode, Nora TTS
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from datetime import datetime, timezone, timedelta
import os, uuid

from database import db
from auth import get_current_user
from services.nora_context import build_nora_context, format_nora_context_for_prompt, APP_SERVICES_KNOWLEDGE

router = APIRouter()


# ═══════════════════════════════════════════
#  0. WEEKLY REPORT IN-APP (GET)
# ═══════════════════════════════════════════

@router.get("/nora/weekly-report")
async def get_weekly_report_data(user=Depends(get_current_user)):
    """Return weekly Nora report data for in-app display."""
    uid = user['id']
    now = datetime.now(timezone.utc)
    seven_ago = (now - timedelta(days=7)).isoformat()

    # Minceur tracking this week
    tracking_docs = await db.minceur_tracking.find(
        {"user_id": uid, "date": {"$gte": (now - timedelta(days=7)).strftime("%Y-%m-%d")}},
        {"_id": 0}
    ).to_list(7)
    meals_done = sum(1 for d in tracking_docs for k, v in d.get("completed", {}).items() if k.startswith("meal") and v)
    exercises_done = sum(1 for d in tracking_docs for k, v in d.get("completed", {}).items() if k.startswith("exercise") and v)
    days_active = len(tracking_docs)

    # Weight trend this week
    weighings = await db.weighings.find(
        {"user_id": uid}, {"_id": 0}
    ).sort("timestamp", -1).to_list(14)
    weight_change = 0
    if len(weighings) >= 2:
        weight_change = round(weighings[0].get("weight", 0) - weighings[-1].get("weight", 0), 1)

    current_weight = weighings[0].get("weight", 0) if weighings else 0
    goal = await db.users.find_one({"id": uid}, {"_id": 0, "minceur_goal": 1})
    goal_data = goal.get("minceur_goal") if goal else None

    # Generate Nora weekly message
    nora_message = ""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            context = f"Patient: {user.get('name','')}, {user.get('gender','')}, poids: {current_weight}kg."
            if goal_data:
                context += f" Objectif: {goal_data.get('target_kg')}kg en {goal_data.get('weeks')} semaines."
            context += f" Cette semaine: {meals_done} repas valides, {exercises_done} exercices valides sur {days_active} jours actifs."
            if weight_change != 0:
                context += f" Evolution poids: {'+' if weight_change > 0 else ''}{weight_change}kg."
            prompt = f"{context}\nGenere un bilan hebdomadaire encourageant en 3-4 phrases. Ton bienveillant et motivant. Vouvoyez. Pas d'emoji. Donnez un conseil concret pour la semaine prochaine."
            chat = LlmChat(api_key=api_key, session_id=f"wr-{uuid.uuid4().hex[:6]}", system_message="Coach sante bienveillant. 3-4 phrases. Vouvoyez.").with_model("openai", "gpt-5.2")
            nora_message = (await chat.send_message(UserMessage(text=prompt))).strip()
        except Exception as e:
            nora_message = "Continuez vos efforts cette semaine. Chaque repas valide et chaque exercice compte pour votre sante."

    return {
        "week_summary": {
            "meals_validated": meals_done,
            "exercises_validated": exercises_done,
            "days_active": days_active,
            "weight_change": weight_change,
            "current_weight": current_weight,
        },
        "goal": goal_data,
        "nora_message": nora_message,
        "generated_at": now.isoformat(),
    }


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
    """Generate enriched morning briefing with real data, program info, and Nora advice.
    Uses the SAME daily_plan as the health page for coherent objectives."""
    uid = user['id']
    nora_ctx = await build_nora_context(user)
    hd = nora_ctx["health_data"]

    # Get the daily_plan from health_report (same as health page)
    from routes.health_report_routes import compute_daily_plan_async, compute_subscores, _sanitize_data, _has_meaningful_data, gen_data, evaluate_objectives_met
    d = gen_data()
    br_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    sc_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    if br_reading and br_reading.get("data"):
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv", "stress_level", "recovery_score", "sleep_quality", "sleep_duration_min"]:
            if br_reading["data"].get(k): d[k] = br_reading["data"][k]
        if br_reading["data"].get("blood_pressure"): d["blood_pressure"] = br_reading["data"]["blood_pressure"]
    if sc_reading and sc_reading.get("data"):
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg", "basal_metabolism"]:
            if sc_reading["data"].get(k): d[k] = sc_reading["data"][k]
    d = _sanitize_data(d)
    si = compute_subscores(d)
    daily_plan = await compute_daily_plan_async(d, si, uid)

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

    # Data freshness — check when data was last measured
    data_freshness = {}
    if br_reading and br_reading.get("timestamp"):
        try:
            br_dt = datetime.fromisoformat(str(br_reading["timestamp"]).replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - br_dt).days
            data_freshness["bracelet"] = days_ago
        except:
            data_freshness["bracelet"] = -1
    if sc_reading and sc_reading.get("timestamp"):
        try:
            sc_dt = datetime.fromisoformat(str(sc_reading["timestamp"]).replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - sc_dt).days
            data_freshness["scale"] = days_ago
        except:
            data_freshness["scale"] = -1

    # Streak
    streak_doc = await db.user_streaks.find_one({"user_id": uid}, {"_id": 0})
    streak = streak_doc.get("current_streak", 0) if streak_doc else 0

    # Build briefing — objectives come from daily_plan (same as health page)
    briefing_objectives = []
    for p in daily_plan:
        if p.get("key") != "connect" and p.get("key") != "measure":
            briefing_objectives.append({
                "icon": p.get("icon", "ri-pulse-line"),
                "color": p.get("color", "#A78BFA"),
                "label": p.get("label", ""),
                "value": p.get("value", ""),
                "detail": p.get("detail", ""),
            })

    briefing = {
        "user_name": user.get("name", "").split(" ")[0],
        "has_data": nora_ctx["has_any_data"],
        "health": {},
        "program": program_info,
        "streak": streak,
        "objectives": briefing_objectives,
        "nora_message": "",
        "data_freshness": data_freshness,
    }

    if hd.get("has_bracelet_data"):
        bd = hd["bracelet"]
        briefing["health"] = {
            "heart_rate": bd.get("heart_rate", 0),
            "spo2": bd.get("spo2", 0),
            "sleep_quality": bd.get("sleep_quality", 0),
            "steps": bd.get("steps", 0),
            "stress_level": bd.get("stress_level", 0),
            "recovery_score": bd.get("recovery_score", 0),
        }

    # Generate Nora message — short and pertinent
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json
            ctx_str = format_nora_context_for_prompt(nora_ctx)
            prog_str = f"Programme: {program_info['title']} J{program_info['day']}/{program_info['total']}" if program_info else ""

            # Build freshness context for GPT
            fresh_str = ""
            if data_freshness.get("scale", -1) >= 0:
                if data_freshness["scale"] == 0: fresh_str += "Balance pesee aujourd'hui. "
                elif data_freshness["scale"] <= 2: fresh_str += f"Balance pesee il y a {data_freshness['scale']} jours. "
                else: fresh_str += f"ATTENTION: Derniere pesee il y a {data_freshness['scale']} jours (anciennes donnees). "
            else:
                fresh_str += "Aucune pesee recente. "
            if data_freshness.get("bracelet", -1) >= 0:
                if data_freshness["bracelet"] > 2: fresh_str += f"Bracelet pas de donnees depuis {data_freshness['bracelet']} jours. "

            prompt = f"""Briefing matin. 2 phrases COURTES MAX. Factuel, pas d'emoji, vouvoiement.
FRAICHEUR DONNEES: {fresh_str}
DONNEES: Poids {d.get('weight',0)}kg, IMC {d.get('bmi',0)}, eau {d.get('water_pct',0)}%{', FC ' + str(d.get('heart_rate',0)) + 'bpm' if d.get('heart_rate',0) > 0 else ''}
{prog_str}
REGLES: Si les donnees sont anciennes (>2 jours), ne dis PAS le poids comme si c'etait actuel. Dis plutot que tu n'as pas de mesure recente et invite a se peser. Si donnees fraiches, fais un constat.
JSON: {{"message": "2 phrases: 1 constat ou invitation a se mesurer + 1 conseil du jour"}}`"""

            chat = LlmChat(api_key=api_key, session_id=f"mb-{uuid.uuid4().hex[:6]}", system_message="Nora. JSON. Court. Pas d'emoji.").with_model("openai", "gpt-5.2")
            r = (await chat.send_message(UserMessage(text=prompt))).strip()
            if r.startswith("```"): r = r.split("\n", 1)[1] if "\n" in r else r[3:]
            if r.endswith("```"): r = r[:-3]
            parsed = json.loads(r.strip())
            briefing["nora_message"] = parsed.get("message", "")
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

    # Return only dismissed=false alerts, exclude _id and user_id
    active = await db.predictive_alerts.find(
        {"user_id": uid, "status": "active"}, {"_id": 0, "user_id": 0}
    ).to_list(20)
    return {"alerts": active, "analyzed_readings": len(readings)}


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


# ═══════════════════════════════════════════
#  6. NORA VOCALE (TTS)
# ═══════════════════════════════════════════

@router.post("/nora/speak")
async def nora_text_to_speech(data: dict, user=Depends(get_current_user)):
    """Convert Nora's text to speech audio using OpenAI TTS. Returns MP3 audio."""
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Texte requis")

    if len(text) > 4096:
        text = text[:4096]

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Service TTS non configure")

    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=text,
            model="tts-1",
            voice="nova",  # Warm, clear female voice — fits Nora
            speed=0.95,  # Slightly slower for elderly users
            response_format="mp3",
        )
        return Response(content=audio_bytes, media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=nora.mp3"})
    except Exception as e:
        print(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la generation audio")


@router.post("/nora/speak-briefing")
async def nora_speak_briefing(user=Depends(get_current_user)):
    """Generate morning briefing text then convert to speech"""
    # Get briefing text
    briefing = await get_morning_briefing(user=user)
    text = briefing.get("nora_message", "")
    if briefing.get("objectives"):
        text += " Vos objectifs pour aujourd'hui : "
        for obj in briefing["objectives"][:4]:
            text += f"{obj.get('label', '')} : {obj.get('value', '')}. "

    if not text.strip():
        text = "Bonjour, bienvenue dans votre journee."

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Service TTS non configure")

    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=text, model="tts-1", voice="nova", speed=0.95, response_format="mp3",
        )
        return Response(content=audio_bytes, media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=nora-briefing.mp3"})
    except Exception as e:
        print(f"TTS briefing error: {e}")
        raise HTTPException(status_code=500, detail="Erreur generation audio")




# ═══════════════════════════════════════════
#  NORA HEALTH ANALYSIS — Lazy loaded (on-demand)
# ═══════════════════════════════════════════

@router.get("/nora/health-analysis")
async def get_nora_health_analysis(user=Depends(get_current_user)):
    """On-demand Nora health analysis for dashboard — only called when user clicks button."""
    uid = user['id']
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check cache
    cached = await db.nora_health_analysis_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )
    if cached and cached.get("analysis"):
        return {"analysis": cached["analysis"], "cached": True}

    # Gather health data
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        return {"analysis": "", "cached": False}

    latest_bracelet = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    latest_scale = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    goal = await db.minceur_goals.find_one({"user_id": uid}, {"_id": 0})

    br = latest_bracelet.get("data", {}) if latest_bracelet else {}
    sc = latest_scale.get("data", {}) if latest_scale else {}
    weight = sc.get("weight") or u.get("weight_kg", 0)
    height = u.get("height_cm", 170)
    age_str = u.get("date_of_birth", "")
    age = 0
    if age_str:
        try:
            from dateutil.parser import parse as dparse
            age = (datetime.now(timezone.utc) - dparse(age_str).replace(tzinfo=timezone.utc)).days // 365
        except Exception:
            pass

    prompt = f"""Tu es Nora, assistante sante bienveillante. Fais une analyse de sante globale pour ce patient.

PROFIL: {u.get('name','')}, {age} ans, {u.get('gender','')}, {height}cm, {weight}kg
CONDITIONS: {u.get('medical_conditions','Aucune')}
ALLERGIES: {u.get('allergies','Aucune')}

DONNEES VITALES:
- Pouls: {br.get('heart_rate', '--')} bpm
- SpO2: {br.get('spo2', '--')}%
- Tension: {br.get('blood_pressure_systolic','--')}/{br.get('blood_pressure_diastolic','--')} mmHg
- Temperature: {br.get('temperature', '--')}°C
- Poids: {weight}kg | IMC: {round(weight/((height/100)**2),1) if weight and height else '--'}
- Masse grasse: {sc.get('body_fat_pct','--')}% | Masse musculaire: {sc.get('muscle_pct','--')}%
{f"OBJECTIF POIDS: {goal['target_kg']}kg en {goal.get('weeks',0)} semaines" if goal else ""}

Redige une analyse en 4-5 phrases courtes et bienveillantes. Commente l'etat cardiaque, le poids, les constantes, et donne un conseil. Pas d'emoji. Francais."""

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return {"analysis": "", "cached": False}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm = LlmChat(
            api_key=api_key,
            session_id=f"nora-health-{uid[:8]}-{today_str}",
            system_message="Tu es Nora, assistante sante. Reponds en texte brut uniquement. Pas d'emoji. Francais."
        ).with_model("openai", "gpt-5.2")

        resp = await llm.send_message(UserMessage(text=prompt))
        analysis = resp.strip()
        # Cache
        await db.nora_health_analysis_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {"user_id": uid, "date": today_str, "analysis": analysis, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"analysis": analysis, "cached": False}
    except Exception as e:
        print(f"Nora health analysis error: {e}")
        return {"analysis": "", "cached": False}


@router.get("/nora/aging-analysis")
async def get_nora_aging_analysis(user=Depends(get_current_user)):
    """On-demand Nora aging/biological age analysis."""
    uid = user['id']
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    cached = await db.nora_aging_analysis_cache.find_one(
        {"user_id": uid, "date": today_str}, {"_id": 0}
    )
    if cached and cached.get("analysis"):
        return {"analysis": cached["analysis"], "cached": True}

    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        return {"analysis": "", "cached": False}

    latest_bracelet = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    latest_scale = await db.device_readings.find_one(
        {"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    aging = await db.aging_rate.find_one({"user_id": uid}, {"_id": 0})

    br = latest_bracelet.get("data", {}) if latest_bracelet else {}
    sc = latest_scale.get("data", {}) if latest_scale else {}
    weight = sc.get("weight") or u.get("weight_kg", 0)
    height = u.get("height_cm", 170)
    age = 0
    if u.get("date_of_birth"):
        try:
            from dateutil.parser import parse as dparse
            age = (datetime.now(timezone.utc) - dparse(u["date_of_birth"]).replace(tzinfo=timezone.utc)).days // 365
        except Exception:
            pass

    bio_age = aging.get("bio_age", 0) if aging else 0
    rate = aging.get("rate", 0) if aging else 0

    prompt = f"""Tu es Nora, assistante sante specialisee en longevite. Analyse l'age biologique et le rythme de vieillissement de ce patient.

PROFIL: {u.get('name','')}, {age} ans, {u.get('gender','')}, {height}cm, {weight}kg
CONDITIONS: {u.get('medical_conditions','Aucune')}

DONNEES:
- Age reel: {age} ans
- Age biologique estime: {bio_age if bio_age else 'Non disponible'} ans
- Rythme de vieillissement: {f'{rate}x' if rate else 'Non disponible'}
- Pouls: {br.get('heart_rate', '--')} bpm | SpO2: {br.get('spo2', '--')}%
- Tension: {br.get('blood_pressure_systolic','--')}/{br.get('blood_pressure_diastolic','--')} mmHg
- Masse grasse: {sc.get('body_fat_pct','--')}% | Masse musculaire: {sc.get('muscle_pct','--')}%
- IMC: {round(weight/((height/100)**2),1) if weight and height else '--'}

Redige une analyse en 4-5 phrases courtes. Commente l'ecart entre age reel et biologique, le rythme de vieillissement, les facteurs protecteurs et les risques. Donne un conseil concret pour ralentir le vieillissement. Pas d'emoji. Francais."""

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return {"analysis": "", "cached": False}

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm = LlmChat(
            api_key=api_key,
            session_id=f"nora-aging-{uid[:8]}-{today_str}",
            system_message="Tu es Nora, specialiste longevite. Reponds en texte brut. Pas d'emoji. Francais."
        ).with_model("openai", "gpt-5.2")

        resp = await llm.send_message(UserMessage(text=prompt))
        analysis = resp.strip()
        await db.nora_aging_analysis_cache.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": {"user_id": uid, "date": today_str, "analysis": analysis, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"analysis": analysis, "cached": False}
    except Exception as e:
        print(f"Nora aging analysis error: {e}")
        return {"analysis": "", "cached": False}
