"""
Test Live Activity ETA Calculation and Guardian Removal - Iteration 127
Tests the new ETA calculation feature using Haversine formula:
- GET /api/alerts/live-active returns eta_minutes and distance_km when both locations exist
- ETA calculation based on distance (walking <0.5km, urban <5km, longer distances)
- Josette Zuchiatti has only 3 guardians (Clement and Julianne removed)
- Intervention tracking location updates reflected in live-active response
"""
import pytest
import requests
import os
import math

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials
GUARDIAN_PHONE = "+33699887766"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"
ADMIN_PHONE = "0600000001"
ADMIN_PASSWORD = "admin123"

# Known alert with tracking data for ETA testing
ETA_TEST_ALERT_ID = "71f6654e"  # Has intervention by Marie Dupont with tracking
JOSETTE_ID = "495e5e38-3591-474b-abe5-c932574bb609"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two GPS points - mirror of backend implementation."""
    R = 6371.0
    la1, lo1, la2, lo2 = math.radians(lat1), math.radians(lng1), math.radians(lat2), math.radians(lng2)
    dlat, dlon = la2 - la1, lo2 - lo1
    a = math.sin(dlat / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


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
def admin_token(api_client):
    """Get admin auth token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Admin authentication failed: {response.status_code}")


class TestETACalculation:
    """Test ETA calculation in live-active endpoint"""

    def test_live_active_returns_eta_when_both_locations_exist(self, api_client, guardian_token):
        """GET /api/alerts/live-active returns eta_minutes and distance_km when both locations exist"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Find alert with ETA data (requires both beneficiary and intervenant locations)
        alerts_with_eta = [s for s in data if s.get("eta_minutes") is not None]
        
        print(f"PASS: GET /api/alerts/live-active returns {len(data)} statuses, {len(alerts_with_eta)} with ETA")
        
        if len(alerts_with_eta) > 0:
            status = alerts_with_eta[0]
            assert "eta_minutes" in status, "Should have eta_minutes"
            assert "distance_km" in status, "Should have distance_km"
            assert isinstance(status["eta_minutes"], int), "eta_minutes should be integer"
            assert isinstance(status["distance_km"], (int, float)), "distance_km should be numeric"
            assert status["eta_minutes"] > 0, "ETA should be positive"
            assert status["distance_km"] > 0, "Distance should be positive"
            
            print(f"  - Alert {status['alert_id'][:12]}: ETA={status['eta_minutes']}min, Distance={status['distance_km']}km")
            
            # Verify both locations exist
            assert status.get("beneficiary_location"), "Should have beneficiary_location for ETA"
            assert status.get("intervenant_location"), "Should have intervenant_location for ETA"
        else:
            print("  - No alerts with ETA (requires active intervention with tracking)")

    def test_eta_not_returned_without_intervenant_location(self, api_client, guardian_token):
        """GET /api/alerts/live-active returns null ETA when intervenant_location is missing"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find alert with beneficiary location but no intervenant location
        alerts_no_iv = [s for s in data if s.get("beneficiary_location") and not s.get("intervenant_location")]
        
        print(f"PASS: Found {len(alerts_no_iv)} alerts with beneficiary location but no intervenant location")
        
        if len(alerts_no_iv) > 0:
            status = alerts_no_iv[0]
            # ETA should be null when intervenant location is missing
            assert status.get("eta_minutes") is None, f"ETA should be null without intervenant, got {status.get('eta_minutes')}"
            assert status.get("distance_km") is None, f"Distance should be null without intervenant, got {status.get('distance_km')}"
            print(f"  - Alert {status['alert_id'][:12]}: ETA correctly null (no intervenant location)")

    def test_eta_uses_haversine_formula(self, api_client, guardian_token):
        """Verify ETA calculation uses Haversine formula for accurate GPS distance"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find alert with both locations
        alerts_with_both = [s for s in data if s.get("beneficiary_location") and s.get("intervenant_location")]
        
        if len(alerts_with_both) == 0:
            pytest.skip("No alerts with both locations to verify Haversine")
        
        status = alerts_with_both[0]
        ben_loc = status["beneficiary_location"]
        iv_loc = status["intervenant_location"]
        
        # Calculate expected distance using our implementation
        expected_dist = haversine_km(ben_loc["lat"], ben_loc["lng"], iv_loc["lat"], iv_loc["lng"])
        actual_dist = status["distance_km"]
        
        # Allow small tolerance for rounding
        assert abs(expected_dist - actual_dist) < 0.1, f"Haversine mismatch: expected ~{expected_dist:.2f}km, got {actual_dist}km"
        
        print(f"PASS: Haversine calculation verified - {actual_dist}km matches expected ~{expected_dist:.2f}km")

    def test_eta_ranges_by_distance(self, api_client, guardian_token):
        """Verify ETA estimates are reasonable based on distance"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        alerts_with_eta = [s for s in data if s.get("eta_minutes") is not None]
        
        if len(alerts_with_eta) == 0:
            pytest.skip("No alerts with ETA to test ranges")
        
        for status in alerts_with_eta:
            dist = status["distance_km"]
            eta = status["eta_minutes"]
            
            # Verify ETA is reasonable for distance
            # Walking: <0.5km ~4min/km, Urban: <5km ~3min/km, Highway: >5km ~1.5min/km
            if dist < 0.5:
                assert eta >= 1, f"Very short distance should have ETA >= 1min"
            elif dist < 5:
                assert eta >= 2, f"Urban distance should have ETA >= 2min"
            else:
                assert eta >= 5, f"Long distance should have ETA >= 5min"
            
            print(f"PASS: ETA {eta}min is reasonable for distance {dist}km")


