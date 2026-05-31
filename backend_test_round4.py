#!/usr/bin/env python3
"""
Backend API Test Suite for Enhancement Round 4
Tests split purchaseRate into purchaseRateCL and purchaseRateRL
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

# Admin credentials (updated for Enhancement Round 4)
ADMIN_USERNAME = "luxurandlavish"
ADMIN_PASSWORD = "a1b2c3d4"

# Test data storage
test_data = {
    'product_id': None,
    'product_code': None,
    'catalogue_id': None,
    'csv_product_code': None
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
    """Test 1: Login with updated credentials"""
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
        print_result(False, f"Exception occurred: {str(e)}")
        return False, None

def test_2_get_aurora_catalogue(session):
    """Test 2: Get Aurora catalogue ID"""
    print_test_header("2. Get Aurora Catalogue ID")
    
    try:
        response = session.get(f"{API_BASE}/catalogues", timeout=10)
        
        if response.status_code == 200:
            catalogues = response.json()
            # Find Aurora catalogue
            aurora = next((c for c in catalogues if 'Aurora' in c.get('catalogueName', '')), None)
            if aurora:
                test_data['catalogue_id'] = aurora['id']
                print_result(True, f"Aurora catalogue found: {aurora['catalogueName']}")
                print(f"  - Catalogue ID: {aurora['id']}")
                return True
            else:
                print_result(False, f"Aurora catalogue not found")
                print(f"Available catalogues: {[c.get('catalogueName') for c in catalogues]}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_3_create_product_with_split_rates(session):
    """Test 3: POST /api/products with purchaseRateCL and purchaseRateRL"""
    print_test_header("3. Create Product with Split Purchase Rates")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 81,
                "mrp": 1999,
                "purchaseRateCL": 775,
                "purchaseRateRL": 820,
                "composition": "100% Polyester",
                "shade": "Test Shade",
                "remarks": "Enhancement Round 4 Test"
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            test_data['product_id'] = data.get('id')
            test_data['product_code'] = data.get('productCode')
            
            # Assert: 201 status ✓
            print(f"✓ Status: 201")
            
            # Assert: response.purchaseRateCL === 775 (number)
            if 'purchaseRateCL' not in data:
                print_result(False, f"purchaseRateCL not in response")
                return False
            if data['purchaseRateCL'] != 775:
                print_result(False, f"purchaseRateCL expected 775, got {data['purchaseRateCL']}")
                return False
            if not isinstance(data['purchaseRateCL'], (int, float)):
                print_result(False, f"purchaseRateCL is not a number: {type(data['purchaseRateCL'])}")
                return False
            print(f"✓ purchaseRateCL: {data['purchaseRateCL']} (number)")
            
            # Assert: response.purchaseRateRL === 820 (number)
            if 'purchaseRateRL' not in data:
                print_result(False, f"purchaseRateRL not in response")
                return False
            if data['purchaseRateRL'] != 820:
                print_result(False, f"purchaseRateRL expected 820, got {data['purchaseRateRL']}")
                return False
            if not isinstance(data['purchaseRateRL'], (int, float)):
                print_result(False, f"purchaseRateRL is not a number: {type(data['purchaseRateRL'])}")
                return False
            print(f"✓ purchaseRateRL: {data['purchaseRateRL']} (number)")
            
            # Assert: response does NOT have purchaseRate key (legacy removed)
            if 'purchaseRate' in data:
                print_result(False, f"Legacy 'purchaseRate' field still present in response!")
                return False
            print(f"✓ No legacy 'purchaseRate' field")
            
            print_result(True, f"Product created with split purchase rates")
            print(f"  - Product ID: {data['id']}")
            print(f"  - Product Code: {data['productCode']}")
            print(f"  - MRP: {data['mrp']}")
            print(f"  - Purchase Rate CL: {data['purchaseRateCL']}")
            print(f"  - Purchase Rate RL: {data['purchaseRateRL']}")
            return True
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_4_update_product_and_verify_history(session):
    """Test 4: PUT /api/products with updated rates and verify history"""
    print_test_header("4. Update Product and Verify History Tracking")
    
    try:
        # Update product with new rates
        response = session.put(
            f"{API_BASE}/products/{test_data['product_id']}",
            json={
                "mrp": 1999,
                "purchaseRateCL": 900,
                "purchaseRateRL": 950,
                "composition": "100% Polyester",
                "shade": "Test Shade",
                "remarks": "Enhancement Round 4 Test"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Update failed with {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Get product to check history
        response2 = session.get(f"{API_BASE}/products/{test_data['product_id']}", timeout=10)
        
        if response2.status_code != 200:
            print_result(False, f"Failed to retrieve updated product")
            return False
        
        product = response2.json()
        history = product.get('history', [])
        
        if len(history) == 0:
            print_result(False, f"History is empty after update")
            return False
        
        # Check for purchaseRateCL change
        cl_history = [h for h in history if h['fieldName'] == 'purchaseRateCL']
        if not cl_history:
            print_result(False, f"No history entry for purchaseRateCL change")
            print(f"Available history fields: {[h['fieldName'] for h in history]}")
            return False
        
        cl_entry = cl_history[0]
        if cl_entry['oldValue'] != '775' or cl_entry['newValue'] != '900':
            print_result(False, f"purchaseRateCL history incorrect: old={cl_entry['oldValue']}, new={cl_entry['newValue']}")
            return False
        print(f"✓ purchaseRateCL history: {cl_entry['oldValue']} → {cl_entry['newValue']}")
        
        # Check for purchaseRateRL change
        rl_history = [h for h in history if h['fieldName'] == 'purchaseRateRL']
        if not rl_history:
            print_result(False, f"No history entry for purchaseRateRL change")
            print(f"Available history fields: {[h['fieldName'] for h in history]}")
            return False
        
        rl_entry = rl_history[0]
        if rl_entry['oldValue'] != '820' or rl_entry['newValue'] != '950':
            print_result(False, f"purchaseRateRL history incorrect: old={rl_entry['oldValue']}, new={rl_entry['newValue']}")
            return False
        print(f"✓ purchaseRateRL history: {rl_entry['oldValue']} → {rl_entry['newValue']}")
        
        print_result(True, f"Product update and history tracking working correctly")
        print(f"  - Total history entries: {len(history)}")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_5_get_product_verify_fields(session):
    """Test 5: GET /api/products/<id> - confirm both new fields present, no purchaseRate"""
    print_test_header("5. GET Product - Verify New Fields")
    
    try:
        response = session.get(f"{API_BASE}/products/{test_data['product_id']}", timeout=10)
        
        if response.status_code == 200:
            product = response.json()
            
            # Verify purchaseRateCL present
            if 'purchaseRateCL' not in product:
                print_result(False, f"purchaseRateCL not in product")
                return False
            print(f"✓ purchaseRateCL present: {product['purchaseRateCL']}")
            
            # Verify purchaseRateRL present
            if 'purchaseRateRL' not in product:
                print_result(False, f"purchaseRateRL not in product")
                return False
            print(f"✓ purchaseRateRL present: {product['purchaseRateRL']}")
            
            # Verify NO purchaseRate
            if 'purchaseRate' in product:
                print_result(False, f"Legacy 'purchaseRate' field still present!")
                return False
            print(f"✓ No legacy 'purchaseRate' field")
            
            print_result(True, f"Product has correct fields")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_6_public_endpoint_security(session):
    """Test 6: PUBLIC SECURITY - GET /api/public/products/<code> returns ONLY productCode and mrp"""
    print_test_header("6. Public Endpoint Security (CRITICAL)")
    
    try:
        # Use a new session without auth cookie
        response = requests.get(
            f"{API_BASE}/public/products/{test_data['product_code']}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            response_keys = set(data.keys())
            expected_keys = {"productCode", "mrp"}
            
            # Strict assertion: response keys must equal exactly {"productCode", "mrp"}
            if response_keys == expected_keys:
                print_result(True, f"Public endpoint returns ONLY productCode and mrp")
                print(f"  - Response keys: {response_keys} ✓")
                print(f"  - productCode: {data['productCode']}")
                print(f"  - mrp: {data['mrp']}")
                
                # Explicitly verify NO sensitive fields
                sensitive_fields = ['purchaseRateCL', 'purchaseRateRL', 'purchaseRate', 'priceCode', 
                                   'endUse', 'washCare', 'shade', 'composition', 'gsm', 'width', 
                                   'martindale', 'repeat', 'hsnCode', 'remarks', 'id', '_id', 
                                   'vendor', 'catalogue', 'history']
                leaked_fields = [f for f in sensitive_fields if f in data]
                if leaked_fields:
                    print_result(False, f"SECURITY BREACH: Sensitive fields leaked: {leaked_fields}")
                    return False
                print(f"✓ NO sensitive fields leaked")
                return True
            else:
                print_result(False, f"Public endpoint leaking sensitive data!")
                print(f"  - Expected keys: {expected_keys}")
                print(f"  - Actual keys: {response_keys}")
                print(f"  - Extra keys: {response_keys - expected_keys}")
                print(f"  - Full response: {data}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_7_csv_bulk_import(session):
    """Test 7: CSV BULK IMPORT with purchaseRateCL and purchaseRateRL"""
    print_test_header("7. CSV Bulk Import with Split Rates")
    
    try:
        rows = [
            {
                "vendorCode": "70",
                "vendorName": "CL/RL Test Vendor",
                "bookNumber": "7",
                "catalogueName": "Rate Split Test Cat",
                "pageNumber": "1",
                "mrp": "1500",
                "purchaseRateCL": "720",
                "purchaseRateRL": "780",
                "priceCode": "RS-001",
                "endUse": "sofas",
                "washCare": "wash_40"
            }
        ]
        
        response = session.post(
            f"{API_BASE}/products/import",
            json={"rows": rows},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Assert response counts
            if result.get('productsCreated') != 1:
                print_result(False, f"Expected productsCreated=1, got {result.get('productsCreated')}")
                print(f"Result: {result}")
                return False
            print(f"✓ productsCreated: {result['productsCreated']}")
            
            if result.get('vendorsCreated') != 1:
                print_result(False, f"Expected vendorsCreated=1, got {result.get('vendorsCreated')}")
                print(f"Result: {result}")
                return False
            print(f"✓ vendorsCreated: {result['vendorsCreated']}")
            
            if result.get('cataloguesCreated') != 1:
                print_result(False, f"Expected cataloguesCreated=1, got {result.get('cataloguesCreated')}")
                print(f"Result: {result}")
                return False
            print(f"✓ cataloguesCreated: {result['cataloguesCreated']}")
            
            if len(result.get('errors', [])) != 0:
                print_result(False, f"Expected errors=[], got {result.get('errors')}")
                return False
            print(f"✓ errors: []")
            
            # Now search for the created product by priceCode
            search_response = session.get(f"{API_BASE}/products?search=RS-001", timeout=10)
            if search_response.status_code != 200:
                print_result(False, f"Failed to search for created product")
                return False
            
            products = search_response.json()
            csv_product = next((p for p in products if p.get('priceCode') == 'RS-001'), None)
            
            if not csv_product:
                print_result(False, f"Created product not found by priceCode RS-001")
                return False
            
            test_data['csv_product_code'] = csv_product['productCode']
            
            # Verify purchaseRateCL and purchaseRateRL
            if csv_product.get('purchaseRateCL') != 720:
                print_result(False, f"purchaseRateCL expected 720, got {csv_product.get('purchaseRateCL')}")
                return False
            print(f"✓ purchaseRateCL: {csv_product['purchaseRateCL']}")
            
            if csv_product.get('purchaseRateRL') != 780:
                print_result(False, f"purchaseRateRL expected 780, got {csv_product.get('purchaseRateRL')}")
                return False
            print(f"✓ purchaseRateRL: {csv_product['purchaseRateRL']}")
            
            print_result(True, f"CSV bulk import working correctly")
            print(f"  - Product Code: {csv_product['productCode']}")
            print(f"  - Price Code: {csv_product['priceCode']}")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_8_migrated_data_check(session):
    """Test 8: Check existing migrated product has new fields"""
    print_test_header("8. Migrated Data Check")
    
    try:
        # Search for existing product AUR023001011
        response = session.get(f"{API_BASE}/products?search=AUR023001011", timeout=10)
        
        if response.status_code == 200:
            products = response.json()
            migrated_product = next((p for p in products if p.get('productCode') == 'AUR023001011'), None)
            
            if not migrated_product:
                print_result(False, f"Migrated product AUR023001011 not found")
                return False
            
            # Verify purchaseRateCL present
            if 'purchaseRateCL' not in migrated_product:
                print_result(False, f"purchaseRateCL not in migrated product")
                return False
            if migrated_product['purchaseRateCL'] is None:
                print_result(False, f"purchaseRateCL is null in migrated product")
                return False
            print(f"✓ purchaseRateCL present: {migrated_product['purchaseRateCL']}")
            
            # Verify purchaseRateRL present
            if 'purchaseRateRL' not in migrated_product:
                print_result(False, f"purchaseRateRL not in migrated product")
                return False
            if migrated_product['purchaseRateRL'] is None:
                print_result(False, f"purchaseRateRL is null in migrated product")
                return False
            print(f"✓ purchaseRateRL present: {migrated_product['purchaseRateRL']}")
            
            # Verify NO purchaseRate
            if 'purchaseRate' in migrated_product:
                print_result(False, f"Legacy 'purchaseRate' field still present in migrated product!")
                return False
            print(f"✓ No legacy 'purchaseRate' field")
            
            print_result(True, f"Migrated product has correct fields")
            print(f"  - Product Code: {migrated_product['productCode']}")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_9_soft_delete_regression(session):
    """Test 9: Verify soft delete still works"""
    print_test_header("9. Soft Delete Regression Test")
    
    try:
        # Delete the product created in test 3
        response = session.delete(
            f"{API_BASE}/products/{test_data['product_id']}",
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Delete failed with {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Check public endpoint returns 404
        response2 = requests.get(
            f"{API_BASE}/public/products/{test_data['product_code']}",
            timeout=10
        )
        
        if response2.status_code != 404:
            print_result(False, f"Public endpoint should return 404 for deleted product, got {response2.status_code}")
            return False
        
        print_result(True, f"Soft delete working correctly")
        print(f"  - Product deleted: ✓")
        print(f"  - Public endpoint returns 404: ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_10_list_endpoint_regression(session):
    """Test 10: Verify list endpoint returns products with new fields"""
    print_test_header("10. List Endpoint Regression Test")
    
    try:
        response = session.get(f"{API_BASE}/products", timeout=10)
        
        if response.status_code == 200:
            products = response.json()
            if not isinstance(products, list):
                print_result(False, f"Response is not an array")
                return False
            
            if len(products) == 0:
                print_result(False, f"No products returned")
                return False
            
            # Check first product has new fields
            first_product = products[0]
            if 'purchaseRateCL' not in first_product:
                print_result(False, f"purchaseRateCL not in product list response")
                return False
            if 'purchaseRateRL' not in first_product:
                print_result(False, f"purchaseRateRL not in product list response")
                return False
            
            print_result(True, f"List endpoint working correctly")
            print(f"  - Total products: {len(products)}")
            print(f"  - Products have new fields: ✓")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND API TEST SUITE - Enhancement Round 4")
    print("Split purchaseRate into purchaseRateCL and purchaseRateRL")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    results = []
    
    # Test 1: Login
    login_result, session = test_1_login()
    results.append(("Login", login_result))
    
    if not login_result or not session:
        print("\n❌ Login failed, cannot continue with remaining tests")
        sys.exit(1)
    
    # Test 2: Get Aurora catalogue
    results.append(("Get Aurora catalogue", test_2_get_aurora_catalogue(session)))
    
    # Test 3: Create product with split rates
    results.append(("Create product with split rates", test_3_create_product_with_split_rates(session)))
    
    # Test 4: Update product and verify history
    results.append(("Update product and verify history", test_4_update_product_and_verify_history(session)))
    
    # Test 5: Get product verify fields
    results.append(("Get product verify fields", test_5_get_product_verify_fields(session)))
    
    # Test 6: Public endpoint security
    results.append(("Public endpoint security", test_6_public_endpoint_security(session)))
    
    # Test 7: CSV bulk import
    results.append(("CSV bulk import", test_7_csv_bulk_import(session)))
    
    # Test 8: Migrated data check
    results.append(("Migrated data check", test_8_migrated_data_check(session)))
    
    # Test 9: Soft delete regression
    results.append(("Soft delete regression", test_9_soft_delete_regression(session)))
    
    # Test 10: List endpoint regression
    results.append(("List endpoint regression", test_10_list_endpoint_regression(session)))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
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
        print("\n🎉 All Enhancement Round 4 tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
