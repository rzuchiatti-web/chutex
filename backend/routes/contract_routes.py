from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import uuid, logging, os, re

from database import db
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from services.smsmode_service import send_sms, send_invitation_sms

logger = logging.getLogger(__name__)
router = APIRouter()

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")

PLANS = {
    "bracelet": {"name": "Bracelet Elio", "price": 39.90, "label": "Bracelet connecte Elio — Teleassistance 24/7"},
    "bracelet_gilet": {"name": "Bracelet Elio + Gilet Elder", "price": 79.90, "label": "Bracelet Elio + Gilet airbag Elder — Teleassistance 24/7"},
}


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


# ─── Models ───
class ContractCreate(BaseModel):
    plan: str
    subscriber_type: str  # "self" | "relative"
    beneficiary: dict
    housing: dict
    guardians: list
    delivery: dict
    billing: dict


class ContractCheckout(BaseModel):
    contract_id: str
    origin_url: str


# ─── Create Contract (draft) ───
@router.post("/contract/create")
async def create_contract(data: ContractCreate):
    if data.plan not in PLANS:
        raise HTTPException(400, "Plan invalide")

    plan = PLANS[data.plan]
    now = datetime.now(timezone.utc).isoformat()
    count = await db.contracts.count_documents({}) + 1
    contract_number = f"CHX-{datetime.now().year}-{count:04d}"

    ben_phone = normalize_phone(data.beneficiary.get("phone", ""))

    # Delivery date: 3 business days from now
    delivery_date = datetime.now(timezone.utc) + timedelta(days=5)
    while delivery_date.weekday() >= 5:
        delivery_date += timedelta(days=1)

    contract = {
        "id": str(uuid.uuid4()),
        "contract_number": contract_number,
        "plan": data.plan,
        "plan_label": plan["label"],
        "price_monthly": plan["price"],
        "price_after_credit": round(plan["price"] / 2, 2),
        "subscriber_type": data.subscriber_type,
        "beneficiary": {**data.beneficiary, "phone": ben_phone},
        "housing": data.housing,
        "guardians": data.guardians,
        "delivery": {**data.delivery, "estimated_date": delivery_date.strftime("%d/%m/%Y")},
        "billing": data.billing,
        "signature": {"signed": False},
        "status": "pending_payment",
        "prescriber_validated": False,
        "created_at": now,
        "updated_at": now,
    }

    await db.contracts.insert_one(contract)

    # Check prescriber correlation
    prescription = await db.prescriptions.find_one({
        "beneficiary_phone": {"$regex": ben_phone[-9:]},
        "status": "pending"
    })
    if prescription:
        await db.prescriptions.update_one(
            {"_id": prescription["_id"]},
            {"$set": {"status": "contract_created", "contract_id": contract["id"], "updated_at": now}}
        )
        contract["prescriber_validated"] = True
        await db.contracts.update_one(
            {"id": contract["id"]},
            {"$set": {"prescriber_validated": True, "prescriber_id": prescription.get("prescriber_id", "")}}
        )

    return {k: v for k, v in contract.items() if k != "_id"}


