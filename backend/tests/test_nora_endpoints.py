"""
Test Nora Unified Router Endpoints - Iteration 183
Tests the new unified /api/nora/analysis endpoint and backward compatibility wrappers
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://premium-clinic-web-1.preview.emergentagent.com')

# Test credentials
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for beneficiary user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": BENEFICIARY_PHONE, "password": BENEFICIARY_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestNoraUnifiedEndpoint:
    """Tests for the new unified /api/nora/analysis endpoint"""

    def test_nora_analysis_health_context(self, auth_headers):
        """Test GET /api/nora/analysis?context=health returns analysis"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis?context=health",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert "context" in data, "Response missing 'context' field"
        assert data["context"] == "health", f"Expected context 'health', got '{data['context']}'"
        print(f"Health analysis response: cached={data.get('cached')}, has_analysis={bool(data.get('analysis'))}")

    def test_nora_analysis_activity_context(self, auth_headers):
        """Test GET /api/nora/analysis?context=activity returns analysis"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis?context=activity",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert "context" in data, "Response missing 'context' field"
        assert data["context"] == "activity", f"Expected context 'activity', got '{data['context']}'"
        print(f"Activity analysis response: cached={data.get('cached')}, has_analysis={bool(data.get('analysis'))}")

    def test_nora_analysis_glycemia_context(self, auth_headers):
        """Test GET /api/nora/analysis?context=glycemia returns analysis"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis?context=glycemia",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert "context" in data, "Response missing 'context' field"
        assert data["context"] == "glycemia", f"Expected context 'glycemia', got '{data['context']}'"
        print(f"Glycemia analysis response: cached={data.get('cached')}, has_analysis={bool(data.get('analysis'))}")

    def test_nora_analysis_aging_context(self, auth_headers):
        """Test GET /api/nora/analysis?context=aging returns analysis"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis?context=aging",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert "context" in data, "Response missing 'context' field"
        assert data["context"] == "aging", f"Expected context 'aging', got '{data['context']}'"
        print(f"Aging analysis response: cached={data.get('cached')}, has_analysis={bool(data.get('analysis'))}")

    def test_nora_analysis_minceur_context(self, auth_headers):
        """Test GET /api/nora/analysis?context=minceur returns analysis"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis?context=minceur",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert "context" in data, "Response missing 'context' field"
        assert data["context"] == "minceur", f"Expected context 'minceur', got '{data['context']}'"
        print(f"Minceur analysis response: cached={data.get('cached')}, has_analysis={bool(data.get('analysis'))}")


class TestNoraAnalysisHistory:
    """Tests for the /api/nora/analysis-history endpoint"""

    def test_nora_analysis_history_returns_array(self, auth_headers):
        """Test GET /api/nora/analysis-history returns array of previous analyses"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis-history",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"Analysis history returned {len(data)} items")
        
        # If there are items, verify structure
        if len(data) > 0:
            item = data[0]
            assert "user_id" in item, "History item missing 'user_id'"
            assert "context" in item, "History item missing 'context'"
            assert "analysis" in item, "History item missing 'analysis'"
            assert "date" in item, "History item missing 'date'"
            print(f"First item: context={item['context']}, date={item['date']}")

    def test_nora_analysis_history_with_limit(self, auth_headers):
        """Test GET /api/nora/analysis-history?limit=5 respects limit"""
        response = requests.get(
            f"{BASE_URL}/api/nora/analysis-history?limit=5",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) <= 5, f"Expected max 5 items, got {len(data)}"
        print(f"History with limit=5 returned {len(data)} items")


class TestNoraBackwardCompatibility:
    """Tests for backward compatibility wrappers"""

    def test_nora_health_analysis_compat(self, auth_headers):
        """Test GET /api/nora/health-analysis still works (backward compat)"""
        response = requests.get(
            f"{BASE_URL}/api/nora/health-analysis",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        # Should return health context
        assert data.get("context") == "health", f"Expected context 'health', got '{data.get('context')}'"
        print(f"Backward compat /nora/health-analysis: OK, cached={data.get('cached')}")

    def test_nora_page_analysis_glycemia_compat(self, auth_headers):
        """Test GET /api/nora/page-analysis?context=glycemia still works (backward compat)"""
        response = requests.get(
            f"{BASE_URL}/api/nora/page-analysis?context=glycemia",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert data.get("context") == "glycemia", f"Expected context 'glycemia', got '{data.get('context')}'"
        print(f"Backward compat /nora/page-analysis?context=glycemia: OK, cached={data.get('cached')}")

    def test_nora_minceur_analysis_compat(self, auth_headers):
        """Test GET /api/nora/minceur-analysis still works (backward compat)"""
        response = requests.get(
            f"{BASE_URL}/api/nora/minceur-analysis",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert data.get("context") == "minceur", f"Expected context 'minceur', got '{data.get('context')}'"
        print(f"Backward compat /nora/minceur-analysis: OK, cached={data.get('cached')}")

    def test_nora_aging_analysis_compat(self, auth_headers):
        """Test GET /api/nora/aging-analysis still works (backward compat)"""
        response = requests.get(
            f"{BASE_URL}/api/nora/aging-analysis",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response missing 'analysis' field"
        assert data.get("context") == "aging", f"Expected context 'aging', got '{data.get('context')}'"
        print(f"Backward compat /nora/aging-analysis: OK, cached={data.get('cached')}")


class TestNoraUnauthorized:
    """Tests for unauthorized access"""

    def test_nora_analysis_requires_auth(self):
        """Test GET /api/nora/analysis without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/nora/analysis?context=health")
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"Unauthorized access correctly rejected with status {response.status_code}")

    def test_nora_history_requires_auth(self):
        """Test GET /api/nora/analysis-history without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/nora/analysis-history")
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"Unauthorized access correctly rejected with status {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
