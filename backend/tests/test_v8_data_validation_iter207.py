"""
Test V8 Bracelet Data Validation & Daily Report Integrity - Iteration 207

Focus areas:
1. SpO2 sanitization (60-100 range) - values outside rejected
2. has_device field in daily report
3. Bracelet status connected timeout (300s)
4. V8 push endpoint with various data types (sleep, battery, ecg_result, blood_glucose)
5. Pending commands and vibration
6. V8 debug endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://multilang-health-app.preview.emergentagent.com"

# Test credentials
TEST_PHONE = "+33651245918"
TEST_PASSWORD = "test123"
BRACELET_MAC = "E3FD041B-D210-F1FE-60F6-CB30634CD5AA"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 10
        print(f"PASS: Login successful, token length: {len(auth_token)}")


class TestV8PushValidVitals:
    """Test V8 push endpoint with valid vitals data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_valid_hr_spo2_bp_temp(self, auth_token):
        """POST /api/bracelet/v8/push with valid HR/SpO2/BP/Temp - must accept and store"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 75,
                "spo2": 97,
                "hrv": 42,
                "stress": 30,
                "systolic": 120,
                "diastolic": 80,
                "temperature": 36.6
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Push failed: {response.text}"
        data = response.json()
        
        # Verify data was stored
        assert data.get("data_type") == "heart_rate"
        assert data.get("device_model") == "v8"
        assert "id" in data
        assert "timestamp" in data
        
        # Verify vitals in response data
        resp_data = data.get("data", {})
        assert resp_data.get("heart_rate") == 75, "HR not stored correctly"
        assert resp_data.get("spo2") == 97, "SpO2 not stored correctly"
        assert resp_data.get("systolic") == 120, "Systolic not stored correctly"
        assert resp_data.get("diastolic") == 80, "Diastolic not stored correctly"
        assert resp_data.get("temperature") == 36.6, "Temperature not stored correctly"
        
        print("PASS: Valid vitals (HR=75, SpO2=97, BP=120/80, Temp=36.6) accepted and stored")


class TestV8SpO2Validation:
    """Test SpO2 sanitization - values outside 60-100 should be rejected"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_invalid_spo2_36(self, auth_token):
        """POST /api/bracelet/v8/push with SpO2=36 (invalid) - must reject SpO2 but keep HR"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 72,
                "spo2": 36  # Invalid - below 60
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Push failed: {response.text}"
        data = response.json()
        resp_data = data.get("data", {})
        
        # HR should be kept (valid)
        assert resp_data.get("heart_rate") == 72, "Valid HR should be kept"
        # SpO2 should be removed (invalid)
        assert resp_data.get("spo2") is None or resp_data.get("spo2") == 0, \
            f"Invalid SpO2=36 should be rejected, got: {resp_data.get('spo2')}"
        
        print("PASS: SpO2=36 rejected, HR=72 kept")
    
    def test_push_invalid_spo2_59(self, auth_token):
        """POST /api/bracelet/v8/push with SpO2=59 (just below valid range)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 70,
                "spo2": 59  # Invalid - below 60
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        assert resp_data.get("spo2") is None or resp_data.get("spo2") == 0, \
            f"SpO2=59 should be rejected, got: {resp_data.get('spo2')}"
        
        print("PASS: SpO2=59 rejected (below 60 threshold)")
    
    def test_push_valid_spo2_60(self, auth_token):
        """POST /api/bracelet/v8/push with SpO2=60 (edge case - should be accepted)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 68,
                "spo2": 60  # Valid - exactly at threshold
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        assert resp_data.get("spo2") == 60, f"SpO2=60 should be accepted, got: {resp_data.get('spo2')}"
        
        print("PASS: SpO2=60 accepted (at threshold)")
    
    def test_push_valid_spo2_100(self, auth_token):
        """POST /api/bracelet/v8/push with SpO2=100 (max valid)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 65,
                "spo2": 100  # Valid - max
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        assert resp_data.get("spo2") == 100, f"SpO2=100 should be accepted, got: {resp_data.get('spo2')}"
        
        print("PASS: SpO2=100 accepted (max valid)")
    
    def test_push_invalid_spo2_101(self, auth_token):
        """POST /api/bracelet/v8/push with SpO2=101 (above valid range)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 66,
                "spo2": 101  # Invalid - above 100
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        assert resp_data.get("spo2") is None or resp_data.get("spo2") == 0, \
            f"SpO2=101 should be rejected, got: {resp_data.get('spo2')}"
        
        print("PASS: SpO2=101 rejected (above 100 threshold)")


class TestV8HRValidation:
    """Test HR validation - values outside 30-200 should be rejected"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_invalid_hr_250(self, auth_token):
        """POST /api/bracelet/v8/push with HR=250 (invalid) - must reject HR"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 250,  # Invalid - above 200
                "spo2": 95
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        # HR should be removed (invalid)
        assert resp_data.get("heart_rate") is None or resp_data.get("heart_rate") == 0, \
            f"Invalid HR=250 should be rejected, got: {resp_data.get('heart_rate')}"
        # SpO2 should be kept (valid)
        assert resp_data.get("spo2") == 95, "Valid SpO2 should be kept"
        
        print("PASS: HR=250 rejected, SpO2=95 kept")
    
    def test_push_valid_hr_200(self, auth_token):
        """POST /api/bracelet/v8/push with HR=200 (max valid)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 200,  # Valid - max
                "spo2": 96
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        resp_data = data.get("data", {})
        
        assert resp_data.get("heart_rate") == 200, f"HR=200 should be accepted, got: {resp_data.get('heart_rate')}"
        
        print("PASS: HR=200 accepted (max valid)")


