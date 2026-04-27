"""Espace professionnel (coachs, kinés, applications, programmes)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class ProApplication(Base, TimestampMixin):
    __tablename__ = "pro_applications"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    first_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    last_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(MidStr, nullable=True, index=True)
    city: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    diploma: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    diploma_year: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    specialization: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    adeli_rpps: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    siret: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    current_situation: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    current_clients: Mapped[int | None] = mapped_column(Integer, nullable=True)
    motivation: Mapped[str | None] = mapped_column(String(4096), nullable=True)
    signer_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    contract_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    contract_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)


class ProSubscription(Base, TimestampMixin):
    __tablename__ = "pro_subscriptions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    plan: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()


class ProConversation(Base, TimestampMixin):
    __tablename__ = "pro_conversations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    professional_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    last_message: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unread_pro: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unread_ben: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ProMessage(Base):
    __tablename__ = "pro_messages"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(IdStr, nullable=False)
    sender_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    content: Mapped[str | None] = mapped_column(String, nullable=True)
    message_type: Mapped[str | None] = mapped_column(ShortStr, default="text", nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class ProNotification(Base):
    __tablename__ = "pro_notifications"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    beneficiary_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    exercise_title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    message: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class ProExerciseTemplate(Base, TimestampMixin):
    __tablename__ = "pro_exercise_templates"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    is_template: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str] = mapped_column(MidStr, nullable=False)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    category: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    muscle_group: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    sets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    repetitions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipment: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    steps = jsonb_col()
    image: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)


class ProAssignedExercise(Base):
    __tablename__ = "pro_assigned_exercises"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    exercise_template_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    image: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    category: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    muscle_group: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    equipment: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    steps = jsonb_col()
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    days = jsonb_col()
    repetitions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    self_assigned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completions = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProMealTemplate(Base, TimestampMixin):
    __tablename__ = "pro_meal_templates"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    is_template: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str] = mapped_column(MidStr, nullable=False)
    meal_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    image: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    items = jsonb_col()
    ingredients = jsonb_col()
    steps = jsonb_col()
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proteins: Mapped[int | None] = mapped_column(Integer, nullable=True)
    glucides: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lipides: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)


class ProAssignedMeal(Base):
    __tablename__ = "pro_assigned_meals"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    meal_template_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    payload = jsonb_col()
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProMeal(Base):
    __tablename__ = "pro_meals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    date: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    meals = jsonb_col()
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProReminderTemplate(Base, TimestampMixin):
    __tablename__ = "pro_reminder_templates"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    is_template: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    title: Mapped[str] = mapped_column(MidStr, nullable=False)
    reminder_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    dosage: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    time: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    image: Mapped[str | None] = mapped_column(String(1024), nullable=True)


class ProAssignedReminder(Base):
    __tablename__ = "pro_assigned_reminders"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    reminder_template_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    professional_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    payload = jsonb_col()
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProProgram(Base, TimestampMixin):
    __tablename__ = "pro_programs"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    professional_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    professional_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    professional_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    beneficiary_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    beneficiary_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    frequency: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    sessions = jsonb_col()
