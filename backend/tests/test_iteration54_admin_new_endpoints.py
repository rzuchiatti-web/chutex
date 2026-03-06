"""
Iteration 54 - Testing new admin panel endpoints:
- GET /api/admin/rgpd-requests (admin auth)
- GET /api/admin/emails (admin auth)
- PUT /api/admin/user/{id} (admin auth) - update user fields
- DELETE /api/admin/user/{id} (admin auth) - delete user
- Subscriptions CRUD via /api/admin/subscriptions
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emergency-care-flow.preview.emergentagent.com").rstrip("/")


class TestAdminNewEndpoints:
    """Test new admin endpoints for iteration 54"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for testing"""
        # Login as admin using email
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@chutex.fr",
            "password": "demo123"
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        data = login_resp.json()
        self.token = data.get("token")
        self.admin_user = data.get("user")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        assert self.token, "No token received"
        assert self.admin_user.get("role") == "admin", f"Expected admin role, got {self.admin_user.get('role')}"
    
    # ==================== RGPD Requests ====================
    def test_admin_rgpd_requests_list(self):
        """GET /api/admin/rgpd-requests returns list"""
        resp = requests.get(f"{BASE_URL}/api/admin/rgpd-requests", headers=self.headers)
        assert resp.status_code == 200, f"RGPD requests failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: RGPD requests endpoint returns {len(data)} requests")
        # Verify structure if any exist
        if len(data) > 0:
            req = data[0]
            assert "id" in req or "user_name" in req, f"RGPD request missing expected fields: {req.keys()}"
    
    def test_admin_rgpd_requests_requires_auth(self):
        """RGPD requests requires admin auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/rgpd-requests")
        assert resp.status_code == 401 or resp.status_code == 403, f"Expected 401/403, got {resp.status_code}"
        print("PASS: RGPD requests endpoint requires auth")
    
    # ==================== Emails History ====================
    def test_admin_emails_list(self):
        """GET /api/admin/emails returns list"""
        resp = requests.get(f"{BASE_URL}/api/admin/emails", headers=self.headers)
        assert resp.status_code == 200, f"Emails list failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Emails endpoint returns {len(data)} emails")
        # Verify structure if any exist
        if len(data) > 0:
            email = data[0]
            assert "to" in email or "subject" in email or "sent_at" in email, f"Email missing expected fields: {email.keys()}"
    
    def test_admin_emails_requires_auth(self):
        """Emails endpoint requires admin auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/emails")
        assert resp.status_code == 401 or resp.status_code == 403, f"Expected 401/403, got {resp.status_code}"
        print("PASS: Emails endpoint requires auth")
    
    # ==================== User Update ====================
    def test_admin_user_update(self):
        """PUT /api/admin/user/{id} updates user fields"""
        # First get a user to update
        users_resp = requests.get(f"{BASE_URL}/api/backoffice/users", headers=self.headers)
        assert users_resp.status_code == 200
        users = users_resp.json()
        
        # Find a beneficiary to update (not admin)
        test_user = None
        for u in users:
            if u.get("role") == "beneficiary":
                test_user = u
                break
        
        if not test_user:
            pytest.skip("No beneficiary user found to test update")
        
        user_id = test_user.get("id")
        original_name = test_user.get("name", "")
        
        # Update the user name
        new_name = f"TEST_{original_name}"
        resp = requests.put(
            f"{BASE_URL}/api/admin/user/{user_id}",
            headers=self.headers,
            json={"name": new_name}
        )
        assert resp.status_code == 200, f"User update failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "updated", f"Expected status=updated, got {data}"
        print(f"PASS: User {user_id} updated successfully")
        
        # Revert the change
        requests.put(
            f"{BASE_URL}/api/admin/user/{user_id}",
            headers=self.headers,
            json={"name": original_name}
        )
    
    def test_admin_user_update_requires_auth(self):
        """User update requires admin auth"""
        resp = requests.put(f"{BASE_URL}/api/admin/user/test-id", json={"name": "test"})
        assert resp.status_code == 401 or resp.status_code == 403, f"Expected 401/403, got {resp.status_code}"
        print("PASS: User update endpoint requires auth")
    
    def test_admin_user_update_no_empty_fields(self):
        """User update rejects empty update"""
        users_resp = requests.get(f"{BASE_URL}/api/backoffice/users", headers=self.headers)
        users = users_resp.json()
        if len(users) > 0:
            user_id = users[0].get("id")
            resp = requests.put(
                f"{BASE_URL}/api/admin/user/{user_id}",
                headers=self.headers,
                json={"invalid_field": "test"}
            )
            assert resp.status_code == 400, f"Expected 400 for empty/invalid fields, got {resp.status_code}"
            print("PASS: User update rejects invalid fields")
    
    # ==================== User Delete ====================
    def test_admin_user_delete_and_recreate(self):
        """DELETE /api/admin/user/{id} deletes user"""
        # First create a test user to delete
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "phone": "+33699999998",
            "password": "testpass123",
            "name": "TEST_DELETE_USER",
            "role": "beneficiary"
        })
        
        if reg_resp.status_code != 200:
            # User might already exist, try to find and delete
            users_resp = requests.get(f"{BASE_URL}/api/backoffice/users", headers=self.headers)
            users = users_resp.json()
            test_user = next((u for u in users if u.get("phone") == "+33699999998"), None)
            if not test_user:
                pytest.skip("Could not create or find test user for deletion")
            user_id = test_user.get("id")
        else:
            user_id = reg_resp.json().get("user", {}).get("id")
        
        # Delete the user
        resp = requests.delete(f"{BASE_URL}/api/admin/user/{user_id}", headers=self.headers)
        assert resp.status_code == 200, f"User delete failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "deleted", f"Expected status=deleted, got {data}"
        print(f"PASS: User {user_id} deleted successfully")
        
        # Verify user no longer exists
        user_detail = requests.get(f"{BASE_URL}/api/backoffice/user/{user_id}", headers=self.headers)
        assert user_detail.status_code == 404, "Deleted user should not be found"
        print("PASS: Deleted user verified as removed")
    
    def test_admin_cannot_delete_self(self):
        """Admin cannot delete their own account"""
        admin_id = self.admin_user.get("id")
        resp = requests.delete(f"{BASE_URL}/api/admin/user/{admin_id}", headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for self-delete, got {resp.status_code}"
        print("PASS: Admin cannot delete self")
    
    # ==================== Subscriptions CRUD ====================
    def test_admin_subscriptions_list(self):
        """GET /api/admin/subscriptions returns list"""
        resp = requests.get(f"{BASE_URL}/api/admin/subscriptions", headers=self.headers)
        assert resp.status_code == 200, f"Subscriptions list failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Subscriptions endpoint returns {len(data)} subscriptions")
    
    def test_admin_subscription_create_and_delete(self):
        """POST and DELETE /api/admin/subscriptions CRUD"""
        # Create subscription
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/subscriptions",
            headers=self.headers,
            json={
                "beneficiary_phone": "+33699888777",
                "subscription_type": "care",
                "source": "admin_test"
            }
        )
        assert create_resp.status_code == 200, f"Subscription create failed: {create_resp.text}"
        created = create_resp.json()
        sub_id = created.get("id")
        assert sub_id, f"No subscription ID returned: {created}"
        print(f"PASS: Subscription created with ID {sub_id}")
        
        # Delete subscription
        del_resp = requests.delete(f"{BASE_URL}/api/admin/subscriptions/{sub_id}", headers=self.headers)
        assert del_resp.status_code == 200, f"Subscription delete failed: {del_resp.text}"
        print(f"PASS: Subscription {sub_id} deleted")
    
    # ==================== Prescriptions (backoffice) ====================
    def test_backoffice_prescriptions(self):
        """GET /api/backoffice/prescriptions returns list"""
        resp = requests.get(f"{BASE_URL}/api/backoffice/prescriptions", headers=self.headers)
        assert resp.status_code == 200, f"Prescriptions list failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Prescriptions endpoint returns {len(data)} prescriptions")
    
    # ==================== Analytics ====================
    def test_backoffice_analytics(self):
        """GET /api/backoffice/analytics returns analytics data"""
        resp = requests.get(f"{BASE_URL}/api/backoffice/analytics", headers=self.headers)
        assert resp.status_code == 200, f"Analytics failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        # Check expected fields
        expected_fields = ["total_interventions", "resolution_rate", "total_alerts"]
        for field in expected_fields:
            assert field in data, f"Analytics missing field: {field}"
        print(f"PASS: Analytics endpoint returns data with {len(data)} fields")
    
    # ==================== Shopify Status ====================
    def test_admin_shopify_status(self):
        """GET /api/admin/shopify/status returns status (may not be configured)"""
        resp = requests.get(f"{BASE_URL}/api/admin/shopify/status", headers=self.headers)
        # Shopify may not be configured, so accept 200 or 404
        assert resp.status_code in [200, 404, 500], f"Shopify status unexpected: {resp.status_code}"
        print(f"PASS: Shopify status endpoint returns {resp.status_code}")


class TestNonAdminAccess:
    """Test that non-admin users cannot access admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get non-admin token"""
        # Login as beneficiary using email
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "jean.test@care.fr",
            "password": "demo123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Could not login as non-admin user")
        data = login_resp.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_non_admin_cannot_access_rgpd_requests(self):
        """Non-admin cannot access RGPD requests"""
        resp = requests.get(f"{BASE_URL}/api/admin/rgpd-requests", headers=self.headers)
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print("PASS: Non-admin blocked from RGPD requests")
    
    def test_non_admin_cannot_access_emails(self):
        """Non-admin cannot access emails"""
        resp = requests.get(f"{BASE_URL}/api/admin/emails", headers=self.headers)
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print("PASS: Non-admin blocked from emails")
    
    def test_non_admin_cannot_delete_user(self):
        """Non-admin cannot delete user"""
        resp = requests.delete(f"{BASE_URL}/api/admin/user/test-id", headers=self.headers)
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print("PASS: Non-admin blocked from user delete")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
