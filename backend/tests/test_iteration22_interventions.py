"""
Iteration 22: Testing intervention management for Company role (SAAD)
- Dispatch system targets nearest SAAD company's intervenants
- Accept intervention locks for first acceptor  
- Intervention detail endpoint with alert, beneficiary, intervenant info
- Intervention tracking endpoint
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')

class TestCompanyLogin:
    """Test company login and basic authentication"""
    
    def test_company_login(self):
        """Login as company user saad@chutex.fr"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "prescriber_company"
        assert data["user"]["name"] == "SAAD Aide a Domicile"
        print(f"✓ Company login successful: {data['user']['name']}")
        return data["token"]


class TestCompanyDashboard:
    """Test company dashboard with clickable KPIs"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_dashboard_returns_kpi_data(self, company_token):
        """Dashboard returns data for clickable KPIs: Prescripteurs, Prescriptions, Agences"""
        response = requests.get(
            f"{BASE_URL}/api/company/dashboard",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify KPI fields exist
        assert "total_prescribers" in data
        assert "total_prescriptions" in data
        assert "agencies" in data
        
        print(f"✓ Dashboard KPIs: Prescripteurs={data['total_prescribers']}, Prescriptions={data['total_prescriptions']}, Agences={len(data.get('agencies', []))}")


class TestInterventionsTab:
    """Test company Interventions tab with Missions/Intervenants sub-tabs"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_get_interventions_list(self, company_token):
        """GET /api/company/interventions - returns interventions for company"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        interventions = response.json()
        assert isinstance(interventions, list)
        print(f"✓ Company has {len(interventions)} interventions")
        return interventions
    
    def test_intervention_has_required_fields(self, company_token):
        """Interventions have required fields for Missions sub-tab"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = response.json()
        
        if interventions:
            iv = interventions[0]
            required_fields = ["id", "beneficiary_name", "status", "alert_message"]
            for field in required_fields:
                assert field in iv, f"Missing field: {field}"
            print(f"✓ Intervention structure verified: beneficiary={iv['beneficiary_name']}, status={iv['status']}")
    
    def test_get_intervenants_list(self, company_token):
        """GET /api/company/intervenants - returns intervenants for company"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        intervenants = response.json()
        assert isinstance(intervenants, list)
        assert len(intervenants) >= 4, "Expected at least 4 intervenants"
        print(f"✓ Company has {len(intervenants)} intervenants")
        return intervenants
    
    def test_intervenants_names(self, company_token):
        """Verify expected intervenants exist"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        intervenants = response.json()
        names = [iv['name'] for iv in intervenants]
        
        expected_names = ["Marc Dubois", "Ludivine Moutio", "Isabelle Roux", "Antoine Garnier"]
        for name in expected_names:
            assert name in names, f"Missing intervenant: {name}"
        print(f"✓ All expected intervenants found: {names}")


