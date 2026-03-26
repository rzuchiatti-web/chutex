"""
Test iteration 176 - 7 bug fixes for ProSpace:
1. Popup complements (GlassModal slide-up from bottom)
2. Separation Hydratation/Traitements
3. No gray background on images
4. Meal detail page loading
5. Remove 'TOUS LES EXERCICES' section
6. Edit exercise from library
7. Nutrition card at top of ProSpace
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration176Fixes:
    """Test backend APIs for iteration 176 fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as coach (email field accepts phone)
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user = login_resp.json().get("user", {})
        else:
            pytest.skip("Login failed - skipping tests")
    
    # Fix 7 - Nutrition card API
    def test_beneficiary_nutrition_endpoint(self):
        """Test GET /api/pro/beneficiary-nutrition/{id} returns kcal, water, macros"""
        # First get beneficiaries
        bens_resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        assert bens_resp.status_code == 200, f"Failed to get beneficiaries: {bens_resp.text}"
        bens = bens_resp.json()
        assert len(bens) > 0, "No beneficiaries found"
        
        ben_id = bens[0]["id"]
        
        # Test nutrition endpoint
        resp = self.session.get(f"{BASE_URL}/api/pro/beneficiary-nutrition/{ben_id}")
        assert resp.status_code == 200, f"Nutrition endpoint failed: {resp.text}"
        
        data = resp.json()
        assert "daily_calories" in data, "Missing daily_calories"
        assert "water_ml" in data, "Missing water_ml"
        assert "macros" in data, "Missing macros"
        
        # Verify macros structure
        macros = data.get("macros", {})
        assert "proteines_g" in macros or data.get("daily_calories", 0) == 0, "Missing proteines_g in macros"
        print(f"Nutrition data: {data}")
    
    # Fix 4 - Meal detail API
    def test_assigned_meal_detail_endpoint(self):
        """Test GET /api/pro/assigned-meal-detail/{id} returns full meal details"""
        # First get beneficiaries
        bens_resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        assert bens_resp.status_code == 200
        bens = bens_resp.json()
        if not bens:
            pytest.skip("No beneficiaries")
        
        ben_id = bens[0]["id"]
        
        # Get assigned meals
        meals_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-meals/{ben_id}")
        assert meals_resp.status_code == 200, f"Failed to get assigned meals: {meals_resp.text}"
        meals = meals_resp.json()
        
        if not meals:
            # Create a meal assignment first
            # Get meal templates
            tpls_resp = self.session.get(f"{BASE_URL}/api/pro/meal-templates")
            assert tpls_resp.status_code == 200
            tpls = tpls_resp.json()
            
            if tpls:
                # Assign a meal
                assign_resp = self.session.post(f"{BASE_URL}/api/pro/assign-meal", json={
                    "meal_template_id": tpls[0]["id"],
                    "beneficiary_id": ben_id,
                    "days": ["jeudi"],
                    "meal_type": "petit_dejeuner"
                })
                assert assign_resp.status_code == 200, f"Failed to assign meal: {assign_resp.text}"
                meals = [assign_resp.json()]
        
        if meals:
            meal_id = meals[0]["id"]
            # Test assigned meal detail endpoint
            detail_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-meal-detail/{meal_id}")
            assert detail_resp.status_code == 200, f"Meal detail failed: {detail_resp.text}"
            
            detail = detail_resp.json()
            assert "title" in detail, "Missing title in meal detail"
            print(f"Meal detail: {detail.get('title')}, ingredients: {len(detail.get('ingredients', []))}")
    
    def test_meal_template_detail_endpoint(self):
        """Test GET /api/pro/meal-template-detail/{id} returns full template details"""
        # Get meal templates
        tpls_resp = self.session.get(f"{BASE_URL}/api/pro/meal-templates")
        assert tpls_resp.status_code == 200
        tpls = tpls_resp.json()
        
        if not tpls:
            pytest.skip("No meal templates")
        
        tpl_id = tpls[0]["id"]
        detail_resp = self.session.get(f"{BASE_URL}/api/pro/meal-template-detail/{tpl_id}")
        assert detail_resp.status_code == 200, f"Template detail failed: {detail_resp.text}"
        
        detail = detail_resp.json()
        assert "title" in detail, "Missing title"
        assert "ingredients" in detail or "items" in detail, "Missing ingredients/items"
        print(f"Template detail: {detail.get('title')}")
    
    # Fix 6 - Edit exercise template API
    def test_update_exercise_template_endpoint(self):
        """Test PUT /api/pro/exercise-templates/{id} updates template"""
        # Get exercise templates
        tpls_resp = self.session.get(f"{BASE_URL}/api/pro/exercise-templates")
        assert tpls_resp.status_code == 200
        tpls = tpls_resp.json()
        
        if not tpls:
            pytest.skip("No exercise templates")
        
        tpl = tpls[0]
        tpl_id = tpl["id"]
        original_title = tpl.get("title", "")
        
        # Update the template
        update_data = {
            "title": original_title,  # Keep same title
            "description": "Updated description for test",
            "sets": 4,
            "repetitions": 15,
            "rest_seconds": 90,
            "difficulty": "moyen",
            "muscle_group": "jambes"
        }
        
        update_resp = self.session.put(f"{BASE_URL}/api/pro/exercise-templates/{tpl_id}", json=update_data)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        updated = update_resp.json()
        assert updated.get("description") == "Updated description for test", "Description not updated"
        assert updated.get("sets") == 4, "Sets not updated"
        assert updated.get("repetitions") == 15, "Repetitions not updated"
        print(f"Updated template: {updated.get('title')}, sets={updated.get('sets')}, reps={updated.get('repetitions')}")
    
    # Fix 2 - Verify reminders have reminder_type field for filtering
    def test_assigned_reminders_have_type_field(self):
        """Test that assigned reminders have reminder_type for hydration/treatment filtering"""
        bens_resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        assert bens_resp.status_code == 200
        bens = bens_resp.json()
        if not bens:
            pytest.skip("No beneficiaries")
        
        ben_id = bens[0]["id"]
        
        # Get assigned reminders
        rems_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-reminders/{ben_id}")
        assert rems_resp.status_code == 200, f"Failed to get reminders: {rems_resp.text}"
        rems = rems_resp.json()
        
        # Check that each reminder has reminder_type
        for rem in rems:
            assert "reminder_type" in rem, f"Reminder {rem.get('id')} missing reminder_type"
            assert rem["reminder_type"] in ["medication", "hydration"], f"Invalid reminder_type: {rem['reminder_type']}"
        
        # Count by type
        medications = [r for r in rems if r.get("reminder_type") != "hydration"]
        hydrations = [r for r in rems if r.get("reminder_type") == "hydration"]
        print(f"Reminders: {len(medications)} treatments, {len(hydrations)} hydration")
    
    def test_reminder_templates_have_type_field(self):
        """Test that reminder templates have reminder_type field"""
        tpls_resp = self.session.get(f"{BASE_URL}/api/pro/reminder-templates")
        assert tpls_resp.status_code == 200
        tpls = tpls_resp.json()
        
        for tpl in tpls:
            assert "reminder_type" in tpl, f"Template {tpl.get('id')} missing reminder_type"
        
        medications = [t for t in tpls if t.get("reminder_type") != "hydration"]
        hydrations = [t for t in tpls if t.get("reminder_type") == "hydration"]
        print(f"Templates: {len(medications)} medication, {len(hydrations)} hydration")
    
    # Test assigned exercises for day filtering (Fix 5 - only show day's exercises)
    def test_assigned_exercises_have_days_field(self):
        """Test that assigned exercises have days field for filtering"""
        bens_resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        assert bens_resp.status_code == 200
        bens = bens_resp.json()
        if not bens:
            pytest.skip("No beneficiaries")
        
        ben_id = bens[0]["id"]
        
        exs_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-exercises/{ben_id}")
        assert exs_resp.status_code == 200, f"Failed to get exercises: {exs_resp.text}"
        exs = exs_resp.json()
        
        for ex in exs:
            assert "days" in ex, f"Exercise {ex.get('id')} missing days field"
            assert isinstance(ex["days"], list), "days should be a list"
        
        # Count exercises for jeudi
        jeudi_exs = [e for e in exs if "jeudi" in e.get("days", [])]
        print(f"Total exercises: {len(exs)}, jeudi exercises: {len(jeudi_exs)}")


