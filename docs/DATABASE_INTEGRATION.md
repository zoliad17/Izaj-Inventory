# Database Integration for EOQ Analytics

## 📊 Primary Data Source: `product_demand_history` Table

The EOQ analytics system should read from the **`product_demand_history`** table instead of CSV files. This table is specifically designed to store historical demand data for EOQ calculations.

### Table Structure

```sql
CREATE TABLE public.product_demand_history (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_id integer NOT NULL,
  branch_id integer NOT NULL,
  period_date date NOT NULL,
  quantity_sold bigint NOT NULL,
  revenue real,
  avg_price real,
  source character varying DEFAULT 'bitpos_import',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_demand_history_pkey PRIMARY KEY (id),
  CONSTRAINT product_demand_history_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.centralized_product(id),
  CONSTRAINT product_demand_history_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);
```

### Key Fields for EOQ

| Field | Type | Purpose |
|-------|------|---------|
| `product_id` | INTEGER | Links to product |
| `branch_id` | INTEGER | Links to branch |
| `period_date` | DATE | Date of the sales period |
| `quantity_sold` | BIGINT | **Primary field for demand calculation** |
| `revenue` | REAL | Optional: for value-based analysis |
| `avg_price` | REAL | Optional: for cost calculations |

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Supabase Database                                       │
│  product_demand_history table                            │
│  • Historical sales data by product & branch            │
│  • Aggregated by period_date                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js Backend                                        │
│  Queries product_demand_history                         │
│  • Filters by product_id & branch_id                   │
│  • Orders by period_date                                │
│  • Calculates date range                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Python Analytics Service                               │
│  POST /api/analytics/demand-history/calculate           │
│  • Receives historical data                             │
│  • Calculates annual_demand                            │
│  • Computes EOQ metrics                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  React Dashboard                                        │
│  Displays EOQ results                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 SQL Query for Node.js Backend

### Get Historical Demand Data

```sql
SELECT 
  period_date,
  quantity_sold,
  revenue,
  avg_price
FROM product_demand_history
WHERE product_id = $1 
  AND branch_id = $2
  AND period_date >= $3  -- Optional: start date
  AND period_date <= $4  -- Optional: end date
ORDER BY period_date ASC;
```

### Calculate Annual Demand (SQL)

```sql
-- Option 1: Calculate from all available data
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
WHERE product_id = $1 AND branch_id = $2
GROUP BY product_id, branch_id;
```

### Get Recent Demand for Forecasting

```sql
-- Get last 12 months of data for forecasting
SELECT 
  period_date,
  quantity_sold
FROM product_demand_history
WHERE product_id = $1 
  AND branch_id = $2
  AND period_date >= CURRENT_DATE - INTERVAL '12 months'
ORDER BY period_date ASC;
```

---

## 🔌 New API Endpoint

### Python Endpoint: `/api/analytics/demand-history/calculate`

**Purpose**: Calculate EOQ from database-stored demand history

**Method**: `POST`

**Request Body**:
```json
{
  "product_id": 1,
  "branch_id": 1,
  "historical_data": [
    {
      "period_date": "2024-01-01",
      "quantity_sold": 45
    },
    {
      "period_date": "2024-01-02",
      "quantity_sold": 52
    }
    // ... more periods
  ],
  "holding_cost": 50,
  "ordering_cost": 100,
  "unit_cost": 25,
  "lead_time_days": 7,
  "confidence_level": 0.95
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_quantity": 14580,
      "days_of_data": 270,
      "average_daily": 54.0,
      "annual_demand": 19710.0,
      "date_range": {
        "start": "2024-01-01",
        "end": "2024-09-30"
      }
    },
    "eoq": {
      "eoq_quantity": 280.5,
      "reorder_point": 60.2,
      "safety_stock": 15.8,
      "annual_holding_cost": 7012.5,
      "annual_ordering_cost": 3506.25,
      "total_annual_cost": 10518.75
    }
  }
}
```

---

## 💻 Node.js Integration Example

