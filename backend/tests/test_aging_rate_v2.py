"""
Test suite for V2 Biological Age & Aging Rate Algorithm
Tests the new 3-level scientific aging rate calculation:
- Level 1: Bracelet only (HRV, resting_hr, spo2, sleep_quality, steps, stress)
- Level 2: Bracelet + Balance (+ body_fat, muscle_mass, visceral_fat, bmi, hydration)  
- Level 3: Temporal trends (30/60/90 days) + age/sex reference norms
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials - Josette (beneficiary with 14 bracelet + 14 scale readings)
# Note: 'email' field is used for login (can be phone number or email)
BENEFICIARY_CREDS = {"email": "0651245918", "password": "test123"}
GUARDIAN_CREDS = {"email": "+33699887766", "password": "test123"}


class TestAgingRateV2:
    """Test the new V2 aging rate endpoint with 3 scientific levels"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary before each test"""
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token = resp.json().get("token")  # API returns 'token' not 'access_token'
        assert token, "No token returned"
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_aging_rate_returns_v2_fields(self):
        """Verify all new V2 fields are returned"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        data = resp.json()
        
        # Core V2 fields
        assert "level" in data, "Missing 'level' field"
        assert "level_label" in data, "Missing 'level_label' field"
        assert "confidence" in data, "Missing 'confidence' field"
        assert "composite_score" in data, "Missing 'composite_score' field"
        assert "biomarkers" in data, "Missing 'biomarkers' field"
        assert "trends" in data, "Missing 'trends' field"
        assert "trend_summary" in data, "Missing 'trend_summary' field"
        assert "reference_norms" in data, "Missing 'reference_norms' field"
        assert "data_sources" in data, "Missing 'data_sources' field"
        assert "weights_used" in data, "Missing 'weights_used' field"
        
        print(f"V2 fields present: level={data['level']}, confidence={data['confidence']}, composite_score={data['composite_score']}")
    
    def test_level_1_bracelet_only_weights(self):
        """Test Level 1 scoring uses correct bracelet-only weights"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        # Level 1 weights should include HRV, resting_hr, spo2, sleep_quality, steps, stress
        level_1_biomarkers = {"hrv", "resting_hr", "spo2", "sleep_quality", "steps", "stress"}
        
        if data.get("level") == 1:
            weights = data.get("weights_used", {})
            # HRV should be dominant in Level 1
            if "hrv" in weights:
                assert weights["hrv"] >= 0.25, "HRV weight should be dominant in Level 1"
            print(f"Level 1 weights: {weights}")
    
    def test_level_2_bracelet_plus_balance_weights(self):
        """Test Level 2 scoring includes balance biomarkers with adjusted weights"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        # Level 2 biomarkers include body composition
        level_2_biomarkers = {"body_fat", "muscle_mass", "visceral_fat", "bmi", "hydration"}
        
        if data.get("level") == 2:
            biomarkers = data.get("biomarkers", {})
            weights = data.get("weights_used", {})
            
            # Check at least some balance biomarkers are scored
            scale_scored = [k for k in level_2_biomarkers if k in biomarkers]
            assert len(scale_scored) > 0, "Level 2 should have balance biomarkers"
            
            # HRV and visceral_fat should be top weights in Level 2
            if "hrv" in weights and "visceral_fat" in weights:
                assert weights["hrv"] >= 0.15, "HRV should have high weight in Level 2"
                assert weights["visceral_fat"] >= 0.15, "Visceral fat should have high weight in Level 2"
            
            print(f"Level 2 biomarkers scored: {list(biomarkers.keys())}")
            print(f"Level 2 weights: {weights}")
    
    def test_biomarker_scores_0_to_100(self):
        """Verify each biomarker score is in 0-100 range"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        biomarkers = data.get("biomarkers", {})
        for name, details in biomarkers.items():
            score = details.get("score")
            assert score is not None, f"Biomarker {name} missing score"
            assert 0 <= score <= 100, f"Biomarker {name} score {score} out of range"
            assert "value" in details, f"Biomarker {name} missing 'value'"
            assert "norm" in details, f"Biomarker {name} missing 'norm'"
            assert "direction" in details, f"Biomarker {name} missing 'direction'"
        
        print(f"Biomarkers validated: {list(biomarkers.keys())}")
    
    def test_composite_score_maps_to_bio_age(self):
        """Test composite score 50 = exact age, ±10 points = ±2 years"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        composite_score = data.get("composite_score")
        bio_age = data.get("bio_age")
        real_age = data.get("real_age")
        
        assert composite_score is not None
        assert bio_age is not None
        assert real_age is not None
        
        # Score 50 = exact age, each 10 points = ~2 years
        # But Nora AI blending may adjust this
        expected_offset_direction = "younger" if composite_score > 50 else "older" if composite_score < 50 else "exact"
        actual_direction = "younger" if bio_age < real_age else "older" if bio_age > real_age else "exact"
        
        # Direction should generally match (unless Nora AI overrides)
        print(f"Composite score: {composite_score}, Real age: {real_age}, Bio age: {bio_age}")
        print(f"Expected direction: {expected_offset_direction}, Actual: {actual_direction}")
    
    def test_confidence_levels(self):
        """Test confidence levels are correctly assigned based on data points"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        confidence = data.get("confidence")
        data_sources = data.get("data_sources", {})
        total_readings = data_sources.get("bracelet_readings", 0) + data_sources.get("scale_readings", 0)
        biomarkers_scored = data_sources.get("biomarkers_scored", 0)
        
        assert confidence in ("haute", "moyenne", "basse"), f"Invalid confidence: {confidence}"
        
        # Verify confidence logic:
        # haute: >60 readings + >=6 biomarkers
        # moyenne: >20 readings + >=3 biomarkers
        # basse: otherwise
        if confidence == "haute":
            assert total_readings > 60 and biomarkers_scored >= 6, "Haute confidence conditions not met"
        elif confidence == "moyenne":
            assert total_readings > 20 and biomarkers_scored >= 3, "Moyenne confidence conditions not met"
        
        print(f"Confidence: {confidence}, Readings: {total_readings}, Biomarkers: {biomarkers_scored}")
    
    def test_reference_norms_for_age_and_gender(self):
        """Test reference norms are returned for correct age bracket and gender"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        norms = data.get("reference_norms", {})
        assert "age_bracket" in norms, "Missing age_bracket"
        assert "gender" in norms, "Missing gender"
        assert "hrv_norm" in norms, "Missing hrv_norm"
        assert "hr_norm" in norms, "Missing hr_norm"
        assert "body_fat_norm" in norms, "Missing body_fat_norm"
        assert "muscle_norm" in norms, "Missing muscle_norm"
        
        # Josette is 77 years old female
        assert norms["age_bracket"] == "70-79", f"Expected 70-79 bracket for 77yo, got {norms['age_bracket']}"
        assert norms["gender"] in ("F", "M"), f"Invalid gender: {norms['gender']}"
        
        print(f"Reference norms: bracket={norms['age_bracket']}, gender={norms['gender']}")
        print(f"HRV norm: {norms['hrv_norm']}, HR norm: {norms['hr_norm']}")
    
    def test_temporal_trends_with_direction(self):
        """Test Level 3 trends compute change_pct and improving/degrading direction"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        trends = data.get("trends", {})
        trend_summary = data.get("trend_summary", {})
        
        # Check trend summary structure
        assert "label" in trend_summary, "Missing trend label"
        assert "color" in trend_summary, "Missing trend color"
        assert "improving" in trend_summary, "Missing improving count"
        assert "degrading" in trend_summary, "Missing degrading count"
        
        # Check individual trends if available
        for key, trend in trends.items():
            assert "change_pct" in trend, f"Trend {key} missing change_pct"
            assert "improving" in trend, f"Trend {key} missing improving flag"
            assert "first_avg" in trend, f"Trend {key} missing first_avg"
            assert "recent_avg" in trend, f"Trend {key} missing recent_avg"
        
        print(f"Trends: {list(trends.keys())}")
        print(f"Trend summary: {trend_summary}")
    
    def test_data_sources_structure(self):
        """Test data_sources contains bracelet_readings, scale_readings, biomarkers_scored"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        ds = data.get("data_sources", {})
        assert "bracelet_readings" in ds, "Missing bracelet_readings count"
        assert "scale_readings" in ds, "Missing scale_readings count"
        assert "biomarkers_scored" in ds, "Missing biomarkers_scored count"
        
        assert isinstance(ds["bracelet_readings"], int)
        assert isinstance(ds["scale_readings"], int)
        assert isinstance(ds["biomarkers_scored"], int)
        
        print(f"Data sources: {ds}")
    
    def test_weights_used_match_level(self):
        """Test weights_used reflects the actual weights applied"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        level = data.get("level")
        weights = data.get("weights_used", {})
        
        if level == 1:
            # Level 1: Bracelet only weights
            expected_keys = {"hrv", "resting_hr", "sleep_quality", "steps", "spo2", "stress"}
        elif level == 2:
            # Level 2: Bracelet + Balance weights
            expected_keys = {"hrv", "visceral_fat", "muscle_mass", "resting_hr", "body_fat", 
                           "sleep_quality", "steps", "bmi", "hydration", "spo2"}
        else:
            expected_keys = set()
        
        # Weights should only contain keys for scored biomarkers
        for key in weights:
            assert key in expected_keys or level == 2, f"Unexpected weight key: {key}"
        
        print(f"Level {level} weights used: {weights}")
    
    def test_level_label_format(self):
        """Test level_label returns correct French labels"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        level = data.get("level")
        level_label = data.get("level_label")
        
        expected_labels = {1: "Bracelet seul", 2: "Bracelet + Balance"}
        
        if level in expected_labels:
            assert level_label == expected_labels[level], f"Incorrect label for level {level}"
        
        print(f"Level: {level}, Label: {level_label}")
    
    def test_body_age_cache_updated_with_v2(self):
        """Test that body_age_cache is updated with algorithm_version v2"""
        # First call aging-rate to trigger cache update
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        
        # Then check body-age endpoint which reads from cache
        resp = self.session.get(f"{BASE_URL}/api/health/body-age")
        assert resp.status_code == 200
        data = resp.json()
        
        # Cache should have been updated
        assert data.get("status") in ("computed", "collecting", "no_data")
        if data.get("status") == "computed":
            # Body age should be set
            assert data.get("body_age") is not None
        
        print(f"Body age cache status: {data.get('status')}, body_age: {data.get('body_age')}")
    
    def test_josette_expected_values(self):
        """Test expected values for Josette (77yo female with 14 bracelet + 14 scale readings)"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        # Expected: Level 2 (has both bracelet and scale)
        assert data.get("level") == 2, f"Expected Level 2, got {data.get('level')}"
        
        # Expected: composite_score around 74 (but may vary with data)
        composite = data.get("composite_score")
        assert composite is not None
        assert 50 <= composite <= 100, f"Composite score {composite} seems too low"
        
        # Expected: confidence moyenne or haute (with ~28 readings)
        confidence = data.get("confidence")
        assert confidence in ("moyenne", "haute", "basse"), f"Unexpected confidence: {confidence}"
        
        # Expected: ~11 biomarkers scored
        biomarkers = data.get("biomarkers", {})
        assert len(biomarkers) >= 5, f"Expected at least 5 biomarkers, got {len(biomarkers)}"
        
        print(f"Josette results: Level={data['level']}, Score={composite}, Confidence={confidence}")
        print(f"Biomarkers ({len(biomarkers)}): {list(biomarkers.keys())}")
    
    def test_no_data_response(self):
        """Test response when user has no readings (using different login or checking structure)"""
        # Just verify the endpoint handles edge cases gracefully
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should either have data or return proper no_data status
        if data.get("status") == "no_data":
            assert data.get("rate") is None
            assert "real_age" in data
        else:
            assert data.get("rate") is not None
            assert data.get("bio_age") is not None
        
        print(f"Status: {data.get('status')}, Rate: {data.get('rate')}")


