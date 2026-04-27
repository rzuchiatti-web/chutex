"""Devices, bracelet, dorsi, geofences, locations, firmware."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import IdStr, MidStr, ShortStr, TimestampMixin, jsonb_col


class Device(Base):
    __tablename__ = "devices"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    type: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    model: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    battery: Mapped[int | None] = mapped_column(Integer, nullable=True)
    connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    paired: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    firmware: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str | None] = mapped_column(ShortStr, nullable=True)


class BraceletCommand(Base, TimestampMixin):
    __tablename__ = "bracelet_commands"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    command: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    ble_cmd: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ble_payload = jsonb_col()
    type: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    message: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="pending", nullable=False, index=True)


class LefuDevice(Base):
    __tablename__ = "lefu_devices"

    mac: Mapped[str] = mapped_column(ShortStr, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(IdStr, nullable=True, index=True)
    sn: Mapped[str | None] = mapped_column(ShortStr, nullable=True)
    name: Mapped[str | None] = mapped_column(MidStr, nullable=True)
    payload = jsonb_col()
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DorsiBilan(Base):
    __tablename__ = "dorsi_bilans"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    flexion_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extension_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lateral_left_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lateral_right_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rotation_left_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rotation_right_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)


class DorsiProgram(Base, TimestampMixin):
    __tablename__ = "dorsi_programs"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    bilan_id: Mapped[str | None] = mapped_column(IdStr, nullable=True)
    status: Mapped[str] = mapped_column(ShortStr, default="active", nullable=False, index=True)
    current_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    days = jsonb_col()


class Location(Base):
    __tablename__ = "locations"

    user_id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Geofence(Base, TimestampMixin):
    __tablename__ = "geofences"

    id: Mapped[str] = mapped_column(IdStr, primary_key=True)
    user_id: Mapped[str] = mapped_column(IdStr, nullable=False, index=True)
    name: Mapped[str] = mapped_column(MidStr, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    radius_m: Mapped[float] = mapped_column(Float, default=500, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Firmware(Base):
    __tablename__ = "firmware"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_type: Mapped[str] = mapped_column(ShortStr, nullable=False, index=True)
    version: Mapped[str] = mapped_column(ShortStr, nullable=False)
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_latest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
