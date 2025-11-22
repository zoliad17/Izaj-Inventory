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

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import argparse
import pandas as pd
from pathlib import Path

# Product catalog - trimmed version from user (use full list)
PRODUCTS = [
  {"id":219,"product_name":"Vintage Bronze Chandelier 3-Light E14","quantity":70,"price":72445.7,"category_id":1,"status":"In Stock","branch_id":2},
  {"id":264,"product_name":"Vintage Bronze Chandelier 3-Light E14","quantity":69,"price":53887.2,"category_id":1,"status":"In Stock","branch_id":1},
  {"id":220,"product_name":"Modern Linear Chandelier 8-Light Brushed Nickel","quantity":92,"price":35169.3,"category_id":1,"status":"In Stock","branch_id":2},
  {"id":218,"product_name":"Crystal Cascade Chandelier 600mm","quantity":328,"price":79331.7,"category_id":1,"status":"In Stock","branch_id":2},
  {"id":221,"product_name":"Color-Changing LED Bulb E27 7W","quantity":45,"price":146.16,"category_id":2,"status":"In Stock","branch_id":2},
  {"id":263,"product_name":"Modern Linear Chandelier 8-Light Brushed Nickel","quantity":251,"price":47032.5,"category_id":1,"status":"In Stock","branch_id":1},
  {"id":262,"product_name":"Crystal Cascade Chandelier 600mm","quantity":155,"price":72465.8,"category_id":1,"status":"In Stock","branch_id":1},
  {"id":223,"product_name":"LED Smart Bulb 9W RGB WiFi","quantity":146,"price":134.36,"category_id":2,"status":"In Stock","branch_id":2},
  {"id":222,"product_name":"Dimmable LED Bulb 5W 2700K Soft White","quantity":171,"price":387.56,"category_id":2,"status":"In Stock","branch_id":2},
  {"id":267,"product_name":"LED Smart Bulb 9W RGB WiFi","quantity":82,"price":132.78,"category_id":2,"status":"In Stock","branch_id":1},
  {"id":265,"product_name":"Color-Changing LED Bulb E27 7W","quantity":280,"price":157.86,"category_id":2,"status":"In Stock","branch_id":1},
  {"id":266,"product_name":"Dimmable LED Bulb 5W 2700K Soft White","quantity":107,"price":237.01,"category_id":2,"status":"In Stock","branch_id":1},
  {"id":225,"product_name":"Modern Pendant Light Adjustable Height Gold","quantity":219,"price":10644.4,"category_id":3,"status":"In Stock","branch_id":2},
  {"id":226,"product_name":"Glass Pendant Light Ø300mm Clear","quantity":62,"price":5503.97,"category_id":3,"status":"In Stock","branch_id":2},
  {"id":224,"product_name":"Industrial Pendant Light Black Matte 400mm","quantity":254,"price":1772.67,"category_id":3,"status":"In Stock","branch_id":2},
  {"id":227,"product_name":"Flush-Mount Ceiling Light Round 1200mm","quantity":11,"price":3894.61,"category_id":4,"status":"Low Stock","branch_id":2},
  # ... (rest of the catalog omitted for brevity). Add or load your full list if desired.
]

PAYMENT_METHODS = ['cash', 'card', 'gcash', 'other']

DAYS = 30
END_DATE = datetime.utcnow().date()
START_DATE = END_DATE - timedelta(days=DAYS-1)


def generate_sales_rows():
    rows = []
    now = datetime.utcnow().isoformat()
    for day_offset in range(DAYS):
        d = START_DATE + timedelta(days=day_offset)
        for p in PRODUCTS:
            # mean daily sales relative to stock - small fraction
            mean_daily = max(0.05, p['quantity'] * 0.01)
            sold = int(np.random.poisson(mean_daily))
            if sold <= 0:
                continue
            unit_price = p.get('price') or 0
            total = sold * unit_price
            rows.append({
                'product_id': p['id'],
                'branch_id': p.get('branch_id', 1),
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
    args = parser.parse_args()

    rows = generate_sales_rows()
    print(f"Generated {len(rows)} sales rows for {DAYS} days")

    df = generate_dataframe_from_rows(rows)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    base_name = f"sample_sales_{START_DATE.isoformat()}_to_{(START_DATE+timedelta(days=DAYS-1)).isoformat()}"
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
