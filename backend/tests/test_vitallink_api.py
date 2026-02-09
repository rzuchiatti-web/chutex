import pytest
import requests
import os
import time

# Backend API tests for VitalLink AI
# Tests: Auth, Devices, Alerts, Medications, AI Recommendations, Guardian features

# Load BASE_URL from frontend .env if not in environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
if not BASE_URL:
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip()
                    break
    except:
        pass
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found")
BASE_URL = BASE_URL.rstrip('/')

class TestAuth:
    """Authentication endpoint tests"""

    def test_register_beneficiary(self, api_client):
        """Test beneficiary registration"""
        payload = {
            "email": f"TEST_beneficiary_{int(time.time())}@test.com",
            "password": "test123",
            "name": "Test Bénéficiaire",
            "phone": "0612345678",
            "role": "beneficiary"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token missing in response"
        assert "user" in data, "User missing in response"
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["role"] == "beneficiary"
        print(f"✓ Beneficiary registration successful: {data['user']['email']}")

    def test_register_guardian(self, api_client):
        """Test guardian registration"""
        payload = {
            "email": f"TEST_guardian_{int(time.time())}@test.com",
            "password": "test123",
            "name": "Test Gardien",
            "phone": "0698765432",
            "role": "guardian"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert data["user"]["role"] == "guardian"
        print(f"✓ Guardian registration successful: {data['user']['email']}")

    def test_register_duplicate_email(self, api_client):
        """Test duplicate email registration fails"""
        email = f"TEST_duplicate_{int(time.time())}@test.com"
        payload = {
            "email": email,
            "password": "test123",
            "name": "Test User",
            "phone": "0612345678",
            "role": "beneficiary"
        }
        # First registration
        response1 = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response2.status_code == 400, "Duplicate email should return 400"
        assert "déjà utilisé" in response2.json()["detail"].lower()
        print("✓ Duplicate email rejected correctly")

    def test_login_success(self, api_client):
        """Test login with correct credentials"""
        # Use existing test account
        payload = {
            "email": "test@beneficiaire.com",
            "password": "test123"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful for {payload['email']}")

    def test_login_incorrect_password(self, api_client):
        """Test login with incorrect password"""
        payload = {
            "email": "test@beneficiaire.com",
            "password": "wrongpassword"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401, "Should return 401 for wrong password"
        print("✓ Incorrect password rejected")

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email"""
        payload = {
            "email": "nonexistent@test.com",
            "password": "test123"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401
        print("✓ Non-existent user rejected")

    def test_get_me_with_valid_token(self, api_client):
        """Test GET /api/auth/me with valid token"""
        # Login first
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        
        # Get user info
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert "email" in user
        assert "role" in user
        print(f"✓ GET /me successful: {user['email']}")

    def test_get_me_without_token(self, api_client):
        """Test GET /api/auth/me without token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ GET /me without token rejected")


class TestDevices:
    """Device sync and management tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        """Get beneficiary token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_sync_bracelet(self, api_client, beneficiary_token):
        """Test bracelet device sync"""
        payload = {
            "device_type": "bracelet",
            "data": {}
        }
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Sync failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "synced"
        assert "data" in data
        assert "heart_rate" in data["data"]
        assert "battery" in data
        print(f"✓ Bracelet synced: HR={data['data']['heart_rate']}, Battery={data['battery']}%")

    def test_sync_scale(self, api_client, beneficiary_token):
        """Test scale device sync"""
        payload = {
            "device_type": "scale",
            "data": {}
        }
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "weight" in data["data"]
        assert "bmi" in data["data"]
        print(f"✓ Scale synced: Weight={data['data']['weight']}kg, BMI={data['data']['bmi']}")

    def test_sync_vest(self, api_client, beneficiary_token):
        """Test vest device sync"""
        payload = {
            "device_type": "vest",
            "data": {}
        }
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "connected" in data["data"]
        assert "battery" in data
        assert "fall_detected" in data["data"]
        print(f"✓ Vest synced: Connected={data['data']['connected']}, Battery={data['battery']}%, Fall detected={data['data']['fall_detected']}")

    def test_get_devices(self, api_client, beneficiary_token):
        """Test GET /api/devices"""
        response = api_client.get(
            f"{BASE_URL}/api/devices",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        devices = response.json()
        assert isinstance(devices, list)
        assert len(devices) == 3, "Beneficiary should have 3 devices"
        device_types = [d["device_type"] for d in devices]
        assert "bracelet" in device_types
        assert "scale" in device_types
        assert "vest" in device_types
        print(f"✓ GET devices successful: {len(devices)} devices")

    def test_get_latest_readings(self, api_client, beneficiary_token):
        """Test GET /api/devices/latest"""
        # Sync a device first
        api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json={"device_type": "bracelet", "data": {}},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        
        response = api_client.get(
            f"{BASE_URL}/api/devices/latest",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        readings = response.json()
        assert "bracelet" in readings
        assert "data" in readings["bracelet"]
        print(f"✓ GET latest readings successful")


class TestAlerts:
    """Alert management tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_create_sos_alert(self, api_client, beneficiary_token):
        """Test POST /api/alerts for SOS"""
        payload = {
            "alert_type": "sos",
            "severity": "critical",
            "message": "Test SOS Alert",
            "device_type": "bracelet"
        }
        response = api_client.post(
            f"{BASE_URL}/api/alerts",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Alert creation failed: {response.text}"
        
        data = response.json()
        assert data["alert_type"] == "sos"
        assert data["status"] == "active"
        assert "id" in data
        print(f"✓ SOS alert created: {data['id']}")
        return data["id"]

    def test_get_alerts(self, api_client, beneficiary_token):
        """Test GET /api/alerts"""
        response = api_client.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"✓ GET alerts successful: {len(alerts)} alerts")

    def test_resolve_alert(self, api_client, beneficiary_token):
        """Test PUT /api/alerts/{id}/resolve"""
        # Create alert first
        create_response = api_client.post(
            f"{BASE_URL}/api/alerts",
            json={
                "alert_type": "test",
                "severity": "medium",
                "message": "Test alert for resolution",
                "device_type": "bracelet"
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        alert_id = create_response.json()["id"]
        
        # Resolve it
        response = api_client.put(
            f"{BASE_URL}/api/alerts/{alert_id}/resolve",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "resolved"
        print(f"✓ Alert resolved: {alert_id}")


class TestMedications:
    """Medication management tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_create_medication(self, api_client, beneficiary_token):
        """Test POST /api/medications"""
        payload = {
            "name": "Test Aspirin",
            "dosage": "500mg",
            "frequency": "quotidien",
            "times": ["08:00", "20:00"],
            "notes": "Test medication"
        }
        response = api_client.post(
            f"{BASE_URL}/api/medications",
            json=payload,
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Medication creation failed: {response.text}"
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["active"] == True
        assert "id" in data
        print(f"✓ Medication created: {data['name']}")
        return data["id"]

    def test_get_medications(self, api_client, beneficiary_token):
        """Test GET /api/medications"""
        response = api_client.get(
            f"{BASE_URL}/api/medications",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        medications = response.json()
        assert isinstance(medications, list)
        print(f"✓ GET medications successful: {len(medications)} medications")

    def test_delete_medication(self, api_client, beneficiary_token):
        """Test DELETE /api/medications/{id}"""
        # Create medication first
        create_response = api_client.post(
            f"{BASE_URL}/api/medications",
            json={
                "name": "Test Med to Delete",
                "dosage": "100mg",
                "frequency": "quotidien",
                "times": ["09:00"],
                "notes": ""
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        med_id = create_response.json()["id"]
        
        # Delete it
        response = api_client.delete(
            f"{BASE_URL}/api/medications/{med_id}",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"
        
        # Verify it's not in active list
        get_response = api_client.get(
            f"{BASE_URL}/api/medications",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        meds = get_response.json()
        assert not any(m["id"] == med_id for m in meds)
        print(f"✓ Medication deleted: {med_id}")


class TestAI:
    """AI recommendations tests"""

    @pytest.fixture
    def beneficiary_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@beneficiaire.com",
            "password": "test123"
        })
        return response.json()["token"]

    def test_ai_recommendations(self, api_client, beneficiary_token):
        """Test POST /api/ai/recommendations"""
        # Sync device first to have data
        api_client.post(
            f"{BASE_URL}/api/devices/sync",
            json={"device_type": "bracelet", "data": {}},
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        
        response = api_client.post(
            f"{BASE_URL}/api/ai/recommendations",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"AI recommendation failed: {response.text}"
        
        data = response.json()
        assert "recommendation" in data
        assert "generated_at" in data
        assert len(data["recommendation"]) > 0
        print(f"✓ AI recommendation generated: {data['recommendation'][:100]}...")

    def test_get_latest_recommendation(self, api_client, beneficiary_token):
        """Test GET /api/ai/recommendations/latest"""
        response = api_client.get(
            f"{BASE_URL}/api/ai/recommendations/latest",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendation" in data
        print(f"✓ Latest AI recommendation retrieved")


class TestGuardian:
    """Guardian-specific features tests"""

    @pytest.fixture
    def guardian_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "gardien@test.com",
            "password": "test123"
        })
        if response.status_code == 401:
            # Create guardian if doesn't exist
            reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
                "email": "gardien@test.com",
                "password": "test123",
                "name": "Test Guardian",
                "phone": "0698765432",
                "role": "guardian"
            })
            return reg_response.json()["token"]
        return response.json()["token"]

    def test_link_beneficiary(self, api_client, guardian_token):
        """Test POST /api/guardian/link"""
        payload = {
            "beneficiary_email": "test@beneficiaire.com"
        }
        response = api_client.post(
            f"{BASE_URL}/api/guardian/link",
            json=payload,
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Link failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "linked"
        assert "beneficiary" in data
        print(f"✓ Beneficiary linked: {data['beneficiary']['email']}")

    def test_get_beneficiaries(self, api_client, guardian_token):
        """Test GET /api/guardian/beneficiaries"""
        response = api_client.get(
            f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        beneficiaries = response.json()
        assert isinstance(beneficiaries, list)
        print(f"✓ GET beneficiaries successful: {len(beneficiaries)} beneficiaries")

    def test_create_prescription(self, api_client, guardian_token):
        """Test POST /api/guardian/prescriptions"""
        payload = {
            "beneficiary_name": "Test Patient",
            "beneficiary_email": "patient@test.com",
            "beneficiary_phone": "0612345678",
            "subscription_type": "standard",
            "notes": "Test prescription"
        }
        response = api_client.post(
            f"{BASE_URL}/api/guardian/prescriptions",
            json=payload,
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Prescription creation failed: {response.text}"
        
        data = response.json()
        assert data["beneficiary_name"] == payload["beneficiary_name"]
        assert data["status"] == "pending"
        assert data["commission"] == 15.0
        print(f"✓ Prescription created: {data['beneficiary_name']} - {data['commission']}€")

    def test_get_prescriptions(self, api_client, guardian_token):
        """Test GET /api/guardian/prescriptions"""
        response = api_client.get(
            f"{BASE_URL}/api/guardian/prescriptions",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200
        
        prescriptions = response.json()
        assert isinstance(prescriptions, list)
        print(f"✓ GET prescriptions successful: {len(prescriptions)} prescriptions")

    def test_link_nonexistent_beneficiary(self, api_client, guardian_token):
        """Test linking non-existent beneficiary fails"""
        payload = {
            "beneficiary_email": "nonexistent_beneficiary@test.com"
        }
        response = api_client.post(
            f"{BASE_URL}/api/guardian/link",
            json=payload,
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 404
        print("✓ Non-existent beneficiary link rejected")
