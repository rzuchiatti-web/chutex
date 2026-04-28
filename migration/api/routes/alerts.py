"""Routes Alerts : create, list, resolve, tracking, accept, detail."""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import get_effective_role, row_to_dict, utcnow
from app.models.alerts import (
    Alert,
    AlertLiveStatus,
    AlertTracking,
    Escalation,
    Incident,
    Intervention,
    InterventionTracking,
    TwilioCall,
)
from app.models.auth import User
from app.models.devices import Location

logger = logging.getLogger(__name__)
router = APIRouter()


class AlertCreate(BaseModel):
    alert_type: str
    message: str | None = None
    device_type: str | None = None
    vital_data: dict | None = None
    threshold_data: dict | None = None
    latitude: float | None = None
    longitude: float | None = None


# ---------------------------------------------------------------------------
# Live status helpers (équivalent live_status_routes.create_live_status & co)
# ---------------------------------------------------------------------------
STAGES = [
    {"key": "alert_triggered", "label": "Alerte declenchee", "icon": "ri-alarm-warning-line"},
    {"key": "notifying_guardians", "label": "Notification des gardiens", "icon": "ri-notification-3-line"},
    {"key": "ai_calling", "label": "Appel IA en cours", "icon": "ri-phone-line"},
    {"key": "guardian_responding", "label": "Gardien contacte", "icon": "ri-user-heart-line"},
    {"key": "intervention_active", "label": "Intervention en cours", "icon": "ri-run-line"},
    {"key": "resolved", "label": "Alerte resolue", "icon": "ri-check-double-line"},
]
STAGE_KEYS = [s["key"] for s in STAGES]


async def _create_live_status(
    session: AsyncSession,
    alert_id: str,
    beneficiary_id: str,
    beneficiary_name: str,
    alert_type: str,
):
    res = await session.execute(select(Location).where(Location.user_id == beneficiary_id))
    loc = res.scalar_one_or_none()
    payload = {
        "beneficiary_id": beneficiary_id,
        "beneficiary_name": beneficiary_name,
        "alert_type": alert_type,
        "current_stage": "alert_triggered",
        "stages_completed": ["alert_triggered"],
        "timeline": [{"stage": "alert_triggered", "timestamp": utcnow().isoformat(), "detail": "Alerte declenchee"}],
        "eta_minutes": None,
        "intervenant_name": None,
        "intervenant_phone": None,
        "beneficiary_location": (
            {"lat": loc.latitude, "lng": loc.longitude} if loc and loc.latitude and loc.longitude else None
        ),
        "intervenant_location": None,
    }
    stmt = pg_insert(AlertLiveStatus).values(
        alert_id=alert_id, status="alert_triggered", payload=payload, updated_at=utcnow(),
    ).on_conflict_do_update(
        index_elements=[AlertLiveStatus.alert_id],
        set_={"status": "alert_triggered", "payload": payload, "updated_at": utcnow()},
    )
    await session.execute(stmt)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/alerts")
