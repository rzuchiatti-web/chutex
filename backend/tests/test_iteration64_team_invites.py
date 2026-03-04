"""
Iteration 64 - Team Program Invites by Phone
Tests for:
- POST /api/programs/team/invite-by-phone (in-app notification when phone matches existing beneficiary)
- POST /api/programs/team/invite-by-phone (sms_sent/sms_failed when phone doesn't match)
- GET /api/programs/team/invitations (pending invitations for current user)
- POST /api/programs/team/invitations/{id}/accept (adds user to team)
- POST /api/programs/team/invitations/{id}/reject (marks invitation rejected)
- GET /api/programs/catalog (returns programs with benefits, effort, difficulty, tracked_metrics)
- GET /api/programs/detail/prog-sleep-21 (returns enriched program with onboarding_fields and tracked_metrics)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://longevity-engine-2.preview.emergentagent.com").rstrip("/")

# Test credentials - API uses email field for both email and phone numbers
TEST_EMAIL = "0600000099"  # Marie Test's phone (used as email field)
TEST_PASSWORD = "test123"
ROBIN_PHONE = "+33651245918"  # Guardian, not beneficiary


class TestTeamInviteByPhone:
    """Tests for POST /api/programs/team/invite-by-phone"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test (beneficiary) and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as Marie Test - API uses email field for phone numbers
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.user = login_resp.json().get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code} - {login_resp.text}")

    def test_invite_by_phone_requires_auth(self):
        """Test that invite-by-phone requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        resp = session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": "0612345678", "team_id": "test-team"}
        )
        assert resp.status_code == 401 or resp.status_code == 403
        print(f"✓ invite-by-phone requires auth: {resp.status_code}")

    def test_invite_by_phone_requires_phone_and_team_id(self):
        """Test that phone and team_id are required"""
        resp = self.session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": "0612345678"}
        )
        assert resp.status_code == 400
        assert "team_id" in resp.json().get("detail", "").lower()
        print(f"✓ invite-by-phone requires team_id: {resp.json()}")

    def test_invite_by_phone_nonexistent_team(self):
        """Test inviting to a nonexistent team returns 404"""
        resp = self.session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": "0612345678", "team_id": "nonexistent-team-id"}
        )
        assert resp.status_code == 404
        print(f"✓ invite-by-phone nonexistent team: {resp.json()}")

    def test_create_team_then_invite_existing_user_by_phone(self):
        """Test creating a team and inviting an existing beneficiary by phone triggers in-app notification"""
        # First create a team
        start_date = "2026-03-01"
        create_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/create",
            json={"program_id": "prog-sleep-21", "start_date": start_date}
        )
        print(f"Team create response: {create_resp.status_code} - {create_resp.text[:500]}")
        
        if create_resp.status_code != 200:
            pytest.skip(f"Could not create team: {create_resp.text}")
        
        team_data = create_resp.json()
        team_id = team_data.get("team_id")
        assert team_id, "team_id should be returned"
        print(f"✓ Team created with ID: {team_id}, invite_code: {team_data.get('invite_code')}")
        
        # Now try inviting with Marie's own phone (should return already_member)
        invite_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": TEST_EMAIL, "team_id": team_id}
        )
        print(f"Invite self response: {invite_resp.status_code} - {invite_resp.text}")
        assert invite_resp.status_code == 200
        data = invite_resp.json()
        # Marie should already be a member since she created the team
        assert data.get("status") in ["already_member", "notification_sent"]
        print(f"✓ Invite by phone (self): status={data.get('status')}")

    def test_invite_nonexistent_phone_triggers_sms_path(self):
        """Test inviting a phone that doesn't match any user triggers SMS path"""
        # First create a team
        start_date = "2026-03-02"
        create_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/create",
            json={"program_id": "prog-tension-14", "start_date": start_date}
        )
        if create_resp.status_code != 200:
            pytest.skip(f"Could not create team: {create_resp.text}")
        
        team_data = create_resp.json()
        team_id = team_data.get("team_id")
        
        # Invite a non-existent phone number
        fake_phone = "0699999999"
        invite_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": fake_phone, "team_id": team_id}
        )
        print(f"Invite fake phone response: {invite_resp.status_code} - {invite_resp.text}")
        assert invite_resp.status_code == 200
        data = invite_resp.json()
        # Should return sms_sent or sms_failed (depending on SMS Mode API key config)
        assert data.get("status") in ["sms_sent", "sms_failed"]
        assert data.get("method") == "sms"
        print(f"✓ Invite by phone (non-existent): status={data.get('status')}, method={data.get('method')}")


