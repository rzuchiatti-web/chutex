"""Authentification + utilisateurs."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    email: Mapped[str] = mapped_column(MidStr, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(MidStr, nullable=False)
    phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    role: Mapped[str] = mapped_column(ShortStr, default="beneficiary", nullable=False, index=True)
    active_role: Mapped[str | None] = mapped_column(ShortStr, nullable=True)

    # Profil
    date_of_birth: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    address: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    height_cm: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    blood_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    allergies: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    pacemaker: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    stents: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    thyroid: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contacts d'urgence
    emergency_contact_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)

    # Données aidant / pro
    guardian_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    structure_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    siret: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    profession: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    relationship: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    is_prescriber: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    prescriber_structure: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    prescriber_code_used: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    has_guardian_space: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Localisation / partage
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_sharing: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    data_sharing_prefs = jsonb_col()

    # Stripe / Mollie
    mollie_customer_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)

    # UI
    nora_welcome_seen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    guardian_order = jsonb_col()
    beneficiaries = jsonb_col()
    guardians = jsonb_col()


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("ix_verification_codes_phone_code", "phone", "code"),)


class LiveActivityToken(Base):
    __tablename__ = "live_activity_tokens"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    alert_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    apns_token: Mapped[str] = mapped_column(String(512), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
