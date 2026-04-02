from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid
import logging
import os
import math

from database import db, EMERGENT_LLM_KEY, twilio_client, TWILIO_NUMBER
from auth import get_current_user, sanitize_user, get_effective_role
from services.smsmode_service import send_sms
from models import (
    LinkBeneficiaryRequest, PrescriptionCreate, ActivatePrescriberRequest,
    InterventionProviderActivate,
)
from utils import send_email
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
router = APIRouter()


async def _ensure_guardian_access_to_beneficiary(bid: str, user: dict) -> dict:
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")

    guardian_doc = await db.users.find_one({"id": user['id']}, {"_id": 0})
    beneficiary_ids = guardian_doc.get('beneficiaries', []) if guardian_doc else user.get('beneficiaries', [])
    if bid not in beneficiary_ids:
        raise HTTPException(status_code=403, detail="Non autorise")

    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    return ben


def _distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.post("/guardian/link")
async def link_beneficiary(data: LinkBeneficiaryRequest, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    b = await db.users.find_one({"email": data.beneficiary_email, "role": "beneficiary"}, {"_id": 0})
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": b['id']}})
    await db.users.update_one({"id": b['id']}, {"$addToSet": {"guardians": user['id']}})
    return {"status": "linked", "beneficiary": {"id": b['id'], "name": b['name'], "email": b['email']}}


@router.get("/guardian/beneficiaries")
async def get_beneficiaries(user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    result = []
    for bid in cu.get('beneficiaries', []):
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            latest = await db.device_readings.find_one({"user_id": bid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
            ac = await db.alerts.count_documents({"beneficiary_id": bid, "status": "active"})
            b['latest_vitals'] = latest['data'] if latest else None
            b['active_alerts'] = ac
            b['last_sync'] = latest['timestamp'] if latest else None
            result.append(b)
    return result


# ==================== BENEFICIARY: MY GUARDIANS ====================
@router.get("/guardians/my")
async def get_my_guardians(user=Depends(get_current_user)):
    """Get list of guardians for the current beneficiary, ordered"""
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    guardian_order = cu.get('guardian_order', cu.get('guardians', []))
    guardians = []
    seen = set()
    for gid in list(guardian_order) + cu.get('guardians', []):
        if gid in seen:
            continue
        seen.add(gid)
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g:
            # Look up relationship from dedicated collection
            rel_doc = await db.guardian_relationships.find_one(
                {"guardian_id": gid, "beneficiary_id": user['id']}, {"_id": 0}
            )
            rel = rel_doc.get('relationship', '') if rel_doc else g.get('relationship', '')
            guardians.append({"id": g['id'], "name": g['name'], "email": g.get('email', ''), "phone": g.get('phone', ''),
                "address": g.get('address', ''), "postal_code": g.get('postal_code', ''), "city": g.get('city', ''), "country": g.get('country', ''),
                "profession": g.get('profession', ''), "structure_name": g.get('structure_name', ''),
                "guardian_type": g.get('guardian_type', ''), "relationship": rel,
                "is_intervention_provider": g.get('is_intervention_provider', False), "is_prescriber": g.get('is_prescriber', False),
                "latitude": g.get('latitude'), "longitude": g.get('longitude')})
    return guardians


@router.post("/guardians/reorder")
async def reorder_guardians(data: dict, user=Depends(get_current_user)):
    """Reorder guardians for escalation priority"""
    order = data.get('order', [])
    await db.users.update_one({"id": user['id']}, {"$set": {"guardian_order": order}})
    return {"status": "ok"}


@router.post("/guardians/{guardian_id}/unlink")
async def unlink_guardian(guardian_id: str, user=Depends(get_current_user)):
    """Remove a guardian from beneficiary"""
    await db.users.update_one({"id": user['id']}, {"$pull": {"guardians": guardian_id, "guardian_order": guardian_id}})
    await db.users.update_one({"id": guardian_id}, {"$pull": {"beneficiaries": user['id']}})
    return {"status": "unlinked"}


@router.post("/guardians/invite")
async def invite_guardian(data: dict, user=Depends(get_current_user)):
    """Invite a guardian by phone number. If exists, send notification. If not, send SMS."""
    import re
    phone = data.get('phone', '').strip()
    relationship = data.get('relationship', '')
    if not phone:
        raise HTTPException(status_code=400, detail="Numero de telephone requis")

    # Normalize phone
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone)
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]

    # Check if already a guardian
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    for gid in cu.get('guardians', []):
        g = await db.users.find_one({"id": gid}, {"_id": 0})
        if g and g.get('phone', '').replace(' ', '')[-9:] == cleaned[-9:]:
            return {"linked": False, "message": "Ce gardien est deja dans votre liste."}

    # Search for existing guardian account by phone
    existing = await db.users.find_one({"phone": {"$regex": cleaned[-9:]}, "role": "guardian"}, {"_id": 0, "password_hash": 0})

    if existing:
        # Guardian exists - create PENDING invitation (not auto-link)
        already_linked = user['id'] in existing.get('beneficiaries', [])
        if already_linked:
            return {"linked": False, "message": "Ce gardien est deja dans votre liste."}

        # Check if invitation already pending
        pending = await db.guardian_invitations.find_one({
            "beneficiary_id": user['id'], "guardian_id": existing['id'], "status": "pending"
        })
        if pending:
            return {"linked": False, "message": f"Invitation deja envoyee a {existing['name']}. En attente de validation."}

        now = datetime.now(timezone.utc).isoformat()
        inv_id = str(uuid.uuid4())
        await db.guardian_invitations.insert_one({
            "id": inv_id,
            "beneficiary_id": user['id'],
            "beneficiary_name": user.get('name', ''),
            "guardian_id": existing['id'],
            "guardian_name": existing['name'],
            "guardian_phone": cleaned,
            "relationship": relationship,
            "status": "pending",
            "created_at": now,
        })

        return {
            "linked": False,
            "invitation_sent": True,
            "message": f"Demande envoyee a {existing['name']}. Il doit accepter dans son app.",
        }
    else:
        # No account - send SMS invitation via Twilio
        sms_sent = False
        if twilio_client:
            try:
                ben_name = user.get('name', 'Un proche')
                twilio_client.messages.create(
                    body=f"{ben_name} souhaite vous ajouter comme gardien sur Chutex, l'application de teleassistance. Inscrivez-vous sur https://ble-state-manager.preview.emergentagent.com pour veiller sur votre proche.",
                    from_=TWILIO_NUMBER,
                    to=cleaned,
                )
                sms_sent = True
            except Exception as e:
                logger.error(f"SMS invitation error: {e}")

        # Store pending invitation
        await db.guardian_invitations.insert_one({
            "id": str(uuid.uuid4()),
            "beneficiary_id": user['id'],
            "beneficiary_name": user.get('name', ''),
            "guardian_id": "",
            "guardian_phone": cleaned,
            "status": "sms_sent" if sms_sent else "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        if sms_sent:
            return {"linked": False, "message": f"SMS d'invitation envoye au {cleaned}. Il pourra vous ajouter apres inscription."}
        else:
            return {"linked": False, "message": f"Aucun compte gardien avec ce numero. Demandez a votre proche de s'inscrire sur l'app."}


@router.get("/alerts/my")
async def get_my_alerts(user=Depends(get_current_user), limit: int = 10):
    """Get recent alerts for the current user"""
    alerts = await db.alerts.find(
        {"beneficiary_id": user['id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return alerts


# ==================== SAAD INVITATIONS FOR GUARDIAN ====================
@router.get("/guardian/saad-invitations")
async def get_saad_invitations(user=Depends(get_current_user)):
    """Get pending SAAD invitations for the current guardian"""
    invitations = await db.saad_guardian_links.find(
        {"guardian_id": user['id'], "status": "pending"}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return invitations


@router.post("/guardian/saad-invitations/{inv_id}/accept")
async def accept_saad_invitation(inv_id: str, user=Depends(get_current_user)):
    """Guardian accepts a SAAD invitation to be linked"""
    inv = await db.saad_guardian_links.find_one(
        {"id": inv_id, "guardian_id": user['id'], "status": "pending"}, {"_id": 0}
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation non trouvee")
    # Remove existing SAAD link if any
    await db.saad_guardian_links.update_many(
        {"guardian_id": user['id'], "status": "accepted"},
        {"$set": {"status": "removed"}}
    )
    await db.saad_guardian_links.update_one({"id": inv_id}, {"$set": {"status": "accepted"}})
    await db.users.update_one({"id": user['id']}, {"$set": {
        "saad_company_id": inv['company_id'],
        "saad_company_name": inv['company_name'],
    }})
    return {"status": "accepted", "message": f"Vous etes maintenant rattache a {inv['company_name']}."}


@router.post("/guardian/saad-invitations/{inv_id}/reject")
async def reject_saad_invitation(inv_id: str, user=Depends(get_current_user)):
    """Guardian rejects a SAAD invitation"""
    await db.saad_guardian_links.update_one(
        {"id": inv_id, "guardian_id": user['id']}, {"$set": {"status": "rejected"}}
    )
    return {"status": "rejected"}


@router.post("/guardian/saad-detach")
async def detach_from_saad(user=Depends(get_current_user)):
    """Guardian voluntarily detaches from their SAAD"""
    link = await db.saad_guardian_links.find_one(
        {"guardian_id": user['id'], "status": "accepted"}, {"_id": 0}
    )
    if not link:
        raise HTTPException(status_code=404, detail="Aucun rattachement SAAD actif")
    await db.saad_guardian_links.update_one(
        {"id": link['id']}, {"$set": {"status": "detached"}}
    )
    await db.users.update_one(
        {"id": user['id']}, {"$unset": {"saad_company_id": "", "saad_company_name": ""}}
    )
    return {"status": "detached", "message": "Vous avez été détaché de la structure SAAD."}


@router.get("/guardian/saad-link")
async def get_saad_link(user=Depends(get_current_user)):
    """Get the guardian's current SAAD link info including space activation status."""
    company_id = user.get('saad_company_id') or user.get('prescriber_company_id')
    if not company_id:
        return None
    company = await db.users.find_one(
        {"id": company_id}, {"_id": 0, "password_hash": 0}
    )
    link = await db.saad_guardian_links.find_one(
        {"guardian_id": user['id'], "status": "accepted"}, {"_id": 0}
    )
    if not company:
        return None
    # Get agency info
    agency = None
    if user.get('agency_id'):
        agency = await db.agencies.find_one({"id": user['agency_id']}, {"_id": 0})
    return {
        "company_id": company_id,
        "company_name": company.get('structure_name', company.get('name', '')),
        "company_address": company.get('address', ''),
        "company_siret": company.get('siret', ''),
        "commission_type": company.get('commission_type', 'monthly'),
        "link_id": link['id'] if link else None,
        "linked_since": link.get('created_at') if link else None,
        "agency_name": agency.get('name') if agency else None,
        "agency_address": agency.get('address') if agency else None,
        "intervenant_active": not (link or {}).get('intervenant_deactivated', False),
        "prescripteur_active": not (link or {}).get('prescripteur_deactivated', False),
    }


@router.get("/guardian/invitations")
async def get_guardian_invitations(user=Depends(get_current_user)):
    """Get pending invitations for the current guardian"""
    invitations = await db.guardian_invitations.find(
        {"guardian_id": user['id'], "status": "pending"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return invitations


@router.post("/guardian/invitations/{inv_id}/accept")
async def accept_invitation(inv_id: str, user=Depends(get_current_user)):
    """Guardian accepts a beneficiary invitation"""
    inv = await db.guardian_invitations.find_one({"id": inv_id, "guardian_id": user['id']}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation non trouvee")
    await db.users.update_one({"id": inv['beneficiary_id']}, {"$addToSet": {"guardians": user['id'], "guardian_order": user['id']}})
    await db.users.update_one({"id": user['id']}, {"$addToSet": {"beneficiaries": inv['beneficiary_id']}})
    await db.guardian_invitations.update_one({"id": inv_id}, {"$set": {"status": "accepted"}})
    # Store relationship
    relationship = inv.get('relationship', '')
    if relationship:
        await db.guardian_relationships.update_one(
            {"guardian_id": user['id'], "beneficiary_id": inv['beneficiary_id']},
            {"$set": {"relationship": relationship, "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    return {"status": "accepted", "message": f"Vous etes maintenant gardien de {inv['beneficiary_name']}."}


@router.post("/guardian/invitations/{inv_id}/reject")
async def reject_invitation(inv_id: str, user=Depends(get_current_user)):
    """Guardian rejects a beneficiary invitation"""
    await db.guardian_invitations.update_one({"id": inv_id, "guardian_id": user['id']}, {"$set": {"status": "rejected"}})
    return {"status": "rejected"}


@router.post("/guardian/prescriptions")
async def create_prescription(data: PrescriptionCreate, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    if not user.get('is_prescriber'):
        raise HTTPException(status_code=403, detail="Mode prescripteur non active.")

    # Clean phone number
    raw_phone = (data.beneficiary_phone or '').strip().replace(' ', '').replace('.', '').replace('-', '')
    if raw_phone.startswith('0') and len(raw_phone) >= 10:
        cleaned_phone = '+33' + raw_phone[1:]
    elif raw_phone.startswith('+'):
        cleaned_phone = raw_phone
    else:
        cleaned_phone = raw_phone
    phone_suffix = cleaned_phone[-9:] if len(cleaned_phone) >= 9 else cleaned_phone

    # Check: already has an active subscription on this phone?
    existing_sub = await db.subscriptions.find_one(
        {"beneficiary_phone": {"$regex": phone_suffix}, "status": "active"}, {"_id": 0}
    )
    if existing_sub:
        raise HTTPException(status_code=400, detail="Ce numero a deja un abonnement actif. Impossible de creer une nouvelle prescription.")

    # Check: already has a pending or validated prescription for this phone?
    existing_presc = await db.prescriptions.find_one(
        {"beneficiary_phone": {"$regex": phone_suffix}, "status": {"$in": ["pending", "validated", "subscribed", "contract_created"]}}, {"_id": 0}
    )
    if existing_presc:
        status_label = "en attente" if existing_presc['status'] == 'pending' else "validee"
        raise HTTPException(status_code=400, detail=f"Une prescription {status_label} existe deja pour ce numero ({existing_presc.get('beneficiary_name', '')}).")

    # Check: already has an active contract?
    existing_contract = await db.contracts.find_one(
        {"beneficiary.phone": {"$regex": phone_suffix}, "status": {"$in": ["active", "pending_payment"]}}, {"_id": 0}
    )
    if existing_contract:
        raise HTTPException(status_code=400, detail="Un contrat existe deja pour ce numero. Impossible de creer une nouvelle prescription.")

    now = datetime.now(timezone.utc).isoformat()
    structure = user.get('prescriber_structure', user.get('structure_name', 'Chutex'))
    full_name = f"{data.beneficiary_first_name} {data.beneficiary_name}".strip() if data.beneficiary_first_name else data.beneficiary_name
    # Determine plan label and price based on subscription type
    if data.subscription_type == "sport":
        plan_label = "Abonnement Sport (Chutex Care)"
        price = 89.00
    elif data.subscription_type == "physio":
        plan_label = "Abonnement Physio (Chutex Care)"
        price = 89.00
    elif data.subscription_type == "bracelet_gilet":
        plan_label = "Bracelet Elio + Gilet Elder (Chutex Care)"
        price = 79.90
    else:
        plan_label = "Bracelet Elio (Chutex Care)"
        price = 39.90
    next_month = (datetime.now(timezone.utc).replace(day=1) + timedelta(days=32)).replace(day=1)
    p = {
        "id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
        "prescriber_structure": structure,
        "beneficiary_name": full_name, "beneficiary_first_name": data.beneficiary_first_name,
        "beneficiary_email": data.beneficiary_email,
        "beneficiary_phone": cleaned_phone, "subscription_type": data.subscription_type,
        "guardian_contact_name": data.guardian_contact_name, "guardian_contact_phone": data.guardian_contact_phone,
        "plan_label": plan_label, "price": price,
        "commission": 100.00 if data.subscription_type == "bracelet_gilet" else 50.00,
        "commission_monthly": 10.00 if data.subscription_type == "bracelet_gilet" else (5.00 if data.subscription_type in ("bracelet", "physio", "sport") else 0),
        "notes": data.notes, "status": "pending", "beneficiary_id": None, "subscribed_at": None,
        "commission_payment_date": next_month.isoformat(),
        "tracking_phone": cleaned_phone, "tracking_email": data.beneficiary_email,
        "created_at": now, "notification_sent": True, "notification_type": "sms",
    }
    await db.prescriptions.insert_one(p)
    # Send SMS to beneficiary
    sub_link = "https://ble-state-manager.preview.emergentagent.com/subscription"
    sms_label = "a l'abonnement sport Chutex Care" if data.subscription_type == "sport" else "a l'abonnement physio Chutex Care" if data.subscription_type == "physio" else "a la teleassistance Chutex Care"
    await send_sms(
        cleaned_phone,
        f"Bonjour {full_name}, {structure} vous invite a souscrire {sms_label}. Souscrivez ici : {sub_link}"
    )
    # Send SMS to guardian/aidant contact if provided
    if data.guardian_contact_phone and data.guardian_contact_phone.strip():
        guardian_phone_clean = data.guardian_contact_phone.strip().replace(' ', '').replace('.', '').replace('-', '')
        if guardian_phone_clean.startswith('0') and len(guardian_phone_clean) >= 10:
            guardian_phone_clean = '+33' + guardian_phone_clean[1:]
        await send_sms(
            guardian_phone_clean,
            f"{full_name} vous invite a finaliser sa souscription de contrat de teleassistance pour vivre plus sereinement : {sub_link}"
        )
    if data.beneficiary_email:
        await send_email(data.beneficiary_email, f"{structure} vous invite a souscrire a Chutex", f"<h2>Bonjour {full_name}</h2><p>L'entreprise {structure} vous invite.</p>")
    return {k: v for k, v in p.items() if k != '_id'}


@router.get("/guardian/prescriptions")
async def get_prescriptions(user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    return await db.prescriptions.find({"guardian_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.post("/guardian/activate-prescriber")
async def activate_prescriber(data: ActivatePrescriberRequest, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    code = await db.activation_codes.find_one({"code": data.code, "active": True}, {"_id": 0})
    if not code:
        raise HTTPException(status_code=404, detail="Code invalide ou expire")
    if code.get('uses_count', 0) >= code.get('max_uses', 50):
        raise HTTPException(status_code=400, detail="Code epuise")

    company_id = code.get('created_by', '')
    await db.users.update_one({"id": user['id']}, {"$set": {
        "is_prescriber": True,
        "prescriber_structure": code['structure_name'],
        "prescriber_code_used": data.code,
        "prescriber_company_id": company_id,
    }})
    await db.activation_codes.update_one({"code": data.code}, {"$inc": {"uses_count": 1}})

    # Auto-update SAAD guardian link
    phone_suffix = (user.get('phone', '') or '')[-9:]
    if phone_suffix:
        existing_link = await db.saad_guardian_links.find_one(
            {"company_id": company_id, "guardian_phone": {"$regex": phone_suffix}},
        )
        if existing_link:
            await db.saad_guardian_links.update_one(
                {"_id": existing_link["_id"]},
                {"$set": {"status": "accepted", "guardian_id": user['id'], "guardian_name": user.get('name', '')}},
            )
        else:
            await db.saad_guardian_links.insert_one({
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "company_name": code['structure_name'],
                "guardian_id": user['id'],
                "guardian_phone": user.get('phone', ''),
                "guardian_name": user.get('name', ''),
                "status": "accepted",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    return {"status": "activated", "structure": code['structure_name']}


@router.get("/guardian/beneficiary/{bid}/alerts")
async def guardian_beneficiary_alerts(bid: str, user=Depends(get_current_user)):
    """Get all alerts for a specific beneficiary (guardian access)"""
    alerts = await db.alerts.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    enriched = []
    for a in alerts:
        iv = await db.interventions.find_one({"alert_id": a['id']}, {"_id": 0})
        if iv and iv.get('assigned_to'):
            intervener = await db.users.find_one({"id": iv['assigned_to']}, {"_id": 0, "password_hash": 0})
            if intervener:
                a['care_provider'] = intervener.get('name', '')
                a['teleassistance_status'] = iv.get('status', '')
        enriched.append(a)
    return enriched


@router.get("/guardian/beneficiary/{bid}/vitals-history")
async def guardian_beneficiary_vitals_history(bid: str, limit: int = 20, user=Depends(get_current_user)):
    """Get vitals history for a beneficiary"""
    readings = await db.device_readings.find(
        {"user_id": bid, "data.heart_rate": {"$exists": True}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    result = []
    for r in readings:
        d = r.get('data', {})
        result.append({
            "timestamp": r.get('timestamp', ''),
            "heart_rate": d.get('heart_rate', 0),
            "spo2": d.get('spo2', 0),
            "steps": d.get('steps', 0),
            "temperature": d.get('temperature', 0),
        })
    return list(reversed(result))


@router.get("/guardian/beneficiary/{bid}/ai-report")
async def guardian_beneficiary_ai_report(bid: str, user=Depends(get_current_user)):
    """Get a short AI health summary for a beneficiary"""
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben:
        return None
    # Get latest device data
    br = await db.device_readings.find_one({"user_id": bid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    sc = await db.device_readings.find_one({"user_id": bid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])
    devs = await db.devices.find({"user_id": bid, "removed": {"$ne": True}}, {"_id": 0}).to_list(5)
    dev_info = ", ".join([f"{d.get('device_type','inconnu')}(bat:{d.get('battery',0)}%)" for d in devs]) or "aucun appareil"
    br_data = (br or {}).get("data", {})
    sc_data = (sc or {}).get("data", {})
    data_str = f"FC:{br_data.get('heart_rate',0)}bpm SpO2:{br_data.get('spo2',0)}% Temp:{br_data.get('temperature',0)} Pas:{br_data.get('steps',0)} Poids:{sc_data.get('weight',0)}kg"
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"summary": f"{ben['name']}, {ben.get('medical_conditions','aucune pathologie connue')}. Appareils: {dev_info}."}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        prompt = f"En 2-3 phrases, donne UNIQUEMENT une analyse sante de ce beneficiaire. NE REPETE PAS son nom, adresse ou infos de profil. Donnees: {data_str}. Pathologies: {ben.get('medical_conditions','aucune')}. Donne des observations cliniques (normal/anormal, risques, recommandations). Sois factuel, pas d'emoji."
        chat = LlmChat(api_key=api_key, session_id=f"guard-{bid[:8]}",
                       system_message="Medecin. 2 phrases max. Factuel.").with_model("openai", "gpt-5.2")
        r = await chat.send_message(UserMessage(text=prompt))
        return {"summary": r.strip()}
    except Exception as e:
        return {"summary": f"{ben['name']}. Appareils: {dev_info}."}


@router.get("/guardian/beneficiary/{bid}/devices")
async def guardian_beneficiary_devices(bid: str, user=Depends(get_current_user)):
    """Get device status for a beneficiary — real data from devices collection"""
    now = datetime.now(timezone.utc)
    result = {}
    for dt in ["bracelet", "scale", "vest"]:
        dev = await db.devices.find_one(
            {"user_id": bid, "device_type": dt, "removed": {"$ne": True}}, {"_id": 0}
        )
        if dev:
            is_connected = False
            if dev.get('last_sync'):
                try:
                    ls = datetime.fromisoformat(dev['last_sync'].replace('Z', '+00:00'))
                    threshold = 30 if dt == 'vest' else 120
                    is_connected = (now - ls).total_seconds() < threshold
                except: pass
            result[dt] = {
                "connected": is_connected,
                "battery_level": dev.get("battery", 0),
                "last_sync": dev.get("last_sync"),
                "heart_rate": dev.get("last_heart_rate", 0),
                "spo2": dev.get("last_spo2", 0),
                "steps": dev.get("last_steps", 0),
                "temperature": dev.get("last_temperature", 0),
            }
    return result


@router.get("/guardian/beneficiary/{bid}/detail")
async def guardian_beneficiary_detail(bid: str, user=Depends(get_current_user)):
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    if bid not in user.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Non autorise")
    alerts = await db.alerts.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    readings = await db.device_readings.find({"user_id": bid}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    thresholds = await db.thresholds.find({"user_id": bid}, {"_id": 0}).to_list(100)
    location = await db.locations.find_one({"user_id": bid}, {"_id": 0})
    interventions = await db.interventions.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    devices = await db.devices.find({"user_id": bid}, {"_id": 0}).to_list(10)
    reminders = await db.reminders.find({"user_id": bid}, {"_id": 0}).to_list(50)
    data_sharing = ben.get('data_sharing_prefs', {})
    return {
        "beneficiary": sanitize_user(ben), "alerts": alerts, "readings": readings,
        "thresholds": thresholds, "location": location, "interventions": interventions,
        "devices": devices, "reminders": reminders, "data_sharing_prefs": data_sharing,
        "stats": {"total_alerts": len(alerts), "active_alerts": sum(1 for a in alerts if a['status'] == 'active')},
    }



@router.get("/guardian/beneficiary/{bid}/subscription")
async def guardian_beneficiary_subscription(bid: str, user=Depends(get_current_user)):
    """Get subscription, contract and guardians info for a beneficiary"""
    sub = await db.subscriptions.find_one({"beneficiary_id": bid, "status": "active"}, {"_id": 0})
    if not sub:
        ben = await db.users.find_one({"id": bid}, {"_id": 0})
        if ben and ben.get("phone"):
            sub = await db.subscriptions.find_one({"beneficiary_phone": ben["phone"], "status": "active"}, {"_id": 0})
    contract = None
    if sub and sub.get("contract_id"):
        contract = await db.contracts.find_one({"id": sub["contract_id"]}, {"_id": 0})
        if contract:
            contract.pop("cgu_text", None)
            contract.pop("stripe_client_secret", None)
    # Get guardians linked to this beneficiary
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    guardian_ids = ben.get("guardians", []) if ben else []
    guardians = []
    for gid in guardian_ids:
        g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
        if g:
            guardians.append({"id": g["id"], "name": g["name"], "phone": g.get("phone", ""), "relationship": g.get("relationship", ""), "guardian_type": g.get("guardian_type", "")})
    return {"subscription": sub, "contract": contract, "guardians": guardians}


@router.get("/guardian/beneficiary/{bid}/metric-history/{key}")
async def guardian_metric_history(bid: str, key: str, period: str = "7j", user=Depends(get_current_user)):
    """Same as /health/metric-history/{key} but for a specific beneficiary — aggregated per day."""
    await _ensure_guardian_access_to_beneficiary(bid, user)
    uid = bid
    days = {"24h": 1, "7j": 7, "30j": 30, "90j": 90}.get(period, 7)
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    bracelet_keys = {"heart_rate", "hrv", "spo2", "blood_pressure", "temperature", "stress_level", "recovery_score", "steps", "calories", "distance_km", "sleep_quality", "sleep_duration_min", "vo2_max", "glycemia"}
    scale_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi", "body_age", "protein_pct", "skeletal_muscle_pct", "basal_metabolism", "recommended_calories", "waist_hip_ratio", "ideal_weight"}
    device_type = "bracelet" if key in bracelet_keys or key in ("bp_systolic", "bp_diastolic") else "scale" if key in scale_keys else "bracelet"

    max_keys = {"steps", "calories", "distance_km"}
    last_keys = {"weight", "body_fat_pct", "muscle_pct", "water_pct", "bone_mass_kg", "visceral_fat", "bmi"}

    readings = await db.device_readings.find(
        {"user_id": uid, "device_type": device_type, "timestamp": {"$gte": since}}, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)

    is_bp = key == "blood_pressure"
    from collections import defaultdict
    daily: dict = defaultdict(list)
    for r in readings:
        data = r.get("data", {})
        ts = r.get("timestamp", "")
        date_key = ts[:10]
        if is_bp:
            bp = data.get("blood_pressure", {})
            if bp.get("systolic"):
                daily[date_key].append({"systolic": bp["systolic"], "diastolic": bp.get("diastolic", 0)})
        else:
            val = data.get(key, 0)
            if val and val > 0:
                daily[date_key].append(val)

    history = []
    for date_key in sorted(daily.keys()):
        values = daily[date_key]
        if not values:
            continue
        label = date_key[5:10].replace("-", "/")
        if is_bp:
            avg_sys = round(sum(v["systolic"] for v in values) / len(values))
            avg_dia = round(sum(v["diastolic"] for v in values) / len(values))
            history.append({"date": date_key, "label": label, "value": avg_sys, "systolic": avg_sys, "diastolic": avg_dia})
        elif key in max_keys:
            history.append({"date": date_key, "label": label, "value": max(values)})
        elif key in last_keys:
            history.append({"date": date_key, "label": label, "value": values[-1]})
        else:
            avg_val = round(sum(values) / len(values), 1)
            history.append({"date": date_key, "label": label, "value": avg_val})

    vals = [h["value"] for h in history]
    avg = round(sum(vals) / len(vals), 1) if vals else 0
    mn_val, mx_val = (min(vals), max(vals)) if vals else (0, 0)
    trend = round(vals[-1] - vals[0], 1) if len(vals) >= 2 else 0

    meta = {
        "heart_rate": {"title": "Frequence cardiaque", "unit": "bpm", "graph_type": "ecg", "normal_min": 60, "normal_max": 80, "color": "#EF4444", "explain": "Le pouls au repos entre 60 et 80 bpm est sain."},
        "hrv": {"title": "Variabilite cardiaque", "unit": "ms", "graph_type": "scatter", "normal_min": 30, "normal_max": 60, "color": "#A78BFA", "explain": "Plus le HRV est eleve, meilleure est votre recuperation."},
        "spo2": {"title": "Saturation en oxygene", "unit": "%", "graph_type": "area_threshold", "normal_min": 95, "normal_max": 100, "color": "#38BDF8", "explain": "Au-dessus de 95% est normal."},
        "stress_level": {"title": "Niveau de stress", "unit": "/100", "graph_type": "area_gradient", "normal_min": 0, "normal_max": 40, "color": "#F59E0B", "explain": "En dessous de 40 indique un etat detendu."},
        "recovery_score": {"title": "Score de recuperation", "unit": "/100", "graph_type": "area_gradient", "normal_min": 70, "normal_max": 100, "color": "#10B981", "explain": "Au-dessus de 70 est favorable."},
        "steps": {"title": "Nombre de pas", "unit": "pas", "graph_type": "bars", "normal_min": 4000, "normal_max": 10000, "color": "#10B981", "explain": "6000 a 10000 pas par jour recommandes."},
        "calories": {"title": "Depense energetique", "unit": "kcal", "graph_type": "bars", "normal_min": 100, "normal_max": 400, "color": "#F59E0B", "explain": "Calories brulees par l'activite."},
        "weight": {"title": "Poids", "unit": "kg", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "A croiser avec la composition corporelle."},
        "body_fat_pct": {"title": "Pourcentage de graisse", "unit": "%", "graph_type": "smooth_curve", "color": "#F59E0B", "explain": "Normal : 15-25% homme, 20-30% femme."},
        "muscle_pct": {"title": "Masse musculaire", "unit": "%", "graph_type": "smooth_curve", "color": "#10B981", "explain": "Essentielle pour le metabolisme et la mobilite."},
        "water_pct": {"title": "Taux d'hydratation", "unit": "%", "graph_type": "bars_threshold", "normal_min": 50, "normal_max": 65, "color": "#38BDF8", "explain": "Normal entre 50 et 65%."},
        "sleep_quality": {"title": "Qualite du sommeil", "unit": "%", "graph_type": "area_gradient", "normal_min": 75, "normal_max": 100, "color": "#A78BFA", "explain": "Au-dessus de 80% est reparateur."},
        "temperature": {"title": "Temperature corporelle", "unit": "°C", "graph_type": "smooth_curve", "normal_min": 36.3, "normal_max": 37.5, "color": "#F59E0B", "explain": "Varie naturellement au cours de la journee."},
        "blood_pressure": {"title": "Pression arterielle", "unit": "mmHg", "graph_type": "bp_dual", "normal_min": 90, "normal_max": 140, "color": "#8B5CF6", "explain": "Normale autour de 120/80 mmHg."},
        "bmi": {"title": "Indice de masse corporelle", "unit": "", "graph_type": "smooth_curve", "color": "#38BDF8", "explain": "Normal entre 18.5 et 25."},
        "visceral_fat": {"title": "Graisse viscerale", "unit": "", "graph_type": "smooth_curve", "normal_min": 1, "normal_max": 10, "color": "#F97316", "explain": "Indice inferieur a 10 est sain."},
        "bone_mass_kg": {"title": "Masse osseuse", "unit": "kg", "graph_type": "smooth_curve", "normal_min": 2.5, "normal_max": 4, "color": "#A78BFA", "explain": "Important pour prevenir l'osteoporose."},
        "body_age": {"title": "Age corporel", "unit": "ans", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Age biologique estime."},
    }
    m = meta.get(key, {"title": key.replace("_", " ").title(), "unit": "", "graph_type": "smooth_curve", "color": "#A78BFA", "explain": "Donnee mesuree par les appareils."})

    return {
        "key": key, "meta": m, "history": history, "no_data": len(history) == 0,
        "stats": {"avg": avg, "min": mn_val, "max": mx_val, "trend": trend, "count": len(vals)},
        "readonly": True,
    }


@router.get("/guardian/beneficiary/{bid}/daily-report")
async def guardian_beneficiary_daily_report(bid: str, user=Depends(get_current_user)):
    """Return the same data structure as /health/daily-report but for a specific beneficiary (guardian access)."""
    ben = await _ensure_guardian_access_to_beneficiary(bid, user)
    from routes.health_report_routes import (
        compute_subscores, _sanitize_data, gen_ai, compute_daily_plan_async,
        estimate_vo2_max, evaluate_objectives_met, HUMAN_MAP_IMG,
    )
    from services.nora_context import build_nora_context

    uid = bid
    nora_ctx = await build_nora_context(ben)
    ben_first_name = (ben.get('name', '') or '').split(' ')[0] or 'le patient'

    has_any_readings = await db.device_readings.find_one({"user_id": uid}, {"_id": 0})
    if not has_any_readings:
        ai_no_data = await gen_ai({}, {"score": 0, "status": "Aucune donnee", "subscores": {"cardio": {"score": 0}, "sleep": {"score": 0}, "activity": {"score": 0}, "metabolism": {"score": 0}, "hydration": {"score": 0}}}, nora_ctx, guardian_view_name=ben_first_name)
        return {"no_data": True, "data": {}, "score_info": {"score": 0, "status": "Aucune donnee", "status_color": "#6B7280", "subscores": {}, "lifts": [], "limits": []},
                "ai": ai_no_data, "daily_plan": [], "sparklines": {}, "weighings": [], "readonly": True}

    bracelet_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)])
    scale_reading = await db.device_readings.find_one({"user_id": uid, "device_type": "scale"}, {"_id": 0}, sort=[("timestamp", -1)])

    d = {
        "heart_rate": 0, "heart_rate_prev": 0, "hrv": 0, "spo2": 0,
        "blood_pressure": {"systolic": 0, "diastolic": 0},
        "temperature": 0, "steps": 0, "calories": 0, "distance_km": 0,
        "sleep_quality": 0, "sleep_duration": 0, "sleep_deep_pct": 0, "sleep_rem_pct": 0,
        "sleep_duration_min": 0, "sleep_interruptions": 0,
        "stress_level": 0, "recovery_score": 0,
        "weight": 0, "bmi": 0, "body_fat_pct": 0, "muscle_pct": 0,
        "water_pct": 0, "visceral_fat": 0, "body_age": 0, "bone_mass_kg": 0,
    }
    if bracelet_reading and bracelet_reading.get("data"):
        rd = bracelet_reading["data"]
        for k in ["heart_rate", "spo2", "temperature", "steps", "calories", "distance_km", "hrv", "stress_level", "recovery_score", "sleep_quality", "sleep_duration", "sleep_duration_min", "sleep_deep_pct", "sleep_rem_pct", "deep_sleep_min", "light_sleep_min", "rem_sleep_min", "sleep_interruptions"]:
            if rd.get(k): d[k] = rd[k]
        if rd.get("blood_pressure"): d["blood_pressure"] = rd["blood_pressure"]

    if d.get("heart_rate") and d["heart_rate"] > 0:
        age = None
        dob = ben.get("date_of_birth", "")
        if dob:
            for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
                try:
                    born = datetime.strptime(dob, fmt)
                    age = (datetime.now(timezone.utc) - born.replace(tzinfo=timezone.utc)).days // 365
                    break
                except ValueError:
                    continue
        gender = ben.get("gender", "F")
        weight = d.get("weight", 0) or ben.get("weight_kg", 0) or 0
        seven_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent_steps = await db.device_readings.find(
            {"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_ago}}, {"_id": 0, "data.steps": 1}
        ).to_list(30)
        step_vals = [r.get("data", {}).get("steps", 0) for r in recent_steps if r.get("data", {}).get("steps", 0) > 0]
        avg_steps = sum(step_vals) / len(step_vals) if step_vals else d.get("steps", 0)
        if age and age > 0:
            d["vo2_max"] = estimate_vo2_max(age=age, resting_hr=d["heart_rate"], hrv=d.get("hrv", 0), steps_daily=avg_steps, gender=gender, weight_kg=weight)

    if scale_reading and scale_reading.get("data"):
        sd = scale_reading["data"]
        for k in ["weight", "bmi", "body_fat_pct", "muscle_pct", "water_pct", "visceral_fat", "body_age", "bone_mass_kg", "basal_metabolism", "protein_pct"]:
            if sd.get(k): d[k] = sd[k]

    d = _sanitize_data(d)
    si = compute_subscores(d)

    if si.get("no_data"):
        ai_no_data = await gen_ai(d, si, nora_ctx, guardian_view_name=ben_first_name)
        plan = await compute_daily_plan_async(d, si, uid)
        return {"no_data": True, "data": d, "score_info": si, "score": 0, "status": "Aucune donnee", "status_color": "#6B7280",
                "subscores": si.get("subscores", {}), "lifts": [], "limits": [],
                "ai": ai_no_data, "daily_plan": plan, "sparklines": {}, "weighings": [], "readonly": True}

    ben_first_name = (ben.get('name', '') or '').split(' ')[0] or 'le patient'

    ai = await gen_ai(d, si, nora_ctx, guardian_view_name=ben_first_name)
    plan = await compute_daily_plan_async(d, si, uid)

    sparks = {}
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    br_readings = await db.device_readings.find({"user_id": uid, "device_type": "bracelet", "timestamp": {"$gte": seven_days_ago}}, {"_id": 0}).sort("timestamp", 1).to_list(50)
    sc_readings = await db.device_readings.find({"user_id": uid, "device_type": "scale", "timestamp": {"$gte": seven_days_ago}}, {"_id": 0}).sort("timestamp", 1).to_list(50)
    for key in ["heart_rate", "spo2", "steps", "sleep_quality", "stress_level", "recovery_score", "hrv"]:
        vals = [r.get("data", {}).get(key, 0) for r in br_readings if r.get("data", {}).get(key)]
        sparks[key] = vals[-7:] if vals else []
    for key in ["weight", "body_fat_pct", "muscle_pct", "water_pct"]:
        vals = [r.get("data", {}).get(key, 0) for r in sc_readings if r.get("data", {}).get(key)]
        sparks[key] = vals[-7:] if vals else []

    weighings = []
    all_scale = await db.device_readings.find({"user_id": uid, "device_type": "scale"}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    for r in all_scale:
        sd = r.get("data", {})
        if sd.get("weight", 0) > 0:
            weighings.append({
                "id": r.get("id", ""), "date": r.get("timestamp", ""),
                "weight": sd.get("weight", 0), "bmi": sd.get("bmi", 0),
                "body_fat_pct": sd.get("body_fat_pct", 0), "muscle_pct": sd.get("muscle_pct", 0),
                "water_pct": sd.get("water_pct", 0), "bone_mass_kg": sd.get("bone_mass_kg", 0),
                "visceral_fat": sd.get("visceral_fat", 0), "body_age": sd.get("body_age", 0),
                "score": sd.get("health_score_balance", 0), "status": sd.get("health_evaluation", "--"),
            })

    body_age_data = None
    try:
        body_age_result = await db.body_age_cache.find_one({"user_id": uid}, {"_id": 0})
        if body_age_result and body_age_result.get("body_age"):
            body_age_data = body_age_result
            d["body_age"] = body_age_result["body_age"]
    except:
        pass

    analysis_phase = None
    distinct_days = set()
    all_user_readings = await db.device_readings.find({"user_id": uid}, {"_id": 0, "timestamp": 1}).to_list(500)
    for r in all_user_readings:
        ts = r.get("timestamp", "")
        if ts: distinct_days.add(ts[:10])
    days_count = len(distinct_days)
    if 0 < days_count < 7:
        messages = {1: "Debut de l'analyse", 2: "Collecte des premieres tendances", 3: "Ajustement du profil", 4: "Analyse des habitudes", 5: "Correlation des donnees", 6: "Finalisation du profil"}
        analysis_phase = {"day": days_count, "total": 7, "message": messages.get(days_count, "Analyse en cours"), "progress_pct": round((days_count / 7) * 100), "type": "body_age"}

    activity_streak = {"current_streak": 0, "max_streak": 0, "objectives_today": [], "badge": None}
    try:
        streak_doc = await db.activity_streaks.find_one({"user_id": uid}, {"_id": 0})
        if streak_doc:
            cs = streak_doc.get("current_streak", 0)
            badge = None
            if cs >= 100: badge = {"icon": "ri-vip-diamond-fill", "color": "#10B981", "label": "100 jours"}
            elif cs >= 30: badge = {"icon": "ri-medal-fill", "color": "#A78BFA", "label": "1 mois"}
            elif cs >= 14: badge = {"icon": "ri-fire-fill", "color": "#EF4444", "label": "2 semaines"}
            elif cs >= 7: badge = {"icon": "ri-fire-fill", "color": "#F59E0B", "label": "1 semaine"}
            activity_streak = {"current_streak": cs, "max_streak": streak_doc.get("max_streak", 0), "objectives_today": streak_doc.get("objectives_today", []), "badge": badge}
    except:
        pass

    return {
        "score": si["score"], "status": si["status"], "status_color": si["status_color"],
        "subscores": si["subscores"], "lifts": si["lifts"], "limits": si["limits"],
        "data": d, "ai": ai, "daily_plan": plan, "sparklines": sparks,
        "weighings": weighings, "human_map_img": HUMAN_MAP_IMG,
        "analysis_phase": analysis_phase, "body_age_nora": body_age_data,
        "activity_streak": activity_streak, "readonly": True,
        "beneficiary_name": ben.get("name", ""),
        "beneficiary_age": None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/guardian/beneficiary/{bid}/health-report")
async def guardian_health_report(bid: str, user=Depends(get_current_user)):
    ben = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiaire non trouve")
    readings = await db.device_readings.find({"user_id": bid}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    alerts = await db.alerts.find({"beneficiary_id": bid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    data_summary = ""
    for r in readings[:5]:
        data_summary += f"[{r.get('device_type', '')} {r.get('timestamp', '')}] "
        for k, v in r.get('data', {}).items():
            data_summary += f"{k}={v} "
        data_summary += "\n"
    alert_summary = "\n".join([f"- {a['alert_type']} ({a['severity']}): {a['message']} - {a['status']}" for a in alerts[:10]])
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"report-{uuid.uuid4().hex[:8]}",
                        system_message="Tu es un assistant medical IA. Genere des rapports de sante structures en francais."
                        ).with_model("openai", "gpt-5.2")
        prompt = f"Genere un rapport de sante pour {ben['name']}.\nDonnees: {data_summary}\nAlertes: {alert_summary}"
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"report": resp, "generated_at": datetime.now(timezone.utc).isoformat(), "beneficiary_name": ben['name']}
    except Exception as e:
        logger.error(f"AI report error: {e}")
        return {"report": f"Rapport IA indisponible: {str(e)}", "generated_at": datetime.now(timezone.utc).isoformat(), "beneficiary_name": ben['name']}


@router.post("/guardian/activate-intervention-provider")
async def activate_intervention_provider(data: InterventionProviderActivate, user=Depends(get_current_user)):
    code = await db.intervention_codes.find_one({"code": data.code.upper(), "active": True}, {"_id": 0})
    if not code:
        raise HTTPException(status_code=404, detail="Code invalide")
    await db.users.update_one({"id": user['id']}, {"$set": {
        "is_intervention_provider": True,
        "intervention_structure": code['structure_name'],
        "intervention_radius_km": code.get('default_radius_km', 30),
        "intervention_location": code.get('base_location', {"latitude": 48.8566, "longitude": 2.3522}),
    }})
    await db.intervention_codes.update_one({"code": data.code.upper()}, {"$inc": {"uses_count": 1}})
    return {"status": "activated", "structure": code['structure_name'], "radius_km": code.get('default_radius_km', 30)}


@router.get("/guardian/beneficiaries/map")
async def guardian_map(user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff not in ('guardian', 'professional'):
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    cu = await db.users.find_one({"id": user['id']}, {"_id": 0})
    result = []
    for bid in cu.get('beneficiaries', []):
        b = await db.users.find_one({"id": bid}, {"_id": 0, "password_hash": 0})
        if b:
            loc = await db.locations.find_one({"user_id": bid}, {"_id": 0})
            ac = await db.alerts.count_documents({"beneficiary_id": bid, "status": "active"})
            result.append({
                "id": b['id'], "name": b['name'], "active_alerts": ac,
                "location": loc,
            })
    return result


@router.get("/guardian/beneficiary/{bid}/geofence")
async def guardian_get_geofences(bid: str, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)
    zones = await db.geofences.find({"user_id": bid}, {"_id": 0}).to_list(100)
    location = await db.locations.find_one({"user_id": bid}, {"_id": 0})
    return {"beneficiary_id": bid, "zones": zones, "current_location": location}


@router.post("/guardian/beneficiary/{bid}/geofence")
async def guardian_create_geofence(bid: str, data: dict, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)

    name = (data.get("name") or "Zone de securite").strip()
    try:
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))
        radius_m = float(data.get("radius_m", 500) or 500)
    except Exception:
        raise HTTPException(status_code=400, detail="Coordonnees ou rayon invalides")

    zone = {
        "id": str(uuid.uuid4()),
        "user_id": bid,
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "radius_m": max(50, min(radius_m, 10000)),
        "active": bool(data.get("active", True)),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by_guardian_id": user['id'],
    }
    await db.geofences.insert_one(zone)
    return {k: v for k, v in zone.items() if k != "_id"}


@router.put("/guardian/beneficiary/{bid}/geofence/{gid}")
async def guardian_update_geofence(bid: str, gid: str, data: dict, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)
    existing = await db.geofences.find_one({"id": gid, "user_id": bid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Zone non trouvee")

    update = {"updated_at": datetime.now(timezone.utc).isoformat(), "updated_by_guardian_id": user['id']}
    if "name" in data and data.get("name"):
        update["name"] = str(data.get("name")).strip()

    if "latitude" in data:
        try:
            update["latitude"] = float(data.get("latitude"))
        except Exception:
            raise HTTPException(status_code=400, detail="Latitude invalide")
    if "longitude" in data:
        try:
            update["longitude"] = float(data.get("longitude"))
        except Exception:
            raise HTTPException(status_code=400, detail="Longitude invalide")
    if "radius_m" in data:
        try:
            update["radius_m"] = max(50, min(float(data.get("radius_m")), 10000))
        except Exception:
            raise HTTPException(status_code=400, detail="Rayon invalide")
    if "active" in data:
        update["active"] = bool(data.get("active"))

    await db.geofences.update_one({"id": gid, "user_id": bid}, {"$set": update})
    updated = await db.geofences.find_one({"id": gid, "user_id": bid}, {"_id": 0})
    return updated


@router.put("/guardian/beneficiary/{bid}/geofence/{gid}/toggle")
async def guardian_toggle_geofence(bid: str, gid: str, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)
    zone = await db.geofences.find_one({"id": gid, "user_id": bid}, {"_id": 0})
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvee")
    new_active = not zone.get("active", True)
    await db.geofences.update_one(
        {"id": gid, "user_id": bid},
        {"$set": {"active": new_active, "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by_guardian_id": user['id']}}
    )
    return {"status": "toggled", "active": new_active}


@router.delete("/guardian/beneficiary/{bid}/geofence/{gid}")
async def guardian_delete_geofence(bid: str, gid: str, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)
    await db.geofences.delete_one({"id": gid, "user_id": bid})
    return {"status": "deleted"}


@router.post("/guardian/beneficiary/{bid}/geofence/check")
async def guardian_check_geofence(bid: str, user=Depends(get_current_user)):
    await _ensure_guardian_access_to_beneficiary(bid, user)
    location = await db.locations.find_one({"user_id": bid}, {"_id": 0})
    if not location:
        return {"status": "no_location", "beneficiary_id": bid, "in_zone": False, "violations": [], "total_fences": 0}

    fences = await db.geofences.find({"user_id": bid, "active": True}, {"_id": 0}).to_list(100)
    violations = []
    for fence in fences:
        dist = _distance_m(location['latitude'], location['longitude'], fence['latitude'], fence['longitude'])
        if dist > fence['radius_m']:
            violations.append({
                "zone_id": fence['id'],
                "zone_name": fence['name'],
                "distance_m": round(dist),
                "radius_m": fence['radius_m'],
            })

    return {
        "status": "checked",
        "beneficiary_id": bid,
        "in_zone": len(violations) == 0,
        "violations": violations,
        "total_fences": len(fences),
        "location": {"latitude": location.get("latitude"), "longitude": location.get("longitude"), "updated_at": location.get("updated_at")},
    }


@router.delete("/guardian/beneficiary/{bid}/unlink")
async def unlink_beneficiary_from_guardian(bid: str, user=Depends(get_current_user)):
    """Guardian removes a beneficiary from their list"""
    if bid not in user.get('beneficiaries', []):
        raise HTTPException(status_code=403, detail="Ce beneficiaire n'est pas dans votre liste")
    await db.users.update_one({"id": user['id']}, {"$pull": {"beneficiaries": bid}})
    await db.users.update_one({"id": bid}, {"$pull": {"guardians": user['id'], "guardian_order": user['id']}})
    return {"status": "unlinked", "message": "Beneficiaire retire de votre liste"}


@router.delete("/beneficiary/guardian/{gid}/remove")
async def remove_guardian_from_beneficiary(gid: str, user=Depends(get_current_user)):
    """Beneficiary removes a guardian from their list"""
    if gid not in user.get('guardians', []):
        raise HTTPException(status_code=403, detail="Ce gardien n'est pas dans votre liste")
    await db.users.update_one({"id": user['id']}, {"$pull": {"guardians": gid, "guardian_order": gid}})
    await db.users.update_one({"id": gid}, {"$pull": {"beneficiaries": user['id']}})
    return {"status": "removed", "message": "Gardien retire de votre liste"}


# ─── Guardian Permissions System ───

DEFAULT_ALERT_TYPES = {
    "fall": True, "heart_rate": True, "inactivity": True, "sos_manual": True,
    "temperature": True, "spo2": True, "blood_pressure": True, "weight": True, "pulse": True,
}
DEFAULT_HEALTH_DATA_TYPES = {
    "heart_rate": True, "blood_pressure": True, "sleep": True,
    "activity": True, "weight": True, "temperature": True, "spo2": True,
}

async def _get_or_create_permissions(guardian_id: str, beneficiary_id: str) -> dict:
    doc = await db.guardian_permissions.find_one(
        {"guardian_id": guardian_id, "beneficiary_id": beneficiary_id}, {"_id": 0}
    )
    if doc:
        return doc
    doc = {
        "guardian_id": guardian_id, "beneficiary_id": beneficiary_id,
        "alerts_enabled": True, "alert_types": {**DEFAULT_ALERT_TYPES},
        "health_data_enabled": True, "health_data_types": {**DEFAULT_HEALTH_DATA_TYPES},
        "location_mode": "alert_only",
        "guardian_alerts_enabled": True, "guardian_alert_types": {**DEFAULT_ALERT_TYPES},
        "guardian_health_enabled": True,
        "guardian_location_accepted": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.guardian_permissions.insert_one({**doc})
    return doc


@router.get("/guardian-permissions/{guardian_id}/{beneficiary_id}")
async def get_guardian_permissions(guardian_id: str, beneficiary_id: str, user=Depends(get_current_user)):
    uid = user['id']
    if uid != guardian_id and uid != beneficiary_id:
        raise HTTPException(status_code=403, detail="Non autorise")
    perms = await _get_or_create_permissions(guardian_id, beneficiary_id)
    return perms


@router.put("/guardian-permissions/{guardian_id}/{beneficiary_id}/beneficiary")
async def update_beneficiary_permissions(guardian_id: str, beneficiary_id: str, data: dict, user=Depends(get_current_user)):
    if user['id'] != beneficiary_id:
        raise HTTPException(status_code=403, detail="Seul le beneficiaire peut modifier ces autorisations")
    await _get_or_create_permissions(guardian_id, beneficiary_id)
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for key in ["alerts_enabled", "alert_types", "health_data_enabled", "health_data_types", "location_mode"]:
        if key in data:
            update[key] = data[key]
    await db.guardian_permissions.update_one(
        {"guardian_id": guardian_id, "beneficiary_id": beneficiary_id}, {"$set": update}
    )
    return await db.guardian_permissions.find_one(
        {"guardian_id": guardian_id, "beneficiary_id": beneficiary_id}, {"_id": 0}
    )


@router.put("/guardian-permissions/{guardian_id}/{beneficiary_id}/guardian")
async def update_guardian_preferences(guardian_id: str, beneficiary_id: str, data: dict, user=Depends(get_current_user)):
    if user['id'] != guardian_id:
        raise HTTPException(status_code=403, detail="Seul le gardien peut modifier ses preferences")
    await _get_or_create_permissions(guardian_id, beneficiary_id)
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for key in ["guardian_alerts_enabled", "guardian_alert_types", "guardian_health_enabled", "guardian_location_accepted"]:
        if key in data:
            update[key] = data[key]
    await db.guardian_permissions.update_one(
        {"guardian_id": guardian_id, "beneficiary_id": beneficiary_id}, {"$set": update}
    )
    return await db.guardian_permissions.find_one(
        {"guardian_id": guardian_id, "beneficiary_id": beneficiary_id}, {"_id": 0}
    )
