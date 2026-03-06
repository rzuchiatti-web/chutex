"""
Iteration 53 - Admin Panel Redesign Tests
Tests for admin APIs used by the new AdminHome component with 5 tabs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://dorsi-cushion.preview.emergentagent.com')

class TestAdminAPIs:
    """Admin panel API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user = data["user"]
        assert self.user["role"] == "admin", "User is not admin"
    
    def test_backoffice_stats(self):
        """Test /api/backoffice/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Verify expected fields
        assert "total_users" in data
        assert "beneficiaries" in data
        assert "guardians" in data
        assert "total_alerts" in data
        assert "active_alerts" in data
        assert "interventions" in data
        print(f"Stats: {data['total_users']} users, {data['active_alerts']} active alerts")
    
    def test_backoffice_users(self):
        """Test /api/backoffice/users endpoint - returns all users"""
        response = requests.get(f"{BASE_URL}/api/backoffice/users", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        users = response.json()
        assert isinstance(users, list), "Expected list of users"
        assert len(users) > 0, "Expected at least one user"
        # Verify user has required fields
        user = users[0]
        assert "id" in user
        assert "name" in user
        assert "role" in user
        print(f"Found {len(users)} users")
    
    def test_backoffice_alerts(self):
        """Test /api/backoffice/alerts endpoint"""
        response = requests.get(f"{BASE_URL}/api/backoffice/alerts", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        alerts = response.json()
        assert isinstance(alerts, list), "Expected list of alerts"
        print(f"Found {len(alerts)} alerts")
    
    def test_backoffice_interventions(self):
        """Test /api/backoffice/interventions endpoint"""
        response = requests.get(f"{BASE_URL}/api/backoffice/interventions", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        interventions = response.json()
        assert isinstance(interventions, list), "Expected list of interventions"
        print(f"Found {len(interventions)} interventions")
    
    def test_backoffice_kpi(self):
        """Test /api/backoffice/kpi endpoint"""
        response = requests.get(f"{BASE_URL}/api/backoffice/kpi", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        kpi = response.json()
        # Verify KPI fields
        assert "total_users" in kpi
        assert "total_alerts" in kpi
        assert "total_interventions" in kpi
        assert "users_by_role" in kpi
        print(f"KPI: {kpi.get('avg_resolution_minutes', 'N/A')} min avg resolution")
    
    def test_admin_activation_codes(self):
        """Test /api/admin/activation-codes endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        codes = response.json()
        assert isinstance(codes, list), "Expected list of activation codes"
        print(f"Found {len(codes)} activation codes")
    
    def test_admin_intervention_codes(self):
        """Test /api/admin/intervention-codes endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/intervention-codes", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        codes = response.json()
        assert isinstance(codes, list), "Expected list of intervention codes"
        print(f"Found {len(codes)} intervention codes")
    
    def test_admin_subscriptions(self):
        """Test /api/admin/subscriptions endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/subscriptions", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        subs = response.json()
        assert isinstance(subs, list), "Expected list of subscriptions"
        print(f"Found {len(subs)} subscriptions")
    
    def test_admin_saad_invitations(self):
        """Test /api/admin/saad-invitations endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/saad-invitations", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        invitations = response.json()
        assert isinstance(invitations, list), "Expected list of SAAD invitations"
        print(f"Found {len(invitations)} SAAD invitations")
    
    def test_admin_saad_invitation_create(self):
        """Test POST /api/admin/saad-invitation - create new invitation"""
        import uuid
        test_email = f"test_{uuid.uuid4().hex[:8]}@test-saad.fr"
        response = requests.post(f"{BASE_URL}/api/admin/saad-invitation", 
            headers=self.headers,
            json={
                "email": test_email,
                "name": "TEST_SAAD_User",
                "structure_name": "TEST_SAAD_Structure"
            })
        assert response.status_code == 200 or response.status_code == 201, f"Failed: {response.text}"
        data = response.json()
        assert "token" in data or "id" in data
        print(f"Created SAAD invitation with token/id")


class TestAdminLoginVerification:
    """Verify admin role access"""
    
    def test_admin_login_with_email(self):
        """Test admin login with email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["phone"] == "+33600000001"
    
    def test_admin_login_with_phone(self):
        """Test admin login with phone number"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33600000001",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
