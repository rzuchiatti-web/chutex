"""Aidants (guardians), prescripteurs, SAAD, codes d'activation."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class Guardian(Base, TimestampMixin):
    __tablename__ = "guardians"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    guardian_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    guardian_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    guardian_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    relationship: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="active", nullable=True, index=True)


class GuardianBeneficiary(Base):
    __tablename__ = "guardian_beneficiaries"

    guardian_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="active", nullable=True)


class GuardianRelationship(Base):
    __tablename__ = "guardian_relationships"

    guardian_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    relationship: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class GuardianPermission(Base, TimestampMixin):
    __tablename__ = "guardian_permissions"

    guardian_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alert_types = jsonb_col()
    health_data_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    health_data_types = jsonb_col()
    location_mode: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    guardian_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    guardian_alert_types = jsonb_col()
    guardian_health_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    guardian_location_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class GuardianRequest(Base, TimestampMixin):
    __tablename__ = "guardian_requests"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    guardian_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    relationship: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True, index=True)


class GuardianInvitation(Base, TimestampMixin):
    __tablename__ = "guardian_invitations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    invited_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    invited_email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    relationship: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    payload = jsonb_col()


class GuardianLink(Base, TimestampMixin):
    __tablename__ = "guardian_links"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    guardian_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="active", nullable=True)


class LinkCode(Base):
    __tablename__ = "link_codes"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    company_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    name: Mapped[str] = mapped_column(MidStr, nullable=False)
    address: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ActivationCode(Base):
    __tablename__ = "activation_codes"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    structure_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    raison_sociale: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    siret: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    tva: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    telephone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    email_contact: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    max_uses: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    uses_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class InterventionCode(Base):
    __tablename__ = "intervention_codes"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    structure_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    default_radius_km: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    raison_sociale: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    siret: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    tva: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    telephone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    email_contact: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    max_uses: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    uses_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    base_location = jsonb_col()
    created_by: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# --- SAAD ---------------------------------------------------------------------
class SaadAccount(Base, TimestampMixin):
    __tablename__ = "saad_accounts"

    saad_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    company_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    email: Mapped[str | None] = mapped_column(MidStr, nullable=True, index=True)
    iban: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    commission_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="active", nullable=True)


class SaadGuardianLink(Base):
    __tablename__ = "saad_guardian_links"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    company_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    company_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    guardian_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    guardian_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SaadStripe(Base):
    __tablename__ = "saad_stripe"

    saad_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    account_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    company_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    commission_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    commission_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SaadCommission(Base):
    __tablename__ = "saad_commissions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    saad_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    contract_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SaadInvitation(Base):
    __tablename__ = "saad_invitations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    saad_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    invited_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    invited_email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    payload = jsonb_col()
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
