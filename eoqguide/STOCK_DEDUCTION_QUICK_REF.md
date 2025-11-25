# 📋 Stock Deduction - Quick Reference

## ✅ FIXED - Stock now deducts automatically!

### What Changed

- `analytics/db.py`: Fixed Supabase stock deduction path
- Now uses Supabase client instead of failing psycopg2 connection

### How to Verify

**Quick Test (10 seconds)**

```bash
python analytics/tools/test_stock_deduction.py
```

Expected: Stock decreases for test products ✓

**Full Test (597 sales)**

```bash
python -m analytics.app  # Terminal 1
# Then in Terminal 2:
curl -X POST http://localhost:5001/api/analytics/sales-data/import \
  -F "file=@analytics/tools/sample_sales_2025-10-27_to_2025-11-25.csv"
```

Expected: 597 sales inserted + stock deducted ✓

### Check Results in Supabase

**Sales Table** (should have 597+ rows for branch 2):

```sql
SELECT COUNT(*) FROM sales WHERE branch_id = 2;
-- Should be > 597
```

**Centralized Product** (quantities should be reduced):

```sql
SELECT id, quantity FROM centralized_product
WHERE branch_id = 2
ORDER BY id LIMIT 10;
-- Quantities should be lower than before import
```

### How Stock Deduction Works

```
CSV Import
    ↓
Insert 597 sales into DB
    ↓
For each (product_id, branch_id):
  - Get current quantity
  - Subtract total_sold
  - Update centralized_product
    ↓
All stock updated ✓
```

### Logs to Expect

```
✓ Inserted 597 sales rows to Supabase
✓ Deducted X units from product Y (branch Z)
  (repeated for each product/branch combo)
```

### Files

| File                                      | Purpose              |
| ----------------------------------------- | -------------------- |
| `analytics/db.py`                         | Core deduction logic |
| `analytics/tools/test_stock_deduction.py` | Test script          |
| `STOCK_DEDUCTION_GUIDE.md`                | Full documentation   |
| `STOCK_DEDUCTION_FIXED.md`                | What was fixed       |

### Key Points

- ✅ Automatic (no manual trigger needed)
- ✅ Supabase native (no external dependencies)
- ✅ Prevents negative stock
- ✅ Tracks update timestamps
- ✅ Works per product/branch

### Troubleshoot

| Issue                  | Solution                                              |
| ---------------------- | ----------------------------------------------------- |
| Stock not deducting    | Check logs for "Error deducting stock"                |
| Sales not importing    | Check CSV format (needs product_id, quantity columns) |
| Negative stock         | Check DB directly - shouldn't happen                  |
| Nothing in sales table | Verify CSV has product_id column                      |

That's it! 🎉
