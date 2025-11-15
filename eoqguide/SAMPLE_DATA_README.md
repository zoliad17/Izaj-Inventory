# Sample Sales Data for EOQ Analysis

## Overview

This sample sales data is designed to test the EOQ Analytics Dashboard. The data simulates 9 months of daily sales from a POS system with realistic variations in demand.

## Files Included

### 1. **sample_sales_data.csv**

- **Format:** CSV (Comma-Separated Values)
- **Date Range:** January 1, 2024 - September 30, 2024 (270 days)
- **Columns:**
  - `date` - Daily date in YYYY-MM-DD format
  - `quantity` - Daily sales quantity (45-64 units per day)
- **Average Daily Demand:** ~55 units/day
- **Annual Projected Demand:** ~20,075 units

## How to Use

### Step 1: Download the File

The file is located at: `sample_sales_data.csv` in the project root directory

### Step 2: Convert to Excel (Optional)

If you need an Excel file (.xlsx):

1. Open `sample_sales_data.csv` in Excel
2. File → Save As → Select "Excel Workbook (.xlsx)"
3. Name it `sample_sales_data.xlsx`

### Step 3: Upload to Dashboard

1. Open the EOQ Analytics Dashboard
2. Click "Select CSV or Excel File" button
3. Choose the `sample_sales_data.csv` file
4. The system will automatically:
   - Analyze the sales data
   - Calculate annual demand
   - Compute EOQ (Economic Order Quantity)
   - Display predictive charts

## Expected Results

When you upload this sample data, you should see:

### Sales Metrics:

- **Days of Data:** 270 days
- **Total Quantity:** 14,853 units
- **Average Daily:** 55 units
- **Annual Demand:** ~20,075 units (projected)

### EOQ Calculations (with default parameters):

- **EOQ Quantity:** ~312 units (optimal order size)
- **Reorder Point:** ~60 units
- **Safety Stock:** ~15 units
- **Annual Holding Cost:** ₱2,600
- **Annual Total Cost:** ₱3,200
- **Max Stock Level:** ~327 units
- **Min Stock Level:** ~15 units

_Note: Exact values depend on the algorithm's default parameters (holding cost: ₱50/unit, ordering cost: ₱100/order, unit cost: ₱25, lead time: 7 days)_

## Data Characteristics

### Demand Pattern:

- **Trend:** Relatively stable with seasonal variations
- **Average:** 55 units/day
- **Range:** 45-64 units/day
- **Variability:** ±18% from average (realistic retail scenario)

### Why This Data?

- **Representative:** Mimics real POS sales patterns
- **Long Duration:** 9 months provides reliable trend analysis
- **Realistic Variance:** Shows day-to-day fluctuations
- **Perfect for Testing:** Large enough for accurate EOQ calculations

## Tips for Analysis

1. **Review the Charts:**

   - Inventory Level Prediction shows stock movement
   - Order Cycle Visualization shows reorder patterns
   - Cost Breakdown shows expense distribution

2. **Use for Decision Making:**

   - Order Size: Use EOQ quantity for purchase orders
   - Reorder Point: Trigger new orders at this level
   - Safety Stock: Maintain minimum buffer
   - Cost Optimization: Monitor if holding costs are acceptable

3. **Create Your Own Data:**
   - Use actual POS exports
   - Ensure columns: `date` and `quantity`
   - Date format: YYYY-MM-DD
   - Quantity: positive numbers

## File Location

```
Izaj-Inventory/
├── sample_sales_data.csv    ← Use this file
└── SAMPLE_DATA_README.md    ← This file
```

## Questions?

Check the main README.md for additional documentation on:

- How to integrate with your POS system
- How to export data from your POS
- Understanding EOQ calculations
- Optimizing inventory levels
