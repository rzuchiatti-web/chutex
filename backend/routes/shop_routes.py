from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
import logging
import os

from database import db
from mollie.api.client import Client as MollieClient

logger = logging.getLogger(__name__)
router = APIRouter()

MOLLIE_API_KEY = os.environ.get("MOLLIE_API_KEY", "")
MOLLIE_TEST_KEY = os.environ.get("MOLLIE_TEST_KEY", "")
mollie_client = MollieClient()
mollie_client.set_api_key(MOLLIE_TEST_KEY or MOLLIE_API_KEY)

PRODUCTS = {
    # ─── GILET ELDER ───
    "elder-vest": {
        "id": "elder-vest",
        "category": "devices",
        "name": "Gilet Elder",
        "name_en": "Elder Vest",
        "price": 879.00,
        "type": "one-time",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [
            {"id": "elder-vest-s", "label": "Taille S", "label_en": "Size S"},
            {"id": "elder-vest-m", "label": "Taille M", "label_en": "Size M"},
            {"id": "elder-vest-l", "label": "Taille L", "label_en": "Size L"},
            {"id": "elder-vest-xl", "label": "Taille XL", "label_en": "Size XL"},
        ],
    },
    "elder-teleassistance": {
        "id": "elder-teleassistance",
        "category": "bundles",
        "name": "Elder + Teleassistance 24/7",
        "name_en": "Elder + Teleassistance 24/7",
        "price": 879.00,
        "subscription_price": 29.90,
        "type": "hybrid",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [
            {"id": "elder-tele-s", "label": "Taille S", "label_en": "Size S"},
            {"id": "elder-tele-m", "label": "Taille M", "label_en": "Size M"},
            {"id": "elder-tele-l", "label": "Taille L", "label_en": "Size L"},
            {"id": "elder-tele-xl", "label": "Taille XL", "label_en": "Size XL"},
        ],
    },

    # ─── BRACELET ELIO — Abonnements ───
    "elio-standard": {
        "id": "elio-standard",
        "category": "subscriptions",
        "name": "Elio — Abonnement Standard",
        "name_en": "Elio — Standard Plan",
        "price": 0,
        "subscription_price": 24.90,
        "type": "subscription",
        "desc": "Suivi sante continu, alertes preventives, app Chutex.",
        "desc_en": "Continuous health monitoring, preventive alerts, Chutex app.",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [],
    },
    "elio-sport": {
        "id": "elio-sport",
        "category": "subscriptions",
        "name": "Elio — Abonnement Sport",
        "name_en": "Elio — Sport Plan",
        "price": 0,
        "subscription_price": 29.90,
        "type": "subscription",
        "desc": "Standard + coaching sportif, VO2max, recuperation, programmes personnalises.",
        "desc_en": "Standard + sports coaching, VO2max, recovery, personalized programs.",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [],
    },
    "elio-physio": {
        "id": "elio-physio",
        "category": "subscriptions",
        "name": "Elio — Abonnement Physio",
        "name_en": "Elio — Physio Plan",
        "price": 0,
        "subscription_price": 34.90,
        "type": "subscription",
        "desc": "Standard + suivi reeducation, partage donnees kinesitherapeute, exercices guides.",
        "desc_en": "Standard + rehabilitation tracking, physio data sharing, guided exercises.",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [],
    },
    "elio-care": {
        "id": "elio-care",
        "category": "subscriptions",
        "name": "Elio — Abonnement Care",
        "name_en": "Elio — Care Plan",
        "price": 0,
        "subscription_price": 39.90,
        "type": "subscription",
        "desc": "Tout inclus : teleassistance 24/7, geolocalisation, coordination secours, support prioritaire.",
        "desc_en": "All-inclusive: 24/7 teleassistance, geolocation, emergency coordination, priority support.",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [],
    },

    # ─── BALANCE VITA ───
    "vita-scale": {
        "id": "vita-scale",
        "category": "devices",
        "name": "Balance Vita",
        "name_en": "Vita Scale",
        "price": 229.00,
        "type": "one-time",
        "image": "https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png",
        "variants": [],
    },

    # ─── BUNDLES ───
    "bundle-elio-elder": {
        "id": "bundle-elio-elder",
        "category": "bundles",
        "name": "Pack Elio + Elder — Teleassistance 24/7",
        "name_en": "Elio + Elder Bundle — 24/7 Teleassistance",
        "price": 879.00,
        "subscription_price": 79.90,
        "type": "hybrid",
        "desc": "Le pack complet : gilet airbag + bracelet + teleassistance 24/7.",
        "desc_en": "The complete pack: airbag vest + bracelet + 24/7 teleassistance.",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [
            {"id": "bundle-elio-elder-s", "label": "Taille S (Gilet)", "label_en": "Size S (Vest)"},
            {"id": "bundle-elio-elder-m", "label": "Taille M (Gilet)", "label_en": "Size M (Vest)"},
            {"id": "bundle-elio-elder-l", "label": "Taille L (Gilet)", "label_en": "Size L (Vest)"},
            {"id": "bundle-elio-elder-xl", "label": "Taille XL (Gilet)", "label_en": "Size XL (Vest)"},
        ],
    },

    # ─── ACCESSOIRES & RECHARGES ───
    "cartouche-helium-x2": {
        "id": "cartouche-helium-x2",
        "category": "accessories",
        "name": "Cartouches d'helium (x2)",
        "name_en": "Helium Cartridges (x2)",
        "price": 39.90,
        "type": "one-time",
        "desc": "Lot de 2 cartouches de recharge pour les cellules airbag du gilet Elder.",
        "desc_en": "Pack of 2 refill cartridges for Elder vest airbag cells.",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [],
    },
    "cartouche-helium-x4": {
        "id": "cartouche-helium-x4",
        "category": "accessories",
        "name": "Cartouches d'helium (x4)",
        "name_en": "Helium Cartridges (x4)",
        "price": 69.90,
        "type": "one-time",
        "desc": "Lot de 4 cartouches de recharge — prix avantageux.",
        "desc_en": "Pack of 4 refill cartridges — best value.",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [],
    },
    "chargeur-elder": {
        "id": "chargeur-elder",
        "category": "accessories",
        "name": "Chargeur USB-C Elder",
        "name_en": "Elder USB-C Charger",
        "price": 19.90,
        "type": "one-time",
        "desc": "Chargeur de remplacement pour le gilet Elder.",
        "desc_en": "Replacement charger for the Elder vest.",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [],
    },
    "chargeur-elio": {
        "id": "chargeur-elio",
        "category": "accessories",
        "name": "Chargeur magnetique Elio",
        "name_en": "Elio Magnetic Charger",
        "price": 14.90,
        "type": "one-time",
        "desc": "Chargeur magnetique de remplacement pour le bracelet Elio.",
        "desc_en": "Replacement magnetic charger for the Elio bracelet.",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [],
    },
    "bracelet-elio-spare": {
        "id": "bracelet-elio-spare",
        "category": "accessories",
        "name": "Bracelet Elio — Bracelet de rechange",
        "name_en": "Elio — Spare Strap",
        "price": 24.90,
        "type": "one-time",
        "desc": "Bracelet en silicone medical de rechange (3 couleurs).",
        "desc_en": "Replacement medical silicone strap (3 colors).",
        "image": "https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=400",
        "variants": [
            {"id": "bracelet-spare-noir", "label": "Noir", "label_en": "Black"},
            {"id": "bracelet-spare-gris", "label": "Gris", "label_en": "Grey"},
            {"id": "bracelet-spare-bleu", "label": "Bleu marine", "label_en": "Navy blue"},
        ],
    },
    "housse-elder": {
        "id": "housse-elder",
        "category": "accessories",
        "name": "Housse textile Elder",
        "name_en": "Elder Textile Cover",
        "price": 49.90,
        "type": "one-time",
        "desc": "Housse de remplacement lavable en machine pour le gilet Elder.",
        "desc_en": "Machine-washable replacement cover for the Elder vest.",
        "image": "https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=400",
        "variants": [
            {"id": "housse-elder-s", "label": "Taille S", "label_en": "Size S"},
            {"id": "housse-elder-m", "label": "Taille M", "label_en": "Size M"},
            {"id": "housse-elder-l", "label": "Taille L", "label_en": "Size L"},
            {"id": "housse-elder-xl", "label": "Taille XL", "label_en": "Size XL"},
        ],
    },
}


