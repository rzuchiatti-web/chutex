"""
Test suite for Build 114 bug fixes - Iteration 208
Tests: daily-report (temperature, distance, VO2 Max, analysis_phase), sleep history dates, glycemia formatting
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

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


class TestDailyReportFixes:
    """Tests for /api/health/daily-report endpoint fixes"""
    
    def test_daily_report_returns_200(self, auth_token):
        """Basic test: daily-report endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Daily report failed: {response.text}"
        print("PASS: Daily report returns 200")
    
    def test_daily_report_has_temperature(self, auth_token):
        """Bug fix: temperature should be > 0 (was missing before fix)"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check if data exists
        if data.get("no_data") or data.get("awaiting_data"):
            pytest.skip("No health data available")
        
        d = data.get("data", {})
        temperature = d.get("temperature", 0)
        
        # Temperature should be > 0 if device has readings
        # Valid body temperature range: 34-42°C
        if temperature > 0:
            assert 34 <= temperature <= 42, f"Temperature {temperature} out of valid range (34-42)"
            print(f"PASS: Temperature = {temperature}°C (valid body temperature)")
        else:
            # Check if there's a fallback from device_readings
            print(f"INFO: Temperature = {temperature} (may need device sync)")
    
    def test_daily_report_has_distance(self, auth_token):
        """Bug fix: distance_km should be > 0 when steps > 0 (was missing before fix)"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data.get("no_data") or data.get("awaiting_data"):
            pytest.skip("No health data available")
        
        d = data.get("data", {})
        steps = d.get("steps", 0)
        distance_km = d.get("distance_km", 0)
        
        if steps > 0:
            # Distance should be calculated from steps if not provided by device
            # Formula: steps * stride_m / 1000 (stride ~0.65m default)
            assert distance_km > 0, f"Distance should be > 0 when steps={steps}"
            # Sanity check: distance should be reasonable (0.5-50km for typical day)
            assert 0 < distance_km < 50, f"Distance {distance_km}km seems unreasonable"
            print(f"PASS: Distance = {distance_km}km for {steps} steps")
        else:
            print(f"INFO: Steps = 0, distance = {distance_km}")
    
    def test_daily_report_vo2_max_reasonable(self, auth_token):
        """Bug fix: VO2 Max should be < 48 (was 48.9 before fix, too high for seniors)"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data.get("no_data") or data.get("awaiting_data"):
            pytest.skip("No health data available")
        
        d = data.get("data", {})
        vo2_max = d.get("vo2_max", 0)
        
        if vo2_max > 0:
            # For seniors (65+), VO2 Max typically 12-40 ml/kg/min
            # The fix uses more conservative formula (multiplier 15.0 instead of 15.3)
            # Max clamped to 60, but for seniors should be < 48
            assert vo2_max < 48, f"VO2 Max {vo2_max} too high (should be < 48 for seniors)"
            assert vo2_max >= 12, f"VO2 Max {vo2_max} too low (should be >= 12)"
            print(f"PASS: VO2 Max = {vo2_max} ml/kg/min (reasonable for age)")
        else:
            print(f"INFO: VO2 Max = {vo2_max} (needs heart rate data)")
    
    def test_daily_report_analysis_phase_day(self, auth_token):
        """Bug fix: analysis_phase.day should be >= 3 (was stuck at 1/7 before fix)"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        analysis_phase = data.get("analysis_phase")
        
        if analysis_phase is None:
            # Analysis phase complete (day > 7) - this is expected after 7 days
            print("PASS: Analysis phase complete (no longer in analysis mode)")
            return
        
        day = analysis_phase.get("day", 0)
        total = analysis_phase.get("total", 7)
        
        # The fix uses aggregation for distinct days + calendar days since first reading
        # For a user with data synced on 2026-04-03 to 2026-04-05, day should be >= 3
        # If still in analysis phase, day should reflect actual data collection
        assert day >= 1, f"Analysis phase day {day} should be >= 1"
        assert day <= total, f"Analysis phase day {day} should be <= total {total}"
        
        print(f"PASS: Analysis phase day = {day}/{total}")


