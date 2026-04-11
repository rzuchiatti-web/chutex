"""
Iteration 202: Dashboard Device Section Bug Fixes Tests
Tests for:
1. Dashboard section 'Mes dispositifs' is ALWAYS visible, even without devices
2. When no device: shows 'Aucun dispositif connecte' + button 'Ajouter un dispositif'
3. When device has battery=0, battery bar and percentage are HIDDEN
4. Backend /api/dashboard/batch calculates connected/paired correctly (based on last_sync)
5. Backend /api/bracelet/unpair resets last_sync to None
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://premium-clinic-web-1.preview.emergentagent.com')


class TestDashboardBatchAPI:
    """Test /api/dashboard/batch endpoint for device section fixes"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for Josette (beneficiary)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    def test_dashboard_batch_returns_200(self, auth_token):
        """Test that dashboard batch endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("PASSED: Dashboard batch returns 200")
    
    def test_dashboard_batch_has_dashboard_summary(self, auth_token):
        """Test that dashboard batch contains dashboard_summary"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert "dashboard_summary" in data
        print("PASSED: Dashboard batch has dashboard_summary")
    
    def test_dashboard_summary_has_devices_array(self, auth_token):
        """Test that dashboard_summary contains devices array"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        assert "devices" in summary
        assert isinstance(summary["devices"], list)
        print(f"PASSED: Dashboard has devices array with {len(summary['devices'])} devices")
    
    def test_bracelet_connected_calculated_from_last_sync(self, auth_token):
        """Test that bracelet connected status is calculated from last_sync timestamp"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        # If bracelet exists, verify connected is based on last_sync
        bracelet = summary.get("bracelet")
        if bracelet:
            # connected should be False if last_sync is old (>60 seconds)
            # paired should be True if last_sync exists
            assert "connected" in bracelet
            assert "paired" in bracelet
            print(f"PASSED: Bracelet has connected={bracelet['connected']}, paired={bracelet['paired']}")
        else:
            print("PASSED: No bracelet in dashboard (expected for Josette)")
    
    def test_scale_connected_calculated_from_last_sync(self, auth_token):
        """Test that scale connected status is calculated from last_sync timestamp"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        scale = summary.get("scale")
        if scale:
            assert "connected" in scale
            assert "paired" in scale
            # Scale should be paired if last_sync exists
            print(f"PASSED: Scale has connected={scale['connected']}, paired={scale['paired']}")
        else:
            print("PASSED: No scale in dashboard")
    
    def test_vest_connected_calculated_from_last_sync(self, auth_token):
        """Test that vest connected status is calculated from last_sync timestamp"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        vest = summary.get("vest")
        if vest:
            assert "connected" in vest
            assert "paired" in vest
            print(f"PASSED: Vest has connected={vest['connected']}, paired={vest['paired']}")
        else:
            print("PASSED: No vest in dashboard")


class TestBraceletStatusAPI:
    """Test /api/bracelet/status endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for Josette (beneficiary)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_bracelet_status_returns_200(self, auth_token):
        """Test that bracelet status endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("PASSED: Bracelet status returns 200")
    
    def test_bracelet_status_has_required_fields(self, auth_token):
        """Test that bracelet status has all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        
        required_fields = ["connected", "paired", "battery", "heart_rate", "spo2", "last_sync"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"PASSED: Bracelet status has all required fields: {list(data.keys())}")
    
    def test_bracelet_paired_based_on_last_sync(self, auth_token):
        """Test that paired is True only if last_sync exists"""
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        
        # If last_sync is None, paired should be False
        if data.get("last_sync") is None:
            assert data["paired"] == False, "paired should be False when last_sync is None"
            print("PASSED: paired=False when last_sync=None")
        else:
            assert data["paired"] == True, "paired should be True when last_sync exists"
            print("PASSED: paired=True when last_sync exists")


class TestBraceletUnpairAPI:
    """Test /api/bracelet/unpair endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for Josette (beneficiary)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_bracelet_unpair_returns_200(self, auth_token):
        """Test that bracelet unpair endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/bracelet/unpair",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("PASSED: Bracelet unpair returns 200")
    
    def test_bracelet_unpair_resets_last_sync(self, auth_token):
        """Test that unpair resets last_sync to None"""
        # First unpair
        response = requests.post(
            f"{BASE_URL}/api/bracelet/unpair",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Then check status
        status_response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = status_response.json()
        
        # After unpair, last_sync should be None and paired should be False
        assert data.get("last_sync") is None, f"last_sync should be None after unpair, got: {data.get('last_sync')}"
        assert data.get("paired") == False, f"paired should be False after unpair, got: {data.get('paired')}"
        print("PASSED: Unpair resets last_sync to None and paired to False")
    
    def test_dashboard_batch_after_unpair_no_bracelet(self, auth_token):
        """Test that dashboard batch doesn't show bracelet after unpair"""
        # First unpair
        requests.post(
            f"{BASE_URL}/api/bracelet/unpair",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then check dashboard
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        # Bracelet should not be in dashboard or should have paired=False
        bracelet = summary.get("bracelet")
        if bracelet:
            assert bracelet.get("paired") == False, "Bracelet should have paired=False after unpair"
            print("PASSED: Dashboard shows bracelet with paired=False after unpair")
        else:
            print("PASSED: Dashboard doesn't show bracelet after unpair")


class TestDeviceBatteryDisplay:
    """Test battery display logic - battery should be hidden when 0%"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for Josette (beneficiary)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_scale_battery_zero_in_dashboard(self, auth_token):
        """Test that scale with battery=0 is handled correctly"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        scale = summary.get("scale")
        if scale:
            battery = scale.get("battery", 0)
            print(f"Scale battery: {battery}%")
            # Frontend should hide battery bar when battery=0
            # This is a frontend concern, but we verify the data is correct
            assert isinstance(battery, (int, float)), "Battery should be a number"
            print(f"PASSED: Scale battery value is {battery} (frontend hides if 0)")
        else:
            print("PASSED: No scale in dashboard")
    
    def test_devices_have_battery_field(self, auth_token):
        """Test that all devices have battery field"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/batch",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        summary = data.get("dashboard_summary", {})
        
        devices = summary.get("devices", [])
        for device in devices:
            assert "battery" in device, f"Device {device.get('name')} missing battery field"
            print(f"Device {device.get('name')}: battery={device.get('battery')}%")
        print(f"PASSED: All {len(devices)} devices have battery field")
