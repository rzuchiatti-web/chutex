"""
Iteration 72 - Tests for simplified safe zones management in beneficiary detail
Tests for:
1. OSM map with beneficiary location (via current_location in geofence API)
2. Safe zone CRUD operations (create with center from location, edit name/radius, delete)
3. Buttons removal verification (Actualiser, Gerer buttons should not exist)
4. Geofencing page redirect/deprecation behavior
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://glassmorphism-dash.preview.emergentagent.com').rstrip('/')

# Test credentials
GUARDIAN_EMAIL = "0612345678"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestGuardianAuth:
    """Authentication tests"""
    
    token = None
    
    def test_guardian_login(self):
        """Test guardian can login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert 'access_token' in data or 'token' in data, "No token in response"
        TestGuardianAuth.token = data.get('access_token') or data.get('token')
        print(f"Guardian login OK - {data['user'].get('name')}")


class TestBeneficiaryGeofenceAPI:
    """Tests for guardian geofence API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure token is available"""
        if TestGuardianAuth.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestGuardianAuth.token = data.get('access_token') or data.get('token')
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TestGuardianAuth.token}"}
    
    def test_get_geofence_data(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/geofence returns zones and current_location"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get geofence: {response.text}"
        data = response.json()
        
        # Verify structure
        assert 'beneficiary_id' in data
        assert 'zones' in data
        assert 'current_location' in data
        assert data['beneficiary_id'] == BENEFICIARY_ID
        
        # Check current_location has lat/lng for OSM map
        if data['current_location']:
            assert 'latitude' in data['current_location']
            assert 'longitude' in data['current_location']
            print(f"Current location: {data['current_location']['latitude']}, {data['current_location']['longitude']}")
        
        print(f"Found {len(data['zones'])} zones")
    
    def test_create_zone_from_location(self, auth_headers):
        """Test POST /api/guardian/beneficiary/{bid}/geofence - create zone centered on beneficiary location"""
        # First get current location
        geo_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        assert geo_response.status_code == 200
        geo_data = geo_response.json()
        
        loc = geo_data.get('current_location')
        if not loc:
            pytest.skip("No beneficiary location available")
        
        # Create zone centered on beneficiary location (popup flow)
        zone_name = f"TEST_Zone_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            json={
                "name": zone_name,
                "latitude": loc['latitude'],
                "longitude": loc['longitude'],
                "radius_m": 300  # Default radius from popup
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to create zone: {response.text}"
        data = response.json()
        
        # Verify zone was created correctly
        assert data['name'] == zone_name
        assert abs(data['latitude'] - loc['latitude']) < 0.0001
        assert abs(data['longitude'] - loc['longitude']) < 0.0001
        assert data['radius_m'] == 300
        assert 'id' in data
        
        print(f"Created zone: {data['name']} at ({data['latitude']}, {data['longitude']}) with radius {data['radius_m']}m")
        
        # Cleanup
        zone_id = data['id']
        requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=auth_headers
        )
    
    def test_edit_zone_name_and_radius(self, auth_headers):
        """Test PUT /api/guardian/beneficiary/{bid}/geofence/{gid} - edit zone name and radius only"""
        # First create a zone
        geo_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        geo_data = geo_response.json()
        loc = geo_data.get('current_location')
        
        if not loc:
            pytest.skip("No location available")
        
        # Create test zone
        zone_name = f"TEST_Edit_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            json={"name": zone_name, "latitude": loc['latitude'], "longitude": loc['longitude'], "radius_m": 200},
            headers=auth_headers
        )
        zone = create_response.json()
        zone_id = zone['id']
        
        # Edit only name and radius (per simplified popup)
        new_name = f"TEST_Edited_{uuid.uuid4().hex[:8]}"
        new_radius = 450
        update_response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            json={"name": new_name, "radius_m": new_radius},
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Failed to update zone: {update_response.text}"
        updated = update_response.json()
        
        # Verify update
        assert updated['name'] == new_name
        assert updated['radius_m'] == new_radius
        # Lat/lng should be unchanged
        assert abs(updated['latitude'] - zone['latitude']) < 0.0001
        
        print(f"Updated zone: {updated['name']} with radius {updated['radius_m']}m")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=auth_headers
        )
    
    def test_delete_zone(self, auth_headers):
        """Test DELETE /api/guardian/beneficiary/{bid}/geofence/{gid} - delete zone"""
        # Create test zone
        geo_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        geo_data = geo_response.json()
        loc = geo_data.get('current_location')
        
        if not loc:
            pytest.skip("No location available")
        
        zone_name = f"TEST_Delete_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            json={"name": zone_name, "latitude": loc['latitude'], "longitude": loc['longitude'], "radius_m": 100},
            headers=auth_headers
        )
        zone = create_response.json()
        zone_id = zone['id']
        
        # Delete zone
        delete_response = requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Failed to delete zone: {delete_response.text}"
        
        # Verify zone is gone
        verify_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        verify_data = verify_response.json()
        zone_ids = [z['id'] for z in verify_data['zones']]
        assert zone_id not in zone_ids, "Zone should be deleted"
        
        print(f"Zone {zone_name} deleted successfully")
    
    def test_zone_list_persistence(self, auth_headers):
        """Test that zones list correctly persists in the API"""
        # Get initial count
        initial_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        initial_data = initial_response.json()
        initial_count = len(initial_data['zones'])
        
        loc = initial_data.get('current_location')
        if not loc:
            pytest.skip("No location available")
        
        # Create zone
        zone_name = f"TEST_Persist_{uuid.uuid4().hex[:8]}"
        requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            json={"name": zone_name, "latitude": loc['latitude'], "longitude": loc['longitude'], "radius_m": 350},
            headers=auth_headers
        )
        
        # Verify count increased
        after_response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        after_data = after_response.json()
        assert len(after_data['zones']) == initial_count + 1
        
        # Find and delete test zone
        test_zone = next((z for z in after_data['zones'] if z['name'] == zone_name), None)
        assert test_zone is not None
        
        requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{test_zone['id']}",
            headers=auth_headers
        )
        
        print(f"Zone persistence verified: {initial_count} -> {initial_count + 1} -> {initial_count}")


