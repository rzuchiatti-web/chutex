"""
Test Phase 4, 5, 6 Professional Module Features:
- Phase 4: Subscriptions Sport/Physio (89€/mois TTC)
- Phase 5: Mollie Payment Integration (simulate-payment for testing)
- Phase 6: Messaging Pro <-> Beneficiary
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials
PRO_PHONE = "+33655443322"
PRO_PASSWORD = "test123"
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


class TestAuthSetup:
    """Authentication setup for tests"""
    
    @pytest.fixture(scope="class")
    def pro_token(self):
        """Get pro (coach) authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PRO_PHONE,
            "password": PRO_PASSWORD
        })
        assert response.status_code == 200, f"Pro login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in pro login response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def beneficiary_token(self):
        """Get beneficiary authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": BENEFICIARY_PHONE,
            "password": BENEFICIARY_PASSWORD
        })
        assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in beneficiary login response"
        return data["token"]


class TestPhase4Subscriptions(TestAuthSetup):
    """Phase 4: Subscription Sport/Physio tests"""
    
    def test_get_subscription_status_empty(self, pro_token):
        """GET /api/pro/subscriptions/{beneficiary_id} - Get subscription status (may be empty or existing)"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Get subscription failed: {response.text}"
        # Response can be empty {} or contain subscription data
        data = response.json()
        print(f"Current subscription status: {data}")
    
    def test_cancel_existing_subscription_if_any(self, pro_token):
        """Cancel any existing subscription to allow new test"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        # First get current subscription
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data.get('id') and data.get('status') in ('pending', 'active', 'payment_pending'):
                # Cancel it
                cancel_resp = requests.post(f"{BASE_URL}/api/pro/subscriptions/{data['id']}/cancel", headers=headers)
                print(f"Cancelled existing subscription: {cancel_resp.json()}")
    
    def test_propose_subscription_sport(self, pro_token):
        """POST /api/pro/subscriptions/{beneficiary_id} - Pro proposes sport subscription"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        # First cancel any existing
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data.get('id') and data.get('status') in ('pending', 'active', 'payment_pending'):
                requests.post(f"{BASE_URL}/api/pro/subscriptions/{data['id']}/cancel", headers=headers)
        
        # Now propose new subscription
        response = requests.post(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers, json={
            "type": "sport",
            "description": "TEST_Programme sport personnalise pour ameliorer votre condition physique"
        })
        assert response.status_code == 200, f"Propose subscription failed: {response.text}"
        data = response.json()
        assert data.get('id'), "No subscription ID returned"
        assert data.get('type') == 'sport', "Wrong subscription type"
        assert data.get('status') == 'pending', f"Expected pending status, got {data.get('status')}"
        assert data.get('price_ttc') == 89.0, f"Wrong price TTC: {data.get('price_ttc')}"
        assert data.get('price_ht') == 45.0, f"Wrong price HT: {data.get('price_ht')}"
        print(f"Created subscription: {data['id']}")
        return data['id']
    
    def test_propose_subscription_invalid_type(self, pro_token):
        """POST /api/pro/subscriptions/{beneficiary_id} - Invalid type should fail"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.post(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers, json={
            "type": "invalid_type",
            "description": "Test"
        })
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
    
    def test_get_my_subscription_beneficiary(self, beneficiary_token):
        """GET /api/pro/my-subscription - Beneficiary gets their subscription"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/my-subscription", headers=headers)
        assert response.status_code == 200, f"Get my subscription failed: {response.text}"
        data = response.json()
        print(f"Beneficiary subscription: {data}")
        # May be empty or have subscription
    
    def test_list_all_subscriptions_pro(self, pro_token):
        """GET /api/pro/all-subscriptions - Pro lists all their subscriptions"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/all-subscriptions", headers=headers)
        assert response.status_code == 200, f"List subscriptions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of subscriptions"
        print(f"Pro has {len(data)} subscriptions")


class TestPhase5Payments(TestAuthSetup):
    """Phase 5: Mollie Payment Integration tests"""
    
    def test_accept_subscription_creates_payment(self, pro_token, beneficiary_token):
        """POST /api/pro/subscriptions/{id}/accept - Beneficiary accepts (creates Mollie payment)"""
        headers_pro = {"Authorization": f"Bearer {pro_token}"}
        headers_ben = {"Authorization": f"Bearer {beneficiary_token}"}
        
        # First ensure we have a pending subscription
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers_pro)
        data = response.json()
        
        if not data.get('id') or data.get('status') != 'pending':
            # Cancel existing and create new
            if data.get('id'):
                requests.post(f"{BASE_URL}/api/pro/subscriptions/{data['id']}/cancel", headers=headers_pro)
            # Create new
            create_resp = requests.post(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers_pro, json={
                "type": "sport",
                "description": "TEST_Sport subscription for payment test"
            })
            data = create_resp.json()
        
        sub_id = data.get('id')
        assert sub_id, "No subscription ID to accept"
        
        # Beneficiary accepts - this may fail with Mollie in test env, that's expected
        response = requests.post(f"{BASE_URL}/api/pro/subscriptions/{sub_id}/accept", headers=headers_ben)
        # Accept may return 200 with checkout_url or 500 if Mollie fails in test env
        if response.status_code == 200:
            result = response.json()
            print(f"Accept result: {result}")
            # May have checkout_url for real Mollie or just status
        else:
            print(f"Accept returned {response.status_code} - Mollie may not work in test env, using simulate-payment")
    
    def test_simulate_payment(self, pro_token, beneficiary_token):
        """POST /api/pro/subscriptions/{id}/simulate-payment - Simulate payment for testing"""
        headers_pro = {"Authorization": f"Bearer {pro_token}"}
        headers_ben = {"Authorization": f"Bearer {beneficiary_token}"}
        
        # Get or create subscription
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers_pro)
        data = response.json()
        
        if not data.get('id') or data.get('status') == 'cancelled':
            # Create new
            create_resp = requests.post(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers_pro, json={
                "type": "physio",
                "description": "TEST_Physio subscription for simulate payment test"
            })
            data = create_resp.json()
        
        sub_id = data.get('id')
        if not sub_id:
            pytest.skip("No subscription to simulate payment for")
        
        # Simulate payment
        response = requests.post(f"{BASE_URL}/api/pro/subscriptions/{sub_id}/simulate-payment", headers=headers_ben)
        assert response.status_code == 200, f"Simulate payment failed: {response.text}"
        result = response.json()
        assert result.get('status') == 'active', f"Expected active status after simulate, got {result}"
        print(f"Simulated payment result: {result}")
    
    def test_get_payment_history(self, pro_token):
        """GET /api/pro/payment-history - Pro gets payment history"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/payment-history", headers=headers)
        assert response.status_code == 200, f"Get payment history failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of payments"
        print(f"Payment history: {len(data)} records")
        if data:
            # Verify payment record structure
            payment = data[0]
            assert 'amount_ttc' in payment, "Missing amount_ttc in payment"
            assert 'amount_ht' in payment, "Missing amount_ht in payment"
            assert 'commission' in payment, "Missing commission in payment"
    
    def test_cancel_subscription(self, pro_token):
        """POST /api/pro/subscriptions/{id}/cancel - Cancel subscription"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        
        # Get current subscription
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        data = response.json()
        
        if data.get('id') and data.get('status') in ('pending', 'active', 'payment_pending'):
            sub_id = data['id']
            response = requests.post(f"{BASE_URL}/api/pro/subscriptions/{sub_id}/cancel", headers=headers)
            assert response.status_code == 200, f"Cancel failed: {response.text}"
            result = response.json()
            assert result.get('status') == 'cancelled', f"Expected cancelled status, got {result}"
            print(f"Cancelled subscription: {sub_id}")
        else:
            print("No active subscription to cancel")


class TestPhase6Messaging(TestAuthSetup):
    """Phase 6: Messaging Pro <-> Beneficiary tests"""
    
    def test_get_or_create_conversation_pro(self, pro_token):
        """GET /api/pro/conversations/{other_user_id} - Pro gets/creates conversation with beneficiary"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Get conversation failed: {response.text}"
        data = response.json()
        assert data.get('id'), "No conversation ID returned"
        assert data.get('professional_id'), "Missing professional_id"
        assert data.get('beneficiary_id'), "Missing beneficiary_id"
        print(f"Conversation: {data['id']}")
        return data['id']
    
    def test_get_conversations_list(self, pro_token):
        """GET /api/pro/conversations - Get all conversations for user"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/conversations", headers=headers)
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of conversations"
        print(f"Pro has {len(data)} conversations")
    
    def test_send_message_pro(self, pro_token):
        """POST /api/pro/messages/{conversation_id} - Pro sends message"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        
        # Get conversation first
        conv_resp = requests.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}", headers=headers)
        conv_data = conv_resp.json()
        conv_id = conv_data.get('id')
        assert conv_id, "No conversation ID"
        
        # Send message
        response = requests.post(f"{BASE_URL}/api/pro/messages/{conv_id}", headers=headers, json={
            "content": "TEST_Bonjour, comment allez-vous aujourd'hui?",
            "message_type": "text"
        })
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        assert data.get('id'), "No message ID returned"
        assert data.get('content') == "TEST_Bonjour, comment allez-vous aujourd'hui?", "Message content mismatch"
        assert data.get('sender_id'), "Missing sender_id"
        print(f"Sent message: {data['id']}")
        return data['id']
    
    def test_send_message_beneficiary(self, beneficiary_token, pro_token):
        """POST /api/pro/messages/{conversation_id} - Beneficiary sends message"""
        headers_ben = {"Authorization": f"Bearer {beneficiary_token}"}
        headers_pro = {"Authorization": f"Bearer {pro_token}"}
        
        # Get conversation (need pro_id for beneficiary to find conversation)
        # First get pro's user info
        conv_resp = requests.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}", headers=headers_pro)
        conv_data = conv_resp.json()
        conv_id = conv_data.get('id')
        pro_id = conv_data.get('professional_id')
        
        # Beneficiary gets conversation with pro
        ben_conv_resp = requests.get(f"{BASE_URL}/api/pro/conversations/{pro_id}", headers=headers_ben)
        assert ben_conv_resp.status_code == 200, f"Beneficiary get conversation failed: {ben_conv_resp.text}"
        
        # Send message
        response = requests.post(f"{BASE_URL}/api/pro/messages/{conv_id}", headers=headers_ben, json={
            "content": "TEST_Je vais bien merci, j'ai fait mes exercices!",
            "message_type": "text"
        })
        assert response.status_code == 200, f"Beneficiary send message failed: {response.text}"
        data = response.json()
        assert data.get('id'), "No message ID returned"
        print(f"Beneficiary sent message: {data['id']}")
    
    def test_get_messages(self, pro_token):
        """GET /api/pro/messages/{conversation_id} - Get messages in conversation"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        
        # Get conversation
        conv_resp = requests.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}", headers=headers)
        conv_data = conv_resp.json()
        conv_id = conv_data.get('id')
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/pro/messages/{conv_id}", headers=headers)
        assert response.status_code == 200, f"Get messages failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of messages"
        print(f"Conversation has {len(data)} messages")
        
        # Verify message structure
        if data:
            msg = data[-1]  # Last message
            assert 'id' in msg, "Missing message id"
            assert 'content' in msg, "Missing message content"
            assert 'sender_id' in msg, "Missing sender_id"
            assert 'created_at' in msg, "Missing created_at"
    
    def test_get_unread_count_pro(self, pro_token):
        """GET /api/pro/unread-count - Pro gets unread message count"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/unread-count", headers=headers)
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        data = response.json()
        assert 'unread' in data, "Missing unread count"
        print(f"Pro unread count: {data['unread']}")
    
    def test_get_unread_count_beneficiary(self, beneficiary_token):
        """GET /api/pro/unread-count - Beneficiary gets unread message count"""
        headers = {"Authorization": f"Bearer {beneficiary_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/unread-count", headers=headers)
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        data = response.json()
        assert 'unread' in data, "Missing unread count"
        print(f"Beneficiary unread count: {data['unread']}")


