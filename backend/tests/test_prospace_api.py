"""
ProSpace API Tests
Tests for the professional/coach space functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Coach credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"

class TestProSpaceAPI:
    """Tests for ProSpace (Espace Coach) API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as coach and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.user = data.get("user", {})
        self.headers = {"Authorization": f"Bearer {self.token}"}
        assert self.token, "No token received"
        assert self.user.get("professional_type") == "coach", "User is not a coach"
        print(f"Logged in as coach: {self.user.get('name')}")
    
    def test_get_guardian_beneficiaries(self):
        """Test GET /api/guardian/beneficiaries - Get list of beneficiaries"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert response.status_code == 200, f"Failed to get beneficiaries: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 1, "Should have at least 1 beneficiary"
        
        # Check beneficiary structure
        ben = data[0]
        assert "id" in ben, "Beneficiary should have id"
        assert "name" in ben, "Beneficiary should have name"
        print(f"Found {len(data)} beneficiaries")
        for b in data:
            print(f"  - {b.get('name')} ({b.get('id')})")
    
    def test_get_all_programs(self):
        """Test GET /api/pro/all-programs - Get all programs for coach"""
        response = requests.get(f"{BASE_URL}/api/pro/all-programs", headers=self.headers)
        assert response.status_code == 200, f"Failed to get all programs: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} total programs")
    
    def test_get_programs_for_beneficiary(self):
        """Test GET /api/pro/programs/{beneficiary_id} - Get programs for specific beneficiary"""
        # First get beneficiaries
        ben_response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert ben_response.status_code == 200
        beneficiaries = ben_response.json()
        
        if len(beneficiaries) > 0:
            ben_id = beneficiaries[0]["id"]
            response = requests.get(f"{BASE_URL}/api/pro/programs/{ben_id}", headers=self.headers)
            assert response.status_code == 200, f"Failed to get programs for beneficiary: {response.text}"
            
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            print(f"Found {len(data)} programs for {beneficiaries[0].get('name')}")
    
    def test_get_program_detail(self):
        """Test GET /api/pro/programs/detail/{program_id} - Get program details"""
        # First get all programs
        all_response = requests.get(f"{BASE_URL}/api/pro/all-programs", headers=self.headers)
        assert all_response.status_code == 200
        programs = all_response.json()
        
        if len(programs) > 0:
            # Find a program with sessions
            program_id = None
            for p in programs:
                if p.get("sessions") and len(p.get("sessions", [])) > 0:
                    program_id = p["id"]
                    break
            
            if not program_id:
                program_id = programs[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/pro/programs/detail/{program_id}", headers=self.headers)
            assert response.status_code == 200, f"Failed to get program detail: {response.text}"
            
            data = response.json()
            assert "id" in data, "Program should have id"
            assert "title" in data, "Program should have title"
            assert "beneficiary_name" in data, "Program should have beneficiary_name"
            assert "sessions" in data, "Program should have sessions"
            
            print(f"Program detail: {data.get('title')}")
            print(f"  - Beneficiary: {data.get('beneficiary_name')}")
            print(f"  - Sessions: {len(data.get('sessions', []))}")
            print(f"  - Frequency: {data.get('frequency')}")
            print(f"  - Duration: {data.get('duration_weeks')} weeks")
    
    def test_get_library_templates(self):
        """Test GET /api/pro/reminder-templates and /api/pro/meal-templates"""
        # Test reminder templates
        rem_response = requests.get(f"{BASE_URL}/api/pro/reminder-templates", headers=self.headers)
        assert rem_response.status_code == 200, f"Failed to get reminder templates: {rem_response.text}"
        rem_data = rem_response.json()
        assert isinstance(rem_data, list), "Reminder templates should be a list"
        print(f"Found {len(rem_data)} reminder templates")
        
        # Test meal templates
        meal_response = requests.get(f"{BASE_URL}/api/pro/meal-templates", headers=self.headers)
        assert meal_response.status_code == 200, f"Failed to get meal templates: {meal_response.text}"
        meal_data = meal_response.json()
        assert isinstance(meal_data, list), "Meal templates should be a list"
        print(f"Found {len(meal_data)} meal templates")
    
    def test_get_reminders_for_beneficiary(self):
        """Test GET /api/pro/reminders/{beneficiary_id} - Get reminders for beneficiary"""
        # First get beneficiaries
        ben_response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert ben_response.status_code == 200
        beneficiaries = ben_response.json()
        
        if len(beneficiaries) > 0:
            ben_id = beneficiaries[0]["id"]
            response = requests.get(f"{BASE_URL}/api/pro/reminders/{ben_id}", headers=self.headers)
            assert response.status_code == 200, f"Failed to get reminders: {response.text}"
            
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            print(f"Found {len(data)} reminders for {beneficiaries[0].get('name')}")
    
    def test_get_meals_for_beneficiary(self):
        """Test GET /api/pro/meals/{beneficiary_id} - Get meals for beneficiary"""
        # First get beneficiaries
        ben_response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert ben_response.status_code == 200
        beneficiaries = ben_response.json()
        
        if len(beneficiaries) > 0:
            ben_id = beneficiaries[0]["id"]
            response = requests.get(f"{BASE_URL}/api/pro/meals/{ben_id}", headers=self.headers)
            assert response.status_code == 200, f"Failed to get meals: {response.text}"
            
            data = response.json()
            # API returns dict with 'meals' key
            if isinstance(data, dict):
                meals = data.get("meals", [])
            else:
                meals = data
            assert isinstance(meals, list), "Meals should be a list"
            print(f"Found {len(meals)} meals for {beneficiaries[0].get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
