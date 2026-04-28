"""Helpers communs pour les routes SQLAlchemy."""
from __future__ import annotations

from datetime import datetime, timezone


def row_to_dict(obj) -> dict:
    """Convert a SQLAlchemy ORM row to a plain dict."""
    if obj is None:
        return {}
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def rows_to_dicts(rows) -> list[dict]:
    return [row_to_dict(r) for r in rows]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def utcnow_iso() -> str:
    return utcnow().isoformat()


def get_effective_role(user: dict) -> str:
    return user.get("active_role") or user.get("role") or "beneficiary"
