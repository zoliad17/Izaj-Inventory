# Database Table Reference for EOQ Analytics

## ✅ Primary Table: `product_demand_history`

**The EOQ analytics system should read from the `product_demand_history` table instead of CSV files.**

### Table Schema

```sql
CREATE TABLE public.product_demand_history (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_id integer NOT NULL,           -- Links to centralized_product
  branch_id integer NOT NULL,            -- Links to branch
  period_date date NOT NULL,             -- Date of the sales period
  quantity_sold bigint NOT NULL,         -- ⭐ PRIMARY FIELD for EOQ calculation
  revenue real,                          -- Optional: for value analysis
  avg_price real,                        -- Optional: for cost calculations
  source character varying DEFAULT 'bitpos_import',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_demand_history_pkey PRIMARY KEY (id),
  CONSTRAINT product_demand_history_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.centralized_product(id),
  CONSTRAINT product_demand_history_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);
```

### Why This Table?

✅ **Purpose-Built**: Designed specifically for demand analysis  
✅ **Aggregated Data**: Pre-aggregated by period (better performance)  
✅ **Historical Tracking**: Maintains complete demand history  
✅ **Product & Branch Linked**: Supports multi-branch, multi-product analysis  
✅ **Structured Format**: Consistent date and quantity fields  

---

## 📊 Data Mapping

### CSV Format → Database Format

**CSV (sample_sales_data_lighting.csv)**:
```csv
date,product,quantity
2024-01-01,LED Smart Bulb 9W RGB WiFi,8
2024-01-02,LED Smart Bulb 9W RGB WiFi,10
```

**Database (product_demand_history)**:
```sql
INSERT INTO product_demand_history (product_id, branch_id, period_date, quantity_sold, source)
VALUES 
  (1, 1, '2024-01-01', 8, 'csv_import'),
  (1, 1, '2024-01-02', 10, 'csv_import');
```

### Key Differences

| CSV Field | Database Field | Notes |
|-----------|----------------|-------|
| `date` | `period_date` | Same format: YYYY-MM-DD |
| `quantity` | `quantity_sold` | Same value |
| `product` (name) | `product_id` | Need to lookup product ID |
| N/A | `branch_id` | Need to specify branch |
| N/A | `source` | Track data origin |

---

## 🔍 Query Examples

### 1. Get Demand History for EOQ Calculation

```sql
SELECT 
  period_date,
  quantity_sold,
  revenue,
  avg_price
FROM product_demand_history
WHERE product_id = 1 
  AND branch_id = 1
ORDER BY period_date ASC;
```

### 2. Calculate Annual Demand

```sql
SELECT 
  product_id,
  branch_id,
  SUM(quantity_sold) as total_quantity,
  COUNT(DISTINCT period_date) as days_with_data,
  MIN(period_date) as first_date,
  MAX(period_date) as last_date,
  -- Annual demand projection
  CASE 
    WHEN COUNT(DISTINCT period_date) > 0 
    THEN (SUM(quantity_sold)::float / 
          GREATEST(EXTRACT(EPOCH FROM (MAX(period_date) - MIN(period_date))) / 86400, 1)) * 365
    ELSE 0
  END as annual_demand
FROM product_demand_history
WHERE product_id = 1 AND branch_id = 1
GROUP BY product_id, branch_id;
```

### 3. Get Recent Data for Forecasting

```sql
-- Last 12 months
SELECT 
  period_date,
  quantity_sold
FROM product_demand_history
WHERE product_id = 1 
  AND branch_id = 1
  AND period_date >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY period_date ASC;
```

### 4. Check Data Completeness

```sql
SELECT 
  product_id,
  branch_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT period_date) as unique_dates,
  MIN(period_date) as first_date,
  MAX(period_date) as last_date,
  SUM(quantity_sold) as total_quantity,
  AVG(quantity_sold) as avg_daily_quantity,
  -- Date range in days
  EXTRACT(EPOCH FROM (MAX(period_date) - MIN(period_date))) / 86400 + 1 as days_span
FROM product_demand_history
WHERE product_id = 1 AND branch_id = 1
GROUP BY product_id, branch_id;
```

---

## 🔄 Alternative: `sales` Table

If `product_demand_history` is not populated, you can aggregate from the `sales` table:

```sql
-- Aggregate sales transactions to daily demand
SELECT 
  transaction_date as period_date,
  SUM(quantity_sold) as quantity_sold,
  SUM(total_amount) as revenue,
  AVG(unit_price) as avg_price
FROM sales
WHERE product_id = 1 
  AND branch_id = 1
  AND transaction_date >= '2024-01-01'
  AND transaction_date <= '2024-12-31'
GROUP BY transaction_date
ORDER BY transaction_date;
```

**Note**: This is less efficient than using `product_demand_history` directly.

---

## 📋 Data Requirements

### Minimum Data for Accurate EOQ

- **30 days**: Minimum for basic calculation
- **90 days**: Recommended for reliable annual projection
- **365 days**: Ideal for seasonal pattern detection