@router.get("/shop/products")
async def get_products(category: str = ""):
    products = []
    for p in PRODUCTS.values():
        if category and p.get("category") != category:
            continue
        products.append({k: v for k, v in p.items()})
    return {"products": products}


class CheckoutItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    email: str
    first_name: str
    last_name: str
    address: str
    city: str
    postal_code: str
    country: str = "FR"
    phone: Optional[str] = ""
    lang: str = "fr"


@router.post("/shop/checkout")
async def create_checkout(data: CheckoutRequest):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_id = str(uuid.uuid4())[:12].upper()
    now = datetime.now(timezone.utc)
    total = 0
    order_lines = []
    has_subscription = False
    subscription_monthly = 0

    for item in data.items:
        product = PRODUCTS.get(item.product_id)
        if not product:
            raise HTTPException(status_code=400, detail=f"Unknown product: {item.product_id}")

        line_total = product["price"] * item.quantity
        total += line_total

        variant_label = ""
        if item.variant_id:
            variant = next((v for v in product.get("variants", []) if v["id"] == item.variant_id), None)
            if variant:
                variant_label = variant["label"]

        order_lines.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "variant_id": item.variant_id or "",
            "variant_label": variant_label,
            "quantity": item.quantity,
            "unit_price": product["price"],
            "line_total": line_total,
            "image": product["image"],
        })

        if product["type"] in ("subscription", "hybrid"):
            has_subscription = True
            subscription_monthly += product.get("subscription_price", 0) * item.quantity

    if total <= 0 and not has_subscription:
        raise HTTPException(status_code=400, detail="Invalid order total")

    base_url = os.environ.get("REACT_APP_BACKEND_URL", os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://premium-clinic-web-1.preview.emergentagent.com"))

    amount_value = f"{total:.2f}" if total > 0 else f"{subscription_monthly:.2f}"

    description_parts = [line["product_name"] for line in order_lines]
    description = f"Chutex Care — {', '.join(description_parts)} — #{order_id}"

    try:
        mollie_customer = mollie_client.customers.create({
            "name": f"{data.first_name} {data.last_name}",
            "email": data.email,
            "metadata": {"order_id": order_id},
        })

        payment_params = {
            "amount": {"currency": "EUR", "value": amount_value},
            "description": description,
            "redirectUrl": f"{base_url}/commande/confirmation?order={order_id}",
            "webhookUrl": f"{base_url}/api/shop/mollie/webhook",
            "method": ["creditcard", "bancontact", "ideal", "applepay"],
            "metadata": {"order_id": order_id, "has_subscription": str(has_subscription)},
            "customerId": mollie_customer.id,
        }

        if has_subscription:
            payment_params["sequenceType"] = "first"

        payment = mollie_client.payments.create(payment_params)

        order = {
            "order_id": order_id,
            "status": "pending_payment",
            "items": order_lines,
            "subtotal": total,
            "subscription_monthly": subscription_monthly,
            "has_subscription": has_subscription,
            "shipping": 0,
            "total": total if total > 0 else subscription_monthly,
            "customer": {
                "email": data.email,
                "first_name": data.first_name,
                "last_name": data.last_name,
                "phone": data.phone or "",
                "address": data.address,
                "city": data.city,
                "postal_code": data.postal_code,
                "country": data.country,
            },
            "mollie_payment_id": payment.id,
            "mollie_customer_id": mollie_customer.id,
            "lang": data.lang,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        await db.shop_orders.insert_one(order)

        return {
            "order_id": order_id,
            "checkout_url": payment.checkout_url,
            "total": total,
            "subscription_monthly": subscription_monthly,
        }

    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")


@router.post("/shop/mollie/webhook")
async def shop_mollie_webhook(request: Request):
    try:
        form = await request.form()
        payment_id = form.get("id", "")
        if not payment_id:
            body = await request.body()
            payment_id = body.decode().split("id=")[-1] if b"id=" in body else ""

        if not payment_id:
            return {"status": "ok"}

        payment = mollie_client.payments.get(payment_id)
        order = await db.shop_orders.find_one({"mollie_payment_id": payment_id}, {"_id": 0})

        if not order:
            logger.warning(f"Shop webhook: no order for payment {payment_id}")
            return {"status": "ok"}

        now = datetime.now(timezone.utc).isoformat()

        if payment.is_paid():
            await db.shop_orders.update_one(
                {"mollie_payment_id": payment_id},
                {"$set": {"status": "paid", "paid_at": now, "updated_at": now}}
            )
            logger.info(f"Shop order {order['order_id']} PAID")

        elif payment.is_failed() or payment.is_expired() or payment.is_canceled():
            status = "failed" if payment.is_failed() else ("expired" if payment.is_expired() else "canceled")
            await db.shop_orders.update_one(
                {"mollie_payment_id": payment_id},
                {"$set": {"status": status, "updated_at": now}}
            )
            logger.info(f"Shop order {order['order_id']} status: {status}")

    except Exception as e:
        logger.error(f"Shop webhook error: {e}")

    return {"status": "ok"}


@router.get("/shop/order/{order_id}")
async def get_order(order_id: str):
    order = await db.shop_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
