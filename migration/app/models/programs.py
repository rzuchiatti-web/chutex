"""Programmes de santé, équipes, minceur."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    title: Mapped[str] = mapped_column(MidStr, nullable=False)
    subtitle: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    color: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    duration_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    difficulty: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    effort: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    benefits = jsonb_col()
    data_used = jsonb_col()
    medical_disclaimer: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    onboarding_fields = jsonb_col()
    tracked_metrics = jsonb_col()
    phases = jsonb_col()
    daily_tasks_template = jsonb_col()
    requires: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    requires_label: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(1024), nullable=True)


class ProgramEnrollment(Base):
    __tablename__ = "program_enrollments"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    current_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_days = jsonb_col()
    checkins = jsonb_col()
    mode: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    onboarding = jsonb_col()
    health_snapshot_start = jsonb_col()
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stopped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProgramCheckin(Base):
    __tablename__ = "program_checkins"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    completed_tasks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class ProgramTaskProgress(Base, TimestampMixin):
    __tablename__ = "program_task_progress"

    enrollment_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tasks_done_indices = jsonb_col()
    task_ratings = jsonb_col()
    notes = jsonb_col()


class ProgramHealthBaseline(Base):
    __tablename__ = "program_health_baselines"

    program_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    onboarding = jsonb_col()


class TeamProgram(Base, TimestampMixin):
    __tablename__ = "team_programs"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    start_date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_by: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    members = jsonb_col()
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)


class TeamActivityFeed(Base):
    __tablename__ = "team_activity_feed"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    team_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    user_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    action_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    detail: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    icon: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    color: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    team_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    invited_phone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    invited_email: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, default="pending", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# --- Minceur -----------------------------------------------------------------
class MinceurGoal(Base, TimestampMixin):
    __tablename__ = "minceur_goals"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    target_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)


class MinceurProgram(Base):
    __tablename__ = "minceur_programs"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    start_date: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    plan_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class MinceurTracking(Base):
    __tablename__ = "minceur_tracking"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    completed = jsonb_col()
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MinceurDailyCache(Base):
    __tablename__ = "minceur_daily_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    date: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recommendations = jsonb_col()
