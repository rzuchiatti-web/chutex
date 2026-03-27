"""WebSocket connection managers for real-time notifications."""
import logging
import json
from fastapi import WebSocket
from typing import Dict, List

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


class BeneficiaryWSManager:
    """Manages WebSocket connections for beneficiary users (multi-connection per user)."""

    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: str):
        await ws.accept()
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(ws)
        logger.info(f"Beneficiary WS connected: {user_id} (connections: {len(self.active[user_id])})")

    def disconnect(self, ws: WebSocket, user_id: str):
        if user_id in self.active:
            self.active[user_id] = [w for w in self.active[user_id] if w is not ws]
            if not self.active[user_id]:
                del self.active[user_id]
        logger.info(f"Beneficiary WS disconnected: {user_id}")

    async def send_to_user(self, user_id: str, payload: dict):
        """Send a notification to a specific beneficiary."""
        connections = self.active.get(user_id, [])
        if not connections:
            return
        text = json.dumps(payload)
        dead = []
        for ws in connections:
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if user_id in self.active:
                self.active[user_id] = [w for w in self.active[user_id] if w is not ws]


admin_ws = AdminWSManager()
beneficiary_ws = BeneficiaryWSManager()
