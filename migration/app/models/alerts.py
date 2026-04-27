"""Alertes, escalades, interventions, téléassistance."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    alert_type: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    severity: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    message: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    device_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    device_model: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    teleassistance_status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    vital_data = jsonb_col()
    threshold_data = jsonb_col()
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(IdStr, nullable=True)


class PredictiveAlert(Base, TimestampMixin):
    __tablename__ = "predictive_alerts"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    severity: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    color: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    message: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class AlertLiveStatus(Base):
    __tablename__ = "alert_live_status"

    alert_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AlertTracking(Base):
    __tablename__ = "alert_tracking"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    event: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class Escalation(Base, TimestampMixin):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    alert_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(ShortStr, default="in_progress", nullable=False, index=True)
    history = jsonb_col()
    answers = jsonb_col()
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)


class TeleassistanceCall(Base, TimestampMixin):
    __tablename__ = "teleassistance_calls"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    alert_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    operator_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    step: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    answers = jsonb_col()
    notes: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    resolution: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)


class TwilioCall(Base):
    __tablename__ = "twilio_calls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    call_sid: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    alert_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    to_number: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    from_number: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SpeechResponse(Base):
    __tablename__ = "speech_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    transcript: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    intent: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AudioCache(Base):
    __tablename__ = "audio_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cache_key: Mapped[str] = mapped_column(MidStr, unique=True, nullable=False, index=True)
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    voice: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    text_hash: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Teleconsult(Base, TimestampMixin):
    __tablename__ = "teleconsults"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    user_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    answers = jsonb_col()
    notes: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    call_number: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class Intervention(Base, TimestampMixin):
    __tablename__ = "interventions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    alert_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    intervenant_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    intervenant_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    structure_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    structure_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    answers = jsonb_col()
    report: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class InterventionTracking(Base):
    __tablename__ = "intervention_tracking"

    intervention_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    intervenant_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    intervenant_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    positions = jsonb_col()
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    severity: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    payload = jsonb_col()
    status: Mapped[str | None] = mapped_column(ShortStr, default="open", nullable=True)


class CarewatchIncident(Base, TimestampMixin):
    __tablename__ = "carewatch_incidents"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    device_mac: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
