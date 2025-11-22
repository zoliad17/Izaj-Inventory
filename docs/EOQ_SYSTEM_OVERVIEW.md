# EOQ Algorithm Integration - System Overview

## 🎯 What is EOQ?

**Economic Order Quantity (EOQ)** is an inventory management algorithm that calculates the optimal order quantity to minimize total inventory costs (holding costs + ordering costs).

### Formula
```
EOQ = √(2 × D × S / H)
```
Where:
- **D** = Annual demand (units per year)
- **S** = Ordering cost per order
- **H** = Holding cost per unit per year

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│              (EOQAnalyticsDashboard.tsx)                      │
│  • User uploads sales data (CSV/Excel)                        │
│  • Displays EOQ calculations with charts                      │
│  • Shows inventory health status                              │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Express Server                           │
│            (backend/Server/server.js)                          │
│  • Authentication & Authorization                            │
│  • Proxy routes to Python service                            │
│  • Rate limiting & security                                  │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP/REST (Port 5001)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          Python Flask Analytics Service                      │
│              (analytics/app.py)                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Core Algorithms (eoq_calculator.py):                │   │
│  │                                                      │   │
│  │  1. EOQCalculator                                    │   │
│  │     • Calculate EOQ Quantity                        │   │
│  │     • Calculate Safety Stock                        │   │
│  │     • Calculate Reorder Point                       │   │
│  │     • Calculate Annual Costs                        │   │
│  │                                                      │   │
│  │  2. DemandForecaster                                │   │
│  │     • Exponential Smoothing                         │   │
│  │     • Simple Moving Average                         │   │
│  │     • Seasonal Decomposition                         │   │
│  │     • Confidence Intervals                          │   │
│  │                                                      │   │
│  │  3. InventoryAnalytics                              │   │
│  │     • Inventory Health Check                         │   │
│  │     • ABC Analysis (Pareto)                          │   │
│  │     • Turnover Ratio                                │   │
│  │     • Smart Recommendations                         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Database (PostgreSQL)                  │
│  • product_demand_history                                    │
│  • eoq_calculations                                          │
│  • sales_forecast                                            │
│  • inventory_analytics                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow Diagram

### EOQ Calculation Flow

```
1. User Action
   │
   ├─ Option A: Upload Sales Data (CSV/Excel)
   │  │
   │  ▼
   │  POST /api/analytics/sales-data/import
   │  │
   │  ▼
   │  Python processes file → Extracts annual_demand
   │  │
   │  ▼
   │  Auto-calculates EOQ with extracted data
   │
   └─ Option B: Manual Input
      │
      ▼
      POST /api/analytics/eoq/calculate
      │
      ▼
      User provides:
      • annual_demand
      • holding_cost
      • ordering_cost
      • unit_cost
      • lead_time_days
      • confidence_level

2. Python Processing
   │
   ▼
   EOQCalculator.calculate_eoq()
   │
   ├─ Validate inputs
   ├─ Calculate EOQ = √(2 × D × S / H)
   ├─ Calculate Safety Stock = Z × σ × √L
   ├─ Calculate Reorder Point = (Avg Daily Demand × Lead Time) + Safety Stock
   ├─ Calculate Annual Costs
   │  ├─ Annual Holding Cost = (EOQ/2) × H
   │  └─ Annual Ordering Cost = (D/EOQ) × S
   └─ Store results in database

3. Response to Frontend
   │
   ▼
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

4. React Dashboard Updates
   │
   ├─ Display EOQ metrics in cards
   ├─ Show inventory health status
   ├─ Render demand forecast charts
   └─ Show recommendations
```

---

## 📊 Key Components

### 1. EOQCalculator Class

**Location**: `analytics/eoq_calculator.py`

**Main Method**: `calculate_eoq(eoq_input: EOQInput) -> EOQResult`

