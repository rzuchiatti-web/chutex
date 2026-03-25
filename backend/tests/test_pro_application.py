"""
Test Pro Application APIs - Coach/Physio landing page flows
Tests: POST /api/pro/application, GET /api/pro/application/contract/{type}, GET /api/pro/application/check/{phone}
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

class TestProApplicationContract:
    """Test contract text retrieval endpoints"""
    
    def test_get_coach_contract(self):
        """GET /api/pro/application/contract/coach returns coach contract text"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/coach")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "contract_text" in data, "Response should contain contract_text"
        assert "type" in data, "Response should contain type"
        assert data["type"] == "coach", f"Expected type 'coach', got {data['type']}"
        assert "COACH SPORTIF" in data["contract_text"], "Contract should mention COACH SPORTIF"
        assert "45 EUR HT" in data["contract_text"], "Contract should mention 45 EUR HT remuneration"
        print("PASS: Coach contract retrieved successfully")
    
    def test_get_physio_contract(self):
        """GET /api/pro/application/contract/physio returns physio contract text"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/physio")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "contract_text" in data, "Response should contain contract_text"
        assert "type" in data, "Response should contain type"
        assert data["type"] == "physio", f"Expected type 'physio', got {data['type']}"
        assert "KINESITHERAPEUTE" in data["contract_text"], "Contract should mention KINESITHERAPEUTE"
        assert "ADELI/RPPS" in data["contract_text"], "Contract should mention ADELI/RPPS requirement"
        print("PASS: Physio contract retrieved successfully")
    
    def test_get_invalid_contract_type(self):
        """GET /api/pro/application/contract/invalid returns 400"""
        response = requests.get(f"{BASE_URL}/api/pro/application/contract/invalid")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Invalid contract type returns 400")


class TestProApplicationSubmission:
    """Test pro application submission endpoint"""
    
    def test_submit_coach_application_success(self):
        """POST /api/pro/application with valid coach data returns approved status"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "coach",
            "first_name": "Test",
            "last_name": "Coach",
            "phone": unique_phone,
            "email": f"test.coach.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "BPJEPS",
            "diploma_year": "2020",
            "specialization": "Fitness & Bien-etre",
            "adeli_rpps": "",
            "siret": "12345678900012",
            "current_situation": "Independant / Liberal",
            "current_clients": 5,
            "motivation": "Test motivation",
            "signer_name": "Test Coach",
            "contract_accepted": True
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain application id"
        assert data["status"] == "approved", f"Expected status 'approved', got {data['status']}"
        assert "message" in data, "Response should contain message"
        print(f"PASS: Coach application submitted successfully, id={data['id']}")
        return unique_phone
    
    def test_submit_physio_application_success(self):
        """POST /api/pro/application with valid physio data (including ADELI) returns approved"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "physio",
            "first_name": "Test",
            "last_name": "Physio",
            "phone": unique_phone,
            "email": f"test.physio.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Lyon",
            "postal_code": "69001",
            "diploma": "Diplome d'Etat de Masseur-Kinesitherapeute",
            "diploma_year": "2018",
            "specialization": "Kinesitherapeute",
            "adeli_rpps": "1075123456",  # Required for physio
            "siret": "98765432100012",
            "current_situation": "Independant / Liberal",
            "current_clients": 10,
            "motivation": "Test physio motivation",
            "signer_name": "Test Physio",
            "contract_accepted": True
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "approved", f"Expected status 'approved', got {data['status']}"
        print(f"PASS: Physio application submitted successfully, id={data['id']}")
        return unique_phone
    
    def test_submit_physio_without_adeli_fails(self):
        """POST /api/pro/application for physio without ADELI returns 400"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "physio",
            "first_name": "Test",
            "last_name": "Physio",
            "phone": unique_phone,
            "email": f"test.physio.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Lyon",
            "postal_code": "69001",
            "diploma": "Diplome d'Etat",
            "diploma_year": "2018",
            "specialization": "Kinesitherapeute",
            "adeli_rpps": "",  # Missing ADELI - should fail
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "Test Physio",
            "contract_accepted": True
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        assert "ADELI" in response.json().get("detail", ""), "Error should mention ADELI requirement"
        print("PASS: Physio without ADELI correctly rejected")
    
    def test_submit_without_contract_accepted_fails(self):
        """POST /api/pro/application without contract_accepted returns 400"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "coach",
            "first_name": "Test",
            "last_name": "Coach",
            "phone": unique_phone,
            "email": f"test.coach.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "BPJEPS",
            "diploma_year": "2020",
            "specialization": "",
            "adeli_rpps": "",
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "Test Coach",
            "contract_accepted": False  # Not accepted - should fail
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Application without contract acceptance correctly rejected")
    
    def test_submit_without_signature_fails(self):
        """POST /api/pro/application without signer_name returns 400"""
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "coach",
            "first_name": "Test",
            "last_name": "Coach",
            "phone": unique_phone,
            "email": f"test.coach.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "BPJEPS",
            "diploma_year": "2020",
            "specialization": "",
            "adeli_rpps": "",
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "",  # Empty signature - should fail
            "contract_accepted": True
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Application without signature correctly rejected")
    
    def test_submit_invalid_type_fails(self):
        """POST /api/pro/application with invalid type returns 400"""
        payload = {
            "type": "invalid",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+33612345678",
            "email": "test@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "Test",
            "diploma_year": "2020",
            "specialization": "",
            "adeli_rpps": "",
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "Test",
            "contract_accepted": True
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Invalid type correctly rejected")


class TestProApplicationCheck:
    """Test phone check endpoint for approved applications"""
    
    def test_check_phone_with_approved_application(self):
        """GET /api/pro/application/check/{phone} returns has_approved_application=True for approved phone"""
        # First create an approved application
        unique_phone = f"+336{uuid.uuid4().hex[:8]}"
        payload = {
            "type": "coach",
            "first_name": "Check",
            "last_name": "Test",
            "phone": unique_phone,
            "email": f"check.test.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "BPJEPS",
            "diploma_year": "2020",
            "specialization": "",
            "adeli_rpps": "",
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "Check Test",
            "contract_accepted": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert create_response.status_code == 200, f"Failed to create application: {create_response.text}"
        
        # Now check the phone
        check_response = requests.get(f"{BASE_URL}/api/pro/application/check/{unique_phone}")
        assert check_response.status_code == 200, f"Expected 200, got {check_response.status_code}: {check_response.text}"
        
        data = check_response.json()
        assert data["has_approved_application"] == True, "Should have approved application"
        assert "application" in data, "Should contain application details"
        assert data["application"]["type"] == "coach", "Application type should be coach"
        print("PASS: Phone check returns approved application")
    
    def test_check_phone_without_application(self):
        """GET /api/pro/application/check/{phone} returns has_approved_application=False for unknown phone"""
        unknown_phone = f"+336{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/pro/application/check/{unknown_phone}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["has_approved_application"] == False, "Should not have approved application"
        print("PASS: Phone check returns no application for unknown phone")
    
    def test_check_phone_normalizes_format(self):
        """GET /api/pro/application/check/{phone} normalizes phone format"""
        # Create application with +33 format
        unique_suffix = uuid.uuid4().hex[:8]
        phone_with_plus = f"+336{unique_suffix}"
        
        payload = {
            "type": "coach",
            "first_name": "Format",
            "last_name": "Test",
            "phone": phone_with_plus,
            "email": f"format.test.{uuid.uuid4().hex[:6]}@example.com",
            "city": "Paris",
            "postal_code": "75001",
            "diploma": "BPJEPS",
            "diploma_year": "2020",
            "specialization": "",
            "adeli_rpps": "",
            "siret": "",
            "current_situation": "Independant / Liberal",
            "current_clients": 0,
            "motivation": "",
            "signer_name": "Format Test",
            "contract_accepted": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/pro/application", json=payload)
        assert create_response.status_code == 200, f"Failed to create application: {create_response.text}"
        
        # Check with 0 format (should be normalized to +33)
        phone_with_zero = f"06{unique_suffix}"
        check_response = requests.get(f"{BASE_URL}/api/pro/application/check/{phone_with_zero}")
        assert check_response.status_code == 200, f"Expected 200, got {check_response.status_code}"
        
        data = check_response.json()
        assert data["has_approved_application"] == True, "Phone normalization should find the application"
        print("PASS: Phone format normalization works correctly")


class TestGuardianLogin:
    """Test guardian login with coach credentials"""
    
    def test_guardian_coach_login(self):
        """POST /api/auth/login with guardian coach credentials returns user with professional_type"""
        payload = {
            "email": "+33655443322",  # Login uses 'email' field but accepts phone numbers
            "password": "test123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        
        user = data["user"]
        assert user.get("role") in ["guardian", "professional"], f"Expected guardian/professional role, got {user.get('role')}"
        # Check if professional_type is set (coach or physio)
        print(f"PASS: Guardian login successful, role={user.get('role')}, professional_type={user.get('professional_type')}")
        return data["token"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
