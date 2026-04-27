"""Tout ce qui est divers : chat, streaks, caches Nora, RGPD, settings."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, jsonb_col


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    role: Mapped[str] = mapped_column(ShortStr, nullable=False)
    content: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class UserStreak(Base):
    __tablename__ = "user_streaks"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_checkin: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    badges = jsonb_col()


class ActivityStreak(Base):
    __tablename__ = "activity_streaks"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_active: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    last_achieved_day: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    last_evaluated_day: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    objectives_today = jsonb_col()


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    points_required: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payload = jsonb_col()


class RewardWinner(Base):
    __tablename__ = "reward_winners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    reward_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    awarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RewardHistory(Base):
    __tablename__ = "rewards_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# --- Nora caches (LLM) -------------------------------------------------------
class NoraAnalysisCache(Base):
    __tablename__ = "nora_analysis_cache"

    cache_key: Mapped[str] = mapped_column(MidStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    context: Mapped[str | None] = mapped_column(String, nullable=True)
    analysis: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class NoraPageAnalysisCache(Base):
    __tablename__ = "nora_page_analysis_cache"

    cache_key: Mapped[str] = mapped_column(MidStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    context: Mapped[str | None] = mapped_column(String, nullable=True)
    analysis: Mapped[str | None] = mapped_column(String, nullable=True)


class NoraHealthAnalysisCache(Base):
    __tablename__ = "nora_health_analysis_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    analysis: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class NoraAgingAnalysisCache(Base):
    __tablename__ = "nora_aging_analysis_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    analysis: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PersonalizedTasksCache(Base):
    __tablename__ = "personalized_tasks_cache"

    cache_key: Mapped[str] = mapped_column(MidStr, primary_key=True)
    tasks = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# --- RGPD / consents ---------------------------------------------------------
class RgpdRequest(Base):
    __tablename__ = "rgpd_requests"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str] = mapped_column(ShortStr, nullable=False)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    handled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserConsent(Base):
    __tablename__ = "user_consents"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    type: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payload = jsonb_col()


# --- Settings / divers --------------------------------------------------------
class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(MidStr, primary_key=True)
    value = jsonb_col()
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    name: Mapped[str] = mapped_column(MidStr, nullable=False)
    dosage: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    frequency: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    times = jsonb_col()
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class HealthData(Base):
    """Bucket générique d'évènements de santé bruts (très utilisé en read-only)."""
    __tablename__ = "health_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    payload = jsonb_col()
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    email: Mapped[str | None] = mapped_column(MidStr, nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    subject: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    message: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="new", nullable=False, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SharedReport(Base):
    __tablename__ = "shared_reports"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class VisitObservation(Base):
    __tablename__ = "visit_observations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    intervention_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    observation: Mapped[str | None] = mapped_column(String, nullable=True)
    payload = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ShopifyOrder(Base):
    """Ancien store Shopify, conservé pour archive."""
    __tablename__ = "shopify_orders"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    shopify_order_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    payload = jsonb_col()
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
