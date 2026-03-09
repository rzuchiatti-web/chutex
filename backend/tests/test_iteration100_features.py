"""
Iteration 100 Backend Tests:
- GET /api/nora/weekly-report - Returns week_summary with stats and nora_message
- PUT /api/auth/change-password - Password change persists to password_overrides.json
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://nutrition-ai-beta.preview.emergentagent.com')

class TestWeeklyReportEndpoint:
    """Tests for GET /api/nora/weekly-report"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    
    def test_weekly_report_returns_200(self, auth_token):
        """Test that GET /api/nora/weekly-report returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/nora/weekly-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/nora/weekly-report returns 200")
    
    def test_weekly_report_has_week_summary(self, auth_token):
        """Test that response includes week_summary with required fields"""
        response = requests.get(
            f"{BASE_URL}/api/nora/weekly-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check week_summary exists
        assert "week_summary" in data, "Response missing 'week_summary'"
        ws = data["week_summary"]
        
        # Check required fields
        assert "meals_validated" in ws, "week_summary missing 'meals_validated'"
        assert "exercises_validated" in ws, "week_summary missing 'exercises_validated'"
        assert "days_active" in ws, "week_summary missing 'days_active'"
        
        # Verify types
        assert isinstance(ws["meals_validated"], (int, float)), "meals_validated should be numeric"
        assert isinstance(ws["exercises_validated"], (int, float)), "exercises_validated should be numeric"
        assert isinstance(ws["days_active"], (int, float)), "days_active should be numeric"
        
        print(f"PASS: week_summary has meals_validated={ws['meals_validated']}, exercises_validated={ws['exercises_validated']}, days_active={ws['days_active']}")
    
    def test_weekly_report_has_nora_message(self, auth_token):
        """Test that response includes nora_message"""
        response = requests.get(
            f"{BASE_URL}/api/nora/weekly-report",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "nora_message" in data, "Response missing 'nora_message'"
        assert isinstance(data["nora_message"], str), "nora_message should be a string"
        # nora_message can be empty if AI generation fails, but should exist
        print(f"PASS: nora_message present. Length: {len(data['nora_message'])} chars")
        if data["nora_message"]:
            print(f"Nora message preview: {data['nora_message'][:100]}...")


class TestPasswordChangePersistence:
    """Tests for PUT /api/auth/change-password and file persistence"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "0651245918",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    
    def test_change_password_returns_password_changed(self, auth_token):
        """Test that PUT /api/auth/change-password returns 'password_changed' status"""
        # Change password from test123 to test1234
        response = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "old_password": "test123",
                "new_password": "test1234"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data, "Response missing 'status'"
            assert data["status"] == "password_changed", f"Expected 'password_changed', got '{data.get('status')}'"
            print(f"PASS: change-password returns status='password_changed'")
            
            # Now change it back to test123
            # Need to re-login with new password first
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "0651245918",
                "password": "test1234"
            })
            if login_response.status_code == 200:
                new_token = login_response.json().get("token")
                # Change back
                revert_response = requests.put(
                    f"{BASE_URL}/api/auth/change-password",
                    headers={"Authorization": f"Bearer {new_token}"},
                    json={
                        "old_password": "test1234",
                        "new_password": "test123"
                    }
                )
                if revert_response.status_code == 200:
                    print("Password reverted back to test123")
        else:
            # If old password is wrong, maybe it was already changed - try with test1234
            response2 = requests.put(
                f"{BASE_URL}/api/auth/change-password",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "old_password": "test1234",
                    "new_password": "test123"
                }
            )
            if response2.status_code == 200:
                print("Password was already test1234, reverted to test123")
            else:
                pytest.fail(f"change-password failed: {response.status_code} - {response.text}")


class TestPasswordOverridesFile:
    """Test that password_overrides.json file is created/updated"""
    
    def test_password_overrides_file_exists(self):
        """Check that password_overrides.json exists on the server"""
        override_path = "/app/backend/password_overrides.json"
        assert os.path.exists(override_path), f"password_overrides.json does not exist at {override_path}"
        print(f"PASS: password_overrides.json exists at {override_path}")
    
    def test_password_overrides_file_valid_json(self):
        """Check that password_overrides.json contains valid JSON"""
        override_path = "/app/backend/password_overrides.json"
        if not os.path.exists(override_path):
            pytest.skip("password_overrides.json does not exist")
        
        with open(override_path, "r") as f:
            content = f.read()
        
        try:
            data = json.loads(content)
            assert isinstance(data, dict), "password_overrides.json should contain a dict"
            print(f"PASS: password_overrides.json contains valid JSON with {len(data)} entries")
            for user_id in list(data.keys())[:3]:
                print(f"  - User ID: {user_id[:20]}...")
        except json.JSONDecodeError as e:
            pytest.fail(f"password_overrides.json contains invalid JSON: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
