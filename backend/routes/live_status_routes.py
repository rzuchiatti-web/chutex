from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import get_current_user, get_effective_role
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two GPS points."""
    R = 6371.0
    la1, lo1, la2, lo2 = radians(lat1), radians(lng1), radians(lat2), radians(lng2)
    dlat, dlon = la2 - la1, lo2 - lo1
    a = sin(dlat / 2) ** 2 + cos(la1) * cos(la2) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def estimate_eta(distance_km: float) -> dict:
    """Estimate arrival time based on distance. Returns dict with minutes and distance_km."""
    if distance_km < 0.5:
        minutes = max(1, round(distance_km * 4))  # walking ~15km/h
    elif distance_km < 5:
        minutes = max(2, round(distance_km * 3))  # urban driving ~20km/h avg
    else:
        minutes = max(5, round(distance_km * 1.5))  # ~40km/h avg
    return {"eta_minutes": minutes, "distance_km": round(distance_km, 2)}

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
    # Get beneficiary location
    loc = await db.locations.find_one({"user_id": beneficiary_id}, {"_id": 0})
    ben_location = None
    if loc and loc.get("latitude") and loc.get("longitude"):
        ben_location = {"lat": loc["latitude"], "lng": loc["longitude"]}
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
        "beneficiary_location": ben_location,
        "intervenant_location": None,
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
        # Enrich with latest tracking positions + ETA
        try:
            ben_loc = None
            iv_loc = None
            ben_tracking = await db.alert_tracking.find_one({"alert_id": s["alert_id"]}, {"_id": 0})
            if ben_tracking and ben_tracking.get("positions"):
                last_pos = ben_tracking["positions"][-1]
                if last_pos.get("latitude") and last_pos.get("longitude"):
                    ben_loc = {"lat": last_pos["latitude"], "lng": last_pos["longitude"]}
                    s["beneficiary_location"] = ben_loc
            iv = await db.interventions.find_one({"alert_id": s["alert_id"]}, {"_id": 0, "id": 1})
            if iv:
                iv_tracking = await db.intervention_tracking.find_one({"intervention_id": iv["id"]}, {"_id": 0})
                if iv_tracking and iv_tracking.get("positions"):
                    last_iv = iv_tracking["positions"][-1]
                    if last_iv.get("latitude") and last_iv.get("longitude"):
                        iv_loc = {"lat": last_iv["latitude"], "lng": last_iv["longitude"]}
                        s["intervenant_location"] = iv_loc
            # Calculate ETA if both locations exist
            if ben_loc and iv_loc:
                dist = haversine_km(ben_loc["lat"], ben_loc["lng"], iv_loc["lat"], iv_loc["lng"])
                eta_data = estimate_eta(dist)
                s["eta_minutes"] = eta_data["eta_minutes"]
                s["distance_km"] = eta_data["distance_km"]
        except Exception:
            pass
    return statuses
