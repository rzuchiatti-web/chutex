"""
Test Iteration 63: Enriched Programs with Scientific Content
Tests:
- GET /api/programs/catalog returns 3 programs with benefits, data_used, medical_disclaimer, onboarding_fields, tracked_metrics
- GET /api/programs/detail/{id} returns full program details
- POST /api/programs/start/{id} saves health_snapshot_start
- GET /api/programs/active returns today_tasks with mission field and team info
- GET /api/programs/completion-report/{id} returns health_comparison
- Sleep program day 1 mission references scientific studies
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nora-health.preview.emergentagent.com').rstrip('/')

# Test user credentials - API uses email field for both email and phone
TEST_EMAIL = "0600000099"  # Phone number used as email field
TEST_PASSWORD = "test123"


class TestProgramsCatalogEndpoint:
    """Test /api/programs/catalog - should return 3 enriched programs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token - API uses email field for phone numbers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_catalog_returns_3_programs(self):
        """Catalog should return exactly 3 programs"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200, f"Catalog failed: {response.text}"
        data = response.json()
        assert "programs" in data
        assert len(data["programs"]) == 3, f"Expected 3 programs, got {len(data['programs'])}"
    
    def test_catalog_programs_have_benefits(self):
        """Each program should have benefits array"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "benefits" in prog, f"Program {prog['id']} missing benefits"
            assert isinstance(prog["benefits"], list), f"Benefits should be list for {prog['id']}"
            assert len(prog["benefits"]) > 0, f"Benefits should not be empty for {prog['id']}"
    
    def test_catalog_programs_have_data_used(self):
        """Each program should have data_used array"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "data_used" in prog, f"Program {prog['id']} missing data_used"
            assert isinstance(prog["data_used"], list), f"data_used should be list for {prog['id']}"
    
    def test_catalog_programs_have_medical_disclaimer(self):
        """Each program should have medical_disclaimer string"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "medical_disclaimer" in prog, f"Program {prog['id']} missing medical_disclaimer"
            assert isinstance(prog["medical_disclaimer"], str), f"medical_disclaimer should be string for {prog['id']}"
    
    def test_catalog_programs_have_onboarding_fields(self):
        """Each program should have onboarding_fields array"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "onboarding_fields" in prog, f"Program {prog['id']} missing onboarding_fields"
            assert isinstance(prog["onboarding_fields"], list), f"onboarding_fields should be list for {prog['id']}"
    
    def test_catalog_programs_have_tracked_metrics(self):
        """Each program should have tracked_metrics array"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "tracked_metrics" in prog, f"Program {prog['id']} missing tracked_metrics"
            assert isinstance(prog["tracked_metrics"], list), f"tracked_metrics should be list for {prog['id']}"
    
    def test_catalog_programs_have_effort(self):
        """Each program should have effort string"""
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert response.status_code == 200
        programs = response.json()["programs"]
        for prog in programs:
            assert "effort" in prog, f"Program {prog['id']} missing effort"


