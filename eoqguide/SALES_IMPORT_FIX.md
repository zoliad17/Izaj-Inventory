# Fixes for Sales Import Issues

## Issues Addressed

### 1. ❌ inventory_analytics table missing `current_stock` column

**Error:** "Could not find the 'current_stock' column of 'inventory_analytics' in the schema cache"

**Solution:**

- Run the migration SQL to add the column:

```sql
ALTER TABLE public.inventory_analytics
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
```

**File:** `ALTER_INVENTORY_ANALYTICS.sql`

**Code Updated:** `analytics/db.py` - `insert_inventory_analytics()` function now gracefully handles missing column

- Tries to insert with `current_stock` first
- If column doesn't exist, removes it and retries
- Logs a helpful message directing user to run the migration

---

### 2. ❌ EOQ insertion fails with foreign key constraint violation

**Error:** "insert or update on table 'eoq_calculations' violates foreign key constraint... Key (product_id)=(1) is not present in table 'centralized_product'."

**Solution:**

- Added product validation in `insert_eoq_calculation()` before inserting
- Checks if product exists in `centralized_product` table first
- Skips EOQ insertion if product doesn't exist (logs warning)
- Prevents orphaned EOQ records

**Code Updated:** `analytics/db.py` - `insert_eoq_calculation()` function

- For Supabase: Queries centralized_product to verify existence
- For psycopg2: Direct SQL query to verify existence
- Both gracefully skip insertion with informative logging

---

## What Was Working ✅

### Stock Deduction (From Previous Session)

- ✅ Stock deducted from `centralized_product.quantity` when sales imported
- ✅ Works with both psycopg2 and Supabase connections
- ✅ Aggregates by (product_id, branch_id)
- ✅ Handles daily imports

### Sales Import Flow

- ✅ CSV parsed correctly with product_id and branch_id
- ✅ 597 sales records for 30 days generated
- ✅ product_demand_history inserted (597 rows)
- ✅ sales_forecast inserted (597 rows)
- ✅ eoq_calculations for valid products inserted successfully (37/44 products)
- ✅ restock_recommendations generated (5 items)

---

## Step-by-Step Fix

### Step 1: Add Missing Column to Database

Run this SQL in your Supabase SQL editor:

```sql
ALTER TABLE public.inventory_analytics
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_product_branch
ON public.inventory_analytics(product_id, branch_id);
```

**Or use the provided file:**

```bash
# Copy and paste the contents of ALTER_INVENTORY_ANALYTICS.sql into Supabase SQL editor
# Or from command line (if you have psql installed):
psql -U postgres -d your_db -f ALTER_INVENTORY_ANALYTICS.sql
```

### Step 2: Deploy Updated Code

The Python code in `analytics/db.py` already handles both cases:

- ✅ If column exists: Uses it normally
- ✅ If column doesn't exist: Inserts without it (graceful degradation)

No code deployment needed - graceful handling built in.

### Step 3: Re-import Sales Data

Once the column is added, re-import your sales CSV:

```bash
# The inventory_analytics will now insert successfully with current_stock values
curl -X POST http://localhost:5001/api/analytics/sales-data/import \
  -F "file=@sample_sales_2025-10-27_to_2025-11-25.csv"
```

---

## Verification Queries

### Check if current_stock column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'inventory_analytics'
AND column_name = 'current_stock';
```

### Check inventory_analytics data:

```sql
SELECT product_id, branch_id, current_stock, avg_daily_usage, stock_adequacy_days
FROM inventory_analytics
WHERE branch_id = 2
ORDER BY analysis_date DESC
LIMIT 10;
```

### Check that stock was deducted:

```sql
SELECT id, product_name, quantity
FROM centralized_product
WHERE branch_id = 2 AND id IN (221, 222, 223)
ORDER BY id;
```

### Check EOQ calculations:

```sql
SELECT product_id, branch_id, eoq_quantity, reorder_point, calculated_at
FROM eoq_calculations
WHERE branch_id = 2
ORDER BY calculated_at DESC
LIMIT 10;
```

---

## Summary of Changes

| File                                               | Change                           | Status     |
| -------------------------------------------------- | -------------------------------- | ---------- |
| `ALTER_INVENTORY_ANALYTICS.sql`                    | New migration file               | ✅ Created |
| `analytics/db.py` - `insert_inventory_analytics()` | Graceful column handling         | ✅ Updated |
| `analytics/db.py` - `insert_eoq_calculation()`     | Product validation before insert | ✅ Updated |

---

## Next Steps

1. **Run the SQL migration** to add `current_stock` column
2. **Test re-import** with sales data CSV
3. **Verify** that:
   - `inventory_analytics` rows insert successfully
   - `current_stock` shows actual values from `centralized_product`
   - Stock deductions are applied correctly
   - EOQ calculations work without errors

---

## Troubleshooting

**If you see "current_stock column not found" warning:**

- Run the ALTER TABLE command from Step 1 above

**If EOQ insert still fails with foreign key violation:**

- Check that the product_id exists in `centralized_product` table
- Query: `SELECT id FROM centralized_product WHERE id = <product_id> AND branch_id = <branch_id>`

**If stock values show as 0 in inventory_analytics:**

- Check that `centralized_product` has the correct quantity values
- Stock deduction only affects this table - inventory_analytics reflects what it finds
