from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid
import logging
import os
import re
import stripe
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from database import db
from services.smsmode_service import send_sms

logger = logging.getLogger(__name__)
router = APIRouter()

STRIPE_SECRET = os.environ.get("STRIPE_API_KEY", "")
STRIPE_PK = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_CARE_ACCOUNT = os.environ.get("STRIPE_CONNECT_CHUTEX_CARE_ID", "")
stripe.api_key = STRIPE_SECRET

PLANS = {
    "bracelet": {"name": "Bracelet Elio — Teleassistance 24/7", "price": 3990, "display": 39.90, "chutex_fee": 500},
    "bracelet_gilet": {"name": "Bracelet Elio + Gilet Elder — Teleassistance 24/7", "price": 7990, "display": 79.90, "chutex_fee": 500},
    "bracelet_standard": {"name": "Bracelet Elio — Abonnement Standard", "price": 2490, "display": 24.90, "chutex_fee": 2490},
    "bracelet_standard_annual": {"name": "Bracelet Elio — Abonnement Annuel", "price": 24900, "display": 249.00, "chutex_fee": 24900, "interval": "year"},
}

_stripe_prices = {}


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


def _draw_wrapped_text(pdf: canvas.Canvas, text: str, x: float, y: float, max_width: float, line_height: float = 14):
    current_y = y
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            current_y -= line_height
            continue
        line = ""
        for word in words:
            candidate = f"{line} {word}".strip()
            if pdf.stringWidth(candidate, "Helvetica", 10) <= max_width:
                line = candidate
            else:
                pdf.drawString(x, current_y, line)
                current_y -= line_height
                line = word
        if line:
            pdf.drawString(x, current_y, line)
            current_y -= line_height
    return current_y


def _build_contract_pdf_bytes(contract: dict | None = None) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    left = 42
    top = height - 52

    pdf.setTitle("Contrat Chutex Care")
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(left, top, "Contrat de teleassistance Chutex Care")

    pdf.setFont("Helvetica", 10)
    top -= 24
    generated_on = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
    pdf.drawString(left, top, f"Document genere le {generated_on}")

    if contract:
        top -= 18
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left, top, "Informations du contrat")
        pdf.setFont("Helvetica", 10)
        top -= 14
        beneficiary = contract.get("beneficiary", {})
        guardians = contract.get("guardians", [])
        billing = contract.get("billing", {})
        details = [
            f"Numero de contrat : {contract.get('contract_number', '-')}",
            f"Formule : {contract.get('plan_label', contract.get('plan', '-'))}",
            f"Prix mensuel : {contract.get('price_monthly', '-')} EUR",
            f"Beneficiaire : {beneficiary.get('first_name', '')} {beneficiary.get('last_name', '')}".strip(),
            f"Telephone beneficiaire : {beneficiary.get('phone', '-')}",
            f"Adresse beneficiaire : {beneficiary.get('address', '')} {beneficiary.get('postal_code', '')} {beneficiary.get('city', '')}".strip(),
            f"Nombre de gardiens designes : {len(guardians)}",
            f"Facturation : {billing.get('person', 'guardian')}",
            f"Statut : {contract.get('status', '-')}",
        ]
        for line in details:
            if top < 110:
                pdf.showPage()
                top = height - 60
                pdf.setFont("Helvetica", 10)
            pdf.drawString(left, top, line)
            top -= 14

    terms = """Article 1 - Objet
Le present contrat encadre la mise a disposition du service Chutex Care de teleassistance 24/7 et des equipements connectes associes.

Article 2 - Duree et resiliation
Le contrat est sans engagement et peut etre resilie par l'une ou l'autre des parties avec preavis de 30 jours.

Article 3 - Service
Le service comprend la gestion des alertes, la tentative de contact, puis l'alerte des proches et/ou des secours en cas de besoin.

Article 4 - Equipements
Les equipements fournis restent la propriete de Chutex Innovation et doivent etre utilises conformement aux consignes.

Article 5 - Donnees
Les donnees personnelles et de sante sont traitees selon le RGPD et strictement pour la fourniture du service.

Article 6 - Limitation de responsabilite
Chutex Innovation met en oeuvre tous les moyens raisonnables de continuite de service, hors cas de force majeure."""

    if top < 180:
        pdf.showPage()
        top = height - 60

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(left, top, "Conditions essentielles")
    top -= 16
    pdf.setFont("Helvetica", 10)
    top = _draw_wrapped_text(pdf, terms, left, top, width - (left * 2), 14)

    if contract and contract.get("signature", {}).get("signed"):
        if top < 100:
            pdf.showPage()
            top = height - 70
        signature = contract.get("signature", {})
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left, top, "Signature")
        top -= 14
        pdf.setFont("Helvetica", 10)
        pdf.drawString(left, top, f"Signe par : {signature.get('signer_name', '-')}")
        top -= 14
        pdf.drawString(left, top, f"Date de signature : {signature.get('signed_at', '-')}")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()


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
            interval = plan.get("interval", "month")
            price = stripe.Price.create(
                product=product.id, unit_amount=plan["price"], currency="eur",
                recurring={"interval": interval},
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
    ben_phone = normalize_phone(data.beneficiary.get("phone", ""))
    phone_suffix = ben_phone[-9:] if len(ben_phone) >= 9 else ben_phone

    # Check: already has an active subscription?
    if phone_suffix:
        existing_sub = await db.subscriptions.find_one(
            {"beneficiary_phone": {"$regex": phone_suffix}, "status": "active"}, {"_id": 0}
        )
        if existing_sub:
            raise HTTPException(400, "Ce numero a deja un abonnement actif.")

        existing_active = await db.contracts.find_one(
            {"beneficiary.phone": {"$regex": phone_suffix}, "status": "active"}, {"_id": 0}
        )
        if existing_active:
            raise HTTPException(400, "Un contrat actif existe deja pour ce numero.")

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
        expand=["latest_invoice"],
        metadata={"contract_number": contract_number, "plan": data.plan, "beneficiary_phone": ben_phone},
    )

    # Get client_secret: retrieve invoice then its payment intent
    client_secret = ""
    inv = subscription.latest_invoice
    if inv:
        inv_obj = stripe.Invoice.retrieve(inv.id, expand=["payments"])
        if inv_obj.payments and inv_obj.payments.data:
            pi_id = inv_obj.payments.data[0].payment.payment_intent
            if pi_id:
                pi = stripe.PaymentIntent.retrieve(pi_id)
                client_secret = pi.client_secret

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
@router.get("/contract/confirm/{contract_id}")
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


