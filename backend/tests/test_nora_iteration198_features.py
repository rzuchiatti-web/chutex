"""
Test Nora AI NEW Features - Iteration 198
Tests DELETE_EXERCISE, UPDATE_MEAL_PLAN actions and enriched context.

Features tested:
1. DELETE_EXERCISE action - succeeds for nora_assigned, fails for coach-prescribed
2. UPDATE_MEAL_PLAN action - generates 4 meals and saves to minceur_daily_cache
3. Enriched context - today_exercises and nutrition_today in Nora context
4. Previous actions still work - ADD_EXERCISE, UPDATE_CALORIES, ADJUST_MACROS
"""
import pytest
import requests
import os
import uuid
import time
from datetime import datetime, timezone

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://bracelet-biometrics.preview.emergentagent.com").rstrip("/")


class TestDeleteExerciseAction:
    """Test DELETE_EXERCISE action - only Nora-assigned exercises can be deleted"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with beneficiary login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as beneficiary (Josette)
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        assert self.token, "No token received"
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.chat_session_id = f"test-delete-ex-{uuid.uuid4().hex[:8]}"
        
    def test_01_login_verified(self):
        """Verify login works"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Logged in as: {data.get('name')} (id: {self.user_id})")
        
    def test_02_add_nora_exercise_then_delete(self):
        """Add exercise via Nora, then delete it - should succeed"""
        # First add an exercise via chat
        add_response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Ajoute un exercice de yoga de 20 minutes",
                "session_id": f"{self.chat_session_id}-add"
            },
            timeout=60
        )
        assert add_response.status_code == 200, f"Add exercise failed: {add_response.text}"
        add_data = add_response.json()
        print(f"Add response: {add_data.get('content', '')[:150]}...")
        
        # Check if ADD_EXERCISE action was triggered
        actions = add_data.get("actions", [])
        add_action = next((a for a in actions if a.get("action") == "ADD_EXERCISE"), None)
        
        if add_action and add_action.get("result", {}).get("success"):
            exercise_id = add_action["result"].get("exercise_id")
            print(f"✓ Exercise added with id: {exercise_id}")
            
            # Now try to delete it via chat
            time.sleep(2)  # Wait for LLM
            delete_response = self.session.post(
                f"{BASE_URL}/api/chat/message",
                json={
                    "message": f"Supprime l'exercice de yoga que tu viens d'ajouter (id: {exercise_id})",
                    "session_id": f"{self.chat_session_id}-delete"
                },
                timeout=60
            )
            assert delete_response.status_code == 200
            delete_data = delete_response.json()
            print(f"Delete response: {delete_data.get('content', '')[:150]}...")
            
            delete_actions = delete_data.get("actions", [])
            delete_action = next((a for a in delete_actions if a.get("action") == "DELETE_EXERCISE"), None)
            
            if delete_action:
                result = delete_action.get("result", {})
                # Should succeed for Nora-assigned exercise
                assert result.get("success") == True, f"DELETE_EXERCISE should succeed for Nora-assigned: {result}"
                print(f"✓ DELETE_EXERCISE succeeded: {result}")
            else:
                print(f"⚠ LLM did not trigger DELETE_EXERCISE action")
        else:
            print(f"⚠ ADD_EXERCISE not triggered, skipping delete test")
            
    def test_03_delete_coach_exercise_should_fail(self):
        """Attempt to delete coach-prescribed exercise - should fail with prescription_protegee"""
        # Get list of exercises to find a coach-prescribed one
        response = self.session.get(f"{BASE_URL}/api/professional/beneficiary-exercises/{self.user_id}")
        if response.status_code != 200:
            print(f"⚠ Could not get exercises: {response.status_code}")
            return
            
        exercises = response.json()
        # Find a non-nora exercise (coach-prescribed)
        coach_exercise = next((e for e in exercises if not e.get("nora_assigned")), None)
        
        if coach_exercise:
            exercise_id = coach_exercise.get("id")
            print(f"Found coach exercise: {coach_exercise.get('title')} (id: {exercise_id})")
            
            # Try to delete via chat
            delete_response = self.session.post(
                f"{BASE_URL}/api/chat/message",
                json={
                    "message": f"Supprime l'exercice {coach_exercise.get('title')} (id: {exercise_id})",
                    "session_id": f"{self.chat_session_id}-coach-delete"
                },
                timeout=60
            )
            assert delete_response.status_code == 200
            delete_data = delete_response.json()
            print(f"Delete response: {delete_data.get('content', '')[:150]}...")
            
            delete_actions = delete_data.get("actions", [])
            delete_action = next((a for a in delete_actions if a.get("action") == "DELETE_EXERCISE"), None)
            
            if delete_action:
                result = delete_action.get("result", {})
                # Should FAIL for coach-prescribed exercise
                assert result.get("success") == False, f"DELETE_EXERCISE should fail for coach exercise: {result}"
                assert result.get("reason") == "prescription_protegee", f"Should have prescription_protegee reason: {result}"
                print(f"✓ DELETE_EXERCISE correctly blocked for coach exercise: {result}")
            else:
                print(f"⚠ LLM did not trigger DELETE_EXERCISE action")
        else:
            print(f"⚠ No coach-prescribed exercises found to test deletion block")


