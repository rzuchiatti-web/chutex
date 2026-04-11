from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid
import logging
import os
import re
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from database import db
from services.smsmode_service import send_sms

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Mollie Configuration ───
from mollie.api.client import Client as MollieClient
MOLLIE_API_KEY = os.environ.get("MOLLIE_API_KEY", "")
MOLLIE_TEST_KEY = os.environ.get("MOLLIE_TEST_KEY", "")
mollie_client = MollieClient()
mollie_client.set_api_key(MOLLIE_API_KEY or MOLLIE_TEST_KEY)

PLANS = {
    "bracelet": {"name": "Bracelet Elio — Teleassistance 24/7", "price": "39.90", "display": 39.90, "interval": "1 month"},
    "bracelet_gilet": {"name": "Bracelet Elio + Gilet Elder — Teleassistance 24/7", "price": "79.90", "display": 79.90, "interval": "1 month"},
    "bracelet_standard": {"name": "Bracelet Elio — Abonnement Standard", "price": "24.90", "display": 24.90, "interval": "1 month"},
    "bracelet_standard_annual": {"name": "Bracelet Elio — Abonnement Annuel", "price": "249.00", "display": 249.00, "interval": "12 months"},
}


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


# ─── Get Payment Config (Mollie) ───
@router.get("/stripe/config")
async def get_payment_config():
    has_key = bool(MOLLIE_API_KEY or MOLLIE_TEST_KEY)
    return {"provider": "mollie", "configured": has_key, "publishable_key": ""}


# ─── Create Contract + Stripe Subscription ───
@router.post("/contract/create")
async def create_contract(data: ContractCreate):
    if data.plan not in PLANS:
        raise HTTPException(400, "Plan invalide")

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

    # Create Mollie customer first (needed for recurring)
    try:
        customer = mollie_client.customers.create({
            "name": bill_name,
            "email": bill_email or f"{ben_phone}@chutex.care",
            "metadata": {"contract_number": contract_number, "beneficiary_phone": ben_phone},
        })
        mollie_customer_id = customer.id
    except Exception as e:
        logger.error(f"Mollie customer creation error: {e}")
        mollie_customer_id = ""

    # Create Mollie first payment (creates mandate for recurring)
    base_url = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://premium-clinic-web-1.preview.emergentagent.com")
    try:
        payment = mollie_client.payments.create({
            "amount": {"currency": "EUR", "value": plan["price"]},
            "description": f"{plan['name']} — {contract_number}",
            "redirectUrl": f"{base_url}/contract-success?contract={contract_number}",
            "webhookUrl": f"{base_url}/api/mollie/webhook",
            "method": ["creditcard", "directdebit", "bancontact", "ideal"],
            "metadata": {"contract_number": contract_number, "plan": data.plan, "beneficiary_phone": ben_phone, "interval": plan.get("interval", "1 month")},
            "sequenceType": "first",
            "customerId": mollie_customer_id,
        })
        mollie_payment_id = payment.id
        checkout_url = payment.checkout_url
    except Exception as e:
        logger.error(f"Mollie payment creation error: {e}")
        mollie_payment_id = ""
        checkout_url = ""

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
        "payment_provider": "mollie",
        "mollie_customer_id": mollie_customer_id,
        "mollie_payment_id": mollie_payment_id,
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
        "mollie_payment_id": mollie_payment_id,
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
        "payment_provider": "mollie",
        "checkout_url": checkout_url,
        "mollie_payment_id": mollie_payment_id,
        "prescriber_validated": contract.get("prescriber_validated", False),
        "delivery_date": delivery_date.strftime("%d/%m/%Y"),
    }


