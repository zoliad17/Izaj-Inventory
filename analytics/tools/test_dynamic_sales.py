"""
Comprehensive test to verify that sales data is read dynamically from new Excel files.
This test:
1. Creates a first Excel file with specific test data
2. Imports it and records the results
3. Creates a second Excel file with DIFFERENT data
4. Imports it and verifies the data changed
5. Confirms the system is reading new files dynamically
"""
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import time

# Configuration
ANALYTICS_URL = "http://localhost:5001/api/analytics"
TEST_DIR = Path(__file__).parent
TEST_FILE_1 = TEST_DIR / "test_dynamic_1.xlsx"
TEST_FILE_2 = TEST_DIR / "test_dynamic_2.xlsx"

def create_test_file_1():
    """Create first test file with specific product data"""
    print("=" * 60)
    print("STEP 1: Creating first test file (test_dynamic_1.xlsx)")
    print("=" * 60)
    
    # Use specific product IDs and quantities for verification
    sales_data = [
        {'product_id': 386, 'branch_id': 3, 'quantity': 50, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 386, 'branch_id': 3, 'quantity': 30, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 394, 'branch_id': 3, 'quantity': 25, 'date': datetime.now() - timedelta(days=2)},
        {'product_id': 402, 'branch_id': 3, 'quantity': 15, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 402, 'branch_id': 3, 'quantity': 20, 'date': datetime.now() - timedelta(days=0)},
    ]
    
    df = pd.DataFrame(sales_data)
    df['transaction_date'] = df['date'].dt.strftime('%Y-%m-%d')
    df['unit_price'] = 1000.0
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['payment_method'] = 'cash'
    
    # Reorder columns
    columns_order = ['product_id', 'branch_id', 'quantity', 'date', 'transaction_date', 'unit_price', 'total_amount', 'payment_method']
    df = df[columns_order]
    
    df.to_excel(TEST_FILE_1, index=False, engine='openpyxl')
    
    print(f"[OK] Created {TEST_FILE_1}")
    print(f"  - Total rows: {len(df)}")
    print(f"  - Total quantity: {df['quantity'].sum()}")
    print(f"  - Products: {sorted(df['product_id'].unique().tolist())}")
    print(f"\nExpected results after import:")
    print(f"  - Product 386: 80 units (50 + 30)")
    print(f"  - Product 394: 25 units")
    print(f"  - Product 402: 35 units (15 + 20)")
    print()
    
    return df

def create_test_file_2():
    """Create second test file with DIFFERENT product data"""
    print("=" * 60)
    print("STEP 3: Creating second test file (test_dynamic_2.xlsx) with DIFFERENT data")
    print("=" * 60)
    
    # Use DIFFERENT product IDs and quantities
    sales_data = [
        {'product_id': 409, 'branch_id': 3, 'quantity': 100, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 409, 'branch_id': 3, 'quantity': 50, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 412, 'branch_id': 3, 'quantity': 75, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 537, 'branch_id': 3, 'quantity': 40, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 537, 'branch_id': 3, 'quantity': 60, 'date': datetime.now() - timedelta(days=0)},
    ]
    
    df = pd.DataFrame(sales_data)
    df['transaction_date'] = df['date'].dt.strftime('%Y-%m-%d')
    df['unit_price'] = 2000.0
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['payment_method'] = 'card'
    
    # Reorder columns
    columns_order = ['product_id', 'branch_id', 'quantity', 'date', 'transaction_date', 'unit_price', 'total_amount', 'payment_method']
    df = df[columns_order]
    
    df.to_excel(TEST_FILE_2, index=False, engine='openpyxl')
    
    print(f"[OK] Created {TEST_FILE_2}")
    print(f"  - Total rows: {len(df)}")
    print(f"  - Total quantity: {df['quantity'].sum()}")
    print(f"  - Products: {sorted(df['product_id'].unique().tolist())}")
    print(f"\nExpected results after import:")
    print(f"  - Product 409: 150 units (100 + 50)")
    print(f"  - Product 412: 75 units")
    print(f"  - Product 537: 100 units (40 + 60)")
    print()
    
    return df

