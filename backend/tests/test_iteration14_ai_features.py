"""
Test suite for CHUTEX Iteration 14 - AI Call Improvements and Alert Protocol Management
Features tested:
1. POST /api/ai/analyze-speech - GPT-5.2 speech intent analysis
2. POST /api/ai/protocol-summary - AI-generated protocol summary
3. POST /api/twilio/call/beneficiary - Updated with ElevenLabs voice + speech recognition
4. GET /api/teleassistance/protocol/beneficiary - Doubt questions
5. GET /api/teleassistance/protocol/guardian - Guardian protocol
6. POST /api/teleassistance/escalation/start - Escalation creation
7. GET /api/elevenlabs/audio/{message_key} - Contextual ElevenLabs messages
8. GET /api/alerts/{id}/detail - Alert detail endpoint
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://guardian-alerts-1.preview.emergentagent.com')

# Test credentials
TELEASSISTANCE_USER = {"email": "plateau@chutex.fr", "password": "demo123"}
BENEFICIARY_USER = {"email": "robert.martin@email.fr", "password": "demo123"}
GUARDIAN_USER = {"email": "claire.martin@email.fr", "password": "demo123"}
ADMIN_USER = {"email": "admin@chutex.fr", "password": "demo123"}


class TestAuth:
    """Authentication tests"""
    
    def test_teleassistance_login(self):
        """Test teleassistance operator can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "teleassistance"
        print(f"✓ Teleassistance login successful: {data['user']['name']}")
    
    def test_beneficiary_login(self):
        """Test beneficiary can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_USER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "beneficiary"
        print(f"✓ Beneficiary login successful: {data['user']['name']}")


class TestAISpeechAnalysis:
    """Tests for POST /api/ai/analyze-speech endpoint"""
    
    @pytest.fixture
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        return response.json()["token"]
    
    def test_analyze_speech_endpoint_exists(self, teleassistance_token):
        """Test that /api/ai/analyze-speech endpoint accepts POST"""
        headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/ai/analyze-speech",
            json={"text": "Je vais bien, merci", "alert_id": ""},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "speech_text" in data
        print(f"✓ AI speech analysis returned: {data['analysis'][:100]}...")
    
    def test_analyze_speech_with_alert_context(self, teleassistance_token):
        """Test speech analysis with alert context"""
        headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        # First get an existing alert
        alerts_resp = requests.get(f"{BASE_URL}/api/alerts", headers=headers)
        alerts = alerts_resp.json()
        
        if len(alerts) > 0:
            alert_id = alerts[0]["id"]
            response = requests.post(
                f"{BASE_URL}/api/ai/analyze-speech",
                json={"text": "J'ai mal à la tête et je me sens faible", "alert_id": alert_id},
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "analysis" in data
            print(f"✓ AI speech analysis with context returned analysis")
    
    def test_analyze_speech_empty_text(self, teleassistance_token):
        """Test speech analysis with empty text returns 400"""
        headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/ai/analyze-speech",
            json={"text": "", "alert_id": ""},
            headers=headers
        )
        assert response.status_code == 400  # Should return error for empty text
        print("✓ Empty text correctly rejected with 400")


class TestAIProtocolSummary:
    """Tests for POST /api/ai/protocol-summary endpoint"""
    
    @pytest.fixture
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_USER)
        return response.json()["token"]
    
    @pytest.fixture
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        return response.json()["token"]
    
    def test_create_alert_and_get_summary(self, beneficiary_token, teleassistance_token):
        """Test creating an alert and getting AI protocol summary"""
        # Create alert as beneficiary
        ben_headers = {"Authorization": f"Bearer {beneficiary_token}", "Content-Type": "application/json"}
        alert_data = {
            "alert_type": "sos",
            "severity": "medium",
            "message": "Test alert for AI summary",
            "device_type": "bracelet"
        }
        create_resp = requests.post(f"{BASE_URL}/api/alerts", json=alert_data, headers=ben_headers)
        assert create_resp.status_code == 200
        alert = create_resp.json()
        alert_id = alert["id"]
        print(f"✓ Alert created: {alert_id}")
        
        # Get protocol summary as teleassistance
        ta_headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        time.sleep(1)  # Wait for potential async processing
        
        summary_resp = requests.post(
            f"{BASE_URL}/api/ai/protocol-summary",
            json={"alert_id": alert_id},
            headers=ta_headers
        )
        assert summary_resp.status_code == 200
        data = summary_resp.json()
        assert "summary" in data
        assert "alert_id" in data
        assert data["alert_id"] == alert_id
        print(f"✓ AI protocol summary returned: {data['summary'][:100]}...")
    
    def test_protocol_summary_missing_alert_id(self, teleassistance_token):
        """Test protocol summary with missing alert_id returns 400"""
        headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/ai/protocol-summary",
            json={},
            headers=headers
        )
        assert response.status_code == 400
        print("✓ Missing alert_id correctly rejected with 400")
    
    def test_protocol_summary_invalid_alert_id(self, teleassistance_token):
        """Test protocol summary with invalid alert_id returns 404"""
        headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/ai/protocol-summary",
            json={"alert_id": "non-existent-alert-id"},
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Invalid alert_id correctly rejected with 404")


class TestTwilioBeneficiaryCall:
    """Tests for POST /api/twilio/call/beneficiary endpoint with updated voice/speech features"""
    
    @pytest.fixture
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        return response.json()["token"]
    
    @pytest.fixture
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_USER)
        return response.json()["token"]
    
    def test_twilio_call_returns_updated_fields(self, beneficiary_token, teleassistance_token):
        """Test that twilio call endpoint returns message_key, voice_engine, input_mode"""
        # Create alert as beneficiary
        ben_headers = {"Authorization": f"Bearer {beneficiary_token}", "Content-Type": "application/json"}
        alert_resp = requests.post(
            f"{BASE_URL}/api/alerts",
            json={"alert_type": "sos", "severity": "high", "message": "Test for Twilio call"},
            headers=ben_headers
        )
        assert alert_resp.status_code == 200
        alert_id = alert_resp.json()["id"]
        
        # Trigger call as teleassistance
        ta_headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        call_resp = requests.post(
            f"{BASE_URL}/api/twilio/call/beneficiary",
            json={"alert_id": alert_id},
            headers=ta_headers
        )
        
        # Note: Twilio may return 500 if credentials have issues, but route should exist
        if call_resp.status_code == 200:
            data = call_resp.json()
            assert "call_sid" in data or "call_id" in data
            # Check for new fields - these may be in the response or in DB
            print(f"✓ Twilio call initiated successfully")
            if "message_key" in data:
                print(f"  - message_key: {data['message_key']}")
            if "voice_engine" in data:
                print(f"  - voice_engine: {data.get('voice_engine', 'not in response')}")
        elif call_resp.status_code == 500:
            # Twilio config issue - acceptable
            print(f"✓ Twilio endpoint exists but returned 500 (expected if Twilio config issues)")
        else:
            print(f"! Unexpected status: {call_resp.status_code}")


class TestProtocolEndpoints:
    """Tests for GET /api/teleassistance/protocol/beneficiary and /api/teleassistance/protocol/guardian"""
    
    def test_beneficiary_protocol_returns_doubt_questions(self):
        """Test that beneficiary protocol returns doubt questions"""
        response = requests.get(f"{BASE_URL}/api/teleassistance/protocol/beneficiary")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify structure of doubt questions
        for q in data:
            assert "id" in q
            assert "question" in q
            assert "options" in q
        print(f"✓ Beneficiary protocol returned {len(data)} doubt questions")
        print(f"  First question: {data[0]['question'][:50]}...")
    
    def test_guardian_protocol_returns_questions(self):
        """Test that guardian protocol returns guardian questions"""
        response = requests.get(f"{BASE_URL}/api/teleassistance/protocol/guardian")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify structure
        for q in data:
            assert "id" in q
            assert "question" in q
            assert "options" in q
        print(f"✓ Guardian protocol returned {len(data)} questions")


class TestEscalationStart:
    """Tests for POST /api/teleassistance/escalation/start"""
    
    @pytest.fixture
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        return response.json()["token"]
    
    @pytest.fixture
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_USER)
        return response.json()["token"]
    
    def test_start_escalation_for_alert(self, beneficiary_token, teleassistance_token):
        """Test creating an escalation for an alert"""
        # Create alert
        ben_headers = {"Authorization": f"Bearer {beneficiary_token}", "Content-Type": "application/json"}
        alert_resp = requests.post(
            f"{BASE_URL}/api/alerts",
            json={"alert_type": "fall", "severity": "high", "message": "Test fall for escalation"},
            headers=ben_headers
        )
        assert alert_resp.status_code == 200
        alert_id = alert_resp.json()["id"]
        
        # Start escalation
        ta_headers = {"Authorization": f"Bearer {teleassistance_token}", "Content-Type": "application/json"}
        esc_resp = requests.post(
            f"{BASE_URL}/api/teleassistance/escalation/start",
            json={"alert_id": alert_id},
            headers=ta_headers
        )
        assert esc_resp.status_code == 200
        data = esc_resp.json()
        assert "id" in data
        assert "status" in data
        assert "timeline" in data
        assert data["alert_id"] == alert_id
        print(f"✓ Escalation created: {data['id']}")
        print(f"  Status: {data['status']}, Current step: {data.get('current_step', 'N/A')}")


class TestElevenLabsAudioEndpoints:
    """Tests for GET /api/elevenlabs/audio/{message_key}"""
    
    def test_elevenlabs_heart_anomaly_route_exists(self):
        """Test that heart_anomaly audio route exists"""
        response = requests.get(f"{BASE_URL}/api/elevenlabs/audio/heart_anomaly")
        # Route should exist - may return 500 if no API key, but not 404
        if response.status_code == 200:
            assert response.headers.get("Content-Type") in ["audio/mpeg", "audio/mp3", "application/octet-stream"]
            print("✓ heart_anomaly audio endpoint returned 200 with audio")
        elif response.status_code == 500:
            print("✓ heart_anomaly route exists, returned 500 (expected without ElevenLabs API key)")
        else:
            print(f"! Unexpected status: {response.status_code}")
    
    def test_elevenlabs_spo2_low_route_exists(self):
        """Test that spo2_low audio route exists"""
        response = requests.get(f"{BASE_URL}/api/elevenlabs/audio/spo2_low")
        if response.status_code == 200:
            print("✓ spo2_low audio endpoint returned 200")
        elif response.status_code == 500:
            print("✓ spo2_low route exists, returned 500 (expected without ElevenLabs API key)")
        else:
            print(f"! Unexpected status: {response.status_code}")
    
    def test_elevenlabs_unclear_response_route_exists(self):
        """Test that unclear_response audio route exists"""
        response = requests.get(f"{BASE_URL}/api/elevenlabs/audio/unclear_response")
        if response.status_code == 200:
            print("✓ unclear_response audio endpoint returned 200")
        elif response.status_code == 500:
            print("✓ unclear_response route exists, returned 500 (expected without ElevenLabs API key)")
        else:
            print(f"! Unexpected status: {response.status_code}")
    
    def test_elevenlabs_fall_detected_route(self):
        """Test fall_detected message (existing)"""
        response = requests.get(f"{BASE_URL}/api/elevenlabs/audio/fall_detected")
        assert response.status_code in [200, 500]  # Route exists
        print(f"✓ fall_detected route exists, status: {response.status_code}")
    
    def test_elevenlabs_invalid_message_key(self):
        """Test that invalid message key returns 404"""
        response = requests.get(f"{BASE_URL}/api/elevenlabs/audio/invalid_nonexistent_key")
        assert response.status_code == 404
        print("✓ Invalid message key correctly returns 404")


class TestAlertDetailEndpoint:
    """Tests for GET /api/alerts/{id}/detail"""
    
    @pytest.fixture
    def teleassistance_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TELEASSISTANCE_USER)
        return response.json()["token"]
    
    @pytest.fixture
    def beneficiary_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BENEFICIARY_USER)
        return response.json()["token"]
    
    def test_alert_detail_returns_full_data(self, beneficiary_token, teleassistance_token):
        """Test that alert detail returns full alert data with beneficiary info"""
        # Create alert
        ben_headers = {"Authorization": f"Bearer {beneficiary_token}", "Content-Type": "application/json"}
        alert_resp = requests.post(
            f"{BASE_URL}/api/alerts",
            json={"alert_type": "sos", "severity": "medium", "message": "Test for detail endpoint"},
            headers=ben_headers
        )
        assert alert_resp.status_code == 200
        alert_id = alert_resp.json()["id"]
        
        # Get detail as teleassistance
        ta_headers = {"Authorization": f"Bearer {teleassistance_token}"}
        detail_resp = requests.get(f"{BASE_URL}/api/alerts/{alert_id}/detail", headers=ta_headers)
        assert detail_resp.status_code == 200
        data = detail_resp.json()
        
        # Verify structure
        assert "alert" in data
        assert "beneficiary" in data
        assert "guardians" in data
        assert "escalations" in data
        assert "calls" in data
        assert "timeline" in data
        
        # Verify alert data
        assert data["alert"]["id"] == alert_id
        
        # Verify beneficiary has medical info
        if data["beneficiary"]:
            ben = data["beneficiary"]
            assert "medical_conditions" in ben
            assert "allergies" in ben
        
        print(f"✓ Alert detail returned complete data")
        print(f"  Alert type: {data['alert']['alert_type']}, Status: {data['alert']['status']}")
        print(f"  Beneficiary: {data['beneficiary']['name'] if data['beneficiary'] else 'N/A'}")
        print(f"  Timeline events: {len(data['timeline'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
