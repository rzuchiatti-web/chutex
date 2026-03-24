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
        await db.activation_codes.update_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"$set": update})
    return {"status": "updated"}


@router.put("/admin/activation-codes/{code_id}/toggle")
async def toggle_activation_code(code_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_doc = await db.activation_codes.find_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Code non trouve")
    new_active = not code_doc.get('active', True)
    await db.activation_codes.update_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"$set": {"active": new_active}})
    return {"status": "toggled", "active": new_active}


@router.delete("/admin/activation-codes/{code_id}")
async def delete_activation_code(code_id: str, user=Depends(get_current_user)):
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    await db.activation_codes.delete_one({"$or": [{"id": code_id}, {"code": code_id}]})
    return {"status": "deleted"}


# ==================== INTERVENTION CODES ====================
@router.post("/admin/intervention-codes")
async def create_intervention_code(data: InterventionCodeCreate, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_val = data.code if hasattr(data, 'code') and data.code else ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
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
        await db.intervention_codes.update_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"$set": update})
    return {"status": "updated"}


@router.put("/admin/intervention-codes/{code_id}/toggle")
async def toggle_intervention_code(code_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    code_doc = await db.intervention_codes.find_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Code non trouve")
    new_active = not code_doc.get('active', True)
    await db.intervention_codes.update_one({"$or": [{"id": code_id}, {"code": code_id}]}, {"$set": {"active": new_active}})
    return {"status": "toggled", "active": new_active}


@router.delete("/admin/intervention-codes/{code_id}")
async def delete_intervention_code(code_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    await db.intervention_codes.delete_one({"$or": [{"id": code_id}, {"code": code_id}]})
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
        "subscriptions_total": await db.subscriptions.count_documents({"status": "active"}),
        "subscriptions_standard": await db.subscriptions.count_documents({"status": "active", "subscription_type": "standard"}),
        "subscriptions_care": await db.subscriptions.count_documents({"status": "active", "subscription_type": "care"}),
    }


@router.get("/backoffice/users")
async def get_bo_users():
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)



