"""
Test Iteration 8 - New Features Testing
Tests for: Geofencing, ECG, Sedentarity alerts
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://dispatch-hub-164.preview.emergentagent.com')
if not BASE_URL.startswith('http'):
    BASE_URL = 'https://dispatch-hub-164.preview.emergentagent.com'

# Test credentials
BENEFICIARY_EMAIL = "robert.martin@email.fr"
BENEFICIARY_PASSWORD = "demo123"
GUARDIAN_EMAIL = "claire.martin@email.fr"
GUARDIAN_PASSWORD = "demo123"
ADMIN_EMAIL = "admin@chutex.fr"
ADMIN_PASSWORD = "demo123"
TELEASSISTANCE_EMAIL = "plateau@chutex.fr"
TELEASSISTANCE_PASSWORD = "demo123"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def beneficiary_token(api_client):
    """Get beneficiary authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_EMAIL,
        "password": BENEFICIARY_PASSWORD
    })
    assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def guardian_token(api_client):
    """Get guardian authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_EMAIL,
        "password": GUARDIAN_PASSWORD
    })
    assert response.status_code == 200, f"Guardian login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def teleassistance_token(api_client):
    """Get teleassistance authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TELEASSISTANCE_EMAIL,
        "password": TELEASSISTANCE_PASSWORD
    })
    assert response.status_code == 200, f"Teleassistance login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def authenticated_beneficiary(api_client, beneficiary_token):
    """Session with beneficiary auth header"""
    api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
    return api_client


# ==================== GEOFENCING TESTS ====================

