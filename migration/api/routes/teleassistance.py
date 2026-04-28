"""Routes Téléassistance / Escalation / Twilio (basics).

Cette implémentation couvre les opérations CRUD essentielles. Les workflows
Twilio / ElevenLabs / Vapi (TTS, IVR, speech-response) restent à porter
dans des sessions ultérieures.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.alerts import Escalation, TeleassistanceCall, TwilioCall
from app.models.shop import Subscription

router = APIRouter()


PROTOCOL_BENEFICIARY = [
    {"id": "p1", "label": "Bonjour, ici Chutex Care, le centre de teleassistance.",
     "icon": "ri-phone-line"},
    {"id": "p2", "label": "Comment vous sentez-vous ?",
     "icon": "ri-question-answer-line"},
    {"id": "p3", "label": "Avez-vous fait une chute ou un malaise ?",
     "icon": "ri-alert-line"},
    {"id": "p4", "label": "Voulez-vous que nous contactions vos proches ?",
     "icon": "ri-team-line"},
    {"id": "p5", "label": "Voulez-vous que nous envoyions les secours ?",
     "icon": "ri-ambulance-line"},
]
PROTOCOL_GUARDIAN = [
    {"id": "g1", "label": "Bonjour, ici Chutex Care.", "icon": "ri-phone-line"},
    {"id": "g2", "label": "Une alerte a ete declenchee pour votre proche.", "icon": "ri-alert-line"},
    {"id": "g3", "label": "Pouvez-vous intervenir ?", "icon": "ri-question-answer-line"},
    {"id": "g4", "label": "Voulez-vous que nous contactions un autre proche ?", "icon": "ri-team-line"},
    {"id": "g5", "label": "Voulez-vous que nous envoyions les secours ?", "icon": "ri-ambulance-line"},
]


@router.get("/teleassistance/protocol/beneficiary")
async def get_protocol_beneficiary():
    return PROTOCOL_BENEFICIARY


@router.get("/teleassistance/protocol/guardian")
async def get_protocol_guardian():
    return PROTOCOL_GUARDIAN


@router.post("/teleassistance/call")
async def create_call(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cid = str(uuid.uuid4())
    c = TeleassistanceCall(
        id=cid,
        alert_id=data.get("alert_id"),
        beneficiary_id=data.get("beneficiary_id"),
        operator_id=user["id"],
        step=data.get("step"),
        answers=data.get("answers") or {},
        notes=data.get("notes"),
        resolution=data.get("resolution"),
        status=data.get("status", "in_progress"),
        created_at=utcnow(),
    )
    session.add(c)
    await session.commit()
    return row_to_dict(c)


@router.get("/teleassistance/calls")
async def list_calls(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(TeleassistanceCall).order_by(TeleassistanceCall.created_at.desc()).limit(50)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.get("/teleassistance/subscribers")
async def list_subscribers(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Subscription).where(
            Subscription.subscription_type == "care",
            Subscription.status == "active",
        )
    )
    return [row_to_dict(s) for s in res.scalars().all()]


@router.get("/teleassistance/subscriber/{subscriber_id}")
async def get_subscriber(
    subscriber_id: str,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Subscription).where(Subscription.beneficiary_id == subscriber_id)
    )
    s = res.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Abonnement non trouve")
    return row_to_dict(s)


# ---------------- Escalation ---------------------------------------------
@router.post("/teleassistance/escalation/start")
async def start_escalation(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eid = str(uuid.uuid4())
    esc = Escalation(
        id=eid,
        alert_id=data.get("alert_id"),
        beneficiary_id=data.get("beneficiary_id"),
        current_step=0,
        status="in_progress",
        history=[{"step": 0, "time": utcnow().isoformat(), "note": "Escalation start"}],
        answers={},
    )
    session.add(esc)
    await session.commit()
    return row_to_dict(esc)


@router.post("/teleassistance/escalation/step")
async def add_escalation_step(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    eid = data.get("escalation_id")
    res = await session.execute(select(Escalation).where(Escalation.id == eid))
    esc = res.scalar_one_or_none()
    if not esc:
        raise HTTPException(404, "Escalation introuvable")
    history = list(esc.history or [])
    step = (esc.current_step or 0) + 1
    history.append({
        "step": step, "time": utcnow().isoformat(),
        "note": data.get("note", ""),
        "actor": user.get("name", ""),
    })
    esc.history = history
    esc.current_step = step
    await session.commit()
    return row_to_dict(esc)


@router.get("/teleassistance/escalation/{eid}")
async def get_escalation(eid: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Escalation).where(Escalation.id == eid))
    esc = res.scalar_one_or_none()
    if not esc:
        raise HTTPException(404, "Escalation introuvable")
    return row_to_dict(esc)


@router.get("/teleassistance/escalations")
async def list_escalations(
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Escalation).order_by(Escalation.created_at.desc()).limit(50)
    )
    return [row_to_dict(e) for e in res.scalars().all()]


@router.post("/teleassistance/escalation/{eid}/takeover")
async def takeover_escalation(
    eid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Escalation).where(Escalation.id == eid))
    esc = res.scalar_one_or_none()
    if not esc:
        raise HTTPException(404, "Escalation introuvable")
    history = list(esc.history or [])
    history.append({
        "step": esc.current_step, "time": utcnow().isoformat(),
        "note": f"Reprise par {user.get('name', '')}",
        "actor": user.get("name", ""),
    })
    esc.history = history
    esc.notes = (esc.notes or "") + f"\nReprise par {user.get('name', '')}"
    await session.commit()
    return {"status": "taken_over"}


@router.post("/teleassistance/escalation/{eid}/resolve")
async def resolve_escalation(
    eid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Escalation).where(Escalation.id == eid))
    esc = res.scalar_one_or_none()
    if not esc:
        raise HTTPException(404, "Escalation introuvable")
    esc.status = "resolved"
    esc.notes = (data.get("notes") or "")
    await session.commit()
    return {"status": "resolved"}


@router.get("/escalation/active")
async def list_active_escalations(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(Escalation).where(Escalation.status == "in_progress")
        .order_by(Escalation.created_at.desc())
    )
    return [row_to_dict(e) for e in res.scalars().all()]
