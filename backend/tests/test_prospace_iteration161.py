"""
ProSpace Backend API Tests - Iteration 161
Tests for coach/physio professional space endpoints:
- POST /api/pro/programs/template - Create template program
- POST /api/pro/meals/{beneficiary_id} - Create meal with new format
- GET /api/pro/all-programs - Get all programs including templates
- POST /api/pro/programs/duplicate/{program_id}/{beneficiary_id} - Duplicate program
- POST /api/pro/reminders/{beneficiary_id} - Create reminder
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://elio-v8-biometric.preview.emergentagent.com').rstrip('/')

# Test credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"  # Josette


class TestProSpaceAuth:
    """Test authentication for coach user"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for coach"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_coach_login(self, auth_token):
        """Test coach can login successfully"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Coach login successful, token length: {len(auth_token)}")


class TestProgramTemplate:
    """Test POST /api/pro/programs/template - Create template program"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_create_template_program(self, auth_token):
        """Create a template program in the library (no beneficiary)"""
        unique_title = f"TEST_Template_Program_{uuid.uuid4().hex[:8]}"
        payload = {
            "title": unique_title,
            "description": "Programme de test pour la bibliotheque",
            "frequency": "3x/semaine",
            "duration_weeks": 8,
            "category": "strength"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/template",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create template: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "No id in response"
        assert data["title"] == unique_title
        assert data["beneficiary_id"] == "__template__", "Template should have __template__ as beneficiary_id"
        assert data["is_template"] == True, "is_template should be True"
        assert data["beneficiary_name"] == "Bibliotheque"
        
        print(f"✓ Template program created: {data['id']}")
        return data["id"]


class TestMealCreation:
    """Test POST /api/pro/meals/{beneficiary_id} - Create meal with new format"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_create_meal_new_format(self, auth_token):
        """Create a meal with the new format (meal_type, items array, calories, proteins, notes)"""
        payload = {
            "meal_type": "dejeuner",
            "items": ["Poulet grille", "Riz complet", "Haricots verts"],
            "calories": 650,
            "proteins": 45,
            "notes": "Repas post-entrainement"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create meal: {response.text}"
        data = response.json()
        
        # Verify response
        assert data.get("status") == "added", f"Expected status 'added', got: {data}"
        assert "meal" in data, "No meal in response"
        
        meal = data["meal"]
        assert meal["meal_type"] == "dejeuner"
        assert meal["items"] == ["Poulet grille", "Riz complet", "Haricots verts"]
        assert meal["calories"] == 650
        assert meal["proteins"] == 45
        assert meal["notes"] == "Repas post-entrainement"
        
        print(f"✓ Meal created with new format: {meal['meal_type']}")


class TestAllPrograms:
    """Test GET /api/pro/all-programs - Get all programs including templates"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_get_all_programs(self, auth_token):
        """Get all programs for the professional"""
        response = requests.get(
            f"{BASE_URL}/api/pro/all-programs",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get programs: {response.text}"
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list), f"Expected list, got: {type(data)}"
        
        print(f"✓ Got {len(data)} programs")
        
        # Check if templates are included
        templates = [p for p in data if p.get("is_template") == True or p.get("beneficiary_id") == "__template__"]
        print(f"  - Templates in library: {len(templates)}")
        
        return data


class TestProgramDuplication:
    """Test POST /api/pro/programs/duplicate/{program_id}/{beneficiary_id}"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def source_program_id(self, auth_token):
        """Create a source program to duplicate"""
        unique_title = f"TEST_Source_Program_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/template",
            json={
                "title": unique_title,
                "description": "Source program for duplication test",
                "frequency": "2x/semaine",
                "duration_weeks": 4
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_duplicate_program_to_beneficiary(self, auth_token, source_program_id):
        """Duplicate a program to a beneficiary"""
        response = requests.post(
            f"{BASE_URL}/api/pro/programs/duplicate/{source_program_id}/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to duplicate: {response.text}"
        data = response.json()
        
        # Verify the duplicated program
        assert "id" in data, "No id in duplicated program"
        assert data["id"] != source_program_id, "Duplicated program should have new ID"
        assert data["beneficiary_id"] == BENEFICIARY_ID, "Should be assigned to beneficiary"
        assert data.get("duplicated_from") == source_program_id, "Should reference source program"
        
        print(f"✓ Program duplicated: {source_program_id} -> {data['id']}")


class TestReminderCreation:
    """Test POST /api/pro/reminders/{beneficiary_id} - Create reminder"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_create_medication_reminder(self, auth_token):
        """Create a medication reminder for beneficiary"""
        payload = {
            "reminder_type": "medication",
            "title": "TEST_Vitamine D",
            "time": "08:00",
            "days": ["lun", "mar", "mer", "jeu", "ven"],
            "notes": "Prendre avec le petit dejeuner",
            "dosage": "1 comprime"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create reminder: {response.text}"
        data = response.json()
        
        # Verify response
        assert "id" in data, "No id in response"
        assert data["title"] == "TEST_Vitamine D"
        assert data["reminder_type"] == "medication"
        assert data["time"] == "08:00"
        assert data["dosage"] == "1 comprime"
        assert data["user_id"] == BENEFICIARY_ID
        assert "created_by_pro" in data
        
        print(f"✓ Reminder created: {data['id']}")
        return data["id"]
    
    def test_create_hydration_reminder(self, auth_token):
        """Create a hydration reminder for beneficiary"""
        payload = {
            "reminder_type": "hydration",
            "title": "TEST_Boire de l'eau",
            "time": "10:00",
            "days": ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
            "notes": "Au moins 250ml"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            json=payload,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to create hydration reminder: {response.text}"
        data = response.json()
        
        assert data["reminder_type"] == "hydration"
        print(f"✓ Hydration reminder created: {data['id']}")


class TestGetReminders:
    """Test GET /api/pro/reminders/{beneficiary_id}"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_get_beneficiary_reminders(self, auth_token):
        """Get reminders created by pro for beneficiary"""
        response = requests.get(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get reminders: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got: {type(data)}"
        print(f"✓ Got {len(data)} reminders for beneficiary")


class TestGetMeals:
    """Test GET /api/pro/meals/{beneficiary_id}"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_PHONE,
            "password": COACH_PASSWORD
        })
        return response.json().get("token")
    
    def test_get_beneficiary_meals(self, auth_token):
        """Get meals for beneficiary"""
        response = requests.get(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get meals: {response.text}"
        data = response.json()
        
        # API returns object with meals array and source
        assert "meals" in data, f"Expected 'meals' key in response, got: {data.keys()}"
        assert "source" in data, f"Expected 'source' key in response"
        assert isinstance(data["meals"], list), f"Expected meals to be list"
        
        print(f"✓ Got {len(data['meals'])} meals for beneficiary (source: {data['source']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
