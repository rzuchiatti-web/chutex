"""
Test ProSpace Iteration 166 - New API endpoints for:
1. POST /api/pro/upload-image - Upload image file
2. POST /api/pro/meal-templates - Create meal template
3. GET /api/pro/meal-templates - List meal templates
4. POST /api/pro/reminder-templates - Create reminder template
5. GET /api/pro/reminder-templates - List reminder templates
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://elio-v8-biometric.preview.emergentagent.com')

class TestProSpaceIteration166:
    """Test new ProSpace API endpoints for iteration 166"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as coach and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as coach
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.user = data.get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
    
    # ── Test 1: Upload Image ──
    def test_upload_image_success(self):
        """Test POST /api/pro/upload-image - Upload image file"""
        # Create a simple test image (1x1 pixel PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
        headers = {"Authorization": f"Bearer {self.token}"}  # Remove Content-Type for multipart
        
        response = requests.post(
            f"{BASE_URL}/api/pro/upload-image",
            files=files,
            headers=headers
        )
        
        print(f"Upload image response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "url" in data, "Response should contain 'url' field"
        assert data["url"].startswith("/api/uploads/"), f"URL should start with /api/uploads/, got {data['url']}"
        print(f"Uploaded image URL: {data['url']}")
    
    def test_upload_image_invalid_format(self):
        """Test POST /api/pro/upload-image - Reject invalid format"""
        # Create a fake text file
        files = {'file': ('test.txt', io.BytesIO(b'Hello World'), 'text/plain')}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pro/upload-image",
            files=files,
            headers=headers
        )
        
        print(f"Upload invalid format response: {response.status_code} - {response.text}")
        assert response.status_code == 400, f"Expected 400 for invalid format, got {response.status_code}"
    
    # ── Test 2: Meal Templates ──
    def test_create_meal_template(self):
        """Test POST /api/pro/meal-templates - Create meal template"""
        meal_data = {
            "meal_type": "dejeuner",
            "title": "TEST_Salade Proteines",
            "image": "",
            "ingredients": [
                {"name": "Poulet", "quantity": "150", "unit": "g"},
                {"name": "Salade", "quantity": "100", "unit": "g"}
            ],
            "steps": ["Cuire le poulet", "Preparer la salade", "Assembler"],
            "calories": 450,
            "proteins": 35,
            "glucides": 20,
            "lipides": 15,
            "notes": "Repas equilibre"
        }
        
        response = self.session.post(f"{BASE_URL}/api/pro/meal-templates", json=meal_data)
        
        print(f"Create meal template response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id' field"
        assert data["title"] == meal_data["title"], f"Title mismatch: {data.get('title')}"
        assert data["meal_type"] == meal_data["meal_type"], f"Meal type mismatch"
        assert data["calories"] == meal_data["calories"], f"Calories mismatch"
        assert data["proteins"] == meal_data["proteins"], f"Proteins mismatch"
        assert data["is_template"] == True, "Should be marked as template"
        print(f"Created meal template ID: {data['id']}")
        
        # Store for cleanup
        self.created_meal_id = data["id"]
    
    def test_list_meal_templates(self):
        """Test GET /api/pro/meal-templates - List meal templates"""
        response = self.session.get(f"{BASE_URL}/api/pro/meal-templates")
        
        print(f"List meal templates response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} meal templates")
        
        # Check structure of first item if exists
        if len(data) > 0:
            first = data[0]
            assert "id" in first, "Template should have 'id'"
            assert "meal_type" in first, "Template should have 'meal_type'"
            assert "is_template" in first, "Template should have 'is_template'"
    
    # ── Test 3: Reminder Templates ──
    def test_create_reminder_template(self):
        """Test POST /api/pro/reminder-templates - Create reminder template"""
        reminder_data = {
            "reminder_type": "medication",
            "title": "TEST_Prendre Vitamines",
            "time": "08:00",
            "dosage": "1 comprime",
            "notes": "A prendre avec le petit dejeuner"
        }
        
        response = self.session.post(f"{BASE_URL}/api/pro/reminder-templates", json=reminder_data)
        
        print(f"Create reminder template response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id' field"
        assert data["title"] == reminder_data["title"], f"Title mismatch: {data.get('title')}"
        assert data["reminder_type"] == reminder_data["reminder_type"], f"Type mismatch"
        assert data["time"] == reminder_data["time"], f"Time mismatch"
        assert data["is_template"] == True, "Should be marked as template"
        print(f"Created reminder template ID: {data['id']}")
        
        # Store for cleanup
        self.created_reminder_id = data["id"]
    
    def test_list_reminder_templates(self):
        """Test GET /api/pro/reminder-templates - List reminder templates"""
        response = self.session.get(f"{BASE_URL}/api/pro/reminder-templates")
        
        print(f"List reminder templates response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} reminder templates")
        
        # Check structure of first item if exists
        if len(data) > 0:
            first = data[0]
            assert "id" in first, "Template should have 'id'"
            assert "reminder_type" in first, "Template should have 'reminder_type'"
            assert "is_template" in first, "Template should have 'is_template'"
    
    # ── Test 4: Verify uploaded files are served ──
    def test_uploaded_file_accessible(self):
        """Test that uploaded files are accessible via /api/uploads/"""
        # First upload an image
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test_access.png', io.BytesIO(png_data), 'image/png')}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/pro/upload-image",
            files=files,
            headers=headers
        )
        
        if upload_response.status_code == 200:
            url = upload_response.json().get("url")
            
            # Try to access the uploaded file
            access_response = requests.get(f"{BASE_URL}{url}")
            print(f"Access uploaded file response: {access_response.status_code}")
            assert access_response.status_code == 200, f"Uploaded file should be accessible, got {access_response.status_code}"
        else:
            pytest.skip("Upload failed, cannot test file access")
    
    # ── Test 5: Verify existing program template endpoint ──
    def test_create_program_template(self):
        """Test POST /api/pro/programs/template - Create program template"""
        program_data = {
            "title": "TEST_Programme Force",
            "description": "Programme de renforcement musculaire",
            "frequency": "3x/semaine",
            "duration_weeks": 8,
            "category": "force"
        }
        
        response = self.session.post(f"{BASE_URL}/api/pro/programs/template", json=program_data)
        
        print(f"Create program template response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id' field"
        assert data["title"] == program_data["title"], f"Title mismatch"
        assert data["is_template"] == True, "Should be marked as template"
        assert data["beneficiary_id"] == "__template__", "Template should have __template__ as beneficiary_id"
        print(f"Created program template ID: {data['id']}")


class TestProSpaceAuthentication:
    """Test authentication requirements for ProSpace endpoints"""
    
    def test_upload_image_requires_auth(self):
        """Test that upload-image requires authentication"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/pro/upload-image", files=files)
        
        print(f"Upload without auth response: {response.status_code}")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_meal_templates_requires_auth(self):
        """Test that meal-templates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/meal-templates")
        
        print(f"Meal templates without auth response: {response.status_code}")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_reminder_templates_requires_auth(self):
        """Test that reminder-templates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/reminder-templates")
        
        print(f"Reminder templates without auth response: {response.status_code}")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
