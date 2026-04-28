"""Routes auth : register, login, me, send-code, verify-code, forgot/reset password,
update profile, change password, contract-prefill.

Réplique l'API existante du backend FastAPI Mongo, branchée sur Postgres.
"""
from __future__ import annotations

import logging
import random
import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from api.schemas import UserLogin, UserRegister
from api.security import create_token, hash_password, sanitize_user, verify_password
from app.models.auth import User, VerificationCode
from app.models.guardian import ActivationCode, InterventionCode
from app.models.pro import ProApplication
from app.models.shop import Prescription

logger = logging.getLogger(__name__)
router = APIRouter()


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\.\(\)]", "", phone or "")
    if cleaned.startswith("0") and len(cleaned) == 10:
        return "+33" + cleaned[1:]
    return cleaned


@router.post("/auth/send-verification-code")
async def send_verification_code(
    data: dict, session: AsyncSession = Depends(get_session)
):
    phone = (data.get("phone") or "").strip()
    if not phone or len(phone) < 6:
        raise HTTPException(400, "Numero de telephone invalide")
    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    now = datetime.now(timezone.utc)

    # Purge anciens codes
    res = await session.execute(select(VerificationCode).where(VerificationCode.phone == phone))
    for old in res.scalars():
        await session.delete(old)

    session.add(VerificationCode(
        phone=phone, code=code,
        created_at=now, expires_at=now + timedelta(minutes=5),
    ))
    await session.commit()

    # SMS provider à brancher en prod (ex: SMSMode, Twilio)
    return {"status": "sent", "message": "Code envoye (mode dev)", "dev_code": code}


@router.post("/auth/verify-code")
async def verify_code(data: dict, session: AsyncSession = Depends(get_session)):
    phone = (data.get("phone") or "").strip()
    code = (data.get("code") or "").strip()
    if not phone or not code:
        raise HTTPException(400, "Telephone et code requis")
    res = await session.execute(
        select(VerificationCode).where(
            VerificationCode.phone == phone, VerificationCode.code == code
        )
    )
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(400, "Code incorrect")
    if record.expires_at and record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Code expire, renvoyez un nouveau code")
    res = await session.execute(select(VerificationCode).where(VerificationCode.phone == phone))
    for old in res.scalars():
        await session.delete(old)
    await session.commit()
    return {"status": "verified", "message": "Telephone verifie"}


@router.post("/auth/register")
async def register(data: UserRegister, session: AsyncSession = Depends(get_session)):
    # Unicité email + téléphone (pas de contrainte UNIQUE en base : on check côté app)
    res = await session.execute(
        select(User).where(or_(User.email == data.email, User.phone == data.phone))
    )
    if res.scalar_one_or_none():
        raise HTTPException(400, "Ce numero de telephone est deja utilise")

    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        phone=data.phone,
        role=data.role,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        blood_type=data.blood_type,
        allergies=data.allergies,
        medical_conditions=data.medical_conditions,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        doctor_name=data.doctor_name,
        guardian_type=data.guardian_type,
        structure_name=data.structure_name,
        siret=data.siret,
        profession=data.profession,
        relationship=data.relationship,
        location_sharing="alert_only",
        is_prescriber=False,
    )

    # Code prescripteur ?
    if data.role == "guardian" and data.prescriber_code:
        res = await session.execute(
            select(ActivationCode).where(
                ActivationCode.code == data.prescriber_code,
                ActivationCode.active == True,  # noqa: E712
            )
        )
        ac = res.scalar_one_or_none()
        if ac and (ac.uses_count or 0) < (ac.max_uses or 50):
            user.is_prescriber = True
            user.prescriber_structure = ac.structure_name
            user.prescriber_code_used = data.prescriber_code
            ac.uses_count = (ac.uses_count or 0) + 1

    # Application Pro approuvée ?
    if data.role == "guardian" and data.phone:
        phone_clean = normalize_phone(data.phone)
        res = await session.execute(
            select(ProApplication).where(
                ProApplication.phone == phone_clean,
                ProApplication.status == "approved",
            )
        )
        pro_app = res.scalar_one_or_none()
        if pro_app:
            user.is_prescriber = True
            pro_app.status = "activated"

    session.add(user)

    # SAAD : génère codes activation + intervention
    if data.role == "prescriber_company":
        struct = data.structure_name or data.name or "SAAD"
        async def unique_code(model) -> str:
            while True:
                c = str(random.randint(100000, 999999))
                exists = await session.execute(select(model).where(model.code == c))
                if not exists.scalar_one_or_none():
                    return c

        act_code = await unique_code(ActivationCode)
        iv_code = await unique_code(InterventionCode)
        session.add(ActivationCode(
            id=str(uuid.uuid4()), code=act_code, structure_name=struct,
            siret=data.siret or "", max_uses=100, uses_count=0, active=True,
            created_by=uid, created_at=datetime.now(timezone.utc),
        ))
        session.add(InterventionCode(
            id=str(uuid.uuid4()), code=iv_code, structure_name=struct,
            siret=data.siret or "", default_radius_km=30, active=True,
            created_by=uid, created_at=datetime.now(timezone.utc),
        ))

    # Prescription en attente côté bénéficiaire ?
    if data.role == "beneficiary" and data.phone:
        res = await session.execute(
            select(Prescription).where(
                Prescription.beneficiary_phone == data.phone,
                Prescription.status == "pending",
            )
        )
        presc = res.scalar_one_or_none()
        if presc:
            presc.status = "subscribed"
            presc.beneficiary_id = uid
            presc.subscribed_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(user)

    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    return {"token": create_token(uid, data.role), "user": sanitize_user(user_dict)}


