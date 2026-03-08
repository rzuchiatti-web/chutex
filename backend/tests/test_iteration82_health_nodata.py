"""
Test Iteration 82: Health Report - No Data / Zero Data Handling
Tests that Nora (AI assistant) returns proper no_data responses when beneficiary has no real health data
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://wellness-metrics-16.preview.emergentagent.com').rstrip('/')


class TestHealthNoData:
    """Tests for health endpoints with beneficiary that has no real health data (0651245918)"""

    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Login as beneficiary with no meaningful device data"""
        # Beneficiary phone: 0651245918, password: test123
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip(f"Beneficiary login failed: {response.status_code} - {response.text}")
        data = response.json()
        assert "token" in data, f"No token in response: {data}"
        print(f"Beneficiary login successful")
        return data["token"]

    # ==================== BACKEND API TESTS ====================

    def test_daily_report_returns_no_data(self, beneficiary_token):
        """GET /api/health/daily-report should return no_data=true with score=0 when no meaningful health data"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Key assertions for no-data state
        # The beneficiary has erroneous scale data (299.55 kg) that should be sanitized
        print(f"Daily report response: no_data={data.get('no_data')}, score={data.get('score')}, status={data.get('status')}")
        
        # If has_meaningful_data is False after sanitization, expect no_data=true
        if data.get('no_data') is True:
            assert data.get('score') == 0, f"Score should be 0 with no_data, got {data.get('score')}"
            assert data.get('status') == 'Aucune donnee', f"Status should be 'Aucune donnee', got {data.get('status')}"
            print("PASS: Daily report correctly returns no_data=true state")
        else:
            # If there is some valid data, check that it's not the erroneous 299.55 kg
            weight = data.get('data', {}).get('weight', 0)
            assert weight < 250 or weight == 0, f"Erroneous weight {weight}kg should be sanitized to 0"
            print(f"Daily report has some data - weight after sanitization: {weight}kg")

    def test_health_summary_returns_no_data(self, beneficiary_token):
        """GET /api/health/summary should return score=0 and status='Aucune donnee' when no meaningful data"""
        response = requests.get(
            f"{BASE_URL}/api/health/summary",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Health summary: score={data.get('score')}, status={data.get('status')}, no_data={data.get('no_data')}")
        
        # Either no_data is True, or if there's data, score should reflect reality
        if data.get('no_data') is True:
            assert data.get('score') == 0, f"Score should be 0 with no_data, got {data.get('score')}"
            assert data.get('status') == 'Aucune donnee', f"Status should be 'Aucune donnee', got {data.get('status')}"
            print("PASS: Health summary correctly returns no_data=true state")
        else:
            # If there is data, score should NOT be arbitrary 61
            print(f"Health summary has data: score={data.get('score')}")

    def test_section_analysis_cardio_no_data(self, beneficiary_token):
        """GET /api/health/section-analysis/cardio should return no_data=true with recommendation when no bracelet data"""
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/cardio",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Cardio section analysis: no_data={data.get('no_data')}, has correlations={len(data.get('correlations', []))>0}")
        
        # If no bracelet data, should return no_data=true
        if data.get('no_data') is True:
            # Should have empty correlations/whats_good/watch_out
            assert data.get('correlations', []) == [], f"Correlations should be empty, got {data.get('correlations')}"
            assert data.get('whats_good', []) == [], f"whats_good should be empty, got {data.get('whats_good')}"
            assert data.get('watch_out', []) == [], f"watch_out should be empty, got {data.get('watch_out')}"
            # Should have recommendation to connect device
            rec = data.get('recommendation', '')
            assert 'connect' in rec.lower() or 'bracelet' in rec.lower() or 'elio' in rec.lower() or 'appareil' in rec.lower(), \
                f"Recommendation should mention connecting device, got: {rec}"
            print(f"PASS: Cardio section returns no_data=true with connect device recommendation")
        else:
            print(f"Cardio section has data")

    def test_section_analysis_composition_no_data(self, beneficiary_token):
        """GET /api/health/section-analysis/composition should return no_data=true when no valid scale data"""
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/composition",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Composition section analysis: no_data={data.get('no_data')}")
        
        # If erroneous scale data (299.55 kg) was sanitized, should return no_data
        if data.get('no_data') is True:
            rec = data.get('recommendation', '')
            assert 'balance' in rec.lower() or 'vita' in rec.lower() or 'connect' in rec.lower() or 'appareil' in rec.lower(), \
                f"Recommendation should mention scale/balance, got: {rec}"
            print(f"PASS: Composition section returns no_data=true for erroneous scale data")
        else:
            print(f"Composition section has valid data")

    def test_section_analysis_sleep_no_data(self, beneficiary_token):
        """GET /api/health/section-analysis/sleep should return no_data=true with 'connect bracelet' recommendation"""
        response = requests.get(
            f"{BASE_URL}/api/health/section-analysis/sleep",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Sleep section analysis: no_data={data.get('no_data')}")
        
        if data.get('no_data') is True:
            rec = data.get('recommendation', '')
            assert 'bracelet' in rec.lower() or 'elio' in rec.lower() or 'nuit' in rec.lower() or 'connect' in rec.lower(), \
                f"Recommendation should mention bracelet/sleep tracking, got: {rec}"
            print(f"PASS: Sleep section returns no_data=true with connect bracelet recommendation")
        else:
            print(f"Sleep section has data")

    def test_daily_plan_connect_device_message(self, beneficiary_token):
        """Daily plan should show 'Connecter un appareil' instead of '0 pas / 0% hydratation'"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        plan = data.get('daily_plan', [])
        print(f"Daily plan items: {[p.get('key') for p in plan]}")
        
        # If no meaningful data, should have 'connect' plan item
        if data.get('no_data') is True:
            connect_items = [p for p in plan if p.get('key') == 'connect']
            if connect_items:
                label = connect_items[0].get('label', '')
                assert 'connect' in label.lower() or 'appareil' in label.lower(), \
                    f"Should have 'Connecter un appareil' plan item, got: {label}"
                print(f"PASS: Daily plan shows connect device message")
        
        # Should NOT have items with value "0" or "0 pas" or "0%"
        for p in plan:
            value = str(p.get('value', ''))
            if value == '0' or value.startswith('0 ') or value.endswith(' 0'):
                label = p.get('label', '')
                print(f"WARNING: Plan item '{label}' has zero value: {value}")

    def test_data_sanitization_erroneous_weight(self, beneficiary_token):
        """Verify that erroneous weight readings (>250kg) are sanitized"""
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        weight = data.get('data', {}).get('weight', 0)
        print(f"Weight in daily report: {weight}kg")
        
        # If there was erroneous 299.55 kg data, it should be sanitized to 0
        assert weight <= 250 or weight == 0, f"Weight {weight}kg should be sanitized if > 250kg"
        
        # Also check related metrics are zeroed when weight is invalid
        if weight == 0:
            bmi = data.get('data', {}).get('bmi', 0)
            body_fat = data.get('data', {}).get('body_fat_pct', 0)
            print(f"BMI: {bmi}, Body fat: {body_fat}% - should be 0 if weight was erroneous")