@router.get("/contract/template/pdf")
async def get_contract_template_pdf():
    pdf_bytes = _build_contract_pdf_bytes(None)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="contrat-chutex-template.pdf"'},
    )


@router.get("/contract/{contract_id}/pdf")
async def get_contract_pdf(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    pdf_bytes = _build_contract_pdf_bytes(contract)
    safe_number = contract.get("contract_number", contract_id)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="contrat-{safe_number}.pdf"'},
    )


# ─── Stripe Webhook (subscriptions + contracts) ───
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
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
            # Handle contracts collection
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract and contract.get("status") != "active":
                await _activate_contract(contract, contract["id"])
            await db.payment_transactions.update_one(
                {"stripe_subscription_id": sub_id, "payment_status": "pending"},
                {"$set": {"payment_status": "paid", "updated_at": now}},
            )
            # Handle subscriptions collection (Shopify/direct)
            app_sub = await db.subscriptions.find_one({"stripe_subscription_id": sub_id})
            if app_sub and app_sub.get("status") != "active":
                await db.subscriptions.update_one(
                    {"id": app_sub["id"]},
                    {"$set": {"status": "active", "updated_at": now}},
                )
                # Update user record
                if app_sub.get("beneficiary_id"):
                    await db.users.update_one(
                        {"id": app_sub["beneficiary_id"]},
                        {"$set": {"has_subscription": True, "subscription_type": app_sub.get("subscription_type", "bracelet_only")}},
                    )
                logger.info(f"Subscription {app_sub['id']} reactivated via payment success")

    elif etype == "invoice.payment_failed":
        sub_id = data.get("subscription")
        if sub_id:
            attempt = data.get("attempt_count", 1)
            # Handle contracts collection
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract:
                logger.warning(f"Payment failed for {contract.get('contract_number')} (attempt {attempt})")
                if attempt >= 3:
                    await db.contracts.update_one(
                        {"id": contract["id"]},
                        {"$set": {"status": "payment_failed", "updated_at": now}},
                    )
                    ben_phone = contract.get("beneficiary", {}).get("phone", "")
                    if ben_phone:
                        await db.subscriptions.update_one(
                            {"beneficiary_phone": ben_phone, "status": "active"},
                            {"$set": {"status": "suspended", "suspended_reason": "payment_failed", "updated_at": now}},
                        )
            # Handle subscriptions collection (Shopify/direct)
            app_sub = await db.subscriptions.find_one({"stripe_subscription_id": sub_id, "status": "active"})
            if app_sub and attempt >= 3:
                await db.subscriptions.update_one(
                    {"id": app_sub["id"]},
                    {"$set": {"status": "suspended", "suspended_reason": "payment_failed", "updated_at": now}},
                )
                if app_sub.get("beneficiary_id"):
                    await db.users.update_one(
                        {"id": app_sub["beneficiary_id"]},
                        {"$set": {"has_subscription": False}},
                    )
                logger.warning(f"Subscription {app_sub['id']} suspended after {attempt} failed payments")

    elif etype == "customer.subscription.deleted":
        sub_id = data.get("id")
        if sub_id:
            # Handle contracts collection
            contract = await db.contracts.find_one({"stripe_subscription_id": sub_id})
            if contract:
                await db.contracts.update_one({"id": contract["id"]}, {"$set": {"status": "cancelled", "updated_at": now}})
                ben_phone = contract.get("beneficiary", {}).get("phone", "")
                if ben_phone:
                    await db.subscriptions.update_one(
                        {"beneficiary_phone": ben_phone, "status": {"$in": ["active", "suspended"]}},
                        {"$set": {"status": "cancelled", "cancelled_at": now, "updated_at": now}},
                    )
            # Handle subscriptions collection (Shopify/direct)
            app_sub = await db.subscriptions.find_one({"stripe_subscription_id": sub_id, "status": {"$in": ["active", "suspended"]}})
            if app_sub:
                await db.subscriptions.update_one(
                    {"id": app_sub["id"]},
                    {"$set": {"status": "cancelled", "cancelled_at": now, "updated_at": now}},
                )
                if app_sub.get("beneficiary_id"):
                    await db.users.update_one(
                        {"id": app_sub["beneficiary_id"]},
                        {"$set": {"has_subscription": False, "subscription_type": "none"}},
                    )
                logger.info(f"Subscription {app_sub['id']} cancelled via Stripe webhook")

    elif etype == "customer.subscription.updated":
        sub_id = data.get("id")
        status = data.get("status")  # active, past_due, canceled, unpaid
        if sub_id:
            app_sub = await db.subscriptions.find_one({"stripe_subscription_id": sub_id})
            if app_sub:
                new_status = "active" if status == "active" else "suspended" if status in ("past_due", "unpaid") else "cancelled" if status == "canceled" else app_sub.get("status")
                await db.subscriptions.update_one(
                    {"id": app_sub["id"]},
                    {"$set": {"status": new_status, "updated_at": now}},
                )
                if app_sub.get("beneficiary_id"):
                    await db.users.update_one(
                        {"id": app_sub["beneficiary_id"]},
                        {"$set": {"has_subscription": new_status == "active", "subscription_type": app_sub.get("subscription_type") if new_status == "active" else "none"}},
                    )
                logger.info(f"Subscription {app_sub['id']} updated to {new_status} via Stripe")

    return {"status": "ok"}


