# Visual Testing Guide - Sales Data Import

## What You Should See

### Step 1: Click Upload Button

![Before Click]

```
┌─────────────────────────────────────────┐
│ Import Sales Data from POS              │
├─────────────────────────────────────────┤
│                                         │
│  [📤 Select CSV or Excel File] ←Click  │
│  Upload sales data with columns:        │
│  quantity and date                      │
│                                         │
└─────────────────────────────────────────┘
```

### Step 2: Select File

A file picker appears → Choose `sample_sales_data.csv` or `.xlsx`

### Step 3: Watch Modal Progress

#### Phase 1 - Uploading (1-2 seconds)

```
┌────────────────────────────────┐
│                                │
│        ⏳ ↻ ↻ ↻ ← SPINNING     │
│                                │
│    Uploading file...           │
│                                │
└────────────────────────────────┘
```

#### Phase 2 - Calculating (1-2 seconds)

```
┌────────────────────────────────┐
│                                │
│        ⏳ ↻ ↻ ↻ ← SPINNING     │
│                                │
│ Calculating EOQ with imported  │
│ data...                        │
│                                │
└────────────────────────────────┘
```

#### Phase 3 - Success (3 seconds)

```
┌────────────────────────────────┐
│                                │
│           ✅ ← GREEN CHECKMARK  │
│                                │
│  EOQ Calculation Complete!     │
│                                │
│  EOQ: 312 units | Reorder      │
│  Point: 60 units               │
│                                │
└────────────────────────────────┘
    ↓ Auto-closes after 3s
```

### Step 4: Data Displayed

#### Success Metrics Box

```
┌─────────────────────────────────────────┐
│ ✓ Sales Data Analyzed Successfully!     │
├─────────────────────────────────────────┤
│ Days of Data    │ Total Quantity        │
│ 270             │ 15,045                │
│                                         │
│ Average Daily   │ Annual Demand         │
│ 55              │ 20,075                │
└─────────────────────────────────────────┘
```

#### KPI Cards (4 columns)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│              │              │              │              │
│ EOQ Quantity │ Reorder Pt   │ Annual Total │ Safety Stock │
│              │              │ Cost         │              │
│    312       │      60      │    ₱3,200    │      15      │
│              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Three Charts Appear

```
┌─────────────────────────────┬─────────────────────────────┐
│ Inventory Level Prediction  │ Order Cycle Visualization   │
│ (30 Days)                   │                             │
│                             │                             │
│ ╱╲                          │ ▁ ▁ ▁ ▁ ▁                    │
│ ╱  ╲ ╱─────╲ ╱─────╲       │ █ █ █ █ █                    │
│                             │                             │
└─────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Annual Cost Breakdown                           │
│                                                 │
│ ▁  ▁  ▁                                         │
│ █  █  █  Holding Cost | Safety Stock | Ordering│
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## If Something Goes Wrong

### Error Modal - File Format

```
┌────────────────────────────────┐
│                                │
│    ❌ ← RED ERROR ICON          │
│                                │
│  Failed to import sales data   │
│                                │
│  Unsupported file format.      │
│  Use CSV or Excel              │
│                                │
│  [Close]                       │
│                                │
└────────────────────────────────┘
```

### Error Modal - Missing Columns

```
┌────────────────────────────────┐
│                                │
│    ❌ ← RED ERROR ICON          │
│                                │
│  Failed to import sales data   │
│                                │
│  Missing columns: date         │
│  File needs: quantity, date    │
│                                │
│  [Close]                       │
│                                │
└────────────────────────────────┘
```

### Error Modal - Services Not Running

```
┌────────────────────────────────┐
│                                │
│    ❌ ← RED ERROR ICON          │
│                                │
│  Failed to import sales data   │
│                                │
│  Cannot POST /api/analytics    │
│  Make sure backend is running  │
│                                │
│  [Close]                       │
│                                │
└────────────────────────────────┘
```

---

## Debugging - Browser Console Output

### Success Scenario:

Open DevTools (F12) → Console tab

```javascript
> Uploading file: sample_sales_data.csv Size: 4030
> Upload response: {
    success: true,
    metrics: {
      total_quantity: 15045,
      average_daily: 55,
      annual_demand: 20075,
      days_of_data: 270,
      date_range: {...}
    }
  }
> EOQ calculation response: {
    success: true,
    data: {
      eoq_quantity: 312,
      reorder_point: 60,
      safety_stock: 15,
      annual_holding_cost: 1600,
      total_annual_cost: 3200,
      ...
    }
  }
```

### Error Scenario:

```javascript
> Upload error: Error: Failed to fetch
> (or specific error message from server)

// Check what services are running
// Open http://localhost:5000/api/analytics/health
// Open http://localhost:5001/api/analytics/health
```

---

## Quick Troubleshooting Checklist

### ✅ Services Running?

```powershell
# Check Node.js (port 5000)
netstat -ano | findstr :5000

# Check Python (port 5001)
netstat -ano | findstr :5001

# Check if React dev server (port 5173)
netstat -ano | findstr :5173
```

### ✅ File Format Correct?

```
Good Files:
✓ sample_sales_data.csv    (4 KB)
✓ sample_sales_data.xlsx   (8.5 KB)

Your Files Should Have:
- Column 1: date (format: YYYY-MM-DD)
- Column 2: quantity (numbers only)
- No empty rows
- At least 10 rows of data
```

### ✅ Modal Appears?

- ✓ File selected?
- ✓ All services running?
- ✓ Check browser console for errors (F12)

### ✅ Charts Display?

- ✓ Success modal showed?
- ✓ Scroll down to see charts?
- ✓ Check browser DevTools (F12) for JavaScript errors

---

## Timeline to Expect

```
User Action          Time Required   What's Happening
─────────────────────────────────────────────────────
Click Upload         0s              Modal opens with "Uploading..."
File Uploading       0.5-2s          Spinner spinning
File Processing      0.3-0.5s        (Python validates data)
Starting EOQ Calc    0.8s            Modal shows "Calculating..."
EOQ Calculation      0.5-1s          (Python runs algorithm)
Modal Shows Success  0.1s            Green checkmark ✓
Modal Auto-closes    3s              Waits then closes
Charts Display       0.2s            Rendered with data
─────────────────────────────────────────────────────
Total Expected       ~4-6 seconds    From upload to fully displayed results
```

---

## Success Indicators

### You'll Know It's Working When:

1. ✅ Modal appears immediately when you select file
2. ✅ Spinner animates (not frozen)
3. ✅ Message updates to "Calculating..."
4. ✅ Modal shows green checkmark with results
5. ✅ Modal displays: "EOQ: 312 units | Reorder Point: 60 units"
6. ✅ Modal closes after 3 seconds
7. ✅ KPI cards display numbers
8. ✅ Three charts appear with data
9. ✅ Browser console shows success logs
10. ✅ No red errors in browser console

---

## Next Actions After Success

1. **Test Different File Sizes**

   - Try with 100+ rows
   - Try with 1000+ rows
   - Performance should stay quick

2. **Test Your Own Data**

   - Export sales data as CSV from your POS
   - Ensure columns are named: `date` and `quantity`
   - Upload and verify EOQ results make sense

3. **Monitor Console Logs**

   - Keep DevTools open (F12)
   - Watch response objects
   - Save successful responses for reference

4. **Test Error Cases**
   - Upload wrong file type (try .txt)
   - Upload file with missing columns
   - Upload empty file
   - Verify error modals appear correctly

---

**Expected Outcome**: Professional UI with smooth feedback, accurate EOQ calculations, beautiful charts!

**Time to Full Implementation**: ~1-3 weeks to database integration
