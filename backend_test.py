import requests
import sys
import json
from datetime import datetime

class TaxExemptionTester:
    def __init__(self, base_url="https://zero-tax-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_user = {"username": "admin", "password": "admin123"}

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                if response.text:
                    try:
                        error_data = response.json()
                        details += f" - {error_data.get('detail', response.text)}"
                    except:
                        details += f" - {response.text[:100]}"

            return self.log_test(name, success, details), response.json() if success else {}

        except Exception as e:
            return self.log_test(name, False, f"Error: {str(e)}"), {}

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n=== TESTING ADMIN LOGIN ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.admin_user
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"✅ Admin logged in successfully, role: {response.get('user', {}).get('role')}")
            return True
        return False

    def test_get_settings_default(self):
        """Test GET /api/settings returns default settings"""
        print("\n=== TESTING GET SETTINGS (DEFAULT) ===")
        success, response = self.run_test(
            "Get Default Settings",
            "GET",
            "settings",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            print(f"Settings response: {json.dumps(response, indent=2)}")
            # Verify default values
            expected_defaults = {
                'tax_rate': 0.0,
                'tax_enabled': False,
                'currency': 'USD'
            }
            for key, expected_value in expected_defaults.items():
                if response.get(key) == expected_value:
                    self.log_test(f"Default {key} correct", True)
                else:
                    self.log_test(f"Default {key} correct", False, f"Expected {expected_value}, got {response.get(key)}")
        return success

    def test_update_settings_enable_tax(self):
        """Test PUT /api/settings to enable tax at 10%"""
        print("\n=== TESTING UPDATE SETTINGS (ENABLE TAX 10%) ===")
        tax_data = {
            "tax_rate": 0.10,  # 10% as decimal
            "tax_enabled": True,
            "currency": "USD"
        }
        success, response = self.run_test(
            "Enable Tax at 10%",
            "PUT",
            "settings",
            200,
            data=tax_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            print(f"Updated settings: {json.dumps(response, indent=2)}")
            # Verify the update
            if response.get('tax_rate') == 0.10 and response.get('tax_enabled') == True:
                self.log_test("Tax settings updated correctly", True)
            else:
                self.log_test("Tax settings updated correctly", False, f"tax_rate: {response.get('tax_rate')}, tax_enabled: {response.get('tax_enabled')}")
        return success

    def test_get_settings_after_update(self):
        """Test GET /api/settings after update"""
        print("\n=== TESTING GET SETTINGS (AFTER UPDATE) ===")
        success, response = self.run_test(
            "Get Settings After Update",
            "GET",
            "settings",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            print(f"Settings after update: {json.dumps(response, indent=2)}")
            # Verify the values persist
            if response.get('tax_rate') == 0.10 and response.get('tax_enabled') == True:
                self.log_test("Tax settings persisted correctly", True)
            else:
                self.log_test("Tax settings persisted correctly", False, f"tax_rate: {response.get('tax_rate')}, tax_enabled: {response.get('tax_enabled')}")
        return success

    def test_create_sale_with_tax(self):
        """Test creating a sale with tax enabled"""
        print("\n=== TESTING SALE CREATION WITH TAX ===")
        
        # First get inventory items
        success, inventory_response = self.run_test(
            "Get Inventory for Sale",
            "GET",
            "inventory",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if not success or not inventory_response:
            print("❌ Cannot get inventory for sale test")
            return False
            
        # Use first available item or create a mock sale
        items = inventory_response if isinstance(inventory_response, list) else []
        if items:
            item = items[0]
            sale_data = {
                "items": [{
                    "item_id": item['id'],
                    "item_name": item['name'],
                    "quantity": 1,
                    "price": item['selling_price'],
                    "subtotal": item['selling_price']
                }],
                "payment_method": "cash",
                "created_by": "admin"
            }
        else:
            # Create mock sale data
            sale_data = {
                "items": [{
                    "item_id": "mock-item-1",
                    "item_name": "Mock Phone",
                    "quantity": 1,
                    "price": 100.0,
                    "subtotal": 100.0
                }],
                "payment_method": "cash",
                "created_by": "admin"
            }
        
        success, response = self.run_test(
            "Create Sale with Tax",
            "POST",
            "sales",
            201,
            data=sale_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"Sale created: {json.dumps(response, indent=2)}")
            # Verify tax calculation
            subtotal = response.get('subtotal', 0)
            tax = response.get('tax', 0)
            total = response.get('total', 0)
            expected_tax = subtotal * 0.10  # 10% tax
            expected_total = subtotal + expected_tax
            
            print(f"Subtotal: ${subtotal:.2f}")
            print(f"Tax: ${tax:.2f} (expected: ${expected_tax:.2f})")
            print(f"Total: ${total:.2f} (expected: ${expected_total:.2f})")
            
            if abs(tax - expected_tax) < 0.01 and abs(total - expected_total) < 0.01:
                self.log_test("Tax calculation is correct", True)
            else:
                self.log_test("Tax calculation is correct", False, f"Expected tax: ${expected_tax:.2f}, got: ${tax:.2f}")
                
        return success

    def test_disable_tax(self):
        """Test disabling tax"""
        print("\n=== TESTING DISABLE TAX ===")
        tax_data = {
            "tax_enabled": False
        }
        success, response = self.run_test(
            "Disable Tax",
            "PUT",
            "settings",
            200,
            data=tax_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            print(f"Settings after disabling tax: {json.dumps(response, indent=2)}")
            if response.get('tax_enabled') == False:
                self.log_test("Tax disabled successfully", True)
            else:
                self.log_test("Tax disabled successfully", False, f"tax_enabled: {response.get('tax_enabled')}")
        return success

    def test_create_sale_without_tax(self):
        """Test creating a sale with tax disabled"""
        print("\n=== TESTING SALE CREATION WITHOUT TAX ===")
        
        # Get inventory items
        success, inventory_response = self.run_test(
            "Get Inventory for No-Tax Sale",
            "GET",
            "inventory",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if not success or not inventory_response:
            print("❌ Cannot get inventory for no-tax sale test")
            return False
            
        items = inventory_response if isinstance(inventory_response, list) else []
        if items:
            item = items[0]
            sale_data = {
                "items": [{
                    "item_id": item['id'],
                    "item_name": item['name'],
                    "quantity": 1,
                    "price": item['selling_price'],
                    "subtotal": item['selling_price']
                }],
                "payment_method": "cash",
                "created_by": "admin"
            }
        else:
            # Create mock sale data
            sale_data = {
                "items": [{
                    "item_id": "mock-item-2",
                    "item_name": "Mock Phone 2",
                    "quantity": 1,
                    "price": 100.0,
                    "subtotal": 100.0
                }],
                "payment_method": "cash",
                "created_by": "admin"
            }
        
        success, response = self.run_test(
            "Create Sale without Tax",
            "POST",
            "sales",
            201,
            data=sale_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"Sale created without tax: {json.dumps(response, indent=2)}")
            # Verify no tax applied
            subtotal = response.get('subtotal', 0)
            tax = response.get('tax', 0)
            total = response.get('total', 0)
            
            print(f"Subtotal: ${subtotal:.2f}")
            print(f"Tax: ${tax:.2f} (expected: $0.00)")
            print(f"Total: ${total:.2f} (expected: ${subtotal:.2f})")
            
            if tax == 0 and total == subtotal:
                self.log_test("No tax applied correctly", True)
            else:
                self.log_test("No tax applied correctly", False, f"Tax: ${tax:.2f}, should be $0.00")
                
        return success

    def test_non_admin_access(self):
        """Test that non-admin users cannot update settings"""
        print("\n=== TESTING NON-ADMIN ACCESS RESTRICTION ===")
        
        # Create a non-admin user first
        non_admin_user = {
            "username": f"test_cashier_{datetime.now().strftime('%H%M%S')}",
            "email": "test@example.com",
            "password": "testpass123",
            "role": "cashier"
        }
        
        # Register non-admin user
        success, response = self.run_test(
            "Register Non-Admin User",
            "POST",
            "auth/register",
            200,
            data=non_admin_user
        )
        
        if not success:
            print("❌ Could not create non-admin user for test")
            return False
            
        # Login as non-admin
        success, login_response = self.run_test(
            "Login Non-Admin User",
            "POST",
            "auth/login",
            200,
            data={"username": non_admin_user["username"], "password": non_admin_user["password"]}
        )
        
        if not success:
            print("❌ Could not login non-admin user")
            return False
            
        # Store original admin token
        admin_token = self.admin_token
        non_admin_token = login_response.get('token')
        
        # Try to update settings as non-admin (should fail)
        success, response = self.run_test(
            "Non-Admin Settings Update (Should Fail)",
            "PUT",
            "settings",
            403,  # Expecting forbidden
            data={"tax_rate": 0.05},
            headers={"Authorization": f"Bearer {non_admin_token}"}
        )
        
        # Restore admin token
        self.admin_token = admin_token
        
        if success:
            self.log_test("Non-admin correctly denied access to settings", True)
        else:
            self.log_test("Non-admin correctly denied access to settings", False, "Non-admin was able to update settings")
            
        return success

    def run_all_tests(self):
        """Run all tax configuration tests"""
        print("🚀 Starting Tax Configuration API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Get Default Settings", self.test_get_settings_default),
            ("Enable Tax at 10%", self.test_update_settings_enable_tax),
            ("Verify Settings Persistence", self.test_get_settings_after_update),
            ("Create Sale with Tax", self.test_create_sale_with_tax),
            ("Disable Tax", self.test_disable_tax),
            ("Create Sale without Tax", self.test_create_sale_without_tax),
            ("Non-Admin Access Restriction", self.test_non_admin_access)
        ]
        
        for test_name, test_func in tests:
            try:
                print(f"\n{'='*20} {test_name} {'='*20}")
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 FINAL RESULTS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status_icon = "✅" if result["status"] == "PASSED" else "❌"
            print(f"{status_icon} {result['test']}: {result['status']}")
            if result["details"] and result["status"] == "FAILED":
                print(f"   Details: {result['details']}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed!")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = TaxConfigurationTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())