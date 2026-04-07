"""
CHUTEX Pre-Production Audit - Iteration 203
Tests all critical API endpoints for the health app:
- Auth (login, me)
- Dashboard batch
- V8 Bracelet (push, dashboard, status)
- Health (daily-report, history)
- Devices
- Subscriptions
- Reminders
- Alerts
- No simulated data verification
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://real-time-ble-bridge.preview.emergentagent.com").rstrip("/")

# Test credentials from test_credentials.md
TEST_PHONE = "+33651245918"
TEST_PASSWORD = "test123"
TEST_USER_NAME = "Robin Zuchiatti"


class TestAuthFlow:
    """Authentication endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    def test_login_success(self):
        """POST /api/auth/login with phone +33651245918 and password test123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert isinstance(data["token"], str), "Token should be string"
        assert len(data["token"]) > 0, "Token should not be empty"
        print(f"✓ Login successful, user: {data['user'].get('name', 'unknown')}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_me(self, auth_token):
        """GET /api/auth/me - should return user info"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in user"
        assert "name" in data, "No name in user"
        assert "phone" in data, "No phone in user"
        print(f"✓ User profile: {data.get('name')}, phone: {data.get('phone')}")


class TestDashboardBatch:
    """Dashboard batch endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_batch_returns_200(self, auth_token):
        """GET /api/dashboard/batch - should return all dashboard data keys"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/batch", headers=headers)
        assert response.status_code == 200, f"Dashboard batch failed: {response.text}"
        data = response.json()
        
        # Check for expected keys (dashboard_summary is required, others may vary)
        assert "dashboard_summary" in data, "Missing key: dashboard_summary"
        # Check for alerts (may be named active_alerts or alerts)
        has_alerts = "alerts" in data or "active_alerts" in data
        assert has_alerts, "Missing alerts key"
        
        print(f"✓ Dashboard batch returned keys: {list(data.keys())}")
    
    def test_dashboard_summary_structure(self, auth_token):
        """Verify dashboard_summary has devices array"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/batch", headers=headers)
        data = response.json()
        
        summary = data.get("dashboard_summary", {})
        assert "devices" in summary, "No devices in dashboard_summary"
        assert isinstance(summary["devices"], list), "devices should be a list"
        print(f"✓ Dashboard summary has {len(summary['devices'])} devices")


class TestV8BraceletPush:
    """V8 Bracelet push endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_v8_push_heart_rate(self, auth_token):
        """POST /api/bracelet/v8/push with heart_rate data - should save to DB"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "data": {
                "heart_rate": 72,
                "hrv": 45,
                "spo2": 98,
                "stress": 25,
                "systolic": 120,
                "diastolic": 80,
                "temperature": 36.5
            },
            "device_id": "test-v8-device"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=headers)
        assert response.status_code == 200, f"V8 push failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in response"
        assert data.get("data_type") == "heart_rate", "Wrong data_type"
        print(f"✓ V8 heart_rate push successful, reading id: {data.get('id')}")
    
    def test_v8_push_sleep(self, auth_token):
        """POST /api/bracelet/v8/push with sleep data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "sleep",
            "data": {
                "sleep_stages": [1, 1, 2, 2, 2, 3, 3, 2, 2, 1, 1],  # 1=deep, 2=light, 3=REM
                "sleep_duration_min": 420,
                "sleep_quality": 85
            },
            "device_id": "test-v8-device"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=headers)
        assert response.status_code == 200, f"V8 sleep push failed: {response.text}"
        data = response.json()
        assert data.get("data_type") == "sleep", "Wrong data_type"
        print(f"✓ V8 sleep push successful")
    
    def test_v8_push_blood_glucose(self, auth_token):
        """POST /api/bracelet/v8/push with glucose data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "blood_glucose",
            "data": {
                "blood_glucose_mgdl": 95,
                "blood_glucose_mmol": 5.3,
                "glucose_progress": 100
            },
            "device_id": "test-v8-device"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=headers)
        assert response.status_code == 200, f"V8 glucose push failed: {response.text}"
        data = response.json()
        assert data.get("data_type") == "blood_glucose", "Wrong data_type"
        print(f"✓ V8 blood_glucose push successful")
    
    def test_v8_push_missing_data(self, auth_token):
        """Test V8 push with missing data - should return 400"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate"
            # Missing "data" field
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ V8 push correctly rejects missing data")


class TestV8BraceletDashboard:
    """V8 Bracelet dashboard endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_v8_dashboard(self, auth_token):
        """GET /api/bracelet/v8/dashboard - should show connected status and vitals"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/dashboard", headers=headers)
        assert response.status_code == 200, f"V8 dashboard failed: {response.text}"
        data = response.json()
        
        # Check structure
        assert "connected" in data, "No connected field"
        assert "vitals" in data, "No vitals field"
        
        vitals = data.get("vitals", {})
        expected_vitals = ["heart_rate", "hrv", "spo2", "temperature", "steps", "systolic", "diastolic"]
        for v in expected_vitals:
            assert v in vitals, f"Missing vital: {v}"
        
        print(f"✓ V8 dashboard: connected={data.get('connected')}, HR={vitals.get('heart_rate')}, SpO2={vitals.get('spo2')}")


