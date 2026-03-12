"""
Backend API tests for Iteration 37: UI Redesign - Login, Register, Health Pages
Tests login, register flow, health daily-report, metric-history endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://beneficiary-hub-9.preview.emergentagent.com")

class TestAuthEndpoints:
    """Test authentication endpoints for login/register flow"""
    
    def test_login_beneficiary_success(self):
        """Test beneficiary login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user object in response"
        assert data["user"]["email"] == "robert.martin@email.fr"
        assert data["user"]["active_role"] in ["beneficiary", "guardian"]
        print(f"PASS: Beneficiary login successful - user: {data['user']['name']}")
        return data["token"]
    
    def test_login_guardian_success(self):
        """Test guardian login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == "claire.martin@email.fr"
        print(f"PASS: Guardian login successful - user: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
        print("PASS: Invalid login correctly rejected")


class TestHealthDailyReport:
    """Test /api/health/daily-report endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_daily_report_returns_score(self, auth_token):
        """Test daily report returns score and status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check score fields
        assert "score" in data, "Missing score field"
        assert isinstance(data["score"], (int, float)), "Score should be numeric"
        assert 0 <= data["score"] <= 100, f"Score {data['score']} out of range"
        
        assert "status" in data, "Missing status field"
        assert "status_color" in data, "Missing status_color field"
        print(f"PASS: Daily report score={data['score']}, status='{data['status']}'")
    
    def test_daily_report_contains_ai_analysis(self, auth_token):
        """Test daily report includes AI analysis"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        data = response.json()
        
        assert "ai" in data, "Missing AI analysis"
        ai = data["ai"]
        assert "hero_line" in ai, "Missing hero_line in AI"
        assert "priority" in ai, "Missing priority in AI"
        assert "correlations" in ai, "Missing correlations in AI"
        assert "whats_good" in ai, "Missing whats_good in AI"
        assert "watch_out" in ai, "Missing watch_out in AI"
        print(f"PASS: AI analysis present - hero: '{ai['hero_line'][:50]}...'")
    
    def test_daily_report_contains_daily_plan(self, auth_token):
        """Test daily report includes daily plan with 4 objectives"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        data = response.json()
        
        assert "daily_plan" in data, "Missing daily_plan"
        plan = data["daily_plan"]
        assert len(plan) >= 4, f"Expected 4+ plan items, got {len(plan)}"
        
        # Check plan item structure
        for item in plan:
            assert "key" in item, "Plan item missing key"
            assert "label" in item, "Plan item missing label"
            assert "value" in item, "Plan item missing value"
            assert "icon" in item, "Plan item missing icon"
        
        print(f"PASS: Daily plan has {len(plan)} items: {[p['key'] for p in plan]}")
    
    def test_daily_report_contains_weighings(self, auth_token):
        """Test daily report includes weighings array"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        data = response.json()
        
        assert "weighings" in data, "Missing weighings"
        weighings = data["weighings"]
        assert isinstance(weighings, list), "weighings should be a list"
        
        if len(weighings) > 0:
            w = weighings[0]
            assert "id" in w, "Weighing missing id"
            assert "date" in w, "Weighing missing date"
            assert "weight" in w, "Weighing missing weight"
            assert "score" in w, "Weighing missing score"
            assert "body_fat_pct" in w, "Weighing missing body_fat_pct"
            assert "muscle_pct" in w, "Weighing missing muscle_pct"
            print(f"PASS: {len(weighings)} weighings, latest: {w['weight']}kg")
        else:
            print("PASS: weighings array present (empty)")
    
    def test_daily_report_subscores(self, auth_token):
        """Test daily report includes subscores for health sections"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        data = response.json()
        
        assert "subscores" in data, "Missing subscores"
        subs = data["subscores"]
        expected_keys = ["cardio", "sleep", "activity", "metabolism", "hydration"]
        for key in expected_keys:
            assert key in subs, f"Missing subscore: {key}"
            assert "score" in subs[key], f"{key} missing score"
            assert "label" in subs[key], f"{key} missing label"
            assert "color" in subs[key], f"{key} missing color"
        
        print(f"PASS: Subscores - cardio:{subs['cardio']['score']}, sleep:{subs['sleep']['score']}, activity:{subs['activity']['score']}")
    
    def test_daily_report_analysis_phase(self, auth_token):
        """Test daily report includes analysis phase for 7-day onboarding"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/daily-report", headers=headers)
        data = response.json()
        
        assert "analysis_phase" in data, "Missing analysis_phase"
        phase = data["analysis_phase"]
        if phase:
            assert "day" in phase, "analysis_phase missing day"
            assert "total" in phase, "analysis_phase missing total"
            assert "message" in phase, "analysis_phase missing message"
            assert "progress_pct" in phase, "analysis_phase missing progress_pct"
            print(f"PASS: Analysis phase day {phase['day']}/{phase['total']} - {phase['message']}")
        else:
            print("PASS: analysis_phase present (null - onboarding complete)")


