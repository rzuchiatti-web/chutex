"""
Test suite for Professional (Coach Sport / Kiné) routes
Tests: /api/pro/* endpoints for dashboard, beneficiaries, programs, sessions
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://chutex-premium.preview.emergentagent.com').rstrip('/')

# Test credentials
PRO_PHONE = "+33655443322"
PRO_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"
GUARDIAN_PHONE = "+33612345678"
GUARDIAN_PASSWORD = "test123"


class TestProfessionalAuth:
    """Test professional login and authentication"""
    
    def test_pro_login_success(self):
        """Professional can login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_PHONE,
            "password": PRO_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        # Verify role is professional
        user = data["user"]
        effective_role = user.get("active_role") or user.get("role")
        assert effective_role == "professional", f"Expected professional role, got {effective_role}"
        print(f"✓ Professional login successful, role: {effective_role}")


@pytest.fixture
def pro_token():
    """Get authentication token for professional user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRO_PHONE,
        "password": PRO_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Professional login failed: {response.text}")
    return response.json()["token"]


@pytest.fixture
def guardian_token():
    """Get authentication token for guardian user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_PHONE,
        "password": GUARDIAN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Guardian login failed: {response.text}")
    return response.json()["token"]


class TestProDashboard:
    """Test GET /api/pro/dashboard endpoint"""
    
    def test_dashboard_returns_stats(self, pro_token):
        """Dashboard returns correct stats for professional"""
        response = requests.get(
            f"{BASE_URL}/api/pro/dashboard",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "beneficiary_count" in data, "Missing beneficiary_count"
        assert "total_programs" in data, "Missing total_programs"
        assert "active_programs" in data, "Missing active_programs"
        assert "professional_type" in data, "Missing professional_type"
        assert "name" in data, "Missing name"
        
        # Verify data types
        assert isinstance(data["beneficiary_count"], int)
        assert isinstance(data["total_programs"], int)
        assert isinstance(data["active_programs"], int)
        assert data["professional_type"] in ["coach", "physio"]
        
        print(f"✓ Dashboard stats: {data['beneficiary_count']} patients, {data['active_programs']} active programs")
    
    def test_dashboard_requires_auth(self):
        """Dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/dashboard")
        assert response.status_code == 401, "Should require auth"
        print("✓ Dashboard correctly requires authentication")
    
    def test_dashboard_requires_pro_role(self, guardian_token):
        """Dashboard rejects non-professional users"""
        response = requests.get(
            f"{BASE_URL}/api/pro/dashboard",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 403, f"Should reject guardian, got {response.status_code}"
        print("✓ Dashboard correctly rejects non-professional users")


class TestProBeneficiaries:
    """Test GET /api/pro/beneficiaries endpoint"""
    
    def test_get_beneficiaries_list(self, pro_token):
        """Returns list of linked beneficiaries with vitals"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiaries",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            ben = data[0]
            assert "id" in ben, "Beneficiary missing id"
            assert "name" in ben, "Beneficiary missing name"
            # Check for vitals and program count
            assert "latest_vitals" in ben, "Missing latest_vitals field"
            assert "active_programs" in ben, "Missing active_programs field"
            print(f"✓ Found {len(data)} beneficiaries, first: {ben.get('name', 'N/A')}")
        else:
            print("✓ Beneficiaries list returned (empty)")
    
    def test_beneficiaries_requires_pro_role(self, guardian_token):
        """Beneficiaries endpoint rejects non-professional users"""
        response = requests.get(
            f"{BASE_URL}/api/pro/beneficiaries",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 403, f"Should reject guardian, got {response.status_code}"
        print("✓ Beneficiaries endpoint correctly rejects non-professional users")


class TestProProfile:
    """Test /api/pro/profile endpoints"""
    
    def test_get_profile(self, pro_token):
        """GET /api/pro/profile returns professional profile"""
        response = requests.get(
            f"{BASE_URL}/api/pro/profile",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert "professional_type" in data
        assert "specialties" in data
        assert "certifications" in data
        assert "beneficiary_count" in data
        
        print(f"✓ Profile: type={data['professional_type']}, specialties={data.get('specialties', [])}")
    
    def test_update_profile(self, pro_token):
        """PUT /api/pro/profile updates professional profile"""
        update_data = {
            "professional_type": "coach",
            "specialties": ["Renforcement musculaire", "Cardio"],
            "certifications": ["BPJEPS"],
            "bio": "Coach sportif specialise seniors",
            "hourly_rate": 50.0
        }
        response = requests.put(
            f"{BASE_URL}/api/pro/profile",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=update_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("status") == "updated"
        
        # Verify update persisted
        get_response = requests.get(
            f"{BASE_URL}/api/pro/profile",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        profile = get_response.json()
        assert profile["professional_type"] == "coach"
        assert "Renforcement musculaire" in profile["specialties"]
        
        print("✓ Profile update successful and persisted")


class TestProPrograms:
    """Test /api/pro/programs CRUD endpoints"""
    
    def test_list_programs(self, pro_token):
        """GET /api/pro/programs returns list of programs"""
        response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        print(f"✓ Found {len(data)} programs")
        
        if len(data) > 0:
            prog = data[0]
            assert "id" in prog
            assert "title" in prog
            assert "beneficiary_id" in prog
            assert "sessions" in prog
            print(f"  First program: {prog['title']} ({len(prog.get('sessions', []))} sessions)")
    
    def test_create_program(self, pro_token):
        """POST /api/pro/programs/{beneficiary_id} creates a program"""
        program_data = {
            "title": f"TEST_Programme_{uuid.uuid4().hex[:8]}",
            "description": "Programme de test automatise",
            "frequency": "2x/semaine",
            "duration_weeks": 6,
            "category": "strength"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data, "Created program missing id"
        assert data["title"] == program_data["title"]
        assert data["beneficiary_id"] == BENEFICIARY_ID
        assert data["category"] == "strength"
        assert data["status"] == "active"
        
        print(f"✓ Created program: {data['id']}")
        
        # Verify program appears in list
        list_response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        programs = list_response.json()
        program_ids = [p["id"] for p in programs]
        assert data["id"] in program_ids, "Created program not in list"
        
        return data["id"]
    
    def test_create_program_unlinked_beneficiary(self, pro_token):
        """Cannot create program for unlinked beneficiary"""
        fake_ben_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/{fake_ben_id}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json={"title": "Test", "description": "Test"}
        )
        assert response.status_code == 403, f"Should reject unlinked beneficiary, got {response.status_code}"
        print("✓ Correctly rejects program creation for unlinked beneficiary")
    
    def test_delete_program(self, pro_token):
        """DELETE /api/pro/programs/edit/{program_id} deletes a program"""
        # First create a program to delete
        program_data = {
            "title": f"TEST_ToDelete_{uuid.uuid4().hex[:8]}",
            "description": "Will be deleted",
            "frequency": "1x/semaine",
            "duration_weeks": 2,
            "category": "general"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        assert create_response.status_code == 200
        program_id = create_response.json()["id"]
        
        # Delete the program
        delete_response = requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        assert delete_response.json().get("status") == "deleted"
        
        # Verify program is gone
        list_response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        programs = list_response.json()
        program_ids = [p["id"] for p in programs]
        assert program_id not in program_ids, "Deleted program still in list"
        
        print(f"✓ Program {program_id} deleted successfully")


class TestProSessions:
    """Test /api/pro/programs/{program_id}/sessions endpoints"""
    
    @pytest.fixture
    def test_program(self, pro_token):
        """Create a test program for session tests"""
        program_data = {
            "title": f"TEST_SessionProg_{uuid.uuid4().hex[:8]}",
            "description": "For session testing",
            "frequency": "3x/semaine",
            "duration_weeks": 4,
            "category": "rehab"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        assert response.status_code == 200
        program = response.json()
        yield program
        
        # Cleanup: delete the program
        requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program['id']}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
    
    def test_add_session_to_program(self, pro_token, test_program):
        """POST /api/pro/programs/{program_id}/sessions adds a session"""
        session_data = {
            "title": "Seance 1 - Echauffement",
            "description": "10 min echauffement + etirements",
            "duration_min": 30,
            "repetitions": 10,
            "sets": 3,
            "rest_sec": 60,
            "notes": "Attention aux lombaires"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/{test_program['id']}/sessions",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=session_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data, "Session missing id"
        assert data["title"] == session_data["title"]
        assert data["duration_min"] == 30
        assert data["sets"] == 3
        
        print(f"✓ Added session: {data['title']} to program {test_program['id']}")
        
        # Verify session appears in program
        prog_response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        programs = prog_response.json()
        updated_prog = next((p for p in programs if p["id"] == test_program["id"]), None)
        assert updated_prog is not None
        assert len(updated_prog.get("sessions", [])) >= 1
        
        session_ids = [s["id"] for s in updated_prog["sessions"]]
        assert data["id"] in session_ids, "Session not found in program"
        
        print(f"✓ Session verified in program (total sessions: {len(updated_prog['sessions'])})")


class TestGuardianAccessForPro:
    """Test that professionals can access guardian endpoints"""
    
    def test_pro_can_access_guardian_link(self, pro_token):
        """Professional can use guardian link endpoint"""
        # This tests that is_guardian_like returns True for professional
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        # Should return 200 (not 403) because professional has guardian-like access
        assert response.status_code == 200, f"Pro should access guardian endpoints, got {response.status_code}: {response.text}"
        print("✓ Professional can access guardian beneficiaries endpoint")
    
    def test_pro_can_access_guardian_prescriptions(self, pro_token):
        """Professional can access prescriptions endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/prescriptions",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Pro should access prescriptions, got {response.status_code}"
        print("✓ Professional can access guardian prescriptions endpoint")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_programs(self, pro_token):
        """Delete all TEST_ prefixed programs"""
        response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        if response.status_code == 200:
            programs = response.json()
            deleted = 0
            for prog in programs:
                if prog.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/pro/programs/edit/{prog['id']}",
                        headers={"Authorization": f"Bearer {pro_token}"}
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test programs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
