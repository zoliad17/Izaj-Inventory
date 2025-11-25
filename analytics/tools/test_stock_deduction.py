#!/usr/bin/env python3
"""
Debug script to test stock deduction functionality
"""
import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import analytics module
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from analytics import db as db_module

def test_stock_deduction():
    """Test that stock deduction works"""
    
    print("\n" + "="*60)
    print("STOCK DEDUCTION TEST")
    print("="*60)
    
    # Test data: 597 sales from CSV
    test_sales = [
        (221, 2, 1, '2025-10-27', 146.16, 146.16, 'cash', datetime.utcnow().isoformat()),
        (222, 2, 3, '2025-10-27', 387.56, 1162.68, 'cash', datetime.utcnow().isoformat()),
        (223, 2, 4, '2025-10-27', 134.36, 537.44, 'gcash', datetime.utcnow().isoformat()),
        (224, 2, 2, '2025-10-27', 1772.67, 3545.34, 'gcash', datetime.utcnow().isoformat()),
    ]
    
    print(f"\n1. Test data: {len(test_sales)} sample sales records")
    for i, sale in enumerate(test_sales, 1):
        product_id, branch_id, qty, date, uprice, tamt, pmethod, created = sale
        print(f"   {i}. Product {product_id}, Branch {branch_id}, Qty {qty} units")
    
    # Check if Supabase is configured
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    print(f"\n2. Database Configuration:")
    print(f"   - Supabase URL: {'✓ Configured' if supabase_url else '✗ NOT configured'}")
    print(f"   - Supabase Key: {'✓ Configured' if supabase_key else '✗ NOT configured'}")
    
    if supabase_url and supabase_key:
        print(f"   - Using: Supabase (cloud)")
        db_type = 'supabase'
    else:
        print(f"   - Using: PostgreSQL (local psycopg2)")
        db_type = 'psycopg2'
        db_host = os.getenv('DB_HOST')
        db_name = os.getenv('DB_NAME')
        db_user = os.getenv('DB_USER')
        print(f"   - DB Host: {db_host or 'NOT configured'}")
        print(f"   - DB Name: {db_name or 'NOT configured'}")
        print(f"   - DB User: {db_user or 'NOT configured'}")
    
    # Try to insert
    print(f"\n3. Attempting to insert sales records...")
    try:
        inserted = db_module.insert_sales_rows(test_sales)
        print(f"   ✓ Successfully inserted {inserted} sales records")
        
        # Check if stock was deducted
        print(f"\n4. Verifying stock deduction...")
        if db_type == 'supabase':
            # Query via Supabase
            try:
                from analytics.db import _supabase_client
                resp = _supabase_client.table('centralized_product').select('id, quantity').in_('id', [221, 222, 223, 224]).eq('branch_id', 2).execute()
                if resp.data:
                    print(f"   ✓ Stock levels after insert:")
                    for item in resp.data:
                        print(f"     - Product {item['id']}: {item['quantity']} units")
                else:
                    print(f"   ✗ Could not fetch stock levels")
            except Exception as e:
                print(f"   ✗ Error checking stock: {str(e)}")
        else:
            # Query via psycopg2
            try:
                conn = db_module.get_conn()
                cur = conn.cursor()
                cur.execute('''
                    SELECT id, quantity FROM centralized_product 
                    WHERE branch_id = 2 AND id IN (221, 222, 223, 224)
                    ORDER BY id
                ''')
                rows = cur.fetchall()
                if rows:
                    print(f"   ✓ Stock levels after insert:")
                    for prod_id, qty in rows:
                        print(f"     - Product {prod_id}: {qty} units")
                cur.close()
                conn.close()
            except Exception as e:
                print(f"   ✗ Error checking stock: {str(e)}")
        
        # Check sales table
        print(f"\n5. Verifying sales were recorded...")
        if db_type == 'supabase':
            try:
                from analytics.db import _supabase_client
                resp = _supabase_client.table('sales').select('product_id, quantity_sold, transaction_date').eq('branch_id', 2).limit(5).execute()
                if resp.data:
                    print(f"   ✓ Found {len(resp.data)} recent sales in database:")
                    for item in resp.data:
                        print(f"     - Product {item['product_id']}: {item['quantity_sold']} units on {item['transaction_date']}")
                else:
                    print(f"   ✗ No sales found in database")
            except Exception as e:
                print(f"   ✗ Error checking sales: {str(e)}")
        else:
            try:
                conn = db_module.get_conn()
                cur = conn.cursor()
                cur.execute('''
                    SELECT product_id, quantity_sold, transaction_date FROM sales 
                    WHERE branch_id = 2
                    ORDER BY created_at DESC
                    LIMIT 5
                ''')
                rows = cur.fetchall()
                if rows:
                    print(f"   ✓ Found {len(rows)} recent sales in database:")
                    for prod_id, qty, tdate in rows:
                        print(f"     - Product {prod_id}: {qty} units on {tdate}")
                cur.close()
                conn.close()
            except Exception as e:
                print(f"   ✗ Error checking sales: {str(e)}")
        
    except Exception as e:
        print(f"   ✗ Insert failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60 + "\n")

if __name__ == '__main__':
    test_stock_deduction()
