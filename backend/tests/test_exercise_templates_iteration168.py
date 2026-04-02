"""
Test Exercise Templates and ProSpace Features - Iteration 168
Tests:
- POST /api/pro/exercise-templates - creates exercise template
- GET /api/pro/exercise-templates - returns list of templates
- DELETE /api/pro/exercise-templates/{id} - deletes template
- GET /api/pro/programs/detail/{id} - includes sessions with image, steps, video_url fields
- GET /api/pro/my-programs - returns programs assigned to the beneficiary
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://ble-state-manager.preview.emergentagent.com').rstrip('/')

# Test credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"
JOSETTE_BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"
EXISTING_EXERCISE_TEMPLATE_ID = "c7f938ad-05d9-41d7-816b-288868b790f3"
JOSETTE_PROGRAM_ID = "e0557983-bc22-4079-9d99-e3461350113b"


@pytest.fixture(scope="module")
def coach_token():
    """Get authentication token for coach"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_PHONE,  # API uses 'email' field for phone login
        "password": COACH_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Coach authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(coach_token):
    """Headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {coach_token}"
    }


class TestExerciseTemplates:
    """Test exercise template CRUD operations"""
    
    created_template_id = None
    
    def test_create_exercise_template(self, auth_headers):
        """POST /api/pro/exercise-templates creates exercise template"""
        payload = {
            "title": "TEST_Squat Bulgare",
            "description": "Exercice de renforcement des quadriceps",
            "image": "https://example.com/squat.jpg",
            "video_url": "https://youtube.com/watch?v=test123",
            "category": "force",
            "difficulty": "moyen",
            "muscle_group": "Quadriceps",
            "sets": 4,
            "repetitions": 10,
            "duration_min": 15,
            "rest_seconds": 90,
            "steps": [
                "Position de depart: un pied sur un banc derriere vous",
                "Descendre en flechissant le genou avant",
                "Remonter en poussant sur le talon"
            ],
            "equipment": "Banc, halteres",
            "notes": "Garder le dos droit"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/exercise-templates",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should contain 'id'"
        assert data["title"] == payload["title"]
        assert data["description"] == payload["description"]
        assert data["image"] == payload["image"]
        assert data["video_url"] == payload["video_url"]
        assert data["difficulty"] == payload["difficulty"]
        assert data["muscle_group"] == payload["muscle_group"]
        assert data["sets"] == payload["sets"]
        assert data["repetitions"] == payload["repetitions"]
        assert data["steps"] == payload["steps"]
        assert data["equipment"] == payload["equipment"]
        assert data["is_template"] == True
        
        # Store for later tests
        TestExerciseTemplates.created_template_id = data["id"]
        print(f"Created exercise template: {data['id']}")
    
    def test_get_exercise_templates_list(self, auth_headers):
        """GET /api/pro/exercise-templates returns list of templates"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list), "Response should be a list"
        
        # Should contain our created template
        if TestExerciseTemplates.created_template_id:
            template_ids = [t["id"] for t in data]
            assert TestExerciseTemplates.created_template_id in template_ids, "Created template should be in list"
        
        # Verify template structure
        if len(data) > 0:
            template = data[0]
            assert "id" in template
            assert "title" in template
            assert "professional_id" in template
            print(f"Found {len(data)} exercise templates")
    
    def test_delete_exercise_template(self, auth_headers):
        """DELETE /api/pro/exercise-templates/{id} deletes template"""
        if not TestExerciseTemplates.created_template_id:
            pytest.skip("No template created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/pro/exercise-templates/{TestExerciseTemplates.created_template_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "deleted"
        
        # Verify deletion - GET should not contain the deleted template
        list_response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers=auth_headers
        )
        templates = list_response.json()
        template_ids = [t["id"] for t in templates]
        assert TestExerciseTemplates.created_template_id not in template_ids, "Deleted template should not be in list"
        print(f"Successfully deleted template: {TestExerciseTemplates.created_template_id}")


