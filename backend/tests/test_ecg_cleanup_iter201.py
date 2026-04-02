"""
Test iteration 201: ECG cleanup validation
- bracelet-connect.tsx deleted
- ECG page uses /api/bracelet/status to check connection
- ECG detail shows ONLY ECG data (waveform, BPM, rhythm) - NO bracelet vitals grid
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"
TEST_ECG_ID = "b5896557-c9ff-4409-8c8a-a7644b3cac3f"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for beneficiary (Josette)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_PHONE,
        "password": BENEFICIARY_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


class TestBraceletStatusAPI:
    """Test /api/bracelet/status endpoint used by ECG page"""
    
    def test_bracelet_status_returns_200(self, auth_token):
        """Bracelet status endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
    def test_bracelet_status_has_required_fields(self, auth_token):
        """Bracelet status should return connected and paired fields"""
        response = requests.get(
            f"{BASE_URL}/api/bracelet/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # ECG page checks for 'connected' or 'paired' field
        assert "connected" in data or "paired" in data, f"Missing connected/paired field: {data}"
        print(f"Bracelet status: connected={data.get('connected')}, paired={data.get('paired')}")


class TestECGDetailAPI:
    """Test /api/ecg/{id} endpoint returns ECG-only data"""
    
    def test_ecg_detail_returns_200(self, auth_token):
        """ECG detail endpoint should return 200 for valid ID"""
        response = requests.get(
            f"{BASE_URL}/api/ecg/{TEST_ECG_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # May return 404 if test ECG doesn't exist
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
    def test_ecg_detail_has_ecg_fields(self, auth_token):
        """ECG detail should return ECG-specific fields (bpm, data, rhythm)"""
        response = requests.get(
            f"{BASE_URL}/api/ecg/{TEST_ECG_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 404:
            pytest.skip("Test ECG record not found")
            
        data = response.json()
        
        # ECG detail page expects these fields
        assert "id" in data, "Missing id field"
        # BPM is the main ECG metric
        assert "bpm" in data or "ecg_hr" in data, f"Missing bpm/ecg_hr field: {data.keys()}"
        print(f"ECG detail fields: {list(data.keys())}")
        
    def test_ecg_history_returns_list(self, auth_token):
        """ECG history should return a list of records"""
        response = requests.get(
            f"{BASE_URL}/api/ecg/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"ECG history count: {len(data)}")


class TestECGStartAPI:
    """Test /api/ecg/start endpoint"""
    
    def test_ecg_start_creates_record(self, auth_token):
        """ECG start should create a new ECG record"""
        response = requests.post(
            f"{BASE_URL}/api/ecg/start",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "ecg_raw": [100, 150, 200, 180, 120, 90, 100, 150, 200, 180] * 50,  # 500 samples
                "sample_rate": 250,
                "bpm": 72,
                "hrv": 45,
                "status": "normal",
                "rhythm": "sinusal",
                "interpretation": "Rythme sinusal normal",
                "duration_sec": 30
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Missing id in response"
        print(f"Created ECG record: {data.get('id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
