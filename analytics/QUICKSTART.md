# Python Analytics Backend - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Step 1: Install Python Dependencies

```bash
cd analytics
pip install -r requirements.txt
```

### Step 2: Run Analytics Service

```bash
# Development mode
python -m flask --app analytics.app run --port 5001

# Or from project root
npm run analytics-dev
```

### Step 3: Verify Service is Running

```bash
curl http://localhost:5001/api/health
```

Expected response:

```json
{ "status": "ok", "service": "analytics" }
```

## 📊 Quick Test

### Test EOQ Calculation

```bash
curl -X POST http://localhost:5001/api/analytics/eoq/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "branch_id": 1,
    "annual_demand": 1200,
    "holding_cost": 50,
    "ordering_cost": 100,
    "unit_cost": 25
  }'
```

### Test Demand Forecast

```bash
curl -X POST http://localhost:5001/api/analytics/forecast/demand \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "branch_id": 1,
    "historical_data": [100, 120, 110, 140, 130, 150, 160, 155, 170, 180, 175, 190],
    "periods_ahead": 3,
    "method": "exponential"
  }'
```

## 🔌 Integrating with React Frontend

Add the EOQ Dashboard component to your routes:

```tsx
import EOQAnalyticsDashboard from "./components/Analytics/EOQAnalyticsDashboard";

// In your router:
<Route path="/analytics/eoq" element={<EOQAnalyticsDashboard />} />;
```

## 📈 Key Features

✅ **EOQ Algorithm** - Calculate optimal order quantity
✅ **Safety Stock** - Determine minimum stock levels  
✅ **Demand Forecasting** - Predict future demand (3 methods)
✅ **Inventory Health** - Assess current inventory status
✅ **ABC Analysis** - Classify products by value
✅ **Sales Import** - Analyze CSV/Excel sales data

## 🔧 Configuration

### Holding Cost Calculation

Default: 25% of unit cost (typical for inventory management)
Customize in `/api/analytics/calculate-holding-cost`

### Ordering Cost

Default: 50 (fixed) + 0.5 per item (variable)
Customize based on your supplier agreements

### Confidence Level

Default: 95% (Z-score ≈ 1.96)
Adjust in EOQ calculation for different service levels

## 📁 File Structure

```
analytics/
├── app.py                    # Flask app factory
├── routes.py                 # All API endpoints
├── eoq_calculator.py         # Core algorithms
├── requirements.txt          # Dependencies
├── README.md                 # Full documentation
└── QUICKSTART.md            # This file
```

## 🐛 Common Issues

**Port 5001 already in use?**

```bash
# Change port in Flask run command
python -m flask --app analytics.app run --port 5002
```

**Module not found errors?**

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Calculation errors?**

- Ensure all numeric fields are numbers, not strings
- Check that annual_demand > 0
- Verify holding_cost > 0

## 📊 Next Steps

1. ✅ Run analytics service
2. ✅ Test endpoints with curl/Postman
3. ✅ Integrate React dashboard component
4. ✅ Connect to database for persistence
5. ✅ Set up scheduled EOQ calculations
6. ✅ Create charts and reports

## 🚀 Production Deployment

For production use:

```bash
gunicorn --bind 0.0.0.0:5001 --workers 4 'analytics.app:create_app()'
```

Set environment variable:

```
ANALYTICS_URL=https://your-domain/api/analytics
```

## 📝 Notes

- Current implementation uses in-memory database (mock)
- For persistence, connect to Supabase using provided SDK
- Service runs on port 5001 (configurable)
- All calculations are stateless and can be scaled horizontally

---

**Need help?** Check `analytics/README.md` for complete documentation.
