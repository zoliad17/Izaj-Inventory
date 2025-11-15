# Quick Start Checklist - Sales Data Import Fix

## ✅ Pre-Flight Checks

- [ ] Node.js installed and working (`node --version`)
- [ ] Python 3.13+ installed (`python --version`)
- [ ] All npm packages installed (`npm ls` shows no errors)
- [ ] All Python packages installed (`pip list | grep -i flask`)

## 🚀 Start Services (in 3 separate terminals)

### Terminal 1: Node.js Backend

```powershell
cd c:\Users\monfe\Documents\Izaj-Inventory\backend\Server
npm start
# Wait for: "Server running on http://localhost:5000"
```

- [ ] Node.js backend started
- [ ] Shows "Server running on http://localhost:5000"
- [ ] No errors in console

### Terminal 2: Python Analytics Service

```powershell
cd c:\Users\monfe\Documents\Izaj-Inventory
python -m flask --app analytics.app run --port 5001
# Wait for: "Running on http://127.0.0.1:5001"
```

- [ ] Python service started
- [ ] Shows "Running on http://127.0.0.1:5001"
- [ ] No errors about missing packages

### Terminal 3: React Frontend

```powershell
cd c:\Users\monfe\Documents\Izaj-Inventory
npm run dev
# Wait for: "VITE v... ready in ... ms"
```

- [ ] React dev server started
- [ ] Shows local network URL
- [ ] Port is usually 5173 or 5174

## 🌐 Test in Browser

### Step 1: Open Dashboard

```
http://localhost:5173
→ Navigate to Analytics (in sidebar)
```

- [ ] Page loads without errors
- [ ] "EOQ Analytics Dashboard" header visible
- [ ] "Import Sales Data from POS" section visible

### Step 2: Upload Sample Data

```
1. Click "Select CSV or Excel File" button
2. Navigate to: c:\Users\monfe\Documents\Izaj-Inventory\
3. Choose: sample_sales_data.csv (or .xlsx)
4. Watch for modal to appear
```

- [ ] File picker opens
- [ ] Can see sample_sales_data.csv in folder
- [ ] Selected file (shows button shows "Uploading...")

### Step 3: Watch Modal Progress

```
Expected sequence:
1. Modal appears with spinner (⏳)
2. Message: "Uploading file..."
3. Message changes to: "Calculating EOQ with imported data..."
4. Modal shows checkmark (✅)
5. Message: "EOQ Calculation Complete!"
6. Details show: "EOQ: 312 units | Reorder Point: 60 units"
7. Modal auto-closes after 3 seconds
```

- [ ] Modal appears immediately
- [ ] Spinner animates (not frozen)
- [ ] Message updates once or twice
- [ ] Success checkmark appears
- [ ] Modal auto-closes

### Step 4: Verify Data Displayed

```
After modal closes, you should see:

Sales Data Success Box:
- Days of Data: 270
- Total Quantity: 15,045
- Average Daily: 55
- Annual Demand: 20,075

KPI Cards (4 cards in a row):
- EOQ Quantity: 312
- Reorder Point: 60
- Annual Total Cost: ₱3,200
- Safety Stock: 15

Three Charts:
- Inventory Level Prediction (30 Days)
- Order Cycle Visualization
- Annual Cost Breakdown
```

- [ ] Green success box appears with metrics
- [ ] 4 KPI cards display with calculated values
- [ ] 3 charts render with data lines/bars
- [ ] Charts are interactive (hover shows tooltips)

## 🔍 Verify in Browser Console

```
Press F12 → Console tab
Look for these logs (not red errors):
```

- [ ] `"Uploading file: sample_sales_data.csv Size: 4030"`
- [ ] `"Upload response: {success: true, metrics: {...}}"`
- [ ] `"EOQ calculation response: {success: true, data: {...}}"`
- [ ] NO red error messages
- [ ] NO "Cannot POST /api/analytics" errors

## ❌ Troubleshooting

### Modal Doesn't Appear

- [ ] All 3 services running? Check all 3 terminal windows
- [ ] React page fully loaded? Try F5 refresh
- [ ] Browser console open (F12)? Check for red errors
- [ ] File selected? Try clicking button again

### File Upload Fails

