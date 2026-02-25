from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, random, asyncio, logging

from database import db, twilio_client, TWILIO_NUMBER
from auth import get_current_user, get_effective_role
from models import AlertCreate
from routes.push_routes import notify_sos_alert, notify_fall_detected

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/alerts")
async def create_alert(data: AlertCreate, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    alert = {
        "id": str(uuid.uuid4()), "beneficiary_id": user['id'], "beneficiary_name": user['name'],
        "alert_type": data.alert_type, "message": data.message or f"Alerte {data.alert_type}",
        "device_type": data.device_type, "status": "active", "created_at": now, "resolved_at": None, "resolved_by": None,
        "teleassistance_status": "pending",
    }
    if data.vital_data:
        alert["vital_data"] = data.vital_data
    if data.threshold_data:
        alert["threshold_data"] = data.threshold_data

    # Store beneficiary geolocation at alert time
    if data.latitude and data.longitude:
        alert["location"] = {"latitude": data.latitude, "longitude": data.longitude, "timestamp": now}
        await db.locations.update_one(
            {"user_id": user['id']},
            {"$set": {"user_id": user['id'], "latitude": data.latitude, "longitude": data.longitude, "updated_at": now}},
            upsert=True,
        )
    else:
        loc = await db.locations.find_one({"user_id": user['id']}, {"_id": 0})
        if loc:
            alert["location"] = {"latitude": loc.get("latitude"), "longitude": loc.get("longitude"), "timestamp": loc.get("updated_at", now)}

    # Start tracking beneficiary location during alert
    await db.alert_tracking.update_one(
        {"alert_id": alert["id"]},
        {"$set": {"alert_id": alert["id"], "beneficiary_id": user['id'], "positions": [alert.get("location", {})], "started_at": now}},
        upsert=True,
    )

    await db.alerts.insert_one(alert)
    
    # Send push notifications to guardians
    guardian_ids = user.get('guardians', [])
    if not guardian_ids:
        guardians = await db.users.find({"beneficiaries": user['id']}, {"_id": 0, "id": 1}).to_list(20)
        guardian_ids = [g['id'] for g in guardians]
    if guardian_ids:
        if data.alert_type == 'fall':
            asyncio.create_task(notify_fall_detected(user['name'], alert['id'], guardian_ids))
        else:
            asyncio.create_task(notify_sos_alert(user['name'], alert['id'], guardian_ids))
        # Send SMS to all guardians via SMS Mode
        from services.smsmode_service import send_alert_sms
        for gid in guardian_ids:
            g = await db.users.find_one({"id": gid}, {"_id": 0, "phone": 1, "name": 1})
            if g and g.get('phone'):
                asyncio.create_task(send_alert_sms(g['phone'], user['name'], data.alert_type, alert['id']))
    
    # Only trigger teleassistance if beneficiary has a Care subscription
    has_care = False
    sub = await db.subscriptions.find_one({"beneficiary_phone": user.get('phone'), "status": "active"}, {"_id": 0})
    if not sub:
        sub = await db.subscriptions.find_one({"beneficiary_id": user['id'], "status": "active"}, {"_id": 0})
    if sub and sub.get('subscription_type') == 'care':
        has_care = True

    if has_care and twilio_client:
        from services.vapi_engine import vapi_orchestrate, VAPI_API_KEY
        if VAPI_API_KEY:
            asyncio.create_task(vapi_orchestrate(alert))
        else:
            from services.carewatch_engine import carewatch_orchestrate
            asyncio.create_task(carewatch_orchestrate(alert))
    elif not has_care:
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "no_care_subscription"}})

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
        update['report'] = {"answers": data.get('answers', data.get('report', {})), "notes": data.get('notes', ''), "closed_by": user['id'], "closed_by_name": user['name'], "closed_at": now}
    await db.alerts.update_one({"id": alert_id}, {"$set": update})
    return {"status": "resolved"}


