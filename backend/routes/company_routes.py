from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional
import uuid, logging

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/company/dashboard")
async def company_dashboard(
    user=Depends(get_current_user),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    company_id = user['id']
    agencies = await db.agencies.find({"company_id": company_id}, {"_id": 0}).to_list(50)
    prescribers = await db.users.find({"prescriber_company_id": company_id, "is_prescriber": True}, {"_id": 0, "password_hash": 0}).to_list(200)
    prescriber_ids = [p['id'] for p in prescribers]
    prescriptions = await db.prescriptions.find({"guardian_id": {"$in": prescriber_ids}}, {"_id": 0}).to_list(500)

    # Date filter
    if date_from or date_to:
        filtered = []
        for p in prescriptions:
            d = p.get('created_at', '')
            if isinstance(d, str) and d:
                if date_from and d < date_from:
                    continue
                if date_to and d > date_to + 'T23:59:59':
                    continue
            filtered.append(p)
        prescriptions = filtered

    total_comm_validated = sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'subscribed')
    total_comm_pending = sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'pending')
    agency_stats = []
    for ag in agencies:
        ag_prescribers = [p for p in prescribers if p.get('agency_id') == ag['id']]
        ag_prescriber_ids = [p['id'] for p in ag_prescribers]
        ag_prescs = [p for p in prescriptions if p.get('guardian_id') in ag_prescriber_ids]
        agency_stats.append({
            "agency": ag,
            "prescriber_count": len(ag_prescribers),
            "prescription_count": len(ag_prescs),
            "comm_validated": sum(p.get('commission', 0) for p in ag_prescs if p.get('status') == 'subscribed'),
            "comm_pending": sum(p.get('commission', 0) for p in ag_prescs if p.get('status') == 'pending'),
        })
    unassigned = [p for p in prescribers if not p.get('agency_id')]
    unassigned_ids = [p['id'] for p in unassigned]
    unassigned_prescs = [p for p in prescriptions if p.get('guardian_id') in unassigned_ids]
    prescriber_stats = []
    for pr in prescribers:
        pr_prescs = [p for p in prescriptions if p.get('guardian_id') == pr['id']]
        prescriber_stats.append({
            "id": pr['id'], "name": pr.get('name', ''), "email": pr.get('email', ''),
            "phone": pr.get('phone', ''),
            "agency_id": pr.get('agency_id'), "agency_name": next((a['name'] for a in agencies if a['id'] == pr.get('agency_id')), 'Non assigne'),
            "prescription_count": len(pr_prescs),
            "comm_validated": sum(p.get('commission', 0) for p in pr_prescs if p.get('status') == 'subscribed'),
            "comm_pending": sum(p.get('commission', 0) for p in pr_prescs if p.get('status') == 'pending'),
        })
    prescriber_stats.sort(key=lambda x: x['comm_validated'] + x['comm_pending'], reverse=True)
    return {
        "company": {"id": user['id'], "name": user.get('name', ''), "structure_name": user.get('structure_name', '')},
        "total_prescribers": len(prescribers), "total_prescriptions": len(prescriptions),
        "total_comm_validated": total_comm_validated, "total_comm_pending": total_comm_pending,
        "agencies": agency_stats,
        "unassigned_prescribers": len(unassigned), "unassigned_comm": sum(p.get('commission', 0) for p in unassigned_prescs),
        "prescriber_ranking": prescriber_stats[:20],
        "prescriptions": prescriptions,
    }


@router.get("/company/prescriber/{prescriber_id}")
async def get_prescriber_detail(prescriber_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    prescriber = await db.users.find_one(
        {"id": prescriber_id, "prescriber_company_id": user['id']},
        {"_id": 0, "password_hash": 0}
    )
    if not prescriber:
        raise HTTPException(status_code=404, detail="Prescripteur non trouve")
    agency = None
    if prescriber.get('agency_id'):
        agency = await db.agencies.find_one({"id": prescriber['agency_id']}, {"_id": 0})
    prescriptions = await db.prescriptions.find(
        {"guardian_id": prescriber_id}, {"_id": 0}
    ).to_list(200)
    return {
        "prescriber": prescriber,
        "agency": agency,
        "prescriptions": prescriptions,
        "total_prescriptions": len(prescriptions),
        "comm_validated": sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'subscribed'),
        "comm_pending": sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'pending'),
    }


