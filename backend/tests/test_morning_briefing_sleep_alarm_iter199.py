"""
Iteration 199: Test Morning Briefing Enriched Fields & Sleep Alarm API
- GET /api/nora/morning-briefing: exercises, exercises_done, exercises_total, nutrition, reminders, sleep
- GET /api/health/sleep-alarm: wake_time, bedtime, sleep_need_hours, adjustments
- PUT /api/health/sleep-alarm: update wake time and verify adjustments returned
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")


class TestMorningBriefingEnrichedFields:
    """Test GET /api/nora/morning-briefing returns new enriched fields"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary and get auth token"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        if login_resp.status_code != 200:
            pytest.skip("Login failed - skipping tests")
        self.token = login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_morning_briefing_returns_200(self):
        """Test that morning briefing endpoint returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15  # LLM call takes 3-5 seconds
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("✓ Morning briefing returns 200")

    def test_morning_briefing_has_exercises_fields(self):
        """Test that morning briefing includes exercises, exercises_done, exercises_total"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # Check exercises field exists and is a list
        assert "exercises" in data, "Missing 'exercises' field"
        assert isinstance(data["exercises"], list), "exercises should be a list"
        
        # Check exercises_done field
        assert "exercises_done" in data, "Missing 'exercises_done' field"
        assert isinstance(data["exercises_done"], int), "exercises_done should be int"
        
        # Check exercises_total field
        assert "exercises_total" in data, "Missing 'exercises_total' field"
        assert isinstance(data["exercises_total"], int), "exercises_total should be int"
        
        # Validate exercises_done <= exercises_total
        assert data["exercises_done"] <= data["exercises_total"], \
            f"exercises_done ({data['exercises_done']}) > exercises_total ({data['exercises_total']})"
        
        print(f"✓ Exercises fields present: {data['exercises_done']}/{data['exercises_total']} done")
        print(f"  Exercises list: {len(data['exercises'])} items")

    def test_morning_briefing_exercises_structure(self):
        """Test that each exercise has title, sets, repetitions, done fields"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        exercises = data.get("exercises", [])
        if len(exercises) > 0:
            for i, ex in enumerate(exercises[:3]):  # Check first 3
                assert "title" in ex, f"Exercise {i} missing 'title'"
                assert "sets" in ex, f"Exercise {i} missing 'sets'"
                assert "repetitions" in ex, f"Exercise {i} missing 'repetitions'"
                assert "done" in ex, f"Exercise {i} missing 'done'"
                assert isinstance(ex["done"], bool), f"Exercise {i} 'done' should be bool"
            print(f"✓ Exercise structure valid for {len(exercises)} exercises")
        else:
            print("✓ No exercises assigned today (empty list is valid)")

    def test_morning_briefing_has_nutrition_field(self):
        """Test that morning briefing includes nutrition object"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # Nutrition can be null if no meal plan
        assert "nutrition" in data, "Missing 'nutrition' field"
        
        nutrition = data.get("nutrition")
        if nutrition is not None:
            assert "daily_calories" in nutrition, "nutrition missing 'daily_calories'"
            assert "meal_count" in nutrition, "nutrition missing 'meal_count'"
            assert "meal_names" in nutrition, "nutrition missing 'meal_names'"
            assert "has_plan" in nutrition, "nutrition missing 'has_plan'"
            assert isinstance(nutrition["meal_names"], list), "meal_names should be list"
            print(f"✓ Nutrition present: {nutrition['daily_calories']} kcal, {nutrition['meal_count']} meals")
        else:
            print("✓ Nutrition is null (no meal plan today)")

    def test_morning_briefing_has_reminders_field(self):
        """Test that morning briefing includes reminders list"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        assert "reminders" in data, "Missing 'reminders' field"
        assert isinstance(data["reminders"], list), "reminders should be a list"
        
        reminders = data.get("reminders", [])
        if len(reminders) > 0:
            for i, r in enumerate(reminders[:3]):
                assert "type" in r, f"Reminder {i} missing 'type'"
                assert "time" in r, f"Reminder {i} missing 'time'"
                assert "title" in r, f"Reminder {i} missing 'title'"
            print(f"✓ Reminders present: {len(reminders)} active reminders")
        else:
            print("✓ No active reminders (empty list is valid)")

    def test_morning_briefing_has_sleep_field(self):
        """Test that morning briefing includes sleep object from sleep-alarm"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        assert "sleep" in data, "Missing 'sleep' field"
        sleep = data.get("sleep")
        assert sleep is not None, "sleep should not be null"
        
        # Check sleep-alarm fields
        assert "wake_time" in sleep, "sleep missing 'wake_time'"
        assert "bedtime" in sleep, "sleep missing 'bedtime'"
        assert "sleep_need_hours" in sleep, "sleep missing 'sleep_need_hours'"
        assert "adjustments" in sleep, "sleep missing 'adjustments'"
        assert isinstance(sleep["adjustments"], list), "adjustments should be list"
        
        print(f"✓ Sleep data present: wake {sleep['wake_time']}, bed {sleep['bedtime']}")
        print(f"  Sleep need: {sleep['sleep_need_hours']}h, adjustments: {sleep['adjustments']}")

    def test_morning_briefing_existing_fields_still_present(self):
        """Test that existing fields (user_name, health, objectives, nora_message) still present"""
        resp = requests.get(
            f"{BASE_URL}/api/nora/morning-briefing",
            headers=self.headers,
            timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # Check existing fields
        assert "user_name" in data, "Missing 'user_name'"
        assert "has_data" in data, "Missing 'has_data'"
        assert "health" in data, "Missing 'health'"
        assert "objectives" in data, "Missing 'objectives'"
        assert "nora_message" in data, "Missing 'nora_message'"
        assert "streak" in data, "Missing 'streak'"
        
        print(f"✓ Existing fields present: user={data['user_name']}, streak={data['streak']}")
        print(f"  Nora message: {data['nora_message'][:80]}...")


class TestSleepAlarmAPI:
    """Test GET/PUT /api/health/sleep-alarm with adjustments"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary and get auth token"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        if login_resp.status_code != 200:
            pytest.skip("Login failed - skipping tests")
        self.token = login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_sleep_alarm_returns_200(self):
        """Test GET /api/health/sleep-alarm returns 200"""
        resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("✓ GET sleep-alarm returns 200")

    def test_get_sleep_alarm_has_required_fields(self):
        """Test sleep-alarm response has all required fields"""
        resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert resp.status_code == 200
        data = resp.json()
        
        required_fields = [
            "wake_time", "enabled", "bedtime", 
            "sleep_need_hours", "sleep_need_minutes",
            "adjustments", "base_hours", "base_minutes", "extra_minutes"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ All required fields present")
        print(f"  Wake: {data['wake_time']}, Bed: {data['bedtime']}")
        print(f"  Sleep need: {data['sleep_need_hours']}h {data['sleep_need_minutes']}m")

    def test_get_sleep_alarm_adjustments_is_list(self):
        """Test that adjustments field is a list of strings"""
        resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert resp.status_code == 200
        data = resp.json()
        
        adjustments = data.get("adjustments", [])
        assert isinstance(adjustments, list), "adjustments should be a list"
        
        # If there are adjustments, they should be strings
        for adj in adjustments:
            assert isinstance(adj, str), f"Adjustment should be string, got {type(adj)}"
        
        print(f"✓ Adjustments is list: {adjustments}")

    def test_put_sleep_alarm_updates_wake_time(self):
        """Test PUT /api/health/sleep-alarm updates wake time"""
        # First get current value
        get_resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert get_resp.status_code == 200
        original = get_resp.json()
        
        # Update to new wake time
        new_wake = "06:30"
        put_resp = requests.put(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers,
            json={"wake_time": new_wake, "enabled": True}
        )
        assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
        
        updated = put_resp.json()
        assert updated["wake_time"] == new_wake, f"Wake time not updated: {updated['wake_time']}"
        
        # Verify adjustments still returned
        assert "adjustments" in updated, "PUT response missing adjustments"
        assert isinstance(updated["adjustments"], list), "adjustments should be list"
        
        print(f"✓ PUT sleep-alarm works: wake_time updated to {new_wake}")
        print(f"  Computed bedtime: {updated['bedtime']}")
        print(f"  Adjustments: {updated['adjustments']}")
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers,
            json={"wake_time": original["wake_time"], "enabled": original["enabled"]}
        )

    def test_put_sleep_alarm_computes_bedtime(self):
        """Test that PUT recalculates bedtime based on new wake time"""
        # Set wake time to 07:00
        put_resp = requests.put(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers,
            json={"wake_time": "07:00", "enabled": True}
        )
        assert put_resp.status_code == 200
        data = put_resp.json()
        
        # Bedtime should be computed (wake_time - sleep_need)
        assert "bedtime" in data
        assert data["bedtime"] != "", "Bedtime should not be empty"
        
        # Verify bedtime format HH:MM
        parts = data["bedtime"].split(":")
        assert len(parts) == 2, f"Invalid bedtime format: {data['bedtime']}"
        
        print(f"✓ Bedtime computed: {data['bedtime']} for wake {data['wake_time']}")


class TestSleepAlarmAdjustmentsLogic:
    """Test that adjustments are computed from health data"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary"""
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        if login_resp.status_code != 200:
            pytest.skip("Login failed")
        self.token = login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_adjustments_are_french_strings(self):
        """Test that adjustments are in French (as per code)"""
        resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert resp.status_code == 200
        data = resp.json()
        
        adjustments = data.get("adjustments", [])
        # Known adjustment strings from code
        valid_adjustments = [
            "Recuperation faible",
            "Stress eleve",
            "Sommeil recent insuffisant",
            "Activite physique intense"
        ]
        
        for adj in adjustments:
            assert adj in valid_adjustments, f"Unknown adjustment: {adj}"
        
        print(f"✓ Adjustments are valid French strings: {adjustments}")

    def test_extra_minutes_matches_adjustments(self):
        """Test that extra_minutes correlates with number of adjustments"""
        resp = requests.get(
            f"{BASE_URL}/api/health/sleep-alarm",
            headers=self.headers
        )
        assert resp.status_code == 200
        data = resp.json()
        
        adjustments = data.get("adjustments", [])
        extra_min = data.get("extra_minutes", 0)
        
        # Each adjustment adds 15-30 minutes
        # So extra_minutes should be >= 15 * len(adjustments) if adjustments exist
        if len(adjustments) > 0:
            assert extra_min > 0, f"Expected extra_minutes > 0 with {len(adjustments)} adjustments"
        
        print(f"✓ Extra minutes: {extra_min} for {len(adjustments)} adjustments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
