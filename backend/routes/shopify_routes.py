"""
Shopify Webhook Routes
Flow: Shopify order paid (via Stripe gateway) → create Stripe Subscription → activate account → SMS
"""
import os, hmac, hashlib, base64, uuid, logging, stripe
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

SHOPIFY_WEBHOOK_SECRET = os.environ.get("SHOPIFY_WEBHOOK_SECRET", "")
STRIPE_SECRET = os.environ.get("STRIPE_API_KEY", "")
stripe.api_key = STRIPE_SECRET

# Stripe price IDs for subscriptions (created on first use)
STRIPE_PRICES = {}


async def _ensure_stripe_prices():
    """Create or retrieve Stripe prices for bracelet subscriptions."""
    if STRIPE_PRICES.get("bracelet_monthly"):
        return
    if not STRIPE_SECRET:
        return
    # Search existing prices
    for price in stripe.Price.list(active=True, limit=50).data:
        nick = price.get("nickname") or ""
        if nick == "shopify_bracelet_monthly":
            STRIPE_PRICES["bracelet_monthly"] = price.id
        elif nick == "shopify_bracelet_annual":
            STRIPE_PRICES["bracelet_annual"] = price.id
    # Create if missing
    if not STRIPE_PRICES.get("bracelet_monthly"):
        product = stripe.Product.create(name="Chutex Bracelet Elio - Abonnement", metadata={"source": "shopify"})
        p = stripe.Price.create(product=product.id, unit_amount=3990, currency="eur", recurring={"interval": "month"}, nickname="shopify_bracelet_monthly")
        STRIPE_PRICES["bracelet_monthly"] = p.id
        p2 = stripe.Price.create(product=product.id, unit_amount=39900, currency="eur", recurring={"interval": "year"}, nickname="shopify_bracelet_annual")
        STRIPE_PRICES["bracelet_annual"] = p2.id


async def verify_shopify_webhook(request: Request) -> dict:
    """Verify Shopify webhook HMAC signature and return parsed body."""
    body = await request.body()
    if SHOPIFY_WEBHOOK_SECRET:
        hmac_header = request.headers.get("X-Shopify-Hmac-Sha256", "")
        computed = base64.b64encode(
            hmac.new(SHOPIFY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).digest()
        ).decode()
        if not hmac.compare_digest(computed, hmac_header):
            raise HTTPException(status_code=401, detail="Invalid HMAC signature")
    import json
    return json.loads(body)


