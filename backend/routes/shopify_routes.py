"""
Shopify Webhook Routes
Handles order.paid webhooks from Shopify to create pending accounts
and send activation links to customers.
"""
import os, hmac, hashlib, base64, uuid, logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from db import db

logger = logging.getLogger(__name__)
router = APIRouter()

SHOPIFY_WEBHOOK_SECRET = os.environ.get("SHOPIFY_WEBHOOK_SECRET", "")

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
    Webhook called by Shopify when an order is paid.
    Creates a pending account and sends activation SMS/email.
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

    if not phone and not email:
        logger.warning(f"Shopify order {order_number}: no phone or email, skipping")
        return {"status": "skipped", "reason": "no_contact_info"}

    # Clean phone
    cleaned_phone = phone.replace(" ", "").replace(".", "").replace("-", "")
    if cleaned_phone.startswith("0") and len(cleaned_phone) >= 10:
        cleaned_phone = "+33" + cleaned_phone[1:]

    # Check if already processed
    existing = await db.shopify_orders.find_one({"shopify_order_id": str(order_id)}, {"_id": 0})
    if existing:
        return {"status": "already_processed", "order_id": order_id}

    # Extract product info from line items
    line_items = order.get("line_items", [])
    product_type = "bracelet"
    product_name = ""
    for item in line_items:
        product_name = item.get("title", "") or item.get("name", "")
        sku = (item.get("sku") or "").lower()
        title_lower = product_name.lower()
        if "gilet" in title_lower or "vest" in title_lower or "gilet" in sku:
            product_type = "bracelet_gilet"
            break

    # Save Shopify order
    now = datetime.now(timezone.utc).isoformat()
    shopify_record = {
        "id": str(uuid.uuid4()),
        "shopify_order_id": str(order_id),
        "order_number": str(order_number),
        "customer_name": f"{last_name} {first_name}".strip(),
        "customer_email": email,
        "customer_phone": cleaned_phone,
        "address": address,
        "city": city,
        "postal_code": postal_code,
        "product_type": product_type,
        "product_name": product_name,
        "total_price": order.get("total_price", "0"),
        "currency": order.get("currency", "EUR"),
        "status": "pending_activation",
        "created_at": now,
    }
    await db.shopify_orders.insert_one(shopify_record)

    # Send activation SMS
    subscription_link = "https://saad-guardian-ui.preview.emergentagent.com/subscription"
    full_name = f"{first_name} {last_name}".strip() or "Client"

    if cleaned_phone:
        try:
            from services.smsmode_service import send_sms
            await send_sms(
                cleaned_phone,
                f"Bonjour {full_name}, merci pour votre commande Chutex ! "
                f"Pour activer votre bracelet et votre abonnement, "
                f"finalisez votre inscription ici : {subscription_link}"
            )
            logger.info(f"[Shopify] SMS sent to {cleaned_phone} for order {order_number}")
        except Exception as e:
            logger.error(f"[Shopify] SMS error for {cleaned_phone}: {e}")

    # Send activation email
    if email:
        try:
            from services.smsmode_service import send_email
            await send_email(
                email,
                "Activez votre bracelet Chutex",
                f"<h2>Bonjour {full_name},</h2>"
                f"<p>Merci pour votre commande <strong>{product_name}</strong> !</p>"
                f"<p>Pour activer votre bracelet et profiter de votre abonnement, "
                f"finalisez votre inscription en cliquant sur le lien ci-dessous :</p>"
                f"<p><a href='{subscription_link}' style='display:inline-block;padding:14px 28px;"
                f"background:#111;color:#FFF;border-radius:999px;text-decoration:none;"
                f"font-weight:bold;'>Activer mon bracelet</a></p>"
                f"<p>A bientot sur Chutex !</p>"
            )
            logger.info(f"[Shopify] Email sent to {email} for order {order_number}")
        except Exception as e:
            logger.error(f"[Shopify] Email error for {email}: {e}")

    logger.info(f"[Shopify] Order {order_number} processed: {full_name} ({cleaned_phone}) - {product_type}")

    return {
        "status": "ok",
        "order_number": str(order_number),
        "customer": full_name,
        "product_type": product_type,
        "activation_link_sent": bool(cleaned_phone or email),
    }


@router.get("/shopify/orders")
async def list_shopify_orders():
    """List all Shopify orders (for admin dashboard)."""
    orders = await db.shopify_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@router.get("/shopify/orders/{order_id}")
async def get_shopify_order(order_id: str):
    """Get a specific Shopify order."""
    order = await db.shopify_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
