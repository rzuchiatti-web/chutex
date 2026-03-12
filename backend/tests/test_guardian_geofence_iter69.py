"""
Iteration 69 - Guardian Geofence CRUD API Tests
Tests guardian access control for managing safe zones of linked beneficiaries.
Endpoints tested:
- GET /api/guardian/beneficiary/{bid}/geofence - list zones + current location
- POST /api/guardian/beneficiary/{bid}/geofence - create zone
- PUT /api/guardian/beneficiary/{bid}/geofence/{gid} - update zone
- PUT /api/guardian/beneficiary/{bid}/geofence/{gid}/toggle - toggle active
- DELETE /api/guardian/beneficiary/{bid}/geofence/{gid} - delete zone
- POST /api/guardian/beneficiary/{bid}/geofence/check - check position
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://glassmorphism-dash.preview.emergentagent.com').rstrip('/')

# Test credentials from review_request
GUARDIAN_PHONE = "0612345678"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestGuardianGeofenceCRUD:
    """Tests for guardian safe zone management endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Authenticate as guardian and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_PHONE,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert "access_token" in data or "token" in data
        token = data.get("access_token") or data.get("token")
        print(f"Guardian login successful, user: {data.get('user', {}).get('name', 'Unknown')}")
        return token
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return auth headers for requests"""
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_01_guardian_login_and_role(self, auth_headers):
        """Verify guardian is logged in with correct role"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        user = response.json()
        assert user.get("role") == "guardian", f"Expected role guardian, got {user.get('role')}"
        print(f"Verified guardian user: {user.get('name')}, role: {user.get('role')}")
        # Check linked beneficiaries
        bens = user.get("beneficiaries", [])
        print(f"Guardian has {len(bens)} linked beneficiaries: {bens[:3]}...")
        assert BENEFICIARY_ID in bens, f"Beneficiary {BENEFICIARY_ID} not linked to guardian"
    
    def test_02_get_geofences_for_beneficiary(self, auth_headers):
        """GET /api/guardian/beneficiary/{bid}/geofence - list zones"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", headers=auth_headers)
        assert response.status_code == 200, f"GET geofences failed: {response.text}"
        data = response.json()
        assert "zones" in data, "Response should have 'zones' key"
        assert isinstance(data["zones"], list), "zones should be a list"
        print(f"Found {len(data['zones'])} existing zones for beneficiary")
        if data.get("current_location"):
            print(f"Beneficiary current location: {data['current_location']}")
    
    def test_03_create_geofence(self, auth_headers):
        """POST /api/guardian/beneficiary/{bid}/geofence - create zone"""
        payload = {
            "name": "TEST_Zone_Iter69",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "radius_m": 500,
            "active": True
        }
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Create geofence failed: {response.text}"
        zone = response.json()
        assert "id" in zone, "Created zone should have 'id'"
        assert zone["name"] == "TEST_Zone_Iter69"
        assert zone["latitude"] == 48.8566
        assert zone["longitude"] == 2.3522
        assert zone["radius_m"] == 500
        assert zone.get("active") is True
        print(f"Created zone: {zone['id']} - {zone['name']}")
        # Store for later tests
        self.__class__.created_zone_id = zone["id"]
    
    def test_04_verify_zone_in_list(self, auth_headers):
        """Verify created zone appears in list"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        zone_ids = [z["id"] for z in data["zones"]]
        assert self.__class__.created_zone_id in zone_ids, "Created zone not found in list"
        print(f"Zone {self.__class__.created_zone_id} found in list")
    
    def test_05_update_geofence(self, auth_headers):
        """PUT /api/guardian/beneficiary/{bid}/geofence/{gid} - update zone"""
        zone_id = self.__class__.created_zone_id
        payload = {
            "name": "TEST_Zone_Iter69_Updated",
            "radius_m": 750
        }
        response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Update geofence failed: {response.text}"
        updated = response.json()
        assert updated["name"] == "TEST_Zone_Iter69_Updated"
        assert updated["radius_m"] == 750
        print(f"Updated zone: {updated['name']}, radius: {updated['radius_m']}m")
    
    def test_06_toggle_geofence(self, auth_headers):
        """PUT /api/guardian/beneficiary/{bid}/geofence/{gid}/toggle - toggle active"""
        zone_id = self.__class__.created_zone_id
        # First toggle - should deactivate
        response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}/toggle",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Toggle geofence failed: {response.text}"
        result = response.json()
        assert "active" in result, "Toggle response should have 'active'"
        new_state = result["active"]
        print(f"Toggled zone, new active state: {new_state}")
        
        # Toggle again - should flip back
        response2 = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}/toggle",
            headers=auth_headers
        )
        assert response2.status_code == 200
        result2 = response2.json()
        assert result2["active"] != new_state, "Second toggle should flip state back"
        print(f"Toggled again, active state: {result2['active']}")
    
    def test_07_check_geofence_position(self, auth_headers):
        """POST /api/guardian/beneficiary/{bid}/geofence/check - check position"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/check",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Check geofence failed: {response.text}"
        result = response.json()
        assert "status" in result
        assert "in_zone" in result or result.get("status") == "no_location"
        print(f"Check result: status={result.get('status')}, in_zone={result.get('in_zone')}, violations={result.get('violations', [])}")
    
    def test_08_delete_geofence(self, auth_headers):
        """DELETE /api/guardian/beneficiary/{bid}/geofence/{gid} - delete zone"""
        zone_id = self.__class__.created_zone_id
        response = requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete geofence failed: {response.text}"
        result = response.json()
        assert result.get("status") == "deleted"
        print(f"Deleted zone: {zone_id}")
        
        # Verify deletion
        response2 = requests.get(f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", headers=auth_headers)
        assert response2.status_code == 200
        zone_ids = [z["id"] for z in response2.json()["zones"]]
        assert zone_id not in zone_ids, "Deleted zone should not appear in list"
        print("Verified zone no longer in list")
    
    def test_09_access_denied_for_unlinked_beneficiary(self, auth_headers):
        """Guardian should not access geofences of unlinked beneficiary"""
        fake_bid = "00000000-0000-0000-0000-000000000000"
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{fake_bid}/geofence",
            headers=auth_headers
        )
        assert response.status_code in [403, 404], f"Should deny access to unlinked beneficiary, got {response.status_code}"
        print(f"Access denied for unlinked beneficiary (status: {response.status_code})")
    
    def test_10_create_zone_with_invalid_coords_fails(self, auth_headers):
        """Creating zone with invalid coordinates should fail"""
        payload = {
            "name": "Invalid Zone",
            "latitude": "not-a-number",
            "longitude": 2.3522,
            "radius_m": 500
        }
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 400, f"Should reject invalid coords, got {response.status_code}"
        print("Invalid coordinates rejected as expected")


class TestGuardianBeneficiaryList:
    """Test guardian can see their beneficiaries"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_PHONE,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_guardian_beneficiaries_list(self, auth_headers):
        """GET /api/guardian/beneficiaries - list linked beneficiaries"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=auth_headers)
        assert response.status_code == 200, f"Get beneficiaries failed: {response.text}"
        bens = response.json()
        assert isinstance(bens, list)
        print(f"Guardian has {len(bens)} linked beneficiaries:")
        for b in bens[:5]:
            print(f"  - {b.get('name')} (id: {b.get('id')[:8]}...)")
        # Find our target beneficiary
        target = next((b for b in bens if b.get("id") == BENEFICIARY_ID), None)
        if target:
            print(f"Target beneficiary found: {target.get('name')}")
        else:
            print(f"WARNING: Target beneficiary {BENEFICIARY_ID} not in list")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