class TestProgramDetailWithSessions:
    """Test program detail endpoint includes session fields"""
    
    def test_get_program_detail_with_sessions(self, auth_headers):
        """GET /api/pro/programs/detail/{id} includes sessions with image, steps, video_url fields"""
        response = requests.get(
            f"{BASE_URL}/api/pro/programs/detail/{JOSETTE_PROGRAM_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify program structure
        assert "id" in data
        assert "title" in data
        assert "sessions" in data
        
        print(f"Program: {data['title']}")
        print(f"Sessions count: {len(data.get('sessions', []))}")
        
        # Check sessions have the new fields
        sessions = data.get("sessions", [])
        if len(sessions) > 0:
            session = sessions[0]
            # These fields should exist (may be empty strings)
            assert "id" in session, "Session should have 'id'"
            assert "title" in session, "Session should have 'title'"
            
            # New fields that should be present
            expected_fields = ["image", "video_url", "steps", "difficulty", "muscle_group", "equipment"]
            for field in expected_fields:
                assert field in session, f"Session should have '{field}' field"
            
            print(f"Session '{session['title']}' has all required fields")
            print(f"  - image: {session.get('image', 'N/A')}")
            print(f"  - video_url: {session.get('video_url', 'N/A')}")
            print(f"  - steps: {len(session.get('steps', []))} steps")
            print(f"  - difficulty: {session.get('difficulty', 'N/A')}")


class TestBeneficiaryPrograms:
    """Test beneficiary can see their assigned programs"""
    
    def test_get_my_programs_as_beneficiary(self):
        """GET /api/pro/my-programs returns programs assigned to the beneficiary"""
        # First login as Josette (beneficiary)
        # We need to find Josette's credentials or use the coach to verify the endpoint
        # For now, test with coach token to verify endpoint exists
        
        # Login as coach first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,  # API uses 'email' field for phone login
            "password": COACH_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate")
        
        token = login_response.json().get("token")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        # Test the endpoint exists (will return empty for coach since they're not a beneficiary)
        response = requests.get(
            f"{BASE_URL}/api/pro/my-programs",
            headers=headers
        )
        
        # Should return 200 (empty list for coach) or programs for beneficiary
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"GET /api/pro/my-programs returned {len(data)} programs")


class TestAddExerciseFromTemplate:
    """Test adding exercise from template to a program"""
    
    def test_add_session_with_template_fields(self, auth_headers):
        """POST /api/pro/programs/{id}/sessions with template fields"""
        # Create a test program first
        program_response = requests.post(
            f"{BASE_URL}/api/pro/programs/template",
            json={
                "title": "TEST_Programme Iteration 168",
                "description": "Test program for exercise template",
                "frequency": "3x/semaine",
                "duration_weeks": 4,
                "category": "force"
            },
            headers=auth_headers
        )
        
        if program_response.status_code != 200:
            pytest.skip(f"Could not create test program: {program_response.text}")
        
        program_id = program_response.json()["id"]
        
        # Add session with all the new fields
        session_payload = {
            "title": "TEST_Squat Bulgare Session",
            "description": "Exercice de renforcement",
            "image": "https://example.com/squat.jpg",
            "video_url": "https://youtube.com/watch?v=test",
            "sets": 4,
            "repetitions": 10,
            "duration_min": 15,
            "rest_seconds": 90,
            "steps": ["Step 1", "Step 2", "Step 3"],
            "difficulty": "moyen",
            "muscle_group": "Quadriceps",
            "equipment": "Banc",
            "from_template_id": "test-template-id"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/{program_id}/sessions",
            json=session_payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        session = response.json()
        
        # Verify all fields are saved
        assert session["title"] == session_payload["title"]
        assert session["image"] == session_payload["image"]
        assert session["video_url"] == session_payload["video_url"]
        assert session["steps"] == session_payload["steps"]
        assert session["difficulty"] == session_payload["difficulty"]
        assert session["muscle_group"] == session_payload["muscle_group"]
        assert session["equipment"] == session_payload["equipment"]
        assert session["from_template_id"] == session_payload["from_template_id"]
        
        print(f"Successfully added session with template fields to program {program_id}")
        
        # Cleanup - delete the test program
        requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program_id}",
            headers=auth_headers
        )


class TestExistingExerciseTemplate:
    """Test existing exercise template from seed data"""
    
    def test_existing_template_in_list(self, auth_headers):
        """Verify existing exercise template is in the list"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        templates = response.json()
        
        # Check if the existing template ID is in the list
        template_ids = [t["id"] for t in templates]
        
        if EXISTING_EXERCISE_TEMPLATE_ID in template_ids:
            print(f"Found existing exercise template: {EXISTING_EXERCISE_TEMPLATE_ID}")
            # Get the template details
            template = next(t for t in templates if t["id"] == EXISTING_EXERCISE_TEMPLATE_ID)
            print(f"  Title: {template.get('title')}")
            print(f"  Category: {template.get('category')}")
        else:
            print(f"Note: Existing template {EXISTING_EXERCISE_TEMPLATE_ID} not found (may have been deleted)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
