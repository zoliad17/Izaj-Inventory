#!/usr/bin/env python3
"""
Diagnostic script to check if CSV import is working and stock is being deducted
"""
import os
import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from analytics import db as db_module

def check_sales_table():
    """Check current state of sales table"""
    print("\n" + "="*70)
    print("CHECKING SALES TABLE")
    print("="*70)
    
    try:
        if db_module._supabase_client:
            # Check row count in sales table
            resp = db_module._supabase_client.table('sales').select('count').execute()
            print(f"\n✓ Connected to Supabase")
            
            # Get recent sales
            resp = db_module._supabase_client.table('sales').select(
                'product_id, branch_id, quantity_sold, transaction_date'
            ).order('transaction_date', desc=True).limit(10).execute()
            
            if resp.data:
                print(f"\n✓ Found {len(resp.data)} recent sales records:")
                for sale in resp.data:
                    print(f"  - Product {sale['product_id']}, Branch {sale['branch_id']}, "
                          f"Qty {sale['quantity_sold']}, Date {sale['transaction_date']}")
            else:
                print(f"\n✗ NO DATA in sales table - this is the problem!")
                
        else:
            print("✗ Supabase client not configured")
            
    except Exception as e:
        print(f"✗ Error checking sales table: {e}")
        logger.exception("Detailed error:")

def check_centralized_product():
    """Check current state of centralized_product table"""
    print("\n" + "="*70)
    print("CHECKING CENTRALIZED_PRODUCT TABLE")
    print("="*70)
    
    try:
        if db_module._supabase_client:
            # Get sample products
            resp = db_module._supabase_client.table('centralized_product').select(
                'id, product_name, quantity, branch_id'
            ).limit(5).execute()
            
            if resp.data:
                print(f"\n✓ Found {len(resp.data)} products:")
                for prod in resp.data:
                    print(f"  - ID {prod['id']}, {prod['product_name'][:40]}, "
                          f"Qty {prod['quantity']}, Branch {prod['branch_id']}")
            else:
                print(f"\n✗ NO PRODUCTS in centralized_product table")
                
    except Exception as e:
        print(f"✗ Error checking centralized_product table: {e}")
        logger.exception("Detailed error:")

def check_stock_deduction_modal():
    """Check if stock deduction endpoint returns data"""
    print("\n" + "="*70)
    print("CHECKING STOCK DEDUCTION ENDPOINT LOGIC")
    print("="*70)
    
    try:
        branch_id = 2
        import datetime
        
        if db_module._supabase_client:
            # Simulate what the endpoint does
            start_date = (datetime.datetime.utcnow() - datetime.timedelta(days=1)).isoformat()
            
            print(f"\nQuerying sales for branch {branch_id} since {start_date}")
            
            resp = db_module._supabase_client.table('sales').select(
                'product_id, branch_id, quantity_sold, transaction_date'
            ).eq('branch_id', branch_id).gte('transaction_date', start_date).execute()
            
            print(f"\n✓ Query returned {len(resp.data or [])} sales records")
            
            if not resp.data:
                print("✗ NO SALES DATA - Modal will show empty list")
                return
            
            # Group by product
            sales_by_product = {}
            for sale in resp.data:
                product_id = sale['product_id']
                if product_id not in sales_by_product:
                    sales_by_product[product_id] = {
                        'quantity_sold': 0,
                        'transaction_dates': []
                    }
                sales_by_product[product_id]['quantity_sold'] += sale['quantity_sold']
                sales_by_product[product_id]['transaction_dates'].append(sale['transaction_date'])
            
            print(f"\n✓ Sales grouped by product: {len(sales_by_product)} unique products")
            for pid, info in list(sales_by_product.items())[:3]:
                print(f"  - Product {pid}: {info['quantity_sold']} units")
            
            # Get product details
            product_ids = list(sales_by_product.keys())
            resp_products = db_module._supabase_client.table('centralized_product').select(
                'id, product_name, quantity'
            ).eq('branch_id', branch_id).in_('id', product_ids).execute()
            
            print(f"\n✓ Found {len(resp_products.data or [])} products in centralized_product")
            
            if resp_products.data:
                for prod in resp_products.data[:3]:
                    print(f"  - ID {prod['id']}: {prod['product_name'][:40]}, Qty {prod['quantity']}")
            else:
                print("✗ Products not found in centralized_product!")
                
    except Exception as e:
        print(f"✗ Error in endpoint logic: {e}")
        logger.exception("Detailed error:")

def main():
    print("\n" + "="*70)
    print("IMPORT & STOCK DEDUCTION DIAGNOSTIC")
    print("="*70)
    
    check_sales_table()
    check_centralized_product()
    check_stock_deduction_modal()
    
    print("\n" + "="*70)
    print("DIAGNOSTIC COMPLETE")
    print("="*70 + "\n")

if __name__ == '__main__':
    main()