async def create_alert(
    data: AlertCreate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    aid = str(uuid.uuid4())
    now = utcnow()

    # Update beneficiary location
    if data.latitude and data.longitude:
        loc_stmt = pg_insert(Location).values(
            user_id=user["id"], latitude=data.latitude, longitude=data.longitude, updated_at=now,
        ).on_conflict_do_update(
            index_elements=[Location.user_id],
            set_={"latitude": data.latitude, "longitude": data.longitude, "updated_at": now},
        )
        await session.execute(loc_stmt)

    alert = Alert(
        id=aid,
        beneficiary_id=user["id"],
        beneficiary_name=user.get("name", ""),
        alert_type=data.alert_type,
        message=data.message or f"Alerte {data.alert_type}",
        device_type=data.device_type,
        status="active",
        teleassistance_status="pending",
        vital_data=data.vital_data,
        threshold_data=data.threshold_data,
        latitude=data.latitude,
        longitude=data.longitude,
        created_at=now,
    )
    session.add(alert)

    # Initial position in tracking
    initial_pos = []
    if data.latitude and data.longitude:
        initial_pos = [{"latitude": data.latitude, "longitude": data.longitude, "timestamp": now.isoformat()}]
    tracking_stmt = pg_insert(AlertTracking).values(
        alert_id=aid, event="started", payload={"positions": initial_pos}, created_at=now,
    )
    await session.execute(tracking_stmt)

    await _create_live_status(session, aid, user["id"], user.get("name", ""), data.alert_type)
    await session.commit()
    return row_to_dict(alert)


@router.get("/alerts")
async def get_alerts(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eff = get_effective_role(user)
    q = select(Alert).order_by(Alert.created_at.desc())
    if eff in ("teleassistance", "admin"):
        res = await session.execute(q.limit(200))
    elif eff == "guardian":
        bids = (user.get("beneficiaries") or []) + [user["id"]]
        res = await session.execute(q.where(Alert.beneficiary_id.in_(bids)).limit(100))
    else:
        res = await session.execute(q.where(Alert.beneficiary_id == user["id"]).limit(100))
    return [row_to_dict(a) for a in res.scalars().all()]


@router.get("/alerts/active-with-interventions")
async def get_active_with_interventions(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eff = get_effective_role(user)
    q = select(Alert).where(Alert.status == "active").order_by(Alert.created_at.desc())
    if eff == "beneficiary":
        q = q.where(Alert.beneficiary_id == user["id"]).limit(10)
    elif eff == "guardian":
        bids = (user.get("beneficiaries") or []) + [user["id"]]
        q = q.where(Alert.beneficiary_id.in_(bids)).limit(10)
    else:
        q = q.limit(20)
    res = await session.execute(q)
    alerts = [row_to_dict(a) for a in res.scalars().all()]

    for a in alerts:
        ivres = await session.execute(
            select(Intervention).where(
                Intervention.alert_id == a["id"],
                Intervention.status.in_(["pending", "in_progress", "en_route"]),
            )
        )
        iv = ivres.scalar_one_or_none()
        a["intervention"] = row_to_dict(iv) if iv else None
        if iv and iv.intervenant_id:
            ures = await session.execute(select(User).where(User.id == iv.intervenant_id))
            inter = ures.scalar_one_or_none()
            if inter:
                a["intervener_info"] = {
                    "name": inter.name or "",
                    "phone": inter.phone or "",
                    "structure": inter.structure_name or "",
                }
    return alerts


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    data: dict | None = None,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = utcnow()
    res = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alerte non trouvee")
    alert.status = "resolved"
    alert.resolved_at = now
    alert.resolved_by = user["id"]
    # Mark live status resolved
    await session.execute(
        update(AlertLiveStatus)
        .where(AlertLiveStatus.alert_id == alert_id)
        .values(status="resolved", updated_at=now)
    )
    await session.commit()
    return {"status": "resolved"}


@router.post("/alerts/{alert_id}/resolve-with-report")
async def resolve_with_report(
    alert_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = utcnow()
    report = {
        "answers": data.get("answers", []),
        "notes": data.get("notes", ""),
        "closed_by": user["id"],
        "closed_by_name": user.get("name", ""),
        "closed_at": now.isoformat(),
    }
    res = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alerte non trouvee")
    alert.status = "resolved"
    alert.resolved_at = now
    alert.resolved_by = user["id"]
    # Stocke report dans threshold_data (JSONB déjà existant, on le réutilise)
    alert.threshold_data = {**(alert.threshold_data or {}), "report": report}
    await session.execute(
        update(AlertLiveStatus)
        .where(AlertLiveStatus.alert_id == alert_id)
        .values(status="resolved", updated_at=now)
    )
    await session.commit()
    return {"status": "resolved", "report": report}


@router.post("/alerts/{alert_id}/location")
async def update_alert_location(
    alert_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = utcnow()
    pos = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timestamp": now.isoformat(),
    }
    # Append in alert_tracking (use new event row)
    session.add(AlertTracking(
        alert_id=alert_id, event="position", payload=pos, created_at=now,
    ))
    # Upsert location
    loc_stmt = pg_insert(Location).values(
        user_id=user["id"], latitude=data.get("latitude"), longitude=data.get("longitude"), updated_at=now,
    ).on_conflict_do_update(
        index_elements=[Location.user_id],
        set_={
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "updated_at": now,
        },
    )
    await session.execute(loc_stmt)
    await session.commit()
    return {"status": "updated"}


@router.post("/interventions/{intervention_id}/location")
async def update_intervention_location(
    intervention_id: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    now = utcnow()
    pos = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "timestamp": now.isoformat(),
    }
    res = await session.execute(
        select(InterventionTracking).where(InterventionTracking.intervention_id == intervention_id)
    )
    track = res.scalar_one_or_none()
    if track:
        positions = list(track.positions or []) + [pos]
        track.positions = positions
        track.intervenant_id = user["id"]
        track.intervenant_name = user.get("name", "")
        track.updated_at = now
    else:
        session.add(InterventionTracking(
            intervention_id=intervention_id,
            intervenant_id=user["id"],
            intervenant_name=user.get("name", ""),
            positions=[pos],
            updated_at=now,
        ))
    await session.commit()
    return {"status": "updated"}


@router.get("/alerts/{alert_id}/tracking")
async def get_alert_tracking(
    alert_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Reconstruct positions from event log
    res = await session.execute(
        select(AlertTracking).where(AlertTracking.alert_id == alert_id).order_by(AlertTracking.created_at)
    )
    rows = res.scalars().all()
    positions = []
    for r in rows:
        p = r.payload or {}
        if "positions" in p:
            positions.extend(p["positions"])
        elif "latitude" in p:
            positions.append(p)

    iv_res = await session.execute(
        select(Intervention).where(Intervention.alert_id == alert_id)
    )
    iv = iv_res.scalar_one_or_none()
    inter_positions = []
    inter_name = ""
    if iv:
        tres = await session.execute(
            select(InterventionTracking).where(InterventionTracking.intervention_id == iv.id)
        )
        track = tres.scalar_one_or_none()
        if track:
            inter_positions = list(track.positions or [])
            inter_name = track.intervenant_name or ""
    return {
        "beneficiary": positions,
        "intervenant": inter_positions,
        "intervenant_name": inter_name,
    }


@router.post("/interventions/accept-as-guardian")
async def accept_as_guardian(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    alert_id = data.get("alert_id")
    if not alert_id:
        raise HTTPException(400, "alert_id required")
    res = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alert not found")

    now = utcnow()
    ivres = await session.execute(
        select(Intervention).where(
            Intervention.alert_id == alert_id,
            Intervention.status.in_(["pending", "in_progress", "en_route"]),
        )
    )
    existing = ivres.scalar_one_or_none()
    if existing and existing.intervenant_id and existing.intervenant_id != user["id"]:
        raise HTTPException(409, "Un intervenant est deja assigne")

    if existing:
        existing.intervenant_id = user["id"]
        existing.intervenant_name = user.get("name", "")
        existing.status = "in_progress"
        existing.accepted_at = now
        iv_id = existing.id
    else:
        iv_id = str(uuid.uuid4())
        session.add(Intervention(
            id=iv_id,
            alert_id=alert_id,
            beneficiary_id=alert.beneficiary_id,
            intervenant_id=user["id"],
            intervenant_name=user.get("name", ""),
            status="in_progress",
            accepted_at=now,
            notes=f"Intervention gardien - {user.get('name', '')}",
            created_at=now,
        ))

    alert.teleassistance_status = "CARE_DISPATCHED"
    await session.commit()
    return {"status": "accepted", "intervention_id": iv_id}


@router.get("/alerts/{aid}/detail")
async def get_alert_detail(
    aid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Alert).where(Alert.id == aid))
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(404, "Alerte non trouvee")
    ben_res = await session.execute(select(User).where(User.id == alert.beneficiary_id))
    ben = ben_res.scalar_one_or_none()

    esc_res = await session.execute(
        select(Escalation).where(Escalation.alert_id == aid).order_by(Escalation.created_at.desc()).limit(10)
    )
    escalations = [row_to_dict(e) for e in esc_res.scalars().all()]
    cal_res = await session.execute(
        select(TwilioCall).where(TwilioCall.alert_id == aid).order_by(TwilioCall.created_at.desc()).limit(20)
    )
    calls = [row_to_dict(c) for c in cal_res.scalars().all()]
    iv_res = await session.execute(
        select(Intervention).where(Intervention.alert_id == aid).order_by(Intervention.created_at.desc()).limit(10)
    )
    interventions = [row_to_dict(i) for i in iv_res.scalars().all()]
    loc_res = await session.execute(select(Location).where(Location.user_id == alert.beneficiary_id))
    location = row_to_dict(loc_res.scalar_one_or_none()) if loc_res else None

    return {
        "alert": row_to_dict(alert),
        "beneficiary": (
            {
                "id": ben.id, "name": ben.name, "phone": ben.phone,
                "email": ben.email, "address": ben.address,
                "blood_type": ben.blood_type, "medical_conditions": ben.medical_conditions,
                "allergies": ben.allergies, "date_of_birth": ben.date_of_birth,
                "gender": ben.gender, "height_cm": ben.height_cm, "weight_kg": ben.weight_kg,
                "doctor_name": ben.doctor_name,
                "emergency_contact_name": ben.emergency_contact_name,
                "emergency_contact_phone": ben.emergency_contact_phone,
            }
            if ben else None
        ),
        "guardians": [],  # TODO: enrich via guardian_relationships once ported
        "escalations": escalations,
        "calls": calls,
        "interventions": interventions,
        "location": location,
        "timeline": [],
    }
