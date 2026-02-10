import requests
import sys
import json
from datetime import datetime

class TechZoneAPITester:
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
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Response: {response.text[:200]}"
            
            result = self.log_test(name, success, details)
            
            if success and response.text:
                try:
                    return result, response.json()
                except:
                    return result, response.text
            return result, {}

        except Exception as e:
            return self.log_test(name, False, f"Exception: {str(e)}"), {}

    def test_admin_login(self):
        """Test admin login to get token"""
        print("\n=== TESTING ADMIN LOGIN ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.admin_user
        )
        if success and isinstance(response, dict) and 'token' in response:
            self.admin_token = response['token']
            print(f"✅ Admin token obtained: {self.admin_token[:20]}...")
            return True
        else:
            print("❌ Failed to get admin token")
            return False

    def test_get_coupons(self):
        """Test GET /api/coupons"""
        print("\n=== TESTING GET COUPONS ===")
        success, response = self.run_test(
            "GET /api/coupons - List all coupons",
            "GET",
            "coupons",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success:
            coupons = response if isinstance(response, list) else []
            print(f"Found {len(coupons)} existing coupons")
            for coupon in coupons:
                print(f"  - {coupon.get('code', 'N/A')}: {coupon.get('description', 'No description')}")
        return success, response

    def test_create_coupon(self):
        """Test POST /api/coupons"""
        print("\n=== TESTING CREATE COUPON ===")
        test_coupon = {
            "code": "TEST10",
            "description": "Test 10% discount coupon",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_purchase": 25,
            "max_discount": 50,
            "usage_limit": 100,
            "is_active": True
        }
        
        success, response = self.run_test(
            "POST /api/coupons - Create new coupon",
            "POST",
            "coupons",
            200,
            data=test_coupon,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and isinstance(response, dict):
            print(f"Created coupon: {response.get('code')} with ID: {response.get('id')}")
            return success, response
        return success, {}

    def test_create_duplicate_coupon(self):
        """Test creating duplicate coupon code (should fail)"""
        print("\n=== TESTING DUPLICATE COUPON CREATION ===")
        duplicate_coupon = {
            "code": "TEST10",  # Same as above
            "description": "Duplicate test coupon",
            "discount_type": "fixed",
            "discount_value": 5,
            "is_active": True
        }
        
        success, response = self.run_test(
            "POST /api/coupons - Create duplicate coupon (should fail)",
            "POST",
            "coupons",
            400,  # Should fail with 400
            data=duplicate_coupon,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_validate_existing_coupon(self):
        """Test POST /api/coupons/validate with existing SAVE20 coupon"""
        print("\n=== TESTING COUPON VALIDATION (SAVE20) ===")
        validation_data = {
            "code": "SAVE20",
            "subtotal": 100  # Should meet minimum purchase requirement
        }
        
        success, response = self.run_test(
            "POST /api/coupons/validate - Validate SAVE20 coupon",
            "POST",
            "coupons/validate",
            200,
            data=validation_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and isinstance(response, dict):
            discount = response.get('discount', 0)
            coupon_info = response.get('coupon', {})
            print(f"Validation successful - Discount: ${discount}, Coupon: {coupon_info.get('code')}")
        return success, response

    def test_validate_invalid_coupon(self):
        """Test validating invalid coupon (should fail)"""
        print("\n=== TESTING INVALID COUPON VALIDATION ===")
        validation_data = {
            "code": "INVALID123",
            "subtotal": 100
        }
        
        success, response = self.run_test(
            "POST /api/coupons/validate - Invalid coupon (should fail)",
            "POST",
            "coupons/validate",
            404,  # Should fail with 404
            data=validation_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_validate_insufficient_purchase(self):
        """Test coupon with insufficient purchase amount (should fail)"""
        print("\n=== TESTING INSUFFICIENT PURCHASE AMOUNT ===")
        validation_data = {
            "code": "SAVE20",
            "subtotal": 10  # Below minimum purchase of $50
        }
        
        success, response = self.run_test(
            "POST /api/coupons/validate - Insufficient purchase (should fail)",
            "POST",
            "coupons/validate",
            400,  # Should fail with 400
            data=validation_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_update_coupon(self, coupon_id):
        """Test PUT /api/coupons/{id}"""
        print(f"\n=== TESTING UPDATE COUPON {coupon_id} ===")
        update_data = {
            "description": "Updated test coupon description",
            "discount_value": 15,
            "is_active": False
        }
        
        success, response = self.run_test(
            f"PUT /api/coupons/{coupon_id} - Update coupon",
            "PUT",
            f"coupons/{coupon_id}",
            200,
            data=update_data,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and isinstance(response, dict):
            print(f"Updated coupon: {response.get('code')} - Active: {response.get('is_active')}")
        return success, response

    def test_delete_coupon(self, coupon_id):
        """Test DELETE /api/coupons/{id}"""
        print(f"\n=== TESTING DELETE COUPON {coupon_id} ===")
        success, response = self.run_test(
            f"DELETE /api/coupons/{coupon_id} - Delete coupon",
            "DELETE",
            f"coupons/{coupon_id}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_increment_usage(self, coupon_id):
        """Test POST /api/coupons/{id}/increment-usage"""
        print(f"\n=== TESTING INCREMENT USAGE {coupon_id} ===")
        success, response = self.run_test(
            f"POST /api/coupons/{coupon_id}/increment-usage - Increment usage count",
            "POST",
            f"coupons/{coupon_id}/increment-usage",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_coupon_analytics(self):
        """Test GET /api/reports/coupon-analytics"""
        print("\n=== TESTING COUPON ANALYTICS ===")
        success, response = self.run_test(
            "GET /api/reports/coupon-analytics - Get coupon usage analytics",
            "GET",
            "reports/coupon-analytics",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and isinstance(response, dict):
            # Validate analytics structure
            summary = response.get('summary', {})
            coupon_breakdown = response.get('coupon_breakdown', [])
            all_coupons_status = response.get('all_coupons_status', [])
            
            print(f"Analytics Summary:")
            print(f"  - Total Coupons: {summary.get('total_coupons', 0)}")
            print(f"  - Active Coupons: {summary.get('active_coupons', 0)}")
            print(f"  - Usage Rate: {summary.get('coupon_usage_rate', 0)}%")
            print(f"  - Total Discount Given: ${summary.get('total_discount_given', 0)}")
            print(f"  - Sales with Coupons: {summary.get('sales_with_coupons', 0)}")
            
            # Validate required fields exist
            required_summary_fields = ['total_coupons', 'active_coupons', 'coupon_usage_rate', 
                                     'total_discount_given', 'sales_with_coupons', 'month']
            missing_fields = [field for field in required_summary_fields if field not in summary]
            
            if missing_fields:
                print(f"❌ Missing summary fields: {missing_fields}")
                return False, response
            
            print(f"  - Coupon Breakdown: {len(coupon_breakdown)} entries")
            print(f"  - All Coupons Status: {len(all_coupons_status)} entries")
            
            # Check if SAVE20 coupon appears in analytics (should exist from context)
            save20_found = any(c.get('code') == 'SAVE20' for c in all_coupons_status)
            if save20_found:
                print("✅ SAVE20 coupon found in analytics")
            else:
                print("⚠️  SAVE20 coupon not found in analytics")
        
        return success, response

    def test_sales_with_coupon_tracking(self):
        """Test that sales properly track coupon usage"""
        print("\n=== TESTING SALES WITH COUPON TRACKING ===")
        
        # First get existing sales to check coupon tracking
        success, response = self.run_test(
            "GET /api/sales - Check sales with coupon tracking",
            "GET",
            "sales",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success and isinstance(response, list):
            sales_with_coupons = [s for s in response if s.get('coupon_code')]
            print(f"Found {len(sales_with_coupons)} sales with coupons out of {len(response)} total sales")
            
            for sale in sales_with_coupons[:3]:  # Show first 3
                print(f"  - Sale {sale.get('id', 'N/A')[:8]}: {sale.get('coupon_code')} (${sale.get('discount', 0)} discount)")
            
            # Validate sale structure includes coupon fields
            if sales_with_coupons:
                sample_sale = sales_with_coupons[0]
                required_fields = ['coupon_code', 'discount', 'coupon_id']
                missing_fields = [field for field in required_fields if field not in sample_sale]
                
                if missing_fields:
                    print(f"❌ Missing coupon fields in sales: {missing_fields}")
                    return False, response
                else:
                    print("✅ Sales properly track coupon information")
        
        return success, response

    def run_all_tests(self):
        """Run all coupon API tests"""
        print("🧪 Starting Coupon API Testing...")
        print("=" * 60)
        
        # Test login first
        if not self.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return False

        # Test GET coupons
        success, coupons = self.test_get_coupons()
        
        # Test create coupon
        success, new_coupon = self.test_create_coupon()
        coupon_id = None
        if success and isinstance(new_coupon, dict) and 'id' in new_coupon:
            coupon_id = new_coupon['id']
        
        # Test duplicate coupon creation (should fail)
        self.test_create_duplicate_coupon()
        
        # Test coupon validation with existing SAVE20
        self.test_validate_existing_coupon()
        
        # Test invalid coupon validation
        self.test_validate_invalid_coupon()
        
        # Test insufficient purchase amount
        self.test_validate_insufficient_purchase()
        
        # Test coupon analytics endpoint
        self.test_coupon_analytics()
        
        # Test sales with coupon tracking
        self.test_sales_with_coupon_tracking()
        
        # Test update and delete if we created a coupon
        if coupon_id:
            # Test increment usage
            self.test_increment_usage(coupon_id)
            
            # Test update coupon
            self.test_update_coupon(coupon_id)
            
            # Test delete coupon
            self.test_delete_coupon(coupon_id)
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 FINAL RESULTS")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if r['status'] == 'FAILED']
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 ALL TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CouponAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())