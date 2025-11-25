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

# Product catalog - Branch ID 2 only
PRODUCTS = [
  {"id":218,"product_name":"Crystal Cascade Chandelier 600mm","quantity":400,"price":79331.7,"category_id":1,"branch_id":2},
  {"id":219,"product_name":"Vintage Bronze Chandelier 3-Light E14","quantity":69,"price":72445.7,"category_id":1,"branch_id":2},
  {"id":220,"product_name":"Modern Linear Chandelier 8-Light Brushed Nickel","quantity":92,"price":35169.3,"category_id":1,"branch_id":2},
  {"id":221,"product_name":"Color-Changing LED Bulb E27 7W","quantity":100,"price":146.16,"category_id":2,"branch_id":2},
  {"id":222,"product_name":"Dimmable LED Bulb 5W 2700K Soft White","quantity":171,"price":387.56,"category_id":2,"branch_id":2},
  {"id":223,"product_name":"LED Smart Bulb 9W RGB WiFi","quantity":146,"price":134.36,"category_id":2,"branch_id":2},
  {"id":224,"product_name":"Industrial Pendant Light Black Matte 400mm","quantity":254,"price":1772.67,"category_id":3,"branch_id":2},
  {"id":225,"product_name":"Modern Pendant Light Adjustable Height Gold","quantity":219,"price":10644.4,"category_id":3,"branch_id":2},
  {"id":226,"product_name":"Glass Pendant Light Ø300mm Clear","quantity":62,"price":5503.97,"category_id":3,"branch_id":2},
  {"id":227,"product_name":"Flush-Mount Ceiling Light Round 1200mm","quantity":100,"price":3894.61,"category_id":4,"branch_id":2},
  {"id":228,"product_name":"LED Panel Ceiling Light 600×600 40W","quantity":213,"price":6788.35,"category_id":4,"branch_id":2},
  {"id":229,"product_name":"Decorative Ceiling Light Gold Finish 500mm","quantity":268,"price":8660.71,"category_id":4,"branch_id":2},
  {"id":230,"product_name":"Decorative Wall Light Crystal Accent","quantity":265,"price":4408.76,"category_id":5,"branch_id":2},
  {"id":231,"product_name":"Reading Wall Lamp ARM Adjustable 500mm","quantity":74,"price":4998.46,"category_id":5,"branch_id":2},
  {"id":232,"product_name":"Modern Wall Sconce Brushed Nickel","quantity":276,"price":4628.89,"category_id":5,"branch_id":2},
  {"id":233,"product_name":"Bedside Table Lamp Fabric Shade 450mm","quantity":247,"price":2114.44,"category_id":6,"branch_id":2},
  {"id":234,"product_name":"Study Lamp Adjustable Arm 7W LED","quantity":165,"price":2078.6,"category_id":6,"branch_id":2},
  {"id":235,"product_name":"Desk Lamp LED 10W Touch Control","quantity":161,"price":1128,"category_id":6,"branch_id":2},
  {"id":236,"product_name":"Arc Floor Lamp Black 1800mm","quantity":144,"price":7286.91,"category_id":7,"branch_id":2},
  {"id":237,"product_name":"Reading Floor Lamp LED Ring 1600mm","quantity":253,"price":6640.37,"category_id":7,"branch_id":2},
  {"id":238,"product_name":"Modern Floor Lamp 3-Arm Brass Finish","quantity":170,"price":9473.08,"category_id":7,"branch_id":2},
  {"id":239,"product_name":"Spotlight Track System 4-Head Rail","quantity":235,"price":11510.9,"category_id":8,"branch_id":2},
  {"id":240,"product_name":"LED Track Light 20W Black Rail","quantity":261,"price":4014.55,"category_id":8,"branch_id":2},
  {"id":241,"product_name":"Smart Recessed Light WiFi 18W","quantity":106,"price":7546.45,"category_id":9,"branch_id":2},
  {"id":242,"product_name":"LED Downlight 12W 3000K Round","quantity":15,"price":5588.69,"category_id":9,"branch_id":2},
  {"id":243,"product_name":"Adjustable Recessed Light 15W Square","quantity":219,"price":2613.6,"category_id":9,"branch_id":2},
  {"id":244,"product_name":"Security Flood Light 50W Motion Sensor","quantity":238,"price":3999.69,"category_id":10,"branch_id":2},
  {"id":245,"product_name":"Pathway Light Stainless Steel 600mm","quantity":185,"price":4972.98,"category_id":10,"branch_id":2},
  {"id":246,"product_name":"Garden Light LED Spike 400mm","quantity":121,"price":2203.71,"category_id":10,"branch_id":2},
  {"id":247,"product_name":"Smart Ceiling Light WiFi 36W","quantity":222,"price":9460.08,"category_id":11,"branch_id":2},
  {"id":248,"product_name":"Smart LED Strip 5m RGB + Controller","quantity":149,"price":7646.09,"category_id":11,"branch_id":2},
  {"id":249,"product_name":"Smart Wall Light Voice Control 12W","quantity":157,"price":5086.05,"category_id":11,"branch_id":2},
  {"id":250,"product_name":"Flexible LED Tape 3m 12V","quantity":112,"price":1376.35,"category_id":12,"branch_id":2},
  {"id":251,"product_name":"RGB LED Strip 5m SMD5050 Waterproof","quantity":159,"price":1211.9,"category_id":12,"branch_id":2},
  {"id":252,"product_name":"White LED Strip 10m 3000K","quantity":194,"price":947.24,"category_id":12,"branch_id":2},
  {"id":253,"product_name":"Solar Lantern LED Flicker Flame 3-Hour","quantity":216,"price":848.86,"category_id":13,"branch_id":2},
  {"id":254,"product_name":"Hanging Lantern Capiz Shell Ø250mm","quantity":295,"price":2664.43,"category_id":13,"branch_id":2},
  {"id":255,"product_name":"Garden Lantern Solar Powered 600mm","quantity":83,"price":3224.25,"category_id":13,"branch_id":2},
  {"id":256,"product_name":"Adjustable Spotlight 10W Track Mount","quantity":89,"price":4278.46,"category_id":14,"branch_id":2},
  {"id":257,"product_name":"LED Spotlight 30W Flood Beam","quantity":259,"price":5079.65,"category_id":14,"branch_id":2},
  {"id":258,"product_name":"Garden Spotlight 20W Ground Stake","quantity":87,"price":4561.77,"category_id":14,"branch_id":2},
  {"id":259,"product_name":"Backup Light LED 30W Auto Recharge","quantity":175,"price":955.92,"category_id":15,"branch_id":2},
  {"id":260,"product_name":"Exit Sign Light Double Face 3H Backup","quantity":101,"price":4692.72,"category_id":15,"branch_id":2},
  {"id":261,"product_name":"LED Emergency Light Built-In Battery 4W","quantity":318,"price":4783.1,"category_id":15,"branch_id":2},
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
