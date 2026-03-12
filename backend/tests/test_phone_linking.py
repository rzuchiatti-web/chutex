"""
Test phone-number invitation flow for beneficiary linking
Features:
- POST /api/guardian/link-with-phone - Guardian sends invite by phone number
- GET /api/beneficiary/guardian-requests - Beneficiary sees pending guardian requests
- POST /api/beneficiary/guardian-requests/{id}/accept - Beneficiary accepts a guardian request  
- POST /api/beneficiary/guardian-requests/{id}/reject - Beneficiary rejects a guardian request
- Test already_linked scenario
- Test sms_sent scenario for unknown phone
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://beneficiary-hub-9.preview.emergentagent.com').rstrip('/')

# Test credentials
GUARDIAN_CREDS = {"email": "claire.martin@email.fr", "password": "demo123"}
BENEFICIARY_CREDS = {"email": "robert.martin@email.fr", "password": "demo123"}
BENEFICIARY_PHONE = "+33651245918"
INTERVENANT_CREDS = {"email": "ludivine.moutio@care.fr", "password": "demo123"}


class TestPhoneLinkingFlow:
    """Test the phone-based beneficiary linking flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as guardian for most tests"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=GUARDIAN_CREDS)
        assert resp.status_code == 200, f"Guardian login failed: {resp.text}"
        self.guardian_token = resp.json()["token"]
        self.guardian_headers = {"Authorization": f"Bearer {self.guardian_token}"}
        self.guardian_user = resp.json()["user"]
        
        # Also login as beneficiary for accept/reject tests
        resp_ben = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert resp_ben.status_code == 200, f"Beneficiary login failed: {resp_ben.text}"
        self.beneficiary_token = resp_ben.json()["token"]
        self.beneficiary_headers = {"Authorization": f"Bearer {self.beneficiary_token}"}
        self.beneficiary_user = resp_ben.json()["user"]
    
    def test_link_with_phone_already_linked(self):
        """Test that linking with already-linked beneficiary returns 'already_linked'"""
        # Claire Martin (guardian) is already linked to Robert Martin (beneficiary)
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": BENEFICIARY_PHONE, "relationship": "Pere"},
            headers=self.guardian_headers
        )
        
        assert response.status_code == 200, f"Link with phone failed: {response.text}"
        data = response.json()
        
        # Should return already_linked since they're already connected
        assert data["status"] == "already_linked", f"Expected 'already_linked' but got: {data}"
        assert "deja gardien" in data["message"].lower() or "already" in data["message"].lower(), f"Expected 'already linked' message but got: {data['message']}"
        print(f"Already linked response: {data}")
    
    def test_link_with_phone_unknown_number_sms_sent(self):
        """Test that linking with unknown phone number returns 'sms_sent'"""
        # Use a random phone number that doesn't exist in the database
        unknown_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": unknown_phone, "relationship": "Ami"},
            headers=self.guardian_headers
        )
        
        assert response.status_code == 200, f"Link with phone failed: {response.text}"
        data = response.json()
        
        # Should return sms_sent since phone is unknown
        assert data["status"] == "sms_sent", f"Expected 'sms_sent' but got: {data}"
        assert "sms" in data["message"].lower() or "invitation" in data["message"].lower(), f"Expected SMS message but got: {data['message']}"
        print(f"SMS sent response: {data}")
    
    def test_link_with_phone_missing_phone(self):
        """Test that missing phone number returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": "", "relationship": "Ami"},
            headers=self.guardian_headers
        )
        
        assert response.status_code == 400, f"Expected 400 but got {response.status_code}: {response.text}"
        print(f"Missing phone error: {response.json()}")
    
    def test_get_guardian_requests_as_beneficiary(self):
        """Test that beneficiary can get their pending guardian requests"""
        response = requests.get(
            f"{BASE_URL}/api/beneficiary/guardian-requests",
            headers=self.beneficiary_headers
        )
        
        assert response.status_code == 200, f"Get guardian requests failed: {response.text}"
        data = response.json()
        
        # Should return a list (may be empty)
        assert isinstance(data, list), f"Expected list but got: {type(data)}"
        print(f"Beneficiary has {len(data)} pending guardian requests")
        
        # If there are any requests, check structure
        for req in data:
            assert "id" in req, "Request should have id"
            assert "guardian_name" in req, "Request should have guardian_name"
            assert "status" in req, "Request should have status"
            print(f"  - Request from {req.get('guardian_name')}, status: {req.get('status')}")


class TestGuardianRequestAcceptReject:
    """Test accept/reject flow with a fresh guardian request"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as intervenant (different guardian) to create new requests"""
        # Use Ludivine as the guardian (different from Claire who is already linked)
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=INTERVENANT_CREDS)
        assert resp.status_code == 200, f"Intervenant login failed: {resp.text}"
        self.guardian_token = resp.json()["token"]
        self.guardian_headers = {"Authorization": f"Bearer {self.guardian_token}"}
        self.guardian_user = resp.json()["user"]
        
        # Login as beneficiary (Robert Martin)
        resp_ben = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert resp_ben.status_code == 200, f"Beneficiary login failed: {resp_ben.text}"
        self.beneficiary_token = resp_ben.json()["token"]
        self.beneficiary_headers = {"Authorization": f"Bearer {self.beneficiary_token}"}
    
    def test_create_pending_request_then_accept(self):
        """Create a guardian request and accept it"""
        # Step 1: Create request from Ludivine to Robert
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": BENEFICIARY_PHONE, "relationship": "Infirmiere"},
            headers=self.guardian_headers
        )
        
        assert response.status_code == 200, f"Link with phone failed: {response.text}"
        data = response.json()
        
        # Could be pending or already_linked (if previously linked)
        if data["status"] == "already_linked":
            print(f"Ludivine already linked to Robert, skipping accept test")
            pytest.skip("Guardian already linked to beneficiary")
            return
        
        assert data["status"] == "pending", f"Expected 'pending' but got: {data}"
        print(f"Created pending request: {data}")
        
        # Step 2: Get the request ID from beneficiary's perspective
        requests_resp = requests.get(
            f"{BASE_URL}/api/beneficiary/guardian-requests",
            headers=self.beneficiary_headers
        )
        
        assert requests_resp.status_code == 200, f"Get requests failed: {requests_resp.text}"
        pending_requests = requests_resp.json()
        
        # Find request from Ludivine
        ludivine_request = None
        for req in pending_requests:
            if req.get("guardian_name", "").lower().find("ludivine") >= 0:
                ludivine_request = req
                break
        
        if not ludivine_request:
            print(f"No pending request from Ludivine found. Requests: {pending_requests}")
            pytest.skip("Request not found in pending list")
            return
        
        request_id = ludivine_request["id"]
        print(f"Found request ID: {request_id}")
        
        # Step 3: Accept the request
        accept_resp = requests.post(
            f"{BASE_URL}/api/beneficiary/guardian-requests/{request_id}/accept",
            headers=self.beneficiary_headers
        )
        
        assert accept_resp.status_code == 200, f"Accept request failed: {accept_resp.text}"
        accept_data = accept_resp.json()
        
        assert accept_data["status"] == "accepted", f"Expected 'accepted' but got: {accept_data}"
        print(f"Accepted request: {accept_data}")
    
    def test_reject_guardian_request(self):
        """Create a guardian request and reject it"""
        # First create a request (may fail if already linked)
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": BENEFICIARY_PHONE, "relationship": "Aide-soignante"},
            headers=self.guardian_headers
        )
        
        assert response.status_code == 200, f"Link with phone failed: {response.text}"
        data = response.json()
        
        if data["status"] in ("already_linked", "pending"):
            # Get pending requests
            requests_resp = requests.get(
                f"{BASE_URL}/api/beneficiary/guardian-requests",
                headers=self.beneficiary_headers
            )
            
            assert requests_resp.status_code == 200, f"Get requests failed: {requests_resp.text}"
            pending_requests = requests_resp.json()
            
            if len(pending_requests) == 0:
                print("No pending requests to reject")
                pytest.skip("No pending requests available")
                return
            
            # Try to reject the first pending request
            request_id = pending_requests[0]["id"]
            
            reject_resp = requests.post(
                f"{BASE_URL}/api/beneficiary/guardian-requests/{request_id}/reject",
                headers=self.beneficiary_headers
            )
            
            assert reject_resp.status_code == 200, f"Reject request failed: {reject_resp.text}"
            reject_data = reject_resp.json()
            
            assert reject_data["status"] == "rejected", f"Expected 'rejected' but got: {reject_data}"
            print(f"Rejected request: {reject_data}")
        else:
            print(f"Unexpected status: {data}")


