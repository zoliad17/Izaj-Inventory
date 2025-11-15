# System Architecture - EOQ Analytics Integration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                   (EOQAnalyticsDashboard.tsx)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Input Controls (Product ID, Branch ID)               │  │
│  │ • Real-time Charts (Recharts)                          │  │
│  │ • Status Indicators & Alerts                           │  │
│  │ • Forecast Visualization                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Express Server                        │
│                (backend/Server/server.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Authentication & Authorization                        │  │
│  │ • Database Proxy (Supabase)                            │  │
│  │ • Rate Limiting & Security                             │  │
│  │ • Analytics Route Proxy                                │  │
│  │   (backend/Server/routes/analytics.js)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/REST (Port 5001)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Python Flask Analytics Service                     │
│                  (analytics/app.py)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Core Algorithms (analytics/eoq_calculator.py):          │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ EOQCalculator                                    │   │  │
│  │  │ • Calculate EOQ Quantity                        │   │  │
│  │  │ • Calculate Safety Stock                        │   │  │
│  │  │ • Calculate Reorder Point                       │   │  │
│  │  │ • Calculate Annual Costs                        │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ DemandForecaster                                 │   │  │
│  │  │ • Exponential Smoothing                         │   │  │
│  │  │ • Simple Moving Average                         │   │  │
│  │  │ • Seasonal Decomposition                        │   │  │
│  │  │ • Confidence Intervals                          │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ InventoryAnalytics                               │   │  │
│  │  │ • Inventory Health Check                         │   │  │
│  │  │ • ABC Analysis                                   │   │  │
│  │  │ • Turnover Ratio Calculation                     │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  │ API Routes (analytics/routes.py):                       │  │
│  │ • POST /api/analytics/eoq/calculate                     │  │
│  │ • POST /api/analytics/forecast/demand                   │  │
│  │ • POST /api/analytics/inventory/health                  │  │
│  │ • POST /api/analytics/abc-analysis                      │  │
│  │ • POST /api/analytics/sales-data/import                 │  │
│  │ • POST /api/analytics/calculate-holding-cost            │  │
│  │ • POST /api/analytics/calculate-ordering-cost           │  │
│  │ • GET /api/analytics/eoq/recommendations                │  │
│  │ • GET /api/analytics/health                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   NumPy      │    │   SciPy      │    │   Pandas     │
│  (Math Ops)  │    │   (Signals)  │    │ (Data Frame) │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Mock Database (In-Memory)                     │
│  • eoq_results {}                                               │
│  • forecasts {}                                                 │
│  • inventory_analysis {}                                        │
│                                                                 │
│ Future: Integrate with Supabase for Persistence                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### EOQ Calculation Flow

```
React Dashboard Input
       │
       ▼
POST /api/analytics/eoq/calculate
       │
       ▼
Node.js Proxy Route
       │
       ▼
Python Flask Handler
       │
       ▼
EOQCalculator.calculate_eoq()
       │
       ├─ Validate Inputs
       ├─ Calculate EOQ Quantity
       ├─ Calculate Safety Stock
       ├─ Calculate Reorder Point
       ├─ Calculate Annual Costs
       └─ Store in Mock Database
       │
       ▼
JSON Response
       │
       ▼
React Dashboard Charts Update
```

### Demand Forecast Flow

```
Historical Sales Data (from BitPOS)
       │
       ▼
POST /api/analytics/sales-data/import
       │
       ▼
Pandas DataFrame Processing
       │
       ▼
DemandForecaster Methods:
├─ simple_moving_average()
├─ exponential_smoothing()
└─ seasonal_decomposition()
       │
       ├─ Generate Forecasts
       ├─ Calculate Confidence Intervals
       └─ Store Results
       │
       ▼
JSON Response with Forecasts
       │
       ▼
React LineChart Visualization
```

## File Organization

```
c:\Users\monfe\Documents\Izaj-Inventory\
│
├── analytics/                          # Python Analytics Service
│   ├── __init__.py
│   ├── app.py                         # Flask App Factory
│   ├── routes.py                      # API Endpoints
│   ├── eoq_calculator.py              # Core Algorithms
│   ├── requirements.txt                # Python Dependencies
│   ├── README.md                       # Full Documentation
│   └── QUICKSTART.md                  # Quick Start Guide
│
├── backend/
│   └── Server/
│       ├── server.js                  # Node.js Main Server
│       └── routes/
│           └── analytics.js           # Proxy Routes to Python
│
├── src/
│   └── components/
│       └── Analytics/
│           └── EOQAnalyticsDashboard.tsx  # React Dashboard
│
├── schema.sql                          # Database Tables
├── ANALYTICS_IMPLEMENTATION.md         # Implementation Summary
└── PACKAGE_JSON_UPDATES.md            # NPM Script Updates
```

## Technology Stack

### Frontend

- **React** - UI Framework
- **TypeScript** - Type Safety
- **Recharts** - Data Visualization
- **Tailwind CSS** - Styling

### Backend (Node.js)

- **Express** - HTTP Server
- **Axios** - HTTP Client
- **Supabase** - Database

### Analytics Engine (Python)

- **Flask** - Web Framework
- **NumPy** - Numerical Computing
- **SciPy** - Scientific Computing
- **Pandas** - Data Analysis

### Database

- **Supabase (PostgreSQL)** - Main Database
- **Mock Database** - In-Memory for Analytics Cache

## Deployment Architecture

```
Production Environment
│
├─ React Frontend (Vercel/Netlify)
│  │
│  └─ https://yourdomain.com
│
├─ Node.js Server (Render/Railway)
│  │
│  ├─ Port 5000 (HTTP)
│  └─ Supabase Client
│
├─ Python Analytics Service (Render/Railway)
│  │
│  ├─ Port 5001 (HTTP)
│  ├─ Gunicorn (4 workers)
│  └─ Mock Database (Stateless)
│
└─ Supabase Database (PostgreSQL)
   │
   ├─ Tables for EOQ data
   └─ Audit Logs
```

## Scalability Considerations

### Horizontal Scaling

- **Analytics Service** - Stateless, can run multiple instances
- **Load Balancer** - Distribute requests across services

### Optimization

- Batch processing for large imports
- Caching calculations for repeated requests
- Async job processing for heavy computations

### Future Enhancements

- Queue system (Redis) for background jobs
- Database indexing for faster queries
- Materialized views for common analyses
- WebSocket for real-time updates

---

**Architecture Version:** 1.0
**Last Updated:** November 14, 2025
