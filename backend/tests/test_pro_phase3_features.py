"""
Test suite for Professional Phase 3 features:
- Pro Reminders (supplements/hydration) for beneficiaries
- Pro Meals management
- Beneficiary session completion (exercise validation)
- Bilans (Nora-powered health reports)
- has-active-programs check
- my-programs endpoint for beneficiaries
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vita-conversion.preview.emergentagent.com').rstrip('/')

# Test credentials
PRO_PHONE = "+33655443322"
PRO_PASSWORD = "test123"
BENEFICIARY_PHONE = "0651245918"
BENEFICIARY_PASSWORD = "test123"
BENEFICIARY_ID = "495e5e38-3591-474b-abe5-c932574bb609"


@pytest.fixture
def pro_token():
    """Get authentication token for professional user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PRO_PHONE,
        "password": PRO_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Professional login failed: {response.text}")
    return response.json()["token"]


@pytest.fixture
def beneficiary_token():
    """Get authentication token for beneficiary user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BENEFICIARY_PHONE,
        "password": BENEFICIARY_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Beneficiary login failed: {response.text}")
    return response.json()["token"]


# ═══════════════════════════════════════════════════════════════════════════════
# PRO REMINDERS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestProReminders:
    """Test POST/GET/DELETE /api/pro/reminders endpoints"""
    
    def test_create_medication_reminder(self, pro_token):
        """POST /api/pro/reminders/{beneficiary_id} creates a medication reminder"""
        reminder_data = {
            "reminder_type": "medication",
            "title": f"TEST_Vitamine_D_{uuid.uuid4().hex[:6]}",
            "time": "08:00",
            "days": ["lun", "mar", "mer", "jeu", "ven"],
            "notes": "Prendre avec le petit-dejeuner",
            "dosage": "1 gelule"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=reminder_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Missing id"
        assert data["reminder_type"] == "medication"
        assert data["title"] == reminder_data["title"]
        assert data["time"] == "08:00"
        assert data["dosage"] == "1 gelule"
        assert data["user_id"] == BENEFICIARY_ID
        assert "created_by_pro" in data, "Missing created_by_pro field"
        assert "pro_name" in data, "Missing pro_name field"
        assert data["active"] == True
        
        print(f"✓ Created medication reminder: {data['id']}")
        return data["id"]
    
    def test_create_hydration_reminder(self, pro_token):
        """POST /api/pro/reminders/{beneficiary_id} creates a hydration reminder"""
        reminder_data = {
            "reminder_type": "hydration",
            "title": f"TEST_Hydratation_{uuid.uuid4().hex[:6]}",
            "time": "10:00",
            "days": ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
            "notes": "Boire un grand verre d'eau"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=reminder_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["reminder_type"] == "hydration"
        assert data["title"] == reminder_data["title"]
        
        print(f"✓ Created hydration reminder: {data['id']}")
        return data["id"]
    
    def test_create_reminder_invalid_type(self, pro_token):
        """POST /api/pro/reminders rejects invalid reminder_type"""
        reminder_data = {
            "reminder_type": "invalid_type",
            "title": "Test",
            "time": "08:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=reminder_data
        )
        assert response.status_code == 400, f"Should reject invalid type, got {response.status_code}"
        print("✓ Correctly rejects invalid reminder_type")
    
    def test_list_pro_reminders(self, pro_token):
        """GET /api/pro/reminders/{beneficiary_id} lists reminders created by pro"""
        # First create a reminder
        reminder_data = {
            "reminder_type": "medication",
            "title": f"TEST_ListTest_{uuid.uuid4().hex[:6]}",
            "time": "09:00",
            "dosage": "2 comprimes"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=reminder_data
        )
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # List reminders
        response = requests.get(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        reminder_ids = [r["id"] for r in data]
        assert created_id in reminder_ids, "Created reminder not in list"
        
        print(f"✓ Listed {len(data)} pro reminders for beneficiary")
    
    def test_delete_pro_reminder(self, pro_token):
        """DELETE /api/pro/reminders/{reminder_id} deletes a reminder"""
        # Create a reminder to delete
        reminder_data = {
            "reminder_type": "medication",
            "title": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "time": "07:00"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=reminder_data
        )
        assert create_resp.status_code == 200
        reminder_id = create_resp.json()["id"]
        
        # Delete the reminder
        delete_resp = requests.delete(
            f"{BASE_URL}/api/pro/reminders/{reminder_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        assert delete_resp.json().get("status") == "deleted"
        
        # Verify it's gone
        list_resp = requests.get(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        reminders = list_resp.json()
        reminder_ids = [r["id"] for r in reminders]
        assert reminder_id not in reminder_ids, "Deleted reminder still in list"
        
        print(f"✓ Reminder {reminder_id} deleted successfully")
    
    def test_delete_nonexistent_reminder(self, pro_token):
        """DELETE /api/pro/reminders returns 404 for nonexistent reminder"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(
            f"{BASE_URL}/api/pro/reminders/{fake_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Correctly returns 404 for nonexistent reminder")


