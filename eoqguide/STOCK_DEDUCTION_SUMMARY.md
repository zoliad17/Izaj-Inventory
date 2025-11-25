# Stock Deduction Implementation - Quick Summary

## What Was Updated

Your existing code has been updated to automatically deduct stock when sales data is imported.

### 1. **Updated File: `analytics/db.py`**

Added a new function `deduct_stock_from_sales()` that:

- Aggregates quantities by product_id and branch_id
- Deducts the total quantity from `centralized_product.quantity`
- Logs the deductions
- Handles both psycopg2 and Supabase connections

**Changes:**

- Lines 60-110: New `deduct_stock_from_sales()` function
- Line 234: Calls deduction after psycopg2 insert
- Lines 197-218: Calls deduction after Supabase insert

### 2. **New Optional Database Trigger**

File: `STOCK_DEDUCTION_TRIGGER.sql`

- Adds a trigger at the database level for extra safety
- Automatically deducts stock when ANY sale is inserted (even via direct SQL)
- Prevents negative stock with validation

## How It Works

### When Sales Data is Imported:

```
1. CSV file uploaded via /api/analytics/sales-data/import
                    ↓
2. Sales records inserted into public.sales table
                    ↓
3. Python code calls deduct_stock_from_sales()
   - Groups sales by (product_id, branch_id)
   - For each group: UPDATE centralized_product SET quantity = quantity - total_qty
                    ↓
4. Stock is now reduced for all products
                    ↓
5. Daily analytics (product_demand_history, inventory_analytics) updated as before
```

## CSV Format (What Your System Accepts)

```csv
product_id,quantity,transaction_date,unit_price,total_amount,branch_id,date
1,5,2025-11-25,100.00,500.00,1,2025-11-25
2,3,2025-11-25,150.00,450.00,1,2025-11-25
1,2,2025-11-26,100.00,200.00,2,2025-11-26
```

**Required columns:**

- `product_id` - Must exist in centralized_product
- `quantity` - Units sold (positive number)
- `transaction_date` or `date` - Sale date

**Optional columns:**

- `branch_id` - Defaults to 1 if not provided
- `unit_price`, `total_amount`, etc.

## Stock Deduction Logic

### Example:

- Product 1, Branch 1 has 100 units
- You import sales CSV with:
  - Product 1, 5 units sold
  - Product 1, 3 units sold
- Result: 100 - 5 - 3 = 92 units remaining in centralized_product

## Multi-Branch Support

The code properly handles multiple branches:

```python
key = (product_id, branch_id)
```

Stock is tracked per product per branch:

- Product 1, Branch 1: deducted separately
- Product 1, Branch 2: deducted separately

## Daily Sales Data Support

Your system supports daily imports:

1. Each day, export sales from POS
2. Upload CSV file
3. Stock is automatically deducted
4. Repeat next day

No manual stock updates needed!

## Database Changes

### If Using PostgreSQL/Supabase Trigger (Optional but Recommended):

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy contents of STOCK_DEDUCTION_TRIGGER.sql
-- This adds a database-level trigger for automatic deduction
```

This provides a safety net - even if Python code has an issue, the trigger will still deduct stock.

## Verification

After importing sales, verify stock was deducted:

```sql
-- Check a product's stock
SELECT id, product_name, quantity, branch_id
FROM public.centralized_product
WHERE id = 1 AND branch_id = 1;
```

The quantity should be lower than before the import.

## Error Handling

- If `product_id` doesn't exist → Error logged, row skipped
- If `branch_id` doesn't exist → Error logged, row skipped
- If stock would go negative (trigger only) → Transaction rejected

## Product ID Flow

Product ID is passed through:

1. **CSV Import** → product_id column in your CSV
2. **Sales Table** → Stored with each sale
3. **Stock Deduction** → Used to find which product to update
4. **EOQ Tables** → Uses product_id for calculations
5. **Demand History** → Tracks sales per product_id

All connected! ✓

## Performance

- Aggregation by product_id/branch_id before updates
- Batch processing: 100+ sales at once
- Fast lookups via product_id index

## Testing the Implementation

```bash
# 1. Create a test CSV
cat > test_sales.csv << EOF
product_id,quantity,transaction_date,unit_price,branch_id
1,5,2025-11-25,100.00,1
2,3,2025-11-25,150.00,1
EOF

# 2. Upload via your frontend or cURL
curl -X POST http://localhost:5001/api/analytics/sales-data/import \
  -F "file=@test_sales.csv"

# 3. Check stock was deducted
psql -c "SELECT id, quantity FROM centralized_product WHERE id IN (1,2) AND branch_id = 1"
```

## Files Changed

- ✅ `analytics/db.py` - Added deduction logic
- ✅ Created `STOCK_DEDUCTION_TRIGGER.sql` - Optional database trigger

No changes needed to:

- Routes (already working)
- Frontend
- EOQ calculations
- Other analytics

## Next Steps

1. Test the CSV import with your sample data
2. Verify stock levels decreased
3. (Optional) Run STOCK_DEDUCTION_TRIGGER.sql for database-level protection

Done! Your system now deducts stock when sales are imported. 🎉