async def _activate_contract(contract: dict, contract_id: str):
    """Activate contract, create subscription, transfer to Chutex Care, send SMS."""
    now = datetime.now(timezone.utc).isoformat()
    await db.contracts.update_one({"id": contract_id}, {"$set": {"status": "active", "activated_at": now, "updated_at": now}})

    plan_id = contract.get("plan", "")
    plan = PLANS.get(plan_id, {})
    is_care = plan_id in ("bracelet", "bracelet_gilet")

    # Stripe Connect: transfer to Chutex Care for Care plans
    if is_care and STRIPE_CARE_ACCOUNT:
        transfer_amount = plan.get("price", 0) - plan.get("chutex_fee", 500)

        # Always transfer full monthly amount to Chutex Care
        if transfer_amount > 0:
            try:
                transfer = stripe.Transfer.create(
                    amount=transfer_amount,
                    currency="eur",
                    destination=STRIPE_CARE_ACCOUNT,
                    description=f"Care {contract.get('contract_number', '')} - monthly",
                    metadata={"contract_id": contract_id, "plan": plan_id},
                )
                logger.info(f"Transfer {transfer.id}: {transfer_amount/100}EUR to Chutex Care")
            except Exception as e:
                logger.error(f"Transfer to Chutex Care failed: {e}")

        # Auto-charge Chutex Care for bracelet (130.80€ TTC) via Stripe Connect
        existing_invoice = await db.internal_invoices.find_one({"contract_id": contract_id, "type": "bracelet_purchase"})
        if not existing_invoice:
            inv_count = await db.internal_invoices.count_documents({}) + 1
            invoice = {
                "id": str(uuid.uuid4()),
                "invoice_number": f"CHUTEX-FAC-{datetime.now().year}-{inv_count:04d}",
                "type": "bracelet_purchase",
                "contract_id": contract_id,
                "contract_number": contract.get("contract_number", ""),
                "from_entity": "Chutex",
                "to_entity": "Chutex Care",
                "description": f"Achat bracelet Elio - Contrat {contract.get('contract_number', '')}",
                "amount_ht": 109.00,
                "tva_rate": 20.0,
                "tva_amount": 21.80,
                "amount_ttc": 130.80,
                "status": "pending",
                "beneficiary_phone": contract.get("beneficiary", {}).get("phone", ""),
                "beneficiary_name": f"{contract.get('beneficiary', {}).get('first_name', '')} {contract.get('beneficiary', {}).get('last_name', '')}".strip(),
                "created_at": now,
            }
            # Auto-charge Chutex Care via Stripe Connect (reverse transfer)
            try:
                charge = stripe.Charge.create(
                    amount=13080,  # 130.80€ TTC
                    currency="eur",
                    source=STRIPE_CARE_ACCOUNT,
                    description=f"Achat bracelet Elio - {contract.get('contract_number', '')}",
                    metadata={"invoice_id": invoice["id"], "contract_id": contract_id, "type": "bracelet_purchase"},
                )
                invoice["status"] = "paid"
                invoice["paid_at"] = now
                invoice["stripe_charge_id"] = charge.id
                logger.info(f"Bracelet auto-charged: {charge.id} - 130.80EUR from Chutex Care")
            except Exception as e:
                logger.warning(f"Bracelet auto-charge failed (will invoice manually): {e}")

            await db.internal_invoices.insert_one(invoice)
            logger.info(f"Bracelet invoice {invoice['invoice_number']}: 130.80EUR TTC for {contract.get('contract_number')}")

        # SAAD commission if prescribed
        await _process_saad_commission(contract, contract_id, now)

        await db.payment_transactions.update_one(
            {"contract_id": contract_id},
            {"$set": {"transfer_amount": transfer_amount / 100, "chutex_fee": plan.get("chutex_fee", 500) / 100, "updated_at": now}},
        )

    # Create/update subscription in app
    ben_phone = contract.get("beneficiary", {}).get("phone", "")
    sub_type = "care" if is_care else "standard"
    if ben_phone:
        existing = await db.subscriptions.find_one({"beneficiary_phone": ben_phone, "status": "active"})
        if not existing:
            beneficiary = await db.users.find_one({"phone": {"$regex": ben_phone[-9:]}}, {"_id": 0, "password_hash": 0})
            await db.subscriptions.insert_one({
                "id": str(uuid.uuid4()),
                "beneficiary_phone": ben_phone,
                "beneficiary_id": beneficiary["id"] if beneficiary else "",
                "subscription_type": sub_type,
                "status": "active",
                "source": "website_contract",
                "contract_id": contract_id,
                "contract_number": contract.get("contract_number", ""),
                "created_at": now, "updated_at": now, "created_by": "contract_system",
            })
            if beneficiary:
                await db.users.update_one({"id": beneficiary["id"]}, {"$set": {"subscription_type": sub_type, "has_subscription": True}})

    if contract.get("prescriber_id"):
        await db.prescriptions.update_one({"contract_id": contract_id}, {"$set": {"status": "validated", "validated_at": now}})
    else:
        # Also check by beneficiary phone
        await db.prescriptions.update_one(
            {"beneficiary_phone": {"$regex": ben_phone[-9:]}, "status": {"$in": ["pending", "contract_created"]}},
            {"$set": {"status": "validated", "validated_at": now, "contract_id": contract_id}}
        )

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



