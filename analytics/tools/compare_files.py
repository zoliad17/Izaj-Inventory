"""Compare the old and new Excel files to see what's different"""
import pandas as pd

print("=" * 60)
print("COMPARING FILES")
print("=" * 60)

try:
    df_old = pd.read_excel('test_sales_new-old.xlsx')
    print("\nOLD FILE (test_sales_new-old.xlsx):")
    print(f"  Rows: {len(df_old)}")
    print(f"  Columns: {list(df_old.columns)}")
    if 'date' in df_old.columns:
        print(f"  Date column type: {df_old['date'].dtype}")
        print(f"  Date sample: {df_old['date'].head(3).tolist()}")
    if 'quantity' in df_old.columns:
        print(f"  Quantity column type: {df_old['quantity'].dtype}")
        print(f"  Quantity sample: {df_old['quantity'].head(3).tolist()}")
        print(f"  Quantity nulls: {df_old['quantity'].isna().sum()}")
except Exception as e:
    print(f"Error reading old file: {e}")

try:
    df_new = pd.read_excel('test_sales_new.xlsx')
    print("\nNEW FILE (test_sales_new.xlsx):")
    print(f"  Rows: {len(df_new)}")
    print(f"  Columns: {list(df_new.columns)}")
    if 'date' in df_new.columns:
        print(f"  Date column type: {df_new['date'].dtype}")
        print(f"  Date sample: {df_new['date'].head(3).tolist()}")
    if 'quantity' in df_new.columns:
        print(f"  Quantity column type: {df_new['quantity'].dtype}")
        print(f"  Quantity sample: {df_new['quantity'].head(3).tolist()}")
        print(f"  Quantity nulls: {df_new['quantity'].isna().sum()}")
    
    # Test the filtering logic
    print("\nTESTING FILTERING LOGIC:")
    df_test = df_new.copy()
    df_test['quantity'] = pd.to_numeric(df_test['quantity'], errors='coerce')
    if pd.api.types.is_datetime64_any_dtype(df_test['date']):
        df_test['date_parsed'] = df_test['date']
    else:
        df_test['date_parsed'] = pd.to_datetime(df_test['date'], errors='coerce')
    
    print(f"  After quantity conversion - nulls: {df_test['quantity'].isna().sum()}")
    print(f"  After date parsing - nulls: {df_test['date_parsed'].isna().sum()}")
    
    df_filtered = df_test.dropna(subset=['quantity', 'date_parsed'])
    print(f"  Rows after filtering: {len(df_filtered)}")
    
except Exception as e:
    print(f"Error reading new file: {e}")
    import traceback
    traceback.print_exc()