@router.get("/company/agencies")
async def company_agencies(user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    return await db.agencies.find({"company_id": user['id']}, {"_id": 0}).to_list(50)


@router.post("/company/agencies")
async def create_agency(data: dict, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    agency = {
        "id": str(uuid.uuid4()), "company_id": user['id'], "name": data.get('name', ''),
        "address": data.get('address', ''), "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.agencies.insert_one(agency)
    return {k: v for k, v in agency.items() if k != '_id'}


@router.put("/company/agencies/{agency_id}")
async def update_agency(agency_id: str, data: dict, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    update = {}
    if 'name' in data: update['name'] = data['name']
    if 'address' in data: update['address'] = data['address']
    if update:
        await db.agencies.update_one({"id": agency_id, "company_id": user['id']}, {"$set": update})
    return {"status": "updated"}


@router.put("/company/prescriber/{prescriber_id}/assign")
async def assign_prescriber_to_agency(prescriber_id: str, data: dict, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    agency_id = data.get('agency_id')
    await db.users.update_one({"id": prescriber_id, "prescriber_company_id": user['id']}, {"$set": {"agency_id": agency_id}})
    return {"status": "assigned"}


@router.get("/company/intervenants")
async def company_intervenants(user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    company_id = user['id']
    intervenants = await db.users.find(
        {"prescriber_company_id": company_id, "is_intervention_provider": True},
        {"_id": 0, "password_hash": 0}
    ).to_list(200)
    agencies = await db.agencies.find({"company_id": company_id}, {"_id": 0}).to_list(50)
    result = []
    for iv in intervenants:
        agency_name = next((a['name'] for a in agencies if a['id'] == iv.get('agency_id')), 'Non assigne')
        interventions = await db.interventions.find({"assigned_to": iv['id']}, {"_id": 0}).to_list(100)
        result.append({
            "id": iv['id'], "name": iv.get('name', ''), "email": iv.get('email', ''),
            "phone": iv.get('phone', ''), "address": iv.get('address', ''),
            "intervention_structure": iv.get('intervention_structure', iv.get('structure_name', '')),
            "intervention_radius_km": iv.get('intervention_radius_km', 30),
            "agency_id": iv.get('agency_id'), "agency_name": agency_name,
            "profession": iv.get('profession', ''),
            "total_interventions": len(interventions),
            "active_interventions": len([i for i in interventions if i.get('status') in ('pending_acceptance', 'in_progress', 'en_route', 'dispatched')]),
            "completed_interventions": len([i for i in interventions if i.get('status') == 'completed']),
        })
    return result


@router.get("/company/intervenant/{intervenant_id}")
async def get_intervenant_detail(intervenant_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    intervenant = await db.users.find_one(
        {"id": intervenant_id, "prescriber_company_id": user['id'], "is_intervention_provider": True},
        {"_id": 0, "password_hash": 0}
    )
    if not intervenant:
        raise HTTPException(status_code=404, detail="Intervenant non trouve")
    agency = None
    if intervenant.get('agency_id'):
        agency = await db.agencies.find_one({"id": intervenant['agency_id']}, {"_id": 0})
    interventions = await db.interventions.find({"assigned_to": intervenant_id}, {"_id": 0}).to_list(200)
    return {
        "intervenant": intervenant,
        "agency": agency,
        "interventions": interventions,
        "total_interventions": len(interventions),
        "active_interventions": len([i for i in interventions if i.get('status') in ('pending_acceptance', 'in_progress', 'en_route', 'dispatched')]),
        "completed_interventions": len([i for i in interventions if i.get('status') == 'completed']),
    }


@router.put("/company/intervenant/{intervenant_id}/assign")
async def assign_intervenant_to_agency(intervenant_id: str, data: dict, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    agency_id = data.get('agency_id')
    await db.users.update_one(
        {"id": intervenant_id, "prescriber_company_id": user['id']},
        {"$set": {"agency_id": agency_id}}
    )
    return {"status": "assigned"}


@router.get("/company/interventions")
async def company_interventions(user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    company_id = user['id']
    # Get intervenants of this company
    intervenants = await db.users.find(
        {"prescriber_company_id": company_id, "is_intervention_provider": True},
        {"_id": 0, "password_hash": 0}
    ).to_list(200)
    intervenant_ids = [iv['id'] for iv in intervenants]
    # Get interventions assigned to these intervenants
    interventions = await db.interventions.find(
        {"assigned_to": {"$in": intervenant_ids}},
        {"_id": 0}
    ).to_list(500)
    # Enrich with intervenant names
    for iv in interventions:
        assigned = next((i for i in intervenants if i['id'] == iv.get('assigned_to')), None)
        if assigned:
            iv['intervenant_name'] = assigned.get('name', '')
            iv['intervenant_structure'] = assigned.get('intervention_structure', assigned.get('structure_name', ''))
    return interventions
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    # Unassign prescribers from this agency
    await db.users.update_many({"agency_id": agency_id}, {"$unset": {"agency_id": ""}})
    await db.agencies.delete_one({"id": agency_id, "company_id": user['id']})
    return {"status": "deleted"}