class TestGeofencingCRUD:
    """Tests for Geofencing feature CRUD operations"""

    def test_create_geofence_zone(self, api_client, beneficiary_token):
        """POST /api/geofence - Create a geofence zone"""
        response = api_client.post(
            f"{BASE_URL}/api/geofence",
            json={
                "name": "TEST_Domicile",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius_meters": 500
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Create geofence failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert "id" in data, "Response should contain id"
        assert data["name"] == "TEST_Domicile", "Zone name should match"
        assert data["latitude"] == 48.8566, "Latitude should match"
        assert data["longitude"] == 2.3522, "Longitude should match"
        assert data["radius_meters"] == 500, "Radius should match"
        assert data["active"] == True, "New zone should be active by default"
        assert "created_at" in data, "Response should contain created_at"

    def test_get_geofences_list(self, api_client, beneficiary_token):
        """GET /api/geofence - List user's geofence zones"""
        response = api_client.get(
            f"{BASE_URL}/api/geofence",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Get geofences failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert isinstance(data, list), "Response should be a list"
        # Should have at least the test zone we created
        if len(data) > 0:
            zone = data[0]
            assert "id" in zone, "Zone should have id"
            assert "name" in zone, "Zone should have name"
            assert "latitude" in zone, "Zone should have latitude"
            assert "longitude" in zone, "Zone should have longitude"
            assert "radius_meters" in zone, "Zone should have radius_meters"
            assert "active" in zone, "Zone should have active field"

    def test_toggle_geofence_active_status(self, api_client, beneficiary_token):
        """PUT /api/geofence/{id}/toggle - Toggle geofence active/inactive"""
        # First create a zone to toggle
        create_response = api_client.post(
            f"{BASE_URL}/api/geofence",
            json={
                "name": "TEST_Toggle_Zone",
                "latitude": 48.85,
                "longitude": 2.35,
                "radius_meters": 300
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_response.status_code == 200
        zone_id = create_response.json()["id"]
        
        # Toggle the zone (should deactivate since default is active)
        toggle_response = api_client.put(
            f"{BASE_URL}/api/geofence/{zone_id}/toggle",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert toggle_response.status_code == 200, f"Toggle failed: {toggle_response.text}"
        toggle_data = toggle_response.json()
        assert "active" in toggle_data, "Response should contain active field"
        assert toggle_data["active"] == False, "Zone should be deactivated after toggle"
        
        # Toggle again to reactivate
        toggle_response2 = api_client.put(
            f"{BASE_URL}/api/geofence/{zone_id}/toggle",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert toggle_response2.status_code == 200
        assert toggle_response2.json()["active"] == True, "Zone should be reactivated"

    def test_delete_geofence(self, api_client, beneficiary_token):
        """DELETE /api/geofence/{id} - Delete geofence zone"""
        # First create a zone to delete
        create_response = api_client.post(
            f"{BASE_URL}/api/geofence",
            json={
                "name": "TEST_Delete_Zone",
                "latitude": 48.87,
                "longitude": 2.33,
                "radius_meters": 200
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_response.status_code == 200
        zone_id = create_response.json()["id"]
        
        # Delete the zone
        delete_response = api_client.delete(
            f"{BASE_URL}/api/geofence/{zone_id}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        assert delete_response.json().get("status") == "deleted"
        
        # Verify it's deleted by checking the list
        list_response = api_client.get(
            f"{BASE_URL}/api/geofence",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        zones = list_response.json()
        zone_ids = [z["id"] for z in zones]
        assert zone_id not in zone_ids, "Deleted zone should not appear in list"

    def test_check_geofence_position(self, api_client, beneficiary_token):
        """POST /api/geofence/check - Check if position is within geofences"""
        response = api_client.post(
            f"{BASE_URL}/api/geofence/check",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Check geofence failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert "in_zone" in data, "Response should contain in_zone"
        assert "violations" in data, "Response should contain violations"
        assert isinstance(data["in_zone"], bool), "in_zone should be boolean"
        assert isinstance(data["violations"], list), "violations should be list"

    def test_toggle_nonexistent_geofence_returns_404(self, api_client, beneficiary_token):
        """PUT /api/geofence/{id}/toggle - Should return 404 for nonexistent zone"""
        response = api_client.put(
            f"{BASE_URL}/api/geofence/nonexistent-zone-id/toggle",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ==================== ECG TESTS ====================

class TestECGFeature:
    """Tests for ECG recording feature"""

    def test_start_ecg_recording(self, api_client, beneficiary_token):
        """POST /api/ecg/start - Start ECG recording (simulated)"""
        response = api_client.post(
            f"{BASE_URL}/api/ecg/start",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Start ECG failed: {response.text}"
        data = response.json()
        
        # Data assertions - validate all expected fields
        assert "id" in data, "Response should contain id"
        assert "bpm" in data, "Response should contain bpm"
        assert isinstance(data["bpm"], int), "bpm should be integer"
        assert 50 <= data["bpm"] <= 120, f"bpm should be in normal range, got {data['bpm']}"
        
        assert "rhythm" in data, "Response should contain rhythm"
        assert data["rhythm"] in ["sinusal", "arythmie légère"], f"Unexpected rhythm: {data['rhythm']}"
        
        assert "pr_interval_ms" in data, "Response should contain pr_interval_ms"
        assert 100 <= data["pr_interval_ms"] <= 250, f"PR interval out of range: {data['pr_interval_ms']}"
        
        assert "qrs_duration_ms" in data, "Response should contain qrs_duration_ms"
        assert 60 <= data["qrs_duration_ms"] <= 150, f"QRS duration out of range: {data['qrs_duration_ms']}"
        
        assert "qt_interval_ms" in data, "Response should contain qt_interval_ms"
        assert 300 <= data["qt_interval_ms"] <= 500, f"QT interval out of range: {data['qt_interval_ms']}"
        
        assert "interpretation" in data, "Response should contain interpretation"
        assert "status" in data, "Response should contain status"
        assert data["status"] in ["normal", "attention"], f"Unexpected status: {data['status']}"
        
        assert "samples" in data, "Response should contain samples"
        assert isinstance(data["samples"], list), "samples should be a list"
        assert len(data["samples"]) > 0, "samples should not be empty"
        
        assert "duration_sec" in data, "Response should contain duration_sec"
        assert data["duration_sec"] == 30, "Duration should be 30 seconds"
        
        assert "created_at" in data, "Response should contain created_at"

    def test_get_ecg_history(self, api_client, beneficiary_token):
        """GET /api/ecg/history - Get ECG history without samples"""
        response = api_client.get(
            f"{BASE_URL}/api/ecg/history",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Get ECG history failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert isinstance(data, list), "Response should be a list"
        if len(data) > 0:
            record = data[0]
            assert "id" in record, "Record should have id"
            assert "bpm" in record, "Record should have bpm"
            assert "rhythm" in record, "Record should have rhythm"
            assert "status" in record, "Record should have status"
            assert "created_at" in record, "Record should have created_at"
            # samples should NOT be included in history
            assert "samples" not in record, "History should not include samples"

    def test_get_ecg_detail_with_samples(self, api_client, beneficiary_token):
        """GET /api/ecg/{id} - Get ECG detail with samples"""
        # First create an ECG record
        create_response = api_client.post(
            f"{BASE_URL}/api/ecg/start",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_response.status_code == 200
        ecg_id = create_response.json()["id"]
        
        # Get detail with samples
        detail_response = api_client.get(
            f"{BASE_URL}/api/ecg/{ecg_id}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert detail_response.status_code == 200, f"Get ECG detail failed: {detail_response.text}"
        data = detail_response.json()
        
        # Data assertions - detail SHOULD include samples
        assert "id" in data, "Detail should have id"
        assert data["id"] == ecg_id, "ID should match"
        assert "samples" in data, "Detail should include samples"
        assert isinstance(data["samples"], list), "samples should be list"
        assert len(data["samples"]) > 0, "samples should not be empty"
        assert "bpm" in data, "Detail should have bpm"
        assert "interpretation" in data, "Detail should have interpretation"

    def test_get_nonexistent_ecg_returns_404(self, api_client, beneficiary_token):
        """GET /api/ecg/{id} - Should return 404 for nonexistent ECG"""
        response = api_client.get(
            f"{BASE_URL}/api/ecg/nonexistent-ecg-id",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ==================== SEDENTARITY TESTS ====================

class TestSedentaritySettings:
    """Tests for Sedentarity alert settings"""

    def test_get_sedentarity_settings(self, api_client, beneficiary_token):
        """GET /api/settings/sedentarity - Get sedentarity settings"""
        response = api_client.get(
            f"{BASE_URL}/api/settings/sedentarity",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Get sedentarity settings failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert "enabled" in data, "Response should contain enabled"
        assert "max_inactive_hours" in data, "Response should contain max_inactive_hours"
        assert "check_start_hour" in data, "Response should contain check_start_hour"
        assert "check_end_hour" in data, "Response should contain check_end_hour"
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["max_inactive_hours"], (int, float)), "max_inactive_hours should be numeric"

    def test_update_sedentarity_settings(self, api_client, beneficiary_token):
        """PUT /api/settings/sedentarity - Update sedentarity settings"""
        response = api_client.put(
            f"{BASE_URL}/api/settings/sedentarity",
            json={
                "enabled": True,
                "max_inactive_hours": 6,
                "check_start_hour": 9,
                "check_end_hour": 21
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Update sedentarity failed: {response.text}"
        data = response.json()
        
        # Verify updated values
        assert data["enabled"] == True
        assert data["max_inactive_hours"] == 6
        assert data["check_start_hour"] == 9
        assert data["check_end_hour"] == 21
        
        # Verify persistence by GET
        get_response = api_client.get(
            f"{BASE_URL}/api/settings/sedentarity",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        get_data = get_response.json()
        assert get_data["max_inactive_hours"] == 6, "Setting should persist"

    def test_check_sedentarity(self, api_client, beneficiary_token):
        """POST /api/sedentarity/check - Check sedentarity status"""
        response = api_client.post(
            f"{BASE_URL}/api/sedentarity/check",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Check sedentarity failed: {response.text}"
        data = response.json()
        
        # Data assertions
        assert "alert_created" in data, "Response should contain alert_created"
        assert isinstance(data["alert_created"], bool), "alert_created should be boolean"
        # Should have a reason if not created
        if not data["alert_created"]:
            assert "reason" in data, "Should have reason if no alert created"

    def test_disable_sedentarity_alerts(self, api_client, beneficiary_token):
        """Disable sedentarity and verify check respects it"""
        # Disable
        update_response = api_client.put(
            f"{BASE_URL}/api/settings/sedentarity",
            json={
                "enabled": False,
                "max_inactive_hours": 4,
                "check_start_hour": 8,
                "check_end_hour": 22
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert update_response.status_code == 200
        
        # Check should return disabled
        check_response = api_client.post(
            f"{BASE_URL}/api/sedentarity/check",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert check_response.status_code == 200
        check_data = check_response.json()
        assert check_data["alert_created"] == False
        assert check_data.get("reason") == "disabled"
        
        # Re-enable for other tests
        api_client.put(
            f"{BASE_URL}/api/settings/sedentarity",
            json={
                "enabled": True,
                "max_inactive_hours": 4,
                "check_start_hour": 8,
                "check_end_hour": 22
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )


# ==================== ALL ROLES LOGIN TESTS ====================

class TestAllRolesLogin:
    """Verify all 4 roles can still login correctly"""

    def test_beneficiary_login(self, api_client):
        """Beneficiary login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_EMAIL,
            "password": BENEFICIARY_PASSWORD
        })
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "beneficiary", "Role should be beneficiary"
        assert data["user"]["email"] == BENEFICIARY_EMAIL, "Email should match"

    def test_guardian_login(self, api_client):
        """Guardian login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "guardian", "Role should be guardian"

    def test_admin_login(self, api_client):
        """Admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["user"]["role"] == "admin", "Role should be admin"

    def test_teleassistance_login(self, api_client):
        """Teleassistance login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TELEASSISTANCE_EMAIL,
            "password": TELEASSISTANCE_PASSWORD
        })
        assert response.status_code == 200, f"Teleassistance login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["user"]["role"] == "teleassistance", "Role should be teleassistance"


# ==================== CLEANUP TEST DATA ====================

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_zones(request):
    """Cleanup TEST_ prefixed geofence zones after all tests"""
    yield
    # Cleanup will happen via individual deletes in tests