@router.post("/alerts/{alert_id}/resolve-with-report")
async def resolve_alert_with_report(alert_id: str, data: dict, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    report = {"answers": data.get('answers', []), "notes": data.get('notes', ''), "closed_by": user['id'], "closed_by_name": user['name'], "closed_at": now}
    await db.alerts.update_one({"id": alert_id}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "resolved_by_name": user['name'], "report": report}})
    return {"status": "resolved", "report": report}


@router.post("/alerts/{alert_id}/location")
async def update_alert_location(alert_id: str, data: dict, user=Depends(get_current_user)):
    """Update beneficiary geolocation during an active alert"""
    now = datetime.now(timezone.utc).isoformat()
    pos = {"latitude": data.get("latitude"), "longitude": data.get("longitude"), "timestamp": now}
    await db.alert_tracking.update_one(
        {"alert_id": alert_id},
        {"$push": {"positions": pos}, "$set": {"updated_at": now}},
        upsert=True,
    )
    await db.locations.update_one(
        {"user_id": user['id']},
        {"$set": {"user_id": user['id'], "latitude": data.get("latitude"), "longitude": data.get("longitude"), "updated_at": now}},
        upsert=True,
    )
    return {"status": "updated"}


@router.post("/interventions/{intervention_id}/location")
async def update_intervention_location(intervention_id: str, data: dict, user=Depends(get_current_user)):
    """Update intervenant geolocation during an intervention — visible to guardians"""
    now = datetime.now(timezone.utc).isoformat()
    pos = {"latitude": data.get("latitude"), "longitude": data.get("longitude"), "timestamp": now}
    await db.intervention_tracking.update_one(
        {"intervention_id": intervention_id},
        {"$push": {"positions": pos}, "$set": {"intervenant_id": user['id'], "intervenant_name": user.get('name', ''), "updated_at": now}},
        upsert=True,
    )
    return {"status": "updated"}


@router.get("/alerts/{alert_id}/tracking")
async def get_alert_tracking(alert_id: str, user=Depends(get_current_user)):
    """Get all location data for an alert — beneficiary + intervenant positions"""
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        return {"beneficiary": [], "intervenant": []}
    ben_tracking = await db.alert_tracking.find_one({"alert_id": alert_id}, {"_id": 0})
    iv = await db.interventions.find_one({"alert_id": alert_id}, {"_id": 0, "id": 1})
    iv_tracking = None
    if iv:
        iv_tracking = await db.intervention_tracking.find_one({"intervention_id": iv['id']}, {"_id": 0})
    return {
        "beneficiary": ben_tracking.get("positions", []) if ben_tracking else [],
        "intervenant": iv_tracking.get("positions", []) if iv_tracking else [],
        "intervenant_name": iv_tracking.get("intervenant_name", "") if iv_tracking else "",
    }



