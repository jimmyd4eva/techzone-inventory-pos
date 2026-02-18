#!/usr/bin/env python3
"""
Test suite for TechZone POS Device Activation System
Tests: request-code, activate, check endpoints
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://device-lock-1.preview.emergentagent.com').rstrip('/')


class TestActivationSystem:
    """Tests for the device activation system"""
    
    # Class-level variables to share state between tests
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_device_id = f"TEST-DEV-{uuid.uuid4().hex[:8].upper()}"
    activation_code = None
    
    def test_01_request_activation_code(self):
        """Test POST /api/activation/request-code - generates 6-digit code"""
        response = requests.post(f"{BASE_URL}/api/activation/request-code", json={
            "email": self.test_email
        })
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") is True, "Expected success=True"
        assert "message" in data, "Expected 'message' in response"
        
        # Since EMAIL_PASSWORD is empty, code should be returned in response
        if "code" in data:
            TestActivationSystem.activation_code = data["code"]
            assert len(data["code"]) == 6, f"Activation code should be 6 digits, got {len(data['code'])}"
            assert data["code"].isdigit(), "Activation code should contain only digits"
            print(f"Activation code received: {data['code']}")
        else:
            # If email was sent, extract code from message (fallback)
            print(f"Message: {data['message']}")
            
    def test_02_check_device_not_activated(self):
        """Test POST /api/activation/check - device should not be activated initially"""
        response = requests.post(f"{BASE_URL}/api/activation/check", json={
            "device_id": self.test_device_id
        })
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert data.get("is_activated") is False, "Device should NOT be activated initially"
        print(f"Device {self.test_device_id} is not activated (expected)")
        
    def test_03_activate_device_invalid_code(self):
        """Test POST /api/activation/activate with invalid code"""
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": "000000",  # Invalid code
            "device_id": self.test_device_id
        })
        
        # Should fail with 400
        assert response.status_code == 400, f"Expected 400 for invalid code, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Expected error detail"
        print(f"Invalid code error (expected): {data.get('detail')}")
        
    def test_04_activate_device_valid_code(self):
        """Test POST /api/activation/activate with valid code"""
        if not TestActivationSystem.activation_code:
            pytest.skip("No activation code available from test_01")
            
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": TestActivationSystem.activation_code,
            "device_id": self.test_device_id
        })
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") is True, "Expected success=True"
        assert "activated_email" in data, "Expected 'activated_email' in response"
        assert data["activated_email"] == self.test_email, f"Expected email {self.test_email}, got {data['activated_email']}"
        print(f"Device activated successfully by {data['activated_email']}")
        
    def test_05_check_device_activated(self):
        """Test POST /api/activation/check - device should now be activated"""
        response = requests.post(f"{BASE_URL}/api/activation/check", json={
            "device_id": self.test_device_id
        })
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert data.get("is_activated") is True, "Device SHOULD be activated now"
        assert "activated_at" in data, "Expected 'activated_at' in response"
        assert "activated_email" in data, "Expected 'activated_email' in response"
        print(f"Device is activated. Email: {data.get('activated_email')}, At: {data.get('activated_at')}")
        
    def test_06_code_cannot_be_reused(self):
        """Test that activation code cannot be reused after being used once"""
        if not TestActivationSystem.activation_code:
            pytest.skip("No activation code available from test_01")
            
        new_device_id = f"TEST-DEV-{uuid.uuid4().hex[:8].upper()}"
        
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": TestActivationSystem.activation_code,  # Same code
            "device_id": new_device_id  # Different device
        })
        
        # Should fail because code is already used
        assert response.status_code == 400, f"Expected 400 for reused code, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Expected error detail"
        print(f"Code reuse error (expected): {data.get('detail')}")
        
    def test_07_already_activated_device_response(self):
        """Test that already activated device returns appropriate response"""
        if not TestActivationSystem.activation_code:
            pytest.skip("No activation code available")
            
        # Request a new code
        new_email = f"test2_{uuid.uuid4().hex[:8]}@example.com"
        req_response = requests.post(f"{BASE_URL}/api/activation/request-code", json={
            "email": new_email
        })
        assert req_response.status_code == 200
        
        new_code = req_response.json().get("code")
        if not new_code:
            pytest.skip("Could not get new activation code")
            
        # Try to activate the same device again
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": new_code,
            "device_id": self.test_device_id  # Already activated device
        })
        
        # Should return success with already_activated flag
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("already_activated") is True, "Expected already_activated=True"
        print(f"Already activated response: {data.get('message')}")


class TestActivationCodeExpiry:
    """Tests for activation code expiration (12-hour validity)"""
    
    def test_expiry_info_in_message(self):
        """Test that the request-code response mentions 12-hour validity"""
        test_email = f"expiry_test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/activation/request-code", json={
            "email": test_email
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if message mentions hours/validity
        message = data.get("message", "")
        assert "12" in message or "hour" in message.lower(), f"Expected '12 hours' mention in message: {message}"
        print(f"Expiry info in message: {message}")


class TestActivationInputValidation:
    """Tests for input validation on activation endpoints"""
    
    def test_empty_email(self):
        """Test request-code with empty email"""
        response = requests.post(f"{BASE_URL}/api/activation/request-code", json={
            "email": ""
        })
        # Should fail validation (422 or 400)
        assert response.status_code in [400, 422], f"Expected validation error, got {response.status_code}"
        
    def test_empty_device_id_check(self):
        """Test check with empty device_id"""
        response = requests.post(f"{BASE_URL}/api/activation/check", json={
            "device_id": ""
        })
        # Server might return 200 with is_activated=False for empty device_id
        # or validation error
        assert response.status_code in [200, 400, 422]
        
    def test_empty_code_activate(self):
        """Test activate with empty code"""
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": "",
            "device_id": "TEST-DEV-123"
        })
        # Should fail
        assert response.status_code == 400, f"Expected 400 for empty code, got {response.status_code}"


class TestActivationEndpointsSecurity:
    """Tests to verify activation endpoints are PUBLIC (no auth required)"""
    
    def test_request_code_no_auth(self):
        """Verify /api/activation/request-code works without auth"""
        response = requests.post(f"{BASE_URL}/api/activation/request-code", json={
            "email": "noauth@test.com"
        })
        assert response.status_code == 200, "Endpoint should work without authentication"
        
    def test_check_no_auth(self):
        """Verify /api/activation/check works without auth"""
        response = requests.post(f"{BASE_URL}/api/activation/check", json={
            "device_id": "NOAUTH-TEST-123"
        })
        assert response.status_code == 200, "Endpoint should work without authentication"
        
    def test_activate_no_auth(self):
        """Verify /api/activation/activate works without auth (though it may fail with invalid code)"""
        response = requests.post(f"{BASE_URL}/api/activation/activate", json={
            "code": "123456",
            "device_id": "NOAUTH-TEST-456"
        })
        # Should be 400 (invalid code) not 401 (unauthorized)
        assert response.status_code == 400, "Endpoint should return 400 (invalid code), not 401 (unauthorized)"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
