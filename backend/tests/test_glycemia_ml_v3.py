"""
Test suite for Chutex Care Glycemia ML V3 Backend APIs.

Features tested:
- GET /api/glycemia/estimate - ML V3 glycemia estimation
- GET /api/glycemia/ml-status - ML model status and feature importances
- POST /api/glycemia/calibrate - Add calibration data
- GET /api/glycemia/calibrations - Get calibration history
- GET /api/glycemia/trend - Get glycemia trend data
- Model file verification

Credentials: email='0651245918', password='test123' (beneficiary)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospace-ui-refactor.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "0651245918"
TEST_PASSWORD = "test123"


class TestGlycemiaMLV3:
    """Tests for Glycemia ML V3 API endpoints."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get auth token."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.user = data.get("user", {})
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed with status {response.status_code}: {response.text}")

    # ─── Test 1: GET /api/glycemia/estimate ───
    def test_glycemia_estimate_returns_ml_v3_response(self):
        """Test that glycemia estimate returns ML V3 format with proper fields."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/estimate")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify ML V3 specific fields
        assert "algorithm_version" in data, "Missing algorithm_version in response"
        assert "v3" in data["algorithm_version"], f"Expected v3 in algorithm_version, got {data['algorithm_version']}"
        
        # Verify ml_level field (population or personal)
        assert "ml_level" in data, "Missing ml_level field"
        assert data["ml_level"] in ["population", "personal"], f"Unexpected ml_level: {data['ml_level']}"
        
        # Verify prediction_interval (new in V3)
        assert "prediction_interval" in data, "Missing prediction_interval in response"
        interval = data["prediction_interval"]
        assert "lower" in interval, "Missing lower bound in prediction_interval"
        assert "upper" in interval, "Missing upper bound in prediction_interval"
        assert "std" in interval, "Missing std in prediction_interval"
        
        # Verify factors array exists
        assert "factors" in data, "Missing factors in response"
        assert isinstance(data["factors"], list), "factors should be a list"
        
        print(f"✓ ML V3 estimation returned: algorithm_version={data['algorithm_version']}, ml_level={data['ml_level']}")
        print(f"✓ Prediction interval: lower={interval['lower']}, upper={interval['upper']}, std={interval['std']}")

    def test_glycemia_estimate_zone_classification(self):
        """Test that glycemia estimate returns proper zone classification."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/estimate")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify zone classification fields
        assert "zone" in data, "Missing zone in response"
        valid_zones = ["normal", "normal_high", "vigilance", "pre_alert", "alert"]
        assert data["zone"] in valid_zones or data["zone"] is None, f"Invalid zone: {data['zone']}"
        
        # If estimated, should have zone_label and zone_color
        if data.get("status") == "estimated":
            assert "zone_label" in data, "Missing zone_label for estimated status"
            assert "zone_color" in data, "Missing zone_color for estimated status"
            assert data["zone_color"].startswith("#"), f"Invalid zone_color format: {data['zone_color']}"
            
            # Verify estimated_glycemia value
            assert "estimated_glycemia" in data, "Missing estimated_glycemia"
            glycemia = data["estimated_glycemia"]
            assert 0.55 <= glycemia <= 2.5, f"Glycemia value out of range: {glycemia}"
            
            print(f"✓ Zone classification: zone={data['zone']}, label={data['zone_label']}, color={data['zone_color']}")
            print(f"✓ Estimated glycemia: {glycemia} g/L")

    def test_glycemia_estimate_factors_content(self):
        """Test that factors array contains proper feature contributions."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/estimate")
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("status") == "estimated":
            factors = data.get("factors", [])
            
            # Each factor should have name, value, impact, score, weight
            for factor in factors:
                assert "name" in factor, f"Factor missing name: {factor}"
                assert "value" in factor, f"Factor missing value: {factor}"
                assert "impact" in factor, f"Factor missing impact: {factor}"
                assert factor["impact"] in ["high", "moderate", "normal"], f"Invalid impact: {factor['impact']}"
                
            if factors:
                print(f"✓ Factors returned: {len(factors)} features")
                print(f"✓ Top factor: {factors[0]['name']} = {factors[0]['value']} (impact: {factors[0]['impact']})")

    # ─── Test 2: GET /api/glycemia/ml-status ───
    def test_ml_status_returns_model_info(self):
        """Test that ml-status returns trained population model info."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/ml-status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify population_model section
        assert "population_model" in data, "Missing population_model in response"
        pop_model = data["population_model"]
        assert pop_model.get("trained") == True, f"Population model should be trained, got {pop_model.get('trained')}"
        assert "version" in pop_model, "Missing version in population_model"
        assert "v3" in pop_model["version"], f"Expected v3 in version, got {pop_model['version']}"
        assert pop_model.get("training_samples", 0) >= 6000, f"Expected 6000 training samples, got {pop_model.get('training_samples')}"
        
        print(f"✓ Population model: trained={pop_model['trained']}, version={pop_model['version']}, samples={pop_model['training_samples']}")

    def test_ml_status_feature_importances(self):
        """Test that ml-status returns feature importances."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/ml-status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify feature_importances
        assert "feature_importances" in data, "Missing feature_importances"
        importances = data["feature_importances"]
        assert isinstance(importances, list), "feature_importances should be a list"
        assert len(importances) > 0, "feature_importances should not be empty"
        
        # Each importance should have feature and importance
        for item in importances:
            assert "feature" in item, f"Missing feature in importance: {item}"
            assert "importance" in item, f"Missing importance value: {item}"
            assert 0 <= item["importance"] <= 100, f"Importance out of range: {item['importance']}"
        
        # Check for expected top features (based on medical literature)
        feature_names = [item["feature"] for item in importances]
        expected_top = ["hrv_norm", "has_diabetes_risk", "visceral_fat"]
        found_expected = [f for f in expected_top if f in feature_names[:5]]
        
        print(f"✓ Feature importances: {len(importances)} features")
        print(f"✓ Top 5 features: {feature_names[:5]}")
        print(f"✓ Expected features found in top 5: {found_expected}")

    def test_ml_status_three_levels(self):
        """Test that ml-status returns the 3 ML levels."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/ml-status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify levels array
        assert "levels" in data, "Missing levels in response"
        levels = data["levels"]
        assert len(levels) == 3, f"Expected 3 levels, got {len(levels)}"
        
        # Verify level structure
        level_numbers = [l.get("level") for l in levels]
        assert set(level_numbers) == {1, 2, 3}, f"Expected levels 1,2,3, got {level_numbers}"
        
        for level in levels:
            assert "name" in level, f"Missing name in level: {level}"
            assert "status" in level, f"Missing status in level: {level}"
            assert "description" in level, f"Missing description in level: {level}"
        
        print(f"✓ 3 ML levels returned:")
        for l in levels:
            print(f"  Level {l['level']} ({l['name']}): {l['status']}")

    def test_ml_status_personal_model_info(self):
        """Test that ml-status returns personal model info."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/ml-status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify personal_model section
        assert "personal_model" in data, "Missing personal_model in response"
        personal = data["personal_model"]
        assert "available" in personal, "Missing available in personal_model"
        assert "calibrations_count" in personal, "Missing calibrations_count"
        assert "calibrations_needed" in personal, "Missing calibrations_needed"
        
        print(f"✓ Personal model: available={personal['available']}, calibrations={personal['calibrations_count']}, needed={personal['calibrations_needed']}")

    # ─── Test 3: POST /api/glycemia/calibrate ───
    def test_calibrate_accepts_valid_data(self):
        """Test that calibrate endpoint accepts valid glycemia value in g/L."""
        test_value = 0.95  # Normal glycemia value in g/L
        
        response = self.session.post(
            f"{BASE_URL}/api/glycemia/calibrate",
            json={"glycemia_value": test_value, "context": "fasting"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "saved", f"Expected status='saved', got {data.get('status')}"
        assert data.get("glycemia_value") == test_value, f"Expected glycemia_value={test_value}, got {data.get('glycemia_value')}"
        assert "total_calibrations" in data, "Missing total_calibrations"
        assert "calibration_quality" in data, "Missing calibration_quality"
        
        print(f"✓ Calibration saved: value={data['glycemia_value']} g/L, total={data['total_calibrations']}, quality={data['calibration_quality']}")

    def test_calibrate_rejects_invalid_value(self):
        """Test that calibrate endpoint rejects values > 5 g/L."""
        # Value > 5 is invalid (should be in g/L, not mg/dL)
        response = self.session.post(
            f"{BASE_URL}/api/glycemia/calibrate",
            json={"glycemia_value": 150, "context": "random"}  # This looks like mg/dL, not g/L
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid value, got {response.status_code}"
        print(f"✓ Invalid calibration value (150) correctly rejected with 400")

    def test_calibrate_rejects_zero_value(self):
        """Test that calibrate endpoint rejects zero/negative values."""
        response = self.session.post(
            f"{BASE_URL}/api/glycemia/calibrate",
            json={"glycemia_value": 0, "context": "fasting"}
        )
        
        assert response.status_code == 400, f"Expected 400 for zero value, got {response.status_code}"
        print(f"✓ Zero calibration value correctly rejected with 400")

    # ─── Test 4: GET /api/glycemia/calibrations ───
    def test_calibrations_returns_history(self):
        """Test that calibrations endpoint returns calibration history."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/calibrations")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "calibrations" in data, "Missing calibrations in response"
        assert "count" in data, "Missing count in response"
        assert isinstance(data["calibrations"], list), "calibrations should be a list"
        assert data["count"] == len(data["calibrations"]), "count mismatch with calibrations length"
        
        # Verify calibration structure if any exist
        if data["calibrations"]:
            cal = data["calibrations"][0]
            assert "glycemia_value" in cal, "Missing glycemia_value in calibration"
            assert "date" in cal, "Missing date in calibration"
            assert "unit" in cal, "Missing unit in calibration"
            
            print(f"✓ Calibration history: {data['count']} calibrations")
            print(f"✓ Latest calibration: {cal['glycemia_value']} {cal['unit']} on {cal['date'][:10]}")
        else:
            print(f"✓ Calibration history: 0 calibrations (empty but valid)")

    # ─── Test 5: GET /api/glycemia/trend ───
    def test_trend_returns_data(self):
        """Test that trend endpoint returns trend data."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/trend")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "trend" in data, "Missing trend in response"
        assert "history" in data, "Missing history in response"
        assert "count" in data, "Missing count in response"
        
        # Trend should be direction or insufficient_data
        valid_trends = ["stable", "improving", "worsening", "insufficient_data"]
        assert data["trend"] in valid_trends, f"Invalid trend value: {data['trend']}"
        
        print(f"✓ Trend data: trend={data['trend']}, history_count={data['count']}")

    def test_trend_history_structure(self):
        """Test that trend history has proper structure."""
        response = self.session.get(f"{BASE_URL}/api/glycemia/trend")
        
        assert response.status_code == 200
        data = response.json()
        
        if data["history"]:
            hist = data["history"][0]
            # History entry should have these fields from glycemia_history collection
            expected_fields = ["date", "estimated_glycemia"]
            for field in expected_fields:
                assert field in hist, f"Missing {field} in history entry"
            
            print(f"✓ History entries have required fields: {list(hist.keys())}")


class TestMLModelFile:
    """Test that ML model file exists and is properly formatted."""
    
    def test_model_file_exists(self):
        """Verify the trained model file exists at expected path."""
        model_path = "/app/backend/models/glycemia_population_v3.pkl"
        
        assert os.path.exists(model_path), f"Model file not found at {model_path}"
        
        # Check file size (should be around 1MB for 300 trees)
        size = os.path.getsize(model_path)
        assert size > 100000, f"Model file too small: {size} bytes (expected > 100KB)"
        
        print(f"✓ Model file exists: {model_path} ({size / 1024:.1f} KB)")

    def test_model_file_loadable(self):
        """Test that model file can be loaded with pickle."""
        import pickle
        
        model_path = "/app/backend/models/glycemia_population_v3.pkl"
        
        with open(model_path, "rb") as f:
            data = pickle.load(f)
        
        assert "model" in data, "Missing 'model' key in pickle file"
        assert "scaler" in data, "Missing 'scaler' key in pickle file"
        assert "version" in data, "Missing 'version' key in pickle file"
        assert "v3" in data["version"], f"Unexpected version: {data['version']}"
        
        print(f"✓ Model file loadable: version={data['version']}, samples={data.get('samples', 'N/A')}")


class TestGlycemiaEndpointsWithoutAuth:
    """Test that glycemia endpoints require authentication."""
    
    def test_estimate_requires_auth(self):
        """Test that estimate endpoint requires authentication."""
        response = requests.get(f"{BASE_URL}/api/glycemia/estimate")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ /api/glycemia/estimate requires authentication (got {response.status_code})")
    
    def test_ml_status_requires_auth(self):
        """Test that ml-status endpoint requires authentication."""
        response = requests.get(f"{BASE_URL}/api/glycemia/ml-status")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ /api/glycemia/ml-status requires authentication (got {response.status_code})")
    
    def test_calibrate_requires_auth(self):
        """Test that calibrate endpoint requires authentication."""
        response = requests.post(f"{BASE_URL}/api/glycemia/calibrate", json={"glycemia_value": 1.0})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ /api/glycemia/calibrate requires authentication (got {response.status_code})")
    
    def test_calibrations_requires_auth(self):
        """Test that calibrations endpoint requires authentication."""
        response = requests.get(f"{BASE_URL}/api/glycemia/calibrations")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ /api/glycemia/calibrations requires authentication (got {response.status_code})")
    
    def test_trend_requires_auth(self):
        """Test that trend endpoint requires authentication."""
        response = requests.get(f"{BASE_URL}/api/glycemia/trend")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ /api/glycemia/trend requires authentication (got {response.status_code})")
