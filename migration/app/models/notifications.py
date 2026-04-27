"""Notifications push, rappels, sleep alarms."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, jsonb_col


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    body: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    color: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    data = jsonb_col()
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class PushToken(Base):
    __tablename__ = "push_tokens"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    push_token: Mapped[str] = mapped_column(String(512), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    subscription = jsonb_col(nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PushPreference(Base):
    __tablename__ = "push_preferences"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    sos_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    health_thresholds: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fall_detection: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    low_battery: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminders_hydration: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminders_medication: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reminders_alarm: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    interventions: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    guardian_requests: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PushLog(Base):
    __tablename__ = "push_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    body: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    category: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PushHistory(Base):
    __tablename__ = "push_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    payload = jsonb_col()
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    time: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    label: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    days = jsonb_col()
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    dosage: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    volume: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    benefits: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ingredients: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ReminderVibration(Base):
    __tablename__ = "reminder_vibrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    reminder_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SleepAlarm(Base):
    __tablename__ = "sleep_alarms"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    wake_time: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WakeVibration(Base):
    __tablename__ = "wake_vibrations"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    wake_time: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class BedtimeNotification(Base):
    __tablename__ = "bedtime_notifications"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    bedtime: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SmsInvitation(Base):
    __tablename__ = "sms_invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    payload = jsonb_col()
    status: Mapped[str | None] = mapped_column(ShortStr, default="sent", nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
