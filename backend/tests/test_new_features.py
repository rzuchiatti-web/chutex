"""
VitalLink Iteration 4 - New Features Testing
Tests for: Reminders, Data Sharing, KPI Dashboard, Guardian Map, Alert Report, Emails
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://mollie-payment-test.preview.emergentagent.com"

# Test credentials
CREDENTIALS = {
    "beneficiary": {"email": "demo@vitallink.fr", "password": "demo123"},
    "guardian": {"email": "guardian@vitallink.fr", "password": "demo123"},
    "admin": {"email": "admin@vitallink.fr", "password": "demo123"},
    "teleassistance": {"email": "teleassist@vitallink.fr", "password": "demo123"},
}

class TestAuth:
    """Authentication for all roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_beneficiary(self):
        """Test beneficiary login"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "beneficiary"
        print(f"✅ Beneficiary login successful: {data['user']['email']}")
    
    def test_login_guardian(self):
        """Test guardian login"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "guardian"
        print(f"✅ Guardian login successful: {data['user']['email']}")
    
    def test_login_admin(self):
        """Test admin login"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data['user']['email']}")
    
    def test_login_teleassistance(self):
        """Test teleassistance login"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["role"] == "teleassistance"
        print(f"✅ Teleassistance login successful: {data['user']['email']}")


class TestReminders:
    """Test reminders CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as beneficiary
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.created_reminder_id = None
    
    def test_01_create_hydration_reminder(self):
        """Create a hydration reminder"""
        reminder_data = {
            "reminder_type": "hydration",
            "title": "TEST_Boire de l'eau",
            "time": "08:00",
            "days": ["lun", "mar", "mer", "jeu", "ven"],
            "notes": "Au moins 8 verres par jour",
            "dosage": "",
            "interval_minutes": 120
        }
        resp = self.session.post(f"{BASE_URL}/api/reminders", json=reminder_data)
        assert resp.status_code == 200, f"Create reminder failed: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert data["reminder_type"] == "hydration"
        assert data["title"] == "TEST_Boire de l'eau"
        assert data["interval_minutes"] == 120
        self.__class__.hydration_reminder_id = data["id"]
        print(f"✅ Hydration reminder created: {data['id']}")
    
    def test_02_create_medication_reminder(self):
        """Create a medication reminder"""
        reminder_data = {
            "reminder_type": "medication",
            "title": "TEST_Prendre médicament",
            "time": "09:00",
            "days": ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
            "notes": "Avec de l'eau",
            "dosage": "1 comprimé",
            "interval_minutes": 0
        }
        resp = self.session.post(f"{BASE_URL}/api/reminders", json=reminder_data)
        assert resp.status_code == 200, f"Create medication reminder failed: {resp.text}"
        data = resp.json()
        assert data["reminder_type"] == "medication"
        assert data["dosage"] == "1 comprimé"
        self.__class__.medication_reminder_id = data["id"]
        print(f"✅ Medication reminder created: {data['id']}")
    
    def test_03_create_alarm_reminder(self):
        """Create an activity/alarm reminder"""
        reminder_data = {
            "reminder_type": "alarm",
            "title": "TEST_Marche quotidienne",
            "time": "17:00",
            "days": ["lun", "mer", "ven"],
            "notes": "15 minutes de marche",
            "dosage": "",
            "interval_minutes": 0
        }
        resp = self.session.post(f"{BASE_URL}/api/reminders", json=reminder_data)
        assert resp.status_code == 200, f"Create alarm reminder failed: {resp.text}"
        data = resp.json()
        assert data["reminder_type"] == "alarm"
        self.__class__.alarm_reminder_id = data["id"]
        print(f"✅ Alarm reminder created: {data['id']}")
    
    def test_04_get_reminders(self):
        """Get list of reminders"""
        resp = self.session.get(f"{BASE_URL}/api/reminders")
        assert resp.status_code == 200, f"Get reminders failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        # Should have at least our test reminders
        test_reminders = [r for r in data if r.get("title", "").startswith("TEST_")]
        assert len(test_reminders) >= 1, "No test reminders found"
        print(f"✅ Get reminders successful: {len(data)} total reminders")
    
    def test_05_complete_reminder(self):
        """Mark a reminder as complete"""
        if not hasattr(self.__class__, 'hydration_reminder_id'):
            pytest.skip("No hydration reminder to complete")
        
        rid = self.__class__.hydration_reminder_id
        resp = self.session.put(f"{BASE_URL}/api/reminders/{rid}/complete")
        assert resp.status_code == 200, f"Complete reminder failed: {resp.text}"
        data = resp.json()
        assert data["status"] == "completed"
        assert "date" in data
        print(f"✅ Reminder completed for date: {data['date']}")
    
    def test_06_toggle_reminder(self):
        """Toggle reminder active/inactive"""
        if not hasattr(self.__class__, 'medication_reminder_id'):
            pytest.skip("No medication reminder to toggle")
        
        rid = self.__class__.medication_reminder_id
        resp = self.session.put(f"{BASE_URL}/api/reminders/{rid}/toggle")
        assert resp.status_code == 200, f"Toggle reminder failed: {resp.text}"
        data = resp.json()
        assert data["status"] == "toggled"
        assert "active" in data
        print(f"✅ Reminder toggled, active: {data['active']}")
    
    def test_07_delete_reminder(self):
        """Delete a reminder"""
        if not hasattr(self.__class__, 'alarm_reminder_id'):
            pytest.skip("No alarm reminder to delete")
        
        rid = self.__class__.alarm_reminder_id
        resp = self.session.delete(f"{BASE_URL}/api/reminders/{rid}")
        assert resp.status_code == 200, f"Delete reminder failed: {resp.text}"
        data = resp.json()
        assert data["status"] == "deleted"
        print(f"✅ Reminder deleted: {rid}")
        
        # Verify it's deleted
        resp = self.session.get(f"{BASE_URL}/api/reminders")
        reminders = resp.json()
        deleted_ids = [r['id'] for r in reminders]
        assert rid not in deleted_ids, "Reminder still exists after deletion"


class TestDataSharing:
    """Test data sharing preferences"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as beneficiary
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_data_sharing_prefs(self):
        """Get current data sharing preferences"""
        resp = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert resp.status_code == 200, f"Get data sharing failed: {resp.text}"
        data = resp.json()
        # Should have default preferences
        assert isinstance(data, dict)
        print(f"✅ Data sharing prefs retrieved: {len(data)} settings")
    
    def test_02_update_data_sharing_prefs(self):
        """Update data sharing preferences"""
        new_prefs = {
            "share_heart_rate": True,
            "share_blood_pressure": True,
            "share_spo2": True,
            "share_temperature": False,  # Disable temperature sharing
            "share_steps": True,
            "share_weight": False,  # Disable weight sharing
            "share_stress": True,
            "share_sleep": True,
            "share_location": True,
            "share_alerts": True
        }
        resp = self.session.put(f"{BASE_URL}/api/settings/data-sharing", json=new_prefs)
        assert resp.status_code == 200, f"Update data sharing failed: {resp.text}"
        data = resp.json()
        assert data["status"] == "updated"
        assert "prefs" in data
        print(f"✅ Data sharing prefs updated successfully")
    
    def test_03_verify_data_sharing_update(self):
        """Verify data sharing preferences were saved"""
        resp = self.session.get(f"{BASE_URL}/api/settings/data-sharing")
        assert resp.status_code == 200
        data = resp.json()
        # Verify our changes persisted
        assert data.get("share_temperature") == False or data.get("share_temperature") is False
        assert data.get("share_weight") == False or data.get("share_weight") is False
        print(f"✅ Data sharing prefs verified after update")


