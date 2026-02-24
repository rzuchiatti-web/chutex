"""
PDF Health Report API Tests
Tests for the /api/health/report/pdf endpoint with period parameter (7j, 30j, 90j)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token using beneficiary credentials"""
    # Login with beneficiary phone: +33651245918, password: demo123
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": "+33651245918",
        "password": "demo123"
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Auth failed: {response.status_code} - {response.text}")


class TestPDFReportAPI:
    """Tests for PDF health report generation endpoint"""

    def test_pdf_30j_default_period(self, auth_token):
        """Test PDF generation with default 30j period"""
        response = requests.get(
            f"{BASE_URL}/api/health/report/pdf?period=30j",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        # Content-Type assertion - must be PDF
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
        
        # Content-Disposition assertion - must have filename
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, f"Expected attachment disposition, got {content_disposition}"
        assert "filename=" in content_disposition, f"Expected filename in disposition, got {content_disposition}"
        assert ".pdf" in content_disposition, f"Expected .pdf in filename, got {content_disposition}"
        
        # PDF content validation - must start with %PDF-
        content = response.content
        assert content.startswith(b"%PDF-"), f"PDF must start with %PDF-, got {content[:20]}"
        
        # PDF size should be reasonable (at least 1KB for a report)
        assert len(content) > 1000, f"PDF too small: {len(content)} bytes"
        
        print(f"✓ 30j PDF: {len(content)} bytes, filename in {content_disposition}")

    def test_pdf_7j_period(self, auth_token):
        """Test PDF generation with 7-day period"""
        response = requests.get(
            f"{BASE_URL}/api/health/report/pdf?period=7j",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert response.content.startswith(b"%PDF-")
        
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "filename=" in content_disposition
        
        print(f"✓ 7j PDF: {len(response.content)} bytes")

    def test_pdf_90j_period(self, auth_token):
        """Test PDF generation with 90-day period"""
        response = requests.get(
            f"{BASE_URL}/api/health/report/pdf?period=90j",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert response.content.startswith(b"%PDF-")
        
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "filename=" in content_disposition
        
        print(f"✓ 90j PDF: {len(response.content)} bytes")

    def test_pdf_requires_authentication(self):
        """Test that PDF endpoint requires auth token"""
        response = requests.get(f"{BASE_URL}/api/health/report/pdf?period=30j")
        
        # Should return 401 or 403 without token
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ Auth required: {response.status_code}")

    def test_pdf_invalid_period_fallback(self, auth_token):
        """Test PDF generation with invalid period (should fallback to 30j)"""
        response = requests.get(
            f"{BASE_URL}/api/health/report/pdf?period=invalid",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should still return PDF (default to 30j)
        assert response.status_code == 200, f"Expected 200 with fallback, got {response.status_code}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert response.content.startswith(b"%PDF-")
        
        print(f"✓ Invalid period fallback: {len(response.content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