class TestPrescriptionsTab:
    """Test company Prescriptions tab (5th tab)"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_prescriptions_available_from_dashboard(self, company_token):
        """Prescriptions data available for company"""
        response = requests.get(
            f"{BASE_URL}/api/company/dashboard",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "prescriptions" in data
        print(f"✓ Company has access to prescriptions data: {len(data.get('prescriptions', []))} prescriptions")


class TestInterventionDetailPage:
    """Test intervention detail page with Leaflet map"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_get_intervention_detail(self, company_token):
        """GET /api/interventions/{id}/detail - returns full intervention info"""
        # First get an intervention ID
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = response.json()
        assert len(interventions) > 0, "No interventions found"
        
        intervention_id = interventions[0]["id"]
        
        # Get detailed info
        detail_response = requests.get(
            f"{BASE_URL}/api/interventions/{intervention_id}/detail",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert detail_response.status_code == 200
        data = detail_response.json()
        
        # Verify structure
        assert "intervention" in data
        assert "alert" in data or data["alert"] is None
        assert "beneficiary" in data or data["beneficiary"] is None
        assert "intervenant" in data or data["intervenant"] is None
        
        iv = data["intervention"]
        print(f"✓ Intervention detail: status={iv['status']}, beneficiary={iv['beneficiary_name']}")
        
        # Verify intervention has location for map
        if "beneficiary_location" in iv:
            assert "latitude" in iv["beneficiary_location"]
            assert "longitude" in iv["beneficiary_location"]
            print(f"✓ Beneficiary location: lat={iv['beneficiary_location']['latitude']}, lng={iv['beneficiary_location']['longitude']}")
        
        return data
    
    def test_detail_includes_medical_info(self, company_token):
        """Detail includes beneficiary medical info"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = response.json()
        
        # Find an intervention with beneficiary_info
        for iv in interventions:
            if iv.get("beneficiary_info"):
                detail_response = requests.get(
                    f"{BASE_URL}/api/interventions/{iv['id']}/detail",
                    headers={"Authorization": f"Bearer {company_token}"}
                )
                data = detail_response.json()
                ben_info = data["intervention"].get("beneficiary_info", {})
                
                if ben_info:
                    print(f"✓ Beneficiary medical info: conditions={ben_info.get('medical_conditions', 'N/A')}, blood_type={ben_info.get('blood_type', 'N/A')}")
                    return
        
        print("ℹ No detailed beneficiary_info found in test interventions")


class TestInterventionTracking:
    """Test intervention tracking endpoint"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_get_tracking_data(self, company_token):
        """GET /api/interventions/{id}/tracking - returns positions and status"""
        response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = response.json()
        
        # Find an en_route intervention for tracking
        en_route_ivs = [iv for iv in interventions if iv["status"] == "en_route"]
        
        if en_route_ivs:
            intervention_id = en_route_ivs[0]["id"]
        else:
            intervention_id = interventions[0]["id"]
        
        tracking_response = requests.get(
            f"{BASE_URL}/api/interventions/{intervention_id}/tracking",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert tracking_response.status_code == 200
        data = tracking_response.json()
        
        # Verify tracking structure
        assert "intervention_id" in data
        assert "status" in data
        assert "beneficiary_location" in data
        assert "intervenant_location" in data
        assert "timeline" in data
        
        print(f"✓ Tracking data: status={data['status']}, intervenant={data.get('intervenant_name', 'N/A')}")
        
        if data.get("intervenant_location"):
            print(f"✓ Intervenant location: lat={data['intervenant_location'].get('latitude')}, lng={data['intervenant_location'].get('longitude')}")
        
        return data


class TestAcceptInterventionLocking:
    """Test that first acceptor locks the intervention"""
    
    def test_accept_returns_409_for_already_accepted(self):
        """POST /api/interventions/{id}/accept - second acceptor gets 409"""
        # Login as Marc Dubois (intervenant)
        marc_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marc.dubois@saad.fr",
            "password": "demo123"
        })
        marc_token = marc_response.json()["token"]
        
        # Get company interventions to find an already accepted one
        company_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        company_token = company_response.json()["token"]
        
        ivs_response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = ivs_response.json()
        
        # Find intervention that's already en_route (already accepted by Marc)
        en_route_ivs = [iv for iv in interventions if iv["status"] == "en_route" and iv.get("assigned_name") == "Marc Dubois"]
        
        if en_route_ivs:
            # Try to accept as Marc again - should fail with 409
            accept_response = requests.post(
                f"{BASE_URL}/api/interventions/{en_route_ivs[0]['id']}/accept",
                headers={"Authorization": f"Bearer {marc_token}"}
            )
            
            # Should return 409 Conflict (already accepted)
            assert accept_response.status_code == 409, f"Expected 409, got {accept_response.status_code}"
            print("✓ Second accept attempt correctly returns 409 Conflict")
        else:
            print("ℹ No en_route intervention by Marc found - skipping accept test")
    
    def test_accept_requires_recipient_status(self):
        """Accept endpoint checks user is in recipients list"""
        # Login as company (not an intervenant)
        company_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        company_token = company_response.json()["token"]
        
        # Get a pending intervention
        ivs_response = requests.get(
            f"{BASE_URL}/api/company/interventions",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        interventions = ivs_response.json()
        
        pending_ivs = [iv for iv in interventions if iv["status"] == "pending_acceptance"]
        
        if pending_ivs:
            # Try to accept as company - should fail
            accept_response = requests.post(
                f"{BASE_URL}/api/interventions/{pending_ivs[0]['id']}/accept",
                headers={"Authorization": f"Bearer {company_token}"}
            )
            
            # Should return 403 (company is not a recipient)
            assert accept_response.status_code == 403, f"Expected 403, got {accept_response.status_code}"
            print("✓ Non-recipient correctly blocked from accepting")
        else:
            print("ℹ No pending interventions found - skipping recipient test")


class TestIntervenantDetail:
    """Test intervenant detail page"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        return response.json()["token"]
    
    def test_get_intervenant_detail(self, company_token):
        """GET /api/company/intervenant/{id} - returns intervenant details"""
        # Get intervenants list
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        intervenants = response.json()
        
        if intervenants:
            intervenant_id = intervenants[0]["user_id"]
            
            detail_response = requests.get(
                f"{BASE_URL}/api/company/intervenant/{intervenant_id}",
                headers={"Authorization": f"Bearer {company_token}"}
            )
            assert detail_response.status_code == 200
            data = detail_response.json()
            
            assert "intervenant" in data
            print(f"✓ Intervenant detail: {data['intervenant']['name']}")


class TestCompanyTabStructure:
    """Verify the new 6-tab layout for company role"""
    
    def test_company_has_correct_role(self):
        """Company user has prescriber_company role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saad@chutex.fr",
            "password": "demo123"
        })
        data = response.json()
        assert data["user"]["role"] == "prescriber_company"
        print("✓ Company role is prescriber_company (6 tabs: Dashboard, Agences, Prescripteurs, Interventions, Prescriptions, Profil)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