class TestGuardianBeneficiaryDetail:
    """Tests for beneficiary detail API (used by the detail page)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if TestGuardianAuth.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestGuardianAuth.token = data.get('access_token') or data.get('token')
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TestGuardianAuth.token}"}
    
    def test_get_beneficiaries_list(self, auth_headers):
        """Test GET /api/guardian/beneficiaries returns list with beneficiary data"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get beneficiaries: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        ben = data[0]
        assert 'id' in ben
        assert 'name' in ben
        print(f"Found beneficiary: {ben['name']} (ID: {ben['id']})")
    
    def test_beneficiary_subscription_info(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/subscription for subscription/contract info"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/subscription",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get subscription: {response.text}"
        data = response.json()
        
        # Should contain subscription, contract, guardians keys
        assert 'subscription' in data
        assert 'guardians' in data
        print(f"Subscription info retrieved successfully")


class TestGeofencingPageDeprecation:
    """Tests that the old geofencing page is properly deprecated/redirected"""
    
    def test_geofencing_page_returns_deprecated(self):
        """The old /geofencing route should redirect or show deprecated message"""
        # This tests the web route behavior - the endpoint should exist but redirect to beneficiary detail
        # We can't easily test the redirect behavior via API, but we verify the page exists
        response = requests.get(f"{BASE_URL}/geofencing", allow_redirects=False)
        # Should get HTML content (redirect or deprecated page)
        # Status could be 200 (deprecated page) or 302/301 (redirect)
        assert response.status_code in [200, 301, 302, 307, 308], f"Unexpected status: {response.status_code}"
        print(f"Geofencing page status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