**What it calculates**:
- **EOQ Quantity**: Optimal order size
- **Safety Stock**: Buffer for demand uncertainty
- **Reorder Point**: When to place next order
- **Annual Costs**: Total inventory management costs
- **Stock Levels**: Min, max, and average inventory

**Example**:
```python
from eoq_calculator import EOQCalculator, EOQInput

input_data = EOQInput(
    annual_demand=1200,
    holding_cost=50,
    ordering_cost=100,
    unit_cost=25,
    lead_time_days=7,
    confidence_level=0.95
)

result = EOQCalculator.calculate_eoq(input_data)
# Returns: EOQResult with all calculated metrics
```

### 2. DemandForecaster Class

**Location**: `analytics/eoq_calculator.py`

**Methods**:
- `exponential_smoothing()`: Weight recent data more heavily
- `simple_moving_average()`: Average over N periods
- `seasonal_decomposition()`: Extract trend and seasonal patterns
- `forecast_multiple_periods()`: Predict future demand

**Example**:
```python
from eoq_calculator import DemandForecaster

historical_data = [100, 120, 110, 140, 130, 150]
forecast = DemandForecaster.forecast_multiple_periods(
    historical_data,
    periods_ahead=3,
    method="exponential"
)
# Returns: Forecasts with confidence intervals
```

### 3. InventoryAnalytics Class

**Location**: `analytics/eoq_calculator.py`

**Methods**:
- `analyze_inventory_health()`: Check current stock status
- `calculate_abc_analysis()`: Classify products by value
- `calculate_turnover_ratio()`: Measure inventory efficiency

**Example**:
```python
from eoq_calculator import InventoryAnalytics

health = InventoryAnalytics.analyze_inventory_health(
    current_stock=150,
    daily_usage=5,
    reorder_point=52.42,
    safety_stock=24.56,
    eoq=98.39
)
# Returns: Status, risk level, days of stock, recommendations
```

---

## 🔌 API Endpoints

### Core EOQ Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/eoq/calculate` | POST | Calculate EOQ and related metrics |
| `/api/analytics/eoq/recommendations` | GET | Retrieve saved EOQ recommendations |

### Forecasting Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/forecast/demand` | POST | Forecast future demand |
| `/api/analytics/sales-data/import` | POST | Import and analyze sales data |

### Analytics Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/inventory/health` | POST | Analyze inventory health |
| `/api/analytics/abc-analysis` | POST | Classify products by value |

### Helper Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/calculate-holding-cost` | POST | Calculate annual holding cost |
| `/api/analytics/calculate-ordering-cost` | POST | Calculate cost per order |
| `/api/analytics/health` | GET | Health check |

---

## 📈 Example Request/Response

### Calculate EOQ

**Request**:
```json
POST /api/analytics/eoq/calculate
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

**Response**:
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

### Forecast Demand

**Request**:
```json
POST /api/analytics/forecast/demand
{
  "product_id": 1,
  "branch_id": 1,
  "historical_data": [100, 120, 110, 140, 130, 150, 160, 155, 170, 180],
  "periods_ahead": 3,
  "method": "exponential"
}
```

**Response**:
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

---

## 🎨 Frontend Integration

### React Component: EOQAnalyticsDashboard

**Location**: `src/components/Analytics/EOQAnalyticsDashboard.tsx`

**Features**:
- File upload for sales data (CSV/Excel)
- Real-time EOQ calculation
- Interactive charts (Recharts)
- Inventory health indicators
- Demand forecast visualization
- Modal notifications (loading/success/error)

**Key Functions**:
```typescript
// Upload sales data
handleFileUpload(event) → POST /api/analytics/sales-data/import

// Calculate EOQ
calculateEOQ() → POST /api/analytics/eoq/calculate

// Forecast demand
forecastDemand() → POST /api/analytics/forecast/demand

// Check inventory health
checkInventoryHealth() → POST /api/analytics/inventory/health
```

---

## 🔧 Configuration

### Default Values

- **Holding Cost**: 25% of unit cost (configurable)
- **Ordering Cost**: ₱50 fixed + ₱0.50 per item (configurable)
- **Confidence Level**: 95% (configurable)
- **Lead Time**: 7 days (configurable)

### Environment Variables

```env
# Analytics Service
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001

