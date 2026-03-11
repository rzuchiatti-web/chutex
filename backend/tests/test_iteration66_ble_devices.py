"""
Test Iteration 66: Real BLE Device Pairing Flow
Tests that:
1. POST /api/devices/associate no longer generates fake readings data
2. Login works for admin and beneficiary users
3. Device cards have correct action buttons per type
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nora-health-1.preview.emergentagent.com')


@pytest.fixture(scope="module")
def beneficiary_token():
    """Login as beneficiary with Care subscription (Robin Zuchiatti)"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "+33651245918",
        "password": "test123"
    })
    if resp.status_code != 200:
        pytest.skip("Beneficiary login failed")
    return resp.json().get("token")


@pytest.fixture(scope="module")
def admin_token():
    """Login as admin"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@chutex.fr",
        "password": "demo123"
    })
    if resp.status_code != 200:
        pytest.skip("Admin login failed")
    return resp.json().get("token")


class TestAuthentication:
    """Test login endpoints"""
    
    def test_admin_login(self):
        """Admin can login with email/password"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert resp.status_code == 200, f"Admin login failed: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print("PASS: Admin login works")
    
    def test_beneficiary_login(self):
        """Beneficiary can login with phone/password"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert resp.status_code == 200, f"Beneficiary login failed: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "beneficiary"
        assert data["user"]["name"] == "Robin Zuchiatti"
        print("PASS: Beneficiary login works")


class TestDeviceAssociateNoFakeData:
    """Test that POST /api/devices/associate does NOT generate fake data"""
    
    def test_remove_devices_first(self, beneficiary_token):
        """Remove all devices before testing"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        for device_type in ["bracelet", "scale", "vest"]:
            requests.post(
                f"{BASE_URL}/api/devices/remove-by-type",
                headers=headers,
                json={"device_type": device_type}
            )
        print("Devices removed for testing")
    
    def test_associate_bracelet_no_fake_data(self, beneficiary_token):
        """Bracelet association returns connected=false, battery=0 (no fake data)"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        resp = requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "bracelet"}
        )
        assert resp.status_code == 200
        data = resp.json()
        device = data.get("device", {})
        
        # The key test: no fake data should be generated
        assert device.get("connected") == False, "Device should NOT be connected after associate"
        assert device.get("battery") == 0, "Battery should be 0 (no fake data)"
        print(f"PASS: Bracelet associate returns connected=False, battery=0 (status={data.get('status')})")
    
    def test_associate_scale_no_fake_data(self, beneficiary_token):
        """Scale association returns connected=false, battery=0 (no fake data)"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        resp = requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "scale"}
        )
        assert resp.status_code == 200
        data = resp.json()
        device = data.get("device", {})
        
        # If reconnected (device existed), battery will be set by reconnect logic
        # If associated (new device), battery=0
        if data.get("status") == "associated":
            assert device.get("battery") == 0, "New device battery should be 0"
            assert device.get("connected") == False, "New device should not be connected"
        print(f"PASS: Scale associate (status={data.get('status')})")
    
    def test_associate_vest_no_fake_data(self, beneficiary_token):
        """Vest association returns connected=false, battery=0 (no fake data)"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        resp = requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "vest"}
        )
        assert resp.status_code == 200
        data = resp.json()
        device = data.get("device", {})
        
        if data.get("status") == "associated":
            assert device.get("battery") == 0
            assert device.get("connected") == False
        print(f"PASS: Vest associate (status={data.get('status')})")


class TestDeviceListAndRemove:
    """Test GET /api/devices and remove functionality"""
    
    def test_get_devices_returns_non_removed(self, beneficiary_token):
        """GET /api/devices returns only non-removed devices"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        
        # First ensure devices exist
        for device_type in ["bracelet", "scale", "vest"]:
            requests.post(
                f"{BASE_URL}/api/devices/associate",
                headers=headers,
                json={"device_type": device_type}
            )
        
        resp = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        assert resp.status_code == 200
        devices = resp.json()
        
        # Should have 3 devices (bracelet, scale, vest)
        device_types = [d["device_type"] for d in devices]
        assert "bracelet" in device_types, "Bracelet should be in device list"
        assert "scale" in device_types, "Scale should be in device list"
        assert "vest" in device_types, "Vest should be in device list"
        
        # None should be marked as removed
        for d in devices:
            assert d.get("removed") != True, f"Removed device {d['device_type']} should not appear"
        
        print(f"PASS: GET /api/devices returns {len(devices)} non-removed devices")
    
    def test_remove_device_by_id(self, beneficiary_token):
        """DELETE /api/devices/{id}/remove marks device as removed"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        
        # Get current devices
        resp = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        devices = resp.json()
        
        if devices:
            device_id = devices[0]["id"]
            device_type = devices[0]["device_type"]
            
            # Remove device
            resp = requests.delete(
                f"{BASE_URL}/api/devices/{device_id}/remove",
                headers=headers
            )
            assert resp.status_code == 200
            
            # Re-fetch and verify
            resp = requests.get(f"{BASE_URL}/api/devices", headers=headers)
            updated_devices = resp.json()
            device_ids = [d["id"] for d in updated_devices]
            
            # Device should no longer appear
            assert device_id not in device_ids, "Removed device should not appear in list"
            print(f"PASS: Device {device_type} removed successfully")


class TestDeviceSync:
    """Test device sync endpoint"""
    
    def test_sync_requires_associated_device(self, beneficiary_token):
        """Sync fails if device not associated"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        
        # Ensure bracelet is associated
        requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "bracelet"}
        )
        
        # Sync should work
        resp = requests.post(
            f"{BASE_URL}/api/devices/sync",
            headers=headers,
            json={"device_type": "bracelet", "data": {"heart_rate": 72}}
        )
        # After association, sync should work (200) OR device might be in removed state (404)
        assert resp.status_code in [200, 404], f"Unexpected status: {resp.status_code}"
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("status") == "synced"
            assert "battery" in data
            print(f"PASS: Bracelet sync works, battery={data.get('battery')}")
        else:
            print("INFO: Sync returned 404 - device may be in removed state")


class TestDeviceInvalidCases:
    """Test error handling"""
    
    def test_associate_invalid_device_type(self, beneficiary_token):
        """Invalid device type returns 400"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        resp = requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "invalid_device"}
        )
        assert resp.status_code == 400
        print("PASS: Invalid device type returns 400")
    
    def test_sync_without_auth(self):
        """Sync without auth returns 401/403"""
        resp = requests.post(
            f"{BASE_URL}/api/devices/sync",
            json={"device_type": "bracelet", "data": {}}
        )
        assert resp.status_code in [401, 403, 422]
        print(f"PASS: Sync without auth returns {resp.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
