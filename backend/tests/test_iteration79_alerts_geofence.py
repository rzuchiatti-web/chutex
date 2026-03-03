"""
Iteration 79: P0 Bug Fix Tests - Alerts Page & Geofence Alerts
Tests:
1. GET /api/alerts returns geofence alerts correctly for guardian role
2. GET /api/alerts/{id}/detail returns correct alert detail for geofence type
3. Verify type_labels dict includes 'geofence' -> 'Sortie de safe zone'
4. Invalid alert ID returns 404 (null safety test)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('REACT_APP_BACKEND_URL', '')).rstrip('/')

# Test credentials
GUARDIAN_PHONE = "0612345678"
GUARDIAN_PASSWORD = "test123"


@pytest.fixture(scope="module")
def guardian_token():
    """Authenticate as guardian and return token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_PHONE,
        "password": GUARDIAN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data
    return data["token"]


class TestGeofenceAlerts:
    """Test geofence alert handling - P0 bug fixes"""
    
    def test_get_alerts_returns_geofence_type(self, guardian_token):
        """GET /api/alerts should return alerts with geofence type"""
        response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        alerts = response.json()
        assert isinstance(alerts, list)
        
        # Find geofence alerts
        geofence_alerts = [a for a in alerts if a.get('alert_type') in ['geofence', 'geofence_exit']]
        print(f"Found {len(geofence_alerts)} geofence alerts")
        
        for alert in geofence_alerts:
            assert 'id' in alert
            assert 'alert_type' in alert
            assert alert['alert_type'] in ['geofence', 'geofence_exit']
            assert 'created_at' in alert
            assert 'status' in alert
    
    def test_get_alert_detail_for_geofence(self, guardian_token):
        """GET /api/alerts/{id}/detail should return proper detail for geofence alert"""
        # First get list of alerts
        list_response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert list_response.status_code == 200
        alerts = list_response.json()
        
        # Find a geofence alert
        geofence_alerts = [a for a in alerts if a.get('alert_type') in ['geofence', 'geofence_exit']]
        if not geofence_alerts:
            pytest.skip("No geofence alerts exist in the database")
        
        alert_id = geofence_alerts[0]['id']
        
        # Get detail
        detail_response = requests.get(
            f"{BASE_URL}/api/alerts/{alert_id}/detail",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert detail_response.status_code == 200
        
        data = detail_response.json()
        assert 'alert' in data
        assert 'beneficiary' in data
        assert 'timeline' in data
        
        alert = data['alert']
        assert alert['alert_type'] in ['geofence', 'geofence_exit']
        
        # Check timeline contains 'Sortie de safe zone' label
        timeline = data['timeline']
        creation_entry = [t for t in timeline if t.get('event') == 'creation']
        assert len(creation_entry) > 0, "Timeline should have creation entry"
        
        # The creation entry detail should show 'Sortie de safe zone' from type_labels
        found_safe_zone_label = any(
            'safe zone' in t.get('detail', '').lower() or 'Sortie de safe zone' in t.get('detail', '')
            for t in timeline
        )
        assert found_safe_zone_label, "Timeline should contain 'Sortie de safe zone' label for geofence alert"
    
    def test_invalid_alert_id_returns_404(self, guardian_token):
        """GET /api/alerts/{invalid_id}/detail should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/invalid-nonexistent-id-xyz123/detail",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_alerts_endpoint_does_not_crash(self, guardian_token):
        """GET /api/alerts should not crash even with geofence alerts present"""
        response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify each alert has required fields
        for alert in data:
            assert 'id' in alert
            assert 'alert_type' in alert
            assert 'status' in alert
            assert 'created_at' in alert
    
    def test_active_alerts_with_interventions_geofence(self, guardian_token):
        """GET /api/alerts/active-with-interventions should handle geofence alerts"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/active-with-interventions",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check geofence alerts are included
        geofence_active = [a for a in data if a.get('alert_type') in ['geofence', 'geofence_exit']]
        print(f"Active geofence alerts: {len(geofence_active)}")
        
        for alert in geofence_active:
            assert alert.get('status') == 'active'


class TestAlertReportEndpoint:
    """Test /api/alerts/{id}/report endpoint"""
    
    def test_get_alert_report_for_geofence(self, guardian_token):
        """GET /api/alerts/{id}/report should work for geofence alerts"""
        # Get alerts list
        list_response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert list_response.status_code == 200
        alerts = list_response.json()
        
        geofence_alerts = [a for a in alerts if a.get('alert_type') in ['geofence', 'geofence_exit']]
        if not geofence_alerts:
            pytest.skip("No geofence alerts exist")
        
        alert_id = geofence_alerts[0]['id']
        
        # Get report
        report_response = requests.get(
            f"{BASE_URL}/api/alerts/{alert_id}/report",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert report_response.status_code == 200
        
        data = report_response.json()
        assert 'alert' in data
        assert 'timeline' in data