class TestGuardianMap:
    """Test guardian beneficiaries map endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as guardian
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["guardian"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_guardian_map(self):
        """Get guardian beneficiaries map data"""
        resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries/map")
        assert resp.status_code == 200, f"Get guardian map failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        if len(data) > 0:
            ben = data[0]
            assert "id" in ben
            assert "name" in ben
            # Check for location and devices
            print(f"✅ Guardian map data retrieved: {len(data)} beneficiaries")
            for b in data:
                print(f"   - {b.get('name')}: location={bool(b.get('location'))}, devices={len(b.get('devices', []))}")
        else:
            print(f"✅ Guardian map API working (no linked beneficiaries)")


class TestKPIDashboard:
    """Test KPI dashboard endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_kpi_data(self):
        """Get KPI dashboard data"""
        resp = self.session.get(f"{BASE_URL}/api/backoffice/kpi")
        assert resp.status_code == 200, f"Get KPI data failed: {resp.text}"
        data = resp.json()
        
        # Verify all expected KPI fields
        assert "alerts_by_day" in data
        assert isinstance(data["alerts_by_day"], list)
        assert len(data["alerts_by_day"]) == 30, "Should have 30 days of alert data"
        
        assert "alert_types" in data
        assert isinstance(data["alert_types"], dict)
        
        assert "avg_resolution_minutes" in data
        assert isinstance(data["avg_resolution_minutes"], (int, float))
        
        assert "users_by_role" in data
        assert isinstance(data["users_by_role"], dict)
        
        assert "interventions_by_status" in data
        assert isinstance(data["interventions_by_status"], dict)
        
        assert "active_subscriptions" in data
        assert "pending_subscriptions" in data
        assert "total_users" in data
        assert "total_alerts" in data
        assert "total_interventions" in data
        
        print(f"✅ KPI data retrieved successfully:")
        print(f"   - Total users: {data['total_users']}")
        print(f"   - Total alerts: {data['total_alerts']}")
        print(f"   - Total interventions: {data['total_interventions']}")
        print(f"   - Avg resolution time: {data['avg_resolution_minutes']} min")
        print(f"   - Active subscriptions: {data['active_subscriptions']}")


