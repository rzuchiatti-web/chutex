"""
Phase 4: Abonnements Sport/Physio
Phase 5: Paiements Mollie
Phase 6: Messagerie Pro <-> Beneficiaire
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from database import db
from auth import get_current_user
import uuid, os, logging

router = APIRouter()
logger = logging.getLogger(__name__)

def require_pro(user):
    """Check user is a professional (coach or physio) - either by role or professional_type"""
    pro_type = user.get('professional_type', '')
    role = user.get('active_role') or user.get('role', '')
    if pro_type in ('coach', 'physio') or role == 'professional':
        return
    raise HTTPException(status_code=403, detail="Acces reserve aux professionnels")


# ══════════════════════════════════════
# PHASE 4 — Abonnements Sport / Physio
# ══════════════════════════════════════

SUBSCRIPTION_PRICE_TTC = 89.00
SUBSCRIPTION_PRICE_HT = 45.00
PLATFORM_COMMISSION = SUBSCRIPTION_PRICE_TTC - SUBSCRIPTION_PRICE_HT  # 44€

class SubscriptionProposal(BaseModel):
    type: str = "sport"  # sport / physio
    description: str = ""

@router.post("/pro/subscriptions/{beneficiary_id}")
async def propose_subscription(beneficiary_id: str, data: SubscriptionProposal, user=Depends(get_current_user)):
    """Pro proposes a subscription to a beneficiary"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    if beneficiary_id not in cu.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Beneficiaire non rattache")
    if data.type not in ("sport", "physio"):
        raise HTTPException(status_code=400, detail="Type doit etre sport ou physio")
    # Check no active sub already
    existing = await db.pro_subscriptions.find_one({
        "beneficiary_id": beneficiary_id, "professional_id": user['id'],
        "status": {"$in": ["pending", "active", "payment_pending"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Un abonnement existe deja pour ce patient")
    sub = {
        "id": str(uuid.uuid4()),
        "professional_id": user['id'],
        "professional_name": cu.get('name', ''),
        "professional_type": cu.get('professional_type', 'coach'),
        "beneficiary_id": beneficiary_id,
        "type": data.type,
        "description": data.description,
        "price_ttc": SUBSCRIPTION_PRICE_TTC,
        "price_ht": SUBSCRIPTION_PRICE_HT,
        "commission": PLATFORM_COMMISSION,
        "status": "pending",  # pending -> payment_pending -> active -> cancelled/expired
        "mollie_customer_id": None,
        "mollie_payment_id": None,
        "mollie_subscription_id": None,
        "start_date": None,
        "end_date": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_subscriptions.insert_one(sub)
    sub.pop('_id', None)
    return sub

@router.get("/pro/subscriptions/{beneficiary_id}")
async def get_subscription(beneficiary_id: str, user=Depends(get_current_user)):
    """Get subscription status for a beneficiary (pro or beneficiary can call)"""
    sub = await db.pro_subscriptions.find_one({
        "beneficiary_id": beneficiary_id,
        "status": {"$in": ["pending", "payment_pending", "active"]}
    }, {"_id": 0})
    return sub or {}

@router.get("/pro/my-subscription")
async def get_my_subscription(user=Depends(get_current_user)):
    """Beneficiary gets their active/pending subscription"""
    sub = await db.pro_subscriptions.find_one({
        "beneficiary_id": user['id'],
        "status": {"$in": ["pending", "payment_pending", "active"]}
    }, {"_id": 0})
    return sub or {}

@router.post("/pro/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(subscription_id: str, user=Depends(get_current_user)):
    """Cancel a subscription (pro or beneficiary)"""
    sub = await db.pro_subscriptions.find_one({"id": subscription_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement non trouve")
    if sub['professional_id'] != user['id'] and sub['beneficiary_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Non autorise")
    # Cancel Mollie subscription if active
    if sub.get('mollie_subscription_id') and sub.get('mollie_customer_id'):
        try:
            from mollie.api.client import Client
            mollie = Client()
            mollie.set_api_key(os.environ.get('MOLLIE_TEST_KEY', ''))
            mollie.customer_subscriptions.delete_for_id(sub['mollie_customer_id'], sub['mollie_subscription_id'])
        except Exception as e:
            logger.warning(f"Mollie cancel error: {e}")
    await db.pro_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {"status": "cancelled", "end_date": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "cancelled"}

@router.get("/pro/all-subscriptions")
async def list_pro_subscriptions(user=Depends(get_current_user)):
    """Pro lists all their subscriptions"""
    require_pro(user)
    subs = await db.pro_subscriptions.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return subs


# ══════════════════════════════════════
# PHASE 5 — Paiements Mollie
# ══════════════════════════════════════

def get_mollie_client():
    from mollie.api.client import Client
    mollie = Client()
    mollie.set_api_key(os.environ.get('MOLLIE_TEST_KEY', ''))
    return mollie

def get_base_url():
    return os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://health-graphs-mvp.preview.emergentagent.com')

@router.post("/pro/subscriptions/{subscription_id}/accept")
async def accept_subscription(subscription_id: str, user=Depends(get_current_user)):
    """Beneficiary accepts a subscription → creates Mollie payment"""
    sub = await db.pro_subscriptions.find_one({"id": subscription_id, "beneficiary_id": user['id']})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement non trouve")
    if sub['status'] not in ('pending',):
        raise HTTPException(status_code=400, detail=f"Statut actuel: {sub['status']}")

    ben = await db.users.find_one({"id": user['id']}, {"_id": 0})
    base_url = get_base_url()

    try:
        mollie = get_mollie_client()
        # Create or get Mollie customer
        mollie_customer_id = ben.get('mollie_customer_id')
        if not mollie_customer_id:
            # Use proper email format for Mollie
            ben_email = ben.get('email', '')
            if not ben_email or '@' not in ben_email:
                ben_email = f"patient-{user['id'][:8]}@chutex.fr"
            cust = mollie.customers.create({
                "name": ben.get('name', 'Patient'),
                "email": ben_email,
            })
            mollie_customer_id = cust['id']
            await db.users.update_one({"id": user['id']}, {"$set": {"mollie_customer_id": mollie_customer_id}})

        # Create first payment (sequenceType=first to create mandate)
        payment = mollie.payments.create({
            "amount": {"currency": "EUR", "value": f"{SUBSCRIPTION_PRICE_TTC:.2f}"},
            "description": f"Abonnement {sub['type']} - {sub['professional_name']}",
            "customerId": mollie_customer_id,
            "sequenceType": "first",
            "redirectUrl": f"{base_url}/subscription-status?id={subscription_id}",
            "webhookUrl": f"{base_url}/api/mollie/webhook",
            "metadata": {"subscription_id": subscription_id, "type": "first_payment"},
        })

        checkout_url = payment['_links']['checkout']['href'] if payment.get('_links', {}).get('checkout') else None

        await db.pro_subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "status": "payment_pending",
                "mollie_customer_id": mollie_customer_id,
                "mollie_payment_id": payment['id'],
            }}
        )
        return {"status": "payment_pending", "checkout_url": checkout_url, "payment_id": payment['id']}

    except Exception as e:
        logger.error(f"Mollie payment error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur paiement: {str(e)}")


@router.post("/mollie/webhook")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications"""
    try:
        form = await request.form()
        payment_id = form.get('id')
        if not payment_id:
            body = await request.json()
            payment_id = body.get('id')
        if not payment_id:
            return {"status": "no_id"}

        mollie = get_mollie_client()
        payment = mollie.payments.get(payment_id)
        status = payment['status']
        metadata = payment.get('metadata', {}) or {}
        subscription_id = metadata.get('subscription_id')

        logger.info(f"Mollie webhook: payment={payment_id}, status={status}, sub={subscription_id}")

        if subscription_id:
            sub = await db.pro_subscriptions.find_one({"id": subscription_id})
            if sub:
                if status == 'paid':
                    # First payment succeeded → activate subscription
                    customer_id = sub.get('mollie_customer_id')
                    if customer_id and not sub.get('mollie_subscription_id'):
                        try:
                            # Create recurring subscription
                            base_url = get_base_url()
                            mollie_sub = mollie.customer_subscriptions.create_for_id(customer_id, {
                                "amount": {"currency": "EUR", "value": f"{SUBSCRIPTION_PRICE_TTC:.2f}"},
                                "interval": "1 month",
                                "description": f"Abonnement {sub['type']} mensuel",
                                "webhookUrl": f"{base_url}/api/mollie/webhook",
                            })
                            await db.pro_subscriptions.update_one(
                                {"id": subscription_id},
                                {"$set": {
                                    "status": "active",
                                    "mollie_subscription_id": mollie_sub['id'],
                                    "start_date": datetime.now(timezone.utc).isoformat(),
                                }}
                            )
                        except Exception as e:
                            logger.warning(f"Mollie subscription creation error: {e}")
                            # Still activate even if recurring fails
                            await db.pro_subscriptions.update_one(
                                {"id": subscription_id},
                                {"$set": {"status": "active", "start_date": datetime.now(timezone.utc).isoformat()}}
                            )
                    else:
                        await db.pro_subscriptions.update_one(
                            {"id": subscription_id},
                            {"$set": {"status": "active", "start_date": datetime.now(timezone.utc).isoformat()}}
                        )

                    # Track commission
                    await db.payment_history.insert_one({
                        "id": str(uuid.uuid4()),
                        "subscription_id": subscription_id,
                        "mollie_payment_id": payment_id,
                        "amount_ttc": SUBSCRIPTION_PRICE_TTC,
                        "amount_ht": SUBSCRIPTION_PRICE_HT,
                        "commission": PLATFORM_COMMISSION,
                        "professional_id": sub['professional_id'],
                        "beneficiary_id": sub['beneficiary_id'],
                        "status": "paid",
                        "date": datetime.now(timezone.utc).isoformat(),
                    })

                elif status in ('expired', 'failed', 'canceled'):
                    await db.pro_subscriptions.update_one(
                        {"id": subscription_id},
                        {"$set": {"status": "payment_failed"}}
                    )

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

@router.get("/pro/payment-history")
async def get_payment_history(user=Depends(get_current_user)):
    """Pro gets full payment history"""
    require_pro(user)
    payments = await db.payment_history.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("date", -1).to_list(200)
    return payments


@router.get("/pro/payment-history/export")
async def export_payment_history_csv(user=Depends(get_current_user)):
    """Export payment history as CSV download"""
    from fastapi.responses import StreamingResponse
    import io, csv
    require_pro(user)
    payments = await db.payment_history.find(
        {"professional_id": user['id']}, {"_id": 0}
    ).sort("date", -1).to_list(500)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow(['Date', 'Beneficiaire', 'Montant TTC', 'Montant HT', 'Commission', 'Statut', 'Reference Mollie'])
    for p in payments:
        date_str = p.get('date', '')[:10] if p.get('date') else ''
        writer.writerow([
            date_str,
            p.get('beneficiary_name', p.get('beneficiary_id', '')[:8]),
            f"{p.get('amount_ttc', 0):.2f}",
            f"{p.get('amount_ht', 0):.2f}",
            f"{p.get('commission', 0):.2f}",
            p.get('status', ''),
            p.get('mollie_payment_id', ''),
        ])
    output.seek(0)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    filename = f"paiements_{(cu.get('name','pro')).replace(' ','_')}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pro/payment-dashboard")
async def get_payment_dashboard(user=Depends(get_current_user)):
    """Pro gets their payment dashboard summary: earnings, active subs, payment config"""
    require_pro(user)
    uid = user['id']
    active_subs = await db.pro_subscriptions.find(
        {"professional_id": uid, "status": "active"}, {"_id": 0}
    ).to_list(100)
    all_subs = await db.pro_subscriptions.find(
        {"professional_id": uid}, {"_id": 0}
    ).to_list(200)
    payments = await db.payment_history.find(
        {"professional_id": uid, "status": "paid"}, {"_id": 0}
    ).sort("date", -1).to_list(100)

    total_earned_ht = sum(p.get('amount_ht', 0) for p in payments)
    current_month_payments = [p for p in payments if p.get('date', '').startswith(datetime.now(timezone.utc).strftime('%Y-%m'))]
    monthly_earned_ht = sum(p.get('amount_ht', 0) for p in current_month_payments)

    # Prescription commissions (50€ HT per contract)
    prescription_commissions = await db.saad_commissions.find(
        {"prescriber_id": uid}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    prescription_comm_total = sum(c.get("amount", 0) for c in prescription_commissions if c.get("status") == "paid")
    prescription_comm_pending = sum(c.get("amount", 0) for c in prescription_commissions if c.get("status") == "pending")

    cu = await db.users.find_one({"id": uid}, {"_id": 0})
    pro_app = await db.pro_applications.find_one({"phone": cu.get('phone', ''), "status": {"$in": ["activated", "approved"]}}, {"_id": 0})

    return {
        "active_subscriptions": len(active_subs),
        "total_subscriptions": len(all_subs),
        "monthly_revenue_ht": monthly_earned_ht,
        "total_revenue_ht": total_earned_ht,
        "price_per_beneficiary_ht": SUBSCRIPTION_PRICE_HT,
        "projected_monthly_ht": len(active_subs) * SUBSCRIPTION_PRICE_HT,
        "recent_payments": payments[:5],
        "iban_configured": bool(cu.get('iban')),
        "contract_signed": bool(pro_app),
        "prescription_commissions": {
            "total_earned": prescription_comm_total,
            "total_pending": prescription_comm_pending,
            "count": len(prescription_commissions),
            "recent": prescription_commissions[:5],
        },
    }


# ── Payment Config (IBAN) ──

class PaymentConfigUpdate(BaseModel):
    account_holder: str
    iban: str
    bic: str = ""

@router.get("/pro/payment-config")
async def get_payment_config(user=Depends(get_current_user)):
    """Get pro's current payment configuration (IBAN, BIC, holder)"""
    require_pro(user)
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    return {
        "account_holder": cu.get('account_holder', ''),
        "iban": cu.get('iban', ''),
        "bic": cu.get('bic', ''),
        "iban_configured": bool(cu.get('iban')),
    }

@router.put("/pro/payment-config")
async def update_payment_config(data: PaymentConfigUpdate, user=Depends(get_current_user)):
    """Update pro's payment configuration (IBAN, BIC, holder)"""
    require_pro(user)
    iban = data.iban.replace(' ', '').upper()
    if len(iban) < 15 or len(iban) > 34:
        raise HTTPException(status_code=400, detail="IBAN invalide (entre 15 et 34 caracteres)")
    if not iban[:2].isalpha():
        raise HTTPException(status_code=400, detail="IBAN invalide (doit commencer par un code pays)")
    if not data.account_holder.strip():
        raise HTTPException(status_code=400, detail="Le titulaire du compte est requis")
    await db.users.update_one({"id": user['id']}, {"$set": {
        "account_holder": data.account_holder.strip(),
        "iban": iban,
        "bic": data.bic.replace(' ', '').upper(),
        "iban_updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    # Send SMS confirmation
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    phone = cu.get('phone', '')
    if phone:
        from services.smsmode_service import send_sms
        masked = iban[:4] + '****' + iban[-4:]
        await send_sms(phone, f"CHUTEX - Votre IBAN {masked} a ete enregistre avec succes. Vos revenus seront verses sur ce compte.")
    return {"status": "ok", "iban_configured": True, "sms_sent": bool(phone)}

# Simulate payment for testing (since Mollie test mode needs browser redirect)
@router.post("/pro/subscriptions/{subscription_id}/simulate-payment")
async def simulate_payment(subscription_id: str, user=Depends(get_current_user)):
    """DEV ONLY: Simulate successful payment for testing"""
    sub = await db.pro_subscriptions.find_one({"id": subscription_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement non trouve")
    if sub['beneficiary_id'] != user['id'] and sub['professional_id'] != user['id']:
        raise HTTPException(status_code=403, detail="Non autorise")
    await db.pro_subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {"status": "active", "start_date": datetime.now(timezone.utc).isoformat()}}
    )
    await db.payment_history.insert_one({
        "id": str(uuid.uuid4()),
        "subscription_id": subscription_id,
        "mollie_payment_id": "simulated",
        "amount_ttc": SUBSCRIPTION_PRICE_TTC,
        "amount_ht": SUBSCRIPTION_PRICE_HT,
        "commission": PLATFORM_COMMISSION,
        "professional_id": sub['professional_id'],
        "beneficiary_id": sub['beneficiary_id'],
        "status": "paid",
        "date": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "active"}


# ══════════════════════════════════════
# PHASE 6 — Messagerie Pro <-> Beneficiaire
# ══════════════════════════════════════

class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"  # text, image, document
    attachment_url: str = ""

@router.get("/pro/conversations")
async def get_conversations(user=Depends(get_current_user)):
    """Get all conversations for current user (pro or beneficiary)"""
    convos = await db.pro_conversations.find(
        {"$or": [{"professional_id": user['id']}, {"beneficiary_id": user['id']}]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)
    return convos

@router.get("/pro/conversations/{other_user_id}")
async def get_or_create_conversation(other_user_id: str, user=Depends(get_current_user)):
    """Get or create a conversation between two users"""
    convo = await db.pro_conversations.find_one({
        "$or": [
            {"professional_id": user['id'], "beneficiary_id": other_user_id},
            {"professional_id": other_user_id, "beneficiary_id": user['id']},
        ]
    }, {"_id": 0})
    if convo:
        return convo
    # Create new conversation
    other = await db.users.find_one({"id": other_user_id}, {"_id": 0})
    if not other:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    # Determine who is pro and who is beneficiary
    from routes.professional_routes import get_effective_role
    eff = get_effective_role(user)
    if eff == 'professional':
        pro_id, ben_id = user['id'], other_user_id
        pro_name = (await db.users.find_one({"id": user['id']}, {"_id": 0, "name": 1})).get('name', '')
        ben_name = other.get('name', '')
    else:
        pro_id, ben_id = other_user_id, user['id']
        pro_name = other.get('name', '')
        ben_name = (await db.users.find_one({"id": user['id']}, {"_id": 0, "name": 1})).get('name', '')
    convo = {
        "id": str(uuid.uuid4()),
        "professional_id": pro_id,
        "professional_name": pro_name,
        "beneficiary_id": ben_id,
        "beneficiary_name": ben_name,
        "last_message": "",
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "unread_pro": 0,
        "unread_ben": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_conversations.insert_one(convo)
    convo.pop('_id', None)
    return convo

@router.get("/pro/messages/{conversation_id}")
async def get_messages(conversation_id: str, user=Depends(get_current_user)):
    """Get messages for a conversation"""
    convo = await db.pro_conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation non trouvee")
    if user['id'] not in (convo['professional_id'], convo['beneficiary_id']):
        raise HTTPException(status_code=403, detail="Non autorise")
    # Mark as read
    from routes.professional_routes import get_effective_role
    eff = get_effective_role(user)
    if eff == 'professional':
        await db.pro_conversations.update_one({"id": conversation_id}, {"$set": {"unread_pro": 0}})
    else:
        await db.pro_conversations.update_one({"id": conversation_id}, {"$set": {"unread_ben": 0}})
    msgs = await db.pro_messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return msgs

@router.post("/pro/messages/{conversation_id}")
async def send_message(conversation_id: str, data: MessageCreate, user=Depends(get_current_user)):
    """Send a message in a conversation"""
    convo = await db.pro_conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation non trouvee")
    if user['id'] not in (convo['professional_id'], convo['beneficiary_id']):
        raise HTTPException(status_code=403, detail="Non autorise")
    sender_name = (await db.users.find_one({"id": user['id']}, {"_id": 0})).get('name', '')
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user['id'],
        "sender_name": sender_name,
        "content": data.content,
        "message_type": data.message_type,
        "attachment_url": data.attachment_url,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pro_messages.insert_one(msg)
    msg.pop('_id', None)
    # Update conversation
    from routes.professional_routes import get_effective_role
    eff = get_effective_role(user)
    unread_field = "unread_ben" if eff == 'professional' else "unread_pro"
    await db.pro_conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message": data.content[:80], "last_message_at": msg['created_at']}, "$inc": {unread_field: 1}}
    )
    return msg

@router.get("/pro/unread-count")
async def get_unread_count(user=Depends(get_current_user)):
    """Get total unread message count"""
    from routes.professional_routes import get_effective_role
    eff = get_effective_role(user)
    if eff == 'professional':
        pipeline = [
            {"$match": {"professional_id": user['id']}},
            {"$group": {"_id": None, "total": {"$sum": "$unread_pro"}}}
        ]
    else:
        pipeline = [
            {"$match": {"beneficiary_id": user['id']}},
            {"$group": {"_id": None, "total": {"$sum": "$unread_ben"}}}
        ]
    result = await db.pro_conversations.aggregate(pipeline).to_list(1)
    return {"unread": result[0]['total'] if result else 0}