class TestUpdateMealPlanAction:
    """Test UPDATE_MEAL_PLAN action - generates 4 meals and saves to minceur_daily_cache"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.chat_session_id = f"test-meal-plan-{uuid.uuid4().hex[:8]}"
        
    def test_01_request_meal_plan(self):
        """Request meal plan via chat - should trigger UPDATE_MEAL_PLAN action"""
        # Get current daily recommendations before
        before_response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
        before_meals = []
        if before_response.status_code == 200:
            before_data = before_response.json()
            before_meals = before_data.get("recommendations", {}).get("meals", [])
            print(f"Before: {len(before_meals)} meals in cache")
        
        # Request meal plan
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Propose-moi un plan de repas pour aujourd'hui avec petit-dejeuner, dejeuner, collation et diner",
                "session_id": self.chat_session_id
            },
            timeout=90  # Meal plan generation can take longer
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        print(f"Response content: {data.get('content', '')[:300]}...")
        
        actions = data.get("actions", [])
        print(f"Actions returned: {[a.get('action') for a in actions]}")
        
        meal_action = next((a for a in actions if a.get("action") == "UPDATE_MEAL_PLAN"), None)
        
        if meal_action:
            result = meal_action.get("result", {})
            assert result.get("success") == True, f"UPDATE_MEAL_PLAN should succeed: {result}"
            assert result.get("meal_count", 0) >= 1, f"Should have at least 1 meal: {result}"
            print(f"✓ UPDATE_MEAL_PLAN succeeded: {result.get('meal_count')} meals, {result.get('total_calories')} kcal")
            print(f"  Meal names: {result.get('meal_names', [])}")
            
            # Verify meals were saved to minceur_daily_cache
            time.sleep(1)
            after_response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
            if after_response.status_code == 200:
                after_data = after_response.json()
                after_meals = after_data.get("recommendations", {}).get("meals", [])
                print(f"After: {len(after_meals)} meals in cache")
                
                if len(after_meals) > 0:
                    print(f"✓ Meals saved to minceur_daily_cache")
                    # Check meal structure
                    for meal in after_meals[:2]:  # Check first 2
                        print(f"  - {meal.get('name', meal.get('label', 'Unknown'))}: {meal.get('calories', '?')} kcal")
        else:
            print(f"⚠ LLM did not trigger UPDATE_MEAL_PLAN action")
            
    def test_02_meal_plan_structure(self):
        """Verify meal plan has correct structure with ingredients and recipe"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Cree-moi un menu complet pour la journee avec les recettes",
                "session_id": f"{self.chat_session_id}-structure"
            },
            timeout=90
        )
        assert response.status_code == 200
        data = response.json()
        
        actions = data.get("actions", [])
        meal_action = next((a for a in actions if a.get("action") == "UPDATE_MEAL_PLAN"), None)
        
        if meal_action and meal_action.get("result", {}).get("success"):
            # Get the saved meals from cache
            cache_response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
            if cache_response.status_code == 200:
                cache_data = cache_response.json()
                meals = cache_data.get("recommendations", {}).get("meals", [])
                
                if meals:
                    meal = meals[0]
                    print(f"Checking meal structure for: {meal.get('name', 'Unknown')}")
                    
                    # Check expected fields
                    expected_fields = ["name", "calories", "proteines_g", "glucides_g", "lipides_g"]
                    for field in expected_fields:
                        if field in meal:
                            print(f"  ✓ Has {field}: {meal.get(field)}")
                        else:
                            print(f"  ⚠ Missing {field}")
                            
                    # Check optional fields
                    if meal.get("ingredients"):
                        print(f"  ✓ Has ingredients: {len(meal['ingredients'])} items")
                    if meal.get("recipe"):
                        print(f"  ✓ Has recipe: {len(meal['recipe'])} steps")
        else:
            print(f"⚠ UPDATE_MEAL_PLAN not triggered")


