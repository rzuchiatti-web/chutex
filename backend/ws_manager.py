"""WebSocket connection manager for real-time admin alerts."""
import logging
import json
from fastapi import WebSocket
from typing import Dict

logger = logging.getLogger(__name__)


class AdminWSManager:
    """Manages WebSocket connections for admin users."""

    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        self.active[user_id] = ws
        logger.info(f"Admin WS connected: {user_id} (total: {len(self.active)})")

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)
        logger.info(f"Admin WS disconnected: {user_id} (total: {len(self.active)})")

    async def broadcast_alert(self, alert: dict):
        """Send a new alert to all connected admin WebSocket clients."""
        if not self.active:
            return
        payload = json.dumps({
            "type": "new_alert",
            "alert": {
                "id": alert.get("id"),
                "alert_type": alert.get("alert_type", "sos"),
                "beneficiary_name": alert.get("beneficiary_name", "Inconnu"),
                "message": alert.get("message", ""),
                "status": alert.get("status", "active"),
                "severity": alert.get("severity", "critical"),
                "created_at": alert.get("created_at", ""),
            },
        })
        dead = []
        for uid, ws in self.active.items():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.active.pop(uid, None)


admin_ws = AdminWSManager()
