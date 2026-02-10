from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, asyncio, logging

from database import db, twilio_client, TWILIO_NUMBER
from auth import get_current_user
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
        from routes.teleassistance_routes import auto_escalation_protocol
        asyncio.create_task(auto_escalation_protocol(alert))
    return {k: v for k, v in alert.items() if k != '_id'}


@router.get("/alerts")
async def get_alerts(user=Depends(get_current_user)):
    if user['role'] in ('teleassistance', 'admin'):
        return await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    if user['role'] == 'guardian':
        bids = user.get('beneficiaries', []) + [user['id']]
        return await db.alerts.find({"beneficiary_id": {"$in": bids}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return await db.alerts.find({"beneficiary_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc).isoformat(), "resolved_by": user['id']}})
    return {"status": "resolved"}


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