- [ ] Using CSV or XLSX file? Check file extension
- [ ] File has `date` column? Check first row
- [ ] File has `quantity` column? Check first row
- [ ] File has data rows? Need at least 10+ rows
- [ ] Check browser console (F12) for error message

### Charts Don't Display

- [ ] Success modal appeared? That means upload worked
- [ ] Scroll down page? Charts might be below visible area
- [ ] Reload page (F5)? Sometimes helps
- [ ] Check browser console for JavaScript errors

### "Cannot POST /api/analytics" Error

- [ ] Is Node.js backend running? Check Terminal 1
- [ ] Terminal 1 shows "Server running on http://localhost:5000"?
- [ ] Try restarting Node.js backend

### "No module named 'flask'" Error

- [ ] Python service running? Check Terminal 2
- [ ] In correct directory? Should be Izaj-Inventory root
- [ ] Run: `pip install -r analytics/requirements.txt`
- [ ] Try restarting Python service

## 📝 What to Check

### Service Health Checks

```powershell
# Check if services are accessible from browser console (F12):

# Node.js backend
fetch('http://localhost:5000/api/analytics/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Python service
fetch('http://localhost:5001/api/analytics/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Both should return: {success: true, message: "..."}
```

- [ ] Node.js responds with success message
- [ ] Python responds with success message

## 🎯 Success Criteria

You'll know everything is working when:

1. ✅ Modal appears immediately (within 1 second)
2. ✅ Spinner animates smoothly
3. ✅ Modal shows "Calculating EOQ..."
4. ✅ Modal switches to green checkmark
5. ✅ Modal shows: "EOQ: 312 units | Reorder Point: 60 units"
6. ✅ Modal auto-closes after 3 seconds
7. ✅ Green success box appears with imported metrics
8. ✅ KPI cards show numbers: 312, 60, ₱3,200, 15
9. ✅ Three charts render with data
10. ✅ Browser console shows no red errors

## 📊 Expected Values

When you upload `sample_sales_data.csv`:

| Metric                | Expected Value |
| --------------------- | -------------- |
| Days of Data          | 270            |
| Total Quantity        | 15,045         |
| Average Daily         | 55             |
| Annual Demand         | 20,075         |
| **EOQ Quantity**      | **~312**       |
| **Reorder Point**     | **~60**        |
| **Safety Stock**      | **~15**        |
| **Annual Total Cost** | **₱3,200**     |
| Annual Holding Cost   | ₱1,600         |
| Max Stock Level       | ~372           |
| Average Inventory     | ~155           |

## 🆘 Need Help?

### Read These Files (in order):

1. **IMPORT_FIX_COMPLETE.md** ← Start here
2. **CODE_CHANGES_REFERENCE.md** ← See what changed
3. **VISUAL_TESTING_GUIDE.md** ← See what should appear
4. **ANALYTICS_IMPLEMENTATION.md** ← Deep technical info

### Check These Files:

- `backend/Server/routes/analytics.js` (line 73-93)
- `src/components/Analytics/EOQAnalyticsDashboard.tsx` (modal section)
- `analytics/routes.py` (sales-data/import endpoint)
- `analytics/app.py` (Flask configuration)

### Browser Console Debugging:

```javascript
// See all recent network requests
fetch("/api/analytics/sales-data/import")
  .then((r) => r.json())
  .then(console.log);

// Manually test upload simulation
const fd = new FormData();
const f = document.querySelector("input[type=file]");
fd.append("file", f.files[0]);
fetch("/api/analytics/sales-data/import", { method: "POST", body: fd })
  .then((r) => r.json())
  .then(console.log);
```

---

## 📋 Completion Checklist

- [ ] All 3 services started and running
- [ ] No errors in any terminal
- [ ] Browser page loads without errors
- [ ] File upload button is clickable
- [ ] Modal appears with spinner on upload
- [ ] Modal shows success with results
- [ ] Data displays correctly
- [ ] Charts render with data
- [ ] Browser console shows no red errors
- [ ] Everything matches expected values

## 🎉 Ready to Go!

Once all checks pass, your sales data import is working perfectly!

Next steps:

1. Test with your own sales data
2. Upload files from your actual POS system
3. Verify EOQ calculations match your expectations
4. Consider database integration (future enhancement)

---

**Last Updated**: November 14, 2025
**Status**: ✅ Ready to Test