# ─── Internal Invoices (admin) ───
@router.get("/admin/internal-invoices")
async def get_internal_invoices(request: Request):
    """Get all internal invoices (Chutex ↔ Chutex Care)."""
    invoices = await db.internal_invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total_pending = sum(i.get("amount_ttc", 0) for i in invoices if i.get("status") == "pending")
    total_paid = sum(i.get("amount_ttc", 0) for i in invoices if i.get("status") == "paid")
    return {
        "invoices": invoices,
        "summary": {
            "total_pending": round(total_pending, 2),
            "total_paid": round(total_paid, 2),
            "count": len(invoices),
        },
    }


@router.post("/admin/internal-invoices/{invoice_id}/mark-paid")
async def mark_invoice_paid(invoice_id: str):
    """Mark an internal invoice as paid."""
    now = datetime.now(timezone.utc).isoformat()
    result = await db.internal_invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": "paid", "paid_at": now}},
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Facture introuvable")
    return {"status": "paid", "paid_at": now}



# ═══════════════════════════════════════════════════════
#                 SAAD STRIPE CONNECT
# ═══════════════════════════════════════════════════════

@router.post("/saad/stripe-onboarding")
async def create_saad_stripe_account(request: Request):
    """Create Stripe Connect account for a SAAD entity and return onboarding link."""
    body = await request.json()
    saad_id = body.get("saad_id", "")
    company_name = body.get("company_name", "")
    email = body.get("email", "")
    commission_type = body.get("commission_type", "monthly")  # "oneshot" (100€) or "monthly" (8€/mois)

    if not saad_id or not company_name:
        raise HTTPException(400, "saad_id et company_name requis")

    # Check if already has Stripe account
    existing = await db.saad_stripe.find_one({"saad_id": saad_id}, {"_id": 0})
    if existing and existing.get("account_id"):
        # Regenerate onboarding link
        link = stripe.AccountLink.create(
            account=existing["account_id"],
            refresh_url=body.get("refresh_url", "https://chutex-care-hub.preview.emergentagent.com"),
            return_url=body.get("return_url", "https://chutex-care-hub.preview.emergentagent.com"),
            type="account_onboarding",
        )
        return {"account_id": existing["account_id"], "onboarding_url": link.url, "already_exists": True}

    # Create new Express account
    account = stripe.Account.create(
        type="express",
        country="FR",
        email=email or None,
        business_type="company",
        company={"name": company_name},
        capabilities={"card_payments": {"requested": True}, "transfers": {"requested": True}},
        metadata={"saad_id": saad_id, "entity": "saad", "commission_type": commission_type},
    )

    link = stripe.AccountLink.create(
        account=account.id,
        refresh_url=body.get("refresh_url", "https://chutex-care-hub.preview.emergentagent.com"),
        return_url=body.get("return_url", "https://chutex-care-hub.preview.emergentagent.com"),
        type="account_onboarding",
    )

    now = datetime.now(timezone.utc).isoformat()
    await db.saad_stripe.update_one(
        {"saad_id": saad_id},
        {"$set": {
            "saad_id": saad_id,
            "account_id": account.id,
            "company_name": company_name,
            "email": email,
            "commission_type": commission_type,  # "oneshot" = 100€ one-time, "monthly" = 8€/month
            "commission_amount": 10000 if commission_type == "oneshot" else 800,  # in cents
            "status": "onboarding",
            "created_at": now,
        }},
        upsert=True,
    )

    # Update the company/saad record
    await db.users.update_one(
        {"id": saad_id},
        {"$set": {"stripe_account_id": account.id, "commission_type": commission_type}},
    )

    return {"account_id": account.id, "onboarding_url": link.url}


