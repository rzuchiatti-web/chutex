"""
Test data-sharing settings API endpoints for health sharing permissions.
Tests GET/PUT /api/settings/data-sharing with health_sharing values: 'all', 'vitals_only', 'none'
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://glassmorphism-theme-1.preview.emergentagent.com')

# Test credentials - beneficiary
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"


class TestDataSharingAPI:
    """Test data-sharing settings endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as beneficiary (phone in email field)
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,
            "password": BENEFICIARY_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        
        data = login_response.json()
        self.token = data.get("token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
    def test_get_data_sharing_defaults(self):
        """GET /api/settings/data-sharing returns correct default values"""
        response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify structure - should have health_sharing, share_location, share_alerts
        assert "health_sharing" in data, "Missing health_sharing field"
        assert "share_location" in data, "Missing share_location field"
        assert "share_alerts" in data, "Missing share_alerts field"
        
        # Verify default values
        assert data["health_sharing"] in ["all", "vitals_only", "none"], f"Invalid health_sharing value: {data['health_sharing']}"
        assert isinstance(data["share_location"], bool), "share_location should be boolean"
        assert isinstance(data["share_alerts"], bool), "share_alerts should be boolean"
        
        print(f"GET data-sharing defaults: {data}")
        
    def test_put_data_sharing_all(self):
        """PUT /api/settings/data-sharing with health_sharing='all'"""
        payload = {
            "health_sharing": "all",
            "share_location": True,
            "share_alerts": True
        }
        
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["health_sharing"] == "all", f"Expected 'all', got {data['health_sharing']}"
        assert data["share_location"] == True
        assert data["share_alerts"] == True
        
        print(f"PUT health_sharing='all' verified: {data}")
        
    def test_put_data_sharing_vitals_only(self):
        """PUT /api/settings/data-sharing with health_sharing='vitals_only'"""
        payload = {
            "health_sharing": "vitals_only",
            "share_location": True,
            "share_alerts": True
        }
        
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["health_sharing"] == "vitals_only", f"Expected 'vitals_only', got {data['health_sharing']}"
        
        print(f"PUT health_sharing='vitals_only' verified: {data}")
        
    def test_put_data_sharing_none(self):
        """PUT /api/settings/data-sharing with health_sharing='none'"""
        payload = {
            "health_sharing": "none",
            "share_location": False,
            "share_alerts": False
        }
        
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify by GET
        get_response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["health_sharing"] == "none", f"Expected 'none', got {data['health_sharing']}"
        assert data["share_location"] == False
        assert data["share_alerts"] == False
        
        print(f"PUT health_sharing='none' verified: {data}")
        
    def test_put_data_sharing_toggle_location(self):
        """PUT /api/settings/data-sharing - toggle share_location"""
        # First set to True
        payload = {
            "health_sharing": "all",
            "share_location": True,
            "share_alerts": True
        }
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        assert response.status_code == 200
        
        # Then set to False
        payload["share_location"] = False
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        assert response.status_code == 200
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        data = get_response.json()
        assert data["share_location"] == False, "share_location toggle failed"
        
        print(f"Toggle share_location verified: {data}")
        
    def test_put_data_sharing_toggle_alerts(self):
        """PUT /api/settings/data-sharing - toggle share_alerts"""
        # First set to True
        payload = {
            "health_sharing": "all",
            "share_location": True,
            "share_alerts": True
        }
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        assert response.status_code == 200
        
        # Then set to False
        payload["share_alerts"] = False
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        assert response.status_code == 200
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        data = get_response.json()
        assert data["share_alerts"] == False, "share_alerts toggle failed"
        
        print(f"Toggle share_alerts verified: {data}")
        
    def test_data_sharing_requires_auth(self):
        """GET/PUT /api/settings/data-sharing requires authentication"""
        # Create new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        # GET without auth
        get_response = no_auth_session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert get_response.status_code in [401, 403], f"Expected 401/403 without auth, got {get_response.status_code}"
        
        # PUT without auth
        put_response = no_auth_session.put(f"{BASE_URL}/api/settings/data-sharing", json={
            "health_sharing": "all",
            "share_location": True,
            "share_alerts": True
        })
        assert put_response.status_code in [401, 403], f"Expected 401/403 without auth, got {put_response.status_code}"
        
        print("Auth required for data-sharing endpoints verified")
        
    def test_restore_defaults(self):
        """Restore default settings after tests"""
        payload = {
            "health_sharing": "all",
            "share_location": True,
            "share_alerts": True
        }
        response = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=payload)
        assert response.status_code == 200
        print("Restored default data-sharing settings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
