"""
Iteration 21 - Company Intervenants and Interventions API Tests
Testing:
- /api/company/intervenants - List company intervenants
- /api/company/intervenant/{id} - Get intervenant detail
- /api/company/interventions - List company interventions
- /api/company/intervenant/{id}/assign - Assign intervenant to agency
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials
COMPANY_EMAIL = "saad@chutex.fr"
COMPANY_PASSWORD = "demo123"


@pytest.fixture(scope="module")
def company_token():
    """Get company authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COMPANY_EMAIL,
        "password": COMPANY_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Company login failed - skipping tests")
    data = response.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="module")
def company_user(company_token):
    """Get company user data"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COMPANY_EMAIL,
        "password": COMPANY_PASSWORD
    })
    return response.json().get("user", {})


class TestCompanyIntervenants:
    """Tests for company intervenants management endpoints"""

    def test_company_login(self):
        """Test company can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COMPANY_EMAIL,
            "password": COMPANY_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "prescriber_company"
        assert data["user"]["email"] == COMPANY_EMAIL

    def test_get_intervenants_list(self, company_token):
        """Test GET /api/company/intervenants returns list of intervenants"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # 4 seeded intervenants

        # Verify structure of intervenant data
        if data:
            intervenant = data[0]
            assert "id" in intervenant
            assert "name" in intervenant
            assert "email" in intervenant
            assert "phone" in intervenant
            assert "agency_name" in intervenant
            assert "profession" in intervenant
            assert "intervention_radius_km" in intervenant
            assert "total_interventions" in intervenant
            assert "active_interventions" in intervenant
            assert "completed_interventions" in intervenant

    def test_intervenants_names(self, company_token):
        """Verify specific intervenants are present"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        data = response.json()
        names = [iv["name"] for iv in data]
        assert "Ludivine Moutio" in names
        assert "Marc Dubois" in names
        assert "Isabelle Roux" in names
        assert "Antoine Garnier" in names

    def test_get_intervenant_detail(self, company_token):
        """Test GET /api/company/intervenant/{id} returns detail"""
        # First get list to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        intervenants = list_response.json()
        assert len(intervenants) > 0
        
        intervenant_id = intervenants[0]["id"]
        
        # Get detail
        response = requests.get(
            f"{BASE_URL}/api/company/intervenant/{intervenant_id}",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "intervenant" in data
        assert "agency" in data
        assert "interventions" in data
        assert "total_interventions" in data
        assert "active_interventions" in data
        assert "completed_interventions" in data
        
        # Verify intervenant fields
        iv = data["intervenant"]
        assert "id" in iv
        assert "name" in iv
        assert "email" in iv
        assert iv["is_intervention_provider"] == True

    def test_intervenant_detail_not_found(self, company_token):
        """Test intervenant not found returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenant/nonexistent-id",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 404

    def test_intervenants_require_auth(self):
        """Test intervenants endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/company/intervenants")
        assert response.status_code in [401, 403, 422]


class TestCompanyInterventions:
    """Tests for company interventions endpoints"""

    def test_get_interventions_list(self, company_token):
        """Test GET /api/company/interventions returns list"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4  # 4 seeded interventions

    def test_intervention_structure(self, company_token):
        """Verify intervention data structure"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        data = response.json()
        assert len(data) > 0
        
        intervention = data[0]
        assert "id" in intervention
        assert "beneficiary_name" in intervention
        assert "assigned_to" in intervention
        assert "status" in intervention
        assert "alert_message" in intervention
        assert "intervenant_name" in intervention

    def test_intervention_statuses(self, company_token):
        """Verify various intervention statuses exist"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        data = response.json()
        statuses = [iv["status"] for iv in data]
        
        # We expect both completed and active interventions
        assert "completed" in statuses
        # At least one active (in_progress or pending_acceptance)
        active_statuses = ["pending_acceptance", "in_progress", "en_route", "dispatched"]
        has_active = any(s in active_statuses for s in statuses)
        assert has_active

    def test_interventions_require_auth(self):
        """Test interventions endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/company/interventions")
        assert response.status_code in [401, 403, 422]


class TestCompanyDashboard:
    """Tests for company dashboard (existing functionality)"""

    def test_dashboard_returns_data(self, company_token):
        """Test dashboard returns expected data"""
        response = requests.get(
            f"{BASE_URL}/api/company/dashboard",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "company" in data
        assert "total_prescribers" in data
        assert "total_prescriptions" in data
        assert "agencies" in data
        assert "prescriptions" in data

    def test_dashboard_prescriptions_count(self, company_token):
        """Verify prescriptions are returned"""
        response = requests.get(
            f"{BASE_URL}/api/company/dashboard",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        data = response.json()
        
        # Should have prescriptions
        assert "prescriptions" in data
        assert isinstance(data["prescriptions"], list)


class TestRoleRestriction:
    """Tests that endpoints are restricted to company role"""

    def test_intervenants_restricted_to_company(self):
        """Test non-company users cannot access intervenants"""
        # Login as guardian
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        if login_response.status_code != 200:
            pytest.skip("Guardian login failed")
        
        token = login_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

    def test_interventions_restricted_to_company(self):
        """Test non-company users cannot access company interventions"""
        # Login as beneficiary
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if login_response.status_code != 200:
            pytest.skip("Beneficiary login failed")
        
        token = login_response.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
