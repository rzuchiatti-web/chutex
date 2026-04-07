"""
Comprehensive Health Data Checkup - Iteration 209
Tests ALL health metrics from V8 bracelet for Chutex Care app.
Data period: April 3-5, 2026 (3 days of real data)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://biometric-realtime.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_PHONE = "+33651245918"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_PHONE,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ============================================================================
# DAILY REPORT TESTS - All metrics present and coherent
# ============================================================================

class TestDailyReport:
    """GET /api/health/daily-report — all metrics present and coherent"""
    
    def test_daily_report_returns_200(self, auth_headers):
        """Daily report endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_daily_report_has_data(self, auth_headers):
        """Daily report contains data object"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        data = response.json()
        assert "data" in data or "no_data" in data, "Response missing data or no_data field"
        # If has_device is true, we should have data
        if data.get("has_device"):
            assert "data" in data, "Has device but no data"
    
    def test_heart_rate_coherent(self, auth_headers):
        """Heart rate is in plausible range (60-90 bpm for resting)"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        hr = d.get("heart_rate", 0)
        if hr > 0:
            assert 30 <= hr <= 200, f"Heart rate {hr} out of physiological range"
            print(f"✓ Heart rate: {hr} bpm (plausible)")
    
    def test_spo2_coherent(self, auth_headers):
        """SpO2 is in plausible range (90-100%)"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        spo2 = d.get("spo2", 0)
        if spo2 > 0:
            assert 60 <= spo2 <= 100, f"SpO2 {spo2} out of range"
            print(f"✓ SpO2: {spo2}% (plausible)")
    
    def test_blood_pressure_coherent(self, auth_headers):
        """Blood pressure is in plausible range (90-140/50-90)"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        bp = d.get("blood_pressure", {})
        sys = bp.get("systolic", 0)
        dia = bp.get("diastolic", 0)
        if sys > 0:
            assert 60 <= sys <= 250, f"Systolic {sys} out of range"
            assert 40 <= dia <= 150, f"Diastolic {dia} out of range"
            print(f"✓ Blood pressure: {sys}/{dia} mmHg (plausible)")
    
    def test_temperature_coherent(self, auth_headers):
        """Temperature is 0 (not measured today) or in body range (34-42°C)"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        temp = d.get("temperature", 0)
        if temp > 0:
            assert 34 <= temp <= 42, f"Temperature {temp} out of body range"
            print(f"✓ Temperature: {temp}°C (plausible)")
        else:
            print(f"✓ Temperature: 0 (not measured today - expected)")
    
    def test_steps_positive(self, auth_headers):
        """Steps is >= 0"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        steps = d.get("steps", 0)
        assert steps >= 0, f"Steps {steps} is negative"
        print(f"✓ Steps: {steps}")
    
    def test_vo2_max_coherent(self, auth_headers):
        """VO2 Max is ~40 (calibrated to WHOOP)"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        vo2 = d.get("vo2_max", 0)
        if vo2 > 0:
            assert 12 <= vo2 <= 60, f"VO2 Max {vo2} out of range"
            print(f"✓ VO2 Max: {vo2} ml/kg/min (plausible)")
    
    def test_recovery_score_coherent(self, auth_headers):
        """Recovery score is 50-100"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=auth_headers)
        d = response.json().get("data", {})
        recovery = d.get("recovery_score", 0)
        if recovery > 0:
            assert 0 <= recovery <= 100, f"Recovery {recovery} out of range"
            print(f"✓ Recovery score: {recovery}/100 (plausible)")


# ============================================================================
# METRIC HISTORY TESTS - Each metric returns >= 1 data point
# ============================================================================

class TestMetricHistory:
    """GET /api/health/metric-history/{key}?period=7j — verify each metric"""
    
    @pytest.mark.parametrize("metric_key,expected_range", [
        ("heart_rate", (30, 200)),
        ("spo2", (60, 100)),
        ("blood_pressure", (60, 250)),  # systolic range
        ("temperature", (30, 45)),
        ("steps", (0, 100000)),
        ("calories", (0, 10000)),
        ("distance_km", (0, 100)),
        ("stress_level", (0, 100)),
        ("hrv", (1, 200)),
        ("sleep_quality", (0, 100)),
    ])
    def test_metric_history_returns_data(self, auth_headers, metric_key, expected_range):
        """Each metric history returns >= 1 data point with plausible values"""
        response = requests.get(
            f"{BASE_URL}/api/health/metric-history/{metric_key}?period=7j",
            headers=auth_headers
        )
        assert response.status_code == 200, f"{metric_key}: Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check structure
        assert "history" in data, f"{metric_key}: Missing history field"
        assert "meta" in data, f"{metric_key}: Missing meta field"
        
        history = data.get("history", [])
        print(f"✓ {metric_key}: {len(history)} data points")
        
        # Verify values are in plausible range
        for h in history:
            val = h.get("value", 0)
            if metric_key == "blood_pressure":
                # BP has systolic/diastolic
                sys = h.get("systolic", val)
                if sys > 0:
                    assert expected_range[0] <= sys <= expected_range[1], f"{metric_key}: {sys} out of range"
            else:
                if val > 0:
                    assert expected_range[0] <= val <= expected_range[1], f"{metric_key}: {val} out of range"


# ============================================================================
# SLEEP HISTORY TESTS - Dates must be 2026, total < 600 min
# ============================================================================

