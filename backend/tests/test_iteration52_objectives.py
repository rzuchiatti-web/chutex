"""
Iteration 52 - Objectives vs Thresholds Testing
Testing:
1. GET /api/health/metric-history/steps returns graph_type=bars
2. POST /api/health/thresholds with goal field works
3. GET /api/health/thresholds/steps returns goal field
4. Verify metric-history for activity metrics (steps, calories, stress_level, etc.)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMetricHistory:
    """Tests for metric-history endpoint with graph_type validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as beneficiary
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_steps_metric_history_has_bars_graph_type(self):
        """Test /api/health/metric-history/steps returns graph_type=bars"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/steps?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "meta" in data, "Response should have 'meta'"
        assert "history" in data, "Response should have 'history'"
        
        # Verify graph_type is bars for steps
        meta = data["meta"]
        assert meta.get("graph_type") == "bars", f"Expected graph_type='bars', got '{meta.get('graph_type')}'"
        assert meta.get("title") == "Nombre de pas", f"Expected title='Nombre de pas', got '{meta.get('title')}'"
        print(f"PASS: steps metric-history has graph_type=bars")
    
    def test_calories_metric_history_has_bars_graph_type(self):
        """Test /api/health/metric-history/calories returns graph_type=bars"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/calories?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        meta = data["meta"]
        assert meta.get("graph_type") == "bars", f"Expected graph_type='bars', got '{meta.get('graph_type')}'"
        print(f"PASS: calories metric-history has graph_type=bars")
    
    def test_stress_level_metric_history_has_area_gradient(self):
        """Test /api/health/metric-history/stress_level returns graph_type=area_gradient"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/stress_level?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        meta = data["meta"]
        assert meta.get("graph_type") == "area_gradient", f"Expected graph_type='area_gradient', got '{meta.get('graph_type')}'"
        print(f"PASS: stress_level metric-history has graph_type=area_gradient")
    
    def test_recovery_score_metric_history_has_area_gradient(self):
        """Test /api/health/metric-history/recovery_score returns graph_type=area_gradient"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/recovery_score?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        meta = data["meta"]
        assert meta.get("graph_type") == "area_gradient", f"Expected graph_type='area_gradient', got '{meta.get('graph_type')}'"
        print(f"PASS: recovery_score metric-history has graph_type=area_gradient")
    
    def test_heart_rate_metric_history_has_ecg(self):
        """Test /api/health/metric-history/heart_rate returns graph_type=ecg (for thresholds, not objectives)"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/heart_rate?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        meta = data["meta"]
        assert meta.get("graph_type") == "ecg", f"Expected graph_type='ecg', got '{meta.get('graph_type')}'"
        print(f"PASS: heart_rate metric-history has graph_type=ecg")


class TestThresholdsWithGoal:
    """Tests for thresholds endpoint with goal field support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Login as beneficiary
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_post_threshold_with_goal_field(self):
        """Test POST /api/health/thresholds with goal field"""
        payload = {
            "metric_id": "steps",
            "goal": 8000,
            "max_val": 8000
        }
        response = requests.post(
            f"{BASE_URL}/api/health/thresholds",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("status") == "saved", f"Expected status='saved', got '{data}'"
        print(f"PASS: POST /api/health/thresholds with goal=8000 saved successfully")
    
    def test_get_threshold_returns_goal_field(self):
        """Test GET /api/health/thresholds/steps returns goal field"""
        # First set a goal
        requests.post(
            f"{BASE_URL}/api/health/thresholds",
            json={"metric_id": "steps", "goal": 7500, "max_val": 7500},
            headers=self.headers
        )
        
        # Now get it back
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/steps",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure includes goal field
        assert "metric_id" in data, "Response should have 'metric_id'"
        assert "goal" in data, "Response should have 'goal' field"
        assert data.get("goal") == 7500, f"Expected goal=7500, got '{data.get('goal')}'"
        print(f"PASS: GET /api/health/thresholds/steps returns goal={data.get('goal')}")
    
    def test_post_threshold_for_calories_with_goal(self):
        """Test POST /api/health/thresholds for calories with goal"""
        payload = {
            "metric_id": "calories",
            "goal": 350,
            "max_val": 350
        }
        response = requests.post(
            f"{BASE_URL}/api/health/thresholds",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify it's saved
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/calories",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("goal") == 350, f"Expected goal=350, got '{data.get('goal')}'"
        print(f"PASS: calories threshold with goal=350 saved and retrieved")
    
    def test_post_threshold_for_stress_level_with_goal(self):
        """Test POST /api/health/thresholds for stress_level with goal (lower is better)"""
        payload = {
            "metric_id": "stress_level",
            "goal": 35,
            "max_val": 35
        }
        response = requests.post(
            f"{BASE_URL}/api/health/thresholds",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify it's saved
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/stress_level",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("goal") == 35, f"Expected goal=35, got '{data.get('goal')}'"
        print(f"PASS: stress_level threshold with goal=35 saved and retrieved")
    
    def test_post_health_threshold_for_heart_rate_min_max(self):
        """Test POST /api/health/thresholds for heart_rate with min_val/max_val (classic thresholds)"""
        payload = {
            "metric_id": "heart_rate",
            "min_val": 55,
            "max_val": 90
        }
        response = requests.post(
            f"{BASE_URL}/api/health/thresholds",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify it's saved
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/heart_rate",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("min_val") == 55, f"Expected min_val=55, got '{data.get('min_val')}'"
        assert data.get("max_val") == 90, f"Expected max_val=90, got '{data.get('max_val')}'"
        print(f"PASS: heart_rate threshold with min_val=55, max_val=90 saved and retrieved")


class TestObjectiveKeys:
    """Verify which keys are activity-based (objectives) vs health-based (thresholds)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_objective_keys_have_correct_graph_types(self):
        """Verify OBJECTIVE_KEYS have correct graph types in backend"""
        # OBJECTIVE_KEYS from metric-detail.tsx:
        # steps, calories, distance_km, stress_level, recovery_score, sleep_quality, vo2_max
        objective_metrics = {
            "steps": "bars",
            "calories": "bars",
            "distance_km": "bars",
            "stress_level": "area_gradient",
            "recovery_score": "area_gradient",
            "sleep_quality": "area_gradient",
        }
        
        for metric, expected_graph_type in objective_metrics.items():
            response = requests.get(
                f"{BASE_URL}/api/health/metric-history/{metric}?period=7j",
                headers=self.headers
            )
            assert response.status_code == 200, f"Failed for {metric}: {response.text}"
            data = response.json()
            actual = data["meta"].get("graph_type")
            assert actual == expected_graph_type, f"{metric}: Expected graph_type='{expected_graph_type}', got '{actual}'"
            print(f"PASS: {metric} has graph_type={actual}")
    
    def test_health_keys_have_correct_graph_types(self):
        """Verify health metrics (thresholds) have correct graph types"""
        health_metrics = {
            "heart_rate": "ecg",
            "spo2": "area_threshold",
            "blood_pressure": "bp_dual",
            "temperature": "smooth_curve",
        }
        
        for metric, expected_graph_type in health_metrics.items():
            response = requests.get(
                f"{BASE_URL}/api/health/metric-history/{metric}?period=7j",
                headers=self.headers
            )
            assert response.status_code == 200, f"Failed for {metric}: {response.text}"
            data = response.json()
            actual = data["meta"].get("graph_type")
            assert actual == expected_graph_type, f"{metric}: Expected graph_type='{expected_graph_type}', got '{actual}'"
            print(f"PASS: {metric} has graph_type={actual}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
