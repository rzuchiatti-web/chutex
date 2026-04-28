"""Routes Extras (Vague 2) — glycemia, vest, batch, pro_apps/subs, sleep, aging, daily report.

Implémentation Phase 1 : structure CRUD principale, sans tous les calculs IA
métier. Les algorithmes de scoring complets (sleep score, biological age,
detailed daily report) sont à porter dans une vague dédiée.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import Alert
from app.models.health import (
    BodyAgeCache,
    DailyReportCache,
    DeviceReading,
    GlycemiaCalibration,
    GlycemiaHistory,
    HealthSummaryCache,
    HealthVital,
    LatestVitals,
)
from app.models.misc import NoraAgingAnalysisCache
from app.models.pro import ProApplication, ProSubscription

router = APIRouter()


# =============== GLYCEMIA =================================================
@router.post("/glycemia/log")
async def log_glycemia(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rec = GlycemiaHistory(
        user_id=user["id"],
        date=utcnow().strftime("%Y-%m-%d"),
        timestamp=utcnow(),
        estimated_glycemia=data.get("value"),
        zone=data.get("zone"),
        algorithm_version=data.get("algorithm_version"),
        confidence_pct=data.get("confidence_pct"),
        data_points=data.get("data_points"),
    )
    session.add(rec)
    await session.commit()
    return {"status": "stored"}


@router.get("/glycemia/calibrations")
async def list_calibrations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(GlycemiaCalibration).where(GlycemiaCalibration.user_id == user["id"])
        .order_by(GlycemiaCalibration.timestamp.desc()).limit(50)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


# =============== VEST (Gilet Elder) =======================================
@router.post("/vest/sync")
async def vest_sync(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Stocke les données capteurs du gilet en raw_data."""
    rec = DeviceReading(
        id=str(uuid.uuid4()),
        user_id=user["id"],
        device_type="vest",
        timestamp=utcnow(),
        raw_data=data,
    )
    session.add(rec)
    await session.commit()
    return {"status": "stored"}


@router.get("/vest/latest")
async def vest_latest(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(DeviceReading).where(
            DeviceReading.user_id == user["id"], DeviceReading.device_type == "vest"
        ).order_by(DeviceReading.timestamp.desc()).limit(1)
    )
    r = res.scalar_one_or_none()
    return row_to_dict(r) if r else {}


