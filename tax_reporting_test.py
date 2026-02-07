import requests
import sys
import json
from datetime import datetime, timezone, timedelta

class TaxReportingTester:
    def __init__(self, base_url="https://zero-tax-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_user = {"username": "admin", "password": "admin123"}
        self.created_items = []
        self.created_sales = []

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

    def setup_tax_environment(self):
        """Set up tax environment with enabled tax and exemptions"""
        print("\n=== SETTING UP TAX ENVIRONMENT ===")
        
        # Enable tax with 10% rate and exempt categories
        tax_data = {
            "tax_rate": 0.10,  # 10% tax
            "tax_enabled": True,
            "tax_exempt_categories": ["part", "screen"]
        }
        
        success, response = self.run_test(
            "Enable Tax with Exemptions",
            "PUT",
            "settings",
            200,
            data=tax_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"Tax settings: {json.dumps(response, indent=2)}")
        return success

    def create_test_inventory(self):
        """Create test inventory items for different categories"""
        print("\n=== CREATING TEST INVENTORY FOR REPORTING ===")
        
        test_items = [
            {
                "name": "Report Test iPhone",
                "type": "phone",  # Taxable
                "sku": "RPT-PHONE-001",
                "quantity": 100,
                "cost_price": 800.0,
                "selling_price": 1000.0
            },
            {
                "name": "Report Test Screen",
                "type": "screen",  # Tax exempt
                "sku": "RPT-SCREEN-001",
                "quantity": 100,
                "cost_price": 50.0,
                "selling_price": 100.0
            },
            {
                "name": "Report Test Part",
                "type": "part",  # Tax exempt
                "sku": "RPT-PART-001",
                "quantity": 100,
                "cost_price": 20.0,
                "selling_price": 40.0
            },
            {
                "name": "Report Test Accessory",
                "type": "accessory",  # Taxable
                "sku": "RPT-ACC-001",
                "quantity": 100,
                "cost_price": 5.0,
                "selling_price": 15.0
            }
        ]
        
        created_items = []
        for item_data in test_items:
            success, response = self.run_test(
                f"Create {item_data['name']}",
                "POST",
                "inventory",
                200,
                data=item_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if success:
                created_items.append(response)
                self.created_items.append(response)
                print(f"✅ Created: {item_data['name']} ({item_data['type']})")
            else:
                print(f"❌ Failed to create: {item_data['name']}")
        
        return created_items

    def create_test_sales(self, inventory_items):
        """Create test sales with different combinations"""
        print("\n=== CREATING TEST SALES FOR REPORTING ===")
        
        if len(inventory_items) < 4:
            print("❌ Not enough inventory items for sales test")
            return False

        # Create multiple sales with different item combinations
        sales_scenarios = [
            {
                "name": "Taxable Only Sale",
                "items": [inventory_items[0], inventory_items[3]],  # phone + accessory
                "quantities": [1, 2]
            },
            {
                "name": "Exempt Only Sale", 
                "items": [inventory_items[1], inventory_items[2]],  # screen + part
                "quantities": [1, 1]
            },
            {
                "name": "Mixed Sale",
                "items": inventory_items,  # All items
                "quantities": [1, 1, 1, 1]
            }
        ]

        created_sales = []
        for scenario in sales_scenarios:
            sale_items = []
            for i, item in enumerate(scenario["items"]):
                quantity = scenario["quantities"][i]
                sale_items.append({
                    "item_id": item['id'],
                    "item_name": item['name'],
                    "quantity": quantity,
                    "price": item['selling_price'],
                    "subtotal": item['selling_price'] * quantity
                })

            sale_data = {
                "items": sale_items,
                "payment_method": "cash",
                "created_by": "admin"
            }

            success, response = self.run_test(
                f"Create {scenario['name']}",
                "POST",
                "sales",
                200,
                data=sale_data,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )

            if success:
                created_sales.append(response)
                self.created_sales.append(response)
                print(f"✅ Created sale: {scenario['name']} - Tax: ${response.get('tax', 0):.2f}")
            else:
                print(f"❌ Failed to create: {scenario['name']}")

        return len(created_sales) > 0

    def test_tax_summary_endpoint(self):
        """Test GET /api/reports/tax-summary endpoint"""
        print("\n=== TESTING TAX SUMMARY ENDPOINT ===")
        
        success, response = self.run_test(
            "Get Tax Summary Report",
            "GET",
            "reports/tax-summary",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"Tax summary response: {json.dumps(response, indent=2)}")
            
            # Verify required fields exist
            required_fields = [
                'tax_enabled', 'tax_rate', 'exempt_categories',
                'daily', 'weekly', 'monthly', 'category_breakdown', 'taxable_vs_exempt'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test("Tax summary has all required fields", True)
            else:
                self.log_test("Tax summary has all required fields", False, 
                            f"Missing fields: {missing_fields}")
            
            # Verify daily/weekly/monthly structure
            time_periods = ['daily', 'weekly', 'monthly']
            for period in time_periods:
                if period in response:
                    period_data = response[period]
                    required_period_fields = ['tax_collected', 'total_sales', 'transactions']
                    
                    period_missing = []
                    for field in required_period_fields:
                        if field not in period_data:
                            period_missing.append(field)
                    
                    if not period_missing:
                        self.log_test(f"{period.capitalize()} period has required fields", True)
                    else:
                        self.log_test(f"{period.capitalize()} period has required fields", False,
                                    f"Missing: {period_missing}")
            
            # Verify category breakdown structure
            if 'category_breakdown' in response and response['category_breakdown']:
                category = response['category_breakdown'][0]
                required_cat_fields = ['category', 'sales', 'is_exempt', 'tax_collected']
                
                cat_missing = []
                for field in required_cat_fields:
                    if field not in category:
                        cat_missing.append(field)
                
                if not cat_missing:
                    self.log_test("Category breakdown has required fields", True)
                else:
                    self.log_test("Category breakdown has required fields", False,
                                f"Missing: {cat_missing}")
            
            # Verify taxable vs exempt structure
            if 'taxable_vs_exempt' in response:
                tvs_data = response['taxable_vs_exempt']
                required_tvs_fields = ['taxable_sales', 'exempt_sales', 'effective_tax_collected']
                
                tvs_missing = []
                for field in required_tvs_fields:
                    if field not in tvs_data:
                        tvs_missing.append(field)
                
                if not tvs_missing:
                    self.log_test("Taxable vs exempt has required fields", True)
                else:
                    self.log_test("Taxable vs exempt has required fields", False,
                                f"Missing: {tvs_missing}")
        
        return success

    def test_tax_summary_calculations(self):
        """Test that tax summary calculations are correct"""
        print("\n=== TESTING TAX SUMMARY CALCULATIONS ===")
        
        success, response = self.run_test(
            "Get Tax Summary for Calculation Check",
            "GET",
            "reports/tax-summary",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if not success:
            return False
        
        # Check that tax calculations make sense
        daily_data = response.get('daily', {})
        weekly_data = response.get('weekly', {})
        monthly_data = response.get('monthly', {})
        
        # Daily should be <= Weekly should be <= Monthly
        daily_tax = daily_data.get('tax_collected', 0)
        weekly_tax = weekly_data.get('tax_collected', 0)
        monthly_tax = monthly_data.get('tax_collected', 0)
        
        if daily_tax <= weekly_tax <= monthly_tax:
            self.log_test("Tax collection progression (daily <= weekly <= monthly)", True)
        else:
            self.log_test("Tax collection progression (daily <= weekly <= monthly)", False,
                        f"Daily: ${daily_tax}, Weekly: ${weekly_tax}, Monthly: ${monthly_tax}")
        
        # Check category breakdown totals
        category_breakdown = response.get('category_breakdown', [])
        if category_breakdown:
            total_category_sales = sum(cat['sales'] for cat in category_breakdown)
            total_category_tax = sum(cat['tax_collected'] for cat in category_breakdown)
            
            # Should match monthly totals (approximately)
            monthly_sales = monthly_data.get('total_sales', 0)
            monthly_tax_collected = monthly_data.get('tax_collected', 0)
            
            sales_match = abs(total_category_sales - monthly_sales) < 0.01
            tax_match = abs(total_category_tax - monthly_tax_collected) < 0.01
            
            if sales_match and tax_match:
                self.log_test("Category breakdown totals match monthly totals", True)
            else:
                self.log_test("Category breakdown totals match monthly totals", False,
                            f"Category sales: ${total_category_sales}, Monthly: ${monthly_sales}; "
                            f"Category tax: ${total_category_tax}, Monthly: ${monthly_tax_collected}")
        
        # Check taxable vs exempt totals
        tvs_data = response.get('taxable_vs_exempt', {})
        if tvs_data:
            taxable_sales = tvs_data.get('taxable_sales', 0)
            exempt_sales = tvs_data.get('exempt_sales', 0)
            effective_tax = tvs_data.get('effective_tax_collected', 0)
            
            # Effective tax should be approximately taxable_sales * tax_rate
            expected_tax = taxable_sales * response.get('tax_rate', 0)
            
            if abs(effective_tax - expected_tax) < 0.01:
                self.log_test("Effective tax calculation is correct", True,
                            f"Taxable: ${taxable_sales}, Rate: {response.get('tax_rate', 0)*100}%, Tax: ${effective_tax}")
            else:
                self.log_test("Effective tax calculation is correct", False,
                            f"Expected: ${expected_tax}, Got: ${effective_tax}")
        
        return True

    def test_category_exemption_logic(self):
        """Test that category exemption logic works correctly in reports"""
        print("\n=== TESTING CATEGORY EXEMPTION LOGIC IN REPORTS ===")
        
        success, response = self.run_test(
            "Get Tax Summary for Exemption Check",
            "GET",
            "reports/tax-summary",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if not success:
            return False
        
        # Check that exempt categories are correctly identified
        exempt_categories = response.get('exempt_categories', [])
        category_breakdown = response.get('category_breakdown', [])
        
        for category in category_breakdown:
            cat_name = category.get('category', '')
            is_exempt = category.get('is_exempt', False)
            tax_collected = category.get('tax_collected', 0)
            
            # If category is in exempt list, it should be marked as exempt and have no tax
            if cat_name.lower() in [c.lower() for c in exempt_categories]:
                if is_exempt and tax_collected == 0:
                    self.log_test(f"Category '{cat_name}' correctly exempt", True)
                else:
                    self.log_test(f"Category '{cat_name}' correctly exempt", False,
                                f"is_exempt: {is_exempt}, tax_collected: {tax_collected}")
            else:
                # Non-exempt categories should have tax if there are sales
                if not is_exempt:
                    self.log_test(f"Category '{cat_name}' correctly taxable", True)
                else:
                    self.log_test(f"Category '{cat_name}' correctly taxable", False,
                                f"Should be taxable but marked as exempt")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete test inventory items
        for item in self.created_items:
            try:
                success, _ = self.run_test(
                    f"Delete {item['name']}",
                    "DELETE",
                    f"inventory/{item['id']}",
                    200,
                    headers={"Authorization": f"Bearer {self.admin_token}"}
                )
                if success:
                    print(f"✅ Deleted inventory: {item['name']}")
            except Exception as e:
                print(f"❌ Error deleting inventory {item['name']}: {e}")
        
        # Note: We don't delete sales as they are historical data
        print(f"ℹ️  Created {len(self.created_sales)} test sales (kept for historical data)")

    def run_all_tests(self):
        """Run all tax reporting tests"""
        print("🚀 Starting Tax Reporting API Tests")
        print("=" * 50)
        
        # Test sequence
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin login")
            return 1
        
        if not self.setup_tax_environment():
            print("❌ Cannot proceed without tax environment setup")
            return 1
        
        inventory_items = self.create_test_inventory()
        if not inventory_items:
            print("❌ Cannot proceed without test inventory")
            return 1
        
        if not self.create_test_sales(inventory_items):
            print("❌ Cannot proceed without test sales")
            return 1
        
        # Main reporting tests
        tests = [
            ("Tax Summary Endpoint", self.test_tax_summary_endpoint),
            ("Tax Summary Calculations", self.test_tax_summary_calculations),
            ("Category Exemption Logic", self.test_category_exemption_logic)
        ]
        
        for test_name, test_func in tests:
            try:
                print(f"\n{'='*20} {test_name} {'='*20}")
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
        
        # Cleanup
        self.cleanup_test_data()
        
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
            print("\n🎉 All tax reporting tests passed!")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = TaxReportingTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())