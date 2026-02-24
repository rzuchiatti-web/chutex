"""
Test iteration 44: Metric Detail Page Backend APIs
- /api/health/metric-history/{key} with period support (24h, 7j, 30j, 90j)
- Test heart_rate, bmi, and blood_pressure metrics
- Verify meta.graph_type and history array structure
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestMetricHistoryAPI:
    """Tests for /api/health/metric-history/{key} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: login as beneficiary to get token"""
        # Login with beneficiary credentials (API expects 'email' field but accepts phone)
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed with status {login_resp.status_code}")
    
    def test_heart_rate_metric_history_7j(self):
        """Test /api/health/metric-history/heart_rate?period=7j - chart metric"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/heart_rate?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "key" in data, "Response should contain 'key'"
        assert data["key"] == "heart_rate"
        
        assert "meta" in data, "Response should contain 'meta'"
        meta = data["meta"]
        assert "graph_type" in meta, "meta should contain 'graph_type'"
        assert "title" in meta
        assert "unit" in meta
        assert meta["unit"] == "bpm"
        
        assert "history" in data, "Response should contain 'history'"
        history = data["history"]
        assert isinstance(history, list)
        assert len(history) == 7, f"Expected 7 days of data, got {len(history)}"
        
        # Verify each history item
        for item in history:
            assert "date" in item
            assert "label" in item
            assert "value" in item
            assert isinstance(item["value"], (int, float))
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert "avg" in stats
        assert "min" in stats
        assert "max" in stats
        assert "trend" in stats
        
        print(f"PASS: heart_rate 7j - graph_type={meta.get('graph_type')}, {len(history)} points")
    
    def test_heart_rate_metric_history_24h(self):
        """Test /api/health/metric-history/heart_rate?period=24h - hourly data"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/heart_rate?period=24h",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        history = data.get("history", [])
        assert len(history) == 24, f"Expected 24 hourly points, got {len(history)}"
        
        # Verify hourly labels (e.g., "00h", "01h", etc.)
        first_label = history[0].get("label", "")
        assert "h" in first_label, f"Expected hourly label format, got {first_label}"
        
        print(f"PASS: heart_rate 24h - {len(history)} hourly points")
    
    def test_heart_rate_metric_history_30j(self):
        """Test /api/health/metric-history/heart_rate?period=30j"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/heart_rate?period=30j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        history = data.get("history", [])
        assert len(history) == 30, f"Expected 30 days of data, got {len(history)}"
        
        print(f"PASS: heart_rate 30j - {len(history)} points")
    
    def test_heart_rate_metric_history_90j(self):
        """Test /api/health/metric-history/heart_rate?period=90j"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/heart_rate?period=90j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        history = data.get("history", [])
        assert len(history) == 90, f"Expected 90 days of data, got {len(history)}"
        
        print(f"PASS: heart_rate 90j - {len(history)} points")
    
    def test_bmi_metric_history(self):
        """Test /api/health/metric-history/bmi?period=7j - gauge metric"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/bmi?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        assert data["key"] == "bmi"
        assert "meta" in data
        assert "history" in data
        
        history = data["history"]
        assert len(history) == 7
        
        # Verify BMI values are in reasonable range
        for item in history:
            val = item.get("value", 0)
            assert 15 < val < 50, f"BMI value {val} seems unreasonable"
        
        print(f"PASS: bmi 7j - {len(history)} points, graph_type={data['meta'].get('graph_type')}")
    
    def test_blood_pressure_metric_history(self):
        """Test /api/health/metric-history/blood_pressure?period=7j - bp_dual chart"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/blood_pressure?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        assert data["key"] == "blood_pressure"
        assert "meta" in data
        meta = data["meta"]
        assert meta.get("graph_type") == "bp_dual", f"Expected graph_type 'bp_dual', got {meta.get('graph_type')}"
        
        assert "history" in data
        history = data["history"]
        assert len(history) == 7
        
        # Verify each item has systolic and diastolic
        for item in history:
            assert "systolic" in item, f"Blood pressure item missing 'systolic': {item}"
            assert "diastolic" in item, f"Blood pressure item missing 'diastolic': {item}"
            assert 80 < item["systolic"] < 200, f"Systolic {item['systolic']} seems unreasonable"
            assert 50 < item["diastolic"] < 120, f"Diastolic {item['diastolic']} seems unreasonable"
        
        print(f"PASS: blood_pressure 7j - {len(history)} points with systolic/diastolic fields")
    
    def test_spo2_metric_history(self):
        """Test /api/health/metric-history/spo2?period=7j"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/spo2?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "spo2"
        
        history = data["history"]
        for item in history:
            val = item.get("value", 0)
            assert 90 <= val <= 100, f"SpO2 value {val} out of expected range"
        
        print(f"PASS: spo2 7j - {len(history)} points")
    
    def test_steps_metric_history(self):
        """Test /api/health/metric-history/steps?period=7j - bars chart"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/steps?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "steps"
        assert data["meta"].get("graph_type") == "bars"
        
        history = data["history"]
        for item in history:
            val = item.get("value", 0)
            assert 0 <= val <= 50000, f"Steps value {val} out of expected range"
        
        print(f"PASS: steps 7j - {len(history)} points, graph_type=bars")
    
    def test_visceral_fat_metric_history(self):
        """Test /api/health/metric-history/visceral_fat?period=7j - gauge metric"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/visceral_fat?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "visceral_fat"
        
        print(f"PASS: visceral_fat 7j - {len(data['history'])} points")
    
    def test_unknown_metric_fallback(self):
        """Test /api/health/metric-history/unknown_metric - should return default structure"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/some_unknown_metric?period=7j",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "meta" in data
        assert "history" in data
        
        print(f"PASS: unknown metric returns default structure")


class TestThresholdsAPI:
    """Tests for threshold configuration endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: login as beneficiary to get token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "demo123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        else:
            pytest.skip(f"Login failed with status {login_resp.status_code}")
    
    def test_get_thresholds(self):
        """Test GET /api/health/thresholds/heart_rate"""
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/heart_rate",
            headers=self.headers
        )
        # May return 200 with data or 404 if not set
        assert response.status_code in [200, 404], f"Unexpected status {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: GET thresholds - found existing: {data}")
        else:
            print(f"PASS: GET thresholds - none configured (404)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
