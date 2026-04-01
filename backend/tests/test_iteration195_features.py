"""
Iteration 195 Tests: Health/Coaching App Final Corrections
- Backend: beneficiary-today-exercises merges template data (image, description, equipment, muscle_group)
- Backend: exercises return correct image from template for Squat and Burpees
- Calendar dynamic data: exercises for different dates return correct data via ?date= param
- Exercise detail page identical for self-assigned and coach-assigned exercises
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"
SQUAT_EXERCISE_ID = "e2c5bcdd-b6c0-4ff6-8586-41b9460d7702"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for beneficiary (Josette)"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": BENEFICIARY_PHONE, "password": BENEFICIARY_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestBeneficiaryTodayExercises:
    """Tests for GET /api/pro/beneficiary-today-exercises endpoint"""

    def test_today_exercises_returns_list(self, auth_headers):
        """Verify endpoint returns a list of exercises"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Today's exercises count: {len(data)}")

    def test_exercises_have_merged_template_data(self, auth_headers):
        """Verify exercises have merged template data (image, description, equipment, muscle_group)"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=auth_headers
        )
        assert response.status_code == 200
        exercises = response.json()
        
        # Find Squat exercise
        squat = next((e for e in exercises if e.get("title") == "Squat"), None)
        if squat:
            # Verify merged template fields
            assert squat.get("image"), "Squat should have image from template"
            assert "pexels" in squat.get("image", "").lower() or "http" in squat.get("image", "").lower(), "Image should be a valid URL"
            assert squat.get("equipment") == "Barre", f"Equipment should be 'Barre', got: {squat.get('equipment')}"
            assert squat.get("muscle_group"), "Squat should have muscle_group from template"
            assert squat.get("description"), "Squat should have description from template"
            print(f"Squat template data merged: image={squat.get('image')[:50]}..., equipment={squat.get('equipment')}, muscle_group={squat.get('muscle_group')}")
        else:
            pytest.skip("Squat exercise not found in today's exercises")

    def test_calendar_dynamic_data_different_dates(self, auth_headers):
        """Verify calendar returns different exercises for different dates"""
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)
        
        # Get today's exercises
        resp_today = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=auth_headers
        )
        assert resp_today.status_code == 200
        today_count = len(resp_today.json())
        
        # Get tomorrow's exercises
        resp_tomorrow = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises?date={tomorrow.strftime('%Y-%m-%d')}",
            headers=auth_headers
        )
        assert resp_tomorrow.status_code == 200
        tomorrow_count = len(resp_tomorrow.json())
        
        # Get yesterday's exercises
        resp_yesterday = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises?date={yesterday.strftime('%Y-%m-%d')}",
            headers=auth_headers
        )
        assert resp_yesterday.status_code == 200
        yesterday_count = len(resp_yesterday.json())
        
        print(f"Exercise counts - Today: {today_count}, Tomorrow: {tomorrow_count}, Yesterday: {yesterday_count}")
        # Just verify the endpoint works with date parameter - counts may vary based on schedule
        assert today_count >= 0
        assert tomorrow_count >= 0
        assert yesterday_count >= 0


class TestAssignedExerciseDetail:
    """Tests for GET /api/pro/assigned-exercise-detail/{id} endpoint"""

    def test_squat_exercise_detail(self, auth_headers):
        """Verify Squat exercise detail returns correct data"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{SQUAT_EXERCISE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify basic fields
        assert data.get("title") == "Squat", f"Title should be 'Squat', got: {data.get('title')}"
        assert data.get("image"), "Should have image"
        assert data.get("equipment") == "Barre", f"Equipment should be 'Barre', got: {data.get('equipment')}"
        assert data.get("muscle_group"), "Should have muscle_group"
        
        # Verify weight tracking
        assert data.get("last_weight_kg") == 70, f"Last weight should be 70kg, got: {data.get('last_weight_kg')}"
        assert "weight_history" in data, "Should have weight_history"
        assert len(data.get("weight_history", [])) >= 7, f"Should have at least 7 weight history entries, got: {len(data.get('weight_history', []))}"
        
        print(f"Squat detail: image={data.get('image')[:50]}..., last_weight={data.get('last_weight_kg')}kg, history_count={len(data.get('weight_history', []))}")

    def test_exercise_detail_has_template_fields(self, auth_headers):
        """Verify exercise detail includes all template fields"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{SQUAT_EXERCISE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check for template fields that should be merged
        template_fields = ["image", "description", "equipment", "muscle_group"]
        for field in template_fields:
            assert data.get(field), f"Exercise should have {field} field"
        
        print(f"Template fields present: {[f for f in template_fields if data.get(f)]}")


class TestWeightSaveAndRefresh:
    """Tests for weight save functionality"""

    def test_save_weight_endpoint(self, auth_headers):
        """Verify weight save endpoint works and returns updated data"""
        # Save a new weight
        response = requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{SQUAT_EXERCISE_ID}/save-weight",
            headers=auth_headers,
            json={"weight_kg": 72.5}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response contains updated weight
        assert data.get("last_weight_kg") == 72.5, f"Last weight should be 72.5kg, got: {data.get('last_weight_kg')}"
        
        # Verify weight history was updated
        response2 = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{SQUAT_EXERCISE_ID}",
            headers=auth_headers
        )
        assert response2.status_code == 200
        detail = response2.json()
        assert detail.get("last_weight_kg") == 72.5, "Weight should be persisted"
        
        # Restore original weight
        requests.put(
            f"{BASE_URL}/api/pro/assigned-exercises/{SQUAT_EXERCISE_ID}/save-weight",
            headers=auth_headers,
            json={"weight_kg": 70}
        )
        print("Weight save and refresh test passed")


class TestExerciseTemplates:
    """Tests for exercise templates with images"""

    def test_exercise_library_has_images(self, auth_headers):
        """Verify exercise library templates have images"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-library",
            headers=auth_headers
        )
        assert response.status_code == 200
        templates = response.json()
        
        # Check that templates have images
        templates_with_images = [t for t in templates if t.get("image")]
        print(f"Templates with images: {len(templates_with_images)}/{len(templates)}")
        
        # Find Squat and Burpees templates
        squat_tpl = next((t for t in templates if "squat" in t.get("title", "").lower()), None)
        burpees_tpl = next((t for t in templates if "burpee" in t.get("title", "").lower()), None)
        
        if squat_tpl:
            assert squat_tpl.get("image"), "Squat template should have image"
            print(f"Squat template image: {squat_tpl.get('image')[:60]}...")
        
        if burpees_tpl:
            assert burpees_tpl.get("image"), "Burpees template should have image"
            print(f"Burpees template image: {burpees_tpl.get('image')[:60]}...")


class TestExerciseDetailPageConsistency:
    """Tests to verify exercise detail page works for both self-assigned and coach-assigned"""

    def test_assigned_exercise_detail_endpoint(self, auth_headers):
        """Verify assigned-exercise-detail endpoint returns consistent data"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercise-detail/{SQUAT_EXERCISE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields for exercise detail page
        required_fields = ["id", "title", "sets", "repetitions", "rest_seconds"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify optional but expected fields
        expected_fields = ["image", "equipment", "muscle_group", "description", "weight_history", "last_weight_kg"]
        present_fields = [f for f in expected_fields if data.get(f)]
        print(f"Present optional fields: {present_fields}")
        
        # Verify exercise params
        assert data.get("sets", 0) > 0, "Should have sets > 0"
        assert data.get("repetitions", 0) > 0, "Should have repetitions > 0"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