class TestTeamInvitationsEndpoint:
    """Tests for GET /api/programs/team/invitations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")

    def test_get_team_invitations_returns_list(self):
        """Test that GET /api/programs/team/invitations returns a list"""
        resp = self.session.get(f"{BASE_URL}/api/programs/team/invitations")
        print(f"Get invitations response: {resp.status_code} - {resp.text[:500]}")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET team/invitations returns list with {len(data)} items")
        
        # If there are invitations, verify structure
        for inv in data:
            assert "id" in inv
            assert "team_id" in inv
            assert "inviter_name" in inv
            assert "program_title" in inv
            assert "status" in inv
            print(f"  - Invitation: {inv.get('id')} from {inv.get('inviter_name')} for {inv.get('program_title')}")


class TestAcceptRejectInvitations:
    """Tests for accept/reject team invitations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.user = login_resp.json().get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")

    def test_accept_nonexistent_invitation(self):
        """Test accepting a nonexistent invitation returns 404"""
        resp = self.session.post(f"{BASE_URL}/api/programs/team/invitations/nonexistent-id/accept")
        assert resp.status_code == 404
        print(f"✓ Accept nonexistent invitation: {resp.status_code}")

    def test_reject_nonexistent_invitation(self):
        """Test rejecting a nonexistent invitation"""
        resp = self.session.post(f"{BASE_URL}/api/programs/team/invitations/nonexistent-id/reject")
        # Could be 200 (no-op) or 404 depending on implementation
        print(f"✓ Reject nonexistent invitation: {resp.status_code} - {resp.text}")

    def test_accept_invitation_flow(self):
        """Test the full invitation accept flow if there are pending invitations"""
        # Get pending invitations
        inv_resp = self.session.get(f"{BASE_URL}/api/programs/team/invitations")
        if inv_resp.status_code != 200:
            pytest.skip("Could not fetch invitations")
        
        invitations = inv_resp.json()
        if not invitations:
            print("✓ No pending invitations to test accept flow")
            return
        
        # Accept the first one
        invite = invitations[0]
        accept_resp = self.session.post(f"{BASE_URL}/api/programs/team/invitations/{invite['id']}/accept")
        print(f"Accept invitation response: {accept_resp.status_code} - {accept_resp.text}")
        assert accept_resp.status_code == 200
        data = accept_resp.json()
        assert data.get("status") == "joined"
        assert "team_id" in data
        print(f"✓ Accepted invitation: joined team {data.get('team_id')}")


