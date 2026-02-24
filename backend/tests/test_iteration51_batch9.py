"""
Iteration 51 - Batch 9 Tests
Tests for: SAAD invitation system, hydration reminders, SAAD account login
Login credentials based on actual seeded accounts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBeneficiaryLogin:
    """Test beneficiary login"""
    
    def test_beneficiary_login_with_email(self):
        """Login with beneficiary email works"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "beneficiary"
        assert data.get("user", {}).get("name") == "Robert Martin"
        print("PASSED: Beneficiary login successful")
        return data.get("token")


class TestAdminLogin:
    """Test admin login"""
    
    def test_admin_login_with_email(self):
        """Login with admin email works"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data.get("user", {}).get("role") == "admin"
        print("PASSED: Admin login successful")
        return data.get("token")


class TestSAADAccountLogin:
    """Test SAAD/prescriber_company account login"""
    
    def test_saad_login_with_email(self):
        """Login with SAAD account email returns prescriber_company role"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@aide-domicile.fr",
            "password": "demo123"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "token" in data, "Response should include token"
        assert data.get("user", {}).get("role") == "prescriber_company", f"Expected role prescriber_company, got {data.get('user', {}).get('role')}"
        assert data.get("user", {}).get("name") == "Marie Dupont", f"Expected name Marie Dupont, got {data.get('user', {}).get('name')}"
        print(f"PASSED: SAAD login successful, role: {data.get('user', {}).get('role')}")
    
    def test_saad_login_returns_structure_info(self):
        """SAAD account should have structure name"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@aide-domicile.fr",
            "password": "demo123"
        })
        assert resp.status_code == 200
        user = resp.json().get("user", {})
        assert user.get("structure_name") == "SAAD Aide a Domicile Loire", f"Expected structure name, got {user.get('structure_name')}"
        assert user.get("is_prescriber") == True, "SAAD should be prescriber"
        print(f"PASSED: SAAD has structure_name: {user.get('structure_name')}")


class TestSAADInvitationSystem:
    """Test SAAD invitation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin to get token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.admin_token = login_resp.json().get("token")
        else:
            pytest.skip("Admin login failed")
    
    def test_saad_invitation_requires_admin(self):
        """POST /api/admin/saad-invitation requires admin auth"""
        # Try without auth
        resp = requests.post(f"{BASE_URL}/api/admin/saad-invitation", json={
            "email": "test@example.com",
            "name": "Test",
            "structure_name": "Test SAAD"
        })
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
        print("PASSED: SAAD invitation requires auth")
    
    def test_saad_invitation_send_success(self):
        """POST /api/admin/saad-invitation with valid data returns success"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/saad-invitation",
            json={
                "email": "testinvite@saad-test.fr",
                "name": "Jean Test",
                "structure_name": "SAAD Test Structure"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("status") == "sent", f"Expected status sent, got {data}"
        assert "token" in data, "Response should include invitation token"
        print(f"PASSED: SAAD invitation sent, token: {data.get('token')}")
    
    def test_saad_invitation_requires_email(self):
        """POST /api/admin/saad-invitation without email returns 400"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/saad-invitation",
            json={
                "name": "Jean Test",
                "structure_name": "SAAD Test Structure"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert resp.status_code == 400, f"Expected 400 for missing email, got {resp.status_code}"
        print("PASSED: SAAD invitation requires email")
    
    def test_get_saad_invitations_list(self):
        """GET /api/admin/saad-invitations returns list"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/saad-invitations",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASSED: Got {len(data)} SAAD invitations")


class TestHydrationReminders:
    """Test hydration reminders for beneficiary"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.user_id = login_resp.json().get("user", {}).get("id")
        else:
            pytest.skip("Beneficiary login failed")
    
    def test_get_reminders_returns_hydration(self):
        """GET /api/reminders returns hydration reminders for Robert Martin"""
        resp = requests.get(
            f"{BASE_URL}/api/reminders",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        
        hydration_reminders = [r for r in data if r.get("type") == "hydration"]
        assert len(hydration_reminders) >= 5, f"Expected at least 5 hydration reminders, got {len(hydration_reminders)}"
        
        # Check time values exist
        for rem in hydration_reminders:
            assert "time" in rem, "Reminder should have time field"
            assert "enabled" in rem, "Reminder should have enabled field"
        
        print(f"PASSED: Found {len(hydration_reminders)} hydration reminders")


class TestHealthDailyReport:
    """Test health daily report for vitals data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            pytest.skip("Beneficiary login failed")
    
    def test_daily_report_returns_vitals(self):
        """GET /api/health/daily-report returns vitals data"""
        resp = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Check required fields for vitals
        report_data = data.get("data", {})
        assert "heart_rate" in report_data, "Report should have heart_rate"
        assert "spo2" in report_data, "Report should have spo2"
        assert "blood_pressure" in report_data, "Report should have blood_pressure"
        assert "temperature" in report_data, "Report should have temperature"
        print(f"PASSED: Daily report returned with heart_rate={report_data.get('heart_rate')}, spo2={report_data.get('spo2')}")


class TestGuardiansAPI:
    """Test guardians endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            pytest.skip("Beneficiary login failed")
    
    def test_get_guardians_returns_list(self):
        """GET /api/guardians/my returns guardian list"""
        resp = requests.get(
            f"{BASE_URL}/api/guardians/my",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        # Robert Martin should have guardians
        assert len(data) > 0, "Should have at least one guardian"
        guardian_names = [g.get("name") for g in data]
        print(f"PASSED: Found guardians: {guardian_names}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
