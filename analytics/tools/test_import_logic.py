"""Test the exact import logic to see why 0 records are imported"""
import pandas as pd
import pandas.api.types as pd_types
from io import BytesIO

def test_import_logic(file_path):
    """Simulate the exact import logic from routes.py"""
    print(f"Testing import logic for: {file_path}")
    print("=" * 60)
    
    # Read file as if it came from Flask upload
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
    
    print(f"File size: {len(file_bytes)} bytes")
    
    # Create BytesIO like in the import function
    file_content = BytesIO(file_bytes)
    file_content.seek(0)
    
    # Read Excel
    df = pd.read_excel(file_content, engine='openpyxl')
    print(f"\nAfter reading Excel:")
    print(f"  Rows: {len(df)}")
    print(f"  Columns: {list(df.columns)}")
    
    if len(df) == 0:
        print("ERROR: File has 0 rows!")
        return
    
    # Check for quantity column
    if 'quantity' not in df.columns:
        print("ERROR: Missing 'quantity' column")
        return
    
    # Find date column
    date_candidates = ['date', 'transaction_date', 'sale_date', 'timestamp', 'transactiondatetime', 'created_at']
    date_col = next((c for c in date_candidates if c in df.columns), None)
    if not date_col:
        print(f"ERROR: Missing date column. Available: {list(df.columns)}")
        return
    
    print(f"\nFound date column: {date_col}")
    
    # Convert quantity
    original_row_count = len(df)
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
    quantity_nulls = df['quantity'].isna().sum()
    print(f"\nAfter quantity conversion:")
    print(f"  Original rows: {original_row_count}")
    print(f"  Quantity nulls: {quantity_nulls}")
    print(f"  Sample quantities: {df['quantity'].head(3).tolist()}")
    
    # Handle date conversion
    if pd_types.is_datetime64_any_dtype(df[date_col]):
        df['date'] = df[date_col]
        print(f"\nDate column is already datetime type")
    else:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce')
        print(f"\nParsed date column to datetime")
    
    date_nulls = df['date'].isna().sum()
    print(f"  Date nulls: {date_nulls}")
    print(f"  Sample dates: {df['date'].head(3).tolist()}")
    
    # Filter
    print(f"\nBefore filtering: {len(df)} rows")
    df_filtered = df.dropna(subset=['quantity', 'date'])
    print(f"After filtering: {len(df_filtered)} rows")
    
    if len(df_filtered) == 0:
        print("\nERROR: All rows filtered out!")
        print(f"  Quantity nulls: {quantity_nulls}")
        print(f"  Date nulls: {date_nulls}")
        print(f"\nSample data before filtering:")
        print(df[['quantity', date_col, 'date']].head())
    else:
        print(f"\nSUCCESS: {len(df_filtered)} rows will be imported")
        print(f"  Date range: {df_filtered['date'].min()} to {df_filtered['date'].max()}")
        print(f"  Total quantity: {df_filtered['quantity'].sum()}")

if __name__ == '__main__':
    test_import_logic('test_sales_new.xlsx')
