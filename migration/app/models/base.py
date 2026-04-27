"""Types et helpers communs aux modèles."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

# Type d'ID : on garde un VARCHAR(64) pour rester compatible avec les
# `uuid.uuid4().hex` (32 chars) générés côté backend FastAPI actuel,
# et avec d'éventuels IDs plus longs (Stripe, Mollie, etc.).
IdStr = String(128)
ShortStr = String(64)
MidStr = String(255)
LongStr = String(1024)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Mixins pratiques ------------------------------------------------------------
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=True,
    )


# Alias pour les colonnes JSONB nullables (les sous-documents flexibles)
def jsonb_col(default: dict | list | None = None, nullable: bool = True):
    return mapped_column(JSONB, nullable=nullable, default=default)
