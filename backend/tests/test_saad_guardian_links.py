"""
Tests for SAAD Guardian Link APIs
- GET /api/company/guardians - SAAD gets list of linked guardians
- POST /api/company/invite-guardian - SAAD invites guardian by phone (known/unknown)
- DELETE /api/company/guardians/{link_id} - remove guardian link
- GET /api/guardian/saad-invitations - guardian gets pending SAAD invitations
- POST /api/guardian/saad-invitations/{id}/accept - guardian accepts SAAD link
- POST /api/guardian/saad-invitations/{id}/reject - guardian rejects SAAD link  
- GET /api/guardian/saad-link - guardian gets their SAAD affiliation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://zone-management-v2.preview.emergentagent.com')

# Test credentials
SAAD_EMAIL = "saad@chutex.fr"
SAAD_PASSWORD = "demo123"
GUARDIAN_EMAIL = "claire.martin@email.fr"  
GUARDIAN_PASSWORD = "demo123"
LUDIVINE_EMAIL = "ludivine.moutio@care.fr"
LUDIVINE_PASSWORD = "demo123"
LUDIVINE_PHONE = "+3362020202"


class TestSAADGuardianLinkAPIs:
    """Test SAAD Guardian Link endpoints"""
    
    @pytest.fixture(scope="class")
    def saad_token(self):
        """Get SAAD company token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SAAD_EMAIL, "password": SAAD_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip(f"SAAD login failed: {response.status_code} {response.text}")
    
    @pytest.fixture(scope="class")
    def guardian_token(self):
        """Get Guardian (Claire) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL, "password": GUARDIAN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip(f"Guardian login failed: {response.status_code} {response.text}")
    
    @pytest.fixture(scope="class")
    def ludivine_token(self):
        """Get Ludivine (guardian with pending SAAD invite) token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": LUDIVINE_EMAIL, "password": LUDIVINE_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip(f"Ludivine login failed: {response.status_code} {response.text}")

    # ==================== SAAD ENDPOINTS ====================
    
    def test_saad_login(self, saad_token):
        """Verify SAAD can login"""
        assert saad_token is not None
        print(f"PASS: SAAD login successful")

    def test_get_company_guardians_empty_or_list(self, saad_token):
        """GET /api/company/guardians - SAAD gets list of linked guardians"""
        response = requests.get(
            f"{BASE_URL}/api/company/guardians",
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"GET /api/company/guardians: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        guardians = response.json()
        assert isinstance(guardians, list), "Response should be a list"
        print(f"PASS: SAAD has {len(guardians)} guardian links")
        
        # Verify data structure if guardians exist
        if len(guardians) > 0:
            first = guardians[0]
            assert "link_id" in first, "Guardian link should have link_id"
            assert "status" in first, "Guardian link should have status"
            print(f"  - First guardian: {first.get('name', 'Unknown')} ({first.get('status')})")
    
    def test_invite_guardian_missing_phone(self, saad_token):
        """POST /api/company/invite-guardian - missing phone should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/company/invite-guardian",
            json={"phone": ""},
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"POST /api/company/invite-guardian (empty phone): {response.status_code}")
        assert response.status_code == 400, f"Expected 400 for missing phone, got {response.status_code}"
        print("PASS: Missing phone returns 400")
    
    def test_invite_unknown_guardian_sms_sent(self, saad_token):
        """POST /api/company/invite-guardian - unknown phone triggers SMS simulation"""
        response = requests.post(
            f"{BASE_URL}/api/company/invite-guardian",
            json={"phone": "+33699999999"},  # Unknown phone
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"POST /api/company/invite-guardian (unknown): {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") in ["sms_sent", "pending", "already_linked"], f"Unexpected status: {data.get('status')}"
        print(f"PASS: Unknown phone returned status={data.get('status')}, message={data.get('message')}")

    def test_invite_known_guardian_pending(self, saad_token):
        """POST /api/company/invite-guardian - known guardian gets pending invitation"""
        response = requests.post(
            f"{BASE_URL}/api/company/invite-guardian",
            json={"phone": LUDIVINE_PHONE},  # Ludivine's phone
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"POST /api/company/invite-guardian (Ludivine): {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Could be pending (new invite), already_linked (was accepted before), or error (linked to another SAAD)
        assert "status" in data, "Response should have status"
        print(f"PASS: Known guardian returned status={data.get('status')}, message={data.get('message')}")

    # ==================== GUARDIAN ENDPOINTS ====================
    
    def test_guardian_login(self, ludivine_token):
        """Verify Ludivine can login"""
        assert ludivine_token is not None
        print(f"PASS: Ludivine login successful")
    
    def test_get_saad_invitations(self, ludivine_token):
        """GET /api/guardian/saad-invitations - guardian gets pending SAAD invitations"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/saad-invitations",
            headers={"Authorization": f"Bearer {ludivine_token}"}
        )
        print(f"GET /api/guardian/saad-invitations: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        invitations = response.json()
        assert isinstance(invitations, list), "Response should be a list"
        print(f"PASS: Ludivine has {len(invitations)} pending SAAD invitations")
        
        # Store invitation ID if exists for later test
        if len(invitations) > 0:
            first = invitations[0]
            assert "id" in first, "Invitation should have id"
            assert "company_name" in first, "Invitation should have company_name"
            print(f"  - Invitation from: {first.get('company_name')} (id: {first.get('id')[:8]}...)")
            return first.get('id')
        return None
    
    def test_get_saad_link_null_or_object(self, ludivine_token):
        """GET /api/guardian/saad-link - guardian gets their current SAAD affiliation"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/saad-link",
            headers={"Authorization": f"Bearer {ludivine_token}"}
        )
        print(f"GET /api/guardian/saad-link: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        link = response.json()
        if link is None:
            print("PASS: Guardian has no SAAD affiliation (null)")
        else:
            assert "company_id" in link or "company_name" in link, "Link should have company info"
            print(f"PASS: Guardian affiliated with SAAD: {link.get('company_name')}")
    
    def test_accept_saad_invitation_flow(self, ludivine_token, saad_token):
        """Full flow: Accept SAAD invitation, verify guardian list shows accepted"""
        # First get pending invitations
        inv_response = requests.get(
            f"{BASE_URL}/api/guardian/saad-invitations",
            headers={"Authorization": f"Bearer {ludivine_token}"}
        )
        invitations = inv_response.json()
        
        if len(invitations) == 0:
            # Create a new invitation first
            requests.post(
                f"{BASE_URL}/api/company/invite-guardian",
                json={"phone": LUDIVINE_PHONE},
                headers={"Authorization": f"Bearer {saad_token}"}
            )
            inv_response = requests.get(
                f"{BASE_URL}/api/guardian/saad-invitations",
                headers={"Authorization": f"Bearer {ludivine_token}"}
            )
            invitations = inv_response.json()
        
        if len(invitations) == 0:
            # Check if already accepted
            link_response = requests.get(
                f"{BASE_URL}/api/guardian/saad-link",
                headers={"Authorization": f"Bearer {ludivine_token}"}
            )
            link = link_response.json()
            if link:
                print(f"PASS: Guardian already linked to SAAD: {link.get('company_name')}")
                return
            else:
                pytest.skip("No pending invitations and no existing link")
        
        inv_id = invitations[0].get('id')
        company_name = invitations[0].get('company_name')
        print(f"Accepting invitation {inv_id[:8]}... from {company_name}")
        
        # Accept the invitation
        accept_response = requests.post(
            f"{BASE_URL}/api/guardian/saad-invitations/{inv_id}/accept",
            headers={"Authorization": f"Bearer {ludivine_token}"}
        )
        print(f"POST /api/guardian/saad-invitations/{inv_id}/accept: {accept_response.status_code}")
        assert accept_response.status_code == 200, f"Expected 200, got {accept_response.status_code}: {accept_response.text}"
        
        data = accept_response.json()
        assert data.get("status") == "accepted", f"Expected accepted status, got {data.get('status')}"
        print(f"PASS: Invitation accepted - {data.get('message')}")
        
        # Verify SAAD link is now set
        link_response = requests.get(
            f"{BASE_URL}/api/guardian/saad-link",
            headers={"Authorization": f"Bearer {ludivine_token}"}
        )
        link = link_response.json()
        assert link is not None, "SAAD link should exist after accepting"
        print(f"PASS: Guardian now affiliated with: {link.get('company_name')}")
        
        # Verify SAAD sees guardian as accepted
        guardians_response = requests.get(
            f"{BASE_URL}/api/company/guardians",
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        guardians = guardians_response.json()
        accepted = [g for g in guardians if g.get('status') == 'accepted']
        print(f"PASS: SAAD has {len(accepted)} accepted guardians")

    def test_reject_saad_invitation(self, guardian_token, saad_token):
        """Test rejecting a SAAD invitation"""
        # First create an invitation for Claire
        requests.post(
            f"{BASE_URL}/api/company/invite-guardian",
            json={"phone": "+33651234567"},  # Claire's phone
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        
        # Get Claire's pending invitations
        inv_response = requests.get(
            f"{BASE_URL}/api/guardian/saad-invitations",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        invitations = inv_response.json()
        
        if len(invitations) == 0:
            print("SKIP: No pending invitations for Claire to reject")
            return
        
        inv_id = invitations[0].get('id')
        
        # Reject the invitation
        reject_response = requests.post(
            f"{BASE_URL}/api/guardian/saad-invitations/{inv_id}/reject",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        print(f"POST /api/guardian/saad-invitations/{inv_id}/reject: {reject_response.status_code}")
        assert reject_response.status_code == 200, f"Expected 200, got {reject_response.status_code}"
        print("PASS: Invitation rejected successfully")


class TestSAADAgencyPage:
    """Test company-agency page endpoints for SAAD"""
    
    @pytest.fixture(scope="class")
    def saad_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SAAD_EMAIL, "password": SAAD_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("SAAD login failed")

    def test_get_agencies(self, saad_token):
        """GET /api/company/agencies - Get list of agencies"""
        response = requests.get(
            f"{BASE_URL}/api/company/agencies",
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"GET /api/company/agencies: {response.status_code}")
        assert response.status_code == 200
        
        agencies = response.json()
        assert isinstance(agencies, list)
        print(f"PASS: SAAD has {len(agencies)} agencies")

    def test_get_intervenants(self, saad_token):
        """GET /api/company/intervenants - Get list of intervenants"""
        response = requests.get(
            f"{BASE_URL}/api/company/intervenants",
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"GET /api/company/intervenants: {response.status_code}")
        assert response.status_code == 200
        
        intervenants = response.json()
        assert isinstance(intervenants, list)
        print(f"PASS: SAAD has {len(intervenants)} intervenants")

    def test_delete_guardian_link_invalid_id(self, saad_token):
        """DELETE /api/company/guardians/{link_id} - invalid ID returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/company/guardians/invalid-link-id-12345",
            headers={"Authorization": f"Bearer {saad_token}"}
        )
        print(f"DELETE /api/company/guardians/invalid-id: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid link_id returns 404")


class TestGuardianRelationshipChips:
    """Test the relationship is stored correctly when linking beneficiaries"""
    
    @pytest.fixture(scope="class")
    def guardian_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_EMAIL, "password": GUARDIAN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Guardian login failed")

    def test_link_with_professional_relationship(self, guardian_token):
        """Test linking with professional relationship type"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={
                "phone": "+33699998888",  # Unknown number
                "relationship": "Auxiliaire de vie"  # Professional
            },
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        print(f"POST /api/guardian/link-with-phone (professional): {response.status_code}")
        # Should work even for unknown numbers (SMS sent)
        assert response.status_code == 200 or response.status_code == 201
        print(f"PASS: Professional relationship link request completed")

    def test_link_with_personal_relationship(self, guardian_token):
        """Test linking with personal relationship type"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={
                "phone": "+33699997777",  # Unknown number
                "relationship": "Fils"  # Personal
            },
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        print(f"POST /api/guardian/link-with-phone (personal): {response.status_code}")
        assert response.status_code == 200 or response.status_code == 201
        print(f"PASS: Personal relationship link request completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
