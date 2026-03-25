"""
Admin Dashboard API Tests - Iteration 123
Tests for complete admin dashboard overhaul including:
- devices-overview endpoint
- health-overview endpoint
- backoffice stats, users, KPI, alerts, interventions
- admin programs, subscriptions, activation codes, intervention codes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospace-refactor.preview.emergentagent.com')

class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin can login"""
        assert admin_token is not None
        assert len(admin_token) > 0


class TestDevicesOverview:
    """Test GET /api/admin/devices-overview"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_devices_overview_returns_data(self, admin_token):
        """Test devices overview returns devices and summary"""
        response = requests.get(
            f"{BASE_URL}/api/admin/devices-overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "devices" in data
        assert "summary" in data
        assert isinstance(data["devices"], list)
        # Verify summary structure
        summary = data["summary"]
        assert "total" in summary
        assert "bracelets" in summary
        assert "scales" in summary
        assert "connected" in summary
        assert "low_battery" in summary
    
    def test_devices_have_user_info(self, admin_token):
        """Test each device has user name and phone"""
        response = requests.get(
            f"{BASE_URL}/api/admin/devices-overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        if len(data["devices"]) > 0:
            device = data["devices"][0]
            assert "user_name" in device
            assert "user_phone" in device
            assert "device_type" in device


class TestHealthOverview:
    """Test GET /api/admin/health-overview"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_health_overview_returns_beneficiaries(self, admin_token):
        """Test health overview returns beneficiary health data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/health-overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "beneficiaries" in data
        assert isinstance(data["beneficiaries"], list)
    
    def test_beneficiary_has_health_fields(self, admin_token):
        """Test each beneficiary has required health fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/health-overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        if len(data["beneficiaries"]) > 0:
            ben = data["beneficiaries"][0]
            assert "user_id" in ben
            assert "name" in ben
            assert "phone" in ben
            assert "latest_reading" in ben
            assert "latest_glycemia" in ben


class TestBackofficeEndpoints:
    """Test backoffice stats, users, alerts, KPI, analytics"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_backoffice_stats(self, admin_token):
        """Test backoffice stats returns user/alert counts"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "beneficiaries" in data
        assert "guardians" in data
        assert "total_alerts" in data
    
    def test_backoffice_users(self, admin_token):
        """Test backoffice users returns user list"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least admin user exists
        # Verify no password_hash exposed
        if len(data) > 0:
            assert "password_hash" not in data[0]
    
    def test_backoffice_alerts(self, admin_token):
        """Test backoffice alerts returns alert list"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/alerts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_backoffice_interventions(self, admin_token):
        """Test backoffice interventions endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/interventions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_backoffice_kpi(self, admin_token):
        """Test KPI endpoint returns chart data"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/kpi",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "alert_types" in data
        assert "alerts_by_day" in data
        # Verify alerts_by_day is array for chart
        assert isinstance(data["alerts_by_day"], list)
    
    def test_backoffice_analytics(self, admin_token):
        """Test analytics endpoint returns intervention metrics"""
        response = requests.get(
            f"{BASE_URL}/api/backoffice/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_interventions" in data
        assert "resolution_rate" in data
        assert "interventions_by_month" in data


class TestAdminPrograms:
    """Test admin programs endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_admin_programs_list(self, admin_token):
        """Test admin can list all program enrollments"""
        response = requests.get(
            f"{BASE_URL}/api/admin/programs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminSubscriptions:
    """Test subscriptions, SAAD invitations, RGPD, emails endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_admin_subscriptions_list(self, admin_token):
        """Test admin subscriptions list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_saad_invitations(self, admin_token):
        """Test SAAD invitations list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/saad-invitations",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_rgpd_requests(self, admin_token):
        """Test RGPD requests list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/rgpd-requests",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_emails_list(self, admin_token):
        """Test sent emails list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/emails",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminCodes:
    """Test activation and intervention codes endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_activation_codes_list(self, admin_token):
        """Test activation codes list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_intervention_codes_list(self, admin_token):
        """Test intervention codes list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminDocuments:
    """Test admin documents endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_documents_list(self, admin_token):
        """Test documents list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/documents",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert isinstance(data["documents"], list)
    
    def test_document_content(self, admin_token):
        """Test get document content"""
        # First get list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/documents",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        docs = list_response.json()["documents"]
        if len(docs) > 0:
            filename = docs[0]["filename"]
            response = requests.get(
                f"{BASE_URL}/api/admin/documents/{filename}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "content" in data
            assert "filename" in data


class TestUserDetail:
    """Test user detail endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001", "password": "admin123"
        })
        return response.json()["token"]
    
    def test_user_detail(self, admin_token):
        """Test getting user detail with guardians, devices, alerts"""
        # First get users list
        users_response = requests.get(
            f"{BASE_URL}/api/backoffice/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = users_response.json()
        # Find a beneficiary user
        ben = next((u for u in users if u.get("role") == "beneficiary"), None)
        if ben:
            response = requests.get(
                f"{BASE_URL}/api/backoffice/user/{ben['id']}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "user" in data
            assert "guardians" in data
            assert "devices" in data
            assert "alerts" in data


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        return None
    
    def test_non_admin_cannot_access_devices_overview(self, beneficiary_token):
        """Test non-admin gets 403 on devices-overview"""
        if not beneficiary_token:
            pytest.skip("Beneficiary login failed")
        response = requests.get(
            f"{BASE_URL}/api/admin/devices-overview",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 403
    
    def test_non_admin_cannot_access_health_overview(self, beneficiary_token):
        """Test non-admin gets 403 on health-overview"""
        if not beneficiary_token:
            pytest.skip("Beneficiary login failed")
        response = requests.get(
            f"{BASE_URL}/api/admin/health-overview",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 403
    
    def test_non_admin_cannot_access_programs(self, beneficiary_token):
        """Test non-admin gets 403 on admin programs"""
        if not beneficiary_token:
            pytest.skip("Beneficiary login failed")
        response = requests.get(
            f"{BASE_URL}/api/admin/programs",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