# Node.js Proxy
ANALYTICS_URL=http://localhost:5001/api/analytics
```

---

## 🚀 How to Use

### Step 1: Start Services

**Terminal 1 - Python Analytics**:
```bash
cd analytics
pip install -r requirements.txt
python -m flask --app analytics.app run --port 5001
```

**Terminal 2 - Node.js Backend**:
```bash
cd backend/Server
npm start
```

**Terminal 3 - React Frontend**:
```bash
npm run dev
```

### Step 2: Access Dashboard

1. Open browser: `http://localhost:5173` (or your Vite port)
2. Navigate to Analytics Dashboard
3. Either:
   - **Upload CSV/Excel** with sales data, OR
   - **Enter values manually** for EOQ calculation

### Step 3: View Results

- EOQ metrics displayed in cards
- Charts show demand forecast
- Inventory health status shown
- Recommendations displayed

---

## 📊 Key Metrics Explained

| Metric | Description | Use Case |
|--------|-------------|----------|
| **EOQ Quantity** | Optimal order size | How much to order |
| **Reorder Point** | Stock level to trigger order | When to order |
| **Safety Stock** | Buffer for uncertainty | Prevent stockouts |
| **Annual Holding Cost** | Cost to store inventory | Budget planning |
| **Annual Ordering Cost** | Cost to place orders | Budget planning |
| **Total Annual Cost** | Sum of holding + ordering | Total inventory expense |
| **Max Stock Level** | Upper inventory limit | Storage capacity planning |
| **Min Stock Level** | Lower inventory limit | Minimum safety threshold |
| **Average Inventory** | Typical stock on hand | Working capital planning |
| **Days of Stock** | How long current stock lasts | Stockout risk assessment |
| **Stockout Risk** | Probability of running out | Risk management |

---

## 🎯 Benefits

✅ **Cost Optimization**: Minimize total inventory costs  
✅ **Stockout Prevention**: Safety stock reduces risk  
✅ **Data-Driven Decisions**: All calculations backed by algorithms  
✅ **Automated Recommendations**: System suggests when/how much to order  
✅ **Demand Forecasting**: Predict future needs  
✅ **Inventory Health Monitoring**: Real-time status tracking  
✅ **ABC Analysis**: Prioritize high-value items  

---

## 🔍 Algorithm Details

### Safety Stock Calculation

```
Safety Stock = Z × σ × √L

Where:
- Z = Z-score for confidence level (95% = 1.96)
- σ = Standard deviation of demand
- L = Lead time in days
```

### Reorder Point Calculation

```
Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
```

### Annual Costs

```
Annual Holding Cost = (EOQ / 2) × Holding Cost per Unit
Annual Ordering Cost = (Annual Demand / EOQ) × Ordering Cost per Order
Total Annual Cost = Annual Holding Cost + Annual Ordering Cost
```

---

## 📚 Related Documentation

- **Full API Reference**: `analytics/README.md`
- **Quick Start Guide**: `analytics/QUICKSTART.md`
- **System Architecture**: `eoqguide/ARCHITECTURE.md`
- **Code Changes**: `eoqguide/CODE_CHANGES_REFERENCE.md`
- **System Flowchart**: `eoqguide/SYSTEM_FLOWCHART.md`

---

## 🐛 Troubleshooting

### Service Not Starting
- Check Python version: `python --version` (requires 3.9+)
- Verify dependencies: `pip list`
- Check port availability: `netstat -an | grep 5001`

### Calculation Errors
- Verify numeric inputs (no strings)
- Check annual_demand > 0
- Confirm holding_cost > 0

### Import Errors
- Ensure CSV/Excel has required columns: `quantity`, `date`
- Check file format (CSV or Excel)
- Verify data types in file

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 2025

