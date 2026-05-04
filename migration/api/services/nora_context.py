"""Nora AI Context Builder — version SQLAlchemy/Postgres.

Aggrège tout le contexte santé d'un utilisateur en un dict structuré,
puis le formate en prompt prêt pour l'LLM.

Port fidèle de /app/backend/services/nora_context.py.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alerts import Alert
from app.models.devices import Device
from app.models.health import (
    BodyAgeCache,
    DeviceReading,
    HealthVital,
    LatestVitals,
    Threshold,
)
from app.models.misc import (
    Recommendation,
)
from app.models.notifications import Reminder
from app.models.programs import (
    MinceurGoal,
    ProgramEnrollment,
)
from app.models.shop import Subscription


def _compute_age(dob: str | None) -> int | None:
    if not dob:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            born = datetime.strptime(dob, fmt)
            return (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
        except ValueError:
            continue
    return None


async def build_nora_context(user: dict, session: AsyncSession) -> dict:
    """Construit le contexte complet pour l'IA Nora."""
    uid = user["id"]

    age = _compute_age(user.get("date_of_birth", ""))

    ctx: dict = {
        "user_profile": {
            "name": user.get("name", "Inconnu"),
            "gender": user.get("gender", ""),
            "age": age,
            "date_of_birth": user.get("date_of_birth", ""),
            "height_cm": user.get("height_cm"),
            "weight_kg": user.get("weight_kg"),
            "blood_type": user.get("blood_type", ""),
            "medical_conditions": user.get("medical_conditions", ""),
            "allergies": user.get("allergies", ""),
            "doctor_name": user.get("doctor_name", ""),
        },
        "age": age,
        "subscription": None,
        "devices": [],
        "has_bracelet": False,
        "has_scale": False,
        "has_vest": False,
        "has_any_data": False,
        "health_data": {},
        "latest_vitals": {},
        "active_program": None,
        "active_alerts": [],
        "weight_goal": None,
        "reminders": [],
        "recommendations": [],
        "thresholds": {},
    }

    # Subscription
    sub_res = await session.execute(
        select(Subscription).where(
            Subscription.beneficiary_id == uid, Subscription.status == "active"
        )
    )
    sub = sub_res.scalar_one_or_none()
    if sub:
        ctx["subscription"] = {
            "type": sub.subscription_type,
            "status": sub.status,
            "started_at": sub.started_at.isoformat() if sub.started_at else None,
        }

    # Devices
    dres = await session.execute(select(Device).where(Device.user_id == uid))
    devices = list(dres.scalars().all())
    ctx["devices"] = [{"type": d.type, "name": d.name, "connected": d.connected} for d in devices]
    ctx["has_bracelet"] = any(d.type == "bracelet" for d in devices)
    ctx["has_scale"] = any(d.type == "scale" for d in devices)
    ctx["has_vest"] = any(d.type == "vest" for d in devices)

    # Latest readings (bracelet + scale)
    bres = await session.execute(
        select(DeviceReading).where(
            DeviceReading.user_id == uid, DeviceReading.device_type == "bracelet"
        ).order_by(DeviceReading.timestamp.desc()).limit(1)
    )
    bracelet_r = bres.scalar_one_or_none()
    sres = await session.execute(
        select(DeviceReading).where(
            DeviceReading.user_id == uid, DeviceReading.device_type == "scale"
        ).order_by(DeviceReading.timestamp.desc()).limit(1)
    )
    scale_r = sres.scalar_one_or_none()
    bracelet_data = (bracelet_r.raw_data or {}) if bracelet_r else {}
    scale_data = (scale_r.raw_data or {}) if scale_r else {}

    has_bd = bool(bracelet_data)
    has_sd = bool(scale_data)
    ctx["has_any_data"] = has_bd or has_sd

    # Body age (Nora-computed)
    bac_res = await session.execute(select(BodyAgeCache).where(BodyAgeCache.user_id == uid))
    bac = bac_res.scalar_one_or_none()
    nora_body_age = bac.body_age if bac else None
    if nora_body_age:
        scale_data["body_age"] = nora_body_age

    ctx["health_data"] = {
        "bracelet": bracelet_data,
        "scale": scale_data,
        "has_bracelet_data": has_bd,
        "has_scale_data": has_sd,
        "nora_body_age": nora_body_age,
    }

    # Latest vitals consolidated
    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == uid))
    lv = lvr.scalar_one_or_none()
    if lv:
        ctx["latest_vitals"] = {
            "heart_rate": lv.heart_rate, "spo2": lv.spo2,
            "blood_pressure_sys": lv.blood_pressure_sys,
            "blood_pressure_dia": lv.blood_pressure_dia,
            "temperature": lv.temperature, "steps": lv.steps,
            "calories": lv.calories, "hrv": lv.hrv,
            "sleep_hours": lv.sleep_hours, "sleep_quality": lv.sleep_quality,
            "weight_kg": lv.weight_kg,
            "last_updated": lv.last_updated.isoformat() if lv.last_updated else None,
        }

    # Active program
    pres = await session.execute(
        select(ProgramEnrollment).where(
            ProgramEnrollment.user_id == uid, ProgramEnrollment.status == "active"
        ).order_by(ProgramEnrollment.started_at.desc()).limit(1)
    )
    enroll = pres.scalar_one_or_none()
    if enroll:
        ctx["active_program"] = {
            "title": enroll.program_id,
            "current_day": enroll.current_day or 1,
            "streak": enroll.streak or 0,
            "duration_days": 21,  # default 21j prevention
        }

    # Active alerts
    ar = await session.execute(
        select(Alert).where(Alert.beneficiary_id == uid, Alert.status == "active")
        .order_by(Alert.created_at.desc()).limit(3)
    )
    ctx["active_alerts"] = [
        {"type": a.alert_type, "message": a.message, "created_at": a.created_at.isoformat() if a.created_at else None}
        for a in ar.scalars().all()
    ]

    # Weight goal
    wgr = await session.execute(select(MinceurGoal).where(MinceurGoal.user_id == uid))
    wg = wgr.scalar_one_or_none()
    if wg:
        ctx["weight_goal"] = {"target_kg": wg.target_kg, "weeks": wg.weeks}

    # Reminders
    rr = await session.execute(
        select(Reminder).where(Reminder.user_id == uid, Reminder.enabled == True).limit(10)  # noqa: E712
    )
    ctx["reminders"] = [
        {"type": r.type, "label": r.label, "time": r.time}
        for r in rr.scalars().all()
    ]

    # Recommendations (latest 5)
    rec_r = await session.execute(
        select(Recommendation).where(Recommendation.user_id == uid)
        .order_by(Recommendation.created_at.desc()).limit(5)
    )
    ctx["recommendations"] = [r.text for r in rec_r.scalars().all() if r.text]

    # Thresholds (custom)
    tr = await session.execute(select(Threshold).where(Threshold.user_id == uid))
    for t in tr.scalars().all():
        ctx["thresholds"][t.metric_id] = {"min": t.min_val, "max": t.max_val, "goal": t.goal}

    return ctx


