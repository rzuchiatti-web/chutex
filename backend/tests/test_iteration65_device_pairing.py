"""
Test file for iteration 65: Device Pairing Flow
Tests the new /api/devices/associate endpoint and device management endpoints

Features tested:
- POST /api/devices/associate - creates device for bracelet/scale/vest (bracelet requires active subscription)
- GET /api/devices - returns non-removed devices only
- POST /api/devices/sync - syncs an existing device
- DELETE /api/devices/{id}/remove - marks device as removed
- Login with admin@chutex.fr / demo123 and +33651245918 / test123
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://whoop-clone-4.preview.emergentagent.com')
if not BASE_URL:
    BASE_URL = 'https://whoop-clone-4.preview.emergentagent.com'
BASE_URL = BASE_URL.rstrip('/')


class TestAuth:
    """Test authentication endpoints"""
    
    def test_login_admin(self, api_client):
        """Test login with admin credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        print(f"Admin login SUCCESS: role={data['user'].get('role')}")
        
    def test_login_beneficiary_with_subscription(self, api_client):
        """Test login with beneficiary who has active Care subscription (Robin Zuchiatti)"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        print(f"Beneficiary login SUCCESS: name={data['user'].get('name')}, role={data['user'].get('role')}")
        return data["token"]
        
    def test_login_teleassistance(self, api_client):
        """Test login with teleassistance credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "plateau@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Teleassistance login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        print(f"Teleassistance login SUCCESS: role={data['user'].get('role')}")
        
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.fixture
def beneficiary_token(api_client):
    """Get token for beneficiary with subscription"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "+33651245918",
        "password": "test123"
    })
    if response.status_code != 200:
        pytest.skip("Could not login as beneficiary - skipping authenticated tests")
    return response.json()["token"]


class TestDeviceAssociate:
    """Test POST /api/devices/associate endpoint"""
    
    def test_associate_bracelet_with_subscription(self, api_client, beneficiary_token):
        """Test associating bracelet for user with active subscription"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "bracelet"
        })
        # Should succeed (200/201) because user has Care subscription
        assert response.status_code in [200, 201], f"Associate bracelet failed: {response.text}"
        data = response.json()
        assert "status" in data, "Status not in response"
        assert data["status"] in ["associated", "reconnected"], f"Unexpected status: {data['status']}"
        assert "device" in data, "Device not in response"
        device = data["device"]
        assert device.get("device_type") == "bracelet"
        assert device.get("connected") == True
        print(f"Bracelet associated: status={data['status']}, battery={device.get('battery')}%")
        
    def test_associate_scale(self, api_client, beneficiary_token):
        """Test associating scale (no subscription required)"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "scale"
        })
        assert response.status_code in [200, 201], f"Associate scale failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["associated", "reconnected"]
        assert "device" in data
        device = data["device"]
        assert device.get("device_type") == "scale"
        print(f"Scale associated: status={data['status']}, name={device.get('name')}")
        
    def test_associate_vest(self, api_client, beneficiary_token):
        """Test associating vest (no subscription required)"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "vest"
        })
        assert response.status_code in [200, 201], f"Associate vest failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["associated", "reconnected"]
        assert "device" in data
        device = data["device"]
        assert device.get("device_type") == "vest"
        print(f"Vest associated: status={data['status']}, name={device.get('name')}")
        
    def test_associate_invalid_device_type(self, api_client, beneficiary_token):
        """Test associating invalid device type returns 400"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "invalid_device"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
    def test_associate_without_auth(self, api_client):
        """Test associating device without auth returns 401/403"""
        # Clear any existing auth header
        api_client.headers.pop("Authorization", None)
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "scale"
        })
        assert response.status_code in [401, 403, 422], f"Expected 401/403, got {response.status_code}"


class TestDeviceGet:
    """Test GET /api/devices endpoint"""
    
    def test_get_devices(self, api_client, beneficiary_token):
        """Test getting user's devices"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.get(f"{BASE_URL}/api/devices")
        assert response.status_code == 200, f"Get devices failed: {response.text}"
        devices = response.json()
        assert isinstance(devices, list), "Devices should be a list"
        # After association tests, should have some devices
        print(f"GET /api/devices: found {len(devices)} devices")
        for d in devices:
            assert "device_type" in d
            assert "user_id" in d
            assert d.get("removed") != True, "Removed devices should not be returned"
            print(f"  - {d.get('device_type')}: connected={d.get('connected')}, battery={d.get('battery')}%")
            
    def test_get_devices_without_auth(self, api_client):
        """Test getting devices without auth returns 401/403"""
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/devices")
        assert response.status_code in [401, 403, 422], f"Expected 401/403, got {response.status_code}"


