from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid, logging

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/company/dashboard")
async def company_dashboard(user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    company_id = user['id']
    # Get all agencies
    agencies = await db.agencies.find({"company_id": company_id}, {"_id": 0}).to_list(50)
    # Get all prescribers linked to this company
    prescribers = await db.users.find({"prescriber_company_id": company_id, "is_prescriber": True}, {"_id": 0, "password_hash": 0}).to_list(200)
    # Get all prescriptions from these prescribers
    prescriber_ids = [p['id'] for p in prescribers]
    prescriptions = await db.prescriptions.find({"guardian_id": {"$in": prescriber_ids}}, {"_id": 0}).to_list(500)
    # Compute stats
    total_comm_validated = sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'subscribed')
    total_comm_pending = sum(p.get('commission', 0) for p in prescriptions if p.get('status') == 'pending')
    # Stats per agency
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
    # Unassigned prescribers
    unassigned = [p for p in prescribers if not p.get('agency_id')]
    unassigned_ids = [p['id'] for p in unassigned]
    unassigned_prescs = [p for p in prescriptions if p.get('guardian_id') in unassigned_ids]
    # Top prescribers
    prescriber_stats = []
    for pr in prescribers:
        pr_prescs = [p for p in prescriptions if p.get('guardian_id') == pr['id']]
        prescriber_stats.append({
            "id": pr['id'], "name": pr.get('name', ''), "email": pr.get('email', ''),
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
