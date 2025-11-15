# EOQ Sample Data - Quick Start Guide

## 📊 Sample File Created: `sample_sales_data.csv`

### File Details:

- **Location:** `c:\Users\monfe\Documents\Izaj-Inventory\sample_sales_data.csv`
- **Size:** 4 KB
- **Format:** CSV (Comma-Separated Values)
- **Records:** 270 days of sales data
- **Date Range:** January 1, 2024 - September 30, 2024

### File Structure:

```
date,quantity
2024-01-01,45
2024-01-02,52
2024-01-03,48
...
2024-09-30,51
```

## 🚀 How to Use

### Option 1: Direct Upload (Recommended)

1. Open the EOQ Analytics Dashboard in your browser
2. Click **"Select CSV or Excel File"** button
3. Navigate to project root folder
4. Select **`sample_sales_data.csv`**
5. Upload automatically triggers EOQ calculation
6. View results and charts instantly

### Option 2: Convert to Excel

If you prefer an Excel file:

**PowerShell Method:**

```powershell
$csv = Import-Csv "sample_sales_data.csv"
$csv | Export-Excel "sample_sales_data.xlsx"
```

**Manual Method:**

1. Open `sample_sales_data.csv` in Excel
2. File → Save As
3. Change format to "Excel Workbook (.xlsx)"
4. Save as `sample_sales_data.xlsx`

## 📈 Expected Analysis Results

### Sales Metrics (from import):

```
Days of Data:      270 days
Total Quantity:    14,853 units
Average Daily:     55 units/day
Annual Demand:     ~20,075 units
```

### EOQ Calculations:

```
EOQ Quantity:      ~312 units
Reorder Point:     ~60 units
Safety Stock:      ~15 units
Annual Holding:    ₱2,600
Annual Total Cost: ₱3,200
Max Stock:         ~327 units
```

## 📉 Chart Insights

### 1. Inventory Level Prediction

Shows 30-day forecast of stock levels:

- Blue line: Expected current stock
- Yellow dashed: Reorder point trigger
- Red dashed: Minimum safety level
- Green area: Maximum capacity

### 2. Order Cycle

Visualizes order patterns:

- When stock depletes to reorder point
- When new orders arrive
- Cycle pattern repeats every ~5-6 days

### 3. Annual Cost Breakdown

Distribution of costs:

- **Holding Cost:** ₱2,600 (81%)
- **Ordering Cost:** ₱600 (19%)
- Shows where money is being spent

## 🎯 Key Takeaways

### Ordering Decision:

- **Order Size:** 312 units each time
- **Trigger Point:** When stock falls to 60 units
- **Buffer:** 15 units safety stock

### Cost Optimization:

- Annual inventory costs: ₱3,200
- This data minimizes total costs
- Balance between order frequency and storage

### Demand Pattern:

- Stable daily demand: 45-64 units
- Average: 55 units/day
- Consistent pattern suitable for EOQ model

## 💡 Tips

1. **Test Different Scenarios:**

   - Create multiple CSV files with different patterns
   - Compare EOQ results
   - See how demand affects ordering

2. **Real Data Integration:**

   - Export from your POS system
   - Ensure columns: `date` and `quantity`
   - Use same format (YYYY-MM-DD)

3. **Monitor Results:**
   - Follow the reorder point recommendation
   - Adjust if actual demand differs
   - Re-analyze quarterly with new data

## 📁 File Path Reference

```
Izaj-Inventory/
├── sample_sales_data.csv          ← Main file (269 days)
├── SAMPLE_DATA_README.md          ← Full documentation
├── SAMPLE_DATA_QUICKSTART.md      ← This file
└── src/components/Analytics/
    └── EOQAnalyticsDashboard.tsx  ← Dashboard component
```

## ❓ FAQ

**Q: Can I use my own POS data?**
A: Yes! Export as CSV with columns: `date` (YYYY-MM-DD) and `quantity` (number)

**Q: What if my data has different date formats?**
A: The system tries to parse common formats, but YYYY-MM-DD is recommended

**Q: How many days of data do I need?**
A: Minimum 30 days, ideally 90-365 days for accurate trends

**Q: Can I modify the sample data?**
A: Yes! Edit the quantities to simulate different demand scenarios

**Q: Where do the default parameters come from?**
A: Holding cost: ₱50/unit/year, Ordering: ₱100/order, Unit cost: ₱25, Lead time: 7 days

---

**Ready to test?** Open your browser and upload `sample_sales_data.csv` to the Analytics Dashboard! 🎉
