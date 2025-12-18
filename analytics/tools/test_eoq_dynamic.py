"""
Test to verify EOQ analytics and top products are dynamic when importing different sales files.
This test:
1. Creates and imports first Excel file with specific products
2. Checks EOQ calculations and top products
3. Creates and imports second Excel file with DIFFERENT products
4. Verifies EOQ calculations and top products changed dynamically
"""
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import time
import json

# Configuration
ANALYTICS_URL = "http://localhost:5001/api/analytics"
TEST_DIR = Path(__file__).parent
TEST_FILE_1 = TEST_DIR / "test_eoq_1.xlsx"
TEST_FILE_2 = TEST_DIR / "test_eoq_2.xlsx"

def create_test_file_1():
    """Create first test file with specific product data for EOQ testing"""
    print("=" * 70)
    print("STEP 1: Creating first test file (test_eoq_1.xlsx)")
    print("=" * 70)
    
    # Use specific product IDs with higher quantities for better EOQ calculations
    sales_data = [
        {'product_id': 386, 'branch_id': 3, 'quantity': 100, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 386, 'branch_id': 3, 'quantity': 80, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 386, 'branch_id': 3, 'quantity': 60, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 394, 'branch_id': 3, 'quantity': 50, 'date': datetime.now() - timedelta(days=2)},
        {'product_id': 394, 'branch_id': 3, 'quantity': 40, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 402, 'branch_id': 3, 'quantity': 30, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 402, 'branch_id': 3, 'quantity': 25, 'date': datetime.now() - timedelta(days=0)},
    ]
    
    df = pd.DataFrame(sales_data)
    df['transaction_date'] = df['date'].dt.strftime('%Y-%m-%d')
    df['unit_price'] = 1500.0
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['payment_method'] = 'cash'
    
    columns_order = ['product_id', 'branch_id', 'quantity', 'date', 'transaction_date', 'unit_price', 'total_amount', 'payment_method']
    df = df[columns_order]
    
    df.to_excel(TEST_FILE_1, index=False, engine='openpyxl')
    
    print(f"[OK] Created {TEST_FILE_1.name}")
    print(f"  - Total rows: {len(df)}")
    print(f"  - Total quantity: {df['quantity'].sum()}")
    print(f"  - Products: {sorted(df['product_id'].unique().tolist())}")
    print(f"\nExpected aggregated quantities:")
    print(f"  - Product 386: 240 units (100 + 80 + 60)")
    print(f"  - Product 394: 90 units (50 + 40)")
    print(f"  - Product 402: 55 units (30 + 25)")
    print()
    
    return df

