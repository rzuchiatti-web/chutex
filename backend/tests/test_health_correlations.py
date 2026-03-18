"""
Test module for GET /api/health/correlations endpoint (iteration 130)

Tests:
1. Authentication protection (401 without auth)
2. Response structure validation (correlations, insights, period_days, total_readings, no_data)
3. Correlation fields validation (metric_a, metric_b, label, r, strength, strength_icon, direction, impact_pct, insight, data_points, category)
4. Correlations sorted by absolute r value (strongest first)
5. Strength field values: faible, moderee, forte, tres_forte
6. Direction field values: positive, negative
7. impact_pct between 0 and 100
8. insights array contains at most 3 elements
9. Light regression tests on key health endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")


class TestHealthCorrelations:
    """Tests for the new GET /api/health/correlations endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token before each test"""
        # Login as beneficiary (phone=0651245918, password=test123)
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        if login_response.status_code == 200:
            # Note: response has 'token' field not 'access_token'
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    def test_correlations_returns_401_without_auth(self):
        """GET /api/health/correlations returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/correlations")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASSED: GET /api/health/correlations returns 401 without auth")
    
    def test_correlations_returns_200_with_auth(self):
        """GET /api/health/correlations with valid auth returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: GET /api/health/correlations returns 200 with auth")
    
    def test_correlations_response_structure(self):
        """Verify response contains required top-level fields"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Required top-level fields
        assert "correlations" in data, "Missing 'correlations' field"
        assert "insights" in data, "Missing 'insights' field"
        assert "period_days" in data, "Missing 'period_days' field"
        assert "total_readings" in data, "Missing 'total_readings' field"
        assert "no_data" in data, "Missing 'no_data' field"
        
        # Type checks
        assert isinstance(data["correlations"], list), "'correlations' must be an array"
        assert isinstance(data["insights"], list), "'insights' must be an array"
        assert isinstance(data["period_days"], int), "'period_days' must be an integer"
        assert isinstance(data["total_readings"], int), "'total_readings' must be an integer"
        assert isinstance(data["no_data"], bool), "'no_data' must be a boolean"
        
        print(f"PASSED: Response structure valid - {len(data['correlations'])} correlations, {data['period_days']} days")
    
    def test_correlations_no_data_false_when_data_exists(self):
        """Verify no_data is false when user has device readings"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Test user (Josette) has 14 bracelet + 14 scale readings
        assert data["no_data"] == False, f"Expected no_data=False, got {data['no_data']}"
        assert data["total_readings"] > 0, "Expected total_readings > 0"
        print(f"PASSED: no_data=False with {data['total_readings']} readings over {data['period_days']} days")
    
    def test_correlation_fields_structure(self):
        """Each correlation has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "metric_a", "metric_b", "label", "r", "strength",
            "strength_icon", "direction", "impact_pct", "insight",
            "data_points", "category"
        ]
        
        assert len(data["correlations"]) > 0, "Expected at least one correlation"
        
        for i, corr in enumerate(data["correlations"]):
            for field in required_fields:
                assert field in corr, f"Correlation {i} missing '{field}' field"
            
            # Type validations
            assert isinstance(corr["metric_a"], str), f"Correlation {i}: metric_a must be string"
            assert isinstance(corr["metric_b"], str), f"Correlation {i}: metric_b must be string"
            assert isinstance(corr["label"], str), f"Correlation {i}: label must be string"
            assert isinstance(corr["r"], (int, float)), f"Correlation {i}: r must be numeric"
            assert isinstance(corr["strength"], str), f"Correlation {i}: strength must be string"
            assert isinstance(corr["strength_icon"], str), f"Correlation {i}: strength_icon must be string"
            assert isinstance(corr["direction"], str), f"Correlation {i}: direction must be string"
            assert isinstance(corr["impact_pct"], (int, float)), f"Correlation {i}: impact_pct must be numeric"
            assert isinstance(corr["insight"], str), f"Correlation {i}: insight must be string"
            assert isinstance(corr["data_points"], int), f"Correlation {i}: data_points must be integer"
            assert isinstance(corr["category"], str), f"Correlation {i}: category must be string"
        
        print(f"PASSED: All {len(data['correlations'])} correlations have valid field structure")
    
    def test_correlations_sorted_by_strength(self):
        """Correlations are sorted by absolute r value (strongest first)"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["correlations"]) < 2:
            pytest.skip("Not enough correlations to test sorting")
        
        r_values = [abs(c["r"]) for c in data["correlations"]]
        assert r_values == sorted(r_values, reverse=True), "Correlations not sorted by |r| descending"
        print(f"PASSED: Correlations sorted by strength - top r={data['correlations'][0]['r']}")
    
    def test_strength_field_valid_values(self):
        """strength field is one of: faible, moderee, forte, tres_forte"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_strengths = {"faible", "moderee", "forte", "tres_forte"}
        
        for i, corr in enumerate(data["correlations"]):
            assert corr["strength"] in valid_strengths, \
                f"Correlation {i}: invalid strength '{corr['strength']}', expected one of {valid_strengths}"
        
        strengths_found = set(c["strength"] for c in data["correlations"])
        print(f"PASSED: All strength values valid - found: {strengths_found}")
    
    def test_direction_field_valid_values(self):
        """direction field is one of: positive, negative"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        valid_directions = {"positive", "negative"}
        
        for i, corr in enumerate(data["correlations"]):
            assert corr["direction"] in valid_directions, \
                f"Correlation {i}: invalid direction '{corr['direction']}', expected one of {valid_directions}"
            # Also verify consistency with r value
            if corr["r"] > 0:
                assert corr["direction"] == "positive"
            elif corr["r"] < 0:
                assert corr["direction"] == "negative"
        
        directions_found = set(c["direction"] for c in data["correlations"])
        print(f"PASSED: All direction values valid - found: {directions_found}")
    
    def test_impact_pct_in_range(self):
        """impact_pct is between 0 and 100"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for i, corr in enumerate(data["correlations"]):
            assert 0 <= corr["impact_pct"] <= 100, \
                f"Correlation {i}: impact_pct {corr['impact_pct']} out of range [0, 100]"
        
        print(f"PASSED: All impact_pct values in [0, 100] range")
    
    def test_insights_max_3_elements(self):
        """insights array contains at most 3 elements"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["insights"]) <= 3, f"insights has {len(data['insights'])} elements, expected max 3"
        
        # Also verify insights are strings
        for i, insight in enumerate(data["insights"]):
            assert isinstance(insight, str), f"Insight {i} must be a string"
            assert len(insight) > 0, f"Insight {i} should not be empty"
        
        print(f"PASSED: {len(data['insights'])} insights (max 3)")
    
    def test_r_value_range(self):
        """r value should be between -1 and 1"""
        response = requests.get(
            f"{BASE_URL}/api/health/correlations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        for i, corr in enumerate(data["correlations"]):
            assert -1 <= corr["r"] <= 1, \
                f"Correlation {i}: r value {corr['r']} out of range [-1, 1]"
        
        print(f"PASSED: All r values in [-1, 1] range")


class TestHealthEndpointsRegression:
    """Light regression tests on key health endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "0651245918", "password": "test123"}
        )
        if login_response.status_code == 200:
            # Note: response has 'token' field not 'access_token'
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    def test_health_summary_works(self):
        """GET /api/health/summary returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/summary",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check key fields
        assert "score" in data or "no_data" in data
        assert "summary" in data or "status" in data
        print(f"PASSED: /health/summary returns score={data.get('score')}, status={data.get('status')}")
    
    def test_health_daily_report_works(self):
        """GET /api/health/daily-report returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check key fields
        assert "score" in data or "no_data" in data
        assert "subscores" in data or "status" in data
        print(f"PASSED: /health/daily-report returns score={data.get('score')}")
    
    def test_health_body_age_works(self):
        """GET /api/health/body-age returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/body-age",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # body_age endpoint returns body age or no_data state
        assert "body_age" in data or "status" in data or "no_data" in data
        print(f"PASSED: /health/body-age returns body_age={data.get('body_age')}")
    
    def test_health_aging_rate_works(self):
        """GET /api/health/aging-rate returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/aging-rate",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check V2 fields
        if not data.get("no_data"):
            assert "rate" in data
            assert "bio_age" in data or "level" in data
        print(f"PASSED: /health/aging-rate returns rate={data.get('rate')}")
    
    def test_health_sleep_works(self):
        """GET /api/health/sleep returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/sleep",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check sleep fields
        if not data.get("no_data"):
            assert "stages" in data or "sleep_quality" in data or "total_minutes" in data
        print(f"PASSED: /health/sleep returns stages/quality data")
    
    def test_health_thresholds_works(self):
        """GET /api/health/thresholds returns expected structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should return list
        assert isinstance(data, list)
        print(f"PASSED: /health/thresholds returns {len(data)} thresholds")


class TestAuthProtection:
    """Verify auth protection on health endpoints"""
    
    def test_endpoints_require_auth(self):
        """All health endpoints return 401 without auth"""
        endpoints = [
            "/api/health/correlations",
            "/api/health/summary",
            "/api/health/daily-report",
            "/api/health/body-age",
            "/api/health/aging-rate",
            "/api/health/sleep",
            "/api/health/thresholds",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, \
                f"{endpoint} returned {response.status_code}, expected 401"
        
        print(f"PASSED: All {len(endpoints)} health endpoints require auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
