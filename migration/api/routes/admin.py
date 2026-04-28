"""Routes Admin / Backoffice : codes, KPI, users, alerts, prescriptions, revenue.

Toutes les routes exigent `role == 'admin'`.
"""
from __future__ import annotations

import os
import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import Alert, CarewatchIncident, Intervention, TeleassistanceCall
from app.models.auth import User
from app.models.devices import Device
from app.models.guardian import ActivationCode, InterventionCode, SaadInvitation
from app.models.health import DeviceReading, GlycemiaHistory, LatestVitals
from app.models.misc import RgpdRequest
from app.models.notifications import PushLog, Reminder
from app.models.pro import ProApplication
from app.models.programs import ProgramEnrollment
from app.models.shop import (
    Contract,
    PaymentHistory,
    PaymentTransaction,
    Prescription,
    Subscription,
)
from app.models.health import Threshold

router = APIRouter()


def _ensure_admin(user: dict) -> None:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin uniquement")


def _gen_code(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


# ============== ACTIVATION CODES ==========================================
@router.post("/admin/activation-codes")
async def create_activation_code(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    code = ActivationCode(
        id=str(uuid.uuid4()),
        code=_gen_code(),
        structure_name=data.get("structure_name"),
        max_uses=data.get("max_uses", 1),
        uses_count=0, active=True,
        raison_sociale=data.get("raison_sociale"),
        siret=data.get("siret"), tva=data.get("tva"),
        adresse=data.get("adresse"),
        telephone=data.get("telephone"),
        email_contact=data.get("email_contact"),
        created_at=utcnow(), created_by=user["id"],
    )
    session.add(code)
    await session.commit()
    return row_to_dict(code)


@router.get("/admin/activation-codes")
async def list_activation_codes(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(ActivationCode).order_by(ActivationCode.created_at.desc()).limit(100)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.put("/admin/activation-codes/{code_id}")
async def update_activation_code(
    code_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(ActivationCode).where(
            or_(ActivationCode.id == code_id, ActivationCode.code == code_id)
        )
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Code introuvable")
    for k, v in data.items():
        if v is not None and hasattr(c, k):
            setattr(c, k, v)
    await session.commit()
    return {"status": "updated"}


@router.put("/admin/activation-codes/{code_id}/toggle")
async def toggle_activation_code(
    code_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(ActivationCode).where(
            or_(ActivationCode.id == code_id, ActivationCode.code == code_id)
        )
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Code introuvable")
    c.active = not bool(c.active)
    await session.commit()
    return {"status": "toggled", "active": c.active}


@router.delete("/admin/activation-codes/{code_id}")
async def delete_activation_code(
    code_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    await session.execute(
        delete(ActivationCode).where(
            or_(ActivationCode.id == code_id, ActivationCode.code == code_id)
        )
    )
    await session.commit()
    return {"status": "deleted"}


# ============== INTERVENTION CODES ========================================
@router.post("/admin/intervention-codes")
async def create_intervention_code(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    code = InterventionCode(
        id=str(uuid.uuid4()),
        code=data.get("code") or _gen_code(),
        structure_name=data.get("structure_name"),
        max_uses=data.get("max_uses", 1),
        uses_count=0, active=True,
        default_radius_km=data.get("radius_km", 10),
        base_location={"latitude": 48.8566, "longitude": 2.3522},
        raison_sociale=data.get("raison_sociale"),
        siret=data.get("siret"), tva=data.get("tva"),
        adresse=data.get("adresse"),
        telephone=data.get("telephone"),
        email_contact=data.get("email_contact"),
        created_at=utcnow(), created_by=user["id"],
    )
    session.add(code)
    await session.commit()
    return row_to_dict(code)


@router.get("/admin/intervention-codes")
async def list_intervention_codes(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(InterventionCode).order_by(InterventionCode.created_at.desc()).limit(100)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.put("/admin/intervention-codes/{code_id}")
async def update_intervention_code(
    code_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(InterventionCode).where(
            or_(InterventionCode.id == code_id, InterventionCode.code == code_id)
        )
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Code introuvable")
    for k, v in data.items():
        if v is not None and hasattr(c, k):
            setattr(c, k, v)
    await session.commit()
    return {"status": "updated"}


@router.put("/admin/intervention-codes/{code_id}/toggle")
async def toggle_intervention_code(
    code_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(InterventionCode).where(
            or_(InterventionCode.id == code_id, InterventionCode.code == code_id)
        )
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Code introuvable")
    c.active = not bool(c.active)
    await session.commit()
    return {"status": "toggled", "active": c.active}


@router.delete("/admin/intervention-codes/{code_id}")
async def delete_intervention_code(
    code_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    await session.execute(
        delete(InterventionCode).where(
            or_(InterventionCode.id == code_id, InterventionCode.code == code_id)
        )
    )
    await session.commit()
    return {"status": "deleted"}


@router.get("/admin/intervention-providers")
async def list_intervention_providers(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(User).where(User.is_intervention_provider == True).limit(100)  # noqa: E712
    )
    out = []
    for u in res.scalars().all():
        d = row_to_dict(u)
        d.pop("password_hash", None)
        out.append(d)
    return out


@router.put("/admin/intervention-radius")
async def update_intervention_radius(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(InterventionCode).where(InterventionCode.id == data.get("structure_id"))
    )
    c = res.scalar_one_or_none()
    if c:
        c.default_radius_km = data.get("radius_km", 10)
        await session.commit()
    return {"status": "updated"}


# ============== BACKOFFICE STATS / KPI ====================================
async def _count(session: AsyncSession, model, *where) -> int:
    q = select(func.count()).select_from(model)
    if where:
        q = q.where(and_(*where))
    res = await session.execute(q)
    return int(res.scalar() or 0)


@router.get("/backoffice/stats")
async def get_bo_stats(session: AsyncSession = Depends(get_session)):
    return {
        "total_users": await _count(session, User),
        "beneficiaries": await _count(session, User, User.role == "beneficiary"),
        "guardians": await _count(session, User, User.role == "guardian"),
        "prescribers": await _count(session, User, User.is_prescriber == True),  # noqa: E712
        "total_alerts": await _count(session, Alert),
        "active_alerts": await _count(session, Alert, Alert.status == "active"),
        "prescriptions": await _count(session, Prescription),
        "subscribed_prescriptions": await _count(session, Prescription, Prescription.status == "subscribed"),
        "interventions": await _count(session, Intervention),
        "teleassistance_calls": await _count(session, TeleassistanceCall),
        "activation_codes": await _count(session, ActivationCode, ActivationCode.active == True),  # noqa: E712
        "subscriptions_total": await _count(session, Subscription, Subscription.status == "active"),
        "subscriptions_standard": await _count(
            session, Subscription,
            Subscription.status == "active", Subscription.subscription_type == "standard",
        ),
        "subscriptions_care": await _count(
            session, Subscription,
            Subscription.status == "active", Subscription.subscription_type == "care",
        ),
    }


@router.get("/backoffice/users")
async def list_bo_users(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(User).limit(500))
    out = []
    for u in res.scalars().all():
        d = row_to_dict(u)
        d.pop("password_hash", None)
        out.append(d)
    return out


@router.get("/backoffice/user/{user_id}")
async def get_bo_user_detail(
    user_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(select(User).where(User.id == user_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "Utilisateur non trouve")
    target_d = row_to_dict(target)
    target_d.pop("password_hash", None)

    guardians = []
    if target.guardians:
        gres = await session.execute(select(User).where(User.id.in_(target.guardians)))
        for g in gres.scalars().all():
            guardians.append({
                "id": g.id, "name": g.name or "", "email": g.email or "",
                "phone": g.phone or "", "guardian_type": g.guardian_type or "",
                "relationship": g.relationship or "",
                "profession": g.profession or "",
                "structure_name": g.structure_name or "",
                "is_prescriber": g.is_prescriber,
                "is_intervention_provider": g.is_intervention_provider,
                "intervention_radius_km": g.intervention_radius_km or 0,
            })

    beneficiaries = []
    if target.beneficiaries:
        bres = await session.execute(select(User).where(User.id.in_(target.beneficiaries)))
        for b in bres.scalars().all():
            beneficiaries.append({
                "id": b.id, "name": b.name or "", "email": b.email or "",
                "phone": b.phone or "", "date_of_birth": b.date_of_birth or "",
                "address": b.address or "",
            })

    ar = await session.execute(
        select(Alert).where(Alert.beneficiary_id == user_id)
        .order_by(Alert.created_at.desc()).limit(50)
    )
    alerts = [row_to_dict(a) for a in ar.scalars().all()]
    dr = await session.execute(select(Device).where(Device.user_id == user_id).limit(10))
    devices = [row_to_dict(d) for d in dr.scalars().all()]
    ir = await session.execute(
        select(Intervention).where(
            or_(Intervention.beneficiary_id == user_id, Intervention.intervenant_id == user_id)
        ).order_by(Intervention.created_at.desc()).limit(20)
    )
    interventions = [row_to_dict(i) for i in ir.scalars().all()]
    pr = await session.execute(
        select(Prescription).where(
            or_(Prescription.guardian_id == user_id, Prescription.beneficiary_id == user_id)
        ).order_by(Prescription.created_at.desc()).limit(20)
    )
    prescriptions = [row_to_dict(p) for p in pr.scalars().all()]
    sr = await session.execute(select(Subscription).where(Subscription.beneficiary_id == user_id))
    sub = sr.scalar_one_or_none()
    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == user_id))
    lv = lvr.scalar_one_or_none()

    return {
        "user": target_d, "guardians": guardians, "beneficiaries": beneficiaries,
        "alerts": alerts, "devices": devices, "interventions": interventions,
        "prescriptions": prescriptions,
        "subscription": row_to_dict(sub) if sub else None,
        "latest_vitals": row_to_dict(lv) if lv else None,
    }


@router.get("/backoffice/alert/{alert_id}")
async def get_bo_alert_detail(
    alert_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alerte non trouvee")
    br = await session.execute(select(User).where(User.id == alert.beneficiary_id))
    ben = br.scalar_one_or_none()
    bd = row_to_dict(ben) if ben else None
    if bd:
        bd.pop("password_hash", None)
    ir = await session.execute(select(Intervention).where(Intervention.alert_id == alert_id).limit(10))
    interventions = [row_to_dict(i) for i in ir.scalars().all()]
    inc_r = await session.execute(select(CarewatchIncident).where(CarewatchIncident.alert_id == alert_id))
    incident = inc_r.scalar_one_or_none()
    return {
        "alert": row_to_dict(alert),
        "beneficiary": bd,
        "interventions": interventions,
        "incident": row_to_dict(incident) if incident else None,
    }


@router.get("/backoffice/alerts")
async def list_bo_alerts(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(200)
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.get("/backoffice/interventions")
async def list_bo_interventions(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(Intervention).order_by(Intervention.created_at.desc()).limit(100)
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.get("/backoffice/prescriptions")
async def list_bo_prescriptions(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(Prescription).order_by(Prescription.created_at.desc()).limit(200)
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/backoffice/kpi")
async def get_kpi_data(session: AsyncSession = Depends(get_session)):
    now = datetime.now(timezone.utc)
    users_by_role = {}
    for role in ("beneficiary", "guardian", "admin", "teleassistance"):
        users_by_role[role] = await _count(session, User, User.role == role)
    alert_types = {}
    for at in ("sos", "fall", "anomaly", "inactivity"):
        alert_types[at] = await _count(session, Alert, Alert.alert_type == at)
    interventions_by_status = {}
    for st in ("dispatched", "en_route", "completed", "cancelled"):
        interventions_by_status[st] = await _count(session, Intervention, Intervention.status == st)
    alerts_by_day = []
    for i in range(7):
        day = now - timedelta(days=6 - i)
        next_day = day + timedelta(days=1)
        cnt = await _count(
            session, Alert,
            Alert.created_at >= day.replace(hour=0, minute=0, second=0, microsecond=0),
            Alert.created_at < next_day.replace(hour=0, minute=0, second=0, microsecond=0),
        )
        alerts_by_day.append({"date": day.strftime("%Y-%m-%d"), "count": cnt})

    rr = await session.execute(
        select(Alert).where(
            Alert.status == "resolved", Alert.resolved_at.isnot(None)
        ).limit(100)
    )
    total_min = 0.0
    cnt = 0
    for a in rr.scalars().all():
        if a.resolved_at and a.created_at:
            total_min += (a.resolved_at - a.created_at).total_seconds() / 60
            cnt += 1
    avg = round(total_min / cnt, 1) if cnt else 0

    return {
        "total_users": await _count(session, User),
        "total_alerts": await _count(session, Alert),
        "total_interventions": await _count(session, Intervention),
        "active_subscriptions": await _count(session, Prescription, Prescription.status == "subscribed"),
        "pending_subscriptions": await _count(session, Prescription, Prescription.status == "pending"),
        "avg_resolution_minutes": avg,
        "users_by_role": users_by_role, "alert_types": alert_types,
        "interventions_by_status": interventions_by_status,
        "alerts_by_day": alerts_by_day,
    }


@router.get("/backoffice/revenue")
async def get_revenue(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    res = await session.execute(
        select(PaymentHistory).order_by(PaymentHistory.date.desc()).limit(1000)
    )
    paid = [p for p in res.scalars().all() if p.status == "paid"]
    total_ht = sum(p.amount_ht or 0 for p in paid)
    total_ttc = sum(p.amount_ttc or p.amount_ht or 0 for p in paid)
    monthly_ht = sum(
        p.amount_ht or 0 for p in paid
        if p.date and p.date.startswith(current_month)
    )
    by_month = []
    for i in range(6):
        m = now - timedelta(days=30 * i)
        key = m.strftime("%Y-%m")
        total = sum(p.amount_ht or 0 for p in paid if p.date and p.date.startswith(key))
        by_month.append({"month": m.strftime("%b %Y"), "month_key": key, "total_ht": round(total, 2)})
    by_month.reverse()
    apps = (await session.execute(select(ProApplication))).scalars().all()
    return {
        "total_revenue_ht": round(total_ht, 2),
        "total_revenue_ttc": round(total_ttc, 2),
        "monthly_revenue_ht": round(monthly_ht, 2),
        "active_subscriptions": await _count(session, Subscription, Subscription.status == "active"),
        "total_subscriptions": await _count(session, Subscription),
        "total_payments": len(paid),
        "revenue_by_month": by_month,
        "recent_payments": [row_to_dict(p) for p in paid[:10]],
        "pros_activated": sum(1 for a in apps if a.status == "activated"),
        "pros_pending": sum(1 for a in apps if a.status == "pending"),
    }


# ============== ADMIN MANAGEMENT ==========================================
@router.put("/admin/user/{user_id}")
async def admin_update_user(
    user_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    allowed = {
        "name", "email", "phone", "role", "address", "active",
        "subscription_type", "has_subscription",
    }
    res = await session.execute(select(User).where(User.id == user_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "Utilisateur introuvable")
    for k, v in data.items():
        if k in allowed and hasattr(target, k):
            setattr(target, k, v)
    await session.commit()
    return {"status": "updated"}


@router.delete("/admin/user/{user_id}")
async def admin_delete_user(
    user_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    if user_id == user["id"]:
        raise HTTPException(400, "Impossible de supprimer votre propre compte")
    await session.execute(delete(User).where(User.id == user_id))
    await session.execute(delete(Device).where(Device.user_id == user_id))
    await session.execute(delete(Reminder).where(Reminder.user_id == user_id))
    await session.execute(delete(Threshold).where(Threshold.user_id == user_id))
    await session.commit()
    return {"status": "deleted"}


@router.get("/admin/programs")
async def admin_list_programs(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(ProgramEnrollment).order_by(ProgramEnrollment.started_at.desc()).limit(100)
    )
    return [row_to_dict(e) for e in res.scalars().all()]


@router.get("/admin/push-history")
async def admin_push_history(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(PushLog).order_by(PushLog.sent_at.desc()).limit(100)
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/admin/saad-invitations")
async def list_admin_saad_invitations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(SaadInvitation).order_by(SaadInvitation.created_at.desc()).limit(100)
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.get("/admin/rgpd-requests")
async def list_all_rgpd(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(
        select(RgpdRequest).order_by(RgpdRequest.created_at.desc()).limit(200)
    )
    return [row_to_dict(r) for r in res.scalars().all()]


@router.post("/admin/saad-invitation")
async def send_saad_invitation(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Crée une invitation SAAD (le mailer est porté plus tard)."""
    _ensure_admin(user)
    email = (data.get("email") or "").strip()
    if not email:
        raise HTTPException(400, "Email requis")
    token = str(uuid.uuid4())[:12].upper()
    inv = SaadInvitation(
        id=str(uuid.uuid4()),
        invited_email=email,
        invited_phone=data.get("phone"),
        beneficiary_id=user["id"],
        beneficiary_name=user.get("name", ""),
        relationship="saad",
        status="pending",
        created_at=utcnow(),
    )
    session.add(inv)
    await session.commit()
    return {"status": "sent", "token": token, "email": email}


@router.get("/admin/devices-overview")
async def admin_devices_overview(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(select(Device).limit(500))
    devices = res.scalars().all()
    user_ids = {d.user_id for d in devices if d.user_id}
    users_map: dict = {}
    if user_ids:
        ur = await session.execute(select(User).where(User.id.in_(user_ids)))
        for u in ur.scalars().all():
            users_map[u.id] = {"name": u.name or "Inconnu", "phone": u.phone or ""}
    out = []
    for d in devices:
        rec = row_to_dict(d)
        rec["user_name"] = users_map.get(d.user_id, {}).get("name", "Inconnu")
        rec["user_phone"] = users_map.get(d.user_id, {}).get("phone", "")
        out.append(rec)
    summary = {
        "total": len(devices),
        "bracelets": sum(1 for d in devices if d.type == "bracelet"),
        "scales": sum(1 for d in devices if d.type == "scale"),
        "connected": sum(1 for d in devices if d.connected),
        "low_battery": sum(1 for d in devices if (d.battery or 100) < 20),
    }
    return {"devices": out, "summary": summary}


@router.get("/admin/health-overview")
async def admin_health_overview(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _ensure_admin(user)
    res = await session.execute(select(User).where(User.role == "beneficiary").limit(100))
    out = []
    for b in res.scalars().all():
        lr = await session.execute(
            select(DeviceReading).where(DeviceReading.user_id == b.id)
            .order_by(DeviceReading.timestamp.desc()).limit(1)
        )
        gr = await session.execute(
            select(GlycemiaHistory).where(GlycemiaHistory.user_id == b.id)
            .order_by(GlycemiaHistory.timestamp.desc()).limit(1)
        )
        out.append({
            "user_id": b.id, "name": b.name, "phone": b.phone or "",
            "latest_reading": row_to_dict(lr.scalar_one_or_none()) if lr else None,
            "latest_glycemia": row_to_dict(gr.scalar_one_or_none()) if gr else None,
        })
    return {"beneficiaries": out}


# ============== DOCUMENTS (memory/) =======================================
@router.get("/admin/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    _ensure_admin(user)
    docs = []
    memory_dir = "/app/memory"
    if not os.path.isdir(memory_dir):
        return {"documents": []}
    for fname in sorted(os.listdir(memory_dir)):
        if fname.endswith(".md"):
            fp = os.path.join(memory_dir, fname)
            with open(fp) as f:
                first = f.readline().strip().lstrip("# ").strip()
            docs.append({
                "filename": fname,
                "title": first or fname,
                "size_kb": round(os.path.getsize(fp) / 1024, 1),
            })
    return {"documents": docs}


@router.get("/admin/documents/{filename}")
async def get_document_content(filename: str, user: dict = Depends(get_current_user)):
    _ensure_admin(user)
    safe = os.path.basename(filename)
    if not safe.endswith(".md"):
        raise HTTPException(404, "Document introuvable")
    fp = os.path.join("/app/memory", safe)
    if not os.path.exists(fp):
        raise HTTPException(404, "Document introuvable")
    with open(fp) as f:
        content = f.read()
    return {"filename": safe, "content": content}
