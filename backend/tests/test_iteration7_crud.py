"""
Chutex Teleassistance - Iteration 7 Backend Tests
Tests for major restructuring:
  1) Admin activation codes (prescripteurs) - full CRUD with company info
  2) Admin intervention codes (intervenants) - full CRUD with company info and radius_km
  3) Teleassistance escalation takeover & resolve endpoints
  4) Backend endpoints for new admin tabs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://guardian-alert-hub.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@chutex.fr", "password": "demo123"}
TELEASSISTANCE_CREDS = {"email": "plateau@chutex.fr", "password": "demo123"}
BENEFICIARY_CREDS = {"email": "robert.martin@email.fr", "password": "demo123"}

class TestAdminActivationCodes:
    """Test admin activation codes (prescripteurs) CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def created_code_id(self, admin_token):
        """Create a test activation code and return its ID"""
        response = requests.post(f"{BASE_URL}/api/admin/activation-codes",
            json={
                "structure_name": f"TEST_Structure_{uuid.uuid4().hex[:6]}",
                "raison_sociale": "SAS Test Company",
                "siret": "12345678901234",
                "tva": "FR12345678900",
                "adresse": "123 Rue Test, 75001 Paris",
                "telephone": "+33123456789",
                "email_contact": "test@structure.fr",
                "max_uses": 100
            },
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200, f"Create activation code failed: {response.text}"
        return response.json()["id"]
    
    def test_create_activation_code_with_company_info(self, admin_token):
        """POST /api/admin/activation-codes - Create code with full company info"""
        response = requests.post(f"{BASE_URL}/api/admin/activation-codes",
            json={
                "structure_name": f"TEST_Prescripteur_{uuid.uuid4().hex[:6]}",
                "raison_sociale": "SARL Test Prescripteur",
                "siret": "98765432109876",
                "tva": "FR98765432100",
                "adresse": "456 Avenue Santé, 69001 Lyon",
                "telephone": "+33987654321",
                "email_contact": "contact@prescripteur-test.fr",
                "max_uses": 50
            },
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify all fields are returned
        assert "id" in data, "Response should have ID"
        assert "code" in data, "Response should have generated code"
        assert len(data["code"]) == 8, "Code should be 8 characters"
        assert data["structure_name"].startswith("TEST_"), "Structure name should match"
        assert data["raison_sociale"] == "SARL Test Prescripteur"
        assert data["siret"] == "98765432109876"
        assert data["tva"] == "FR98765432100"
        assert data["adresse"] == "456 Avenue Santé, 69001 Lyon"
        assert data["telephone"] == "+33987654321"
        assert data["email_contact"] == "contact@prescripteur-test.fr"
        assert data["max_uses"] == 50
        assert data["uses_count"] == 0
        assert data["active"] == True
        
        print(f"✅ POST /api/admin/activation-codes - Created code: {data['code']} for {data['structure_name']}")
        
        # Cleanup - delete the test code
        requests.delete(f"{BASE_URL}/api/admin/activation-codes/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"})
        return data["id"]
    
    def test_get_activation_codes(self, admin_token):
        """GET /api/admin/activation-codes - List all codes"""
        response = requests.get(f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Get codes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ GET /api/admin/activation-codes - Found {len(data)} activation codes")
    
    def test_update_activation_code(self, admin_token, created_code_id):
        """PUT /api/admin/activation-codes/{id} - Update code with new company info"""
        response = requests.put(f"{BASE_URL}/api/admin/activation-codes/{created_code_id}",
            json={
                "structure_name": "TEST_Updated_Structure",
                "raison_sociale": "Updated SARL",
                "siret": "11111111111111",
                "max_uses": 200
            },
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["status"] == "updated"
        print(f"✅ PUT /api/admin/activation-codes/{created_code_id[:8]}... - Code updated")
    
    def test_toggle_activation_code(self, admin_token, created_code_id):
        """PUT /api/admin/activation-codes/{id}/toggle - Toggle active/inactive"""
        # Toggle OFF
        response = requests.put(f"{BASE_URL}/api/admin/activation-codes/{created_code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Toggle failed: {response.text}"
        data = response.json()
        assert data["status"] == "toggled"
        assert data["active"] == False, "Code should now be inactive"
        print(f"✅ Toggle OFF - active: {data['active']}")
        
        # Toggle ON
        response = requests.put(f"{BASE_URL}/api/admin/activation-codes/{created_code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["active"] == True, "Code should now be active"
        print(f"✅ Toggle ON - active: {data['active']}")
    
    def test_delete_activation_code(self, admin_token, created_code_id):
        """DELETE /api/admin/activation-codes/{id} - Permanently delete code"""
        response = requests.delete(f"{BASE_URL}/api/admin/activation-codes/{created_code_id}",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        data = response.json()
        assert data["status"] == "deleted"
        print(f"✅ DELETE /api/admin/activation-codes/{created_code_id[:8]}... - Code deleted")


class TestAdminInterventionCodes:
    """Test admin intervention codes (intervenants) CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def created_iv_code_id(self, admin_token):
        """Create a test intervention code and return its ID"""
        response = requests.post(f"{BASE_URL}/api/admin/intervention-codes",
            json={
                "structure_name": f"TEST_Intervenant_{uuid.uuid4().hex[:6]}",
                "raison_sociale": "SAS Ambulances Test",
                "siret": "55555555555555",
                "tva": "FR55555555500",
                "adresse": "789 Rue Urgence, 33000 Bordeaux",
                "telephone": "+33555555555",
                "email_contact": "urgence@ambulances-test.fr",
                "max_uses": 25,
                "radius_km": 50
            },
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200, f"Create intervention code failed: {response.text}"
        return response.json()["id"]
    
    def test_create_intervention_code_with_radius(self, admin_token):
        """POST /api/admin/intervention-codes - Create code with company info and radius_km"""
        response = requests.post(f"{BASE_URL}/api/admin/intervention-codes",
            json={
                "structure_name": f"TEST_Care_{uuid.uuid4().hex[:6]}",
                "raison_sociale": "EURL Soins à Domicile",
                "siret": "66666666666666",
                "tva": "FR66666666600",
                "adresse": "321 Boulevard Santé, 13001 Marseille",
                "telephone": "+33666666666",
                "email_contact": "soins@domicile-test.fr",
                "max_uses": 30,
                "radius_km": 45.5
            },
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify all fields
        assert "id" in data
        assert "code" in data
        assert len(data["code"]) == 8
        assert data["structure_name"].startswith("TEST_")
        assert data["raison_sociale"] == "EURL Soins à Domicile"
        assert data["siret"] == "66666666666666"
        assert data["tva"] == "FR66666666600"
        assert data["default_radius_km"] == 45.5, "radius_km should be stored as default_radius_km"
        assert data["active"] == True
        
        print(f"✅ POST /api/admin/intervention-codes - Created: {data['code']} with radius {data.get('default_radius_km')}km")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/intervention-codes/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"})
        return data["id"]
    
    def test_get_intervention_codes(self, admin_token):
        """GET /api/admin/intervention-codes - List all intervention codes"""
        response = requests.get(f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Get failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/admin/intervention-codes - Found {len(data)} intervention codes")
    
    def test_get_intervention_providers(self, admin_token):
        """GET /api/admin/intervention-providers - List active intervention providers"""
        response = requests.get(f"{BASE_URL}/api/admin/intervention-providers",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Get providers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/admin/intervention-providers - Found {len(data)} active providers")
    
    def test_toggle_intervention_code(self, admin_token, created_iv_code_id):
        """PUT /api/admin/intervention-codes/{id}/toggle - Toggle code"""
        # Toggle OFF
        response = requests.put(f"{BASE_URL}/api/admin/intervention-codes/{created_iv_code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Toggle failed: {response.text}"
        data = response.json()
        assert data["status"] == "toggled"
        assert data["active"] == False
        print(f"✅ Toggle intervention code OFF")
        
        # Toggle ON
        response = requests.put(f"{BASE_URL}/api/admin/intervention-codes/{created_iv_code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["active"] == True
        print(f"✅ Toggle intervention code ON")
    
    def test_delete_intervention_code(self, admin_token, created_iv_code_id):
        """DELETE /api/admin/intervention-codes/{id} - Delete code"""
        response = requests.delete(f"{BASE_URL}/api/admin/intervention-codes/{created_iv_code_id}",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        assert response.json()["status"] == "deleted"
        print(f"✅ DELETE /api/admin/intervention-codes - Code deleted")


class TestEscalationTakeoverResolve:
    """Test teleassistance escalation takeover and resolve endpoints"""
    
    @pytest.fixture(scope="class")
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_escalations(self, teleassistance_token):
        """GET /api/teleassistance/escalations - List all escalations"""
        response = requests.get(f"{BASE_URL}/api/teleassistance/escalations",
            headers={"Authorization": f"Bearer {teleassistance_token}"})
        
        assert response.status_code == 200, f"Get escalations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/teleassistance/escalations - Found {len(data)} escalations")
        return data
    
    def test_takeover_escalation_not_found(self, teleassistance_token):
        """POST /api/teleassistance/escalation/{id}/takeover - 404 for non-existent"""
        response = requests.post(f"{BASE_URL}/api/teleassistance/escalation/nonexistent-id/takeover",
            headers={"Authorization": f"Bearer {teleassistance_token}"})
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print(f"✅ Takeover non-existent escalation returns 404")
    
    def test_resolve_escalation_not_found(self, teleassistance_token):
        """POST /api/teleassistance/escalation/{id}/resolve - 404 for non-existent"""
        response = requests.post(f"{BASE_URL}/api/teleassistance/escalation/nonexistent-id/resolve",
            headers={"Authorization": f"Bearer {teleassistance_token}"})
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print(f"✅ Resolve non-existent escalation returns 404")


class TestAdminAccessControl:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_beneficiary_cannot_access_activation_codes(self, beneficiary_token):
        """Beneficiary should get 403 for admin activation codes endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print(f"✅ Beneficiary blocked from /api/admin/activation-codes (403)")
    
    def test_beneficiary_cannot_create_activation_code(self, beneficiary_token):
        """Beneficiary should get 403 when trying to create activation code"""
        response = requests.post(f"{BASE_URL}/api/admin/activation-codes",
            json={"structure_name": "Hacker Structure", "max_uses": 100},
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print(f"✅ Beneficiary blocked from creating activation codes (403)")
    
    def test_beneficiary_cannot_access_intervention_codes(self, beneficiary_token):
        """Beneficiary should get 403 for admin intervention codes endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 403, f"Expected 403, got: {response.status_code}"
        print(f"✅ Beneficiary blocked from /api/admin/intervention-codes (403)")


class TestBackofficeEndpoints:
    """Test backoffice endpoints that support admin tabs"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_backoffice_stats(self, admin_token):
        """GET /api/backoffice/stats - Admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        # Note: backoffice/stats might not require auth - just check success
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        
        # Verify expected keys
        expected_keys = ["total_users", "beneficiaries", "guardians", "prescribers", 
                        "total_alerts", "active_alerts", "prescriptions", "interventions"]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"
        
        print(f"✅ GET /api/backoffice/stats - Stats: {data['total_users']} users, {data['total_alerts']} alerts")
    
    def test_backoffice_kpi(self, admin_token):
        """GET /api/backoffice/kpi - Admin KPI dashboard"""
        response = requests.get(f"{BASE_URL}/api/backoffice/kpi",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Get KPI failed: {response.text}"
        data = response.json()
        
        # Verify KPI structure
        assert "total_users" in data
        assert "total_alerts" in data
        assert "users_by_role" in data
        assert "alert_types" in data
        
        print(f"✅ GET /api/backoffice/kpi - KPI loaded with {data.get('total_users', 0)} users")
    
    def test_backoffice_prescriptions(self, admin_token):
        """GET /api/backoffice/prescriptions - List all prescriptions"""
        response = requests.get(f"{BASE_URL}/api/backoffice/prescriptions",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Get prescriptions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/backoffice/prescriptions - Found {len(data)} prescriptions")


class TestExistingAuthFlows:
    """Verify existing authentication flows still work"""
    
    def test_beneficiary_login(self):
        """Test beneficiary login (robert.martin@email.fr)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "beneficiary"
        assert data["user"]["name"] == "Robert Martin"
        print(f"✅ Beneficiary login: {data['user']['email']}")
    
    def test_guardian_login(self):
        """Test guardian login (claire.martin@email.fr)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "guardian"
        assert data["user"]["name"] == "Claire Martin"
        print(f"✅ Guardian login: {data['user']['email']}")
    
    def test_teleassistance_login(self):
        """Test teleassistance login (plateau@chutex.fr)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_CREDS)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "teleassistance"
        print(f"✅ Teleassistance login: {data['user']['email']}")
    
    def test_admin_login(self):
        """Test admin login (admin@chutex.fr)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login: {data['user']['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
