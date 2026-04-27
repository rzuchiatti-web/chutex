"""Données de santé (vitales, ECG, glycémie, pesées, caches, seuils)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, jsonb_col


class HealthVital(Base):
    __tablename__ = "health_vitals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blood_pressure_sys: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blood_pressure_dia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    spo2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    hrv: Mapped[int | None] = mapped_column(Integer, nullable=True)
    respiratory_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class LatestVitals(Base):
    __tablename__ = "latest_vitals"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    last_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blood_pressure_sys: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blood_pressure_dia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    spo2: Mapped[int | None] = mapped_column(Integer, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    sleep_quality: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    hrv: Mapped[int | None] = mapped_column(Integer, nullable=True)
    respiratory_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class EcgRecord(Base):
    __tablename__ = "ecg_records"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data = jsonb_col(nullable=False)
    bpm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hrv: Mapped[int | None] = mapped_column(Integer, nullable=True)
    breath_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stress: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vascular_aging: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interpretation: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    rhythm: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    samples_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sample_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class GlycemiaHistory(Base):
    __tablename__ = "glycemia_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    date: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_glycemia: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    zone: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    algorithm_version: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    confidence_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ml_level: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class GlycemiaCalibration(Base):
    __tablename__ = "glycemia_calibrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    measured_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    delta: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Weighing(Base):
    __tablename__ = "weighings"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    mac: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    sn: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    device_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    muscle_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    bone_mass: Mapped[float | None] = mapped_column(Float, nullable=True)
    visceral_fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    metabolic_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    basal_metabolism: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    health_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impedance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impedance_segments = jsonb_col()
    scale_type: Mapped[int | None] = mapped_column(Integer, nullable=True)
    health_evaluation: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    raw_data = jsonb_col()


class DeviceReading(Base):
    """Lectures brutes des balances/devices (très volumineuse : ~80k+)."""
    __tablename__ = "device_readings"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    mac: Mapped[str | None] = mapped_column(ShortStr, nullable=True, index=True)
    sn: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    device_type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    source: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    bmi: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    muscle_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    bone_mass: Mapped[float | None] = mapped_column(Float, nullable=True)
    visceral_fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    metabolic_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    basal_metabolism: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protein_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    health_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impedance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impedance_segments = jsonb_col()
    scale_type: Mapped[int | None] = mapped_column(Integer, nullable=True)
    health_evaluation: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    raw_data = jsonb_col()

    __table_args__ = (Index("ix_device_readings_user_ts", "user_id", "timestamp"),)


class ScaleMember(Base):
    __tablename__ = "scale_members"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    mac: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    member_id: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    user_name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    gender: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reference_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Threshold(Base):
    __tablename__ = "thresholds"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    metric_id: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    min_val: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_val: Mapped[float | None] = mapped_column(Float, nullable=True)
    goal: Mapped[float | None] = mapped_column(Float, nullable=True)


# --- Caches LLM / agrégats ---------------------------------------------------
class DashboardSummary(Base):
    __tablename__ = "dashboard_summary"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    bracelet = jsonb_col()


class DailyReportCache(Base):
    __tablename__ = "daily_report_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    cached_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    report = jsonb_col()


class HealthSummaryCache(Base):
    __tablename__ = "health_summary_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String, nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    status_color: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class BodyAgeCache(Base):
    __tablename__ = "body_age_cache"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    algorithm_version: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    body_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    computed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    explanation: Mapped[str | None] = mapped_column(String, nullable=True)
    last_reading_ts: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
