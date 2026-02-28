"""
Iteration 40: Programs, Badges, Weekly Report, and Check-in Features Test
Tests for:
- GET /api/programs/badges - 6 badges with unlocked status and stats
- GET /api/programs/weekly-report - AI-generated weekly report with stats
- GET /api/programs/active - Active program with today_checkin status
- POST /api/programs/checkin - Submit check-in and get AI feedback
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://saad-guardian-ui.preview.emergentagent.com')


class TestProgramsBadgesWeeklyReport:
    """Tests for Programs Badges, Weekly Report, and Check-in endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "robert.martin@email.fr", "password": "demo123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user = response.json().get("user")

    def test_badges_endpoint_returns_6_badges(self):
        """GET /api/programs/badges returns 6 badges with unlocked status"""
        response = requests.get(f"{BASE_URL}/api/programs/badges", headers=self.headers)
        assert response.status_code == 200, f"Badges failed: {response.text}"
        
        data = response.json()
        
        # Verify badges array exists
        assert "badges" in data, "Missing 'badges' key"
        badges = data["badges"]
        
        # Verify we have 6 badges
        assert len(badges) == 6, f"Expected 6 badges, got {len(badges)}"
        
        # Verify badge structure
        for badge in badges:
            assert "id" in badge, "Badge missing 'id'"
            assert "title" in badge, "Badge missing 'title'"
            assert "icon" in badge, "Badge missing 'icon'"
            assert "color" in badge, "Badge missing 'color'"
            assert "description" in badge, "Badge missing 'description'"
            assert "unlocked" in badge, "Badge missing 'unlocked' status"
            assert isinstance(badge["unlocked"], bool), "'unlocked' should be boolean"
        
        # Verify stats exist
        assert "stats" in data, "Missing 'stats' key"
        stats = data["stats"]
        assert "total_checkins" in stats, "Stats missing 'total_checkins'"
        assert "max_streak" in stats, "Stats missing 'max_streak'"
        assert "programs_completed" in stats, "Stats missing 'programs_completed'"
        
        print(f"PASS: Got {len(badges)} badges with stats: {stats}")

    def test_badges_correct_badge_ids(self):
        """Verify all 6 expected badge IDs are present"""
        response = requests.get(f"{BASE_URL}/api/programs/badges", headers=self.headers)
        assert response.status_code == 200
        
        badges = response.json()["badges"]
        badge_ids = [b["id"] for b in badges]
        
        expected_ids = ["streak-3", "streak-7", "streak-14", "streak-21", "first-checkin", "mood-5"]
        for expected_id in expected_ids:
            assert expected_id in badge_ids, f"Missing badge: {expected_id}"
        
        print(f"PASS: All 6 expected badge IDs present: {badge_ids}")

    def test_weekly_report_returns_ai_generated_report(self):
        """GET /api/programs/weekly-report returns AI-generated report with stats"""
        response = requests.get(f"{BASE_URL}/api/programs/weekly-report", headers=self.headers)
        assert response.status_code == 200, f"Weekly report failed: {response.text}"
        
        data = response.json()
        
        # Verify report structure
        assert "report" in data, "Missing 'report' key"
        report = data["report"]
        assert "title" in report, "Report missing 'title'"
        assert "summary" in report, "Report missing 'summary'"
        assert "wins" in report, "Report missing 'wins'"
        assert "improvements" in report, "Report missing 'improvements'"
        assert "next_week_goal" in report, "Report missing 'next_week_goal'"
        assert "motivation" in report, "Report missing 'motivation'"
        
        # Verify stats structure
        assert "stats" in data, "Missing 'stats' key"
        stats = data["stats"]
        assert "checkins_this_week" in stats, "Stats missing 'checkins_this_week'"
        assert "checkins_last_week" in stats, "Stats missing 'checkins_last_week'"
        assert "avg_mood_this_week" in stats, "Stats missing 'avg_mood_this_week'"
        assert "avg_mood_last_week" in stats, "Stats missing 'avg_mood_last_week'"
        assert "mood_trend" in stats, "Stats missing 'mood_trend'"
        assert stats["mood_trend"] in ["up", "down", "stable"], f"Invalid mood_trend: {stats['mood_trend']}"
        
        # Verify generated_at timestamp
        assert "generated_at" in data, "Missing 'generated_at'"
        
        print(f"PASS: Weekly report generated with title: '{report['title']}'")
        print(f"Stats: {stats}")

    def test_active_program_returns_today_checkin_status(self):
        """GET /api/programs/active returns today_checkin status"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200, f"Active program failed: {response.text}"
        
        data = response.json()
        
        if data.get("active"):
            assert "today_checkin" in data, "Active program missing 'today_checkin'"
            assert "enrollment_id" in data, "Active program missing 'enrollment_id'"
            assert "current_day" in data, "Active program missing 'current_day'"
            assert "progress_pct" in data, "Active program missing 'progress_pct'"
            assert "today_tasks" in data, "Active program missing 'today_tasks'"
            
            # Verify program structure
            assert "program" in data, "Missing 'program' key"
            program = data["program"]
            assert "id" in program, "Program missing 'id'"
            assert "title" in program, "Program missing 'title'"
            assert "icon" in program, "Program missing 'icon'"
            assert "color" in program, "Program missing 'color'"
            assert "duration_days" in program, "Program missing 'duration_days'"
            
            print(f"PASS: Active program '{program['title']}', Day {data['current_day']}/{program['duration_days']}")
            print(f"today_checkin: {data['today_checkin']}")
        else:
            print("PASS: No active program (valid response)")

    def test_checkin_returns_ai_feedback(self):
        """POST /api/programs/checkin returns AI-generated feedback"""
        # First check if there's an active program
        active_response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        if not active_response.json().get("active"):
            pytest.skip("No active program to test check-in")
        
        # Submit check-in
        checkin_data = {
            "mood": 4,
            "note": "Test check-in from pytest",
            "tasks_done": ["Task 1"]
        }
        response = requests.post(
            f"{BASE_URL}/api/programs/checkin",
            json=checkin_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Check-in failed: {response.text}"
        
        data = response.json()
        assert "status" in data, "Missing 'status' key"
        assert data["status"] in ["created", "updated"], f"Invalid status: {data['status']}"
        
        # Check for feedback (only on new checkins)
        if data["status"] == "created":
            assert "feedback" in data, "New check-in missing 'feedback'"
            print(f"PASS: Check-in created with AI feedback: '{data.get('feedback', '')}'")
        else:
            print(f"PASS: Check-in updated (existing check-in for today)")

    def test_badges_unlocked_after_checkin(self):
        """Verify first-checkin badge is unlocked after check-in"""
        response = requests.get(f"{BASE_URL}/api/programs/badges", headers=self.headers)
        assert response.status_code == 200
        
        badges = response.json()["badges"]
        stats = response.json()["stats"]
        
        # Find first-checkin badge
        first_checkin_badge = next((b for b in badges if b["id"] == "first-checkin"), None)
        assert first_checkin_badge is not None, "first-checkin badge not found"
        
        # If user has at least 1 check-in, badge should be unlocked
        if stats["total_checkins"] >= 1:
            assert first_checkin_badge["unlocked"] == True, "first-checkin badge should be unlocked"
            print(f"PASS: first-checkin badge unlocked (total_checkins: {stats['total_checkins']})")
        else:
            print(f"PASS: first-checkin badge locked (no check-ins yet)")


class TestBadgesStatValidation:
    """Test badge unlock conditions"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "robert.martin@email.fr", "password": "demo123"}
        )
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_badge_colors_are_valid(self):
        """Verify all badges have valid hex color codes"""
        response = requests.get(f"{BASE_URL}/api/programs/badges", headers=self.headers)
        assert response.status_code == 200
        
        badges = response.json()["badges"]
        for badge in badges:
            color = badge["color"]
            assert color.startswith("#"), f"Badge {badge['id']} color should start with #"
            assert len(color) == 7, f"Badge {badge['id']} color should be 7 chars (hex)"
            print(f"Badge '{badge['id']}': {badge['title']} - {color}")

    def test_badge_icons_have_ri_prefix(self):
        """Verify all badges use remixicon icons (ri- prefix)"""
        response = requests.get(f"{BASE_URL}/api/programs/badges", headers=self.headers)
        assert response.status_code == 200
        
        badges = response.json()["badges"]
        for badge in badges:
            assert badge["icon"].startswith("ri-"), f"Badge {badge['id']} icon should use remixicon"


class TestWeeklyReportComparisons:
    """Test weekly report comparison features"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "robert.martin@email.fr", "password": "demo123"}
        )
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_weekly_report_comparison_stats(self):
        """Verify weekly report includes this week vs last week comparison"""
        response = requests.get(f"{BASE_URL}/api/programs/weekly-report", headers=self.headers)
        assert response.status_code == 200
        
        stats = response.json()["stats"]
        
        # Verify comparison fields exist
        assert "checkins_this_week" in stats
        assert "checkins_last_week" in stats
        assert "avg_mood_this_week" in stats
        assert "avg_mood_last_week" in stats
        
        # Verify values are numeric
        assert isinstance(stats["checkins_this_week"], (int, float))
        assert isinstance(stats["checkins_last_week"], (int, float))
        assert isinstance(stats["avg_mood_this_week"], (int, float))
        assert isinstance(stats["avg_mood_last_week"], (int, float))
        
        print(f"PASS: Weekly comparison - This week: {stats['checkins_this_week']} checkins, {stats['avg_mood_this_week']}/5 mood")
        print(f"       Last week: {stats['checkins_last_week']} checkins, {stats['avg_mood_last_week']}/5 mood")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