### Route Handler in `backend/Server/routes/analytics.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// New endpoint: Get demand history and calculate EOQ
router.post("/demand-history/calculate", async (req, res) => {
  try {
    const { product_id, branch_id, start_date, end_date, ...eoqParams } = req.body;

    // Query product_demand_history from Supabase
    let query = supabase
      .from('product_demand_history')
      .select('period_date, quantity_sold, revenue, avg_price')
      .eq('product_id', product_id)
      .eq('branch_id', branch_id)
      .order('period_date', { ascending: true });

    if (start_date) {
      query = query.gte('period_date', start_date);
    }
    if (end_date) {
      query = query.lte('period_date', end_date);
    }

    const { data: demandHistory, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch demand history',
        details: error.message
      });
    }

    if (!demandHistory || demandHistory.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No demand history found for this product and branch'
      });
    }

    // Format data for Python service
    const historicalData = demandHistory.map(record => ({
      period_date: record.period_date,
      quantity_sold: record.quantity_sold
    }));

    // Call Python analytics service
    const response = await axios.post(
      `${ANALYTICS_URL}/demand-history/calculate`,
      {
        product_id,
        branch_id,
        historical_data: historicalData,
        ...eoqParams
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error calculating EOQ from demand history:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || "Failed to calculate EOQ"
    });
  }
});
```

---

## 📊 Alternative: Direct Calculation in Node.js

If you prefer to calculate annual demand in Node.js before sending to Python:

```javascript
router.post("/demand-history/calculate", async (req, res) => {
  try {
    const { product_id, branch_id, ...eoqParams } = req.body;

    // Query demand history
    const { data: demandHistory, error } = await supabase
      .from('product_demand_history')
      .select('period_date, quantity_sold')
      .eq('product_id', product_id)
      .eq('branch_id', branch_id)
      .order('period_date', { ascending: true });

    if (error || !demandHistory || demandHistory.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No demand history found'
      });
    }

    // Calculate annual demand
    const totalQuantity = demandHistory.reduce((sum, r) => sum + r.quantity_sold, 0);
    const firstDate = new Date(demandHistory[0].period_date);
    const lastDate = new Date(demandHistory[demandHistory.length - 1].period_date);
    const daysOfData = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24) + 1);
    const annualDemand = (totalQuantity / daysOfData) * 365;

    // Call Python with calculated annual_demand
    const response = await axios.post(
      `${ANALYTICS_URL}/eoq/calculate`,
      {
        product_id,
        branch_id,
        annual_demand,
        ...eoqParams
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to calculate EOQ"
    });
  }
});
```

---

## 🔄 Migration from CSV to Database

### Step 1: Import CSV Data to Database

```javascript
// One-time script to import CSV data
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function importCSVToDatabase(csvFilePath, productId, branchId) {
  const records = [];
  
  fs.createReadStream(csvFilePath)
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
      // Insert in batches of 100
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase
          .from('product_demand_history')
          .insert(batch);
        
        if (error) {
          console.error(`Error inserting batch ${i}:`, error);
        } else {
          console.log(`Inserted batch ${i} to ${i + batch.length}`);
        }
      }
    });
}
```

### Step 2: Update Frontend to Use Database

Instead of file upload, the frontend should:
1. Select product and branch from dropdowns
2. Optionally select date range
3. Call `/api/analytics/demand-history/calculate`
4. Display results

---

## 📋 Data Requirements

### Minimum Data for EOQ Calculation

- **At least 30 days** of historical data recommended
- **At least 90 days** for accurate annual demand projection
- **At least 1 year** for seasonal pattern detection

### Data Quality Checks

```sql
-- Check data completeness
SELECT 
  product_id,
  branch_id,
  COUNT(*) as total_records,
  COUNT(DISTINCT period_date) as unique_dates,
  MIN(period_date) as first_date,
  MAX(period_date) as last_date,
  SUM(quantity_sold) as total_quantity,
  AVG(quantity_sold) as avg_daily_quantity
FROM product_demand_history
WHERE product_id = $1 AND branch_id = $2
GROUP BY product_id, branch_id;
```

---

## 🎯 Benefits of Using Database

✅ **Real-time Data**: Always uses latest sales data  
✅ **Historical Tracking**: Maintains complete demand history  
✅ **Multi-Product Support**: Can calculate EOQ for all products  
✅ **Audit Trail**: All calculations linked to source data  
✅ **Performance**: Indexed queries faster than file processing  
✅ **Scalability**: Handles large datasets efficiently  

---

## 🔍 Related Tables

### `sales` Table (Alternative Source)

If you need transaction-level data instead of aggregated:

```sql
-- Aggregate sales transactions to daily demand
SELECT 
  transaction_date as period_date,
  SUM(quantity_sold) as quantity_sold,
  SUM(total_amount) as revenue,
  AVG(unit_price) as avg_price
FROM sales
WHERE product_id = $1 
  AND branch_id = $2
  AND transaction_date >= $3
  AND transaction_date <= $4
GROUP BY transaction_date
ORDER BY transaction_date;
```

**Note**: The `product_demand_history` table is preferred because:
- It's already aggregated (better performance)
- Designed specifically for demand analysis
- Can be populated from `sales` table via scheduled jobs

---

## 📚 Next Steps

1. ✅ Create new endpoint in Python: `/api/analytics/demand-history/calculate`
2. ✅ Add route in Node.js: `/api/analytics/demand-history/calculate`
3. ✅ Update React dashboard to use database instead of file upload
4. ✅ Create data import script for existing CSV files
5. ✅ Set up scheduled job to populate `product_demand_history` from `sales` table

---

**Status**: 📋 Ready for Implementation  
**Priority**: High  
**Dependencies**: Supabase client in Node.js backend

