from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import uuid, logging, httpx, hashlib, hmac, re

from database import db, SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHARED_SECRET, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
from auth import get_current_user
from models import SubscriptionCreate, SubscriptionUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


def normalize_phone(phone: str) -> str:
    """Normalize phone number for matching: remove spaces, dashes, dots, keep + prefix"""
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


# ==================== SUBSCRIPTION CHECK ====================
@router.get("/subscriptions/my")
async def get_my_subscription(user=Depends(get_current_user)):
    """Get current user's subscription status"""
    sub = await db.subscriptions.find_one(
        {"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}
    )
    if not sub:
        phone = user.get('phone', '')
        if phone:
            sub = await db.subscriptions.find_one(
                {"beneficiary_phone": normalize_phone(phone), "status": "active"}, {"_id": 0}
            )
            # Late-link: if found by phone but no beneficiary_id, link it now
            if sub and not sub.get('beneficiary_id'):
                await db.subscriptions.update_one(
                    {"id": sub['id']},
                    {"$set": {"beneficiary_id": user['id'], "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                sub['beneficiary_id'] = user['id']
    # Enrich with contract data if available
    contract = None
    if sub and sub.get('contract_id'):
        contract = await db.contracts.find_one({"id": sub['contract_id']}, {"_id": 0})
    elif sub:
        # Try to find contract by phone
        phone = user.get('phone', '')
        if phone:
            contract = await db.contracts.find_one({"beneficiary.phone": phone, "status": "active"}, {"_id": 0})
            if not contract:
                contract = await db.contracts.find_one({"beneficiary.phone": normalize_phone(phone), "status": "active"}, {"_id": 0})

    contract_info = {}
    if contract:
        contract_info = {
            "contract_number": contract.get("contract_number", ""),
            "plan": contract.get("plan", ""),
            "plan_label": contract.get("plan_label", ""),
            "price_monthly": contract.get("price_monthly", 0),
            "price_after_credit": contract.get("price_after_credit", 0),
            "housing": contract.get("housing", {}),
            "delivery": contract.get("delivery", {}),
            "contract_guardians": contract.get("guardians", []),
            "stripe_subscription_id": contract.get("stripe_subscription_id", ""),
        }

    return {
        "has_subscription": sub is not None,
        "subscription": sub,
        "subscription_type": sub.get('subscription_type', 'none') if sub else 'none',
        "can_use_bracelet": sub is not None,
        "has_teleassistance": sub.get('subscription_type') in ('care', 'bracelet_gilet') if sub else False,
        "start_date": sub.get('start_date') or sub.get('created_at') if sub else None,
        "source": sub.get('source') if sub else None,
        "contract": contract_info,
    }


# ==================== SUBSCRIPTION SELF-MANAGEMENT ====================
@router.put("/subscriptions/my/update-info")
async def update_subscription_info(data: dict, user=Depends(get_current_user)):
    """Update housing/logistics info on active subscription"""
    sub = await db.subscriptions.find_one(
        {"$or": [{"beneficiary_id": user['id']}, {"beneficiary_phone": normalize_phone(user.get('phone', ''))}], "status": "active"}, {"_id": 0}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Aucun abonnement actif")
    allowed = ['address', 'postal_code', 'city', 'floor', 'digicode', 'interphone', 'key_box_code', 'housing_notes']
    update = {k: v for k, v in data.items() if k in allowed}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.subscriptions.update_one({"id": sub['id']}, {"$set": update})
    # Also update user profile with address info
    user_update = {}
    if 'address' in data: user_update['address'] = data['address']
    if 'postal_code' in data: user_update['postal_code'] = data['postal_code']
    if 'city' in data: user_update['city'] = data['city']
    if user_update:
        await db.users.update_one({"id": user['id']}, {"$set": user_update})
    return {"status": "updated"}


@router.post("/subscriptions/my/cancel")
async def cancel_my_subscription(user=Depends(get_current_user)):
    """Cancel user's active subscription"""
    import os, stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_API_KEY", "")

    sub = await db.subscriptions.find_one(
        {"$or": [{"beneficiary_id": user['id']}, {"beneficiary_phone": normalize_phone(user.get('phone', ''))}], "status": "active"}, {"_id": 0}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Aucun abonnement actif")
    now = datetime.now(timezone.utc).isoformat()
    # Cancel on Stripe if subscription ID exists (check both sub and contract)
    stripe_sub_id = sub.get('stripe_subscription_id')
    if not stripe_sub_id and sub.get('contract_id'):
        contract = await db.contracts.find_one({"id": sub['contract_id']}, {"_id": 0})
        if contract:
            stripe_sub_id = contract.get('stripe_subscription_id')
    if stripe_sub_id and stripe_lib.api_key:
        try:
            stripe_lib.Subscription.cancel(stripe_sub_id)
        except Exception as e:
            logger.warning(f"Stripe cancel error: {e}")
    # Update DB
    await db.subscriptions.update_one({"id": sub['id']}, {"$set": {"status": "cancelled", "cancelled_at": now, "updated_at": now}})
    await db.users.update_one({"id": user['id']}, {"$set": {"has_subscription": False, "subscription_type": "none"}})
    # Send cancellation email
    if user.get('email'):
        import asyncio
        from services.email_service import send_cancellation_email
        asyncio.create_task(send_cancellation_email(user.get('name', ''), user['email'], sub.get('subscription_type', '')))
    return {"status": "cancelled"}


@router.post("/subscriptions/my/billing-portal")
async def get_billing_portal(data: dict, user=Depends(get_current_user)):
    """Create a Stripe billing portal session for the user"""
    import os, stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_API_KEY", "")

    sub = await db.subscriptions.find_one(
        {"$or": [{"beneficiary_id": user['id']}, {"beneficiary_phone": normalize_phone(user.get('phone', ''))}], "status": "active"}, {"_id": 0}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Aucun abonnement Stripe actif")
    # Get stripe_subscription_id from sub or from linked contract
    stripe_sub_id = sub.get('stripe_subscription_id')
    if not stripe_sub_id and sub.get('contract_id'):
        contract = await db.contracts.find_one({"id": sub['contract_id']}, {"_id": 0})
        if contract:
            stripe_sub_id = contract.get('stripe_subscription_id')
    if not stripe_sub_id:
        raise HTTPException(status_code=404, detail="Aucun abonnement Stripe actif")
    # Find the Stripe customer
    try:
        stripe_sub = stripe_lib.Subscription.retrieve(stripe_sub_id)
        customer_id = stripe_sub.customer
        session = stripe_lib.billing_portal.Session.create(
            customer=customer_id,
            return_url=data.get('return_url', 'https://nutrition-ai-beta.preview.emergentagent.com/profile'),
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Billing portal error: {e}")
        raise HTTPException(status_code=500, detail="Impossible de creer la session de paiement")


@router.get("/guardians/pending-invites")
async def get_pending_guardian_invites(user=Depends(get_current_user)):
    """Get pending guardian invitations sent by this beneficiary"""
    invites = await db.guardian_invitations.find(
        {"beneficiary_id": user['id'], "status": {"$in": ["pending", "sms_sent"]}}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return invites


@router.post("/guardians/resend-invite")
async def resend_guardian_invite(data: dict, user=Depends(get_current_user)):
    """Resend SMS invitation to a pending guardian"""
    phone = data.get('phone', '').strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Numero requis")
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone)
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    try:
        from services.smsmode_service import send_sms
        ben_name = user.get('name', 'Un proche')
        await send_sms(
            cleaned,
            f"{ben_name} souhaite vous ajouter comme gardien sur Chutex Care. Inscrivez-vous sur https://apps.apple.com/app/chutex/id6759215592"
        )
        now = datetime.now(timezone.utc).isoformat()
        await db.guardian_invitations.update_one(
            {"beneficiary_id": user['id'], "guardian_phone": {"$regex": cleaned[-9:]}},
            {"$set": {"status": "sms_sent", "last_sent_at": now}},
        )
        return {"status": "sent"}
    except Exception as e:
        logger.error(f"Resend invite error: {e}")
        raise HTTPException(status_code=500, detail="Erreur envoi SMS")



@router.get("/subscriptions/check/{user_id}")
async def check_subscription(user_id: str, user=Depends(get_current_user)):
    """Check subscription status for a given user (admin/teleassistance)"""
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    sub = await db.subscriptions.find_one(
        {"beneficiary_id": user_id, "status": "active"}, {"_id": 0}
    )
    if not sub:
        phone = target.get('phone', '')
        if phone:
            sub = await db.subscriptions.find_one(
                {"beneficiary_phone": normalize_phone(phone), "status": "active"}, {"_id": 0}
            )
    return {
        "user_id": user_id,
        "user_name": target.get('name', ''),
        "has_subscription": sub is not None,
        "subscription": sub,
        "subscription_type": sub.get('subscription_type', 'none') if sub else 'none',
        "can_use_bracelet": sub is not None,
        "has_teleassistance": sub.get('subscription_type') == 'care' if sub else False,
    }


# ==================== ADMIN SUBSCRIPTION MANAGEMENT ====================
@router.get("/admin/subscriptions")
async def get_all_subscriptions(user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    subs = await db.subscriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for s in subs:
        if s.get('beneficiary_id'):
            u = await db.users.find_one({"id": s['beneficiary_id']}, {"_id": 0, "password_hash": 0})
            if u:
                s['beneficiary_name'] = u.get('name', '')
                s['beneficiary_email'] = u.get('email', '')
    return subs


@router.post("/admin/subscriptions")
async def create_subscription(data: SubscriptionCreate, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    phone = normalize_phone(data.beneficiary_phone)
    existing = await db.subscriptions.find_one(
        {"beneficiary_phone": phone, "status": "active"}, {"_id": 0}
    )
    if existing:
        if data.subscription_type == 'care' and existing.get('subscription_type') == 'standard':
            await db.subscriptions.update_one(
                {"id": existing['id']},
                {"$set": {"subscription_type": "care", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            ben = await db.users.find_one({"id": existing.get('beneficiary_id')}, {"_id": 0})
            if ben:
                await db.users.update_one({"id": ben['id']}, {"$set": {"subscription_type": "care"}})
            return {**existing, "subscription_type": "care", "upgraded": True}
        raise HTTPException(status_code=400, detail="Abonnement actif existe deja pour ce numero")

    now = datetime.now(timezone.utc).isoformat()
    beneficiary = await db.users.find_one({"phone": {"$regex": phone[-9:]}}, {"_id": 0, "password_hash": 0})
    sub = {
        "id": str(uuid.uuid4()),
        "beneficiary_phone": phone,
        "beneficiary_id": beneficiary['id'] if beneficiary else "",
        "subscription_type": data.subscription_type,
        "status": "active",
        "source": "manual",
        "shopify_order_id": data.shopify_order_id,
        "notes": data.notes,
        "created_at": now,
        "updated_at": now,
        "created_by": user['id'],
    }
    await db.subscriptions.insert_one(sub)
    if beneficiary:
        await db.users.update_one(
            {"id": beneficiary['id']},
            {"$set": {"subscription_type": data.subscription_type, "has_subscription": True}}
        )
    return {k: v for k, v in sub.items() if k != '_id'}


@router.put("/admin/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, data: SubscriptionUpdate, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    update = {k: v for k, v in data.dict().items() if v is not None}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.subscriptions.update_one({"id": sub_id}, {"$set": update})
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if sub and sub.get('beneficiary_id'):
        new_type = update.get('subscription_type', sub.get('subscription_type'))
        new_status = update.get('status', sub.get('status'))
        await db.users.update_one(
            {"id": sub['beneficiary_id']},
            {"$set": {"subscription_type": new_type if new_status == 'active' else 'none', "has_subscription": new_status == 'active'}}
        )
    return {"status": "updated"}


@router.delete("/admin/subscriptions/{sub_id}")
async def delete_subscription(sub_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if sub and sub.get('beneficiary_id'):
        await db.users.update_one(
            {"id": sub['beneficiary_id']},
            {"$set": {"subscription_type": "none", "has_subscription": False}}
        )
    await db.subscriptions.delete_one({"id": sub_id})
    return {"status": "deleted"}


# ==================== SHOPIFY STATUS & OAUTH ====================
@router.get("/admin/shopify/status")
async def shopify_status(user=Depends(get_current_user)):
    """Check Shopify connection status"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    token_doc = await db.settings.find_one({"key": "shopify_access_token"}, {"_id": 0})
    token = token_doc.get('value', '') if token_doc else SHOPIFY_ACCESS_TOKEN
    return {
        "connected": bool(token),
        "store_url": SHOPIFY_STORE_URL,
        "has_client_id": bool(SHOPIFY_CLIENT_ID),
    }


@router.get("/admin/shopify/auth-url")
async def get_shopify_auth_url(request: Request, user=Depends(get_current_user)):
    """Generate Shopify OAuth authorization URL"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    if not SHOPIFY_CLIENT_ID or not SHOPIFY_STORE_URL:
        raise HTTPException(status_code=400, detail="Shopify Client ID ou Store URL non configure")
    base_url = str(request.base_url).rstrip('/')
    if base_url.startswith('http://') and 'localhost' not in base_url:
        base_url = base_url.replace('http://', 'https://', 1)
    redirect_uri = f"{base_url}/api/shopify/oauth/callback"
    nonce = uuid.uuid4().hex[:16]
    await db.settings.update_one(
        {"key": "shopify_oauth_nonce"}, {"$set": {"value": nonce}}, upsert=True
    )
    auth_url = (
        f"https://{SHOPIFY_STORE_URL}/admin/oauth/authorize"
        f"?client_id={SHOPIFY_CLIENT_ID}"
        f"&scope=read_orders,read_customers"
        f"&redirect_uri={redirect_uri}"
        f"&state={nonce}"
    )
    return {"auth_url": auth_url, "redirect_uri": redirect_uri}


@router.get("/shopify/oauth/callback")
async def shopify_oauth_callback(request: Request):
    """Handle Shopify OAuth callback - exchange code for permanent access token"""
    code = request.query_params.get('code', '')
    state = request.query_params.get('state', '')
    shop = request.query_params.get('shop', '')

    if not code:
        from starlette.responses import HTMLResponse
        return HTMLResponse("<h2>Erreur: pas de code d'autorisation</h2>")

    nonce_doc = await db.settings.find_one({"key": "shopify_oauth_nonce"}, {"_id": 0})
    expected_nonce = nonce_doc.get('value', '') if nonce_doc else ''
    if state and expected_nonce and state != expected_nonce:
        from starlette.responses import HTMLResponse
        return HTMLResponse("<h2>Erreur: nonce invalide</h2>")

    try:
        token_url = f"https://{SHOPIFY_STORE_URL}/admin/oauth/access_token"
        payload = {
            "client_id": SHOPIFY_CLIENT_ID,
            "client_secret": SHOPIFY_CLIENT_SECRET,
            "code": code,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(token_url, json=payload, timeout=30)
            if resp.status_code != 200:
                from starlette.responses import HTMLResponse
                return HTMLResponse(f"<h2>Erreur Shopify: {resp.text}</h2>")
            data = resp.json()
            access_token = data.get('access_token', '')

        if access_token:
            await db.settings.update_one(
                {"key": "shopify_access_token"},
                {"$set": {"value": access_token, "updated_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
            logger.info("Shopify OAuth: access token saved successfully")
            from starlette.responses import HTMLResponse
            return HTMLResponse(
                "<html><body style='font-family:sans-serif;text-align:center;padding:60px'>"
                "<h1 style='color:#96BF48'>Shopify connecte !</h1>"
                "<p>Le token d'acces a ete enregistre. Vous pouvez fermer cette page et retourner au backoffice.</p>"
                "<script>setTimeout(()=>window.close(),3000)</script>"
                "</body></html>"
            )
        else:
            from starlette.responses import HTMLResponse
            return HTMLResponse("<h2>Erreur: pas de token dans la reponse</h2>")
    except Exception as e:
        logger.error(f"Shopify OAuth error: {e}")
        from starlette.responses import HTMLResponse
        return HTMLResponse(f"<h2>Erreur: {e}</h2>")


async def get_shopify_token():
    """Get Shopify access token from DB or env"""
    token_doc = await db.settings.find_one({"key": "shopify_access_token"}, {"_id": 0})
    return token_doc.get('value', '') if token_doc else SHOPIFY_ACCESS_TOKEN


# ==================== SHOPIFY SYNC ====================
@router.post("/admin/shopify/sync")
async def sync_shopify_orders(user=Depends(get_current_user)):
    """Manually trigger Shopify order sync"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    token = await get_shopify_token()
    if not token:
        raise HTTPException(status_code=400, detail="Shopify non connecte. Cliquez sur 'Connecter Shopify' pour autoriser l'acces.")

    results = {"synced": 0, "skipped": 0, "errors": [], "details": []}
    try:
        api_url = f"https://{SHOPIFY_STORE_URL}/admin/api/2024-01/orders.json?status=any&limit=50"
        headers = {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(api_url, headers=headers, timeout=30)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Erreur Shopify API: {resp.text}")
            orders = resp.json().get('orders', [])

        now = datetime.now(timezone.utc).isoformat()
        for order in orders:
            order_id = str(order.get('id', ''))
            existing = await db.subscriptions.find_one({"shopify_order_id": order_id})
            if existing:
                results['skipped'] += 1
                continue

            customer = order.get('customer', {})
            line_items = order.get('line_items', [])

            for item in line_items:
                product_name = (item.get('title', '') or '').lower()
                is_bracelet = 'elio' in product_name or 'bracelet' in product_name
                is_care = 'care' in product_name

                if not is_bracelet and not is_care:
                    continue

                sub_type = 'care' if is_care else 'standard'
                ben_phone = ''
                for prop in item.get('properties', []):
                    prop_name = (prop.get('name', '') or '').lower()
                    if 'phone' in prop_name or 'telephone' in prop_name or 'tel' in prop_name or 'numero' in prop_name:
                        ben_phone = prop.get('value', '')
                        break

                if not ben_phone:
                    ben_phone = customer.get('phone', '') or ''
                    if not ben_phone:
                        addr = customer.get('default_address', {}) or {}
                        ben_phone = addr.get('phone', '') or ''

                if not ben_phone:
                    results['errors'].append(f"Commande #{order.get('order_number')}: Pas de telephone beneficiaire")
                    continue

                norm_phone = normalize_phone(ben_phone)
                existing_sub = await db.subscriptions.find_one({"beneficiary_phone": norm_phone, "status": "active"})
                if existing_sub:
                    if sub_type == 'care' and existing_sub.get('subscription_type') == 'standard':
                        await db.subscriptions.update_one(
                            {"id": existing_sub['id']},
                            {"$set": {"subscription_type": "care", "updated_at": now, "shopify_order_id": order_id}}
                        )
                        results['details'].append(f"#{order.get('order_number')}: Upgrade standard -> care ({norm_phone})")
                        results['synced'] += 1
                    else:
                        results['skipped'] += 1
                    continue

                beneficiary = await db.users.find_one({"phone": {"$regex": norm_phone[-9:]}}, {"_id": 0, "password_hash": 0})
                sub = {
                    "id": str(uuid.uuid4()),
                    "beneficiary_phone": norm_phone,
                    "beneficiary_id": beneficiary['id'] if beneficiary else "",
                    "subscription_type": sub_type,
                    "status": "active",
                    "source": "shopify",
                    "shopify_order_id": order_id,
                    "shopify_order_number": str(order.get('order_number', '')),
                    "buyer_email": customer.get('email', ''),
                    "buyer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                    "notes": "",
                    "created_at": now,
                    "updated_at": now,
                    "created_by": "shopify_sync",
                }
                await db.subscriptions.insert_one(sub)
                if beneficiary:
                    await db.users.update_one(
                        {"id": beneficiary['id']},
                        {"$set": {"subscription_type": sub_type, "has_subscription": True}}
                    )
                results['synced'] += 1
                results['details'].append(f"#{order.get('order_number')}: {sub_type} pour {norm_phone}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Shopify sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return results


# ==================== SHOPIFY WEBHOOK ====================
@router.post("/shopify/webhook/order-created")
async def shopify_order_webhook(request: Request):
    """Webhook called by Shopify when an order is created"""
    body = await request.body()
    if SHOPIFY_SHARED_SECRET:
        hmac_header = request.headers.get('X-Shopify-Hmac-Sha256', '')
        computed = hmac.new(SHOPIFY_SHARED_SECRET.encode(), body, hashlib.sha256).hexdigest()
        import base64
        computed_b64 = base64.b64encode(bytes.fromhex(computed)).decode()
        if not hmac.compare_digest(computed_b64, hmac_header):
            logger.warning("Shopify webhook: invalid HMAC")
            raise HTTPException(status_code=401, detail="Invalid HMAC")

    import json
    order = json.loads(body)
    order_id = str(order.get('id', ''))
    customer = order.get('customer', {}) or {}
    line_items = order.get('line_items', [])
    now = datetime.now(timezone.utc).isoformat()

    for item in line_items:
        product_name = (item.get('title', '') or '').lower()
        is_bracelet = 'elio' in product_name or 'bracelet' in product_name
        is_care = 'care' in product_name

        if not is_bracelet and not is_care:
            continue

        sub_type = 'care' if is_care else 'standard'
        ben_phone = ''
        for prop in item.get('properties', []):
            prop_name = (prop.get('name', '') or '').lower()
            if 'phone' in prop_name or 'telephone' in prop_name or 'tel' in prop_name or 'numero' in prop_name:
                ben_phone = prop.get('value', '')
                break
        if not ben_phone:
            ben_phone = customer.get('phone', '') or ''

        if not ben_phone:
            logger.warning(f"Webhook order #{order.get('order_number')}: no beneficiary phone")
            continue

        norm_phone = normalize_phone(ben_phone)
        existing = await db.subscriptions.find_one({"beneficiary_phone": norm_phone, "status": "active"})
        if existing:
            if sub_type == 'care' and existing.get('subscription_type') == 'standard':
                await db.subscriptions.update_one(
                    {"id": existing['id']},
                    {"$set": {"subscription_type": "care", "updated_at": now}}
                )
            continue

        beneficiary = await db.users.find_one({"phone": {"$regex": norm_phone[-9:]}}, {"_id": 0, "password_hash": 0})
        sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": norm_phone,
            "beneficiary_id": beneficiary['id'] if beneficiary else "",
            "subscription_type": sub_type,
            "status": "active",
            "source": "shopify_webhook",
            "shopify_order_id": order_id,
            "shopify_order_number": str(order.get('order_number', '')),
            "buyer_email": customer.get('email', ''),
            "buyer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
            "notes": "",
            "created_at": now,
            "updated_at": now,
            "created_by": "shopify_webhook",
        }
        await db.subscriptions.insert_one(sub)
        if beneficiary:
            await db.users.update_one(
                {"id": beneficiary['id']},
                {"$set": {"subscription_type": sub_type, "has_subscription": True}}
            )

    return {"status": "ok"}
