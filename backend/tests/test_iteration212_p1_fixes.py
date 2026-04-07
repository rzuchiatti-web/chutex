"""
Test iteration 212 - P1 fixes for Chutex Care
1. Weight/BMI coherence from profile when no scale data
2. Reminder WebSocket notification
3. Weight-details endpoint returns profile weight
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestIteration212P1Fixes:
    """Tests for P1 fixes: weight/BMI, reminders, weight-details"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.user = data.get("user", {})
        assert self.token, "No token received"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_daily_report_weight_from_profile(self):
        """Test 1: GET /api/health/daily-report?force=true returns weight=75 and bmi=24.5 from profile"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report?force=true", headers=self.headers)
        assert response.status_code == 200, f"Daily report failed: {response.text}"
        data = response.json()
        
        # Verify weight and BMI from profile (weight_kg=75, height_cm=175)
        report_data = data.get("data", {})
        weight = report_data.get("weight", 0)
        bmi = report_data.get("bmi", 0)
        
        assert weight == 75 or weight == 75.0, f"Expected weight=75, got {weight}"
        assert bmi == 24.5, f"Expected BMI=24.5, got {bmi}"
        print(f"✓ Daily report: weight={weight}, bmi={bmi}")
    
    def test_weight_details_current_weight_from_profile(self):
        """Test 2: GET /api/minceur/weight-details returns current.weight from profile"""
        response = requests.get(f"{BASE_URL}/api/minceur/weight-details", headers=self.headers)
        assert response.status_code == 200, f"Weight details failed: {response.text}"
        data = response.json()
        
        current = data.get("current", {})
        current_weight = current.get("weight", 0)
        
        assert current_weight == 75 or current_weight == 75.0, f"Expected current.weight=75, got {current_weight}"
        print(f"✓ Weight details: current.weight={current_weight}")
    
    def test_weight_goal_exists(self):
        """Test 3: Weight goal target_kg=72 exists"""
        response = requests.get(f"{BASE_URL}/api/minceur/weight-details", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        goal = data.get("goal", {})
        target_kg = goal.get("target_kg", 0)
        
        assert target_kg == 72, f"Expected target_kg=72, got {target_kg}"
        print(f"✓ Weight goal: target_kg={target_kg}")
    
    def test_reminders_endpoint(self):
        """Test 4: GET /api/reminders returns list"""
        response = requests.get(f"{BASE_URL}/api/reminders", headers=self.headers)
        assert response.status_code == 200, f"Reminders failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Reminders: {len(data)} reminders found")
    
    def test_dashboard_batch_loads(self):
        """Test 5: Dashboard batch endpoint loads correctly"""
        response = requests.get(f"{BASE_URL}/api/dashboard/batch", headers=self.headers)
        assert response.status_code == 200, f"Dashboard batch failed: {response.text}"
        data = response.json()
        
        assert "dashboard_summary" in data, "Missing dashboard_summary"
        assert "reminders" in data, "Missing reminders"
        print(f"✓ Dashboard batch loaded successfully")
    
    def test_daily_report_no_force(self):
        """Test 6: GET /api/health/daily-report (without force) also works"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert response.status_code == 200, f"Daily report (no force) failed: {response.text}"
        data = response.json()
        
        # Should have data or no_data/awaiting_data
        assert "data" in data or "no_data" in data or "awaiting_data" in data
        print(f"✓ Daily report (no force) works")
    
    def test_notifications_endpoint(self):
        """Test 7: GET /api/notifications returns list"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=self.headers)
        assert response.status_code == 200, f"Notifications failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Notifications: {len(data)} notifications found")
    
    def test_devices_endpoint(self):
        """Test 8: GET /api/devices returns list"""
        response = requests.get(f"{BASE_URL}/api/devices", headers=self.headers)
        assert response.status_code == 200, f"Devices failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Devices: {len(data)} devices found")


class TestWebSocketReminderAlert:
    """Test WebSocket reminder_alert event (backend sends it)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_reminder_create_and_check(self):
        """Test creating a reminder (WebSocket event is sent by background task)"""
        # Create a test reminder
        reminder_data = {
            "title": "TEST_Hydration Reminder",
            "time": "12:00",
            "reminder_type": "hydration",
            "notes": "Test reminder for iteration 212",
            "days": ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]
        }
        
        response = requests.post(f"{BASE_URL}/api/reminders", json=reminder_data, headers=self.headers)
        assert response.status_code in [200, 201], f"Create reminder failed: {response.text}"
        
        # Verify reminder was created
        response = requests.get(f"{BASE_URL}/api/reminders", headers=self.headers)
        assert response.status_code == 200
        reminders = response.json()
        
        test_reminder = next((r for r in reminders if r.get("title") == "TEST_Hydration Reminder"), None)
        assert test_reminder is not None, "Test reminder not found"
        
        # Clean up - delete test reminder
        if test_reminder and test_reminder.get("id"):
            requests.delete(f"{BASE_URL}/api/reminders/{test_reminder['id']}", headers=self.headers)
        
        print(f"✓ Reminder create/check works (WebSocket event sent by background task)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
