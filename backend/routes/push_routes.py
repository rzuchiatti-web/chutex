from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_user
from datetime import datetime, timezone
import httpx, logging

router = APIRouter()
logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# ─── Register Push Token ───
@router.post("/push/register")
async def register_push_token(body: dict, user=Depends(get_current_user)):
    token = body.get("push_token")
    if not token:
        raise HTTPException(400, "push_token required")
    
    await db.push_tokens.update_one(
        {"user_id": user["id"]},
        {"$set": {"user_id": user["id"], "push_token": token, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "registered"}

# ─── Unregister Push Token ───
@router.post("/push/unregister")
async def unregister_push_token(user=Depends(get_current_user)):
    await db.push_tokens.delete_many({"user_id": user["id"]})
    return {"status": "unregistered"}

# ─── Get Push Preferences ───
@router.get("/push/preferences")
async def get_push_preferences(user=Depends(get_current_user)):
    prefs = await db.push_preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    if not prefs:
        prefs = {
            "user_id": user["id"],
            "sos_alerts": True,
            "health_thresholds": True,
            "fall_detection": True,
            "low_battery": True,
            "reminders_hydration": True,
            "reminders_medication": True,
            "reminders_alarm": True,
            "interventions": True,
            "guardian_requests": True,
        }
        await db.push_preferences.insert_one({**prefs})
        prefs.pop("_id", None)
    return prefs

# ─── Update Push Preferences ───
@router.put("/push/preferences")
async def update_push_preferences(body: dict, user=Depends(get_current_user)):
    allowed_keys = ["sos_alerts", "health_thresholds", "fall_detection", "low_battery",
                    "reminders_hydration", "reminders_medication", "reminders_alarm",
                    "interventions", "guardian_requests"]
    update = {k: v for k, v in body.items() if k in allowed_keys}
    await db.push_preferences.update_one(
        {"user_id": user["id"]},
        {"$set": {**update, "user_id": user["id"]}},
        upsert=True
    )
    return {"status": "updated"}

# ─── Send Push Notification (Internal Helper) ───
async def send_push_to_user(user_id: str, title: str, body: str, data: dict = None, category: str = "general"):
    """Send push notification to a user. Check preferences before calling."""
    token_doc = db.push_tokens.find_one({"user_id": user_id}, {"_id": 0})
    if not token_doc or not token_doc.get("push_token"):
        return False
    
    push_token = token_doc["push_token"]
    message = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "categoryIdentifier": category,
    }
    if data:
        message["data"] = data
    
    # Badge for critical alerts
    if category in ["sos", "fall", "intervention"]:
        message["badge"] = 1
        message["sound"] = "default"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(EXPO_PUSH_URL, json=message, headers={"Accept": "application/json", "Content-Type": "application/json"})
            result = resp.json()
            logger.info(f"Push sent to {user_id}: {result}")
            
            # Log notification
            db.push_log.insert_one({
                "user_id": user_id, "title": title, "body": body,
                "category": category, "sent_at": datetime.now(timezone.utc).isoformat(),
                "success": resp.status_code == 200
            })
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Push error for {user_id}: {e}")
        return False

async def send_push_to_users(user_ids: list, title: str, body: str, data: dict = None, category: str = "general", pref_key: str = None):
    """Send push notification to multiple users, respecting preferences."""
    for uid in user_ids:
        if pref_key:
            prefs = db.push_preferences.find_one({"user_id": uid}, {"_id": 0})
            if prefs and not prefs.get(pref_key, True):
                continue
        await send_push_to_user(uid, title, body, data, category)

# ─── Notify: SOS Alert ───
async def notify_sos_alert(beneficiary_name: str, alert_id: str, guardian_ids: list):
    await send_push_to_users(
        guardian_ids,
        "SOS - URGENCE",
        f"{beneficiary_name} a declenche une alerte SOS ! Ouvrez l'app pour voir les details.",
        {"type": "sos", "alert_id": alert_id},
        "sos",
        "sos_alerts"
    )

# ─── Notify: Health Threshold ───
async def notify_health_threshold(beneficiary_name: str, metric: str, value: float, guardian_ids: list):
    metric_labels = {"heart_rate": "Rythme cardiaque", "spo2": "SpO2", "temperature": "Temperature", "blood_pressure": "Tension"}
    label = metric_labels.get(metric, metric)
    await send_push_to_users(
        guardian_ids,
        f"Seuil de sante depasse",
        f"{beneficiary_name} : {label} anormal ({value}). Consultez l'app.",
        {"type": "health_threshold", "metric": metric},
        "health",
        "health_thresholds"
    )

# ─── Notify: Fall Detection ───
async def notify_fall_detected(beneficiary_name: str, alert_id: str, guardian_ids: list):
    await send_push_to_users(
        guardian_ids,
        "Chute detectee !",
        f"Une chute a ete detectee pour {beneficiary_name}. Le protocole CARE WATCH est active.",
        {"type": "fall", "alert_id": alert_id},
        "fall",
        "fall_detection"
    )

# ─── Notify: Low Battery ───
async def notify_low_battery(beneficiary_id: str, device_type: str, battery_level: int):
    device_labels = {"bracelet": "Bracelet Elio", "vest": "Gilet Anti-Chute", "scale": "Balance"}
    label = device_labels.get(device_type, device_type)
    await send_push_to_user(
        beneficiary_id,
        f"{label} - Batterie faible",
        f"Votre {label} n'a plus que {battery_level}% de batterie. Pensez a le recharger.",
        {"type": "low_battery", "device_type": device_type},
        "battery"
    )

# ─── Notify: Intervention Dispatched ───
async def notify_intervention_dispatched(intervenant_ids: list, beneficiary_name: str, intervention_id: str, distance_km: float = None):
    dist_text = f" ({distance_km}km)" if distance_km else ""
    await send_push_to_users(
        intervenant_ids,
        "Mission d'intervention",
        f"{beneficiary_name} a besoin d'aide{dist_text}. Acceptez la mission dans l'app.",
        {"type": "intervention", "intervention_id": intervention_id},
        "intervention",
        "interventions"
    )

# ─── Notify: Guardian Request ───
async def notify_guardian_request(beneficiary_id: str, guardian_name: str):
    await send_push_to_user(
        beneficiary_id,
        "Demande de gardien",
        f"{guardian_name} souhaite devenir votre gardien. Ouvrez l'app pour accepter ou refuser.",
        {"type": "guardian_request"},
        "guardian_request"
    )

# ─── Test Endpoint ───
@router.post("/push/test")
async def test_push(user=Depends(get_current_user)):
    await send_push_to_user(
        user["id"],
        "Test Notification CHUTEX",
        "Si vous voyez ceci, les notifications fonctionnent !",
        {"type": "test"},
        "test"
    )
    return {"status": "sent"}

# ─── Push History ───
@router.get("/push/history")
async def push_history(user=Depends(get_current_user)):
    logs = await db.push_log.find({"user_id": user["id"]}, {"_id": 0}).sort("sent_at", -1).to_list(20)
    return logs
