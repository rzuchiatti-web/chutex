"""
Test validation system for meals and reminders (pain_level + patient_notes)
Iteration 190 - P0: Validation system for Complements, Hydratation, and Repas

Tests:
1. POST /api/pro/meals/{id}/complete - Meal completion with pain_level and patient_notes
2. POST /api/pro/reminders/{id}/complete - Reminder completion with pain_level and patient_notes
3. GET /api/pro/assigned-reminder-detail/{id} - Returns reminder with completions data
4. GET /api/pro/beneficiary-today-reminders - Returns reminders with completed_today field
5. GET /api/pro/beneficiary-today-meals - Returns meals with completed_today field
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://premium-clinic-web-1.preview.emergentagent.com')

# Test credentials
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"


class TestValidationSystem:
    """Test validation system for meals and reminders"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_beneficiary_token(self):
        """Login as beneficiary and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,
            "password": BENEFICIARY_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Beneficiary login failed: {response.status_code} - {response.text}")
        
    def get_coach_token(self):
        """Login as coach and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Coach login failed: {response.status_code} - {response.text}")

    # ── Test 1: POST /api/pro/meals/{id}/complete ──
    def test_meal_completion_with_pain_and_notes(self):
        """Test meal completion endpoint with pain_level and patient_notes"""
        token = self.get_beneficiary_token()
        
        # First get today's meals to find an assignment ID
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-meals",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed to get today meals: {response.text}"
        meals = response.json()
        
        if not meals:
            pytest.skip("No assigned meals for today - cannot test completion")
        
        meal = meals[0]
        assignment_id = meal.get("id")
        assert assignment_id, "Meal missing 'id' field"
        
        # Complete the meal with pain_level and notes
        completion_data = {
            "status": "done",
            "pain_level": 3,
            "patient_notes": "Test completion - felt good after eating"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pro/meals/{assignment_id}/complete",
            json=completion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Meal completion failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", "Response should have status 'ok'"
        assert "completion" in data, "Response should include completion object"
        
        completion = data["completion"]
        assert completion.get("status") == "done", "Completion status should be 'done'"
        assert completion.get("pain_level") == 3, "Pain level should be 3"
        assert completion.get("patient_notes") == "Test completion - felt good after eating"
        print(f"✓ Meal completion with pain_level and notes: PASS")

    # ── Test 2: POST /api/pro/reminders/{id}/complete ──
    def test_reminder_completion_with_pain_and_notes(self):
        """Test reminder completion endpoint with pain_level and patient_notes"""
        token = self.get_beneficiary_token()
        
        # First get today's reminders to find an assignment ID
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed to get today reminders: {response.text}"
        reminders = response.json()
        
        if not reminders:
            pytest.skip("No assigned reminders for today - cannot test completion")
        
        reminder = reminders[0]
        assignment_id = reminder.get("id")
        assert assignment_id, "Reminder missing 'id' field"
        
        # Complete the reminder with pain_level and notes
        completion_data = {
            "status": "done",
            "pain_level": 2,
            "patient_notes": "Took supplement without issues"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pro/reminders/{assignment_id}/complete",
            json=completion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Reminder completion failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", "Response should have status 'ok'"
        assert "completion" in data, "Response should include completion object"
        
        completion = data["completion"]
        assert completion.get("status") == "done", "Completion status should be 'done'"
        assert completion.get("pain_level") == 2, "Pain level should be 2"
        assert completion.get("patient_notes") == "Took supplement without issues"
        print(f"✓ Reminder completion with pain_level and notes: PASS")

    # ── Test 3: GET /api/pro/assigned-reminder-detail/{id} ──
    def test_assigned_reminder_detail_with_completions(self):
        """Test that assigned reminder detail includes completions data"""
        token = self.get_beneficiary_token()
        
        # Get today's reminders
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed to get today reminders: {response.text}"
        reminders = response.json()
        
        if not reminders:
            pytest.skip("No assigned reminders for today")
        
        reminder = reminders[0]
        assignment_id = reminder.get("id")
        
        # Get the detail
        response = self.session.get(
            f"{BASE_URL}/api/pro/assigned-reminder-detail/{assignment_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Failed to get reminder detail: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "id" in data, "Response should have 'id'"
        assert "title" in data, "Response should have 'title'"
        assert "reminder_type" in data, "Response should have 'reminder_type'"
        assert "completions" in data, "Response should have 'completions' array"
        assert isinstance(data["completions"], list), "'completions' should be a list"
        
        print(f"✓ Assigned reminder detail with completions: PASS")
        print(f"  - Reminder: {data.get('title')}")
        print(f"  - Type: {data.get('reminder_type')}")
        print(f"  - Completions count: {len(data.get('completions', []))}")

    # ── Test 4: GET /api/pro/beneficiary-today-reminders with completed_today ──
    def test_beneficiary_today_reminders_completed_today_field(self):
        """Test that beneficiary-today-reminders returns completed_today field"""
        token = self.get_beneficiary_token()
        
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Failed to get today reminders: {response.text}"
        reminders = response.json()
        assert isinstance(reminders, list), "Response should be a list"
        
        if not reminders:
            pytest.skip("No assigned reminders for today")
        
        # Check that each reminder has completed_today field
        for rem in reminders:
            assert "id" in rem, "Reminder should have 'id'"
            assert "title" in rem, "Reminder should have 'title'"
            assert "completed_today" in rem, f"Reminder '{rem.get('title')}' missing 'completed_today' field"
            assert isinstance(rem["completed_today"], bool), "'completed_today' should be boolean"
        
        completed_count = sum(1 for r in reminders if r.get("completed_today"))
        print(f"✓ Beneficiary today reminders with completed_today: PASS")
        print(f"  - Total reminders: {len(reminders)}")
        print(f"  - Completed today: {completed_count}")

    # ── Test 5: GET /api/pro/beneficiary-today-meals with completed_today ──
    def test_beneficiary_today_meals_completed_today_field(self):
        """Test that beneficiary-today-meals returns completed_today field"""
        token = self.get_beneficiary_token()
        
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-meals",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Failed to get today meals: {response.text}"
        meals = response.json()
        assert isinstance(meals, list), "Response should be a list"
        
        if not meals:
            pytest.skip("No assigned meals for today")
        
        # Check that each meal has completed_today field
        for meal in meals:
            assert "id" in meal, "Meal should have 'id'"
            assert "title" in meal, "Meal should have 'title'"
            assert "completed_today" in meal, f"Meal '{meal.get('title')}' missing 'completed_today' field"
            assert isinstance(meal["completed_today"], bool), "'completed_today' should be boolean"
        
        completed_count = sum(1 for m in meals if m.get("completed_today"))
        print(f"✓ Beneficiary today meals with completed_today: PASS")
        print(f"  - Total meals: {len(meals)}")
        print(f"  - Completed today: {completed_count}")

    # ── Test 6: Meal completion with partial status ──
    def test_meal_completion_partial_status(self):
        """Test meal completion with 'partial' status"""
        token = self.get_beneficiary_token()
        
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-meals",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        meals = response.json()
        
        if not meals:
            pytest.skip("No assigned meals for today")
        
        meal = meals[0]
        assignment_id = meal.get("id")
        
        # Complete with partial status
        completion_data = {
            "status": "partial",
            "pain_level": 5,
            "patient_notes": "Only ate half the portion"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pro/meals/{assignment_id}/complete",
            json=completion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Partial completion failed: {response.text}"
        data = response.json()
        assert data["completion"]["status"] == "partial"
        print(f"✓ Meal completion with partial status: PASS")

    # ── Test 7: Reminder completion with skipped status ──
    def test_reminder_completion_skipped_status(self):
        """Test reminder completion with 'skipped' status"""
        token = self.get_beneficiary_token()
        
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-reminders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        reminders = response.json()
        
        if not reminders:
            pytest.skip("No assigned reminders for today")
        
        reminder = reminders[0]
        assignment_id = reminder.get("id")
        
        # Complete with skipped status
        completion_data = {
            "status": "skipped",
            "pain_level": None,
            "patient_notes": "Forgot to take it"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pro/reminders/{assignment_id}/complete",
            json=completion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Skipped completion failed: {response.text}"
        data = response.json()
        assert data["completion"]["status"] == "skipped"
        print(f"✓ Reminder completion with skipped status: PASS")

    # ── Test 8: Completion without pain_level (optional field) ──
    def test_completion_without_pain_level(self):
        """Test that pain_level is optional in completion"""
        token = self.get_beneficiary_token()
        
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-meals",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        meals = response.json()
        
        if not meals:
            pytest.skip("No assigned meals for today")
        
        meal = meals[0]
        assignment_id = meal.get("id")
        
        # Complete without pain_level
        completion_data = {
            "status": "done",
            "patient_notes": "Completed without specifying pain"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/pro/meals/{assignment_id}/complete",
            json=completion_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Completion without pain_level failed: {response.text}"
        print(f"✓ Completion without pain_level (optional): PASS")


class TestAssignedMealDetail:
    """Test assigned meal detail endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_beneficiary_token(self):
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,
            "password": BENEFICIARY_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Beneficiary login failed: {response.status_code}")

    def test_assigned_meal_detail_endpoint(self):
        """Test GET /api/pro/assigned-meal-detail/{id}"""
        token = self.get_beneficiary_token()
        
        # Get today's meals
        response = self.session.get(
            f"{BASE_URL}/api/pro/beneficiary-today-meals",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        meals = response.json()
        
        if not meals:
            pytest.skip("No assigned meals for today")
        
        meal = meals[0]
        assignment_id = meal.get("id")
        
        # Get meal detail
        response = self.session.get(
            f"{BASE_URL}/api/pro/assigned-meal-detail/{assignment_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Failed to get meal detail: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "id" in data, "Response should have 'id'"
        assert "title" in data, "Response should have 'title'"
        assert "meal_type" in data, "Response should have 'meal_type'"
        
        print(f"✓ Assigned meal detail endpoint: PASS")
        print(f"  - Meal: {data.get('title')}")
        print(f"  - Type: {data.get('meal_type')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