@router.get("/backoffice/user/{user_id}")
async def get_bo_user_detail(user_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    target = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    # Get linked users
    guardians = []
    for gid in target.get('guardians', []):
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g:
            guardians.append({"id": g["id"], "name": g.get("name",""), "email": g.get("email",""), "phone": g.get("phone",""),
                              "guardian_type": g.get("guardian_type",""), "relationship": g.get("relationship",""),
                              "profession": g.get("profession",""), "structure_name": g.get("structure_name",""),
                              "is_prescriber": g.get("is_prescriber", False), "is_intervention_provider": g.get("is_intervention_provider", False),
                              "intervention_radius_km": g.get("intervention_radius_km", 0)})
    beneficiaries = []
    for bid in target.get('beneficiaries', []):
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            beneficiaries.append({"id": b["id"], "name": b.get("name",""), "email": b.get("email",""), "phone": b.get("phone",""),
                                  "date_of_birth": b.get("date_of_birth",""), "address": b.get("address",""),
                                  "subscription_type": b.get("subscription_type",""), "has_subscription": b.get("has_subscription", False)})
    # Get alerts
    alerts = await db.alerts.find({"beneficiary_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    if not alerts:
        alerts = await db.alerts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    # Get devices
    devices = await db.devices.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    # Get interventions
    interventions = await db.interventions.find({"$or": [{"beneficiary_id": user_id}, {"assigned_to": user_id}]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    # Get prescriptions
    prescriptions = await db.prescriptions.find({"$or": [{"guardian_id": user_id}, {"beneficiary_id": user_id}]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    # Get subscription
    subscription = await db.subscriptions.find_one({"beneficiary_id": user_id}, {"_id": 0})
    # Get latest vitals
    latest_vitals = await db.health_data.find_one({"user_id": user_id}, {"_id": 0}, sort=[("timestamp", -1)])
    return {
        "user": target, "guardians": guardians, "beneficiaries": beneficiaries,
        "alerts": alerts, "devices": devices, "interventions": interventions,
        "prescriptions": prescriptions, "subscription": subscription, "latest_vitals": latest_vitals,
    }


@router.get("/backoffice/prescription/{presc_id}")
async def get_bo_prescription_detail(presc_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    presc = await db.prescriptions.find_one({"id": presc_id}, {"_id": 0})
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription non trouvee")
    guardian = await db.users.find_one({"id": presc.get("guardian_id")}, {"_id": 0, "password_hash": 0})
    beneficiary = await db.users.find_one({"id": presc.get("beneficiary_id")}, {"_id": 0, "password_hash": 0})
    if not beneficiary and presc.get("beneficiary_email"):
        beneficiary = await db.users.find_one({"email": presc["beneficiary_email"]}, {"_id": 0, "password_hash": 0})
    subscription = None
    if beneficiary:
        subscription = await db.subscriptions.find_one({"beneficiary_id": beneficiary["id"]}, {"_id": 0})
    return {"prescription": presc, "guardian": guardian, "beneficiary": beneficiary, "subscription": subscription}

@router.get("/backoffice/intervention/{iv_id}")
async def get_bo_intervention_detail(iv_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    iv = await db.interventions.find_one({"id": iv_id}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    beneficiary = await db.users.find_one({"id": iv.get("beneficiary_id")}, {"_id": 0, "password_hash": 0})
    assigned = await db.users.find_one({"id": iv.get("assigned_to")}, {"_id": 0, "password_hash": 0}) if iv.get("assigned_to") else None
    alert = await db.alerts.find_one({"id": iv.get("alert_id")}, {"_id": 0})
    return {"intervention": iv, "beneficiary": beneficiary, "assigned_to": assigned, "alert": alert}

@router.get("/backoffice/alert/{alert_id}")
async def get_bo_alert_detail(alert_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    beneficiary = await db.users.find_one({"id": alert.get("beneficiary_id", alert.get("user_id"))}, {"_id": 0, "password_hash": 0})
    interventions = await db.interventions.find({"alert_id": alert_id}, {"_id": 0}).to_list(10)
    incident = await db.carewatch_incidents.find_one({"alert_id": alert_id}, {"_id": 0})
    return {"alert": alert, "beneficiary": beneficiary, "interventions": interventions, "incident": incident}


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


@router.get("/backoffice/analytics")
async def get_analytics():
    now = datetime.now(timezone.utc)
    # Intervention analytics
    all_interventions = await db.interventions.find({}, {"_id": 0}).to_list(500)
    completed_ivs = [iv for iv in all_interventions if iv.get('status') == 'completed']
    active_ivs = [iv for iv in all_interventions if iv.get('status') in ('pending_acceptance', 'en_route', 'in_progress')]
    # Avg intervention time (created_at -> completed_at)
    total_iv_minutes = 0
    count_iv = 0
    for iv in completed_ivs:
        try:
            c = datetime.fromisoformat(iv['created_at'].replace('Z', '+00:00'))
            d = datetime.fromisoformat(iv['completed_at'].replace('Z', '+00:00'))
            total_iv_minutes += (d - c).total_seconds() / 60
            count_iv += 1
        except: pass
    avg_iv_time = round(total_iv_minutes / count_iv, 1) if count_iv > 0 else 0
    # Avg acceptance time (created_at -> accepted_at)
    total_accept = 0
    count_accept = 0
    for iv in all_interventions:
        if iv.get('accepted_at') and iv.get('created_at'):
            try:
                c = datetime.fromisoformat(iv['created_at'].replace('Z', '+00:00'))
                a = datetime.fromisoformat(iv['accepted_at'].replace('Z', '+00:00'))
                total_accept += (a - c).total_seconds() / 60
                count_accept += 1
            except: pass
    avg_accept_time = round(total_accept / count_accept, 1) if count_accept > 0 else 0
    # Resolution rate
    total_alerts = await db.alerts.count_documents({})
    resolved_alerts = await db.alerts.count_documents({"status": "resolved"})
    resolution_rate = round((resolved_alerts / total_alerts) * 100) if total_alerts > 0 else 0
    # Top intervenants
    intervenant_stats = {}
    for iv in completed_ivs:
        name = iv.get('assigned_name', 'Inconnu')
        if name not in intervenant_stats:
            intervenant_stats[name] = 0
        intervenant_stats[name] += 1
    top_intervenants = sorted([{"name": k, "count": v} for k, v in intervenant_stats.items()], key=lambda x: x['count'], reverse=True)[:10]
    # Interventions by month (last 6 months)
    ivs_by_month = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        month_label = month_start.strftime("%b %Y")
        count = len([iv for iv in all_interventions if iv.get('created_at', '') >= month_start.isoformat() and iv.get('created_at', '') < month_end.isoformat()])
        ivs_by_month.append({"month": month_label, "count": count})
    return {
        "total_interventions": len(all_interventions),
        "completed_interventions": len(completed_ivs),
        "active_interventions": len(active_ivs),
        "avg_intervention_time_min": avg_iv_time,
        "avg_acceptance_time_min": avg_accept_time,
        "resolution_rate": resolution_rate,
        "total_alerts": total_alerts,
        "resolved_alerts": resolved_alerts,
        "top_intervenants": top_intervenants,
        "interventions_by_month": ivs_by_month,
    }



@router.post("/admin/saad-invitation")
async def send_saad_invitation(data: dict, user=Depends(get_current_user)):
    """Send SAAD registration invitation link"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    email = data.get("email", "").strip()
    name = data.get("name", "").strip()
    structure = data.get("structure_name", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")

    # Generate invitation token
    import uuid as _uuid
    invite_token = str(_uuid.uuid4())[:12].upper()
    await db.saad_invitations.insert_one({
        "id": str(_uuid.uuid4()), "email": email, "name": name,
        "structure_name": structure, "token": invite_token,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
    })

    # Send invitation email
    from utils import send_email
    subject = f"Invitation CARE WATCH - Espace SAAD"
    link = f"https://premium-health-sleep.preview.emergentagent.com/register?invite={invite_token}&role=prescriber_company"
    html = f"""
    <h2>Bienvenue sur CARE WATCH</h2>
    <p>Bonjour {name or 'Madame, Monsieur'},</p>
    <p>Vous etes invite(e) a rejoindre CARE WATCH en tant que dirigeant(e) de la structure <strong>{structure or 'votre SAAD'}</strong>.</p>
    <p>Cliquez sur le lien ci-dessous pour creer votre compte :</p>
    <p><a href="{link}" style="display:inline-block;padding:12px 28px;background:#7C5CFF;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">Creer mon compte SAAD</a></p>
    <p>Code d'invitation : <strong>{invite_token}</strong></p>
    <p>Cordialement,<br>L'equipe CARE WATCH - Chutex Innovation</p>
    """
    await send_email(email, subject, html)

    return {"status": "sent", "token": invite_token, "message": f"Invitation envoyee a {email}"}


@router.get("/admin/saad-invitations")
async def list_saad_invitations(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    invitations = await db.saad_invitations.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return invitations


@router.get("/admin/rgpd-requests")
async def list_all_rgpd_requests(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    return await db.rgpd_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/admin/emails")
async def list_sent_emails(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    return await db.sent_emails.find({}, {"_id": 0}).sort("sent_at", -1).to_list(100)


@router.put("/admin/user/{user_id}")
async def admin_update_user(user_id: str, data: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    allowed = {"name", "email", "phone", "role", "address", "active", "subscription_type", "has_subscription"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun champ a modifier")
    await db.users.update_one({"id": user_id}, {"$set": updates})
    return {"status": "updated"}


@router.delete("/admin/user/{user_id}")
async def admin_delete_user(user_id: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Impossible de supprimer votre propre compte")
    await db.users.delete_one({"id": user_id})
    await db.devices.delete_many({"user_id": user_id})
    await db.reminders.delete_many({"user_id": user_id})
    await db.thresholds.delete_many({"user_id": user_id})
    return {"status": "deleted"}


@router.get("/admin/programs")
async def admin_list_programs(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    enrollments = await db.program_enrollments.find({}, {"_id": 0}).sort("started_at", -1).to_list(100)
    return enrollments


@router.get("/admin/push-history")
async def admin_push_history(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    return await db.push_history.find({}, {"_id": 0}).sort("sent_at", -1).to_list(100)


@router.get("/admin/documents")
async def list_documents(user=Depends(get_current_user)):
    """List available patent/technical documents."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    import os
    docs = []
    memory_dir = "/app/memory"
    for fname in sorted(os.listdir(memory_dir)):
        if fname.endswith(".md"):
            fpath = os.path.join(memory_dir, fname)
            size = os.path.getsize(fpath)
            with open(fpath, "r") as f:
                first_line = f.readline().strip().lstrip("# ").strip()
            docs.append({
                "filename": fname,
                "title": first_line or fname,
                "size_kb": round(size / 1024, 1),
                "path": fpath,
            })
    return {"documents": docs}


@router.get("/admin/documents/{filename}")
async def get_document_content(filename: str, user=Depends(get_current_user)):
    """Get full content of a document for PDF export."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    import os
    safe_name = os.path.basename(filename)
    fpath = os.path.join("/app/memory", safe_name)
    if not os.path.exists(fpath) or not safe_name.endswith(".md"):
        raise HTTPException(status_code=404, detail="Document introuvable")
    with open(fpath, "r") as f:
        content = f.read()
    return {"filename": safe_name, "content": content}



@router.get("/admin/devices-overview")
async def admin_devices_overview(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    devices = await db.devices.find({}, {"_id": 0}).to_list(500)
    users_map = {}
    for d in devices:
        uid = d.get("user_id")
        if uid and uid not in users_map:
            u = await db.users.find_one({"id": uid}, {"_id": 0, "name": 1, "phone": 1})
            users_map[uid] = u or {"name": "Inconnu", "phone": ""}
        d["user_name"] = users_map.get(uid, {}).get("name", "Inconnu")
        d["user_phone"] = users_map.get(uid, {}).get("phone", "")
    summary = {
        "total": len(devices),
        "bracelets": len([d for d in devices if d.get("device_type") == "bracelet"]),
        "scales": len([d for d in devices if d.get("device_type") == "scale"]),
        "connected": len([d for d in devices if d.get("connected")]),
        "low_battery": len([d for d in devices if (d.get("battery") or 100) < 20]),
    }
    return {"devices": devices, "summary": summary}


@router.get("/admin/health-overview")
async def admin_health_overview(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    beneficiaries = await db.users.find({"role": "beneficiary"}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(100)
    result = []
    for b in beneficiaries:
        uid = b["id"]
        latest = await db.device_readings.find_one({"user_id": uid}, {"_id": 0}, sort=[("timestamp", -1)])
        glycemia = await db.glycemia_history.find_one({"user_id": uid}, {"_id": 0}, sort=[("date", -1)])
        result.append({
            "user_id": uid, "name": b["name"], "phone": b.get("phone", ""),
            "latest_reading": latest,
            "latest_glycemia": glycemia,
        })
    return {"beneficiaries": result}
