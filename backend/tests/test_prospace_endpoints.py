"""
Test ProSpace endpoints for coach/physio users
- GET /api/pro/all-programs - Get all programs for the professional
- POST /api/pro/programs/duplicate/{prog_id}/{ben_id} - Duplicate program to another beneficiary
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProSpaceEndpoints:
    """Test ProSpace API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as coach user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get beneficiaries
        ben_response = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        assert ben_response.status_code == 200
        self.beneficiaries = ben_response.json()
        
    def test_get_all_programs(self):
        """Test GET /api/pro/all-programs returns all programs for the professional"""
        response = self.session.get(f"{BASE_URL}/api/pro/all-programs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        programs = response.json()
        assert isinstance(programs, list), "Response should be a list"
        
        # Check program structure if any exist
        if len(programs) > 0:
            program = programs[0]
            assert "id" in program, "Program should have id"
            assert "title" in program, "Program should have title"
            assert "professional_id" in program, "Program should have professional_id"
            assert "beneficiary_id" in program, "Program should have beneficiary_id"
            print(f"Found {len(programs)} programs")
            print(f"First program: {program.get('title')}")
    
    def test_get_programs_for_beneficiary(self):
        """Test GET /api/pro/programs/{ben_id} returns programs for specific beneficiary"""
        if not self.beneficiaries:
            pytest.skip("No beneficiaries available")
        
        ben_id = self.beneficiaries[0]["id"]
        response = self.session.get(f"{BASE_URL}/api/pro/programs/{ben_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        programs = response.json()
        assert isinstance(programs, list), "Response should be a list"
        print(f"Found {len(programs)} programs for beneficiary {ben_id}")
    
    def test_get_reminders_for_beneficiary(self):
        """Test GET /api/pro/reminders/{ben_id} returns reminders for specific beneficiary"""
        if not self.beneficiaries:
            pytest.skip("No beneficiaries available")
        
        ben_id = self.beneficiaries[0]["id"]
        response = self.session.get(f"{BASE_URL}/api/pro/reminders/{ben_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        reminders = response.json()
        assert isinstance(reminders, list), "Response should be a list"
        print(f"Found {len(reminders)} reminders for beneficiary {ben_id}")
    
    def test_get_meals_for_beneficiary(self):
        """Test GET /api/pro/meals/{ben_id} returns meals for specific beneficiary"""
        if not self.beneficiaries:
            pytest.skip("No beneficiaries available")
        
        ben_id = self.beneficiaries[0]["id"]
        response = self.session.get(f"{BASE_URL}/api/pro/meals/{ben_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        meals = response.json()
        assert isinstance(meals, list), "Response should be a list"
        print(f"Found {len(meals)} meals for beneficiary {ben_id}")
    
    def test_create_program(self):
        """Test POST /api/pro/programs/{ben_id} creates a new program"""
        if not self.beneficiaries:
            pytest.skip("No beneficiaries available")
        
        ben_id = self.beneficiaries[0]["id"]
        program_data = {
            "title": "TEST_Programme de test",
            "description": "Programme de test pour validation",
            "frequency": "2x/semaine",
            "duration_weeks": 4,
            "category": "general"
        }
        
        response = self.session.post(f"{BASE_URL}/api/pro/programs/{ben_id}", json=program_data)
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        program = response.json()
        assert "id" in program, "Created program should have id"
        assert program.get("title") == program_data["title"], "Title should match"
        
        # Store for cleanup
        self.created_program_id = program.get("id")
        print(f"Created program: {program.get('id')}")
        
        # Cleanup - delete the test program
        if self.created_program_id:
            delete_response = self.session.delete(f"{BASE_URL}/api/pro/programs/edit/{self.created_program_id}")
            print(f"Cleanup: deleted program {self.created_program_id}")
    
    def test_duplicate_program_same_beneficiary(self):
        """Test POST /api/pro/programs/duplicate/{prog_id}/{ben_id} duplicates program"""
        # First get existing programs
        response = self.session.get(f"{BASE_URL}/api/pro/all-programs")
        assert response.status_code == 200
        
        programs = response.json()
        if not programs:
            pytest.skip("No programs available to duplicate")
        
        if not self.beneficiaries:
            pytest.skip("No beneficiaries available")
        
        prog_id = programs[0]["id"]
        ben_id = self.beneficiaries[0]["id"]
        
        # Duplicate to same beneficiary
        response = self.session.post(f"{BASE_URL}/api/pro/programs/duplicate/{prog_id}/{ben_id}")
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        result = response.json()
        print(f"Duplicated program result: {result}")
        
        # Cleanup - delete the duplicated program if it was created
        if "id" in result:
            delete_response = self.session.delete(f"{BASE_URL}/api/pro/programs/edit/{result['id']}")
            print(f"Cleanup: deleted duplicated program {result['id']}")


class TestProSpaceAuth:
    """Test ProSpace authentication requirements"""
    
    def test_all_programs_requires_auth(self):
        """Test GET /api/pro/all-programs requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/all-programs")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_programs_requires_auth(self):
        """Test GET /api/pro/programs/{ben_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/programs/test-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