class TestDeviceSync:
    """Test POST /api/devices/sync endpoint"""
    
    def test_sync_bracelet(self, api_client, beneficiary_token):
        """Test syncing bracelet device"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # First make sure bracelet is associated
        api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "bracelet"
        })
        
        response = api_client.post(f"{BASE_URL}/api/devices/sync", json={
            "device_type": "bracelet",
            "data": {}
        })
        assert response.status_code == 200, f"Sync bracelet failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] == "synced"
        assert "data" in data  # Generated health data
        assert "battery" in data
        assert "timestamp" in data
        print(f"Bracelet synced: battery={data.get('battery')}%, anomalies={len(data.get('anomalies', []))}")
        
    def test_sync_scale(self, api_client, beneficiary_token):
        """Test syncing scale device"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # First make sure scale is associated
        api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "scale"
        })
        
        response = api_client.post(f"{BASE_URL}/api/devices/sync", json={
            "device_type": "scale",
            "data": {"weight": 72.5}
        })
        assert response.status_code == 200, f"Sync scale failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] == "synced"
        assert "data" in data
        print(f"Scale synced: weight={data.get('data', {}).get('weight')}kg")
        
    def test_sync_vest(self, api_client, beneficiary_token):
        """Test syncing vest device"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # First make sure vest is associated
        api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "vest"
        })
        
        response = api_client.post(f"{BASE_URL}/api/devices/sync", json={
            "device_type": "vest",
            "data": {}
        })
        assert response.status_code == 200, f"Sync vest failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] == "synced"
        print(f"Vest synced: posture_score={data.get('data', {}).get('posture_score')}")
        
    def test_sync_nonexistent_device(self, api_client, beneficiary_token):
        """Test syncing device that doesn't exist returns 404"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # First remove the device if it exists
        response = api_client.post(f"{BASE_URL}/api/devices/remove-by-type", json={
            "device_type": "vest"
        })
        
        # Now try to sync a non-existent device
        response = api_client.post(f"{BASE_URL}/api/devices/sync", json={
            "device_type": "vest",
            "data": {}
        })
        assert response.status_code == 404, f"Expected 404 for non-existent device, got {response.status_code}"


class TestDeviceRemove:
    """Test DELETE /api/devices/{id}/remove endpoint"""
    
    def test_remove_device_by_id(self, api_client, beneficiary_token):
        """Test removing device by ID"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # First associate a device to get its ID
        assoc_response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "vest"
        })
        assert assoc_response.status_code in [200, 201], f"Associate failed: {assoc_response.text}"
        device_id = assoc_response.json().get("device", {}).get("id")
        
        if device_id:
            # Now remove it
            response = api_client.delete(f"{BASE_URL}/api/devices/{device_id}/remove")
            assert response.status_code == 200, f"Remove device failed: {response.text}"
            data = response.json()
            assert data.get("status") == "removed"
            print(f"Device {device_id} removed successfully")
            
            # Verify it's not returned in GET /api/devices
            get_response = api_client.get(f"{BASE_URL}/api/devices")
            devices = get_response.json()
            device_ids = [d.get("id") for d in devices]
            assert device_id not in device_ids, "Removed device should not appear in device list"
            print("Verified: removed device not in GET /api/devices response")
        else:
            pytest.skip("Could not get device ID for removal test")
            
    def test_remove_device_by_type(self, api_client, beneficiary_token):
        """Test removing device by type via POST /api/devices/remove-by-type"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # Associate a vest first
        api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "vest"
        })
        
        # Remove by type
        response = api_client.post(f"{BASE_URL}/api/devices/remove-by-type", json={
            "device_type": "vest"
        })
        assert response.status_code == 200, f"Remove by type failed: {response.text}"
        data = response.json()
        assert data.get("status") == "removed"
        print("Removed vest by type successfully")


class TestBraceletSubscriptionRequirement:
    """Test that bracelet association requires active subscription"""
    
    def test_bracelet_needs_subscription_check(self, api_client, beneficiary_token):
        """Verify bracelet association checks for subscription (user has Care sub, should pass)"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        response = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "bracelet"
        })
        # Robin Zuchiatti has Care subscription, so this should work
        assert response.status_code in [200, 201], f"User with subscription should be able to associate bracelet: {response.text}"
        print("Bracelet association with subscription: PASS")


class TestDeviceReassociation:
    """Test device re-association (reconnecting previously associated device)"""
    
    def test_reassociate_already_associated_device(self, api_client, beneficiary_token):
        """Test that associating already-associated device returns 'reconnected'"""
        api_client.headers.update({"Authorization": f"Bearer {beneficiary_token}"})
        
        # Associate scale first
        response1 = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "scale"
        })
        assert response1.status_code in [200, 201]
        status1 = response1.json().get("status")
        
        # Associate again
        response2 = api_client.post(f"{BASE_URL}/api/devices/associate", json={
            "device_type": "scale"
        })
        assert response2.status_code in [200, 201]
        status2 = response2.json().get("status")
        
        # Second call should return 'reconnected' since device already exists
        assert status2 == "reconnected", f"Expected 'reconnected' for already associated device, got '{status2}'"
        print(f"First association: {status1}, Second: {status2}")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
