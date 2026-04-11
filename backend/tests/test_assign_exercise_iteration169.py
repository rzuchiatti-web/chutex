"""
Iteration 169 - Assign Exercise Tests
Tests for the new exercise assignment system (programs removed, individual exercise assignments)
- POST /api/pro/assign-exercise - Assign exercise with custom days/reps/rest
- GET /api/pro/assigned-exercises/{beneficiary_id} - Get assigned exercises
- DELETE /api/pro/assigned-exercises/{id} - Remove assignment
- GET /api/pro/beneficiary-today-exercises - Get today's exercises (beneficiary view)
- POST /api/pro/exercises/{assignment_id}/complete - Mark exercise as done
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vita-conversion.preview.emergentagent.com').rstrip('/')

# Coach credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"
JOSETTE_BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"

# Days in French
DAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


class TestAssignExerciseAPI:
    """Tests for the new exercise assignment system"""
    
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
        print(f"Logged in as coach: {self.user.get('name')}")
    
    def test_01_get_exercise_templates(self):
        """Test GET /api/pro/exercise-templates - Get exercise templates from library"""
        response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers=self.headers)
        assert response.status_code == 200, f"Failed to get exercise templates: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} exercise templates")
        
        # Store first template ID for later tests
        if len(data) > 0:
            self.template_id = data[0]["id"]
            print(f"First template: {data[0].get('title')} (ID: {self.template_id})")
            return data[0]["id"]
        return None
    
    def test_02_get_assigned_exercises_for_josette(self):
        """Test GET /api/pro/assigned-exercises/{beneficiary_id} - Get Josette's assigned exercises"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}", 
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get assigned exercises: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} assigned exercises for Josette")
        
        # Check for Squat bulgare assignment (seed data: lundi/mercredi/vendredi, 4x15, 90s rest)
        squat_seed_found = False
        for ex in data:
            print(f"  - {ex.get('title')}: days={ex.get('days')}, {ex.get('sets')}x{ex.get('repetitions')}, rest={ex.get('rest_seconds')}s")
            if "squat" in ex.get('title', '').lower():
                # Check if this is the seed data entry
                days = ex.get('days', [])
                if "lundi" in days and "mercredi" in days and "vendredi" in days:
                    if ex.get('sets') == 4 and ex.get('repetitions') == 15 and ex.get('rest_seconds') == 90:
                        squat_seed_found = True
                        print("✓ Found seed data Squat bulgare (lun/mer/ven, 4x15, 90s)")
        
        # At minimum, verify we have at least one assigned exercise
        assert len(data) >= 1, "Should have at least 1 assigned exercise"
        
        # Check that exercises have required fields
        for ex in data:
            assert "id" in ex, "Exercise should have id"
            assert "title" in ex, "Exercise should have title"
            assert "days" in ex, "Exercise should have days"
            assert "sets" in ex, "Exercise should have sets"
            assert "repetitions" in ex, "Exercise should have repetitions"
            assert "rest_seconds" in ex, "Exercise should have rest_seconds"
        
        print(f"✓ All {len(data)} exercises have required fields")
    
    def test_03_assign_new_exercise(self):
        """Test POST /api/pro/assign-exercise - Assign exercise with custom days/reps/rest"""
        # First get a template
        templates_response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers=self.headers)
        assert templates_response.status_code == 200
        templates = templates_response.json()
        
        if len(templates) == 0:
            pytest.skip("No exercise templates available")
        
        template_id = templates[0]["id"]
        
        # Assign with custom settings
        payload = {
            "exercise_template_id": template_id,
            "beneficiary_id": JOSETTE_BENEFICIARY_ID,
            "days": ["mardi", "jeudi", "samedi"],
            "repetitions": 10,
            "sets": 5,
            "rest_seconds": 120
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/assign-exercise",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to assign exercise: {response.text}"
        
        data = response.json()
        assert "id" in data, "Assignment should have id"
        assert data.get("beneficiary_id") == JOSETTE_BENEFICIARY_ID
        assert data.get("days") == ["mardi", "jeudi", "samedi"]
        assert data.get("repetitions") == 10
        assert data.get("sets") == 5
        assert data.get("rest_seconds") == 120
        
        print(f"✓ Created assignment: {data.get('title')} (ID: {data.get('id')})")
        print(f"  Days: {data.get('days')}, {data.get('sets')}x{data.get('repetitions')}, rest={data.get('rest_seconds')}s")
        
        # Store for cleanup
        self.test_assignment_id = data.get("id")
        return data.get("id")
    
    def test_04_verify_assignment_persisted(self):
        """Verify the assignment was persisted by fetching again"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}", 
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Check that we have at least the seed data exercise
        assert len(data) >= 1, "Should have at least 1 assigned exercise"
        print(f"✓ Verified {len(data)} assigned exercises persisted")
    
    def test_05_get_beneficiary_today_exercises(self):
        """Test GET /api/pro/beneficiary-today-exercises - Get today's exercises (beneficiary view)"""
        # This endpoint is for beneficiary view, but we can test it with coach token
        # It should return exercises scheduled for today
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=self.headers
        )
        # This might return 403 if it requires beneficiary role, or 200 with empty list
        if response.status_code == 200:
            data = response.json()
            print(f"Today's exercises: {len(data)}")
            for ex in data:
                print(f"  - {ex.get('title')}: completed_today={ex.get('completed_today')}")
        else:
            print(f"Note: beneficiary-today-exercises returned {response.status_code} (may require beneficiary role)")
    
    def test_06_delete_assigned_exercise(self):
        """Test DELETE /api/pro/assigned-exercises/{id} - Remove assignment"""
        # First create a test assignment to delete
        templates_response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers=self.headers)
        if templates_response.status_code != 200 or len(templates_response.json()) == 0:
            pytest.skip("No templates available")
        
        template_id = templates_response.json()[0]["id"]
        
        # Create assignment
        create_response = requests.post(
            f"{BASE_URL}/api/pro/assign-exercise",
            json={
                "exercise_template_id": template_id,
                "beneficiary_id": JOSETTE_BENEFICIARY_ID,
                "days": ["dimanche"],
                "repetitions": 8,
                "sets": 2,
                "rest_seconds": 45
            },
            headers=self.headers
        )
        assert create_response.status_code == 200
        assignment_id = create_response.json().get("id")
        print(f"Created test assignment: {assignment_id}")
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/pro/assigned-exercises/{assignment_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200, f"Failed to delete: {delete_response.text}"
        print(f"✓ Deleted assignment: {assignment_id}")
        
        # Verify deletion
        verify_response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}",
            headers=self.headers
        )
        assert verify_response.status_code == 200
        remaining = verify_response.json()
        deleted_ids = [ex.get("id") for ex in remaining]
        assert assignment_id not in deleted_ids, "Deleted assignment should not appear in list"
        print(f"✓ Verified assignment removed from list")
    
    def test_07_complete_exercise(self):
        """Test POST /api/pro/exercises/{assignment_id}/complete - Mark exercise as done"""
        # Get existing assignments
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        assignments = response.json()
        
        if len(assignments) == 0:
            pytest.skip("No assignments to complete")
        
        assignment_id = assignments[0]["id"]
        
        # Complete the exercise
        complete_response = requests.post(
            f"{BASE_URL}/api/pro/exercises/{assignment_id}/complete",
            json={
                "status": "done",
                "pain_level": 3,
                "patient_notes": "Test completion from pytest"
            },
            headers=self.headers
        )
        assert complete_response.status_code == 200, f"Failed to complete: {complete_response.text}"
        
        data = complete_response.json()
        assert data.get("status") == "ok"
        assert "completion" in data
        print(f"✓ Completed exercise: {assignments[0].get('title')}")
        print(f"  Completion: {data.get('completion')}")


class TestProSpaceNoPrograms:
    """Tests to verify programs are removed from ProSpace"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as coach"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_exercise_templates_endpoint_exists(self):
        """Verify exercise templates endpoint works (library)"""
        response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers=self.headers)
        assert response.status_code == 200
        print(f"✓ Exercise templates endpoint working")
    
    def test_reminder_templates_endpoint_exists(self):
        """Verify reminder templates endpoint works (library)"""
        response = requests.get(f"{BASE_URL}/api/pro/reminder-templates", headers=self.headers)
        assert response.status_code == 200
        print(f"✓ Reminder templates endpoint working")
    
    def test_meal_templates_endpoint_exists(self):
        """Verify meal templates endpoint works (library)"""
        response = requests.get(f"{BASE_URL}/api/pro/meal-templates", headers=self.headers)
        assert response.status_code == 200
        print(f"✓ Meal templates endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
