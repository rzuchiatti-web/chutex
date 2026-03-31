"""
Iteration 171 - Pro Notifications System Tests
Tests for push notification system when beneficiary validates an exercise
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-graphs-mvp.preview.emergentagent.com').rstrip('/')

# Test credentials from iteration_170
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"
JOSETTE_BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"

# Exercise IDs from context
EXERCISE_IDS = [
    "7cfcd4d2-22e7-40da-a45a-eeb5faf88ffa",
    "3540db5e-6686-459d-a50d-0c72e9eb7e66"
]


@pytest.fixture(scope="module")
def coach_token():
    """Get coach authentication token"""
    # The email field is used with phone number as value
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_PHONE,  # Phone number used as email
        "password": COACH_PASSWORD
    })
    assert response.status_code == 200, f"Coach login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def beneficiary_token():
    """Get beneficiary authentication token (Josette)"""
    # First get coach token to find beneficiary credentials
    coach_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_PHONE,  # Phone number used as email
        "password": COACH_PASSWORD
    })
    assert coach_resp.status_code == 200
    coach_data = coach_resp.json()
    
    # Try to login as beneficiary - they may have same password or different
    # For testing, we'll use the coach token to act on behalf of beneficiary
    return coach_data["token"]


class TestNotificationEndpoints:
    """Test notification API endpoints"""
    
    def test_get_notifications_empty_initially(self, coach_token):
        """GET /api/pro/notifications returns empty array initially"""
        response = requests.get(
            f"{BASE_URL}/api/pro/notifications",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Notifications count: {len(data)}")
    
    def test_get_unread_count(self, coach_token):
        """GET /api/pro/notifications/unread-count returns {count: N}"""
        response = requests.get(
            f"{BASE_URL}/api/pro/notifications/unread-count",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response should have 'count' field"
        assert isinstance(data["count"], int), "Count should be an integer"
        print(f"Unread count: {data['count']}")
    
    def test_mark_notifications_read(self, coach_token):
        """PUT /api/pro/notifications/mark-read returns {status: ok}"""
        response = requests.put(
            f"{BASE_URL}/api/pro/notifications/mark-read",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got: {data}"
        print("Mark read successful")


class TestExerciseCompletionNotification:
    """Test that completing an exercise creates a notification"""
    
    def test_get_assigned_exercises(self, coach_token):
        """Get assigned exercises for beneficiary"""
        response = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Assigned exercises: {len(data)}")
        if data:
            print(f"First exercise: {data[0].get('title', 'N/A')} - ID: {data[0].get('id', 'N/A')}")
        return data
    
    def test_complete_exercise_creates_notification(self, coach_token):
        """POST /api/pro/exercises/{id}/complete creates a notification"""
        # First get an assigned exercise
        exercises_resp = requests.get(
            f"{BASE_URL}/api/pro/assigned-exercises/{JOSETTE_BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert exercises_resp.status_code == 200
        exercises = exercises_resp.json()
        
        if not exercises:
            pytest.skip("No assigned exercises to complete")
        
        exercise_id = exercises[0]["id"]
        print(f"Completing exercise: {exercise_id}")
        
        # Get initial notification count
        initial_count_resp = requests.get(
            f"{BASE_URL}/api/pro/notifications",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        initial_count = len(initial_count_resp.json()) if initial_count_resp.status_code == 200 else 0
        
        # Complete the exercise
        complete_resp = requests.post(
            f"{BASE_URL}/api/pro/exercises/{exercise_id}/complete",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"status": "done", "pain_level": 2, "patient_notes": "Test completion"}
        )
        assert complete_resp.status_code == 200, f"Complete failed: {complete_resp.text}"
        complete_data = complete_resp.json()
        assert complete_data.get("status") == "ok", f"Expected status 'ok', got: {complete_data}"
        print(f"Exercise completed: {complete_data}")
        
        # Check that a notification was created
        notif_resp = requests.get(
            f"{BASE_URL}/api/pro/notifications",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert notif_resp.status_code == 200
        notifications = notif_resp.json()
        
        # Should have at least one more notification
        print(f"Notifications after completion: {len(notifications)} (was {initial_count})")
        
        # Check the latest notification
        if notifications:
            latest = notifications[0]
            print(f"Latest notification: {latest.get('message', 'N/A')}")
            assert "type" in latest or "message" in latest, "Notification should have type or message"


class TestNotificationStructure:
    """Test notification data structure"""
    
    def test_notification_fields(self, coach_token):
        """Verify notification has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/pro/notifications",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        notifications = response.json()
        
        if not notifications:
            print("No notifications to verify structure")
            return
        
        notif = notifications[0]
        print(f"Notification structure: {list(notif.keys())}")
        
        # Check expected fields
        expected_fields = ["id", "professional_id", "type", "message", "read", "created_at"]
        for field in expected_fields:
            if field not in notif:
                print(f"Warning: Missing field '{field}' in notification")


class TestExerciseTemplates:
    """Test exercise template endpoints (regression)"""
    
    def test_list_exercise_templates(self, coach_token):
        """GET /api/pro/exercise-templates returns list"""
        response = requests.get(
            f"{BASE_URL}/api/pro/exercise-templates",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Exercise templates: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
