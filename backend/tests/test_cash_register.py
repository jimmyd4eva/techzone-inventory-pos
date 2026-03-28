"""
Cash Register API Tests
Tests for the cash register shift management and transaction tracking feature.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://device-lock-1.preview.emergentagent.com').rstrip('/')

class TestCashRegisterAPI:
    """Cash Register endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # Clean up any open shifts before tests
        current = requests.get(f"{BASE_URL}/api/cash-register/current", headers=self.headers)
        if current.status_code == 200 and current.json().get("shift"):
            # Close the existing shift
            requests.post(f"{BASE_URL}/api/cash-register/close", 
                         headers=self.headers, 
                         json={"closing_amount": 0, "notes": "Test cleanup"})
    
    def test_get_current_shift_no_shift(self):
        """Test getting current shift when no shift is open"""
        response = requests.get(f"{BASE_URL}/api/cash-register/current", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["shift"] is None
        assert data["transactions"] == []
        assert data["totals"] == {}
        print("PASS: Get current shift (no shift) returns correct empty response")
    
    def test_open_shift(self):
        """Test opening a new shift"""
        response = requests.post(f"{BASE_URL}/api/cash-register/open", 
                                headers=self.headers,
                                json={"opening_amount": 150.00})
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Shift opened successfully"
        assert data["shift"]["opening_amount"] == 150.00
        assert data["shift"]["status"] == "open"
        assert data["shift"]["opened_by_name"] == "admin"
        print("PASS: Open shift creates shift with correct data")
        
        # Cleanup - close the shift
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 150, "notes": "Test cleanup"})
    
    def test_cannot_open_duplicate_shift(self):
        """Test that opening a shift when one is already open fails"""
        # Open first shift
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 100.00})
        
        # Try to open second shift
        response = requests.post(f"{BASE_URL}/api/cash-register/open", 
                                headers=self.headers,
                                json={"opening_amount": 200.00})
        assert response.status_code == 400
        assert "already open" in response.json()["detail"].lower()
        print("PASS: Cannot open duplicate shift - returns 400")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 100, "notes": "Test cleanup"})
    
    def test_add_payout_transaction(self):
        """Test adding a payout transaction"""
        # Open shift first
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 200.00})
        
        # Add payout
        response = requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                                headers=self.headers,
                                json={
                                    "transaction_type": "payout",
                                    "amount": 30.00,
                                    "description": "Test payout"
                                })
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Transaction recorded"
        assert data["transaction"]["transaction_type"] == "payout"
        assert data["transaction"]["amount"] == -30.00  # Negative for cash out
        assert data["transaction"]["description"] == "Test payout"
        print("PASS: Add payout transaction records correctly with negative amount")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 170, "notes": "Test cleanup"})
    
    def test_add_drop_transaction(self):
        """Test adding a safe drop transaction"""
        # Open shift first
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 300.00})
        
        # Add drop
        response = requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                                headers=self.headers,
                                json={
                                    "transaction_type": "drop",
                                    "amount": 100.00,
                                    "description": "Safe drop"
                                })
        assert response.status_code == 200
        data = response.json()
        assert data["transaction"]["transaction_type"] == "drop"
        assert data["transaction"]["amount"] == -100.00
        print("PASS: Add drop transaction records correctly")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 200, "notes": "Test cleanup"})
    
    def test_add_refund_transaction(self):
        """Test adding a refund transaction"""
        # Open shift first
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 250.00})
        
        # Add refund
        response = requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                                headers=self.headers,
                                json={
                                    "transaction_type": "refund",
                                    "amount": 45.00,
                                    "description": "Customer refund"
                                })
        assert response.status_code == 200
        data = response.json()
        assert data["transaction"]["transaction_type"] == "refund"
        assert data["transaction"]["amount"] == -45.00
        print("PASS: Add refund transaction records correctly")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 205, "notes": "Test cleanup"})
    
    def test_invalid_transaction_type(self):
        """Test that invalid transaction type is rejected"""
        # Open shift first
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 100.00})
        
        # Try invalid type
        response = requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                                headers=self.headers,
                                json={
                                    "transaction_type": "invalid_type",
                                    "amount": 50.00,
                                    "description": "Test"
                                })
        assert response.status_code == 400
        assert "invalid transaction type" in response.json()["detail"].lower()
        print("PASS: Invalid transaction type returns 400")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 100, "notes": "Test cleanup"})
    
    def test_transaction_without_open_shift(self):
        """Test that adding transaction without open shift fails"""
        response = requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                                headers=self.headers,
                                json={
                                    "transaction_type": "payout",
                                    "amount": 50.00,
                                    "description": "Test"
                                })
        assert response.status_code == 400
        assert "no open shift" in response.json()["detail"].lower()
        print("PASS: Transaction without open shift returns 400")
    
    def test_close_shift_with_difference(self):
        """Test closing shift calculates difference correctly"""
        # Open shift
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 200.00})
        
        # Add some transactions
        requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                     headers=self.headers,
                     json={"transaction_type": "payout", "amount": 50.00, "description": "Payout"})
        
        # Close with different amount (expected: 200 - 50 = 150)
        response = requests.post(f"{BASE_URL}/api/cash-register/close", 
                                headers=self.headers,
                                json={"closing_amount": 160.00, "notes": "Test close"})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["expected_amount"] == 150.00
        assert data["summary"]["closing_amount"] == 160.00
        assert data["summary"]["difference"] == 10.00  # Over by 10
        assert data["summary"]["status"] == "over"
        print("PASS: Close shift calculates difference correctly (over)")
    
    def test_close_shift_short(self):
        """Test closing shift when short"""
        # Open shift
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 100.00})
        
        # Close with less than expected
        response = requests.post(f"{BASE_URL}/api/cash-register/close", 
                                headers=self.headers,
                                json={"closing_amount": 90.00, "notes": "Short test"})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["difference"] == -10.00  # Short by 10
        assert data["summary"]["status"] == "short"
        print("PASS: Close shift calculates difference correctly (short)")
    
    def test_close_shift_balanced(self):
        """Test closing shift when balanced"""
        # Open shift
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 100.00})
        
        # Close with exact expected amount
        response = requests.post(f"{BASE_URL}/api/cash-register/close", 
                                headers=self.headers,
                                json={"closing_amount": 100.00, "notes": "Balanced test"})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["difference"] == 0
        assert data["summary"]["status"] == "balanced"
        print("PASS: Close shift calculates difference correctly (balanced)")
    
    def test_close_shift_without_open_shift(self):
        """Test that closing without open shift fails"""
        response = requests.post(f"{BASE_URL}/api/cash-register/close", 
                                headers=self.headers,
                                json={"closing_amount": 100.00, "notes": "Test"})
        assert response.status_code == 400
        assert "no open shift" in response.json()["detail"].lower()
        print("PASS: Close shift without open shift returns 400")
    
    def test_get_shift_history(self):
        """Test getting shift history"""
        response = requests.get(f"{BASE_URL}/api/cash-register/history?limit=10", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have closed shifts from previous tests
        if len(data) > 0:
            shift = data[0]
            assert shift["status"] == "closed"
            assert "opening_amount" in shift
            assert "closing_amount" in shift
            assert "difference" in shift
        print(f"PASS: Get shift history returns list with {len(data)} shifts")
    
    def test_current_shift_totals(self):
        """Test that current shift totals are calculated correctly"""
        # Open shift
        requests.post(f"{BASE_URL}/api/cash-register/open", 
                     headers=self.headers,
                     json={"opening_amount": 500.00})
        
        # Add various transactions
        requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                     headers=self.headers,
                     json={"transaction_type": "payout", "amount": 50.00, "description": "Payout 1"})
        requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                     headers=self.headers,
                     json={"transaction_type": "drop", "amount": 100.00, "description": "Drop 1"})
        requests.post(f"{BASE_URL}/api/cash-register/transaction", 
                     headers=self.headers,
                     json={"transaction_type": "refund", "amount": 25.00, "description": "Refund 1"})
        
        # Get current shift
        response = requests.get(f"{BASE_URL}/api/cash-register/current", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        totals = data["totals"]
        assert totals["opening_amount"] == 500.00
        assert totals["payouts"] == 50.00
        assert totals["drops"] == 100.00
        assert totals["refunds"] == 25.00
        # Expected: 500 - 50 - 100 - 25 = 325
        assert totals["expected_amount"] == 325.00
        print("PASS: Current shift totals calculated correctly")
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/cash-register/close", 
                     headers=self.headers, 
                     json={"closing_amount": 325, "notes": "Test cleanup"})
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        # No auth header
        response = requests.get(f"{BASE_URL}/api/cash-register/current")
        assert response.status_code == 401
        print("PASS: Unauthorized access returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
