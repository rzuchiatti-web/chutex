"""
P0 Tests - Zero Data for Users Without Devices
Tests for:
1. /api/devices/dashboard-summary returns zeros when user has no devices
2. /api/health/daily-report returns no_data: true when user has no devices
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://whoop-dashboard.preview.emergentagent.com')


class TestZeroDataForNewUsers:
    """Test that new users without devices see zero/null data, not simulated values"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a new test user without any devices"""
        self.test_user = {
            "name": "TestZeroUser",
            "email": f"testzero_{os.urandom(4).hex()}@test.com",
            "phone": f"+336{os.urandom(4).hex()[:8]}",
            "password": "test123",
            "role": "beneficiary"
        }
        # Register new user
        resp = requests.post(f"{BASE_URL}/api/auth/register", json=self.test_user)
        if resp.status_code == 200:
            data = resp.json()
            self.token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
        else:
            pytest.skip(f"Could not create test user: {resp.status_code} - {resp.text}")
        yield
        # Cleanup: We don't delete user to avoid complexity
    
    def test_dashboard_summary_returns_zeros_for_bracelet(self):
        """P0: Bracelet data should be zeros when no bracelet device exists"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        # Verify bracelet section exists and has zero values
        bracelet = data.get("bracelet", {})
        assert bracelet.get("heart_rate") == 0, f"Expected heart_rate=0, got {bracelet.get('heart_rate')}"
        assert bracelet.get("spo2") == 0, f"Expected spo2=0, got {bracelet.get('spo2')}"
        assert bracelet.get("steps") == 0, f"Expected steps=0, got {bracelet.get('steps')}"
        assert bracelet.get("battery") == 0, f"Expected battery=0, got {bracelet.get('battery')}"
        assert bracelet.get("connected") == False, f"Expected connected=False"
        assert bracelet.get("paired") == False, f"Expected paired=False"
        
        # Blood pressure should have systolic and diastolic as 0
        bp = bracelet.get("blood_pressure", {})
        assert bp.get("systolic") == 0, f"Expected systolic=0, got {bp.get('systolic')}"
        assert bp.get("diastolic") == 0, f"Expected diastolic=0, got {bp.get('diastolic')}"
        
        print("PASS: Bracelet returns zeros for user without devices")
    
    def test_dashboard_summary_returns_zeros_for_scale(self):
        """P0: Scale data should be zeros when no scale device exists"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        scale = data.get("scale", {})
        assert scale.get("weight") == 0, f"Expected weight=0, got {scale.get('weight')}"
        assert scale.get("bmi") == 0, f"Expected bmi=0, got {scale.get('bmi')}"
        assert scale.get("body_fat") == 0, f"Expected body_fat=0, got {scale.get('body_fat')}"
        assert scale.get("battery") == 0, f"Expected battery=0, got {scale.get('battery')}"
        assert scale.get("connected") == False
        assert scale.get("paired") == False
        
        print("PASS: Scale returns zeros for user without devices")
    
    def test_dashboard_summary_returns_zeros_for_vest(self):
        """P0: Vest data should be zeros when no vest device exists"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        vest = data.get("vest", {})
        assert vest.get("posture_score") == 0, f"Expected posture_score=0, got {vest.get('posture_score')}"
        assert vest.get("battery") == 0, f"Expected battery=0, got {vest.get('battery')}"
        assert vest.get("connected") == False
        assert vest.get("paired") == False
        
        print("PASS: Vest returns zeros for user without devices")
    
    def test_dashboard_summary_returns_null_for_sleep(self):
        """P0: Sleep data should be null when no bracelet device exists"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        sleep = data.get("sleep")
        assert sleep is None, f"Expected sleep=None, got {sleep}"
        
        print("PASS: Sleep returns null for user without devices")
    
    def test_daily_report_returns_no_data_true(self):
        """P0: /api/health/daily-report should return no_data: true when user has no devices"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data.get("no_data") == True, f"Expected no_data=True, got {data.get('no_data')}"
        
        # Verify score_info has correct empty state
        score_info = data.get("score_info", {})
        assert score_info.get("score") == 0, f"Expected score=0"
        assert score_info.get("status") == "Aucune donnee", f"Expected status='Aucune donnee'"
        
        # Verify AI insights reflect no-data state
        ai_insights = data.get("ai_insights", {})
        assert "Connectez un appareil" in ai_insights.get("hero_line", ""), "AI insights should mention connecting a device"
        
        print("PASS: daily-report returns no_data=true for user without devices")
    
    def test_health_summary_returns_no_data_state(self):
        """P0: /api/health/summary should return no_data state when user has no devices"""
        headers = {"Authorization": f"Bearer {self.token}"}
        resp = requests.get(f"{BASE_URL}/api/health/summary", headers=headers)
        
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("no_data") == True, f"Expected no_data=True, got {data.get('no_data')}"
        assert data.get("score") == 0, f"Expected score=0"
        assert "Aucune donnee" in data.get("status", ""), "Status should indicate no data"
        
        print("PASS: health/summary returns no_data state for user without devices")


class TestAdminLogin:
    """Test admin login works correctly"""
    
    def test_admin_login_success(self):
        """Admin can login with correct credentials"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "phone": "600000001",
            "password": "demo123"
        })
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "token" in data, "Response should contain token"
        assert data.get("user", {}).get("role") == "admin", "User should be admin"
        
        print("PASS: Admin login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
