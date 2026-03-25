"""
Test Payment Dashboard API for Coach/Physio
Tests the /api/pro/payment-dashboard endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://prospace-fix.preview.emergentagent.com')

class TestPaymentDashboard:
    """Payment Dashboard endpoint tests for Coach/Physio professionals"""
    
    @pytest.fixture
    def coach_token(self):
        """Get authentication token for coach user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Coach authentication failed - skipping authenticated tests")
    
    @pytest.fixture
    def coach_user(self):
        """Get coach user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("user")
        pytest.skip("Coach authentication failed")
    
    def test_coach_login_returns_professional_type(self):
        """Test that coach login returns professional_type='coach'"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["professional_type"] == "coach"
    
    def test_payment_dashboard_requires_auth(self):
        """Test that payment dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-dashboard")
        assert response.status_code == 401
    
    def test_payment_dashboard_returns_valid_structure(self, coach_token):
        """Test that payment dashboard returns expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields are present
        assert "active_subscriptions" in data
        assert "total_subscriptions" in data
        assert "monthly_revenue_ht" in data
        assert "total_revenue_ht" in data
        assert "price_per_beneficiary_ht" in data
        assert "projected_monthly_ht" in data
        assert "recent_payments" in data
        assert "iban_configured" in data
        assert "contract_signed" in data
    
    def test_payment_dashboard_correct_price(self, coach_token):
        """Test that price per beneficiary is 45 EUR HT"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["price_per_beneficiary_ht"] == 45.0
    
    def test_payment_dashboard_recent_payments_structure(self, coach_token):
        """Test that recent_payments has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # recent_payments should be a list
        assert isinstance(data["recent_payments"], list)
        
        # If there are payments, verify structure
        if len(data["recent_payments"]) > 0:
            payment = data["recent_payments"][0]
            assert "id" in payment
            assert "amount_ttc" in payment
            assert "amount_ht" in payment
            assert "status" in payment
            assert "date" in payment
    
    def test_payment_dashboard_numeric_values(self, coach_token):
        """Test that numeric fields are proper numbers"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data["active_subscriptions"], int)
        assert isinstance(data["total_subscriptions"], int)
        assert isinstance(data["monthly_revenue_ht"], (int, float))
        assert isinstance(data["total_revenue_ht"], (int, float))
        assert isinstance(data["projected_monthly_ht"], (int, float))
    
    def test_payment_dashboard_boolean_values(self, coach_token):
        """Test that boolean fields are proper booleans"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data["iban_configured"], bool)
        assert isinstance(data["contract_signed"], bool)


class TestLandingPageContracts:
    """Test landing page contract endpoints"""
    
    def test_coach_contract_endpoint(self):
        """Test GET /api/pro/application/contract/coach returns contract text"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/coach")
        assert response.status_code == 200
        data = response.json()
        assert "contract_text" in data
        assert len(data["contract_text"]) > 100  # Contract should have substantial text
    
    def test_physio_contract_endpoint(self):
        """Test GET /api/pro/application/contract/physio returns contract text"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/physio")
        assert response.status_code == 200
        data = response.json()
        assert "contract_text" in data
        assert len(data["contract_text"]) > 100
    
    def test_coach_contract_mentions_coach(self):
        """Test that coach contract mentions coach-specific terms"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/coach")
        assert response.status_code == 200
        data = response.json()
        contract = data["contract_text"].lower()
        # Should mention coach or sport-related terms
        assert "coach" in contract or "sport" in contract
    
    def test_physio_contract_mentions_physio(self):
        """Test that physio contract mentions physio-specific terms"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/physio")
        assert response.status_code == 200
        data = response.json()
        contract = data["contract_text"].lower()
        # Should mention physio or kine-related terms
        assert "kine" in contract or "physio" in contract or "reeducation" in contract
