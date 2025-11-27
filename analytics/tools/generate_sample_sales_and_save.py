"""
Generate one-month sample sales from the provided product catalog
and insert them into Supabase `sales` table, then compute EOQ per product
and persist to `eoq_calculations`.

Usage:
  python analytics/tools/generate_sample_sales_and_save.py

Make sure you have environment variables set (SUPABASE_URL and SUPABASE_ANON_KEY)
or alternatively DB_HOST/DB_NAME/DB_USER/DB_PASSWORD if you want to use local Postgres.
"""

import os
import random
from datetime import datetime, timedelta
import json
import calendar

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import argparse
import pandas as pd
from pathlib import Path


def load_products_from_json(json_path=None, branch_id=None):
    """
    Load products from centralized-product.json and infer velocity based on category and product name.
    
    Velocity rules:
    - fast: Category 2 (bulbs) and 12 (LED strips) - high turnover items
    - slow: Category 1 (chandeliers), expensive items (>50000), or luxury keywords
    - medium: Everything else
    
    Args:
        json_path: Path to the JSON file (default: centralized-product.json in script directory)
        branch_id: Optional branch_id to filter products (default: None, returns all products)
    """
    if json_path is None:
        json_path = Path(__file__).parent / 'centralized-product.json'
    
    with open(json_path, 'r', encoding='utf-8') as f:
        products_data = json.load(f)
    
    products = []
    luxury_keywords = ['chandelier', 'crystal', 'gold', 'brass', 'vintage', 'decorative']
    
    for p in products_data:
        # Filter by branch_id if specified
        if branch_id is not None and p.get('branch_id') != branch_id:
            continue
        
        category_id = p.get('category_id')
        product_name = p.get('product_name', '').lower()
        price = p.get('price', 0)
        
        # Determine velocity
        if category_id in [2, 12]:  # Bulbs and LED strips
            velocity = 'fast'
        elif category_id == 1 or price > 50000 or any(kw in product_name for kw in luxury_keywords):
            velocity = 'slow'
        else:
            velocity = 'medium'
        
        products.append({
            'id': p['id'],
            'product_name': p['product_name'],
            'quantity': p['quantity'],
            'price': p['price'],
            'category_id': p['category_id'],
            'branch_id': p['branch_id'],
            'velocity': velocity
        })
    
    return products


# Load products from JSON file (only branch_id 3)
PRODUCTS = load_products_from_json(branch_id=3)

PAYMENT_METHODS = ['cash', 'card', 'gcash', 'other']

# Calculate current calendar month date range
now = datetime.utcnow()
START_DATE = datetime(now.year, now.month, 1).date()
# Get last day of current month
last_day = calendar.monthrange(now.year, now.month)[1]
END_DATE = datetime(now.year, now.month, last_day).date()
DAYS = (END_DATE - START_DATE).days + 1  # +1 to include both start and end dates


def generate_sales_rows():
    """
    Generate realistic daily sales with product velocity patterns.
    Tracks inventory per product per day to prevent negative quantities.
    - fast: high-demand items (bulbs, strips) - 1-5 units/day average
    - medium: moderate demand - 0.5-2 units/day average  
    - slow: luxury/specialty items - 0-1 units/day average
    """
    rows = []
    now = datetime.utcnow().isoformat()
    
    # Track remaining inventory for each product across days
    inventory_tracker = {p['id']: p['quantity'] for p in PRODUCTS}
    
    # Define velocity patterns for realistic daily sales
    velocity_patterns = {
        'fast': {'mean': 3.5, 'std': 1.5},      # High turnover (bulbs, strips)
        'medium': {'mean': 1.2, 'std': 0.8},    # Regular sales
        'slow': {'mean': 0.3, 'std': 0.3}       # Specialty/luxury items
    }
    
    for day_offset in range(DAYS):
        d = START_DATE + timedelta(days=day_offset)
        for p in PRODUCTS:
            # Skip if inventory depleted
            if inventory_tracker[p['id']] <= 0:
                continue
            
            # Get velocity pattern for this product
            velocity = p.get('velocity', 'medium')
            pattern = velocity_patterns.get(velocity, velocity_patterns['medium'])
            
            # Generate realistic daily sales using normal distribution
            mean_daily = pattern['mean']
            std_daily = pattern['std']
            sold = max(0, int(np.random.normal(mean_daily, std_daily)))
            
            # Never exceed available inventory - ensure sold never goes negative or exceeds available
            available = inventory_tracker[p['id']]
            sold = min(sold, available)  # Cap sold to available inventory
            
            if sold <= 0:
                continue
            
            # Deduct from inventory tracker
            inventory_tracker[p['id']] -= sold
                
            unit_price = p.get('price') or 0
            total = sold * unit_price
            rows.append({
                'product_id': p['id'],
                'branch_id': p.get('branch_id', 3),  # Default to 3 since we filter for branch_id=3
                'quantity': sold,
                'transaction_date': datetime.combine(d, datetime.min.time()).isoformat(),
                'unit_price': unit_price,
                'total_amount': total,
                'payment_method': random.choice(PAYMENT_METHODS),
                'created_at': now
            })
    return rows


def generate_dataframe_from_rows(rows):
    """Convert generated rows into a pandas DataFrame with consistent columns."""
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    # normalize datetime columns
    if 'transaction_date' in df.columns:
        df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
    return df


def main():
    parser = argparse.ArgumentParser(description='Generate sample sales CSV/Excel for testing EOQ')
    parser.add_argument('--format', '-f', choices=['csv', 'xlsx', 'both'], default='csv', help='Output file format')
    parser.add_argument('--outdir', '-o', default=str(Path(__file__).parent), help='Output directory')
    parser.add_argument('--products', '-p', default=None, help='Path to products JSON file (default: centralized-product.json in script directory)')
    args = parser.parse_args()

    # Load products from JSON (only branch_id 3)
    global PRODUCTS
    PRODUCTS = load_products_from_json(args.products, branch_id=3)
    print(f"Loaded {len(PRODUCTS)} products from JSON (branch_id=3)")

    rows = generate_sales_rows()
    print(f"Generated {len(rows)} sales rows for {DAYS} days ({START_DATE.strftime('%B %Y')})")

    df = generate_dataframe_from_rows(rows)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    base_name = f"sample_sales_{START_DATE.isoformat()}_to_{END_DATE.isoformat()}"
    if args.format in ('csv', 'both'):
        csv_path = outdir / f"{base_name}.csv"
        df.to_csv(csv_path, index=False)
        print(f"Wrote CSV: {csv_path}")

    if args.format in ('xlsx', 'both'):
        xlsx_path = outdir / f"{base_name}.xlsx"
        try:
            df.to_excel(xlsx_path, index=False, engine='openpyxl')
            print(f"Wrote Excel: {xlsx_path}")
        except Exception as e:
            print(f"Failed to write Excel file: {e}")


if __name__ == '__main__':
    main()
