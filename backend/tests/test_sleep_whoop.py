"""
Test suite for WHOOP-inspired sleep analysis endpoints
Tests /api/health/sleep/analysis and /api/health/sleep/history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://exercise-params.preview.emergentagent.com').rstrip('/')


class TestSleepAnalysisAPI:
    """Tests for /api/health/sleep/analysis endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_sleep_analysis_returns_200(self):
        """Test that sleep analysis endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_sleep_analysis_has_required_fields(self):
        """Test that sleep analysis response contains all WHOOP metrics"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check has_data flag
        assert "has_data" in data, "Missing has_data field"
        
        if data["has_data"]:
            # Check performance score
            assert "performance_score" in data, "Missing performance_score"
            assert isinstance(data["performance_score"], int), "performance_score should be int"
            assert 0 <= data["performance_score"] <= 100, "performance_score should be 0-100"
            
            # Check sufficiency
            assert "sufficiency" in data, "Missing sufficiency"
            assert "score" in data["sufficiency"], "Missing sufficiency.score"
            assert "actual_min" in data["sufficiency"], "Missing sufficiency.actual_min"
            assert "need_min" in data["sufficiency"], "Missing sufficiency.need_min"
            
            # Check consistency
            assert "consistency" in data, "Missing consistency"
            assert "score" in data["consistency"], "Missing consistency.score"
            assert "detail" in data["consistency"], "Missing consistency.detail"
            
            # Check efficiency
            assert "efficiency" in data, "Missing efficiency"
            assert "score" in data["efficiency"], "Missing efficiency.score"
            assert "pct" in data["efficiency"], "Missing efficiency.pct"
            
            # Check sleep_stress
            assert "sleep_stress" in data, "Missing sleep_stress"
            assert "score" in data["sleep_stress"], "Missing sleep_stress.score"
            assert "level" in data["sleep_stress"], "Missing sleep_stress.level"
            
            # Check recovery
            assert "recovery" in data, "Missing recovery"
            assert "score" in data["recovery"], "Missing recovery.score"
            assert "zone" in data["recovery"], "Missing recovery.zone"
            assert "hrv" in data["recovery"], "Missing recovery.hrv"
            assert "rhr" in data["recovery"], "Missing recovery.rhr"
            
            # Check weekly_trend
            assert "weekly_trend" in data, "Missing weekly_trend"
            assert isinstance(data["weekly_trend"], list), "weekly_trend should be list"
            
            # Check sleep_need_min
            assert "sleep_need_min" in data, "Missing sleep_need_min"
            
            # Check recommended_bedtime
            assert "recommended_bedtime" in data, "Missing recommended_bedtime"
    
    def test_sleep_analysis_performance_score_calculation(self):
        """Test that performance score is calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["has_data"]:
            perf = data["performance_score"]
            suff = data["sufficiency"]["score"]
            cons = data["consistency"]["score"]
            eff = data["efficiency"]["score"]
            stress = data["sleep_stress"]["score"]
            
            # Performance = 40% sufficiency + 20% consistency + 25% efficiency + 15% stress
            expected = round(suff * 0.40 + cons * 0.20 + eff * 0.25 + stress * 0.15)
            assert abs(perf - expected) <= 1, f"Performance score mismatch: {perf} vs expected {expected}"
    
    def test_sleep_analysis_recovery_zone(self):
        """Test that recovery zone is correctly assigned"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["has_data"]:
            score = data["recovery"]["score"]
            zone = data["recovery"]["zone"]
            
            if score >= 67:
                assert zone == "green", f"Score {score} should be green zone"
            elif score >= 34:
                assert zone == "yellow", f"Score {score} should be yellow zone"
            else:
                assert zone == "red", f"Score {score} should be red zone"


class TestSleepHistoryAPI:
    """Tests for /api/health/sleep/history endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_sleep_history_returns_200(self):
        """Test that sleep history endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_sleep_history_returns_list(self):
        """Test that sleep history returns a list"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_sleep_history_has_required_fields(self):
        """Test that each sleep history entry has required fields"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            entry = data[0]
            required_fields = ["date", "duration", "deep", "light", "rem", "awake", "quality", "cycles"]
            for field in required_fields:
                assert field in entry, f"Missing field: {field}"
    
    def test_sleep_history_max_7_days(self):
        """Test that sleep history returns at most 7 days"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 7, f"Expected max 7 days, got {len(data)}"
    
    def test_sleep_history_sorted_by_date(self):
        """Test that sleep history is sorted by date ascending"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            dates = [entry["date"] for entry in data]
            assert dates == sorted(dates), "History should be sorted by date ascending"


class TestSleepAPIAuthentication:
    """Tests for authentication on sleep endpoints"""
    
    def test_sleep_analysis_requires_auth(self):
        """Test that sleep analysis requires authentication"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_sleep_history_requires_auth(self):
        """Test that sleep history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_sleep_analysis_invalid_token(self):
        """Test that invalid token is rejected"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=headers)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