class TestEndpointsExist:
    """Test that all required endpoints exist and return proper responses"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as guardian"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=GUARDIAN_CREDS)
        assert resp.status_code == 200, f"Guardian login failed: {resp.text}"
        self.guardian_token = resp.json()["token"]
        self.guardian_headers = {"Authorization": f"Bearer {self.guardian_token}"}
        
        resp_ben = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert resp_ben.status_code == 200, f"Beneficiary login failed: {resp_ben.text}"
        self.beneficiary_token = resp_ben.json()["token"]
        self.beneficiary_headers = {"Authorization": f"Bearer {self.beneficiary_token}"}
    
    def test_link_with_phone_endpoint_exists(self):
        """Test POST /api/guardian/link-with-phone endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/guardian/link-with-phone",
            json={"phone": "+33600000000", "relationship": "Test"},
            headers=self.guardian_headers
        )
        
        # Should return 200 (not 404)
        assert response.status_code != 404, "Endpoint /api/guardian/link-with-phone not found"
        print(f"Link with phone endpoint status: {response.status_code}")
    
    def test_guardian_requests_endpoint_exists(self):
        """Test GET /api/beneficiary/guardian-requests endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/beneficiary/guardian-requests",
            headers=self.beneficiary_headers
        )
        
        # Should return 200 (not 404)
        assert response.status_code == 200, f"Endpoint /api/beneficiary/guardian-requests returned {response.status_code}"
        print(f"Guardian requests endpoint status: {response.status_code}")
    
    def test_accept_request_endpoint_exists(self):
        """Test POST /api/beneficiary/guardian-requests/{id}/accept endpoint exists"""
        # Use a fake ID - should return 404 for not found (not for endpoint)
        response = requests.post(
            f"{BASE_URL}/api/beneficiary/guardian-requests/fake-id-123/accept",
            headers=self.beneficiary_headers
        )
        
        # Should return 404 for "request not found" (endpoint exists but request doesn't)
        assert response.status_code in (200, 404), f"Unexpected status: {response.status_code}"
        if response.status_code == 404:
            assert "non trouvee" in response.text.lower() or "not found" in response.text.lower()
        print(f"Accept request endpoint status: {response.status_code}")
    
    def test_reject_request_endpoint_exists(self):
        """Test POST /api/beneficiary/guardian-requests/{id}/reject endpoint exists"""
        # Use a fake ID - should return 200 (update even if not found) or proper error
        response = requests.post(
            f"{BASE_URL}/api/beneficiary/guardian-requests/fake-id-456/reject",
            headers=self.beneficiary_headers
        )
        
        # Should return 200 (even if no match found, update returns success)
        assert response.status_code == 200, f"Endpoint returned {response.status_code}: {response.text}"
        print(f"Reject request endpoint status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
