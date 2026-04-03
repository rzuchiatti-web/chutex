"""
Tests for Minceur (Weight & Nutrition) endpoints - Iteration 93
Testing the Poids & Nutrition health dashboard permanent section
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ios-health-native.preview.emergentagent.com")


class TestMinceurAPI:
    """Test suite for /api/minceur/* endpoints"""
    
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
        
    # --- GET /api/minceur/weight-details ---
    def test_get_weight_details_returns_200(self):
        """Test that weight-details endpoint returns 200 and proper structure"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        assert response.status_code == 200
        
    def test_get_weight_details_has_profile(self):
        """Test weight-details returns profile with name, age, gender, height"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert "profile" in data
        profile = data["profile"]
        assert "name" in profile
        assert "age" in profile
        assert "gender" in profile
        assert "height_cm" in profile
        
    def test_get_weight_details_has_current_metrics(self):
        """Test weight-details returns current weight, BMI, BMR, TDEE"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert "current" in data
        current = data["current"]
        assert "weight" in current
        assert "bmi" in current
        assert "bmi_info" in current
        assert "bmr" in current
        assert "tdee" in current
        
    def test_get_weight_details_bmi_info_structure(self):
        """Test BMI info has label, color, and level"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        bmi_info = data["current"].get("bmi_info")
        if bmi_info:  # Only if BMI is calculable
            assert "label" in bmi_info
            assert "color" in bmi_info
            assert "level" in bmi_info
            
    def test_get_weight_details_has_body_composition(self):
        """Test weight-details returns body composition data"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert "body_composition" in data
        bc = data["body_composition"]
        # Should have these keys (values may be null if no scale data)
        expected_keys = ["body_fat_pct", "muscle_pct", "water_pct", 
                        "visceral_fat", "bone_mass_kg", "body_age", "protein_pct"]
        for key in expected_keys:
            assert key in bc, f"Missing body composition key: {key}"
            
    def test_get_weight_details_has_weight_history(self):
        """Test weight-details returns weight history array"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert "weight_history" in data
        assert isinstance(data["weight_history"], list)
        
    def test_get_weight_details_has_recommendations(self):
        """Test weight-details returns AI recommendations"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        # Recommendations may be null if AI generation fails, but key should exist
        assert "recommendations" in data
        
    def test_get_weight_details_recommendations_structure(self):
        """Test AI recommendations structure when available"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recs = data.get("recommendations")
        if recs:  # Only test if recommendations exist
            assert "daily_calories" in recs
            assert "macros" in recs
            assert "meals" in recs
            assert "exercises" in recs
            assert isinstance(recs["meals"], list)
            assert isinstance(recs["exercises"], list)
            
    def test_get_weight_details_meals_structure(self):
        """Test meal recommendations have required fields"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recs = data.get("recommendations")
        if recs and recs.get("meals"):
            for meal in recs["meals"]:
                assert "type" in meal or "label" in meal
                assert "name" in meal
                assert "calories" in meal
                
    def test_get_weight_details_exercises_structure(self):
        """Test exercise recommendations have required fields"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        recs = data.get("recommendations")
        if recs and recs.get("exercises"):
            for ex in recs["exercises"]:
                assert "name" in ex
                assert "duration" in ex
                assert "intensity" in ex
                
    # --- POST /api/minceur/weight-goal ---
    def test_set_weight_goal_success(self):
        """Test setting a weight goal returns 200 and saves"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 70, "weeks": 16}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "saved"
        assert data["target_kg"] == 70
        assert data["weeks"] == 16
        
    def test_set_weight_goal_persists(self):
        """Test that set goal appears in weight-details"""
        # Set goal
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 72, "weeks": 8}
        )
        
        # Verify in weight-details
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert data["goal"] is not None
        assert data["goal"]["target_kg"] == 72
        assert data["goal"]["weeks"] == 8
        
    def test_set_weight_goal_invalid_target(self):
        """Test setting invalid target_kg returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 0, "weeks": 12}
        )
        assert response.status_code == 400
        
    def test_set_weight_goal_invalid_weeks(self):
        """Test setting invalid weeks returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 70, "weeks": 1}  # < 2 weeks
        )
        assert response.status_code == 400
        
    # --- DELETE /api/minceur/weight-goal ---
    def test_delete_weight_goal_success(self):
        """Test deleting weight goal returns 200"""
        # First set a goal
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 68, "weeks": 10}
        )
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        
    def test_delete_weight_goal_removes_from_details(self):
        """Test deleted goal no longer appears in weight-details"""
        # Set and delete goal
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 65, "weeks": 20}
        )
        self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        
        # Verify removed
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        assert data["goal"] is None
        
    # --- POST /api/minceur/refresh-recommendations ---
    def test_refresh_recommendations_success(self):
        """Test refresh recommendations returns 200"""
        response = self.session.post(f"{BASE_URL}/api/minceur/refresh-recommendations")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cache_cleared"
        
    # --- Authentication required tests ---
    def test_weight_details_requires_auth(self):
        """Test weight-details returns 401 without auth"""
        session_no_auth = requests.Session()
        response = session_no_auth.get(f"{BASE_URL}/api/minceur/weight-details")
        assert response.status_code in [401, 403]
        
    def test_weight_goal_requires_auth(self):
        """Test weight-goal endpoints require auth"""
        session_no_auth = requests.Session()
        session_no_auth.headers.update({"Content-Type": "application/json"})
        
        response = session_no_auth.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 70, "weeks": 12}
        )
        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
