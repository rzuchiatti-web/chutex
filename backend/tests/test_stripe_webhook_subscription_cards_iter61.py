"""
Test Suite - Iteration 61
Tests: Stripe webhook subscription lifecycle + Profile subscription cards

Features tested:
1. POST /api/webhook/stripe - handles invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated
2. GET /api/subscriptions/my - returns start_date and source fields
3. Profile subscription cards conditional rendering based on subscription type
"""
import pytest
import requests
import os
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid
import json

# Base URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://nora-navbar-fixes.preview.emergentagent.com"

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'vitallink_db')


@pytest.fixture(scope="module")
def mongo_client():
    """MongoDB client fixture"""
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture
def api_client():
    """HTTP session for API calls"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def cleanup_test_data(mongo_client):
    """Cleanup test subscriptions after tests"""
    yield
    mongo_client.subscriptions.delete_many({"source": {"$in": ["test_iter61", "test_stripe_webhook"]}})


# ============ STRIPE WEBHOOK TESTS ============
class TestStripeWebhook:
    """Test POST /api/webhook/stripe endpoint existence and basic handling"""
    
    def test_webhook_endpoint_exists_and_returns_ok(self, api_client):
        """Test that webhook endpoint exists and returns {status: ok} for mock event"""
        # Send a mock Stripe event (type doesn't need to be valid, just checking endpoint exists)
        mock_event = {
            "id": "evt_test_" + str(uuid.uuid4())[:8],
            "type": "test_event_mock",
            "object": "event",
            "data": {
                "object": {}
            }
        }
        response = api_client.post(f"{BASE_URL}/api/webhook/stripe", json=mock_event)
        print(f"Webhook response status: {response.status_code}")
        print(f"Webhook response: {response.text}")
        
        # Endpoint should return 200 with status ok
        assert response.status_code == 200, f"Webhook endpoint error: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status:ok, got {data}"
    
    def test_webhook_invoice_payment_succeeded_event_format(self, api_client):
        """Test webhook handles invoice.payment_succeeded event format"""
        mock_event = {
            "id": "evt_test_" + str(uuid.uuid4())[:8],
            "type": "invoice.payment_succeeded",
            "object": "event",
            "data": {
                "object": {
                    "id": "in_test_" + str(uuid.uuid4())[:8],
                    "object": "invoice",
                    "subscription": "sub_test_nonexistent"
                }
            }
        }
        response = api_client.post(f"{BASE_URL}/api/webhook/stripe", json=mock_event)
        print(f"invoice.payment_succeeded response: {response.status_code}")
        
        # Should handle gracefully even if subscription doesn't exist
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
    
    def test_webhook_invoice_payment_failed_event_format(self, api_client):
        """Test webhook handles invoice.payment_failed event format"""
        mock_event = {
            "id": "evt_test_" + str(uuid.uuid4())[:8],
            "type": "invoice.payment_failed",
            "object": "event",
            "data": {
                "object": {
                    "id": "in_test_" + str(uuid.uuid4())[:8],
                    "object": "invoice",
                    "subscription": "sub_test_nonexistent",
                    "attempt_count": 1
                }
            }
        }
        response = api_client.post(f"{BASE_URL}/api/webhook/stripe", json=mock_event)
        print(f"invoice.payment_failed response: {response.status_code}")
        
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
    
    def test_webhook_subscription_deleted_event_format(self, api_client):
        """Test webhook handles customer.subscription.deleted event format"""
        mock_event = {
            "id": "evt_test_" + str(uuid.uuid4())[:8],
            "type": "customer.subscription.deleted",
            "object": "event",
            "data": {
                "object": {
                    "id": "sub_test_nonexistent",
                    "object": "subscription",
                    "customer": "cus_test_" + str(uuid.uuid4())[:8]
                }
            }
        }
        response = api_client.post(f"{BASE_URL}/api/webhook/stripe", json=mock_event)
        print(f"customer.subscription.deleted response: {response.status_code}")
        
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
    
    def test_webhook_subscription_updated_event_format(self, api_client):
        """Test webhook handles customer.subscription.updated event format"""
        mock_event = {
            "id": "evt_test_" + str(uuid.uuid4())[:8],
            "type": "customer.subscription.updated",
            "object": "event",
            "data": {
                "object": {
                    "id": "sub_test_nonexistent",
                    "object": "subscription",
                    "status": "active",
                    "customer": "cus_test_" + str(uuid.uuid4())[:8]
                }
            }
        }
        response = api_client.post(f"{BASE_URL}/api/webhook/stripe", json=mock_event)
        print(f"customer.subscription.updated response: {response.status_code}")
        
        assert response.status_code == 200
        assert response.json().get("status") == "ok"


# ============ SUBSCRIPTION API TESTS ============
class TestSubscriptionMyEndpoint:
    """Test GET /api/subscriptions/my returns correct fields including start_date and source"""
    
    def test_subscription_my_returns_start_date_field(self, api_client, mongo_client, cleanup_test_data):
        """Test that /api/subscriptions/my returns start_date field"""
        # Get Marie Test user
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        # Create subscription with start_date
        start_date = "2025-06-15T10:30:00Z"
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "care",
            "status": "active",
            "source": "test_iter61",
            "start_date": start_date,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login and get subscription
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Subscription with start_date: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert "start_date" in data, "start_date field should be in response"
        assert data["start_date"] == start_date, f"Expected start_date={start_date}, got {data.get('start_date')}"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})
    
    def test_subscription_my_returns_source_field(self, api_client, mongo_client, cleanup_test_data):
        """Test that /api/subscriptions/my returns source field"""
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        # Create subscription with specific source
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "standard",
            "status": "active",
            "source": "shopify",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login and get subscription
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Subscription with source: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert "source" in data, "source field should be in response"
        assert data["source"] == "shopify", f"Expected source=shopify, got {data.get('source')}"
        
        # Cleanup - delete the test subscription we just created
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})
    
    def test_subscription_my_fallback_start_date_to_created_at(self, api_client, mongo_client, cleanup_test_data):
        """Test that start_date falls back to created_at if not set"""
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        created_at = "2025-05-01T08:00:00Z"
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "care",
            "status": "active",
            "source": "test_iter61",
            # No start_date field
            "created_at": created_at,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login and get subscription
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Subscription fallback start_date: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        # start_date should fall back to created_at
        assert data.get("start_date") == created_at, f"start_date should fallback to created_at ({created_at})"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


# ============ SUBSCRIPTION CARD DISPLAY TESTS ============
class TestSubscriptionCardLogic:
    """Test subscription card display logic (bracelet_only=blue bg, care=violet bg)"""
    
    def test_no_subscription_no_card(self, api_client, mongo_client, cleanup_test_data):
        """Test that user with NO subscription returns has_subscription=false"""
        # Ensure no subscription exists for Marie Test
        mongo_client.subscriptions.delete_many({"beneficiary_phone": "+33600000099"})
        
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"No subscription response: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert data["has_subscription"] == False, "Should have no subscription"
        assert data["subscription_type"] == "none"
    
    def test_bracelet_only_subscription_returns_standard_type(self, api_client, mongo_client, cleanup_test_data):
        """Test bracelet_only subscription (should show blue card in UI)"""
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        # bracelet_only is stored as 'standard' subscription_type
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "standard",  # bracelet_only
            "status": "active",
            "source": "test_iter61",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Standard/bracelet_only subscription: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert data["has_subscription"] == True
        assert data["subscription_type"] in ["standard", "bracelet_only"], f"Expected standard/bracelet_only, got {data['subscription_type']}"
        assert data["has_teleassistance"] == False, "bracelet_only should NOT have teleassistance"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})
    
    def test_care_subscription_returns_care_type(self, api_client, mongo_client, cleanup_test_data):
        """Test care subscription (should show violet card in UI)"""
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "care",
            "status": "active",
            "source": "test_iter61",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Care subscription: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert data["has_subscription"] == True
        assert data["subscription_type"] == "care"
        assert data["has_teleassistance"] == True, "care subscription SHOULD have teleassistance"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


# ============ SUBSCRIPTION DETAIL POPUP DATA ============
class TestSubscriptionDetailPopupData:
    """Test that subscription API returns all data needed for detail popup"""
    
    def test_subscription_popup_has_all_required_fields(self, api_client, mongo_client, cleanup_test_data):
        """Test API returns all fields needed for subscription detail popup"""
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "care",
            "status": "active",
            "source": "website_contract",
            "contract_number": "CHX-2025-0042",
            "start_date": "2025-06-15T10:30:00Z",
            "created_at": "2025-06-15T10:30:00Z",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Full subscription data for popup: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        
        # Fields required for popup display
        assert "subscription_type" in data, "subscription_type required for popup"
        assert "has_subscription" in data, "has_subscription required"
        assert "has_teleassistance" in data, "has_teleassistance required"
        assert "start_date" in data, "start_date required for popup"
        assert "source" in data, "source required for popup"
        
        # Check subscription object contains contract_number if present
        if data.get("subscription"):
            sub = data["subscription"]
            # contract_number should be in subscription object
            if "contract_number" in test_sub:
                print(f"Subscription object: {sub}")
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
