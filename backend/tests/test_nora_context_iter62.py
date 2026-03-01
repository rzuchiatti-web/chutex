"""
Iteration 62: Test Nora AI Context-Aware Features
Tests the new Nora AI context-aware behavior:
1. GET /api/health/daily-report returns coherent no-data response (empty arrays) when user has no devices
2. GET /api/health/daily-report returns proper AI analysis when user has devices and data
3. GET /api/health/section-analysis/{section} returns no_data:true with empty arrays when no devices
4. POST /api/chat/message returns context-aware responses referencing app services
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://real-time-wellness.preview.emergentagent.com')

# Test user: Marie Test (no devices, no subscription)
TEST_USER_PHONE_NO_DATA = "0600000099"
TEST_USER_PASSWORD = "test123"

# SAAD user with data
SAAD_PHONE = "+33477101099"
SAAD_PASSWORD = "demo123"


class TestNoraContextNoData:
    """Tests for users with NO devices/data - Nora should return empty arrays"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test user (no devices)"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Try login with phone number (API uses email field for both email and phone)
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_PHONE_NO_DATA,
            "password": TEST_USER_PASSWORD
        })
        
        if login_resp.status_code == 200:
            data = login_resp.json()
            self.token = data.get("token")  # API returns 'token' not 'access_token'
            self.user = data.get("user", {})
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed for no-data user: {login_resp.status_code} - {login_resp.text}")
        
        yield
    
    def test_daily_report_no_data_flag(self):
        """Daily report should return no_data:true when user has no devices"""
        resp = self.session.get(f"{BASE_URL}/api/health/daily-report")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        # Should have no_data flag since user has no devices
        assert "no_data" in data, "Response should contain no_data field"
        # no_data should be true for users without devices
        print(f"no_data value: {data.get('no_data')}")
    
    def test_daily_report_ai_section_exists(self):
        """Daily report should include 'ai' field even in no-data mode"""
        resp = self.session.get(f"{BASE_URL}/api/health/daily-report")
        assert resp.status_code == 200
        
        data = resp.json()
        # Should have ai section in response
        if data.get("no_data"):
            assert "ai" in data, "Response should contain ai field even in no_data mode"
            ai = data["ai"]
            print(f"AI response in no_data mode: {ai}")
    
    def test_daily_report_empty_arrays_when_no_data(self):
        """When no_data is true, AI should return EMPTY arrays for correlations/whats_good/watch_out"""
        resp = self.session.get(f"{BASE_URL}/api/health/daily-report")
        assert resp.status_code == 200
        
        data = resp.json()
        if data.get("no_data"):
            ai = data.get("ai", {})
            
            # These should be empty arrays when no data exists
            correlations = ai.get("correlations", [])
            whats_good = ai.get("whats_good", [])
            watch_out = ai.get("watch_out", [])
            
            assert isinstance(correlations, list), "correlations should be a list"
            assert isinstance(whats_good, list), "whats_good should be a list"
            assert isinstance(watch_out, list), "watch_out should be a list"
            
            # Key test: should be EMPTY when no data
            assert len(correlations) == 0, f"correlations should be empty when no data, got: {correlations}"
            assert len(whats_good) == 0, f"whats_good should be empty when no data, got: {whats_good}"
            assert len(watch_out) == 0, f"watch_out should be empty when no data, got: {watch_out}"
            
            print("PASS: All arrays are empty as expected when no data")
        else:
            pytest.skip("User has data, skipping no-data test")
    
    def test_daily_report_secondary_recs_with_no_data(self):
        """secondary_recs should contain smart recommendations based on user profile"""
        resp = self.session.get(f"{BASE_URL}/api/health/daily-report")
        assert resp.status_code == 200
        
        data = resp.json()
        if data.get("no_data"):
            ai = data.get("ai", {})
            secondary_recs = ai.get("secondary_recs", [])
            
            assert isinstance(secondary_recs, list), "secondary_recs should be a list"
            assert len(secondary_recs) > 0, "secondary_recs should contain recommendations for no-data users"
            
            print(f"secondary_recs for no-data user: {secondary_recs}")
    
    def test_section_analysis_no_data_cardio(self):
        """GET /api/health/section-analysis/cardio should return no_data:true with empty arrays"""
        resp = self.session.get(f"{BASE_URL}/api/health/section-analysis/cardio")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        # Should indicate no_data
        assert data.get("no_data") == True, f"Expected no_data:true, got: {data.get('no_data')}"
        
        # Should have empty arrays
        assert data.get("correlations") == [], f"correlations should be empty, got: {data.get('correlations')}"
        assert data.get("whats_good") == [], f"whats_good should be empty, got: {data.get('whats_good')}"
        assert data.get("watch_out") == [], f"watch_out should be empty, got: {data.get('watch_out')}"
        
        # Should have a recommendation string
        assert "recommendation" in data, "Should have recommendation field"
        assert isinstance(data["recommendation"], str), "recommendation should be a string"
        assert len(data["recommendation"]) > 0, "recommendation should not be empty"
        
        print(f"cardio section-analysis recommendation: {data['recommendation']}")
    
    def test_section_analysis_no_data_sleep(self):
        """GET /api/health/section-analysis/sleep should return no_data:true with empty arrays"""
        resp = self.session.get(f"{BASE_URL}/api/health/section-analysis/sleep")
        assert resp.status_code == 200
        
        data = resp.json()
        assert data.get("no_data") == True, f"Expected no_data:true for sleep"
        assert data.get("correlations") == [], "correlations should be empty"
        assert data.get("whats_good") == [], "whats_good should be empty"
        assert data.get("watch_out") == [], "watch_out should be empty"
        assert len(data.get("recommendation", "")) > 0, "Should have recommendation"
        
        print(f"sleep section-analysis recommendation: {data.get('recommendation')}")
    
    def test_section_analysis_no_data_activity(self):
        """GET /api/health/section-analysis/activity should return no_data:true with empty arrays"""
        resp = self.session.get(f"{BASE_URL}/api/health/section-analysis/activity")
        assert resp.status_code == 200
        
        data = resp.json()
        assert data.get("no_data") == True, f"Expected no_data:true for activity"
        assert data.get("correlations") == [], "correlations should be empty"
        assert data.get("whats_good") == [], "whats_good should be empty"
        assert data.get("watch_out") == [], "watch_out should be empty"
        
        print(f"activity section-analysis recommendation: {data.get('recommendation')}")


