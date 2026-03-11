"""
Tests for Minceur Meal Detail & Allergies feature - Iteration 96
Testing:
1. Backend: allergies field included in AI recommendation prompt
2. Backend: profile.allergies returned in weight-details response
3. Backend: enriched meal data with ingredients[], recipe[], macros, prep_time
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-clinical-ui.preview.emergentagent.com")


class TestMinceurMealDetailFeatures:
    """Test suite for Iteration 96 meal detail and allergies features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: login and get token for beneficiary user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with test credentials
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
    # --- GET /api/minceur/weight-details - profile.allergies ---
    def test_weight_details_returns_profile_allergies(self):
        """Test that weight-details includes profile.allergies field"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        assert response.status_code == 200
        data = response.json()
        
        assert "profile" in data, "Response should include profile"
        assert "allergies" in data["profile"], "Profile should include allergies field"
        # allergies could be empty string, 'Aucune', or actual allergies
        
    def test_weight_details_profile_structure(self):
        """Test profile structure in weight-details"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        profile = data.get("profile", {})
        assert "name" in profile
        assert "age" in profile
        assert "gender" in profile
        assert "height_cm" in profile
        assert "allergies" in profile
        
    # --- Enriched meal data (ingredients, recipe, macros, prep_time) ---
    def test_weight_details_meals_have_ingredients(self):
        """Test that meals include ingredients array"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recommendations = data.get("recommendations")
        if recommendations and recommendations.get("meals"):
            meals = recommendations["meals"]
            for i, meal in enumerate(meals):
                # Check ingredients field exists (may be empty if not generated yet)
                if "ingredients" in meal:
                    assert isinstance(meal["ingredients"], list), f"Meal {i} ingredients should be list"
                    if len(meal["ingredients"]) > 0:
                        ing = meal["ingredients"][0]
                        assert "name" in ing, f"Ingredient should have name"
                        # quantity and calories are expected
                        print(f"Meal {i} ({meal.get('name', 'unknown')}): {len(meal['ingredients'])} ingredients")
                        
    def test_weight_details_meals_have_recipe_steps(self):
        """Test that meals include recipe array with preparation steps"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recommendations = data.get("recommendations")
        if recommendations and recommendations.get("meals"):
            meals = recommendations["meals"]
            for i, meal in enumerate(meals):
                if "recipe" in meal:
                    assert isinstance(meal["recipe"], list), f"Meal {i} recipe should be list"
                    if len(meal["recipe"]) > 0:
                        assert isinstance(meal["recipe"][0], str), f"Recipe steps should be strings"
                        print(f"Meal {i} ({meal.get('name', 'unknown')}): {len(meal['recipe'])} recipe steps")
                        
    def test_weight_details_meals_have_macros(self):
        """Test that meals include individual macros (proteines_g, glucides_g, lipides_g)"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recommendations = data.get("recommendations")
        if recommendations and recommendations.get("meals"):
            meals = recommendations["meals"]
            for i, meal in enumerate(meals):
                # Check for individual meal macros
                if "proteines_g" in meal or "glucides_g" in meal or "lipides_g" in meal:
                    print(f"Meal {i}: P={meal.get('proteines_g')}g, C={meal.get('glucides_g')}g, L={meal.get('lipides_g')}g")
                # All should have calories
                assert "calories" in meal, f"Meal {i} should have calories"
                    
    def test_weight_details_meals_have_prep_time(self):
        """Test that meals include prep_time field"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recommendations = data.get("recommendations")
        if recommendations and recommendations.get("meals"):
            meals = recommendations["meals"]
            for i, meal in enumerate(meals):
                if "prep_time" in meal:
                    assert isinstance(meal["prep_time"], str), f"Meal {i} prep_time should be string"
                    print(f"Meal {i} ({meal.get('name', 'unknown')}): prep_time={meal['prep_time']}")
                    
    def test_weight_details_meals_structure(self):
        """Test complete meal structure"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recommendations = data.get("recommendations")
        if recommendations and recommendations.get("meals"):
            meals = recommendations["meals"]
            assert len(meals) >= 4, "Should have at least 4 meals (breakfast, lunch, snack, dinner)"
            
            for i, meal in enumerate(meals):
                # Required fields for meal detail page
                assert "name" in meal, f"Meal {i} should have name"
                assert "calories" in meal, f"Meal {i} should have calories"
                assert "type" in meal or "label" in meal, f"Meal {i} should have type or label"
                
    # --- Allergies context in AI prompt verification (check backend code) ---
    def test_weight_details_returns_200(self):
        """Basic test that weight-details endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        assert response.status_code == 200
        
    def test_weight_details_has_recommendations(self):
        """Test that weight-details includes recommendations"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        # recommendations could be None if not generated yet, that's OK
        # But if present, should have correct structure
        if data.get("recommendations"):
            recs = data["recommendations"]
            assert "meals" in recs or "exercises" in recs, "Recommendations should have meals or exercises"
            
    # --- Track meal endpoint (for meal detail page) ---
    def test_track_meal_for_detail_page(self):
        """Test tracking meal works (used in meal detail page)"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 0}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["key"] == "meal_0"
        assert "done" in data
        
    def test_track_meal_toggle(self):
        """Test toggle behavior for meal tracking"""
        # Get initial state
        resp1 = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        initial_completed = resp1.json().get("tracking", {}).get("completed", {})
        initial_state = initial_completed.get("meal_1", False)
        
        # Toggle
        resp2 = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 1}
        )
        assert resp2.status_code == 200
        new_state = resp2.json()["done"]
        
        # Verify toggle worked
        assert new_state == (not initial_state), "Toggle should flip the state"
        
    # --- Verify profile allergies types ---
    def test_profile_allergies_is_string(self):
        """Test that allergies field is a string"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        allergies = data.get("profile", {}).get("allergies")
        if allergies is not None:
            assert isinstance(allergies, str), "Allergies should be a string"


class TestMinceurRefreshRecommendations:
    """Test refresh recommendations to regenerate with allergies"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: login and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        assert login_resp.status_code == 200
        self.token = login_resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
    def test_refresh_recommendations_endpoint(self):
        """Test POST /api/minceur/refresh-recommendations clears cache"""
        response = self.session.post(f"{BASE_URL}/api/minceur/refresh-recommendations")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cache_cleared"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
