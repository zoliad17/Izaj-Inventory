# EOQ Analytics Backend Setup

## Overview

This Python-based analytics backend provides Economic Order Quantity (EOQ) calculations, demand forecasting, and inventory analytics for the Izaj-Inventory system.

## Directory Structure

```
analytics/
├── __init__.py              # Package initialization
├── app.py                   # Flask application factory
├── routes.py                # API endpoints
├── eoq_calculator.py        # EOQ algorithm and calculations
├── requirements.txt         # Python dependencies
└── utils/                   # Utility modules (future expansion)
```

## Installation

### 1. Prerequisites

- Python 3.9+
- pip (Python package manager)

### 2. Install Dependencies

```bash
cd analytics
pip install -r requirements.txt
```

### 3. Environment Setup

Create a `.env` file in the analytics directory:

```
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001
```

## Running the Analytics Service

### Development Mode

```bash
python -m flask --app analytics.app run --port 5001
```

### Production Mode (using Gunicorn)

```bash
gunicorn --bind 0.0.0.0:5001 --workers 4 'analytics.app:create_app()'
```

### From Project Root (Concurrent Execution)

```bash
npm run analytics-dev
```

## API Endpoints

### EOQ Calculation

**POST** `/api/analytics/eoq/calculate`

Calculate EOQ and related metrics.

**Request Body:**

```json
{
  "product_id": 1,
  "branch_id": 1,
  "annual_demand": 1200,
  "holding_cost": 50,
  "ordering_cost": 100,
  "unit_cost": 25,
  "lead_time_days": 7,
  "confidence_level": 0.95
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "eoq_quantity": 98.39,
    "reorder_point": 52.42,
    "safety_stock": 24.56,
    "annual_holding_cost": 2459.75,
    "annual_ordering_cost": 1225.0,
    "total_annual_cost": 3684.75,
    "max_stock_level": 150.81,
    "min_stock_level": 24.56,
    "average_inventory": 73.75
  }
}
```

### Demand Forecasting

**POST** `/api/analytics/forecast/demand`

Forecast future demand using exponential smoothing or moving average.

**Request Body:**

```json
{
  "product_id": 1,
  "branch_id": 1,
  "historical_data": [
    100, 120, 110, 140, 130, 150, 160, 155, 170, 180, 175, 190
  ],
  "periods_ahead": 3,
  "method": "exponential"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "forecasts": [165.23, 172.45, 179.67],
    "trend": 7.22,
    "base_forecast": 165.23,
    "confidence_intervals": {
      "lower": [145.67, 152.89, 160.11],
      "upper": [184.79, 191.01, 198.23]
    }
  }
}
```

### Inventory Health Analysis

**POST** `/api/analytics/inventory/health`

Analyze current inventory health and receive recommendations.

**Request Body:**

```json
{
  "product_id": 1,
  "branch_id": 1,
  "current_stock": 150,
  "daily_usage": 5,
  "reorder_point": 52.42,
  "safety_stock": 24.56,
  "eoq": 98.39
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "NORMAL",
    "risk_level": "LOW",
    "days_of_stock": 30.0,
    "stockout_risk_percentage": 12.5,
    "recommendation": "Maintain current stock. Next order recommended when stock reaches 52"
  }
}
```

### ABC Analysis

**POST** `/api/analytics/abc-analysis`

Classify products by value for inventory management.

**Request Body:**

```json
{
  "products": [
    { "id": 1, "annual_demand": 1200, "unit_cost": 25 },
    { "id": 2, "annual_demand": 800, "unit_cost": 50 },
    { "id": 3, "annual_demand": 200, "unit_cost": 100 }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "A_items": [3, 2],
    "B_items": [1],
    "C_items": []
  }
}
```

### Sales Data Import

**POST** `/api/analytics/sales-data/import`

Import and analyze sales data from CSV/Excel files.

**Request Body (multipart/form-data):**

- `file`: CSV or Excel file with columns: quantity, date

**Response:**

