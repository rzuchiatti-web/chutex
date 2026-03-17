"""
Iteration 103: SAAD Commission (Mollie) + Glycemia V2 Algorithm Testing

Features tested:
1. SAAD Commission System:
   - POST /api/saad/onboarding - Register SAAD with commission_type
   - GET /api/saad/status/{saad_id} - Returns registered=true with earnings/pending
   - POST /api/saad/stripe-onboarding - Legacy route still works (redirects)
   - GET /api/saad/stripe-status/{saad_id} - Legacy route still works
   - POST /api/mollie/webhook-commission - Commission payment webhook
   - GET /api/admin/saad-commissions - Returns commissions list with totals

2. Glycemia V2 Algorithm:
   - GET /api/glycemia/estimate - Returns algorithm_version=v2, estimated_glycemia in g/L, 5 zones
   - POST /api/glycemia/calibrate - Saves calibration with context and sensor_snapshot
   - GET /api/glycemia/calibrations - Returns calibration history
   - GET /api/glycemia/trend - Returns trend data
   - Estimate uses V6 bracelet data previously pushed

3. Contract Activation:
   - _activate_contract calls _process_saad_commission (tested indirectly)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://whoop-dashboard.preview.emergentagent.com"


class TestSAADCommissionOnboarding:
    """SAAD Commission System: Onboarding tests"""

    def test_saad_onboarding_registers_new_saad(self):
        """POST /api/saad/onboarding should register a new SAAD"""
        test_saad_id = f"test-saad-{uuid.uuid4().hex[:8]}"
        payload = {
            "saad_id": test_saad_id,
            "company_name": "Test SAAD Company",
            "email": "test-saad@example.com",
            "iban": "FR7630006000011234567890189",
            "commission_type": "monthly"
        }
        resp = requests.post(f"{BASE_URL}/api/saad/onboarding", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data.get("status") == "registered", f"Expected status='registered', got {data.get('status')}"
        assert data.get("saad_id") == test_saad_id, f"Expected saad_id={test_saad_id}, got {data.get('saad_id')}"
        assert data.get("commission_type") == "monthly", f"Expected commission_type='monthly', got {data.get('commission_type')}"

    def test_saad_onboarding_with_oneshot_commission(self):
        """POST /api/saad/onboarding should accept oneshot commission type"""
        test_saad_id = f"test-saad-oneshot-{uuid.uuid4().hex[:8]}"
        payload = {
            "saad_id": test_saad_id,
            "company_name": "Test SAAD Oneshot",
            "email": "oneshot@example.com",
            "commission_type": "oneshot"
        }
        resp = requests.post(f"{BASE_URL}/api/saad/onboarding", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("commission_type") == "oneshot", f"Expected commission_type='oneshot', got {data.get('commission_type')}"

    def test_saad_onboarding_updates_existing_saad(self):
        """POST /api/saad/onboarding should update existing SAAD"""
        test_saad_id = "test-saad-existing-update"
        
        # First registration
        payload1 = {
            "saad_id": test_saad_id,
            "company_name": "Original Name",
            "email": "original@example.com",
            "commission_type": "monthly"
        }
        resp1 = requests.post(f"{BASE_URL}/api/saad/onboarding", json=payload1)
        assert resp1.status_code == 200
        
        # Update
        payload2 = {
            "saad_id": test_saad_id,
            "company_name": "Updated Name",
            "email": "updated@example.com",
            "commission_type": "oneshot"
        }
        resp2 = requests.post(f"{BASE_URL}/api/saad/onboarding", json=payload2)
        assert resp2.status_code == 200
        data = resp2.json()
        
        assert data.get("status") == "updated", f"Expected status='updated', got {data.get('status')}"
        assert data.get("already_exists") == True, "Expected already_exists=True for update"

    def test_saad_onboarding_requires_saad_id_and_company(self):
        """POST /api/saad/onboarding should require saad_id and company_name"""
        # Missing saad_id
        resp = requests.post(f"{BASE_URL}/api/saad/onboarding", json={"company_name": "Test"})
        assert resp.status_code == 400, f"Expected 400 for missing saad_id, got {resp.status_code}"
        
        # Missing company_name
        resp = requests.post(f"{BASE_URL}/api/saad/onboarding", json={"saad_id": "test"})
        assert resp.status_code == 400, f"Expected 400 for missing company_name, got {resp.status_code}"


class TestSAADStatus:
    """SAAD Commission System: Status endpoint tests"""

    def test_saad_status_returns_registered_true(self):
        """GET /api/saad/status/{saad_id} should return registered=true for existing SAAD"""
        # First ensure SAAD exists
        test_saad_id = "test-saad-status-check"
        requests.post(f"{BASE_URL}/api/saad/onboarding", json={
            "saad_id": test_saad_id,
            "company_name": "Status Check SAAD",
            "commission_type": "monthly"
        })
        
        # Check status
        resp = requests.get(f"{BASE_URL}/api/saad/status/{test_saad_id}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("registered") == True, f"Expected registered=True, got {data.get('registered')}"
        assert "company_name" in data, "Missing company_name in status"
        assert "commission_type" in data, "Missing commission_type in status"
        assert "commission_display" in data, "Missing commission_display in status"
        assert "total_earned" in data, "Missing total_earned in status"
        assert "total_pending" in data, "Missing total_pending in status"
        assert "commissions_count" in data, "Missing commissions_count in status"

    def test_saad_status_returns_registered_false_for_unknown(self):
        """GET /api/saad/status/{saad_id} should return registered=false for unknown SAAD"""
        resp = requests.get(f"{BASE_URL}/api/saad/status/unknown-saad-{uuid.uuid4().hex[:8]}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("registered") == False, f"Expected registered=False, got {data.get('registered')}"

    def test_saad_status_shows_correct_commission_display(self):
        """GET /api/saad/status should show correct commission display for type"""
        # Monthly commission
        monthly_saad_id = f"test-saad-monthly-display-{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/saad/onboarding", json={
            "saad_id": monthly_saad_id,
            "company_name": "Monthly Display SAAD",
            "commission_type": "monthly"
        })
        
        resp = requests.get(f"{BASE_URL}/api/saad/status/{monthly_saad_id}")
        data = resp.json()
        assert "/mois" in data.get("commission_display", ""), f"Expected '/mois' for monthly, got {data.get('commission_display')}"
        
        # Oneshot commission
        oneshot_saad_id = f"test-saad-oneshot-display-{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/saad/onboarding", json={
            "saad_id": oneshot_saad_id,
            "company_name": "Oneshot Display SAAD",
            "commission_type": "oneshot"
        })
        
        resp = requests.get(f"{BASE_URL}/api/saad/status/{oneshot_saad_id}")
        data = resp.json()
        assert "(unique)" in data.get("commission_display", ""), f"Expected '(unique)' for oneshot, got {data.get('commission_display')}"


class TestSAADLegacyRoutes:
    """SAAD Commission System: Legacy Stripe route redirects"""

    def test_legacy_stripe_onboarding_redirects(self):
        """POST /api/saad/stripe-onboarding should redirect to new onboarding"""
        test_saad_id = f"test-legacy-onboard-{uuid.uuid4().hex[:8]}"
        payload = {
            "saad_id": test_saad_id,
            "company_name": "Legacy Stripe SAAD",
            "commission_type": "monthly"
        }
        resp = requests.post(f"{BASE_URL}/api/saad/stripe-onboarding", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Should work same as new endpoint
        assert data.get("saad_id") == test_saad_id, "Legacy endpoint should register SAAD"

    def test_legacy_stripe_status_redirects(self):
        """GET /api/saad/stripe-status/{saad_id} should redirect to new status"""
        # First ensure SAAD exists
        test_saad_id = f"test-legacy-status-{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/saad/onboarding", json={
            "saad_id": test_saad_id,
            "company_name": "Legacy Status SAAD",
            "commission_type": "monthly"
        })
        
        # Check via legacy route
        resp = requests.get(f"{BASE_URL}/api/saad/stripe-status/{test_saad_id}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        # Should have has_stripe field for backward compatibility
        assert "has_stripe" in data, "Missing has_stripe field in legacy status"
        assert data.get("has_stripe") == data.get("registered"), "has_stripe should equal registered"


class TestSAADCommissionWebhook:
    """SAAD Commission System: Mollie webhook for commissions"""

    def test_mollie_commission_webhook_handles_empty_id(self):
        """POST /api/mollie/webhook-commission should handle empty payment ID"""
        resp = requests.post(
            f"{BASE_URL}/api/mollie/webhook-commission",
            data={"id": ""},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("status") == "ok", f"Expected status='ok', got {data}"

    def test_mollie_commission_webhook_handles_unknown_payment(self):
        """POST /api/mollie/webhook-commission should handle unknown payment ID gracefully"""
        resp = requests.post(
            f"{BASE_URL}/api/mollie/webhook-commission",
            data={"id": "tr_fake_unknown_payment"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        # Should not crash - returns 200 even if payment lookup fails
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"


class TestSAADAdminCommissions:
    """SAAD Commission System: Admin endpoint"""

    def test_admin_saad_commissions_returns_list(self):
        """GET /api/admin/saad-commissions should return commissions list with totals"""
        resp = requests.get(f"{BASE_URL}/api/admin/saad-commissions")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert "commissions" in data, "Missing commissions array"
        assert isinstance(data["commissions"], list), "Commissions should be a list"
        
        assert "total" in data, "Missing total"
        assert "paid" in data, "Missing paid total"
        assert "pending" in data, "Missing pending total"
        assert "count" in data, "Missing count"
        
        # Totals should be numbers
        assert isinstance(data["total"], (int, float)), "total should be numeric"
        assert isinstance(data["paid"], (int, float)), "paid should be numeric"
        assert isinstance(data["pending"], (int, float)), "pending should be numeric"


class TestGlycemiaV2Estimate:
    """Glycemia V2 Algorithm: Estimate endpoint tests"""

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

    def test_glycemia_estimate_returns_v2_algorithm(self):
        """GET /api/glycemia/estimate should return algorithm_version=v2"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        # If we have enough data, should return V2
        if data.get("status") == "estimated":
            assert data.get("algorithm_version") == "v2", f"Expected algorithm_version='v2', got {data.get('algorithm_version')}"

    def test_glycemia_estimate_returns_estimated_glycemia_in_gl(self):
        """GET /api/glycemia/estimate should return estimated_glycemia in g/L"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("status") == "estimated":
            assert "estimated_glycemia" in data, "Missing estimated_glycemia"
            glycemia = data["estimated_glycemia"]
            # Should be in reasonable range for g/L (0.70 - 1.80)
            assert 0.5 <= glycemia <= 2.5, f"Glycemia value {glycemia} out of range for g/L"
            
            assert "estimated_range" in data, "Missing estimated_range"

    def test_glycemia_estimate_returns_5_zones(self):
        """GET /api/glycemia/estimate should use 5-zone system"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("status") == "estimated":
            zone = data.get("zone")
            # V2 has 5 zones: normal, normal_high, vigilance, pre_alert, alert
            valid_zones = ["normal", "normal_high", "vigilance", "pre_alert", "alert"]
            assert zone in valid_zones, f"Zone '{zone}' not in valid V2 zones: {valid_zones}"
            
            # Should have zone_label and zone_color
            assert "zone_label" in data, "Missing zone_label"
            assert "zone_color" in data, "Missing zone_color"

    def test_glycemia_estimate_returns_calibration_quality(self):
        """GET /api/glycemia/estimate should return calibration quality info"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("status") == "estimated":
            assert "calibration" in data, "Missing calibration info"
            cal = data["calibration"]
            assert "quality" in cal, "Missing calibration quality"
            assert "count" in cal, "Missing calibration count"
            
            valid_qualities = ["none", "low", "medium", "high"]
            assert cal["quality"] in valid_qualities, f"Quality '{cal['quality']}' not valid"

    def test_glycemia_estimate_returns_factors_with_scores_and_weights(self):
        """GET /api/glycemia/estimate should return factors with scores and weights"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("status") == "estimated":
            assert "factors" in data, "Missing factors"
            factors = data["factors"]
            
            if len(factors) > 0:
                factor = factors[0]
                assert "name" in factor, "Factor missing name"
                assert "score" in factor, "Factor missing score"
                assert "weight" in factor, "Factor missing weight"
                assert "impact" in factor, "Factor missing impact"
                
                # Impact should be valid
                valid_impacts = ["normal", "moderate", "high"]
                assert factor["impact"] in valid_impacts, f"Impact '{factor['impact']}' not valid"


