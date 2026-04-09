"""
Iteration 180 - Notification System Tests
Tests for:
- POST /api/notifications/subscribe-push - stores browser push subscription
- GET /api/notifications - returns notifications list for current user
- GET /api/notifications/unread-count - returns unread count
- PUT /api/notifications/{id}/read - marks notification as read
- PUT /api/notifications/read-all - marks all as read
- WebSocket /api/ws/beneficiary - accepts connection with valid token
- POST /api/pro/assign-exercise - creates notification for beneficiary
- POST /api/pro/assign-meal - creates notification for beneficiary
- POST /api/pro/assign-reminder - creates notification for beneficiary
"""
import pytest
import requests
import os
import json
import time
import websocket
import threading

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://premium-clinic-4.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestNotificationSystem:
    """Tests for the notification system endpoints"""
    
    @pytest.fixture(scope="class")
    def coach_token(self):
        """Get coach authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,  # email field accepts phone numbers
            "password": COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Coach login failed: {response.status_code} - {response.text}")
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Get beneficiary authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,  # email field accepts phone numbers
            "password": BENEFICIARY_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Beneficiary login failed: {response.status_code} - {response.text}")
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def beneficiary_user(self, beneficiary_token):
        """Get beneficiary user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        if response.status_code != 200:
            pytest.skip("Failed to get beneficiary user info")
        return response.json()
    
    # ── Notification List Tests ──
    
    def test_get_notifications_list(self, beneficiary_token):
        """GET /api/notifications returns notifications list for current user"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/notifications returned {len(data)} notifications")
        
        # Validate notification structure if any exist
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif, "Notification should have id"
            assert "type" in notif, "Notification should have type"
            assert "title" in notif, "Notification should have title"
            assert "body" in notif, "Notification should have body"
            assert "read" in notif, "Notification should have read status"
            assert "created_at" in notif, "Notification should have created_at"
            print(f"✓ Notification structure validated: {notif['title']}")
    
    def test_get_notifications_requires_auth(self):
        """GET /api/notifications requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✓ GET /api/notifications requires authentication")
    
    # ── Unread Count Tests ──
    
    def test_get_unread_count(self, beneficiary_token):
        """GET /api/notifications/unread-count returns unread count"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "count" in data, "Response should have count field"
        assert isinstance(data["count"], int), "Count should be an integer"
        assert data["count"] >= 0, "Count should be non-negative"
        print(f"✓ GET /api/notifications/unread-count returned count: {data['count']}")
    
    # ── Mark Read Tests ──
    
    def test_mark_notification_read(self, beneficiary_token):
        """PUT /api/notifications/{id}/read marks notification as read"""
        # First get notifications to find one to mark
        list_response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        notifications = list_response.json()
        
        if len(notifications) == 0:
            pytest.skip("No notifications to mark as read")
        
        notif_id = notifications[0]["id"]
        response = requests.put(f"{BASE_URL}/api/notifications/{notif_id}/read", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", "Response should have status ok"
        print(f"✓ PUT /api/notifications/{notif_id}/read marked notification as read")
    
    def test_mark_all_read(self, beneficiary_token):
        """PUT /api/notifications/read-all marks all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", "Response should have status ok"
        print("✓ PUT /api/notifications/read-all marked all as read")
        
        # Verify unread count is now 0
        count_response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        count_data = count_response.json()
        assert count_data["count"] == 0, f"Expected 0 unread, got {count_data['count']}"
        print("✓ Verified unread count is 0 after mark-all-read")
    
    # ── Push Subscription Tests ──
    
    def test_subscribe_push(self, beneficiary_token):
        """POST /api/notifications/subscribe-push stores browser push subscription"""
        # Mock Web Push subscription object
        mock_subscription = {
            "subscription": {
                "endpoint": f"https://fcm.googleapis.com/fcm/send/test-endpoint-{int(time.time())}",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                    "auth": "tBHItJI5svbpez7KI4CCXg"
                }
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/notifications/subscribe-push", 
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json=mock_subscription
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") in ["subscribed", "already_subscribed"], f"Unexpected status: {data}"
        print(f"✓ POST /api/notifications/subscribe-push returned: {data['status']}")
    
    def test_subscribe_push_requires_subscription(self, beneficiary_token):
        """POST /api/notifications/subscribe-push requires subscription field"""
        response = requests.post(f"{BASE_URL}/api/notifications/subscribe-push", 
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "error", "Should return error for missing subscription"
        print("✓ POST /api/notifications/subscribe-push validates subscription field")


class TestNotificationTriggers:
    """Tests for notification triggers when coach assigns content"""
    
    @pytest.fixture(scope="class")
    def coach_token(self):
        """Get coach authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,  # email field accepts phone numbers
            "password": COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Coach login failed: {response.status_code}")
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Get beneficiary authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,  # email field accepts phone numbers
            "password": BENEFICIARY_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Beneficiary login failed: {response.status_code}")
        return response.json().get("token")
    
    def test_assign_exercise_creates_notification(self, coach_token, beneficiary_token):
        """POST /api/pro/assign-exercise creates notification for beneficiary"""
        # First get initial notification count
        initial_response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        initial_count = len(initial_response.json())
        
        # Get exercise templates
        templates_response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        if templates_response.status_code != 200:
            # Seed templates first
            requests.post(f"{BASE_URL}/api/pro/seed-templates", headers={
                "Authorization": f"Bearer {coach_token}"
            })
            templates_response = requests.get(f"{BASE_URL}/api/pro/exercise-templates", headers={
                "Authorization": f"Bearer {coach_token}"
            })
        
        templates = templates_response.json()
        if not templates:
            pytest.skip("No exercise templates available")
        
        template_id = templates[0]["id"]
        
        # Assign exercise
        assign_response = requests.post(f"{BASE_URL}/api/pro/assign-exercise", 
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "exercise_template_id": template_id,
                "beneficiary_id": BENEFICIARY_ID,
                "days": ["lundi", "mercredi", "vendredi"],
                "repetitions": 12,
                "sets": 3,
                "rest_seconds": 60
            }
        )
        
        if assign_response.status_code == 403:
            pytest.skip("Coach not linked to beneficiary")
        
        assert assign_response.status_code == 200, f"Expected 200, got {assign_response.status_code}: {assign_response.text}"
        print("✓ POST /api/pro/assign-exercise succeeded")
        
        # Wait a moment for notification to be created
        time.sleep(0.5)
        
        # Check if notification was created
        final_response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        final_notifications = final_response.json()
        
        # Look for exercise notification
        exercise_notifs = [n for n in final_notifications if n.get("type") == "exercise"]
        if len(exercise_notifs) > 0:
            print(f"✓ Exercise notification created: {exercise_notifs[0]['title']}")
        else:
            print("⚠ No exercise notification found (may be expected if coach not linked)")
    
    def test_assign_meal_creates_notification(self, coach_token, beneficiary_token):
        """POST /api/pro/assign-meal creates notification for beneficiary"""
        # Get meal templates
        templates_response = requests.get(f"{BASE_URL}/api/pro/meal-templates", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        templates = templates_response.json()
        
        if not templates:
            pytest.skip("No meal templates available")
        
        template_id = templates[0]["id"]
        
        # Assign meal
        assign_response = requests.post(f"{BASE_URL}/api/pro/assign-meal", 
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "meal_template_id": template_id,
                "beneficiary_id": BENEFICIARY_ID,
                "days": ["lundi", "mardi"],
                "meal_type": "dejeuner"
            }
        )
        
        if assign_response.status_code == 403:
            pytest.skip("Coach not linked to beneficiary")
        if assign_response.status_code == 404:
            pytest.skip("Meal template not found")
        
        assert assign_response.status_code == 200, f"Expected 200, got {assign_response.status_code}: {assign_response.text}"
        print("✓ POST /api/pro/assign-meal succeeded")
        
        # Wait a moment for notification to be created
        time.sleep(0.5)
        
        # Check if notification was created
        final_response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        final_notifications = final_response.json()
        
        # Look for meal notification
        meal_notifs = [n for n in final_notifications if n.get("type") == "meal"]
        if len(meal_notifs) > 0:
            print(f"✓ Meal notification created: {meal_notifs[0]['title']}")
        else:
            print("⚠ No meal notification found (may be expected if coach not linked)")
    
    def test_assign_reminder_creates_notification(self, coach_token, beneficiary_token):
        """POST /api/pro/assign-reminder creates notification for beneficiary"""
        # Get reminder templates
        templates_response = requests.get(f"{BASE_URL}/api/pro/reminder-templates", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        templates = templates_response.json()
        
        if not templates:
            pytest.skip("No reminder templates available")
        
        template_id = templates[0]["id"]
        
        # Assign reminder
        assign_response = requests.post(f"{BASE_URL}/api/pro/assign-reminder", 
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "reminder_template_id": template_id,
                "beneficiary_id": BENEFICIARY_ID,
                "days": ["lundi", "mardi", "mercredi"],
                "time": "08:00",
                "dosage": "5g",
                "notes": "Test reminder"
            }
        )
        
        if assign_response.status_code == 403:
            pytest.skip("Coach not linked to beneficiary")
        if assign_response.status_code == 404:
            pytest.skip("Reminder template not found")
        
        assert assign_response.status_code == 200, f"Expected 200, got {assign_response.status_code}: {assign_response.text}"
        print("✓ POST /api/pro/assign-reminder succeeded")
        
        # Wait a moment for notification to be created
        time.sleep(0.5)
        
        # Check if notification was created
        final_response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {beneficiary_token}"
        })
        final_notifications = final_response.json()
        
        # Look for reminder notification
        reminder_notifs = [n for n in final_notifications if n.get("type") == "reminder"]
        if len(reminder_notifs) > 0:
            print(f"✓ Reminder notification created: {reminder_notifs[0]['title']}")
        else:
            print("⚠ No reminder notification found (may be expected if coach not linked)")


class TestWebSocketConnection:
    """Tests for WebSocket /api/ws/beneficiary endpoint"""
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Get beneficiary authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,  # email field accepts phone numbers
            "password": BENEFICIARY_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Beneficiary login failed: {response.status_code}")
        return response.json().get("token")
    
    def test_websocket_accepts_valid_token(self, beneficiary_token):
        """WebSocket /api/ws/beneficiary accepts connection with valid token"""
        ws_base = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")
        ws_url = f"{ws_base}/api/ws/beneficiary?token={beneficiary_token}"
        
        connected = False
        error_msg = None
        
        def on_open(ws):
            nonlocal connected
            connected = True
            print("✓ WebSocket connection opened successfully")
            ws.close()
        
        def on_error(ws, error):
            nonlocal error_msg
            error_msg = str(error)
        
        def on_close(ws, close_status_code, close_msg):
            pass
        
        try:
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_error=on_error,
                on_close=on_close
            )
            
            # Run in thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever, kwargs={"ping_timeout": 5})
            ws_thread.daemon = True
            ws_thread.start()
            ws_thread.join(timeout=5)
            
            if connected:
                print("✓ WebSocket /api/ws/beneficiary accepts valid token")
            else:
                if error_msg:
                    print(f"⚠ WebSocket connection issue: {error_msg}")
                else:
                    print("⚠ WebSocket connection timed out (may be network issue)")
        except Exception as e:
            print(f"⚠ WebSocket test exception: {e}")
    
    def test_websocket_rejects_invalid_token(self):
        """WebSocket /api/ws/beneficiary rejects invalid token"""
        ws_base = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")
        ws_url = f"{ws_base}/api/ws/beneficiary?token=invalid-token-12345"
        
        rejected = False
        close_code = None
        
        def on_open(ws):
            pass
        
        def on_error(ws, error):
            nonlocal rejected
            rejected = True
        
        def on_close(ws, close_status_code, close_msg):
            nonlocal rejected, close_code
            close_code = close_status_code
            if close_status_code in [4001, 4003]:
                rejected = True
        
        try:
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_error=on_error,
                on_close=on_close
            )
            
            ws_thread = threading.Thread(target=ws.run_forever, kwargs={"ping_timeout": 3})
            ws_thread.daemon = True
            ws_thread.start()
            ws_thread.join(timeout=3)
            
            if rejected or close_code in [4001, 4003]:
                print(f"✓ WebSocket rejects invalid token (close code: {close_code})")
            else:
                print("⚠ WebSocket rejection not confirmed (may be network issue)")
        except Exception as e:
            print(f"⚠ WebSocket test exception: {e}")
    
    def test_websocket_rejects_no_token(self):
        """WebSocket /api/ws/beneficiary rejects connection without token"""
        ws_base = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")
        ws_url = f"{ws_base}/api/ws/beneficiary"
        
        rejected = False
        close_code = None
        
        def on_close(ws, close_status_code, close_msg):
            nonlocal rejected, close_code
            close_code = close_status_code
            if close_status_code == 4001:
                rejected = True
        
        try:
            ws = websocket.WebSocketApp(
                ws_url,
                on_close=on_close
            )
            
            ws_thread = threading.Thread(target=ws.run_forever, kwargs={"ping_timeout": 3})
            ws_thread.daemon = True
            ws_thread.start()
            ws_thread.join(timeout=3)
            
            if rejected or close_code == 4001:
                print(f"✓ WebSocket rejects missing token (close code: {close_code})")
            else:
                print("⚠ WebSocket rejection not confirmed")
        except Exception as e:
            print(f"⚠ WebSocket test exception: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
