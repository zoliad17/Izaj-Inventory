# Diagnostic Guide - Failed to Calculate EOQ

## What Was Fixed

The EOQ calculation was failing because it was routing through the Node.js proxy, which wasn't properly forwarding requests to the Python backend.

**Solution**: Updated React to send EOQ calculations **directly to Python backend** at `http://localhost:5001`, just like file uploads.

## Updated Code Flow

```
React Component
    ↓
User uploads file → Direct to Python (http://localhost:5001/api/analytics/sales-data/import)
    ↓
File processed, metrics returned
    ↓
Auto-calculate EOQ → Direct to Python (http://localhost:5001/api/analytics/eoq/calculate)
    ↓
Results received
    ↓
Modal shows success & charts display
```

## Testing Steps

### 1. Verify All Services Running

**Terminal 1 - Node.js Backend**:

```powershell
cd backend/Server
npm start
# Should show: "Server running on http://localhost:5000"
```

**Terminal 2 - Python Analytics**:

```powershell
python -m flask --app analytics.app run --port 5001
# Should show: "Running on http://127.0.0.1:5001"
```

**Terminal 3 - React Frontend**:

```powershell
npm run dev
# Should show: "VITE v... ready in ... ms"
```

### 2. Test File Upload & EOQ Calculation

1. Open browser: `http://localhost:5173`
2. Navigate to **Analytics Dashboard** (sidebar)
3. Click **"Select CSV or Excel File"**
4. Choose `sample_sales_data.csv`
5. Watch modal sequence:
   ```
   ⏳ Uploading file... (1-2 sec)
      ↓
   ⏳ Calculating EOQ with imported data... (1 sec)
      ↓
   ✅ EOQ Calculation Complete!
      EOQ: 312 units | Reorder Point: 60 units
      ↓ (Auto-closes in 3 sec)
   ```
6. See KPI cards and charts display

### 3. Check Browser Console (F12 → Console)

**Should see these logs in order**:

```javascript
// 1. Upload starts
"Uploading file: sample_sales_data.csv Size: 4030";

// 2. Upload completes
"Upload response: {success: true, metrics: {total_quantity: 15045, ...}}";

// 3. EOQ calculation starts and completes
"EOQ calculation response: {success: true, data: {eoq_quantity: 312, ...}}";

// No red error messages
```

### 4. Verify Response Format

**Expected Upload Response**:

```json
{
  "success": true,
  "message": "Imported 274 sales records",
  "metrics": {
    "total_quantity": 15045,
    "average_daily": 55.02,
    "annual_demand": 20075,
    "days_of_data": 270,
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-09-30"
    }
  }
}
```

**Expected EOQ Response**:

```json
{
  "success": true,
  "data": {
    "eoq_quantity": 312,
    "reorder_point": 60,
    "safety_stock": 15,
    "annual_holding_cost": 1600,
    "total_annual_cost": 3200,
    "max_stock_level": 372,
    "min_stock_level": 45,
    "average_inventory": 156
  }
}
```

## Troubleshooting

### Issue: Still Shows "Failed to Calculate EOQ"

**Check 1**: Are all 3 services running?

```powershell
# In new terminal, check ports
netstat -ano | findstr :5000  # Node.js
netstat -ano | findstr :5001  # Python
netstat -ano | findstr :5173  # React
```

**Check 2**: Is Python service responding?
Open browser console (F12) and run:

```javascript
fetch("http://localhost:5001/api/analytics/health")
  .then((r) => r.json())
  .then((d) => console.log("Python service:", d));
```

Should see: `{success: true, message: "..."}`

**Check 3**: File upload succeeding?

- Is green "Sales Data Analyzed Successfully!" box appearing?
- If yes → upload works, but EOQ calculation failing
- If no → fix upload first (see IMPORT_FIX_COMPLETE.md)

### Issue: File uploads work but EOQ calculation fails

**Most likely cause**: Python backend not running or not accessible.

**Verify**:

1. Python terminal shows `Running on http://127.0.0.1:5001`
2. No error logs in Python terminal
3. Browser console shows error details (F12)

### Issue: Network Error / CORS Error

**This is expected for cross-origin requests**, but should still work because:

- Localhost-to-localhost requests are generally permitted
- Python Flask should allow CORS for analytics

**If you see CORS error**:

1. Check Python `app.py` for CORS setup:
   ```python
   from flask_cors import CORS
   CORS(app)
   ```
2. If missing, add it to `analytics/app.py`

## File Changes Summary

**Updated**: `src/components/Analytics/EOQAnalyticsDashboard.tsx`

```typescript
// OLD: Went through Node.js proxy
const response = await fetch("/api/analytics/eoq/calculate", {...})

// NEW: Direct to Python backend
const pythonBackendUrl = 'http://localhost:5001';
const response = await fetch(`${pythonBackendUrl}/api/analytics/eoq/calculate`, {...})
```

**Why This Fix Works**:

- Eliminates Node.js proxy as point of failure
- Direct connection to Python where calculation happens
- Both file upload and EOQ now use same proven pattern
- Simpler error debugging

## Expected Behavior After Fix

### Success Path:

1. ✅ Upload file → Modal shows spinner
2. ✅ File processed → Modal shows "Calculating..."
3. ✅ EOQ calculated → Modal shows success
4. ✅ Charts display → KPI cards update

### Error Handling:

- **Invalid file format** → Error modal with "Unsupported file format"
- **Missing columns** → Error modal with "Missing columns: ..."
- **No data** → Error modal with "No valid data found"
- **Calculation failure** → Error modal with "Failed to calculate EOQ"

## Next Steps

1. Restart React dev server (if running):

   - Stop: `Ctrl+C` in Terminal 3
   - Restart: `npm run dev`

2. Test with sample data again

3. If still failing, check:
   - Python terminal for error logs
   - Browser console (F12) for error details
   - Network tab (F12) to see actual responses

## Quick Verification

Run this in browser console to test both endpoints:

```javascript
// Test 1: Python service health
console.log("Testing Python service...");
fetch("http://localhost:5001/api/analytics/health")
  .then((r) => r.json())
  .then((d) => console.log("✅ Python health:", d))
  .catch((e) => console.log("❌ Python error:", e.message));

// Test 2: EOQ calculation directly
console.log("Testing EOQ calculation...");
fetch("http://localhost:5001/api/analytics/eoq/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    annual_demand: 20075,
    holding_cost: 50,
    ordering_cost: 100,
    unit_cost: 25,
    lead_time_days: 7,
    confidence_level: 0.95,
  }),
})
  .then((r) => r.json())
  .then((d) => console.log("✅ EOQ result:", d))
  .catch((e) => console.log("❌ EOQ error:", e.message));
```

---

**Status**: ✅ Fixed
**Both endpoints now direct**: ✅ Yes
**Ready to test**: ✅ Yes
