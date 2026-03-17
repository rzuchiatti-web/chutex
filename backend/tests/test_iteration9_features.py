"""
Iteration 9 Test Suite - CHUTEX Features
Tests for:
- Login API (all 3 roles: admin, beneficiary, guardian)
- Guardian beneficiary detail (single scrollable page - no tabs)
- Activation codes CRUD (create, list, update, toggle, delete)
- Intervention codes CRUD (create, list, toggle, delete)
- Backoffice stats and KPI endpoints
- Alert CRUD endpoints
- Devices sync and list
- Geofence CRUD
- ECG start and history
- Sedentarity settings and check
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://program-social-feed.preview.emergentagent.com')

# Test credentials
BENEFICIARY_EMAIL = "robert.martin@email.fr"
GUARDIAN_EMAIL = "claire.martin@email.fr"
ADMIN_EMAIL = "admin@chutex.fr"
PASSWORD = "demo123"


class TestAuthLogin:
    """Test login for all 3 roles"""

    def test_beneficiary_login(self):
        """Test beneficiary login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token missing in response"
        assert "user" in data, "User missing in response"
        assert data["user"]["role"] == "beneficiary", f"Wrong role: {data['user']['role']}"
        assert data["user"]["email"] == BENEFICIARY_EMAIL
        print(f"PASSED: Beneficiary login - {data['user']['name']}")

    def test_guardian_login(self):
        """Test guardian login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "guardian"
        assert data["user"]["email"] == GUARDIAN_EMAIL
        print(f"PASSED: Guardian login - {data['user']['name']}")

    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"PASSED: Admin login - {data['user']['name']}")

    def test_invalid_login(self):
        """Test invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Invalid login should return 401"
        print("PASSED: Invalid login returns 401")


@pytest.fixture(scope="module")
def guardian_token():
    """Get guardian token for authenticated tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Guardian authentication failed")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def beneficiary_token():
    """Get beneficiary token for authenticated tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Beneficiary authentication failed")


@pytest.fixture(scope="module")
def beneficiary_id(guardian_token):
    """Get beneficiary ID linked to guardian"""
    headers = {"Authorization": f"Bearer {guardian_token}"}
    response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=headers)
    if response.status_code == 200:
        bens = response.json()
        if bens:
            return bens[0]["id"]
    pytest.skip("No beneficiary linked to guardian")


class TestGuardianBeneficiaryDetail:
    """Test guardian beneficiary detail endpoint (refactored to single scrollable page)"""

    def test_get_beneficiaries_list(self, guardian_token):
        """Test GET /api/guardian/beneficiaries"""
        headers = {"Authorization": f"Bearer {guardian_token}"}
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        if data:
            ben = data[0]
            assert "id" in ben
            assert "name" in ben
            assert "email" in ben
        print(f"PASSED: Guardian has {len(data)} beneficiaries")

    def test_get_beneficiary_detail(self, guardian_token, beneficiary_id):
        """Test GET /api/guardian/beneficiary/{bid}/detail - single scrollable page data"""
        headers = {"Authorization": f"Bearer {guardian_token}"}
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiary/{beneficiary_id}/detail", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify all sections are returned for single scrollable page
        assert "beneficiary" in data, "Missing beneficiary info"
        assert "alerts" in data, "Missing alerts section"
        assert "readings" in data, "Missing readings section"
        assert "thresholds" in data, "Missing thresholds section"
        assert "location" in data, "Missing location section"
        assert "interventions" in data, "Missing interventions section"
        assert "devices" in data, "Missing devices section"
        assert "reminders" in data, "Missing reminders section"
        assert "stats" in data, "Missing stats section"
        
        # Verify stats structure
        stats = data["stats"]
        assert "total_alerts" in stats
        assert "active_alerts" in stats
        
        # Verify beneficiary structure
        ben = data["beneficiary"]
        assert "name" in ben
        assert "email" in ben
        
        print(f"PASSED: Beneficiary detail returns all sections for single scrollable page")
        print(f"  - Alerts: {len(data['alerts'])}, Readings: {len(data['readings'])}, Devices: {len(data['devices'])}")


