from fastapi import APIRouter, Depends
from datetime import datetime, timezone
import uuid

from database import db
from auth import get_current_user

router = APIRouter()


@router.get("/notifications")
async def list_notifications(user=Depends(get_current_user)):
    """List notifications for the current user (most recent first)."""
    notifs = await db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifs


@router.get("/notifications/unread-count")
async def unread_count(user=Depends(get_current_user)):
    """Count unread notifications."""
    count = await db.notifications.count_documents(
        {"user_id": user["id"], "read": False}
    )
    return {"count": count}


@router.put("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user=Depends(get_current_user)):
    """Mark a single notification as read."""
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}


@router.put("/notifications/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    """Mark all notifications as read."""
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}


async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    icon: str = "ri-notification-3-line",
    color: str = "#3B82F6",
    data: dict | None = None,
):
    """Create a notification, store it in DB, and push via WebSocket + browser."""
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "body": body,
        "icon": icon,
        "color": color,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(notif)
    notif.pop("_id", None)

    # Send via WebSocket
    from ws_manager import beneficiary_ws
    await beneficiary_ws.send_to_user(user_id, {
        "type": "notification",
        "notification": notif,
    })

    # Send browser push via web-push if user has a subscription
    await _send_web_push(user_id, title, body, icon)

    return notif


async def _send_web_push(user_id: str, title: str, body: str, icon: str):
    """Send Web Push notification to all subscriptions for a user."""
    subs = await db.push_subscriptions.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(10)
    if not subs:
        return
    try:
        from pywebpush import webpush, WebPushException
        import json, os
        vapid_private = os.environ.get("VAPID_PRIVATE_KEY", "")
        vapid_email = os.environ.get("VAPID_EMAIL", "mailto:contact@chutex-innovation.com")
        if not vapid_private:
            return
        payload = json.dumps({"title": title, "body": body, "icon": icon})
        dead = []
        for sub in subs:
            try:
                webpush(
                    subscription_info=sub["subscription"],
                    data=payload,
                    vapid_private_key=vapid_private,
                    vapid_claims={"sub": vapid_email},
                )
            except WebPushException:
                dead.append(sub["id"])
            except Exception:
                pass
        if dead:
            await db.push_subscriptions.delete_many({"id": {"$in": dead}})
    except ImportError:
        pass


@router.post("/notifications/subscribe-push")
async def subscribe_push(data: dict, user=Depends(get_current_user)):
    """Store a Web Push subscription for browser notifications."""
    subscription = data.get("subscription")
    if not subscription:
        return {"status": "error", "message": "subscription required"}
    # Upsert by endpoint
    endpoint = subscription.get("endpoint", "")
    existing = await db.push_subscriptions.find_one(
        {"user_id": user["id"], "subscription.endpoint": endpoint}
    )
    if existing:
        return {"status": "already_subscribed"}
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subscription": subscription,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.push_subscriptions.insert_one(doc)
    return {"status": "subscribed"}
