"""
Create a new Excel file with RANDOM sample sales data for testing.
This file will have random products and recent dates to test if the system reads new data dynamically.
Each run generates different data to verify the import is working correctly.
"""
import pandas as pd
from datetime import datetime, timedelta
import os
import random

def create_test_sales_excel():
    """Create a new Excel file with random sample sales data"""
    
    # Use today's date and recent dates for testing
    today = datetime.now()
    
    # Random product IDs (using some existing product IDs from the system)
    available_product_ids = [386, 394, 402, 409, 412, 537, 538, 539, 540, 541, 542, 546, 547, 548, 550, 556, 557, 558, 559, 561, 562, 564, 567, 568, 569, 570]
    
    # Random payment methods
    payment_methods = ['card', 'cash', 'gcash', 'other']
    
    # Generate random sales data
    num_transactions = random.randint(8, 15)  # Random number of transactions
    sales_data = []
    
    # Select random products for this test
    selected_products = random.sample(available_product_ids, random.randint(3, 6))
    
    for i in range(num_transactions):
        product_id = random.choice(selected_products)
        branch_id = 3
        quantity = random.randint(1, 30)  # Random quantity between 1-30
        
        # Random date within last 3 days
        days_ago = random.randint(0, 2)
        transaction_date = (today - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        # Random unit price between 1000-25000
        unit_price = round(random.uniform(1000, 25000), 2)
        total_amount = round(quantity * unit_price, 2)
        payment_method = random.choice(payment_methods)
        
        sales_data.append({
            'product_id': product_id,
            'branch_id': branch_id,
            'quantity': quantity,
            'transaction_date': transaction_date,
            'unit_price': unit_price,
            'total_amount': total_amount,
            'payment_method': payment_method
        })
    
    # Create DataFrame
    df = pd.DataFrame(sales_data)
    
    # Add 'date' column (the import function looks for this)
    df['date'] = pd.to_datetime(df['transaction_date'])
    
    # Reorder columns
    columns_order = ['product_id', 'branch_id', 'quantity', 'date', 'transaction_date', 'unit_price', 'total_amount', 'payment_method']
    df = df[columns_order]
    
    # Save to Excel file
    output_file = os.path.join(os.path.dirname(__file__), 'test_sales_new.xlsx')
    df.to_excel(output_file, index=False, engine='openpyxl')
    
    print(f"Created RANDOM test Excel file: {output_file}")
    print(f"  - Total rows: {len(df)}")
    print(f"  - Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  - Products: {sorted(df['product_id'].unique().tolist())}")
    print(f"  - Total quantity sold: {df['quantity'].sum()}")
    print(f"\nTop products by quantity:")
    top = df.groupby('product_id')['quantity'].sum().sort_values(ascending=False)
    for pid, qty in top.items():
        print(f"  - Product {pid}: {int(qty)} units")
    
    print(f"\nNOTE: This file contains RANDOM data. Each run generates different values.")
    print(f"      Use this to test if the import correctly reads NEW files each time.")
    
    return output_file

if __name__ == '__main__':
    create_test_sales_excel()
