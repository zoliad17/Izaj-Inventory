"""
Generate a small sample of sales data for testing EOQ Analytics.
This script creates just a few sales records to quickly demonstrate that EOQ analytics is working.

Usage:
  python analytics/tools/generate_testing_sales.py
  python analytics/tools/generate_testing_sales.py --save-to-db  # Also save to database
"""

import os
import sys
import random
from datetime import datetime, timedelta, timezone
import json
import argparse
import pandas as pd
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

# Add the project root to sys.path to enable imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


def load_products_for_testing(json_path=None, branch_id=3, limit=5):
    """
    Load a small number of products for testing.
    
    Args:
        json_path: Path to the JSON file
        branch_id: Branch ID to filter products
        limit: Maximum number of products to load (default: 5)
    """
    if json_path is None:
        json_path = Path(__file__).parent / 'centralized_product_rows.json'
    
    if not json_path.exists():
        print(f"Warning: Product file not found at {json_path}")
        print("Creating minimal test data with default products...")
        # Return minimal test products if file doesn't exist
        return [
            {'id': 1, 'product_name': 'Test Product 1', 'quantity': 100, 'price': 50.0, 'brand_id': branch_id},
            {'id': 2, 'product_name': 'Test Product 2', 'quantity': 80, 'price': 75.0, 'brand_id': branch_id},
            {'id': 3, 'product_name': 'Test Product 3', 'quantity': 60, 'price': 100.0, 'brand_id': branch_id},
        ]
    
    with open(json_path, 'r', encoding='utf-8') as f:
        products_data = json.load(f)
    
    products = []
    for p in products_data:
        # Filter by branch_id if specified
        if branch_id is not None and p.get('branch_id') != branch_id:
            continue
        
        # Only include products with positive quantity
        if p.get('quantity', 0) <= 0:
            continue
        
        products.append({
            'id': p['id'],
            'product_name': p['product_name'],
            'quantity': max(0, p.get('quantity', 0)),
            'price': max(0, p.get('price', 0)),
            'brand_id': p.get('branch_id', branch_id),
        })
        
        # Limit number of products
        if len(products) >= limit:
            break
    
    return products


