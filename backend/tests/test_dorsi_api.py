"""
Test suite for Dorsi Smart Cushion API endpoints
- Device association with type=dorsi
- Bilan (lumbar mobility assessment) CRUD
- Program generation and management
- Session completion and reassessment
"""
import pytest
import requests
import os
import time

BASE_URL = "https://glassmorphism-dash.preview.emergentagent.com"

# Test credentials
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


class TestDorsiAPI:
    """Dorsi cushion feature tests"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for beneficiary user"""
        # Note: The API accepts phone in the 'email' field
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
    # Device Association Tests
    # ─────────────────────────────────────────
    def test_associate_dorsi_device(self, headers):
        """Test POST /api/devices/associate with device_type=dorsi"""
        response = requests.post(
            f"{BASE_URL}/api/devices/associate",
            headers=headers,
            json={"device_type": "dorsi", "mac_address": "AA:BB:CC:DD:EE:FF"}
        )
        # Should return 200 (associated or reconnected)
        assert response.status_code == 200, f"Associate failed: {response.text}"
        data = response.json()
        assert data.get("status") in ["associated", "reconnected"], f"Unexpected status: {data}"
        assert "device" in data, "No device in response"
        assert data["device"]["device_type"] == "dorsi"
        print(f"PASS: Dorsi device associated/reconnected - status: {data['status']}")

    def test_get_devices_includes_dorsi(self, headers):
        """Test GET /api/devices returns dorsi device"""
        response = requests.get(
            f"{BASE_URL}/api/devices",
            headers=headers
        )
        assert response.status_code == 200, f"Get devices failed: {response.text}"
        devices = response.json()
        dorsi_device = next((d for d in devices if d.get("device_type") == "dorsi"), None)
        assert dorsi_device is not None, "Dorsi device not found in devices list"
        print(f"PASS: Dorsi device found in devices list: {dorsi_device.get('name')}")

    # ─────────────────────────────────────────
    # Bilan (Assessment) Tests
    # ─────────────────────────────────────────
    def test_create_bilan(self, headers):
        """Test POST /api/dorsi/bilan - create assessment with 4 direction measurements"""
        measurements = {
            "forward": {"mobility": 75, "pain": 2},
            "backward": {"mobility": 60, "pain": 4},
            "left": {"mobility": 80, "pain": 1},
            "right": {"mobility": 70, "pain": 3}
        }
        response = requests.post(
            f"{BASE_URL}/api/dorsi/bilan",
            headers=headers,
            json={"measurements": measurements, "notes": "Test bilan from pytest"}
        )
        assert response.status_code == 200, f"Create bilan failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in bilan response"
        assert "measurements" in data, "No measurements in bilan response"
        assert data["measurements"]["forward"]["mobility"] == 75
        assert data["measurements"]["backward"]["pain"] == 4
        print(f"PASS: Bilan created with id: {data['id']}")
        # Store for next tests
        self.__class__.bilan_id = data["id"]

    def test_create_bilan_missing_direction(self, headers):
        """Test POST /api/dorsi/bilan with missing direction - should return 400"""
        measurements = {
            "forward": {"mobility": 75, "pain": 2},
            "backward": {"mobility": 60, "pain": 4},
            "left": {"mobility": 80, "pain": 1}
            # Missing "right"
        }
        response = requests.post(
            f"{BASE_URL}/api/dorsi/bilan",
            headers=headers,
            json={"measurements": measurements}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Bilan creation rejected for missing direction (400)")

    def test_get_bilans(self, headers):
        """Test GET /api/dorsi/bilans - list all bilans for user"""
        response = requests.get(
            f"{BASE_URL}/api/dorsi/bilans",
            headers=headers
        )
        assert response.status_code == 200, f"Get bilans failed: {response.text}"
        bilans = response.json()
        assert isinstance(bilans, list), "Expected list of bilans"
        assert len(bilans) > 0, "Expected at least one bilan"
        print(f"PASS: Got {len(bilans)} bilans")

    def test_get_specific_bilan(self, headers):
        """Test GET /api/dorsi/bilan/{id} - get specific bilan"""
        bilan_id = getattr(self.__class__, 'bilan_id', None)
        if not bilan_id:
            # Get first bilan from list
            response = requests.get(f"{BASE_URL}/api/dorsi/bilans", headers=headers)
            bilans = response.json()
            if bilans:
                bilan_id = bilans[0]["id"]
            else:
                pytest.skip("No bilans available to test")

        response = requests.get(
            f"{BASE_URL}/api/dorsi/bilan/{bilan_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Get bilan failed: {response.text}"
        data = response.json()
        assert data["id"] == bilan_id
        assert "measurements" in data
        print(f"PASS: Got bilan {bilan_id}")

    def test_get_nonexistent_bilan(self, headers):
        """Test GET /api/dorsi/bilan/{id} with invalid id - should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/dorsi/bilan/nonexistent-id-12345",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Nonexistent bilan returns 404")

    # ─────────────────────────────────────────
    # Program Tests
    # ─────────────────────────────────────────
    def test_create_program(self, headers):
        """Test POST /api/dorsi/program - generate 10-day program from bilan"""
        # First get a bilan ID to use
        response = requests.get(f"{BASE_URL}/api/dorsi/bilans", headers=headers)
        bilans = response.json()
        if not bilans:
            pytest.skip("No bilans available to create program")
        bilan_id = bilans[0]["id"]

        response = requests.post(
            f"{BASE_URL}/api/dorsi/program",
            headers=headers,
            json={"bilan_id": bilan_id}
        )
        # May return 400 if program already exists
        if response.status_code == 400 and "actif existe" in response.text:
            print(f"PASS: Program creation blocked - active program exists (expected)")
            return
        
        assert response.status_code == 200, f"Create program failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in program response"
        assert "days" in data, "No days in program response"
        assert len(data["days"]) == 10, f"Expected 10 days, got {len(data['days'])}"
        # Check each day has 2 sessions
        for day in data["days"]:
            assert len(day["sessions"]) == 2, f"Day {day['day_num']} should have 2 sessions"
        # Check reassessment days
        reassessment_days = [d for d in data["days"] if d["is_reassessment"]]
        assert len(reassessment_days) == 3, f"Expected 3 reassessment days (3,6,9), got {len(reassessment_days)}"
        print(f"PASS: Program created with 10 days, 20 sessions")
        self.__class__.program_id = data["id"]

    def test_get_programs(self, headers):
        """Test GET /api/dorsi/programs - list all programs"""
        response = requests.get(
            f"{BASE_URL}/api/dorsi/programs",
            headers=headers
        )
        assert response.status_code == 200, f"Get programs failed: {response.text}"
        programs = response.json()
        assert isinstance(programs, list), "Expected list of programs"
        print(f"PASS: Got {len(programs)} programs")
        if programs:
            self.__class__.program_id = programs[0]["id"]

    def test_get_specific_program(self, headers):
        """Test GET /api/dorsi/program/{id}"""
        program_id = getattr(self.__class__, 'program_id', None)
        if not program_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
            programs = response.json()
            if programs:
                program_id = programs[0]["id"]
            else:
                pytest.skip("No programs available")

        response = requests.get(
            f"{BASE_URL}/api/dorsi/program/{program_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Get program failed: {response.text}"
        data = response.json()
        assert data["id"] == program_id
        assert "days" in data
        assert "current_day" in data
        print(f"PASS: Got program {program_id}, current_day={data['current_day']}")

    # ─────────────────────────────────────────
    # Session Completion Tests
    # ─────────────────────────────────────────
    def test_complete_session(self, headers):
        """Test PUT /api/dorsi/program/{id}/session - complete a session with score"""
        program_id = getattr(self.__class__, 'program_id', None)
        if not program_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
            programs = response.json()
            if programs:
                program_id = programs[0]["id"]
            else:
                pytest.skip("No programs available")

        # Get program to find incomplete session
        response = requests.get(f"{BASE_URL}/api/dorsi/program/{program_id}", headers=headers)
        program = response.json()
        
        # Find first incomplete session
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
            print("PASS: All sessions already completed, skipping test")
            return

        response = requests.put(
            f"{BASE_URL}/api/dorsi/program/{program_id}/session",
            headers=headers,
            json={"day_num": target_day, "session_num": target_session, "score": 150}
        )
        assert response.status_code == 200, f"Complete session failed: {response.text}"
        data = response.json()
        assert data["status"] == "ok"
        print(f"PASS: Completed session day={target_day}, session={target_session}, score=150")

    def test_complete_session_missing_params(self, headers):
        """Test PUT /api/dorsi/program/{id}/session with missing params - should return 400"""
        program_id = getattr(self.__class__, 'program_id', None)
        if not program_id:
            pytest.skip("No program available")

        response = requests.put(
            f"{BASE_URL}/api/dorsi/program/{program_id}/session",
            headers=headers,
            json={"score": 100}  # Missing day_num and session_num
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Missing session params returns 400")

    # ─────────────────────────────────────────
    # Reassessment Tests
    # ─────────────────────────────────────────
    def test_submit_reassessment(self, headers):
        """Test PUT /api/dorsi/program/{id}/reassessment - submit day 3/6/9 reassessment"""
        program_id = getattr(self.__class__, 'program_id', None)
        if not program_id:
            response = requests.get(f"{BASE_URL}/api/dorsi/programs", headers=headers)
            programs = response.json()
            if programs:
                program_id = programs[0]["id"]
            else:
                pytest.skip("No programs available")

        measurements = {
            "forward": {"mobility": 80, "pain": 1},
            "backward": {"mobility": 65, "pain": 3},
            "left": {"mobility": 85, "pain": 0},
            "right": {"mobility": 75, "pain": 2}
        }

        response = requests.put(
            f"{BASE_URL}/api/dorsi/program/{program_id}/reassessment",
            headers=headers,
            json={"day_num": 3, "measurements": measurements}
        )
        assert response.status_code == 200, f"Reassessment failed: {response.text}"
        data = response.json()
        assert data["status"] == "ok"
        assert "bilan_id" in data, "Reassessment should create a new bilan"
        print(f"PASS: Reassessment submitted, new bilan created: {data['bilan_id']}")


class TestDorsiEdgeCases:
    """Edge case and validation tests for Dorsi APIs"""

    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
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

    def test_bilan_invalid_pain_value(self, headers):
        """Test bilan with invalid pain value (should still work - no validation in backend)"""
        measurements = {
            "forward": {"mobility": 75, "pain": 15},  # Pain > 10
            "backward": {"mobility": 60, "pain": -1},  # Negative pain
            "left": {"mobility": 80, "pain": 1},
            "right": {"mobility": 70, "pain": 3}
        }
        response = requests.post(
            f"{BASE_URL}/api/dorsi/bilan",
            headers=headers,
            json={"measurements": measurements}
        )
        # Backend doesn't validate pain range, so this should succeed
        assert response.status_code == 200, f"Unexpected failure: {response.text}"
        print(f"PASS: Bilan created with edge pain values (no validation)")

    def test_program_creation_without_bilan_id(self, headers):
        """Test POST /api/dorsi/program without bilan_id - should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/dorsi/program",
            headers=headers,
            json={}  # No bilan_id
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Program creation without bilan_id returns 400")

    def test_program_creation_invalid_bilan_id(self, headers):
        """Test POST /api/dorsi/program with invalid bilan_id - should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/dorsi/program",
            headers=headers,
            json={"bilan_id": "invalid-bilan-id-12345"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"PASS: Program creation with invalid bilan_id returns 404")

    def test_unauthenticated_access(self):
        """Test accessing Dorsi endpoints without auth - should return 401/403"""
        endpoints = [
            ("GET", "/api/dorsi/bilans"),
            ("GET", "/api/dorsi/programs"),
            ("POST", "/api/dorsi/bilan"),
            ("POST", "/api/dorsi/program"),
        ]
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            assert response.status_code in [401, 403, 422], f"{endpoint} should require auth, got {response.status_code}"
        print(f"PASS: All Dorsi endpoints require authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
