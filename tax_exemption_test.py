#!/usr/bin/env python3

import requests
import sys
import json

class TaxExemptionFocusedTester:
    def __init__(self, base_url="https://zero-tax-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def login(self):
        """Login as admin"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                self.token = response.json()['token']
                print("✅ Admin login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False

    def get_headers(self):
        return {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}

    def test_tax_exempt_categories_api(self):
        """Test tax exempt categories API endpoints"""
        print("\n🔍 Testing Tax Exempt Categories API...")
        
        # 1. Test GET /api/settings returns tax_exempt_categories
        try:
            response = requests.get(f"{self.api_url}/settings", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                if 'tax_exempt_categories' in data:
                    self.log_test("GET /api/settings returns tax_exempt_categories array", True,
                                f"Current: {data['tax_exempt_categories']}")
                else:
                    self.log_test("GET /api/settings returns tax_exempt_categories array", False,
                                "Field missing")
                    return False
            else:
                self.log_test("GET /api/settings returns tax_exempt_categories array", False,
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /api/settings returns tax_exempt_categories array", False, str(e))
            return False

        # 2. Test PUT /api/settings can update tax_exempt_categories
        try:
            update_data = {
                "tax_enabled": True,
                "tax_rate": 0.10,
                "tax_exempt_categories": ["part", "screen"]
            }
            
            response = requests.put(f"{self.api_url}/settings", 
                                  json=update_data, headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                expected = ["part", "screen"]
                actual = data.get('tax_exempt_categories', [])
                
                if set(actual) == set(expected):
                    self.log_test("PUT /api/settings can update tax_exempt_categories", True,
                                f"Set to: {actual}")
                else:
                    self.log_test("PUT /api/settings can update tax_exempt_categories", False,
                                f"Expected {expected}, got {actual}")
                    return False
            else:
                self.log_test("PUT /api/settings can update tax_exempt_categories", False,
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("PUT /api/settings can update tax_exempt_categories", False, str(e))
            return False

        return True

    def create_test_items(self):
        """Create test inventory items"""
        print("\n📦 Creating test inventory items...")
        
        items = [
            {"name": "Test Phone", "type": "phone", "sku": "TP001", "quantity": 10, 
             "cost_price": 500.0, "selling_price": 800.0},
            {"name": "Test Screen", "type": "screen", "sku": "TS001", "quantity": 20, 
             "cost_price": 40.0, "selling_price": 80.0},
            {"name": "Test Part", "type": "part", "sku": "TPT001", "quantity": 15, 
             "cost_price": 10.0, "selling_price": 25.0},
            {"name": "Test Accessory", "type": "accessory", "sku": "TA001", "quantity": 25, 
             "cost_price": 3.0, "selling_price": 10.0}
        ]
        
        created = []
        for item in items:
            try:
                response = requests.post(f"{self.api_url}/inventory", 
                                       json=item, headers=self.get_headers())
                if response.status_code == 200:
                    created.append(response.json())
                    print(f"✅ Created: {item['name']} ({item['type']})")
                else:
                    print(f"❌ Failed to create {item['name']}: {response.status_code}")
            except Exception as e:
                print(f"❌ Error creating {item['name']}: {e}")
        
        return created

    def test_sales_tax_calculation(self, items):
        """Test sales tax calculation with exemptions"""
        print("\n💰 Testing sales tax calculation...")
        
        if len(items) < 4:
            self.log_test("Sales API calculates tax only on non-exempt items", False,
                        "Not enough test items")
            return False

        # Create sale with all item types
        sale_items = []
        total_subtotal = 0
        expected_taxable = 0
        
        for item in items:
            sale_items.append({
                "item_id": item['id'],
                "item_name": item['name'],
                "quantity": 1,
                "price": item['selling_price'],
                "subtotal": item['selling_price']
            })
            
            total_subtotal += item['selling_price']
            
            # Only phone and accessory should be taxable (not part or screen)
            if item['type'] not in ['part', 'screen']:
                expected_taxable += item['selling_price']

        sale_data = {
            "items": sale_items,
            "payment_method": "cash",
            "created_by": "admin"
        }

        try:
            response = requests.post(f"{self.api_url}/sales", 
                                   json=sale_data, headers=self.get_headers())
            
            if response.status_code == 200:
                sale = response.json()
                
                actual_subtotal = sale.get('subtotal', 0)
                actual_tax = sale.get('tax', 0)
                actual_total = sale.get('total', 0)
                
                expected_tax = expected_taxable * 0.10  # 10% tax
                expected_total = total_subtotal + expected_tax
                
                print(f"  Subtotal: ${actual_subtotal:.2f}")
                print(f"  Taxable amount: ${expected_taxable:.2f}")
                print(f"  Tax: ${actual_tax:.2f} (expected: ${expected_tax:.2f})")
                print(f"  Total: ${actual_total:.2f} (expected: ${expected_total:.2f})")
                
                # Check if calculations are correct
                tax_correct = abs(actual_tax - expected_tax) < 0.01
                total_correct = abs(actual_total - expected_total) < 0.01
                
                if tax_correct and total_correct:
                    self.log_test("Sales API calculates tax only on non-exempt items", True,
                                f"Correctly taxed ${expected_taxable:.2f} of ${total_subtotal:.2f}")
                    return True
                else:
                    self.log_test("Sales API calculates tax only on non-exempt items", False,
                                f"Tax calculation incorrect")
                    return False
            else:
                self.log_test("Sales API calculates tax only on non-exempt items", False,
                            f"Sale creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Sales API calculates tax only on non-exempt items", False, str(e))
            return False

    def cleanup_items(self, items):
        """Clean up test items"""
        print("\n🧹 Cleaning up test items...")
        for item in items:
            try:
                requests.delete(f"{self.api_url}/inventory/{item['id']}", 
                              headers=self.get_headers())
                print(f"✅ Deleted: {item['name']}")
            except:
                pass

    def run_tests(self):
        """Run all tax exemption tests"""
        print("🧪 Tax Exemption Feature Tests")
        print("=" * 40)
        
        if not self.login():
            return False
        
        # Test API endpoints
        if not self.test_tax_exempt_categories_api():
            return False
        
        # Test integration
        items = self.create_test_items()
        if items:
            self.test_sales_tax_calculation(items)
            self.cleanup_items(items)
        
        # Results
        print(f"\n📊 Results: {self.tests_passed}/{self.tests_run} passed")
        return self.tests_passed == self.tests_run

def main():
    tester = TaxExemptionFocusedTester()
    success = tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())