class TestActivationCodesCRUD:
    """Test admin activation codes CRUD"""

    def test_list_activation_codes(self, admin_token):
        """Test GET /api/admin/activation-codes"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Listed {len(data)} activation codes")

    def test_create_activation_code(self, admin_token):
        """Test POST /api/admin/activation-codes"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "structure_name": "TEST_Structure_Iter9",
            "max_uses": 10,
            "raison_sociale": "Test SARL",
            "siret": "12345678901234"
        }
        response = requests.post(f"{BASE_URL}/api/admin/activation-codes", headers=headers, json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "code" in data, "Code not returned"
        assert "id" in data, "ID not returned"
        assert data["structure_name"] == "TEST_Structure_Iter9"
        assert data["max_uses"] == 10
        assert data["active"] == True
        print(f"PASSED: Created activation code {data['code']}")
        return data

    def test_update_activation_code(self, admin_token):
        """Test PUT /api/admin/activation-codes/{code_id}"""
        # Create a code first
        headers = {"Authorization": f"Bearer {admin_token}"}
        create_resp = requests.post(f"{BASE_URL}/api/admin/activation-codes", headers=headers, json={
            "structure_name": "TEST_Update_Iter9",
            "max_uses": 5
        })
        assert create_resp.status_code == 200
        code_id = create_resp.json()["id"]
        
        # Update the code
        update_resp = requests.put(f"{BASE_URL}/api/admin/activation-codes/{code_id}", headers=headers, json={
            "structure_name": "TEST_Updated_Structure",
            "max_uses": 20
        })
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        # Verify update by listing
        list_resp = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=headers)
        codes = list_resp.json()
        updated_code = next((c for c in codes if c["id"] == code_id), None)
        assert updated_code is not None
        assert updated_code["structure_name"] == "TEST_Updated_Structure"
        print("PASSED: Activation code updated")

    def test_toggle_activation_code(self, admin_token):
        """Test PUT /api/admin/activation-codes/{code_id}/toggle"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create a code first
        create_resp = requests.post(f"{BASE_URL}/api/admin/activation-codes", headers=headers, json={
            "structure_name": "TEST_Toggle_Iter9",
            "max_uses": 5
        })
        code_id = create_resp.json()["id"]
        
        # Toggle (should deactivate)
        toggle_resp = requests.put(f"{BASE_URL}/api/admin/activation-codes/{code_id}/toggle", headers=headers)
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["active"] == False
        
        # Toggle again (should activate)
        toggle_resp2 = requests.put(f"{BASE_URL}/api/admin/activation-codes/{code_id}/toggle", headers=headers)
        assert toggle_resp2.status_code == 200
        assert toggle_resp2.json()["active"] == True
        print("PASSED: Activation code toggle works")

    def test_delete_activation_code(self, admin_token):
        """Test DELETE /api/admin/activation-codes/{code_id}"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create a code first
        create_resp = requests.post(f"{BASE_URL}/api/admin/activation-codes", headers=headers, json={
            "structure_name": "TEST_Delete_Iter9",
            "max_uses": 5
        })
        code_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/activation-codes/{code_id}", headers=headers)
        assert delete_resp.status_code == 200
        assert delete_resp.json()["status"] == "deleted"
        
        # Verify deletion
        list_resp = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=headers)
        codes = list_resp.json()
        deleted_code = next((c for c in codes if c["id"] == code_id), None)
        assert deleted_code is None, "Code should be deleted"
        print("PASSED: Activation code deleted")


class TestInterventionCodesCRUD:
    """Test admin intervention codes CRUD"""

    def test_list_intervention_codes(self, admin_token):
        """Test GET /api/admin/intervention-codes"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/intervention-codes", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Listed {len(data)} intervention codes")

    def test_create_intervention_code(self, admin_token):
        """Test POST /api/admin/intervention-codes"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        payload = {
            "structure_name": "TEST_IV_Structure_Iter9",
            "max_uses": 15,
            "radius_km": 25.0,
            "raison_sociale": "Ambulances Test"
        }
        response = requests.post(f"{BASE_URL}/api/admin/intervention-codes", headers=headers, json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "code" in data
        assert "id" in data
        assert data["structure_name"] == "TEST_IV_Structure_Iter9"
        assert data["default_radius_km"] == 25.0
        print(f"PASSED: Created intervention code {data['code']}")

    def test_toggle_intervention_code(self, admin_token):
        """Test PUT /api/admin/intervention-codes/{code_id}/toggle"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create first
        create_resp = requests.post(f"{BASE_URL}/api/admin/intervention-codes", headers=headers, json={
            "structure_name": "TEST_IV_Toggle_Iter9",
            "max_uses": 5
        })
        code_id = create_resp.json()["id"]
        
        # Toggle
        toggle_resp = requests.put(f"{BASE_URL}/api/admin/intervention-codes/{code_id}/toggle", headers=headers)
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["active"] == False
        print("PASSED: Intervention code toggle works")

    def test_delete_intervention_code(self, admin_token):
        """Test DELETE /api/admin/intervention-codes/{code_id}"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Create first
        create_resp = requests.post(f"{BASE_URL}/api/admin/intervention-codes", headers=headers, json={
            "structure_name": "TEST_IV_Delete_Iter9",
            "max_uses": 5
        })
        code_id = create_resp.json()["id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/intervention-codes/{code_id}", headers=headers)
        assert delete_resp.status_code == 200
        assert delete_resp.json()["status"] == "deleted"
        print("PASSED: Intervention code deleted")


class TestBackofficeEndpoints:
    """Test backoffice stats and KPI endpoints"""

    def test_backoffice_stats(self):
        """Test GET /api/backoffice/stats"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        expected_fields = ["total_users", "beneficiaries", "guardians", "prescribers", 
                          "total_alerts", "active_alerts", "prescriptions", "interventions"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASSED: Backoffice stats - {data['total_users']} users, {data['active_alerts']} active alerts")

    def test_backoffice_kpi(self):
        """Test GET /api/backoffice/kpi"""
        response = requests.get(f"{BASE_URL}/api/backoffice/kpi")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "total_users" in data
        assert "total_alerts" in data
        assert "total_interventions" in data
        assert "users_by_role" in data
        assert "alert_types" in data
        assert "alerts_by_day" in data
        print(f"PASSED: Backoffice KPI - avg resolution: {data.get('avg_resolution_minutes', 0)} min")


class TestAlertEndpoints:
    """Test alert CRUD endpoints"""

    def test_create_alert(self, beneficiary_token):
        """Test POST /api/alerts"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.post(f"{BASE_URL}/api/alerts", headers=headers, json={
            "alert_type": "sos",
            "severity": "medium",
            "message": "TEST_Alert_Iter9",
            "device_type": "bracelet"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["alert_type"] == "sos"
        assert data["status"] == "active"
        print(f"PASSED: Alert created - {data['id'][:8]}")
        return data["id"]

    def test_list_alerts(self, beneficiary_token):
        """Test GET /api/alerts"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/alerts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Listed {len(data)} alerts")

    def test_resolve_alert(self, beneficiary_token):
        """Test PUT /api/alerts/{alert_id}/resolve"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        # Create an alert first
        create_resp = requests.post(f"{BASE_URL}/api/alerts", headers=headers, json={
            "alert_type": "fall",
            "severity": "low",
            "message": "TEST_Resolve_Iter9"
        })
        alert_id = create_resp.json()["id"]
        
        # Resolve it
        resolve_resp = requests.put(f"{BASE_URL}/api/alerts/{alert_id}/resolve", headers=headers)
        assert resolve_resp.status_code == 200
        assert resolve_resp.json()["status"] == "resolved"
        print("PASSED: Alert resolved")


class TestDevicesEndpoints:
    """Test devices sync and list"""

    def test_sync_device(self, beneficiary_token):
        """Test POST /api/devices/sync"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.post(f"{BASE_URL}/api/devices/sync", headers=headers, json={
            "device_type": "bracelet",
            "data": {}
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["status"] == "synced"
        assert "data" in data
        assert "battery" in data
        print(f"PASSED: Device synced - battery: {data['battery']}%")

    def test_list_devices(self, beneficiary_token):
        """Test GET /api/devices"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Listed {len(data)} devices")


