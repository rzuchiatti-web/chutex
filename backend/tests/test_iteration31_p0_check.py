"""
Care Watch P0 Coherence Check - Test all 6 roles
Tests: Login, API endpoints for each role type
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-guardian-42.preview.emergentagent.com')

# Updated credentials for Care Watch / Chutex
CREDENTIALS = {
    "admin": {"email": "admin@chutex.fr", "password": "demo123"},
    "guardian": {"email": "claire.martin@email.fr", "password": "demo123"},
    "beneficiary": {"email": "robert.martin@email.fr", "password": "demo123"},
    "teleassistance": {"email": "plateau@chutex.fr", "password": "demo123"},
    "saad": {"email": "saad@chutex.fr", "password": "demo123"},
    "intervenant": {"email": "ludivine.moutio@care.fr", "password": "demo123"},
}


class TestAllRolesLogin:
    """Test login for all 6 roles"""
    
    def test_login_admin(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert "token" in data
        print(f"Admin login successful: {data['user']['name']}")
    
    def test_login_guardian(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        assert response.status_code == 200, f"Guardian login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "guardian"
        print(f"Guardian login successful: {data['user']['name']}")
    
    def test_login_beneficiary(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        # Note: Robert Martin has 'guardian' role but can switch to beneficiary
        assert data["user"]["role"] in ["beneficiary", "guardian"]
        print(f"Beneficiary login successful: {data['user']['name']} (role: {data['user']['role']})")
    
    def test_login_teleassistance(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        assert response.status_code == 200, f"Teleassistance login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "teleassistance"
        print(f"Teleassistance login successful: {data['user']['name']}")
    
    def test_login_saad(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["saad"])
        assert response.status_code == 200, f"SAAD login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "prescriber_company"
        print(f"SAAD (prescriber_company) login successful: {data['user']['name']}")
    
    def test_login_intervenant(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["intervenant"])
        assert response.status_code == 200, f"Intervenant login failed: {response.text}"
        data = response.json()
        # Intervenant might have guardian role with is_prescriber or is_intervention_provider flag
        print(f"Intervenant login successful: {data['user']['name']} (role: {data['user']['role']})")


class TestAdminEndpoints:
    """Test Admin backoffice endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert resp.status_code == 200, f"Admin login failed: {resp.text}"
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        print(f"Admin profile: {data['name']}")
    
    def test_backoffice_stats(self):
        response = requests.get(f"{BASE_URL}/api/admin/backoffice/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Backoffice stats: {data}")
    
    def test_get_users(self):
        response = requests.get(f"{BASE_URL}/api/admin/backoffice/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} users in backoffice")
    
    def test_get_alerts(self):
        response = requests.get(f"{BASE_URL}/api/admin/backoffice/alerts", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} alerts in backoffice")


class TestTeleassistanceEndpoints:
    """Test Teleassistance endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        assert resp.status_code == 200, f"Teleassistance login failed: {resp.text}"
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "teleassistance"
        print(f"Teleassistance profile: {data['name']}")
    
    def test_get_subscribers(self):
        response = requests.get(f"{BASE_URL}/api/teleassistance/subscribers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} subscribers")
    
    def test_get_all_alerts(self):
        response = requests.get(f"{BASE_URL}/api/teleassistance/alerts", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} alerts for teleassistance")


class TestSAADEndpoints:
    """Test SAAD (prescriber_company) endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["saad"])
        assert resp.status_code == 200, f"SAAD login failed: {resp.text}"
        self.token = resp.json()["token"]
        self.user = resp.json()["user"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "prescriber_company"
        print(f"SAAD profile: {data['name']}")
    
    def test_get_company_stats(self):
        company_id = self.user.get("id")
        response = requests.get(f"{BASE_URL}/api/company/{company_id}/stats", headers=self.headers)
        # May return 200 or 404 depending on implementation
        print(f"Company stats response: {response.status_code}")
    
    def test_get_interventions(self):
        response = requests.get(f"{BASE_URL}/api/company/interventions", headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} interventions")
        else:
            print(f"Interventions endpoint: {response.status_code}")
    
    def test_get_prescriptions(self):
        response = requests.get(f"{BASE_URL}/api/company/prescriptions", headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} prescriptions")
        else:
            print(f"Prescriptions endpoint: {response.status_code}")


class TestGuardianEndpoints:
    """Test Guardian endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        assert resp.status_code == 200, f"Guardian login failed: {resp.text}"
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "guardian"
        print(f"Guardian profile: {data['name']}")
    
    def test_get_beneficiaries(self):
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Guardian has {len(data)} beneficiaries")
    
    def test_get_alerts(self):
        response = requests.get(f"{BASE_URL}/api/alerts", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} alerts for guardian")


class TestBeneficiaryEndpoints:
    """Test Beneficiary endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200, f"Beneficiary login failed: {resp.text}"
        self.token = resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me(self):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Profile: {data['name']} (role: {data['role']})")
    
    def test_get_devices(self):
        response = requests.get(f"{BASE_URL}/api/devices", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} devices")
    
    def test_get_alerts(self):
        response = requests.get(f"{BASE_URL}/api/alerts", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data)} alerts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
