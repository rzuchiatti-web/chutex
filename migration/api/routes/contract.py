"""Routes Contract (Stripe) — création, validation, list, payments.

Pour la création d'abonnement Stripe complet (intent, webhook), un travail
dédié sera nécessaire en Vague 3 (workflows OAuth Stripe Connect, génération
PDF de contrat, IBAN, transfers). Cette implémentation couvre les
opérations de lecture et d'écriture de base.
"""
from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.shop import (
    Contract,
    InternalInvoice,
    PaymentHistory,
    PaymentTransaction,
    StripeConfig,
    Subscription,
)

router = APIRouter()


# ---------------- Contract creation --------------------------------------
@router.post("/contract/create")
async def create_contract(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    cid = str(uuid.uuid4())
    now = utcnow()
    contract_number = f"CHX-{now.strftime('%Y%m')}-{cid[:8].upper()}"
    c = Contract(
        id=cid,
        contract_number=contract_number,
        plan=data.get("plan", "standard"),
        plan_label=data.get("plan_label"),
        price_monthly=float(data.get("price_monthly") or 24.9),
        price_after_credit=data.get("price_after_credit"),
        subscriber_type=data.get("subscriber_type", "self"),
        beneficiary=data.get("beneficiary") or {},
        housing=data.get("housing") or {},
        guardians=data.get("guardians") or [],
        delivery=data.get("delivery") or {},
        billing=data.get("billing") or {},
        signature=data.get("signature") or {},
        status="draft",
        prescriber_validated=False,
        created_at=now,
    )
    session.add(c)
    await session.commit()
    return row_to_dict(c)


@router.get("/contract/{cid}")
async def get_contract(
    cid: str, session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Contract).where(Contract.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contrat introuvable")
    return row_to_dict(c)


@router.put("/contract/{cid}/validate")
async def validate_contract(
    cid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Contract).where(Contract.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contrat introuvable")
    c.prescriber_validated = True
    c.status = "validated"
    await session.commit()
    return {"status": "validated"}


@router.put("/contract/{cid}/sign")
async def sign_contract(
    cid: str,
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Contract).where(Contract.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contrat introuvable")
    c.signature = {**(c.signature or {}), **data, "signed_at": utcnow().isoformat()}
    c.status = "signed"
    await session.commit()
    return {"status": "signed"}


@router.put("/contract/{cid}/activate")
async def activate_contract(
    cid: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Active un contrat signé — crée un Subscription rattaché."""
    res = await session.execute(select(Contract).where(Contract.id == cid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contrat introuvable")
    if c.status != "signed":
        raise HTTPException(400, "Contrat non signé")
    c.status = "active"
    c.activated_at = utcnow()
    sid = str(uuid.uuid4())
    sub = Subscription(
        id=sid,
        contract_id=cid,
        contract_number=c.contract_number,
        beneficiary_id=(c.beneficiary or {}).get("user_id"),
        beneficiary_phone=(c.beneficiary or {}).get("phone"),
        subscription_type=c.plan,
        status="active",
        source="contract",
    )
    session.add(sub)
    await session.commit()
    return {"status": "active", "subscription_id": sid}


@router.get("/contract/{cid}/payments")
async def list_contract_payments(
    cid: str,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(PaymentTransaction).where(PaymentTransaction.contract_id == cid)
        .order_by(PaymentTransaction.created_at.desc())
    )
    return [row_to_dict(p) for p in res.scalars().all()]


@router.get("/contract/{cid}/invoices")
async def list_contract_invoices(
    cid: str,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(InternalInvoice).where(InternalInvoice.contract_id == cid)
        .order_by(InternalInvoice.created_at.desc())
    )
    return [row_to_dict(i) for i in res.scalars().all()]


@router.get("/contracts/my")
async def my_contracts(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Contrats où l'utilisateur courant est bénéficiaire."""
    res = await session.execute(
        select(Contract).order_by(Contract.created_at.desc()).limit(50)
    )
    out = []
    for c in res.scalars().all():
        if (c.beneficiary or {}).get("user_id") == user["id"]:
            out.append(row_to_dict(c))
    return out


@router.get("/contracts/all")
async def all_contracts(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin uniquement")
    res = await session.execute(
        select(Contract).order_by(Contract.created_at.desc()).limit(200)
    )
    return [row_to_dict(c) for c in res.scalars().all()]


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, session: AsyncSession = Depends(get_session)):
    """Stripe webhook : enregistre les paiements (Phase 1 — pas de signature check)."""
    try:
        evt = await request.json()
    except Exception:
        raise HTTPException(400, "JSON invalide")
    event_type = evt.get("type", "")
    data = (evt.get("data") or {}).get("object") or {}
    if event_type == "invoice.paid":
        amount = (data.get("amount_paid") or 0) / 100
        ph = PaymentHistory(
            id=str(uuid.uuid4()),
            mollie_payment_id=data.get("id"),
            amount_ttc=amount,
            amount_ht=round(amount / 1.20, 2),
            status="paid",
            date=utcnow().strftime("%Y-%m-%d"),
        )
        session.add(ph)
        await session.commit()
    return {"received": True}