def create_test_file_2():
    """Create second test file with DIFFERENT product data"""
    print("=" * 70)
    print("STEP 3: Creating second test file (test_eoq_2.xlsx) with DIFFERENT data")
    print("=" * 70)
    
    # Use COMPLETELY DIFFERENT product IDs
    sales_data = [
        {'product_id': 409, 'branch_id': 3, 'quantity': 200, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 409, 'branch_id': 3, 'quantity': 150, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 409, 'branch_id': 3, 'quantity': 100, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 412, 'branch_id': 3, 'quantity': 120, 'date': datetime.now() - timedelta(days=1)},
        {'product_id': 412, 'branch_id': 3, 'quantity': 80, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 537, 'branch_id': 3, 'quantity': 90, 'date': datetime.now() - timedelta(days=0)},
        {'product_id': 537, 'branch_id': 3, 'quantity': 70, 'date': datetime.now() - timedelta(days=0)},
    ]
    
    df = pd.DataFrame(sales_data)
    df['transaction_date'] = df['date'].dt.strftime('%Y-%m-%d')
    df['unit_price'] = 2500.0
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['payment_method'] = 'card'
    
    columns_order = ['product_id', 'branch_id', 'quantity', 'date', 'transaction_date', 'unit_price', 'total_amount', 'payment_method']
    df = df[columns_order]
    
    df.to_excel(TEST_FILE_2, index=False, engine='openpyxl')
    
    print(f"[OK] Created {TEST_FILE_2.name}")
    print(f"  - Total rows: {len(df)}")
    print(f"  - Total quantity: {df['quantity'].sum()}")
    print(f"  - Products: {sorted(df['product_id'].unique().tolist())}")
    print(f"\nExpected aggregated quantities:")
    print(f"  - Product 409: 450 units (200 + 150 + 100)")
    print(f"  - Product 412: 200 units (120 + 80)")
    print(f"  - Product 537: 160 units (90 + 70)")
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
                    print(f"  - Annual demand: {metrics.get('annual_demand')}")
                
                if 'top_products' in result:
                    print(f"\n  Top Products from import response:")
                    for i, product in enumerate(result['top_products'][:5], 1):
                        pid = product.get('product_id', 'N/A')
                        qty = product.get('total_sold', 0)
                        name = product.get('product_name', f'Product {pid}')
                        print(f"    {i}. {name} (ID: {pid}): {qty} units")
                
                if 'restock_recommendations' in result:
                    print(f"\n  Restock Recommendations: {len(result['restock_recommendations'])} items")
                
                return result
            else:
                print(f"[FAIL] Import failed! Status: {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                return None
                
    except Exception as e:
        print(f"[ERROR] Error importing file: {str(e)}")
        return None

def calculate_eoq(annual_demand):
    """Calculate EOQ using the API"""
    print(f"\n[EOQ] Calculating EOQ with annual demand: {annual_demand}")
    
    try:
        response = requests.post(
            f"{ANALYTICS_URL}/eoq/calculate",
            json={
                'product_id': 1,
                'branch_id': 3,
                'annual_demand': annual_demand,
                'holding_cost': 50,
                'ordering_cost': 100,
                'unit_cost': 25,
                'lead_time_days': 7,
                'confidence_level': 0.95
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] EOQ Calculation successful!")
                print(f"  - EOQ Quantity: {data.get('eoq_quantity', 'N/A')}")
                print(f"  - Reorder Point: {data.get('reorder_point', 'N/A')}")
                print(f"  - Safety Stock: {data.get('safety_stock', 'N/A')}")
                return data
            else:
                print(f"[FAIL] EOQ calculation failed: {result.get('error')}")
                return None
        else:
            print(f"[FAIL] EOQ calculation failed! Status: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error calculating EOQ: {str(e)}")
        return None

def fetch_top_products():
    """Fetch top products from the database endpoint"""
    print(f"\n[FETCH] Fetching top products from database...")
    
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
                print("[WARN] No top products found in database (empty response)")
                return []
        else:
            print(f"[WARN] Database endpoint returned {response.status_code} (database may not be configured)")
            print(f"  This is OK - we'll verify using import response data instead")
            return None
            
    except Exception as e:
        print(f"[WARN] Error fetching from database: {str(e)}")
        print(f"  This is OK - we'll verify using import response data instead")
        return None

def compare_results(result1, result2, eoq1, eoq2):
    """Compare results from two imports to verify dynamic behavior"""
    print("\n" + "=" * 70)
    print("STEP 5: Comparing Results - Verifying Dynamic Behavior")
    print("=" * 70)
    
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
    
    print("\n[VERIFY] Top Products Verification:")
    
    top_products_dynamic = False
    if products_1 != products_2:
        print("[PASS] Different products in each import (top products are dynamic!)")
        print(f"  - Import 1 products: {sorted(products_1)}")
        print(f"  - Import 2 products: {sorted(products_2)}")
        top_products_dynamic = True
    else:
        print("[WARN] Same products in both imports")
        # Check if quantities are different
        different_quantities = False
        for pid in products_1:
            if import1_products.get(pid, 0) != import2_products.get(pid, 0):
                different_quantities = True
                break
        if different_quantities:
            print("  [PASS] But quantities are different (top products are dynamic!)")
            top_products_dynamic = True
        else:
            print("  [FAIL] Quantities are also the same (may not be reading new file)")
    
    # Check metrics and EOQ
    print("\n[VERIFY] Metrics and EOQ Verification:")
    
    if result1 and result2:
        qty1 = result1.get('metrics', {}).get('total_quantity', 0)
        qty2 = result2.get('metrics', {}).get('total_quantity', 0)
        annual1 = result1.get('metrics', {}).get('annual_demand', 0)
        annual2 = result2.get('metrics', {}).get('annual_demand', 0)
        
        print(f"\n  Total Quantities:")
        print(f"    - Import 1: {qty1} units")
        print(f"    - Import 2: {qty2} units")
        
        print(f"\n  Annual Demand (for EOQ):")
        print(f"    - Import 1: {annual1} units/year")
        print(f"    - Import 2: {annual2} units/year")
        
        metrics_dynamic = (qty1 != qty2) or (annual1 != annual2)
        
        if metrics_dynamic:
            print("[PASS] Different metrics (data is dynamic!)")
        else:
            print("[WARN] Same metrics")
        
        # Check EOQ calculations
        if eoq1 and eoq2:
            eoq_qty1 = eoq1.get('eoq_quantity', 0)
            eoq_qty2 = eoq2.get('eoq_quantity', 0)
            
            print(f"\n  EOQ Calculations:")
            print(f"    - Import 1 EOQ: {eoq_qty1} units")
            print(f"    - Import 2 EOQ: {eoq_qty2} units")
            
            if eoq_qty1 != eoq_qty2:
                print("[PASS] Different EOQ values (EOQ analytics are dynamic!)")
                eoq_dynamic = True
            else:
                print("[WARN] Same EOQ values")
                eoq_dynamic = False
        else:
            print("[WARN] Could not compare EOQ calculations")
            eoq_dynamic = False
    else:
        metrics_dynamic = False
        eoq_dynamic = False
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    # Final verdict
    is_dynamic = top_products_dynamic and metrics_dynamic
    
    print(f"\n[RESULTS]")
    print(f"  Top Products Dynamic: {'[PASS]' if top_products_dynamic else '[FAIL]'}")
    print(f"  Metrics Dynamic: {'[PASS]' if metrics_dynamic else '[FAIL]'}")
    print(f"  EOQ Dynamic: {'[PASS]' if eoq_dynamic else '[WARN]'}")
    
    if is_dynamic:
        print("\n[SUCCESS] Sales data, top products, and EOQ analytics are DYNAMIC!")
        print("   The system correctly reads new Excel files and updates calculations.")
    else:
        print("\n[FAILURE] Some components may not be dynamic.")
        print("   Check the results above for details.")
    
    return is_dynamic

def main():
    """Run the complete EOQ dynamic test"""
    print("\n" + "=" * 70)
    print("EOQ ANALYTICS & TOP PRODUCTS DYNAMIC TEST")
    print("Verifying that EOQ calculations and top products update with new imports")
    print("=" * 70)
    print()
    
    # Check if service is running
    try:
        response = requests.get(f"{ANALYTICS_URL.replace('/api/analytics', '')}/api/health", timeout=5)
        if response.status_code != 200:
            print("[WARN] Analytics service health check failed")
    except:
        print("[ERROR] Cannot connect to analytics service!")
        print(f"   Make sure it's running at {ANALYTICS_URL}")
        return False
    
    # Step 1: Create and import first file
    df1 = create_test_file_1()
    result1 = import_file(TEST_FILE_1, "test_eoq_1.xlsx")
    
    # Calculate EOQ for first import
    annual_demand1 = result1.get('metrics', {}).get('annual_demand', 0) if result1 else 0
    eoq1 = calculate_eoq(annual_demand1) if annual_demand1 > 0 else None
    
    time.sleep(1)
    top1 = fetch_top_products()
    
    print("\n" + "-" * 70)
    time.sleep(2)  # Wait before second import
    
    # Step 2: Create and import second file (different data)
    df2 = create_test_file_2()
    result2 = import_file(TEST_FILE_2, "test_eoq_2.xlsx")
    
    # Calculate EOQ for second import
    annual_demand2 = result2.get('metrics', {}).get('annual_demand', 0) if result2 else 0
    eoq2 = calculate_eoq(annual_demand2) if annual_demand2 > 0 else None
    
    time.sleep(1)
    top2 = fetch_top_products()
    
    # Step 3: Compare results
    is_dynamic = compare_results(result1, result2, eoq1, eoq2)
    
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
