from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid, random, string, logging, math

from database import db
from auth import get_current_user
from models import (
    ActivationCodeCreate, ActivationCodeUpdate, InterventionCodeCreate,
    InterventionRadiusUpdate,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== ACTIVATION CODES ====================
@router.post("/admin/activation-codes")
async def create_activation_code(data: ActivationCodeCreate, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    doc = {
        "id": str(uuid.uuid4()), "code": code, "structure_name": data.structure_name, "max_uses": data.max_uses,
        "uses_count": 0, "active": True, "created_at": datetime.now(timezone.utc).isoformat(), "created_by": user['id'],
        "raison_sociale": data.raison_sociale, "siret": data.siret, "tva": data.tva,
        "adresse": data.adresse, "telephone": data.telephone, "email_contact": data.email_contact,
    }
    await db.activation_codes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}


@router.get("/admin/activation-codes")
async def get_activation_codes(user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    return await db.activation_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.put("/admin/activation-codes/{code_id}")
async def update_activation_code(code_id: str, data: ActivationCodeUpdate, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        await db.activation_codes.update_one({"id": code_id}, {"$set": update})
    return {"status": "updated"}


@router.put("/admin/activation-codes/{code_id}/toggle")
async def toggle_activation_code(code_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_doc = await db.activation_codes.find_one({"id": code_id}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404)
    new_active = not code_doc.get('active', True)
    await db.activation_codes.update_one({"id": code_id}, {"$set": {"active": new_active}})
    return {"status": "toggled", "active": new_active}


@router.delete("/admin/activation-codes/{code_id}")
async def delete_activation_code(code_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    await db.activation_codes.delete_one({"id": code_id})
    return {"status": "deleted"}


# ==================== INTERVENTION CODES ====================
@router.post("/admin/intervention-codes")
async def create_intervention_code(data: InterventionCodeCreate, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_val = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    now = datetime.now(timezone.utc).isoformat()
    code = {
        "id": str(uuid.uuid4()), "code": code_val, "structure_name": data.structure_name,
        "max_uses": data.max_uses, "uses_count": 0, "active": True,
        "default_radius_km": data.radius_km,
        "base_location": {"latitude": 48.8566, "longitude": 2.3522},
        "created_at": now, "created_by": user['id'],
        "raison_sociale": data.raison_sociale, "siret": data.siret, "tva": data.tva,
        "adresse": data.adresse, "telephone": data.telephone, "email_contact": data.email_contact,
    }
    await db.intervention_codes.insert_one(code)
    return {k: v for k, v in code.items() if k != '_id'}


@router.get("/admin/intervention-codes")
async def list_intervention_codes(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    return await db.intervention_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.put("/admin/intervention-codes/{code_id}")
async def update_intervention_code(code_id: str, data: ActivationCodeUpdate, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        await db.intervention_codes.update_one({"id": code_id}, {"$set": update})
    return {"status": "updated"}


@router.put("/admin/intervention-codes/{code_id}/toggle")
async def toggle_intervention_code(code_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_doc = await db.intervention_codes.find_one({"id": code_id}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404)
    new_active = not code_doc.get('active', True)
    await db.intervention_codes.update_one({"id": code_id}, {"$set": {"active": new_active}})
    return {"status": "toggled", "active": new_active}


@router.delete("/admin/intervention-codes/{code_id}")
async def delete_intervention_code(code_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    await db.intervention_codes.delete_one({"id": code_id})
    return {"status": "deleted"}


@router.get("/admin/intervention-providers")
async def list_intervention_providers(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    providers = await db.users.find({"is_intervention_provider": True}, {"_id": 0, "password_hash": 0}).to_list(100)
    return providers


@router.put("/admin/intervention-radius")
async def update_intervention_radius(data: InterventionRadiusUpdate, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    await db.intervention_codes.update_one({"id": data.structure_id}, {"$set": {"default_radius_km": data.radius_km}})
    return {"status": "updated"}


# ==================== BACKOFFICE ====================
@router.get("/backoffice/stats")
async def get_bo_stats():
    return {
        "total_users": await db.users.count_documents({}), "beneficiaries": await db.users.count_documents({"role": "beneficiary"}),
        "guardians": await db.users.count_documents({"role": "guardian"}), "prescribers": await db.users.count_documents({"is_prescriber": True}),
        "total_alerts": await db.alerts.count_documents({}), "active_alerts": await db.alerts.count_documents({"status": "active"}),
        "prescriptions": await db.prescriptions.count_documents({}), "subscribed_prescriptions": await db.prescriptions.count_documents({"status": "subscribed"}),
        "interventions": await db.interventions.count_documents({}), "teleconsults": await db.teleconsults.count_documents({}),
        "teleassistance_calls": await db.teleassistance_calls.count_documents({}), "activation_codes": await db.activation_codes.count_documents({"active": True}),
    }


@router.get("/backoffice/users")
async def get_bo_users():
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)


@router.get("/backoffice/alerts")
async def get_bo_alerts():
    return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/backoffice/interventions")
async def get_bo_interventions():
    return await db.interventions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.get("/backoffice/prescriptions")
async def get_bo_prescriptions():
    return await db.prescriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/backoffice/kpi")
async def get_kpi_data():
    now = datetime.now(timezone.utc)
    users_by_role = {}
    for role in ['beneficiary', 'guardian', 'admin', 'teleassistance']:
        users_by_role[role] = await db.users.count_documents({"role": role})
    alert_types = {}
    for at in ['sos', 'fall', 'anomaly', 'inactivity']:
        alert_types[at] = await db.alerts.count_documents({"alert_type": at})
    interventions_by_status = {}
    for st in ['dispatched', 'en_route', 'completed', 'cancelled']:
        interventions_by_status[st] = await db.interventions.count_documents({"status": st})
    alerts_by_day = []
    for i in range(7):
        day = now - timedelta(days=6 - i)
        day_str = day.strftime("%Y-%m-%d")
        count = await db.alerts.count_documents({"created_at": {"$gte": day_str, "$lt": (day + timedelta(days=1)).strftime("%Y-%m-%d")}})
        alerts_by_day.append({"date": day_str, "count": count})
    resolved = await db.alerts.find({"status": "resolved", "resolved_at": {"$ne": None}}, {"_id": 0}).to_list(100)
    total_minutes = 0
    count_resolved = 0
    for a in resolved:
        try:
            created = datetime.fromisoformat(a['created_at'].replace('Z', '+00:00'))
            resolved_at = datetime.fromisoformat(a['resolved_at'].replace('Z', '+00:00'))
            total_minutes += (resolved_at - created).total_seconds() / 60
            count_resolved += 1
        except:
            pass
    avg_resolution = round(total_minutes / count_resolved, 1) if count_resolved > 0 else 0
    return {
        "total_users": await db.users.count_documents({}),
        "total_alerts": await db.alerts.count_documents({}),
        "total_interventions": await db.interventions.count_documents({}),
        "active_subscriptions": await db.prescriptions.count_documents({"status": "subscribed"}),
        "pending_subscriptions": await db.prescriptions.count_documents({"status": "pending"}),
        "avg_resolution_minutes": avg_resolution,
        "users_by_role": users_by_role, "alert_types": alert_types,
        "interventions_by_status": interventions_by_status, "alerts_by_day": alerts_by_day,
    }
