"""
Tests for Payment History feature (iteration 164)
- GET /api/pro/payment-history - Returns list of payments for the pro
- GET /api/pro/payment-history/export - Returns CSV file with proper headers
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ble-state-manager.preview.emergentagent.com').rstrip('/')

@pytest.fixture(scope="module")
def coach_token():
    """Get authentication token for coach account"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "+33655443322", "password": "test123"}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Coach login failed: {response.status_code} - {response.text}")


class TestPaymentHistoryAPI:
    """Tests for GET /api/pro/payment-history endpoint"""
    
    def test_payment_history_requires_auth(self):
        """Test that GET /api/pro/payment-history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-history")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_payment_history_returns_list(self, coach_token):
        """Test that GET /api/pro/payment-history returns a list of payments"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"Payment history returned {len(data)} payments")
    
    def test_payment_history_has_seeded_data(self, coach_token):
        """Test that payment history contains the 10 seeded test payments"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should have at least some payments (10 were seeded)
        assert len(data) >= 1, f"Expected at least 1 payment, got {len(data)}"
        print(f"Found {len(data)} payments in history")
    
    def test_payment_history_item_structure(self, coach_token):
        """Test that each payment item has required fields"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            payment = data[0]
            # Check required fields
            assert "date" in payment, "Payment should have 'date' field"
            assert "amount_ht" in payment, "Payment should have 'amount_ht' field"
            assert "status" in payment, "Payment should have 'status' field"
            print(f"Payment structure: date={payment.get('date')}, amount_ht={payment.get('amount_ht')}, status={payment.get('status')}")
        else:
            print("No payments to verify structure")


class TestPaymentHistoryExportCSV:
    """Tests for GET /api/pro/payment-history/export endpoint"""
    
    def test_export_requires_auth(self):
        """Test that GET /api/pro/payment-history/export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pro/payment-history/export")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
    
    def test_export_returns_csv(self, coach_token):
        """Test that export endpoint returns CSV content"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history/export",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        print(f"Content-Type: {content_type}")
    
    def test_export_has_content_disposition(self, coach_token):
        """Test that export has Content-Disposition header with filename"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history/export",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disposition, f"Expected 'attachment' in Content-Disposition, got {content_disposition}"
        assert 'filename=' in content_disposition, f"Expected 'filename=' in Content-Disposition, got {content_disposition}"
        print(f"Content-Disposition: {content_disposition}")
    
    def test_export_csv_headers(self, coach_token):
        """Test that CSV has correct headers (semicolon delimiter - European format)"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history/export",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        assert len(lines) >= 1, "CSV should have at least header row"
        
        header_line = lines[0]
        # CSV uses semicolon delimiter (European format)
        expected_headers = ['Date', 'Beneficiaire', 'Montant TTC', 'Montant HT', 'Commission', 'Statut', 'Reference Mollie']
        
        for header in expected_headers:
            assert header in header_line, f"Expected header '{header}' in CSV, got: {header_line}"
        
        print(f"CSV Headers: {header_line}")
        print(f"Total rows (including header): {len(lines)}")
    
    def test_export_csv_data_rows(self, coach_token):
        """Test that CSV contains data rows with proper format"""
        response = requests.get(
            f"{BASE_URL}/api/pro/payment-history/export",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        if len(lines) > 1:
            # Check first data row
            data_row = lines[1]
            fields = data_row.split(';')
            assert len(fields) == 7, f"Expected 7 fields per row, got {len(fields)}: {data_row}"
            print(f"Sample data row: {data_row}")
        else:
            print("No data rows in CSV (only header)")