@router.post("/shopify/webhook/order-paid")
async def shopify_order_paid(request: Request):
    """
    Webhook: Shopify order paid (Stripe as gateway).
    1. Filter: only bracelet products
    2. Create Stripe Customer + Subscription for recurring billing
    3. Activate account in app
    4. Send SMS to download app
    """
    try:
        order = await verify_shopify_webhook(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Shopify webhook parse error: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")

    order_id = order.get("id")
    order_number = order.get("order_number") or order.get("name", "")
    customer = order.get("customer") or {}
    shipping = order.get("shipping_address") or order.get("billing_address") or {}

    # Extract customer info
    first_name = customer.get("first_name") or shipping.get("first_name", "")
    last_name = customer.get("last_name") or shipping.get("last_name", "")
    email = customer.get("email") or order.get("email", "")
    phone = customer.get("phone") or shipping.get("phone") or order.get("phone", "")
    address = shipping.get("address1", "")
    city = shipping.get("city", "")
    postal_code = shipping.get("zip", "")
    full_name = f"{first_name} {last_name}".strip() or "Client"

    # Clean phone
    cleaned_phone = (phone or "").replace(" ", "").replace(".", "").replace("-", "")
    if cleaned_phone.startswith("0") and len(cleaned_phone) >= 10:
        cleaned_phone = "+33" + cleaned_phone[1:]

    # Filter: only bracelet products
    line_items = order.get("line_items", [])
    has_bracelet = False
    product_type = "bracelet"
    product_name = ""
    is_annual = False
    for item in line_items:
        title = item.get("title", "") or item.get("name", "")
        sku = (item.get("sku") or "").lower()
        title_lower = title.lower()
        if "bracelet" in title_lower or "elio" in title_lower or "bracelet" in sku or "elio" in sku:
            has_bracelet = True
            product_name = title
            # Detect annual vs monthly: price >= 200 = annual (249.90), else monthly (24.90)
            item_price = float(item.get("price", "0") or "0")
            if item_price >= 200 or "annuel" in title_lower or "annual" in title_lower or "an" in sku:
                is_annual = True
            if "gilet" in title_lower or "vest" in title_lower:
                product_type = "bracelet_gilet"
            break

    if not has_bracelet:
        logger.info(f"[Shopify] Order {order_number}: no bracelet, skipping")
        return {"status": "skipped", "reason": "no_bracelet_product"}

    # Extract beneficiary phone from line item properties (custom field on Shopify product page)
    beneficiary_phone = ""
    for item in line_items:
        for prop in item.get("properties", []):
            prop_name = (prop.get("name") or "").lower()
            if "beneficiaire" in prop_name or "beneficiary" in prop_name:
                beneficiary_phone = (prop.get("value") or "").strip()
                break
        if beneficiary_phone:
            break

    # Clean beneficiary phone
    if beneficiary_phone:
        beneficiary_phone = beneficiary_phone.replace(" ", "").replace(".", "").replace("-", "")
        if beneficiary_phone.startswith("0") and len(beneficiary_phone) >= 10:
            beneficiary_phone = "+33" + beneficiary_phone[1:]

    # The phone to use for the subscription: beneficiary if provided, otherwise buyer
    subscription_phone = beneficiary_phone or cleaned_phone

    # Check duplicate
    existing = await db.shopify_orders.find_one({"shopify_order_id": str(order_id)}, {"_id": 0})
    if existing:
        return {"status": "already_processed", "order_id": order_id}

    # === STRIPE: Create Customer + Subscription ===
    stripe_customer_id = None
    stripe_subscription_id = None
    stripe_error = None

    if STRIPE_SECRET and email:
        try:
            await _ensure_stripe_prices()

            # Check if Stripe customer already exists
            existing_customers = stripe.Customer.list(email=email, limit=1)
            if existing_customers.data:
                stripe_customer = existing_customers.data[0]
            else:
                stripe_customer = stripe.Customer.create(
                    email=email,
                    name=full_name,
                    phone=cleaned_phone or phone,
                    metadata={"shopify_order": str(order_number), "source": "shopify"},
                )
            stripe_customer_id = stripe_customer.id

            # Get payment method from Shopify's Stripe charge
            # Shopify payments via Stripe gateway create charges — find the latest for this email
            payment_method = None
            try:
                charges = stripe.Charge.list(customer=stripe_customer_id, limit=1)
                if charges.data and charges.data[0].payment_method:
                    payment_method = charges.data[0].payment_method
            except Exception:
                pass

            # If no payment method from charge, try payment intents
            if not payment_method:
                try:
                    pis = stripe.PaymentIntent.list(customer=stripe_customer_id, limit=1)
                    if pis.data and pis.data[0].payment_method:
                        payment_method = pis.data[0].payment_method
                except Exception:
                    pass

            # Create subscription
            price_key = "bracelet_annual" if is_annual else "bracelet_monthly"
            price_id = STRIPE_PRICES.get(price_key)

            if price_id:
                sub_params = {
                    "customer": stripe_customer_id,
                    "items": [{"price": price_id}],
                    "metadata": {"shopify_order": str(order_number), "source": "shopify", "product_type": product_type},
                }
                if payment_method:
                    sub_params["default_payment_method"] = payment_method
                else:
                    # No payment method yet — create subscription with trial to collect payment later
                    sub_params["payment_behavior"] = "default_incomplete"
                    sub_params["payment_settings"] = {"save_default_payment_method": "on_subscription"}

                subscription = stripe.Subscription.create(**sub_params)
                stripe_subscription_id = subscription.id
                logger.info(f"[Shopify] Stripe subscription {subscription.id} created for {email}")

        except Exception as e:
            stripe_error = str(e)
            logger.error(f"[Shopify] Stripe error for order {order_number}: {e}")

    # === Save order in DB ===
    now = datetime.now(timezone.utc).isoformat()
    shopify_record = {
        "id": str(uuid.uuid4()),
        "shopify_order_id": str(order_id),
        "order_number": str(order_number),
        "customer_name": f"{last_name} {first_name}".strip(),
        "customer_email": email,
        "customer_phone": cleaned_phone,
        "beneficiary_phone": beneficiary_phone,
        "subscription_phone": subscription_phone,
        "address": address, "city": city, "postal_code": postal_code,
        "product_type": product_type,
        "product_name": product_name,
        "is_annual": is_annual,
        "total_price": order.get("total_price", "0"),
        "currency": order.get("currency", "EUR"),
        "stripe_customer_id": stripe_customer_id,
        "stripe_subscription_id": stripe_subscription_id,
        "stripe_error": stripe_error,
        "status": "active" if stripe_subscription_id else "pending_activation",
        "created_at": now,
    }
    await db.shopify_orders.insert_one(shopify_record)

    # === Create subscription in app DB (linked to beneficiary phone) ===
    if stripe_subscription_id or not stripe_error:
        if subscription_phone:
            # Try to find existing user to link by ID
            import re as re2
            phone_suffix = subscription_phone[-9:] if len(subscription_phone) >= 9 else subscription_phone
            existing_user = await db.users.find_one(
                {"phone": {"$regex": phone_suffix}}, {"_id": 0, "password_hash": 0}
            )
            beneficiary_id = existing_user['id'] if existing_user else ""

            # Determine subscription type: bracelet_gilet includes teleassistance
            sub_type = "care" if product_type == "bracelet_gilet" else "bracelet_only"

            await db.subscriptions.update_one(
                {"beneficiary_phone": subscription_phone},
                {"$set": {
                    "beneficiary_phone": subscription_phone,
                    "beneficiary_id": beneficiary_id,
                    "buyer_phone": cleaned_phone,
                    "buyer_name": full_name,
                    "buyer_email": email,
                    "subscription_type": sub_type,
                    "status": "active",
                    "source": "shopify",
                    "shopify_order_id": str(order_id),
                    "shopify_order_number": str(order_number),
                    "stripe_subscription_id": stripe_subscription_id,
                    "product_name": product_name,
                    "is_annual": is_annual,
                    "start_date": now,
                    "created_at": now,
                    "updated_at": now,
                }},
                upsert=True,
            )

            # Update user record if found
            if existing_user:
                await db.users.update_one(
                    {"id": beneficiary_id},
                    {"$set": {
                        "has_subscription": True,
                        "subscription_type": sub_type,
                    }}
                )

    # === Send SMS ===
    app_link = "https://apps.apple.com/app/chutex/id6759215592"
    if cleaned_phone:
        try:
            from services.smsmode_service import send_sms
            await send_sms(
                cleaned_phone,
                f"Bienvenue chez Chutex {full_name} ! Votre abonnement bracelet est actif. "
                f"Telechargez l'app pour commencer : {app_link}"
            )
            logger.info(f"[Shopify] SMS sent to {cleaned_phone} for order {order_number}")
        except Exception as e:
            logger.error(f"[Shopify] SMS error: {e}")

    logger.info(f"[Shopify] Order {order_number} processed: {full_name} | stripe_sub={stripe_subscription_id}")

    return {
        "status": "ok",
        "order_number": str(order_number),
        "customer": full_name,
        "product_type": product_type,
        "stripe_subscription_id": stripe_subscription_id,
        "account_activated": bool(stripe_subscription_id or not stripe_error),
    }


@router.get("/shopify/check-order")
async def check_shopify_order_by_phone(phone: str = ""):
    """Check if a Shopify order exists for this phone number."""
    if not phone:
        return {"found": False}
    cleaned = phone.replace(" ", "").replace(".", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) >= 10:
        cleaned = "+33" + cleaned[1:]
    suffix = cleaned[-9:] if len(cleaned) >= 9 else cleaned
    order = await db.shopify_orders.find_one(
        {"customer_phone": {"$regex": suffix}}, {"_id": 0}
    )
    if not order:
        return {"found": False}
    return {
        "found": True,
        "customer_name": order.get("customer_name", ""),
        "customer_email": order.get("customer_email", ""),
        "customer_phone": order.get("customer_phone", ""),
        "address": order.get("address", ""),
        "city": order.get("city", ""),
        "postal_code": order.get("postal_code", ""),
        "product_type": order.get("product_type", "bracelet"),
        "order_number": order.get("order_number", ""),
        "status": order.get("status", ""),
    }


@router.get("/shopify/orders")
async def list_shopify_orders():
    """List all Shopify orders (admin)."""
    orders = await db.shopify_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders
