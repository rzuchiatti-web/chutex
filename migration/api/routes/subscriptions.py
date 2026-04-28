"""Routes Subscriptions / Contracts (lecture) + Plans + Stripe config (read).

Les workflows complets de souscription (Stripe webhook, génération PDF de
contrat, IBAN, etc.) restent à porter intégralement. Cette base couvre les
endpoints critiques pour le mobile (lecture / annulation simple).
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.helpers import row_to_dict, utcnow
from app.models.shop import Contract, StripeConfig, Subscription

router = APIRouter()


def _normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\.\(\)]", "", (phone or "").strip())
    if cleaned.startswith("0") and len(cleaned) == 10:
        cleaned = "+33" + cleaned[1:]
    return cleaned


@router.get("/subscriptions/my")
async def get_my_subscription(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Subscription).where(
            Subscription.beneficiary_id == user["id"],
            Subscription.status == "active",
        )
    )
    sub = res.scalar_one_or_none()
    if not sub:
        phone = _normalize_phone(user.get("phone", ""))
        if phone:
            res = await session.execute(
                select(Subscription).where(
                    Subscription.beneficiary_phone == phone,
                    Subscription.status == "active",
                )
            )
            sub = res.scalar_one_or_none()
    if not sub:
        return {"has_subscription": False}
    out = row_to_dict(sub)
    if sub.contract_id:
        cres = await session.execute(select(Contract).where(Contract.id == sub.contract_id))
        c = cres.scalar_one_or_none()
        if c:
            out["contract"] = row_to_dict(c)
    return {"has_subscription": True, "subscription": out}


@router.post("/subscriptions/my/cancel")
async def cancel_my_subscription(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Subscription).where(
            Subscription.beneficiary_id == user["id"],
            Subscription.status == "active",
        )
    )
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(404, "Aucun abonnement actif")
    sub.status = "canceled"
    await session.commit()
    return {"status": "canceled"}


@router.get("/subscriptions/check/{user_id}")
async def check_subscription(
    user_id: str, session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(Subscription).where(
            Subscription.beneficiary_id == user_id,
            Subscription.status == "active",
        )
    )
    sub = res.scalar_one_or_none()
    return {"active": bool(sub), "subscription": row_to_dict(sub) if sub else None}


@router.get("/contract/{contract_id}")
async def get_contract(
    contract_id: str,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Contract).where(Contract.id == contract_id))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Contrat introuvable")
    return row_to_dict(c)


@router.get("/stripe/config")
async def get_stripe_config(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(StripeConfig))
    return {c.plan_id: row_to_dict(c) for c in res.scalars().all()}


@router.get("/plans")
async def get_plans():
    return [
        {"id": "standard", "label": "Standard", "price": 9.90, "currency": "EUR"},
        {"id": "sport", "label": "Sport", "price": 14.90, "currency": "EUR"},
        {"id": "physio", "label": "Physio", "price": 19.90, "currency": "EUR"},
        {"id": "care", "label": "Care", "price": 29.90, "currency": "EUR"},
    ]