@router.post("/auth/login")
async def login(data: UserLogin, session: AsyncSession = Depends(get_session)):
    identifier = data.email.strip()
    res = await session.execute(select(User).where(User.email == identifier))
    user = res.scalar_one_or_none()
    if not user:
        cleaned = normalize_phone(identifier)
        if cleaned:
            res = await session.execute(
                select(User).where(User.phone.like(f"%{cleaned[-9:]}"))
            )
            user = res.scalar_one_or_none()
        if not user:
            res = await session.execute(select(User).where(User.phone == identifier))
            user = res.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash or ""):
        raise HTTPException(401, "Identifiant ou mot de passe incorrect")

    active = user.active_role or user.role
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    return {"token": create_token(user.id, active), "user": sanitize_user(user_dict)}


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return sanitize_user(user)


@router.put("/auth/update-profile")
async def update_profile(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(User).where(User.id == user["id"]))
    db_user = res.scalar_one_or_none()
    if not db_user:
        raise HTTPException(404, "Utilisateur introuvable")

    allowed = {
        "name", "phone", "address", "date_of_birth", "gender", "avatar_url", "email",
        "height_cm", "weight_kg", "blood_type", "allergies", "medical_conditions",
        "emergency_contact_name", "emergency_contact_phone", "doctor_name",
        "pacemaker", "stents", "thyroid", "nora_welcome_seen",
        "structure_name", "siret",
    }
    for k, v in data.items():
        if k in allowed:
            setattr(db_user, k, v)
    await session.commit()
    await session.refresh(db_user)
    user_dict = {c.name: getattr(db_user, c.name) for c in db_user.__table__.columns}
    return {"status": "updated", "user": sanitize_user(user_dict)}


@router.put("/auth/change-password")
async def change_password(
    data: dict,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not verify_password(data.get("old_password", ""), user.get("password_hash") or ""):
        raise HTTPException(400, "Mot de passe actuel incorrect")
    new_pw = data.get("new_password", "")
    if len(new_pw) < 6:
        raise HTTPException(400, "Min. 6 caracteres")
    res = await session.execute(select(User).where(User.id == user["id"]))
    db_user = res.scalar_one_or_none()
    if db_user:
        db_user.password_hash = hash_password(new_pw)
        await session.commit()
    return {"status": "password_changed"}


@router.post("/auth/forgot-password")
async def forgot_password(data: dict, session: AsyncSession = Depends(get_session)):
    phone = (data.get("phone") or "").strip()
    if not phone or len(phone) < 6:
        raise HTTPException(400, "Numero de telephone invalide")
    cleaned = normalize_phone(phone)
    res = await session.execute(
        select(User).where(User.phone.like(f"%{cleaned[-9:]}"))
    )
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Aucun compte associe a ce numero")

    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    now = datetime.now(timezone.utc)
    session.add(VerificationCode(
        phone=cleaned, code=code,
        created_at=now, expires_at=now + timedelta(minutes=10),
    ))
    await session.commit()
    return {"status": "sent", "message": "Code envoye (mode dev)", "dev_code": code}


@router.post("/auth/reset-password")
async def reset_password(data: dict, session: AsyncSession = Depends(get_session)):
    phone = (data.get("phone") or "").strip()
    code = (data.get("code") or "").strip()
    new_password = (data.get("new_password") or "").strip()
    if not phone or not code or not new_password:
        raise HTTPException(400, "Telephone, code et nouveau mot de passe requis")
    if len(new_password) < 4:
        raise HTTPException(400, "Le mot de passe doit contenir au moins 4 caracteres")
    cleaned = normalize_phone(phone)
    res = await session.execute(
        select(VerificationCode).where(
            VerificationCode.phone == cleaned, VerificationCode.code == code
        )
    )
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(400, "Code incorrect")
    if record.expires_at and record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Code expire, renvoyez un nouveau code")
    res = await session.execute(
        select(User).where(User.phone.like(f"%{cleaned[-9:]}"))
    )
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    user.password_hash = hash_password(new_password)
    await session.delete(record)
    await session.commit()
    return {"status": "ok", "message": "Mot de passe reinitialise avec succes"}
