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
import sys
import random
from datetime import datetime, timedelta, timezone
import json
import calendar

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import argparse
import pandas as pd
from pathlib import Path

# Add the project root to sys.path to enable imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Import EOQ calculator
try:
    from analytics.eoq_calculator import EOQCalculator, EOQInput
    print("Successfully imported EOQ calculator")
except ImportError as e:
    print(f"Failed to import EOQ calculator: {e}")
    EOQCalculator = None
    EOQInput = None


def load_products_from_json(json_path=None, branch_id=None):
    """
    Load products from centralized_product_rows.json and infer velocity based on category and product name.

    Velocity rules:
    - fast: Category 2 (bulbs) and 12 (LED strips) - high turnover items
    - slow: Category 1 (chandeliers), expensive items (>50000), or luxury keywords
    - medium: Everything else

    Args:
        json_path: Path to the JSON file (default: centralized_product_rows.json in script directory)
        branch_id: Optional branch_id to filter products (default: None, returns all products)
    """
    if json_path is None:
        json_path = Path(__file__).parent / 'centralized_product_rows.json'  # Changed to use centralized_product_rows.json

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
            'quantity': max(0, p['quantity']),  # Ensure non-negative quantity
            'price': max(0, p['price']),  # Ensure non-negative price
            'category_id': p['category_id'],
            'brand_id': p['branch_id'],
            'velocity': velocity
        })
    
    return products


def load_products_from_excel(excel_path):
    """
    Load products from Excel file and infer velocity based on category and product name.

    Velocity rules:
    - fast: Items with high turnover potential
    - slow: Luxury/expensive items or specialty products
    - medium: Everything else

    Args:
        excel_path: Path to the Excel file
    """
    df = pd.read_excel(excel_path)
    
    products = []
    luxury_keywords = ['chandelier', 'crystal', 'gold', 'brass', 'vintage', 'decorative']
    
    # Map categories to IDs if needed (simplified mapping)
    category_mapping = {
        'Bulbs': 2,
        'LED Strips': 12,
        'Chandeliers': 1,
        # Add more mappings as needed
    }

    # Add an index-based ID for products that don't have one
    for idx, row in df.iterrows():
        product_id = row.get('Product ID', idx + 1)  # Use Product ID if available, otherwise use row index
        product_name = str(row['Product Name']).lower()
        category = row['Category']
        price = row['Price'] if pd.notna(row['Price']) else 0
        quantity = row['Quantity'] if pd.notna(row['Quantity']) else 0
        
        # Determine velocity
        category_id = category_mapping.get(category, 0)  # Default to 0 if not found
        if category_id in [2, 12]:  # Bulbs and LED strips
            velocity = 'fast'
        elif category_id == 1 or price > 50000 or any(kw in product_name for kw in luxury_keywords):
            velocity = 'slow'
        else:
            velocity = 'medium'

        products.append({
            'id': product_id,
            'product_name': row['Product Name'],
            'quantity': quantity,
            'price': price,
            'category_id': category_id,
            'brand_id': 3,  # Default brand ID
            'velocity': velocity
        })
    
    return products


# Load products from JSON file (only branch_id 3)
PRODUCTS = load_products_from_json(branch_id=3)

PAYMENT_METHODS = ['cash', 'card', 'gcash', 'other']

