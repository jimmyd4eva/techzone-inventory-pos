#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SmartRepairPOSAPITester:
    def __init__(self, base_url="https://device-lock-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def test_auth_and_get_token(self):
        """Test authentication and get token"""
        print("\n🔐 Testing Authentication...")
        
        # Try to login with demo credentials first
        login_data = {
            "username": "demo",
            "password": "demo123"
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.log_result("Demo Login", True, f"Token obtained: {self.token[:20]}...")
                return True
            else:
                # Try to register a test user
                register_data = {
                    "username": f"test_user_{datetime.now().strftime('%H%M%S')}",
                    "email": "test@example.com",
                    "password": "TestPass123!",
                    "role": "admin"
                }
                
                reg_response = requests.post(f"{self.api_url}/auth/register", json=register_data)
                if reg_response.status_code == 200:
                    reg_data = reg_response.json()
                    self.token = reg_data.get('token')
                    self.log_result("User Registration & Login", True, f"New user created and token obtained")
                    return True
                else:
                    self.log_result("Authentication", False, f"Login failed: {response.status_code}, Register failed: {reg_response.status_code}")
                    return False
                    
        except Exception as e:
            self.log_result("Authentication", False, f"Error: {str(e)}")
            return False

    def test_inventory_endpoints(self):
        """Test inventory endpoints"""
        print("\n📦 Testing Inventory Endpoints...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Test GET inventory
        try:
            response = requests.get(f"{self.api_url}/inventory", headers=headers)
            if response.status_code == 200:
                inventory = response.json()
                self.log_result("Get Inventory", True, f"Retrieved {len(inventory)} items")
                return inventory
            else:
                self.log_result("Get Inventory", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_result("Get Inventory", False, f"Error: {str(e)}")
            return []

    def test_sales_endpoint_tax_calculation(self):
        """Test sales endpoint specifically for tax calculation"""
        print("\n💰 Testing Sales Tax Calculation...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # First get some inventory items to create a sale
        inventory = self.test_inventory_endpoints()
        if not inventory:
            self.log_result("Sales Tax Test - Setup", False, "No inventory items available")
            return False
        
        # Use first available item
        test_item = inventory[0]
        
        # Create a test sale
        sale_data = {
            "items": [
                {
                    "item_id": test_item['id'],
                    "item_name": test_item['name'],
                    "quantity": 1,
                    "price": test_item['selling_price'],
                    "subtotal": test_item['selling_price']
                }
            ],
            "payment_method": "cash",
            "created_by": "test_user"
        }
        
        try:
            response = requests.post(f"{self.api_url}/sales", json=sale_data, headers=headers)
            if response.status_code == 200 or response.status_code == 201:
                sale = response.json()
                
                # Check tax calculation
                expected_subtotal = test_item['selling_price']
                expected_tax = 0  # Should be 0 after tax removal
                expected_total = expected_subtotal  # Total should equal subtotal
                
                actual_subtotal = sale.get('subtotal', 0)
                actual_tax = sale.get('tax', 0)
                actual_total = sale.get('total', 0)
                
                # Verify tax is 0
                if actual_tax == 0:
                    self.log_result("Tax Calculation - Zero Tax", True, f"Tax correctly set to $0.00")
                else:
                    self.log_result("Tax Calculation - Zero Tax", False, f"Tax is ${actual_tax}, expected $0.00")
                
                # Verify total equals subtotal
                if abs(actual_total - actual_subtotal) < 0.01:
                    self.log_result("Total Calculation - No Tax Added", True, f"Total (${actual_total}) equals subtotal (${actual_subtotal})")
                else:
                    self.log_result("Total Calculation - No Tax Added", False, f"Total (${actual_total}) != subtotal (${actual_subtotal})")
                
                # Verify subtotal calculation
                if abs(actual_subtotal - expected_subtotal) < 0.01:
                    self.log_result("Subtotal Calculation", True, f"Subtotal correctly calculated: ${actual_subtotal}")
                else:
                    self.log_result("Subtotal Calculation", False, f"Subtotal (${actual_subtotal}) != expected (${expected_subtotal})")
                
                print(f"📊 Sale Details:")
                print(f"   Subtotal: ${actual_subtotal}")
                print(f"   Tax: ${actual_tax}")
                print(f"   Total: ${actual_total}")
                
                return True
                
            else:
                self.log_result("Sales Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Sales Tax Test", False, f"Error: {str(e)}")
            return False

    def test_multiple_items_tax_calculation(self):
        """Test tax calculation with multiple items"""
        print("\n🛒 Testing Multiple Items Tax Calculation...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Get inventory
        inventory = self.test_inventory_endpoints()
        if len(inventory) < 2:
            self.log_result("Multiple Items Tax Test - Setup", False, "Need at least 2 inventory items")
            return False
        
        # Create sale with multiple items
        items = []
        expected_subtotal = 0
        
        for i in range(min(2, len(inventory))):
            item = inventory[i]
            quantity = 2
            subtotal = item['selling_price'] * quantity
            expected_subtotal += subtotal
            
            items.append({
                "item_id": item['id'],
                "item_name": item['name'],
                "quantity": quantity,
                "price": item['selling_price'],
                "subtotal": subtotal
            })
        
        sale_data = {
            "items": items,
            "payment_method": "cash",
            "created_by": "test_user"
        }
        
        try:
            response = requests.post(f"{self.api_url}/sales", json=sale_data, headers=headers)
            if response.status_code == 200 or response.status_code == 201:
                sale = response.json()
                
                actual_subtotal = sale.get('subtotal', 0)
                actual_tax = sale.get('tax', 0)
                actual_total = sale.get('total', 0)
                
                # Verify tax is still 0 with multiple items
                if actual_tax == 0:
                    self.log_result("Multiple Items - Zero Tax", True, f"Tax correctly remains $0.00 with multiple items")
                else:
                    self.log_result("Multiple Items - Zero Tax", False, f"Tax is ${actual_tax}, expected $0.00")
                
                # Verify total equals subtotal
                if abs(actual_total - actual_subtotal) < 0.01:
                    self.log_result("Multiple Items - Total Equals Subtotal", True, f"Total (${actual_total}) equals subtotal (${actual_subtotal})")
                else:
                    self.log_result("Multiple Items - Total Equals Subtotal", False, f"Total (${actual_total}) != subtotal (${actual_subtotal})")
                
                print(f"📊 Multiple Items Sale Details:")
                print(f"   Items: {len(items)}")
                print(f"   Subtotal: ${actual_subtotal}")
                print(f"   Tax: ${actual_tax}")
                print(f"   Total: ${actual_total}")
                
                return True
                
            else:
                self.log_result("Multiple Items Sale Creation", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Multiple Items Tax Test", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting SmartRepair POS API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_auth_and_get_token():
            print("❌ Authentication failed. Cannot proceed with other tests.")
            return False
        
        # Test inventory (needed for sales tests)
        self.test_inventory_endpoints()
        
        # Test tax calculations
        self.test_sales_endpoint_tax_calculation()
        self.test_multiple_items_tax_calculation()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SmartRepairPOSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())