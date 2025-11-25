# Stock Deduction Trigger Issue - Root Cause & Solution

## Problem

The modal shows **0 products updated** and **no data has been passed in the sales table** because:

1. **A database trigger** (`trigger_deduct_stock_on_sales_insert`) was created in `STOCK_DEDUCTION_TRIGGER.sql`
2. **This trigger blocks sales insertion** when there's insufficient stock:
   ```
   Error: 'Insufficient stock for product 242. Available: 0, Requested: 1'
   ```
3. **The CSV import fails silently** because the trigger rejection happens at the database level
4. **Products in the CSV don't exist** in centralized_product with inventory

## Root Cause Breakdown

```
CSV Import Flow:
1. Upload CSV with 597 sales
2. Python validates and builds rows
3. insert_sales_rows() sends to Supabase
4. DATABASE TRIGGER: deduct_stock_on_sales() fires on INSERT
5. Trigger checks: IF new_qty < 0 THEN RAISE EXCEPTION
6. Product 242 has 0 stock, needs 1 → EXCEPTION
7. ENTIRE BATCH REJECTED - no rows inserted
8. Modal queries empty sales table → 0 products shown
```

## Why This Happened

The `STOCK_DEDUCTION_TRIGGER.sql` file was intended to:

- Auto-deduct stock at the database level
- Provide data integrity

However, it has **unintended consequences**:

- Blocks imports of sales for products with zero stock
- Makes it impossible to import historical sales data
- Creates catch-22: Need to have inventory to import sales, but need sales data to calculate inventory

## Solution

We're implementing stock deduction in the **Python layer** (in `db.py`), so the database trigger is unnecessary and harmful.

### Step 1: Remove the Trigger from Supabase

**Option A: Manual via Supabase Dashboard (EASIEST)**

1. Go to: https://app.supabase.com/project/phhbjvlrwrtiokfbjorb/sql/new
2. Run these SQL commands:
   ```sql
   -- Remove the problematic trigger
   DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sales_insert ON public.sales;
   DROP FUNCTION IF EXISTS public.deduct_stock_on_sales();
   ```
3. Click "Run"
4. You should see: "Success. No rows returned"

**Option B: Via Python Script**

```bash
cd c:\Users\monfe\Documents\Izaj-Inventory
C:/Users/monfe/Documents/Izaj-Inventory/.venv/Scripts/python.exe analytics/tools/remove_stock_trigger.py
```

### Step 2: Verify Trigger is Removed

Run in Supabase SQL Editor:

```sql
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'sales'
  AND trigger_name = 'trigger_deduct_stock_on_sales_insert';
```

Expected result: `trigger_count: 0`

### Step 3: Ensure Products Have Inventory

For the CSV to import successfully, products must exist in `centralized_product`. Check:

```sql
SELECT
  id,
  product_name,
  quantity,
  branch_id
FROM public.centralized_product
WHERE id IN (221, 222, 223, 224, 228, 242)
AND branch_id = 2;
```

**If products don't exist**, run the database initialization script or add them manually:

```sql
INSERT INTO public.centralized_product
  (product_name, quantity, price, category_id, status, branch_id)
VALUES
  ('Color-Changing LED Bulb E27 7W', 500, 146.16, 1, 'Active', 2),
  ('Dimmable LED Bulb 5W 2700K Soft White', 500, 387.56, 1, 'Active', 2),
  ('LED Smart Bulb 9W RGB WiFi', 500, 134.36, 1, 'Active', 2),
  ('Smart Bulb 9W Tunable White', 500, 1772.67, 1, 'Active', 2),
  -- ... add other products
ON CONFLICT DO NOTHING;
```

### Step 4: Retry CSV Import

1. Go to Dashboard → EOQ Analytics
2. Click "Upload Sales Data"
3. Select the CSV file
4. Wait for import to complete
5. **Modal should now show imported products and stock deductions**

## Why Stock Deduction Still Works

Our Python implementation in `db.py` handles stock deduction AFTER successful insert:

```python
# In insert_sales_rows() - Supabase path (lines 203-235)
if inserted > 0:
    try:
        # Get current quantity
        resp = _supabase_client.table('centralized_product').select('quantity')...
        # Calculate new quantity
        new_qty = max(0, current_qty - total_qty)
        # Update Supabase
        update_resp = _supabase_client.table('centralized_product').update({...})
```

This provides:

- ✅ Stock deduction happens AFTER sales are recorded
- ✅ No blocking of legitimate sales imports
- ✅ Proper error handling and logging
- ✅ Works with historical/demo data
- ✅ More flexible than database trigger

## Testing After Fix

```bash
# 1. Test direct import
C:/Users/monfe/Documents/Izaj-Inventory/.venv/Scripts/python.exe analytics/tools/test_import_direct.py

# Expected output:
#   ✓ Reading CSV: 597 rows
#   ✓ Inserted 597 rows
#   ✓ Verified: Found 597 recent sales
#   ✓ Stock deducted for each product
```

## Files Affected

- **STOCK_DEDUCTION_TRIGGER.sql** - Contains the problematic trigger (to be disabled)
- **analytics/db.py** - Contains Python stock deduction logic (working correctly)
- **analytics/routes.py** - Contains API endpoint to fetch deductions (working correctly)
- **src/components/Analytics/EOQAnalyticsDashboard.tsx** - Modal component (working correctly)

## Summary

| Aspect           | Before                           | After                       |
| ---------------- | -------------------------------- | --------------------------- |
| Stock validation | Database trigger (blocks import) | Python layer (after insert) |
| CSV import       | ❌ Fails - trigger rejects       | ✅ Works                    |
| Modal data       | ❌ Empty (no sales in DB)        | ✅ Shows deductions         |
| Stock tracking   | Inconsistent                     | ✅ Accurate                 |
| Error handling   | Silent failure                   | ✅ Detailed logging         |

**Next Action**: Remove the trigger (Step 1 above) and retry the import!
