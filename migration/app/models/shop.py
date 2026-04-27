"""E-commerce, abonnements, paiements."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class ShopOrder(Base, TimestampMixin):
    __tablename__ = "shop_orders"

    order_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    items = jsonb_col(nullable=False)
    customer = jsonb_col(nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    shipping: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    has_subscription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    subscription_monthly: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mollie_payment_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    mollie_customer_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    lang: Mapped[str | None] = mapped_column(String(8), nullable=True)


class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    contract_number: Mapped[str] = mapped_column(ShortStr, unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(ShortStr, nullable=False)
    plan_label: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    price_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    price_after_credit: Mapped[float | None] = mapped_column(Float, nullable=True)
    subscriber_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    beneficiary = jsonb_col()
    housing = jsonb_col()
    guardians = jsonb_col()
    delivery = jsonb_col()
    billing = jsonb_col()
    signature = jsonb_col()
    stripe_customer_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    stripe_client_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="draft", nullable=False, index=True)
    prescriber_validated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    subscription_type: Mapped[str] = mapped_column(ShortStr, default="standard", nullable=False)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    contract_id: Mapped[str | None] = mapped_column(IdStr, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True)
    contract_number: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_by: Mapped[str | None] = mapped_column(IdStr, nullable=True)


class PaymentTransaction(Base, TimestampMixin):
    __tablename__ = "payment_transactions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    contract_id: Mapped[str | None] = mapped_column(IdStr, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="EUR", nullable=False)
    payment_status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    chutex_fee: Mapped[float | None] = mapped_column(Float, nullable=True)
    transfer_amount: Mapped[float | None] = mapped_column(Float, nullable=True)


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    subscription_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    mollie_payment_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    amount_ttc: Mapped[float] = mapped_column(Float, nullable=False)
    amount_ht: Mapped[float | None] = mapped_column(Float, nullable=True)
    commission: Mapped[float | None] = mapped_column(Float, nullable=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    status: Mapped[str] = mapped_column(ShortStr, nullable=False)
    date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class InternalInvoice(Base, TimestampMixin):
    __tablename__ = "internal_invoices"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    invoice_number: Mapped[str] = mapped_column(ShortStr, unique=True, nullable=False, index=True)
    type: Mapped[str] = mapped_column(ShortStr, nullable=False)
    contract_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    contract_number: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    from_entity: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    to_entity: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    amount_ht: Mapped[float] = mapped_column(Float, nullable=False)
    tva_rate: Mapped[float] = mapped_column(Float, nullable=False)
    tva_amount: Mapped[float] = mapped_column(Float, nullable=False)
    amount_ttc: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    beneficiary_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stripe_charge_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class StripeConfig(Base):
    __tablename__ = "stripe_config"

    plan_id: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    price_id: Mapped[str] = mapped_column(ShortStr, nullable=False)
    product_id: Mapped[str] = mapped_column(ShortStr, nullable=False)


class Prescription(Base, TimestampMixin):
    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    guardian_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    guardian_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    prescriber_structure: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_name: Mapped[str] = mapped_column(MidStr, nullable=False)
    beneficiary_first_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    beneficiary_email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    beneficiary_phone: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    subscription_type: Mapped[str] = mapped_column(ShortStr, nullable=False)
    plan_label: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    guardian_contact_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    guardian_contact_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    contract_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    tracking_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    tracking_email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    subscribed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    commission_payment_date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class SentEmail(Base):
    __tablename__ = "sent_emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    to: Mapped[str] = mapped_column(MidStr, nullable=False, index=True)
    subject: Mapped[str] = mapped_column(MidStr, nullable=False)
    html_body: Mapped[str] = mapped_column(String, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="sent", nullable=False)
