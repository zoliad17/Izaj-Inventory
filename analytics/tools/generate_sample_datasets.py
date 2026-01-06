"""
Generate sample sales data for EOQ testing: 1 week and 1 month datasets.

Usage:
  python analytics/tools/generate_sample_datasets.py
"""

import os
import sys
import random
import json
import time
from datetime import datetime, timedelta
import pandas as pd
from pathlib import Path

# Add the project root to sys.path to enable imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


def load_products_from_json(json_path: Path):
    """Load product IDs, prices, and stock quantities from JSON file."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        # Extract product IDs and create mappings
        product_ids = [p['id'] for p in products if p.get('id')]
        product_prices = {p['id']: p.get('price', 0) for p in products if p.get('id')}
        
        # Extract stock quantities (available = quantity - reserved_quantity)
        product_stocks = {}
        for p in products:
            if p.get('id'):
                quantity = p.get('quantity', 0) or 0
                reserved = p.get('reserved_quantity', 0) or 0
                available_stock = max(0, quantity - reserved)
                product_stocks[p['id']] = available_stock
        
        branch_id = products[0].get('branch_id', 3) if products else 3
        
        return product_ids, product_prices, product_stocks, branch_id
    except Exception as e:
        print(f"Error loading products from {json_path}: {e}")
        return [], {}, {}, 3


def generate_week_dataset(output_path: Path, product_ids: list, product_prices: dict, product_stocks: dict, branch_id: int = 3, num_products: int = None):
    """Generate 1 week (7 days) of sales data using actual product IDs, respecting stock limits."""
    if not product_ids:
        print("Warning: No product IDs provided, using default range")
        product_ids = list(range(1, (num_products or 5) + 1))
        product_prices = {pid: 1000.0 for pid in product_ids}
        product_stocks = {pid: 1000 for pid in product_ids}  # Default stock
    
    # Limit to first N products if num_products is specified
    if num_products:
        product_ids = product_ids[:num_products]
    
    # Create a copy of stock dict to track during generation
    current_stocks = {pid: product_stocks.get(pid, 0) for pid in product_ids}
    out_of_stock_products = set()
    
    print(f"Generating 1 week dataset for branch {branch_id} with {len(product_ids)} products...")
    
    # Start date: 7 days ago
    start_date = datetime.now() - timedelta(days=7)
    dates = [start_date + timedelta(days=i) for i in range(7)]
    
    rows = []
    for date in dates:
        # Weekend pattern: lower sales on Saturday (5) and Sunday (6)
        is_weekend = date.weekday() >= 5
        base_multiplier = 0.6 if is_weekend else 1.0
        
        for product_id in product_ids:
            # Check current available stock
            current_stock = current_stocks.get(product_id, 0)
            if current_stock <= 0:
                out_of_stock_products.add(product_id)
                continue  # Skip products with no stock
            
            # Vary daily demand per product based on price (cheaper items sell more)
            price = product_prices.get(product_id, 1000.0)
            # Lower price = higher base demand (inverse relationship)
            price_factor = max(0.1, 5000.0 / max(price, 100.0))  # Normalize around 5000 price point
            product_base = max(1, int(price_factor * 3))  # Base 3 units/day for mid-range items
            
            # Calculate desired quantity
            desired_quantity = max(1, int(product_base * base_multiplier * random.uniform(0.7, 1.3)))
            
            # Cap at available stock to prevent negative stock
            daily_quantity = min(desired_quantity, current_stock)
            
            rows.append({
                'product_id': product_id,
                'quantity': daily_quantity,
                'date': date.strftime('%Y-%m-%d'),
                'branch_id': branch_id
            })
            
            # Deduct from stock
            current_stocks[product_id] -= daily_quantity
    
    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"✓ Generated {len(df)} records in {output_path}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Products: {df['product_id'].nunique()}")
    print(f"  Total quantity: {df['quantity'].sum()}")
    
    if out_of_stock_products:
        print(f"  ⚠ Warning: {len(out_of_stock_products)} products had zero stock and were skipped")
    
    return df


def generate_month_dataset(output_path: Path, product_ids: list, product_prices: dict, product_stocks: dict, branch_id: int = 3, num_products: int = None):
    """Generate 1 month (30 days) of sales data with realistic patterns using actual product IDs, respecting stock limits."""
    if not product_ids:
        print("Warning: No product IDs provided, using default range")
        product_ids = list(range(1, (num_products or 10) + 1))
        product_prices = {pid: 1000.0 for pid in product_ids}
        product_stocks = {pid: 1000 for pid in product_ids}  # Default stock
    
    # Limit to first N products if num_products is specified
    if num_products:
        product_ids = product_ids[:num_products]
    
    # Create a copy of stock dict to track during generation
    current_stocks = {pid: product_stocks.get(pid, 0) for pid in product_ids}
    out_of_stock_products = set()
    
    print(f"Generating 1 month dataset for branch {branch_id} with {len(product_ids)} products...")
    
    # Start date: 30 days ago
    start_date = datetime.now() - timedelta(days=30)
    dates = [start_date + timedelta(days=i) for i in range(30)]
    
    rows = []
    for date in dates:
        # Weekend pattern: lower sales on weekends
        is_weekend = date.weekday() >= 5
        base_multiplier = 0.6 if is_weekend else 1.0
        
        # Mid-week boost (Tuesday-Thursday)
        if date.weekday() in [1, 2, 3]:
            base_multiplier *= 1.2
        
        for product_id in product_ids:
            # Check current available stock
            current_stock = current_stocks.get(product_id, 0)
            if current_stock <= 0:
                out_of_stock_products.add(product_id)
                continue  # Skip products with no stock
            
            # Vary daily demand per product based on price (cheaper items sell more)
            price = product_prices.get(product_id, 1000.0)
            # Lower price = higher base demand (inverse relationship)
            price_factor = max(0.1, 5000.0 / max(price, 100.0))  # Normalize around 5000 price point
            product_base = max(1, int(price_factor * 2.5))  # Base 2.5 units/day for mid-range items
            
            # Add randomness and weekly trend
            weekly_factor = 1.0 + 0.1 * (date.weekday() / 6)  # Slight increase through week
            desired_quantity = max(1, int(product_base * base_multiplier * weekly_factor * random.uniform(0.8, 1.2)))
            
            # Cap at available stock to prevent negative stock
            daily_quantity = min(desired_quantity, current_stock)
            
            rows.append({
                'product_id': product_id,
                'quantity': daily_quantity,
                'date': date.strftime('%Y-%m-%d'),
                'branch_id': branch_id
            })
            
            # Deduct from stock
            current_stocks[product_id] -= daily_quantity
    
    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"✓ Generated {len(df)} records in {output_path}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Products: {df['product_id'].nunique()}")
    print(f"  Total quantity: {df['quantity'].sum()}")
    
    if out_of_stock_products:
        print(f"  ⚠ Warning: {len(out_of_stock_products)} products ran out of stock during generation")
    
    return df


def main():
    """Generate both datasets using product IDs from branch-3-products.json."""
    tools_dir = Path(__file__).parent
    output_dir = tools_dir
    json_path = tools_dir / 'branch-3-products.json'
    
    # Set random seed based on current time for variety each run
    random.seed(int(time.time()))
    
    print("=" * 70)
    print("Generating Sample Sales Data for EOQ Testing")
    print("=" * 70)
    print()
    
    # Load products from JSON file
    print(f"Loading products from {json_path}...")
    product_ids, product_prices, product_stocks, branch_id = load_products_from_json(json_path)
    
    if not product_ids:
        print("ERROR: No products found in JSON file. Exiting.")
        return
    
    print(f"✓ Loaded {len(product_ids)} products for branch {branch_id}")
    print(f"  Product IDs: {product_ids[:10]}{'...' if len(product_ids) > 10 else ''}")
    
    # Check for zero-stock products
    zero_stock = [pid for pid in product_ids if product_stocks.get(pid, 0) <= 0]
    if zero_stock:
        print(f"  ⚠ Warning: {len(zero_stock)} products have zero stock: {zero_stock[:5]}{'...' if len(zero_stock) > 5 else ''}")
    print()
    
    # Generate 1 week dataset (use first 5 products)
    # Create a copy of stock dict for week dataset
    week_stocks = {pid: product_stocks.get(pid, 0) for pid in product_ids[:5]}
    week_path = output_dir / 'sample_sales_one_week.csv'
    generate_week_dataset(week_path, product_ids, product_prices, week_stocks, branch_id, num_products=5)
    print()
    
    # Generate 1 month dataset (use first 10 products)
    # Create a fresh copy of stock dict for month dataset
    month_stocks = {pid: product_stocks.get(pid, 0) for pid in product_ids[:10]}
    month_path = output_dir / 'sample_sales_one_month.csv'
    generate_month_dataset(month_path, product_ids, product_prices, month_stocks, branch_id, num_products=10)
    print()
    
    print("=" * 70)
    print("✓ Sample datasets generated successfully!")
    print("=" * 70)
    print(f"\nFiles created:")
    print(f"  - {week_path}")
    print(f"  - {month_path}")
    print(f"\nYou can now import these files in the Analytics page to test EOQ calculations.")
    print(f"Note: All datasets use branch_id={branch_id} from the JSON file.")
    print(f"Note: Sales quantities are capped at available stock to prevent negative stock errors.")


if __name__ == '__main__':
    main()

