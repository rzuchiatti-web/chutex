"""Batch endpoint to reduce frontend API calls."""
from fastapi import APIRouter, Depends
from auth import get_current_user, get_effective_role
from database import db
from datetime import datetime, timezone
import asyncio

router = APIRouter()


@router.get("/dashboard/batch")
async def dashboard_batch(user=Depends(get_current_user)):
    """Returns core dashboard data in a single call (simple DB queries only)."""
    uid = user["id"]
    phone = user.get("phone", "")
    eff = get_effective_role(user)

    async def get_dash():
        devices = await db.devices.find({"user_id": uid}, {"_id": 0}).to_list(20)
        connected = [d for d in devices if d.get("connected")]
        return {"devices": devices, "connected_count": len(connected), "total_count": len(devices)}

    async def get_rem():
        own = await db.reminders.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(50)
        # Also fetch pro-assigned reminders for this beneficiary
        pro_rems = await db.pro_assigned_reminders.find(
            {"beneficiary_id": uid, "status": "active"}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        # Day name mapping: full -> short (for beneficiary dashboard compatibility)
        day_map = {"lundi": "lun", "mardi": "mar", "mercredi": "mer", "jeudi": "jeu", "vendredi": "ven", "samedi": "sam", "dimanche": "dim"}
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        # Get today's short day name
        day_names_fr = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]
        today_day = day_names_fr[datetime.now(timezone.utc).weekday()]
        for pr in pro_rems:
            short_days = [day_map.get(d, d) for d in pr.get("days", [])]
            # Only include reminders scheduled for today
            if short_days and today_day not in short_days:
                continue
            # Resolve professional name if not stored
            pro_name = pr.get("professional_name", "")
            if not pro_name and pr.get("professional_id"):
                pro_user = await db.users.find_one({"id": pr["professional_id"]}, {"_id": 0, "name": 1})
                pro_name = pro_user.get("name", "") if pro_user else ""
            short_days = [day_map.get(d, d) for d in pr.get("days", [])]
            own.append({
                "id": pr["id"],
                "user_id": uid,
                "reminder_type": pr.get("reminder_type", "medication"),
                "title": pr.get("title", ""),
                "time": pr.get("time", "08:00"),
                "days": short_days,
                "dosage": pr.get("dosage", ""),
                "notes": pr.get("notes", ""),
                "image": pr.get("image", ""),
                "active": True,
                "completed": any(
                    c.get("date", "").startswith(today_str) and c.get("status") == "done"
                    for c in pr.get("completions", [])
                ),
                "source": "pro",
                "professional_id": pr.get("professional_id", ""),
                "professional_name": pro_name,
                "created_at": pr.get("created_at", ""),
            })
        return own

    async def get_guards():
        """Resolve guardian data from user collection like /api/guardians/my."""
        cu = await db.users.find_one({"id": uid}, {"_id": 0, "guardians": 1, "guardian_order": 1})
        if not cu:
            return []
        guardian_order = cu.get('guardian_order', cu.get('guardians', []))
        guardians = []
        seen = set()
        for gid in list(guardian_order) + cu.get('guardians', []):
            if gid in seen:
                continue
            seen.add(gid)
            g = await db.users.find_one({"id": gid}, {"_id": 0})
            if g:
                rel_doc = await db.guardian_relationships.find_one(
                    {"guardian_id": gid, "beneficiary_id": uid}, {"_id": 0}
                )
                rel = rel_doc.get('relationship', '') if rel_doc else g.get('relationship', '')
                guardians.append({
                    "id": g['id'], "name": g.get('name', ''), "phone": g.get('phone', ''),
                    "avatar_url": g.get('avatar_url', ''),
                    "guardian_type": g.get('guardian_type', ''), "relationship": rel,
                })
        return guardians

    async def get_greqs():
        return await db.guardian_requests.find({"beneficiary_id": uid, "status": "pending"}, {"_id": 0}).to_list(20)

    async def get_sub():
        sub = await db.subscriptions.find_one({"beneficiary_id": uid, "status": "active"}, {"_id": 0})
        if not sub:
            sub = await db.subscriptions.find_one({"beneficiary_phone": phone, "status": "active"}, {"_id": 0})
        return {"has_subscription": sub is not None, "subscription": sub, "subscription_type": sub.get("subscription_type") if sub else None}

    async def get_scale():
        return await db.device_readings.find(
            {"user_id": uid, "device_type": "scale"}, {"_id": 0}
        ).sort("timestamp", -1).to_list(20)

    async def get_alerts():
        if eff == "beneficiary":
            return await db.alerts.find({"beneficiary_id": uid, "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(10)
        return []

    async def get_health_summary():
        latest = await db.device_readings.find_one(
            {"user_id": uid, "device_type": "bracelet"}, {"_id": 0}, sort=[("timestamp", -1)]
        )
        if not latest:
            return None
        d = latest.get("data", {})
        return {
            "heart_rate": d.get("heart_rate", 0),
            "spo2": d.get("spo2", 0),
            "systolic": d.get("systolic", 0),
            "diastolic": d.get("diastolic", 0),
            "temperature": d.get("temperature", 0),
            "steps": d.get("steps", 0),
            "calories": d.get("calories", 0),
            "distance_km": d.get("distance_km", 0),
            "sleep_quality": d.get("sleep_quality", 0),
            "date": latest.get("timestamp", ""),
            "source": "simulated",
        }

    results = await asyncio.gather(
        get_dash(), get_rem(), get_guards(), get_greqs(),
        get_sub(), get_scale(), get_alerts(), get_health_summary(),
        return_exceptions=True,
    )

    def safe(r, default=None):
        return default if isinstance(r, Exception) else r

    return {
        "dashboard_summary": safe(results[0]),
        "reminders": safe(results[1], []),
        "guardians": safe(results[2], []),
        "guardian_requests": safe(results[3], []),
        "subscription": safe(results[4], {"has_subscription": False}),
        "scale_history": safe(results[5], []),
        "active_alerts": safe(results[6], []),
        "health_summary": safe(results[7]),
    }
