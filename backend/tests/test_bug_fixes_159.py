"""
Test bug fixes for iteration 159:
1. Coach switch-role API should accept professional role users switching to guardian
2. Payment dashboard API should work for guardian users with professional_type=coach
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://ios-health-native.preview.emergentagent.com').rstrip('/')

class TestBugFixes159:
    """Test the 3 bug fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as coach user"""
        self.coach_phone = "+33655443322"
        self.coach_password = "test123"
        
        # Login as coach
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.coach_phone,
            "password": self.coach_password
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        self.coach_token = data['token']
        self.coach_user = data['user']
        print(f"Coach user: role={self.coach_user.get('role')}, active_role={self.coach_user.get('active_role')}, professional_type={self.coach_user.get('professional_type')}")
    
    def test_coach_user_has_guardian_role(self):
        """Bug 1: Coach user should now have role=guardian in DB, not professional"""
        # The coach user was migrated from role=professional to role=guardian
        role = self.coach_user.get('role')
        active_role = self.coach_user.get('active_role')
        professional_type = self.coach_user.get('professional_type')
        
        print(f"Coach user details: role={role}, active_role={active_role}, professional_type={professional_type}")
        
        # Coach should have role=guardian and professional_type=coach
        assert role == 'guardian', f"Expected role=guardian, got {role}"
        assert professional_type == 'coach', f"Expected professional_type=coach, got {professional_type}"
        print("PASS: Coach user has role=guardian and professional_type=coach")
    
    def test_switch_role_api_accepts_professional(self):
        """Bug 1: Switch-role API should accept professional role users switching to guardian"""
        headers = {"Authorization": f"Bearer {self.coach_token}"}
        
        # Try switching to guardian role
        response = requests.post(f"{BASE_URL}/api/auth/switch-role", 
            json={"role": "guardian"},
            headers=headers
        )
        print(f"Switch to guardian response: {response.status_code} - {response.text}")
        
        # Should succeed (not ask to create guardian account)
        assert response.status_code == 200, f"Switch to guardian failed: {response.text}"
        data = response.json()
        assert data.get('status') == 'switched', f"Expected status=switched, got {data}"
        print("PASS: Switch-role API accepts switching to guardian")
    
    def test_payment_dashboard_works_for_coach(self):
        """Bug 2: Payment dashboard API should work for guardian users with professional_type=coach"""
        headers = {"Authorization": f"Bearer {self.coach_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pro/payment-dashboard", headers=headers)
        print(f"Payment dashboard response: {response.status_code} - {response.text}")
        
        # Should return 200, not 403
        assert response.status_code == 200, f"Payment dashboard failed with {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'active_subscriptions' in data, f"Missing active_subscriptions in response"
        assert 'monthly_revenue_ht' in data, f"Missing monthly_revenue_ht in response"
        print(f"PASS: Payment dashboard works - active_subs={data.get('active_subscriptions')}, monthly_revenue={data.get('monthly_revenue_ht')}")
    
    def test_pro_beneficiaries_api(self):
        """Verify pro/beneficiaries API works for coach"""
        headers = {"Authorization": f"Bearer {self.coach_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pro/beneficiaries", headers=headers)
        print(f"Pro beneficiaries response: {response.status_code}")
        
        assert response.status_code == 200, f"Pro beneficiaries failed: {response.text}"
        print("PASS: Pro beneficiaries API works for coach")
    
    def test_pro_conversations_api(self):
        """Verify pro/conversations API works for coach"""
        headers = {"Authorization": f"Bearer {self.coach_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pro/conversations", headers=headers)
        print(f"Pro conversations response: {response.status_code}")
        
        assert response.status_code == 200, f"Pro conversations failed: {response.text}"
        print("PASS: Pro conversations API works for coach")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
