#!/usr/bin/env python3
"""
VitalLink Backend API Testing Suite
Tests all critical backend APIs for the VitalLink health monitoring platform.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL configuration
BASE_URL = "https://pensive-kowalevski.preview.emergentagent.com/api"

# Test credentials (all passwords work)
TEST_USERS = {
    "admin": {"email": "admin@vitallink.fr", "password": "admin123"},
    "teleassistance": {"email": "teleassist@vitallink.fr", "password": "teleassist123"},
    "guardian": {"email": "gardien@vitallink.fr", "password": "gardien123"},
    "beneficiary": {"email": "patient@vitallink.fr", "password": "patient123"}
}

class VitalLinkTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.test_data = {}
        self.results = []

    def log_result(self, test_name, status, message, details=None):
        """Log test result."""
        self.results.append({
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")

    def test_auth_register_login(self):
        """Test authentication: register and login for all 4 roles."""
        print("\n=== Testing Authentication (Register & Login) ===")
        
        for role, creds in TEST_USERS.items():
            try:
                # Test login first (user might already exist)
                print(f"\n--- Testing {role.upper()} login ---")
                response = self.session.post(f"{BASE_URL}/auth/login", json=creds)
                
                if response.status_code == 200:
                    data = response.json()
                    self.tokens[role] = data["token"]
                    self.users[role] = data["user"]
                    self.log_result(f"Auth Login - {role}", "PASS", f"Login successful for {creds['email']}")
                else:
                    self.log_result(f"Auth Login - {role}", "FAIL", f"Login failed: {response.text}")
                    continue
                
                # Test GET /api/auth/me
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    expected_role = role
                    if user_data.get("role") == expected_role:
                        self.log_result(f"Auth Me - {role}", "PASS", f"User data returned correctly, role: {user_data.get('role')}")
                    else:
                        self.log_result(f"Auth Me - {role}", "FAIL", f"Wrong role returned: {user_data.get('role')} vs {expected_role}")
                else:
                    self.log_result(f"Auth Me - {role}", "FAIL", f"Auth/me failed: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Auth - {role}", "FAIL", f"Exception: {str(e)}")

    def test_alerts_crud(self):
        """Test alerts: create, list, resolve."""
        print("\n=== Testing Alerts CRUD ===")
        
        if "beneficiary" not in self.tokens:
            self.log_result("Alerts", "FAIL", "No beneficiary token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['beneficiary']}"}
        
        try:
            # Test create alert
            alert_data = {
                "alert_type": "sos",
                "severity": "high",
                "message": "Test SOS alert for backend testing",
                "device_type": "bracelet"
            }
            
            response = self.session.post(f"{BASE_URL}/alerts", json=alert_data, headers=headers)
            
            if response.status_code == 200:
                alert = response.json()
                alert_id = alert.get("id")
                self.test_data["alert_id"] = alert_id
                self.log_result("Alerts Create", "PASS", f"Alert created successfully: {alert_id}")
            else:
                self.log_result("Alerts Create", "FAIL", f"Failed to create alert: {response.text}")
                return
                
            # Test list alerts
            response = self.session.get(f"{BASE_URL}/alerts", headers=headers)
            
            if response.status_code == 200:
                alerts = response.json()
                if isinstance(alerts, list) and len(alerts) > 0:
                    self.log_result("Alerts List", "PASS", f"Retrieved {len(alerts)} alerts")
                else:
                    self.log_result("Alerts List", "WARN", "No alerts found in list")
            else:
                self.log_result("Alerts List", "FAIL", f"Failed to list alerts: {response.text}")
                
            # Test resolve alert
            if "alert_id" in self.test_data:
                response = self.session.put(f"{BASE_URL}/alerts/{self.test_data['alert_id']}/resolve", headers=headers)
                
                if response.status_code == 200:
                    self.log_result("Alerts Resolve", "PASS", "Alert resolved successfully")
                else:
                    self.log_result("Alerts Resolve", "FAIL", f"Failed to resolve alert: {response.text}")
                    
        except Exception as e:
            self.log_result("Alerts", "FAIL", f"Exception: {str(e)}")

    def test_admin_activation_codes(self):
        """Test admin activation codes: create, list, deactivate."""
        print("\n=== Testing Admin Activation Codes ===")
        
        if "admin" not in self.tokens:
            self.log_result("Admin Codes", "FAIL", "No admin token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
        
        try:
            # Test create activation code
            code_data = {
                "structure_name": "Test Healthcare Structure",
                "max_uses": 10
            }
            
            response = self.session.post(f"{BASE_URL}/admin/activation-codes", json=code_data, headers=headers)
            
            if response.status_code == 200:
                code = response.json()
                code_id = code.get("id")
                code_value = code.get("code")
                self.test_data["activation_code_id"] = code_id
                self.test_data["activation_code"] = code_value
                self.log_result("Admin Codes Create", "PASS", f"Activation code created: {code_value}")
            else:
                self.log_result("Admin Codes Create", "FAIL", f"Failed to create code: {response.text}")
                return
                
            # Test list activation codes
            response = self.session.get(f"{BASE_URL}/admin/activation-codes", headers=headers)
            
            if response.status_code == 200:
                codes = response.json()
                if isinstance(codes, list):
                    self.log_result("Admin Codes List", "PASS", f"Retrieved {len(codes)} activation codes")
                else:
                    self.log_result("Admin Codes List", "FAIL", "Invalid response format")
            else:
                self.log_result("Admin Codes List", "FAIL", f"Failed to list codes: {response.text}")
                
            # Test deactivate code
            if "activation_code_id" in self.test_data:
                response = self.session.delete(f"{BASE_URL}/admin/activation-codes/{self.test_data['activation_code_id']}", headers=headers)
                
                if response.status_code == 200:
                    self.log_result("Admin Codes Deactivate", "PASS", "Activation code deactivated successfully")
                else:
                    self.log_result("Admin Codes Deactivate", "FAIL", f"Failed to deactivate: {response.text}")
                    
        except Exception as e:
            self.log_result("Admin Codes", "FAIL", f"Exception: {str(e)}")

    def test_guardian_prescriber_flow(self):
        """Test guardian prescriber flow: activate prescriber, create prescriptions."""
        print("\n=== Testing Guardian Prescriber Flow ===")
        
        if "guardian" not in self.tokens:
            self.log_result("Guardian Prescriber", "FAIL", "No guardian token available")
            return
            
        # Create a dedicated activation code as admin for guardian prescriber test
        guardian_activation_code = None
        if "admin" in self.tokens:
            admin_headers = {"Authorization": f"Bearer {self.tokens['admin']}"}
            code_data = {"structure_name": "Guardian Prescriber Test Structure", "max_uses": 5}
            response = self.session.post(f"{BASE_URL}/admin/activation-codes", json=code_data, headers=admin_headers)
            if response.status_code == 200:
                guardian_activation_code = response.json().get("code")
            
        headers = {"Authorization": f"Bearer {self.tokens['guardian']}"}
        
        try:
            # Test activate prescriber
            if guardian_activation_code:
                activate_data = {"code": guardian_activation_code}
                response = self.session.post(f"{BASE_URL}/guardian/activate-prescriber", json=activate_data, headers=headers)
                
                if response.status_code == 200:
                    self.log_result("Guardian Activate Prescriber", "PASS", "Prescriber activated successfully")
                else:
                    self.log_result("Guardian Activate Prescriber", "FAIL", f"Failed to activate: {response.text}")
                    return
            else:
                self.log_result("Guardian Activate Prescriber", "WARN", "No activation code available for testing")
                return
                
            # Test create prescription
            prescription_data = {
                "beneficiary_name": "Test Patient",
                "beneficiary_email": "testpatient@example.com",
                "beneficiary_phone": "+33123456789",
                "subscription_type": "premium",
                "notes": "Test prescription for backend testing"
            }
            
            response = self.session.post(f"{BASE_URL}/guardian/prescriptions", json=prescription_data, headers=headers)
            
            if response.status_code == 200:
                prescription = response.json()
                self.test_data["prescription_id"] = prescription.get("id")
                self.log_result("Guardian Create Prescription", "PASS", f"Prescription created: {prescription.get('id')}")
            else:
                self.log_result("Guardian Create Prescription", "FAIL", f"Failed to create prescription: {response.text}")
                
            # Test list prescriptions
            response = self.session.get(f"{BASE_URL}/guardian/prescriptions", headers=headers)
            
            if response.status_code == 200:
                prescriptions = response.json()
                if isinstance(prescriptions, list):
                    self.log_result("Guardian List Prescriptions", "PASS", f"Retrieved {len(prescriptions)} prescriptions")
                else:
                    self.log_result("Guardian List Prescriptions", "FAIL", "Invalid response format")
            else:
                self.log_result("Guardian List Prescriptions", "FAIL", f"Failed to list prescriptions: {response.text}")
                
        except Exception as e:
            self.log_result("Guardian Prescriber", "FAIL", f"Exception: {str(e)}")

    def test_escalation_flow(self):
        """Test escalation flow: start, step through beneficiary → guardian → dispatch."""
        print("\n=== Testing Escalation Flow ===")
        
        if "teleassistance" not in self.tokens:
            self.log_result("Escalation Flow", "FAIL", "No teleassistance token available")
            return
            
        # Need an alert to escalate - create one first if we don't have one
        if "alert_id" not in self.test_data and "beneficiary" in self.tokens:
            ben_headers = {"Authorization": f"Bearer {self.tokens['beneficiary']}"}
            alert_data = {"alert_type": "emergency", "severity": "critical", "message": "Test emergency for escalation", "device_type": "bracelet"}
            response = self.session.post(f"{BASE_URL}/alerts", json=alert_data, headers=ben_headers)
            if response.status_code == 200:
                self.test_data["alert_id"] = response.json().get("id")
        
        if "alert_id" not in self.test_data:
            self.log_result("Escalation Flow", "FAIL", "No alert available for escalation testing")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['teleassistance']}"}
        
        try:
            # Test start escalation
            escalation_data = {"alert_id": self.test_data["alert_id"]}
            response = self.session.post(f"{BASE_URL}/teleassistance/escalation/start", json=escalation_data, headers=headers)
            
            if response.status_code == 200:
                escalation = response.json()
                escalation_id = escalation.get("id")
                self.test_data["escalation_id"] = escalation_id
                self.log_result("Escalation Start", "PASS", f"Escalation started: {escalation_id}")
            else:
                self.log_result("Escalation Start", "FAIL", f"Failed to start escalation: {response.text}")
                return
                
            # Test escalation steps
            escalation_steps = [
                {"response": "no_answer", "notes": "Beneficiary did not answer", "expected": "calling_guardian"},
                {"response": "no_answer", "notes": "Guardian did not answer", "expected": "dispatch_needed"},
                {"response": "dispatch", "notes": "Manual dispatch requested", "expected": "dispatched"}
            ]
            
            for i, step in enumerate(escalation_steps):
                step_data = {
                    "escalation_id": self.test_data["escalation_id"],
                    "response": step["response"],
                    "answers": [],
                    "notes": step["notes"]
                }
                
                response = self.session.post(f"{BASE_URL}/teleassistance/escalation/step", json=step_data, headers=headers)
                
                if response.status_code == 200:
                    result = response.json()
                    current_step = result.get("current_step", "")
                    self.log_result(f"Escalation Step {i+1}", "PASS", f"Step processed: {step['response']} → {current_step}")
                    
                    # Check if intervention was created on dispatch
                    if current_step == "dispatched" and result.get("intervention_id"):
                        self.log_result("Escalation Auto-Dispatch", "PASS", f"Intervention auto-created: {result.get('intervention_id')}")
                else:
                    self.log_result(f"Escalation Step {i+1}", "FAIL", f"Step failed: {response.text}")
                    
            # Test get escalation
            response = self.session.get(f"{BASE_URL}/teleassistance/escalation/{self.test_data['escalation_id']}", headers=headers)
            
            if response.status_code == 200:
                escalation = response.json()
                self.log_result("Escalation Get", "PASS", f"Retrieved escalation status: {escalation.get('status')}")
            else:
                self.log_result("Escalation Get", "FAIL", f"Failed to get escalation: {response.text}")
                
            # Test list escalations
            response = self.session.get(f"{BASE_URL}/teleassistance/escalations", headers=headers)
            
            if response.status_code == 200:
                escalations = response.json()
                if isinstance(escalations, list):
                    self.log_result("Escalation List", "PASS", f"Retrieved {len(escalations)} escalations")
                else:
                    self.log_result("Escalation List", "FAIL", "Invalid response format")
            else:
                self.log_result("Escalation List", "FAIL", f"Failed to list escalations: {response.text}")
                
        except Exception as e:
            self.log_result("Escalation Flow", "FAIL", f"Exception: {str(e)}")

    def test_complete_escalation_flow(self):
        """Test complete escalation flow: beneficiary answers → doubt lifting → resolved."""
        print("\n=== Testing Complete Escalation Flow (Beneficiary Answers) ===")
        
        if "teleassistance" not in self.tokens or "beneficiary" not in self.tokens:
            self.log_result("Complete Escalation", "FAIL", "Missing required tokens")
            return
            
        # Create new alert for this test
        ben_headers = {"Authorization": f"Bearer {self.tokens['beneficiary']}"}
        alert_data = {"alert_type": "fall", "severity": "medium", "message": "Test fall detection", "device_type": "vest"}
        response = self.session.post(f"{BASE_URL}/alerts", json=alert_data, headers=ben_headers)
        
        if response.status_code != 200:
            self.log_result("Complete Escalation", "FAIL", "Could not create test alert")
            return
            
        alert_id = response.json().get("id")
        headers = {"Authorization": f"Bearer {self.tokens['teleassistance']}"}
        
        try:
            # Start escalation
            response = self.session.post(f"{BASE_URL}/teleassistance/escalation/start", json={"alert_id": alert_id}, headers=headers)
            escalation_id = response.json().get("id")
            
            # Beneficiary answers
            step_data = {
                "escalation_id": escalation_id,
                "response": "answered",
                "answers": [],
                "notes": "Beneficiary answered the call"
            }
            response = self.session.post(f"{BASE_URL}/teleassistance/escalation/step", json=step_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("current_step") == "doubt_lifting":
                    self.log_result("Escalation Beneficiary Answered", "PASS", "Moved to doubt lifting phase")
                else:
                    self.log_result("Escalation Beneficiary Answered", "FAIL", f"Wrong step: {result.get('current_step')}")
            else:
                self.log_result("Escalation Beneficiary Answered", "FAIL", f"Step failed: {response.text}")
                return
                
            # Doubt lifting resolved
            step_data = {
                "escalation_id": escalation_id,
                "response": "resolved",
                "answers": [
                    {"question": "Comment vous sentez-vous ?", "answer": "Bien, fausse alerte"},
                    {"question": "Avez-vous besoin d'aide ?", "answer": "Non"}
                ],
                "notes": "False alarm confirmed by beneficiary"
            }
            response = self.session.post(f"{BASE_URL}/teleassistance/escalation/step", json=step_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "resolved":
                    self.log_result("Escalation Resolved", "PASS", "Escalation resolved through doubt lifting")
                else:
                    self.log_result("Escalation Resolved", "FAIL", f"Wrong status: {result.get('status')}")
            else:
                self.log_result("Escalation Resolved", "FAIL", f"Resolution failed: {response.text}")
                
        except Exception as e:
            self.log_result("Complete Escalation", "FAIL", f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests."""
        print("🔍 Starting VitalLink Backend API Tests...")
        print(f"🎯 Testing against: {BASE_URL}")
        
        # Run all test suites
        self.test_auth_register_login()
        self.test_alerts_crud()
        self.test_admin_activation_codes()
        self.test_guardian_prescriber_flow()
        self.test_escalation_flow()
        self.test_complete_escalation_flow()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = len([r for r in self.results if r["status"] == "PASS"])
        failed = len([r for r in self.results if r["status"] == "FAIL"])
        warned = len([r for r in self.results if r["status"] == "WARN"])
        total = len(self.results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"⚠️  WARNINGS: {warned}")
        print(f"📈 TOTAL: {total}")
        
        if failed > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.results:
                if result["status"] == "FAIL":
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        return failed == 0

if __name__ == "__main__":
    tester = VitalLinkTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)