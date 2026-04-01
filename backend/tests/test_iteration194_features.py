"""
Test iteration 194 features:
- TeamActivityToast: solo users (team=null) should not poll feed
- Custom exercise creation via __custom__ template_id
- Exercise detail with weight_history and params editing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestSoloUserTeamActivity:
    """Tests for solo user team activity (should not poll feed)"""
    
    @pytest.fixture
    def beneficiary_token(self):
        """Get beneficiary (Josette) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    def test_active_program_returns_team_null_for_solo(self, beneficiary_token):
        """Solo user's active program should have team=null"""
        response = requests.get(
            f"{BASE_URL}/api/programs/active",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("active") == True, "User should have active program"
        assert data.get("team") is None, "Solo user should have team=null"


class TestCustomExerciseCreation:
    """Tests for custom exercise creation via __custom__ template_id"""
    
    @pytest.fixture
    def beneficiary_token(self):
        """Get beneficiary (Josette) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_create_custom_exercise_with_custom_template_id(self, beneficiary_token):
        """POST /api/pro/self-assign-exercise with __custom__ creates custom exercise"""
        response = requests.post(
            f"{BASE_URL}/api/pro/self-assign-exercise",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={
                "exercise_template_id": "__custom__",
                "title": "TEST_Custom_Pushups",
                "description": "Custom pushup variation",
                "sets": 5,
                "repetitions": 20,
                "rest_seconds": 45,
                "days": ["lundi", "mercredi", "vendredi"]
            }
        )
        assert response.status_code == 200, f"Failed to create custom exercise: {response.text}"
        data = response.json()
        
        # Verify custom exercise fields
        assert data.get("id") is not None, "Should return exercise ID"
        assert data.get("title") == "TEST_Custom_Pushups"
        assert data.get("sets") == 5
        assert data.get("repetitions") == 20
        assert data.get("rest_seconds") == 45
        assert data.get("self_assigned") == True
        assert data.get("exercise_template_id") == "", "Custom exercise should have empty template_id"
    
    def test_create_exercise_from_template(self, beneficiary_token):
        """POST /api/pro/self-assign-exercise with valid template_id"""
        # First get exercise library to find a template
        lib_response = requests.get(
            f"{BASE_URL}/api/pro/exercise-library",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert lib_response.status_code == 200
        templates = lib_response.json()
        
        if len(templates) > 0:
            template = templates[0]
            response = requests.post(
                f"{BASE_URL}/api/pro/self-assign-exercise",
                headers={"Authorization": f"Bearer {beneficiary_token}"},
                json={
                    "exercise_template_id": template["id"],
                    "days": ["samedi"]
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data.get("title") == template.get("title")
            assert data.get("self_assigned") == True


class TestExerciseDetailAndParams:
    """Tests for exercise detail, params editing, and weight tracking"""
    
    SQUAT_ID = "e2c5bcdd-b6c0-4ff6-8586-41b9460d7702"
    
    @pytest.fixture
    def beneficiary_token(self):
        """Get beneficiary (Josette) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_assigned_exercise_detail(self, beneficiary_token):
        """GET /api/pro/assigned-exercise-detail/{id} returns full detail"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{self.SQUAT_ID}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify exercise fields
        assert data.get("id") == self.SQUAT_ID
        assert data.get("title") == "Squat"
        assert data.get("equipment") == "Barre"
        assert "sets" in data
        assert "repetitions" in data
        assert "rest_seconds" in data
        
        # Verify weight history exists
        assert "weight_history" in data
        assert isinstance(data["weight_history"], list)
        assert len(data["weight_history"]) > 1, "Should have multiple weight history entries"
    
    def test_update_exercise_params(self, beneficiary_token):
        """PUT /api/pro/assigned-exercises/{id}/update-params updates sets/reps/rest"""
        # Get current values
        detail_response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{self.SQUAT_ID}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        original = detail_response.json()
        
        # Update params
        new_sets = original.get("sets", 3) + 1
        new_reps = original.get("repetitions", 12) + 1
        new_rest = original.get("rest_seconds", 60) + 10
        
        response = requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{self.SQUAT_ID}/update-params",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={
                "sets": new_sets,
                "repetitions": new_reps,
                "rest_seconds": new_rest
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("sets") == new_sets
        assert data.get("repetitions") == new_reps
        assert data.get("rest_seconds") == new_rest
        
        # Verify persistence
        verify_response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{self.SQUAT_ID}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        verify_data = verify_response.json()
        assert verify_data.get("sets") == new_sets
        assert verify_data.get("repetitions") == new_reps
        assert verify_data.get("rest_seconds") == new_rest
    
    def test_save_exercise_weight(self, beneficiary_token):
        """PUT /api/pro/assigned-exercises/{id}/save-weight saves weight"""
        test_weight = 45.5
        
        response = requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{self.SQUAT_ID}/save-weight",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={"weight_kg": test_weight}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("last_weight_kg") == test_weight
        
        # Verify persistence
        verify_response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{self.SQUAT_ID}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        verify_data = verify_response.json()
        assert verify_data.get("last_weight_kg") == test_weight
        
        # Verify weight was added to history
        history = verify_data.get("weight_history", [])
        assert len(history) > 0
        assert history[-1].get("weight_kg") == test_weight
    
    def test_save_weight_requires_weight_kg(self, beneficiary_token):
        """PUT /api/pro/assigned-exercises/{id}/save-weight returns 400 without weight_kg"""
        response = requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{self.SQUAT_ID}/save-weight",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={}
        )
        assert response.status_code == 400


class TestExerciseCompletion:
    """Tests for exercise completion with pain level and notes"""
    
    @pytest.fixture
    def beneficiary_token(self):
        """Get beneficiary (Josette) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_complete_exercise_with_pain_and_notes(self, beneficiary_token):
        """POST /api/pro/exercises/{id}/complete with pain_level and notes"""
        # First create a test exercise to complete
        create_response = requests.post(
            f"{BASE_URL}/api/pro/self-assign-exercise",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={
                "exercise_template_id": "__custom__",
                "title": "TEST_Completion_Exercise",
                "sets": 2,
                "repetitions": 10,
                "rest_seconds": 30
            }
        )
        assert create_response.status_code == 200
        exercise_id = create_response.json()["id"]
        
        # Complete the exercise
        response = requests.post(
            f"{BASE_URL}/api/pro/exercises/{exercise_id}/complete",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={
                "status": "done",
                "pain_level": 3,
                "patient_notes": "Felt good, no issues"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("completion", {}).get("status") == "done"
        assert data.get("completion", {}).get("pain_level") == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
