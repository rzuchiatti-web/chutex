"""Smoke test E2E contre l'API qui tourne sur 127.0.0.1:8765."""
from __future__ import annotations

import uuid

import httpx

BASE = "http://127.0.0.1:8765"


def main() -> None:
    c = httpx.Client(base_url=BASE, timeout=10)
    assert c.get("/api/health").json() == {"status": "ok"}

    # Plans
    r = c.get("/api/plans")
    assert r.status_code == 200 and len(r.json()) == 4
    print("✅ /api/plans OK")

    # Register
    phone = f"+3361234{uuid.uuid4().int % 1000000:06d}"
    email = f"smoke+{uuid.uuid4().hex[:8]}@chutex.fr"
    r = c.post("/api/auth/register", json={
        "email": email, "password": "Test1234", "name": "Smoke",
        "phone": phone, "role": "beneficiary",
    })
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    H = {"Authorization": f"Bearer {token}"}
    print(f"✅ /api/auth/register OK ({email})")

    # /auth/me
    assert c.get("/api/auth/me", headers=H).status_code == 200

    # Login
    r = c.post("/api/auth/login", json={"email": email, "password": "Test1234"})
    assert r.status_code == 200
    print("✅ /api/auth/login OK")

    # Notifications
    assert c.get("/api/notifications", headers=H).status_code == 200
    assert c.get("/api/notifications/unread-count", headers=H).status_code == 200

    # Push
    r = c.post("/api/push/register", json={"push_token": "ExpoPushToken[xxx]"}, headers=H)
    assert r.status_code == 200
    assert c.get("/api/push/preferences", headers=H).status_code == 200
    print("✅ Push CRUD OK")

    # Vitals
    r = c.post("/api/health/vitals", json={"heart_rate": 75, "spo2": 98}, headers=H)
    assert r.status_code == 200
    r = c.get("/api/health/vitals/latest", headers=H)
    assert r.status_code == 200 and r.json().get("heart_rate") == 75
    print("✅ Health vitals OK")

    # Thresholds
    r = c.post("/api/health/thresholds", json={
        "metric_id": "heart_rate", "min_val": 50, "max_val": 100, "goal": 70,
    }, headers=H)
    assert r.status_code == 200
    print("✅ Thresholds OK")

    # Alerts
    r = c.post("/api/alerts", json={"alert_type": "sos", "message": "Test"}, headers=H)
    assert r.status_code == 200
    aid = r.json()["id"]
    assert c.get(f"/api/alerts/{aid}/live-status", headers=H).status_code == 200
    print("✅ Alerts + live-status OK")

    # Reminders
    r = c.post("/api/reminders", json={"label": "Test", "time": "08:00"}, headers=H)
    assert r.status_code == 200
    print("✅ Reminders OK")

    # Geofences
    r = c.post("/api/geofences", json={
        "name": "Maison", "latitude": 48.85, "longitude": 2.35, "radius_m": 200,
    }, headers=H)
    assert r.status_code == 200
    print("✅ Geofences OK")

    # Devices (scale)
    r = c.post("/api/devices/associate", json={"device_type": "scale"}, headers=H)
    assert r.status_code == 200
    r = c.post("/api/devices/sync", json={
        "device_type": "scale", "data": {"weight": 70, "battery": 85}
    }, headers=H)
    assert r.status_code == 200
    print("✅ Devices sync OK")

    # Programs catalog
    assert c.get("/api/programs/catalog").status_code == 200

    # Static
    for p in [
        "/api/teleassistance/protocol/beneficiary",
        "/api/intervention/close-qcm",
        "/api/bracelet/v6/config",
    ]:
        assert c.get(p, headers=H).status_code == 200
    print("✅ Static endpoints OK")

    # Pro
    assert c.get("/api/pro/conversations", headers=H).status_code == 200
    assert c.get("/api/pro/exercises", headers=H).status_code == 200
    print("✅ Pro routes OK")

    # Subscriptions
    r = c.get("/api/subscriptions/my", headers=H)
    assert r.status_code == 200 and r.json()["has_subscription"] is False
    print("✅ Subscriptions OK")

    print("\n🎉 ALL SMOKE TESTS PASSED")


if __name__ == "__main__":
    main()
