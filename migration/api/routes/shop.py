"""Routes shop : products, checkout (Mollie), order, mollie webhook."""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from mollie.api.client import Client as MollieClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.catalog import PRODUCTS
from api.deps import get_session
from api.schemas import CheckoutRequest
from app.models.shop import ShopOrder

logger = logging.getLogger(__name__)
router = APIRouter()

mollie_client = MollieClient()
_mollie_key = os.environ.get("MOLLIE_TEST_KEY") or os.environ.get("MOLLIE_API_KEY", "")
if _mollie_key:
    mollie_client.set_api_key(_mollie_key)
else:
    logger.warning("Mollie API key not set — checkout endpoint will fail until configured")


@router.get("/shop/products")
async def get_products(category: str = ""):
    products = [p for p in PRODUCTS.values() if not category or p.get("category") == category]
    return {"products": products}


@router.post("/shop/checkout")
async def create_checkout(data: CheckoutRequest, session: AsyncSession = Depends(get_session)):
    if not data.items:
        raise HTTPException(400, "Cart is empty")

    order_id = str(uuid.uuid4())[:12].upper()
    now = datetime.now(timezone.utc)
    total = 0.0
    has_subscription = False
    subscription_monthly = 0.0
    order_lines = []

    for item in data.items:
        product = PRODUCTS.get(item.product_id)
        if not product:
            raise HTTPException(400, f"Unknown product: {item.product_id}")
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
        raise HTTPException(400, "Invalid order total")

    base_url = os.environ.get("FRONTEND_BASE_URL") or os.environ.get("REACT_APP_BACKEND_URL", "")
    api_base_url = os.environ.get("API_BASE_URL") or base_url
    amount_value = f"{total:.2f}" if total > 0 else f"{subscription_monthly:.2f}"
    description = (
        "Chutex Care — "
        + ", ".join(line["product_name"] for line in order_lines)
        + f" — #{order_id}"
    )

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
            "webhookUrl": f"{api_base_url}/api/shop/mollie/webhook",
            "method": ["creditcard", "bancontact", "ideal", "applepay"],
            "metadata": {"order_id": order_id, "has_subscription": str(has_subscription)},
            "customerId": mollie_customer.id,
        }
        if has_subscription:
            payment_params["sequenceType"] = "first"
        payment = mollie_client.payments.create(payment_params)
    except Exception as exc:
        logger.exception("Checkout error: %s", exc)
        raise HTTPException(500, f"Payment creation failed: {exc}")

    order = ShopOrder(
        order_id=order_id,
        status="pending_payment",
        items=order_lines,
        subtotal=total,
        shipping=0,
        total=total if total > 0 else subscription_monthly,
        has_subscription=has_subscription,
        subscription_monthly=int(subscription_monthly),
        customer={
            "email": data.email,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "phone": data.phone or "",
            "address": data.address,
            "city": data.city,
            "postal_code": data.postal_code,
            "country": data.country,
        },
        mollie_payment_id=payment.id,
        mollie_customer_id=mollie_customer.id,
        lang=data.lang,
        created_at=now,
    )
    session.add(order)
    await session.commit()

    return {
        "order_id": order_id,
        "checkout_url": payment.checkout_url,
        "total": total,
        "subscription_monthly": subscription_monthly,
    }


@router.post("/shop/mollie/webhook")
async def shop_mollie_webhook(request: Request, session: AsyncSession = Depends(get_session)):
    try:
        form = await request.form()
        payment_id = form.get("id", "")
        if not payment_id:
            body = await request.body()
            payment_id = body.decode().split("id=")[-1] if b"id=" in body else ""
        if not payment_id:
            return {"status": "ok"}
        payment = mollie_client.payments.get(payment_id)
        res = await session.execute(
            select(ShopOrder).where(ShopOrder.mollie_payment_id == payment_id)
        )
        order = res.scalar_one_or_none()
        if not order:
            logger.warning("Webhook: no order for payment %s", payment_id)
            return {"status": "ok"}

        if payment.is_paid():
            order.status = "paid"
        elif payment.is_failed():
            order.status = "failed"
        elif payment.is_expired():
            order.status = "expired"
        elif payment.is_canceled():
            order.status = "canceled"
        order.updated_at = datetime.now(timezone.utc)
        await session.commit()
        logger.info("Order %s status=%s", order.order_id, order.status)
    except Exception as exc:
        logger.exception("Webhook error: %s", exc)
    return {"status": "ok"}


@router.get("/shop/order/{order_id}")
async def get_order(order_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ShopOrder).where(ShopOrder.order_id == order_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return {c.name: getattr(order, c.name) for c in order.__table__.columns}