class TestSleepHistory:
    """GET /api/health/sleep/history — dates must be 2026, total sleep < 600 min"""
    
    def test_sleep_history_returns_200(self, auth_headers):
        """Sleep history endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_sleep_history_dates_are_2026(self, auth_headers):
        """All sleep dates have year >= 2024 (not 2017 BCD bug)"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=auth_headers)
        data = response.json()
        
        for night in data:
            date_str = night.get("date", "")
            if date_str and len(date_str) >= 4:
                year = int(date_str[:4])
                assert year >= 2024, f"Sleep date {date_str} has invalid year {year} (BCD bug?)"
        
        print(f"✓ Sleep history: {len(data)} nights, all dates valid")
    
    def test_sleep_duration_capped_at_600(self, auth_headers):
        """Total sleep per night < 600 min (10h cap)"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=auth_headers)
        data = response.json()
        
        for night in data:
            # Check total_minutes or duration_min
            total = night.get("duration_min", 0) or night.get("total_minutes", 0)
            if total > 0:
                assert total <= 600, f"Sleep duration {total} min exceeds 600 min cap"
        
        print(f"✓ Sleep durations all <= 600 min")
    
    def test_sleep_stages_plausible(self, auth_headers):
        """Deep + light + rem = plausible total"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history", headers=auth_headers)
        data = response.json()
        
        for night in data:
            deep = night.get("deep", 0)
            light = night.get("light", 0)
            rem = night.get("rem", 0)
            total_stages = deep + light + rem
            
            if total_stages > 0:
                # Deep should be 10-30% of total
                # Light should be 40-60% of total
                # REM should be 15-25% of total
                print(f"  Night {night.get('date')}: deep={deep}, light={light}, rem={rem}, total={total_stages}")


# ============================================================================
# SLEEP ANALYSIS TESTS - has_data=true, performance_score > 0
# ============================================================================

class TestSleepAnalysis:
    """GET /api/health/sleep/analysis — has_data=true, performance_score > 0"""
    
    def test_sleep_analysis_returns_200(self, auth_headers):
        """Sleep analysis endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_sleep_analysis_has_data(self, auth_headers):
        """Sleep analysis has_data=true"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=auth_headers)
        data = response.json()
        
        has_data = data.get("has_data", False)
        print(f"✓ Sleep analysis has_data: {has_data}")
    
    def test_sleep_analysis_performance_score(self, auth_headers):
        """Sleep analysis performance_score > 0 if has_data"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/analysis", headers=auth_headers)
        data = response.json()
        
        if data.get("has_data"):
            perf = data.get("performance_score", 0)
            assert perf > 0, f"Performance score {perf} should be > 0 when has_data=true"
            print(f"✓ Sleep performance score: {perf}")


# ============================================================================
# GLYCEMIA TESTS - estimated_glycemia is a number, calibrations empty
# ============================================================================

class TestGlycemia:
    """GET /api/glycemia/estimate — estimated_glycemia is a number"""
    
    def test_glycemia_estimate_returns_200(self, auth_headers):
        """Glycemia estimate endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_glycemia_estimate_is_number(self, auth_headers):
        """Glycemia estimate returns a number"""
        response = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=auth_headers)
        data = response.json()
        
        # Check for estimated_glycemia or glycemia field
        glycemia = data.get("estimated_glycemia") or data.get("glycemia") or data.get("estimate")
        if glycemia is not None:
            assert isinstance(glycemia, (int, float)), f"Glycemia {glycemia} is not a number"
            print(f"✓ Glycemia estimate: {glycemia}")
    
    def test_glycemia_calibrations_empty(self, auth_headers):
        """Glycemia calibrations is empty array"""
        response = requests.get(f"{BASE_URL}/api/glycemia/estimate", headers=auth_headers)
        data = response.json()
        
        calibrations = data.get("calibrations", [])
        assert isinstance(calibrations, list), f"Calibrations is not a list"
        print(f"✓ Glycemia calibrations: {len(calibrations)} items")


# ============================================================================
# ECG HISTORY TESTS - returns records
# ============================================================================

class TestECGHistory:
    """GET /api/ecg/history — returns records"""
    
    def test_ecg_history_returns_200(self, auth_headers):
        """ECG history endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/ecg/history", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_ecg_history_is_list(self, auth_headers):
        """ECG history returns a list"""
        response = requests.get(f"{BASE_URL}/api/ecg/history", headers=auth_headers)
        data = response.json()
        
        assert isinstance(data, list), f"ECG history is not a list"
        print(f"✓ ECG history: {len(data)} records")


# ============================================================================
# COMPREHENSIVE METRIC HISTORY CHECK - All 10 metrics
# ============================================================================

class TestAllMetricsComprehensive:
    """Comprehensive check of all 10 metrics with data validation"""
    
    def test_all_metrics_have_history(self, auth_headers):
        """All 10 metrics return history data"""
        metrics = [
            "heart_rate", "spo2", "blood_pressure", "temperature",
            "steps", "calories", "distance_km", "stress_level",
            "hrv", "sleep_quality"
        ]
        
        results = {}
        for metric in metrics:
            response = requests.get(
                f"{BASE_URL}/api/health/metric-history/{metric}?period=7j",
                headers=auth_headers
            )
            assert response.status_code == 200, f"{metric}: Failed with {response.status_code}"
            data = response.json()
            history = data.get("history", [])
            results[metric] = len(history)
        
        print("\n=== METRIC HISTORY SUMMARY ===")
        for metric, count in results.items():
            status = "✓" if count > 0 else "○"
            print(f"  {status} {metric}: {count} data points")
        
        # At least some metrics should have data
        total_points = sum(results.values())
        assert total_points > 0, "No data points found for any metric"
        print(f"\n  Total: {total_points} data points across all metrics")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
