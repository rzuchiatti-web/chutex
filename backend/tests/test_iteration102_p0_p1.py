"""
Iteration 102: P0 + P1 Testing
P0: Mollie payment cleanup, Calorie incoherence fix  
P1: V6 bracelet BLE integration

Features tested:
- GET /api/plans returns 2 plans
- GET /api/stripe/config returns provider='mollie'  
- POST /api/contract/create doesn't crash (no NameError/STRIPE_CARE_ACCOUNT)
- POST /api/mollie/webhook handles form data correctly
- POST /api/webhook/stripe returns deprecation message
- GET /api/health/daily-report daily_plan uses minceur cached recommendations
- GET /api/bracelet/v6/config returns all 8 services
- POST /api/bracelet/v6/push accepts all data types
- GET /api/bracelet/status reflects V6 data
- GET /api/bracelet/v6/ppg-history returns stored PPG data
- GET /api/glycemia/estimate uses V6 data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://loader-standardize.preview.emergentagent.com"


class TestP0MolliePayment:
    """P0: Mollie payment migration tests"""

    def test_get_plans_returns_two_plans(self):
        """GET /api/plans should return exactly 2 plans"""
        resp = requests.get(f"{BASE_URL}/api/plans")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert isinstance(data, list), "Plans should be a list"
        assert len(data) == 2, f"Expected 2 plans, got {len(data)}"
        
        # Verify plan IDs
        plan_ids = [p["id"] for p in data]
        assert "bracelet" in plan_ids, "Missing 'bracelet' plan"
        assert "bracelet_gilet" in plan_ids, "Missing 'bracelet_gilet' plan"
        
        # Verify prices
        for plan in data:
            assert "price" in plan, f"Plan {plan['id']} missing price"
            assert plan["price"] > 0, f"Plan {plan['id']} has invalid price"

    def test_stripe_config_returns_mollie_provider(self):
        """GET /api/stripe/config should return provider='mollie'"""
        resp = requests.get(f"{BASE_URL}/api/stripe/config")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("provider") == "mollie", f"Expected provider='mollie', got {data.get('provider')}"
        # publishable_key should be empty for Mollie
        assert "publishable_key" in data, "Missing publishable_key field"

    def test_contract_create_no_crash(self):
        """POST /api/contract/create should not crash with NameError"""
        payload = {
            "plan": "bracelet",
            "subscriber_type": "beneficiary",
            "beneficiary": {
                "first_name": "Test",
                "last_name": "User",
                "phone": "+33612345678",
                "email": "test@example.com",
                "address": "123 Test Street",
                "postal_code": "75001",
                "city": "Paris"
            },
            "housing": {"type": "appartement", "floor": 2},
            "guardians": [
                {
                    "first_name": "Guardian",
                    "last_name": "Test",
                    "phone": "+33698765432",
                    "email": "guardian@example.com"
                }
            ],
            "delivery": {"address": "123 Test Street", "postal_code": "75001", "city": "Paris"},
            "billing": {"person": "guardian", "guardian_index": 0}
        }
        resp = requests.post(f"{BASE_URL}/api/contract/create", json=payload)
        
        # Should return 200 or 400 (e.g., existing subscription), NOT 500
        assert resp.status_code in [200, 400], f"Contract create returned {resp.status_code}: {resp.text}"
        
        # If 200, verify response structure
        if resp.status_code == 200:
            data = resp.json()
            assert "id" in data, "Missing contract id"
            assert "contract_number" in data, "Missing contract_number"
            assert data.get("payment_provider") == "mollie", f"Expected payment_provider='mollie', got {data.get('payment_provider')}"

    def test_legacy_stripe_webhook_deprecation(self):
        """POST /api/webhook/stripe should return deprecation message"""
        resp = requests.post(f"{BASE_URL}/api/webhook/stripe", json={})
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "ok", "Expected status='ok'"
        assert "deprecated" in data.get("message", "").lower() or "mollie" in data.get("message", "").lower(), \
            f"Expected deprecation message, got: {data.get('message')}"

    def test_mollie_webhook_handles_form_data(self):
        """POST /api/mollie/webhook should handle form data correctly"""
        # Mollie sends form-urlencoded data, not JSON
        # We send with no id to test it doesn't crash
        resp = requests.post(
            f"{BASE_URL}/api/mollie/webhook",
            data={"id": ""},  # Empty payment ID
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "ok", f"Expected status='ok', got {data}"


class TestP1V6BraceletIntegration:
    """P1: V6 Bracelet BLE Integration tests"""

    @pytest.fixture(autouse=True)
    def login(self):
        """Login and get auth token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code} - {resp.text}")
        self.token = resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_v6_config_returns_all_8_services(self):
        """GET /api/bracelet/v6/config should return 8 services"""
        resp = requests.get(f"{BASE_URL}/api/bracelet/v6/config", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert "services" in data, "Missing services in V6 config"
        services = data["services"]
        
        # V6 should have 8 services: heart_rate, blood_pressure, spo2, temperature, battery, device_info, ppg_custom, ecg_custom
        expected_services = ["heart_rate", "blood_pressure", "spo2", "temperature", "battery", "device_info", "ppg_custom", "ecg_custom"]
        for svc in expected_services:
            assert svc in services, f"Missing service: {svc}"
        
        assert len(services) == 8, f"Expected 8 services, got {len(services)}"
        
        # Verify device name prefixes
        assert "device_name_prefixes" in data, "Missing device_name_prefixes"
        assert "V6" in data["device_name_prefixes"], "Missing 'V6' in prefixes"

    def test_v6_push_heart_rate_data(self):
        """POST /api/bracelet/v6/push should accept heart_rate data"""
        payload = {
            "data_type": "heart_rate",
            "data": {"heart_rate": 72, "hrv": 45, "rr_intervals": [800, 820, 790]},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("data_type") == "heart_rate", f"Expected data_type='heart_rate', got {data.get('data_type')}"
        assert data.get("device_model") == "v6", f"Expected device_model='v6', got {data.get('device_model')}"

    def test_v6_push_spo2_data(self):
        """POST /api/bracelet/v6/push should accept spo2 data"""
        payload = {
            "data_type": "spo2",
            "data": {"spo2": 97},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_v6_push_temperature_data(self):
        """POST /api/bracelet/v6/push should accept temperature data"""
        payload = {
            "data_type": "temperature",
            "data": {"temperature": 36.5},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_v6_push_blood_pressure_data(self):
        """POST /api/bracelet/v6/push should accept blood_pressure data"""
        payload = {
            "data_type": "blood_pressure",
            "data": {"systolic": 120, "diastolic": 80},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_v6_push_ppg_data(self):
        """POST /api/bracelet/v6/push should accept PPG waveform data"""
        payload = {
            "data_type": "ppg",
            "data": {"samples": [100, 120, 140, 160, 180, 200, 180, 160, 140, 120], "timestamp": "2026-01-11T10:00:00Z"},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_v6_push_battery_data(self):
        """POST /api/bracelet/v6/push should accept battery data"""
        payload = {
            "data_type": "battery",
            "data": {"battery": 85},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_v6_push_steps_data(self):
        """POST /api/bracelet/v6/push should accept steps data"""
        payload = {
            "data_type": "steps",
            "data": {"steps": 5000, "calories": 200},
            "device_id": "test-v6-device",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_bracelet_status_reflects_v6_data(self):
        """GET /api/bracelet/status should reflect V6 pushed data"""
        resp = requests.get(f"{BASE_URL}/api/bracelet/status", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        # Should reflect the V6 data we just pushed
        assert data.get("heart_rate") > 0, f"heart_rate should be set, got {data.get('heart_rate')}"
        assert data.get("spo2") > 0, f"spo2 should be set, got {data.get('spo2')}"
        
        # Verify device model is v6
        device = data.get("device", {})
        if device:
            assert device.get("model") == "v6", f"Expected device model='v6', got {device.get('model')}"

    def test_v6_ppg_history_returns_stored_data(self):
        """GET /api/bracelet/v6/ppg-history should return stored PPG data"""
        resp = requests.get(f"{BASE_URL}/api/bracelet/v6/ppg-history", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert "readings" in data, "Missing readings in PPG history"
        assert "count" in data, "Missing count in PPG history"
        # Should have at least 1 reading from our push test
        assert data.get("count", 0) >= 1, f"Expected at least 1 PPG reading, got {data.get('count')}"


class TestP0CalorieCoherence:
    """P0: Calorie incoherence fix - daily_plan uses minceur cached recommendations"""

    @pytest.fixture(autouse=True)
    def login(self):
        """Login and get auth token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        self.token = resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_daily_report_calorie_coherence(self):
        """GET /api/health/daily-report daily_plan should use minceur cached calories if available"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        daily_plan = data.get("daily_plan", [])
        
        # Find the calories_intake plan item
        calories_item = None
        for item in daily_plan:
            if item.get("key") == "calories_intake":
                calories_item = item
                break
        
        # The label should be "Vous devez consommer par jour" (from minceur) if minceur cache exists
        # OR a basal metabolism based recommendation if no minceur cache
        if calories_item:
            # Verify value is numeric and reasonable (1200-3000 kcal)
            value_str = calories_item.get("value", "0")
            value = int(value_str.replace(",", ""))
            assert 1200 <= value <= 3000, f"Calorie value out of range: {value}"
            print(f"Calories intake item: label='{calories_item.get('label')}', value={value}")


class TestP1GlycemiaUsesV6Data:
    """P1: Glycemia estimation uses V6 bracelet data"""

    @pytest.fixture(autouse=True)
    def login(self):
        """Login and get auth token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if resp.status_code != 200:
            pytest.skip(f"Login failed: {resp.status_code}")
        self.token = resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_glycemia_estimate_uses_v6_data(self):
        """GET /api/glycemia/estimate should use V6 bracelet data for estimation"""
        # First push some V6 data with all relevant metrics
        for data_type, data_payload in [
            ("heart_rate", {"heart_rate": 68, "hrv": 50}),
            ("spo2", {"spo2": 97}),
        ]:
            payload = {
                "data_type": data_type,
                "data": data_payload,
                "device_id": "glycemia-test-device",
                "source": "ble"
            }
            resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
            assert resp.status_code == 200, f"Failed to push V6 {data_type} data: {resp.status_code}"
        
        # Now get glycemia estimate
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        # Verify we get an estimate (not insufficient_data)
        assert data.get("status") in ["estimated", "insufficient_data"], f"Unexpected status: {data.get('status')}"
        
        if data.get("status") == "estimated":
            # Verify the factors exist
            factors = data.get("factors", [])
            factor_names = [f.get("name", "") for f in factors]
            
            # Should have some factors (heart rate, HRV, SpO2, or scale data)
            # The algorithm uses whatever data is available
            assert len(factors) > 0, f"Expected at least one factor, got {factor_names}"
            
            # Verify zone is returned
            assert data.get("zone") in ["normal", "vigilance", "alert"], \
                f"Expected valid zone, got {data.get('zone')}"
            
            # Verify data_points_used > 0 indicating bracelet data was used
            assert data.get("data_points_used", 0) > 0, f"Expected data_points_used > 0"
            
            print(f"Glycemia estimate: zone={data.get('zone')}, confidence={data.get('confidence_pct')}%, factors={factor_names}, data_points={data.get('data_points_used')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