@router.post("/interventions/accept-as-guardian")
async def accept_intervention_as_guardian(data: dict, user=Depends(get_current_user)):
    """Guardian accepts to intervene on an alert - creates/assigns intervention"""
    alert_id = data.get('alert_id')
    if not alert_id:
        raise HTTPException(status_code=400, detail="alert_id required")
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    now = datetime.now(timezone.utc).isoformat()
    # Check if intervention already exists for this alert
    existing = await db.interventions.find_one({"alert_id": alert_id, "status": {"$in": ["in_progress", "en_route", "pending_acceptance"]}}, {"_id": 0})
    if existing and existing.get('assigned_to'):
        raise HTTPException(status_code=409, detail="Un intervenant est deja assigne")
    
    iv_id = existing['id'] if existing else str(uuid.uuid4())
    if existing:
        # Update existing intervention
        await db.interventions.update_one({"id": iv_id}, {"$set": {
            "assigned_to": user['id'], "assigned_name": user['name'],
            "status": "in_progress", "accepted_at": now,
            "intervener_type": "guardian",
        }})
    else:
        # Create new intervention
        await db.interventions.insert_one({
            "id": iv_id, "alert_id": alert_id,
            "beneficiary_id": alert.get('beneficiary_id'),
            "beneficiary_name": alert.get('beneficiary_name'),
            "assigned_to": user['id'], "assigned_name": user['name'],
            "status": "in_progress", "created_at": now, "accepted_at": now,
            "intervener_type": "guardian",
            "notes": f"Intervention gardien - {user['name']}",
        })
    
    # Update incident
    await db.incidents.update_one({"alert_id": alert_id}, {"$set": {
        "care_provider": user['name'],
        "state": "CARE_DISPATCHED",
        "assigned_guardian": {"id": user['id'], "name": user['name']},
    }})
    
    # Update alert teleassistance status
    await db.alerts.update_one({"id": alert_id}, {"$set": {"teleassistance_status": "CARE_DISPATCHED"}})
    
    return {"status": "accepted", "intervention_id": iv_id}


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
    # Enrich interventions with full intervenant/recipient profiles
    for iv in interventions:
        if iv.get('assigned_to'):
            iu = await db.users.find_one({"id": iv['assigned_to']}, {"_id": 0, "password_hash": 0})
            if iu:
                iv['intervenant_profile'] = {"name": iu.get('name',''), "phone": iu.get('phone',''), "email": iu.get('email',''), "address": iu.get('address',''), "profession": iu.get('profession',''), "structure_name": iu.get('structure_name','') or iu.get('intervention_structure',''), "guardian_type": iu.get('guardian_type',''), "is_prescriber": iu.get('is_prescriber',False), "intervention_radius_km": iu.get('intervention_radius_km'), "agency_id": iu.get('agency_id','')}
        enriched_r = []
        for r in iv.get('recipients', []):
            ru = await db.users.find_one({"id": r.get('id')}, {"_id": 0, "password_hash": 0})
            er = {**r}
            if ru:
                er.update({"email": ru.get('email',''), "address": ru.get('address',''), "profession": ru.get('profession',''), "structure_name": ru.get('structure_name','') or ru.get('intervention_structure',''), "guardian_type": ru.get('guardian_type',''), "is_prescriber": ru.get('is_prescriber',False), "intervention_radius_km": ru.get('intervention_radius_km')})
            enriched_r.append(er)
        iv['recipients'] = enriched_r
    location = await db.locations.find_one({"user_id": alert['beneficiary_id']}, {"_id": 0})
    # Get Vapi incident data for enriched timeline
    incident = None
    if alert.get('incident_id'):
        incident = await db.incidents.find_one({"id": alert['incident_id']}, {"_id": 0})
    incident_timeline = []
    if incident:
        for t in incident.get('timeline', []):
            incident_timeline.append({"time": t.get('timestamp', ''), "event": "ia_" + t.get('state', ''), "detail": t.get('detail', ''), "icon": "ri-robot-line", "color": "#A78BFA"})
    resolution_report = alert.get('resolution_report') or alert.get('report') or None
    timeline = _build_alert_timeline(alert, escalations, calls, interventions)
    timeline.extend(incident_timeline)
    timeline.sort(key=lambda x: x.get('time', ''))
    return {
        "alert": alert,
        "beneficiary": {"id": ben['id'], "name": ben['name'], "phone": ben.get('phone', ''), "email": ben.get('email', ''),
                         "blood_type": ben.get('blood_type', ''), "medical_conditions": ben.get('medical_conditions', ''),
                         "allergies": ben.get('allergies', ''), "address": ben.get('address', ''),
                         "date_of_birth": ben.get('date_of_birth', ''), "gender": ben.get('gender', ''),
                         "height_cm": ben.get('height_cm'), "weight_kg": ben.get('weight_kg'),
                         "doctor_name": ben.get('doctor_name', ''), "doctor_phone": ben.get('doctor_phone', ''),
                         "emergency_contact_name": ben.get('emergency_contact_name', ''), "emergency_contact_phone": ben.get('emergency_contact_phone', ''),
                         "latitude": ben.get('latitude'), "longitude": ben.get('longitude'),
                         } if ben else None,
        "guardians": guardians, "escalations": escalations, "calls": calls, "interventions": interventions,
        "location": location, "timeline": timeline, "incident": incident,
    }


