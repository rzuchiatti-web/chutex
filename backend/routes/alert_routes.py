from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, asyncio, logging

from database import db, twilio_client, TWILIO_NUMBER
from auth import get_current_user, get_effective_role
from models import AlertCreate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/alerts")
async def create_alert(data: AlertCreate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    alert = {
        "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
        "alert_type": data.alert_type, "severity": data.severity, "message": data.message or f"Alerte {data.alert_type}",
        "device_type": data.device_type, "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None,
        "teleassistance_status": "pending",
    }
    await db.alerts.insert_one(alert)
    if data.severity in ('critical', 'high') and twilio_client:
        from services.carewatch_engine import carewatch_orchestrate
        asyncio.create_task(carewatch_orchestrate(alert))
    return {k: v for k, v in alert.items() if k != '_id'}


@router.get("/alerts")
async def get_alerts(user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff in ('teleassistance', 'admin'):
        return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    if eff == 'guardian':
        bids = user.get('beneficiaries', []) + [user['id']]
        return await db.alerts.find({"beneficiary_id": {"$in": bids}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return await db.alerts.find({"beneficiary_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.get("/alerts/active-with-interventions")
async def get_active_alerts_with_interventions(user=Depends(get_current_user)):
    """Get active alerts enriched with intervention data for dashboard display"""
    eff = get_effective_role(user)
    if eff == 'beneficiary':
        alerts = await db.alerts.find({"beneficiary_id": user['id'], "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(10)
    elif eff == 'guardian':
        bids = user.get('beneficiaries', []) + [user['id']]
        alerts = await db.alerts.find({"beneficiary_id": {"$in": bids}, "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(10)
    else:
        alerts = await db.alerts.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(20)

    result = []
    for a in alerts:
        iv = await db.interventions.find_one({"alert_id": a['id'], "status": {"$in": ["pending_acceptance", "in_progress", "en_route"]}}, {"_id": 0})
        incident = await db.incidents.find_one({"alert_id": a['id']}, {"_id": 0, "state": 1, "timeline": 1, "care_provider": 1, "assigned_guardian": 1})
        a['intervention'] = iv
        a['incident_state'] = incident.get('state') if incident else None
        a['care_provider'] = incident.get('care_provider') if incident else None
        a['assigned_guardian'] = incident.get('assigned_guardian') if incident else None
        if iv and iv.get('assigned_to'):
            intervener = await db.users.find_one({"id": iv['assigned_to']}, {"_id": 0, "password_hash": 0})
            if intervener:
                a['intervener_info'] = {"name": intervener.get('name', ''), "phone": intervener.get('phone', ''), "structure": intervener.get('structure_name', '') or intervener.get('intervention_structure', '')}
        result.append(a)
    return result


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, data: dict = None, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    update = {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "resolved_by_name": user['name']}
    if data and data.get('answers'):
        update['report'] = {"answers": data['answers'], "notes": data.get('notes', ''), "closed_by": user['id'], "closed_by_name": user['name'], "closed_at": now}
    await db.alerts.update_one({"id": alert_id}, {"$set": update})
    return {"status": "resolved"}


@router.post("/alerts/{alert_id}/resolve-with-report")
async def resolve_alert_with_report(alert_id: str, data: dict, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    report = {"answers": data.get('answers', []), "notes": data.get('notes', ''), "closed_by": user['id'], "closed_by_name": user['name'], "closed_at": now}
    await db.alerts.update_one({"id": alert_id}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "resolved_by_name": user['name'], "report": report}})
    return {"status": "resolved", "report": report}


@router.get("/alerts/{aid}/report")
async def get_alert_report(aid: str, user=Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": aid}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    guardians = []
    if ben:
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', ''), "email": g.get('email', '')})
    escalations = await db.escalations.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(10)
    calls = await db.twilio_calls.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    interventions = await db.interventions.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(10)
    location = await db.locations.find_one({"user_id": alert['beneficiary_id']}, {"_id": 0})
    timeline = _build_alert_timeline(alert, escalations, calls, interventions)
    return {
        "alert": alert,
        "beneficiary": {"id": ben['id'], "name": ben['name'], "phone": ben.get('phone', ''), "email": ben.get('email', '')} if ben else None,
        "guardians": guardians, "escalations": escalations, "calls": calls, "interventions": interventions,
        "location": location, "timeline": timeline,
    }


@router.get("/alerts/{aid}/detail")
async def get_alert_detail(aid: str, user=Depends(get_current_user)):
    """Full alert detail page data - used by frontend alert-detail.tsx"""
    alert = await db.alerts.find_one({"id": aid}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvee")
    ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0, "password_hash": 0})
    guardians = []
    if ben:
        for gid in ben.get('guardians', []):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', ''), "email": g.get('email', '')})
    escalations = await db.escalations.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(10)
    calls = await db.twilio_calls.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    interventions = await db.interventions.find({"alert_id": aid}, {"_id": 0}).sort("created_at", -1).to_list(10)
    location = await db.locations.find_one({"user_id": alert['beneficiary_id']}, {"_id": 0})
    timeline = _build_alert_timeline(alert, escalations, calls, interventions)
    return {
        "alert": alert,
        "beneficiary": {"id": ben['id'], "name": ben['name'], "phone": ben.get('phone', ''), "email": ben.get('email', ''),
                         "blood_type": ben.get('blood_type', ''), "medical_conditions": ben.get('medical_conditions', ''),
                         "allergies": ben.get('allergies', '')} if ben else None,
        "guardians": guardians, "escalations": escalations, "calls": calls, "interventions": interventions,
        "location": location, "timeline": timeline,
    }


def _build_alert_timeline(alert, escalations, calls, interventions):
    timeline = [{"time": alert['created_at'], "event": "alert_created", "detail": f"Alerte {alert['alert_type']} ({alert['severity']})"}]
    for esc in escalations:
        for t in esc.get('timeline', []):
            timeline.append({"time": t.get('time', ''), "event": t.get('step', ''), "detail": t.get('note', '')})
    for c in calls:
        timeline.append({"time": c.get('created_at', ''), "event": f"call_{c.get('target_type', '')}", "detail": f"Appel {c.get('target_name', '')} - {c.get('status', '')}"})
    for iv in interventions:
        timeline.append({"time": iv.get('created_at', ''), "event": "intervention", "detail": f"Intervention {iv.get('status', '')}"})
    if alert.get('resolved_at'):
        timeline.append({"time": alert['resolved_at'], "event": "resolved", "detail": "Alerte resolue"})
    timeline.sort(key=lambda x: x.get('time', ''))
    return timeline