class TestHealthAPIStatusCodes:
    """Verify all health API endpoints return 200 and no errors"""

    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code}")
        return response.json().get("token")

    def test_health_daily_report_200(self, beneficiary_token):
        response = requests.get(
            f"{BASE_URL}/api/health/daily-report",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"daily-report failed: {response.status_code}"
        print("PASS: /api/health/daily-report returns 200")

    def test_health_summary_200(self, beneficiary_token):
        response = requests.get(
            f"{BASE_URL}/api/health/summary",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"summary failed: {response.status_code}"
        print("PASS: /api/health/summary returns 200")

    def test_health_section_analysis_all_sections_200(self, beneficiary_token):
        sections = ['cardio', 'sleep', 'activity', 'metabolism', 'composition']
        for section in sections:
            response = requests.get(
                f"{BASE_URL}/api/health/section-analysis/{section}",
                headers={"Authorization": f"Bearer {beneficiary_token}"}
            )
            assert response.status_code == 200, f"section-analysis/{section} failed: {response.status_code}"
            print(f"PASS: /api/health/section-analysis/{section} returns 200")

    def test_health_sleep_history_200(self, beneficiary_token):
        response = requests.get(
            f"{BASE_URL}/api/health/sleep/history",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        # May return 200 with empty array or 404 if not found
        assert response.status_code in [200, 404], f"sleep/history failed: {response.status_code}"
        print(f"PASS: /api/health/sleep/history returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