def _build_alert_timeline(alert, escalations, calls, interventions):
    type_labels = {"manual_app": "Bouton SOS (application)", "manual_bracelet": "Pression manuelle (bracelet)", "health_anomaly": "Anomalie de sante detectee", "fall": "Chute detectee (gilet)", "sos": "Alerte SOS", "threshold": "Depassement de seuil"}
    status_fr = {
        "pending": "En attente", "active": "Active", "resolved": "Resolue",
        "CALLING_PATIENT": "Appel du beneficiaire en cours", "PATIENT_CONFIRMED_OK": "Beneficiaire confirme aller bien",
        "PATIENT_NEEDS_HELP": "Beneficiaire a besoin d'aide", "PATIENT_NO_RESPONSE": "Beneficiaire injoignable",
        "CALLING_GUARDIANS": "Appel des gardiens en cours", "CALLING_GUARDIAN_1": "Appel du 1er gardien",
        "CALLING_GUARDIAN_2": "Appel du 2e gardien", "CALLING_GUARDIAN_3": "Appel du 3e gardien",
        "GUARDIAN_INTERVENTION_ACCEPTED": "Gardien accepte d'intervenir", "GUARDIAN_UNREACHABLE": "Gardien injoignable",
        "CARE_DISPATCHED": "Recherche d'un intervenant professionnel", "RESOLVED": "Alerte resolue",
        "no_care_subscription": "Pas d'abonnement Chutex Care - pas d'appel IA",
        "pending_acceptance": "En attente d'acceptation", "accepted": "Accepte", "en_route": "En route",
        "on_site": "Sur place", "completed": "Terminee",
    }
    timeline = [{"time": alert['created_at'], "event": "creation", "detail": type_labels.get(alert.get('alert_type', ''), alert.get('alert_type', 'Alerte')), "icon": "ri-alarm-warning-line", "color": "#EF4444"}]

    # Add SMS notification step
    timeline.append({"time": alert['created_at'], "event": "sms", "detail": "Notification SMS et push envoyee aux gardiens", "icon": "ri-message-2-line", "color": "#38BDF8"})

    for esc in escalations:
        for t in esc.get('timeline', []):
            raw = t.get('note', t.get('detail', ''))
            translated = raw
            for eng, fr in status_fr.items():
                translated = translated.replace(eng, fr)
            timeline.append({"time": t.get('time', t.get('timestamp', '')), "event": "escalation", "detail": translated, "icon": "ri-arrow-up-line", "color": "#F59E0B"})

    for c in calls:
        st = status_fr.get(c.get('status', ''), c.get('status', ''))
        timeline.append({"time": c.get('created_at', ''), "event": "appel", "detail": f"Appel {c.get('target_name', 'en cours')} - {st}", "icon": "ri-phone-line", "color": "#38BDF8"})

    for iv in interventions:
        st = status_fr.get(iv.get('status', ''), iv.get('status', ''))
        name = iv.get('intervenant_name', 'Intervenant')
        timeline.append({"time": iv.get('created_at', ''), "event": "intervention", "detail": f"Intervention de {name} - {st}", "icon": "ri-map-pin-range-line", "color": "#10B981"})

    if alert.get('resolved_at'):
        timeline.append({"time": alert['resolved_at'], "event": "resolution", "detail": "Alerte cloturee", "icon": "ri-check-double-line", "color": "#10B981"})

    timeline.sort(key=lambda x: x.get('time', ''))
    return timeline
