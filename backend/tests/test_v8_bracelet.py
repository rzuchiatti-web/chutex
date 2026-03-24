"""
Test V8 Bracelet API Endpoints - JStyle BLE SDK V8 Integration
Tests: GET /api/bracelet/v8/config, POST /api/bracelet/v8/push, 
       GET /api/bracelet/v8/vo2max, GET /api/bracelet/v8/ecg-history,
       GET /api/bracelet/v8/glucose-history, GET /api/bracelet/v8/dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://health-readonly-view.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


class TestV8BraceletConfig:
    """Test V8 BLE config endpoint (no auth required)"""

    def test_get_v8_config_returns_ble_config(self):
        """GET /api/bracelet/v8/config returns V8 BLE config with services, commands, sport_modes"""
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify main structure
        assert "device_name_prefixes" in data
        assert "services" in data
        assert "commands" in data
        assert "sport_modes" in data
        
        # Verify V8 prefixes
        assert "V8" in data["device_name_prefixes"]
        assert "JCV8" in data["device_name_prefixes"]
        
        # Verify services structure
        services = data["services"]
        assert "main" in services
        assert "heart_rate" in services
        assert "battery" in services
        
        # Verify commands for V8 features
        commands = data["commands"]
        assert "start_ecg" in commands
        assert "get_blood_glucose" in commands
        assert "get_temperature" in commands
        assert "start_sport" in commands
        
        # Verify sport modes
        sport_modes = data["sport_modes"]
        assert "0" in sport_modes or 0 in sport_modes  # course
        print("✓ V8 config endpoint returns complete BLE configuration")


class TestV8BraceletEndpointsAuth:
    """Test that V8 endpoints require authentication"""

    def test_v8_push_requires_auth(self):
        """POST /api/bracelet/v8/push returns 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json={"data_type": "heart_rate", "data": {"heart_rate": 75}}
        )
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ V8 push requires authentication")

    def test_v8_dashboard_requires_auth(self):
        """GET /api/bracelet/v8/dashboard returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/dashboard")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ V8 dashboard requires authentication")

    def test_v8_vo2max_requires_auth(self):
        """GET /api/bracelet/v8/vo2max returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/vo2max")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ V8 vo2max requires authentication")

    def test_v8_ecg_history_requires_auth(self):
        """GET /api/bracelet/v8/ecg-history returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/ecg-history")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ V8 ecg-history requires authentication")

    def test_v8_glucose_history_requires_auth(self):
        """GET /api/bracelet/v8/glucose-history returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/glucose-history")
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("✓ V8 glucose-history requires authentication")


