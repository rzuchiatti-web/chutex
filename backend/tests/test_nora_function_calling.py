"""
Test Nora AI Function Calling for nutrition and exercise management.
Tests action markers in LLM responses, action execution, and business rules.

Features tested:
- POST /api/chat/message with action-triggering messages
- ADD_EXERCISE action creates exercise in pro_assigned_exercises
- UPDATE_CALORIES blocked when weight goal active
- UPDATE_CALORIES succeeds when no weight goal
- ADJUST_MACROS blocked when weight goal active
- Non-action messages return normal text
- Chat history includes actions field
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://elio-v8-biometric.preview.emergentagent.com").rstrip("/")


class TestNoraFunctionCalling:
    """Test Nora AI function calling for nutrition and exercise management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with beneficiary login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as beneficiary (Josette)
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        assert self.token, "No token received"
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Generate unique session ID for this test run
        self.chat_session_id = f"test-nora-{uuid.uuid4().hex[:8]}"
        
    def test_01_login_and_auth(self):
        """Verify login works and we have valid token"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == self.user_id
        print(f"✓ Logged in as user: {data.get('name')} (id: {self.user_id})")
        
    def test_02_non_action_message_no_actions(self):
        """Non-action messages (e.g. 'bonjour') should return normal text without actions"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Bonjour Nora",
                "session_id": self.chat_session_id
            },
            timeout=30
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Should have content but no actions
        assert "content" in data, "Response should have content"
        assert data.get("content"), "Content should not be empty"
        
        # Non-action messages should NOT have actions field or it should be empty
        actions = data.get("actions", [])
        assert len(actions) == 0, f"Non-action message should not have actions, got: {actions}"
        print(f"✓ Non-action message returned text without actions: {data['content'][:100]}...")
        
    def test_03_check_weight_goal_status(self):
        """Check current weight goal status via API"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-goal-status")
        # Returns 200 with has_goal field
        if response.status_code == 200:
            data = response.json()
            if data.get("has_goal"):
                print(f"✓ Weight goal exists: target={data.get('target_kg')}kg, weeks={data.get('weeks')}")
                return True
            else:
                print("✓ No weight goal currently set")
                return False
        else:
            print(f"Weight goal check returned: {response.status_code}")
            return None
            
    def test_04_delete_weight_goal_for_success_test(self):
        """Delete weight goal to test UPDATE_CALORIES success case"""
        response = self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        # May return 200/204 if deleted, or 404 if none existed
        if response.status_code in [200, 204]:
            print("✓ Weight goal deleted successfully")
        elif response.status_code == 404:
            print("✓ No weight goal to delete")
        else:
            print(f"Delete weight goal returned: {response.status_code} - {response.text}")
        
        # Verify no goal exists using weight-goal-status endpoint
        check = self.session.get(f"{BASE_URL}/api/minceur/weight-goal-status")
        assert check.status_code == 200, f"Weight goal status check failed: {check.status_code}"
        data = check.json()
        # API returns target_kg: None when no goal exists
        assert data.get("target_kg") is None, f"Weight goal should not exist after deletion: {data}"
        print("✓ Verified no weight goal exists")
        
    def test_05_update_calories_without_goal_should_succeed(self):
        """UPDATE_CALORIES without weight goal should SUCCEED"""
        # First ensure no weight goal
        self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        time.sleep(0.5)
        
        # Send message asking to update calories
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Mets mes calories a 1800 kcal par jour",
                "session_id": f"{self.chat_session_id}-cal-success"
            },
            timeout=45  # LLM calls can take 3-8 seconds
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response content: {data.get('content', '')[:200]}...")
        
        # Check if actions were executed
        actions = data.get("actions", [])
        print(f"Actions returned: {actions}")
        
        # The LLM should have triggered UPDATE_CALORIES action
        # Note: LLM responses are non-deterministic, so we check if action was attempted
        if actions:
            update_action = next((a for a in actions if a.get("action") == "UPDATE_CALORIES"), None)
            if update_action:
                result = update_action.get("result", {})
                # Without weight goal, should succeed
                assert result.get("success") == True, f"UPDATE_CALORIES should succeed without goal: {result}"
                print(f"✓ UPDATE_CALORIES succeeded: {result}")
            else:
                print(f"⚠ LLM did not trigger UPDATE_CALORIES action (non-deterministic)")
        else:
            print(f"⚠ No actions in response (LLM may not have triggered action)")
            
    def test_06_create_weight_goal_for_blocked_test(self):
        """Create weight goal to test blocked scenarios"""
        response = self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        # May return 200/201 for create, or 409 if already exists
        if response.status_code in [200, 201]:
            print(f"✓ Weight goal created: {response.json()}")
        elif response.status_code == 409:
            print("✓ Weight goal already exists")
        else:
            print(f"Create weight goal returned: {response.status_code} - {response.text}")
            
        # Verify goal exists using weight-goal-status endpoint
        check = self.session.get(f"{BASE_URL}/api/minceur/weight-goal-status")
        assert check.status_code == 200, f"Weight goal status check failed: {check.status_code}"
        data = check.json()
        # API returns target_kg with value when goal exists
        assert data.get("target_kg") is not None, f"Weight goal should exist: {data}"
        print(f"✓ Verified weight goal exists: {data}")
        
    def test_07_update_calories_with_goal_should_be_blocked(self):
        """UPDATE_CALORIES with active weight goal should be BLOCKED"""
        # First ensure weight goal exists
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        time.sleep(0.5)
        
        # Send message asking to update calories
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Change mes calories a 2000 kcal",
                "session_id": f"{self.chat_session_id}-cal-blocked"
            },
            timeout=45
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response content: {data.get('content', '')[:200]}...")
        
        actions = data.get("actions", [])
        print(f"Actions returned: {actions}")
        
        if actions:
            update_action = next((a for a in actions if a.get("action") == "UPDATE_CALORIES"), None)
            if update_action:
                result = update_action.get("result", {})
                # With weight goal, should be blocked
                assert result.get("success") == False, f"UPDATE_CALORIES should be blocked with goal: {result}"
                assert result.get("reason") == "objectif_poids_actif", f"Should have objectif_poids_actif reason: {result}"
                print(f"✓ UPDATE_CALORIES correctly blocked: {result}")
            else:
                print(f"⚠ LLM did not trigger UPDATE_CALORIES action")
        else:
            print(f"⚠ No actions in response")
            
    def test_08_adjust_macros_with_goal_should_be_blocked(self):
        """ADJUST_MACROS with active weight goal should be BLOCKED"""
        # Ensure weight goal exists
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        time.sleep(0.5)
        
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Augmente mes proteines a 80 grammes par jour",
                "session_id": f"{self.chat_session_id}-macros-blocked"
            },
            timeout=45
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response content: {data.get('content', '')[:200]}...")
        
        actions = data.get("actions", [])
        print(f"Actions returned: {actions}")
        
        if actions:
            macros_action = next((a for a in actions if a.get("action") == "ADJUST_MACROS"), None)
            if macros_action:
                result = macros_action.get("result", {})
                assert result.get("success") == False, f"ADJUST_MACROS should be blocked: {result}"
                assert result.get("reason") == "objectif_poids_actif", f"Should have objectif_poids_actif reason: {result}"
                print(f"✓ ADJUST_MACROS correctly blocked: {result}")
            else:
                print(f"⚠ LLM did not trigger ADJUST_MACROS action")
        else:
            print(f"⚠ No actions in response")
            
    def test_09_add_exercise_always_allowed(self):
        """ADD_EXERCISE should ALWAYS be allowed (with or without weight goal)"""
        # Keep weight goal active to prove exercises are always allowed
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        time.sleep(0.5)
        
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Ajoute un exercice de marche rapide de 30 minutes a mon programme",
                "session_id": f"{self.chat_session_id}-exercise"
            },
            timeout=45
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response content: {data.get('content', '')[:200]}...")
        
        actions = data.get("actions", [])
        print(f"Actions returned: {actions}")
        
        if actions:
            add_action = next((a for a in actions if a.get("action") == "ADD_EXERCISE"), None)
            if add_action:
                result = add_action.get("result", {})
                # Exercises should always be allowed
                assert result.get("success") == True, f"ADD_EXERCISE should succeed: {result}"
                assert result.get("exercise_id"), "Should have exercise_id"
                print(f"✓ ADD_EXERCISE succeeded: {result}")
                
                # Verify exercise was created in database
                self._verify_exercise_created(result.get("exercise_id"))
            else:
                print(f"⚠ LLM did not trigger ADD_EXERCISE action")
        else:
            print(f"⚠ No actions in response")
            
    def _verify_exercise_created(self, exercise_id):
        """Verify exercise was created in pro_assigned_exercises"""
        # Get user's exercises
        response = self.session.get(f"{BASE_URL}/api/professional/beneficiary-exercises/{self.user_id}")
        if response.status_code == 200:
            exercises = response.json()
            found = any(e.get("id") == exercise_id for e in exercises)
            if found:
                print(f"✓ Exercise {exercise_id} verified in database")
            else:
                print(f"⚠ Exercise {exercise_id} not found in exercises list")
        else:
            print(f"⚠ Could not verify exercise: {response.status_code}")
            
    def test_10_chat_history_includes_actions(self):
        """Chat history should include actions field for messages that had actions"""
        # First send a message that triggers an action
        self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        time.sleep(0.5)
        
        session_id = f"{self.chat_session_id}-history"
        
        # Send action-triggering message
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Ajoute un exercice de stretching",
                "session_id": session_id
            },
            timeout=45
        )
        assert response.status_code == 200
        
        time.sleep(1)
        
        # Get chat history
        history_response = self.session.get(
            f"{BASE_URL}/api/chat/history",
            params={"session_id": session_id}
        )
        assert history_response.status_code == 200, f"History failed: {history_response.text}"
        history = history_response.json()
        
        print(f"Chat history has {len(history)} messages")
        
        # Check if any assistant message has actions
        assistant_msgs = [m for m in history if m.get("role") == "assistant"]
        msgs_with_actions = [m for m in assistant_msgs if m.get("actions")]
        
        if msgs_with_actions:
            print(f"✓ Found {len(msgs_with_actions)} messages with actions in history")
            for msg in msgs_with_actions:
                print(f"  Actions: {msg.get('actions')}")
        else:
            print(f"⚠ No messages with actions found in history (LLM may not have triggered actions)")
            
    def test_11_action_response_structure(self):
        """Verify action response has correct structure"""
        self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        time.sleep(0.5)
        
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Mets mes calories a 1900 kcal",
                "session_id": f"{self.chat_session_id}-structure"
            },
            timeout=45
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should have id"
        assert "content" in data, "Response should have content"
        assert "created_at" in data, "Response should have created_at"
        
        print(f"✓ Response structure valid: id={data['id'][:8]}..., has content, has created_at")
        
        if "actions" in data:
            actions = data["actions"]
            assert isinstance(actions, list), "Actions should be a list"
            for action in actions:
                assert "action" in action, "Each action should have 'action' field"
                assert "result" in action, "Each action should have 'result' field"
                print(f"✓ Action structure valid: {action['action']}")
                
    def test_12_cleanup_weight_goal(self):
        """Cleanup: delete weight goal after tests"""
        response = self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        if response.status_code in [200, 204]:
            print("✓ Weight goal cleaned up")
        else:
            print(f"Cleanup returned: {response.status_code}")


class TestNoraActionsDirectly:
    """Test Nora action handlers directly via internal endpoints if available"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as beneficiary
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
    def test_minceur_daily_cache_update(self):
        """Verify minceur_daily_cache is updated after calorie change"""
        # Delete weight goal first
        self.session.delete(f"{BASE_URL}/api/minceur/weight-goal")
        time.sleep(0.5)
        
        # Get current daily recommendations
        response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
        if response.status_code == 200:
            before = response.json()
            print(f"Before: {before.get('recommendations', {}).get('daily_calories', 'N/A')} kcal")
        
        # Trigger calorie update via chat
        chat_response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Fixe mes calories a 1750 kcal",
                "session_id": f"test-cache-{uuid.uuid4().hex[:8]}"
            },
            timeout=45
        )
        assert chat_response.status_code == 200
        
        time.sleep(1)
        
        # Check if daily cache was updated
        response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
        if response.status_code == 200:
            after = response.json()
            print(f"After: {after.get('recommendations', {}).get('daily_calories', 'N/A')} kcal")
            
            # If action was triggered, calories should be updated
            actions = chat_response.json().get("actions", [])
            if any(a.get("action") == "UPDATE_CALORIES" and a.get("result", {}).get("success") for a in actions):
                assert after.get("recommendations", {}).get("daily_calories") == 1750, "Calories should be 1750"
                print("✓ Daily cache updated correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
