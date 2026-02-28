"""
Iteration 10 - Test new backend endpoints:
1. GET /api/alerts/{id}/detail - Full alert detail with beneficiary, escalations, calls, interventions
2. GET /api/teleassistance/subscriber/{id} - Full subscriber detail with stats, guardians, alerts, readings
3. POST /api/twilio/call/guardian - Trigger call to guardian (returns error if Twilio not configured)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://chutex-care-preview.preview.emergentagent.com')


class TestNewEndpointsIteration10:
    """Tests for the 3 new endpoints added in iteration 10"""
    
    @pytest.fixture(scope="class")
    def teleassistance_token(self):
        """Get teleassistance user token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "plateau@chutex.fr",
            "password": "demo123"
        })
        assert res.status_code == 200, f"Failed to login: {res.text}"
        return res.json()["token"]
    
    @pytest.fixture(scope="class")
    def sample_alert_id(self, teleassistance_token):
        """Get a sample alert ID for testing"""
        res = requests.get(f"{BASE_URL}/api/alerts",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        assert res.status_code == 200
        alerts = res.json()
        if alerts:
            return alerts[0]["id"]
        return None
    
    @pytest.fixture(scope="class")
    def sample_subscriber_id(self, teleassistance_token):
        """Get a sample subscriber ID for testing"""
        res = requests.get(f"{BASE_URL}/api/teleassistance/subscribers",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        assert res.status_code == 200
        subscribers = res.json()
        if subscribers:
            return subscribers[0]["id"]
        return None

    # ========== ENDPOINT 1: GET /api/alerts/{id}/detail ==========
    def test_alert_detail_success(self, teleassistance_token, sample_alert_id):
        """Test GET /api/alerts/{id}/detail returns full alert data"""
        if not sample_alert_id:
            pytest.skip("No alerts in database")
        
        res = requests.get(f"{BASE_URL}/api/alerts/{sample_alert_id}/detail",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Verify response structure
        assert "alert" in data, "Response missing 'alert' field"
        assert "beneficiary" in data, "Response missing 'beneficiary' field"
        assert "guardians" in data, "Response missing 'guardians' field"
        assert "escalations" in data, "Response missing 'escalations' field"
        assert "calls" in data, "Response missing 'calls' field"
        assert "interventions" in data, "Response missing 'interventions' field"
        assert "timeline" in data, "Response missing 'timeline' field"
        
        # Verify alert data
        alert = data["alert"]
        assert "id" in alert
        assert "alert_type" in alert
        assert "severity" in alert
        assert "status" in alert
        
        # Verify beneficiary has medical info fields
        ben = data["beneficiary"]
        if ben:
            assert "name" in ben
            assert "email" in ben
            # New fields added in iteration 10
            assert "blood_type" in ben or ben.get("blood_type") is not None
            
    def test_alert_detail_not_found(self, teleassistance_token):
        """Test GET /api/alerts/{id}/detail returns 404 for non-existent alert"""
        res = requests.get(f"{BASE_URL}/api/alerts/nonexistent-alert-id/detail",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        assert res.status_code == 404
        
    def test_alert_detail_unauthorized(self):
        """Test GET /api/alerts/{id}/detail requires authentication"""
        res = requests.get(f"{BASE_URL}/api/alerts/any-id/detail")
        assert res.status_code == 401

    # ========== ENDPOINT 2: GET /api/teleassistance/subscriber/{id} ==========
    def test_subscriber_detail_success(self, teleassistance_token, sample_subscriber_id):
        """Test GET /api/teleassistance/subscriber/{id} returns full subscriber data"""
        if not sample_subscriber_id:
            pytest.skip("No subscribers in database")
        
        res = requests.get(f"{BASE_URL}/api/teleassistance/subscriber/{sample_subscriber_id}",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Verify response structure
        assert "user" in data, "Response missing 'user' field"
        assert "alerts" in data, "Response missing 'alerts' field"
        assert "escalations" in data, "Response missing 'escalations' field"
        assert "calls" in data, "Response missing 'calls' field"
        assert "interventions" in data, "Response missing 'interventions' field"
        assert "latest_readings" in data, "Response missing 'latest_readings' field"
        assert "guardians" in data, "Response missing 'guardians' field"
        assert "stats" in data, "Response missing 'stats' field"
        
        # Verify stats structure
        stats = data["stats"]
        assert "active_alerts" in stats
        assert "total_alerts" in stats
        assert "total_escalations" in stats
        assert "total_interventions" in stats
        
        # Verify user data
        user = data["user"]
        assert "id" in user
        assert "name" in user
        assert "email" in user
        
    def test_subscriber_detail_not_found(self, teleassistance_token):
        """Test GET /api/teleassistance/subscriber/{id} returns 404 for non-existent subscriber"""
        res = requests.get(f"{BASE_URL}/api/teleassistance/subscriber/nonexistent-id",
                          headers={"Authorization": f"Bearer {teleassistance_token}"})
        assert res.status_code == 404
        
    def test_subscriber_detail_unauthorized(self):
        """Test GET /api/teleassistance/subscriber/{id} requires authentication"""
        res = requests.get(f"{BASE_URL}/api/teleassistance/subscriber/any-id")
        assert res.status_code == 401

    # ========== ENDPOINT 3: POST /api/twilio/call/guardian ==========
    def test_twilio_call_guardian_endpoint_exists(self, teleassistance_token):
        """Test POST /api/twilio/call/guardian endpoint exists (not 404)"""
        res = requests.post(f"{BASE_URL}/api/twilio/call/guardian",
                           headers={"Authorization": f"Bearer {teleassistance_token}",
                                   "Content-Type": "application/json"},
                           json={"alert_id": "test", "guardian_id": "test"})
        
        # Should NOT be 404 - endpoint should exist
        assert res.status_code != 404, "Endpoint /api/twilio/call/guardian should exist"
        # Should be 400 (no phone) or 500 (Twilio not configured) or 200 (call initiated)
        assert res.status_code in [200, 400, 500], f"Unexpected status: {res.status_code}"
        
    def test_twilio_call_guardian_no_phone(self, teleassistance_token):
        """Test POST /api/twilio/call/guardian returns 400 when no phone provided"""
        res = requests.post(f"{BASE_URL}/api/twilio/call/guardian",
                           headers={"Authorization": f"Bearer {teleassistance_token}",
                                   "Content-Type": "application/json"},
                           json={"alert_id": "test-alert", "guardian_id": "test-guardian"})
        
        # Without phone number and nonexistent guardian, should return 400
        assert res.status_code in [400, 500], f"Expected 400/500, got {res.status_code}"
        
    def test_twilio_call_guardian_unauthorized(self):
        """Test POST /api/twilio/call/guardian requires authentication"""
        res = requests.post(f"{BASE_URL}/api/twilio/call/guardian",
                           json={"alert_id": "test", "guardian_id": "test"})
        assert res.status_code == 401


class TestExistingEndpointsStillWork:
    """Verify that previously working endpoints still function"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin user token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Get beneficiary user token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    @pytest.fixture(scope="class")
    def guardian_token(self):
        """Get guardian user token"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    def test_login_beneficiary(self):
        """Test login still works for beneficiary"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["role"] == "beneficiary"
        
    def test_login_guardian(self):
        """Test login still works for guardian"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["role"] == "guardian"
        
    def test_login_admin(self):
        """Test login still works for admin"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        
    def test_login_teleassistance(self):
        """Test login still works for teleassistance"""
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "plateau@chutex.fr",
            "password": "demo123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["role"] == "teleassistance"
        
    def test_alerts_endpoint(self, admin_token):
        """Test alerts endpoint still works"""
        res = requests.get(f"{BASE_URL}/api/alerts",
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        
    def test_backoffice_stats(self, admin_token):
        """Test backoffice stats endpoint still works"""
        res = requests.get(f"{BASE_URL}/api/backoffice/stats",
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        
    def test_guardian_beneficiaries(self, guardian_token):
        """Test guardian beneficiaries endpoint still works"""
        res = requests.get(f"{BASE_URL}/api/guardian/beneficiaries",
                          headers={"Authorization": f"Bearer {guardian_token}"})
        assert res.status_code == 200
        
    def test_activation_codes_list(self, admin_token):
        """Test activation codes list still works"""
        res = requests.get(f"{BASE_URL}/api/admin/activation-codes",
                          headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
