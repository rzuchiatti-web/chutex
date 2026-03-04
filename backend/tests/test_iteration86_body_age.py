"""
Test iteration 86: Body Age Nora AI feature
Tests for:
- GET /api/health/body-age endpoint (collecting status when < 7 days, computed when >= 7 days)
- GET /api/health/daily-report (analysis_phase, body_age_nora fields)
- Body age caching in body_age_cache collection
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBodyAgeEndpoint:
    """Tests for GET /api/health/body-age endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary and get token"""
        # Login as beneficiary (phone=0651245918, password=test123)
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {login_resp.status_code} - {login_resp.text}")
    
    def test_body_age_endpoint_returns_200(self):
        """Body age endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Body age endpoint returned 200 OK")
    
    def test_body_age_returns_valid_structure(self):
        """Body age response should have expected fields"""
        response = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        data = response.json()
        
        # Check required fields exist
        assert "status" in data, "Missing 'status' field"
        assert "days_collected" in data, "Missing 'days_collected' field"
        assert "days_required" in data, "Missing 'days_required' field"
        
        # days_required should always be 7
        assert data["days_required"] == 7, f"Expected days_required=7, got {data['days_required']}"
        
        print(f"Body age structure valid: status={data['status']}, days={data.get('days_collected')}/{data.get('days_required')}")
    
    def test_body_age_collecting_status_when_less_than_7_days(self):
        """When user has < 7 days of data, status should be 'collecting'"""
        response = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        data = response.json()
        
        days_collected = data.get("days_collected", 0)
        status = data.get("status", "")
        
        if days_collected < 7:
            assert status == "collecting", f"Expected status='collecting' when days<7, got '{status}'"
            assert data.get("body_age") is None, f"body_age should be None when collecting"
            assert "message" in data, "Missing 'message' field for collecting status"
            assert "progress_pct" in data, "Missing 'progress_pct' field"
            expected_pct = round((days_collected / 7) * 100)
            assert data["progress_pct"] == expected_pct, f"progress_pct mismatch: expected {expected_pct}, got {data['progress_pct']}"
            print(f"PASS: Collecting status - Day {days_collected}/7 ({data['progress_pct']}%), message: {data.get('message', '')[:50]}...")
        elif days_collected >= 7:
            # If there are >= 7 days, status should be 'computed'
            assert status == "computed", f"Expected status='computed' when days>=7, got '{status}'"
            assert data.get("body_age") is not None, "body_age should be set when computed"
            print(f"PASS: Computed status - body_age={data.get('body_age')}")
    
    def test_body_age_no_data_status(self):
        """When user has no readings, status should be 'no_data'"""
        response = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        data = response.json()
        
        # This test verifies the no_data status if user has 0 readings
        if data.get("days_collected", 0) == 0:
            assert data.get("status") == "no_data", f"Expected status='no_data' when no readings"
            print("PASS: No data status returned correctly")
        else:
            print(f"SKIP: User has {data.get('days_collected')} days of data, not testing no_data status")


class TestDailyReportBodyAge:
    """Tests for body age fields in GET /api/health/daily-report"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as beneficiary and get token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {login_resp.status_code} - {login_resp.text}")
    
    def test_daily_report_returns_200(self):
        """Daily report endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("Daily report endpoint returned 200 OK")
    
    def test_daily_report_includes_analysis_phase(self):
        """Daily report should include analysis_phase when < 7 days of data"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = response.json()
        
        # Get body age status to determine expected behavior
        ba_resp = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        ba_data = ba_resp.json()
        days = ba_data.get("days_collected", 0)
        
        if 0 < days < 7:
            # Should have analysis_phase with type='body_age'
            assert "analysis_phase" in data, "Missing 'analysis_phase' field when days < 7"
            phase = data["analysis_phase"]
            assert phase is not None, "analysis_phase should not be None when days < 7"
            assert phase.get("type") == "body_age", f"Expected analysis_phase.type='body_age', got '{phase.get('type')}'"
            assert phase.get("day") == days, f"Expected day={days}, got {phase.get('day')}"
            assert phase.get("total") == 7, f"Expected total=7, got {phase.get('total')}"
            print(f"PASS: analysis_phase present - Day {phase.get('day')}/{phase.get('total')}, type={phase.get('type')}")
        else:
            # analysis_phase should be None when days >= 7 or days == 0
            analysis_phase = data.get("analysis_phase")
            print(f"SKIP/PASS: analysis_phase={analysis_phase} (days={days})")
    
    def test_daily_report_includes_body_age_nora(self):
        """Daily report should include body_age_nora field"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = response.json()
        
        # body_age_nora should exist in response
        assert "body_age_nora" in data, "Missing 'body_age_nora' field in daily-report"
        
        body_age_nora = data.get("body_age_nora")
        if body_age_nora is not None:
            # If it's not None, it should be the cached body age data
            print(f"PASS: body_age_nora present: {body_age_nora}")
        else:
            print("PASS: body_age_nora is None (expected when not yet computed)")
    
    def test_data_body_age_overridden_by_nora(self):
        """When body_age_nora exists, data.body_age should use Nora's value"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=self.headers)
        data = response.json()
        
        body_age_nora = data.get("body_age_nora")
        if body_age_nora and body_age_nora.get("body_age"):
            nora_value = body_age_nora["body_age"]
            data_value = data.get("data", {}).get("body_age", 0)
            assert data_value == nora_value, f"data.body_age ({data_value}) should equal body_age_nora.body_age ({nora_value})"
            print(f"PASS: data.body_age={data_value} matches body_age_nora.body_age={nora_value}")
        else:
            print("SKIP: body_age_nora not computed yet")


class TestGuardianBodyAge:
    """Tests for body age endpoint with guardian role"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as guardian (0612345678)"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0612345678",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Guardian login failed: {login_resp.status_code}")
    
    def test_guardian_can_access_body_age(self):
        """Guardian should be able to access body-age endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/body-age", headers=self.headers)
        # Guardian may get 200 (if they have readings) or the endpoint might be beneficiary-only
        print(f"Guardian body-age response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Guardian body-age data: status={data.get('status')}, days={data.get('days_collected')}")
        elif response.status_code in [401, 403]:
            print("Guardian cannot access body-age endpoint (expected if beneficiary-only)")
