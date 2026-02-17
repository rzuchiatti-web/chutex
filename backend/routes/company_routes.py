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


@router.delete("/company/agencies/{agency_id}")
async def delete_agency(agency_id: str, user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    await db.users.update_many({"agency_id": agency_id}, {"$unset": {"agency_id": ""}})
    await db.agencies.delete_one({"id": agency_id, "company_id": user['id']})
    return {"status": "deleted"}


# ==================== REWARDS PROGRAM ====================
@router.get("/company/rewards/current")
async def get_current_reward(user=Depends(get_current_user)):
    """Get current month's reward program"""
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")
    reward = await db.rewards.find_one({"month": month_key, "active": True}, {"_id": 0})
    if not reward:
        reward = {"month": month_key, "prize_1": 100, "prize_2": 70, "prize_3": 30, "description": "Programme de recompenses prescripteurs", "active": True}
    return reward


@router.get("/rewards/ranking")
async def get_rewards_ranking(user=Depends(get_current_user)):
    """Get anonymous ranking for current month - for prescribers"""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    # Get all prescriptions this month
    all_prescs = await db.prescriptions.find({"created_at": {"$gte": month_start}}, {"_id": 0}).to_list(1000)
    # Count per prescriber (guardian_id)
    counts = {}
    for p in all_prescs:
        gid = p.get('guardian_id', '')
        if gid:
            counts[gid] = counts.get(gid, 0) + 1
    # Sort by count
    ranking = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    # Find user position
    my_position = None
    my_count = 0
    for i, (gid, count) in enumerate(ranking):
        if gid == user['id']:
            my_position = i + 1
            my_count = count
            break
    # If user not in ranking, add at end
    if my_position is None:
        my_position = len(ranking) + 1
        my_count = 0
    # Next position target
    next_target = 0
    if my_position > 1 and len(ranking) >= my_position - 1:
        next_target = ranking[my_position - 2][1] - my_count
    # Anonymous ranking (just positions and counts)
    anon_ranking = [{"position": i + 1, "prescriptions": count, "is_me": gid == user['id']} for i, (gid, count) in enumerate(ranking[:20])]
    # Get reward info
    month_key = now.strftime("%Y-%m")
    reward = await db.rewards.find_one({"month": month_key, "active": True}, {"_id": 0})
    prizes = {"1": reward.get("prize_1", 100) if reward else 100, "2": reward.get("prize_2", 70) if reward else 70, "3": reward.get("prize_3", 30) if reward else 30}
    # History
    history = await db.reward_winners.find({}, {"_id": 0}).sort("month", -1).to_list(6)
    return {
        "month": month_key,
        "my_position": my_position,
        "my_prescriptions": my_count,
        "prescriptions_to_next": max(next_target, 0),
        "total_participants": len(ranking),
        "ranking": anon_ranking,
        "prizes": prizes,
        "history": history,
    }


@router.post("/admin/rewards")
async def set_monthly_reward(data: dict, user=Depends(get_current_user)):
    """Admin sets monthly reward"""
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin requis")
    now = datetime.now(timezone.utc)
    month_key = data.get('month', now.strftime("%Y-%m"))
    await db.rewards.update_one({"month": month_key}, {"$set": {
        "month": month_key, "prize_1": data.get('prize_1', 100),
        "prize_2": data.get('prize_2', 70), "prize_3": data.get('prize_3', 30),
        "description": data.get('description', 'Programme de recompenses prescripteurs'),
        "active": True, "updated_at": now.isoformat(), "updated_by": user.get('name', ''),
    }}, upsert=True)
    return {"status": "updated"}



@router.get("/rewards/history")
async def get_rewards_history(user=Depends(get_current_user)):
    """Get full rewards history for prescriber — past challenges + current"""
    history = await db.rewards_history.find({}, {"_id": 0}).sort("month", -1).to_list(12)
    # Find user's total rewards earned
    total_earned = 0
    my_history = []
    for h in history:
        for r in h.get('ranking', []):
            if r.get('prescriber_id') == user['id'] or r.get('name') == user.get('name'):
                my_history.append({
                    "month": h['month'],
                    "month_label": h.get('month_label', h['month']),
                    "position": r['position'],
                    "prescriptions_count": r.get('prescriptions_count', 0),
                    "reward": r.get('reward', 0),
                    "status": h.get('status', 'completed'),
                })
                total_earned += r.get('reward', 0)
                break
    # Current month ranking
    now = datetime.now(timezone.utc)
    month_key = now.strftime("%Y-%m")
    reward = await db.rewards.find_one({"month": month_key, "active": True}, {"_id": 0})
    prizes = {"prize_1": reward.get("prize_1", 100) if reward else 100, "prize_2": reward.get("prize_2", 70) if reward else 70, "prize_3": reward.get("prize_3", 30) if reward else 30}
    # Current position
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    all_prescs = await db.prescriptions.find({"created_at": {"$gte": month_start}}, {"_id": 0}).to_list(1000)
    counts = {}
    for p in all_prescs:
        gid = p.get('guardian_id', '')
        if gid: counts[gid] = counts.get(gid, 0) + 1
    ranking = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    my_position = len(ranking) + 1
    my_count = 0
    for i, (gid, count) in enumerate(ranking):
        if gid == user['id']:
            my_position = i + 1
            my_count = count
            break
    return {
        "current_month": month_key,
        "current_position": my_position,
        "current_prescriptions": my_count,
        "total_participants": len(ranking),
        "prizes": prizes,
        "total_earned": total_earned,
        "my_history": my_history,
        "all_history": history,
    }



@router.get("/company/analytics")
async def company_analytics(user=Depends(get_current_user)):
    if user.get('role') != 'prescriber_company':
        raise HTTPException(status_code=403, detail="Acces entreprise requis")
    company_id = user['id']
    now = datetime.now(timezone.utc)
    # Get intervenants and their interventions
    intervenants = await db.users.find({"prescriber_company_id": company_id, "is_intervention_provider": True}, {"_id": 0, "password_hash": 0}).to_list(200)
    iv_ids = [iv['id'] for iv in intervenants]
    all_ivs = await db.interventions.find({"assigned_to": {"$in": iv_ids}}, {"_id": 0}).to_list(500)
    completed = [iv for iv in all_ivs if iv.get('status') == 'completed']
    active = [iv for iv in all_ivs if iv.get('status') in ('pending_acceptance', 'en_route', 'in_progress')]
    # Avg response time (created_at -> accepted_at)
    total_resp = 0
    count_resp = 0
    for iv in all_ivs:
        if iv.get('accepted_at') and iv.get('created_at'):
            try:
                c = datetime.fromisoformat(iv['created_at'].replace('Z', '+00:00'))
                a = datetime.fromisoformat(iv['accepted_at'].replace('Z', '+00:00'))
                total_resp += (a - c).total_seconds() / 60
                count_resp += 1
            except: pass
    avg_response = round(total_resp / count_resp, 1) if count_resp > 0 else 0
    # Avg intervention duration (accepted_at -> completed_at)
    total_dur = 0
    count_dur = 0
    for iv in completed:
        if iv.get('accepted_at') and iv.get('completed_at'):
            try:
                a = datetime.fromisoformat(iv['accepted_at'].replace('Z', '+00:00'))
                d = datetime.fromisoformat(iv['completed_at'].replace('Z', '+00:00'))
                total_dur += (d - a).total_seconds() / 60
                count_dur += 1
            except: pass
    avg_duration = round(total_dur / count_dur, 1) if count_dur > 0 else 0
    # Acceptance rate
    accepted = len([iv for iv in all_ivs if iv.get('assigned_to')])
    acceptance_rate = round((accepted / len(all_ivs)) * 100) if all_ivs else 0
    # Per agency stats
    agencies = await db.agencies.find({"company_id": company_id}, {"_id": 0}).to_list(50)
    agency_performance = []
    for ag in agencies:
        ag_intervenants = [iv for iv in intervenants if iv.get('agency_id') == ag['id']]
        ag_ids = [iv['id'] for iv in ag_intervenants]
        ag_ivs = [iv for iv in all_ivs if iv.get('assigned_to') in ag_ids]
        ag_completed = [iv for iv in ag_ivs if iv.get('status') == 'completed']
        agency_performance.append({
            "agency_name": ag['name'], "intervenants": len(ag_intervenants),
            "total": len(ag_ivs), "completed": len(ag_completed),
            "active": len([iv for iv in ag_ivs if iv.get('status') in ('pending_acceptance', 'en_route', 'in_progress')]),
        })
    # Per intervenant performance
    iv_performance = []
    for ivt in intervenants:
        ivt_missions = [iv for iv in all_ivs if iv.get('assigned_to') == ivt['id']]
        ivt_completed = [iv for iv in ivt_missions if iv.get('status') == 'completed']
        iv_performance.append({
            "name": ivt.get('name', ''), "agency_id": ivt.get('agency_id'),
            "total": len(ivt_missions), "completed": len(ivt_completed),
            "active": len([iv for iv in ivt_missions if iv.get('status') in ('pending_acceptance', 'en_route', 'in_progress')]),
        })
    iv_performance.sort(key=lambda x: x['completed'], reverse=True)
    return {
        "total_intervenants": len(intervenants),
        "total_interventions": len(all_ivs),
        "completed_interventions": len(completed),
        "active_interventions": len(active),
        "avg_response_time_min": avg_response,
        "avg_duration_min": avg_duration,
        "acceptance_rate": acceptance_rate,
        "agency_performance": agency_performance,
        "intervenant_performance": iv_performance[:10],
    }

