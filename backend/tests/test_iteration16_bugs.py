"""
Iteration 16 - Bug Testing: Role Switching and Admin Backoffice CRUD
Tests for P0 bugs:
1. Role switching - content not updating when switching between beneficiary and guardian roles
2. Admin backoffice CRUD for activation codes (codes tab)
3. Admin backoffice CRUD for intervention codes (interventions tab)

Required credentials:
- Admin: admin@chutex.fr / demo123
- Guardian: claire.martin@email.fr / demo123
- Beneficiary: robert.martin@email.fr / demo123
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://invite-flow-8.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@chutex.fr"
ADMIN_PASSWORD = "demo123"
CLAIRE_EMAIL = "claire.martin@email.fr"
CLAIRE_PASSWORD = "demo123"
ROBERT_EMAIL = "robert.martin@email.fr"
ROBERT_PASSWORD = "demo123"


class TestAdminLogin:
    """Test admin login and authentication"""

    def test_admin_login_success(self):
        """Admin login should return token and user with role=admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert data["user"]["role"] == "admin", f"Expected role=admin, got {data['user']['role']}"
        print(f"Admin login successful: {data['user']['email']}")


class TestActivationCodesCRUD:
    """Test full CRUD operations for activation codes (Bug 2)"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]

    def test_01_list_activation_codes(self, admin_token):
        """GET /api/admin/activation-codes - List all activation codes"""
        response = requests.get(
            f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"List codes failed: {response.text}"
        codes = response.json()
        assert isinstance(codes, list), "Response should be a list"
        print(f"Found {len(codes)} activation codes")
        # Check codes have 'id' field (bug was they were missing id)
        for code in codes[:3]:  # Check first 3
            print(f"  Code: {code.get('code')} - id: {code.get('id')} - active: {code.get('active')}")
            assert 'id' in code, f"Code missing 'id' field: {code}"

    def test_02_create_activation_code(self, admin_token):
        """POST /api/admin/activation-codes - Create new activation code"""
        test_structure = f"TEST_Structure_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/admin/activation-codes",
            json={
                "structure_name": test_structure,
                "max_uses": 100,
                "raison_sociale": "Test Raison Sociale",
                "siret": "12345678901234",
                "tva": "FR123456789",
                "adresse": "123 Test Street",
                "telephone": "+33600000000",
                "email_contact": "test@test.com"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Create code failed: {response.text}"
        data = response.json()
        assert "id" in data, f"Created code missing 'id': {data}"
        assert "code" in data, f"Created code missing 'code': {data}"
        assert data["structure_name"] == test_structure
        assert data["active"] == True
        print(f"Created code: id={data['id']}, code={data['code']}, structure={data['structure_name']}")
        # Store for later tests
        pytest.created_code_id = data["id"]
        pytest.created_code = data["code"]

    def test_03_toggle_activation_code(self, admin_token):
        """PUT /api/admin/activation-codes/{id}/toggle - Toggle code status"""
        code_id = pytest.created_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/activation-codes/{code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Toggle failed: {response.text}"
        data = response.json()
        assert data["status"] == "toggled", f"Expected status=toggled, got {data}"
        # Should be toggled to inactive
        assert data["active"] == False, f"Expected active=False after toggle, got {data['active']}"
        print(f"Toggled code {code_id}: active={data['active']}")

    def test_04_toggle_activation_code_back(self, admin_token):
        """PUT /api/admin/activation-codes/{id}/toggle - Toggle back to active"""
        code_id = pytest.created_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/activation-codes/{code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Toggle back failed: {response.text}"
        data = response.json()
        assert data["active"] == True, f"Expected active=True after second toggle, got {data['active']}"
        print(f"Toggled code {code_id} back: active={data['active']}")

    def test_05_update_activation_code(self, admin_token):
        """PUT /api/admin/activation-codes/{id} - Update code details"""
        code_id = pytest.created_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/activation-codes/{code_id}",
            json={
                "structure_name": "Updated Structure Name",
                "max_uses": 200
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert data["status"] == "updated"
        print(f"Updated code {code_id}")

    def test_06_delete_activation_code(self, admin_token):
        """DELETE /api/admin/activation-codes/{id} - Delete code"""
        code_id = pytest.created_code_id
        response = requests.delete(
            f"{BASE_URL}/api/admin/activation-codes/{code_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        data = response.json()
        assert data["status"] == "deleted"
        print(f"Deleted code {code_id}")

    def test_07_verify_deletion(self, admin_token):
        """Verify deleted code is no longer in the list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        codes = response.json()
        code_ids = [c.get('id') for c in codes]
        assert pytest.created_code_id not in code_ids, "Deleted code still in list"
        print(f"Verified code {pytest.created_code_id} no longer in list")


