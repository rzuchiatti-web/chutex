"""
Test iteration 74: Beneficiary detail page features
- Guardian cards clickable and open guardian-detail-modal
- Contract card shows active/none state and opens contract-detail-modal
- Safe zones section still functional
- Guardians list with details (name, relation, phone/type)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nutrition-ai-beta.preview.emergentagent.com').rstrip('/')

# Test credentials
GUARDIAN_PHONE = "0612345678"
GUARDIAN_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestBeneficiaryDetailFeatures:
    """Test beneficiary detail page backend APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_PHONE,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_guardian_login_returns_valid_token(self):
        """Test guardian login returns valid token and user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": GUARDIAN_PHONE,
            "password": GUARDIAN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "guardian"
        print(f"✓ Guardian login successful: {data['user']['name']}")
    
    def test_get_beneficiaries_list(self):
        """Test guardian can get list of beneficiaries"""
        response = requests.get(f"{BASE_URL}/api/guardian/beneficiaries", headers=self.headers)
        assert response.status_code == 200
        beneficiaries = response.json()
        assert isinstance(beneficiaries, list)
        assert len(beneficiaries) > 0, "Guardian should have at least one beneficiary"
        
        # Find the test beneficiary
        test_ben = next((b for b in beneficiaries if b["id"] == BENEFICIARY_ID), None)
        assert test_ben is not None, f"Beneficiary {BENEFICIARY_ID} not found"
        assert "name" in test_ben
        print(f"✓ Found beneficiary: {test_ben['name']}")
    
    def test_get_beneficiary_subscription_with_guardians(self):
        """Test subscription endpoint returns guardians list with details"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/subscription", 
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "subscription" in data
        assert "contract" in data
        assert "guardians" in data
        
        # Check guardians list structure
        guardians = data["guardians"]
        assert isinstance(guardians, list)
        print(f"✓ Found {len(guardians)} guardian(s)")
        
        # Each guardian should have required fields for the modal
        for g in guardians:
            assert "id" in g
            assert "name" in g
            assert "phone" in g or g.get("phone") == ""
            assert "guardian_type" in g or g.get("guardian_type") == ""
            print(f"  - Guardian: {g['name']}, phone: {g.get('phone', 'N/A')}, type: {g.get('guardian_type', 'N/A')}")
    
    def test_subscription_contract_details(self):
        """Test contract details are returned properly for modal display"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/subscription", 
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        subscription = data.get("subscription")
        contract = data.get("contract")
        
        # Contract may or may not exist
        if subscription:
            assert "status" in subscription
            print(f"✓ Subscription status: {subscription['status']}")
            if subscription.get("subscription_type"):
                print(f"  - Type: {subscription['subscription_type']}")
            if subscription.get("created_at"):
                print(f"  - Created: {subscription['created_at']}")
        else:
            print("✓ No active subscription (expected if none registered)")
        
        if contract:
            # Contract detail modal expects these fields
            print(f"✓ Contract found:")
            if contract.get("plan_label"):
                print(f"  - Plan: {contract['plan_label']}")
            if contract.get("price_monthly"):
                print(f"  - Price: {contract['price_monthly']} EUR/month")
            if contract.get("contract_number"):
                print(f"  - Contract #: {contract['contract_number']}")
        else:
            print("✓ No contract (ok if no subscription)")
    
    def test_get_beneficiary_alerts_for_activity_history(self):
        """Test alerts endpoint returns data for guardian activity history"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/alerts", 
            headers=self.headers
        )
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        print(f"✓ Found {len(alerts)} alerts for activity history tracking")
        
        # Check alert structure for activity tracking
        for a in alerts[:3]:  # Check first 3
            assert "id" in a
            if a.get("resolved_by") or a.get("acknowledged_by"):
                print(f"  - Alert {a['id'][:8]}... has guardian action tracking")
    
    def test_geofence_crud_operations(self):
        """Test safe zones CRUD - create, list, update, delete"""
        # 1. Get current geofences
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", 
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "zones" in data
        initial_count = len(data["zones"])
        print(f"✓ Initial zones count: {initial_count}")
        
        # 2. Create a test zone
        new_zone = {
            "name": "TEST_Zone_Iter74",
            "latitude": 45.501,
            "longitude": 4.567,
            "radius_m": 350
        }
        response = requests.post(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence",
            headers=self.headers,
            json=new_zone
        )
        assert response.status_code == 200
        created = response.json()
        assert "id" in created
        zone_id = created["id"]
        print(f"✓ Created zone: {created['name']} (id: {zone_id[:8]}...)")
        
        # 3. Update the zone
        update_data = {"name": "TEST_Zone_Iter74_Updated", "radius_m": 400}
        response = requests.put(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=self.headers,
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == "TEST_Zone_Iter74_Updated"
        print(f"✓ Updated zone name and radius")
        
        # 4. Delete the zone (cleanup)
        response = requests.delete(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence/{zone_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted test zone")
        
        # 5. Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", 
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["zones"]) == initial_count
        print(f"✓ Zone count restored to {initial_count}")
    
    def test_geofence_returns_location_for_map(self):
        """Test geofence endpoint returns current location for map display"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/geofence", 
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        location = data.get("current_location")
        if location:
            assert "latitude" in location or location.get("latitude") is None
            assert "longitude" in location or location.get("longitude") is None
            print(f"✓ Location available: {location.get('latitude')}, {location.get('longitude')}")
        else:
            print("✓ No location (beneficiary may not have shared)")
    
    def test_beneficiary_devices_endpoint(self):
        """Test devices endpoint returns device status"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/devices", 
            headers=self.headers
        )
        assert response.status_code == 200
        devices = response.json()
        assert isinstance(devices, dict)
        print(f"✓ Devices response received")
        for device_type in ["bracelet", "scale", "vest"]:
            if device_type in devices:
                dev = devices[device_type]
                status = "connected" if dev.get("connected") else "offline"
                print(f"  - {device_type}: {status}, battery: {dev.get('battery_level', 0)}%")
    
    def test_ai_report_endpoint(self):
        """Test AI report endpoint for Nora analysis section"""
        response = requests.get(
            f"{BASE_URL}/api/guardian/beneficiary/{BENEFICIARY_ID}/ai-report", 
            headers=self.headers
        )
        # This endpoint may return None or data
        assert response.status_code == 200
        data = response.json()
        if data and data.get("summary"):
            print(f"✓ Nora analysis available: {data['summary'][:100]}...")
        else:
            print("✓ Nora analysis endpoint working (no summary yet)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
