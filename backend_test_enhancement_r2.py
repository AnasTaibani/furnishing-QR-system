#!/usr/bin/env python3
"""
Backend API Test Suite - Enhancement Round 2
Tests new product code format, new fields, enhanced search, and migrated data
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

# NEW Admin credentials
ADMIN_USERNAME = "luxurandlavish"
ADMIN_PASSWORD = "a1b2c3d4"

# Test data storage
test_data = {
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

def test_1_login():
    """Test 1: Login with new credentials luxurandlavish/a1b2c3d4"""
    print_test_header("1. Login with New Credentials")
    
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
                print_result(True, f"Login successful with new credentials, cookie 'admin-token' set")
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

def test_2_get_existing_catalogue(session):
    """Test 2: Get existing catalogue 'Aurora Collection - Volume 1'"""
    print_test_header("2. Get Existing Catalogue")
    
    try:
        response = session.get(f"{API_BASE}/catalogues", timeout=10)
        
        if response.status_code == 200:
            catalogues = response.json()
            aurora_catalogue = None
            
            for cat in catalogues:
                if cat.get('catalogueName') == "Aurora Collection - Volume 1":
                    aurora_catalogue = cat
                    break
            
            if not aurora_catalogue:
                print_result(False, f"Catalogue 'Aurora Collection - Volume 1' not found")
                print(f"Available catalogues: {[c.get('catalogueName') for c in catalogues]}")
                return False
            
            # Verify it has the expected properties
            if aurora_catalogue.get('bookNumber') != 1:
                print_result(False, f"Expected bookNumber=1, got {aurora_catalogue.get('bookNumber')}")
                return False
            
            # Check if vendor is populated and has vendorCode 23
            vendor = aurora_catalogue.get('vendor')
            if not vendor:
                print_result(False, f"Vendor not populated in catalogue")
                return False
            
            if vendor.get('vendorCode') != 23:
                print_result(False, f"Expected vendorCode=23, got {vendor.get('vendorCode')}")
                return False
            
            test_data['catalogue_id'] = aurora_catalogue['id']
            
            print_result(True, f"Found catalogue 'Aurora Collection - Volume 1'")
            print(f"  - Catalogue ID: {aurora_catalogue['id']}")
            print(f"  - Book Number: {aurora_catalogue['bookNumber']}")
            print(f"  - Vendor Code: {vendor['vendorCode']}")
            print(f"  - Vendor Name: {vendor.get('vendorName')}")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_3_create_product_new_format(session):
    """Test 3: Create product with NEW CODE FORMAT and new fields"""
    print_test_header("3. Create Product with New Code Format")
    
    try:
        response = session.post(
            f"{API_BASE}/products",
            json={
                "catalogueId": test_data['catalogue_id'],
                "pageNumber": 50,
                "priceCode": "PC-TEST",
                "endUse": "sofas",
                "washCare": ["wash_40", "no_bleach", "iron_2_dots"],
                "mrp": 1999,
                "purchaseRate": 900,
                "composition": "100% Polyester",
                "gsm": "320",
                "width": "140cm",
                "martindale": "40000",
                "shade": "TestShade",
                "hsnCode": "5407",
                "remarks": "qa fabric"
            },
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            test_data['product_id'] = data.get('id')
            test_data['product_code'] = data.get('productCode')
            
            # Verify productCode format: 12 chars, no dashes, prefix AUR
            product_code = data.get('productCode')
            if not product_code:
                print_result(False, f"productCode is missing")
                return False
            
            if len(product_code) != 12:
                print_result(False, f"Expected productCode length 12, got {len(product_code)}")
                print(f"Product code: {product_code}")
                return False
            
            if '-' in product_code:
                print_result(False, f"Product code should not contain dashes: {product_code}")
                return False
            
            expected_code = "AUR023001050"
            if product_code != expected_code:
                print_result(False, f"Expected productCode '{expected_code}', got '{product_code}'")
                return False
            
            # Verify new fields
            if data.get('priceCode') != "PC-TEST":
                print_result(False, f"Expected priceCode='PC-TEST', got '{data.get('priceCode')}'")
                return False
            
            if data.get('endUse') != "sofas":
                print_result(False, f"Expected endUse='sofas', got '{data.get('endUse')}'")
                return False
            
            wash_care = data.get('washCare')
            expected_wash_care = ["wash_40", "no_bleach", "iron_2_dots"]
            if wash_care != expected_wash_care:
                print_result(False, f"Expected washCare={expected_wash_care}, got {wash_care}")
                return False
            
            if data.get('hsnCode') != "5407":
                print_result(False, f"Expected hsnCode='5407', got '{data.get('hsnCode')}'")
                return False
            
            # Verify QR and barcode paths
            expected_qr = "/qrcodes/AUR023001050.png"
            if data.get('qrCodePath') != expected_qr:
                print_result(False, f"Expected qrCodePath '{expected_qr}', got '{data.get('qrCodePath')}'")
                return False
            
            expected_barcode = "/barcodes/AUR023001050.png"
            if data.get('barcodePath') != expected_barcode:
                print_result(False, f"Expected barcodePath '{expected_barcode}', got '{data.get('barcodePath')}'")
                return False
            
            # Verify files exist on disk
            qr_file = "/app/public/qrcodes/AUR023001050.png"
            barcode_file = "/app/public/barcodes/AUR023001050.png"
            
            qr_exists = os.path.exists(qr_file)
            barcode_exists = os.path.exists(barcode_file)
            
            if not qr_exists:
                print_result(False, f"QR code file not found at {qr_file}")
                return False
            
            if not barcode_exists:
                print_result(False, f"Barcode file not found at {barcode_file}")
                return False
            
            print_result(True, f"Product created with new format successfully")
            print(f"  - Product ID: {data['id']}")
            print(f"  - Product Code: {product_code} (12 chars, no dashes) ✓")
            print(f"  - Price Code: {data['priceCode']} ✓")
            print(f"  - End Use: {data['endUse']} ✓")
            print(f"  - Wash Care: {data['washCare']} ✓")
            print(f"  - HSN Code: {data['hsnCode']} ✓")
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

def test_4_update_product_history(session):
    """Test 4: Update product and verify history tracking for new fields"""
    print_test_header("4. Update Product with History Tracking")
    
    try:
        # Update product with changes to new fields
        response = session.put(
            f"{API_BASE}/products/{test_data['product_id']}",
            json={
                "mrp": 2500,  # Changed from 1999
                "shade": "NewShade",  # Changed from TestShade
                "washCare": ["wash_40", "dry_clean"],  # Changed
                "endUse": "curtains",  # Changed from sofas
                "priceCode": "PC-TEST",  # Unchanged
                "purchaseRate": 900,  # Unchanged
                "composition": "100% Polyester",  # Unchanged
                "gsm": "320",  # Unchanged
                "width": "140cm",  # Unchanged
                "martindale": "40000",  # Unchanged
                "hsnCode": "5407",  # Unchanged
                "remarks": "qa fabric"  # Unchanged
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
        
        # Check for shade change
        shade_history = [h for h in history if h['fieldName'] == 'shade']
        if not shade_history:
            print_result(False, f"No history entry for shade change")
            return False
        
        # Check for washCare change
        wash_care_history = [h for h in history if h['fieldName'] == 'washCare']
        if not wash_care_history:
            print_result(False, f"No history entry for washCare change")
            return False
        
        # Check for endUse change
        end_use_history = [h for h in history if h['fieldName'] == 'endUse']
        if not end_use_history:
            print_result(False, f"No history entry for endUse change")
            return False
        
        # Check that unchanged fields are NOT in history
        unchanged_fields = ['priceCode', 'purchaseRate', 'composition', 'gsm', 'width', 'martindale', 'hsnCode', 'remarks']
        for field in unchanged_fields:
            field_history = [h for h in history if h['fieldName'] == field]
            if field_history:
                print_result(False, f"Unchanged field '{field}' should not be in history")
                return False
        
        print_result(True, f"Product update and history tracking working correctly")
        print(f"  - MRP changed: tracked ✓")
        print(f"  - Shade changed: tracked ✓")
        print(f"  - WashCare changed: tracked ✓")
        print(f"  - EndUse changed: tracked ✓")
        print(f"  - Unchanged fields not in history ✓")
        print(f"  - Total history entries: {len(history)}")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_5_search_functionality(session):
    """Test 5: Enhanced search functionality"""
    print_test_header("5. Enhanced Search Functionality")
    
    try:
        # Search by productCode prefix
        response1 = session.get(f"{API_BASE}/products?search=AUR023", timeout=10)
        if response1.status_code != 200:
            print_result(False, f"Search by productCode failed with {response1.status_code}")
            return False
        
        products1 = response1.json()
        if len(products1) < 24:  # Should have at least 23 existing + 1 new test product
            print_result(False, f"Expected at least 24 products with AUR023, got {len(products1)}")
            return False
        
        # Search by priceCode
        response2 = session.get(f"{API_BASE}/products?search=PC-TEST", timeout=10)
        if response2.status_code != 200:
            print_result(False, f"Search by priceCode failed with {response2.status_code}")
            return False
        
        products2 = response2.json()
        found_by_price_code = any(p.get('productCode') == test_data['product_code'] for p in products2)
        if not found_by_price_code:
            print_result(False, f"Product not found when searching by priceCode 'PC-TEST'")
            return False
        
        # Search by shade
        response3 = session.get(f"{API_BASE}/products?search=NewShade", timeout=10)
        if response3.status_code != 200:
            print_result(False, f"Search by shade failed with {response3.status_code}")
            return False
        
        products3 = response3.json()
        found_by_shade = any(p.get('productCode') == test_data['product_code'] for p in products3)
        if not found_by_shade:
            print_result(False, f"Product not found when searching by shade 'NewShade'")
            return False
        
        # Search by endUse (substring match)
        response4 = session.get(f"{API_BASE}/products?search=curtains", timeout=10)
        if response4.status_code != 200:
            print_result(False, f"Search by endUse failed with {response4.status_code}")
            return False
        
        products4 = response4.json()
        found_by_end_use = any(p.get('productCode') == test_data['product_code'] for p in products4)
        if not found_by_end_use:
            print_result(False, f"Product not found when searching by endUse 'curtains'")
            return False
        
        # Filter by endUse parameter
        response5 = session.get(f"{API_BASE}/products?endUse=sofas", timeout=10)
        if response5.status_code != 200:
            print_result(False, f"Filter by endUse failed with {response5.status_code}")
            return False
        
        products5 = response5.json()
        # All products should have endUse=sofas
        non_sofas = [p for p in products5 if p.get('endUse') != 'sofas']
        if non_sofas:
            print_result(False, f"Filter by endUse=sofas returned products with different endUse")
            return False
        
        print_result(True, f"Enhanced search functionality working correctly")
        print(f"  - Search by productCode 'AUR023': {len(products1)} products ✓")
        print(f"  - Search by priceCode 'PC-TEST': found ✓")
        print(f"  - Search by shade 'NewShade': found ✓")
        print(f"  - Search by endUse 'curtains': found ✓")
        print(f"  - Filter by endUse=sofas: {len(products5)} products ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_6_public_security(session):
    """Test 6: Public endpoint security - ONLY productCode and mrp"""
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
            
            if response_keys != expected_keys:
                print_result(False, f"Public endpoint leaking sensitive data!")
                print(f"  - Expected keys: {expected_keys}")
                print(f"  - Actual keys: {response_keys}")
                print(f"  - Extra keys: {response_keys - expected_keys}")
                print(f"  - Full response: {data}")
                
                # Check specifically for sensitive fields that should NOT be present
                sensitive_fields = ['priceCode', 'endUse', 'washCare', 'hsnCode', 'shade', 
                                   'composition', 'purchaseRate', 'id', '_id', 'vendor', 
                                   'catalogue', 'history']
                leaked_fields = [f for f in sensitive_fields if f in response_keys]
                if leaked_fields:
                    print(f"  - LEAKED SENSITIVE FIELDS: {leaked_fields}")
                
                return False
            
            print_result(True, f"Public endpoint returns ONLY productCode and mrp")
            print(f"  - Response keys: {response_keys} ✓")
            print(f"  - productCode: {data['productCode']}")
            print(f"  - mrp: {data['mrp']}")
            print(f"  - No sensitive fields leaked ✓")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_7_existing_migrated_data(session):
    """Test 7: Verify existing migrated data (23 products)"""
    print_test_header("7. Existing Migrated Data")
    
    try:
        # Test public endpoint for existing product
        response1 = requests.get(
            f"{API_BASE}/public/products/AUR023001011",
            timeout=10
        )
        
        if response1.status_code != 200:
            print_result(False, f"Public endpoint for AUR023001011 failed with {response1.status_code}")
            return False
        
        data1 = response1.json()
        if data1.get('productCode') != 'AUR023001011':
            print_result(False, f"Expected productCode 'AUR023001011', got '{data1.get('productCode')}'")
            return False
        
        if 'mrp' not in data1:
            print_result(False, f"MRP missing in public endpoint response")
            return False
        
        # Verify only productCode and mrp are returned
        if set(data1.keys()) != {"productCode", "mrp"}:
            print_result(False, f"Public endpoint returning extra fields: {data1.keys()}")
            return False
        
        # Search for all AUR products
        response2 = session.get(f"{API_BASE}/products?search=AUR", timeout=10)
        if response2.status_code != 200:
            print_result(False, f"Search for AUR products failed with {response2.status_code}")
            return False
        
        products = response2.json()
        if len(products) < 23:
            print_result(False, f"Expected at least 23 products with AUR prefix, got {len(products)}")
            return False
        
        print_result(True, f"Existing migrated data verified")
        print(f"  - Public endpoint for AUR023001011: ✓")
        print(f"  - Returns only productCode and mrp: ✓")
        print(f"  - Total AUR products found: {len(products)} ✓")
        return True
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_8_soft_delete(session):
    """Test 8: Soft delete product"""
    print_test_header("8. Soft Delete Product")
    
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
    print("BACKEND API TEST SUITE - ENHANCEMENT ROUND 2")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Admin Credentials: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
    print("="*80)
    
    results = []
    
    # Test 1: Login
    login_result, session = test_1_login()
    results.append(("Login with new credentials", login_result))
    
    if not login_result or not session:
        print("\n❌ Login failed, cannot continue with remaining tests")
        sys.exit(1)
    
    # Test 2: Get existing catalogue
    results.append(("Get existing catalogue", test_2_get_existing_catalogue(session)))
    
    if not test_data['catalogue_id']:
        print("\n❌ Catalogue not found, cannot continue with product tests")
        sys.exit(1)
    
    # Test 3: Create product with new format
    results.append(("Create product with new format", test_3_create_product_new_format(session)))
    
    if not test_data['product_id']:
        print("\n❌ Product creation failed, cannot continue with remaining tests")
        sys.exit(1)
    
    # Test 4: Update product history
    results.append(("Update product history", test_4_update_product_history(session)))
    
    # Test 5: Enhanced search
    results.append(("Enhanced search functionality", test_5_search_functionality(session)))
    
    # Test 6: Public security
    results.append(("Public endpoint security", test_6_public_security(session)))
    
    # Test 7: Existing migrated data
    results.append(("Existing migrated data", test_7_existing_migrated_data(session)))
    
    # Test 8: Soft delete
    results.append(("Soft delete", test_8_soft_delete(session)))
    
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
