"""
Subscription System Tests - Iteration 60
Tests: Login, subscription status, late-linking, care vs bracelet_only subscription types
"""
import pytest
import requests
import os
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid
import re

# Base URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://loader-standardize.preview.emergentagent.com"

# MongoDB connection for direct DB operations
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'vitallink_db')

def normalize_phone(phone: str) -> str:
    """Normalize phone number for matching"""
    cleaned = re.sub(r'[\s\-\.\(\)]', '', phone.strip())
    if cleaned.startswith('0') and len(cleaned) == 10:
        cleaned = '+33' + cleaned[1:]
    return cleaned


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
def cleanup_test_subscriptions(mongo_client):
    """Cleanup any test subscriptions after tests"""
    yield
    # Delete test subscriptions after each test
    mongo_client.subscriptions.delete_many({"source": "test_iter60"})


class TestNoSubscriptionUser:
    """Tests for user Marie Test (phone: 0600000099) without subscription"""
    
    def test_login_success(self, api_client):
        """Test login with no-sub user credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        assert "user" in data, "No user in login response"
        # Phone is stored normalized as +33 format
        assert data["user"]["phone"] in ["0600000099", "+33600000099"], "Wrong phone in response"
    
    def test_subscription_my_returns_no_subscription(self, api_client):
        """Test /api/subscriptions/my returns has_subscription=false for no-sub user"""
        # Login first
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        
        # Get subscription status
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        print(f"Subscription response status: {response.status_code}")
        print(f"Subscription response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_subscription"] == False, "Expected has_subscription=False"
        assert data["can_use_bracelet"] == False, "Expected can_use_bracelet=False"
        assert data["has_teleassistance"] == False, "Expected has_teleassistance=False"
        assert data["subscription_type"] == "none", "Expected subscription_type=none"


class TestLateLinking:
    """Tests for late subscription linking (user creates account first, subscribes later)"""
    
    def test_late_linking_by_phone(self, api_client, mongo_client, cleanup_test_subscriptions):
        """Test that subscription gets auto-linked when user calls /api/subscriptions/my"""
        # Get the user ID for Marie Test (phone stored as +33 format)
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found in DB"
        user_id = user["id"]
        print(f"Found user Marie Test with id: {user_id}")
        
        # Create a subscription with phone but NO beneficiary_id (simulating Shopify order before account)
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",  # Normalized phone
            "beneficiary_id": "",  # Empty - not linked yet
            "subscription_type": "standard",
            "status": "active",
            "source": "test_iter60",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        print(f"Created test subscription with id: {test_sub['id']}")
        
        # Now login and call /api/subscriptions/my
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        
        # Get subscription - this should trigger late-linking
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        print(f"Subscription response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_subscription"] == True, "Should have subscription after late-linking"
        assert data["can_use_bracelet"] == True, "Should be able to use bracelet"
        
        # Verify in DB that beneficiary_id was linked
        updated_sub = mongo_client.subscriptions.find_one({"id": test_sub["id"]})
        print(f"Updated subscription: {updated_sub}")
        assert updated_sub["beneficiary_id"] == user_id, f"Expected beneficiary_id={user_id}, got {updated_sub.get('beneficiary_id')}"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


class TestSubscriptionTypes:
    """Tests for different subscription types: bracelet_only vs care"""
    
    def test_bracelet_only_no_teleassistance(self, api_client, mongo_client, cleanup_test_subscriptions):
        """Test that bracelet_only subscription returns has_teleassistance=false"""
        # Get user (phone stored as +33 format)
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        user_id = user["id"]
        
        # Create bracelet_only subscription (also called 'standard')
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user_id,
            "subscription_type": "standard",  # bracelet_only/standard
            "status": "active",
            "source": "test_iter60",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login and check
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Bracelet-only subscription response: {data}")
        
        assert data["has_subscription"] == True
        assert data["can_use_bracelet"] == True
        assert data["has_teleassistance"] == False, "standard/bracelet_only should NOT have teleassistance"
        assert data["subscription_type"] == "standard"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})
    
    def test_care_subscription_has_teleassistance(self, api_client, mongo_client, cleanup_test_subscriptions):
        """Test that care subscription returns has_teleassistance=true"""
        # Get user (phone stored as +33 format)
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        user_id = user["id"]
        
        # Create care subscription
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user_id,
            "subscription_type": "care",
            "status": "active",
            "source": "test_iter60",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login and check
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        print(f"Care subscription response: {data}")
        
        assert data["has_subscription"] == True
        assert data["can_use_bracelet"] == True
        assert data["has_teleassistance"] == True, "care subscription SHOULD have teleassistance"
        assert data["subscription_type"] == "care"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


class TestPhoneNormalization:
    """Tests for phone normalization in subscription lookup"""
    
    def test_lookup_with_0_prefix(self, api_client, mongo_client, cleanup_test_subscriptions):
        """Test that subscription lookup works with 0600000099 format"""
        # Phone is stored as +33 format in DB
        user = mongo_client.users.find_one({"phone": "+33600000099"})
        assert user, "Marie Test user not found"
        
        # Create subscription with +33 format
        test_sub = {
            "id": str(uuid.uuid4()),
            "beneficiary_phone": "+33600000099",
            "beneficiary_id": user["id"],
            "subscription_type": "care",
            "status": "active",
            "source": "test_iter60",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        mongo_client.subscriptions.insert_one(test_sub)
        
        # Login with 0600000099 (should still find subscription)
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        token = login_resp.json()["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        data = response.json()
        
        assert data["has_subscription"] == True, "Should find subscription despite phone format difference"
        
        # Cleanup
        mongo_client.subscriptions.delete_one({"id": test_sub["id"]})


class TestAPIEndpoints:
    """Tests for subscription-related API endpoints"""
    
    def test_health_check(self, api_client):
        """Test that API is reachable - test via auth endpoint"""
        # No /api/health endpoint, test with login endpoint instead
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "test123"
        })
        assert response.status_code == 200, f"API unreachable: {response.status_code}"
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0600000099",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
    
    def test_subscription_my_unauthorized(self, api_client):
        """Test /api/subscriptions/my without token"""
        response = api_client.get(f"{BASE_URL}/api/subscriptions/my")
        assert response.status_code in [401, 403], "Should require authentication"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