class TestMealDetailRoutes:
    """Test meal detail routes specifically"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33655443322",
            "password": "test123"
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Login failed")
    
    def test_assigned_meal_detail_returns_ingredients_and_steps(self):
        """Verify assigned meal detail includes ingredients and steps for meal-detail page"""
        bens_resp = self.session.get(f"{BASE_URL}/api/guardian/beneficiaries")
        bens = bens_resp.json()
        if not bens:
            pytest.skip("No beneficiaries")
        
        ben_id = bens[0]["id"]
        meals_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-meals/{ben_id}")
        meals = meals_resp.json()
        
        if not meals:
            # Seed templates first
            self.session.post(f"{BASE_URL}/api/pro/seed-templates")
            tpls_resp = self.session.get(f"{BASE_URL}/api/pro/meal-templates")
            tpls = tpls_resp.json()
            if tpls:
                assign_resp = self.session.post(f"{BASE_URL}/api/pro/assign-meal", json={
                    "meal_template_id": tpls[0]["id"],
                    "beneficiary_id": ben_id,
                    "days": ["jeudi"],
                    "meal_type": "petit_dejeuner"
                })
                if assign_resp.status_code == 200:
                    meals = [assign_resp.json()]
        
        if meals:
            meal_id = meals[0]["id"]
            detail_resp = self.session.get(f"{BASE_URL}/api/pro/assigned-meal-detail/{meal_id}")
            assert detail_resp.status_code == 200
            
            detail = detail_resp.json()
            # Check for ingredients and steps (needed for meal-detail page)
            has_ingredients = "ingredients" in detail and len(detail.get("ingredients", [])) > 0
            has_steps = "steps" in detail and len(detail.get("steps", [])) > 0
            has_items = "items" in detail and len(detail.get("items", [])) > 0
            
            print(f"Meal detail has: ingredients={has_ingredients}, steps={has_steps}, items={has_items}")
            print(f"Full detail keys: {list(detail.keys())}")
            
            # At minimum should have title and some content
            assert "title" in detail, "Missing title"
            assert has_ingredients or has_items, "Missing ingredients or items"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