class TestInterventionCodesCRUD:
    """Test full CRUD operations for intervention codes (Bug 2b)"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]

    def test_01_list_intervention_codes(self, admin_token):
        """GET /api/admin/intervention-codes - List all intervention codes"""
        response = requests.get(
            f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"List intervention codes failed: {response.text}"
        codes = response.json()
        assert isinstance(codes, list), "Response should be a list"
        print(f"Found {len(codes)} intervention codes")
        for code in codes[:3]:
            print(f"  Code: {code.get('code')} - id: {code.get('id')} - active: {code.get('active')}")
            assert 'id' in code, f"Intervention code missing 'id' field: {code}"

    def test_02_create_intervention_code(self, admin_token):
        """POST /api/admin/intervention-codes - Create new intervention code"""
        test_structure = f"TEST_Intervenant_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/admin/intervention-codes",
            json={
                "structure_name": test_structure,
                "max_uses": 100,
                "radius_km": 50,
                "raison_sociale": "Test Interventions SARL",
                "siret": "98765432109876",
                "tva": "FR987654321",
                "adresse": "456 Intervention Ave",
                "telephone": "+33611111111",
                "email_contact": "intervention@test.com"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Create intervention code failed: {response.text}"
        data = response.json()
        assert "id" in data, f"Created intervention code missing 'id': {data}"
        assert "code" in data, f"Created intervention code missing 'code': {data}"
        assert data["structure_name"] == test_structure
        assert data["active"] == True
        print(f"Created intervention code: id={data['id']}, code={data['code']}, structure={data['structure_name']}")
        pytest.created_iv_code_id = data["id"]
        pytest.created_iv_code = data["code"]

    def test_03_toggle_intervention_code(self, admin_token):
        """PUT /api/admin/intervention-codes/{id}/toggle - Toggle intervention code status"""
        code_id = pytest.created_iv_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/intervention-codes/{code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Toggle intervention code failed: {response.text}"
        data = response.json()
        assert data["status"] == "toggled"
        assert data["active"] == False, f"Expected active=False, got {data['active']}"
        print(f"Toggled intervention code {code_id}: active={data['active']}")

    def test_04_toggle_intervention_code_back(self, admin_token):
        """PUT /api/admin/intervention-codes/{id}/toggle - Toggle back"""
        code_id = pytest.created_iv_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/intervention-codes/{code_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active"] == True
        print(f"Toggled intervention code {code_id} back: active={data['active']}")

    def test_05_update_intervention_code(self, admin_token):
        """PUT /api/admin/intervention-codes/{id} - Update intervention code"""
        code_id = pytest.created_iv_code_id
        response = requests.put(
            f"{BASE_URL}/api/admin/intervention-codes/{code_id}",
            json={
                "structure_name": "Updated Intervention Structure",
                "max_uses": 300
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Update intervention code failed: {response.text}"
        data = response.json()
        assert data["status"] == "updated"
        print(f"Updated intervention code {code_id}")

    def test_06_delete_intervention_code(self, admin_token):
        """DELETE /api/admin/intervention-codes/{id} - Delete intervention code"""
        code_id = pytest.created_iv_code_id
        response = requests.delete(
            f"{BASE_URL}/api/admin/intervention-codes/{code_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Delete intervention code failed: {response.text}"
        data = response.json()
        assert data["status"] == "deleted"
        print(f"Deleted intervention code {code_id}")

    def test_07_verify_deletion(self, admin_token):
        """Verify deleted intervention code is no longer in list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        codes = response.json()
        code_ids = [c.get('id') for c in codes]
        assert pytest.created_iv_code_id not in code_ids, "Deleted intervention code still in list"
        print(f"Verified intervention code {pytest.created_iv_code_id} no longer in list")