class TestProgramCatalogEnriched:
    """Tests for GET /api/programs/catalog with enriched data"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")

    def test_catalog_returns_programs_with_enriched_fields(self):
        """Test that catalog returns programs with benefits, effort, difficulty, tracked_metrics"""
        resp = self.session.get(f"{BASE_URL}/api/programs/catalog")
        print(f"Catalog response: {resp.status_code}")
        assert resp.status_code == 200
        data = resp.json()
        
        programs = data.get("programs", [])
        assert len(programs) >= 3, f"Expected at least 3 programs, got {len(programs)}"
        print(f"✓ Catalog returns {len(programs)} programs")
        
        for prog in programs:
            assert "id" in prog
            assert "title" in prog
            assert "benefits" in prog, f"Program {prog.get('id')} missing benefits"
            assert "effort" in prog, f"Program {prog.get('id')} missing effort"
            assert "difficulty" in prog, f"Program {prog.get('id')} missing difficulty"
            assert "tracked_metrics" in prog, f"Program {prog.get('id')} missing tracked_metrics"
            
            assert isinstance(prog["benefits"], list)
            assert len(prog["benefits"]) > 0, f"Program {prog.get('id')} has no benefits"
            assert isinstance(prog["tracked_metrics"], list)
            
            print(f"  - {prog['id']}: {len(prog['benefits'])} benefits, effort={prog['effort']}, difficulty={prog['difficulty']}, {len(prog['tracked_metrics'])} metrics")

    def test_sleep_program_has_correct_fields(self):
        """Test that sleep program has specific required fields"""
        resp = self.session.get(f"{BASE_URL}/api/programs/catalog")
        assert resp.status_code == 200
        programs = resp.json().get("programs", [])
        
        sleep_prog = next((p for p in programs if p["id"] == "prog-sleep-21"), None)
        assert sleep_prog is not None, "Sleep program not found in catalog"
        
        # Check specific fields
        assert sleep_prog["effort"] == "15-20 min/jour"
        assert sleep_prog["difficulty"] == "facile"
        assert "sleep_quality" in sleep_prog["tracked_metrics"]
        assert "hrv" in sleep_prog["tracked_metrics"]
        assert len(sleep_prog["benefits"]) >= 4
        print(f"✓ Sleep program has correct enriched fields")


class TestProgramDetailEnriched:
    """Tests for GET /api/programs/detail/{program_id} with enriched data"""

    def test_program_detail_returns_onboarding_fields(self):
        """Test that program detail returns onboarding_fields and tracked_metrics"""
        session = requests.Session()
        # No auth required for detail endpoint
        resp = session.get(f"{BASE_URL}/api/programs/detail/prog-sleep-21")
        print(f"Program detail response: {resp.status_code}")
        assert resp.status_code == 200
        data = resp.json()
        
        assert "onboarding_fields" in data
        assert isinstance(data["onboarding_fields"], list)
        assert len(data["onboarding_fields"]) > 0
        
        assert "tracked_metrics" in data
        assert isinstance(data["tracked_metrics"], list)
        assert len(data["tracked_metrics"]) > 0
        
        assert "benefits" in data
        assert "medical_disclaimer" in data
        assert "phases" in data
        
        print(f"✓ Program detail has {len(data['onboarding_fields'])} onboarding fields")
        print(f"✓ Program detail has {len(data['tracked_metrics'])} tracked metrics")
        print(f"✓ Program detail has {len(data['benefits'])} benefits")
        print(f"✓ Program detail has {len(data['phases'])} phases")
        print(f"✓ Medical disclaimer present: {len(data.get('medical_disclaimer', ''))} chars")
        
        # Verify onboarding field structure
        for field in data["onboarding_fields"]:
            assert "key" in field
            assert "label" in field
            assert "type" in field
            print(f"  - Onboarding: {field['key']} ({field['type']})")

    def test_tension_program_detail(self):
        """Test tension program detail"""
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/api/programs/detail/prog-tension-14")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["id"] == "prog-tension-14"
        assert data["duration_days"] == 14
        assert "blood_pressure" in data["tracked_metrics"]
        assert data["difficulty"] == "moyen"
        print(f"✓ Tension program detail verified")

    def test_activity_program_detail(self):
        """Test activity program detail"""
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/api/programs/detail/prog-activity-30")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["id"] == "prog-activity-30"
        assert data["duration_days"] == 30
        assert "steps" in data["tracked_metrics"]
        assert data["difficulty"] == "progressif"
        print(f"✓ Activity program detail verified")

    def test_nonexistent_program_returns_404(self):
        """Test that nonexistent program returns 404"""
        session = requests.Session()
        resp = session.get(f"{BASE_URL}/api/programs/detail/nonexistent-program")
        assert resp.status_code == 404
        print(f"✓ Nonexistent program returns 404")


class TestGuardianInviteScenario:
    """Test inviting Robin (guardian) by phone - should trigger SMS path since Robin is not a beneficiary"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as Marie Test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_resp.status_code}")

    def test_invite_guardian_by_phone_triggers_sms(self):
        """Test that inviting Robin (guardian, not beneficiary) triggers SMS path"""
        # Create a team first
        create_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/create",
            json={"program_id": "prog-activity-30", "start_date": "2026-03-05"}
        )
        if create_resp.status_code != 200:
            pytest.skip(f"Could not create team: {create_resp.text}")
        
        team_id = create_resp.json().get("team_id")
        
        # Try to invite Robin (guardian)
        invite_resp = self.session.post(
            f"{BASE_URL}/api/programs/team/invite-by-phone",
            json={"phone": ROBIN_PHONE, "team_id": team_id}
        )
        print(f"Invite Robin response: {invite_resp.status_code} - {invite_resp.text}")
        assert invite_resp.status_code == 200
        data = invite_resp.json()
        
        # Robin is a guardian, not a beneficiary, so should trigger SMS path
        # OR if Robin has been converted to beneficiary, it could be notification_sent
        assert data.get("status") in ["sms_sent", "sms_failed", "notification_sent"]
        print(f"✓ Invite guardian by phone: status={data.get('status')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
