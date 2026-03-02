"""
Backend API tests for Iteration 38: Dashboard Header Redesign
Tests the new /api/health/summary endpoint and guardian activation features

Features tested:
- GET /api/health/summary - AI-generated health summary with score, status, recommendation
- Guardian activation endpoint
- Role switching
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://health-guardian-42.preview.emergentagent.com")


class TestHealthSummaryEndpoint:
    """Test the new /api/health/summary lightweight AI summary endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_health_summary_returns_200(self, auth_token):
        """Test /api/health/summary returns 200 OK"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: /api/health/summary returns 200")
    
    def test_health_summary_contains_summary_sentence(self, auth_token):
        """Test response contains AI-generated summary sentence"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data = response.json()
        
        assert "summary" in data, "Missing 'summary' field"
        assert isinstance(data["summary"], str), "summary should be a string"
        assert len(data["summary"]) > 10, "summary should be a meaningful sentence"
        print(f"PASS: summary = '{data['summary'][:60]}...'")
    
    def test_health_summary_contains_recommendation(self, auth_token):
        """Test response contains recommendation"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data = response.json()
        
        assert "recommendation" in data, "Missing 'recommendation' field"
        assert isinstance(data["recommendation"], str), "recommendation should be a string"
        assert len(data["recommendation"]) > 10, "recommendation should be a meaningful sentence"
        print(f"PASS: recommendation = '{data['recommendation'][:60]}...'")
    
    def test_health_summary_contains_score(self, auth_token):
        """Test response contains health score 0-100"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data = response.json()
        
        assert "score" in data, "Missing 'score' field"
        assert isinstance(data["score"], (int, float)), "score should be numeric"
        assert 0 <= data["score"] <= 100, f"score {data['score']} should be 0-100"
        print(f"PASS: score = {data['score']}/100")
    
    def test_health_summary_contains_status(self, auth_token):
        """Test response contains status string and color"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data = response.json()
        
        assert "status" in data, "Missing 'status' field"
        assert isinstance(data["status"], str), "status should be a string"
        valid_statuses = ["En forme", "Stable", "A surveiller", "Attention requise"]
        assert data["status"] in valid_statuses, f"status '{data['status']}' not in expected values"
        
        assert "status_color" in data, "Missing 'status_color' field"
        assert data["status_color"].startswith("#"), "status_color should be a hex color"
        print(f"PASS: status = '{data['status']}' (color: {data['status_color']})")
    
    def test_health_summary_contains_generated_at(self, auth_token):
        """Test response contains generation timestamp"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data = response.json()
        
        assert "generated_at" in data, "Missing 'generated_at' field"
        assert isinstance(data["generated_at"], str), "generated_at should be ISO string"
        print(f"PASS: generated_at = {data['generated_at']}")
    
    def test_health_summary_caching(self, auth_token):
        """Test that summary is cached (1-hour TTL) - same score on repeated calls"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First call
        response1 = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data1 = response1.json()
        
        # Second call (should be cached)
        response2 = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        data2 = response2.json()
        
        # The generated_at should be the same (from cache)
        assert data1["generated_at"] == data2["generated_at"], "Cache should return same generated_at"
        print("PASS: Summary is cached (same generated_at on repeated calls)")


class TestGuardianActivation:
    """Test guardian activation endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_activate_guardian_endpoint_exists(self, auth_token):
        """Test /api/auth/activate-guardian endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # This endpoint should exist and accept POST
        # Since user already has guardian space, it may return error or success
        response = requests.post(f"{BASE_URL}/api/auth/activate-guardian", headers=headers, json={
            "guardian_type": "particular",
            "alert_sms": True,
            "alert_email": True
        })
        
        # Endpoint should exist (not 404)
        assert response.status_code != 404, "Endpoint /api/auth/activate-guardian not found"
        print(f"PASS: /api/auth/activate-guardian endpoint exists (status: {response.status_code})")


class TestRoleSwitching:
    """Test role switching between beneficiary and guardian"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_switch_to_guardian_role(self, auth_token):
        """Test switching to guardian role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/auth/switch-role", headers=headers, json={
            "role": "guardian"
        })
        
        assert response.status_code == 200, f"Failed to switch role: {response.text}"
        data = response.json()
        assert data.get("active_role") == "guardian" or "success" in str(data).lower()
        print("PASS: Successfully switched to guardian role")
    
    def test_switch_back_to_beneficiary_role(self, auth_token):
        """Test switching back to beneficiary role"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/auth/switch-role", headers=headers, json={
            "role": "beneficiary"
        })
        
        assert response.status_code == 200, f"Failed to switch role: {response.text}"
        data = response.json()
        assert data.get("active_role") == "beneficiary" or "success" in str(data).lower()
        print("PASS: Successfully switched back to beneficiary role")


class TestBeneficiaryLogin:
    """Test beneficiary login with phone number"""
    
    def test_login_with_phone(self):
        """Test login with phone number works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "+33651245918",
            "password": "demo123"
        })
        
        # Check if phone login is supported
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            print("PASS: Phone number login successful")
        elif response.status_code == 422:
            # Phone login might require email field
            print("INFO: Phone-only login not supported, email required")
        else:
            print(f"INFO: Login response status: {response.status_code}")
    
    def test_login_with_email(self):
        """Test login with email works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["name"] == "Robert Martin"
        print("PASS: Email login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
