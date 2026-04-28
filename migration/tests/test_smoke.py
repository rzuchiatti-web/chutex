"""Test rapide de l'API (auth + plusieurs endpoints critiques)."""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/chutex_test")
os.environ.setdefault("JWT_SECRET", "test-secret-key")

from fastapi.testclient import TestClient

from api.main import app

c = TestClient(app)

# Healthcheck
assert c.get("/api/health").json() == {"status": "ok"}, "health KO"

# Plans (no auth)
r = c.get("/api/plans")
assert r.status_code == 200 and len(r.json()) == 4, f"plans KO: {r.status_code}"

# Inscription
import uuid as _uuid
phone = "0612345" + str(_uuid.uuid4().int)[:3]
email = f"test+{_uuid.uuid4().hex[:6]}@chutex.fr"
r = c.post("/api/auth/register", json={
    "email": email, "password": "Test1234", "name": "Test User",
    "phone": phone, "role": "beneficiary",
})
assert r.status_code == 200, f"register KO: {r.status_code} {r.text}"
token = r.json()["token"]
user = r.json()["user"]
print(f"✅ Register: user_id={user['id'][:8]}…, role={user['role']}")

H = {"Authorization": f"Bearer {token}"}

# /auth/me
r = c.get("/api/auth/me", headers=H)
assert r.status_code == 200, f"me KO: {r.text}"

# Login
r = c.post("/api/auth/login", json={"email": email, "password": "Test1234"})
assert r.status_code == 200, f"login KO: {r.text}"
print(f"✅ Login: ok")

# Notifications
r = c.get("/api/notifications", headers=H)
assert r.status_code == 200, r.text
print(f"✅ Notifications list: {len(r.json())}")

# Push register
r = c.post("/api/push/register", json={"push_token": "ExpoPushToken[xxx]"}, headers=H)
assert r.status_code == 200, r.text
r = c.get("/api/push/preferences", headers=H)
assert r.status_code == 200, r.text
print(f"✅ Push: registered + preferences")

# Health vitals
r = c.post("/api/health/vitals", json={
    "heart_rate": 75, "spo2": 98, "steps": 5000, "calories": 250,
}, headers=H)
assert r.status_code == 200, r.text
r = c.get("/api/health/vitals/latest", headers=H)
assert r.status_code == 200 and r.json().get("heart_rate") == 75
print(f"✅ Vitals: pushed + latest=75")

# Threshold
r = c.post("/api/health/thresholds", json={
    "metric_id": "heart_rate", "min_val": 50, "max_val": 100, "goal": 70,
}, headers=H)
assert r.status_code == 200, r.text
r = c.get("/api/health/thresholds", headers=H)
assert r.status_code == 200 and len(r.json()) == 1
print(f"✅ Thresholds: set + listed")

# Alert create
r = c.post("/api/alerts", json={"alert_type": "sos", "message": "Test SOS"}, headers=H)
assert r.status_code == 200, r.text
alert_id = r.json()["id"]
r = c.get("/api/alerts", headers=H)
assert r.status_code == 200 and len(r.json()) >= 1
r = c.get(f"/api/alerts/{alert_id}/live-status", headers=H)
assert r.status_code == 200, r.text
print(f"✅ Alerts: created+listed+live-status")

# Reminder
r = c.post("/api/reminders", json={"label": "Vitamine D", "time": "08:00", "type": "medication"}, headers=H)
assert r.status_code == 200, r.text
rid = r.json()["id"]
r = c.get("/api/reminders", headers=H)
assert r.status_code == 200 and len(r.json()) == 1
r = c.delete(f"/api/reminders/{rid}", headers=H)
assert r.status_code == 200
print(f"✅ Reminders: CRUD")

# Geofence
r = c.post("/api/geofences", json={
    "name": "Maison", "latitude": 48.85, "longitude": 2.35, "radius_m": 200,
}, headers=H)
assert r.status_code == 200, r.text
r = c.get("/api/geofences", headers=H)
assert len(r.json()) == 1
print(f"✅ Geofences: CRUD")

# Devices (associate + sync)
# Need active subscription for bracelet — skip and test scale
r = c.post("/api/devices/associate", json={"device_type": "scale"}, headers=H)
assert r.status_code == 200, r.text
r = c.post("/api/devices/sync", json={
    "device_type": "scale",
    "data": {"weight": 70.5, "bmi": 22.5, "battery": 85},
}, headers=H)
assert r.status_code == 200, r.text
r = c.get("/api/devices", headers=H)
assert r.status_code == 200 and len(r.json()) == 1
print(f"✅ Devices: associate+sync+list")

# Programs
r = c.get("/api/programs/catalog")
assert r.status_code == 200, r.text
print(f"✅ Programs catalog: {len(r.json())}")

# Pro applications
r = c.post("/api/pro-applications", json={
    "type": "coach", "first_name": "John", "last_name": "Doe",
    "phone": "+33611111111", "email": "john@doe.fr",
})
assert r.status_code == 200
print(f"✅ Pro applications: ok")

# Contact
r = c.post("/api/contact", json={"message": "Bonjour", "email": "x@x.fr"})
assert r.status_code == 200
print(f"✅ Contact: ok")

# Static endpoints
for path in [
    "/api/teleassistance/protocol/beneficiary",
    "/api/teleassistance/protocol/guardian",
    "/api/intervention/close-qcm",
    "/api/bracelet/v6/config",
    "/api/bracelet/v8/config",
]:
    r = c.get(path, headers=H)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
print(f"✅ Static endpoints OK")

print("\n🎉 TOUS LES TESTS PASSENT")