# Calculate current calendar month date range
now = datetime.now(timezone.utc)
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
    now = datetime.now(timezone.utc).isoformat()
    
    # Track remaining inventory for each product across days
    inventory_tracker = {p['id']: max(0, p['quantity']) for p in PRODUCTS}  # Ensure non-negative initial inventory
    
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
            available = inventory_tracker[p['id']]
            if available <= 0:
                continue
            
            # Get velocity pattern for this product
            velocity = p.get('velocity', 'medium')
            pattern = velocity_patterns.get(velocity, velocity_patterns['medium'])
            
            # Generate realistic daily sales using normal distribution
            mean_daily = pattern['mean']
            std_daily = pattern['std']
            sold = max(0, int(np.random.normal(mean_daily, std_daily)))
            
            # CRITICAL: Never exceed available inventory
            # Also reduce sales probability for low stock items
            if available < 10:
                # For low stock items, reduce sales probability and cap at available
                if random.random() > 0.3:  # Only 30% chance of sale for low stock
                    continue
                sold = min(sold, available, random.randint(1, min(3, available)))  # Max 3 units per day for low stock
            else:
                # For normal stock, cap sold to available inventory
                sold = min(sold, available)
            
            # Final safety check to ensure no negative values
            sold = max(0, min(sold, available))
            
            if sold <= 0:
                continue
            
            # Deduct from inventory tracker BEFORE creating the row
            inventory_tracker[p['id']] -= sold
                
            unit_price = max(0, p.get('price') or 0)  # Ensure non-negative price
            total = sold * unit_price
            rows.append({
                'product_id': p['id'],
                'brand_id': p.get('brand_id', 3),  # Default to 3 since we filter for branch_id=3
                'quantity': max(0, sold),  # Ensure non-negative quantity
                'transaction_date': datetime.combine(d, datetime.min.time()).isoformat(),
                'unit_price': max(0, unit_price),  # Ensure non-negative price
                'total_amount': max(0, total),  # Ensure non-negative total
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

def calculate_eoq_for_products(df, products):
    """Calculate EOQ for each product based on generated sales data."""
    if EOQCalculator is None or EOQInput is None:
        print("EOQ calculator not available. Skipping EOQ calculations.")
        return None
    
    # Group sales by product_id to calculate annual demand
    product_sales = df.groupby('product_id')['quantity'].sum().to_dict()
    
    eoq_results = []
    
    for product in products:
        product_id = product['id']
        unit_cost = product.get('price', 0)
        
        # Calculate annual demand based on generated sales data
        # Assume the generated data represents one month
        monthly_demand = product_sales.get(product_id, 0)
        annual_demand = monthly_demand * 12  # Extrapolate to annual
        
        # Skip if no demand
        if annual_demand <= 0:
            continue
        
        # Default values for EOQ calculation
        holding_cost = unit_cost * 0.25  # 25% of unit cost
        ordering_cost = 100  # Fixed cost per order
        lead_time_days = 7
        confidence_level = 0.95
        
        try:
            # Create EOQ input
            eoq_input = EOQInput(
                annual_demand=annual_demand,
                holding_cost=holding_cost,
                ordering_cost=ordering_cost,
                unit_cost=unit_cost,
                lead_time_days=lead_time_days,
                confidence_level=confidence_level
            )
            
            # Calculate EOQ
            result = EOQCalculator.calculate_eoq(eoq_input)
            
            # Add to results
            eoq_results.append({
                'product_id': product_id,
                'product_name': product.get('product_name', ''),
                'annual_demand': annual_demand,
                'unit_cost': unit_cost,
                'eoq_quantity': result.eoq_quantity,
                'reorder_point': result.reorder_point,
                'safety_stock': result.safety_stock,
                'annual_holding_cost': result.annual_holding_cost,
                'annual_ordering_cost': result.annual_ordering_cost,
                'total_annual_cost': result.total_annual_cost
            })
        except Exception as e:
            print(f"Error calculating EOQ for product {product_id}: {e}")
            continue
    
    return pd.DataFrame(eoq_results)


def main():
    parser = argparse.ArgumentParser(description='Generate sample sales CSV/Excel for testing EOQ')
    parser.add_argument('--format', '-f', choices=['csv', 'xlsx', 'both'], default='csv', help='Output file format')
    parser.add_argument('--outdir', '-o', default=str(Path(__file__).parent), help='Output directory')
    parser.add_argument('--products', '-p', default=None, help='Path to products JSON file (default: centralized_product_rows.json in script directory)')
    parser.add_argument('--excel', '-x', default=None, help='Path to products Excel file')
    parser.add_argument('--calculate-eoq', '-e', action='store_true', help='Calculate EOQ for generated sales data')
    args = parser.parse_args()

    # Load products from either Excel or JSON
    global PRODUCTS
    if args.excel:
        PRODUCTS = load_products_from_excel(args.excel)
        print(f"Loaded {len(PRODUCTS)} products from Excel")
    else:
        # Updated default to use centralized_product_rows.json
        default_json = Path(__file__).parent / 'centralized_product_rows.json'
        products_path = args.products if args.products else default_json
        PRODUCTS = load_products_from_json(products_path, branch_id=3)
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
    
    # Calculate EOQ if requested
    if args.calculate_eoq:
        print("Calculating EOQ for generated sales data...")
        eoq_df = calculate_eoq_for_products(df, PRODUCTS)
        if eoq_df is not None and not eoq_df.empty:
            eoq_csv_path = outdir / f"{base_name}_eoq.csv"
            eoq_df.to_csv(eoq_csv_path, index=False)
            print(f"Wrote EOQ CSV: {eoq_csv_path}")
        else:
            print("No EOQ data to write.")


if __name__ == '__main__':
    main()