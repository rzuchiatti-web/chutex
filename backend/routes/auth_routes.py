from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid, random, string

from database import db
from auth import get_current_user, hash_password, verify_password, create_token, sanitize_user
from models import UserRegister, UserLogin

router = APIRouter()


@router.post("/auth/send-verification-code")
async def send_verification_code(data: dict):
    """Send a 6-digit SMS verification code to a phone number."""
    phone = data.get("phone", "").strip()
    if not phone or len(phone) < 6:
        raise HTTPException(status_code=400, detail="Numero de telephone invalide")
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    await db.verification_codes.delete_many({"phone": phone})
    await db.verification_codes.insert_one({
        "phone": phone, "code": code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
    })
    try:
        from services.smsmode_service import send_sms
        text = f"Votre code de verification Chutex : {code}"
        sent = await send_sms(phone, text)
        if not sent:
            return {"status": "sent", "message": "Code envoye (mode dev)", "dev_code": code}
    except Exception:
        return {"status": "sent", "message": "Code envoye (mode dev)", "dev_code": code}
    return {"status": "sent", "message": "Code envoye par SMS"}


@router.post("/auth/verify-code")
async def verify_code(data: dict):
    """Verify a phone verification code."""
    phone = data.get("phone", "").strip()
    code = data.get("code", "").strip()
    if not phone or not code:
        raise HTTPException(status_code=400, detail="Telephone et code requis")
    record = await db.verification_codes.find_one({"phone": phone, "code": code}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Code incorrect")
    if record.get("expires_at") and record["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code expire, renvoyez un nouveau code")
    await db.verification_codes.delete_many({"phone": phone})
    return {"status": "verified", "message": "Telephone verifie"}


@router.post("/auth/register")
async def register(data: UserRegister):
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(status_code=400, detail="Email deja utilise")
    uid = str(uuid.uuid4())
    user = {
        "id": uid, "email": data.email, "password_hash": hash_password(data.password),
        "name": data.name, "phone": data.phone, "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "beneficiaries": [], "guardians": [], "location_sharing": "alert_only",
        "date_of_birth": data.date_of_birth, "gender": data.gender, "address": data.address,
        "height_cm": data.height_cm, "weight_kg": data.weight_kg, "blood_type": data.blood_type,
        "allergies": data.allergies, "medical_conditions": data.medical_conditions,
        "emergency_contact_name": data.emergency_contact_name,
        "emergency_contact_phone": data.emergency_contact_phone,
        "doctor_name": data.doctor_name,
        "guardian_type": data.guardian_type, "structure_name": data.structure_name,
        "siret": data.siret, "profession": data.profession, "relationship": data.relationship,
        "is_prescriber": False, "prescriber_structure": "", "prescriber_code_used": "",
    }
    if data.role == "guardian" and data.prescriber_code:
        code = await db.activation_codes.find_one({"code": data.prescriber_code, "active": True}, {"_id": 0})
        if code and code.get('uses_count', 0) < code.get('max_uses', 50):
            user['is_prescriber'] = True
            user['prescriber_structure'] = code.get('structure_name', '')
            user['prescriber_code_used'] = data.prescriber_code
            await db.activation_codes.update_one({"code": data.prescriber_code}, {"$inc": {"uses_count": 1}})
    await db.users.insert_one(user)
    # Auto-generate activation + intervention codes for SAAD
    if data.role == "prescriber_company":
        struct = data.structure_name or data.name or "SAAD"
        prefix = struct.replace(" ", "")[:6].upper()
        act_code = f"PRESC-{prefix}-{str(uuid.uuid4())[:4].upper()}"
        iv_code = f"CARE-{prefix}-{str(uuid.uuid4())[:4].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()
        await db.activation_codes.insert_one({"id": str(uuid.uuid4()), "code": act_code, "structure_name": struct, "siret": data.siret or "", "max_uses": 100, "uses_count": 0, "active": True, "created_at": now_str, "created_by": uid})
        await db.intervention_codes.insert_one({"id": str(uuid.uuid4()), "code": iv_code, "structure_name": struct, "siret": data.siret or "", "default_radius_km": 30, "active": True, "created_at": now_str, "created_by": uid})
        await db.users.update_one({"id": uid}, {"$set": {"activation_code": act_code, "intervention_code": iv_code}})
    if data.role == "beneficiary":
        for dt, nm in [("bracelet", "Bracelet Sante"), ("scale", "Balance Connectee"), ("vest", "Gilet Anti-Chute")]:
            await db.devices.insert_one({"id": str(uuid.uuid4()), "user_id": uid, "device_type": dt, "name": nm, "connected": False, "battery": random.randint(60, 95), "last_sync": None})
        if data.phone:
            presc = await db.prescriptions.find_one({"beneficiary_phone": data.phone, "status": "pending"}, {"_id": 0})
            if presc:
                await db.prescriptions.update_one({"id": presc['id']}, {"$set": {"status": "subscribed", "beneficiary_id": uid, "subscribed_at": datetime.now(timezone.utc).isoformat()}})
                await db.users.update_one({"id": presc['guardian_id']}, {"$addToSet": {"beneficiaries": uid}})
                await db.users.update_one({"id": uid}, {"$addToSet": {"guardians": presc['guardian_id']}})
    return {"token": create_token(uid, data.role), "user": sanitize_user(user)}


@router.post("/auth/login")
async def login(data: UserLogin):
    identifier = data.email.strip()
    # Search by email first
    user = await db.users.find_one({"email": identifier}, {"_id": 0})
    if not user:
        # Try by phone number
        import re
        cleaned = re.sub(r'[\s\-\.\(\)]', '', identifier)
        if cleaned.startswith('0') and len(cleaned) == 10:
            cleaned = '+33' + cleaned[1:]
        if cleaned.startswith('+'):
            user = await db.users.find_one({"phone": {"$regex": cleaned[-9:]}}, {"_id": 0})
        if not user:
            # Try partial match
            user = await db.users.find_one({"phone": identifier}, {"_id": 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect")
    active = user.get('active_role', user['role'])
    return {"token": create_token(user['id'], active), "user": sanitize_user(user)}


@router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return sanitize_user(user)


@router.put("/auth/update-profile")
async def update_profile(data: dict, user=Depends(get_current_user)):
    update = {}
    for key in ['name', 'phone', 'address', 'date_of_birth', 'gender', 'avatar_url', 'email',
                'height_cm', 'weight_kg', 'blood_type', 'allergies', 'medical_conditions',
                'emergency_contact_name', 'emergency_contact_phone', 'doctor_name',
                'pacemaker', 'stents', 'thyroid', 'other_condition', 'surgeries']:
        if key in data:
            update[key] = data[key]
    # Handle boolean fields - never delete data, just toggle status
    if 'is_intervention_provider' in data:
        update['is_intervention_provider'] = data['is_intervention_provider']
    if 'is_prescriber' in data:
        update['is_prescriber'] = data['is_prescriber']
    if update:
        await db.users.update_one({"id": user['id']}, {"$set": update})
    updated = await db.users.find_one({"id": user['id']}, {"_id": 0})
    return {"status": "updated", "user": sanitize_user(updated)}


@router.put("/auth/change-password")
async def change_password(data: dict, user=Depends(get_current_user)):
    if not verify_password(data.get('old_password', ''), user['password_hash']):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    new_pw = data.get('new_password', '')
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Min. 6 caracteres")
    await db.users.update_one({"id": user['id']}, {"$set": {"password_hash": hash_password(new_pw)}})
    return {"status": "password_changed"}


@router.post("/contact")
async def send_contact(data: dict, user=Depends(get_current_user)):
    import logging
    logging.info(f"CONTACT FORM from {data.get('name', user['name'])} ({data.get('email', user['email'])}): {data.get('message', '')}")
    await db.contact_messages.insert_one({
        "id": str(uuid.uuid4()), "user_id": user['id'], "name": data.get('name', user['name']),
        "email": data.get('email', user['email']), "message": data.get('message', ''),
        "to": "contact@chutex-innovation.com",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "sent", "message": "Message envoye a contact@chutex-innovation.com"}


@router.post("/auth/activate-beneficiary")
async def activate_beneficiary_role(data: dict, user=Depends(get_current_user)):
    """Guardian activates a beneficiary space - fills beneficiary form"""
    if user.get('has_beneficiary_space'):
        return {"status": "already_active", "message": "Espace beneficiaire deja actif"}
    update = {
        "has_beneficiary_space": True,
        "date_of_birth": data.get("date_of_birth", ""),
        "gender": data.get("gender", ""),
        "height_cm": data.get("height_cm"),
        "weight_kg": data.get("weight_kg"),
        "blood_type": data.get("blood_type", ""),
        "allergies": data.get("allergies", ""),
        "medical_conditions": data.get("medical_conditions", ""),
        "emergency_contact_name": data.get("emergency_contact_name", ""),
        "emergency_contact_phone": data.get("emergency_contact_phone", ""),
        "doctor_name": data.get("doctor_name", ""),
    }
    if data.get("address"): update["address"] = data["address"]
    await db.users.update_one({"id": user['id']}, {"$set": update})
    return {"status": "activated", "message": "Espace beneficiaire active"}


@router.post("/auth/switch-role")
async def switch_active_role(data: dict, user=Depends(get_current_user)):
    """Switch the active role between guardian and beneficiary"""
    target = data.get("role", "")
    if target == "beneficiary":
        if user.get("role") != "beneficiary" and not user.get("has_beneficiary_space"):
            raise HTTPException(status_code=400, detail="Activez d'abord votre espace beneficiaire")
        await db.users.update_one({"id": user['id']}, {"$set": {"active_role": "beneficiary"}})
    elif target == "guardian":
        if user.get("role") != "guardian" and not user.get("has_guardian_space"):
            raise HTTPException(status_code=400, detail="Activez d'abord votre espace gardien")
        await db.users.update_one({"id": user['id']}, {"$set": {"active_role": "guardian"}})
    else:
        raise HTTPException(status_code=400, detail="Role invalide")
    u = await db.users.find_one({"id": user['id']}, {"_id": 0, "password_hash": 0})
    return {"status": "switched", "active_role": target, "user": sanitize_user(u)}


@router.post("/auth/activate-guardian")
async def activate_guardian_role(data: dict, user=Depends(get_current_user)):
    """Beneficiary activates a guardian space"""
    if user.get('has_guardian_space'):
        return {"status": "already_active", "message": "Espace gardien deja actif"}
    update = {
        "has_guardian_space": True,
        "guardian_type": data.get("guardian_type", "particular"),
        "relationship": data.get("relationship", ""),
        "structure_name": data.get("structure_name", ""),
        "profession": data.get("profession", ""),
        "siret": data.get("siret", ""),
    }
    await db.users.update_one({"id": user['id']}, {"$set": update})
    return {"status": "activated", "message": "Espace gardien active"}



