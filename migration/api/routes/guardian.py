"""Routes Guardian (aidants) — link, beneficiaries, my, requests, invitations.

Les listes `guardians` et `beneficiaries` sont stockées en JSONB sur User
(comme l'ancien backend Mongo).
"""
from __future__ import annotations

import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import get_effective_role, row_to_dict, utcnow
from app.models.alerts import Alert
from app.models.auth import User
from app.models.guardian import (
    GuardianInvitation,
    GuardianRelationship,
    GuardianRequest,
    SaadInvitation,
)
from app.models.health import DeviceReading

logger = logging.getLogger(__name__)
router = APIRouter()


class LinkBeneficiaryRequest(BaseModel):
    beneficiary_email: str


def _normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\.\(\)]", "", (phone or "").strip())
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+33" + cleaned[1:]
    return cleaned


async def _ensure_guardian(user: dict) -> None:
    if get_effective_role(user) not in ("guardian", "professional"):
        raise HTTPException(403, "Reserve aux gardiens")


@router.post("/guardian/link")
async def link_beneficiary(
    data: LinkBeneficiaryRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_guardian(user)
    res = await session.execute(
        select(User).where(User.email == data.beneficiary_email, User.role == "beneficiary")
    )
    ben = res.scalar_one_or_none()
    if not ben:
        raise HTTPException(404, "Beneficiaire non trouve")

    # Update guardian's beneficiaries list
    res2 = await session.execute(select(User).where(User.id == user["id"]))
    g = res2.scalar_one_or_none()
    if g:
        bens = list(g.beneficiaries or [])
        if ben.id not in bens:
            bens.append(ben.id)
            g.beneficiaries = bens
    # Update beneficiary's guardians list
    guards = list(ben.guardians or [])
    if user["id"] not in guards:
        guards.append(user["id"])
        ben.guardians = guards
    await session.commit()
    return {"status": "linked", "beneficiary": {"id": ben.id, "name": ben.name, "email": ben.email}}


@router.get("/guardian/beneficiaries")
async def get_beneficiaries(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_guardian(user)
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if not me:
        return []
    bids = list(me.beneficiaries or [])
    if not bids:
        return []
    bres = await session.execute(select(User).where(User.id.in_(bids)))
    out = []
    for b in bres.scalars().all():
        d = row_to_dict(b)
        d.pop("password_hash", None)
        # Latest bracelet reading
        lr = await session.execute(
            select(DeviceReading).where(
                DeviceReading.user_id == b.id, DeviceReading.device_type == "bracelet"
            ).order_by(DeviceReading.timestamp.desc()).limit(1)
        )
        latest = lr.scalar_one_or_none()
        d["latest_vitals"] = (latest.raw_data if latest else None)
        d["last_sync"] = (latest.timestamp.isoformat() if latest and latest.timestamp else None)
        # Active alerts count
        from sqlalchemy import func
        ar = await session.execute(
            select(func.count(Alert.id)).where(
                Alert.beneficiary_id == b.id, Alert.status == "active"
            )
        )
        d["active_alerts"] = int(ar.scalar() or 0)
        out.append(d)
    return out


@router.get("/guardians/my")
async def get_my_guardians(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if not me:
        return []
    order = list(me.guardian_order or me.guardians or [])
    seen = set()
    out = []
    for gid in list(order) + list(me.guardians or []):
        if gid in seen:
            continue
        seen.add(gid)
        gr = await session.execute(select(User).where(User.id == gid))
        g = gr.scalar_one_or_none()
        if not g:
            continue
        rr = await session.execute(
            select(GuardianRelationship).where(
                GuardianRelationship.guardian_id == gid,
                GuardianRelationship.beneficiary_id == user["id"],
            )
        )
        rel_doc = rr.scalar_one_or_none()
        rel = (rel_doc.relationship if rel_doc else g.relationship) or ""
        out.append({
            "id": g.id, "name": g.name, "email": g.email or "", "phone": g.phone or "",
            "address": g.address or "", "profession": g.profession or "",
            "structure_name": g.structure_name or "", "guardian_type": g.guardian_type or "",
            "relationship": rel, "is_prescriber": g.is_prescriber,
            "latitude": g.latitude, "longitude": g.longitude,
        })
    return out


@router.post("/guardians/reorder")
async def reorder_guardians(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if me:
        me.guardian_order = data.get("order", [])
        await session.commit()
    return {"status": "ok"}


@router.post("/guardians/{guardian_id}/unlink")
async def unlink_guardian(
    guardian_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    if me:
        me.guardians = [g for g in (me.guardians or []) if g != guardian_id]
        me.guardian_order = [g for g in (me.guardian_order or []) if g != guardian_id]
    gres = await session.execute(select(User).where(User.id == guardian_id))
    g = gres.scalar_one_or_none()
    if g:
        g.beneficiaries = [b for b in (g.beneficiaries or []) if b != user["id"]]
    await session.commit()
    return {"status": "unlinked"}


@router.get("/guardian/invitations")
async def get_guardian_invitations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    phone = _normalize_phone(user.get("phone", ""))
    res = await session.execute(
        select(GuardianInvitation).where(
            GuardianInvitation.invited_phone == phone,
            GuardianInvitation.status == "pending",
        ).order_by(GuardianInvitation.created_at.desc())
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.post("/guardian/invitations/{inv_id}/accept")
async def accept_guardian_invitation(
    inv_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(GuardianInvitation).where(GuardianInvitation.id == inv_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(404, "Invitation introuvable")
    inv.status = "accepted"
    # Lier dans User.beneficiaries / User.guardians
    if inv.beneficiary_id:
        ures = await session.execute(select(User).where(User.id == inv.beneficiary_id))
        ben = ures.scalar_one_or_none()
        if ben:
            guards = list(ben.guardians or [])
            if user["id"] not in guards:
                guards.append(user["id"])
                ben.guardians = guards
        gres = await session.execute(select(User).where(User.id == user["id"]))
        me = gres.scalar_one_or_none()
        if me:
            bens = list(me.beneficiaries or [])
            if inv.beneficiary_id not in bens:
                bens.append(inv.beneficiary_id)
                me.beneficiaries = bens
    await session.commit()
    return {"status": "accepted"}


@router.post("/guardian/invitations/{inv_id}/reject")
async def reject_guardian_invitation(
    inv_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(GuardianInvitation).where(GuardianInvitation.id == inv_id))
    inv = res.scalar_one_or_none()
    if inv:
        inv.status = "rejected"
        await session.commit()
    return {"status": "rejected"}


@router.get("/alerts/my")
async def get_my_alerts(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Alertes pour les bénéficiaires liés au gardien courant."""
    res = await session.execute(select(User).where(User.id == user["id"]))
    me = res.scalar_one_or_none()
    bids = list((me.beneficiaries or [])) if me else []
    bids.append(user["id"])
    if not bids:
        return []
    ar = await session.execute(
        select(Alert).where(Alert.beneficiary_id.in_(bids))
        .order_by(Alert.created_at.desc()).limit(50)
    )
    return [row_to_dict(a) for a in ar.scalars().all()]


@router.get("/guardian/saad-invitations")
async def get_saad_invitations(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    phone = _normalize_phone(user.get("phone", ""))
    res = await session.execute(
        select(SaadInvitation).where(
            SaadInvitation.invited_phone == phone,
            SaadInvitation.status == "pending",
        )
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.post("/guardian/saad-invitations/{inv_id}/accept")
async def accept_saad_invitation(
    inv_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(SaadInvitation).where(SaadInvitation.id == inv_id))
    inv = res.scalar_one_or_none()
    if not inv:
        raise HTTPException(404, "Invitation introuvable")
    inv.status = "accepted"
    await session.commit()
    return {"status": "accepted"}


@router.post("/guardian/saad-invitations/{inv_id}/reject")
async def reject_saad_invitation(
    inv_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(SaadInvitation).where(SaadInvitation.id == inv_id))
    inv = res.scalar_one_or_none()
    if inv:
        inv.status = "rejected"
        await session.commit()
    return {"status": "rejected"}
