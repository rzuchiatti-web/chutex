"""
Iteration 172 - Beneficiary Exercises Tests
Tests for:
- GET /api/pro/beneficiary-today-exercises (beneficiary view)
- Josette (beneficiary) sees exercises assigned by coach
- Exercises have completion status for today
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prospace-refactor-1.preview.emergentagent.com').rstrip('/')

# Test credentials
JOSETTE_PHONE = "+33651245918"
JOSETTE_PASSWORD = "test123"
JOSETTE_ID = "495e5e38-3591-474b-abe5-c932574bb609"

COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"


class TestBeneficiaryExercises:
    """Tests for beneficiary exercise viewing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Josette (beneficiary) before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": JOSETTE_PHONE,
            "password": JOSETTE_PASSWORD
        })
        assert response.status_code == 200, f"Josette login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_josette_login_returns_beneficiary_role(self):
        """Verify Josette is a beneficiary"""
        assert self.user["role"] == "beneficiary"
        assert self.user["id"] == JOSETTE_ID
        assert self.user["name"] == "Josette Zuchiatti"
        print(f"SUCCESS: Josette logged in as beneficiary with ID {JOSETTE_ID}")
    
    def test_beneficiary_today_exercises_returns_list(self):
        """GET /api/pro/beneficiary-today-exercises returns exercises for today"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        exercises = response.json()
        assert isinstance(exercises, list), "Response should be a list"
        print(f"SUCCESS: Got {len(exercises)} exercises for today")
        return exercises
    
    def test_josette_has_exercises_for_today(self):
        """Josette should have exercises assigned for today (mercredi)"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=self.headers
        )
        assert response.status_code == 200
        exercises = response.json()
        
        # Should have at least 1 exercise
        assert len(exercises) >= 1, "Josette should have at least 1 exercise for today"
        print(f"SUCCESS: Josette has {len(exercises)} exercises for today")
        
        # Verify exercise structure
        for ex in exercises:
            assert "id" in ex
            assert "title" in ex
            assert "professional_name" in ex
            assert "days" in ex
            assert "completed_today" in ex
            assert "sets" in ex
            assert "repetitions" in ex
            assert "rest_seconds" in ex
            print(f"  - {ex['title']} (completed_today: {ex['completed_today']})")
    
    def test_exercises_have_completion_status(self):
        """Exercises should have completed_today field"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=self.headers
        )
        assert response.status_code == 200
        exercises = response.json()
        
        completed_count = sum(1 for ex in exercises if ex.get('completed_today'))
        not_completed_count = sum(1 for ex in exercises if not ex.get('completed_today'))
        
        print(f"SUCCESS: {completed_count} completed, {not_completed_count} not completed")
        
        # Verify at least one has completion status
        assert any('completed_today' in ex for ex in exercises), "Exercises should have completed_today field"
    
    def test_exercises_have_coach_info(self):
        """Exercises should include professional_name"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiary-today-exercises",
            headers=self.headers
        )
        assert response.status_code == 200
        exercises = response.json()
        
        for ex in exercises:
            assert "professional_name" in ex, "Exercise should have professional_name"
            assert ex["professional_name"], "professional_name should not be empty"
            print(f"SUCCESS: Exercise '{ex['title']}' assigned by {ex['professional_name']}")


class TestCoachLogin:
    """Verify coach can still login"""
    
    def test_coach_login(self):
        """Coach login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        assert data["user"]["professional_type"] == "coach"
        print(f"SUCCESS: Coach logged in: {data['user']['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