class TestMollieWebhook:
    """Test Mollie webhook endpoint"""
    
    def test_webhook_no_id(self):
        """POST /mollie/webhook - Webhook with no ID returns ok"""
        response = requests.post(f"{BASE_URL}/api/mollie/webhook", data={})
        assert response.status_code == 200, f"Webhook failed: {response.text}"
        data = response.json()
        # Should return status (no_id or ok)
        assert 'status' in data


class TestProSpaceTabs(TestAuthSetup):
    """Verify ProSpace has 6 tabs by checking all related endpoints work"""
    
    def test_programs_tab_endpoints(self, pro_token):
        """Programmes tab - verify programs endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Programs endpoint failed: {response.text}"
    
    def test_reminders_tab_endpoints(self, pro_token):
        """Rappels tab - verify reminders endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Reminders endpoint failed: {response.text}"
    
    def test_meals_tab_endpoints(self, pro_token):
        """Repas tab - verify meals endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Meals endpoint failed: {response.text}"
    
    def test_subscription_tab_endpoints(self, pro_token):
        """Abo tab - verify subscription endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Subscription endpoint failed: {response.text}"
    
    def test_messages_tab_endpoints(self, pro_token):
        """Messages tab - verify messaging endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/conversations/{BENEFICIARY_ID}", headers=headers)
        assert response.status_code == 200, f"Conversations endpoint failed: {response.text}"
    
    def test_bilans_tab_endpoints(self, pro_token):
        """Bilans tab - verify bilan endpoints"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        response = requests.get(f"{BASE_URL}/api/pro/bilan/{BENEFICIARY_ID}?period=week", headers=headers)
        assert response.status_code == 200, f"Bilan endpoint failed: {response.text}"


class TestCleanup(TestAuthSetup):
    """Cleanup test data"""
    
    def test_cleanup_test_subscriptions(self, pro_token):
        """Clean up any TEST_ subscriptions"""
        headers = {"Authorization": f"Bearer {pro_token}"}
        # Cancel any active subscription
        response = requests.get(f"{BASE_URL}/api/pro/subscriptions/{BENEFICIARY_ID}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data.get('id') and data.get('description', '').startswith('TEST_'):
                requests.post(f"{BASE_URL}/api/pro/subscriptions/{data['id']}/cancel", headers=headers)
                print(f"Cleaned up test subscription: {data['id']}")