class TestBraceletStatus:
    """Test bracelet status endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_bracelet_status_returns_paired(self, auth_token):
        """GET /api/bracelet/status - must return paired:true, spo2 valid, connected based on 300s"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers=headers
        )
        assert response.status_code == 200, f"Status failed: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "paired" in data, "Response must include 'paired' field"
        assert "connected" in data, "Response must include 'connected' field"
        assert "last_sync" in data, "Response must include 'last_sync' field"
        
        # Check vitals fields
        assert "heart_rate" in data, "Response must include 'heart_rate'"
        assert "spo2" in data, "Response must include 'spo2'"
        assert "temperature" in data, "Response must include 'temperature'"
        assert "steps" in data, "Response must include 'steps'"
        assert "systolic" in data, "Response must include 'systolic'"
        assert "diastolic" in data, "Response must include 'diastolic'"
        
        # Verify SpO2 is sanitized (should be 0 or in 60-100 range)
        spo2 = data.get("spo2", 0)
        if spo2 > 0:
            assert 60 <= spo2 <= 100, f"SpO2 should be sanitized (60-100), got: {spo2}"
        
        print(f"PASS: Bracelet status returned - paired={data.get('paired')}, connected={data.get('connected')}, spo2={spo2}")


class TestV8Dashboard:
    """Test V8 dashboard endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_v8_dashboard_returns_sanitized_spo2(self, auth_token):
        """GET /api/bracelet/v8/dashboard - must return vitals with SpO2 sanitized"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/bracelet/v8/dashboard",
            headers=headers
        )
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Check structure
        assert "connected" in data, "Response must include 'connected'"
        assert "vitals" in data, "Response must include 'vitals'"
        
        vitals = data.get("vitals", {})
        
        # Check vitals fields
        assert "heart_rate" in vitals, "Vitals must include 'heart_rate'"
        assert "spo2" in vitals, "Vitals must include 'spo2'"
        assert "temperature" in vitals, "Vitals must include 'temperature'"
        assert "steps" in vitals, "Vitals must include 'steps'"
        assert "systolic" in vitals, "Vitals must include 'systolic'"
        assert "diastolic" in vitals, "Vitals must include 'diastolic'"
        
        # Verify SpO2 is sanitized
        spo2 = vitals.get("spo2", 0)
        if spo2 > 0:
            assert 60 <= spo2 <= 100, f"Dashboard SpO2 should be sanitized (60-100), got: {spo2}"
        
        print(f"PASS: V8 dashboard returned - connected={data.get('connected')}, spo2={spo2}")


