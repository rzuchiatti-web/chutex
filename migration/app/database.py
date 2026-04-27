"""Engine SQLAlchemy + Base déclarative.

Utilisable à la fois par Alembic (sync) et par une API FastAPI (async)."""
from __future__ import annotations

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


class Base(DeclarativeBase):
    """Base déclarative SQLAlchemy 2.x pour tous les modèles."""


# --- Sync (Alembic / scripts) -------------------------------------------------
SYNC_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/chutex_care",
)
sync_engine = create_engine(SYNC_DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False, future=True)


# --- Async (FastAPI) ----------------------------------------------------------
ASYNC_DATABASE_URL = os.environ.get(
    "DATABASE_URL_ASYNC",
    SYNC_DATABASE_URL.replace("+psycopg", "+asyncpg"),
)
async_engine = create_async_engine(ASYNC_DATABASE_URL, future=True, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False)