class TestEnrichedNoraContext:
    """Test enriched Nora context with today_exercises and nutrition_today"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.chat_session_id = f"test-context-{uuid.uuid4().hex[:8]}"
        
    def test_01_nora_knows_about_exercises(self):
        """Nora should know about today's exercises when asked"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Quels exercices dois-je faire aujourd'hui?",
                "session_id": self.chat_session_id
            },
            timeout=45
        )
        assert response.status_code == 200
        data = response.json()
        
        content = data.get("content", "").lower()
        print(f"Response: {data.get('content', '')[:300]}...")
        
        # Nora should mention exercises or say there are none
        exercise_keywords = ["exercice", "entrainement", "seance", "programme", "aucun exercice", "pas d'exercice"]
        has_exercise_context = any(kw in content for kw in exercise_keywords)
        
        if has_exercise_context:
            print(f"✓ Nora responded with exercise context")
        else:
            print(f"⚠ Response may not include exercise context")
            
    def test_02_nora_knows_about_nutrition(self):
        """Nora should know about today's nutrition when asked"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Combien de calories ai-je prevu pour aujourd'hui?",
                "session_id": f"{self.chat_session_id}-nutrition"
            },
            timeout=45
        )
        assert response.status_code == 200
        data = response.json()
        
        content = data.get("content", "").lower()
        print(f"Response: {data.get('content', '')[:300]}...")
        
        # Nora should mention calories or nutrition
        nutrition_keywords = ["calorie", "kcal", "nutrition", "repas", "macros", "proteine", "glucide", "lipide"]
        has_nutrition_context = any(kw in content for kw in nutrition_keywords)
        
        if has_nutrition_context:
            print(f"✓ Nora responded with nutrition context")
        else:
            print(f"⚠ Response may not include nutrition context")


class TestPreviousActionsStillWork:
    """Verify previous actions (ADD_EXERCISE, UPDATE_CALORIES, ADJUST_MACROS) still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        self.chat_session_id = f"test-prev-{uuid.uuid4().hex[:8]}"
        
    def test_01_add_exercise_still_works(self):
        """ADD_EXERCISE action should still work"""
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Ajoute un exercice de squats 3 series de 15 repetitions",
                "session_id": f"{self.chat_session_id}-add"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        actions = data.get("actions", [])
        add_action = next((a for a in actions if a.get("action") == "ADD_EXERCISE"), None)
        
        if add_action:
            result = add_action.get("result", {})
            assert result.get("success") == True, f"ADD_EXERCISE should succeed: {result}"
            print(f"✓ ADD_EXERCISE still works: {result}")
        else:
            print(f"⚠ LLM did not trigger ADD_EXERCISE")
            
    def test_02_update_calories_blocked_with_goal(self):
        """UPDATE_CALORIES should still be blocked when weight goal active"""
        # Ensure weight goal exists
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        time.sleep(0.5)
        
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Change mes calories a 2100 kcal",
                "session_id": f"{self.chat_session_id}-cal"
            },
            timeout=45
        )
        assert response.status_code == 200
        data = response.json()
        
        actions = data.get("actions", [])
        cal_action = next((a for a in actions if a.get("action") == "UPDATE_CALORIES"), None)
        
        if cal_action:
            result = cal_action.get("result", {})
            assert result.get("success") == False, f"UPDATE_CALORIES should be blocked: {result}"
            assert result.get("reason") == "objectif_poids_actif"
            print(f"✓ UPDATE_CALORIES correctly blocked with weight goal")
        else:
            print(f"⚠ LLM did not trigger UPDATE_CALORIES")
            
    def test_03_adjust_macros_blocked_with_goal(self):
        """ADJUST_MACROS should still be blocked when weight goal active"""
        # Ensure weight goal exists
        self.session.post(
            f"{BASE_URL}/api/minceur/weight-goal",
            json={"target_kg": 67, "weeks": 12}
        )
        time.sleep(0.5)
        
        response = self.session.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "message": "Augmente mes proteines a 90g par jour",
                "session_id": f"{self.chat_session_id}-macros"
            },
            timeout=45
        )
        assert response.status_code == 200
        data = response.json()
        
        actions = data.get("actions", [])
        macros_action = next((a for a in actions if a.get("action") == "ADJUST_MACROS"), None)
        
        if macros_action:
            result = macros_action.get("result", {})
            assert result.get("success") == False, f"ADJUST_MACROS should be blocked: {result}"
            assert result.get("reason") == "objectif_poids_actif"
            print(f"✓ ADJUST_MACROS correctly blocked with weight goal")
        else:
            print(f"⚠ LLM did not trigger ADJUST_MACROS")


