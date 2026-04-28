"""Routes utilitaires : contact, prescriptions, candidature professionnelle."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.schemas import ContactMessageIn, PrescriptionIn, ProApplicationIn
from app.models.misc import ContactMessage
from app.models.pro import ProApplication
from app.models.shop import Prescription

router = APIRouter()


@router.post("/contact")
async def send_contact(
    data: ContactMessageIn, session: AsyncSession = Depends(get_session)
):
    msg = ContactMessage(
        name=data.name, email=data.email, phone=data.phone,
        subject=data.subject, message=data.message, status="new",
    )
    session.add(msg)
    await session.commit()
    return {"status": "sent"}


@router.post("/prescriptions")
async def create_prescription(
    data: PrescriptionIn,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    pid = str(uuid.uuid4())
    presc = Prescription(
        id=pid,
        guardian_id=user.get("id"),
        guardian_name=user.get("name"),
        prescriber_structure=data.prescriber_structure or user.get("prescriber_structure"),
        beneficiary_name=data.beneficiary_name,
        beneficiary_first_name=data.beneficiary_first_name,
        beneficiary_email=data.beneficiary_email,
        beneficiary_phone=data.beneficiary_phone,
        subscription_type=data.subscription_type,
        plan_label=data.plan_label,
        price=data.price,
        notes=data.notes,
        guardian_contact_name=data.guardian_contact_name,
        guardian_contact_phone=data.guardian_contact_phone,
        status="pending",
    )
    session.add(presc)
    await session.commit()
    return {"id": pid, "status": "pending"}


@router.get("/prescriptions/me")
async def list_my_prescriptions(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Prescription).where(Prescription.guardian_id == user["id"])
    )
    rows = res.scalars().all()
    return [
        {c.name: getattr(p, c.name) for c in p.__table__.columns}
        for p in rows
    ]


@router.post("/pro-applications")
async def create_pro_application(
    data: ProApplicationIn, session: AsyncSession = Depends(get_session)
):
    aid = str(uuid.uuid4())
    app = ProApplication(
        id=aid,
        type=data.type,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        city=data.city,
        postal_code=data.postal_code,
        diploma=data.diploma,
        diploma_year=data.diploma_year,
        specialization=data.specialization,
        adeli_rpps=data.adeli_rpps,
        siret=data.siret,
        current_situation=data.current_situation,
        current_clients=data.current_clients,
        motivation=data.motivation,
        signer_name=data.signer_name,
        contract_accepted=data.contract_accepted,
        status="pending",
    )
    session.add(app)
    await session.commit()
    return {"id": aid, "status": "pending"}


@router.get("/pro-applications/{app_id}")
async def get_pro_application(
    app_id: str, session: AsyncSession = Depends(get_session)
):
    res = await session.execute(select(ProApplication).where(ProApplication.id == app_id))
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(404, "Application not found")
    return {c.name: getattr(app, c.name) for c in app.__table__.columns}
