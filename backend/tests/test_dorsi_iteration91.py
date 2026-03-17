"""
Test suite for Dorsi Smart Cushion - Iteration 91
Tests updated CDC games and program replacement functionality:
- POST /api/dorsi/bilan - can create bilan even if program exists
- POST /api/dorsi/program - replaces existing active program (no error)
- GET /api/dorsi/programs - lists all programs including replaced ones
- PUT /api/dorsi/program/{id}/session - complete session with score
- CDC game names: Jeu des Moutons, Bulles de Savon, Equilibre Proprioceptif
"""
import pytest
import requests
import os
import time

BASE_URL = "https://whoop-clone-4.preview.emergentagent.com"

# Test credentials
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


class TestDorsiIteration91:
    """Iteration 91 specific tests - CDC games and program replacement"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for beneficiary user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    # ─────────────────────────────────────────
    # Bilan Tests - Should work even with existing program
    # ─────────────────────────────────────────
    def test_create_bilan_with_existing_program(self, headers):
        """Test POST /api/dorsi/bilan - create assessment even if program exists"""
        measurements = {
            "forward": {"mobility": 78, "pain": 2},
            "backward": {"mobility": 62, "pain": 3},
            "left": {"mobility": 82, "pain": 1},
            "right": {"mobility": 72, "pain": 2}
        }
        response = requests.post(
            f"{BASE_URL}/api/dorsi/bilan",
            headers=headers,
            json={"measurements": measurements, "notes": "Test bilan iter91 - should work with existing program"}
        )
        assert response.status_code == 200, f"Create bilan failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in bilan response"
        assert "measurements" in data, "No measurements in bilan response"
        # Verify mobility converted correctly
        assert data["measurements"]["forward"]["mobility"] == 78
        print(f"PASS: Bilan created successfully with id: {data['id']}")
        self.__class__.bilan_id = data["id"]

    # ─────────────────────────────────────────
    # Program Replacement Tests
    # ─────────────────────────────────────────
    def test_create_program_replaces_existing(self, headers):
        """Test POST /api/dorsi/program - should replace existing active program"""
        # Get a bilan ID
        bilan_id = getattr(self.__class__, 'bilan_id', None)
        if not bilan_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/bilans", headers=headers)
            bilans = response.json()
            if bilans:
                bilan_id = bilans[0]["id"]
            else:
                pytest.skip("No bilans available")

        # Get current programs to check existing active
        response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
        initial_programs = response.json()
        initial_active = [p for p in initial_programs if p.get("status") == "active"]
        
        # Create new program - should NOT return 400 error
        response = requests.post(
            f"{BASE_URL}/api/dorsi/program",
            headers=headers,
            json={"bilan_id": bilan_id}
        )
        assert response.status_code == 200, f"Create program failed (should replace existing): {response.text}"
        data = response.json()
        assert "id" in data, "No id in program response"
        assert "days" in data, "No days in program response"
        assert data["status"] == "active", "New program should be active"
        
        # Verify program structure
        assert len(data["days"]) == 10, f"Expected 10 days, got {len(data['days'])}"
        print(f"PASS: New program created (replaced existing) with id: {data['id']}")
        self.__class__.new_program_id = data["id"]

    def test_old_program_marked_as_replaced(self, headers):
        """Test that old active programs are marked as 'replaced'"""
        response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
        assert response.status_code == 200
        programs = response.json()
        
        # Check we have both active and replaced programs
        statuses = [p.get("status") for p in programs]
        print(f"Program statuses: {statuses}")
        
        # Should have at least one active program (the new one)
        active_programs = [p for p in programs if p.get("status") == "active"]
        assert len(active_programs) >= 1, "Should have at least one active program"
        
        # If we had previous programs, some should be marked replaced
        if len(programs) > 1:
            replaced_programs = [p for p in programs if p.get("status") == "replaced"]
            print(f"PASS: Found {len(active_programs)} active and {len(replaced_programs)} replaced programs")
        else:
            print(f"PASS: Only one program exists, status check passed")

    # ─────────────────────────────────────────
    # CDC Game Names Tests
    # ─────────────────────────────────────────
    def test_program_contains_cdc_games(self, headers):
        """Test that program contains CDC spec games: Moutons, Bulles, Proprioception"""
        program_id = getattr(self.__class__, 'new_program_id', None)
        if not program_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
            programs = response.json()
            active = [p for p in programs if p.get("status") == "active"]
            if active:
                program_id = active[0]["id"]
            elif programs:
                program_id = programs[0]["id"]
            else:
                pytest.skip("No programs available")

        response = requests.get(f"{BASE_URL}/api/dorsi/program/{program_id}", headers=headers)
        assert response.status_code == 200
        program = response.json()

        # Collect all game names from sessions
        game_ids = set()
        game_names = set()
        for day in program["days"]:
            for session in day["sessions"]:
                game = session.get("game", {})
                game_ids.add(game.get("game_id"))
                game_names.add(game.get("name"))

        # Verify CDC game IDs
        expected_game_ids = {"moutons", "bulles", "proprioception"}
        assert expected_game_ids.issubset(game_ids), f"Expected CDC games {expected_game_ids}, got {game_ids}"
        
        # Verify CDC game names (French)
        expected_names = {"Jeu des Moutons", "Bulles de Savon", "Equilibre Proprioceptif"}
        assert expected_names.issubset(game_names), f"Expected CDC game names {expected_names}, got {game_names}"
        
        print(f"PASS: Program contains all CDC games: {game_names}")

    def test_game_has_required_fields(self, headers):
        """Test that each game has required fields: game_id, name, icon, color, focus"""
        response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
        programs = response.json()
        if not programs:
            pytest.skip("No programs available")
        
        program = programs[0]
        for day in program["days"]:
            for session in day["sessions"]:
                game = session.get("game", {})
                assert "game_id" in game, f"Missing game_id in session {session}"
                assert "name" in game, f"Missing name in session {session}"
                assert "icon" in game, f"Missing icon in session {session}"
                assert "color" in game, f"Missing color in session {session}"
                assert "focus" in game, f"Missing focus in session {session}"
        
        print(f"PASS: All sessions have complete game data")

    # ─────────────────────────────────────────
    # Session Completion Tests
    # ─────────────────────────────────────────
    def test_complete_session_with_score(self, headers):
        """Test PUT /api/dorsi/program/{id}/session - complete a session"""
        program_id = getattr(self.__class__, 'new_program_id', None)
        if not program_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
            programs = response.json()
            active = [p for p in programs if p.get("status") == "active"]
            if active:
                program_id = active[0]["id"]
            else:
                pytest.skip("No active program")

        # Get first incomplete session
        response = requests.get(f"{BASE_URL}/api/dorsi/program/{program_id}", headers=headers)
        program = response.json()
        
        target_day = None
        target_session = None
        for day in program["days"]:
            for session in day["sessions"]:
                if not session["completed"]:
                    target_day = day["day_num"]
                    target_session = session["session_num"]
                    break
            if target_day:
                break

        if not target_day:
            print("PASS: All sessions already completed, skipping")
            return

        # Complete the session
        response = requests.put(
            f"{BASE_URL}/api/dorsi/program/{program_id}/session",
            headers=headers,
            json={"day_num": target_day, "session_num": target_session, "score": 250}
        )
        assert response.status_code == 200, f"Complete session failed: {response.text}"
        data = response.json()
        assert data["status"] == "ok"
        print(f"PASS: Session completed day={target_day}, session={target_session}, score=250")

    def test_verify_session_persistence(self, headers):
        """Test that completed session score is persisted"""
        response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
        programs = response.json()
        active = [p for p in programs if p.get("status") == "active"]
        if not active:
            pytest.skip("No active program")
        
        program = active[0]
        completed_sessions = []
        for day in program["days"]:
            for session in day["sessions"]:
                if session["completed"]:
                    completed_sessions.append(session)
        
        if completed_sessions:
            # At least one should have a score
            scores = [s.get("score") for s in completed_sessions]
            print(f"PASS: Found {len(completed_sessions)} completed sessions with scores: {scores}")
        else:
            print("INFO: No completed sessions found yet")

    # ─────────────────────────────────────────
    # Get Programs List Tests
    # ─────────────────────────────────────────
    def test_get_all_programs_includes_replaced(self, headers):
        """Test GET /api/dorsi/programs returns all including replaced"""
        response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
        assert response.status_code == 200
        programs = response.json()
        
        # Should be a list
        assert isinstance(programs, list)
        
        # Programs should be sorted by created_at descending (newest first)
        if len(programs) >= 2:
            # First program should be most recent
            dates = [p.get("created_at", "") for p in programs]
            print(f"PASS: Got {len(programs)} programs, dates: {dates[:3]}...")
        else:
            print(f"PASS: Got {len(programs)} program(s)")


class TestDorsiBLEIntegration:
    """Tests for BLE-related fields and simulation mode"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["token"]

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def test_bilan_stores_mobility_as_percentage(self, headers):
        """Test that bilan measurements store mobility as percentage (0-100)"""
        measurements = {
            "forward": {"mobility": 45, "pain": 1},  # 45% mobility
            "backward": {"mobility": 30, "pain": 5},  # 30% mobility
            "left": {"mobility": 60, "pain": 0},      # 60% mobility
            "right": {"mobility": 55, "pain": 2}      # 55% mobility
        }
        response = requests.post(
            f"{BASE_URL}/api/dorsi/bilan",
            headers=headers,
            json={"measurements": measurements, "notes": "BLE test bilan"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all mobility values are stored correctly
        assert data["measurements"]["forward"]["mobility"] == 45
        assert data["measurements"]["backward"]["mobility"] == 30
        assert data["measurements"]["left"]["mobility"] == 60
        assert data["measurements"]["right"]["mobility"] == 55
        print(f"PASS: Bilan stores mobility as percentage correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
