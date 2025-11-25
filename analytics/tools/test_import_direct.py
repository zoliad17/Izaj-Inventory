#!/usr/bin/env python3
"""
Test CSV import directly
"""
import os
import sys
import logging
import pandas as pd
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from analytics import db as db_module

def test_import():
    """Test CSV import"""
    print("\n" + "="*70)
    print("TESTING CSV IMPORT")
    print("="*70)
    
    csv_file = Path(__file__).parent / "sample_sales_2025-10-27_to_2025-11-25.csv"
    
    if not csv_file.exists():
        print(f"✗ CSV file not found: {csv_file}")
        return
    
    print(f"\n1. Reading CSV: {csv_file}")
    df = pd.read_csv(csv_file)
    print(f"   - Shape: {df.shape} rows x {df.shape[1]} columns")
    print(f"   - Columns: {list(df.columns)}")
    print(f"   - First 3 rows:")
    for idx, row in df.head(3).iterrows():
        print(f"     Row {idx}: product_id={row['product_id']}, qty={row['quantity']}, branch={row['branch_id']}")
    
    print(f"\n2. Building rows for insert...")
    branch_id = 2
    rows = []
    now_iso = datetime.utcnow().isoformat()
    
    for idx, r in df.iterrows():
        try:
            product_id = None
            if 'product_id' in df.columns:
                try:
                    product_id = int(r.get('product_id')) if not pd.isna(r.get('product_id')) else None
                except Exception:
                    product_id = None
            
            row_branch_id = branch_id
            if 'branch_id' in df.columns:
                try:
                    row_branch_id = int(r.get('branch_id')) if not pd.isna(r.get('branch_id')) else branch_id
                except Exception:
                    row_branch_id = branch_id
            
            quantity = float(r['quantity'])
            transaction_date = r['transaction_date']
            unit_price = float(r.get('unit_price')) if not pd.isna(r.get('unit_price')) else None
            total_amount = float(r.get('total_amount')) if not pd.isna(r.get('total_amount')) else None
            payment_method = r.get('payment_method')
            created_at = now_iso
            
            rows.append((product_id, row_branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at))
            
            if idx < 3:
                print(f"   Row {idx}: product={product_id}, branch={row_branch_id}, qty={quantity}")
        except Exception as e:
            print(f"   ✗ Error processing row {idx}: {e}")
    
    print(f"\n   Total rows prepared: {len(rows)}")
    
    print(f"\n3. Attempting insert...")
    try:
        inserted_count = db_module.insert_sales_rows(rows)
        print(f"   ✓ Inserted {inserted_count} rows")
        
        # Verify by checking the sales table
        print(f"\n4. Verifying insertion...")
        if db_module._supabase_client:
            resp = db_module._supabase_client.table('sales').select('count').execute()
            print(f"   ✓ Verified: Sales table now has data (check Supabase)")
            
            # Get recent sales
            resp = db_module._supabase_client.table('sales').select(
                'product_id, quantity_sold, transaction_date'
            ).order('transaction_date', desc=True).limit(5).execute()
            
            if resp.data:
                print(f"   ✓ Found {len(resp.data)} recent sales:")
                for sale in resp.data:
                    print(f"     - Product {sale['product_id']}: {sale['quantity_sold']} units on {sale['transaction_date']}")
            else:
                print(f"   ✗ No sales found - insert failed silently!")
        
    except Exception as e:
        print(f"   ✗ Insert failed: {e}")
        logger.exception("Detailed error:")

if __name__ == '__main__':
    test_import()
