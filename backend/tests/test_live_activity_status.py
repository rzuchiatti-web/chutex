"""
Test Live Activity Status Feature - Iteration 125
Tests the new Live Activity style push notifications for guardians:
- Live status tracking (GET /api/alerts/live-active, GET /api/alerts/{id}/live-status)
- Alert creation creates live status document
- Alert resolution completes live status
- Guardian accept-as-intervention advances live status
- APNs token registration (POST /api/push/live-activity-token)
"""
import pytest
import requests
import time
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials from review_request
GUARDIAN_PHONE = "+33699887766"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"
ADMIN_PHONE = "0600000001"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def guardian_token(api_client):
    """Get guardian auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_PHONE,
        "password": GUARDIAN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Guardian authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def beneficiary_token(api_client):
    """Get beneficiary auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_PHONE,
        "password": BENEFICIARY_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Beneficiary authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")


class TestLiveStatusEndpoints:
    """Test Live Status API endpoints"""

    def test_get_live_active_unauthorized(self, api_client):
        """GET /api/alerts/live-active should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/alerts/live-active")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: GET /api/alerts/live-active requires auth")

    def test_get_live_active_as_guardian(self, api_client, guardian_token):
        """GET /api/alerts/live-active returns active live statuses for guardian"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/alerts/live-active returns {len(data)} active live statuses for guardian")
        
        # If there are live statuses, validate structure
        if len(data) > 0:
            status = data[0]
            assert "alert_id" in status, "Live status should have alert_id"
            assert "current_stage" in status, "Live status should have current_stage"
            assert "stages_completed" in status, "Live status should have stages_completed"
            assert "stages_definition" in status, "Live status should have stages_definition"
            print(f"  - First live status: alert_id={status['alert_id']}, stage={status['current_stage']}")

    def test_get_live_active_as_admin(self, api_client, admin_token):
        """GET /api/alerts/live-active returns active live statuses for admin (up to 20)"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/alerts/live-active returns {len(data)} active live statuses for admin")

    def test_get_live_status_for_specific_alert(self, api_client, guardian_token):
        """GET /api/alerts/{alert_id}/live-status returns specific alert live status"""
        # First get any active alert
        alerts_resp = api_client.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        
        if len(alerts) == 0:
            pytest.skip("No alerts exist to test live status")
        
        alert_id = alerts[0]["id"]
        response = api_client.get(
            f"{BASE_URL}/api/alerts/{alert_id}/live-status",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["alert_id"] == alert_id, "Returned alert_id should match requested"
        assert "current_stage" in data, "Should have current_stage"
        assert "stages_definition" in data, "Should have stages_definition"
        assert isinstance(data["stages_definition"], list), "stages_definition should be a list"
        assert len(data["stages_definition"]) == 6, "Should have 6 stage definitions"
        
        # Validate stages_definition structure
        stage_keys = [s["key"] for s in data["stages_definition"]]
        expected_keys = ["alert_triggered", "notifying_guardians", "ai_calling", "guardian_responding", "intervention_active", "resolved"]
        assert stage_keys == expected_keys, f"Stage keys mismatch: {stage_keys}"
        
        print(f"PASS: GET /api/alerts/{alert_id[:8]}../live-status returns valid live status with stages_definition")


class TestAlertCreatesLiveStatus:
    """Test that creating an alert also creates a live status document"""

    def test_create_alert_creates_live_status(self, api_client, beneficiary_token):
        """POST /api/alerts creates alert AND creates live status document automatically"""
        # Create a test alert
        response = api_client.post(
            f"{BASE_URL}/api/alerts",
            json={
                "alert_type": "sos",
                "message": f"TEST_LIVE_ACTIVITY_SOS_{uuid.uuid4().hex[:8]}",
                "device_type": "app"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code in [200, 201], f"Failed to create alert: {response.status_code} - {response.text}"
        
        alert_data = response.json()
        alert_id = alert_data.get("id")
        assert alert_id, "Alert should have an id"
        print(f"  Created alert: {alert_id[:8]}...")
        
        # Wait a moment for async live status creation
        time.sleep(0.5)
        
        # Now check that live status was created
        live_resp = api_client.get(
            f"{BASE_URL}/api/alerts/{alert_id}/live-status",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert live_resp.status_code == 200, f"Failed to get live status: {live_resp.status_code}"
        
        live_data = live_resp.json()
        assert live_data["alert_id"] == alert_id, "Live status should be for the created alert"
        assert live_data["current_stage"] in ["alert_triggered", "notifying_guardians", "ai_calling"], \
            f"Initial stage should be early in flow, got: {live_data['current_stage']}"
        assert "alert_triggered" in live_data.get("stages_completed", []), \
            "alert_triggered should be in stages_completed"
        
        print(f"PASS: Creating alert automatically creates live status with stage={live_data['current_stage']}")
        
        # Cleanup: resolve the alert
        resolve_resp = api_client.put(
            f"{BASE_URL}/api/alerts/{alert_id}/resolve",
            json={},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        print(f"  Cleanup: Resolved alert (status={resolve_resp.status_code})")
        
        return alert_id


class TestAlertResolutionCompletesLiveStatus:
    """Test that resolving an alert completes the live status"""

    def test_resolve_alert_completes_live_status(self, api_client, beneficiary_token):
        """PUT /api/alerts/{id}/resolve also completes live status (sets stage to resolved)"""
        # Create a test alert
        create_resp = api_client.post(
            f"{BASE_URL}/api/alerts",
            json={
                "alert_type": "sos",
                "message": f"TEST_RESOLVE_LIVE_{uuid.uuid4().hex[:8]}",
                "device_type": "app"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_resp.status_code in [200, 201]
        alert_id = create_resp.json()["id"]
        print(f"  Created alert: {alert_id[:8]}...")
        
        time.sleep(0.3)
        
        # Resolve the alert
        resolve_resp = api_client.put(
            f"{BASE_URL}/api/alerts/{alert_id}/resolve",
            json={"notes": "Test resolution"},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert resolve_resp.status_code == 200, f"Failed to resolve: {resolve_resp.status_code}"
        
        # Wait for async completion
        time.sleep(0.5)
        
        # Check live status is now resolved
        live_resp = api_client.get(
            f"{BASE_URL}/api/alerts/{alert_id}/live-status",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert live_resp.status_code == 200
        
        live_data = live_resp.json()
        assert live_data["current_stage"] == "resolved", \
            f"After resolution, stage should be 'resolved', got: {live_data['current_stage']}"
        assert "resolved" in live_data.get("stages_completed", []), \
            "resolved should be in stages_completed"
        
        print(f"PASS: PUT /api/alerts/{alert_id[:8]}../resolve completed live status (stage=resolved)")

    def test_resolve_with_report_completes_live_status(self, api_client, beneficiary_token):
        """POST /api/alerts/{id}/resolve-with-report also completes live status"""
        # Create a test alert
        create_resp = api_client.post(
            f"{BASE_URL}/api/alerts",
            json={
                "alert_type": "fall",
                "message": f"TEST_REPORT_RESOLVE_{uuid.uuid4().hex[:8]}",
                "device_type": "vest"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_resp.status_code in [200, 201]
        alert_id = create_resp.json()["id"]
        print(f"  Created fall alert: {alert_id[:8]}...")
        
        time.sleep(0.3)
        
        # Resolve with report
        resolve_resp = api_client.post(
            f"{BASE_URL}/api/alerts/{alert_id}/resolve-with-report",
            json={
                "answers": ["Beneficiaire ok", "Pas de blessure"],
                "notes": "Fausse alerte - test"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert resolve_resp.status_code == 200, f"Failed to resolve with report: {resolve_resp.status_code}"
        
        time.sleep(0.5)
        
        # Check live status is resolved
        live_resp = api_client.get(
            f"{BASE_URL}/api/alerts/{alert_id}/live-status",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert live_resp.status_code == 200
        
        live_data = live_resp.json()
        assert live_data["current_stage"] == "resolved", \
            f"After resolve-with-report, stage should be 'resolved', got: {live_data['current_stage']}"
        
        print(f"PASS: POST /api/alerts/{alert_id[:8]}../resolve-with-report completed live status")


class TestGuardianAcceptAdvancesLiveStatus:
    """Test that guardian accepting intervention advances live status"""

    def test_accept_as_guardian_advances_live_status(self, api_client, beneficiary_token, guardian_token):
        """POST /api/interventions/accept-as-guardian advances live status to guardian_responding and intervention_active"""
        # Create a test alert
        create_resp = api_client.post(
            f"{BASE_URL}/api/alerts",
            json={
                "alert_type": "sos",
                "message": f"TEST_GUARDIAN_ACCEPT_{uuid.uuid4().hex[:8]}",
                "device_type": "bracelet"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert create_resp.status_code in [200, 201]
        alert_id = create_resp.json()["id"]
        print(f"  Created alert: {alert_id[:8]}...")
        
        time.sleep(0.5)
        
        # Guardian accepts to intervene
        accept_resp = api_client.post(
            f"{BASE_URL}/api/interventions/accept-as-guardian",
            json={"alert_id": alert_id},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        # May get 409 if already assigned or 404 if beneficiary isn't linked
        if accept_resp.status_code == 404:
            print(f"  SKIP: Guardian not linked to beneficiary (404)")
            # Cleanup
            api_client.put(f"{BASE_URL}/api/alerts/{alert_id}/resolve", json={}, 
                          headers={"Authorization": f"Bearer {beneficiary_token}"})
            pytest.skip("Guardian not linked to beneficiary")
        
        if accept_resp.status_code == 409:
            print(f"  SKIP: Intervention already assigned (409)")
            api_client.put(f"{BASE_URL}/api/alerts/{alert_id}/resolve", json={},
                          headers={"Authorization": f"Bearer {beneficiary_token}"})
            pytest.skip("Intervention already assigned")
        
        assert accept_resp.status_code == 200, f"Failed to accept: {accept_resp.status_code} - {accept_resp.text}"
        print(f"  Guardian accepted intervention")
        
        time.sleep(0.5)
        
        # Check live status advanced
        live_resp = api_client.get(
            f"{BASE_URL}/api/alerts/{alert_id}/live-status",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert live_resp.status_code == 200
        
        live_data = live_resp.json()
        stages_completed = live_data.get("stages_completed", [])
        
        # Should have guardian_responding and intervention_active
        assert "guardian_responding" in stages_completed or "intervention_active" in stages_completed, \
            f"Should have guardian stages, got: {stages_completed}"
        
        # Current stage should be intervention_active (the last one set)
        assert live_data["current_stage"] in ["guardian_responding", "intervention_active"], \
            f"Stage should be guardian-related, got: {live_data['current_stage']}"
        
        # Should have intervenant info
        if live_data.get("intervenant_name"):
            print(f"  Intervenant name set: {live_data['intervenant_name']}")
        
        print(f"PASS: Guardian accept advances live status to stage={live_data['current_stage']}")
        
        # Cleanup
        api_client.put(f"{BASE_URL}/api/alerts/{alert_id}/resolve", json={},
                      headers={"Authorization": f"Bearer {beneficiary_token}"})


class TestLiveActivityTokenRegistration:
    """Test APNs token registration for iOS Live Activities"""

    def test_register_live_activity_token(self, api_client, guardian_token):
        """POST /api/push/live-activity-token registers APNs token"""
        test_alert_id = str(uuid.uuid4())
        test_apns_token = f"test_apns_token_{uuid.uuid4().hex}"
        
        response = api_client.post(
            f"{BASE_URL}/api/push/live-activity-token",
            json={
                "alert_id": test_alert_id,
                "apns_token": test_apns_token
            },
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Failed to register token: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("status") == "registered", f"Expected status='registered', got: {data}"
        
        print(f"PASS: POST /api/push/live-activity-token registers APNs token successfully")

    def test_register_live_activity_token_requires_fields(self, api_client, guardian_token):
        """POST /api/push/live-activity-token requires alert_id and apns_token"""
        # Missing apns_token
        response = api_client.post(
            f"{BASE_URL}/api/push/live-activity-token",
            json={"alert_id": "test"},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 400, f"Should fail without apns_token, got {response.status_code}"
        
        # Missing alert_id
        response = api_client.post(
            f"{BASE_URL}/api/push/live-activity-token",
            json={"apns_token": "test"},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 400, f"Should fail without alert_id, got {response.status_code}"
        
        print("PASS: POST /api/push/live-activity-token validates required fields")


class TestLiveStatusStagesDefinition:
    """Test that stages_definition is correctly returned"""

    def test_stages_definition_structure(self, api_client, guardian_token):
        """Verify stages_definition has correct structure"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        # Get any alert to check stages_definition
        alerts_resp = api_client.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        if alerts_resp.status_code == 200 and len(alerts_resp.json()) > 0:
            alert_id = alerts_resp.json()[0]["id"]
            
            live_resp = api_client.get(
                f"{BASE_URL}/api/alerts/{alert_id}/live-status",
                headers={"Authorization": f"Bearer {guardian_token}"}
            )
            assert live_resp.status_code == 200
            
            data = live_resp.json()
            stages = data.get("stages_definition", [])
            
            assert len(stages) == 6, f"Should have 6 stages, got {len(stages)}"
            
            for stage in stages:
                assert "key" in stage, "Stage should have 'key'"
                assert "label" in stage, "Stage should have 'label'"
                assert "icon" in stage, "Stage should have 'icon'"
            
            # Verify stage order
            keys = [s["key"] for s in stages]
            assert keys == ["alert_triggered", "notifying_guardians", "ai_calling", 
                          "guardian_responding", "intervention_active", "resolved"]
            
            print("PASS: stages_definition has correct structure and order")
        else:
            print("SKIP: No alerts available to test stages_definition")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
