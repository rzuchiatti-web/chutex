"""
Test RGPD/CNIL compliance features - Iteration 50
- RGPD requests (access, deletion, opposition, portability)
- Consent tracking
- Legal documents (privacy policy, CGU, mentions legales)
- Security headers
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://health-guardian-43.preview.emergentagent.com')

class TestRGPDCompliance:
    """Test RGPD/CNIL compliance endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as beneficiary to get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as beneficiary (using email)
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "robert.martin@email.fr", "password": "demo123"}
        )
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.user = data.get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")

    # ==================== SECURITY HEADERS TESTS ====================
    def test_security_headers_present(self):
        """Test security headers are present on API responses"""
        response = self.session.get(f"{BASE_URL}/api/legal/privacy-policy")
        
        # Check security headers
        assert response.headers.get("X-Content-Type-Options") == "nosniff", "X-Content-Type-Options header missing"
        assert response.headers.get("X-Frame-Options") == "DENY", "X-Frame-Options header missing"
        assert "max-age" in response.headers.get("Strict-Transport-Security", ""), "Strict-Transport-Security header missing"
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin", "Referrer-Policy header missing"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block", "X-XSS-Protection header missing"
        print("SUCCESS: All security headers present and correct")

    # ==================== LEGAL DOCUMENTS TESTS ====================
    def test_get_privacy_policy(self):
        """Test GET /api/legal/privacy-policy returns privacy policy content"""
        response = self.session.get(f"{BASE_URL}/api/legal/privacy-policy")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "content" in data, "Response should have 'content' field"
        assert len(data["content"]) > 100, "Privacy policy content should be substantial"
        assert "POLITIQUE DE CONFIDENTIALITE" in data["content"], "Should contain privacy policy title"
        assert "contact@chutex-innovation.com" in data["content"], "Should contain DPO email"
        assert "RGPD" in data["content"], "Should mention RGPD"
        print(f"SUCCESS: Privacy policy returned with {len(data['content'])} characters")

    def test_get_cgu(self):
        """Test GET /api/legal/cgu returns CGU text"""
        response = self.session.get(f"{BASE_URL}/api/legal/cgu")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "content" in data, "Response should have 'content' field"
        assert len(data["content"]) > 100, "CGU content should be substantial"
        assert "CONDITIONS GENERALES" in data["content"], "Should contain CGU title"
        assert "Chutex Innovation" in data["content"], "Should mention company name"
        print(f"SUCCESS: CGU returned with {len(data['content'])} characters")

    def test_get_legal_mentions(self):
        """Test GET /api/legal/mentions returns legal mentions text"""
        response = self.session.get(f"{BASE_URL}/api/legal/mentions")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "content" in data, "Response should have 'content' field"
        assert len(data["content"]) > 100, "Legal mentions content should be substantial"
        assert "MENTIONS LEGALES" in data["content"], "Should contain legal mentions title"
        assert "EDITEUR" in data["content"], "Should contain EDITEUR section"
        print(f"SUCCESS: Legal mentions returned with {len(data['content'])} characters")

    # ==================== RGPD REQUEST TESTS ====================
    def test_rgpd_request_access(self):
        """Test POST /api/rgpd/request with right_type='access' returns status:sent with request_id"""
        response = self.session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "access", "message": "TEST - Please provide my data copy"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "sent", f"Expected status 'sent', got {data.get('status')}"
        assert "request_id" in data, "Response should contain request_id"
        assert len(data["request_id"]) > 0, "request_id should not be empty"
        print(f"SUCCESS: RGPD access request sent, request_id: {data['request_id']}")

    def test_rgpd_request_deletion(self):
        """Test POST /api/rgpd/request with right_type='deletion' works"""
        response = self.session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "deletion", "message": "TEST - Deletion request"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "sent", f"Expected status 'sent', got {data.get('status')}"
        assert "request_id" in data, "Response should contain request_id"
        print(f"SUCCESS: RGPD deletion request sent, request_id: {data['request_id']}")

    def test_rgpd_request_opposition(self):
        """Test POST /api/rgpd/request with right_type='opposition' works"""
        response = self.session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "opposition", "message": "TEST - Opposition request"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "sent", f"Expected status 'sent', got {data.get('status')}"
        assert "request_id" in data, "Response should contain request_id"
        print(f"SUCCESS: RGPD opposition request sent, request_id: {data['request_id']}")

    def test_rgpd_request_portability(self):
        """Test POST /api/rgpd/request with right_type='portability' works"""
        response = self.session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "portability", "message": "TEST - Portability request"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "sent", f"Expected status 'sent', got {data.get('status')}"
        assert "request_id" in data, "Response should contain request_id"
        print(f"SUCCESS: RGPD portability request sent, request_id: {data['request_id']}")

    def test_get_rgpd_requests(self):
        """Test GET /api/rgpd/requests returns list of user's RGPD requests"""
        # First make a request to ensure there's at least one
        self.session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "access", "message": "TEST - for listing"}
        )
        
        response = self.session.get(f"{BASE_URL}/api/rgpd/requests")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one RGPD request"
        
        # Check structure of first request
        first_req = data[0]
        assert "id" in first_req, "Request should have id"
        assert "right_type" in first_req, "Request should have right_type"
        assert "created_at" in first_req, "Request should have created_at"
        print(f"SUCCESS: Retrieved {len(data)} RGPD requests")

    # ==================== CONSENT TESTS ====================
    def test_consent_update_privacy_policy(self):
        """Test POST /api/consent/update with consent_type='privacy_policy' works"""
        response = self.session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "privacy_policy", "accepted": True}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "updated", f"Expected status 'updated', got {data.get('status')}"
        print("SUCCESS: Privacy policy consent updated")

    def test_consent_update_cgu(self):
        """Test POST /api/consent/update with consent_type='cgu' works"""
        response = self.session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "cgu", "accepted": True}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "updated", f"Expected status 'updated', got {data.get('status')}"
        print("SUCCESS: CGU consent updated")

    def test_consent_update_health_data(self):
        """Test POST /api/consent/update with consent_type='health_data' works"""
        response = self.session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "health_data", "accepted": True}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "updated", f"Expected status 'updated', got {data.get('status')}"
        print("SUCCESS: Health data consent updated")

    def test_get_consent_status(self):
        """Test GET /api/consent/status returns consent data"""
        # First set some consents
        self.session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "privacy_policy", "accepted": True}
        )
        self.session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "cgu", "accepted": True}
        )
        
        response = self.session.get(f"{BASE_URL}/api/consent/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        
        # Check if we have the consents we set
        if "privacy_policy" in data:
            assert "accepted" in data["privacy_policy"], "Should have accepted field"
            assert "updated_at" in data["privacy_policy"], "Should have updated_at field"
        print(f"SUCCESS: Retrieved consent status with {len(data)} consent types")

    # ==================== UNAUTHORIZED TESTS ====================
    def test_rgpd_request_requires_auth(self):
        """Test RGPD request endpoints require authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        response = unauth_session.post(
            f"{BASE_URL}/api/rgpd/request",
            json={"right_type": "access", "message": "test"}
        )
        
        # Should return 401 or 403
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("SUCCESS: RGPD request endpoint correctly requires authentication")

    def test_consent_update_requires_auth(self):
        """Test consent update endpoint requires authentication"""
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        response = unauth_session.post(
            f"{BASE_URL}/api/consent/update",
            json={"consent_type": "privacy_policy", "accepted": True}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("SUCCESS: Consent update endpoint correctly requires authentication")


class TestSecurityHeadersWithoutAuth:
    """Test security headers are present even without authentication"""
    
    def test_security_headers_on_legal_endpoints(self):
        """Test security headers on public legal endpoints"""
        session = requests.Session()
        
        endpoints = [
            "/api/legal/privacy-policy",
            "/api/legal/cgu", 
            "/api/legal/mentions"
        ]
        
        for endpoint in endpoints:
            response = session.get(f"{BASE_URL}{endpoint}")
            
            assert response.headers.get("X-Content-Type-Options") == "nosniff", f"{endpoint}: X-Content-Type-Options missing"
            assert response.headers.get("X-Frame-Options") == "DENY", f"{endpoint}: X-Frame-Options missing"
            assert "max-age" in response.headers.get("Strict-Transport-Security", ""), f"{endpoint}: HSTS missing"
            print(f"SUCCESS: Security headers present on {endpoint}")
