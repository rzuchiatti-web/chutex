"""
Test Suite for Iteration 39: Chat AI and Programs Features
Tests:
- Chat AI: POST /api/chat/message, GET /api/chat/history, DELETE /api/chat/clear
- Programs: GET /api/programs/catalog, POST /api/programs/start/{id}, GET /api/programs/active, POST /api/programs/checkin, POST /api/programs/stop
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nora-ai-coach.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "robert.martin@email.fr"
TEST_PHONE = "+33651245918"
TEST_PASSWORD = "demo123"


class TestChatAI:
    """Chat AI Endpoints Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_chat_message_returns_ai_response(self):
        """POST /api/chat/message should return AI response with health context"""
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            headers=self.headers,
            json={"message": "Bonjour, comment va ma sante aujourd'hui?"}
        )
        assert response.status_code == 200, f"Chat message failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should have an id"
        assert "content" in data, "Response should have content"
        assert "created_at" in data, "Response should have created_at"
        
        # Content should be non-empty
        assert len(data["content"]) > 0, "AI response content should not be empty"
        print(f"AI Response: {data['content'][:100]}...")
    
    def test_chat_history_returns_messages(self):
        """GET /api/chat/history should return list of messages"""
        response = requests.get(
            f"{BASE_URL}/api/chat/history",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get chat history failed: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list), "Chat history should be a list"
        
        # If there are messages, verify structure
        if len(data) > 0:
            msg = data[0]
            assert "id" in msg or "role" in msg, "Message should have id or role"
            assert "content" in msg, "Message should have content"
            assert "created_at" in msg, "Message should have created_at"
            print(f"Chat history has {len(data)} messages")
        else:
            print("Chat history is empty (expected if cleared)")
    
    def test_chat_clear_removes_history(self):
        """DELETE /api/chat/clear should clear all chat messages"""
        response = requests.delete(
            f"{BASE_URL}/api/chat/clear",
            headers=self.headers
        )
        assert response.status_code == 200, f"Clear chat failed: {response.text}"
        data = response.json()
        
        # Should return status
        assert data.get("status") == "cleared", "Should return status: cleared"
        
        # Verify history is empty after clear
        history_resp = requests.get(
            f"{BASE_URL}/api/chat/history",
            headers=self.headers
        )
        assert history_resp.status_code == 200
        history = history_resp.json()
        assert len(history) == 0, "Chat history should be empty after clear"
        print("Chat history cleared successfully")
    
    def test_chat_message_personalized_response(self):
        """Chat AI should give personalized response based on user health data"""
        # First clear history for clean test
        requests.delete(f"{BASE_URL}/api/chat/clear", headers=self.headers)
        
        # Ask about specific health context
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            headers=self.headers,
            json={"message": "Peux-tu me faire un bilan de ma tension?"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # AI should respond with content (personalized to user data)
        assert "content" in data
        assert len(data["content"]) > 10, "Response should be meaningful"
        print(f"Personalized response: {data['content'][:150]}...")
    
    def test_chat_message_empty_message_error(self):
        """POST /api/chat/message with empty message should return error"""
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            headers=self.headers,
            json={"message": ""}
        )
        assert response.status_code == 200  # API returns 200 with error message
        data = response.json()
        assert "error" in data, "Should return error for empty message"


