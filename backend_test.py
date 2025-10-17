#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TechzonePOSAPITester:
    def __init__(self, base_url="https://techzone-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                return False, {"error": error_msg}

        except requests.exceptions.RequestException as e:
            return False, {"error": f"Request failed: {str(e)}"}

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with admin credentials
        login_data = {"username": "admin", "password": "admin123"}
        success, response = self.make_request("POST", "auth/login", login_data)
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            self.log_test("Admin Login", True, f"Logged in as {response['user']['username']}")
            
            # Test get current user
            success, response = self.make_request("GET", "auth/me")
            self.log_test("Get Current User", success, "Retrieved user profile" if success else response.get('error', ''))
        else:
            self.log_test("Admin Login", False, response.get('error', 'Login failed'))
            return False
        
        return True

    def test_customers(self):
        """Test customer management endpoints"""
        print("\n👥 Testing Customer Management...")
        
        # Get all customers
        success, customers = self.make_request("GET", "customers")
        self.log_test("Get All Customers", success, f"Retrieved {len(customers) if success else 0} customers")
        
        if not success:
            return False
        
        # Create new customer
        customer_data = {
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "email": "test@example.com",
            "phone": "555-0123",
            "address": "123 Test Street"
        }
        
        success, new_customer = self.make_request("POST", "customers", customer_data, 200)
        customer_id = None
        if success:
            customer_id = new_customer['id']
            self.log_test("Create Customer", True, f"Created customer with ID: {customer_id}")
            
            # Get customer details with repair history
            success, customer_details = self.make_request("GET", f"customers/{customer_id}")
            self.log_test("Get Customer Details", success, "Retrieved customer with repair history" if success else "Failed to get details")
            
            # Update customer
            update_data = {"name": "Updated Test Customer", "phone": "555-9999"}
            success, _ = self.make_request("PUT", f"customers/{customer_id}", update_data)
            self.log_test("Update Customer", success, "Customer updated successfully" if success else "Update failed")
            
            # Delete customer
            success, _ = self.make_request("DELETE", f"customers/{customer_id}")
            self.log_test("Delete Customer", success, "Customer deleted successfully" if success else "Delete failed")
        else:
            self.log_test("Create Customer", False, new_customer.get('error', ''))
        
        return True

    def test_inventory(self):
        """Test inventory management endpoints"""
        print("\n📦 Testing Inventory Management...")
        
        # Get all inventory items
        success, items = self.make_request("GET", "inventory")
        self.log_test("Get All Inventory", success, f"Retrieved {len(items) if success else 0} items")
        
        if not success:
            return False
        
        # Create new inventory item
        item_data = {
            "name": f"Test Phone {datetime.now().strftime('%H%M%S')}",
            "type": "phone",
            "sku": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "quantity": 10,
            "cost_price": 100.00,
            "selling_price": 150.00,
            "supplier": "Test Supplier",
            "low_stock_threshold": 5
        }
        
        success, new_item = self.make_request("POST", "inventory", item_data, 200)
        item_id = None
        if success:
            item_id = new_item['id']
            self.log_test("Create Inventory Item", True, f"Created item with ID: {item_id}")
            
            # Get specific item
            success, item_details = self.make_request("GET", f"inventory/{item_id}")
            self.log_test("Get Inventory Item", success, "Retrieved item details" if success else "Failed to get item")
            
            # Update item
            update_data = {"quantity": 5, "selling_price": 175.00}
            success, _ = self.make_request("PUT", f"inventory/{item_id}", update_data)
            self.log_test("Update Inventory Item", success, "Item updated successfully" if success else "Update failed")
            
            # Get low stock items
            success, low_stock = self.make_request("GET", "inventory/low-stock")
            self.log_test("Get Low Stock Items", success, f"Found {len(low_stock) if success else 0} low stock items")
            
            # Delete item
            success, _ = self.make_request("DELETE", f"inventory/{item_id}")
            self.log_test("Delete Inventory Item", success, "Item deleted successfully" if success else "Delete failed")
        else:
            self.log_test("Create Inventory Item", False, new_item.get('error', ''))
        
        return True

    def test_repairs(self):
        """Test repair job management endpoints"""
        print("\n🔧 Testing Repair Job Management...")
        
        # First get customers to use for repair job
        success, customers = self.make_request("GET", "customers")
        if not success or not customers:
            self.log_test("Get Customers for Repair", False, "No customers available for repair job test")
            return False
        
        customer_id = customers[0]['id']
        
        # Get all repair jobs
        success, repairs = self.make_request("GET", "repairs")
        self.log_test("Get All Repair Jobs", success, f"Retrieved {len(repairs) if success else 0} repair jobs")
        
        # Create new repair job
        repair_data = {
            "customer_id": customer_id,
            "device": "iPhone 13 Pro",
            "issue_description": "Screen cracked, needs replacement",
            "cost": 250.00,
            "assigned_technician": "John Doe",
            "notes": "Customer wants same-day service"
        }
        
        success, new_repair = self.make_request("POST", "repairs", repair_data, 200)
        repair_id = None
        if success:
            repair_id = new_repair['id']
            self.log_test("Create Repair Job", True, f"Created repair job with ID: {repair_id}")
            
            # Get specific repair job
            success, repair_details = self.make_request("GET", f"repairs/{repair_id}")
            self.log_test("Get Repair Job", success, "Retrieved repair details" if success else "Failed to get repair")
            
            # Update repair job status
            update_data = {"status": "in-progress", "notes": "Started working on device"}
            success, _ = self.make_request("PUT", f"repairs/{repair_id}", update_data)
            self.log_test("Update Repair Job", success, "Repair job updated successfully" if success else "Update failed")
            
            # Delete repair job
            success, _ = self.make_request("DELETE", f"repairs/{repair_id}")
            self.log_test("Delete Repair Job", success, "Repair job deleted successfully" if success else "Delete failed")
        else:
            self.log_test("Create Repair Job", False, new_repair.get('error', ''))
        
        return True

    def test_sales(self):
        """Test sales and POS endpoints"""
        print("\n💰 Testing Sales & POS...")
        
        # Get inventory items for sale
        success, items = self.make_request("GET", "inventory")
        if not success or not items:
            self.log_test("Get Inventory for Sale", False, "No inventory items available for sale test")
            return False
        
        # Use first available item
        item = items[0]
        
        # Get all sales
        success, sales = self.make_request("GET", "sales")
        self.log_test("Get All Sales", success, f"Retrieved {len(sales) if success else 0} sales")
        
        # Create cash sale
        sale_items = [{
            "item_id": item['id'],
            "item_name": item['name'],
            "quantity": 1,
            "price": item['selling_price'],
            "subtotal": item['selling_price']
        }]
        
        sale_data = {
            "items": sale_items,
            "payment_method": "cash",
            "created_by": self.user_data['username']
        }
        
        success, new_sale = self.make_request("POST", "sales", sale_data, 200)
        if success:
            sale_id = new_sale['id']
            self.log_test("Create Cash Sale", True, f"Created cash sale with ID: {sale_id}")
            
            # Get specific sale
            success, sale_details = self.make_request("GET", f"sales/{sale_id}")
            self.log_test("Get Sale Details", success, "Retrieved sale details" if success else "Failed to get sale")
        else:
            self.log_test("Create Cash Sale", False, new_sale.get('error', ''))
        
        return True

    def test_stripe_payments(self):
        """Test Stripe payment integration"""
        print("\n💳 Testing Stripe Payment Integration...")
        
        # Get inventory items for sale
        success, items = self.make_request("GET", "inventory")
        if not success or not items:
            self.log_test("Get Inventory for Stripe Sale", False, "No inventory items available")
            return False
        
        item = items[0]
        
        # Create stripe sale
        sale_items = [{
            "item_id": item['id'],
            "item_name": item['name'],
            "quantity": 1,
            "price": item['selling_price'],
            "subtotal": item['selling_price']
        }]
        
        sale_data = {
            "items": sale_items,
            "payment_method": "stripe",
            "created_by": self.user_data['username']
        }
        
        success, new_sale = self.make_request("POST", "sales", sale_data, 201)
        if success:
            sale_id = new_sale['id']
            self.log_test("Create Stripe Sale", True, f"Created stripe sale with ID: {sale_id}")
            
            # Create checkout session
            checkout_data = {
                "sale_id": sale_id,
                "origin_url": self.base_url
            }
            
            success, checkout_response = self.make_request("POST", "payments/checkout", checkout_data)
            if success and 'url' in checkout_response:
                self.log_test("Create Checkout Session", True, f"Checkout URL created: {checkout_response['url'][:50]}...")
                
                # Test payment status check
                session_id = checkout_response['session_id']
                success, status_response = self.make_request("GET", f"payments/status/{session_id}")
                self.log_test("Check Payment Status", success, f"Payment status: {status_response.get('payment_status', 'unknown')}" if success else "Status check failed")
            else:
                self.log_test("Create Checkout Session", False, checkout_response.get('error', ''))
        else:
            self.log_test("Create Stripe Sale", False, new_sale.get('error', ''))
        
        return True

    def test_reports(self):
        """Test reporting endpoints"""
        print("\n📊 Testing Reports & Analytics...")
        
        # Test daily sales report
        success, daily_sales = self.make_request("GET", "reports/daily-sales")
        self.log_test("Daily Sales Report", success, f"Today's sales: ${daily_sales.get('total_sales', 0):.2f}" if success else "Report failed")
        
        # Test dashboard stats
        success, dashboard_stats = self.make_request("GET", "reports/dashboard-stats")
        if success:
            stats_summary = f"Sales: ${dashboard_stats.get('today_sales', 0):.2f}, Repairs: {dashboard_stats.get('pending_repairs', 0)}, Low Stock: {dashboard_stats.get('low_stock_items', 0)}"
            self.log_test("Dashboard Stats", True, stats_summary)
        else:
            self.log_test("Dashboard Stats", False, dashboard_stats.get('error', ''))
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Techzone POS API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all other tests
        self.test_customers()
        self.test_inventory()
        self.test_repairs()
        self.test_sales()
        self.test_stripe_payments()
        self.test_reports()
        
        # Print summary
        print(f"\n📋 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TechzonePOSAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())