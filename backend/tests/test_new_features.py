import pytest
import requests
import os
import time

# Backend API tests for VitalLink AI - New Features (Iteration 2)
# Tests: Health history, Thresholds, AI metric advice, Location, Teleconsult, Interventions, Backoffice

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestHealthData:
    """Health data history and thresholds tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        """Get beneficiary token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_get_health_history_heart_rate(self, api_client, beneficiary_token):
        """Test GET /api/health/history/heart_rate"""
        # Sync bracelet first to ensure data
        api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json={"device_type": "bracelet", "data": {}},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        
        response = api_client.get(
            f"{BASE_URL}/api/health/history/heart_rate",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "metric_id" in data
        assert data["metric_id"] == "heart_rate"
        assert "history" in data
        assert isinstance(data["history"], list)
        assert len(data["history"]) > 0
        assert "stats" in data
        assert "current" in data["stats"]
        assert "average" in data["stats"]
        assert "min" in data["stats"]
        assert "max" in data["stats"]
        print(f"✓ Heart rate history retrieved: {len(data['history'])} data points, avg={data['stats']['average']}")

    def test_get_health_history_weight(self, api_client, beneficiary_token):
        """Test GET /api/health/history/weight (scale metric)"""
        # Sync scale first
        api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json={"device_type": "scale", "data": {}},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        
        response = api_client.get(
            f"{BASE_URL}/api/health/history/weight",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["metric_id"] == "weight"
        assert len(data["history"]) > 0
        print(f"✓ Weight history retrieved: current={data['stats']['current']}kg")

    def test_get_health_history_invalid_metric(self, api_client, beneficiary_token):
        """Test GET /api/health/history/{invalid_metric} returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/health/history/invalid_metric_xyz",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 404
        print("✓ Invalid metric rejected")

    def test_set_threshold(self, api_client, beneficiary_token):
        """Test POST /api/health/thresholds"""
        payload = {
            "metric_id": "heart_rate",
            "min_val": 60.0,
            "max_val": 100.0,
            "goal": 75.0
        }
        response = api_client.post(
            f"{BASE_URL}/api/health/thresholds",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "saved"
        print("✓ Threshold saved successfully")
        
        # Verify by GET
        get_response = api_client.get(
            f"{BASE_URL}/api/health/thresholds/heart_rate",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert get_response.status_code == 200
        threshold = get_response.json()
        assert threshold["metric_id"] == "heart_rate"
        assert threshold["min_val"] == 60.0
        assert threshold["max_val"] == 100.0
        assert threshold["goal"] == 75.0
        print(f"✓ Threshold verified: {threshold}")

    def test_get_all_thresholds(self, api_client, beneficiary_token):
        """Test GET /api/health/thresholds"""
        response = api_client.get(
            f"{BASE_URL}/api/health/thresholds",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        thresholds = response.json()
        assert isinstance(thresholds, list)
        print(f"✓ Get all thresholds successful: {len(thresholds)} thresholds")

    def test_get_threshold_nonexistent(self, api_client, beneficiary_token):
        """Test GET /api/health/thresholds/{metric_id} for non-existent threshold"""
        response = api_client.get(
            f"{BASE_URL}/api/health/thresholds/spo2",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["metric_id"] == "spo2"
        assert data["min_val"] is None
        assert data["max_val"] is None
        assert data["goal"] is None
        print("✓ Non-existent threshold returns default values")


class TestAIMetricAdvice:
    """AI metric advice tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_get_metric_advice(self, api_client, beneficiary_token):
        """Test POST /api/ai/metric-advice"""
        payload = {
            "metric_id": "heart_rate",
            "metric_name": "Fréquence cardiaque",
            "current_value": 85
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai/metric-advice",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "advice" in data
        assert len(data["advice"]) > 0
        print(f"✓ Metric advice generated: {data['advice'][:100]}...")


class TestLocation:
    """Location sharing and tracking tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    @pytest.fixture
    def guardian_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "gardien@test.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_update_location(self, api_client, beneficiary_token):
        """Test POST /api/location/update"""
        payload = {
            "latitude": 48.8566,
            "longitude": 2.3522
        }
        response = api_client.post(
            f"{BASE_URL}/api/location/update",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "updated"
        print("✓ Location updated successfully")

    def test_get_own_location(self, api_client, beneficiary_token):
        """Test GET /api/location/{user_id} for own location"""
        # Get user info
        me_response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        user_id = me_response.json()["id"]
        
        response = api_client.get(
            f"{BASE_URL}/api/location/{user_id}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "latitude" in data
        assert "longitude" in data
        assert "user_id" in data
        print(f"✓ Own location retrieved: ({data['latitude']}, {data['longitude']})")

    def test_update_location_sharing(self, api_client, beneficiary_token):
        """Test PUT /api/location/sharing"""
        for mode in ["always", "alert_only", "never"]:
            payload = {"mode": mode}
            response = api_client.put(
                f"{BASE_URL}/api/location/sharing",
                json=payload,
                headers={"Authorization": f"Bearer {beneficiary_token}"}
            )
            assert response.status_code == 200, f"Failed for mode {mode}: {response.text}"
            
            data = response.json()
            assert data["status"] == "updated"
            assert data["mode"] == mode
            print(f"✓ Location sharing updated to: {mode}")


class TestTeleconsultation:
    """Teleconsultation QCM and submission tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_get_questions(self, api_client):
        """Test GET /api/teleconsult/questions (no auth required)"""
        response = api_client.get(f"{BASE_URL}/api/teleconsult/questions")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        questions = response.json()
        assert isinstance(questions, list)
        assert len(questions) > 0
        assert "id" in questions[0]
        assert "question" in questions[0]
        assert "type" in questions[0]
        print(f"✓ Teleconsult questions retrieved: {len(questions)} questions")

    def test_submit_teleconsult(self, api_client, beneficiary_token):
        """Test POST /api/teleconsult/submit"""
        payload = {
            "answers": [
                {"question_id": "q1", "answer": "Douleur ou gêne"},
                {"question_id": "q2", "answer": "Aujourd'hui"},
                {"question_id": "q3", "answer": 6},
                {"question_id": "q4", "answer": "Non"},
                {"question_id": "q5", "answer": "Oui"},
                {"question_id": "q6", "answer": "Non"},
                {"question_id": "q7", "answer": "Test de téléconsultation"}
            ],
            "notes": "Test submission"
        }
        response = api_client.post(
            f"{BASE_URL}/api/teleconsult/submit",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert "call_number" in data
        assert len(data["answers"]) == 7
        print(f"✓ Teleconsult submitted: {data['id']}, call: {data['call_number']}")
        
        # Verify persistence
        history_response = api_client.get(
            f"{BASE_URL}/api/teleconsult/history",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert history_response.status_code == 200
        history = history_response.json()
        assert len(history) > 0
        print(f"✓ Teleconsult history verified: {len(history)} entries")


class TestInterventions:
    """Intervention tracking tests"""

    @pytest.fixture
    def guardian_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "gardien@test.com",
            "password": "test123"
        })
        return response.json()["token"]

    @pytest.fixture
    def beneficiary_id(self, api_client, guardian_token):
        """Get beneficiary ID from guardian's beneficiaries"""
        response = api_client.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        beneficiaries = response.json()
        if len(beneficiaries) > 0:
            return beneficiaries[0]["id"]
        return None

    @pytest.fixture
    def alert_id(self, api_client, guardian_token, beneficiary_id):
        """Get or create an active alert"""
        # Get alerts
        alerts_response = api_client.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        alerts = alerts_response.json()
        active_alerts = [a for a in alerts if a["status"] == "active"]
        if active_alerts:
            return active_alerts[0]["id"]
        return "test-alert-id"

    def test_create_intervention(self, api_client, guardian_token, beneficiary_id, alert_id):
        """Test POST /api/interventions"""
        if not beneficiary_id:
            pytest.skip("No beneficiary linked to guardian")
        
        payload = {
            "alert_id": alert_id,
            "beneficiary_id": beneficiary_id,
            "notes": "Test intervention"
        }
        response = api_client.post(
            f"{BASE_URL}/api/interventions",
            json=payload,
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["status"] == "en_route"
        assert data["beneficiary_id"] == beneficiary_id
        assert "beneficiary_location" in data
        assert "intervener_location" in data
        assert "timeline" in data
        print(f"✓ Intervention created: {data['id']}, status={data['status']}")
        return data["id"]

    def test_get_interventions(self, api_client, guardian_token):
        """Test GET /api/interventions"""
        response = api_client.get(
            f"{BASE_URL}/api/interventions",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        interventions = response.json()
        assert isinstance(interventions, list)
        print(f"✓ Get interventions successful: {len(interventions)} interventions")

    def test_get_intervention_detail(self, api_client, guardian_token, beneficiary_id, alert_id):
        """Test GET /api/interventions/{id}"""
        if not beneficiary_id:
            pytest.skip("No beneficiary linked to guardian")
        
        # Create intervention first
        create_response = api_client.post(
            f"{BASE_URL}/api/interventions",
            json={"alert_id": alert_id, "beneficiary_id": beneficiary_id, "notes": "Test"},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        intervention_id = create_response.json()["id"]
        
        response = api_client.get(
            f"{BASE_URL}/api/interventions/{intervention_id}",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == intervention_id
        assert "intervener_location" in data
        print(f"✓ Intervention detail retrieved: {intervention_id}")

    def test_update_intervention(self, api_client, guardian_token, beneficiary_id, alert_id):
        """Test PUT /api/interventions/{id}"""
        if not beneficiary_id:
            pytest.skip("No beneficiary linked to guardian")
        
        # Create intervention first
        create_response = api_client.post(
            f"{BASE_URL}/api/interventions",
            json={"alert_id": alert_id, "beneficiary_id": beneficiary_id, "notes": "Test"},
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        intervention_id = create_response.json()["id"]
        
        # Update status
        payload = {
            "status": "completed",
            "report": "Intervention completed successfully",
            "latitude": 48.8600,
            "longitude": 2.3550
        }
        response = api_client.put(
            f"{BASE_URL}/api/interventions/{intervention_id}",
            json=payload,
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "updated"
        print(f"✓ Intervention updated: {intervention_id} -> completed")


class TestBackoffice:
    """Backoffice stats and management tests"""

    def test_get_stats(self, api_client):
        """Test GET /api/backoffice/stats (no auth required for now)"""
        response = api_client.get(f"{BASE_URL}/api/backoffice/stats")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total_users" in data
        assert "beneficiaries" in data
        assert "guardians" in data
        assert "total_alerts" in data
        assert "active_alerts" in data
        assert "prescriptions" in data
        assert "interventions" in data
        assert "teleconsults" in data
        assert data["total_users"] >= 0
        print(f"✓ Backoffice stats retrieved: {data['total_users']} users, {data['beneficiaries']} beneficiaries, {data['guardians']} guardians")

    def test_get_all_users(self, api_client):
        """Test GET /api/backoffice/users"""
        response = api_client.get(f"{BASE_URL}/api/backoffice/users")
        assert response.status_code == 200
        
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        # Check password_hash is excluded
        for user in users:
            assert "password_hash" not in user
            assert "email" in user
            assert "role" in user
        print(f"✓ Backoffice users retrieved: {len(users)} users")

    def test_get_all_alerts(self, api_client):
        """Test GET /api/backoffice/alerts"""
        response = api_client.get(f"{BASE_URL}/api/backoffice/alerts")
        assert response.status_code == 200
        
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"✓ Backoffice alerts retrieved: {len(alerts)} alerts")

    def test_get_all_interventions(self, api_client):
        """Test GET /api/backoffice/interventions"""
        response = api_client.get(f"{BASE_URL}/api/backoffice/interventions")
        assert response.status_code == 200
        
        interventions = response.json()
        assert isinstance(interventions, list)
        print(f"✓ Backoffice interventions retrieved: {len(interventions)} interventions")