class TestGeofenceEndpoints:
    """Test geofence CRUD"""

    def test_create_geofence(self, beneficiary_token):
        """Test POST /api/geofence"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.post(f"{BASE_URL}/api/geofence", headers=headers, json={
            "name": "TEST_Geofence_Iter9",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "radius_m": 300,
            "active": True
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_Geofence_Iter9"
        print(f"PASSED: Geofence created")
        return data["id"]

    def test_list_geofences(self, beneficiary_token):
        """Test GET /api/geofence"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/geofence", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Listed {len(data)} geofences")


class TestECGEndpoints:
    """Test ECG start and history"""

    def test_start_ecg(self, beneficiary_token):
        """Test POST /api/ecg/start"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.post(f"{BASE_URL}/api/ecg/start", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "bpm" in data
        assert "interpretation" in data
        assert "data" in data  # ECG waveform data
        print(f"PASSED: ECG started - BPM: {data['bpm']}, {data['interpretation']}")

    def test_ecg_history(self, beneficiary_token):
        """Test GET /api/ecg/history"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/ecg/history", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: ECG history - {len(data)} records")


class TestSedentarityEndpoints:
    """Test sedentarity settings and check"""

    def test_get_sedentarity_settings(self, beneficiary_token):
        """Test GET /api/settings/sedentarity"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/settings/sedentarity", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "enabled" in data
        # API may return max_inactive_minutes or max_inactive_hours
        assert "max_inactive_minutes" in data or "max_inactive_hours" in data
        print(f"PASSED: Sedentarity settings - enabled: {data['enabled']}")

    def test_update_sedentarity_settings(self, beneficiary_token):
        """Test PUT /api/settings/sedentarity"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.put(f"{BASE_URL}/api/settings/sedentarity", headers=headers, json={
            "enabled": True,
            "max_inactive_minutes": 45,
            "start_hour": 9,
            "end_hour": 21
        })
        assert response.status_code == 200
        assert response.json()["status"] == "updated"
        print("PASSED: Sedentarity settings updated")

    def test_check_sedentarity(self, beneficiary_token):
        """Test POST /api/sedentarity/check"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.post(f"{BASE_URL}/api/sedentarity/check", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"PASSED: Sedentarity check - status: {data['status']}")


# Cleanup fixture for TEST_ prefixed data
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(admin_token):
    """Cleanup TEST_ prefixed activation and intervention codes after all tests"""
    yield
    # Cleanup
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Cleanup activation codes
    try:
        codes = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=headers).json()
        for code in codes:
            if code.get("structure_name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/activation-codes/{code['id']}", headers=headers)
    except:
        pass
    
    # Cleanup intervention codes
    try:
        iv_codes = requests.get(f"{BASE_URL}/api/admin/intervention-codes", headers=headers).json()
        for code in iv_codes:
            if code.get("structure_name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/intervention-codes/{code['id']}", headers=headers)
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
