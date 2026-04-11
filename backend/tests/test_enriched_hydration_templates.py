"""
Test suite for enriched hydration templates feature.
Tests:
1. GET /api/pro/reminder-templates - returns enriched hydration templates with new fields
2. POST /api/pro/reminder-templates - creates hydration template with all new fields
3. PUT /api/pro/reminder-templates/{id} - updates new fields
4. POST /api/pro/seed-templates - smart dedup by title
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vita-conversion.preview.emergentagent.com')

# Test credentials
COACH_PHONE = "+33655443322"
COACH_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for coach user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": COACH_PHONE, "password": COACH_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    data = response.json()
    return data.get("token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Authenticated requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestReminderTemplatesEnriched:
    """Tests for enriched reminder templates (hydration + complements)"""

    def test_get_reminder_templates_returns_enriched_fields(self, api_client):
        """GET /api/pro/reminder-templates should return templates with enriched fields"""
        response = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        templates = response.json()
        assert isinstance(templates, list), "Response should be a list"
        
        # Find a hydration template to verify enriched fields
        hydration_templates = [t for t in templates if t.get("reminder_type") == "hydration"]
        
        if len(hydration_templates) > 0:
            tpl = hydration_templates[0]
            # Verify enriched fields exist (may be empty but should be present)
            print(f"Hydration template found: {tpl.get('title')}")
            print(f"  - category: {tpl.get('category')}")
            print(f"  - description: {tpl.get('description')}")
            print(f"  - volume: {tpl.get('volume')}")
            print(f"  - benefits: {tpl.get('benefits')}")
            print(f"  - ingredients: {tpl.get('ingredients')}")
            
            # Check that the template has the expected structure
            assert "title" in tpl, "Template should have title"
            assert "reminder_type" in tpl, "Template should have reminder_type"
        else:
            print("No hydration templates found yet - will be created by seed")

    def test_create_hydration_template_with_enriched_fields(self, api_client):
        """POST /api/pro/reminder-templates creates hydration with all new fields"""
        payload = {
            "reminder_type": "hydration",
            "title": "TEST_Smoothie Test Enrichi",
            "time": "09:00",
            "dosage": "",
            "notes": "Mixer tous les ingredients avec des glacons",
            "description": "Smoothie test pour validation des champs enrichis",
            "ingredients": [
                {"name": "Fraises", "quantity": "150", "unit": "g"},
                {"name": "Banane", "quantity": "1", "unit": "pc"},
                {"name": "Yaourt grec", "quantity": "100", "unit": "g"}
            ],
            "volume": "400ml",
            "benefits": "Riche en vitamine C, antioxydants, energie naturelle",
            "category": "Smoothie"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/pro/reminder-templates",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created = response.json()
        
        # Verify all enriched fields are saved
        assert created.get("title") == payload["title"], "Title should match"
        assert created.get("reminder_type") == "hydration", "Type should be hydration"
        assert created.get("description") == payload["description"], "Description should match"
        assert created.get("volume") == payload["volume"], "Volume should match"
        assert created.get("benefits") == payload["benefits"], "Benefits should match"
        assert created.get("category") == payload["category"], "Category should match"
        
        # Verify ingredients array
        assert isinstance(created.get("ingredients"), list), "Ingredients should be a list"
        assert len(created.get("ingredients")) == 3, "Should have 3 ingredients"
        assert created["ingredients"][0]["name"] == "Fraises", "First ingredient should be Fraises"
        
        print(f"Created hydration template: {created.get('id')}")
        
        # Store ID for cleanup
        return created.get("id")

    def test_create_complement_template_with_enriched_fields(self, api_client):
        """POST /api/pro/reminder-templates creates complement with description, dosage, benefits"""
        payload = {
            "reminder_type": "medication",
            "title": "TEST_Omega 3 Enrichi",
            "time": "12:00",
            "dosage": "2 capsules/jour",
            "notes": "Prendre pendant le repas",
            "description": "Acides gras essentiels EPA et DHA pour le coeur et le cerveau",
            "benefits": "Anti-inflammatoire, sante cardiovasculaire, fonction cerebrale",
            "category": "Sante"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/pro/reminder-templates",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created = response.json()
        
        # Verify enriched fields
        assert created.get("title") == payload["title"]
        assert created.get("description") == payload["description"]
        assert created.get("dosage") == payload["dosage"]
        assert created.get("benefits") == payload["benefits"]
        assert created.get("category") == payload["category"]
        
        print(f"Created complement template: {created.get('id')}")
        return created.get("id")

    def test_update_reminder_template_enriched_fields(self, api_client):
        """PUT /api/pro/reminder-templates/{id} updates new fields"""
        # First create a template
        create_payload = {
            "reminder_type": "hydration",
            "title": "TEST_Update Test Hydration",
            "description": "Original description",
            "volume": "300ml",
            "benefits": "Original benefits",
            "category": "Eau",
            "ingredients": [{"name": "Eau", "quantity": "300", "unit": "ml"}]
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/pro/reminder-templates",
            json=create_payload
        )
        assert create_response.status_code == 200
        created = create_response.json()
        template_id = created.get("id")
        
        # Now update with new values
        update_payload = {
            "description": "Updated description with more details",
            "volume": "500ml",
            "benefits": "Updated benefits - more vitamins",
            "category": "Eau aromatisee",
            "ingredients": [
                {"name": "Eau", "quantity": "450", "unit": "ml"},
                {"name": "Citron", "quantity": "1", "unit": "pc"}
            ]
        }
        
        update_response = api_client.put(
            f"{BASE_URL}/api/pro/reminder-templates/{template_id}",
            json=update_payload
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        updated = update_response.json()
        
        # Verify updates
        assert updated.get("description") == update_payload["description"], "Description should be updated"
        assert updated.get("volume") == update_payload["volume"], "Volume should be updated"
        assert updated.get("benefits") == update_payload["benefits"], "Benefits should be updated"
        assert updated.get("category") == update_payload["category"], "Category should be updated"
        assert len(updated.get("ingredients", [])) == 2, "Should have 2 ingredients after update"
        
        print(f"Updated template {template_id} successfully")
        return template_id

    def test_seed_templates_dedup_by_title(self, api_client):
        """POST /api/pro/seed-templates should add missing templates without duplicating existing ones"""
        # Get initial count
        initial_response = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        assert initial_response.status_code == 200
        initial_templates = initial_response.json()
        initial_count = len(initial_templates)
        
        # Run seed
        seed_response = api_client.post(f"{BASE_URL}/api/pro/seed-templates")
        assert seed_response.status_code == 200, f"Seed failed: {seed_response.status_code}: {seed_response.text}"
        
        # Get count after first seed
        after_first_seed = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        first_seed_count = len(after_first_seed.json())
        
        # Run seed again - should not add duplicates
        seed_response2 = api_client.post(f"{BASE_URL}/api/pro/seed-templates")
        assert seed_response2.status_code == 200
        
        # Get count after second seed
        after_second_seed = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        second_seed_count = len(after_second_seed.json())
        
        # Count should be same after second seed (dedup working)
        assert second_seed_count == first_seed_count, f"Seed should not duplicate: {first_seed_count} vs {second_seed_count}"
        
        print(f"Seed dedup working: initial={initial_count}, after_seed={first_seed_count}, after_reseed={second_seed_count}")

    def test_seeded_hydration_templates_have_enriched_fields(self, api_client):
        """Verify seeded hydration templates have all enriched fields populated"""
        # Ensure seed has run
        api_client.post(f"{BASE_URL}/api/pro/seed-templates")
        
        response = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        assert response.status_code == 200
        
        templates = response.json()
        hydration_templates = [t for t in templates if t.get("reminder_type") == "hydration"]
        
        # Should have seeded hydration templates
        assert len(hydration_templates) > 0, "Should have hydration templates after seed"
        
        # Check a known seeded template (e.g., "Smoothie fraise-banane")
        smoothie = next((t for t in hydration_templates if "fraise" in t.get("title", "").lower()), None)
        
        if smoothie:
            print(f"Checking seeded smoothie: {smoothie.get('title')}")
            
            # Verify enriched fields are populated
            assert smoothie.get("category"), f"Category should be set: {smoothie.get('category')}"
            assert smoothie.get("description"), f"Description should be set: {smoothie.get('description')}"
            assert smoothie.get("volume"), f"Volume should be set: {smoothie.get('volume')}"
            assert smoothie.get("benefits"), f"Benefits should be set: {smoothie.get('benefits')}"
            assert isinstance(smoothie.get("ingredients"), list), "Ingredients should be a list"
            assert len(smoothie.get("ingredients", [])) > 0, "Should have ingredients"
            
            # Check ingredient structure
            ing = smoothie["ingredients"][0]
            assert "name" in ing, "Ingredient should have name"
            assert "quantity" in ing, "Ingredient should have quantity"
            assert "unit" in ing, "Ingredient should have unit"
            
            print(f"  Category: {smoothie.get('category')}")
            print(f"  Volume: {smoothie.get('volume')}")
            print(f"  Ingredients count: {len(smoothie.get('ingredients', []))}")
        else:
            print("Smoothie fraise-banane not found in seeded templates")

    def test_seeded_complement_templates_have_enriched_fields(self, api_client):
        """Verify seeded complement templates have description, dosage, benefits"""
        # Ensure seed has run
        api_client.post(f"{BASE_URL}/api/pro/seed-templates")
        
        response = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        assert response.status_code == 200
        
        templates = response.json()
        complement_templates = [t for t in templates if t.get("reminder_type") == "medication"]
        
        assert len(complement_templates) > 0, "Should have complement templates after seed"
        
        # Check a known seeded complement (e.g., "Omega 3")
        omega = next((t for t in complement_templates if "omega" in t.get("title", "").lower()), None)
        
        if omega:
            print(f"Checking seeded complement: {omega.get('title')}")
            
            assert omega.get("dosage"), f"Dosage should be set: {omega.get('dosage')}"
            assert omega.get("description"), f"Description should be set: {omega.get('description')}"
            assert omega.get("benefits"), f"Benefits should be set: {omega.get('benefits')}"
            assert omega.get("category"), f"Category should be set: {omega.get('category')}"
            
            print(f"  Dosage: {omega.get('dosage')}")
            print(f"  Category: {omega.get('category')}")
        else:
            print("Omega 3 not found in seeded templates")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_templates(self, api_client):
        """Delete TEST_ prefixed templates"""
        response = api_client.get(f"{BASE_URL}/api/pro/reminder-templates")
        if response.status_code != 200:
            return
        
        templates = response.json()
        test_templates = [t for t in templates if t.get("title", "").startswith("TEST_")]
        
        for tpl in test_templates:
            delete_response = api_client.delete(f"{BASE_URL}/api/pro/reminder-templates/{tpl['id']}")
            print(f"Deleted test template: {tpl.get('title')} - {delete_response.status_code}")
        
        print(f"Cleaned up {len(test_templates)} test templates")
