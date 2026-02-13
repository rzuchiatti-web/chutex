import bcrypt, jwt, random, logging
from datetime import datetime, timezone, timedelta
from fastapi import Header, HTTPException, Depends
from database import db, JWT_SECRET, JWT_ALGORITHM

logger = logging.getLogger(__name__)

SAFE_FIELDS = [
    'id', 'email', 'name', 'phone', 'role', 'active_role', 'created_at', 'beneficiaries', 'guardians', 'location_sharing',
    'date_of_birth', 'gender', 'address', 'height_cm', 'weight_kg', 'blood_type', 'allergies', 'medical_conditions',
    'emergency_contact_name', 'emergency_contact_phone', 'doctor_name', 'guardian_type', 'structure_name', 'siret',
    'profession', 'relationship', 'is_prescriber', 'prescriber_structure', 'prescriber_code_used',
    'is_intervention_provider', 'intervention_structure', 'intervention_radius_km', 'intervention_location',
    'has_guardian_space', 'has_beneficiary_space', 'avatar_url', 'subscription_type', 'has_subscription',
    'latitude', 'longitude',
]


def hash_password(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p, h):
    return bcrypt.checkpw(p.encode(), h.encode())


def create_token(uid, role):
    return jwt.encode(
        {'user_id': uid, 'role': role, 'exp': datetime.now(timezone.utc) + timedelta(hours=72)},
        JWT_SECRET, algorithm=JWT_ALGORITHM,
    )


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Token manquant")
    try:
        payload = jwt.decode(authorization.split(' ')[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouve")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expire")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


def sanitize_user(u):
    r = {}
    for k in SAFE_FIELDS:
        if k in u:
            r[k] = u[k]
        elif k in ('beneficiaries', 'guardians'):
            r[k] = []
        elif k in ('is_prescriber',):
            r[k] = False
    return r


def get_effective_role(user: dict) -> str:
    """Returns the effective role: active_role if set, otherwise role"""
    return user.get('active_role') or user.get('role', 'beneficiary')
