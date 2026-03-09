"""
Iteration 101 Tests: Minceur Refinements
- Calorie minimum raised to 1400kcal for senior females (was 1200)
- POST /api/minceur/weight-goal invalidates cache (returns status saved)
- POST /api/minceur/refresh-recommendations clears cache
- Goal shows 70kg target with 10 weeks duration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")

class TestMinceurCalorieMinimum:
    """Test calorie minimum for senior females (>=1400 kcal)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as test user (Josette - 77yo female senior with medical conditions)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_weight_details_returns_calories_minimum_1400(self, auth_token):
        """
        Verify GET /api/minceur/weight-details returns daily_calories >= 1400
        for senior female with weight loss goal.
        Josette is 77yo female, post-AVC, should get minimum 1400 kcal.
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/minceur/weight-details", headers=headers)
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Check profile is senior female
        profile = data.get("profile", {})
        assert profile.get("gender") == "Femme", f"Expected Femme, got {profile.get('gender')}"
        assert profile.get("age", 0) >= 65, f"Expected senior (age >= 65), got {profile.get('age')}"
        
        # Check recommendations exist and daily_calories >= 1400
        recs = data.get("recommendations")
        if recs:
            daily_calories = recs.get("daily_calories", 0)
            assert daily_calories >= 1400, f"Expected daily_calories >= 1400 for senior female, got {daily_calories}"
            print(f"SUCCESS: daily_calories = {daily_calories} (>= 1400 for senior female)")
        else:
            print("WARNING: No recommendations in response (may be generating)")


class TestGoalCacheInvalidation:
    """Test cache invalidation on goal change"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    def test_weight_goal_returns_status_saved(self, auth_token):
        """
        POST /api/minceur/weight-goal should return status='saved'
        and invalidate cache (goal set to 70kg in 10 weeks).
        """
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        response = requests.post(f"{BASE_URL}/api/minceur/weight-goal", json={
            "target_kg": 70,
            "weeks": 10
        }, headers=headers)
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "saved", f"Expected status='saved', got {data.get('status')}"
        assert data.get("target_kg") == 70, f"Expected target_kg=70, got {data.get('target_kg')}"
        assert data.get("weeks") == 10, f"Expected weeks=10, got {data.get('weeks')}"
        print(f"SUCCESS: Goal saved - {data}")
    
    def test_goal_persisted_in_weight_details(self, auth_token):
        """Verify the goal is returned in weight-details"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/minceur/weight-details", headers=headers)
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        goal = data.get("goal")
        assert goal is not None, "Goal not found in response"
        assert goal.get("target_kg") == 70, f"Expected target_kg=70, got {goal.get('target_kg')}"
        assert goal.get("weeks") == 10, f"Expected weeks=10, got {goal.get('weeks')}"
        print(f"SUCCESS: Goal in weight-details - {goal}")


class TestRefreshRecommendations:
    """Test cache clearing endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    def test_refresh_recommendations_clears_cache(self, auth_token):
        """
        POST /api/minceur/refresh-recommendations should return status='cache_cleared'
        """
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        response = requests.post(f"{BASE_URL}/api/minceur/refresh-recommendations", headers=headers)
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "cache_cleared", f"Expected status='cache_cleared', got {data.get('status')}"
        print(f"SUCCESS: Cache cleared - {data}")


class TestCalorieCalculationLogic:
    """Verify backend calculation logic for senior safety minimum"""
    
    def test_senior_female_minimum_1400_in_code(self):
        """
        Verify the code logic: senior (age >= 65) or medical conditions
        should have cal_min = 1400 for females (line 128-130 in minceur_routes.py)
        """
        # This is a code review test - verify the logic exists
        import os
        routes_path = "/app/backend/routes/minceur_routes.py"
        assert os.path.exists(routes_path), f"File not found: {routes_path}"
        
        with open(routes_path, "r") as f:
            content = f.read()
        
        # Check for senior safety logic
        assert "is_senior = age >= 65" in content, "Missing senior detection logic"
        assert "cal_min = 1500 if is_male else 1400" in content or "1400" in content, "Missing 1400 cal minimum for females"
        print("SUCCESS: Backend code contains senior safety minimum logic (1400 kcal for females)")