# ─── Stripe Checkout ───
@router.post("/contract/checkout")
async def contract_checkout(data: ContractCheckout, request: Request):
    contract = await db.contracts.find_one({"id": data.contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    price = contract["price_monthly"]
    plan_label = contract["plan_label"]
    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/subscription?step=confirmation&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/subscription?step=payment&contract_id={data.contract_id}"

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    checkout_req = CheckoutSessionRequest(
        amount=float(price),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "contract_id": data.contract_id,
            "contract_number": contract.get("contract_number", ""),
            "plan": contract.get("plan", ""),
            "beneficiary_phone": contract.get("beneficiary", {}).get("phone", ""),
        },
        payment_methods=["card", "sepa_debit"],
    )

    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Save payment transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "contract_id": data.contract_id,
        "stripe_session_id": session.session_id,
        "amount": price,
        "currency": "eur",
        "payment_status": "pending",
        "metadata": checkout_req.metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.contracts.update_one(
        {"id": data.contract_id},
        {"$set": {"stripe_session_id": session.session_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"checkout_url": session.url, "session_id": session.session_id}


# ─── Check Payment Status ───
@router.get("/contract/payment-status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)
    now = datetime.now(timezone.utc).isoformat()

    # Update payment transaction
    tx = await db.payment_transactions.find_one({"stripe_session_id": session_id})
    if tx and tx.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"stripe_session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "updated_at": now}}
        )

    # If paid, activate contract
    if status.payment_status == "paid":
        contract = await db.contracts.find_one({"stripe_session_id": session_id})
        if contract and contract.get("status") != "active":
            await db.contracts.update_one(
                {"id": contract["id"]},
                {"$set": {"status": "active", "activated_at": now, "updated_at": now}}
            )
            # Create subscription in existing system
            ben_phone = contract.get("beneficiary", {}).get("phone", "")
            if ben_phone:
                existing_sub = await db.subscriptions.find_one({"beneficiary_phone": ben_phone, "status": "active"})
                if not existing_sub:
                    from routes.subscription_routes import normalize_phone as norm
                    beneficiary = await db.users.find_one({"phone": {"$regex": ben_phone[-9:]}}, {"_id": 0, "password_hash": 0})
                    sub = {
                        "id": str(uuid.uuid4()),
                        "beneficiary_phone": ben_phone,
                        "beneficiary_id": beneficiary["id"] if beneficiary else "",
                        "subscription_type": "care",
                        "status": "active",
                        "source": "website_contract",
                        "contract_id": contract["id"],
                        "contract_number": contract.get("contract_number", ""),
                        "created_at": now,
                        "updated_at": now,
                        "created_by": "contract_system",
                    }
                    await db.subscriptions.insert_one(sub)
                    if beneficiary:
                        await db.users.update_one(
                            {"id": beneficiary["id"]},
                            {"$set": {"subscription_type": "care", "has_subscription": True}}
                        )

            # Validate prescriber if applicable
            if contract.get("prescriber_id"):
                await db.prescriptions.update_one(
                    {"contract_id": contract["id"]},
                    {"$set": {"status": "validated", "validated_at": now}}
                )

            # Send SMS notifications
            await _send_contract_notifications(contract)

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


# ─── Sign Contract ───
@router.post("/contract/sign/{contract_id}")
async def sign_contract(contract_id: str, request: Request):
    body = await request.json()
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    now = datetime.now(timezone.utc).isoformat()
    signature = {
        "signed": True,
        "signed_at": now,
        "signer_name": body.get("signer_name", ""),
        "ip": request.client.host if request.client else "unknown",
    }

    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"signature": signature, "updated_at": now}}
    )

    return {"status": "signed", "signed_at": now}


# ─── Get Contract ───
@router.get("/contract/{contract_id}")
async def get_contract(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")
    return contract


# ─── Stripe Webhook ───
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        event = await stripe_checkout.handle_webhook(body, sig)
        now = datetime.now(timezone.utc).isoformat()

        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": event.session_id},
                {"$set": {"payment_status": "paid", "event_type": event.event_type, "updated_at": now}}
            )
            contract = await db.contracts.find_one({"stripe_session_id": event.session_id})
            if contract and contract.get("status") != "active":
                await db.contracts.update_one(
                    {"id": contract["id"]},
                    {"$set": {"status": "active", "activated_at": now, "updated_at": now}}
                )
        logger.info(f"Stripe webhook: {event.event_type} for session {event.session_id}")
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")

    return {"status": "ok"}


# ─── Get Plans (public) ───
@router.get("/plans")
async def get_plans():
    return [
        {
            "id": "bracelet",
            "name": "Bracelet Elio",
            "description": "Bracelet connecte avec teleassistance 24h/24, 7j/7. Detection de chute automatique, bouton SOS, suivi cardiaque.",
            "price": 39.90,
            "price_after_credit": 19.95,
            "includes": ["Bracelet Elio", "Teleassistance 24/7", "Detection de chute", "Bouton SOS", "Suivi cardiaque"],
        },
        {
            "id": "bracelet_gilet",
            "name": "Bracelet Elio + Gilet Elder",
            "description": "Protection complete avec bracelet et gilet airbag anti-chute. Teleassistance 24h/24, 7j/7.",
            "price": 79.90,
            "price_after_credit": 39.95,
            "includes": ["Bracelet Elio", "Gilet airbag Elder", "Teleassistance 24/7", "Detection de chute", "Protection airbag", "Bouton SOS", "Suivi cardiaque"],
        },
    ]