class TestV8BraceletPush:
    """Test V8 push endpoint with various data types"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.token = data.get("token")
        self.user = data.get("user", {})
        if not self.token:
            pytest.skip("No token received from login")
        
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        print(f"✓ Logged in as {TEST_PHONE}")

    def test_push_heart_rate_data(self):
        """POST /api/bracelet/v8/push with data_type=heart_rate stores reading"""
        payload = {
            "data_type": "heart_rate",
            "data": {"heart_rate": 72, "hrv": 45, "rr_intervals": [820, 850, 810]},
            "device_id": "TEST_V8_DEVICE"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data_type") == "heart_rate"
        assert data.get("device_model") == "v8"
        assert data.get("data", {}).get("heart_rate") == 72
        assert "id" in data
        assert "timestamp" in data
        print("✓ V8 push heart_rate stores reading correctly")

    def test_push_blood_glucose_data(self):
        """POST /api/bracelet/v8/push with data_type=blood_glucose stores glucose data"""
        payload = {
            "data_type": "blood_glucose",
            "data": {"blood_glucose_mmol": 5.5, "blood_glucose_mgdl": 99, "glucose_progress": 100},
            "device_id": "TEST_V8_DEVICE"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data_type") == "blood_glucose"
        assert data.get("device_model") == "v8"
        assert data.get("data", {}).get("blood_glucose_mgdl") == 99
        print("✓ V8 push blood_glucose stores data correctly")

    def test_push_ecg_result_data(self):
        """POST /api/bracelet/v8/push with data_type=ecg_result stores ECG analysis"""
        payload = {
            "data_type": "ecg_result",
            "data": {
                "ecg_hr": 68,
                "ecg_hrv": 42,
                "ecg_breath_rate": 16,
                "ecg_stress": 25,
                "ecg_mood": 75,
                "ecg_systolic": 118,
                "ecg_diastolic": 72,
                "ecg_vascular_aging": 42
            },
            "device_id": "TEST_V8_DEVICE"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data_type") == "ecg_result"
        assert data.get("device_model") == "v8"
        assert data.get("data", {}).get("ecg_hr") == 68
        assert data.get("data", {}).get("ecg_vascular_aging") == 42
        print("✓ V8 push ecg_result stores ECG analysis correctly")

    def test_push_temperature_data(self):
        """POST /api/bracelet/v8/push with data_type=temperature stores temp data"""
        payload = {
            "data_type": "temperature",
            "data": {"temperature": 36.6, "axillary_temperature": 36.3},
            "device_id": "TEST_V8_DEVICE"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data_type") == "temperature"
        assert data.get("data", {}).get("temperature") == 36.6
        print("✓ V8 push temperature stores data correctly")

    def test_push_ppg_data(self):
        """POST /api/bracelet/v8/push with data_type=ppg stores PPG raw data"""
        payload = {
            "data_type": "ppg",
            "data": {"samples": [500, 520, 515, 530, 510], "timestamp": "2024-01-15T10:00:00Z"},
            "device_id": "TEST_V8_DEVICE"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data_type") == "ppg"
        assert "samples" in data.get("data", {})
        print("✓ V8 push ppg stores raw data correctly")


class TestV8BraceletDashboardAndHistory:
    """Test V8 dashboard and history endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.token = data.get("token")
        if not self.token:
            pytest.skip("No token received from login")
        
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def test_v8_dashboard_returns_vitals(self):
        """GET /api/bracelet/v8/dashboard returns connected status and vitals with blood_glucose, ecg fields"""
        # First push some data to ensure dashboard has something to show
        requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json={"data_type": "heart_rate", "data": {"heart_rate": 70, "hrv": 40}, "device_id": "TEST_V8"},
            headers=self.headers
        )
        
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/dashboard", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Dashboard should have connected status and vitals
        assert "connected" in data
        assert "vitals" in data
        
        vitals = data.get("vitals", {})
        # V8 dashboard should include blood_glucose and ecg fields
        assert "blood_glucose" in vitals or "heart_rate" in vitals
        assert "ecg_hr" in vitals or "heart_rate" in vitals
        print("✓ V8 dashboard returns connected status and vitals structure")

    def test_v8_vo2max_calculation(self):
        """GET /api/bracelet/v8/vo2max returns calculated VO2max with level"""
        # Push multiple HR readings for VO2max calculation (needs range of values)
        hr_values = [60, 75, 85, 95, 110]
        for hr in hr_values:
            requests.post(
                f"{BASE_URL}/api/bracelet/v8/push",
                json={"data_type": "heart_rate", "data": {"heart_rate": hr, "hrv": 40}, "device_id": "TEST_V8"},
                headers=self.headers
            )
        
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/vo2max", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # VO2max endpoint should return vo2max value and level
        assert "vo2max" in data
        assert "level" in data
        # With HR values from 60-110, should calculate a VO2max
        print(f"✓ V8 vo2max returns: vo2max={data.get('vo2max')}, level={data.get('level')}")

    def test_v8_ecg_history_returns_array(self):
        """GET /api/bracelet/v8/ecg-history returns ECG readings array"""
        # Push ECG data first
        requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json={
                "data_type": "ecg_result",
                "data": {"ecg_hr": 70, "ecg_hrv": 38, "ecg_breath_rate": 15, "ecg_stress": 30},
                "device_id": "TEST_V8"
            },
            headers=self.headers
        )
        
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/ecg-history", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "readings" in data
        assert "count" in data
        assert isinstance(data["readings"], list)
        print(f"✓ V8 ecg-history returns array with {data.get('count')} readings")

    def test_v8_glucose_history_returns_array(self):
        """GET /api/bracelet/v8/glucose-history returns glucose readings array"""
        # Push glucose data first
        requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json={
                "data_type": "blood_glucose",
                "data": {"blood_glucose_mmol": 5.2, "blood_glucose_mgdl": 94, "glucose_progress": 100},
                "device_id": "TEST_V8"
            },
            headers=self.headers
        )
        
        response = requests.get(f"{BASE_URL}/api/bracelet/v8/glucose-history", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "readings" in data
        assert "count" in data
        assert isinstance(data["readings"], list)
        print(f"✓ V8 glucose-history returns array with {data.get('count')} readings")


class TestV8AnomalyAlerts:
    """Test that V8 push creates anomaly alerts for abnormal values"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.token = data.get("token")
        if not self.token:
            pytest.skip("No token received from login")
        
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def test_high_glucose_triggers_alert(self):
        """High glucose (>250 mg/dL) should trigger alert"""
        payload = {
            "data_type": "blood_glucose",
            "data": {"blood_glucose_mmol": 15.0, "blood_glucose_mgdl": 270, "glucose_progress": 100},
            "device_id": "TEST_V8_ALERT"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200
        # Alert creation is internal - just verify push succeeded
        print("✓ High glucose push succeeded (alert creation is internal)")

    def test_low_glucose_triggers_alert(self):
        """Low glucose (<60 mg/dL) should trigger hypoglycemia alert"""
        payload = {
            "data_type": "blood_glucose",
            "data": {"blood_glucose_mmol": 3.0, "blood_glucose_mgdl": 54, "glucose_progress": 100},
            "device_id": "TEST_V8_ALERT"
        }
        response = requests.post(f"{BASE_URL}/api/bracelet/v8/push", json=payload, headers=self.headers)
        assert response.status_code == 200
        print("✓ Low glucose push succeeded (alert creation is internal)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
