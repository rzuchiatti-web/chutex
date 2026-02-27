from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid, logging, os, re, stripe

from database import db
from services.smsmode_service import send_sms

logger = logging.getLogger(__name__)
router = APIRouter()

STRIPE_SECRET = os.environ.get("STRIPE_API_KEY", "")
STRIPE_PK = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
stripe.api_key = STRIPE_SECRET

PLANS = {
    "bracelet": {"name": "Bracelet Elio — Teleassistance 24/7", "price": 3990, "display": 39.90},
    "bracelet_gilet": {"name": "Bracelet Elio + Gilet Elder — Teleassistance 24/7", "price": 7990, "display": 79.90},
}

_stripe_prices = {}


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


async def _ensure_stripe_prices():
    """Create Stripe products/prices if not exist."""
    global _stripe_prices
    if _stripe_prices:
        return _stripe_prices
    for plan_id, plan in PLANS.items():
        doc = await db.stripe_config.find_one({"plan_id": plan_id}, {"_id": 0})
        if doc and doc.get("price_id"):
            _stripe_prices[plan_id] = doc["price_id"]
        else:
            product = stripe.Product.create(name=plan["name"], metadata={"plan_id": plan_id})
            price = stripe.Price.create(
                product=product.id, unit_amount=plan["price"], currency="eur",
                recurring={"interval": "month"},
            )
            await db.stripe_config.update_one(
                {"plan_id": plan_id},
                {"$set": {"plan_id": plan_id, "product_id": product.id, "price_id": price.id}},
                upsert=True,
            )
            _stripe_prices[plan_id] = price.id
            logger.info(f"Created Stripe price {price.id} for {plan_id}")
    return _stripe_prices


# ─── Models ───
class ContractCreate(BaseModel):
    plan: str
    subscriber_type: str
    beneficiary: dict
    housing: dict
    guardians: list
    delivery: dict
    billing: dict


class SignRequest(BaseModel):
    signer_name: str


# ─── Get Stripe Publishable Key ───
@router.get("/stripe/config")
async def get_stripe_config():
    return {"publishable_key": STRIPE_PK}


# ─── Create Contract + Stripe Subscription ───
@router.post("/contract/create")
async def create_contract(data: ContractCreate):
    if data.plan not in PLANS:
        raise HTTPException(400, "Plan invalide")

    await _ensure_stripe_prices()
    plan = PLANS[data.plan]
    now = datetime.now(timezone.utc).isoformat()
    count = await db.contracts.count_documents({}) + 1
    contract_number = f"CHX-{datetime.now().year}-{count:04d}"
    ben_phone = normalize_phone(data.beneficiary.get("phone", ""))

    delivery_date = datetime.now(timezone.utc) + timedelta(days=5)
    while delivery_date.weekday() >= 5:
        delivery_date += timedelta(days=1)

    # Determine billing person info
    billing_person = data.billing.get("person", "guardian")
    billing_idx = data.billing.get("guardian_index", 0)
    if billing_person == "beneficiary":
        bill_name = f"{data.beneficiary.get('first_name', '')} {data.beneficiary.get('last_name', '')}".strip()
        bill_email = data.beneficiary.get("email", "")
        bill_phone = ben_phone
    else:
        g = data.guardians[billing_idx] if billing_idx < len(data.guardians) else data.guardians[0]
        bill_name = f"{g.get('first_name', '')} {g.get('last_name', '')}".strip()
        bill_email = g.get("email", "")
        bill_phone = g.get("phone", "")

    # Create Stripe customer
    customer = stripe.Customer.create(
        name=bill_name,
        email=bill_email or None,
        phone=bill_phone or None,
        metadata={"contract_number": contract_number, "beneficiary_phone": ben_phone},
    )

    # Create Stripe subscription (incomplete — needs payment)
    subscription = stripe.Subscription.create(
        customer=customer.id,
        items=[{"price": _stripe_prices[data.plan]}],
        payment_behavior="default_incomplete",
        payment_settings={"save_default_payment_method": "on_subscription", "payment_method_types": ["card", "sepa_debit"]},
        expand=["latest_invoice.payment_intent"],
        metadata={"contract_number": contract_number, "plan": data.plan, "beneficiary_phone": ben_phone},
    )

    client_secret = subscription.latest_invoice.payment_intent.client_secret

    contract = {
        "id": str(uuid.uuid4()),
        "contract_number": contract_number,
        "plan": data.plan,
        "plan_label": plan["name"],
        "price_monthly": plan["display"],
        "price_after_credit": round(plan["display"] / 2, 2),
        "subscriber_type": data.subscriber_type,
        "beneficiary": {**data.beneficiary, "phone": ben_phone},
        "housing": data.housing,
        "guardians": data.guardians,
        "delivery": {**data.delivery, "estimated_date": delivery_date.strftime("%d/%m/%Y")},
        "billing": data.billing,
        "signature": {"signed": False},
        "stripe_customer_id": customer.id,
        "stripe_subscription_id": subscription.id,
        "stripe_client_secret": client_secret,
        "status": "pending_payment",
        "prescriber_validated": False,
        "created_at": now,
        "updated_at": now,
    }

    await db.contracts.insert_one(contract)

    # Check prescriber correlation
    prescription = await db.prescriptions.find_one({"beneficiary_phone": {"$regex": ben_phone[-9:]}, "status": "pending"})
    if prescription:
        await db.prescriptions.update_one(
            {"_id": prescription["_id"]},
            {"$set": {"status": "contract_created", "contract_id": contract["id"], "updated_at": now}},
        )
        await db.contracts.update_one({"id": contract["id"]}, {"$set": {"prescriber_validated": True, "prescriber_id": prescription.get("prescriber_id", "")}})

    # Save payment transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "contract_id": contract["id"],
        "stripe_subscription_id": subscription.id,
        "amount": plan["display"],
        "currency": "eur",
        "payment_status": "pending",
        "created_at": now,
    })

    return {
        "id": contract["id"],
        "contract_number": contract_number,
        "plan": data.plan,
        "price_monthly": plan["display"],
        "price_after_credit": round(plan["display"] / 2, 2),
        "status": "pending_payment",
        "client_secret": client_secret,
        "subscription_id": subscription.id,
        "prescriber_validated": contract.get("prescriber_validated", False),
        "delivery_date": delivery_date.strftime("%d/%m/%Y"),
    }


