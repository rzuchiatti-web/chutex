"""
Chutex Teleassistance - Iteration 5 Backend Tests
Tests new accounts, reminders, KPI dashboard, enhanced alert reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://alerts-stable.preview.emergentagent.com').rstrip('/')

# New demo accounts with French names
TEST_ACCOUNTS = [
    {"email": "robert.martin@email.fr", "password": "demo123", "expected_role": "beneficiary", "expected_name": "Robert Martin"},
    {"email": "claire.martin@email.fr", "password": "demo123", "expected_role": "guardian", "expected_name": "Claire Martin"},
    {"email": "admin@chutex.fr", "password": "demo123", "expected_role": "admin", "expected_name": "Directeur Chutex"},
    {"email": "plateau@chutex.fr", "password": "demo123", "expected_role": "teleassistance", "expected_name": "Plateau Écoute Chutex"},
]

class TestNewAccountsLogin:
    """Test login with new French demo accounts"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.mark.parametrize("account", TEST_ACCOUNTS)
    def test_login_new_accounts(self, session, account):
        """Test login works for all new French demo accounts"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": account["email"],
            "password": account["password"]
        })
        
        assert response.status_code == 200, f"Login failed for {account['email']}: {response.text}"
        data = response.json()
        
        # Verify token and user
        assert "token" in data, f"No token in response for {account['email']}"
        assert "user" in data, f"No user in response for {account['email']}"
        assert data["user"]["role"] == account["expected_role"], f"Wrong role for {account['email']}"
        assert data["user"]["name"] == account["expected_name"], f"Wrong name for {account['email']}"
        print(f"✅ Login successful: {account['email']} - Role: {account['expected_role']}")


class TestRemindersAPI:
    """Test reminders endpoint for beneficiary"""
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_reminders(self, beneficiary_token):
        """GET /api/reminders returns reminders for logged-in user"""
        response = requests.get(f"{BASE_URL}/api/reminders", 
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 200, f"Failed to get reminders: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Reminders should return a list"
        print(f"✅ GET /api/reminders - Found {len(data)} reminders")
    
    def test_create_reminder(self, beneficiary_token):
        """POST /api/reminders creates a new reminder"""
        response = requests.post(f"{BASE_URL}/api/reminders",
            json={
                "reminder_type": "hydration",
                "title": "Test Hydration Reminder",
                "time": "08:00",
                "days": ["lundi", "mardi", "mercredi"],
                "message": "Test reminder",
                "interval_minutes": 60
            },
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 200, f"Failed to create reminder: {response.text}"
        data = response.json()
        assert "id" in data, "Reminder should have an ID"
        assert data["reminder_type"] == "hydration"
        print(f"✅ POST /api/reminders - Created reminder ID: {data['id'][:8]}...")
        return data["id"]


class TestKPIDashboard:
    """Test KPI dashboard endpoint for admin"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_kpi_dashboard(self, admin_token):
        """GET /api/backoffice/kpi returns KPI dashboard data"""
        response = requests.get(f"{BASE_URL}/api/backoffice/kpi",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Failed to get KPI: {response.text}"
        data = response.json()
        
        # Verify KPI structure
        assert "total_users" in data, "KPI should have total_users"
        assert "total_alerts" in data, "KPI should have total_alerts"
        assert "total_interventions" in data, "KPI should have total_interventions"
        assert "active_subscriptions" in data, "KPI should have active_subscriptions"
        assert "avg_resolution_minutes" in data, "KPI should have avg_resolution_minutes"
        assert "alerts_by_day" in data, "KPI should have alerts_by_day"
        assert "alert_types" in data, "KPI should have alert_types"
        assert "users_by_role" in data, "KPI should have users_by_role"
        assert "interventions_by_status" in data, "KPI should have interventions_by_status"
        
        print(f"✅ GET /api/backoffice/kpi - Total users: {data['total_users']}, Total alerts: {data['total_alerts']}")
        print(f"   Users by role: {data['users_by_role']}")


class TestAlertReportEnhanced:
    """Test enhanced alert report endpoint"""
    
    @pytest.fixture(scope="class")
    def guardian_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_alerts_and_report(self, admin_token):
        """GET /api/alerts/{id}/report returns enhanced alert report"""
        # First get alerts list
        alerts_resp = requests.get(f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert alerts_resp.status_code == 200, f"Failed to get alerts: {alerts_resp.text}"
        alerts = alerts_resp.json()
        
        if len(alerts) > 0:
            alert_id = alerts[0]["id"]
            report_resp = requests.get(f"{BASE_URL}/api/alerts/{alert_id}/report",
                headers={"Authorization": f"Bearer {admin_token}"})
            
            assert report_resp.status_code == 200, f"Failed to get report: {report_resp.text}"
            report = report_resp.json()
            
            # Verify report structure
            assert "alert" in report, "Report should have alert"
            assert "beneficiary" in report, "Report should have beneficiary"
            assert "timeline" in report, "Report should have timeline"
            
            print(f"✅ GET /api/alerts/{alert_id[:8]}.../report - Report retrieved with {len(report['timeline'])} timeline entries")
        else:
            print("⚠️ No alerts found to test report endpoint")


class TestTeleassistanceFeatures:
    """Test teleassistance endpoints"""
    
    @pytest.fixture(scope="class")
    def teleassist_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "plateau@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_subscribers(self, teleassist_token):
        """GET /api/teleassistance/subscribers returns subscribers list"""
        response = requests.get(f"{BASE_URL}/api/teleassistance/subscribers",
            headers={"Authorization": f"Bearer {teleassist_token}"})
        
        assert response.status_code == 200, f"Failed to get subscribers: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Subscribers should return a list"
        print(f"✅ GET /api/teleassistance/subscribers - Found {len(data)} subscribers")
    
    def test_get_protocol_beneficiary(self, teleassist_token):
        """GET /api/teleassistance/protocol/beneficiary returns doubt lifting questions"""
        response = requests.get(f"{BASE_URL}/api/teleassistance/protocol/beneficiary",
            headers={"Authorization": f"Bearer {teleassist_token}"})
        
        assert response.status_code == 200, f"Failed to get protocol: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Protocol should return a list of questions"
        assert len(data) > 0, "Protocol should have at least one question"
        print(f"✅ GET /api/teleassistance/protocol/beneficiary - Found {len(data)} protocol questions")


class TestGuardianFeatures:
    """Test guardian specific endpoints"""
    
    @pytest.fixture(scope="class")
    def guardian_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "claire.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_beneficiaries(self, guardian_token):
        """GET /api/guardian/beneficiaries returns linked beneficiaries"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries",
            headers={"Authorization": f"Bearer {guardian_token}"})
        
        assert response.status_code == 200, f"Failed to get beneficiaries: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Beneficiaries should return a list"
        print(f"✅ GET /api/guardian/beneficiaries - Found {len(data)} linked beneficiaries")
    
    def test_get_interventions(self, guardian_token):
        """GET /api/interventions returns interventions for guardian"""
        response = requests.get(f"{BASE_URL}/api/interventions",
            headers={"Authorization": f"Bearer {guardian_token}"})
        
        assert response.status_code == 200, f"Failed to get interventions: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Interventions should return a list"
        print(f"✅ GET /api/interventions - Found {len(data)} interventions")


class TestBeneficiaryHealth:
    """Test beneficiary health endpoints"""
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "robert.martin@email.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_devices(self, beneficiary_token):
        """GET /api/devices returns user devices"""
        response = requests.get(f"{BASE_URL}/api/devices",
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 200, f"Failed to get devices: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Devices should return a list"
        print(f"✅ GET /api/devices - Found {len(data)} devices")
    
    def test_get_ai_recommendations(self, beneficiary_token):
        """GET /api/ai/recommendations/latest returns AI recommendations"""
        response = requests.get(f"{BASE_URL}/api/ai/recommendations/latest",
            headers={"Authorization": f"Bearer {beneficiary_token}"})
        
        assert response.status_code == 200, f"Failed to get recommendations: {response.text}"
        data = response.json()
        assert "recommendation" in data, "Should have recommendation"
        print(f"✅ GET /api/ai/recommendations/latest - Recommendation retrieved")


class TestBackofficeStats:
    """Test backoffice stats endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_backoffice_stats(self, admin_token):
        """GET /api/backoffice/stats returns all stats"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        data = response.json()
        
        assert "total_users" in data
        assert "beneficiaries" in data
        assert "guardians" in data
        assert "total_alerts" in data
        print(f"✅ GET /api/backoffice/stats - Stats retrieved (Users: {data['total_users']}, Alerts: {data['total_alerts']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