@router.get("/saad/stripe-status/{saad_id}")
async def get_saad_stripe_status(saad_id: str):
    """Check if SAAD has completed Stripe onboarding."""
    doc = await db.saad_stripe.find_one({"saad_id": saad_id}, {"_id": 0})
    if not doc:
        return {"has_stripe": False}

    acct = stripe.Account.retrieve(doc["account_id"])
    status = "active" if acct.charges_enabled and acct.payouts_enabled else "onboarding"
    if status != doc.get("status"):
        await db.saad_stripe.update_one({"saad_id": saad_id}, {"$set": {"status": status}})

    return {
        "has_stripe": True,
        "account_id": doc["account_id"],
        "status": status,
        "charges_enabled": acct.charges_enabled,
        "payouts_enabled": acct.payouts_enabled,
        "commission_type": doc.get("commission_type", "monthly"),
        "commission_display": "100 EUR (unique)" if doc.get("commission_type") == "oneshot" else "8 EUR/mois",
    }


# ─── SAAD Commission Processing ───
async def _process_saad_commission(contract: dict, contract_id: str, now: str):
    """Auto-send commission to SAAD when a prescribed contract is activated."""
    ben_phone = contract.get("beneficiary", {}).get("phone", "")
    if not ben_phone:
        return

    # Find prescription matching this beneficiary
    prescription = await db.prescriptions.find_one({
        "beneficiary_phone": {"$regex": ben_phone[-9:]},
        "status": {"$in": ["pending", "contract_created", "validated"]},
    })
    if not prescription:
        return

    prescriber_id = prescription.get("prescriber_id", "")
    if not prescriber_id:
        return

    # Find the prescriber's SAAD
    prescriber = await db.users.find_one({"id": prescriber_id}, {"_id": 0})
    if not prescriber:
        return

    # The prescriber might be a guardian linked to a SAAD, or a SAAD directly
    saad_id = prescriber.get("company_id") or prescriber.get("id")
    saad_stripe = await db.saad_stripe.find_one({"saad_id": saad_id, "status": "active"}, {"_id": 0})
    if not saad_stripe:
        logger.info(f"No active SAAD Stripe account for prescriber {prescriber_id}, skipping commission")
        return

    commission_type = saad_stripe.get("commission_type", "monthly")
    # Commission depends on plan AND commission type
    plan_id = contract.get("plan", "bracelet")
    if commission_type == "oneshot":
        commission_amount = 20000 if plan_id == "bracelet_gilet" else 10000  # 200€ or 100€
    else:
        commission_amount = 1500 if plan_id == "bracelet_gilet" else 800  # 15€ or 8€
    account_id = saad_stripe["account_id"]

    # Check if commission already sent for this contract
    existing_commission = await db.saad_commissions.find_one({"contract_id": contract_id, "saad_id": saad_id})
    if existing_commission and commission_type == "oneshot":
        return  # Already paid one-shot

    try:
        # Commission paid by Chutex Care (connected account) to SAAD
        # Use Stripe Transfer from platform, funded by Chutex Care's balance
        transfer = stripe.Transfer.create(
            amount=commission_amount,
            currency="eur",
            destination=account_id,
            description=f"Commission SAAD {'unique' if commission_type == 'oneshot' else 'mensuelle'} - {contract.get('contract_number', '')}",
            metadata={"contract_id": contract_id, "saad_id": saad_id, "type": f"saad_commission_{commission_type}", "paid_by": "chutex_care"},
        )

        await db.saad_commissions.insert_one({
            "id": str(uuid.uuid4()),
            "contract_id": contract_id,
            "contract_number": contract.get("contract_number", ""),
            "saad_id": saad_id,
            "saad_name": saad_stripe.get("company_name", ""),
            "prescriber_id": prescriber_id,
            "commission_type": commission_type,
            "amount": commission_amount / 100,
            "stripe_transfer_id": transfer.id,
            "status": "paid",
            "created_at": now,
        })

        logger.info(f"SAAD commission: {commission_amount/100}EUR ({commission_type}) to {saad_stripe.get('company_name')} for {contract.get('contract_number')}")
    except Exception as e:
        logger.error(f"SAAD commission transfer failed: {e}")


# ─── Admin: SAAD commissions overview ───
@router.get("/admin/saad-commissions")
async def get_saad_commissions():
    """Get all SAAD commissions."""
    commissions = await db.saad_commissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total = sum(c.get("amount", 0) for c in commissions)
    return {"commissions": commissions, "total": round(total, 2), "count": len(commissions)}