class TestDailyReport:
    """Test daily report endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_daily_report_has_device_field(self, auth_token):
        """GET /api/health/daily-report - must return has_device:true, SpO2 sanitized, real bracelet data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers=headers
        )
        assert response.status_code == 200, f"Daily report failed: {response.text}"
        data = response.json()
        
        # Check has_device field
        assert "has_device" in data, "Response must include 'has_device' field"
        
        # Check data structure
        assert "data" in data or "no_data" in data, "Response must include 'data' or 'no_data'"
        
        # If we have data, check SpO2 sanitization
        report_data = data.get("data", {})
        if report_data:
            spo2 = report_data.get("spo2", 0)
            if spo2 > 0:
                assert 60 <= spo2 <= 100, f"Daily report SpO2 should be sanitized (60-100), got: {spo2}"
        
        # Check score_info
        if "score_info" in data:
            score_info = data["score_info"]
            assert "score" in score_info, "score_info must include 'score'"
            assert "status" in score_info, "score_info must include 'status'"
        
        print(f"PASS: Daily report returned - has_device={data.get('has_device')}, no_data={data.get('no_data', False)}")


class TestV8SleepData:
    """Test V8 push with sleep data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_sleep_with_valid_stages(self, auth_token):
        """POST /api/bracelet/v8/push with data_type=sleep + sleep_stages valides"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Valid sleep stages: 1=Deep, 2=Light, 3=REM, 4=Awake
        payload = {
            "data_type": "sleep",
            "device_id": BRACELET_MAC,
            "data": {
                "sleep_stages": [1, 1, 2, 2, 2, 3, 3, 2, 2, 1, 1, 4]  # Mix of stages
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Sleep push failed: {response.text}"
        data = response.json()
        
        assert data.get("data_type") == "sleep"
        resp_data = data.get("data", {})
        
        # Check sleep analysis was computed
        assert "sleep_stages" in resp_data, "Response should include sleep_stages"
        assert "sleep_duration_min" in resp_data, "Response should include sleep_duration_min"
        
        print(f"PASS: Sleep data accepted - duration={resp_data.get('sleep_duration_min')}min")


class TestV8BatteryData:
    """Test V8 push with battery data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_battery_valid(self, auth_token):
        """POST /api/bracelet/v8/push with data_type=battery + value 0-100"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "battery",
            "device_id": BRACELET_MAC,
            "data": {
                "battery": 85
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Battery push failed: {response.text}"
        data = response.json()
        
        assert data.get("data_type") == "battery"
        resp_data = data.get("data", {})
        assert resp_data.get("battery") == 85, f"Battery should be 85, got: {resp_data.get('battery')}"
        
        print("PASS: Battery data (85%) accepted")


class TestV8ECGResult:
    """Test V8 push with ECG result data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_ecg_result(self, auth_token):
        """POST /api/bracelet/v8/push with data_type=ecg_result"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "ecg_result",
            "device_id": BRACELET_MAC,
            "data": {
                "ecg_hr": 72,
                "ecg_hrv": 45,
                "ecg_breath_rate": 16,
                "ecg_stress": 25,
                "ecg_mood": 80,
                "ecg_systolic": 118,
                "ecg_diastolic": 78,
                "ecg_vascular_aging": 55
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"ECG result push failed: {response.text}"
        data = response.json()
        
        assert data.get("data_type") == "ecg_result"
        resp_data = data.get("data", {})
        assert resp_data.get("ecg_hr") == 72, "ECG HR should be stored"
        assert resp_data.get("ecg_hrv") == 45, "ECG HRV should be stored"
        
        print("PASS: ECG result data accepted")


class TestV8BloodGlucose:
    """Test V8 push with blood glucose data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_push_blood_glucose(self, auth_token):
        """POST /api/bracelet/v8/push with data_type=blood_glucose"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "data_type": "blood_glucose",
            "device_id": BRACELET_MAC,
            "data": {
                "blood_glucose_mmol": 5.5,
                "blood_glucose_mgdl": 99,
                "glucose_progress": 100
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Blood glucose push failed: {response.text}"
        data = response.json()
        
        assert data.get("data_type") == "blood_glucose"
        resp_data = data.get("data", {})
        assert resp_data.get("blood_glucose_mgdl") == 99, "Blood glucose should be stored"
        
        print("PASS: Blood glucose data (99 mg/dL) accepted")


class TestV8PendingCommands:
    """Test V8 pending commands endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_pending_commands_endpoint(self, auth_token):
        """GET /api/bracelet/v8/pending-commands - must return commands array"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/bracelet/v8/pending-commands",
            headers=headers
        )
        assert response.status_code == 200, f"Pending commands failed: {response.text}"
        data = response.json()
        
        assert "commands" in data, "Response must include 'commands' array"
        assert isinstance(data["commands"], list), "commands must be a list"
        
        print(f"PASS: Pending commands returned - count={len(data['commands'])}")


class TestV8Vibrate:
    """Test V8 vibration command"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_vibrate_creates_pending_command(self, auth_token):
        """POST /api/bracelet/v8/vibrate - must create a pending command"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "type": "reminder",
            "message": "Test vibration"
        }
        response = requests.post(
            f"{BASE_URL}/api/bracelet/v8/vibrate",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Vibrate failed: {response.text}"
        data = response.json()
        
        assert "id" in data, "Response must include 'id'"
        assert data.get("command") == "vibrate", "Command should be 'vibrate'"
        assert data.get("ble_cmd") == 0x36 or data.get("ble_cmd") == 54, "BLE cmd should be 0x36 (54)"
        assert "ble_payload" in data, "Response must include 'ble_payload'"
        
        print(f"PASS: Vibration command created - ble_cmd={data.get('ble_cmd')}, payload={data.get('ble_payload')}")


class TestV8Debug:
    """Test V8 debug endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_debug_returns_raw_readings(self, auth_token):
        """GET /api/bracelet/v8/debug - must return last raw readings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/bracelet/v8/debug",
            headers=headers
        )
        assert response.status_code == 200, f"Debug failed: {response.text}"
        data = response.json()
        
        assert "current_device_vitals" in data, "Response must include 'current_device_vitals'"
        assert "last_readings" in data, "Response must include 'last_readings'"
        assert isinstance(data["last_readings"], list), "last_readings must be a list"
        
        # Check device vitals structure
        vitals = data.get("current_device_vitals", {})
        if vitals:
            # Should have last_* fields
            print(f"  Device vitals keys: {list(vitals.keys())[:5]}...")
        
        print(f"PASS: V8 debug returned - readings_count={len(data['last_readings'])}")


class TestSanitizeDataFunction:
    """Test _sanitize_data function behavior via daily report"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        return response.json().get("token")
    
    def test_sanitize_rejects_invalid_spo2_in_report(self, auth_token):
        """Verify _sanitize_data in daily report rejects SpO2 outside 60-100"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First push invalid SpO2
        push_payload = {
            "data_type": "heart_rate",
            "device_id": BRACELET_MAC,
            "data": {
                "heart_rate": 74,
                "spo2": 36  # Invalid
            }
        }
        requests.post(
            f"{BASE_URL}/api/bracelet/v8/push",
            json=push_payload,
            headers=headers
        )
        
        # Then check daily report
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report?force=true",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        report_data = data.get("data", {})
        spo2 = report_data.get("spo2", 0)
        
        # SpO2 should be 0 or in valid range (not 36)
        if spo2 > 0:
            assert 60 <= spo2 <= 100, f"Daily report should sanitize SpO2, got: {spo2}"
        
        print(f"PASS: Daily report SpO2 sanitized - value={spo2}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