class TestProgramsCatalog:
    """Programs Catalog and Enrollment Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        yield
        # Cleanup: Stop any active program after tests
        try:
            requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        except:
            pass
    
    def test_programs_catalog_returns_3_programs(self):
        """GET /api/programs/catalog should return 3 seeded programs"""
        response = requests.get(
            f"{BASE_URL}/api/programs/catalog",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get catalog failed: {response.text}"
        data = response.json()
        
        # Should have programs key
        assert "programs" in data, "Response should have programs key"
        programs = data["programs"]
        
        # Should have at least 3 programs
        assert len(programs) >= 3, f"Should have at least 3 programs, got {len(programs)}"
        
        # Verify program structure
        for prog in programs:
            assert "id" in prog, "Program should have id"
            assert "title" in prog, "Program should have title"
            assert "duration_days" in prog, "Program should have duration_days"
            assert "color" in prog, "Program should have color"
            assert "icon" in prog, "Program should have icon"
        
        # Check for specific programs
        prog_ids = [p["id"] for p in programs]
        assert "prog-sleep-21" in prog_ids, "Should have sleep program"
        assert "prog-tension-14" in prog_ids, "Should have tension program"
        assert "prog-activity-30" in prog_ids, "Should have activity program"
        
        print(f"Found {len(programs)} programs: {prog_ids}")
    
    def test_start_sleep_program(self):
        """POST /api/programs/start/prog-sleep-21 should start the sleep program"""
        # First stop any active program
        requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        
        response = requests.post(
            f"{BASE_URL}/api/programs/start/prog-sleep-21",
            headers=self.headers
        )
        assert response.status_code == 200, f"Start program failed: {response.text}"
        data = response.json()
        
        # Should return status and enrollment
        assert data.get("status") == "started", "Should return status: started"
        assert "enrollment" in data, "Should return enrollment"
        
        enrollment = data["enrollment"]
        assert enrollment["program_id"] == "prog-sleep-21"
        assert enrollment["status"] == "active"
        assert enrollment["current_day"] == 1
        print(f"Started program: {enrollment}")
    
    def test_active_program_returns_today_tasks(self):
        """GET /api/programs/active should return active program with today's tasks"""
        # First ensure we have an active program
        requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        start_resp = requests.post(
            f"{BASE_URL}/api/programs/start/prog-sleep-21",
            headers=self.headers
        )
        assert start_resp.status_code == 200
        
        # Now get active program
        response = requests.get(
            f"{BASE_URL}/api/programs/active",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get active program failed: {response.text}"
        data = response.json()
        
        # Should have active program
        assert data.get("active") == True, "Should have active program"
        assert "program" in data, "Should have program info"
        assert "current_day" in data, "Should have current_day"
        assert "today_tasks" in data, "Should have today_tasks"
        assert "progress_pct" in data, "Should have progress percentage"
        
        # Verify today's tasks structure
        tasks = data["today_tasks"]
        assert "focus" in tasks, "Today's tasks should have focus"
        assert "tasks" in tasks, "Today's tasks should have tasks list"
        
        print(f"Active program: Day {data['current_day']}, Focus: {tasks['focus']}")
    
    def test_program_checkin_with_ai_feedback(self):
        """POST /api/programs/checkin should submit check-in and return AI feedback"""
        # Ensure we have an active program
        requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        requests.post(f"{BASE_URL}/api/programs/start/prog-sleep-21", headers=self.headers)
        
        # Submit check-in
        response = requests.post(
            f"{BASE_URL}/api/programs/checkin",
            headers=self.headers,
            json={
                "mood": 4,
                "note": "J'ai bien dormi cette nuit!",
                "tasks_done": ["Choisis ton heure de coucher ideale", "Mets un rappel 30min avant"],
                "sleep_quality": 8
            }
        )
        assert response.status_code == 200, f"Checkin failed: {response.text}"
        data = response.json()
        
        # Should return status and feedback
        assert data.get("status") in ["created", "updated"], f"Status should be created or updated, got: {data.get('status')}"
        assert "feedback" in data, "Should return AI feedback"
        
        # Feedback should be non-empty
        feedback = data["feedback"]
        assert len(feedback) > 5, "Feedback should be meaningful"
        print(f"AI Feedback: {feedback}")
    
    def test_stop_active_program(self):
        """POST /api/programs/stop should stop the active program"""
        # Ensure we have an active program
        requests.post(f"{BASE_URL}/api/programs/start/prog-sleep-21", headers=self.headers)
        
        response = requests.post(
            f"{BASE_URL}/api/programs/stop",
            headers=self.headers
        )
        assert response.status_code == 200, f"Stop program failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "stopped", "Should return status: stopped"
        
        # Verify no active program
        active_resp = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert active_resp.status_code == 200
        active_data = active_resp.json()
        assert active_data.get("active") == False, "Should have no active program"
        print("Program stopped successfully")
    
    def test_cannot_start_second_program(self):
        """Starting a second program while one is active should fail"""
        # Stop any existing and start sleep program
        requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        requests.post(f"{BASE_URL}/api/programs/start/prog-sleep-21", headers=self.headers)
        
        # Try to start another program
        response = requests.post(
            f"{BASE_URL}/api/programs/start/prog-tension-14",
            headers=self.headers
        )
        assert response.status_code == 400, f"Should fail when starting second program: {response.text}"
        print("Correctly prevented starting second program")
    
    def test_checkin_without_active_program_fails(self):
        """POST /api/programs/checkin without active program should fail"""
        # Stop any active program
        requests.post(f"{BASE_URL}/api/programs/stop", headers=self.headers)
        
        response = requests.post(
            f"{BASE_URL}/api/programs/checkin",
            headers=self.headers,
            json={"mood": 3}
        )
        assert response.status_code == 404, f"Checkin without program should return 404: {response.text}"
        print("Correctly rejected check-in without active program")


class TestEndToEndChatFlow:
    """End-to-end chat flow test"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_full_chat_conversation_flow(self):
        """Test complete chat conversation: clear -> send -> history -> send -> history"""
        # 1. Clear history
        clear_resp = requests.delete(f"{BASE_URL}/api/chat/clear", headers=self.headers)
        assert clear_resp.status_code == 200
        
        # 2. Verify empty
        hist1 = requests.get(f"{BASE_URL}/api/chat/history", headers=self.headers).json()
        assert len(hist1) == 0, "History should be empty after clear"
        
        # 3. Send first message
        msg1_resp = requests.post(
            f"{BASE_URL}/api/chat/message",
            headers=self.headers,
            json={"message": "Bonjour!"}
        )
        assert msg1_resp.status_code == 200
        
        # Wait for AI response
        time.sleep(2)
        
        # 4. Check history has 2 messages (user + assistant)
        hist2 = requests.get(f"{BASE_URL}/api/chat/history", headers=self.headers).json()
        assert len(hist2) >= 2, f"Should have at least 2 messages after first exchange, got {len(hist2)}"
        
        # 5. Send follow-up message
        msg2_resp = requests.post(
            f"{BASE_URL}/api/chat/message",
            headers=self.headers,
            json={"message": "Comment ameliorer mon sommeil?"}
        )
        assert msg2_resp.status_code == 200
        
        # Wait for AI response
        time.sleep(2)
        
        # 6. Check history has 4 messages
        hist3 = requests.get(f"{BASE_URL}/api/chat/history", headers=self.headers).json()
        assert len(hist3) >= 4, f"Should have at least 4 messages after second exchange, got {len(hist3)}"
        
        print(f"Full conversation flow completed with {len(hist3)} messages")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