def generate_testing_sales(products, num_days=7, sales_per_day=2, total_items=None):
    """
    Generate a small number of sales records for testing.
    
    Args:
        products: List of product dictionaries
        num_days: Number of days to generate sales for (default: 7)
        sales_per_day: Average number of sales per day (default: 2)
        total_items: Target total number of sales items to generate (if specified, overrides num_days/sales_per_day)
    
    Returns:
        List of sales row dictionaries
    """
    if not products:
        raise ValueError("No products available for generating sales")
    
    rows = []
    now = datetime.now(timezone.utc).isoformat()
    
    # Track inventory to prevent negative quantities
    inventory_tracker = {p['id']: max(0, p.get('quantity', 0)) for p in products}
    
    payment_methods = ['cash', 'card', 'gcash', 'other']
    
    # If total_items is specified, generate exactly that many (or as close as possible)
    if total_items is not None:
        # Calculate date range based on total_items (spread over reasonable number of days)
        # Use at least 7 days, or more if we need more items
        days_needed = max(7, min(30, (total_items // 2) + 1))
        start_date = datetime.now().date() - timedelta(days=days_needed)
        
        # Generate until we reach the target number of items
        day_offset = 0
        while len(rows) < total_items and day_offset < days_needed:
            d = start_date + timedelta(days=day_offset)
            
            # Try to generate sales for this day
            attempts = 0
            max_attempts = 20  # Prevent infinite loop
            
            while len(rows) < total_items and attempts < max_attempts:
                attempts += 1
                
                # Pick a random product
                product = random.choice(products)
                product_id = product['id']
                
                # Check available inventory
                available = max(0, inventory_tracker.get(product_id, 0))
                if available <= 0:
                    continue
                
                # Generate sale quantity (1-5 units, but never exceed available)
                max_sale = min(5, available)
                if max_sale <= 0:
                    continue
                
                sold = random.randint(1, max_sale)
                
                # Ensure we don't go negative
                sold = min(sold, available)
                if sold <= 0:
                    continue
                
                # Deduct from inventory
                inventory_tracker[product_id] -= sold
                
                unit_price = max(0.0, float(product.get('price', 0)))
                total = sold * unit_price
                
                rows.append({
                    'product_id': int(product_id),
                    'branch_id': int(product.get('brand_id', 3)),
                    'quantity_sold': int(sold),
                    'transaction_date': datetime.combine(d, datetime.min.time()).isoformat(),
                    'unit_price': max(0.0, unit_price),
                    'total_amount': max(0.0, total),
                    'payment_method': random.choice(payment_methods),
                    'created_at': now
                })
            
            day_offset += 1
        
        # If we couldn't generate enough due to inventory constraints, that's okay
        if len(rows) < total_items:
            print(f"   Note: Generated {len(rows)} items (target was {total_items}) due to inventory constraints")
    else:
        # Original logic: generate based on num_days and sales_per_day
        start_date = datetime.now().date() - timedelta(days=num_days)
        
        for day_offset in range(num_days):
            d = start_date + timedelta(days=day_offset)
            
            # Generate 1-3 sales per day
            num_sales_today = random.randint(1, sales_per_day + 1)
            
            for _ in range(num_sales_today):
                # Pick a random product
                product = random.choice(products)
                product_id = product['id']
                
                # Check available inventory
                available = max(0, inventory_tracker.get(product_id, 0))
                if available <= 0:
                    continue
                
                # Generate sale quantity (1-5 units, but never exceed available)
                max_sale = min(5, available)
                if max_sale <= 0:
                    continue
                
                sold = random.randint(1, max_sale)
                
                # Ensure we don't go negative
                sold = min(sold, available)
                if sold <= 0:
                    continue
                
                # Deduct from inventory
                inventory_tracker[product_id] -= sold
                
                unit_price = max(0.0, float(product.get('price', 0)))
                total = sold * unit_price
                
                rows.append({
                    'product_id': int(product_id),
                    'branch_id': int(product.get('brand_id', 3)),
                    'quantity_sold': int(sold),
                    'transaction_date': datetime.combine(d, datetime.min.time()).isoformat(),
                    'unit_price': max(0.0, unit_price),
                    'total_amount': max(0.0, total),
                    'payment_method': random.choice(payment_methods),
                    'created_at': now
                })
    
    return rows


def main():
    parser = argparse.ArgumentParser(
        description='Generate a small sample of sales data for testing EOQ Analytics'
    )
    parser.add_argument(
        '--products', '-p',
        default=None,
        help='Path to products JSON file (default: centralized_product_rows.json)'
    )
    parser.add_argument(
        '--branch-id', '-b',
        type=int,
        default=3,
        help='Branch ID to filter products (default: 3)'
    )
    parser.add_argument(
        '--days', '-d',
        type=int,
        default=7,
        help='Number of days to generate sales for (default: 7)'
    )
    parser.add_argument(
        '--sales-per-day', '-s',
        type=int,
        default=2,
        help='Average number of sales per day (default: 2, ignored if --total-items is specified)'
    )
    parser.add_argument(
        '--total-items', '-t',
        type=int,
        default=30,
        help='Total number of sales items to generate (default: 30, overrides --days and --sales-per-day)'
    )
    parser.add_argument(
        '--num-products', '-n',
        type=int,
        default=5,
        help='Maximum number of products to use (default: 5)'
    )
    parser.add_argument(
        '--save-to-db',
        action='store_true',
        help='Save generated sales to database (requires DB connection)'
    )
    parser.add_argument(
        '--outdir', '-o',
        default=str(Path(__file__).parent),
        help='Output directory (default: script directory)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Generating Testing Sales Data for EOQ Analytics")
    print("=" * 70)
    
    # Load products
    print(f"\n1. Loading products (branch_id={args.branch_id}, limit={args.num_products})...")
    products = load_products_for_testing(
        json_path=args.products,
        branch_id=args.branch_id,
        limit=args.num_products
    )
    print(f"   ✓ Loaded {len(products)} products")
    for p in products:
        print(f"      - {p['product_name']} (ID: {p['id']}, Qty: {p['quantity']}, Price: ₱{p['price']:.2f})")
    
    # Generate sales
    if args.total_items:
        print(f"\n2. Generating sales (target: {args.total_items} items)...")
    else:
        print(f"\n2. Generating sales ({args.days} days, ~{args.sales_per_day} sales/day)...")
    rows = generate_testing_sales(
        products,
        num_days=args.days,
        sales_per_day=args.sales_per_day,
        total_items=args.total_items
    )
    print(f"   ✓ Generated {len(rows)} sales records")
    
    if not rows:
        print("\n✗ ERROR: No sales records generated!")
        print("   Make sure products have positive quantities.")
        return
    
    # Validate rows
    invalid_rows = [r for r in rows if r.get('quantity_sold', 0) <= 0]
    if invalid_rows:
        print(f"\n✗ ERROR: Found {len(invalid_rows)} invalid rows!")
        raise ValueError("Generated sales contain invalid quantities")
    
    # Create DataFrame
    df = pd.DataFrame(rows)
    
    # Normalize datetime columns
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
    
    # Add 'quantity' column for CSV compatibility
    if 'quantity_sold' in df.columns and 'quantity' not in df.columns:
        df['quantity'] = df['quantity_sold']
    
    # Save to CSV
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    
    csv_path = outdir / 'sample_sales_testing.csv'
    df.to_csv(csv_path, index=False)
    print(f"\n3. Saved CSV file: {csv_path}")
    print(f"   - Rows: {len(df)}")
    print(f"   - Columns: {', '.join(df.columns)}")
    
    # Show summary
    print(f"\n4. Sales Summary:")
    print(f"   - Total sales: {df['quantity_sold'].sum()} units")
    print(f"   - Total revenue: ₱{df['total_amount'].sum():.2f}")
    print(f"   - Date range: {df['transaction_date'].min().date()} to {df['transaction_date'].max().date()}")
    print(f"   - Products sold: {df['product_id'].nunique()}")
    
    # Save to database if requested
    if args.save_to_db:
        try:
            print(f"\n5. Saving to database...")
            try:
                from analytics import db as db_module
            except ImportError:
                sys.path.insert(0, str(Path(__file__).parent.parent))
                from analytics import db as db_module
            
            # Convert rows to format expected by insert_sales_rows
            db_rows = []
            for row in rows:
                db_rows.append({
                    'product_id': row['product_id'],
                    'branch_id': row['branch_id'],
                    'quantity_sold': row['quantity_sold'],
                    'transaction_date': row['transaction_date'],
                    'unit_price': row['unit_price'],
                    'total_amount': row['total_amount'],
                    'payment_method': row['payment_method'],
                    'created_at': row['created_at']
                })
            
            inserted_count = db_module.insert_sales_rows(db_rows)
            print(f"   ✓ Successfully inserted {inserted_count} sales rows to database")
        except ValueError as e:
            error_msg = str(e)
            if 'Stock deduction would result in negative quantities' in error_msg:
                print(f"   ✗ ERROR: Cannot insert sales - would result in negative stock")
                print(f"   {error_msg}")
            else:
                print(f"   ✗ ERROR: {error_msg}")
            raise
        except Exception as e:
            print(f"   ✗ ERROR inserting to database: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    print("\n" + "=" * 70)
    print("✓ Testing sales data generated successfully!")
    print("=" * 70)
    print(f"\nNext steps:")
    print(f"1. Upload '{csv_path.name}' to the EOQ Analytics Dashboard")
    print(f"2. Verify that EOQ calculations are displayed")
    print(f"3. Check that charts and analytics are working")
    print()


if __name__ == '__main__':
    main()