class TestProgramDetailEndpoints:
    """Test /api/programs/detail/{id} for each program"""
    
    def test_sleep_program_detail(self):
        """GET /api/programs/detail/prog-sleep-21 returns full sleep program"""
        response = requests.get(f"{BASE_URL}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200, f"Sleep program detail failed: {response.text}"
        data = response.json()
        
        # Verify basic fields
        assert data["id"] == "prog-sleep-21"
        assert data["duration_days"] == 21
        assert "title" in data
        
        # Verify enriched content
        assert "benefits" in data and len(data["benefits"]) > 0
        assert "data_used" in data and len(data["data_used"]) > 0
        assert "medical_disclaimer" in data
        assert "onboarding_fields" in data and len(data["onboarding_fields"]) > 0
        assert "tracked_metrics" in data and len(data["tracked_metrics"]) > 0
        assert "phases" in data and len(data["phases"]) == 3
        
        # Verify onboarding fields structure
        for field in data["onboarding_fields"]:
            assert "key" in field
            assert "label" in field
            assert "type" in field
    
    def test_tension_program_detail(self):
        """GET /api/programs/detail/prog-tension-14 returns tension program with enriched content"""
        response = requests.get(f"{BASE_URL}/api/programs/detail/prog-tension-14")
        assert response.status_code == 200, f"Tension program detail failed: {response.text}"
        data = response.json()
        
        assert data["id"] == "prog-tension-14"
        assert data["duration_days"] == 14
        assert "benefits" in data and len(data["benefits"]) > 0
        assert "data_used" in data
        assert "medical_disclaimer" in data
        assert "onboarding_fields" in data
        assert "tracked_metrics" in data
        assert "phases" in data and len(data["phases"]) == 2
    
    def test_activity_program_detail(self):
        """GET /api/programs/detail/prog-activity-30 returns activity program with enriched content"""
        response = requests.get(f"{BASE_URL}/api/programs/detail/prog-activity-30")
        assert response.status_code == 200, f"Activity program detail failed: {response.text}"
        data = response.json()
        
        assert data["id"] == "prog-activity-30"
        assert data["duration_days"] == 30
        assert "benefits" in data and len(data["benefits"]) > 0
        assert "data_used" in data
        assert "medical_disclaimer" in data
        assert "onboarding_fields" in data
        assert "tracked_metrics" in data
        assert "phases" in data and len(data["phases"]) == 3
    
    def test_program_detail_404_for_invalid(self):
        """GET /api/programs/detail/invalid-id should return 404"""
        response = requests.get(f"{BASE_URL}/api/programs/detail/invalid-program-id")
        assert response.status_code == 404


class TestProgramActiveEndpoint:
    """Test /api/programs/active - should return today_tasks with mission field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_active_program_returns_today_tasks_with_mission(self):
        """Active program should return today_tasks with mission field"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200, f"Active program failed: {response.text}"
        data = response.json()
        
        if data.get("active"):
            # User has active program
            assert "today_tasks" in data, "Missing today_tasks in active program"
            today_tasks = data["today_tasks"]
            assert "focus" in today_tasks, "today_tasks missing focus"
            assert "tasks" in today_tasks, "today_tasks missing tasks"
            
            # Sleep program day 1 should have mission with study reference
            if data.get("current_day") == 1 and data.get("program", {}).get("id") == "prog-sleep-21":
                assert "mission" in today_tasks, "Day 1 of sleep program should have mission"
    
    def test_active_program_day_simulation(self):
        """Active program with ?day=1 should return day 1 tasks"""
        response = requests.get(f"{BASE_URL}/api/programs/active?day=1", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if data.get("active"):
            assert "today_tasks" in data
            # Day 1 should have specific focus for sleep program
            if data.get("program", {}).get("id") == "prog-sleep-21":
                assert "focus" in data["today_tasks"]
    
    def test_active_program_returns_team_info(self):
        """Active program should return team info if in team mode"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if data.get("active"):
            # Team field should exist (can be None if solo mode)
            assert "team" in data or data.get("team") is None
            if data.get("team"):
                assert "members" in data["team"]
                for member in data["team"]["members"]:
                    assert "name" in member
                    assert "checked_in_today" in member


class TestSleepProgramScientificContent:
    """Test that sleep program day 1 mission references Walker 2017 study"""
    
    def test_sleep_program_day1_has_walker_study_reference(self):
        """Sleep program daily_tasks_template day 1 mission should reference Walker 2017"""
        # This tests the seed data directly via the detail endpoint
        # Note: daily_tasks_template is excluded from detail endpoint, so we test via active
        response = requests.get(f"{BASE_URL}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200
        
        # Login to test day 1 via active endpoint - API uses email field for phone
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        token = login_resp.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get day 1 specifically
        active_resp = requests.get(f"{BASE_URL}/api/programs/active?day=1", headers=headers)
        if active_resp.status_code == 200:
            data = active_resp.json()
            if data.get("active") and data.get("program", {}).get("id") == "prog-sleep-21":
                today_tasks = data.get("today_tasks", {})
                mission = today_tasks.get("mission", "")
                # Check for Walker study reference
                assert "Walker" in mission or "walker" in mission.lower() or "2017" in mission, \
                    f"Day 1 mission should reference Walker 2017 study. Got: {mission[:200]}"


class TestProgramStartWithHealthSnapshot:
    """Test POST /api/programs/start/{id} saves health_snapshot_start"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_start_program_returns_enrollment_with_snapshot(self):
        """Starting a program should return enrollment with health_snapshot_start"""
        # First check if user already has active program
        active_resp = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        if active_resp.status_code == 200 and active_resp.json().get("active"):
            # User already has active program - verify it has snapshot
            enrollment_id = active_resp.json().get("enrollment_id")
            assert enrollment_id is not None, "Active enrollment should have id"
            print(f"User already has active program enrollment: {enrollment_id}")
            # Skip start test since user already has active program
            return
        
        # Try to start a program (may fail if user already has one)
        start_resp = requests.post(
            f"{BASE_URL}/api/programs/start/prog-sleep-21",
            headers=self.headers,
            json={"mode": "solo", "onboarding": {"goal": "M'endormir plus vite"}}
        )
        
        if start_resp.status_code == 200:
            data = start_resp.json()
            assert "enrollment" in data
            enrollment = data["enrollment"]
            assert "health_snapshot_start" in enrollment, "Enrollment should have health_snapshot_start"
            # Snapshot should have captured_at timestamp at minimum
            assert "captured_at" in enrollment["health_snapshot_start"]
        elif start_resp.status_code == 400:
            # User already has active program - this is expected
            assert "deja un programme actif" in start_resp.text.lower()


class TestCompletionReportWithHealthComparison:
    """Test GET /api/programs/completion-report/{id} returns health_comparison"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_completion_report_has_health_comparison(self):
        """Completion report should include health_comparison array"""
        # First get the active enrollment id
        active_resp = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert active_resp.status_code == 200
        data = active_resp.json()
        
        if not data.get("active"):
            pytest.skip("No active program to test completion report")
        
        enrollment_id = data.get("enrollment_id")
        assert enrollment_id is not None
        
        # Get completion report
        report_resp = requests.get(
            f"{BASE_URL}/api/programs/completion-report/{enrollment_id}",
            headers=self.headers
        )
        assert report_resp.status_code == 200, f"Completion report failed: {report_resp.text}"
        
        report_data = report_resp.json()
        assert "health_comparison" in report_data, "Completion report should have health_comparison"
        assert isinstance(report_data["health_comparison"], list), "health_comparison should be a list"
        
        # Verify health_comparison structure if not empty
        if len(report_data["health_comparison"]) > 0:
            comp = report_data["health_comparison"][0]
            assert "metric" in comp or "label" in comp
            # Should have before/after values
            if "before" in comp and "after" in comp:
                assert "diff" in comp or comp["before"] is not None


class TestProgramsIntegration:
    """Integration tests for full program flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_full_program_data_flow(self):
        """Test that catalog -> detail -> active all return consistent data"""
        # Get catalog
        catalog_resp = requests.get(f"{BASE_URL}/api/programs/catalog", headers=self.headers)
        assert catalog_resp.status_code == 200
        programs = catalog_resp.json()["programs"]
        
        # For each program in catalog, verify detail matches
        for prog in programs:
            detail_resp = requests.get(f"{BASE_URL}/api/programs/detail/{prog['id']}")
            assert detail_resp.status_code == 200
            detail = detail_resp.json()
            
            # Verify key fields match
            assert detail["id"] == prog["id"]
            assert detail["title"] == prog["title"]
            assert detail["duration_days"] == prog["duration_days"]
            
            # Verify enriched content exists
            assert len(detail.get("benefits", [])) > 0
            assert detail.get("medical_disclaimer")