class TestAlertReport:
    """Test enhanced alert report endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as teleassistance
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["teleassistance"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_create_test_alert(self):
        """Create a test alert to test report"""
        # Login as beneficiary first
        ben_session = requests.Session()
        ben_session.headers.update({"Content-Type": "application/json"})
        resp = ben_session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        ben_session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Create anomaly alert (not SOS to avoid Twilio)
        alert_data = {
            "alert_type": "anomaly",
            "severity": "medium",
            "message": "TEST_Alert for report testing",
            "device_type": "bracelet"
        }
        resp = ben_session.post(f"{BASE_URL}/api/alerts", json=alert_data)
        assert resp.status_code == 200, f"Create alert failed: {resp.text}"
        data = resp.json()
        self.__class__.test_alert_id = data["id"]
        print(f"✅ Test alert created: {data['id']}")
    
    def test_02_get_alert_report(self):
        """Get enhanced alert report"""
        if not hasattr(self.__class__, 'test_alert_id'):
            # Get any existing alert
            resp = self.session.get(f"{BASE_URL}/api/alerts")
            alerts = resp.json()
            if not alerts:
                pytest.skip("No alerts to get report for")
            alert_id = alerts[0]["id"]
        else:
            alert_id = self.__class__.test_alert_id
        
        resp = self.session.get(f"{BASE_URL}/api/alerts/{alert_id}/report")
        assert resp.status_code == 200, f"Get alert report failed: {resp.text}"
        data = resp.json()
        
        # Verify report structure
        assert "alert" in data
        assert "beneficiary" in data
        assert "escalations" in data
        assert "calls" in data
        assert "interventions" in data
        assert "timeline" in data
        
        assert isinstance(data["timeline"], list)
        
        print(f"✅ Alert report retrieved:")
        print(f"   - Alert type: {data['alert']['alert_type']}")
        print(f"   - Beneficiary: {data['beneficiary']['name'] if data['beneficiary'] else 'N/A'}")
        print(f"   - Timeline events: {len(data['timeline'])}")
        print(f"   - Escalations: {len(data['escalations'])}")
        print(f"   - Calls: {len(data['calls'])}")


class TestEmailEndpoint:
    """Test email viewing endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_sent_emails(self):
        """Get list of sent emails (admin only)"""
        resp = self.session.get(f"{BASE_URL}/api/emails")
        assert resp.status_code == 200, f"Get emails failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✅ Email list retrieved: {len(data)} emails")
        if len(data) > 0:
            email = data[0]
            print(f"   - Latest: to={email.get('to')}, subject={email.get('subject')[:30]}...")
    
    def test_02_email_endpoint_forbidden_for_non_admin(self):
        """Verify non-admin cannot access emails"""
        # Login as beneficiary
        ben_session = requests.Session()
        ben_session.headers.update({"Content-Type": "application/json"})
        resp = ben_session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        token = resp.json()["token"]
        ben_session.headers.update({"Authorization": f"Bearer {token}"})
        
        resp = ben_session.get(f"{BASE_URL}/api/emails")
        assert resp.status_code == 403, "Non-admin should not access emails"
        print(f"✅ Email endpoint correctly returns 403 for non-admin")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as beneficiary
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["beneficiary"])
        assert resp.status_code == 200
        token = resp.json()["token"]
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_cleanup_reminders(self):
        """Delete test reminders"""
        resp = self.session.get(f"{BASE_URL}/api/reminders")
        reminders = resp.json()
        deleted = 0
        for r in reminders:
            if r.get("title", "").startswith("TEST_"):
                del_resp = self.session.delete(f"{BASE_URL}/api/reminders/{r['id']}")
                if del_resp.status_code == 200:
                    deleted += 1
        print(f"✅ Cleanup: deleted {deleted} test reminders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
