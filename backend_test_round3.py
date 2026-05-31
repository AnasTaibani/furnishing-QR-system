#!/usr/bin/env python3
"""
Backend API Test Suite for Enhancement Round 3
Tests endUse array, repeat field, CSV bulk import, and security
"""

import requests
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://barcode-furnish.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Admin credentials (updated for round 3)
ADMIN_USERNAME = "luxurandlavish"
ADMIN_PASSWORD = "a1b2c3d4"

# Test data storage
test_data = {
    'catalogue_id': None,
    'product_id': None,
    'product_code': None,
    'bulk_product_codes': []
}

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_1_login():
    """Test 1: Login with new credentials"""
    print_test_header("1. Login with luxurandlavish/a1b2c3d4")
    
    try:
        session = requests.Session()
        response = session.post(
            f"{API_BASE}/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            if 'admin-token' in session.cookies:
                print_result(True, f"Login successful, cookie 'admin-token' set")
                return True, session
            else:
                print_result(False, f"Login returned 200 but cookie not set")
                return False, None
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False, None

def test_2_get_aurora_catalogue(session):
    """Test 2: Get Aurora catalogue for testing"""
    print_test_header("2. Get Aurora Catalogue")
    
    try:
        response = session.get(f"{API_BASE}/catalogues", timeout=10)
        
        if response.status_code == 200:
            catalogues = response.json()
            aurora = next((c for c in catalogues if 'Aurora' in c.get('catalogueName', '')), None)
            
            if aurora:
                test_data['catalogue_id'] = aurora['id']
                print_result(True, f"Found Aurora catalogue: {aurora['catalogueName']}")
                print(f"  - Catalogue ID: {aurora['id']}")
                return True
            else:
                print_result(False, f"Aurora catalogue not found")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_3_create_product_enduse_array(session):
    """Test 3: Create product with endUse as array ["sofas","curtains"]"""
    print_test_header("3. Create Product with endUse Array")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 80,
                "endUse": ["sofas", "curtains"],
                "mrp": 1500,
                "repeat": "47"
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            test_data['product_id'] = data.get('id')
            test_data['product_code'] = data.get('productCode')
            
            # Verify endUse is array
            if not isinstance(data.get('endUse'), list):
                print_result(False, f"endUse is not an array: {type(data.get('endUse'))}")
                return False
            
            if data.get('endUse') != ["sofas", "curtains"]:
                print_result(False, f"endUse incorrect: {data.get('endUse')}")
                return False
            
            # Verify repeat field
            if data.get('repeat') != "47":
                print_result(False, f"repeat field incorrect: {data.get('repeat')}")
                return False
            
            print_result(True, f"Product created with endUse array and repeat field")
            print(f"  - Product Code: {data['productCode']}")
            print(f"  - endUse: {data['endUse']} ✓")
            print(f"  - repeat: {data['repeat']} ✓")
            return True
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_4_update_product_enduse(session):
    """Test 4: Update product with endUse=["cushions"] and repeat="58", verify history"""
    print_test_header("4. Update Product endUse and repeat with History")
    
    try:
        # Update product
        response = session.put(
            f"{API_BASE}/products/{test_data['product_id']}",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 80,
                "endUse": ["cushions"],
                "mrp": 1500,
                "repeat": "58"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Update failed with {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Verify endUse updated
        if data.get('endUse') != ["cushions"]:
            print_result(False, f"endUse not updated: {data.get('endUse')}")
            return False
        
        # Verify repeat updated
        if data.get('repeat') != "58":
            print_result(False, f"repeat not updated: {data.get('repeat')}")
            return False
        
        # Get product with history
        response2 = session.get(f"{API_BASE}/products/{test_data['product_id']}", timeout=10)
        
        if response2.status_code != 200:
            print_result(False, f"Failed to get product history")
            return False
        
        product = response2.json()
        history = product.get('history', [])
        
        # Check endUse history (should be comma-joined)
        enduse_history = [h for h in history if h['fieldName'] == 'endUse']
        if not enduse_history:
            print_result(False, f"No history entry for endUse change")
            return False
        
        enduse_entry = enduse_history[0]
        if enduse_entry['oldValue'] != 'sofas,curtains' or enduse_entry['newValue'] != 'cushions':
            print_result(False, f"endUse history incorrect: old={enduse_entry['oldValue']}, new={enduse_entry['newValue']}")
            return False
        
        # Check repeat history
        repeat_history = [h for h in history if h['fieldName'] == 'repeat']
        if not repeat_history:
            print_result(False, f"No history entry for repeat change")
            return False
        
        repeat_entry = repeat_history[0]
        if repeat_entry['oldValue'] != '47' or repeat_entry['newValue'] != '58':
            print_result(False, f"repeat history incorrect: old={repeat_entry['oldValue']}, new={repeat_entry['newValue']}")
            return False
        
        print_result(True, f"Product updated with correct history tracking")
        print(f"  - endUse updated: ['sofas','curtains'] → ['cushions'] ✓")
        print(f"  - endUse history: oldValue='sofas,curtains', newValue='cushions' ✓")
        print(f"  - repeat updated: '47' → '58' ✓")
        print(f"  - repeat history: oldValue='47', newValue='58' ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_5_backward_compat_string_enduse(session):
    """Test 5: Backward compatibility - POST with endUse as string should be stored as array"""
    print_test_header("5. Backward Compatibility - endUse String")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 81,
                "endUse": "sofas",  # String, not array
                "mrp": 1600
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            
            # Verify endUse is stored as array
            if not isinstance(data.get('endUse'), list):
                print_result(False, f"endUse not converted to array: {type(data.get('endUse'))}")
                return False
            
            if data.get('endUse') != ["sofas"]:
                print_result(False, f"endUse incorrect: {data.get('endUse')}")
                return False
            
            print_result(True, f"String endUse correctly converted to array")
            print(f"  - Input: 'sofas' (string)")
            print(f"  - Stored: {data['endUse']} (array) ✓")
            
            # Clean up
            session.delete(f"{API_BASE}/products/{data['id']}", timeout=10)
            return True
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_6_csv_import_unauthorized():
    """Test 6: CSV import without cookie should return 401"""
    print_test_header("6. CSV Import - Unauthorized")
    
    try:
        response = requests.post(
            f"{API_BASE}/products/import",
            json={"rows": []},
            timeout=10
        )
        
        if response.status_code == 401:
            print_result(True, f"Unauthorized import correctly blocked with 401")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_7_csv_bulk_import(session):
    """Test 7: CSV bulk import with 4 rows (2 valid, 1 duplicate, 1 invalid)"""
    print_test_header("7. CSV Bulk Import")
    
    try:
        rows = [
            {
                "vendorCode": "60",
                "vendorName": "QA Imports Ltd",
                "bookNumber": "9",
                "catalogueName": "Bulk Test Collection",
                "pageNumber": "1",
                "priceCode": "BT-001",
                "endUse": "sofas|cushions",
                "washCare": "wash_40|no_bleach|hang_dry",
                "mrp": "999",
                "composition": "100% Polyester",
                "gsm": "300",
                "width": "140cm",
                "martindale": "40000",
                "repeat": "47",
                "shade": "BulkBeige",
                "hsnCode": "5407",
                "remarks": "bulk row 1"
            },
            {
                "vendorCode": "60",
                "vendorName": "QA Imports Ltd",
                "bookNumber": "9",
                "catalogueName": "Bulk Test Collection",
                "pageNumber": "2",
                "priceCode": "BT-002",
                "endUse": "curtains",
                "washCare": "wash_40|dry_clean|iron_2_dots",
                "mrp": "1299",
                "shade": "BulkCream"
            },
            {
                "vendorCode": "60",
                "vendorName": "QA Imports Ltd",
                "bookNumber": "9",
                "catalogueName": "Bulk Test Collection",
                "pageNumber": "2",  # Duplicate page
                "mrp": "1500"
            },
            {
                "vendorCode": "",  # Missing required fields
                "vendorName": "",
                "mrp": "0"
            }
        ]
        
        response = session.post(
            f"{API_BASE}/products/import",
            json={"rows": rows},
            timeout=30
        )
        
        if response.status_code != 200:
            print_result(False, f"Import failed with {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        
        # Verify counts
        if result.get('totalRows') != 4:
            print_result(False, f"totalRows incorrect: expected 4, got {result.get('totalRows')}")
            return False
        
        if result.get('productsCreated') != 2:
            print_result(False, f"productsCreated incorrect: expected 2, got {result.get('productsCreated')}")
            return False
        
        if result.get('productsSkipped') != 1:
            print_result(False, f"productsSkipped incorrect: expected 1, got {result.get('productsSkipped')}")
            return False
        
        if result.get('vendorsCreated') != 1:
            print_result(False, f"vendorsCreated incorrect: expected 1, got {result.get('vendorsCreated')}")
            return False
        
        if result.get('cataloguesCreated') != 1:
            print_result(False, f"cataloguesCreated incorrect: expected 1, got {result.get('cataloguesCreated')}")
            return False
        
        errors = result.get('errors', [])
        if len(errors) != 1:
            print_result(False, f"errors count incorrect: expected 1, got {len(errors)}")
            return False
        
        # Verify error row number (row 5 = index 3 + 2 for header)
        if errors[0].get('row') != 5:
            print_result(False, f"error row incorrect: expected 5, got {errors[0].get('row')}")
            return False
        
        print_result(True, f"CSV import response counts correct")
        print(f"  - totalRows: {result['totalRows']} ✓")
        print(f"  - productsCreated: {result['productsCreated']} ✓")
        print(f"  - productsSkipped: {result['productsSkipped']} ✓")
        print(f"  - vendorsCreated: {result['vendorsCreated']} ✓")
        print(f"  - cataloguesCreated: {result['cataloguesCreated']} ✓")
        print(f"  - errors: {len(errors)} (row {errors[0]['row']}) ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_8_verify_bulk_products(session):
    """Test 8: Verify bulk imported products exist with correct codes and fields"""
    print_test_header("8. Verify Bulk Imported Products")
    
    try:
        # Search for bulk products
        response = session.get(f"{API_BASE}/products?search=BUL060", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Search failed with {response.status_code}")
            return False
        
        products = response.json()
        
        # Find BUL060009001 and BUL060009002
        product1 = next((p for p in products if p.get('productCode') == 'BUL060009001'), None)
        product2 = next((p for p in products if p.get('productCode') == 'BUL060009002'), None)
        
        if not product1:
            print_result(False, f"Product BUL060009001 not found")
            return False
        
        if not product2:
            print_result(False, f"Product BUL060009002 not found")
            return False
        
        # Verify product1 fields
        if not isinstance(product1.get('endUse'), list):
            print_result(False, f"Product1 endUse not an array: {type(product1.get('endUse'))}")
            return False
        
        if product1.get('endUse') != ['sofas', 'cushions']:
            print_result(False, f"Product1 endUse incorrect: {product1.get('endUse')}")
            return False
        
        if not isinstance(product1.get('washCare'), list):
            print_result(False, f"Product1 washCare not an array: {type(product1.get('washCare'))}")
            return False
        
        if product1.get('washCare') != ['wash_40', 'no_bleach', 'hang_dry']:
            print_result(False, f"Product1 washCare incorrect: {product1.get('washCare')}")
            return False
        
        if product1.get('repeat') != '47':
            print_result(False, f"Product1 repeat incorrect: {product1.get('repeat')}")
            return False
        
        # Verify product2 fields
        if not isinstance(product2.get('endUse'), list):
            print_result(False, f"Product2 endUse not an array: {type(product2.get('endUse'))}")
            return False
        
        if product2.get('endUse') != ['curtains']:
            print_result(False, f"Product2 endUse incorrect: {product2.get('endUse')}")
            return False
        
        test_data['bulk_product_codes'] = ['BUL060009001', 'BUL060009002']
        
        print_result(True, f"Bulk products verified with correct fields")
        print(f"  - BUL060009001 found ✓")
        print(f"    - endUse: {product1['endUse']} ✓")
        print(f"    - washCare: {product1['washCare']} ✓")
        print(f"    - repeat: {product1['repeat']} ✓")
        print(f"  - BUL060009002 found ✓")
        print(f"    - endUse: {product2['endUse']} ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_9_verify_qr_barcode_files():
    """Test 9: Verify QR and barcode files exist for bulk products"""
    print_test_header("9. Verify QR/Barcode Files for Bulk Products")
    
    try:
        all_exist = True
        
        for code in test_data['bulk_product_codes']:
            qr_file = f"/app/public/qrcodes/{code}.png"
            barcode_file = f"/app/public/barcodes/{code}.png"
            
            if not os.path.exists(qr_file):
                print_result(False, f"QR file not found: {qr_file}")
                all_exist = False
            
            if not os.path.exists(barcode_file):
                print_result(False, f"Barcode file not found: {barcode_file}")
                all_exist = False
        
        if all_exist:
            print_result(True, f"All QR and barcode files exist")
            for code in test_data['bulk_product_codes']:
                print(f"  - {code}: QR ✓, Barcode ✓")
            return True
        else:
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_10_public_endpoint_security():
    """Test 10: Public endpoint returns ONLY productCode and mrp (no new fields leaked)"""
    print_test_header("10. Public Endpoint Security Re-verification")
    
    try:
        # Test with bulk product
        response = requests.get(
            f"{API_BASE}/public/products/BUL060009001",
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        response_keys = set(data.keys())
        expected_keys = {"productCode", "mrp"}
        
        if response_keys != expected_keys:
            print_result(False, f"Public endpoint leaking sensitive data!")
            print(f"  - Expected keys: {expected_keys}")
            print(f"  - Actual keys: {response_keys}")
            print(f"  - Extra keys: {response_keys - expected_keys}")
            print(f"  - Full response: {data}")
            return False
        
        # Verify no new fields leaked
        sensitive_fields = ['repeat', 'endUse', 'washCare', 'hsnCode', 'shade', 'composition', 'purchaseRate', 'priceCode']
        leaked = [f for f in sensitive_fields if f in response_keys]
        
        if leaked:
            print_result(False, f"Sensitive fields leaked: {leaked}")
            return False
        
        print_result(True, f"Public endpoint returns ONLY productCode and mrp")
        print(f"  - Response keys: {response_keys} ✓")
        print(f"  - No sensitive fields leaked ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_11_enduse_search_filter(session):
    """Test 11: Search filter by endUse=sofas should match products with sofas in array"""
    print_test_header("11. endUse Search Filter")
    
    try:
        response = session.get(f"{API_BASE}/products?endUse=sofas", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Search failed with {response.status_code}")
            return False
        
        products = response.json()
        
        # Verify BUL060009001 is in results (has endUse=['sofas','cushions'])
        found = next((p for p in products if p.get('productCode') == 'BUL060009001'), None)
        
        if not found:
            print_result(False, f"BUL060009001 not found in endUse=sofas filter")
            return False
        
        # Verify all returned products have 'sofas' in endUse
        for p in products:
            enduse = p.get('endUse', [])
            if isinstance(enduse, list):
                if 'sofas' not in enduse:
                    print_result(False, f"Product {p.get('productCode')} doesn't have 'sofas' in endUse: {enduse}")
                    return False
            elif isinstance(enduse, str):
                # Legacy string format
                if enduse != 'sofas':
                    print_result(False, f"Product {p.get('productCode')} has wrong endUse: {enduse}")
                    return False
        
        print_result(True, f"endUse filter working correctly")
        print(f"  - Found {len(products)} products with endUse containing 'sofas'")
        print(f"  - BUL060009001 included ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_12_cleanup(session):
    """Test 12: Clean up test data (optional)"""
    print_test_header("12. Cleanup Test Data")
    
    try:
        # Delete the test product created in test 3
        if test_data.get('product_id'):
            session.delete(f"{API_BASE}/products/{test_data['product_id']}", timeout=10)
            print(f"  - Deleted test product {test_data['product_code']}")
        
        # Note: We're leaving bulk products for inspection
        print_result(True, f"Cleanup completed (bulk products left for inspection)")
        return True
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND API TEST SUITE - ENHANCEMENT ROUND 3")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    results = []
    
    # Test 1: Login
    login_result, session = test_1_login()
    results.append(("Login with new credentials", login_result))
    
    if not login_result or not session:
        print("\n❌ Login failed, cannot continue")
        sys.exit(1)
    
    # Test 2: Get Aurora catalogue
    results.append(("Get Aurora catalogue", test_2_get_aurora_catalogue(session)))
    
    # Test 3: Create product with endUse array
    results.append(("Create product with endUse array", test_3_create_product_enduse_array(session)))
    
    # Test 4: Update product endUse and repeat
    results.append(("Update product endUse and repeat", test_4_update_product_enduse(session)))
    
    # Test 5: Backward compatibility
    results.append(("Backward compatibility - string endUse", test_5_backward_compat_string_enduse(session)))
    
    # Test 6: CSV import unauthorized
    results.append(("CSV import unauthorized", test_6_csv_import_unauthorized()))
    
    # Test 7: CSV bulk import
    results.append(("CSV bulk import", test_7_csv_bulk_import(session)))
    
    # Test 8: Verify bulk products
    results.append(("Verify bulk products", test_8_verify_bulk_products(session)))
    
    # Test 9: Verify QR/barcode files
    results.append(("Verify QR/barcode files", test_9_verify_qr_barcode_files()))
    
    # Test 10: Public endpoint security
    results.append(("Public endpoint security", test_10_public_endpoint_security()))
    
    # Test 11: endUse search filter
    results.append(("endUse search filter", test_11_enduse_search_filter(session)))
    
    # Test 12: Cleanup
    results.append(("Cleanup", test_12_cleanup(session)))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY - ENHANCEMENT ROUND 3")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("="*80)
    
    if passed == total:
        print("\n🎉 All Enhancement Round 3 tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
