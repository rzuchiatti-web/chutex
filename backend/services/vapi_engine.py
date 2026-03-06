"""
CARE WATCH - Vapi.ai Voice Orchestration Engine
Replaces Twilio+ElevenLabs with Vapi for low-latency AI voice calls
"""
import os
import uuid
import asyncio
import logging
import httpx
import re
from datetime import datetime, timezone
from database import db

logger = logging.getLogger(__name__)

VAPI_API_KEY = os.environ.get("VAPI_API_KEY", "")
VAPI_PATIENT_ASSISTANT_ID = os.environ.get("VAPI_PATIENT_ASSISTANT_ID", "")
VAPI_GUARDIAN_ASSISTANT_ID = os.environ.get("VAPI_GUARDIAN_ASSISTANT_ID", "")
VAPI_PHONE_NUMBER_ID = os.environ.get("VAPI_PHONE_NUMBER_ID", "")
VAPI_BASE = "https://api.vapi.ai"


def _now():
    return datetime.now(timezone.utc).isoformat()


def _norm_phone(p: str) -> str:
    cleaned = re.sub(r'[\s\-\.\(\)]', '', (p or '').strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    if not cleaned.startswith('+'):
        cleaned = '+33' + cleaned
    return cleaned


async def _log_event(incident_id: str, state: str, detail: str):
    event = {"timestamp": _now(), "state": state, "detail": detail}
    await db.incidents.update_one(
        {"id": incident_id},
        {"$push": {"timeline": event}, "$set": {"state": state, "updated_at": _now()}}
    )
    logger.info(f"[VAPI] {incident_id[:8]}: {state} - {detail}")


async def _vapi_call(phone: str, assistant_id: str, variable_values: dict = None) -> dict:
    """Make an outbound call via Vapi API"""
    if not VAPI_API_KEY or not VAPI_PHONE_NUMBER_ID:
        return {"success": False, "error": "Vapi not configured"}

    payload = {
        "assistantId": assistant_id,
        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
        "customer": {"number": phone},
    }
    if variable_values:
        payload["assistantOverrides"] = {"variableValues": variable_values}

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{VAPI_BASE}/call",
            headers={"Authorization": f"Bearer {VAPI_API_KEY}", "Content-Type": "application/json"},
            json=payload,
        )
    if r.status_code in (200, 201):
        data = r.json()
        return {"success": True, "call_id": data.get("id"), "status": data.get("status")}
    return {"success": False, "error": f"HTTP {r.status_code}: {r.text[:200]}"}


async def _wait_for_vapi_call_end(call_id: str, timeout: int = 120) -> dict:
    """Poll Vapi until the call ends, then return analysis"""
    for _ in range(timeout // 3):
        await asyncio.sleep(3)
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{VAPI_BASE}/call/{call_id}",
                headers={"Authorization": f"Bearer {VAPI_API_KEY}"},
            )
        if r.status_code == 200:
            data = r.json()
            status = data.get("status", "")
            if status == "ended":
                return {
                    "ended": True,
                    "duration": data.get("duration"),
                    "ended_reason": data.get("endedReason"),
                    "summary": data.get("analysis", {}).get("summary", ""),
                    "structured_data": data.get("analysis", {}).get("structuredData", {}),
                    "transcript": data.get("transcript", ""),
                    "recording_url": data.get("recordingUrl"),
                }
    return {"ended": False, "error": "timeout"}


