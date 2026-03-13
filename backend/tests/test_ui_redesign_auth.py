#!/usr/bin/env python3
"""
Test suite for CHUTEX UI Redesign - Authentication and Role-based Access
Tests all 4 roles: beneficiary, guardian, teleassistance, admin
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nora-navbar-fixes.preview.emergentagent.com')

# Test credentials for all 4 roles
TEST_CREDENTIALS = {
    "beneficiary": {"email": "robert.martin@email.fr", "password": "demo123"},
    "guardian": {"email": "claire.martin@email.fr", "password": "demo123"},
    "teleassistance": {"email": "plateau@chutex.fr", "password": "demo123"},
    "admin": {"email": "admin@chutex.fr", "password": "demo123"},
}


class TestBeneficiaryLogin:
    """Test beneficiary login and profile"""
    
    def test_beneficiary_login_success(self):
        """Test login with beneficiary credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["beneficiary"]
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] == "beneficiary", f"Wrong role: {data['user']['role']}"
        assert data["user"]["email"] == "robert.martin@email.fr"
        assert data["user"]["name"] == "Robert Martin"
        print(f"SUCCESS: Beneficiary login - {data['user']['name']}")
    
    def test_beneficiary_me_endpoint(self):
        """Test /api/auth/me for beneficiary"""
        # Login first
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["beneficiary"]
        )
        token = login_resp.json()["token"]
        
        # Get user profile
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        
        user = response.json()
        assert user["role"] == "beneficiary"
        assert user["email"] == "robert.martin@email.fr"
        print(f"SUCCESS: Beneficiary /me - Role: {user['role']}")


class TestGuardianLogin:
    """Test guardian login and profile"""
    
    def test_guardian_login_success(self):
        """Test login with guardian credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["guardian"]
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "guardian"
        assert data["user"]["email"] == "claire.martin@email.fr"
        print(f"SUCCESS: Guardian login - {data['user']['name']}")
    
    def test_guardian_me_endpoint(self):
        """Test /api/auth/me for guardian"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["guardian"]
        )
        token = login_resp.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        user = response.json()
        assert user["role"] == "guardian"
        print(f"SUCCESS: Guardian /me - is_prescriber: {user.get('is_prescriber', False)}")


class TestTeleassistanceLogin:
    """Test teleassistance login and profile"""
    
    def test_teleassistance_login_success(self):
        """Test login with teleassistance credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["teleassistance"]
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "teleassistance"
        assert data["user"]["email"] == "plateau@chutex.fr"
        print(f"SUCCESS: Teleassistance login - {data['user']['name']}")
    
    def test_teleassistance_me_endpoint(self):
        """Test /api/auth/me for teleassistance"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["teleassistance"]
        )
        token = login_resp.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        user = response.json()
        assert user["role"] == "teleassistance"
        print(f"SUCCESS: Teleassistance /me - Role: {user['role']}")


class TestAdminLogin:
    """Test admin login and profile"""
    
    def test_admin_login_success(self):
        """Test login with admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["admin"]
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@chutex.fr"
        print(f"SUCCESS: Admin login - {data['user']['name']}")
    
    def test_admin_me_endpoint(self):
        """Test /api/auth/me for admin"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["admin"]
        )
        token = login_resp.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        user = response.json()
        assert user["role"] == "admin"
        print(f"SUCCESS: Admin /me - Role: {user['role']}")
    
    def test_admin_backoffice_stats(self):
        """Test admin can access backoffice stats"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["admin"]
        )
        token = login_resp.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/backoffice/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        stats = response.json()
        assert "total_users" in stats
        assert "active_alerts" in stats
        print(f"SUCCESS: Admin backoffice stats - Users: {stats['total_users']}, Alerts: {stats['active_alerts']}")


class TestInvalidLogin:
    """Test invalid login scenarios"""
    
    def test_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "robert.martin@email.fr", "password": "wrongpassword"}
        )
        assert response.status_code == 401, "Should fail with 401"
        print("SUCCESS: Invalid password correctly rejected")
    
    def test_nonexistent_user(self):
        """Test login with non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@email.fr", "password": "demo123"}
        )
        assert response.status_code == 401, "Should fail with 401"
        print("SUCCESS: Non-existent user correctly rejected")


class TestBeneficiaryFeatures:
    """Test beneficiary-specific API endpoints"""
    
    @pytest.fixture
    def beneficiary_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["beneficiary"]
        )
        return response.json()["token"]
    
    def test_get_subscription(self, beneficiary_token):
        """Test beneficiary can get their subscription"""
        response = requests.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        sub = response.json()
        assert "has_subscription" in sub
        print(f"SUCCESS: Subscription - has_subscription: {sub['has_subscription']}, type: {sub.get('subscription_type')}")
    
    def test_get_guardians(self, beneficiary_token):
        """Test beneficiary can get their guardians"""
        response = requests.get(
            f"{BASE_URL}/api/guardians/my",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        guardians = response.json()
        assert isinstance(guardians, list)
        print(f"SUCCESS: Got {len(guardians)} guardians")
    
    def test_get_alerts(self, beneficiary_token):
        """Test beneficiary can get their alerts"""
        response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"SUCCESS: Got {len(alerts)} alerts")
    
    def test_get_devices(self, beneficiary_token):
        """Test beneficiary can get their devices"""
        response = requests.get(
            f"{BASE_URL}/api/devices",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        devices = response.json()
        assert isinstance(devices, list)
        print(f"SUCCESS: Got {len(devices)} devices")


class TestGuardianFeatures:
    """Test guardian-specific API endpoints"""
    
    @pytest.fixture
    def guardian_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_CREDENTIALS["guardian"]
        )
        return response.json()["token"]
    
    def test_get_beneficiaries(self, guardian_token):
        """Test guardian can get their beneficiaries"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        bens = response.json()
        assert isinstance(bens, list)
        print(f"SUCCESS: Guardian has {len(bens)} beneficiaries")
    
    def test_get_prescriptions(self, guardian_token):
        """Test guardian can get their prescriptions"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/prescriptions",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        # May return 403 if not prescriber, or 200 with list
        assert response.status_code in [200, 403]
        
        if response.status_code == 200:
            prescriptions = response.json()
            print(f"SUCCESS: Guardian has {len(prescriptions)} prescriptions")
        else:
            print("SUCCESS: Non-prescriber guardian correctly denied prescription access")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
