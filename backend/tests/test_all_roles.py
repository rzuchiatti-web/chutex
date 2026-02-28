"""
VitalLink - Comprehensive test suite for all 4 user roles and features
Tests: Login, dashboards, health data, alerts, devices, admin backoffice
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://saad-guardian-ui.preview.emergentagent.com')

# Test credentials
CREDENTIALS = {
    "admin": {"email": "admin@vitallink.fr", "password": "demo123"},
    "guardian": {"email": "guardian@vitallink.fr", "password": "demo123"},
    "beneficiary": {"email": "demo@vitallink.fr", "password": "demo123"},
    "teleassistance": {"email": "teleassist@vitallink.fr", "password": "demo123"},
}

class TestAuth:
    """Test login for all 4 roles"""
    
    def test_login_admin(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert "token" in data
        print(f"✅ Admin login successful: {data['user']['name']}")
    
    def test_login_guardian(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "guardian"
        print(f"✅ Guardian login successful: {data['user']['name']}")
    
    def test_login_beneficiary(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "beneficiary"
        print(f"✅ Beneficiary login successful: {data['user']['name']}")
    
    def test_login_teleassistance(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        assert response.status_code == 200, f"Teleassistance login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "teleassistance"
        print(f"✅ Teleassistance login successful: {data['user']['name']}")


class TestBeneficiaryFeatures:
    """Test beneficiary dashboard, health, alerts, devices"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "beneficiary"
        print(f"✅ Beneficiary profile: {data['name']}")
    
    def test_get_devices(self):
        response = requests.get(f"{BASE_URL}/api/devices", headers=self.headers)
        assert response.status_code == 200
        devices = response.json()
        assert isinstance(devices, list)
        print(f"✅ Beneficiary has {len(devices)} devices")
    
    def test_sync_bracelet(self):
        response = requests.post(f"{BASE_URL}/api/devices/sync", 
            headers=self.headers,
            json={"device_type": "bracelet", "data": {}})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "heart_rate" in data["data"]
        print(f"✅ Bracelet sync: heart_rate={data['data']['heart_rate']} bpm")
    
    def test_sync_scale(self):
        response = requests.post(f"{BASE_URL}/api/devices/sync",
            headers=self.headers,
            json={"device_type": "scale", "data": {}})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "weight" in data["data"]
        print(f"✅ Scale sync: weight={data['data']['weight']} kg")
    
    def test_get_latest_readings(self):
        response = requests.get(f"{BASE_URL}/api/devices/latest", headers=self.headers)
        assert response.status_code == 200
        print("✅ Got latest device readings")
    
    def test_get_alerts(self):
        response = requests.get(f"{BASE_URL}/api/alerts", headers=self.headers)
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"✅ Beneficiary has {len(alerts)} alerts")
    
    def test_create_test_alert_anomaly(self):
        """Create a test anomaly alert (not SOS to avoid triggering Twilio)"""
        response = requests.post(f"{BASE_URL}/api/alerts",
            headers=self.headers,
            json={"alert_type": "anomaly", "severity": "medium", "message": "Test anomaly alert", "device_type": "bracelet"})
        assert response.status_code == 200
        data = response.json()
        assert data["alert_type"] == "anomaly"
        print(f"✅ Created test alert: {data['id'][:8]}...")
        return data["id"]
    
    def test_health_history(self):
        response = requests.get(f"{BASE_URL}/api/health/history/heart_rate", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        print(f"✅ Got health history with {len(data['history'])} entries")
    
    def test_health_thresholds(self):
        response = requests.get(f"{BASE_URL}/api/health/thresholds", headers=self.headers)
        assert response.status_code == 200
        print("✅ Got health thresholds")
    
    def test_medications(self):
        response = requests.get(f"{BASE_URL}/api/medications", headers=self.headers)
        assert response.status_code == 200
        print("✅ Got medications list")


class TestGuardianFeatures:
    """Test guardian dashboard, linked beneficiaries"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "guardian"
        print(f"✅ Guardian profile: {data['name']}")
    
    def test_get_beneficiaries(self):
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert response.status_code == 200
        beneficiaries = response.json()
        assert isinstance(beneficiaries, list)
        print(f"✅ Guardian has {len(beneficiaries)} linked beneficiaries")
        for b in beneficiaries:
            print(f"   - {b['name']}: HR={b.get('latest_vitals', {}).get('heart_rate', 'N/A')} bpm")
    
    def test_get_alerts_as_guardian(self):
        response = requests.get(f"{BASE_URL}/api/alerts", headers=self.headers)
        assert response.status_code == 200
        alerts = response.json()
        print(f"✅ Guardian sees {len(alerts)} alerts")
    
    def test_get_prescriptions(self):
        response = requests.get(f"{BASE_URL}/api/guardian/prescriptions", headers=self.headers)
        assert response.status_code == 200
        prescriptions = response.json()
        assert isinstance(prescriptions, list)
        print(f"✅ Guardian has {len(prescriptions)} prescriptions")


class TestTeleassistanceFeatures:
    """Test teleassistance dashboard, real-time alerts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "teleassistance"
        print(f"✅ Teleassistance profile: {data['name']}")
    
    def test_get_all_alerts(self):
        """Teleassistance sees all alerts in real-time"""
        response = requests.get(f"{BASE_URL}/api/alerts", headers=self.headers)
        assert response.status_code == 200
        alerts = response.json()
        active = [a for a in alerts if a["status"] == "active"]
        print(f"✅ Teleassistance sees {len(alerts)} total alerts, {len(active)} active")
    
    def test_get_subscribers(self):
        response = requests.get(f"{BASE_URL}/api/teleassistance/subscribers", headers=self.headers)
        assert response.status_code == 200
        subscribers = response.json()
        assert isinstance(subscribers, list)
        print(f"✅ {len(subscribers)} subscribed beneficiaries")
    
    def test_get_active_escalations(self):
        response = requests.get(f"{BASE_URL}/api/escalation/active", headers=self.headers)
        assert response.status_code == 200
        escalations = response.json()
        print(f"✅ {len(escalations)} active escalations")
    
    def test_get_beneficiary_protocol(self):
        response = requests.get(f"{BASE_URL}/api/teleassistance/protocol/beneficiary", headers=self.headers)
        assert response.status_code == 200
        protocol = response.json()
        assert isinstance(protocol, list)
        print(f"✅ Got beneficiary protocol with {len(protocol)} questions")
    
    def test_get_interventions(self):
        response = requests.get(f"{BASE_URL}/api/interventions", headers=self.headers)
        assert response.status_code == 200
        interventions = response.json()
        print(f"✅ {len(interventions)} interventions")


class TestAdminBackoffice:
    """Test admin backoffice - stats, users, codes, prescriptions, interventions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        print(f"✅ Admin profile: {data['name']}")
    
    def test_get_backoffice_stats(self):
        """Admin can access backoffice stats"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats", headers=self.headers)
        assert response.status_code == 200
        stats = response.json()
        assert "total_users" in stats
        assert "beneficiaries" in stats
        assert "guardians" in stats
        assert "active_alerts" in stats
        assert "prescriptions" in stats
        assert "interventions" in stats
        print(f"✅ Backoffice stats: {stats['total_users']} users, {stats['beneficiaries']} beneficiaries, {stats['guardians']} guardians")
        print(f"   - {stats['active_alerts']} active alerts, {stats['prescriptions']} prescriptions")
    
    def test_get_backoffice_users(self):
        """Admin can see all users"""
        response = requests.get(f"{BASE_URL}/api/backoffice/users", headers=self.headers)
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"✅ Backoffice users: {len(users)} users listed")
        for u in users[:5]:
            print(f"   - {u['name']} ({u['role']})")
    
    def test_get_activation_codes(self):
        """Admin can see activation codes"""
        response = requests.get(f"{BASE_URL}/api/admin/activation-codes", headers=self.headers)
        assert response.status_code == 200
        codes = response.json()
        assert isinstance(codes, list)
        active_codes = [c for c in codes if c["active"]]
        print(f"✅ {len(codes)} activation codes, {len(active_codes)} active")
    
    def test_create_activation_code(self):
        """Admin can create new intervention code"""
        response = requests.post(f"{BASE_URL}/api/admin/activation-codes",
            headers=self.headers,
            json={"structure_name": "TEST_Structure", "max_uses": 10})
        assert response.status_code == 200
        data = response.json()
        assert "code" in data
        assert data["structure_name"] == "TEST_Structure"
        print(f"✅ Created activation code: {data['code']} for {data['structure_name']}")
        return data["id"]
    
    def test_get_backoffice_prescriptions(self):
        """Admin can see all prescriptions"""
        response = requests.get(f"{BASE_URL}/api/backoffice/prescriptions", headers=self.headers)
        assert response.status_code == 200
        prescriptions = response.json()
        print(f"✅ Backoffice prescriptions: {len(prescriptions)} total")
    
    def test_get_backoffice_interventions(self):
        """Admin can see all interventions"""
        response = requests.get(f"{BASE_URL}/api/backoffice/interventions", headers=self.headers)
        assert response.status_code == 200
        interventions = response.json()
        print(f"✅ Backoffice interventions: {len(interventions)} total")
    
    def test_get_backoffice_alerts(self):
        """Admin can see all alerts"""
        response = requests.get(f"{BASE_URL}/api/backoffice/alerts", headers=self.headers)
        assert response.status_code == 200
        alerts = response.json()
        print(f"✅ Backoffice alerts: {len(alerts)} total")


class TestProfileAndLocation:
    """Test profile info and location sharing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        self.token = resp.json()["token"]
        self.user_id = resp.json()["user"]["id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_location_update(self):
        response = requests.post(f"{BASE_URL}/api/location/update",
            headers=self.headers,
            json={"latitude": 48.8566, "longitude": 2.3522})
        assert response.status_code == 200
        print("✅ Location updated")
    
    def test_get_location(self):
        response = requests.get(f"{BASE_URL}/api/location/{self.user_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "latitude" in data
        assert "longitude" in data
        print(f"✅ Got location: {data['latitude']}, {data['longitude']}")
    
    def test_location_sharing_modes(self):
        for mode in ["always", "alert_only", "never"]:
            response = requests.put(f"{BASE_URL}/api/location/sharing",
                headers=self.headers,
                json={"mode": mode})
            assert response.status_code == 200
            print(f"✅ Set location sharing mode: {mode}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
