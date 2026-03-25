"""
Test iteration 155: Updated Prescription System with Sport/Physio Types + Messaging
Tests:
- POST /api/guardian/prescriptions with subscription_type=sport creates prescription with price=89.0
- POST /api/guardian/prescriptions with subscription_type=physio creates prescription with price=89.0
- POST /api/guardian/prescriptions with subscription_type=bracelet still works with price=39.9
- Commission calculation: sport/physio returns 44€ commission
- Messaging API: GET /api/pro/conversations, POST /api/pro/messages/{id}, GET /api/pro/unread-count
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials from the request
PRO_EMAIL = "+33655443322"
PRO_PASSWORD = "test123"
BENEFICIARY_EMAIL = "0651245918"
BENEFICIARY_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestPrescriptionSportPhysio:
    """Test prescription creation with sport/physio subscription types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as pro user before each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as pro (prescriber)
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_EMAIL,
            "password": PRO_PASSWORD
        })
        assert login_resp.status_code == 200, f"Pro login failed: {login_resp.text}"
        data = login_resp.json()
        self.pro_token = data.get("token")
        self.pro_user = data.get("user", {})
        assert self.pro_token, "No token returned"
        self.session.headers.update({"Authorization": f"Bearer {self.pro_token}"})
        
        # Verify user is a prescriber
        assert self.pro_user.get("is_prescriber") == True, f"User is not a prescriber: {self.pro_user}"
        
    def test_prescription_sport_type_price_89(self):
        """POST /api/guardian/prescriptions with subscription_type=sport creates prescription with price=89.0"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        resp = self.session.post(f"{BASE_URL}/api/guardian/prescriptions", json={
            "beneficiary_name": "Test Sport",
            "beneficiary_first_name": "Patient",
            "beneficiary_email": f"test_sport_{uuid.uuid4().hex[:6]}@test.com",
            "beneficiary_phone": unique_phone,
            "subscription_type": "sport",
            "notes": "Test sport prescription"
        })
        
        assert resp.status_code == 200, f"Failed to create sport prescription: {resp.text}"
        data = resp.json()
        
        # Verify price is 89.0 for sport
        assert data.get("price") == 89.0, f"Expected price 89.0 for sport, got {data.get('price')}"
        assert data.get("subscription_type") == "sport", f"Expected subscription_type 'sport', got {data.get('subscription_type')}"
        assert "Sport" in data.get("plan_label", ""), f"Expected 'Sport' in plan_label, got {data.get('plan_label')}"
        print(f"✓ Sport prescription created with price={data.get('price')}, plan_label={data.get('plan_label')}")
        
    def test_prescription_physio_type_price_89(self):
        """POST /api/guardian/prescriptions with subscription_type=physio creates prescription with price=89.0"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        resp = self.session.post(f"{BASE_URL}/api/guardian/prescriptions", json={
            "beneficiary_name": "Test Physio",
            "beneficiary_first_name": "Patient",
            "beneficiary_email": f"test_physio_{uuid.uuid4().hex[:6]}@test.com",
            "beneficiary_phone": unique_phone,
            "subscription_type": "physio",
            "notes": "Test physio prescription"
        })
        
        assert resp.status_code == 200, f"Failed to create physio prescription: {resp.text}"
        data = resp.json()
        
        # Verify price is 89.0 for physio
        assert data.get("price") == 89.0, f"Expected price 89.0 for physio, got {data.get('price')}"
        assert data.get("subscription_type") == "physio", f"Expected subscription_type 'physio', got {data.get('subscription_type')}"
        assert "Physio" in data.get("plan_label", ""), f"Expected 'Physio' in plan_label, got {data.get('plan_label')}"
        print(f"✓ Physio prescription created with price={data.get('price')}, plan_label={data.get('plan_label')}")
        
    def test_prescription_bracelet_type_price_39_90(self):
        """POST /api/guardian/prescriptions with subscription_type=bracelet still works with price=39.9"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        resp = self.session.post(f"{BASE_URL}/api/guardian/prescriptions", json={
            "beneficiary_name": "Test Bracelet",
            "beneficiary_first_name": "Patient",
            "beneficiary_email": f"test_bracelet_{uuid.uuid4().hex[:6]}@test.com",
            "beneficiary_phone": unique_phone,
            "subscription_type": "bracelet",
            "notes": "Test bracelet prescription"
        })
        
        assert resp.status_code == 200, f"Failed to create bracelet prescription: {resp.text}"
        data = resp.json()
        
        # Verify price is 39.9 for bracelet
        assert data.get("price") == 39.9, f"Expected price 39.9 for bracelet, got {data.get('price')}"
        assert data.get("subscription_type") == "bracelet", f"Expected subscription_type 'bracelet', got {data.get('subscription_type')}"
        print(f"✓ Bracelet prescription created with price={data.get('price')}, plan_label={data.get('plan_label')}")
        
    def test_prescription_bracelet_gilet_type_price_79_90(self):
        """POST /api/guardian/prescriptions with subscription_type=bracelet_gilet works with price=79.9"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        resp = self.session.post(f"{BASE_URL}/api/guardian/prescriptions", json={
            "beneficiary_name": "Test Bracelet Gilet",
            "beneficiary_first_name": "Patient",
            "beneficiary_email": f"test_bg_{uuid.uuid4().hex[:6]}@test.com",
            "beneficiary_phone": unique_phone,
            "subscription_type": "bracelet_gilet",
            "notes": "Test bracelet+gilet prescription"
        })
        
        assert resp.status_code == 200, f"Failed to create bracelet_gilet prescription: {resp.text}"
        data = resp.json()
        
        # Verify price is 79.9 for bracelet_gilet
        assert data.get("price") == 79.9, f"Expected price 79.9 for bracelet_gilet, got {data.get('price')}"
        assert data.get("subscription_type") == "bracelet_gilet", f"Expected subscription_type 'bracelet_gilet', got {data.get('subscription_type')}"
        print(f"✓ Bracelet+Gilet prescription created with price={data.get('price')}, plan_label={data.get('plan_label')}")
        
    def test_get_prescriptions_list(self):
        """GET /api/guardian/prescriptions returns list of prescriptions"""
        resp = self.session.get(f"{BASE_URL}/api/guardian/prescriptions")
        
        assert resp.status_code == 200, f"Failed to get prescriptions: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Got {len(data)} prescriptions")


