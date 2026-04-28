"""Routes Live Activity / Live Status pour iOS."""
from __future__ import annotations

from math import atan2, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import get_effective_role, row_to_dict
from app.models.alerts import Alert, AlertLiveStatus, AlertTracking, Intervention, InterventionTracking

router = APIRouter()

STAGES = [
    {"key": "alert_triggered", "label": "Alerte declenchee", "icon": "ri-alarm-warning-line"},
    {"key": "notifying_guardians", "label": "Notification des gardiens", "icon": "ri-notification-3-line"},
    {"key": "ai_calling", "label": "Appel IA en cours", "icon": "ri-phone-line"},
    {"key": "guardian_responding", "label": "Gardien contacte", "icon": "ri-user-heart-line"},
    {"key": "intervention_active", "label": "Intervention en cours", "icon": "ri-run-line"},
    {"key": "resolved", "label": "Alerte resolue", "icon": "ri-check-double-line"},
]


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    la1, lo1, la2, lo2 = radians(lat1), radians(lng1), radians(lat2), radians(lng2)
    dlat, dlon = la2 - la1, lo2 - lo1
    a = sin(dlat / 2) ** 2 + cos(la1) * cos(la2) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _estimate_eta(distance_km: float) -> dict:
    if distance_km < 0.5:
        m = max(1, round(distance_km * 4))
    elif distance_km < 5:
        m = max(2, round(distance_km * 3))
    else:
        m = max(5, round(distance_km * 1.5))
    return {"eta_minutes": m, "distance_km": round(distance_km, 2)}


@router.get("/alerts/{alert_id}/live-status")
async def get_live_status(
    alert_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(AlertLiveStatus).where(AlertLiveStatus.alert_id == alert_id)
    )
    doc = res.scalar_one_or_none()
    if not doc:
        ar = await session.execute(select(Alert).where(Alert.id == alert_id))
        alert = ar.scalar_one_or_none()
        if not alert:
            raise HTTPException(404, "Alerte non trouvee")
        return {
            "alert_id": alert_id,
            "beneficiary_name": alert.beneficiary_name or "",
            "alert_type": alert.alert_type or "sos",
            "current_stage": "resolved" if alert.status == "resolved" else "alert_triggered",
            "stages_completed": ["alert_triggered"] + (["resolved"] if alert.status == "resolved" else []),
            "timeline": [], "eta_minutes": None,
            "intervenant_name": None, "intervenant_phone": None,
            "stages_definition": STAGES,
        }
    payload = doc.payload or {}
    return {"alert_id": alert_id, **payload, "current_stage": doc.status, "stages_definition": STAGES}


@router.get("/alerts/live-active")
async def get_all_live_statuses(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eff = get_effective_role(user)
    q = select(AlertLiveStatus).where(AlertLiveStatus.status != "resolved")
    if eff == "guardian":
        bids = (user.get("beneficiaries") or []) + [user["id"]]
        # Joindre via Alert pour filtrer par bénéficiaires
        alerts_res = await session.execute(
            select(Alert.id).where(Alert.beneficiary_id.in_(bids), Alert.status == "active")
        )
        ids = [a[0] for a in alerts_res.all()]
        if not ids:
            return []
        q = q.where(AlertLiveStatus.alert_id.in_(ids))
    elif eff in ("admin", "teleassistance"):
        pass
    else:
        alerts_res = await session.execute(
            select(Alert.id).where(Alert.beneficiary_id == user["id"], Alert.status == "active")
        )
        ids = [a[0] for a in alerts_res.all()]
        if not ids:
            return []
        q = q.where(AlertLiveStatus.alert_id.in_(ids))

    res = await session.execute(q.order_by(AlertLiveStatus.updated_at.desc()).limit(20))
    rows = res.scalars().all()
    statuses: list[dict] = []
    for r in rows:
        s: dict = {"alert_id": r.alert_id, **(r.payload or {}), "current_stage": r.status, "stages_definition": STAGES}
        # Enrich with last positions
        try:
            tres = await session.execute(
                select(AlertTracking).where(AlertTracking.alert_id == r.alert_id)
                .order_by(AlertTracking.created_at.desc()).limit(1)
            )
            last = tres.scalar_one_or_none()
            ben_loc = None
            if last and last.payload:
                p = last.payload
                if p.get("latitude") and p.get("longitude"):
                    ben_loc = {"lat": p["latitude"], "lng": p["longitude"]}
                    s["beneficiary_location"] = ben_loc
            iv_res = await session.execute(
                select(Intervention).where(Intervention.alert_id == r.alert_id)
            )
            iv = iv_res.scalar_one_or_none()
            iv_loc = None
            if iv:
                ivt = await session.execute(
                    select(InterventionTracking).where(InterventionTracking.intervention_id == iv.id)
                )
                track = ivt.scalar_one_or_none()
                if track and track.positions:
                    p = track.positions[-1]
                    if p.get("latitude") and p.get("longitude"):
                        iv_loc = {"lat": p["latitude"], "lng": p["longitude"]}
                        s["intervenant_location"] = iv_loc
            if ben_loc and iv_loc:
                dist = _haversine_km(ben_loc["lat"], ben_loc["lng"], iv_loc["lat"], iv_loc["lng"])
                eta = _estimate_eta(dist)
                s.update(eta)
        except Exception:
            pass
        statuses.append(s)
    return statuses