class TestSpecificAlertWithETA:
    """Test specific alert 71f6654e which has tracking data"""

    def test_alert_71f6654e_has_eta_data(self, api_client, guardian_token):
        """Alert 71f6654e should have ETA data from intervention tracking"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find the specific alert
        target_alert = None
        for s in data:
            if s.get("alert_id", "").startswith(ETA_TEST_ALERT_ID):
                target_alert = s
                break
        
        if target_alert is None:
            pytest.skip(f"Alert {ETA_TEST_ALERT_ID} not found in live-active")
        
        # This alert should have:
        # - beneficiary at ~45.4737, 4.5134
        # - intervenant at ~45.458, 4.492
        # - ~2.43km apart, ETA ~7min
        
        assert target_alert.get("beneficiary_location"), "Should have beneficiary_location"
        assert target_alert.get("intervenant_location"), "Should have intervenant_location"
        assert target_alert.get("eta_minutes"), "Should have eta_minutes"
        assert target_alert.get("distance_km"), "Should have distance_km"
        
        eta = target_alert["eta_minutes"]
        dist = target_alert["distance_km"]
        
        # Verify approximate values (allowing some tolerance)
        assert 1.5 <= dist <= 4.0, f"Distance should be ~2.43km, got {dist}km"
        assert 4 <= eta <= 15, f"ETA should be ~7min, got {eta}min"
        
        print(f"PASS: Alert {ETA_TEST_ALERT_ID} has ETA={eta}min, Distance={dist}km")
        print(f"  - Beneficiary: {target_alert['beneficiary_location']}")
        print(f"  - Intervenant: {target_alert['intervenant_location']}")


class TestJosetteGuardians:
    """Test that Josette Zuchiatti only has 3 guardians (Clement and Julianne removed)"""

    def test_josette_has_3_guardians(self, api_client, admin_token):
        """Josette should have exactly 3 guardians: Claire Martin, Pierre Durand, Marie Dupont"""
        # Get all users via backoffice endpoint and filter for Josette
        response = api_client.get(
            f"{BASE_URL}/api/backoffice/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get users: {response.status_code}"
        
        users = response.json()
        josette = None
        for u in users:
            if u.get("id") == JOSETTE_ID or "Josette" in u.get("name", ""):
                josette = u
                break
        
        assert josette is not None, f"Josette not found in backoffice users"
        
        guardians = josette.get("guardians", [])
        
        # Count guardians
        guardian_count = len(guardians) if guardians else 0
        assert guardian_count == 3, f"Josette should have 3 guardians, got {guardian_count}"
        
        print(f"PASS: Josette has exactly 3 guardians (IDs: {guardians})")
        
        # Verify Clement and Julianne are NOT in the list by checking all users
        clement_id = None
        julianne_id = None
        for u in users:
            name = u.get("name", "").lower()
            if "clement" in name and "zuchiatti" in name:
                clement_id = u.get("id")
            if "julianne" in name and "zuchiatti" in name:
                julianne_id = u.get("id")
        
        if clement_id:
            assert clement_id not in guardians, f"Clement ({clement_id}) should be removed from guardians"
            print(f"PASS: Clement ({clement_id}) not in Josette's guardians")
        
        if julianne_id:
            assert julianne_id not in guardians, f"Julianne ({julianne_id}) should be removed from guardians"
            print(f"PASS: Julianne ({julianne_id}) not in Josette's guardians")


class TestInterventionAcceptAdvancesLiveStatus:
    """Test that guardian accept-as-guardian advances live status"""

    def test_accept_as_guardian_endpoint_exists(self, api_client, guardian_token):
        """POST /api/interventions/accept-as-guardian endpoint should exist"""
        # Test with invalid data just to verify endpoint exists
        response = api_client.post(
            f"{BASE_URL}/api/interventions/accept-as-guardian",
            json={"alert_id": "invalid-test-id"},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        
        # Should get 404 for alert not found, not 405 method not allowed
        assert response.status_code in [200, 404, 409, 422], f"Unexpected status: {response.status_code}"
        
        print(f"PASS: POST /api/interventions/accept-as-guardian endpoint exists (got {response.status_code})")


class TestInterventionTrackingLocation:
    """Test intervention tracking location updates reflected in live-active"""

    def test_intervention_tracking_location_in_live_active(self, api_client, guardian_token):
        """GET /api/alerts/live-active reflects intervention tracking location updates"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts/live-active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Look for statuses with intervention tracking
        statuses_with_tracking = [s for s in data if s.get("intervenant_location")]
        
        print(f"PASS: {len(statuses_with_tracking)} live statuses have intervenant_location from tracking")
        
        for status in statuses_with_tracking[:2]:  # Show first 2
            loc = status["intervenant_location"]
            print(f"  - Alert {status['alert_id'][:12]}: intervenant at ({loc['lat']}, {loc['lng']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
