"""
Test suite for Iteration 36: Beneficiary Dashboard & Health Pages Redesign
Tests the /api/devices/dashboard-summary endpoint and related features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials - Beneficiary role
TEST_EMAIL = "robert.martin@email.fr"
TEST_PASSWORD = "demo123"


class TestDashboardSummaryEndpoint:
    """Tests for the comprehensive device dashboard endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        self.token = data["token"]
        self.user = data.get("user", {})
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_login_as_beneficiary(self):
        """Verify login works with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "beneficiary" or data["user"]["active_role"] == "beneficiary"
        print(f"Login successful - User: {data['user']['name']}, Role: {data['user'].get('role')}")
    
    def test_dashboard_summary_returns_200(self):
        """Test that dashboard-summary endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("Dashboard summary endpoint returns 200 OK")
    
    def test_dashboard_summary_has_bracelet_data(self):
        """Test that response contains bracelet data with required fields"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "bracelet" in data, "Missing bracelet data"
        bracelet = data["bracelet"]
        
        # Check required bracelet fields
        required_fields = ["heart_rate", "spo2", "blood_pressure", "temperature", "steps", "calories", "distance_km", "battery", "connected"]
        for field in required_fields:
            assert field in bracelet, f"Missing bracelet field: {field}"
        
        # Validate blood pressure structure
        assert "systolic" in bracelet.get("blood_pressure", {}), "Missing systolic in blood_pressure"
        assert "diastolic" in bracelet.get("blood_pressure", {}), "Missing diastolic in blood_pressure"
        
        # Validate heart rate history
        assert "heart_rate_history" in bracelet, "Missing heart_rate_history"
        
        print(f"Bracelet data: HR={bracelet['heart_rate']}, SpO2={bracelet['spo2']}, Steps={bracelet['steps']}")
    
    def test_dashboard_summary_has_scale_data(self):
        """Test that response contains scale (balance) data with required fields"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "scale" in data, "Missing scale data"
        scale = data["scale"]
        
        # Check required scale fields
        required_fields = ["weight", "bmi", "body_fat", "muscle_mass", "water_pct", "bone_mass", "visceral_fat", "metabolic_age", "battery", "connected", "name"]
        for field in required_fields:
            assert field in scale, f"Missing scale field: {field}"
        
        # Validate weight history
        assert "weight_history" in scale, "Missing weight_history in scale"
        
        print(f"Scale data: Weight={scale['weight']}kg, BMI={scale['bmi']}, Body Fat={scale['body_fat']}%")
    
    def test_dashboard_summary_has_vest_data(self):
        """Test that response contains vest (gilet) data with required fields"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "vest" in data, "Missing vest data"
        vest = data["vest"]
        
        # Check required vest fields
        required_fields = ["fall_detected", "posture_score", "chest_temp", "battery", "connected", "wearing_hours_today", "impact_events_today", "alerts_today"]
        for field in required_fields:
            assert field in vest, f"Missing vest field: {field}"
        
        print(f"Vest data: Posture Score={vest['posture_score']}%, Fall Detected={vest['fall_detected']}")
    
    def test_dashboard_summary_has_sleep_data(self):
        """Test that response contains sleep data with required fields"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "sleep" in data, "Missing sleep data"
        sleep = data["sleep"]
        
        # Check required sleep fields
        required_fields = ["duration", "quality", "deep", "light", "rem", "bedtime", "wakeup"]
        for field in required_fields:
            assert field in sleep, f"Missing sleep field: {field}"
        
        print(f"Sleep data: Duration={sleep['duration']}, Quality={sleep['quality']}%")
    
    def test_dashboard_summary_data_values_realistic(self):
        """Verify that simulated data values are within realistic ranges"""
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Heart rate should be between 50-120 bpm
        hr = data["bracelet"]["heart_rate"]
        assert 50 <= hr <= 120, f"Heart rate {hr} outside normal range (50-120)"
        
        # SpO2 should be between 90-100%
        spo2 = data["bracelet"]["spo2"]
        assert 90 <= spo2 <= 100, f"SpO2 {spo2} outside normal range (90-100)"
        
        # Temperature should be between 35-38 C
        temp = data["bracelet"]["temperature"]
        assert 35 <= temp <= 38, f"Temperature {temp} outside normal range (35-38)"
        
        # Weight should be positive
        weight = data["scale"]["weight"]
        assert weight > 0, f"Weight {weight} should be positive"
        
        # BMI should be between 15-40
        bmi = data["scale"]["bmi"]
        assert 15 <= bmi <= 40, f"BMI {bmi} outside reasonable range (15-40)"
        
        print("All vital values are within realistic ranges")


class TestRelatedEndpoints:
    """Tests for related device endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_devices_latest_endpoint(self):
        """Test /api/devices/latest endpoint"""
        response = requests.get(f"{BASE_URL}/api/devices/latest", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("devices/latest endpoint returns 200")
    
    def test_bracelet_status_endpoint(self):
        """Test /api/bracelet/status endpoint"""
        response = requests.get(f"{BASE_URL}/api/bracelet/status", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("bracelet/status endpoint returns 200")
    
    def test_guardians_my_endpoint(self):
        """Test /api/guardians/my endpoint for beneficiary's guardians list"""
        response = requests.get(f"{BASE_URL}/api/guardians/my", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of guardians"
        print(f"Guardians list: {len(data)} guardian(s)")
    
    def test_reminders_endpoint(self):
        """Test /api/reminders endpoint"""
        response = requests.get(f"{BASE_URL}/api/reminders", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("reminders endpoint returns 200")
    
    def test_alerts_active_with_interventions_endpoint(self):
        """Test /api/alerts/active-with-interventions endpoint"""
        response = requests.get(f"{BASE_URL}/api/alerts/active-with-interventions", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of active alerts"
        print(f"Active alerts: {len(data)}")
    
    def test_beneficiary_guardian_requests_endpoint(self):
        """Test /api/beneficiary/guardian-requests endpoint"""
        response = requests.get(f"{BASE_URL}/api/beneficiary/guardian-requests", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of guardian requests"
        print(f"Guardian requests: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