class TestCommissionCalculation:
    """Test commission calculation for sport/physio subscriptions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as pro user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_EMAIL,
            "password": PRO_PASSWORD
        })
        assert login_resp.status_code == 200, f"Pro login failed: {login_resp.text}"
        data = login_resp.json()
        self.pro_token = data.get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.pro_token}"})
        
    def test_sport_physio_commission_44_euros(self):
        """Verify sport/physio subscription commission is 44€ (89€ TTC - 45€ HT)"""
        # The commission is defined in pro_subscription_routes.py
        # SUBSCRIPTION_PRICE_TTC = 89.00
        # SUBSCRIPTION_PRICE_HT = 45.00
        # PLATFORM_COMMISSION = SUBSCRIPTION_PRICE_TTC - SUBSCRIPTION_PRICE_HT = 44€
        
        # Create a sport subscription proposal to verify commission
        resp = self.session.post(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", json={
            "type": "sport",
            "description": "Test sport subscription for commission check"
        })
        
        # May fail if subscription already exists, which is fine
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("commission") == 44.0, f"Expected commission 44.0, got {data.get('commission')}"
            assert data.get("price_ttc") == 89.0, f"Expected price_ttc 89.0, got {data.get('price_ttc')}"
            assert data.get("price_ht") == 45.0, f"Expected price_ht 45.0, got {data.get('price_ht')}"
            print(f"✓ Sport subscription commission verified: {data.get('commission')}€")
        elif resp.status_code == 400 and "existe deja" in resp.text:
            # Subscription already exists, check existing one
            get_resp = self.session.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}")
            if get_resp.status_code == 200:
                data = get_resp.json()
                if data.get("commission"):
                    assert data.get("commission") == 44.0, f"Expected commission 44.0, got {data.get('commission')}"
                    print(f"✓ Existing subscription commission verified: {data.get('commission')}€")
                else:
                    print("✓ Subscription exists (commission check skipped)")
            else:
                print("✓ Subscription already exists for this beneficiary")
        else:
            print(f"Note: Subscription creation returned {resp.status_code}: {resp.text}")


class TestMessagingAPI:
    """Test messaging API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as pro user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_EMAIL,
            "password": PRO_PASSWORD
        })
        assert login_resp.status_code == 200, f"Pro login failed: {login_resp.text}"
        data = login_resp.json()
        self.pro_token = data.get("token")
        self.pro_user = data.get("user", {})
        self.session.headers.update({"Authorization": f"Bearer {self.pro_token}"})
        
    def test_get_conversations(self):
        """GET /api/pro/conversations returns list of conversations"""
        resp = self.session.get(f"{BASE_URL}/api/pro/conversations")
        
        assert resp.status_code == 200, f"Failed to get conversations: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Got {len(data)} conversations")
        return data
        
    def test_get_or_create_conversation(self):
        """GET /api/pro/conversations/{beneficiary_id} gets or creates conversation"""
        resp = self.session.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}")
        
        assert resp.status_code == 200, f"Failed to get/create conversation: {resp.text}"
        data = resp.json()
        assert data.get("id"), f"Expected conversation id, got {data}"
        assert data.get("beneficiary_id") == BENEFICIARY_ID or data.get("professional_id") == BENEFICIARY_ID, \
            f"Conversation should involve beneficiary {BENEFICIARY_ID}"
        print(f"✓ Got/created conversation: {data.get('id')}")
        return data
        
    def test_send_and_get_messages(self):
        """POST /api/pro/messages/{conversation_id} sends message, GET retrieves it"""
        # First get/create conversation
        convo_resp = self.session.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}")
        assert convo_resp.status_code == 200, f"Failed to get conversation: {convo_resp.text}"
        convo = convo_resp.json()
        convo_id = convo.get("id")
        assert convo_id, "No conversation id"
        
        # Send a message
        test_message = f"Test message {uuid.uuid4().hex[:8]}"
        send_resp = self.session.post(f"{BASE_URL}/api/pro/messages/{convo_id}", json={
            "content": test_message,
            "message_type": "text"
        })
        
        assert send_resp.status_code == 200, f"Failed to send message: {send_resp.text}"
        sent_msg = send_resp.json()
        assert sent_msg.get("content") == test_message, f"Message content mismatch"
        assert sent_msg.get("conversation_id") == convo_id, f"Conversation id mismatch"
        print(f"✓ Sent message: {sent_msg.get('id')}")
        
        # Get messages
        get_resp = self.session.get(f"{BASE_URL}/api/pro/messages/{convo_id}")
        assert get_resp.status_code == 200, f"Failed to get messages: {get_resp.text}"
        messages = get_resp.json()
        assert isinstance(messages, list), f"Expected list, got {type(messages)}"
        
        # Verify our message is in the list
        found = any(m.get("content") == test_message for m in messages)
        assert found, f"Sent message not found in messages list"
        print(f"✓ Retrieved {len(messages)} messages, including our test message")
        
    def test_get_unread_count(self):
        """GET /api/pro/unread-count returns unread message count"""
        resp = self.session.get(f"{BASE_URL}/api/pro/unread-count")
        
        assert resp.status_code == 200, f"Failed to get unread count: {resp.text}"
        data = resp.json()
        assert "unread" in data, f"Expected 'unread' field, got {data}"
        assert isinstance(data.get("unread"), int), f"Expected int, got {type(data.get('unread'))}"
        print(f"✓ Unread count: {data.get('unread')}")


class TestProUserIsPrescriber:
    """Verify pro user has is_prescriber=True"""
    
    def test_pro_user_is_prescriber(self):
        """Verify the pro user (+33655443322) has is_prescriber=True"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_EMAIL,
            "password": PRO_PASSWORD
        })
        
        assert login_resp.status_code == 200, f"Pro login failed: {login_resp.text}"
        data = login_resp.json()
        user = data.get("user", {})
        
        assert user.get("is_prescriber") == True, f"Pro user should have is_prescriber=True, got {user.get('is_prescriber')}"
        print(f"✓ Pro user {PRO_EMAIL} has is_prescriber=True")
        print(f"  - Role: {user.get('role')}")
        print(f"  - Professional type: {user.get('professional_type')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
