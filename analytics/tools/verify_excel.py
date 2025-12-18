"""Quick script to verify the Excel file contents"""
import pandas as pd

df = pd.read_excel('test_sales_new.xlsx')
print('Excel file contents:')
print(f'  Rows: {len(df)}')
print(f'  Products: {sorted(df["product_id"].unique().tolist())}')
print(f'  Total quantity: {df["quantity"].sum()}')
print(f'  Date range: {df["date"].min()} to {df["date"].max()}')
print('\nFirst 3 rows:')
print(df[['product_id', 'quantity', 'transaction_date']].head(3))
