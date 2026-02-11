"""
Test file for Chutex Subscription Management System
Tests the following features:
- GET /api/subscriptions/my - returns subscription status for logged-in beneficiary
- GET /api/subscriptions/check/{user_id} - check subscription for a given user
- GET /api/admin/subscriptions - admin can list all subscriptions
- POST /api/admin/subscriptions - admin can create a new subscription manually
- PUT /api/admin/subscriptions/{sub_id} - admin can update subscription
- DELETE /api/admin/subscriptions/{sub_id} - admin can delete subscription
- POST /api/admin/shopify/sync - Shopify sync (should return error since no access token)
- POST /api/devices/sync with device_type=bracelet - subscription check for bracelet
- POST /api/devices/sync with device_type=vest - no subscription needed
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

# Test credentials
BENEFICIARY_EMAIL = "robert.martin@email.fr"
BENEFICIARY_PASS = "demo123"
GUARDIAN_EMAIL = "claire.martin@email.fr"
GUARDIAN_PASS = "demo123"
ADMIN_EMAIL = "admin@chutex.fr"
ADMIN_PASS = "demo123"
TELEASSISTANCE_EMAIL = "plateau@chutex.fr"
TELEASSISTANCE_PASS = "demo123"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def beneficiary_token(api_client):
    """Get beneficiary authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_EMAIL,
        "password": BENEFICIARY_PASS
    })
    assert response.status_code == 200, f"Beneficiary login failed: {response.text}"
    data = response.json()
    assert "token" in data
    return data["token"], data.get("user", {})