class TestBraceletStatus:
    """Bracelet status endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_bracelet_status(self, auth_token):
        """GET /api/bracelet/status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/bracelet/status", headers=headers)
        assert response.status_code == 200, f"Bracelet status failed: {response.text}"
        data = response.json()
        
        expected_fields = ["connected", "battery", "heart_rate", "spo2", "paired"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Bracelet status: connected={data.get('connected')}, paired={data.get('paired')}, battery={data.get('battery')}")


class TestHealthDailyReport:
    """Health daily report endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_daily_report(self, auth_token):
        """GET /api/health/daily-report - should return score and subscores"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers, timeout=30)
        assert response.status_code == 200, f"Daily report failed: {response.text}"
        data = response.json()
        
        # Check for score_info or score
        has_score = "score_info" in data or "score" in data
        assert has_score, "No score or score_info in response"
        
        # Check for AI analysis
        if "ai" in data:
            ai = data["ai"]
            assert "hero_line" in ai or "summary" in ai, "AI missing hero_line or summary"
        
        print(f"✓ Daily report: score={data.get('score', data.get('score_info', {}).get('score', 'N/A'))}")


class TestHealthHistory:
    """Health history endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_heart_rate_history(self, auth_token):
        """GET /api/health/history/heart_rate - should return metric history"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # The endpoint is /api/health/metric-history/{key}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/heart_rate", headers=headers)
        assert response.status_code == 200, f"Heart rate history failed: {response.text}"
        data = response.json()
        
        assert "key" in data, "No key in response"
        assert data["key"] == "heart_rate", "Wrong key"
        assert "history" in data, "No history in response"
        assert "meta" in data, "No meta in response"
        
        print(f"✓ Heart rate history: {len(data.get('history', []))} data points")


class TestDevices:
    """Devices endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_devices_list(self, auth_token):
        """GET /api/devices - should list bracelet, scale, vest"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        assert response.status_code == 200, f"Devices list failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Devices should be a list"
        
        device_types = [d.get("device_type") for d in data]
        print(f"✓ Devices list: {len(data)} devices, types: {device_types}")


class TestSubscriptions:
    """Subscription endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_my_subscription(self, auth_token):
        """GET /api/subscriptions/my - should show active standard subscription"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        assert response.status_code == 200, f"Subscription check failed: {response.text}"
        data = response.json()
        
        # Check subscription structure
        assert "subscription_type" in data or "type" in data or "status" in data, "No subscription info"
        
        sub_type = data.get("subscription_type", data.get("type", "unknown"))
        status = data.get("status", "unknown")
        print(f"✓ Subscription: type={sub_type}, status={status}")


class TestReminders:
    """Reminders endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_reminders_list(self, auth_token):
        """GET /api/reminders"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/reminders", headers=headers)
        assert response.status_code == 200, f"Reminders list failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Reminders should be a list"
        print(f"✓ Reminders list: {len(data)} reminders")


class TestAlerts:
    """Alerts endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_alerts_list(self, auth_token):
        """GET /api/alerts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/alerts", headers=headers)
        assert response.status_code == 200, f"Alerts list failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Alerts should be a list"
        print(f"✓ Alerts list: {len(data)} alerts")


class TestNoSimulatedData:
    """Verify no simulated/random data in API responses"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_no_random_data(self, auth_token):
        """Verify dashboard batch doesn't contain random/simulated data markers"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/batch", headers=headers)
        data = response.json()
        
        # Convert to string to search for simulation markers
        data_str = str(data).lower()
        
        # Check for simulation markers
        simulation_markers = ["simulated", "mock", "fake", "random", "demo_data"]
        found_markers = [m for m in simulation_markers if m in data_str]
        
        # Note: "demo" might appear in legitimate contexts, so we don't flag it
        assert len(found_markers) == 0, f"Found simulation markers: {found_markers}"
        print("✓ Dashboard batch: No simulation markers found")
    
    def test_health_report_no_random_data(self, auth_token):
        """Verify health report doesn't contain random/simulated data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers, timeout=30)
        data = response.json()
        
        # Check that data values are either 0 (no data) or realistic
        health_data = data.get("data", {})
        
        # Heart rate should be 0 or between 40-200
        hr = health_data.get("heart_rate", 0)
        if hr > 0:
            assert 40 <= hr <= 200, f"Heart rate {hr} seems unrealistic"
        
        # SpO2 should be 0 or between 80-100
        spo2 = health_data.get("spo2", 0)
        if spo2 > 0:
            assert 80 <= spo2 <= 100, f"SpO2 {spo2} seems unrealistic"
        
        # Temperature should be 0 or between 35-42
        temp = health_data.get("temperature", 0)
        if temp > 0:
            assert 35 <= temp <= 42, f"Temperature {temp} seems unrealistic"
        
        print(f"✓ Health report: Data values are realistic (HR={hr}, SpO2={spo2}, Temp={temp})")
    
    def test_bracelet_status_no_random_battery(self, auth_token):
        """Verify bracelet battery is not randomly generated"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Call twice and check battery is consistent (not random)
        response1 = requests.get(f"{BASE_URL}/api/bracelet/status", headers=headers)
        data1 = response1.json()
        battery1 = data1.get("battery", 0)
        
        time.sleep(0.5)
        
        response2 = requests.get(f"{BASE_URL}/api/bracelet/status", headers=headers)
        data2 = response2.json()
        battery2 = data2.get("battery", 0)
        
        # Battery should be the same (not randomly changing)
        assert battery1 == battery2, f"Battery changed between calls: {battery1} -> {battery2} (possible random generation)"
        print(f"✓ Bracelet battery is consistent: {battery1}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
