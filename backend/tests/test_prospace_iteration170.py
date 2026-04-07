"""
Iteration 170 - ProSpace Calendar & Edit Features Testing
Tests:
1. Login as coach
2. GET /api/pro/assigned-exercises/{beneficiary_id} - list assigned exercises
3. GET /api/pro/assigned-exercise-detail/{assignment_id} - get single assigned exercise
4. PUT /api/pro/assigned-exercises/{assignment_id} - update assigned exercise
5. POST /api/pro/exercise-templates - create exercise template
6. DELETE /api/pro/exercise-templates/{id} - delete exercise template
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://biometric-realtime.preview.emergentagent.com')

class TestProSpaceCalendarFeatures:
    """Test ProSpace calendar and edit features"""
    
    @pytest.fixture(scope="class")
    def coach_token(self):
        """Login as coach and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        # API returns 'token' not 'access_token'
        token = data.get("token") or data.get("access_token")
        assert token, f"No token in response: {data}"
        return token
    
    @pytest.fixture(scope="class")
    def beneficiary_id(self, coach_token):
        """Get first beneficiary ID"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed to get beneficiaries: {response.text}"
        bens = response.json()
        assert len(bens) > 0, "No beneficiaries found"
        return bens[0]["id"]
    
    def test_01_coach_login(self, coach_token):
        """Test coach login works"""
        assert coach_token is not None
        assert len(coach_token) > 10
        print(f"SUCCESS: Coach login successful, token length: {len(coach_token)}")
    
    def test_02_get_assigned_exercises(self, coach_token, beneficiary_id):
        """Test GET /api/pro/assigned-exercises/{beneficiary_id}"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{beneficiary_id}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        exercises = response.json()
        assert isinstance(exercises, list), "Response should be a list"
        print(f"SUCCESS: Got {len(exercises)} assigned exercises for beneficiary")
        return exercises
    
    def test_03_get_assigned_exercise_detail(self, coach_token, beneficiary_id):
        """Test GET /api/pro/assigned-exercise-detail/{assignment_id}"""
        # First get list of assigned exercises
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{beneficiary_id}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        exercises = response.json()
        
        if len(exercises) == 0:
            pytest.skip("No assigned exercises to test detail endpoint")
        
        assignment_id = exercises[0]["id"]
        
        # Get detail
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{assignment_id}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        detail = response.json()
        assert "id" in detail, "Detail should have id"
        assert "title" in detail, "Detail should have title"
        assert "days" in detail, "Detail should have days"
        assert "repetitions" in detail, "Detail should have repetitions"
        assert "sets" in detail, "Detail should have sets"
        assert "rest_seconds" in detail, "Detail should have rest_seconds"
        print(f"SUCCESS: Got exercise detail: {detail['title']}, days={detail['days']}")
    
    def test_04_update_assigned_exercise(self, coach_token, beneficiary_id):
        """Test PUT /api/pro/assigned-exercises/{assignment_id}"""
        # First get list of assigned exercises
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{beneficiary_id}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        exercises = response.json()
        
        if len(exercises) == 0:
            pytest.skip("No assigned exercises to test update endpoint")
        
        assignment_id = exercises[0]["id"]
        original_days = exercises[0].get("days", [])
        
        # Update with new values
        new_data = {
            "days": ["lundi", "mercredi", "vendredi"],
            "repetitions": 15,
            "sets": 4,
            "rest_seconds": 90
        }
        
        response = requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{assignment_id}",
            headers={"Authorization": f"Bearer {coach_token}"},
            json=new_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        updated = response.json()
        assert updated["days"] == new_data["days"], "Days not updated"
        assert updated["repetitions"] == new_data["repetitions"], "Repetitions not updated"
        assert updated["sets"] == new_data["sets"], "Sets not updated"
        assert updated["rest_seconds"] == new_data["rest_seconds"], "Rest seconds not updated"
        print(f"SUCCESS: Updated exercise: days={updated['days']}, reps={updated['repetitions']}, sets={updated['sets']}, rest={updated['rest_seconds']}s")
    
    def test_05_create_exercise_template(self, coach_token):
        """Test POST /api/pro/exercise-templates"""
        template_data = {
            "title": "TEST_Pompes diamant",
            "description": "Pompes avec mains rapprochees en forme de diamant",
            "category": "force",
            "difficulty": "difficile",
            "muscle_group": "Pectoraux, Triceps",
            "sets": 3,
            "repetitions": 10,
            "rest_seconds": 60,
            "steps": ["Position de pompe", "Rapprocher les mains en diamant", "Descendre lentement", "Remonter"],
            "equipment": "Aucun"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers={"Authorization": f"Bearer {coach_token}"},
            json=template_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        created = response.json()
        assert "id" in created, "Created template should have id"
        assert created["title"] == template_data["title"], "Title mismatch"
        print(f"SUCCESS: Created exercise template: {created['title']} (id={created['id']})")
        return created["id"]
    
    def test_06_list_exercise_templates(self, coach_token):
        """Test GET /api/pro/exercise-templates"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        templates = response.json()
        assert isinstance(templates, list), "Response should be a list"
        print(f"SUCCESS: Got {len(templates)} exercise templates")
        return templates
    
    def test_07_delete_exercise_template(self, coach_token):
        """Test DELETE /api/pro/exercise-templates/{id}"""
        # First create a template to delete
        template_data = {
            "title": "TEST_To_Delete_Template",
            "description": "This will be deleted",
            "category": "general",
            "difficulty": "facile",
            "sets": 2,
            "repetitions": 8
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers={"Authorization": f"Bearer {coach_token}"},
            json=template_data
        )
        assert response.status_code == 200
        template_id = response.json()["id"]
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/api/pro/exercise-templates/{template_id}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        assert result.get("status") == "deleted", "Delete should return status=deleted"
        print(f"SUCCESS: Deleted exercise template {template_id}")
    
    def test_08_verify_beneficiary_detail_no_exercices_prescrits(self, coach_token, beneficiary_id):
        """Verify that beneficiary-detail.tsx code doesn't render 'Exercices prescrits' section (only comment allowed)"""
        # This is a code review test - we check the file content
        import os
        import re
        file_path = "/app/frontend/app/beneficiary-detail.tsx"
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            # Remove comments from content
            content_no_comments = re.sub(r'{/\*.*?\*/}', '', content, flags=re.DOTALL)
            content_no_comments = re.sub(r'//.*$', '', content_no_comments, flags=re.MULTILINE)
            # Check that 'Exercices prescrits' is NOT rendered (only in comments is OK)
            assert "Exercices prescrits" not in content_no_comments, "beneficiary-detail.tsx should NOT render 'Exercices prescrits' section (moved to ProSpace)"
            print("SUCCESS: beneficiary-detail.tsx does NOT render 'Exercices prescrits' section (only comment found)")
        else:
            pytest.skip("beneficiary-detail.tsx not found")
    
    def test_09_cleanup_test_templates(self, coach_token):
        """Cleanup TEST_ prefixed templates"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        if response.status_code == 200:
            templates = response.json()
            for tpl in templates:
                if tpl.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/pro/exercise-templates/{tpl['id']}",
                        headers={"Authorization": f"Bearer {coach_token}"}
                    )
                    print(f"Cleaned up: {tpl['title']}")
        print("SUCCESS: Cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
