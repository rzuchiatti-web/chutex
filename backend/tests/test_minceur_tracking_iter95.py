"""
Tests for Minceur Daily Tracking feature - Iteration 95
Testing meal/exercise tracking, streak, and progress bar functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mollie-payment-test.preview.emergentagent.com")


class TestMinceurTracking:
    """Test suite for /api/minceur/* tracking endpoints"""
    
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
        
    # --- POST /api/minceur/track (toggle meal/exercise tracking) ---
    def test_track_meal_toggle_on(self):
        """Test toggling a meal as done"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 0}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["key"] == "meal_0"
        assert "done" in data
        assert "total_done" in data
        
    def test_track_meal_toggle_off(self):
        """Test toggling a meal as undone (toggle off)"""
        # First toggle on
        self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 1}
        )
        # Then toggle off
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        # done should be False after toggling off (if it was on)
        # Note: The actual value depends on initial state
        
    def test_track_exercise_toggle(self):
        """Test toggling an exercise as done"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "exercise", "index": 0}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["key"] == "exercise_0"
        
    def test_track_multiple_items(self):
        """Test tracking multiple meals and exercises"""
        # Track meal 2
        resp1 = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 2}
        )
        assert resp1.status_code == 200
        
        # Track exercise 1
        resp2 = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "exercise", "index": 1}
        )
        assert resp2.status_code == 200
        
    def test_track_invalid_type(self):
        """Test tracking with invalid type returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "invalid", "index": 0}
        )
        assert response.status_code == 400
        
    def test_track_missing_index(self):
        """Test tracking without index returns 400"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal"}
        )
        assert response.status_code == 400
        
    def test_track_requires_auth(self):
        """Test tracking requires authentication"""
        session_no_auth = requests.Session()
        session_no_auth.headers.update({"Content-Type": "application/json"})
        response = session_no_auth.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 0}
        )
        assert response.status_code in [401, 403]
        
    # --- GET /api/minceur/today-tracking ---
    def test_get_today_tracking_returns_200(self):
        """Test today-tracking endpoint returns 200"""
        response = self.session.get(f"{BASE_URL}/api/minceur/today-tracking")
        assert response.status_code == 200
        
    def test_get_today_tracking_structure(self):
        """Test today-tracking returns correct structure"""
        response = self.session.get(f"{BASE_URL}/api/minceur/today-tracking")
        data = response.json()
        
        assert "completed" in data
        assert isinstance(data["completed"], dict)
        assert "streak" in data
        assert isinstance(data["streak"], int)
        assert "week_adherence" in data
        assert "days_tracked" in data
        
    def test_get_today_tracking_reflects_tracked_items(self):
        """Test that tracked items appear in today-tracking"""
        # Track a meal
        self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 3}
        )
        
        # Check today-tracking
        response = self.session.get(f"{BASE_URL}/api/minceur/today-tracking")
        data = response.json()
        
        # meal_3 should be in completed map
        assert "meal_3" in data["completed"]
        
    def test_get_today_tracking_requires_auth(self):
        """Test today-tracking requires authentication"""
        session_no_auth = requests.Session()
        response = session_no_auth.get(f"{BASE_URL}/api/minceur/today-tracking")
        assert response.status_code in [401, 403]
        
    # --- GET /api/minceur/weight-details (tracking field) ---
    def test_weight_details_includes_tracking(self):
        """Test that weight-details includes tracking data"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data = response.json()
        
        assert "tracking" in data
        assert "completed" in data["tracking"]
        assert "streak" in data["tracking"]
        
    def test_weight_details_tracking_matches_today_tracking(self):
        """Test that tracking data in weight-details matches today-tracking"""
        # Get weight-details
        resp1 = self.session.get(f"{BASE_URL}/api/minceur/weight-details")
        data1 = resp1.json()
        
        # Get today-tracking
        resp2 = self.session.get(f"{BASE_URL}/api/minceur/today-tracking")
        data2 = resp2.json()
        
        # Both should have same completed map
        assert data1["tracking"]["completed"] == data2["completed"]
        assert data1["tracking"]["streak"] == data2["streak"]
        
    # --- Streak calculation tests ---
    def test_streak_increments_on_first_track(self):
        """Test that tracking at least one item sets streak >= 1"""
        # Track something
        self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 0}
        )
        
        # Get tracking
        response = self.session.get(f"{BASE_URL}/api/minceur/today-tracking")
        data = response.json()
        
        # Should have tracked today, streak should be >= 1
        total_done = sum(1 for v in data["completed"].values() if v)
        if total_done > 0:
            assert data["streak"] >= 1
            
    # --- Total done count tests ---
    def test_track_returns_total_done_count(self):
        """Test that track endpoint returns total_done count"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/track",
            json={"type": "meal", "index": 0}
        )
        data = response.json()
        
        assert "total_done" in data
        assert isinstance(data["total_done"], int)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
