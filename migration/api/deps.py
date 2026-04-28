"""Dépendances FastAPI : session DB async + auth JWT."""
from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.auth import User
from api.security import decode_token, sanitize_user


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    authorization: str | None = Header(None),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    try:
        payload = decode_token(authorization.split(" ", 1)[1])
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide")

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    # Renvoie un dict pour rester compatible avec l'ancien backend
    return {c.name: getattr(user, c.name) for c in user.__table__.columns}


def user_to_safe_dict(user: User) -> dict:
    raw = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    return sanitize_user(raw)
