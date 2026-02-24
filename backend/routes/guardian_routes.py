from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import uuid, random, logging

from database import db, EMERGENT_LLM_KEY, twilio_client, TWILIO_NUMBER
from auth import get_current_user, sanitize_user, get_effective_role
from models import (
    LinkBeneficiaryRequest, PrescriptionCreate, ActivatePrescriberRequest,
    InterventionProviderActivate,
)
from utils import send_email
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/guardian/link")
async def link_beneficiary(data: LinkBeneficiaryRequest, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff != 'guardian':
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
    if eff != 'guardian':
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
                "address": g.get('address', ''), "profession": g.get('profession', ''), "structure_name": g.get('structure_name', ''),
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
                    body=f"{ben_name} souhaite vous ajouter comme gardien sur Chutex, l'application de teleassistance. Inscrivez-vous sur https://nora-ai-coach.preview.emergentagent.com pour veiller sur votre proche.",
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
    if not user.get('saad_company_id'):
        return None
    company = await db.users.find_one(
        {"id": user['saad_company_id']}, {"_id": 0, "password_hash": 0}
    )
    link = await db.saad_guardian_links.find_one(
        {"guardian_id": user['id'], "status": "accepted"}, {"_id": 0}
    )
    if not company:
        return None
    return {
        "company_id": user['saad_company_id'],
        "company_name": user.get('saad_company_name', company.get('structure_name', company.get('name', ''))),
        "company_address": company.get('address', ''),
        "company_siret": company.get('siret', ''),
        "link_id": link['id'] if link else None,
        "linked_since": link['created_at'] if link else None,
        # Space activation status (True = active, False = deactivated by SAAD)
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
    if eff != 'guardian':
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    if not user.get('is_prescriber'):
        raise HTTPException(status_code=403, detail="Mode prescripteur non active.")
    now = datetime.now(timezone.utc).isoformat()
    structure = user.get('prescriber_structure', 'Chutex')
    commission = 15.0 if data.subscription_type == "standard" else 25.0
    next_month = (datetime.now(timezone.utc).replace(day=1) + timedelta(days=32)).replace(day=1)
    p = {
        "id": str(uuid.uuid4()), "guardian_id": user['id'], "guardian_name": user['name'],
        "prescriber_structure": structure,
        "beneficiary_name": data.beneficiary_name, "beneficiary_email": data.beneficiary_email,
        "beneficiary_phone": data.beneficiary_phone, "subscription_type": data.subscription_type,
        "notes": data.notes, "status": "pending", "beneficiary_id": None, "subscribed_at": None,
        "commission": commission, "commission_payment_date": next_month.isoformat(),
        "tracking_phone": data.beneficiary_phone, "tracking_email": data.beneficiary_email,
        "created_at": now, "notification_sent": True, "notification_type": "email",
        "email_content": {
            "to": data.beneficiary_email,
            "subject": f"{structure} vous invite a souscrire a Chutex",
            "body": f"Bonjour {data.beneficiary_name},\n\nL'entreprise {structure} vous invite a souscrire.\n\nPrescrit par : {user['name']} ({structure})",
            "sent_at": now,
        },
    }
    await db.prescriptions.insert_one(p)
    await send_email(data.beneficiary_email, f"{structure} vous invite a souscrire a Chutex", f"<h2>Bonjour {data.beneficiary_name}</h2><p>L'entreprise {structure} vous invite.</p>")
    return {k: v for k, v in p.items() if k != '_id'}


@router.get("/guardian/prescriptions")
async def get_prescriptions(user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff != 'guardian':
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    return await db.prescriptions.find({"guardian_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.post("/guardian/activate-prescriber")
async def activate_prescriber(data: ActivatePrescriberRequest, user=Depends(get_current_user)):
    eff = get_effective_role(user)
    if eff != 'guardian':
        raise HTTPException(status_code=403, detail="Reserve aux gardiens")
    code = await db.activation_codes.find_one({"code": data.code, "active": True}, {"_id": 0})
    if not code:
        raise HTTPException(status_code=404, detail="Code invalide ou expire")
    if code.get('uses_count', 0) >= code.get('max_uses', 50):
        raise HTTPException(status_code=400, detail="Code epuise")
    await db.users.update_one({"id": user['id']}, {"$set": {"is_prescriber": True, "prescriber_structure": code['structure_name'], "prescriber_code_used": data.code}})
    await db.activation_codes.update_one({"code": data.code}, {"$inc": {"uses_count": 1}})
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
    """Get latest AI health report for a beneficiary"""
    report = await db.health_reports.find_one(
        {"user_id": bid}, {"_id": 0}
    )
    if report:
        return {"recommendation": report.get('report', ''), "generated_at": report.get('generated_at', '')}
    # Try to get from beneficiary's AI recommendations
    rec = await db.ai_recommendations.find_one(
        {"user_id": bid}, {"_id": 0}
    )
    if rec:
        return {"recommendation": rec.get('recommendation', ''), "generated_at": rec.get('created_at', '')}
    return None


@router.get("/guardian/beneficiary/{bid}/devices")
async def guardian_beneficiary_devices(bid: str, user=Depends(get_current_user)):
    """Get device status for a beneficiary"""
    bracelet = await db.bracelet_status.find_one({"user_id": bid}, {"_id": 0})
    vest = await db.vest_status.find_one({"user_id": bid}, {"_id": 0})
    # Also try device_readings for latest data
    latest = await db.device_readings.find_one(
        {"user_id": bid}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if bracelet is None and latest:
        d = latest.get('data', {})
        bracelet = {
            "connected": True,
            "heart_rate": d.get('heart_rate', 0),
            "spo2": d.get('spo2', 0),
            "steps": d.get('steps', 0),
            "battery_level": d.get('battery_level', None),
            "last_sync": latest.get('timestamp', ''),
        }
    return {"bracelet": bracelet, "vest": vest}


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
    if eff != 'guardian':
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
                "location": loc if loc else {"latitude": 48.8566 + random.uniform(-0.05, 0.05), "longitude": 2.3522 + random.uniform(-0.05, 0.05), "updated_at": datetime.now(timezone.utc).isoformat()},
            })
    return result


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