@pytest.fixture
def guardian_token(api_client):
    """Get guardian authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": GUARDIAN_EMAIL,
        "password": GUARDIAN_PASS
    })
    assert response.status_code == 200, f"Guardian login failed: {response.text}"
    data = response.json()
    return data["token"], data.get("user", {})


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    return data["token"], data.get("user", {})


class TestBeneficiarySubscription:
    """Test subscription endpoints for beneficiary Robert Martin who has Care subscription"""
    
    def test_get_my_subscription_robert_martin(self, api_client, beneficiary_token):
        """Robert Martin should have a Care subscription"""
        token, user = beneficiary_token
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate subscription data
        assert data["has_subscription"] == True, "Robert should have a subscription"
        assert data["subscription_type"] == "care", f"Expected 'care' but got '{data['subscription_type']}'"
        assert data["can_use_bracelet"] == True, "Robert should be able to use bracelet"
        assert data["has_teleassistance"] == True, "Robert should have teleassistance with Care"
        assert data["subscription"] is not None, "Subscription details should be returned"
        print(f"✓ Robert Martin subscription: {data['subscription_type']}, teleassistance: {data['has_teleassistance']}")


class TestSubscriptionCheck:
    """Test /api/subscriptions/check/{user_id} endpoint"""
    
    def test_check_subscription_for_beneficiary(self, api_client, admin_token, beneficiary_token):
        """Admin can check subscription status for Robert Martin"""
        admin_tkn, _ = admin_token
        _, beneficiary = beneficiary_token
        user_id = beneficiary.get("id")
        
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/check/{user_id}",
            headers={"Authorization": f"Bearer {admin_tkn}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["user_id"] == user_id
        assert data["has_subscription"] == True
        assert data["subscription_type"] == "care"
        assert data["can_use_bracelet"] == True
        assert data["has_teleassistance"] == True
        print(f"✓ Check subscription for {data['user_name']}: {data['subscription_type']}")
    
    def test_check_subscription_invalid_user(self, api_client, admin_token):
        """Check subscription for non-existent user should return 404"""
        token, _ = admin_token
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/check/invalid-user-id-12345",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user returns 404")


class TestAdminSubscriptionManagement:
    """Test admin subscription CRUD operations"""
    
    def test_admin_list_subscriptions(self, api_client, admin_token):
        """Admin can list all subscriptions"""
        token, _ = admin_token
        response = api_client.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        # Robert's Care subscription should be in the list
        care_subs = [s for s in data if s.get("subscription_type") == "care"]
        assert len(care_subs) >= 1, "Should have at least one Care subscription (Robert's)"
        print(f"✓ Admin can list subscriptions: {len(data)} total, {len(care_subs)} Care")
    
    def test_admin_create_subscription(self, api_client, admin_token):
        """Admin can create a new subscription manually"""
        token, _ = admin_token
        test_phone = "+33600TEST01"
        
        response = api_client.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "beneficiary_phone": test_phone,
                "subscription_type": "standard",
                "notes": "TEST subscription - should be deleted"
            }
        )
        assert response.status_code == 200, f"Failed to create subscription: {response.text}"
        data = response.json()
        
        assert data.get("beneficiary_phone") is not None
        assert data["subscription_type"] == "standard"
        assert data["status"] == "active"
        assert data["source"] == "manual"
        assert "id" in data
        
        # Store for cleanup
        sub_id = data["id"]
        print(f"✓ Created subscription {sub_id} for {test_phone}")
        
        # Cleanup: Delete the test subscription
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/subscriptions/{sub_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_response.status_code == 200, f"Failed to cleanup: {delete_response.text}"
        print(f"✓ Cleaned up test subscription {sub_id}")
    
    def test_admin_update_subscription(self, api_client, admin_token):
        """Admin can update an existing subscription"""
        token, _ = admin_token
        test_phone = "+33600TEST02"
        
        # First create a subscription
        create_resp = api_client.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "beneficiary_phone": test_phone,
                "subscription_type": "standard",
                "notes": "TEST - to be updated"
            }
        )
        assert create_resp.status_code == 200
        sub_id = create_resp.json()["id"]
        
        # Update subscription type to care
        update_resp = api_client.put(
            f"{BASE_URL}/api/admin/subscriptions/{sub_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "subscription_type": "care",
                "notes": "TEST - upgraded to care"
            }
        )
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        print(f"✓ Updated subscription {sub_id} to Care")
        
        # Verify update by listing
        list_resp = api_client.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"}
        )
        subs = list_resp.json()
        updated_sub = next((s for s in subs if s["id"] == sub_id), None)
        assert updated_sub is not None
        assert updated_sub["subscription_type"] == "care"
        
        # Cleanup
        api_client.delete(
            f"{BASE_URL}/api/admin/subscriptions/{sub_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("✓ Cleaned up test subscription")
    
    def test_admin_delete_subscription(self, api_client, admin_token):
        """Admin can delete a subscription"""
        token, _ = admin_token
        test_phone = "+33600TEST03"
        
        # Create a subscription to delete
        create_resp = api_client.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "beneficiary_phone": test_phone,
                "subscription_type": "standard",
                "notes": "TEST - to be deleted"
            }
        )
        assert create_resp.status_code == 200
        sub_id = create_resp.json()["id"]
        
        # Delete subscription
        delete_resp = api_client.delete(
            f"{BASE_URL}/api/admin/subscriptions/{sub_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        data = delete_resp.json()
        assert data["status"] == "deleted"
        print(f"✓ Successfully deleted subscription {sub_id}")
        
        # Verify deletion
        list_resp = api_client.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"}
        )
        subs = list_resp.json()
        deleted_sub = next((s for s in subs if s["id"] == sub_id), None)
        assert deleted_sub is None, "Subscription should be deleted"
        print("✓ Verified subscription is removed from list")
    
    def test_guardian_cannot_manage_subscriptions(self, api_client, guardian_token):
        """Guardian (non-admin) cannot access admin subscription endpoints"""
        token, _ = guardian_token
        
        # Try to list subscriptions as guardian
        response = api_client.get(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
        print("✓ Guardian correctly denied access to admin subscriptions")


class TestShopifySync:
    """Test Shopify sync endpoint - should return error since SHOPIFY_ACCESS_TOKEN is not configured"""
    
    def test_shopify_sync_without_token(self, api_client, admin_token):
        """Shopify sync should return descriptive error when access token is not configured"""
        token, _ = admin_token
        response = api_client.post(
            f"{BASE_URL}/api/admin/shopify/sync",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should return 400 with descriptive error
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "Shopify" in data["detail"] or "Token" in data["detail"] or "configure" in data["detail"].lower()
        print(f"✓ Shopify sync returns expected error: {data['detail']}")


class TestBraceletSubscriptionRequirement:
    """Test that bracelet sync requires subscription while vest does not"""
    
    def test_bracelet_sync_with_subscription(self, api_client, beneficiary_token):
        """Robert Martin (has Care subscription) can sync bracelet"""
        token, user = beneficiary_token
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            headers={"Authorization": f"Bearer {token}"},
            json={"device_type": "bracelet", "data": {}}
        )
        assert response.status_code == 200, f"Bracelet sync failed: {response.text}"
        data = response.json()
        assert data["status"] == "synced"
        print(f"✓ Robert Martin (Care subscriber) can sync bracelet: {data['status']}")
    
    def test_vest_sync_no_subscription_needed(self, api_client, beneficiary_token):
        """Vest sync should work without subscription requirement"""
        token, user = beneficiary_token
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            headers={"Authorization": f"Bearer {token}"},
            json={"device_type": "vest", "data": {}}
        )
        assert response.status_code == 200, f"Vest sync failed: {response.text}"
        data = response.json()
        assert data["status"] == "synced"
        print(f"✓ Vest sync works without subscription check: {data['status']}")
    
    def test_scale_sync_no_subscription_needed(self, api_client, beneficiary_token):
        """Scale sync should work without subscription requirement"""
        token, user = beneficiary_token
        response = api_client.post(
            f"{BASE_URL}/api/devices/sync",
            headers={"Authorization": f"Bearer {token}"},
            json={"device_type": "scale", "data": {}}
        )
        assert response.status_code == 200, f"Scale sync failed: {response.text}"
        data = response.json()
        assert data["status"] == "synced"
        print(f"✓ Scale sync works without subscription check: {data['status']}")


class TestBackofficeStats:
    """Test that backoffice stats include subscription counts"""
    
    def test_stats_include_subscription_counts(self, api_client, admin_token):
        """Stats page should show subscription counts"""
        token, _ = admin_token
        response = api_client.get(
            f"{BASE_URL}/api/backoffice/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Stats fetch failed: {response.text}"
        data = response.json()
        
        # Check for subscription stats fields
        assert "subscriptions_standard" in data, "Stats should include subscriptions_standard"
        assert "subscriptions_care" in data, "Stats should include subscriptions_care"
        print(f"✓ Stats include subscription counts: Standard={data['subscriptions_standard']}, Care={data['subscriptions_care']}")


class TestSubscriptionUpgrade:
    """Test subscription upgrade from Standard to Care"""
    
    def test_upgrade_standard_to_care(self, api_client, admin_token):
        """Creating Care subscription for phone with Standard should upgrade"""
        token, _ = admin_token
        test_phone = "+33600TEST04"
        
        # Create Standard subscription
        create_resp = api_client.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "beneficiary_phone": test_phone,
                "subscription_type": "standard",
                "notes": "TEST - standard to upgrade"
            }
        )
        assert create_resp.status_code == 200
        sub_id = create_resp.json()["id"]
        
        # Try to create Care subscription for same phone - should upgrade
        upgrade_resp = api_client.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "beneficiary_phone": test_phone,
                "subscription_type": "care",
                "notes": "TEST - upgraded to care"
            }
        )
        assert upgrade_resp.status_code == 200, f"Upgrade failed: {upgrade_resp.text}"
        data = upgrade_resp.json()
        assert data.get("subscription_type") == "care" or data.get("upgraded") == True
        print(f"✓ Standard to Care upgrade worked")
        
        # Cleanup
        api_client.delete(
            f"{BASE_URL}/api/admin/subscriptions/{sub_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("✓ Cleaned up test subscription")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
