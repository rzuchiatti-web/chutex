"""
Test suite for refactored routes after monolithic file extraction:
- program_routes.py (886 lines, refactored from 1866)
- program_helpers.py (new, helper functions extracted)
- program_seed_data.py (new, seed data extracted)
- program_team_routes.py (new, team routes extracted)
- teleassistance_routes.py (458 lines, refactored from 1131)
- escalation_routes.py (new, escalation routes extracted)
- intervention_routes.py (new, intervention routes extracted)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-graphs-mvp.preview.emergentagent.com').rstrip('/')

# Test credentials
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"
GUARDIAN_PHONE = "+33612345678"
GUARDIAN_PASSWORD = "test123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def beneficiary_token(api_client):
    """Get beneficiary authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_PHONE,
        "password": BENEFICIARY_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Beneficiary authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def guardian_token(api_client):
    """Get guardian authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_PHONE,
        "password": GUARDIAN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Guardian authentication failed: {response.status_code} - {response.text}")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_beneficiary(self, api_client):
        """Test beneficiary login with phone number"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,
            "password": BENEFICIARY_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Beneficiary login successful: {data['user'].get('name', 'Unknown')}")
    
    def test_login_guardian(self, api_client):
        """Test guardian login with phone number"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_PHONE,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Guardian login successful: {data['user'].get('name', 'Unknown')}")


class TestProgramRoutes:
    """Test refactored program_routes.py endpoints"""
    
    def test_programs_catalog(self, api_client, beneficiary_token):
        """Test GET /api/programs/catalog - returns available programs"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/catalog",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "programs" in data
        assert isinstance(data["programs"], list)
        # Verify seed programs exist
        if len(data["programs"]) > 0:
            program = data["programs"][0]
            assert "id" in program
            assert "title" in program
            print(f"Found {len(data['programs'])} programs in catalog")
    
    def test_programs_active(self, api_client, beneficiary_token):
        """Test GET /api/programs/active - returns active program or none"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/active",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Either active=True with program data or active=False
        assert "active" in data
        print(f"Active program status: {data.get('active', False)}")
    
    def test_programs_badges(self, api_client, beneficiary_token):
        """Test GET /api/programs/badges - returns earned badges"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/badges",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "stats" in data
        print(f"Found {len(data['badges'])} badge definitions")


class TestProgramTeamRoutes:
    """Test refactored program_team_routes.py endpoints"""
    
    def test_team_active(self, api_client, beneficiary_token):
        """Test GET /api/programs/team/active - returns team data"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/team/active",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Either has_team=True with team data or has_team=False
        assert "has_team" in data
        print(f"Team status: has_team={data.get('has_team', False)}")
    
    def test_team_feed(self, api_client, beneficiary_token):
        """Test GET /api/programs/team/feed - returns activity feed"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/team/feed",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "feed" in data
        print(f"Team feed has {len(data['feed'])} activities")
    
    def test_team_leaderboard(self, api_client, beneficiary_token):
        """Test GET /api/programs/team/leaderboard - returns leaderboard"""
        response = api_client.get(
            f"{BASE_URL}/api/programs/team/leaderboard",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        print(f"Leaderboard has {len(data['leaderboard'])} entries")


class TestTeleassistanceRoutes:
    """Test refactored teleassistance_routes.py endpoints"""
    
    def test_protocol_beneficiary(self, api_client):
        """Test GET /api/teleassistance/protocol/beneficiary - public endpoint"""
        response = api_client.get(f"{BASE_URL}/api/teleassistance/protocol/beneficiary")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify structure
        assert "id" in data[0]
        assert "question" in data[0]
        assert "options" in data[0]
        print(f"Beneficiary protocol has {len(data)} questions")
    
    def test_protocol_guardian(self, api_client):
        """Test GET /api/teleassistance/protocol/guardian - public endpoint"""
        response = api_client.get(f"{BASE_URL}/api/teleassistance/protocol/guardian")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Guardian protocol has {len(data)} questions")


class TestEscalationRoutes:
    """Test refactored escalation_routes.py endpoints"""
    
    def test_escalation_active(self, api_client, guardian_token):
        """Test GET /api/escalation/active - returns active escalations"""
        response = api_client.get(
            f"{BASE_URL}/api/escalation/active",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} active escalations")
    
    def test_escalations_list(self, api_client, guardian_token):
        """Test GET /api/teleassistance/escalations - returns all escalations"""
        response = api_client.get(
            f"{BASE_URL}/api/teleassistance/escalations",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} total escalations")


class TestInterventionRoutes:
    """Test refactored intervention_routes.py endpoints"""
    
    def test_intervention_close_qcm(self, api_client):
        """Test GET /api/intervention/close-qcm - public endpoint"""
        response = api_client.get(f"{BASE_URL}/api/intervention/close-qcm")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6  # 6 QCM questions
        # Verify structure
        for q in data:
            assert "id" in q
            assert "question" in q
            assert "options" in q
        print(f"Intervention close QCM has {len(data)} questions")
    
    def test_interventions_pending(self, api_client, guardian_token):
        """Test GET /api/interventions/pending - returns pending interventions"""
        response = api_client.get(
            f"{BASE_URL}/api/interventions/pending",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pending interventions")


class TestProgramHelpers:
    """Test that program helpers are working correctly via API responses"""
    
    def test_program_detail_structure(self, api_client, beneficiary_token):
        """Test GET /api/programs/detail/{id} - verify seed data structure"""
        # First get catalog to find a program ID
        catalog_response = api_client.get(
            f"{BASE_URL}/api/programs/catalog",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert catalog_response.status_code == 200
        programs = catalog_response.json().get("programs", [])
        
        if len(programs) > 0:
            program_id = programs[0]["id"]
            # Get program detail
            response = api_client.get(f"{BASE_URL}/api/programs/detail/{program_id}")
            assert response.status_code == 200
            data = response.json()
            
            # Verify seed data structure from program_seed_data.py
            assert "id" in data
            assert "title" in data
            assert "icon" in data
            assert "color" in data
            assert "duration_days" in data
            print(f"Program detail verified: {data['title']}")
        else:
            pytest.skip("No programs in catalog to test")


class TestSubscribersEndpoint:
    """Test teleassistance subscribers endpoint"""
    
    def test_subscribers_list(self, api_client, guardian_token):
        """Test GET /api/teleassistance/subscribers - returns all subscribers"""
        response = api_client.get(
            f"{BASE_URL}/api/teleassistance/subscribers",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        # This endpoint may not require auth based on code
        if response.status_code == 401:
            response = api_client.get(f"{BASE_URL}/api/teleassistance/subscribers")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} subscribers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
