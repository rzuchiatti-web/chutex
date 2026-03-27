"""
Test suite for Pro Revenue features
- Payment dashboard
- Payment history
- Payment config (IBAN)
- Export CSV
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Coach credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"

# Beneficiary credentials
BENEFICIARY_PHONE = "+33651245918"
BENEFICIARY_PASSWORD = "test123"


@pytest.fixture(scope="module")
def coach_token():
    """Get coach authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": COACH_PHONE, "password": COACH_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Coach authentication failed")


@pytest.fixture(scope="module")
def beneficiary_token():
    """Get beneficiary authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": BENEFICIARY_PHONE, "password": BENEFICIARY_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Beneficiary authentication failed")


class TestCoachLogin:
    """Test coach login functionality"""
    
    def test_coach_login_success(self):
        """Coach can login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": COACH_PHONE, "password": COACH_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "guardian"
        assert data["user"]["professional_type"] == "coach"


class TestPaymentDashboard:
    """Test payment dashboard API"""
    
    def test_get_payment_dashboard(self, coach_token):
        """Coach can get payment dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields (actual API response structure)
        assert "active_subscriptions" in data
        assert "total_subscriptions" in data
        assert "monthly_revenue_ht" in data
        assert "total_revenue_ht" in data
        assert "recent_payments" in data  # API uses 'recent_payments' not 'monthly_breakdown'
        
        # Verify data types
        assert isinstance(data["active_subscriptions"], int)
        assert isinstance(data["total_revenue_ht"], (int, float))
        assert isinstance(data["recent_payments"], list)
    
    def test_payment_dashboard_unauthorized(self):
        """Unauthorized access returns 401"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-dashboard")
        assert response.status_code == 401


class TestPaymentHistory:
    """Test payment history API"""
    
    def test_get_payment_history(self, coach_token):
        """Coach can get payment history"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)
        
        # If there are payments, verify structure
        if len(data) > 0:
            payment = data[0]
            assert "id" in payment
            assert "amount_ht" in payment
            assert "status" in payment
            assert "date" in payment  # API uses 'date' not 'created_at'
    
    def test_payment_history_unauthorized(self):
        """Unauthorized access returns 401"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-history")
        assert response.status_code == 401


class TestPaymentConfig:
    """Test payment config (IBAN) API"""
    
    def test_get_payment_config(self, coach_token):
        """Coach can get payment config"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-config",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields (actual API response structure)
        assert "account_holder" in data  # API uses 'account_holder' not 'iban_holder'
        assert "iban" in data
        assert "bic" in data
        assert "iban_configured" in data
    
    def test_update_payment_config(self, coach_token):
        """Coach can update payment config"""
        # First get current config
        get_response = requests.get(
            f"{BASE_URL}/api/pro/payment-config",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        original_config = get_response.json()
        
        # Update config using correct field names
        new_holder = "Test Coach Updated"
        update_response = requests.put(
            f"{BASE_URL}/api/pro/payment-config",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "account_holder": new_holder,
                "iban": original_config.get("iban", "FR7630001007941234567890185"),
                "bic": original_config.get("bic", "BNPAFRPP")
            }
        )
        assert update_response.status_code == 200
        
        # Verify update persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/pro/payment-config",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert verify_response.status_code == 200
        updated_data = verify_response.json()
        assert updated_data["account_holder"] == new_holder
        
        # Restore original config
        requests.put(
            f"{BASE_URL}/api/pro/payment-config",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "account_holder": original_config.get("account_holder", "Test Coach Alain"),
                "iban": original_config.get("iban", "FR7630001007941234567890185"),
                "bic": original_config.get("bic", "BNPAFRPP")
            }
        )
    
    def test_payment_config_unauthorized(self):
        """Unauthorized access returns 401"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-config")
        assert response.status_code == 401


class TestPaymentExport:
    """Test payment history export API"""
    
    def test_export_payment_history_csv(self, coach_token):
        """Coach can export payment history as CSV"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history/export",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        
        # Verify content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type or "application/csv" in content_type or response.text.startswith("Date")
        
        # Verify CSV has content
        assert len(response.text) > 0
    
    def test_export_unauthorized(self):
        """Unauthorized access returns 401"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-history/export")
        assert response.status_code == 401


class TestMessaging:
    """Test messaging/conversations API for coach"""
    
    def test_get_conversations(self, coach_token):
        """Coach can get conversations list"""
        # The correct endpoint is /api/pro/conversations
        response = requests.get(
            f"{BASE_URL}/api/pro/conversations",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)


class TestMinceur:
    """Test minceur/nutrition API for beneficiary"""
    
    def test_get_weight_details(self, beneficiary_token):
        """Beneficiary can get weight details"""
        response = requests.get(
            f"{BASE_URL}/api/minceur/weight-details",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "profile" in data
        assert "current" in data
        assert "weight_history" in data
        
        # Verify current weight data
        assert "weight" in data["current"]
        assert "bmi" in data["current"]