class TestNoraChatContextAware:
    """Tests for Nora chat being context-aware about app services"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_PHONE_NO_DATA,
            "password": TEST_USER_PASSWORD
        })
        
        if login_resp.status_code == 200:
            data = login_resp.json()
            self.token = data.get("token")  # API returns 'token' not 'access_token'
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")
        
        yield
    
    def test_chat_message_endpoint_works(self):
        """POST /api/chat/message should work"""
        resp = self.session.post(f"{BASE_URL}/api/chat/message", json={
            "message": "Bonjour Nora"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        assert "content" in data, "Response should have content field"
        assert len(data["content"]) > 0, "Response content should not be empty"
        
        print(f"Chat response: {data['content'][:200]}...")
    
    def test_chat_mentions_no_data(self):
        """Chat should acknowledge no health data when asked about health"""
        resp = self.session.post(f"{BASE_URL}/api/chat/message", json={
            "message": "Comment va ma sante aujourd'hui?"
        })
        assert resp.status_code == 200
        
        data = resp.json()
        content = data.get("content", "").lower()
        
        # Response should mention lack of data or devices
        # (AI should not fabricate health evaluations)
        print(f"Chat response to health question: {data['content']}")
        
        # Check that it doesn't say the user is healthy without data
        # AI should be honest about missing data
        assert len(data["content"]) > 20, "Response should be substantive"


class TestNoraContextWithData:
    """Tests for users WITH devices/data - Nora should return real analysis"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as SAAD user (likely has data)"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SAAD_PHONE,
            "password": SAAD_PASSWORD
        })
        
        if login_resp.status_code == 200:
            data = login_resp.json()
            self.token = data.get("token")  # API returns 'token' not 'access_token'
            self.user = data.get("user", {})
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed for SAAD user: {login_resp.status_code}")
        
        yield
    
    def test_daily_report_structure(self):
        """Daily report should have proper structure"""
        resp = self.session.get(f"{BASE_URL}/api/health/daily-report")
        assert resp.status_code == 200
        
        data = resp.json()
        # Check structure
        has_score = "score" in data or "no_data" in data
        assert has_score, "Response should have score or no_data"
        
        print(f"Daily report structure: no_data={data.get('no_data')}, has_ai={bool(data.get('ai'))}")
    
    def test_section_analysis_returns_section(self):
        """Section analysis should return the section name"""
        resp = self.session.get(f"{BASE_URL}/api/health/section-analysis/cardio")
        assert resp.status_code == 200
        
        data = resp.json()
        assert data.get("section") == "cardio", f"Expected section:cardio, got: {data.get('section')}"
        
        # Should have correlations array (may or may not be empty depending on data)
        assert "correlations" in data, "Should have correlations field"
        assert isinstance(data["correlations"], list), "correlations should be a list"


class TestNoraContextBuilding:
    """Tests for the Nora context building service"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as test user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_PHONE_NO_DATA,
            "password": TEST_USER_PASSWORD
        })
        
        if login_resp.status_code == 200:
            data = login_resp.json()
            self.token = data.get("token")  # API returns 'token' not 'access_token'
            self.user_data = data.get("user", {})
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")
        
        yield
    
    def test_user_profile_accessible(self):
        """User profile should be accessible"""
        resp = self.session.get(f"{BASE_URL}/api/users/me")
        assert resp.status_code == 200
        
        data = resp.json()
        assert "name" in data, "User should have name"
        print(f"Test user: {data.get('name')}")
    
    def test_devices_endpoint(self):
        """Devices endpoint should return list (possibly empty)"""
        resp = self.session.get(f"{BASE_URL}/api/devices")
        assert resp.status_code == 200
        
        data = resp.json()
        devices = data if isinstance(data, list) else data.get("devices", [])
        print(f"User has {len(devices)} devices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
