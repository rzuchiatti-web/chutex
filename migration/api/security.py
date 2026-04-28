"""Bcrypt hashing + JWT helpers — repris du backend FastAPI Mongo
pour conserver la **compatibilité des hash** existants (pas besoin de reset
des mots de passe au moment de la migration).
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXP_HOURS = int(os.environ.get("JWT_EXP_HOURS", "72"))


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    if not h:
        return False
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except (ValueError, TypeError):
        return False


def create_token(user_id: str, role: str) -> str:
    return jwt.encode(
        {
            "user_id": user_id,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def decode_token(token_str: str) -> dict:
    return jwt.decode(token_str, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# Champs sûrs renvoyés au front (jamais le password_hash)
SAFE_USER_FIELDS = {
    "id", "email", "name", "phone", "role", "active_role", "created_at",
    "date_of_birth", "gender", "address", "height_cm", "weight_kg",
    "blood_type", "allergies", "medical_conditions",
    "emergency_contact_name", "emergency_contact_phone", "doctor_name",
    "guardian_type", "structure_name", "siret", "profession", "relationship",
    "is_prescriber", "prescriber_structure", "prescriber_code_used",
    "has_guardian_space", "avatar_url", "latitude", "longitude",
    "location_sharing", "pacemaker", "stents", "thyroid",
    "nora_welcome_seen", "guardians", "beneficiaries",
}


def sanitize_user(u: dict) -> dict:
    return {k: u.get(k) for k in SAFE_USER_FIELDS if k in u}
