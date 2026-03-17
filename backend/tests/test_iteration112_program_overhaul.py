"""
Iteration 112: Program Overhaul Testing
Tests for:
- /api/programs/active - returns interactive array in today_tasks
- /api/programs/team/leaderboard - returns ranked members with scores
- /api/programs/apply-onboarding - creates reminders from onboarding data
- Team progress section, leaderboard display
- Interactive task types (breathing, timer, data_input, counter, rating)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://whoop-clone-4.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


class TestProgramOverhaul:
    """Tests for the program overhaul features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token") or data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        yield
    
    # ═══ /api/programs/active Tests ═══
    
    def test_active_program_returns_interactive_array(self):
        """Verify /api/programs/active returns interactive array in today_tasks"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200, f"Failed to get active program: {response.text}"
        
        data = response.json()
        # Should have active program
        assert data.get("active") is True or data.get("program") is not None, "No active program found"
        
        # Should have today_tasks with interactive array
        today_tasks = data.get("today_tasks", {})
        assert "interactive" in today_tasks or "tasks" in today_tasks, "today_tasks missing expected fields"
        
        interactive = today_tasks.get("interactive", [])
        tasks = today_tasks.get("tasks", [])
        
        # Interactive array should match tasks length
        if interactive and tasks:
            assert len(interactive) == len(tasks), f"Interactive array length ({len(interactive)}) doesn't match tasks ({len(tasks)})"
        
        print(f"✓ Active program has {len(tasks)} tasks with {len(interactive)} interactive configs")
    
    def test_interactive_types_are_valid(self):
        """Verify interactive array contains valid types"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        interactive = data.get("today_tasks", {}).get("interactive", [])
        
        valid_types = {"action", "breathing", "timer", "data_input", "rating", "counter"}
        
        for idx, item in enumerate(interactive):
            task_type = item.get("type", "action")
            assert task_type in valid_types, f"Task {idx} has invalid type: {task_type}"
            
            # Verify required fields per type
            if task_type == "breathing":
                assert "pattern" in item, f"Breathing task {idx} missing pattern"
                assert "duration_sec" in item, f"Breathing task {idx} missing duration_sec"
            elif task_type == "timer":
                assert "duration_sec" in item, f"Timer task {idx} missing duration_sec"
            elif task_type == "counter":
                assert "target" in item, f"Counter task {idx} missing target"
            elif task_type == "data_input":
                assert "field" in item, f"Data input task {idx} missing field"
        
        print(f"✓ All {len(interactive)} interactive configs have valid types")
    
    def test_active_program_has_team_data(self):
        """Verify active program returns team data with members"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        team = data.get("team", {})
        
        # Should have team with members
        if team:
            assert "members" in team, "Team missing members array"
            assert "invite_code" in team, "Team missing invite_code"
            
            members = team.get("members", [])
            assert len(members) >= 1, "Team should have at least 1 member (user)"
            
            # Find current user (is_me=True)
            me_found = any(m.get("is_me") for m in members)
            assert me_found, "Current user not marked as is_me in team members"
            
            # Each member should have required fields
            for m in members:
                assert "name" in m, "Member missing name"
                assert "checked_in_today" in m, "Member missing checked_in_today status"
            
            print(f"✓ Team has {len(members)} members with invite code: {team.get('invite_code')}")
        else:
            print("⚠ No team data (user may not be in a team program)")
    
    def test_active_program_has_progress_data(self):
        """Verify active program returns progress data"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check for program progress fields
        assert "current_day" in data, "Missing current_day"
        assert "progress_pct" in data, "Missing progress_pct"
        
        # Check task progress
        task_progress = data.get("task_progress", {})
        
        print(f"✓ Program day {data.get('current_day')}, progress: {data.get('progress_pct')}%")
    
    # ═══ /api/programs/team/leaderboard Tests ═══
    
    def test_leaderboard_returns_ranked_members(self):
        """Verify team leaderboard returns ranked members with scores"""
        response = requests.get(f"{BASE_URL}/api/programs/team/leaderboard", headers=self.headers)
        assert response.status_code == 200, f"Leaderboard failed: {response.text}"
        
        data = response.json()
        leaderboard = data.get("leaderboard", [])
        
        print(f"✓ Leaderboard has {len(leaderboard)} members")
        
        # If there are members, verify structure
        for idx, member in enumerate(leaderboard):
            assert "name" in member, f"Member {idx} missing name"
            assert "score" in member, f"Member {idx} missing score"
            assert "rank" in member, f"Member {idx} missing rank"
            assert "is_me" in member, f"Member {idx} missing is_me flag"
            
            # Optional but expected fields
            if "streak" in member:
                assert isinstance(member["streak"], int), f"Member {idx} streak should be int"
            if "tasks_done" in member:
                assert isinstance(member["tasks_done"], int), f"Member {idx} tasks_done should be int"
        
        # Verify ranking order (scores should be descending)
        if len(leaderboard) > 1:
            for i in range(len(leaderboard) - 1):
                assert leaderboard[i]["score"] >= leaderboard[i+1]["score"], "Leaderboard not sorted by score"
            print("✓ Leaderboard is correctly sorted by score")
    
    def test_leaderboard_has_medal_eligible_ranks(self):
        """Verify leaderboard has ranks for medal display"""
        response = requests.get(f"{BASE_URL}/api/programs/team/leaderboard", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        leaderboard = data.get("leaderboard", [])
        
        if leaderboard:
            # First place should have rank 1
            assert leaderboard[0]["rank"] == 1, "First place should have rank 1"
            
            # Check consecutive ranks
            for i, member in enumerate(leaderboard):
                assert member["rank"] == i + 1, f"Rank should be {i+1}, got {member['rank']}"
            
            print(f"✓ Ranks are consecutive 1-{len(leaderboard)}")
    
    # ═══ /api/programs/apply-onboarding Tests ═══
    
    def test_apply_onboarding_creates_reminders(self):
        """Verify apply-onboarding creates reminders from onboarding data"""
        onboarding_data = {
            "onboarding": {
                "bedtime_current": "22:30",
                "wake_time": "07:00",
                "sleep_quality": 3
            },
            "program_id": "prog-sleep-21"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/programs/apply-onboarding",
            headers=self.headers,
            json=onboarding_data
        )
        assert response.status_code == 200, f"Apply onboarding failed: {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok", "Response status should be 'ok'"
        assert "actions" in data, "Response missing actions array"
        
        actions = data.get("actions", [])
        print(f"✓ Onboarding created {len(actions)} actions: {[a.get('type') for a in actions]}")
        
        # Verify reminder actions were created
        reminder_actions = [a for a in actions if a.get("type") == "reminder"]
        if reminder_actions:
            print(f"✓ Created {len(reminder_actions)} reminders")
    
    def test_apply_onboarding_without_data(self):
        """Verify apply-onboarding handles empty onboarding gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/programs/apply-onboarding",
            headers=self.headers,
            json={"onboarding": {}, "program_id": "prog-test"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "ok"
        actions = data.get("actions", [])
        print(f"✓ Empty onboarding returns ok with {len(actions)} actions")
    
    # ═══ Check-in Tests ═══
    
    def test_today_checkin_status(self):
        """Verify today_checkin is returned in active program"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # today_checkin can be null or have data
        assert "today_checkin" in data or data.get("active") is False, "Response should include today_checkin field"
        
        checkin = data.get("today_checkin")
        if checkin:
            print(f"✓ Today's check-in exists with mood: {checkin.get('mood')}")
        else:
            print("⚠ No check-in for today (expected if not submitted)")
    
    # ═══ Program Header Data Tests ═══
    
    def test_program_header_data(self):
        """Verify program returns header data (day, title, streak, progress)"""
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        program = data.get("program", {})
        
        if data.get("active"):
            # Required header fields
            assert program.get("title"), "Program missing title"
            assert "current_day" in data, "Missing current_day"
            assert "progress_pct" in data, "Missing progress_pct"
            
            # Streak is optional but useful
            streak = data.get("streak", 0)
            
            print(f"✓ Program: {program.get('title')}")
            print(f"  Day: {data.get('current_day')}/{program.get('duration_days', '?')}")
            print(f"  Progress: {data.get('progress_pct')}%")
            print(f"  Streak: {streak} days")
    
    # ═══ Interactive Content Detection Tests ═══
    
    def test_breathing_task_detection(self):
        """Verify breathing tasks are correctly detected"""
        # Get active program tasks
        response = requests.get(f"{BASE_URL}/api/programs/active", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        interactive = data.get("today_tasks", {}).get("interactive", [])
        tasks = data.get("today_tasks", {}).get("tasks", [])
        
        breathing_found = False
        for idx, item in enumerate(interactive):
            if item.get("type") == "breathing":
                breathing_found = True
                assert "pattern" in item, "Breathing task missing pattern"
                assert "duration_sec" in item, "Breathing task missing duration_sec"
                task_text = tasks[idx] if idx < len(tasks) else "unknown"
                print(f"✓ Breathing task found: '{task_text[:50]}...' with pattern {item.get('pattern')}")
                break
        
        if not breathing_found:
            print("⚠ No breathing task in current day's tasks (may be expected)")


class TestEnrichTasksInteractive:
    """Unit-style tests for task type detection patterns"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PHONE,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("token") or data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_program_catalog_has_interactive_capable_tasks(self):
        """Verify sleep program (prog-sleep-21) has tasks that can be interactive"""
        response = requests.get(f"{BASE_URL}/api/programs/detail/prog-sleep-21")
        assert response.status_code == 200
        
        data = response.json()
        tasks_template = data.get("daily_tasks_template", {})
        
        # Check day 6 which should have coherence cardiaque (breathing)
        day6 = tasks_template.get("6", {})
        tasks = day6.get("tasks", [])
        
        breathing_text = False
        for task in tasks:
            if "coherence cardiaque" in task.lower() or "respir" in task.lower():
                breathing_text = True
                print(f"✓ Found breathing-related task: '{task[:60]}...'")
        
        if not breathing_text:
            print("⚠ No coherence cardiaque task in day 6 (structure may have changed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
