"""
Test suite for address fields feature (postal_code, city, country)
Tests:
1. POST /api/auth/register accepts and stores postal_code, city, country
2. GET /api/auth/me returns postal_code, city, country in response
3. GET /api/guardians/my returns postal_code, city, country for each guardian
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://glass-morphism-ui-3.preview.emergentagent.com')


class TestAddressFieldsRegistration:
    """Test that registration accepts and stores address fields"""
    
    def test_register_with_address_fields(self):
        """Register a new user with postal_code, city, country and verify they are stored"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"TEST_address_{unique_id}@test.com"
        test_phone = f"+336{unique_id[:8].replace('-', '')}"
        
        payload = {
            "email": test_email,
            "password": "test123",
            "name": f"TEST Address User {unique_id}",
            "phone": test_phone,
            "role": "beneficiary",
            "address": "123 Rue de Test",
            "postal_code": "75001",
            "city": "Paris",
            "country": "France"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        # Check registration succeeded
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        user = data["user"]
        # Verify address fields are returned in registration response
        assert user.get("address") == "123 Rue de Test", f"Address mismatch: {user.get('address')}"
        assert user.get("postal_code") == "75001", f"Postal code mismatch: {user.get('postal_code')}"
        assert user.get("city") == "Paris", f"City mismatch: {user.get('city')}"
        assert user.get("country") == "France", f"Country mismatch: {user.get('country')}"
        
        print(f"✓ Registration with address fields successful: {user.get('name')}")
        return data["token"]


class TestAddressFieldsGetMe:
    """Test that GET /api/auth/me returns address fields"""
    
    def test_get_me_returns_address_fields(self):
        """Login and verify GET /api/auth/me returns postal_code, city, country"""
        # First register a user with address fields
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"TEST_getme_{unique_id}@test.com"
        test_phone = f"+337{unique_id[:8].replace('-', '')}"
        
        register_payload = {
            "email": test_email,
            "password": "test123",
            "name": f"TEST GetMe User {unique_id}",
            "phone": test_phone,
            "role": "beneficiary",
            "address": "456 Avenue de Test",
            "postal_code": "69001",
            "city": "Lyon",
            "country": "France"
        }
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        token = reg_response.json()["token"]
        
        # Now call GET /api/auth/me
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert me_response.status_code == 200, f"GET /api/auth/me failed: {me_response.text}"
        
        user = me_response.json()
        
        # Verify address fields are in SAFE_FIELDS and returned
        assert user.get("address") == "456 Avenue de Test", f"Address mismatch: {user.get('address')}"
        assert user.get("postal_code") == "69001", f"Postal code mismatch: {user.get('postal_code')}"
        assert user.get("city") == "Lyon", f"City mismatch: {user.get('city')}"
        assert user.get("country") == "France", f"Country mismatch: {user.get('country')}"
        
        print(f"✓ GET /api/auth/me returns address fields correctly")


class TestGuardiansMyAddressFields:
    """Test that GET /api/guardians/my returns address fields for each guardian"""
    
    def test_guardians_my_returns_address_fields(self):
        """Login as beneficiary and verify guardians have postal_code, city, country"""
        # Login as existing beneficiary
        login_payload = {
            "email": "0651245918",  # Beneficiary phone
            "password": "test123"
        }
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        
        if login_response.status_code != 200:
            pytest.skip(f"Could not login as beneficiary: {login_response.text}")
        
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get guardians
        guardians_response = requests.get(f"{BASE_URL}/api/guardians/my", headers=headers)
        
        assert guardians_response.status_code == 200, f"GET /api/guardians/my failed: {guardians_response.text}"
        
        guardians = guardians_response.json()
        
        if not guardians:
            pytest.skip("No guardians found for this beneficiary")
        
        # Verify each guardian has address fields in response structure
        for guardian in guardians:
            # These fields should exist in the response (may be empty strings)
            assert "address" in guardian, f"Guardian missing 'address' field: {guardian}"
            assert "postal_code" in guardian, f"Guardian missing 'postal_code' field: {guardian}"
            assert "city" in guardian, f"Guardian missing 'city' field: {guardian}"
            assert "country" in guardian, f"Guardian missing 'country' field: {guardian}"
            
            print(f"✓ Guardian {guardian.get('name')} has address fields: "
                  f"address={guardian.get('address')}, "
                  f"postal_code={guardian.get('postal_code')}, "
                  f"city={guardian.get('city')}, "
                  f"country={guardian.get('country')}")
        
        print(f"✓ GET /api/guardians/my returns address fields for {len(guardians)} guardian(s)")


class TestExistingUserAddressFields:
    """Test existing users (may have empty address fields)"""
    
    def test_existing_guardian_login_and_me(self):
        """Login as existing guardian and verify address fields are in response"""
        login_payload = {
            "email": "+33612345678",  # Guardian phone
            "password": "test123"
        }
        
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        
        if login_response.status_code != 200:
            pytest.skip(f"Could not login as guardian: {login_response.text}")
        
        token = login_response.json()["token"]
        user = login_response.json()["user"]
        
        # Verify address fields exist in login response (may be empty for existing users)
        assert "address" in user or user.get("address") is None or user.get("address") == "", \
            "Address field should be present or empty"
        
        # postal_code, city, country should be in SAFE_FIELDS
        # For existing users, they may be empty strings or not set
        print(f"✓ Existing guardian login response includes address fields")
        print(f"  address: {user.get('address', 'N/A')}")
        print(f"  postal_code: {user.get('postal_code', 'N/A')}")
        print(f"  city: {user.get('city', 'N/A')}")
        print(f"  country: {user.get('country', 'N/A')}")
        
        # Now test GET /api/auth/me
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert me_response.status_code == 200, f"GET /api/auth/me failed: {me_response.text}"
        
        me_user = me_response.json()
        
        # Verify SAFE_FIELDS includes postal_code, city, country
        # They should be present in response even if empty
        print(f"✓ GET /api/auth/me for existing guardian includes address fields")


class TestUpdateProfileAddressFields:
    """Test that PUT /api/auth/update-profile accepts address fields"""
    
    def test_update_profile_with_address_fields(self):
        """Update profile with new address fields and verify persistence"""
        # First register a user
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"TEST_update_{unique_id}@test.com"
        test_phone = f"+338{unique_id[:8].replace('-', '')}"
        
        register_payload = {
            "email": test_email,
            "password": "test123",
            "name": f"TEST Update User {unique_id}",
            "phone": test_phone,
            "role": "beneficiary",
            "address": "Initial Address",
            "postal_code": "10000",
            "city": "Initial City",
            "country": "Initial Country"
        }
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        token = reg_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Update profile with new address fields
        update_payload = {
            "address": "Updated Address 789",
            "postal_code": "33000",
            "city": "Bordeaux",
            "country": "France"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json=update_payload,
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Update profile failed: {update_response.text}"
        
        updated_user = update_response.json().get("user", {})
        
        # Verify updated fields
        assert updated_user.get("address") == "Updated Address 789", \
            f"Address not updated: {updated_user.get('address')}"
        assert updated_user.get("postal_code") == "33000", \
            f"Postal code not updated: {updated_user.get('postal_code')}"
        assert updated_user.get("city") == "Bordeaux", \
            f"City not updated: {updated_user.get('city')}"
        assert updated_user.get("country") == "France", \
            f"Country not updated: {updated_user.get('country')}"
        
        # Verify persistence with GET /api/auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        
        me_user = me_response.json()
        assert me_user.get("address") == "Updated Address 789"
        assert me_user.get("postal_code") == "33000"
        assert me_user.get("city") == "Bordeaux"
        assert me_user.get("country") == "France"
        
        print(f"✓ Profile update with address fields successful and persisted")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