async def vapi_orchestrate(alert: dict):
    """
    CARE WATCH Vapi orchestration — replaces Twilio+ElevenLabs engine.
    Machine a etats: NEW_ALERT → CALLING_PATIENT → CALLING_GUARDIANS → DISPATCH
    """
    try:
        await asyncio.sleep(2)

        ben = await db.users.find_one({"id": alert['beneficiary_id']}, {"_id": 0})
        if not ben:
            logger.error(f"Beneficiary not found: {alert['beneficiary_id']}")
            return

        prenom = ben.get('name', '').split(' ')[0]
        phone = _norm_phone(ben.get('phone', ''))

        # Get guardians
        guardians = []
        for gid in ben.get('guardian_order', ben.get('guardians', [])):
            g = await db.users.find_one({"id": gid}, {"_id": 0, "password_hash": 0})
            if g:
                guardians.append({"id": g['id'], "name": g['name'], "phone": g.get('phone', ''), "prenom": g['name'].split(' ')[0]})

        # Create incident
        incident = {
            "id": str(uuid.uuid4()),
            "alert_id": alert['id'],
            "alert_type": alert.get('alert_type', 'sos'),
            "beneficiary_id": ben['id'],
            "beneficiary_name": ben['name'],
            "beneficiary_phone": phone,
            "state": "NEW_ALERT",
            "guardians": guardians,
            "guardians_contacted": [],
            "assigned_guardian": None,
            "calls": [],
            "timeline": [{"timestamp": _now(), "state": "NEW_ALERT", "detail": f"Alerte {alert.get('alert_type')} pour {ben['name']}"}],
            "engine": "vapi",
            "created_at": _now(),
            "updated_at": _now(),
            "resolved_at": None,
        }
        await db.incidents.insert_one(incident)
        iid = incident["id"]

        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "CALLING_PATIENT", "incident_id": iid}})

        # ─── STEP 1: CALL PATIENT VIA VAPI ───
        await _log_event(iid, "CALLING_PATIENT", f"Appel Vapi du beneficiaire {ben['name']} ({phone})")

        if not phone or len(phone) < 10:
            await _log_event(iid, "PATIENT_NO_RESPONSE", "Numero invalide")
        else:
            result = await _vapi_call(phone, VAPI_PATIENT_ASSISTANT_ID, {"patientName": prenom})

            if result["success"]:
                call_id = result["call_id"]
                await db.incidents.update_one({"id": iid}, {"$push": {"calls": {"type": "patient", "call_id": call_id, "phone": phone, "timestamp": _now()}}})
                await _log_event(iid, "CALLING_PATIENT", f"Appel Vapi en cours (ID: {call_id[:12]}...)")

                call_result = await _wait_for_vapi_call_end(call_id, timeout=120)

                if call_result.get("ended"):
                    sd = call_result.get("structured_data", {})
                    summary = call_result.get("summary", "")

                    await db.incidents.update_one({"id": iid}, {"$push": {"transcriptions": {
                        "type": "patient", "summary": summary, "structured_data": sd,
                        "recording_url": call_result.get("recording_url"), "timestamp": _now()
                    }}})

                    # Save call report to alert
                    report = {
                        "call_summary": summary,
                        "patient_ok": sd.get("patient_ok", False),
                        "needs_help": sd.get("needs_help", False),
                        "medical_issue": sd.get("medical_issue", ""),
                        "urgency_level": sd.get("urgency_level", "none"),
                        "requested_contact": sd.get("requested_contact", ""),
                        "recording_url": call_result.get("recording_url"),
                    }
                    await db.alerts.update_one({"id": alert['id']}, {"$set": {"call_report": report}})

                    if sd.get("patient_ok") and not sd.get("needs_help"):
                        await _log_event(iid, "PATIENT_CONFIRMED_OK", f"Patient confirme aller bien: {summary}")
                        await _resolve_incident(iid, alert['id'], "PATIENT_CONFIRMED_OK", summary)
                        return

                    # Check if patient requested a specific guardian
                    requested = sd.get("requested_contact", "").lower().strip()
                    if requested and guardians:
                        # Reorder guardians to call the requested one first
                        for idx, g in enumerate(guardians):
                            g_name = g.get("name", "").lower()
                            g_relation = g.get("relation", "").lower()
                            if requested in g_name or requested in g_relation or \
                               (requested in ("ma fille", "fille") and g_relation in ("fille", "daughter")) or \
                               (requested in ("mon fils", "fils") and g_relation in ("fils", "son")):
                                # Move to front
                                guardians.insert(0, guardians.pop(idx))
                                await _log_event(iid, "PATIENT_REQUESTED_CONTACT", f"Patient demande d'appeler: {g['name']} ({requested})")
                                break

                    await _log_event(iid, "PATIENT_NEEDS_HELP", f"Patient a besoin d'aide: {summary}")
                else:
                    await _log_event(iid, "PATIENT_NO_RESPONSE", f"Appel termine sans reponse exploitable")
            else:
                await _log_event(iid, "PATIENT_NO_RESPONSE", f"Erreur Vapi: {result.get('error', 'inconnu')}")

        # ─── STEP 2: CALL GUARDIANS IN CASCADE ───
        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "CALLING_GUARDIANS"}})

        guardian_accepted = False
        for idx, guardian in enumerate(guardians):
            # Check if resolved externally
            inc_check = await db.incidents.find_one({"id": iid}, {"_id": 0, "state": 1})
            if inc_check and inc_check.get("state") in ("RESOLVED", "GUARDIAN_INTERVENTION_ACCEPTED"):
                return

            g_phone = _norm_phone(guardian.get('phone', ''))
            if not g_phone or len(g_phone) < 10:
                await _log_event(iid, f"CALLING_GUARDIAN_{idx+1}", f"Gardien {guardian['name']}: numero invalide")
                continue

            await _log_event(iid, f"CALLING_GUARDIAN_{idx+1}", f"Appel Vapi du gardien {guardian['name']} ({g_phone})")
            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": f"CALLING_GUARDIAN_{idx+1}"}})

            g_result = await _vapi_call(g_phone, VAPI_GUARDIAN_ASSISTANT_ID, {"patientName": prenom, "guardianName": guardian['prenom']})

            if g_result["success"]:
                g_call_id = g_result["call_id"]
                await db.incidents.update_one({"id": iid}, {"$push": {"calls": {"type": "guardian", "guardian_id": guardian['id'], "call_id": g_call_id, "phone": g_phone, "timestamp": _now()}}})

                g_call_result = await _wait_for_vapi_call_end(g_call_id, timeout=90)

                await db.incidents.update_one({"id": iid}, {"$push": {"guardians_contacted": {
                    "id": guardian['id'], "name": guardian['name'],
                    "answered": g_call_result.get("ended", False), "timestamp": _now(),
                }}})

                if g_call_result.get("ended"):
                    g_sd = g_call_result.get("structured_data", {})
                    g_summary = g_call_result.get("summary", "")

                    await db.incidents.update_one({"id": iid}, {"$push": {"transcriptions": {
                        "type": "guardian", "guardian_name": guardian['name'],
                        "summary": g_summary, "structured_data": g_sd, "timestamp": _now()
                    }}})

                    if g_sd.get("will_intervene"):
                        await _log_event(iid, "GUARDIAN_INTERVENTION_ACCEPTED", f"Gardien {guardian['name']} accepte d'intervenir: {g_summary}")
                        await db.incidents.update_one({"id": iid}, {"$set": {"assigned_guardian": guardian}})
                        await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "GUARDIAN_INTERVENTION_ACCEPTED"}})
                        guardian_accepted = True
                        break
                    else:
                        await _log_event(iid, "GUARDIAN_UNREACHABLE", f"Gardien {guardian['name']}: ne peut pas intervenir")
                else:
                    await _log_event(iid, "GUARDIAN_UNREACHABLE", f"Gardien {guardian['name']}: pas de reponse")
            else:
                await _log_event(iid, "GUARDIAN_UNREACHABLE", f"Gardien {guardian['name']}: erreur appel")

        # ─── STEP 3: DISPATCH TO NEAREST SAAD AGENCY ───
        if not guardian_accepted:
            await _log_event(iid, "SEARCHING_SAAD", "Recherche de l'agence SAAD la plus proche")
            await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "SEARCHING_SAAD"}})

            # Find nearest agency based on alert geolocation
            alert_loc = alert.get('location', {})
            alert_lat = alert_loc.get('latitude')
            alert_lng = alert_loc.get('longitude')

            assigned_agency = None
            if alert_lat and alert_lng:
                import math
                def haversine(lat1, lon1, lat2, lon2):
                    R = 6371
                    dlat = math.radians(lat2 - lat1)
                    dlon = math.radians(lon2 - lon1)
                    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
                    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

                # Get ALL agencies with geolocation
                agencies = await db.agencies.find(
                    {"latitude": {"$ne": None}, "longitude": {"$ne": None}},
                    {"_id": 0}
                ).to_list(100)

                # Sort by distance, filter by radius
                candidates = []
                for ag in agencies:
                    dist = haversine(alert_lat, alert_lng, ag['latitude'], ag['longitude'])
                    radius = ag.get('radius_km', 30)
                    if dist <= radius:
                        candidates.append((dist, ag))

                candidates.sort(key=lambda x: x[0])

                if candidates:
                    dist_km, nearest = candidates[0]
                    assigned_agency = nearest
                    await _log_event(iid, "SAAD_FOUND",
                        f"Agence {nearest['name']} trouvee a {dist_km:.1f}km (rayon {nearest.get('radius_km', 30)}km)")
                else:
                    # Log all distances for debugging
                    if agencies:
                        dists = [(haversine(alert_lat, alert_lng, a['latitude'], a['longitude']), a['name'], a.get('radius_km', 30)) for a in agencies]
                        dists.sort()
                        detail = "; ".join(f"{n}: {d:.1f}km (rayon {r}km)" for d, n, r in dists[:5])
                        await _log_event(iid, "NO_SAAD_IN_RANGE", f"Aucune agence dans le rayon. Distances: {detail}")
                    else:
                        await _log_event(iid, "NO_SAAD_AVAILABLE", "Aucune agence SAAD configuree avec geolocalisation")
            else:
                await _log_event(iid, "NO_ALERT_LOCATION", "Impossible de localiser l'alerte - pas de geolocalisation")

            # Create intervention mission
            if assigned_agency:
                iv_id = str(uuid.uuid4())
                intervention = {
                    "id": iv_id,
                    "alert_id": alert['id'],
                    "incident_id": iid,
                    "beneficiary_id": alert['beneficiary_id'],
                    "beneficiary_name": alert.get('beneficiary_name', ''),
                    "agency_id": assigned_agency.get('id', ''),
                    "agency_name": assigned_agency['name'],
                    "company_id": assigned_agency.get('company_id', ''),
                    "status": "pending_acceptance",
                    "intervener_type": "saad",
                    "created_at": _now(),
                    "location": alert_loc,
                    "distance_km": round(candidates[0][0], 1) if candidates else None,
                }
                await db.interventions.insert_one(intervention)

                await db.incidents.update_one({"id": iid}, {"$set": {
                    "care_provider": assigned_agency['name'],
                    "intervention_id": iv_id,
                    "assigned_agency": assigned_agency,
                }})

                await _log_event(iid, "CARE_DISPATCHED",
                    f"Mission d'intervention creee pour l'agence {assigned_agency['name']} (a {candidates[0][0]:.1f}km)")
                await db.alerts.update_one({"id": alert['id']}, {"$set": {
                    "teleassistance_status": "CARE_DISPATCHED",
                    "assigned_agency": assigned_agency['name'],
                    "intervention_id": iv_id,
                }})

                # Notify SAAD company via push/SMS
                company = await db.users.find_one({"id": assigned_agency.get('company_id')}, {"_id": 0, "phone": 1, "name": 1})
                if company and company.get('phone'):
                    from services.smsmode_service import send_sms
                    ben_name = alert.get('beneficiary_name', 'Un beneficiaire')
                    asyncio.create_task(send_sms(
                        company['phone'],
                        f"CHUTEX CARE - Mission d'intervention: {ben_name} a {candidates[0][0]:.0f}km de {assigned_agency['name']}. Ouvrez l'app pour details."
                    ))
            else:
                await _log_event(iid, "CARE_DISPATCHED", "Aucune agence SAAD disponible dans le rayon d'intervention")
                await db.alerts.update_one({"id": alert['id']}, {"$set": {"teleassistance_status": "CARE_DISPATCHED_NO_AGENCY"}})

    except Exception as e:
        logger.error(f"Vapi orchestration error: {e}", exc_info=True)


async def _resolve_incident(iid: str, alert_id: str, resolution: str, detail: str):
    now = _now()
    await db.incidents.update_one({"id": iid}, {"$set": {"state": "RESOLVED", "resolved_at": now, "resolution": resolution}})
    await db.alerts.update_one({"id": alert_id}, {"$set": {"teleassistance_status": "RESOLVED"}})
    await _log_event(iid, "RESOLVED", detail)
