from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user
from models import InterventionAcceptRequest, InterventionCloseRequest, InterventionLocationUpdate

router = APIRouter()

# ==================== INTERVENTION CARE ENDPOINTS ====================

INTERVENTION_CLOSE_QCM = [
    {"id": "q1", "question": "Etat du beneficiaire a votre arrivee ?", "options": ["Conscient et lucide", "Conscient mais confus", "Inconscient", "Blesse legerement", "Blesse gravement"]},
    {"id": "q2", "question": "Le beneficiaire pouvait-il se deplacer ?", "options": ["Oui, sans aide", "Oui, avec aide", "Non, immobilise"]},
    {"id": "q3", "question": "Quelle etait la cause de l'alerte ?", "options": ["Chute confirmee", "Malaise", "Fausse alerte", "Probleme technique", "Autre"]},
    {"id": "q4", "question": "Actions effectuees sur place ?", "options": ["Rassure et accompagne", "Premiers soins administres", "Appel SAMU/pompiers", "Mise en securite", "Aucune action necessaire"]},
    {"id": "q5", "question": "Un suivi medical est-il necessaire ?", "options": ["Non, tout va bien", "Consultation medecin recommandee", "Oui, urgence medicale", "Deja pris en charge par les secours"]},
    {"id": "q6", "question": "Recommandations pour la suite ?", "options": ["Aucune, situation normale", "Surveillance renforcee les prochaines heures", "Visite medicale sous 24h", "Hospitalisation recommandee", "Adaptation du domicile necessaire"]},
]


@router.get("/intervention/close-qcm")
async def get_intervention_close_qcm():
    """Get the QCM questions for closing an intervention"""
    return INTERVENTION_CLOSE_QCM


@router.get("/interventions/pending")
async def get_pending_interventions(user=Depends(get_current_user)):
    """Get all pending interventions for the current intervention provider or SAAD guardian"""
    pending = await db.interventions.find(
        {"status": {"$in": ["pending_acceptance", "in_progress"]},
         "recipients.id": user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    # Also get interventions assigned directly to the user
    assigned = await db.interventions.find(
        {"status": {"$in": ["pending_acceptance", "in_progress"]},
         "assigned_to": user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)

    # SAAD-dispatched interventions: match by company_id or agency_id
    saad_company_id = user.get('saad_company_id') or user.get('prescriber_company_id')
    agency_id = user.get('agency_id')
    saad_ivs = []
    if saad_company_id or agency_id:
        # Check intervenant space is not deactivated
        link = await db.saad_guardian_links.find_one(
            {"guardian_id": user['id'], "status": "accepted"}, {"_id": 0}
        )
        intervenant_active = not (link or {}).get('intervenant_deactivated', False)
        if intervenant_active:
            saad_query = {"status": {"$in": ["pending_acceptance"]}, "intervener_type": "saad"}
            or_clauses = []
            if saad_company_id:
                or_clauses.append({"company_id": saad_company_id})
            if agency_id:
                or_clauses.append({"agency_id": agency_id})
            if or_clauses:
                saad_query["$or"] = or_clauses
                saad_ivs = await db.interventions.find(saad_query, {"_id": 0}).sort("created_at", -1).to_list(20)

    # Merge without duplicates
    seen = set()
    result = []
    for iv in pending + assigned + saad_ivs:
        if iv['id'] not in seen:
            seen.add(iv['id'])
            result.append(iv)
    return result


@router.post("/intervention/accept")
async def accept_intervention(data: InterventionAcceptRequest, user=Depends(get_current_user)):
    """Intervenant clicks 'J'INTERVIENS' to accept the intervention"""
    iv = await db.interventions.find_one({"id": data.intervention_id}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    if iv['status'] not in ['pending_acceptance', 'dispatched']:
        raise HTTPException(status_code=400, detail="Intervention deja prise en charge")
    now = datetime.now(timezone.utc).isoformat()
    await db.interventions.update_one({"id": data.intervention_id}, {"$set": {
        "status": "in_progress",
        "assigned_to": user['id'],
        "assigned_name": user['name'],
        "accepted_at": now,
        "intervener_location": {
            "latitude": user.get('latitude', 0),
            "longitude": user.get('longitude', 0),
            "address": user.get('address', ''),
        },
    }, "$push": {"timeline": {"status": "accepted", "time": now, "note": f"{user['name']} a accepte l'intervention"}}})
    # Update alert
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {"teleassistance_status": "intervenant_en_route"}})
    return {"status": "in_progress", "accepted_by": user['name'], "intervention_id": data.intervention_id}


@router.post("/intervention/location")
async def update_intervener_location(data: InterventionLocationUpdate, user=Depends(get_current_user)):
    """Update the intervener's live location during intervention"""
    now = datetime.now(timezone.utc).isoformat()
    await db.interventions.update_one(
        {"id": data.intervention_id, "assigned_to": user['id']},
        {"$set": {"intervener_location.latitude": data.latitude, "intervener_location.longitude": data.longitude, "last_location_update": now}}
    )
    return {"status": "ok"}


@router.get("/intervention/{iid}")
async def get_intervention_detail(iid: str, user=Depends(get_current_user)):
    """Get full intervention detail with beneficiary info"""
    iv = await db.interventions.find_one({"id": iid}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    return iv


@router.post("/intervention/close")
async def close_intervention(data: InterventionCloseRequest, user=Depends(get_current_user)):
    """Close an intervention with mandatory QCM report"""
    iv = await db.interventions.find_one({"id": data.intervention_id}, {"_id": 0})
    if not iv:
        raise HTTPException(status_code=404, detail="Intervention non trouvee")
    if not data.answers or len(data.answers) < len(INTERVENTION_CLOSE_QCM):
        raise HTTPException(status_code=400, detail=f"Veuillez repondre aux {len(INTERVENTION_CLOSE_QCM)} questions du compte-rendu")
    now = datetime.now(timezone.utc).isoformat()
    report = {
        "closed_by": user['id'],
        "closed_by_name": user['name'],
        "answers": data.answers,
        "notes": data.notes,
        "closed_at": now,
    }
    await db.interventions.update_one({"id": data.intervention_id}, {"$set": {
        "status": "completed",
        "completed_at": now,
        "report": report,
        "report_answers": data.answers,
    }, "$push": {"timeline": {"status": "completed", "time": now, "note": f"Intervention cloturee par {user['name']} - Compte-rendu soumis"}}})
    # Resolve the associated alert
    if iv.get('alert_id'):
        await db.alerts.update_one({"id": iv['alert_id']}, {"$set": {"status": "resolved", "resolved_at": now, "resolved_by": user['id'], "teleassistance_status": "resolved"}})
    # Resolve the escalation
    if iv.get('escalation_id'):
        await db.escalations.update_one({"id": iv['escalation_id']}, {"$set": {"status": "resolved"}, "$push": {"timeline": {"step": "intervention_completed", "time": now, "note": f"Intervention cloturee par {user['name']}"}}})
    return {"status": "completed", "report": report}