def format_nora_context_for_prompt(ctx: dict) -> str:
    """Formate le contexte en string compact pour le prompt LLM."""
    parts = []

    p = ctx["user_profile"]
    profile = f"Patient: {p['name']}"
    if p.get("age"):
        profile += f", {p['age']} ans"
    if p.get("gender"):
        profile += f", {p['gender']}"
    parts.append(profile + ".")

    if p.get("height_cm"):
        parts.append(f"Taille: {p['height_cm']}cm.")
    if p.get("weight_kg"):
        parts.append(f"Poids: {p['weight_kg']}kg.")
    if p.get("medical_conditions"):
        parts.append(f"Pathologies: {p['medical_conditions']}.")
    if p.get("allergies"):
        parts.append(f"Allergies: {p['allergies']}.")

    sub = ctx["subscription"]
    if sub:
        st = sub.get("type", "standard")
        parts.append(f"Abonnement actif: {'Chutex Care (teleassistance 24/7)' if st == 'care' else 'Standard (Bracelet Elio)'}.")
    else:
        parts.append("Aucun abonnement actif.")

    dev_names = []
    if ctx["has_bracelet"]:
        dev_names.append("Bracelet Elio")
    if ctx["has_scale"]:
        dev_names.append("Balance Vita")
    if ctx["has_vest"]:
        dev_names.append("Gilet Elder")
    parts.append(
        f"Appareils connectes: {', '.join(dev_names)}." if dev_names
        else "Aucun appareil connecte."
    )

    hd = ctx["health_data"]
    if hd["has_bracelet_data"]:
        bd = hd["bracelet"]
        bp = []
        if bd.get("heart_rate"):
            bp.append(f"FC {bd['heart_rate']}bpm")
        if bd.get("spo2"):
            bp.append(f"SpO2 {bd['spo2']}%")
        if bd.get("temperature"):
            bp.append(f"Temp {bd['temperature']}C")
        if bd.get("steps"):
            bp.append(f"{bd['steps']} pas")
        if bd.get("hrv"):
            bp.append(f"HRV {bd['hrv']}ms")
        if bp:
            parts.append(f"Donnees bracelet: {', '.join(bp)}.")
    elif ctx["has_bracelet"]:
        parts.append("Bracelet associe mais AUCUNE donnee recue encore.")
    else:
        parts.append("PAS de bracelet — aucune donnee cardiaque/sommeil.")

    if hd["has_scale_data"]:
        sd = hd["scale"]
        sp = []
        if sd.get("weight"):
            sp.append(f"Poids {sd['weight']}kg")
        if sd.get("bmi"):
            sp.append(f"IMC {sd['bmi']}")
        if sd.get("body_fat_pct"):
            sp.append(f"Graisse {sd['body_fat_pct']}%")
        if sd.get("muscle_pct"):
            sp.append(f"Muscle {sd['muscle_pct']}%")
        if sd.get("body_age"):
            sp.append(f"Age corporel {sd['body_age']} ans")
        if sp:
            parts.append(f"Donnees balance: {', '.join(sp)}.")

    if ctx["active_program"]:
        ap = ctx["active_program"]
        parts.append(f"Programme actif: '{ap['title']}' — Jour {ap['current_day']}/{ap['duration_days']}, streak {ap['streak']}.")

    if ctx["active_alerts"]:
        parts.append(f"⚠️ {len(ctx['active_alerts'])} alerte(s) active(s) : " + "; ".join(
            f"{a['type']} ({a['message']})" for a in ctx["active_alerts"]
        ))

    wg = ctx.get("weight_goal")
    if wg and wg.get("target_kg"):
        parts.append(f"Objectif poids: {wg['target_kg']}kg en {wg.get('weeks', 12)} semaines.")

    if ctx["reminders"]:
        parts.append(f"Rappels actifs: {len(ctx['reminders'])} ({', '.join(r['type'] or 'general' for r in ctx['reminders'][:5])}).")

    if ctx["recommendations"]:
        parts.append("\nRECOMMANDATIONS DEJA EMISES (eviter de repeter) :")
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