# ─── Confirm Payment (check Mollie payment status) ───
@router.get("/contract/confirm/{contract_id}")
@router.post("/contract/confirm/{contract_id}")
async def confirm_contract(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(404, "Contrat introuvable")

    mollie_pid = contract.get("mollie_payment_id", "")
    if mollie_pid:
        try:
            payment = mollie_client.payments.get(mollie_pid)
            if payment.is_paid():
                if contract.get("status") != "active":
                    await _activate_contract(contract, contract_id)
                return {"status": "active", "payment_status": "paid"}
            return {"status": contract.get("status"), "payment_status": payment.status}
        except Exception as e:
            logger.error(f"Mollie payment check error: {e}")

    return {"status": contract.get("status"), "payment_status": "unknown"}


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
@router.post("/mollie/webhook")
async def mollie_webhook(request: Request):
    """Handle Mollie payment status updates."""
    form = await request.form()
    payment_id = form.get("id", "")
    now = datetime.now(timezone.utc).isoformat()

    if not payment_id:
        return {"status": "ok"}

    try:
        payment = mollie_client.payments.get(payment_id)
        metadata = payment.get("metadata", {}) or {}
        contract_number = metadata.get("contract_number", "")
        logger.info(f"Mollie webhook: payment {payment_id} status={payment.status} contract={contract_number}")

        if payment.is_paid():
            contract = await db.contracts.find_one({"mollie_payment_id": payment_id})
            if contract and contract.get("status") != "active":
                # Create Mollie recurring subscription
                customer_id = contract.get("mollie_customer_id")
                if customer_id:
                    try:
                        plan_id = contract.get("plan", "bracelet")
                        plan_info = PLANS.get(plan_id, PLANS["bracelet"])
                        interval = plan_info.get("interval", "1 month")
                        sub = mollie_client.customer_subscriptions.with_parent_id(customer_id).create({
                            "amount": {"currency": "EUR", "value": plan_info["price"]},
                            "interval": interval,
                            "description": f"{plan_info['name']} — {contract.get('contract_number', '')}",
                            "webhookUrl": f"{os.environ.get('EXPO_PUBLIC_BACKEND_URL', '')}/api/mollie/webhook",
                            "metadata": {"contract_number": contract.get("contract_number"), "plan": plan_id},
                        })
                        await db.contracts.update_one(
                            {"id": contract["id"]},
                            {"$set": {"mollie_subscription_id": sub.id, "updated_at": now}},
                        )
                        logger.info(f"Mollie subscription {sub.id} created for {contract.get('contract_number')}")
                    except Exception as e:
                        logger.error(f"Mollie subscription creation error: {e}")
                await _activate_contract(contract, contract["id"])
            logger.info(f"Mollie payment {payment_id} paid for {contract_number}")

        elif payment.is_failed() or payment.is_expired() or payment.is_canceled():
            contract = await db.contracts.find_one({"mollie_payment_id": payment_id})
            if contract:
                await db.contracts.update_one(
                    {"id": contract["id"]},
                    {"$set": {"status": "payment_failed", "updated_at": now}},
                )
                logger.warning(f"Mollie payment {payment_id} {payment.status} for {contract_number}")

    except Exception as e:
        logger.error(f"Mollie webhook error: {e}")

    return {"status": "ok"}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Legacy Stripe webhook — no longer used. Payments are handled via Mollie."""
    return {"status": "ok", "message": "Stripe webhook deprecated. Use Mollie."}


async def _activate_contract(contract: dict, contract_id: str):
    """Activate contract, create subscription, send SMS. Payment via Mollie."""
    now = datetime.now(timezone.utc).isoformat()
    await db.contracts.update_one({"id": contract_id}, {"$set": {"status": "active", "activated_at": now, "updated_at": now}})

    plan_id = contract.get("plan", "")
    plan = PLANS.get(plan_id, {})
    is_care = plan_id in ("bracelet", "bracelet_gilet")

    # Internal invoice for bracelet purchase (tracked, not auto-charged via Mollie)
    if is_care:
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
                "amount_ht": 99.00,
                "tva_rate": 20.0,
                "tva_amount": 19.80,
                "amount_ttc": 118.80,
                "status": "pending",
                "beneficiary_phone": contract.get("beneficiary", {}).get("phone", ""),
                "beneficiary_name": f"{contract.get('beneficiary', {}).get('first_name', '')} {contract.get('beneficiary', {}).get('last_name', '')}".strip(),
                "created_at": now,
            }
            await db.internal_invoices.insert_one(invoice)
            logger.info(f"Bracelet invoice {invoice['invoice_number']}: 130.80EUR TTC for {contract.get('contract_number')}")

        await db.payment_transactions.update_one(
            {"contract_id": contract_id},
            {"$set": {"updated_at": now}},
        )

        # SAAD commission if prescribed
        await _process_saad_commission(contract, contract_id, now)

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
#                 SAAD COMMISSION (Mollie)
# ═══════════════════════════════════════════════════════

SAAD_COMMISSIONS = {
    "bracelet": {"subscription_fee": 50.00, "monthly_fee": 5.00},       # Téléassistance standard
    "bracelet_gilet": {"subscription_fee": 100.00, "monthly_fee": 10.00}, # Bracelet + Gilet
    "standard": {"subscription_fee": 50.00, "monthly_fee": 0},           # Standard sans téléassistance
}


@router.post("/saad/onboarding")
async def create_saad_account(request: Request):
    """Register a SAAD for commission payments via Mollie."""
    body = await request.json()
    saad_id = body.get("saad_id", "")
    company_name = body.get("company_name", "")
    email = body.get("email", "")
    iban = body.get("iban", "")
    commission_type = body.get("commission_type", "monthly")

    if not saad_id or not company_name:
        raise HTTPException(400, "saad_id et company_name requis")

    now = datetime.now(timezone.utc).isoformat()
    existing = await db.saad_accounts.find_one({"saad_id": saad_id}, {"_id": 0})
    if existing:
        await db.saad_accounts.update_one(
            {"saad_id": saad_id},
            {"$set": {"company_name": company_name, "email": email, "iban": iban, "commission_type": commission_type, "updated_at": now}},
        )
        return {"status": "updated", "saad_id": saad_id, "already_exists": True}

    await db.saad_accounts.insert_one({
        "saad_id": saad_id,
        "company_name": company_name,
        "email": email,
        "iban": iban,
        "commission_type": commission_type,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    })

    await db.users.update_one(
        {"id": saad_id},
        {"$set": {"commission_type": commission_type, "saad_registered": True}},
    )

    return {"status": "registered", "saad_id": saad_id, "commission_type": commission_type}


@router.get("/saad/status/{saad_id}")
async def get_saad_status(saad_id: str):
    """Check SAAD registration and commission status."""
    doc = await db.saad_accounts.find_one({"saad_id": saad_id}, {"_id": 0})
    if not doc:
        return {"registered": False}

    total_earned = await db.saad_commissions.find({"saad_id": saad_id, "status": "paid"}).to_list(500)
    total_pending = await db.saad_commissions.find({"saad_id": saad_id, "status": "pending"}).to_list(500)

    return {
        "registered": True,
        "company_name": doc.get("company_name", ""),
        "commission_type": "fixed",
        "commission_display": "50-100€ HT (souscription) + 5-10€ HT/mois selon type",
        "commission_rates": SAAD_COMMISSIONS,
        "status": doc.get("status", "active"),
        "total_earned": round(sum(c.get("amount", 0) for c in total_earned), 2),
        "total_pending": round(sum(c.get("amount", 0) for c in total_pending), 2),
        "commissions_count": len(total_earned) + len(total_pending),
    }


# Keep legacy route names for backward compatibility
@router.post("/saad/stripe-onboarding")
async def saad_stripe_onboarding_redirect(request: Request):
    return await create_saad_account(request)


@router.get("/saad/stripe-status/{saad_id}")
async def saad_stripe_status_redirect(saad_id: str):
    result = await get_saad_status(saad_id)
    result["has_stripe"] = result.get("registered", False)
    return result


async def _process_saad_commission(contract: dict, contract_id: str, now: str):
    """Process commission: SAAD (50€ HT souscription + 5€/mois) or Coach/Physio (50€ HT souscription)."""
    ben_phone = contract.get("beneficiary", {}).get("phone", "")
    if not ben_phone:
        return

    prescription = await db.prescriptions.find_one({
        "beneficiary_phone": {"$regex": ben_phone[-9:]},
        "status": {"$in": ["pending", "contract_created", "validated"]},
    })
    if not prescription:
        return

    prescriber_id = prescription.get("prescriber_id") or prescription.get("guardian_id", "")
    if not prescriber_id:
        return

    prescriber = await db.users.find_one({"id": prescriber_id}, {"_id": 0})
    if not prescriber:
        return

    pro_type = prescriber.get("professional_type", "")
    is_coach_physio = pro_type in ("coach", "physio")

    # Determine SAAD or direct pro
    saad_id = prescriber.get("company_id") or prescriber.get("prescriber_company_id")
    saad_account = None
    if saad_id:
        saad_account = await db.saad_accounts.find_one({"saad_id": saad_id, "status": "active"}, {"_id": 0})

    # For coach/physio without SAAD, use their own ID as commission recipient
    if not saad_account and is_coach_physio:
        recipient_id = prescriber_id
        recipient_name = prescriber.get("name", "")
    elif saad_account:
        recipient_id = saad_id
        recipient_name = saad_account.get("company_name", "")
    else:
        logger.info(f"No commission recipient for prescriber {prescriber_id}, skipping")
        return

    base_url = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "")

    # ── 1. Subscription fee based on subscription type ──
    sub_type = contract.get("subscription_type") or prescription.get("subscription_type", "bracelet")
    comm_tier = SAAD_COMMISSIONS.get(sub_type, SAAD_COMMISSIONS["bracelet"])
    existing_sub_fee = await db.saad_commissions.find_one({
        "contract_id": contract_id, "saad_id": recipient_id, "commission_type": "subscription_fee"
    })
    if not existing_sub_fee:
        sub_fee_id = str(uuid.uuid4())
        sub_amount = comm_tier["subscription_fee"]
        mollie_sub_id = ""
        try:
            payment = mollie_client.payments.create({
                "amount": {"currency": "EUR", "value": f"{sub_amount:.2f}"},
                "description": f"Commission souscription {'pro' if is_coach_physio else 'SAAD'} - {contract.get('contract_number', '')}",
                "webhookUrl": f"{base_url}/api/mollie/webhook-commission",
                "metadata": {"commission_id": sub_fee_id, "contract_id": contract_id, "saad_id": recipient_id, "type": "subscription_fee"},
                "method": ["banktransfer"],
            })
            mollie_sub_id = payment.id
            logger.info(f"Mollie subscription fee {payment.id}: {sub_amount}EUR to {recipient_name}")
        except Exception as e:
            logger.error(f"Mollie subscription fee failed: {e}")

        await db.saad_commissions.insert_one({
            "id": sub_fee_id,
            "contract_id": contract_id,
            "contract_number": contract.get("contract_number", ""),
            "saad_id": recipient_id,
            "saad_name": recipient_name,
            "prescriber_id": prescriber_id,
            "commission_type": "subscription_fee",
            "recipient_type": "pro" if is_coach_physio else "saad",
            "amount": sub_amount,
            "mollie_payment_id": mollie_sub_id,
            "status": "pending" if mollie_sub_id else "manual",
            "description": "Commission souscription (50€ HT)",
            "created_at": now,
        })

    # ── 2. Monthly fee based on subscription type (SAAD only, not coach/physio) ──
    if saad_account and not is_coach_physio and comm_tier["monthly_fee"] > 0:
        monthly_id = str(uuid.uuid4())
        monthly_amount = comm_tier["monthly_fee"]
        mollie_monthly_id = ""
        try:
            payment = mollie_client.payments.create({
                "amount": {"currency": "EUR", "value": f"{monthly_amount:.2f}"},
                "description": f"Commission mensuelle SAAD - {contract.get('contract_number', '')}",
                "webhookUrl": f"{base_url}/api/mollie/webhook-commission",
                "metadata": {"commission_id": monthly_id, "contract_id": contract_id, "saad_id": recipient_id, "type": "monthly_fee"},
                "method": ["banktransfer"],
            })
            mollie_monthly_id = payment.id
        except Exception as e:
            logger.error(f"Mollie monthly fee failed: {e}")

        await db.saad_commissions.insert_one({
            "id": monthly_id,
            "contract_id": contract_id,
            "contract_number": contract.get("contract_number", ""),
            "saad_id": recipient_id,
            "saad_name": recipient_name,
            "prescriber_id": prescriber_id,
            "commission_type": "monthly_fee",
            "recipient_type": "saad",
            "amount": monthly_amount,
            "mollie_payment_id": mollie_monthly_id,
            "status": "pending" if mollie_monthly_id else "manual",
            "description": "Commission mensuelle (5€ HT/mois)",
            "created_at": now,
        })

    logger.info(f"Commission processed: {recipient_name} ({('pro' if is_coach_physio else 'saad')}) — contract {contract.get('contract_number')}")


@router.post("/mollie/webhook-commission")
async def mollie_commission_webhook(request: Request):
    """Handle Mollie webhook for SAAD commission payments."""
    form = await request.form()
    payment_id = form.get("id", "")
    now = datetime.now(timezone.utc).isoformat()

    if not payment_id:
        return {"status": "ok"}

    try:
        payment = mollie_client.payments.get(payment_id)
        metadata = payment.get("metadata", {}) or {}
        commission_id = metadata.get("commission_id", "")

        if payment.is_paid() and commission_id:
            await db.saad_commissions.update_one(
                {"id": commission_id},
                {"$set": {"status": "paid", "paid_at": now, "mollie_status": "paid"}},
            )
            logger.info(f"SAAD commission {commission_id} paid via Mollie")

        elif payment.is_failed() or payment.is_expired():
            if commission_id:
                await db.saad_commissions.update_one(
                    {"id": commission_id},
                    {"$set": {"status": "failed", "mollie_status": payment.status, "updated_at": now}},
                )

    except Exception as e:
        logger.error(f"Mollie commission webhook error: {e}")

    return {"status": "ok"}


# ─── Admin: SAAD commissions overview ───
@router.get("/admin/saad-commissions")
async def get_saad_commissions():
    """Get all SAAD commissions."""
    commissions = await db.saad_commissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total = sum(c.get("amount", 0) for c in commissions)
    paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")
    return {"commissions": commissions, "total": round(total, 2), "paid": round(paid, 2), "pending": round(pending, 2), "count": len(commissions)}
