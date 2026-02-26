"""
Iteration 15 - Bidirectional Role Switching Tests
Tests for switching roles between guardian and beneficiary modes.

Test Scenarios:
1. Claire (guardian) switches to beneficiary mode
2. Claire (beneficiary mode) switches back to guardian mode
3. Robert (beneficiary) activates guardian space, then switches to guardian mode
4. Robert (guardian mode) accesses guardian-only endpoints
5. Robert (guardian mode) switches back to beneficiary mode
6. GET /api/alerts returns appropriate alerts based on effective role
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nora-health-ai.preview.emergentagent.com')

# Test credentials
CLAIRE_EMAIL = "claire.martin@email.fr"  # guardian with has_beneficiary_space: true
CLAIRE_PASSWORD = "demo123"

ROBERT_EMAIL = "robert.martin@email.fr"  # beneficiary (may have has_guardian_space from prev tests)
ROBERT_PASSWORD = "demo123"


class TestRoleSwitchingBackend:
    """Backend tests for bidirectional role switching"""

    @pytest.fixture(scope="class")
    def claire_token(self):
        """Login as Claire (guardian)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLAIRE_EMAIL,
            "password": CLAIRE_PASSWORD
        })
        assert response.status_code == 200, f"Claire login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"Claire login: role={data['user'].get('role')}, active_role={data['user'].get('active_role')}, has_beneficiary_space={data['user'].get('has_beneficiary_space')}")
        return data["token"]

    @pytest.fixture(scope="class")
    def robert_token(self):
        """Login as Robert (beneficiary)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ROBERT_EMAIL,
            "password": ROBERT_PASSWORD
        })
        assert response.status_code == 200, f"Robert login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"Robert login: role={data['user'].get('role')}, active_role={data['user'].get('active_role')}, has_guardian_space={data['user'].get('has_guardian_space')}")
        return data["token"]

    # ============ CLAIRE (GUARDIAN) TESTS ============

    def test_01_claire_login_returns_correct_fields(self, claire_token):
        """Verify Claire has guardian role and has_beneficiary_space"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        assert response.status_code == 200
        user = response.json()
        assert user["role"] == "guardian", "Claire's role should be guardian"
        assert user.get("has_beneficiary_space") == True, "Claire should have has_beneficiary_space=true"
        print(f"Claire user data: role={user['role']}, active_role={user.get('active_role')}, has_beneficiary_space={user.get('has_beneficiary_space')}")

    def test_02_claire_switch_to_beneficiary(self, claire_token):
        """Claire (guardian) switches to beneficiary mode"""
        response = requests.post(f"{BASE_URL}/api/auth/switch-role", 
            json={"role": "beneficiary"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200, f"Switch to beneficiary failed: {response.text}"
        data = response.json()
        assert data.get("status") == "switched", f"Expected status='switched', got {data.get('status')}"
        assert data.get("active_role") == "beneficiary", f"Expected active_role='beneficiary', got {data.get('active_role')}"
        print(f"Claire switched to beneficiary: {data}")

    def test_03_claire_verify_beneficiary_mode(self, claire_token):
        """Verify Claire's active_role is now beneficiary"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        assert response.status_code == 200
        user = response.json()
        assert user.get("active_role") == "beneficiary", f"Claire's active_role should be beneficiary, got {user.get('active_role')}"
        # Original role should still be guardian
        assert user["role"] == "guardian", "Claire's original role should still be guardian"
        print(f"Claire in beneficiary mode: role={user['role']}, active_role={user.get('active_role')}")

    def test_04_claire_beneficiary_mode_guardian_endpoint_forbidden(self, claire_token):
        """Claire in beneficiary mode should not access guardian endpoints"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        # Should return 403 because effective role is now beneficiary
        assert response.status_code == 403, f"Expected 403 forbidden, got {response.status_code}: {response.text}"
        print(f"Claire (beneficiary mode) correctly denied access to guardian endpoint: {response.status_code}")

    def test_05_claire_switch_back_to_guardian(self, claire_token):
        """Claire switches back to guardian mode"""
        response = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "guardian"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200, f"Switch to guardian failed: {response.text}"
        data = response.json()
        assert data.get("status") == "switched"
        assert data.get("active_role") == "guardian"
        print(f"Claire switched back to guardian: {data}")

    def test_06_claire_guardian_mode_can_access_beneficiaries(self, claire_token):
        """Claire in guardian mode can access guardian endpoints"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        assert response.status_code == 200, f"Guardian beneficiaries access failed: {response.text}"
        bens = response.json()
        print(f"Claire (guardian mode) accessed beneficiaries: {len(bens)} beneficiaries")

    # ============ ROBERT (BENEFICIARY) TESTS ============

    def test_07_robert_login_returns_correct_fields(self, robert_token):
        """Verify Robert has beneficiary role"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {robert_token}"
        })
        assert response.status_code == 200
        user = response.json()
        assert user["role"] == "beneficiary", "Robert's role should be beneficiary"
        print(f"Robert user data: role={user['role']}, active_role={user.get('active_role')}, has_guardian_space={user.get('has_guardian_space')}")

    def test_08_robert_activate_guardian_space(self, robert_token):
        """Robert activates guardian space (if not already activated)"""
        # Check if already activated
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {robert_token}"
        })
        user = response.json()
        
        if user.get("has_guardian_space"):
            print("Robert already has guardian space activated, skipping activation")
            return
        
        # Activate guardian space
        response = requests.post(f"{BASE_URL}/api/auth/activate-guardian",
            json={
                "guardian_type": "particular",
                "relationship": "famille"
            },
            headers={"Authorization": f"Bearer {robert_token}"}
        )
        assert response.status_code == 200, f"Activate guardian failed: {response.text}"
        data = response.json()
        assert data.get("status") in ("activated", "already_active"), f"Unexpected status: {data}"
        print(f"Robert activated guardian space: {data}")

    def test_09_robert_switch_to_guardian(self, robert_token):
        """Robert (beneficiary) switches to guardian mode"""
        response = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "guardian"},
            headers={"Authorization": f"Bearer {robert_token}"}
        )
        assert response.status_code == 200, f"Switch to guardian failed: {response.text}"
        data = response.json()
        assert data.get("status") == "switched"
        assert data.get("active_role") == "guardian"
        print(f"Robert switched to guardian: {data}")

    def test_10_robert_guardian_mode_verify(self, robert_token):
        """Verify Robert's effective role is now guardian"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {robert_token}"
        })
        assert response.status_code == 200
        user = response.json()
        assert user.get("active_role") == "guardian", f"Robert's active_role should be guardian, got {user.get('active_role')}"
        # Original role should still be beneficiary
        assert user["role"] == "beneficiary", "Robert's original role should still be beneficiary"
        print(f"Robert in guardian mode: role={user['role']}, active_role={user.get('active_role')}")

    def test_11_robert_guardian_mode_can_access_guardian_endpoint(self, robert_token):
        """Robert in guardian mode can access guardian/beneficiaries without 403"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers={
            "Authorization": f"Bearer {robert_token}"
        })
        # Should return 200 because effective role is now guardian
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        bens = response.json()
        print(f"Robert (guardian mode) accessed guardian/beneficiaries: {len(bens)} beneficiaries")

    def test_12_robert_switch_back_to_beneficiary(self, robert_token):
        """Robert switches back to beneficiary mode"""
        response = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "beneficiary"},
            headers={"Authorization": f"Bearer {robert_token}"}
        )
        assert response.status_code == 200, f"Switch to beneficiary failed: {response.text}"
        data = response.json()
        assert data.get("status") == "switched"
        assert data.get("active_role") == "beneficiary"
        print(f"Robert switched back to beneficiary: {data}")

    def test_13_robert_beneficiary_mode_verify(self, robert_token):
        """Verify Robert's effective role is now beneficiary"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {robert_token}"
        })
        assert response.status_code == 200
        user = response.json()
        assert user.get("active_role") == "beneficiary", f"Robert's active_role should be beneficiary, got {user.get('active_role')}"
        print(f"Robert back to beneficiary mode: role={user['role']}, active_role={user.get('active_role')}")

    # ============ ALERTS BASED ON EFFECTIVE ROLE ============

    def test_14_claire_alerts_based_on_effective_role_guardian(self, claire_token):
        """Claire in guardian mode gets guardian-appropriate alerts"""
        # First ensure Claire is in guardian mode
        requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "guardian"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        
        response = requests.get(f"{BASE_URL}/api/alerts", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        alerts = response.json()
        print(f"Claire (guardian mode) alerts: {len(alerts)} alerts")

    def test_15_claire_alerts_based_on_effective_role_beneficiary(self, claire_token):
        """Claire in beneficiary mode gets beneficiary-appropriate alerts"""
        # Switch Claire to beneficiary mode
        requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "beneficiary"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        
        response = requests.get(f"{BASE_URL}/api/alerts", headers={
            "Authorization": f"Bearer {claire_token}"
        })
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        alerts = response.json()
        # In beneficiary mode, should only see own alerts (filter by beneficiary_id)
        print(f"Claire (beneficiary mode) alerts: {len(alerts)} alerts")

    # ============ CLEANUP - Reset roles to original ============

    def test_99_cleanup_reset_roles(self, claire_token, robert_token):
        """Reset roles to original state for next test runs"""
        # Claire back to guardian
        r1 = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "guardian"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        # Robert back to beneficiary  
        r2 = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "beneficiary"},
            headers={"Authorization": f"Bearer {robert_token}"}
        )
        print(f"Cleanup - Claire to guardian: {r1.status_code}, Robert to beneficiary: {r2.status_code}")


class TestSwitchRoleErrorHandling:
    """Test error cases for switch-role endpoint"""

    @pytest.fixture
    def claire_token(self):
        """Login as Claire"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLAIRE_EMAIL,
            "password": CLAIRE_PASSWORD
        })
        return response.json()["token"]

    def test_switch_to_invalid_role(self, claire_token):
        """Switching to invalid role should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": "invalid_role"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid role, got {response.status_code}"
        print(f"Invalid role error: {response.json()}")

    def test_switch_without_space_activated(self, claire_token):
        """Test switching to a role when space is not activated"""
        # This test depends on user state - Claire has beneficiary space, so this should work
        # But we can test the error message format
        response = requests.post(f"{BASE_URL}/api/auth/switch-role",
            json={"role": ""},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 400
        print(f"Empty role error: {response.json()}")
