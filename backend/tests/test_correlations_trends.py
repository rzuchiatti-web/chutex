"""
Test suite for /api/health/correlations/trends endpoint and correlations regression
Iteration 132 - Weekly correlation trends feature

Tests:
- Auth required (401 without token)
- Trends endpoint returns expected structure
- Correlations endpoint regression
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials (beneficiary user with data)
TEST_PHONE = "0651245918"
TEST_PASSWORD = "test123"


class TestAuth:
    """Authentication helper"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for beneficiary user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.fail(f"Login failed: {response.status_code} - {response.text}")


class TestCorrelationsTrendsNoAuth:
    """Test /api/health/correlations/trends without authentication"""
    
    def test_trends_requires_auth(self):
        """GET /api/health/correlations/trends should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/correlations/trends")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Trends endpoint requires auth (401)")


class TestCorrelationsTrendsWithAuth(TestAuth):
    """Test /api/health/correlations/trends with authentication"""
    
    def test_trends_endpoint_returns_data(self, auth_token):
        """GET /api/health/correlations/trends with auth returns trends structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations/trends",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify base structure
        assert "trends" in data, "Response missing 'trends' field"
        assert "weeks" in data, "Response missing 'weeks' field"
        assert "no_data" in data, "Response missing 'no_data' field"
        
        print(f"✓ Trends endpoint returns 200 with structure")
        print(f"  - weeks: {data.get('weeks')}")
        print(f"  - trends count: {len(data.get('trends', []))}")
        print(f"  - no_data: {data.get('no_data')}")
        
        return data
    
    def test_trends_structure_when_data_exists(self, auth_token):
        """If trends data exists, verify structure of trend items"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations/trends",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # If no_data is true, skip trend item validation
        if data.get("no_data", True):
            print("⚠ No trend data available (no_data=true) - skipping trend item validation")
            assert "message" in data or data.get("trends") == [], "Expected message or empty trends when no_data"
            return
        
        # Verify week_labels exists when data is present
        assert "week_labels" in data, "Response missing 'week_labels' when no_data=false"
        print(f"✓ week_labels present: {data.get('week_labels')}")
        
        # Validate trend items
        trends = data.get("trends", [])
        assert len(trends) > 0, "Expected at least one trend when no_data=false"
        
        required_fields = [
            "pair_key", "label", "category", "sparkline", "current_strength",
            "delta_pct", "direction", "direction_label", "direction_color", "weeks_tracked"
        ]
        
        for i, trend in enumerate(trends):
            for field in required_fields:
                assert field in trend, f"Trend item {i} missing field: {field}"
            
            # Validate direction values
            assert trend["direction"] in ["up", "down", "stable"], \
                f"Invalid direction: {trend['direction']}"
            
            # Validate sparkline is array
            assert isinstance(trend["sparkline"], list), \
                f"Sparkline should be array, got {type(trend['sparkline'])}"
            
            # Sparkline values should be numbers or null
            for val in trend["sparkline"]:
                assert val is None or isinstance(val, (int, float)), \
                    f"Sparkline value should be number or null, got {type(val)}"
            
            print(f"  ✓ Trend {i}: {trend['label']} - {trend['direction_label']} ({trend['delta_pct']}%)")
        
        print(f"✓ All {len(trends)} trend items have valid structure")


class TestCorrelationsRegression(TestAuth):
    """Regression test: /api/health/correlations should still work"""
    
    def test_correlations_requires_auth(self):
        """GET /api/health/correlations should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/correlations")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Correlations endpoint requires auth (401)")
    
    def test_correlations_returns_data(self, auth_token):
        """GET /api/health/correlations with auth returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify base structure
        assert "correlations" in data, "Response missing 'correlations' field"
        assert "insights" in data, "Response missing 'insights' field"
        assert "no_data" in data, "Response missing 'no_data' field"
        
        if not data.get("no_data"):
            assert "period_days" in data, "Response missing 'period_days' field"
            assert "total_readings" in data, "Response missing 'total_readings' field"
        
        print(f"✓ Correlations endpoint returns 200 with valid structure")
        print(f"  - correlations count: {len(data.get('correlations', []))}")
        print(f"  - insights count: {len(data.get('insights', []))}")
        print(f"  - no_data: {data.get('no_data')}")
        
        return data


class TestTrendsDirectionValues:
    """Test that direction values and colors are consistent"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for beneficiary user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_PHONE, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Login failed - skipping direction tests")
    
    def test_direction_color_mapping(self, auth_token):
        """Verify direction fields map to correct labels and colors"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations/trends",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code != 200:
            pytest.skip("Trends endpoint not available")
        
        data = response.json()
        if data.get("no_data", True):
            pytest.skip("No trend data - skipping direction validation")
        
        expected_mapping = {
            "up": {"label": "Renforce", "color": "#10B981"},
            "down": {"label": "Affaibli", "color": "#F59E0B"},
            "stable": {"label": "Stable", "color": "#6B7280"},
        }
        
        for trend in data.get("trends", []):
            direction = trend["direction"]
            expected = expected_mapping.get(direction)
            if expected:
                assert trend["direction_label"] == expected["label"], \
                    f"Direction '{direction}' should have label '{expected['label']}', got '{trend['direction_label']}'"
                assert trend["direction_color"] == expected["color"], \
                    f"Direction '{direction}' should have color '{expected['color']}', got '{trend['direction_color']}'"
                print(f"  ✓ Direction '{direction}' → {trend['direction_label']} ({trend['direction_color']})")
        
        print("✓ All direction mappings correct")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
