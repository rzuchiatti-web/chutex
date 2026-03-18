from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_user, get_effective_role
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Live Activity stages in order
STAGES = [
    {"key": "alert_triggered", "label": "Alerte declenchee", "icon": "ri-alarm-warning-line"},
    {"key": "notifying_guardians", "label": "Notification des gardiens", "icon": "ri-notification-3-line"},
    {"key": "ai_calling", "label": "Appel IA en cours", "icon": "ri-phone-line"},
    {"key": "guardian_responding", "label": "Gardien contacte", "icon": "ri-user-heart-line"},
    {"key": "intervention_active", "label": "Intervention en cours", "icon": "ri-run-line"},
    {"key": "resolved", "label": "Alerte resolue", "icon": "ri-check-double-line"},
]

STAGE_KEYS = [s["key"] for s in STAGES]


async def create_live_status(alert_id: str, beneficiary_id: str, beneficiary_name: str, alert_type: str):
    """Create initial live status when an alert is triggered."""
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "alert_id": alert_id,
        "beneficiary_id": beneficiary_id,
        "beneficiary_name": beneficiary_name,
        "alert_type": alert_type,
        "current_stage": "alert_triggered",
        "stages_completed": ["alert_triggered"],
        "timeline": [{"stage": "alert_triggered", "timestamp": now, "detail": "Alerte declenchee"}],
        "eta_minutes": None,
        "intervenant_name": None,
        "intervenant_phone": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.alert_live_status.update_one(
        {"alert_id": alert_id}, {"$set": doc}, upsert=True
    )
    return doc


async def advance_live_status(alert_id: str, stage: str, detail: str = None, extra: dict = None):
    """Advance the live status to a new stage."""
    if stage not in STAGE_KEYS:
        return
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "current_stage": stage,
        "updated_at": now,
    }
    if extra:
        update.update(extra)
    timeline_entry = {"stage": stage, "timestamp": now, "detail": detail or stage}
    await db.alert_live_status.update_one(
        {"alert_id": alert_id},
        {
            "$set": update,
            "$addToSet": {"stages_completed": stage},
            "$push": {"timeline": timeline_entry},
        },
    )


async def complete_live_status(alert_id: str):
    """Mark live status as resolved."""
    await advance_live_status(alert_id, "resolved", "Alerte resolue")


@router.get("/alerts/{alert_id}/live-status")
async def get_live_status(alert_id: str, user=Depends(get_current_user)):
    """Get the live activity status for an alert."""
    doc = await db.alert_live_status.find_one({"alert_id": alert_id}, {"_id": 0})
    if not doc:
        alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
        if not alert:
            raise HTTPException(404, "Alerte non trouvee")
        return {
            "alert_id": alert_id,
            "beneficiary_name": alert.get("beneficiary_name", ""),
            "alert_type": alert.get("alert_type", "sos"),
            "current_stage": "resolved" if alert.get("status") == "resolved" else "alert_triggered",
            "stages_completed": ["alert_triggered"] + (["resolved"] if alert.get("status") == "resolved" else []),
            "timeline": [],
            "eta_minutes": None,
            "intervenant_name": None,
            "intervenant_phone": None,
            "stages_definition": STAGES,
        }
    doc["stages_definition"] = STAGES
    return doc


@router.get("/alerts/live-active")
async def get_all_live_statuses(user=Depends(get_current_user)):
    """Get all active live statuses for the current guardian's beneficiaries."""
    eff = get_effective_role(user)
    if eff == "guardian":
        bids = user.get("beneficiaries", []) + [user["id"]]
        statuses = await db.alert_live_status.find(
            {"beneficiary_id": {"$in": bids}, "current_stage": {"$ne": "resolved"}},
            {"_id": 0},
        ).sort("created_at", -1).to_list(10)
    elif eff in ("admin", "teleassistance"):
        statuses = await db.alert_live_status.find(
            {"current_stage": {"$ne": "resolved"}}, {"_id": 0}
        ).sort("created_at", -1).to_list(20)
    else:
        statuses = await db.alert_live_status.find(
            {"beneficiary_id": user["id"], "current_stage": {"$ne": "resolved"}},
            {"_id": 0},
        ).sort("created_at", -1).to_list(5)

    for s in statuses:
        s["stages_definition"] = STAGES
    return statuses
