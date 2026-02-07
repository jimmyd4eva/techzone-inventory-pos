import requests
import sys
import json
from datetime import datetime

class TaxConfigurationTester:
    def __init__(self, base_url="https://zero-tax-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.non_admin_token = None
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

    def setup_users(self):
        """Create admin and non-admin users for testing"""
        print("\n🔧 Setting up test users...")
        
        # Try to login with existing admin user first
        admin_login_success, admin_response = self.run_test(
            "Admin Login (existing)",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if admin_login_success and 'token' in admin_response:
            self.admin_token = admin_response['token']
            print("✅ Using existing admin user")
        else:
            # Create new admin user
            admin_create_success, admin_response = self.run_test(
                "Create Admin User",
                "POST",
                "auth/register",
                200,
                data={
                    "username": "test_admin",
                    "email": "admin@test.com",
                    "password": "admin123",
                    "role": "admin"
                }
            )
            
            if admin_create_success and 'token' in admin_response:
                self.admin_token = admin_response['token']
            else:
                print("❌ Failed to create admin user, trying login...")
                admin_login_success, admin_response = self.run_test(
                    "Admin Login (fallback)",
                    "POST",
                    "auth/login",
                    200,
                    data={"username": "test_admin", "password": "admin123"}
                )
                if admin_login_success:
                    self.admin_token = admin_response['token']

        # Try to create/login non-admin user
        cashier_create_success, cashier_response = self.run_test(
            "Create Cashier User",
            "POST",
            "auth/register",
            200,
            data={
                "username": "test_cashier",
                "email": "cashier@test.com", 
                "password": "cashier123",
                "role": "cashier"
            }
        )
        
        if cashier_create_success and 'token' in cashier_response:
            self.non_admin_token = cashier_response['token']
        else:
            # Try login if user already exists
            cashier_login_success, cashier_response = self.run_test(
                "Cashier Login (existing)",
                "POST",
                "auth/login",
                200,
                data={"username": "test_cashier", "password": "cashier123"}
            )
            if cashier_login_success:
                self.non_admin_token = cashier_response['token']

        return self.admin_token is not None

    def test_settings_endpoints(self):
        """Test settings API endpoints"""
        print("\n📋 Testing Settings API Endpoints...")
        
        if not self.admin_token:
            self.log_test("Settings Tests", False, "No admin token available")
            return False

        # Test GET /api/settings - should return default settings
        success, settings_response = self.run_test(
            "GET /api/settings (default)",
            "GET",
            "settings",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            expected_defaults = {
                "tax_rate": 0.0,
                "tax_enabled": False,
                "currency": "USD"
            }
            
            for key, expected_value in expected_defaults.items():
                if settings_response.get(key) != expected_value:
                    self.log_test(f"Default {key} value", False, f"Expected {expected_value}, got {settings_response.get(key)}")
                else:
                    self.log_test(f"Default {key} value", True)

        # Test PUT /api/settings - admin can update
        success, update_response = self.run_test(
            "PUT /api/settings (admin update)",
            "PUT",
            "settings",
            200,
            data={
                "tax_rate": 0.10,  # 10%
                "tax_enabled": True,
                "currency": "USD"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            # Verify the update worked
            success, verify_response = self.run_test(
                "GET /api/settings (verify update)",
                "GET",
                "settings",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if success:
                if verify_response.get("tax_rate") == 0.10 and verify_response.get("tax_enabled") == True:
                    self.log_test("Settings update verification", True)
                else:
                    self.log_test("Settings update verification", False, f"Tax rate: {verify_response.get('tax_rate')}, Tax enabled: {verify_response.get('tax_enabled')}")

        # Test PUT /api/settings - non-admin should get 403
        if self.non_admin_token:
            success, forbidden_response = self.run_test(
                "PUT /api/settings (non-admin forbidden)",
                "PUT",
                "settings",
                403,
                data={
                    "tax_rate": 0.05,
                    "tax_enabled": False
                },
                headers={"Authorization": f"Bearer {self.non_admin_token}"}
            )
        else:
            self.log_test("PUT /api/settings (non-admin forbidden)", False, "No non-admin token available")

        return True

    def test_sales_with_tax(self):
        """Test sales API with tax calculation"""
        print("\n💰 Testing Sales with Tax Calculation...")
        
        if not self.admin_token:
            self.log_test("Sales Tax Tests", False, "No admin token available")
            return False

        # First, ensure tax is enabled at 10%
        self.run_test(
            "Set tax to 10% for sales test",
            "PUT",
            "settings",
            200,
            data={
                "tax_rate": 0.10,
                "tax_enabled": True,
                "currency": "USD"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )

        # Create a test sale
        sale_data = {
            "items": [
                {
                    "item_id": "test-item-1",
                    "item_name": "Test Phone",
                    "quantity": 1,
                    "price": 100.0,
                    "subtotal": 100.0
                }
            ],
            "payment_method": "cash",
            "created_by": "test_admin",
            "customer_name": "Test Customer"
        }

        success, sale_response = self.run_test(
            "Create sale with tax enabled",
            "POST",
            "sales",
            200,
            data=sale_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )

        if success:
            # Verify tax calculation
            expected_subtotal = 100.0
            expected_tax = 10.0  # 10% of 100
            expected_total = 110.0
            
            actual_subtotal = sale_response.get("subtotal")
            actual_tax = sale_response.get("tax")
            actual_total = sale_response.get("total")
            
            if actual_subtotal == expected_subtotal:
                self.log_test("Sale subtotal calculation", True)
            else:
                self.log_test("Sale subtotal calculation", False, f"Expected {expected_subtotal}, got {actual_subtotal}")
                
            if actual_tax == expected_tax:
                self.log_test("Sale tax calculation", True)
            else:
                self.log_test("Sale tax calculation", False, f"Expected {expected_tax}, got {actual_tax}")
                
            if actual_total == expected_total:
                self.log_test("Sale total calculation", True)
            else:
                self.log_test("Sale total calculation", False, f"Expected {expected_total}, got {actual_total}")

        # Test with tax disabled
        self.run_test(
            "Disable tax for next test",
            "PUT",
            "settings",
            200,
            data={
                "tax_rate": 0.10,
                "tax_enabled": False,
                "currency": "USD"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )

        success, sale_response_no_tax = self.run_test(
            "Create sale with tax disabled",
            "POST",
            "sales",
            200,
            data=sale_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )

        if success:
            # Verify no tax is applied
            expected_tax_disabled = 0.0
            expected_total_disabled = 100.0
            
            actual_tax_disabled = sale_response_no_tax.get("tax")
            actual_total_disabled = sale_response_no_tax.get("total")
            
            if actual_tax_disabled == expected_tax_disabled:
                self.log_test("Sale tax disabled calculation", True)
            else:
                self.log_test("Sale tax disabled calculation", False, f"Expected {expected_tax_disabled}, got {actual_tax_disabled}")
                
            if actual_total_disabled == expected_total_disabled:
                self.log_test("Sale total with tax disabled", True)
            else:
                self.log_test("Sale total with tax disabled", False, f"Expected {expected_total_disabled}, got {actual_total_disabled}")

        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Tax Settings API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Setup
        if not self.setup_users():
            print("❌ Failed to setup test users")
            return False
            
        # Run tests
        self.test_settings_endpoints()
        self.test_sales_with_tax()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TaxSettingsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())