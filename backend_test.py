#!/usr/bin/env python3
"""
Backend API Test Suite for Furnishing Catalogue QR System MVP
Tests all backend endpoints including auth, CRUD operations, and security
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

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Test data storage
test_data = {
    'vendor_id': None,
    'catalogue_id': None,
    'product_id': None,
    'product_code': None
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

def test_1_unauthorized_access():
    """Test 1: Unauthorized access to /api/vendors without cookie should return 401"""
    print_test_header("1. Unauthorized Access to /api/vendors")
    
    try:
        response = requests.get(f"{API_BASE}/vendors", timeout=10)
        
        if response.status_code == 401:
            print_result(True, f"Unauthorized access correctly blocked with 401")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_2_login_wrong_credentials():
    """Test 2: Login with wrong credentials should return 401"""
    print_test_header("2. Login with Wrong Credentials")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"username": ADMIN_USERNAME, "password": "wrong"},
            timeout=10
        )
        
        if response.status_code == 401:
            print_result(True, f"Wrong credentials correctly rejected with 401")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_3_login_success():
    """Test 3: Login with correct credentials should return 200 and set cookie"""
    print_test_header("3. Login with Correct Credentials")
    
    try:
        session = requests.Session()
        response = session.post(
            f"{API_BASE}/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            # Check if cookie is set
            if 'admin-token' in session.cookies:
                print_result(True, f"Login successful with 200, cookie 'admin-token' set")
                return True, session
            else:
                print_result(False, f"Login returned 200 but cookie 'admin-token' not set")
                print(f"Cookies: {session.cookies.get_dict()}")
                return False, None
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False, None

def test_4_create_vendor(session):
    """Test 4: Create vendor should return 201 with id, vendorCode, vendorName"""
    print_test_header("4. Create Vendor")
    
    try:
        response = session.post(
            f"{API_BASE}/vendors",
            json={"vendorCode": 23, "vendorName": "Test Vendor"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if 'id' in data and data.get('vendorCode') == 23 and data.get('vendorName') == "Test Vendor":
                test_data['vendor_id'] = data['id']
                print_result(True, f"Vendor created successfully with id: {data['id']}")
                print(f"Vendor data: vendorCode={data['vendorCode']}, vendorName={data['vendorName']}")
                return True
            else:
                print_result(False, f"Response missing required fields")
                print(f"Response: {data}")
                return False
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_5_duplicate_vendor(session):
    """Test 5: Creating duplicate vendor should return 400"""
    print_test_header("5. Duplicate Vendor Code")
    
    try:
        response = session.post(
            f"{API_BASE}/vendors",
            json={"vendorCode": 23, "vendorName": "Another Vendor"},
            timeout=10
        )
        
        if response.status_code == 400:
            print_result(True, f"Duplicate vendor correctly rejected with 400")
            return True
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_6_list_vendors(session):
    """Test 6: List vendors should return 200 with array containing new vendor"""
    print_test_header("6. List Vendors")
    
    try:
        response = session.get(f"{API_BASE}/vendors", timeout=10)
        
        if response.status_code == 200:
            vendors = response.json()
            if isinstance(vendors, list):
                vendor_found = any(v.get('id') == test_data['vendor_id'] for v in vendors)
                if vendor_found:
                    print_result(True, f"Vendors list retrieved successfully, contains new vendor")
                    print(f"Total vendors: {len(vendors)}")
                    return True
                else:
                    print_result(False, f"New vendor not found in list")
                    return False
            else:
                print_result(False, f"Response is not an array")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_7_create_catalogue(session):
    """Test 7: Create catalogue should return 201"""
    print_test_header("7. Create Catalogue")
    
    try:
        response = session.post(
            f"{API_BASE}/catalogues",
            json={
                "vendorId": test_data['vendor_id'],
                "bookNumber": 1,
                "catalogueName": "Spring Book 1"
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            if 'id' in data:
                test_data['catalogue_id'] = data['id']
                print_result(True, f"Catalogue created successfully with id: {data['id']}")
                print(f"Catalogue data: bookNumber={data['bookNumber']}, catalogueName={data['catalogueName']}")
                return True
            else:
                print_result(False, f"Response missing 'id' field")
                print(f"Response: {data}")
                return False
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_8_create_product(session):
    """Test 8: Create product with verification of productCode, paths, and file existence"""
    print_test_header("8. Create Product with QR/Barcode Generation")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 11,
                "mrp": 1200,
                "purchaseRate": 600,
                "composition": "100% Polyester",
                "gsm": "320",
                "width": "140cm",
                "martindale": "40000",
                "shade": "Beige",
                "remarks": "Sample fabric"
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            test_data['product_id'] = data.get('id')
            test_data['product_code'] = data.get('productCode')
            
            # Verify productCode
            expected_code = "023-001-011"
            if data.get('productCode') != expected_code:
                print_result(False, f"Expected productCode '{expected_code}', got '{data.get('productCode')}'")
                return False
            
            # Verify qrCodePath
            expected_qr = "/qrcodes/023-001-011.png"
            if data.get('qrCodePath') != expected_qr:
                print_result(False, f"Expected qrCodePath '{expected_qr}', got '{data.get('qrCodePath')}'")
                return False
            
            # Verify barcodePath
            expected_barcode = "/barcodes/023-001-011.png"
            if data.get('barcodePath') != expected_barcode:
                print_result(False, f"Expected barcodePath '{expected_barcode}', got '{data.get('barcodePath')}'")
                return False
            
            # Verify files exist on disk
            qr_file = "/app/public/qrcodes/023-001-011.png"
            barcode_file = "/app/public/barcodes/023-001-011.png"
            
            qr_exists = os.path.exists(qr_file)
            barcode_exists = os.path.exists(barcode_file)
            
            if not qr_exists:
                print_result(False, f"QR code file not found at {qr_file}")
                return False
            
            if not barcode_exists:
                print_result(False, f"Barcode file not found at {barcode_file}")
                return False
            
            print_result(True, f"Product created successfully")
            print(f"  - Product ID: {data['id']}")
            print(f"  - Product Code: {data['productCode']} ✓")
            print(f"  - QR Code Path: {data['qrCodePath']} ✓")
            print(f"  - Barcode Path: {data['barcodePath']} ✓")
            print(f"  - QR file exists: {qr_file} ✓")
            print(f"  - Barcode file exists: {barcode_file} ✓")
            return True
        else:
            print_result(False, f"Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_9_duplicate_page(session):
    """Test 9: Creating product with duplicate page number should return 400"""
    print_test_header("9. Duplicate Page Number")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 11,
                "mrp": 1500,
                "purchaseRate": 700,
                "composition": "100% Cotton",
                "gsm": "300",
                "width": "150cm",
                "martindale": "50000",
                "shade": "Blue",
                "remarks": "Another fabric"
            },
            timeout=10
        )
        
        if response.status_code == 400:
            print_result(True, f"Duplicate page number correctly rejected with 400")
            return True
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_10_list_products(session):
    """Test 10: List products should include product with populated catalogue and vendor"""
    print_test_header("10. List Products with Population")
    
    try:
        response = session.get(f"{API_BASE}/products", timeout=10)
        
        if response.status_code == 200:
            products = response.json()
            if isinstance(products, list):
                product = next((p for p in products if p.get('id') == test_data['product_id']), None)
                if product:
                    # Check if catalogue and vendor are populated
                    if 'catalogue' in product and 'vendor' in product:
                        print_result(True, f"Products list retrieved with populated catalogue and vendor")
                        print(f"  - Product found: {product['productCode']}")
                        print(f"  - Catalogue: {product['catalogue'].get('catalogueName')}")
                        print(f"  - Vendor: {product['vendor'].get('vendorName')}")
                        return True
                    else:
                        print_result(False, f"Product found but catalogue/vendor not populated")
                        print(f"Product keys: {product.keys()}")
                        return False
                else:
                    print_result(False, f"Product not found in list")
                    return False
            else:
                print_result(False, f"Response is not an array")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_11_search_products(session):
    """Test 11: Search products by productCode and shade"""
    print_test_header("11. Search Products")
    
    try:
        # Search by productCode
        response1 = session.get(f"{API_BASE}/products?search=023", timeout=10)
        
        if response1.status_code != 200:
            print_result(False, f"Search by productCode failed with {response1.status_code}")
            return False
        
        products1 = response1.json()
        found_by_code = any(p.get('productCode') == test_data['product_code'] for p in products1)
        
        if not found_by_code:
            print_result(False, f"Product not found when searching by productCode '023'")
            return False
        
        # Search by shade
        response2 = session.get(f"{API_BASE}/products?search=Beige", timeout=10)
        
        if response2.status_code != 200:
            print_result(False, f"Search by shade failed with {response2.status_code}")
            return False
        
        products2 = response2.json()
        found_by_shade = any(p.get('productCode') == test_data['product_code'] for p in products2)
        
        if not found_by_shade:
            print_result(False, f"Product not found when searching by shade 'Beige'")
            return False
        
        print_result(True, f"Search working correctly")
        print(f"  - Found by productCode '023': ✓")
        print(f"  - Found by shade 'Beige': ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_12_get_product_by_id(session):
    """Test 12: Get product by id should include history array"""
    print_test_header("12. Get Product by ID with History")
    
    try:
        response = session.get(f"{API_BASE}/products/{test_data['product_id']}", timeout=10)
        
        if response.status_code == 200:
            product = response.json()
            if 'history' in product:
                if isinstance(product['history'], list):
                    print_result(True, f"Product retrieved with history array")
                    print(f"  - Product: {product['productCode']}")
                    print(f"  - History entries: {len(product['history'])}")
                    return True
                else:
                    print_result(False, f"History is not an array")
                    return False
            else:
                print_result(False, f"Product does not have 'history' field")
                print(f"Product keys: {product.keys()}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_13_update_product_history(session):
    """Test 13: Update product and verify history tracks only changed fields"""
    print_test_header("13. Update Product with History Tracking")
    
    try:
        # Update product with some changed and some unchanged fields
        response = session.put(
            f"{API_BASE}/products/{test_data['product_id']}",
            json={
                "mrp": 1500,  # Changed from 1200
                "purchaseRate": 600,  # Unchanged
                "composition": "100% Polyester",  # Unchanged
                "gsm": "320",  # Unchanged
                "width": "140cm",  # Unchanged
                "martindale": "40000",  # Unchanged
                "shade": "Cream",  # Changed from Beige
                "remarks": "Sample fabric"  # Unchanged
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
        
        # Check for mrp change
        mrp_history = [h for h in history if h['fieldName'] == 'mrp']
        if not mrp_history:
            print_result(False, f"No history entry for mrp change")
            return False
        
        mrp_entry = mrp_history[0]
        if mrp_entry['oldValue'] != '1200' or mrp_entry['newValue'] != '1500':
            print_result(False, f"MRP history incorrect: old={mrp_entry['oldValue']}, new={mrp_entry['newValue']}")
            return False
        
        # Check for shade change
        shade_history = [h for h in history if h['fieldName'] == 'shade']
        if not shade_history:
            print_result(False, f"No history entry for shade change")
            return False
        
        shade_entry = shade_history[0]
        if shade_entry['oldValue'] != 'Beige' or shade_entry['newValue'] != 'Cream':
            print_result(False, f"Shade history incorrect: old={shade_entry['oldValue']}, new={shade_entry['newValue']}")
            return False
        
        # Check that unchanged fields are NOT in history
        unchanged_fields = ['purchaseRate', 'composition', 'gsm', 'width', 'martindale', 'remarks']
        for field in unchanged_fields:
            field_history = [h for h in history if h['fieldName'] == field]
            if field_history:
                print_result(False, f"Unchanged field '{field}' should not be in history")
                return False
        
        print_result(True, f"Product update and history tracking working correctly")
        print(f"  - MRP changed: 1200 → 1500 ✓")
        print(f"  - Shade changed: Beige → Cream ✓")
        print(f"  - Unchanged fields not in history ✓")
        print(f"  - Total history entries: {len(history)}")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_14_public_product_security(session):
    """Test 14: Public product endpoint should return ONLY productCode and mrp"""
    print_test_header("14. Public Product Endpoint Security (CRITICAL)")
    
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
            
            if response_keys == expected_keys:
                print_result(True, f"Public endpoint returns ONLY productCode and mrp")
                print(f"  - Response keys: {response_keys} ✓")
                print(f"  - productCode: {data['productCode']}")
                print(f"  - mrp: {data['mrp']}")
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

def test_15_soft_delete(session):
    """Test 15: Soft delete product and verify it's not accessible"""
    print_test_header("15. Soft Delete Product")
    
    try:
        # Delete product
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
        
        # Check admin list does not include deleted product
        response3 = session.get(f"{API_BASE}/products", timeout=10)
        
        if response3.status_code != 200:
            print_result(False, f"Failed to retrieve products list")
            return False
        
        products = response3.json()
        deleted_product = next((p for p in products if p.get('id') == test_data['product_id']), None)
        
        if deleted_product:
            print_result(False, f"Deleted product still appears in admin list")
            return False
        
        print_result(True, f"Soft delete working correctly")
        print(f"  - Product deleted: ✓")
        print(f"  - Public endpoint returns 404: ✓")
        print(f"  - Not in admin list: ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND API TEST SUITE - Furnishing Catalogue QR System MVP")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    results = []
    
    # Test 1: Unauthorized access
    results.append(("Unauthorized access", test_1_unauthorized_access()))
    
    # Test 2: Login wrong credentials
    results.append(("Login wrong credentials", test_2_login_wrong_credentials()))
    
    # Test 3: Login success
    login_result, session = test_3_login_success()
    results.append(("Login success", login_result))
    
    if not login_result or not session:
        print("\n❌ Login failed, cannot continue with remaining tests")
        sys.exit(1)
    
    # Test 4: Create vendor
    results.append(("Create vendor", test_4_create_vendor(session)))
    
    # Test 5: Duplicate vendor
    results.append(("Duplicate vendor", test_5_duplicate_vendor(session)))
    
    # Test 6: List vendors
    results.append(("List vendors", test_6_list_vendors(session)))
    
    # Test 7: Create catalogue
    results.append(("Create catalogue", test_7_create_catalogue(session)))
    
    # Test 8: Create product
    results.append(("Create product", test_8_create_product(session)))
    
    # Test 9: Duplicate page
    results.append(("Duplicate page", test_9_duplicate_page(session)))
    
    # Test 10: List products
    results.append(("List products", test_10_list_products(session)))
    
    # Test 11: Search products
    results.append(("Search products", test_11_search_products(session)))
    
    # Test 12: Get product by id
    results.append(("Get product by id", test_12_get_product_by_id(session)))
    
    # Test 13: Update product history
    results.append(("Update product history", test_13_update_product_history(session)))
    
    # Test 14: Public product security
    results.append(("Public product security", test_14_public_product_security(session)))
    
    # Test 15: Soft delete
    results.append(("Soft delete", test_15_soft_delete(session)))
    
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
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