def import_file(file_path, file_name):
    """Import an Excel file and return the results"""
    print(f"\n[IMPORT] Importing {file_name}...")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {'branch_id': 3}
            
            response = requests.post(
                f"{ANALYTICS_URL}/sales-data/import",
                files=files,
                data=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[OK] Import successful!")
                print(f"  - Message: {result.get('message')}")
                
                if 'metrics' in result:
                    metrics = result['metrics']
                    print(f"  - Total quantity: {metrics.get('total_quantity')}")
                    print(f"  - Average daily: {metrics.get('average_daily')}")
                
                if 'top_products' in result:
                    print(f"\n  Top Products from import response:")
                    for i, product in enumerate(result['top_products'][:5], 1):
                        pid = product.get('product_id', 'N/A')
                        qty = product.get('total_sold', 0)
                        print(f"    {i}. Product {pid}: {qty} units")
                
                return result
            else:
                print(f"[FAIL] Import failed! Status: {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                return None
                
    except Exception as e:
        print(f"[ERROR] Error importing file: {str(e)}")
        return None

def fetch_top_products():
    """Fetch top products from the database endpoint"""
    print("\n[FETCH] Fetching top products from database...")
    
    try:
        response = requests.get(
            f"{ANALYTICS_URL}/top-products",
            params={'days': 30, 'limit': 10, 'branch_id': 3},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success') and result.get('data'):
                print("[OK] Top Products from database:")
                for i, product in enumerate(result['data'][:5], 1):
                    pid = product.get('product_id', 'N/A')
                    qty = product.get('total_sold', 0)
                    name = product.get('product_name', f'Product {pid}')
                    print(f"  {i}. {name} (ID: {pid}): {qty} units")
                return result['data']
            else:
                print("[WARN] No top products found in database")
                return []
        else:
            print(f"[FAIL] Error fetching top products: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        return None

def compare_results(result1, result2, top1, top2):
    """Compare results from two imports to verify dynamic behavior"""
    print("\n" + "=" * 60)
    print("STEP 5: Comparing Results - Verifying Dynamic Behavior")
    print("=" * 60)
    
    # Extract top products from import responses
    import1_products = {}
    if result1 and 'top_products' in result1:
        for p in result1['top_products']:
            pid = p.get('product_id')
            qty = p.get('total_sold', 0)
            if pid:
                import1_products[pid] = qty
    
    import2_products = {}
    if result2 and 'top_products' in result2:
        for p in result2['top_products']:
            pid = p.get('product_id')
            qty = p.get('total_sold', 0)
            if pid:
                import2_products[pid] = qty
    
    print("\n[IMPORT 1] Top Products from first import:")
    for pid, qty in sorted(import1_products.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  - Product {pid}: {qty} units")
    
    print("\n[IMPORT 2] Top Products from second import:")
    for pid, qty in sorted(import2_products.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  - Product {pid}: {qty} units")
    
    # Check if products are different
    products_1 = set(import1_products.keys())
    products_2 = set(import2_products.keys())
    
    print("\n[VERIFY] Verification:")
    
    if products_1 != products_2:
        print("[PASS] Different products in each import (data is dynamic!)")
        print(f"  - Import 1 products: {sorted(products_1)}")
        print(f"  - Import 2 products: {sorted(products_2)}")
    else:
        print("[WARN] Same products in both imports")
        # Check if quantities are different
        different_quantities = False
        for pid in products_1:
            if import1_products.get(pid, 0) != import2_products.get(pid, 0):
                different_quantities = True
                break
        if different_quantities:
            print("  [PASS] But quantities are different (data is dynamic!)")
        else:
            print("  [FAIL] Quantities are also the same (may not be reading new file)")
    
    # Check metrics
    if result1 and result2:
        qty1 = result1.get('metrics', {}).get('total_quantity', 0)
        qty2 = result2.get('metrics', {}).get('total_quantity', 0)
        
        print(f"\n[METRICS] Total Quantities:")
        print(f"  - Import 1: {qty1} units")
        print(f"  - Import 2: {qty2} units")
        
        if qty1 != qty2:
            print("[PASS] Different total quantities (data is dynamic!)")
        else:
            print("[WARN] Same total quantities")
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    # Final verdict
    is_dynamic = (
        (products_1 != products_2) or
        (result1 and result2 and 
         result1.get('metrics', {}).get('total_quantity', 0) != 
         result2.get('metrics', {}).get('total_quantity', 0))
    )
    
    if is_dynamic:
        print("[SUCCESS] Sales data is being read DYNAMICALLY!")
        print("   The system correctly reads new Excel files each time.")
    else:
        print("[FAILURE] Sales data may not be dynamic.")
        print("   The system might be reading cached/old data.")
    
    return is_dynamic

def main():
    """Run the complete dynamic test"""
    print("\n" + "=" * 60)
    print("DYNAMIC SALES DATA TEST")
    print("Verifying that new Excel files are read correctly")
    print("=" * 60)
    print()
    
    # Check if service is running
    try:
        response = requests.get(f"{ANALYTICS_URL.replace('/api/analytics', '')}/api/health", timeout=5)
        if response.status_code != 200:
            print("[WARN] Analytics service health check failed")
    except:
        print("[ERROR] Cannot connect to analytics service!")
        print(f"   Make sure it's running at {ANALYTICS_URL}")
        return
    
    # Step 1: Create and import first file
    df1 = create_test_file_1()
    result1 = import_file(TEST_FILE_1, "test_dynamic_1.xlsx")
    time.sleep(1)  # Small delay
    top1 = fetch_top_products()
    
    print("\n" + "-" * 60)
    time.sleep(2)  # Wait a bit before second import
    
    # Step 2: Create and import second file (different data)
    df2 = create_test_file_2()
    result2 = import_file(TEST_FILE_2, "test_dynamic_2.xlsx")
    time.sleep(1)  # Small delay
    top2 = fetch_top_products()
    
    # Step 3: Compare results
    is_dynamic = compare_results(result1, result2, top1, top2)
    
    # Cleanup
    print(f"\n[CLEANUP] Cleaning up test files...")
    if TEST_FILE_1.exists():
        TEST_FILE_1.unlink()
        print(f"  [OK] Deleted {TEST_FILE_1.name}")
    if TEST_FILE_2.exists():
        TEST_FILE_2.unlink()
        print(f"  [OK] Deleted {TEST_FILE_2.name}")
    
    return is_dynamic

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