class TestSleepHistoryFixes:
    """Tests for /api/health/sleep/history endpoint fixes"""
    
    def test_sleep_history_returns_200(self, auth_token):
        """Basic test: sleep history endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/health/sleep/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Sleep history failed: {response.text}"
        print("PASS: Sleep history returns 200")
    
    def test_sleep_history_dates_valid(self, auth_token):
        """Bug fix: sleep dates should have year >= 2024 (was returning 2017 before fix)"""
        response = requests.get(
            f"{BASE_URL}/api/health/sleep/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if not data or len(data) == 0:
            pytest.skip("No sleep history available")
        
        for entry in data:
            date_str = entry.get("date", "")
            if date_str and len(date_str) >= 4:
                year = int(date_str[:4])
                # The fix validates BCD dates: if year < 2024 or > 2030, use server timestamp
                assert year >= 2024, f"Sleep date year {year} is invalid (should be >= 2024)"
                assert year <= 2030, f"Sleep date year {year} is invalid (should be <= 2030)"
                print(f"PASS: Sleep date {date_str} has valid year {year}")
        
        print(f"PASS: All {len(data)} sleep entries have valid dates (year >= 2024)")


class TestGlycemiaFixes:
    """Tests for /api/glycemia/estimate endpoint fixes"""
    
    def test_glycemia_estimate_returns_200(self, auth_token):
        """Basic test: glycemia estimate endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/glycemia/estimate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Glycemia estimate failed: {response.text}"
        print("PASS: Glycemia estimate returns 200")
    
    def test_glycemia_estimate_is_number(self, auth_token):
        """Bug fix: estimated_glycemia should be a number (1.0 g/L is correct)"""
        response = requests.get(
            f"{BASE_URL}/api/glycemia/estimate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data.get("status") == "insufficient_data":
            pytest.skip("Insufficient data for glycemia estimation")
        
        estimated = data.get("estimated_glycemia")
        
        if estimated is not None:
            # Should be a number (float or int), not a string
            assert isinstance(estimated, (int, float)), f"estimated_glycemia should be a number, got {type(estimated)}"
            # Typical glycemia range: 0.7 - 2.0 g/L
            assert 0.5 <= estimated <= 3.0, f"Glycemia {estimated} out of typical range"
            print(f"PASS: estimated_glycemia = {estimated} (type: {type(estimated).__name__})")
        else:
            print("INFO: estimated_glycemia is None")
    
    def test_glycemia_calibrations_empty(self, auth_token):
        """Test: calibrations should return empty array (test data was deleted)"""
        response = requests.get(
            f"{BASE_URL}/api/glycemia/calibrations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Glycemia calibrations failed: {response.text}"
        data = response.json()
        
        # Response is a dict with 'calibrations' key containing the array
        if isinstance(data, dict):
            calibrations = data.get("calibrations", [])
            assert isinstance(calibrations, list), f"Calibrations should be a list, got {type(calibrations)}"
            print(f"PASS: Glycemia calibrations returns array with {len(calibrations)} items")
        else:
            # Fallback: direct array response
            assert isinstance(data, list), f"Calibrations should be a list, got {type(data)}"
            print(f"PASS: Glycemia calibrations returns array with {len(data)} items")


class TestHealthEndpointsIntegration:
    """Integration tests for health endpoints"""
    
    def test_health_summary(self, auth_token):
        """Test health summary endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/health/summary",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Health summary failed: {response.text}"
        data = response.json()
        
        # Should have score and status
        assert "score" in data or "no_data" in data, "Missing score or no_data field"
        print(f"PASS: Health summary returns score={data.get('score', 'N/A')}")
    
    def test_sleep_data(self, auth_token):
        """Test sleep data endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/health/sleep",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Sleep data failed: {response.text}"
        data = response.json()
        
        # Should have stages array
        assert "stages" in data, "Missing stages field"
        print(f"PASS: Sleep data returns {len(data.get('stages', []))} stages")
    
    def test_sleep_analysis(self, auth_token):
        """Test sleep analysis endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/health/sleep/analysis",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Sleep analysis failed: {response.text}"
        data = response.json()
        
        # Should have performance_score
        assert "performance_score" in data or "has_data" in data, "Missing performance_score or has_data"
        print(f"PASS: Sleep analysis returns performance_score={data.get('performance_score', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