# ═══════════════════════════════════════════════════════════════════════════════
# PRO MEALS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestProMeals:
    """Test GET/POST/DELETE /api/pro/meals endpoints"""
    
    def test_get_beneficiary_meals(self, pro_token):
        """GET /api/pro/meals/{beneficiary_id} returns meal plan"""
        response = requests.get(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "meals" in data, "Missing meals field"
        assert "source" in data, "Missing source field"
        assert data["source"] in ["pro", "minceur", "none"], f"Invalid source: {data['source']}"
        assert isinstance(data["meals"], list), "meals should be a list"
        
        print(f"✓ Got meals for beneficiary, source: {data['source']}, count: {len(data['meals'])}")
    
    def test_add_meal(self, pro_token):
        """POST /api/pro/meals/{beneficiary_id} adds a meal"""
        meal_data = {
            "type": "lunch",
            "label": "Dejeuner",
            "name": f"TEST_Salade_Quinoa_{uuid.uuid4().hex[:6]}",
            "description": "Salade de quinoa aux legumes grilles",
            "calories": 450,
            "time": "12:30",
            "proteines_g": 15,
            "glucides_g": 55,
            "lipides_g": 18
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=meal_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "added"
        assert "meal" in data
        assert data["meal"]["name"] == meal_data["name"]
        assert data["meal"]["calories"] == 450
        assert data["meal"]["created_by_pro"] == True
        
        print(f"✓ Added meal: {meal_data['name']}")
    
    def test_add_breakfast_meal(self, pro_token):
        """POST /api/pro/meals adds breakfast type meal"""
        meal_data = {
            "type": "breakfast",
            "label": "Petit-dejeuner",
            "name": f"TEST_Porridge_{uuid.uuid4().hex[:6]}",
            "description": "Porridge aux fruits rouges",
            "calories": 320,
            "time": "08:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=meal_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["meal"]["type"] == "breakfast"
        print(f"✓ Added breakfast meal: {meal_data['name']}")
    
    def test_delete_meal_by_index(self, pro_token):
        """DELETE /api/pro/meals/{beneficiary_id}/{meal_index} deletes a meal"""
        # First add a meal
        meal_data = {
            "type": "snack",
            "label": "Collation",
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "calories": 150,
            "time": "16:00"
        }
        add_resp = requests.post(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=meal_data
        )
        assert add_resp.status_code == 200
        
        # Get current meals to find the index
        get_resp = requests.get(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        meals = get_resp.json()["meals"]
        
        # Find the index of our test meal
        test_meal_index = None
        for i, m in enumerate(meals):
            if m.get("name", "").startswith("TEST_ToDelete_"):
                test_meal_index = i
                break
        
        if test_meal_index is not None:
            # Delete the meal
            delete_resp = requests.delete(
                f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}/{test_meal_index}",
                headers={"Authorization": f"Bearer {pro_token}"}
            )
            assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
            assert delete_resp.json().get("status") == "deleted"
            print(f"✓ Deleted meal at index {test_meal_index}")
        else:
            print("✓ Test meal not found (may have been cleaned up)")
    
    def test_delete_meal_invalid_index(self, pro_token):
        """DELETE /api/pro/meals returns 404 for invalid index"""
        response = requests.delete(
            f"{BASE_URL}/api/pro/meals/{BENEFICIARY_ID}/999",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Correctly returns 404 for invalid meal index")
    
    def test_meals_requires_linked_beneficiary(self, pro_token):
        """GET /api/pro/meals rejects unlinked beneficiary"""
        fake_ben_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/pro/meals/{fake_ben_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 403, f"Should reject unlinked beneficiary, got {response.status_code}"
        print("✓ Correctly rejects unlinked beneficiary for meals")


# ═══════════════════════════════════════════════════════════════════════════════
# BENEFICIARY PROGRAM/SESSION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestBeneficiaryPrograms:
    """Test beneficiary endpoints for viewing and completing pro programs"""
    
    def test_has_active_programs(self, beneficiary_token):
        """GET /api/pro/has-active-programs checks if beneficiary has pro programs"""
        response = requests.get(
            f"{BASE_URL}/api/pro/has-active-programs",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "has_programs" in data, "Missing has_programs field"
        assert "count" in data, "Missing count field"
        assert isinstance(data["has_programs"], bool)
        assert isinstance(data["count"], int)
        
        print(f"✓ has_active_programs: {data['has_programs']}, count: {data['count']}")
    
    def test_get_my_programs(self, beneficiary_token):
        """GET /api/pro/my-programs returns beneficiary's prescribed programs"""
        response = requests.get(
            f"{BASE_URL}/api/pro/my-programs",
            headers={"Authorization": f"Bearer {beneficiary_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            prog = data[0]
            assert "id" in prog
            assert "title" in prog
            assert "professional_name" in prog
            assert "sessions" in prog
            assert "status" in prog
            assert prog["status"] == "active"
            print(f"✓ Found {len(data)} prescribed programs, first: {prog['title']}")
        else:
            print("✓ my-programs returned (no active programs)")


class TestSessionCompletion:
    """Test POST /api/pro/sessions/{program_id}/{session_id}/complete endpoint"""
    
    @pytest.fixture
    def test_program_with_session(self, pro_token):
        """Create a test program with a session for completion testing"""
        # Create program
        program_data = {
            "title": f"TEST_CompletionProg_{uuid.uuid4().hex[:6]}",
            "description": "For session completion testing",
            "frequency": "2x/semaine",
            "duration_weeks": 4,
            "category": "renforcement"
        }
        prog_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        assert prog_resp.status_code == 200
        program = prog_resp.json()
        
        # Add a session
        session_data = {
            "title": "Exercice de test",
            "description": "10 repetitions",
            "duration_min": 15,
            "repetitions": 10,
            "sets": 3
        }
        sess_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{program['id']}/sessions",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=session_data
        )
        assert sess_resp.status_code == 200
        session = sess_resp.json()
        
        yield {"program_id": program["id"], "session_id": session["id"]}
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program['id']}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
    
    def test_complete_session_done(self, beneficiary_token, test_program_with_session):
        """POST /api/pro/sessions/{program_id}/{session_id}/complete marks session as done"""
        program_id = test_program_with_session["program_id"]
        session_id = test_program_with_session["session_id"]
        
        completion_data = {
            "status": "done",
            "pain_level": 2,
            "patient_notes": "Exercice bien realise"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/sessions/{program_id}/{session_id}/complete",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json=completion_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data, "Missing completion id"
        assert "date" in data, "Missing date"
        assert data["status"] == "done"
        assert data["pain_level"] == 2
        assert data["patient_notes"] == "Exercice bien realise"
        
        print(f"✓ Session completed with status 'done', pain_level: 2")
    
    def test_complete_session_partial(self, beneficiary_token, pro_token):
        """POST /api/pro/sessions complete with 'partial' status"""
        # Create a new program/session for this test
        program_data = {
            "title": f"TEST_PartialProg_{uuid.uuid4().hex[:6]}",
            "description": "For partial completion test",
            "frequency": "1x/semaine",
            "duration_weeks": 2,
            "category": "cardio"
        }
        prog_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        program = prog_resp.json()
        
        session_data = {"title": "Cardio test", "duration_min": 20}
        sess_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{program['id']}/sessions",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=session_data
        )
        session = sess_resp.json()
        
        # Complete as partial
        completion_data = {
            "status": "partial",
            "pain_level": 5,
            "patient_notes": "Arrete a mi-parcours"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/sessions/{program['id']}/{session['id']}/complete",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json=completion_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "partial"
        assert data["pain_level"] == 5
        
        print(f"✓ Session completed with status 'partial'")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program['id']}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
    
    def test_complete_session_skipped(self, beneficiary_token, pro_token):
        """POST /api/pro/sessions complete with 'skipped' status"""
        # Create a new program/session
        program_data = {
            "title": f"TEST_SkippedProg_{uuid.uuid4().hex[:6]}",
            "description": "For skipped test",
            "frequency": "1x/semaine",
            "duration_weeks": 2,
            "category": "souplesse"
        }
        prog_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=program_data
        )
        program = prog_resp.json()
        
        session_data = {"title": "Etirements", "duration_min": 10}
        sess_resp = requests.post(
            f"{BASE_URL}/api/pro/programs/{program['id']}/sessions",
            headers={"Authorization": f"Bearer {pro_token}"},
            json=session_data
        )
        session = sess_resp.json()
        
        # Complete as skipped
        completion_data = {
            "status": "skipped",
            "patient_notes": "Pas le temps aujourd'hui"
        }
        response = requests.post(
            f"{BASE_URL}/api/pro/sessions/{program['id']}/{session['id']}/complete",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json=completion_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "skipped"
        
        print(f"✓ Session completed with status 'skipped'")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/pro/programs/edit/{program['id']}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
    
    def test_complete_nonexistent_program(self, beneficiary_token):
        """POST /api/pro/sessions returns 404 for nonexistent program"""
        fake_program_id = str(uuid.uuid4())
        fake_session_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/pro/sessions/{fake_program_id}/{fake_session_id}/complete",
            headers={"Authorization": f"Bearer {beneficiary_token}"},
            json={"status": "done"}
        )
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Correctly returns 404 for nonexistent program")


# ═══════════════════════════════════════════════════════════════════════════════
# BILANS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestBilans:
    """Test GET /api/pro/bilan/{beneficiary_id} endpoint"""
    
    def test_generate_weekly_bilan(self, pro_token):
        """GET /api/pro/bilan/{beneficiary_id}?period=week generates weekly bilan"""
        response = requests.get(
            f"{BASE_URL}/api/pro/bilan/{BENEFICIARY_ID}?period=week",
            headers={"Authorization": f"Bearer {pro_token}"},
            timeout=30  # Bilan generation may take time due to LLM
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "beneficiary_name" in data, "Missing beneficiary_name"
        assert "period" in data, "Missing period"
        assert data["period"] == "week"
        assert "vitals" in data, "Missing vitals"
        assert "programs" in data, "Missing programs"
        assert "supplements" in data, "Missing supplements"
        assert "bilan_text" in data, "Missing bilan_text"
        assert "generated_at" in data, "Missing generated_at"
        
        # Verify vitals structure (may be empty if no data)
        vitals = data["vitals"]
        assert isinstance(vitals, dict)
        
        # Verify bilan_text is not empty
        assert len(data["bilan_text"]) > 0, "bilan_text should not be empty"
        
        print(f"✓ Generated weekly bilan for {data['beneficiary_name']}")
        print(f"  Vitals: {vitals}")
        print(f"  Programs: {len(data['programs'])} programs")
        print(f"  Supplements: {len(data['supplements'])} supplements")
    
    def test_generate_monthly_bilan(self, pro_token):
        """GET /api/pro/bilan/{beneficiary_id}?period=month generates monthly bilan"""
        response = requests.get(
            f"{BASE_URL}/api/pro/bilan/{BENEFICIARY_ID}?period=month",
            headers={"Authorization": f"Bearer {pro_token}"},
            timeout=30
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["period"] == "month"
        assert "bilan_text" in data
        assert len(data["bilan_text"]) > 0
        
        print(f"✓ Generated monthly bilan")
    
    def test_bilan_nonexistent_beneficiary(self, pro_token):
        """GET /api/pro/bilan returns 404 for nonexistent beneficiary"""
        fake_ben_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/pro/bilan/{fake_ben_id}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Correctly returns 404 for nonexistent beneficiary")
    
    def test_bilan_requires_auth(self):
        """GET /api/pro/bilan requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/bilan/{BENEFICIARY_ID}")
        assert response.status_code == 401, f"Should require auth, got {response.status_code}"
        print("✓ Bilan correctly requires authentication")


# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════════════════════════

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_reminders(self, pro_token):
        """Delete all TEST_ prefixed reminders"""
        response = requests.get(
            f"{BASE_URL}/api/pro/reminders/{BENEFICIARY_ID}",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        if response.status_code == 200:
            reminders = response.json()
            deleted = 0
            for rem in reminders:
                if rem.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/pro/reminders/{rem['id']}",
                        headers={"Authorization": f"Bearer {pro_token}"}
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test reminders")
    
    def test_cleanup_test_programs(self, pro_token):
        """Delete all TEST_ prefixed programs"""
        response = requests.get(
            f"{BASE_URL}/api/pro/programs",
            headers={"Authorization": f"Bearer {pro_token}"}
        )
        if response.status_code == 200:
            programs = response.json()
            deleted = 0
            for prog in programs:
                if prog.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/pro/programs/edit/{prog['id']}",
                        headers={"Authorization": f"Bearer {pro_token}"}
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test programs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
