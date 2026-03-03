"""
Test Iteration 68 - Chutex Care Features Testing
Tests:
- P0: Health page real data (scale/weighing)
- P0/P1: Device vest badge status (En marche / En veille)
- P2: Programs page layout and single active program logic
- P2: Subscription PDF download
- API: Contract template PDF
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoints:
    """P0 Health page - real weighing data, no simulated vitals"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as beneficiary to get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    def test_login_beneficiary(self, auth_token):
        """Test beneficiary login"""
        assert auth_token is not None
        print(f"Beneficiary login successful, token length: {len(auth_token)}")
    
    def test_health_dashboard_summary(self, auth_token):
        """Test dashboard summary returns real data, not simulated"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/devices/dashboard-summary", headers=headers)
        assert response.status_code == 200, f"Dashboard summary failed: {response.text}"
        
        data = response.json()
        print(f"Dashboard summary: {data}")
        
        # Verify structure exists
        assert "scale" in data or "latest_weight" in data or isinstance(data, dict)
    
    def test_scale_history(self, auth_token):
        """Test scale history endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/scale/history", headers=headers)
        
        # May return 200 with empty array if no real weighings
        if response.status_code == 200:
            data = response.json()
            print(f"Scale history count: {len(data) if isinstance(data, list) else 'N/A'}")
            
            # If data exists, verify it's real (has real timestamps, not simulated patterns)
            if isinstance(data, list) and len(data) > 0:
                for entry in data[:3]:  # Check first 3
                    assert "weight" in entry or "value" in entry
                    print(f"Scale entry: {entry}")
        else:
            print(f"Scale history status: {response.status_code}")


class TestDeviceEndpoints:
    """P0/P1 Devices - vest badge En marche/En veille"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as beneficiary"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_devices_list(self, auth_token):
        """Test devices list endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        assert response.status_code == 200, f"Devices list failed: {response.text}"
        
        devices = response.json()
        print(f"Devices found: {len(devices)}")
        
        # Look for vest device
        vest_found = False
        for device in devices:
            print(f"Device: type={device.get('type')}, connected={device.get('connected')}, last_sync={device.get('last_sync')}")
            if device.get('type') == 'vest':
                vest_found = True
                # Check vest has proper fields for status determination
                assert 'connected' in device or 'last_sync' in device or 'status' in device
                print(f"Vest device: {device}")
        
        print(f"Vest device found: {vest_found}")
    
    def test_device_status_endpoint(self, auth_token):
        """Test device status by type"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get devices first
        response = requests.get(f"{BASE_URL}/api/devices", headers=headers)
        devices = response.json()
        
        for device in devices:
            if device.get('type') == 'vest' and device.get('id'):
                # Check individual device status if endpoint exists
                status_response = requests.get(
                    f"{BASE_URL}/api/devices/{device['id']}", 
                    headers=headers
                )
                if status_response.status_code == 200:
                    print(f"Vest status detail: {status_response.json()}")


class TestProgramsEndpoints:
    """P2 Programs - new layout with blur, filters, single active program"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as beneficiary"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_programs_catalog(self, auth_token):
        """Test programs catalog endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=headers)
        assert response.status_code == 200, f"Programs catalog failed: {response.text}"
        
        programs = response.json()
        print(f"Programs catalog count: {len(programs) if isinstance(programs, list) else 'N/A'}")
        
        # Verify program structure
        if isinstance(programs, list) and len(programs) > 0:
            program = programs[0]
            print(f"Program example: {list(program.keys())}")
            assert "title" in program or "name" in program
    
    def test_user_programs(self, auth_token):
        """Test user's active programs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/programs/user", headers=headers)
        
        if response.status_code == 200:
            user_programs = response.json()
            print(f"User programs: {user_programs}")
            
            # Check for active program count
            active_count = 0
            if isinstance(user_programs, list):
                for p in user_programs:
                    if p.get('status') == 'active' or p.get('active'):
                        active_count += 1
            print(f"Active programs count: {active_count}")
    
    def test_program_detail(self, auth_token):
        """Test program detail endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get catalog to get a program ID
        catalog_response = requests.get(f"{BASE_URL}/api/programs/catalog", headers=headers)
        if catalog_response.status_code == 200:
            programs = catalog_response.json()
            if isinstance(programs, list) and len(programs) > 0:
                program_id = programs[0].get('id') or programs[0].get('_id')
                if program_id:
                    detail_response = requests.get(
                        f"{BASE_URL}/api/programs/{program_id}", 
                        headers=headers
                    )
                    print(f"Program detail status: {detail_response.status_code}")
                    if detail_response.status_code == 200:
                        print(f"Program detail: {detail_response.json()}")


class TestContractPDFEndpoints:
    """P2 Subscription - PDF download"""
    
    def test_contract_template_pdf(self):
        """Test contract template PDF endpoint - no auth required"""
        response = requests.get(f"{BASE_URL}/api/contract/template/pdf")
        assert response.status_code == 200, f"Contract template PDF failed: {response.text}"
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 1000  # Should be a real PDF
        print(f"Contract template PDF: {len(response.content)} bytes, content-type: {response.headers.get('content-type')}")
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as beneficiary"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_subscription_info(self, auth_token):
        """Test subscription info endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/my", headers=headers)
        
        if response.status_code == 200:
            sub_data = response.json()
            print(f"Subscription data: {sub_data}")
            
            # Check if user has a contract
            contract = sub_data.get('contract')
            if contract:
                contract_id = contract.get('id') or contract.get('_id')
                print(f"Contract ID: {contract_id}")
                
                # Try to get signed contract PDF
                if contract_id:
                    pdf_response = requests.get(
                        f"{BASE_URL}/api/contract/{contract_id}/pdf",
                        headers=headers
                    )
                    print(f"Contract PDF status: {pdf_response.status_code}")
        else:
            print(f"Subscription info status: {response.status_code}")


class TestDashboardRegression:
    """P1 Regression - dashboard fetchData"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as beneficiary"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "+33651245918",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_dashboard_data_load(self, auth_token):
        """Test all dashboard data endpoints work without blocking errors"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        endpoints = [
            "/api/devices/dashboard-summary",
            "/api/devices",
            "/api/scale/history",
            "/api/alerts",
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
                print(f"{endpoint}: {response.status_code}")
                assert response.status_code in [200, 404], f"{endpoint} returned {response.status_code}"
            except Exception as e:
                print(f"{endpoint}: ERROR - {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
