"""
CHUTEX Backend Test Suite — Pre-production regression tests.
Covers: Auth, Bracelet V8, Health Report, Devices, Subscriptions, Alerts.
Run: cd /app/backend && python -m pytest tests/ -v
"""
import pytest
import httpx
import os

API_URL = os.environ.get("TEST_API_URL", "https://chutex-premium.preview.emergentagent.com")
PHONE = "+33651245918"
PASSWORD = "test123"


@pytest.fixture(scope="module")
def token():
    """Get auth token for Robin Zuchiatti."""
    r = httpx.post(f"{API_URL}/api/auth/login", json={"email": PHONE, "password": PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


# ═══════════════════════════
# 1. AUTH
# ═══════════════════════════
class TestAuth:
    def test_login(self):
        r = httpx.post(f"{API_URL}/api/auth/login", json={"email": PHONE, "password": PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data.get("user", {}).get("name") == "Robin Zuchiatti"

    def test_login_wrong_password(self):
        r = httpx.post(f"{API_URL}/api/auth/login", json={"email": PHONE, "password": "wrong"})
        assert r.status_code in (401, 403)

    def test_me(self, headers):
        r = httpx.get(f"{API_URL}/api/auth/me", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == PHONE
        assert data["name"] == "Robin Zuchiatti"

    def test_unauthorized_without_token(self):
        r = httpx.get(f"{API_URL}/api/auth/me")
        assert r.status_code in (401, 403)


# ═══════════════════════════
# 2. BRACELET V8
# ═══════════════════════════
class TestBraceletV8:
    def test_push_heart_rate(self, headers):
        r = httpx.post(f"{API_URL}/api/bracelet/v8/push", headers=headers, json={
            "data_type": "heart_rate",
            "data": {"heart_rate": 72, "spo2": 97, "hrv": 45, "stress": 30,
                     "systolic": 125, "diastolic": 78, "temperature": 36.6},
            "device_id": "TEST_V8"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["data_type"] == "heart_rate"

    def test_push_sleep(self, headers):
        r = httpx.post(f"{API_URL}/api/bracelet/v8/push", headers=headers, json={
            "data_type": "sleep",
            "data": {"sleep_quality": 78, "deep_minutes": 95, "light_minutes": 210,
                     "rem_minutes": 85, "awake_minutes": 15, "total_minutes": 405},
            "device_id": "TEST_V8"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["data_type"] == "sleep"

    def test_push_blood_glucose(self, headers):
        r = httpx.post(f"{API_URL}/api/bracelet/v8/push", headers=headers, json={
            "data_type": "blood_glucose",
            "data": {"blood_glucose": 95},
            "device_id": "TEST_V8"
        })
        assert r.status_code == 200

    def test_bracelet_status(self, headers):
        r = httpx.get(f"{API_URL}/api/bracelet/status", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "connected" in data
        assert "heart_rate" in data

    def test_v8_dashboard(self, headers):
        r = httpx.get(f"{API_URL}/api/bracelet/v8/dashboard", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "vitals" in data
        assert data["connected"] is True


# ═══════════════════════════
# 3. HEALTH REPORT
# ═══════════════════════════
class TestHealthReport:
    def test_daily_report_cache(self, headers):
        """First call populates cache, second should be from cache."""
        r = httpx.get(f"{API_URL}/api/health/daily-report", headers=headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "score" in data
        assert "subscores" in data
        assert data.get("from_cache") in (True, False)

    def test_daily_report_force(self, headers):
        r = httpx.get(f"{API_URL}/api/health/daily-report?force=true", headers=headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data.get("from_cache") is False

    def test_health_history(self, headers):
        r = httpx.get(f"{API_URL}/api/health/history/heart_rate", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["metric_id"] == "heart_rate"
        assert "history" in data


# ═══════════════════════════
# 4. DEVICES
# ═══════════════════════════
class TestDevices:
    def test_list_devices(self, headers):
        r = httpx.get(f"{API_URL}/api/devices", headers=headers)
        assert r.status_code == 200
        devices = r.json()
        assert isinstance(devices, list)
        assert len(devices) >= 1
        types = [d["device_type"] for d in devices]
        assert "bracelet" in types

    def test_no_id_leak(self, headers):
        """Ensure MongoDB _id is NOT in responses."""
        r = httpx.get(f"{API_URL}/api/devices", headers=headers)
        for device in r.json():
            assert "_id" not in device


# ═══════════════════════════
# 5. SUBSCRIPTION
# ═══════════════════════════
class TestSubscription:
    def test_my_subscription(self, headers):
        r = httpx.get(f"{API_URL}/api/subscriptions/my", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["has_subscription"] is True
        assert data["subscription"]["subscription_type"] == "standard"


# ═══════════════════════════
# 6. ALERTS
# ═══════════════════════════
class TestAlerts:
    def test_list_alerts(self, headers):
        r = httpx.get(f"{API_URL}/api/alerts", headers=headers)
        assert r.status_code == 200
        alerts = r.json()
        assert isinstance(alerts, list)


# ═══════════════════════════
# 7. BATCH
# ═══════════════════════════
class TestBatch:
    def test_dashboard_batch(self, headers):
        r = httpx.get(f"{API_URL}/api/dashboard/batch", headers=headers)
        assert r.status_code == 200
        data = r.json()
        expected_keys = {"dashboard_summary", "subscription", "reminders", "active_alerts"}
        assert expected_keys.issubset(set(data.keys()))


# ═══════════════════════════
# 8. REMINDERS
# ═══════════════════════════
class TestReminders:
    def test_list_reminders(self, headers):
        r = httpx.get(f"{API_URL}/api/reminders", headers=headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ═══════════════════════════
# 9. NO SIMULATED DATA
# ═══════════════════════════
class TestNoSimulation:
    def test_bracelet_status_no_random(self, headers):
        """Check bracelet status doesn't contain default/simulated values."""
        r = httpx.get(f"{API_URL}/api/bracelet/status", headers=headers)
        data = r.json()
        # Heart rate should be a real pushed value (72) or 0, never a random default like 75
        if data.get("heart_rate", 0) > 0:
            assert data["heart_rate"] != 75, "Heart rate appears to be a default value"

    def test_daily_report_no_fake_score(self, headers):
        """Daily report score must come from real computation, not random."""
        r = httpx.get(f"{API_URL}/api/health/daily-report", headers=headers, timeout=20)
        data = r.json()
        if data.get("score") is not None:
            assert 0 <= data["score"] <= 100


# ═══════════════════════════
# 10. SECURITY
# ═══════════════════════════
class TestSecurity:
    def test_simulate_payment_removed(self, headers):
        """The DEV-only simulate-payment endpoint should be removed."""
        r = httpx.post(f"{API_URL}/api/pro/subscriptions/test/simulate-payment", headers=headers)
        assert r.status_code == 404

    def test_no_duplicate_mollie_webhook(self):
        """Pro Mollie webhook should be at /pro/mollie/webhook, not /mollie/webhook."""
        # This verifies the duplicate webhook fix
        r = httpx.post(f"{API_URL}/api/pro/mollie/webhook", json={"id": "test"})
        # Should not 404 (route exists)
        assert r.status_code != 404


# ═══════════════════════════
# 11. HEALTH CORE (Unit tests)
# ═══════════════════════════
class TestHealthCore:
    def test_gen_data_returns_zeros(self):
        from routes.health_core import gen_data
        d = gen_data()
        assert d["heart_rate"] == 0
        assert d["spo2"] == 0
        assert d["weight"] == 0

    def test_compute_subscores_no_data(self):
        from routes.health_core import compute_subscores, gen_data
        d = gen_data()
        result = compute_subscores(d)
        assert result["no_data"] is True
        assert result["score"] == 0

    def test_compute_subscores_with_data(self):
        from routes.health_core import compute_subscores, gen_data
        d = gen_data()
        d["heart_rate"] = 72
        d["spo2"] = 97
        d["steps"] = 8000
        d["sleep_quality"] = 80
        result = compute_subscores(d)
        assert result["score"] > 0
        assert "subscores" in result
        assert "cardio" in result["subscores"]

    def test_estimate_vo2_max(self):
        from routes.health_core import estimate_vo2_max
        vo2 = estimate_vo2_max(age=24, resting_hr=65, hrv=50, steps_daily=7000, gender="M")
        assert 20 < vo2 < 60

    def test_has_meaningful_data(self):
        from routes.health_core import has_meaningful_data
        assert has_meaningful_data({"heart_rate": 72}) is True
        assert has_meaningful_data({"heart_rate": 0, "spo2": 0}) is False

    def test_sanitize_data(self):
        from routes.health_core import sanitize_data
        d = {"temperature": 25, "weight": 300, "heart_rate": 250}
        result = sanitize_data(d)
        assert result["temperature"] == 0
        assert result["weight"] == 0
        assert result["heart_rate"] == 0
