"""
Tests for Minceur feature endpoints - Iteration 107
Tests the new /api/minceur/exercises endpoint and existing minceur endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ios-health-native.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "0651245918"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for beneficiary user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data
    return data["token"]


class TestMinceurExercisesEndpoint:
    """Tests for the new lightweight /api/minceur/exercises endpoint"""
    
    def test_exercises_endpoint_returns_200(self, auth_token):
        """Test that /api/minceur/exercises returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/exercises",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_exercises_endpoint_returns_exercises_array(self, auth_token):
        """Test that response contains exercises array"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/exercises",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert "exercises" in data, "Response should contain 'exercises' key"
        assert isinstance(data["exercises"], list), "exercises should be a list"
    
    def test_exercises_have_required_fields(self, auth_token):
        """Test that each exercise has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/exercises",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        exercises = data.get("exercises", [])
        
        if len(exercises) > 0:
            for exercise in exercises:
                assert "name" in exercise, "Exercise should have name"
                assert "duration" in exercise, "Exercise should have duration"
                assert "intensity" in exercise, "Exercise should have intensity"
                assert "description" in exercise, "Exercise should have description"
                assert "category" in exercise, "Exercise should have category"


class TestMinceurWeightDetailsEndpoint:
    """Tests for the existing /api/minceur/weight-details endpoint"""
    
    def test_weight_details_returns_200(self, auth_token):
        """Test that /api/minceur/weight-details returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/weight-details",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_weight_details_has_profile(self, auth_token):
        """Test that response contains profile data"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/weight-details",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert "profile" in data, "Response should contain 'profile'"
        assert "name" in data["profile"], "Profile should have name"
    
    def test_weight_details_has_recommendations(self, auth_token):
        """Test that response contains recommendations"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/weight-details",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert "recommendations" in data, "Response should contain 'recommendations'"
        
        if data["recommendations"]:
            assert "meals" in data["recommendations"], "Recommendations should have meals"
            assert "exercises" in data["recommendations"], "Recommendations should have exercises"


class TestMinceurTodayTrackingEndpoint:
    """Tests for the /api/minceur/today-tracking endpoint"""
    
    def test_today_tracking_returns_200(self, auth_token):
        """Test that /api/minceur/today-tracking returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/today-tracking",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_today_tracking_has_required_fields(self, auth_token):
        """Test that response has required tracking fields"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/today-tracking",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = response.json()
        assert "completed" in data, "Response should contain 'completed'"
        assert "streak" in data, "Response should contain 'streak'"


class TestMinceurTrackEndpoint:
    """Tests for the /api/minceur/track POST endpoint"""
    
    def test_track_meal_returns_200(self, auth_token):
        """Test tracking a meal"""
        response = requests.post(
            f"{BASE_URL}/api/minceur/track",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"type": "meal", "index": 0}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_track_exercise_returns_200(self, auth_token):
        """Test tracking an exercise"""
        response = requests.post(
            f"{BASE_URL}/api/minceur/track",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"type": "exercise", "index": 0}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_track_invalid_type_returns_400(self, auth_token):
        """Test that invalid type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/minceur/track",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"type": "invalid", "index": 0}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