class TestRoleSwitching:
    """Test role switching functionality (Bug 1)"""

    @pytest.fixture(scope="class")
    def claire_token(self):
        """Login as Claire (guardian)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLAIRE_EMAIL,
            "password": CLAIRE_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        print(f"Claire login: role={data['user']['role']}, active_role={data['user'].get('active_role')}")
        return data["token"]

    def test_01_claire_initial_state(self, claire_token):
        """Verify Claire's initial state"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert user["role"] == "guardian", "Claire should be a guardian"
        assert user.get("has_beneficiary_space") == True, "Claire should have beneficiary space"
        print(f"Claire: role={user['role']}, active_role={user.get('active_role')}, has_beneficiary_space={user.get('has_beneficiary_space')}")

    def test_02_claire_switch_to_beneficiary(self, claire_token):
        """Claire switches to beneficiary role"""
        response = requests.post(
            f"{BASE_URL}/api/auth/switch-role",
            json={"role": "beneficiary"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200, f"Switch failed: {response.text}"
        data = response.json()
        assert data["status"] == "switched"
        assert data["active_role"] == "beneficiary"
        assert data["user"]["active_role"] == "beneficiary"
        print(f"Claire switched to beneficiary: {data['active_role']}")

    def test_03_claire_verify_beneficiary_state(self, claire_token):
        """Verify Claire is now in beneficiary mode"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert user.get("active_role") == "beneficiary", f"Expected active_role=beneficiary, got {user.get('active_role')}"
        # Original role should still be guardian
        assert user["role"] == "guardian"
        print(f"Claire in beneficiary mode: role={user['role']}, active_role={user.get('active_role')}")

    def test_04_claire_switch_back_to_guardian(self, claire_token):
        """Claire switches back to guardian role"""
        response = requests.post(
            f"{BASE_URL}/api/auth/switch-role",
            json={"role": "guardian"},
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "switched"
        assert data["active_role"] == "guardian"
        print(f"Claire switched back to guardian: {data['active_role']}")

    def test_05_claire_verify_guardian_state(self, claire_token):
        """Verify Claire is back in guardian mode"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert user.get("active_role") == "guardian", f"Expected active_role=guardian, got {user.get('active_role')}"
        print(f"Claire back to guardian: role={user['role']}, active_role={user.get('active_role')}")


class TestNonAdminCannotAccessAdminEndpoints:
    """Verify non-admin users cannot access admin endpoints"""

    @pytest.fixture
    def claire_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLAIRE_EMAIL,
            "password": CLAIRE_PASSWORD
        })
        return response.json()["token"]

    def test_guardian_cannot_access_activation_codes(self, claire_token):
        """Guardian should get 403 on activation codes endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/activation-codes",
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("Guardian correctly denied access to activation codes")

    def test_guardian_cannot_access_intervention_codes(self, claire_token):
        """Guardian should get 403 on intervention codes endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/intervention-codes",
            headers={"Authorization": f"Bearer {claire_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("Guardian correctly denied access to intervention codes")


class TestBackofficeEndpoints:
    """Test backoffice dashboard endpoints"""

    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]

    def test_backoffice_stats(self, admin_token):
        """GET /api/backoffice/stats"""
        response = requests.get(f"{BASE_URL}/api/backoffice/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        assert "total_users" in data
        assert "beneficiaries" in data
        assert "guardians" in data
        print(f"Backoffice stats: users={data['total_users']}, beneficiaries={data['beneficiaries']}, guardians={data['guardians']}")

    def test_backoffice_kpi(self, admin_token):
        """GET /api/backoffice/kpi"""
        response = requests.get(f"{BASE_URL}/api/backoffice/kpi")
        assert response.status_code == 200, f"KPI failed: {response.text}"
        data = response.json()
        assert "total_users" in data
        assert "users_by_role" in data
        print(f"Backoffice KPI: {data.keys()}")
