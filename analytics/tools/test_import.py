"""
Test script to upload the Excel file and verify the import works correctly.
"""
import requests
import os
from pathlib import Path

# Configuration
ANALYTICS_URL = "http://localhost:5001/api/analytics"
EXCEL_FILE = Path(__file__).parent / "test_sales_new.xlsx"

def test_import():
    """Test importing the Excel file"""
    
    if not EXCEL_FILE.exists():
        print(f"Error: Excel file not found at {EXCEL_FILE}")
        return
    
    print(f"Testing import of: {EXCEL_FILE}")
    print(f"File size: {EXCEL_FILE.stat().st_size} bytes")
    print()
    
    # Prepare file upload
    with open(EXCEL_FILE, 'rb') as f:
        files = {'file': (EXCEL_FILE.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        data = {'branch_id': 3}
        
        print("Uploading file to analytics service...")
        try:
            response = requests.post(
                f"{ANALYTICS_URL}/sales-data/import",
                files=files,
                data=data,
                timeout=60
            )
            
            print(f"Status Code: {response.status_code}")
            print()
            
            if response.status_code == 200:
                result = response.json()
                print("Import successful!")
                print(f"Success: {result.get('success')}")
                print(f"Message: {result.get('message')}")
                print()
                
                if 'metrics' in result:
                    metrics = result['metrics']
                    print("Metrics:")
                    print(f"  - Total quantity: {metrics.get('total_quantity')}")
                    print(f"  - Average daily: {metrics.get('average_daily')}")
                    print(f"  - Annual demand: {metrics.get('annual_demand')}")
                    print(f"  - Days of data: {metrics.get('days_of_data')}")
                    print(f"  - Date range: {metrics.get('date_range', {}).get('start')} to {metrics.get('date_range', {}).get('end')}")
                    print()
                
                if 'top_products' in result:
                    print("Top Products from import:")
                    for i, product in enumerate(result['top_products'][:5], 1):
                        print(f"  {i}. Product {product.get('product_id')}: {product.get('total_sold')} units sold")
                    print()
                
                if 'db_inserted' in result:
                    print(f"Database rows inserted: {result['db_inserted']}")
                    print()
                
                # Now test fetching top products
                print("Testing top products endpoint...")
                top_response = requests.get(
                    f"{ANALYTICS_URL}/top-products",
                    params={'days': 30, 'limit': 10, 'branch_id': 3},
                    timeout=30
                )
                
                if top_response.status_code == 200:
                    top_result = top_response.json()
                    if top_result.get('success') and top_result.get('data'):
                        print("Top Products from database:")
                        for i, product in enumerate(top_result['data'][:5], 1):
                            product_name = product.get('product_name') or f"Product {product.get('product_id')}"
                            print(f"  {i}. {product_name}: {product.get('total_sold')} units sold")
                    else:
                        print("No top products found in database")
                else:
                    print(f"Error fetching top products: {top_response.status_code}")
                    print(top_response.text)
                
            else:
                print("Import failed!")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to analytics service.")
            print(f"Make sure the analytics service is running at {ANALYTICS_URL}")
        except requests.exceptions.Timeout:
            print("Error: Request timed out")
        except Exception as e:
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_import()
