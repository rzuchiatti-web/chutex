"""
Iteration 71 - Backend tests for location permission and safezone features
Tests for:
1. Location update endpoint (POST /api/location/update)
2. Guardian geofence CRUD endpoints
3. Geofence check endpoint
4. Beneficiary location sync feeding guardian geofence current_location
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nora-health.preview.emergentagent.com').rstrip('/')

# Test credentials
GUARDIAN_EMAIL = "0612345678"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as guardian once for all tests"""
        if TestAuthAndSetup.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestAuthAndSetup.token = data.get('access_token') or data.get('token')
                print(f"Login successful - User: {data.get('user', {}).get('name', 'Unknown')}")
            else:
                print(f"Login failed: {response.status_code} - {response.text}")
        
        yield
    
    def test_guardian_login(self):
        """Test guardian can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert 'access_token' in data or 'token' in data, "No token in response"
        assert 'user' in data, "No user in response"
        print(f"Guardian login OK - {data['user'].get('name')}, role={data['user'].get('role')}")


class TestLocationEndpoints:
    """Test location update and retrieval endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        if TestAuthAndSetup.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestAuthAndSetup.token = data.get('access_token') or data.get('token')
        
        return {"Authorization": f"Bearer {TestAuthAndSetup.token}"}
    
    def test_location_update(self, auth_headers):
        """Test POST /api/location/update - beneficiary location sync"""
        test_lat = 48.8566 + (uuid.uuid4().int % 1000) / 100000  # Paris with slight variation
        test_lng = 2.3522 + (uuid.uuid4().int % 1000) / 100000
        
        response = requests.post(
            f"{BASE_URL}/api/location/update",
            json={"latitude": test_lat, "longitude": test_lng},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Location update failed: {response.text}"
        data = response.json()
        assert data.get('status') == 'updated', f"Unexpected status: {data}"
        print(f"Location update OK - lat={test_lat}, lng={test_lng}")
    
    def test_location_get(self, auth_headers):
        """Test GET /api/location/{user_id}"""
        response = requests.get(
            f"{BASE_URL}/api/location/{BENEFICIARY_ID}",
            headers=auth_headers
        )
        # Location may return 403 if sharing is restricted or 200 with location
        if response.status_code == 200:
            data = response.json()
            print(f"Location GET OK - lat={data.get('latitude')}, lng={data.get('longitude')}")
        elif response.status_code == 403:
            print("Location GET - sharing restricted (expected for some beneficiaries)")
        else:
            pytest.fail(f"Unexpected status: {response.status_code} - {response.text}")


class TestGuardianGeofenceEndpoints:
    """Test guardian geofence CRUD operations"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers"""
        if TestAuthAndSetup.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestAuthAndSetup.token = data.get('access_token') or data.get('token')
        
        return {"Authorization": f"Bearer {TestAuthAndSetup.token}"}
    
    created_zone_id = None
    
    def test_01_get_beneficiaries(self, auth_headers):
        """Test GET /api/guardian/beneficiaries - list linked beneficiaries"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get beneficiaries failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Got {len(data)} beneficiaries")
        if len(data) > 0:
            print(f"First beneficiary: {data[0].get('name')} (ID: {data[0].get('id')})")
    
    def test_02_get_geofences(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/geofence"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get geofences failed: {response.text}"
        data = response.json()
        assert 'zones' in data, f"Missing zones in response: {data}"
        assert 'current_location' in data, f"Missing current_location in response: {data}"
        print(f"Geofence data: {len(data['zones'])} zones, location={data.get('current_location')}")
    
    def test_03_create_geofence(self, auth_headers):
        """Test POST /api/guardian/beneficiary/{bid}/geofence"""
        zone_name = f"TEST_Zone_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            json={
                "name": zone_name,
                "latitude": 48.8566,
                "longitude": 2.3522,
                "radius_m": 500,
                "active": True
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create geofence failed: {response.text}"
        data = response.json()
        assert 'id' in data, f"Missing id in response: {data}"
        assert data['name'] == zone_name, f"Name mismatch: {data['name']}"
        TestGuardianGeofenceEndpoints.created_zone_id = data['id']
        print(f"Created zone: {data['id']} - {data['name']}")
    
    def test_04_update_geofence(self, auth_headers):
        """Test PUT /api/guardian/beneficiary/{bid}/geofence/{gid}"""
        if not TestGuardianGeofenceEndpoints.created_zone_id:
            pytest.skip("No zone created to update")
        
        gid = TestGuardianGeofenceEndpoints.created_zone_id
        new_name = f"TEST_Updated_{uuid.uuid4().hex[:6]}"
        response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{gid}",
            json={
                "name": new_name,
                "radius_m": 750
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update geofence failed: {response.text}"
        data = response.json()
        assert data['name'] == new_name, f"Name not updated: {data}"
        assert data['radius_m'] == 750, f"Radius not updated: {data}"
        print(f"Updated zone: {gid} - name={new_name}, radius=750m")
    
    def test_05_toggle_geofence(self, auth_headers):
        """Test PUT /api/guardian/beneficiary/{bid}/geofence/{gid}/toggle"""
        if not TestGuardianGeofenceEndpoints.created_zone_id:
            pytest.skip("No zone created to toggle")
        
        gid = TestGuardianGeofenceEndpoints.created_zone_id
        response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{gid}/toggle",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Toggle geofence failed: {response.text}"
        data = response.json()
        assert 'active' in data or 'status' in data, f"Missing toggle result: {data}"
        print(f"Toggled zone: {gid} - result={data}")
    
    def test_06_check_geofence(self, auth_headers):
        """Test POST /api/guardian/beneficiary/{bid}/geofence/check"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/check",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Check geofence failed: {response.text}"
        data = response.json()
        assert 'status' in data, f"Missing status in response: {data}"
        # Expected fields: status, in_zone, violations, total_fences, location
        print(f"Geofence check: status={data.get('status')}, in_zone={data.get('in_zone')}, violations={len(data.get('violations', []))}")
        if data.get('location'):
            print(f"  Location: lat={data['location'].get('latitude')}, lng={data['location'].get('longitude')}")
    
    def test_07_delete_geofence(self, auth_headers):
        """Test DELETE /api/guardian/beneficiary/{bid}/geofence/{gid}"""
        if not TestGuardianGeofenceEndpoints.created_zone_id:
            pytest.skip("No zone created to delete")
        
        gid = TestGuardianGeofenceEndpoints.created_zone_id
        response = requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{gid}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete geofence failed: {response.text}"
        data = response.json()
        assert data.get('status') == 'deleted', f"Delete status unexpected: {data}"
        print(f"Deleted zone: {gid}")
        TestGuardianGeofenceEndpoints.created_zone_id = None


class TestBeneficiaryDevicesAndAlerts:
    """Test beneficiary detail endpoints for guardian view"""
    
    @pytest.fixture
    def auth_headers(self):
        if TestAuthAndSetup.token is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": GUARDIAN_EMAIL,
                "password": GUARDIAN_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                TestAuthAndSetup.token = data.get('access_token') or data.get('token')
        
        return {"Authorization": f"Bearer {TestAuthAndSetup.token}"}
    
    def test_beneficiary_alerts(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/alerts"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/alerts",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Got {len(data)} alerts for beneficiary")
    
    def test_beneficiary_devices(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/devices"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/devices",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get devices failed: {response.text}"
        data = response.json()
        print(f"Devices: bracelet={data.get('bracelet') is not None}, scale={data.get('scale') is not None}, vest={data.get('vest') is not None}")
    
    def test_beneficiary_ai_report(self, auth_headers):
        """Test GET /api/guardian/beneficiary/{bid}/ai-report"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/ai-report",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get AI report failed: {response.text}"
        data = response.json()
        if data:
            print(f"AI Report summary: {data.get('summary', 'No summary')[:100]}...")
        else:
            print("AI Report: No data available")


class TestBeneficiaryGeofenceEndpoints:
    """Test beneficiary's own geofence endpoints (for location sync verification)"""
    
    beneficiary_token = None
    
    @pytest.fixture
    def beneficiary_auth_headers(self):
        """Try to login as beneficiary to test location update"""
        # Try beneficiary login - this may fail depending on credentials
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "+33651245918",
                "password": "test123"
            })
            if response.status_code == 200:
                data = response.json()
                TestBeneficiaryGeofenceEndpoints.beneficiary_token = data.get('access_token') or data.get('token')
                print(f"Beneficiary login OK: {data.get('user', {}).get('name')}")
                return {"Authorization": f"Bearer {TestBeneficiaryGeofenceEndpoints.beneficiary_token}"}
        except:
            pass
        
        # Fallback to guardian token for testing
        if TestAuthAndSetup.token:
            print("Using guardian token as fallback")
            return {"Authorization": f"Bearer {TestAuthAndSetup.token}"}
        
        return {}
    
    def test_own_geofences(self, beneficiary_auth_headers):
        """Test GET /api/geofence - user's own geofences"""
        if not beneficiary_auth_headers:
            pytest.skip("No auth available")
        
        response = requests.get(
            f"{BASE_URL}/api/geofence",
            headers=beneficiary_auth_headers
        )
        assert response.status_code == 200, f"Get own geofences failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Own geofences: {len(data)} zones")
    
    def test_geofence_check_own(self, beneficiary_auth_headers):
        """Test POST /api/geofence/check - check own position against zones"""
        if not beneficiary_auth_headers:
            pytest.skip("No auth available")
        
        response = requests.post(
            f"{BASE_URL}/api/geofence/check",
            headers=beneficiary_auth_headers
        )
        assert response.status_code == 200, f"Geofence check failed: {response.text}"
        data = response.json()
        print(f"Own geofence check: status={data.get('status')}, in_zone={data.get('in_zone')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
