"""
Iteration 111 Tests: Program Features - Team Data, Program Detail, Active Program
Tests for:
- Program detail API
- Active program with team data
- Team members display (simulated data)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://card-shadows-border.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for test user (Josette)"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_PHONE,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestProgramDetailAPI:
    """Tests for /api/programs/detail/{id} endpoint"""
    
    def test_get_program_detail_sleep(self, api_client):
        """Test getting sleep program detail (prog-sleep-21)"""
        response = api_client.get(f"{BASE_URL}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200, f"Failed to get program detail: {response.text}"
        
        data = response.json()
        # Verify program structure
        assert data["id"] == "prog-sleep-21"
        assert data["title"] == "21 jours pour mieux dormir"
        assert data["duration_days"] == 21
        assert data["category"] == "sommeil"
        assert "phases" in data
        assert "benefits" in data
        assert "onboarding_fields" in data
        
    def test_get_program_detail_nutrition(self, api_client):
        """Test getting nutrition program detail (prog-nutrition-21)"""
        response = api_client.get(f"{BASE_URL}/api/programs/detail/prog-nutrition-21")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == "prog-nutrition-21"
        assert "title" in data
        assert data["duration_days"] == 21
        
    def test_get_program_detail_invalid_id(self, api_client):
        """Test 404 for non-existent program"""
        response = api_client.get(f"{BASE_URL}/api/programs/detail/invalid-program-id")
        assert response.status_code == 404


class TestActiveProgram:
    """Tests for /api/programs/active endpoint"""
    
    def test_get_active_program(self, authenticated_client):
        """Test getting active program with team data"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/active")
        assert response.status_code == 200, f"Failed to get active program: {response.text}"
        
        data = response.json()
        assert data["active"] == True, "User should have an active program"
        
        # Verify program info
        assert "program" in data
        assert data["program"]["id"] == "prog-sleep-21"
        
        # Verify current day and phase
        assert "current_day" in data
        assert "current_phase" in data
        
        # Verify today's tasks
        assert "today_tasks" in data
        assert "focus" in data["today_tasks"]
        assert "tasks" in data["today_tasks"]
        
    def test_active_program_has_team_data(self, authenticated_client):
        """Test that active program returns team data with 3 members"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/active")
        assert response.status_code == 200
        
        data = response.json()
        assert "team" in data, "Active program should have team data"
        
        team = data["team"]
        assert "team_id" in team
        assert "invite_code" in team
        assert "members" in team
        
        # Verify invite code
        assert team["invite_code"] == "C2CABC3A", f"Expected invite code C2CABC3A, got {team['invite_code']}"
        
        # Verify 3 team members
        members = team["members"]
        assert len(members) == 3, f"Expected 3 team members, got {len(members)}"
        
    def test_team_member_josette(self, authenticated_client):
        """Test that Josette (logged-in user) is in team with is_me=True"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/active")
        data = response.json()
        
        members = data["team"]["members"]
        josette = next((m for m in members if "Josette" in m["name"]), None)
        
        assert josette is not None, "Josette should be in team"
        assert josette["is_me"] == True, "Josette should have is_me=True"
        
    def test_team_member_marie(self, authenticated_client):
        """Test that Marie Dupont is in team with check-in data"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/active")
        data = response.json()
        
        members = data["team"]["members"]
        marie = next((m for m in members if "Marie" in m["name"]), None)
        
        assert marie is not None, "Marie Dupont should be in team"
        assert marie["is_me"] == False, "Marie should have is_me=False"
        assert marie["checked_in_today"] == True, "Marie should be checked in today"
        assert marie["tasks_done_today"] == 2, "Marie should have 2 tasks done"
        assert marie["mood_today"] == 4, "Marie should have mood 4"
        
    def test_team_member_pierre(self, authenticated_client):
        """Test that Pierre Martin is in team (not checked in)"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/active")
        data = response.json()
        
        members = data["team"]["members"]
        pierre = next((m for m in members if "Pierre" in m["name"]), None)
        
        assert pierre is not None, "Pierre Martin should be in team"
        assert pierre["is_me"] == False
        assert pierre["checked_in_today"] == False, "Pierre should NOT be checked in"


class TestProgramCatalog:
    """Tests for /api/programs/catalog endpoint"""
    
    def test_get_catalog_authenticated(self, authenticated_client):
        """Test getting program catalog with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/catalog")
        assert response.status_code == 200
        
        data = response.json()
        assert "programs" in data
        assert len(data["programs"]) >= 5, "Should have at least 5 programs in catalog"
        
    def test_catalog_program_structure(self, authenticated_client):
        """Test that catalog programs have required fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/programs/catalog")
        data = response.json()
        
        for program in data["programs"][:3]:  # Check first 3
            assert "id" in program
            assert "title" in program
            assert "category" in program
            assert "duration_days" in program


class TestLogin:
    """Tests for authentication"""
    
    def test_login_success(self, api_client):
        """Test login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["name"] == "Josette Zuchiatti"
        
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 404], "Should reject invalid credentials"