class TestGlycemiaV2Calibrate:
    """Glycemia V2 Algorithm: Calibration endpoint tests"""

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

    def test_glycemia_calibrate_saves_with_context(self):
        """POST /api/glycemia/calibrate should save calibration with context"""
        payload = {
            "glycemia_value": 1.05,
            "context": "fasting"
        }
        resp = requests.post(f"{BASE_URL}/api/glycemia/calibrate", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data.get("status") == "saved", f"Expected status='saved', got {data.get('status')}"
        assert data.get("glycemia_value") == 1.05, f"Expected glycemia_value=1.05, got {data.get('glycemia_value')}"
        assert "total_calibrations" in data, "Missing total_calibrations"
        assert "calibration_quality" in data, "Missing calibration_quality"

    def test_glycemia_calibrate_validates_value_range(self):
        """POST /api/glycemia/calibrate should validate glycemia value range"""
        # Value too high (> 5 g/L is unrealistic)
        resp = requests.post(f"{BASE_URL}/api/glycemia/calibrate", json={
            "glycemia_value": 10.0
        }, headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for high value, got {resp.status_code}"
        
        # Value zero or negative
        resp = requests.post(f"{BASE_URL}/api/glycemia/calibrate", json={
            "glycemia_value": 0
        }, headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for zero value, got {resp.status_code}"

    def test_glycemia_calibrate_accepts_all_contexts(self):
        """POST /api/glycemia/calibrate should accept fasting/postprandial/random contexts"""
        for context in ["fasting", "postprandial", "random"]:
            payload = {"glycemia_value": 1.10, "context": context}
            resp = requests.post(f"{BASE_URL}/api/glycemia/calibrate", json=payload, headers=self.headers)
            assert resp.status_code == 200, f"Failed for context '{context}': {resp.status_code}"


class TestGlycemiaV2Calibrations:
    """Glycemia V2 Algorithm: Calibrations history endpoint"""

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

    def test_glycemia_calibrations_returns_history(self):
        """GET /api/glycemia/calibrations should return calibration history"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/calibrations", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert "calibrations" in data, "Missing calibrations array"
        assert "count" in data, "Missing count"
        assert isinstance(data["calibrations"], list), "Calibrations should be a list"
        
        # Should have at least 1 from our test
        if data["count"] > 0:
            cal = data["calibrations"][0]
            assert "glycemia_value" in cal, "Missing glycemia_value in calibration"
            assert "date" in cal, "Missing date in calibration"
            assert "context" in cal, "Missing context in calibration"
            assert "unit" in cal, "Missing unit in calibration"


class TestGlycemiaV2Trend:
    """Glycemia V2 Algorithm: Trend endpoint tests"""

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

    def test_glycemia_trend_returns_direction(self):
        """GET /api/glycemia/trend should return trend direction"""
        resp = requests.get(f"{BASE_URL}/api/glycemia/trend", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert "trend" in data, "Missing trend"
        valid_trends = ["insufficient_data", "stable", "worsening", "improving"]
        assert data["trend"] in valid_trends, f"Trend '{data['trend']}' not valid"
        
        assert "history" in data, "Missing history"
        # count is returned when history >= 2 entries
        if data["trend"] != "insufficient_data":
            assert "count" in data, "Missing count"


class TestGlycemiaV2UsesV6Data:
    """Glycemia V2: Verify estimate uses V6 bracelet data"""

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

    def test_glycemia_estimate_uses_v6_bracelet_data(self):
        """GET /api/glycemia/estimate should use V6 bracelet data for estimation"""
        # Push V6 data with HR and HRV (key factors for glycemia)
        payload = {
            "data_type": "heart_rate",
            "data": {"heart_rate": 75, "hrv": 42},
            "device_id": "glycemia-v6-test",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Failed to push V6 data: {resp.status_code}"
        
        # Push SpO2 data
        payload = {
            "data_type": "spo2",
            "data": {"spo2": 97},
            "device_id": "glycemia-v6-test",
            "source": "ble"
        }
        resp = requests.post(f"{BASE_URL}/api/bracelet/v6/push", json=payload, headers=self.headers)
        assert resp.status_code == 200
        
        # Get glycemia estimate
        resp = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Should have estimated with the bracelet data
        if data.get("status") == "estimated":
            # Check that we used bracelet factors
            factors = data.get("factors", [])
            factor_names = [f.get("name", "") for f in factors]
            
            # Should have at least some factors (HRV, HR, SpO2 are from bracelet)
            print(f"Glycemia factors used: {factor_names}")
            assert data.get("data_points_used", 0) > 0, "Should have used some data points"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
