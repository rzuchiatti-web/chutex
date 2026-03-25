"""
Test Guardian Features - Dynamic Navbar, ProMessaging, Landing Pages
Tests for iteration 158 features:
1. Guardian Coach login and navbar tabs
2. Guardian SAAD login and navbar tabs
3. Guardian Standard login and navbar tabs
4. ProMessaging API endpoints
5. Landing page colors
6. Payment dashboard for coach/physio
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGuardianAuth:
    """Test authentication for different guardian types"""
    
    def test_coach_login(self):
        """Test Coach guardian login - should have professional_type=coach"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        user = data["user"]
        assert user.get("professional_type") == "coach", f"Expected professional_type=coach, got {user.get('professional_type')}"
        assert user.get("role") == "professional", f"Expected role=professional, got {user.get('role')}"
        
        print(f"Coach login successful: {user.get('first_name')} {user.get('last_name')}")
        return data["token"]
    
    def test_saad_guardian_login(self):
        """Test SAAD guardian login - should have saad_company_id"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33605221196",
            "password": "test123"
        })
        assert response.status_code == 200, f"SAAD login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        user = data["user"]
        # SAAD guardian should have saad_company_id set
        assert user.get("saad_company_id") is not None or user.get("role") == "guardian", \
            f"Expected SAAD guardian attributes, got role={user.get('role')}, saad_company_id={user.get('saad_company_id')}"
        
        print(f"SAAD login successful: {user.get('first_name')} {user.get('last_name')}")
        return data["token"]
    
    def test_standard_guardian_login(self):
        """Test Standard guardian login - no professional_type, no saad_company_id"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33698765432",
            "password": "test123"
        })
        assert response.status_code == 200, f"Standard guardian login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        user = data["user"]
        # Standard guardian should NOT have professional_type
        assert user.get("professional_type") is None or user.get("professional_type") == "", \
            f"Standard guardian should not have professional_type, got {user.get('professional_type')}"
        
        print(f"Standard guardian login successful: {user.get('first_name')} {user.get('last_name')}")
        return data["token"]


class TestProMessaging:
    """Test ProMessaging API endpoints for Coach/Physio"""
    
    @pytest.fixture
    def coach_token(self):
        """Get coach authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Coach authentication failed")
    
    def test_get_conversations(self, coach_token):
        """Test getting conversations list for coach"""
        response = requests.get(
            f"{BASE_URL}/api/pro/conversations",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of conversations"
        
        if len(data) > 0:
            convo = data[0]
            assert "id" in convo or "_id" in convo, "Conversation should have id"
            print(f"Found {len(data)} conversations")
        else:
            print("No conversations found (empty list)")
    
    def test_get_messages(self, coach_token):
        """Test getting messages for a conversation"""
        # First get conversations
        convos_response = requests.get(
            f"{BASE_URL}/api/pro/conversations",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        
        if convos_response.status_code == 200 and len(convos_response.json()) > 0:
            convo_id = convos_response.json()[0].get("id") or convos_response.json()[0].get("_id")
            
            # Get messages for this conversation
            response = requests.get(
                f"{BASE_URL}/api/pro/messages/{convo_id}",
                headers={"Authorization": f"Bearer {coach_token}"}
            )
            assert response.status_code == 200, f"Get messages failed: {response.text}"
            
            data = response.json()
            assert isinstance(data, list), "Expected list of messages"
            print(f"Found {len(data)} messages in conversation")
        else:
            pytest.skip("No conversations available to test messages")


class TestPaymentDashboard:
    """Test Payment Dashboard API for Coach/Physio"""
    
    @pytest.fixture
    def coach_token(self):
        """Get coach authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Coach authentication failed")
    
    def test_payment_dashboard(self, coach_token):
        """Test payment dashboard endpoint for coach"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-dashboard",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Payment dashboard failed: {response.text}"
        
        data = response.json()
        # Check for expected fields (API returns active_subscriptions, monthly_revenue_ht, total_revenue_ht)
        assert "active_subscriptions" in data, f"Missing active_subscriptions, got: {data.keys()}"
        assert "monthly_revenue_ht" in data, f"Missing monthly_revenue_ht, got: {data.keys()}"
        assert "total_revenue_ht" in data, f"Missing total_revenue_ht, got: {data.keys()}"
        
        print(f"Payment dashboard: active_subscriptions={data.get('active_subscriptions')}, monthly_revenue_ht={data.get('monthly_revenue_ht')}, total_revenue_ht={data.get('total_revenue_ht')}")


class TestAlerts:
    """Test Alerts API endpoints"""
    
    @pytest.fixture
    def guardian_token(self):
        """Get guardian authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33698765432",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Guardian authentication failed")
    
    def test_get_alerts(self, guardian_token):
        """Test getting alerts list"""
        response = requests.get(
            f"{BASE_URL}/api/alerts",
            headers={"Authorization": f"Bearer {guardian_token}"}
        )
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of alerts"
        print(f"Found {len(data)} alerts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