# ─── Confirm Payment (after inline payment) ───
@router.post("/contract/confirm/{contract_id}")
async def confirm_contract(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    sub_id = contract.get("stripe_subscription_id", "")
    if sub_id:
        sub = stripe.Subscription.retrieve(sub_id)
        if sub.status in ("active", "trialing"):
            await _activate_contract(contract, contract_id)
            return {"status": "active", "subscription_status": sub.status}
        return {"status": contract.get("status"), "subscription_status": sub.status}

    return {"status": contract.get("status"), "subscription_status": "unknown"}


# ─── Sign Contract ───
@router.post("/contract/sign/{contract_id}")
async def sign_contract(contract_id: str, data: SignRequest):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    now = datetime.now(timezone.utc).isoformat()
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"signature": {"signed": True, "signed_at": now, "signer_name": data.signer_name}, "updated_at": now}},
    )
    return {"status": "signed", "signed_at": now}


# ─── Get Contract ───
@router.get("/contract/{contract_id}")
async def get_contract(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")
    return contract


# ─── Stripe Webhook (subscriptions) ───
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    now = datetime.now(timezone.utc).isoformat()

    try:
        event = stripe.Event.construct_from(stripe.util.convert_to_stripe_object(
            __import__('json').loads(body)
        ), stripe.api_key)
    except Exception as e:
        logger.error(f"Webhook parse error: {e}")
        return {"status": "ok"}

    etype = event.type
    data = event.data.object
    logger.info(f"Stripe webhook: {etype}")

    if etype == "invoice.payment_succeeded":
        sub_id = data.get("subscription")
        if sub_id:
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract and contract.get("status") != "active":
                await _activate_contract(contract, contract["id"])
            await db.payment_transactions.update_one(
                {"stripe_subscription_id": sub_id, "payment_status": "pending"},
                {"$set": {"payment_status": "paid", "updated_at": now}},
            )

    elif etype == "invoice.payment_failed":
        sub_id = data.get("subscription")
        if sub_id:
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract:
                attempt = data.get("attempt_count", 1)
                logger.warning(f"Payment failed for {contract.get('contract_number')} (attempt {attempt})")
                if attempt >= 3:
                    await db.contracts.update_one(
                        {"id": contract["id"]},
                        {"$set": {"status": "payment_failed", "updated_at": now}},
                    )
                    # Suspend subscription in app
                    ben_phone = contract.get("beneficiary", {}).get("phone", "")
                    if ben_phone:
                        await db.subscriptions.update_one(
                            {"beneficiary_phone": ben_phone, "status": "active"},
                            {"$set": {"status": "suspended", "suspended_reason": "payment_failed", "updated_at": now}},
                        )

    elif etype == "customer.subscription.deleted":
        sub_id = data.get("id")
        if sub_id:
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract:
                await db.contracts.update_one({"id": contract["id"]}, {"$set": {"status": "cancelled", "updated_at": now}})
                ben_phone = contract.get("beneficiary", {}).get("phone", "")
                if ben_phone:
                    await db.subscriptions.update_one(
                        {"beneficiary_phone": ben_phone, "status": {"$in": ["active", "suspended"]}},
                        {"$set": {"status": "cancelled", "updated_at": now}},
                    )

    return {"status": "ok"}


async def _activate_contract(contract: dict, contract_id: str):
    """Activate contract, create subscription, send SMS."""
    now = datetime.now(timezone.utc).isoformat()
    await db.contracts.update_one({"id": contract_id}, {"$set": {"status": "active", "activated_at": now, "updated_at": now}})

    ben_phone = contract.get("beneficiary", {}).get("phone", "")
    if ben_phone:
        existing = await db.subscriptions.find_one({"beneficiary_phone": ben_phone, "status": "active"})
        if not existing:
            beneficiary = await db.users.find_one({"phone": {"$regex": ben_phone[-9:]}}, {"_id": 0, "password_hash": 0})
            await db.subscriptions.insert_one({
                "id": str(uuid.uuid4()),
                "beneficiary_phone": ben_phone,
                "beneficiary_id": beneficiary["id"] if beneficiary else "",
                "subscription_type": "care",
                "status": "active",
                "source": "website_contract",
                "contract_id": contract_id,
                "contract_number": contract.get("contract_number", ""),
                "created_at": now, "updated_at": now, "created_by": "contract_system",
            })
            if beneficiary:
                await db.users.update_one({"id": beneficiary["id"]}, {"$set": {"subscription_type": "care", "has_subscription": True}})

    if contract.get("prescriber_id"):
        await db.prescriptions.update_one({"contract_id": contract_id}, {"$set": {"status": "validated", "validated_at": now}})

    await _send_contract_notifications(contract)


async def _send_contract_notifications(contract: dict):
    """Send SMS to beneficiary and guardians."""
    try:
        ben = contract.get("beneficiary", {})
        ben_name = f"{ben.get('first_name', '')} {ben.get('last_name', '')}".strip()
        ben_phone = ben.get("phone", "")

        if ben_phone:
            await send_sms(ben_phone, f"Bienvenue chez Chutex Care ! Votre contrat {contract.get('contract_number','')} est actif. Telechargez l'app : https://apps.apple.com/app/chutex/id6759215592")

        for g in contract.get("guardians", []):
            g_phone = g.get("phone", "")
            g_name = f"{g.get('first_name', '')} {g.get('last_name', '')}".strip()
            if g_phone:
                await send_sms(g_phone, f"Bonjour {g_name}, vous etes gardien de {ben_name} sur Chutex Care. Telechargez l'app : https://apps.apple.com/app/chutex/id6759215592")
    except Exception as e:
        logger.error(f"SMS notification error: {e}")


# ─── Get Plans (public) ───
@router.get("/plans")
async def get_plans():
    return [
        {"id": "bracelet", "name": "Bracelet Elio", "description": "Bracelet connecte avec teleassistance 24h/24, 7j/7. Detection de chute automatique, bouton SOS, suivi cardiaque.", "price": 39.90, "price_after_credit": 19.95, "includes": ["Bracelet Elio", "Teleassistance 24/7", "Detection de chute", "Bouton SOS", "Suivi cardiaque"]},
        {"id": "bracelet_gilet", "name": "Bracelet Elio + Gilet Elder", "description": "Protection complete avec bracelet et gilet airbag anti-chute. Teleassistance 24h/24, 7j/7.", "price": 79.90, "price_after_credit": 39.95, "includes": ["Bracelet Elio", "Gilet airbag Elder", "Teleassistance 24/7", "Detection de chute", "Protection airbag", "Bouton SOS", "Suivi cardiaque"]},
    ]