@router.post("/vest/fall-detected")
async def vest_fall(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Création directe d'une alerte chute depuis le gilet."""
    aid = str(uuid.uuid4())
    now = utcnow()
    a = Alert(
        id=aid, beneficiary_id=user["id"],
        beneficiary_name=user.get("name", ""),
        alert_type="fall",
        message=data.get("message", "Chute detectee par gilet Elder"),
        device_type="vest",
        status="active",
        teleassistance_status="pending",
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        threshold_data={"impact_g": data.get("impact_g"), "vest_id": data.get("vest_id")},
        created_at=now,
    )
    session.add(a)
    await session.commit()
    return row_to_dict(a)


# =============== BATCH (multi-fetch dashboard) ============================
@router.get("/batch/dashboard")
async def batch_dashboard(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Récupère en un seul appel toutes les infos du dashboard mobile."""
    uid = user["id"]
    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == uid))
    lv = lvr.scalar_one_or_none()
    arres = await session.execute(
        select(Alert).where(Alert.beneficiary_id == uid, Alert.status == "active")
        .order_by(Alert.created_at.desc()).limit(5)
    )
    active_alerts = [row_to_dict(a) for a in arres.scalars().all()]
    return {
        "user_id": uid,
        "latest_vitals": row_to_dict(lv) if lv else {},
        "active_alerts": active_alerts,
        "active_alerts_count": len(active_alerts),
        "generated_at": utcnow().isoformat(),
    }


# =============== HEALTH EXTENDED (single-call) ============================
@router.get("/health/extended")
async def health_extended(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Endpoint optimisé pour le démarrage app : vitals + readings + alertes."""
    uid = user["id"]
    lvr = await session.execute(select(LatestVitals).where(LatestVitals.user_id == uid))
    lv = lvr.scalar_one_or_none()
    readings = {}
    for dt in ("bracelet", "scale", "vest", "dorsi"):
        rr = await session.execute(
            select(DeviceReading).where(
                DeviceReading.user_id == uid, DeviceReading.device_type == dt
            ).order_by(DeviceReading.timestamp.desc()).limit(1)
        )
        r = rr.scalar_one_or_none()
        if r:
            readings[dt] = row_to_dict(r)
    arres = await session.execute(
        select(Alert).where(Alert.beneficiary_id == uid, Alert.status == "active")
        .order_by(Alert.created_at.desc()).limit(5)
    )
    return {
        "latest_vitals": row_to_dict(lv) if lv else {},
        "device_readings": readings,
        "active_alerts": [row_to_dict(a) for a in arres.scalars().all()],
        "generated_at": utcnow().isoformat(),
    }


# =============== HEALTH DAILY REPORT =====================================
@router.get("/health/daily-report")
async def daily_report(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today = utcnow().date().isoformat()
    res = await session.execute(
        select(DailyReportCache).where(DailyReportCache.user_id == user["id"])
    )
    c = res.scalar_one_or_none()
    if c and c.cached_at and (utcnow() - c.cached_at).total_seconds() < 4 * 3600:
        return row_to_dict(c)
    # Compute lightweight summary
    since = utcnow() - timedelta(days=1)
    vr = await session.execute(
        select(HealthVital).where(
            HealthVital.user_id == user["id"], HealthVital.timestamp >= since
        )
    )
    vitals = list(vr.scalars().all())
    payload = {
        "date": today,
        "samples": len(vitals),
        "avg_hr": (
            round(sum(v.heart_rate or 0 for v in vitals) / max(len(vitals), 1), 1)
            if vitals else 0
        ),
        "total_steps": sum(v.steps or 0 for v in vitals),
    }
    if c:
        c.cached_at = utcnow()
        c.report = payload
    else:
        c = DailyReportCache(user_id=user["id"], cached_at=utcnow(), report=payload)
        session.add(c)
    await session.commit()
    return row_to_dict(c)


# =============== HEALTH SLEEP / AGING ====================================
@router.get("/health/sleep-summary")
async def sleep_summary(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(HealthSummaryCache).where(HealthSummaryCache.user_id == user["id"])
    )
    s = res.scalar_one_or_none()
    return row_to_dict(s) if s else {"summary": None}


@router.get("/health/aging-summary")
async def aging_summary(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(BodyAgeCache).where(BodyAgeCache.user_id == user["id"])
    )
    b = res.scalar_one_or_none()
    if b:
        return row_to_dict(b)
    nres = await session.execute(
        select(NoraAgingAnalysisCache).where(NoraAgingAnalysisCache.user_id == user["id"])
        .order_by(NoraAgingAnalysisCache.created_at.desc()).limit(1)
    )
    n = nres.scalar_one_or_none()
    return row_to_dict(n) if n else {"summary": None}


# =============== PRO APPLICATIONS / SUBSCRIPTIONS =========================
@router.get("/pro-applications/{app_id}")
async def get_pro_application(
    app_id: str,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(ProApplication).where(ProApplication.id == app_id))
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Candidature introuvable")
    return row_to_dict(a)


@router.get("/pro-applications")
async def list_pro_applications(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin uniquement")
    res = await session.execute(
        select(ProApplication).order_by(ProApplication.created_at.desc()).limit(200)
    )
    return [row_to_dict(a) for a in res.scalars().all()]


@router.put("/pro-applications/{app_id}/status")
async def update_pro_app_status(
    app_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin uniquement")
    res = await session.execute(select(ProApplication).where(ProApplication.id == app_id))
    a = res.scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Candidature introuvable")
    a.status = data.get("status", "pending")
    await session.commit()
    return {"status": a.status}


@router.get("/pro/subscriptions/my")
async def my_pro_subscription(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProSubscription).where(ProSubscription.professional_id == user["id"])
        .order_by(ProSubscription.created_at.desc()).limit(1)
    )
    s = res.scalar_one_or_none()
    return row_to_dict(s) if s else {"has_subscription": False}


@router.post("/pro/subscriptions/cancel")
async def cancel_pro_subscription(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ProSubscription).where(
            ProSubscription.professional_id == user["id"],
            ProSubscription.status == "active",
        )
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Aucun abonnement actif")
    s.status = "canceled"
    await session.commit()
    return {"status": "canceled"}


# =============== SHOPIFY (lecture status produits) ========================
@router.get("/shopify/products")
async def shopify_products():
    """Stub : si Shopify est encore utilisé, retourne une liste vide.
    Le checkout Mollie est devenu canonique (cf shop_routes Vague 1)."""
    return {"products": [], "note": "Shopify endpoint deprecated. Use /api/shop/products."}


@router.post("/shopify/webhook")
async def shopify_webhook(request: Request):
    try:
        await request.json()
    except Exception:
        pass
    return {"received": True}
