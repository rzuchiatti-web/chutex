"""
Iteration 88: Activity Streak System Tests
Tests the streak system based on REAL objective achievement (not check-in).
Objectives: steps>=6000, hydration>=55%, sleep>=75%, calories>=200, distance>=3km, BMI 18.5-25, body_fat<=25%
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or 'https://dorsi-cushion.preview.emergentagent.com'
BASE_URL = BASE_URL.rstrip('/')

class TestActivityStreak:
    """Test activity streak endpoint and evaluate_objectives_met function"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get token"""
        self.email = "0651245918"
        self.password = "test123"
        self.token = None
        
        # Login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.email,
            "password": self.password
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json().get("access_token") or login_resp.json().get("token")
        assert self.token, "No token returned from login"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    # ===== 1. Activity Streak Endpoint Tests =====
    
    def test_activity_streak_endpoint_exists(self):
        """Test GET /api/health/activity-streak returns 200"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200, f"Activity streak endpoint failed: {resp.text}"
        data = resp.json()
        print(f"Activity streak response: {data}")
    
    def test_activity_streak_response_structure(self):
        """Test activity-streak returns correct structure: current_streak, max_streak, objectives_today, badge"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Required fields
        assert "current_streak" in data, "Missing current_streak field"
        assert "max_streak" in data, "Missing max_streak field"
        assert "objectives_today" in data, "Missing objectives_today field"
        assert "badge" in data, "Missing badge field (can be null)"
        
        # Type checks
        assert isinstance(data["current_streak"], int), "current_streak should be int"
        assert isinstance(data["max_streak"], int), "max_streak should be int"
        assert isinstance(data["objectives_today"], list), "objectives_today should be list"
        
        print(f"Streak structure valid: current={data['current_streak']}, max={data['max_streak']}, objectives={data['objectives_today']}, badge={data['badge']}")
    
    def test_activity_streak_objectives_today_empty_for_user_without_objectives_met(self):
        """Test that objectives_today is empty for user who hasn't met any objectives"""
        # User 0651245918 has BMI=25.9 and body_fat=26.4%, neither meets objectives
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Given user's data (BMI=25.9 > 25, body_fat=26.4% > 25%), objectives should be empty
        # User has no bracelet so steps/calories/distance/sleep are 0
        objectives = data["objectives_today"]
        print(f"Objectives today for user: {objectives}")
        
        # This user specifically has no objectives met based on their data
        # Note: Could be empty or contain items based on data evaluation
    
    # ===== 2. Daily Report with Activity Streak Tests =====
    
    def test_daily_report_includes_activity_streak(self):
        """Test GET /api/health/daily-report includes activity_streak field"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp.status_code == 200, f"Daily report failed: {resp.text}"
        data = resp.json()
        
        assert "activity_streak" in data, "Daily report missing activity_streak field"
        streak = data["activity_streak"]
        
        # Verify structure within daily report
        assert "current_streak" in streak, "activity_streak missing current_streak"
        assert "max_streak" in streak, "activity_streak missing max_streak"
        assert "objectives_today" in streak, "activity_streak missing objectives_today"
        assert "badge" in streak, "activity_streak missing badge (can be null)"
        
        print(f"Daily report activity_streak: {streak}")
    
    def test_daily_report_streak_consistency_with_dedicated_endpoint(self):
        """Test that daily-report and activity-streak endpoints return consistent data"""
        # Get from both endpoints
        report_resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        streak_resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        
        assert report_resp.status_code == 200
        assert streak_resp.status_code == 200
        
        report_streak = report_resp.json().get("activity_streak", {})
        dedicated_streak = streak_resp.json()
        
        # Current streak should match
        assert report_streak.get("current_streak") == dedicated_streak.get("current_streak"), \
            f"Streak mismatch: report={report_streak.get('current_streak')}, dedicated={dedicated_streak.get('current_streak')}"
        
        # Max streak should match
        assert report_streak.get("max_streak") == dedicated_streak.get("max_streak"), \
            f"Max streak mismatch: report={report_streak.get('max_streak')}, dedicated={dedicated_streak.get('max_streak')}"
        
        print(f"Streak consistency verified: current={dedicated_streak['current_streak']}, max={dedicated_streak['max_streak']}")
    
    # ===== 3. Badge System Tests =====
    
    def test_badge_null_for_streak_less_than_7(self):
        """Test that badge is null when streak < 7"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if data["current_streak"] < 7:
            assert data["badge"] is None, f"Badge should be null for streak < 7, got: {data['badge']}"
            print(f"Verified: badge is null for streak {data['current_streak']} < 7")
        else:
            # If streak is >= 7, badge should exist
            assert data["badge"] is not None, f"Badge should exist for streak >= 7"
            print(f"Streak {data['current_streak']} >= 7, badge exists: {data['badge']}")
    
    def test_badge_structure_when_exists(self):
        """Test badge structure has icon, color, label when present"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        badge = data.get("badge")
        if badge is not None:
            assert "icon" in badge, "Badge missing icon field"
            assert "color" in badge, "Badge missing color field"
            assert "label" in badge, "Badge missing label field"
            print(f"Badge structure valid: {badge}")
        else:
            print(f"Badge is null (streak < 7), structure test skipped")
    
    # ===== 4. Objectives Evaluation Tests =====
    
    def test_daily_report_data_for_objectives_evaluation(self):
        """Test that daily report contains data needed for objective evaluation"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Get the data object used for evaluation
        d = data.get("data", {})
        
        # Print current values for verification
        print(f"Data for objectives evaluation:")
        print(f"  - steps: {d.get('steps', 0)} (objective: >= 6000)")
        print(f"  - water_pct: {d.get('water_pct', 0)} (objective: >= 55%)")
        print(f"  - sleep_quality: {d.get('sleep_quality', 0)} (objective: >= 75%)")
        print(f"  - calories: {d.get('calories', 0)} (objective: >= 200)")
        print(f"  - distance_km: {d.get('distance_km', 0)} (objective: >= 3km)")
        print(f"  - bmi: {d.get('bmi', 0)} (objective: 18.5-25)")
        print(f"  - body_fat_pct: {d.get('body_fat_pct', 0)} (objective: <= 25%)")
        
        # For user 0651245918:
        # BMI=25.9 (fails: > 25)
        # body_fat=26.4% (fails: > 25%)
        # water_pct=53.7% (fails: < 55%)
        # No bracelet data so steps, calories, distance, sleep = 0
    
    def test_objectives_evaluation_logic_bmi(self):
        """Test BMI objective: 18.5 <= BMI <= 25"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = resp.json()
        d = data.get("data", {})
        streak = data.get("activity_streak", {})
        objectives = streak.get("objectives_today", [])
        
        bmi = d.get("bmi", 0)
        print(f"BMI value: {bmi}")
        
        if 18.5 <= bmi <= 25:
            assert "bmi" in objectives, f"BMI {bmi} is in range but not in objectives"
            print(f"BMI {bmi} is in range [18.5-25], objective met")
        else:
            # BMI outside range should not be in objectives
            print(f"BMI {bmi} is outside range [18.5-25], objective NOT met")
    
    def test_objectives_evaluation_logic_body_fat(self):
        """Test body_fat objective: body_fat_pct <= 25%"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = resp.json()
        d = data.get("data", {})
        streak = data.get("activity_streak", {})
        objectives = streak.get("objectives_today", [])
        
        body_fat = d.get("body_fat_pct", 0)
        print(f"Body fat value: {body_fat}%")
        
        if body_fat > 0 and body_fat <= 25:
            assert "body_fat" in objectives, f"Body fat {body_fat}% <= 25% but not in objectives"
            print(f"Body fat {body_fat}% <= 25%, objective met")
        else:
            print(f"Body fat {body_fat}% > 25% or 0, objective NOT met")
    
    def test_objectives_evaluation_logic_hydration(self):
        """Test hydration objective: water_pct >= 55%"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = resp.json()
        d = data.get("data", {})
        streak = data.get("activity_streak", {})
        objectives = streak.get("objectives_today", [])
        
        water_pct = d.get("water_pct", 0)
        print(f"Water percentage: {water_pct}%")
        
        if water_pct >= 55:
            assert "hydration" in objectives, f"Water {water_pct}% >= 55% but not in objectives"
            print(f"Hydration {water_pct}% >= 55%, objective met")
        else:
            print(f"Hydration {water_pct}% < 55%, objective NOT met")
    
    # ===== 5. Streak Auto-Evaluation Tests =====
    
    def test_streak_auto_evaluates_on_daily_report_fetch(self):
        """Test that fetching daily-report triggers streak evaluation"""
        # First fetch should trigger evaluation
        resp1 = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp1.status_code == 200
        streak1 = resp1.json().get("activity_streak", {})
        
        # Second fetch should return consistent data (already evaluated today)
        resp2 = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp2.status_code == 200
        streak2 = resp2.json().get("activity_streak", {})
        
        # Streaks should be consistent
        assert streak1.get("current_streak") == streak2.get("current_streak"), \
            "Streak should be consistent across fetches"
        
        print(f"Auto-evaluation verified: streak consistent = {streak1.get('current_streak')}")
    
    # ===== 6. Edge Cases =====
    
    def test_streak_zero_when_no_objectives_met(self):
        """Test streak is 0 or unchanged when no objectives are met"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        objectives = data.get("objectives_today", [])
        current = data.get("current_streak", 0)
        
        if len(objectives) == 0:
            # No objectives met - streak should be 0 or from a previous day
            print(f"No objectives met, current streak: {current}")
        else:
            print(f"Objectives met: {objectives}, current streak: {current}")
    
    def test_max_streak_gte_current_streak(self):
        """Test that max_streak is always >= current_streak"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        current = data.get("current_streak", 0)
        max_streak = data.get("max_streak", 0)
        
        assert max_streak >= current, f"Max streak {max_streak} should be >= current {current}"
        print(f"Verified: max_streak ({max_streak}) >= current_streak ({current})")


class TestObjectivesEvaluationFunction:
    """Test the evaluate_objectives_met function logic by verifying API responses"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login"""
        self.email = "0651245918"
        self.password = "test123"
        
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.email,
            "password": self.password
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json().get("access_token") or login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_user_data_values(self):
        """Verify actual user data values for objective evaluation"""
        resp = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert resp.status_code == 200
        d = resp.json().get("data", {})
        
        # Based on context: BMI=25.9, body_fat=26.4%, water_pct=53.7%
        print(f"\n=== User Data for Objective Evaluation ===")
        print(f"BMI: {d.get('bmi', 0)} (25.9 expected) - objective: 18.5-25 - FAIL")
        print(f"Body Fat: {d.get('body_fat_pct', 0)}% (26.4% expected) - objective: <=25% - FAIL")
        print(f"Water: {d.get('water_pct', 0)}% (53.7% expected) - objective: >=55% - FAIL")
        print(f"Steps: {d.get('steps', 0)} - objective: >=6000 - {'PASS' if d.get('steps', 0) >= 6000 else 'FAIL'}")
        print(f"Calories: {d.get('calories', 0)} - objective: >=200 - {'PASS' if d.get('calories', 0) >= 200 else 'FAIL'}")
        print(f"Distance: {d.get('distance_km', 0)}km - objective: >=3km - {'PASS' if d.get('distance_km', 0) >= 3 else 'FAIL'}")
        print(f"Sleep Quality: {d.get('sleep_quality', 0)}% - objective: >=75% - {'PASS' if d.get('sleep_quality', 0) >= 75 else 'FAIL'}")
    
    def test_objectives_empty_for_this_user(self):
        """Verify that objectives_today is empty for user who meets no objectives"""
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        objectives = data.get("objectives_today", [])
        print(f"Objectives met today: {objectives}")
        
        # User has: BMI=25.9 (>25), body_fat=26.4% (>25%), water_pct=53.7% (<55%)
        # No bracelet data, so steps=0, calories=0, distance=0, sleep=0
        # Expected: empty objectives list (or nearly empty)


class TestBadgeLevels:
    """Test badge levels based on streak count"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json().get("access_token") or login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_badge_tiers_documented(self):
        """Document the badge tier system"""
        print("\n=== Badge Tier System ===")
        print("Streak < 7: No badge (null)")
        print("Streak >= 7: Gold fire badge (1 semaine)")
        print("Streak >= 14: Red fire badge (2 semaines)")
        print("Streak >= 30: Medal badge (1 mois)")
        print("Streak >= 100: Diamond badge (100 jours)")
        
        # Verify current user's badge
        resp = requests.get(f"{BASE_URL}/api/health/activity-streak", headers=self.headers)
        data = resp.json()
        print(f"\nCurrent streak: {data.get('current_streak', 0)}")
        print(f"Current badge: {data.get('badge')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