class TestMetricHistory:
    """Test /api/health/metric-history/{key} endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_heart_rate_history(self, auth_token):
        """Test heart rate metric history returns ECG graph type"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/heart_rate", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "key" in data and data["key"] == "heart_rate"
        assert "meta" in data
        assert data["meta"]["graph_type"] == "ecg", f"Expected ecg graph_type, got {data['meta']['graph_type']}"
        assert data["meta"]["unit"] == "bpm"
        assert "history" in data
        assert len(data["history"]) >= 7, "Expected at least 7 days of history"
        
        # Check history entry structure
        entry = data["history"][0]
        assert "date" in entry
        assert "value" in entry
        
        print(f"PASS: Heart rate history - {len(data['history'])} days, graph_type=ecg")
    
    def test_sleep_duration_history_hypnogram(self, auth_token):
        """Test sleep duration metric history returns hypnogram data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/sleep_duration_min", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "key" in data and data["key"] == "sleep_duration_min"
        assert "meta" in data
        assert data["meta"]["graph_type"] == "hypnogram", f"Expected hypnogram, got {data['meta']['graph_type']}"
        assert "history" in data
        
        # Check hypnogram data includes phases
        entry = data["history"][0]
        assert "deep" in entry, "Hypnogram missing deep sleep"
        assert "light" in entry, "Hypnogram missing light sleep"
        assert "rem" in entry, "Hypnogram missing REM sleep"
        
        print(f"PASS: Sleep history - {len(data['history'])} days, hypnogram with phases")
    
    def test_weight_history(self, auth_token):
        """Test weight metric history"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/weight", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["key"] == "weight"
        assert data["meta"]["unit"] == "kg"
        assert "stats" in data
        assert "avg" in data["stats"]
        assert "trend" in data["stats"]
        
        print(f"PASS: Weight history - avg={data['stats']['avg']}kg, trend={data['stats']['trend']}")
    
    def test_steps_history_bars(self, auth_token):
        """Test steps metric history returns bars graph type"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/steps", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["key"] == "steps"
        assert data["meta"]["graph_type"] == "bars"
        assert data["meta"]["unit"] == "pas"
        
        print(f"PASS: Steps history - graph_type=bars, {len(data['history'])} days")
    
    def test_stress_history_area_gradient(self, auth_token):
        """Test stress level metric history returns area_gradient"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/metric-history/stress_level", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["key"] == "stress_level"
        assert data["meta"]["graph_type"] == "area_gradient"
        
        print(f"PASS: Stress history - graph_type=area_gradient")


class TestDeviceEndpoints:
    """Test device-related endpoints used by dashboard"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_dashboard_summary(self, auth_token):
        """Test dashboard summary endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check bracelet data
        assert "bracelet" in data, "Missing bracelet data"
        bracelet = data["bracelet"]
        assert "heart_rate" in bracelet
        assert "spo2" in bracelet
        assert "steps" in bracelet
        
        # Check scale data
        assert "scale" in data, "Missing scale data"
        scale = data["scale"]
        assert "weight" in scale
        assert "bmi" in scale
        
        print(f"PASS: Dashboard summary - bracelet HR={bracelet.get('heart_rate')}, scale weight={scale.get('weight')}")
    
    def test_devices_latest(self, auth_token):
        """Test latest device readings endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/devices/latest", headers=headers)
        assert response.status_code == 200
        print("PASS: /api/devices/latest returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