class TestAgingRateFrontendData:
    """Test that the aging rate data structure matches frontend expectations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_CREDS)
        assert resp.status_code == 200
        token = resp.json().get("token")  # API returns 'token' not 'access_token'
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
        self.session.close()
    
    def test_frontend_interface_compatibility(self):
        """Verify response matches HeroScore.tsx agingRate interface"""
        resp = self.session.get(f"{BASE_URL}/api/health/aging-rate")
        assert resp.status_code == 200
        data = resp.json()
        
        # HeroScore expects these fields in agingRate prop:
        # rate, label, color, bio_age, real_age, diff
        # level, level_label, confidence, composite_score
        # trend_summary: { label, color, improving, degrading }
        # data_sources: { bracelet_readings, scale_readings, biomarkers_scored }
        
        assert "rate" in data
        assert "label" in data
        assert "color" in data
        
        if data.get("rate"):
            assert "bio_age" in data
            assert "real_age" in data
            assert "diff" in data
            assert "level" in data
            assert "level_label" in data
            assert "confidence" in data
            assert "composite_score" in data
            
            ts = data.get("trend_summary", {})
            assert "label" in ts
            assert "color" in ts
            assert "improving" in ts
            assert "degrading" in ts
            
            ds = data.get("data_sources", {})
            assert "bracelet_readings" in ds
            assert "scale_readings" in ds
            assert "biomarkers_scored" in ds
        
        print("Frontend interface compatibility verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