### Data Quality Checks

```sql
-- Find products with insufficient data
SELECT 
  p.id as product_id,
  p.product_name,
  b.id as branch_id,
  b.location,
  COUNT(pdh.period_date) as data_points,
  MIN(pdh.period_date) as first_date,
  MAX(pdh.period_date) as last_date,
  CASE 
    WHEN COUNT(pdh.period_date) < 30 THEN 'Insufficient'
    WHEN COUNT(pdh.period_date) < 90 THEN 'Limited'
    ELSE 'Adequate'
  END as data_quality
FROM centralized_product p
CROSS JOIN branch b
LEFT JOIN product_demand_history pdh 
  ON pdh.product_id = p.id AND pdh.branch_id = b.id
GROUP BY p.id, p.product_name, b.id, b.location
HAVING COUNT(pdh.period_date) < 90
ORDER BY data_points ASC;
```

---

## 🚀 Integration Steps

### Step 1: Populate `product_demand_history`

If you have CSV data, import it:

```javascript
// Node.js import script
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function importCSV(csvPath, productId, branchId) {
  const records = [];
  
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      records.push({
        product_id: productId,
        branch_id: branchId,
        period_date: row.date,
        quantity_sold: parseInt(row.quantity),
        source: 'csv_import'
      });
    })
    .on('end', async () => {
      const { error } = await supabase
        .from('product_demand_history')
        .insert(records);
      
      if (error) {
        console.error('Import error:', error);
      } else {
        console.log(`Imported ${records.length} records`);
      }
    });
}
```

### Step 2: Query from Node.js Backend

```javascript
// backend/Server/routes/analytics.js
router.post("/demand-history/calculate", async (req, res) => {
  const { product_id, branch_id } = req.body;
  
  // Query product_demand_history
  const { data, error } = await supabase
    .from('product_demand_history')
    .select('period_date, quantity_sold')
    .eq('product_id', product_id)
    .eq('branch_id', branch_id)
    .order('period_date', { ascending: true });
  
  if (error || !data || data.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No demand history found'
    });
  }
  
  // Forward to Python analytics service
  const response = await axios.post(
    `${ANALYTICS_URL}/demand-history/calculate`,
    {
      product_id,
      branch_id,
      historical_data: data,
      ...req.body
    }
  );
  
  res.json(response.data);
});
```

### Step 3: Use in Frontend

Instead of file upload, use product/branch selection:

```typescript
// React component
const calculateEOQFromDatabase = async (productId: number, branchId: number) => {
  const response = await fetch('/api/analytics/demand-history/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      branch_id: branchId,
      holding_cost: 50,
      ordering_cost: 100,
      unit_cost: 25
    })
  });
  
  const result = await response.json();
  // Display EOQ results
};
```

---

## 📊 Related Tables

### `eoq_calculations` - Store Results

```sql
-- After calculating EOQ, store results
INSERT INTO eoq_calculations (
  product_id,
  branch_id,
  annual_demand,
  holding_cost,
  ordering_cost,
  unit_cost,
  eoq_quantity,
  reorder_point,
  safety_stock,
  lead_time_days,
  confidence_level,
  valid_until
) VALUES (
  1, 1, 19710, 50, 100, 25,
  280.5, 60.2, 15.8, 7, 0.95,
  CURRENT_DATE + INTERVAL '30 days'
);
```

### `sales_forecast` - Store Forecasts

```sql
-- Store demand forecasts
INSERT INTO sales_forecast (
  product_id,
  branch_id,
  forecast_month,
  forecasted_quantity,
  confidence_interval_lower,
  confidence_interval_upper,
  forecast_method
) VALUES (
  1, 1, '2024-10-01', 165.23, 145.67, 184.79, 'exponential'
);
```

### `inventory_analytics` - Store Analysis

```sql
-- Store inventory health analysis
INSERT INTO inventory_analytics (
  product_id,
  branch_id,
  analysis_date,
  current_stock,
  avg_daily_usage,
  stock_adequacy_days,
  stockout_risk_percentage,
  recommendation
) VALUES (
  1, 1, CURRENT_DATE, 150, 5.0, 30.0, 12.5,
  'Maintain current stock. Next order recommended when stock reaches 52'
);
```

---

## ✅ Summary

**Use `product_demand_history` table for EOQ analytics because:**

1. ✅ **Structured**: Consistent format with product_id, branch_id, period_date
2. ✅ **Aggregated**: Pre-aggregated by period (better performance)
3. ✅ **Historical**: Maintains complete demand history
4. ✅ **Linked**: Properly linked to products and branches
5. ✅ **Trackable**: Source field tracks data origin

**Migration Path:**
1. Import existing CSV data to `product_demand_history`
2. Set up scheduled job to populate from `sales` table
3. Update frontend to query database instead of file upload
4. Use new endpoint: `/api/analytics/demand-history/calculate`

---

**See Also:**
- `DATABASE_INTEGRATION.md` - Full integration guide
- `EOQ_SYSTEM_OVERVIEW.md` - Complete system overview