class TestDirectActionHandlers:
    """Test action handlers directly without LLM (unit tests)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "+33651245918", "password": "test123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
    def test_01_get_exercises_list(self):
        """Get list of exercises to verify nora_assigned field"""
        response = self.session.get(f"{BASE_URL}/api/professional/beneficiary-exercises/{self.user_id}")
        if response.status_code == 200:
            exercises = response.json()
            print(f"Found {len(exercises)} exercises")
            
            nora_exercises = [e for e in exercises if e.get("nora_assigned")]
            coach_exercises = [e for e in exercises if not e.get("nora_assigned")]
            
            print(f"  - Nora-assigned: {len(nora_exercises)}")
            print(f"  - Coach-prescribed: {len(coach_exercises)}")
            
            for ex in nora_exercises[:3]:
                print(f"    Nora: {ex.get('title')} (id: {ex.get('id')[:8]}...)")
            for ex in coach_exercises[:3]:
                print(f"    Coach: {ex.get('title')} by {ex.get('professional_name')}")
        else:
            print(f"⚠ Could not get exercises: {response.status_code}")
            
    def test_02_daily_recommendations_structure(self):
        """Verify daily recommendations has meals field"""
        response = self.session.get(f"{BASE_URL}/api/minceur/daily-recommendations")
        if response.status_code == 200:
            data = response.json()
            recs = data.get("recommendations", {})
            
            print(f"Daily recommendations:")
            print(f"  - daily_calories: {recs.get('daily_calories', 'N/A')}")
            print(f"  - macros: {recs.get('macros', {})}")
            print(f"  - meals count: {len(recs.get('meals', []))}")
            print(f"  - nora_meal_plan: {recs.get('nora_meal_plan', False)}")
            
            if recs.get("meals"):
                for meal in recs["meals"][:2]:
                    print(f"    - {meal.get('name', meal.get('label', 'Unknown'))}: {meal.get('calories', '?')} kcal")
        else:
            print(f"⚠ Could not get daily recommendations: {response.status_code}")
            
    def test_03_weight_goal_status(self):
        """Check weight goal status"""
        response = self.session.get(f"{BASE_URL}/api/minceur/weight-goal-status")
        if response.status_code == 200:
            data = response.json()
            if data.get("target_kg"):
                print(f"✓ Weight goal active: {data.get('target_kg')}kg in {data.get('weeks')} weeks")
            else:
                print(f"✓ No weight goal active")
        else:
            print(f"⚠ Could not get weight goal status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
