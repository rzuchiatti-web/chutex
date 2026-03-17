"""
Test suite for Programs API - Iteration 110
Tests the /api/programs/catalog and /api/programs/detail/{id} endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://card-shadows-border.preview.emergentagent.com')

class TestProgramsAPI:
    """Programs API endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token before each test class"""
        self.base_url = BASE_URL.rstrip('/')
        # Login to get token
        login_response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
        else:
            self.token = None
    
    def test_login_beneficiary(self):
        """Test login with beneficiary credentials"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "beneficiary"
    
    def test_programs_catalog_requires_auth(self):
        """Test that programs catalog endpoint requires authentication"""
        response = requests.get(f"{self.base_url}/api/programs/catalog")
        # Without token, should return 401 or error
        assert response.status_code in [401, 403] or "Token" in response.text
    
    def test_programs_catalog_with_auth(self):
        """Test programs catalog endpoint returns valid data"""
        if not self.token:
            pytest.skip("Authentication failed - skipping authenticated tests")
        
        response = requests.get(
            f"{self.base_url}/api/programs/catalog",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "programs" in data
        assert isinstance(data["programs"], list)
        assert len(data["programs"]) > 0
        
        # Verify first program structure
        first_program = data["programs"][0]
        assert "id" in first_program
        assert "title" in first_program
        assert "duration_days" in first_program
        assert "category" in first_program
    
    def test_program_detail_without_auth(self):
        """Test that program detail endpoint works without auth (public endpoint)"""
        response = requests.get(f"{self.base_url}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["id"] == "prog-sleep-21"
        assert "title" in data
        assert "21 jours pour mieux dormir" in data["title"]
    
    def test_program_detail_sleep_program(self):
        """Test sleep program detail has correct structure"""
        response = requests.get(f"{self.base_url}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields
        assert data["id"] == "prog-sleep-21"
        assert data["duration_days"] == 21
        assert data["category"] == "sommeil"
        assert "phases" in data
        assert len(data["phases"]) == 3  # Sleep program has 3 phases
        assert "benefits" in data
        assert "tracked_metrics" in data
        assert "onboarding_fields" in data
    
    def test_program_detail_tension_program(self):
        """Test tension program detail has correct structure"""
        response = requests.get(f"{self.base_url}/api/programs/detail/prog-tension-14")
        assert response.status_code == 200
        data = response.json()
        
        # Verify specific fields
        assert data["id"] == "prog-tension-14"
        assert data["duration_days"] == 14
        assert data["category"] == "cardiovasculaire"
        assert "phases" in data
        assert len(data["phases"]) == 2  # Tension program has 2 phases
    
    def test_program_detail_activity_program(self):
        """Test activity program detail"""
        response = requests.get(f"{self.base_url}/api/programs/detail/prog-activity-30")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "prog-activity-30"
        assert data["duration_days"] == 30
        assert data["category"] == "activite"
    
    def test_program_detail_nutrition_program(self):
        """Test nutrition program detail"""
        response = requests.get(f"{self.base_url}/api/programs/detail/prog-nutrition-21")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "prog-nutrition-21"
        assert data["duration_days"] == 21
        assert data["category"] == "nutrition"
    
    def test_program_detail_invalid_id(self):
        """Test program detail with invalid ID returns 404"""
        response = requests.get(f"{self.base_url}/api/programs/detail/invalid-program-id")
        assert response.status_code == 404
    
    def test_programs_catalog_contains_expected_programs(self):
        """Test catalog contains all expected programs"""
        if not self.token:
            pytest.skip("Authentication failed - skipping authenticated tests")
        
        response = requests.get(
            f"{self.base_url}/api/programs/catalog",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        program_ids = [p["id"] for p in data["programs"]]
        
        # Verify expected programs exist
        expected_programs = [
            "prog-sleep-21",
            "prog-tension-14", 
            "prog-activity-30",
            "prog-nutrition-21",
            "prog-balance-21",
            "prog-mental-21"
        ]
        
        for prog_id in expected_programs:
            assert prog_id in program_ids, f"Expected program {prog_id} not in catalog"
