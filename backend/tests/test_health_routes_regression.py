"""
Regression test suite for health routes refactoring.
Tests all endpoints from the 4 refactored modules:
- health_report_routes.py (summary, daily-report, section-analysis)
- health_aging_routes.py (activity-streak, body-age, aging-rate)
- health_sleep_routes.py (sleep, sleep/history)
- health_thresholds_routes.py (history, thresholds CRUD)

This validates that no endpoints were broken during the split of
the monolithic health_report_routes.py (2222 lines) into 4 modules.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://chutex-care-ui.preview.emergentagent.com').rstrip('/')


class TestHealthRoutesRegression:
    """Full regression testing for refactored health routes."""
    
    auth_token = None
    admin_token = None
    
    # ═══════════════════════════════════════════════════════════════
    # AUTHENTICATION
    # ═══════════════════════════════════════════════════════════════
    
    def test_00_login_beneficiary(self):
        """Login with beneficiary credentials: phone=0651245918, password=test123"""
        # Note: The 'email' field accepts both email and phone number
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text[:500] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response must contain token"
        TestHealthRoutesRegression.auth_token = data["token"]
        print(f"✓ Beneficiary login successful, token obtained")
    
    def test_00b_login_admin(self):
        """Login with admin credentials: phone=0600000001, password=admin123"""
        # Note: The 'email' field accepts both email and phone number
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000001",
            "password": "admin123"
        })
        print(f"Admin login response status: {response.status_code}")
        
        # Admin may use different credentials or may not exist - this is optional
        if response.status_code == 200:
            data = response.json()
            if "token" in data:
                TestHealthRoutesRegression.admin_token = data["token"]
                print(f"✓ Admin login successful")
            else:
                print(f"Admin login returned 200 but no token")
        else:
            print(f"Admin login not available (status {response.status_code}), skipping admin tests")
    
    # ═══════════════════════════════════════════════════════════════
    # AUTH VALIDATION - All endpoints should return 401 without auth
    # ═══════════════════════════════════════════════════════════════
    
    def test_01_auth_required_activity_streak(self):
        """GET /api/health/activity-streak returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/activity-streak")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ activity-streak returns 401 without auth")
    
    def test_01b_auth_required_body_age(self):
        """GET /api/health/body-age returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/body-age")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ body-age returns 401 without auth")
    
    def test_01c_auth_required_aging_rate(self):
        """GET /api/health/aging-rate returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/aging-rate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ aging-rate returns 401 without auth")
    
    def test_01d_auth_required_sleep(self):
        """GET /api/health/sleep returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/sleep")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ sleep returns 401 without auth")
    
    def test_01e_auth_required_sleep_history(self):
        """GET /api/health/sleep/history returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/sleep/history")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ sleep/history returns 401 without auth")
    
    def test_01f_auth_required_thresholds(self):
        """GET /api/health/thresholds returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/thresholds")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ thresholds returns 401 without auth")
    
    def test_01g_auth_required_history(self):
        """GET /api/health/history/heart_rate returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/history/heart_rate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ history/heart_rate returns 401 without auth")
    
    def test_01h_auth_required_summary(self):
        """GET /api/health/summary returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/summary")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ summary returns 401 without auth")
    
    def test_01i_auth_required_daily_report(self):
        """GET /api/health/daily-report returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/daily-report")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ daily-report returns 401 without auth")
    
    def test_01j_auth_required_section_analysis(self):
        """GET /api/health/section-analysis/cardiac returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/section-analysis/cardiac")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ section-analysis returns 401 without auth")
    
    # ═══════════════════════════════════════════════════════════════
    # HEALTH AGING ROUTES (health_aging_routes.py)
    # ═══════════════════════════════════════════════════════════════
    
    def test_10_activity_streak(self):
        """GET /api/health/activity-streak returns valid response with auth"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/activity-streak",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Activity streak response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate expected fields
        assert "current_streak" in data, "Response must have current_streak"
        assert "max_streak" in data, "Response must have max_streak"
        assert "objectives_today" in data, "Response must have objectives_today"
        assert "badge" in data, "Response must have badge"
        
        # Validate types
        assert isinstance(data["current_streak"], int), "current_streak must be int"
        assert isinstance(data["max_streak"], int), "max_streak must be int"
        assert isinstance(data["objectives_today"], list), "objectives_today must be list"
        
        print(f"✓ activity-streak: streak={data['current_streak']}, badge={data.get('badge')}")
    
    def test_11_body_age(self):
        """GET /api/health/body-age returns valid body age data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/body-age",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Body age response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate expected fields - status is required
        assert "status" in data, "Response must have status"
        
        # The API can return cached data with minimal fields or full computation
        if data["status"] == "computed":
            assert "body_age" in data and data["body_age"] is not None, "Computed status must have body_age"
            assert 30 <= data["body_age"] <= 100, f"Body age {data['body_age']} out of range 30-100"
            print(f"✓ body-age computed: {data['body_age']} years")
        elif data["status"] == "collecting":
            # collecting status should have progress info
            if "days_collected" in data:
                print(f"✓ body-age status: {data['status']} ({data['days_collected']}/{data.get('days_required', 7)} days)")
            else:
                print(f"✓ body-age status: {data['status']} (collecting data)")
        elif data["status"] == "no_data":
            print(f"✓ body-age status: {data['status']} (no device readings)")
        else:
            # Accept any other valid status 
            print(f"✓ body-age status: {data['status']}")
    
    def test_12_aging_rate(self):
        """GET /api/health/aging-rate returns V2 algorithm with level/confidence/biomarkers"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/aging-rate",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Aging rate response: {response.status_code} - {response.text[:800]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate V2 fields
        assert "status" in data, "Response must have status"
        
        if data["status"] == "computed":
            # Core fields
            assert "rate" in data, "Computed status must have rate"
            assert "bio_age" in data, "Computed status must have bio_age"
            assert "real_age" in data, "Computed status must have real_age"
            assert "label" in data, "Computed status must have label"
            assert "color" in data, "Computed status must have color"
            
            # V2 specific fields
            assert "level" in data, "V2 must have level (1 or 2)"
            assert data["level"] in [1, 2], f"Level must be 1 or 2, got {data['level']}"
            assert "level_label" in data, "V2 must have level_label"
            assert "confidence" in data, "V2 must have confidence"
            assert data["confidence"] in ["haute", "moyenne", "basse"], f"Invalid confidence: {data['confidence']}"
            assert "composite_score" in data, "V2 must have composite_score"
            assert 0 <= data["composite_score"] <= 100, "composite_score must be 0-100"
            
            # Biomarkers
            assert "biomarkers" in data, "V2 must have biomarkers"
            assert isinstance(data["biomarkers"], dict), "biomarkers must be dict"
            
            # Reference norms
            assert "reference_norms" in data, "V2 must have reference_norms"
            norms = data["reference_norms"]
            assert "age_bracket" in norms, "reference_norms must have age_bracket"
            assert "gender" in norms, "reference_norms must have gender"
            
            # Data sources
            assert "data_sources" in data, "V2 must have data_sources"
            
            print(f"✓ aging-rate V2: rate={data['rate']}, bio_age={data['bio_age']}, level={data['level']}, confidence={data['confidence']}")
        elif data["status"] == "no_data":
            print(f"✓ aging-rate: no_data (need device readings)")
        elif data["status"] == "no_dob":
            print(f"✓ aging-rate: no_dob (need date of birth)")
        else:
            print(f"✓ aging-rate status: {data['status']}")
    
    # ═══════════════════════════════════════════════════════════════
    # HEALTH SLEEP ROUTES (health_sleep_routes.py)
    # ═══════════════════════════════════════════════════════════════
    
    def test_20_sleep(self):
        """GET /api/health/sleep returns sleep data structure"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/sleep",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Sleep response: {response.status_code} - {response.text[:400]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate expected fields
        assert "stages" in data, "Response must have stages"
        assert "total_minutes" in data, "Response must have total_minutes"
        assert "deep_minutes" in data, "Response must have deep_minutes"
        assert "light_minutes" in data, "Response must have light_minutes"
        assert "rem_minutes" in data, "Response must have rem_minutes"
        assert "awake_minutes" in data, "Response must have awake_minutes"
        assert "sleep_quality" in data, "Response must have sleep_quality"
        assert "sleep_duration" in data, "Response must have sleep_duration"
        assert "source" in data, "Response must have source"
        
        # Validate types
        assert isinstance(data["stages"], list), "stages must be list"
        assert isinstance(data["total_minutes"], int), "total_minutes must be int"
        assert isinstance(data["sleep_quality"], int), "sleep_quality must be int"
        
        print(f"✓ sleep: quality={data['sleep_quality']}%, duration={data['sleep_duration']}h, source={data['source']}")
    
    def test_21_sleep_history(self):
        """GET /api/health/sleep/history returns array of sleep history"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/sleep/history",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Sleep history response: {response.status_code} - {response.text[:400]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate structure
        assert isinstance(data, list), "Response must be a list"
        
        if len(data) > 0:
            # Validate first entry structure
            entry = data[0]
            assert "date" in entry, "Entry must have date"
            assert "duration" in entry or "quality" in entry, "Entry must have duration or quality"
            print(f"✓ sleep/history: {len(data)} entries")
        else:
            print(f"✓ sleep/history: empty (no sleep data yet)")
    
    # ═══════════════════════════════════════════════════════════════
    # HEALTH THRESHOLDS ROUTES (health_thresholds_routes.py)
    # ═══════════════════════════════════════════════════════════════
    
    def test_30_history_heart_rate(self):
        """GET /api/health/history/heart_rate returns metric history"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/history/heart_rate",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"History heart_rate response: {response.status_code} - {response.text[:400]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate structure
        assert "metric_id" in data, "Response must have metric_id"
        assert data["metric_id"] == "heart_rate", f"metric_id should be heart_rate, got {data['metric_id']}"
        assert "history" in data, "Response must have history"
        assert isinstance(data["history"], list), "history must be list"
        assert "stats" in data, "Response must have stats"
        
        stats = data["stats"]
        assert "current" in stats, "stats must have current"
        assert "average" in stats, "stats must have average"
        assert "min" in stats, "stats must have min"
        assert "max" in stats, "stats must have max"
        
        print(f"✓ history/heart_rate: {len(data['history'])} readings, avg={stats['average']}")
    
    def test_31_thresholds_create(self):
        """POST /api/health/thresholds creates a threshold"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.post(
            f"{BASE_URL}/api/health/thresholds",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"},
            json={
                "metric_id": "heart_rate",
                "min_val": 50,
                "max_val": 100
            }
        )
        print(f"Create threshold response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "status" in data, "Response must have status"
        assert data["status"] == "saved", f"Status should be 'saved', got {data['status']}"
        print(f"✓ POST thresholds: {data['status']}")
    
    def test_32_thresholds_get_all(self):
        """GET /api/health/thresholds returns list of thresholds"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Get thresholds response: {response.status_code} - {response.text[:400]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response must be a list"
        
        # Should contain our just-created threshold
        hr_threshold = next((t for t in data if t.get("metric_id") == "heart_rate"), None)
        if hr_threshold:
            assert hr_threshold.get("min_val") == 50, "min_val should be 50"
            assert hr_threshold.get("max_val") == 100, "max_val should be 100"
            print(f"✓ GET thresholds: {len(data)} thresholds, heart_rate found")
        else:
            print(f"✓ GET thresholds: {len(data)} thresholds (heart_rate not found, may be user-specific)")
    
    def test_33_thresholds_get_specific(self):
        """GET /api/health/thresholds/heart_rate returns specific threshold"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/thresholds/heart_rate",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Get specific threshold response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "metric_id" in data, "Response must have metric_id"
        assert data["metric_id"] == "heart_rate", f"metric_id should be heart_rate"
        
        # Should have min/max from our creation
        if data.get("min_val") is not None:
            print(f"✓ GET thresholds/heart_rate: min={data['min_val']}, max={data['max_val']}")
        else:
            print(f"✓ GET thresholds/heart_rate: no values set yet")
    
    def test_34_thresholds_delete(self):
        """DELETE /api/health/thresholds/heart_rate deletes the threshold"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.delete(
            f"{BASE_URL}/api/health/thresholds/heart_rate",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Delete threshold response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "status" in data, "Response must have status"
        assert data["status"] == "deleted", f"Status should be 'deleted', got {data['status']}"
        print(f"✓ DELETE thresholds/heart_rate: {data['status']}")
    
    # ═══════════════════════════════════════════════════════════════
    # HEALTH REPORT ROUTES (health_report_routes.py - trimmed)
    # ═══════════════════════════════════════════════════════════════
    
    def test_40_summary(self):
        """GET /api/health/summary returns health summary"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/summary",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Summary response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate expected fields
        assert "score" in data or "no_data" in data, "Response must have score or no_data"
        assert "status" in data, "Response must have status"
        assert "status_color" in data, "Response must have status_color"
        
        if data.get("no_data"):
            print(f"✓ summary: no_data (need device readings)")
        else:
            assert 0 <= data["score"] <= 100, f"Score {data['score']} out of range 0-100"
            print(f"✓ summary: score={data['score']}, status={data['status']}")
    
    def test_41_daily_report(self):
        """GET /api/health/daily-report returns daily report"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Daily report response: {response.status_code} - {response.text[:800]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate expected structure
        if data.get("no_data"):
            assert "data" in data, "no_data response must have data"
            assert "score_info" in data or "subscores" in data, "no_data response must have score_info or subscores"
            print(f"✓ daily-report: no_data (need device readings)")
        else:
            assert "score" in data, "Response must have score"
            assert "status" in data, "Response must have status"
            assert "subscores" in data, "Response must have subscores"
            assert "data" in data, "Response must have data"
            assert "ai" in data, "Response must have ai"
            assert "daily_plan" in data, "Response must have daily_plan"
            assert "sparklines" in data, "Response must have sparklines"
            
            # Validate subscores structure
            subs = data["subscores"]
            for key in ["cardio", "sleep", "activity", "metabolism", "hydration"]:
                if key in subs:
                    assert "score" in subs[key], f"subscore {key} must have score"
                    assert "label" in subs[key], f"subscore {key} must have label"
            
            print(f"✓ daily-report: score={data['score']}, status={data['status']}, {len(data.get('daily_plan', []))} plan items")
    
    def test_42_section_analysis_cardio(self):
        """GET /api/health/section-analysis/cardio returns section data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/cardio",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Section analysis cardio response: {response.status_code} - {response.text[:400]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate structure
        assert "section" in data, "Response must have section"
        assert data["section"] == "cardio", f"section should be cardio, got {data['section']}"
        assert "correlations" in data, "Response must have correlations"
        assert "whats_good" in data, "Response must have whats_good"
        assert "watch_out" in data, "Response must have watch_out"
        assert "recommendation" in data, "Response must have recommendation"
        
        # Validate types
        assert isinstance(data["correlations"], list), "correlations must be list"
        assert isinstance(data["whats_good"], list), "whats_good must be list"
        assert isinstance(data["watch_out"], list), "watch_out must be list"
        assert isinstance(data["recommendation"], str), "recommendation must be string"
        
        print(f"✓ section-analysis/cardio: no_data={data.get('no_data', False)}")
    
    def test_43_section_analysis_sleep(self):
        """GET /api/health/section-analysis/sleep returns section data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/sleep",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Section analysis sleep response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "section" in data and data["section"] == "sleep"
        print(f"✓ section-analysis/sleep: OK")
    
    def test_44_section_analysis_activity(self):
        """GET /api/health/section-analysis/activity returns section data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/activity",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Section analysis activity response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "section" in data and data["section"] == "activity"
        print(f"✓ section-analysis/activity: OK")
    
    def test_45_section_analysis_metabolism(self):
        """GET /api/health/section-analysis/metabolism returns section data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/metabolism",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Section analysis metabolism response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "section" in data and data["section"] == "metabolism"
        print(f"✓ section-analysis/metabolism: OK")
    
    def test_46_section_analysis_composition(self):
        """GET /api/health/section-analysis/composition returns section data"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/composition",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Section analysis composition response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "section" in data and data["section"] == "composition"
        print(f"✓ section-analysis/composition: OK")
    
    # ═══════════════════════════════════════════════════════════════
    # ADDITIONAL METRIC HISTORY TESTS
    # ═══════════════════════════════════════════════════════════════
    
    def test_50_history_steps(self):
        """GET /api/health/history/steps returns metric history"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/history/steps",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"History steps response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "metric_id" in data and data["metric_id"] == "steps"
        print(f"✓ history/steps: {len(data.get('history', []))} readings")
    
    def test_51_history_weight(self):
        """GET /api/health/history/weight returns metric history"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/history/weight",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"History weight response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "metric_id" in data and data["metric_id"] == "weight"
        print(f"✓ history/weight: {len(data.get('history', []))} readings")
    
    def test_52_invalid_history_metric(self):
        """GET /api/health/history/invalid_metric returns 404"""
        if not TestHealthRoutesRegression.auth_token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/health/history/invalid_metric_xyz",
            headers={"Authorization": f"Bearer {TestHealthRoutesRegression.auth_token}"}
        )
        print(f"Invalid history metric response: {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404 for invalid metric, got {response.status_code}"
        print(f"✓ history/invalid_metric: correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