```json
{
  "success": true,
  "message": "Imported 365 sales records",
  "metrics": {
    "total_quantity": 43800,
    "average_daily": 120.0,
    "annual_demand": 43800,
    "days_of_data": 365,
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

### Calculate Holding Cost

**POST** `/api/analytics/calculate-holding-cost`

Calculate annual holding cost from unit cost.

**Request Body:**

```json
{
  "unit_cost": 100,
  "holding_cost_percentage": 0.25
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "unit_cost": 100,
    "holding_cost_percentage": 0.25,
    "annual_holding_cost": 25
  }
}
```

### Health Check

**GET** `/api/analytics/health`

Check if analytics service is running.

**Response:**

```json
{
  "status": "ok",
  "service": "analytics"
}
```

## Integration with Node.js Backend

The Node.js server at `backend/Server/server.js` proxies analytics requests to the Python service.

### To integrate:

1. Add the analytics route file to your Node.js server:

```javascript
const analyticsRoutes = require("./routes/analytics");
app.use("/api/analytics", analyticsRoutes);
```

2. Ensure the `axios` package is installed:

```bash
npm install axios
```

3. Set environment variable for analytics service URL:

```
ANALYTICS_URL=http://localhost:5001/api/analytics
```

## Algorithm Details

### Economic Order Quantity (EOQ)

Formula: √(2 × D × S / H)

- D = Annual demand
- S = Ordering cost per order
- H = Holding cost per unit per year

**Safety Stock:** Z × σ × √L

- Z = Z-score for confidence level
- σ = Standard deviation of demand
- L = Lead time in days

**Reorder Point:** (Average daily demand × Lead time) + Safety stock

### Demand Forecasting

- **Exponential Smoothing:** Uses α parameter (default 0.3) to weight recent data
- **Moving Average:** Calculates average over specified periods (default 3)
- **Confidence Intervals:** Based on standard error of historical data

### ABC Analysis

Pareto analysis to classify inventory:

- **A Items:** Top 80% of value (frequent monitoring)
- **B Items:** Next 15% of value (regular monitoring)
- **C Items:** Remaining 5% of value (periodic monitoring)

## Performance Optimization

### Batch Processing

- For large imports, data is processed in batches of 10 records
- Prevents overwhelming the database

### Caching

- Mock database stores results for quick access
- In production, integrate with Supabase for persistence

### Rate Limiting

- Implemented on Node.js proxy routes
- Prevents abuse of expensive calculations

## Database Tables (Required)

Ensure these tables exist in your Supabase database:

```sql
CREATE TABLE product_demand_history (
  id BIGINT PRIMARY KEY,
  product_id INTEGER,
  branch_id INTEGER,
  period_date DATE,
  quantity_sold BIGINT,
  revenue REAL,
  avg_price REAL,
  created_at TIMESTAMP
);

CREATE TABLE eoq_calculations (
  id BIGINT PRIMARY KEY,
  product_id INTEGER,
  branch_id INTEGER,
  eoq_quantity REAL,
  reorder_point REAL,
  safety_stock REAL,
  annual_demand REAL,
  valid_until TIMESTAMP,
  calculated_at TIMESTAMP
);

CREATE TABLE sales_forecast (
  id BIGINT PRIMARY KEY,
  product_id INTEGER,
  branch_id INTEGER,
  forecast_month DATE,
  forecasted_quantity REAL,
  confidence_interval_lower REAL,
  confidence_interval_upper REAL,
  created_at TIMESTAMP
);

CREATE TABLE inventory_analytics (
  id BIGINT PRIMARY KEY,
  product_id INTEGER,
  branch_id INTEGER,
  analysis_date DATE,
  current_stock BIGINT,
  stockout_risk_percentage REAL,
  recommendation TEXT,
  created_at TIMESTAMP
);
```

## Troubleshooting

### Service Not Starting

- Check Python version: `python --version` (requires 3.9+)
- Verify all dependencies: `pip list`
- Check port 5001 is not in use: `netstat -an | grep 5001`

### Import Errors

- Reinstall requirements: `pip install --upgrade -r requirements.txt`
- Clear pip cache: `pip cache purge`

### Calculation Issues

- Verify input data types (numbers should be float/int, not strings)
- Check for zero values in required fields (annual_demand, holding_cost, etc.)
- Review confidence interval calculations for data consistency

## Future Enhancements

- [ ] Integrate with Supabase for persistent storage
- [ ] Add seasonal decomposition for pattern detection
- [ ] Implement machine learning for demand forecasting
- [ ] Add supplier analytics and optimization
- [ ] Create batch calculation jobs for all products
- [ ] Add export functionality (PDF, Excel reports)
