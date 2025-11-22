# 🚀 How to Run Both Servers - Complete Guide

This guide explains how to run the **Node.js backend server** and the **Python analytics server** for the Izaj-Inventory system.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** (v18 or higher) installed
- ✅ **Python 3.9+** installed
- ✅ **npm** or **bun** package manager
- ✅ **pip** (Python package manager)
- ✅ All dependencies installed (see below)

---

## 🔧 Initial Setup (One-Time)

### 1. Install Node.js Backend Dependencies

```bash
# Navigate to backend directory
cd backend/Server

# Using npm
npm install

# OR using bun (faster)
bun install
```

### 2. Install Python Analytics Dependencies

```bash
# Navigate to analytics directory
cd analytics

# Install Python packages
pip install -r requirements.txt
```

**Note:** If you're on Windows and have multiple Python versions, you might need:
```bash
python -m pip install -r requirements.txt
# OR
pip3 install -r requirements.txt
```

### 3. Environment Configuration

Make sure you have a `.env` file in the `backend/Server` directory with your Supabase credentials and other settings.

---

## 🎯 Running the Servers

You have **three options** for running the servers:

### Option 1: Run Both Servers Separately (Recommended for Development)

This gives you separate terminal windows for each server, making it easier to see logs and debug.

#### Terminal 1: Node.js Backend Server

```bash
# Navigate to backend directory
cd backend/Server

# Start the server
npm run dev
# OR
node server.js
```

**Expected Output:**
```
🚀 Server running on port 5000
```

The Node.js server will run on **http://localhost:5000**

#### Terminal 2: Python Analytics Server

```bash
# Navigate to analytics directory
cd analytics

# Start the Flask server
python -m flask --app analytics.app run --port 5001
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5001
 * Debug mode: off
```

The Python analytics server will run on **http://localhost:5001**

---

### Option 2: Run Both Servers Together (Using Concurrently)

If you want to run both servers in a single terminal window:

#### Step 1: Add Scripts to `backend/Server/package.json`

Add these scripts to your `backend/Server/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "analytics-dev": "cd ../../analytics && python -m flask --app analytics.app run --port 5001",
    "dev-full": "concurrently \"npm run dev\" \"npm run analytics-dev\""
  }
}
```

#### Step 2: Install Concurrently (if not already installed)

```bash
cd backend/Server
npm install --save-dev concurrently
```

#### Step 3: Run Both Servers

```bash
cd backend/Server
npm run dev-full
```

This will start both servers in the same terminal with colored output.

---

### Option 3: Run from Project Root (Frontend + Backend + Analytics)

To run everything together (Frontend, Node.js Backend, and Python Analytics):

#### Step 1: Add Scripts to Root `package.json`

Add these scripts to your root `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "start:backend": "cd backend/Server && npm run dev",
    "start:analytics": "cd analytics && python -m flask --app analytics.app run --port 5001",
    "dev:full": "concurrently -n FRONTEND,BACKEND,ANALYTICS -c green,blue,yellow \"npm run dev\" \"npm run start:backend\" \"npm run start:analytics\""
  }
}
```

#### Step 2: Run Everything

```bash
# From project root
npm run dev:full
```

---

## ✅ Verifying the Servers are Running

### Test Node.js Backend (Port 5000)

```bash
# Health check (if you have a health endpoint)
curl http://localhost:5000/api/health

# Or test login endpoint
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Test Python Analytics Server (Port 5001)

```bash
# Health check
curl http://localhost:5001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "analytics"
}
```

### Test EOQ Calculation Endpoint

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

---

## 🎨 Running the Frontend

Once both backend servers are running, start the frontend:

### Option A: Using Tauri (Desktop App)

```bash
# From project root
npm run tauri dev
```

### Option B: Using Vite Dev Server (Web Browser)

```bash
# From project root
npm run dev
```

The frontend will typically run on **http://localhost:5173** (Vite) or **http://localhost:1420** (Tauri).

---

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────┐
│   React Frontend (Port 5173/1420)       │
│   - Tauri Desktop App                    │
│   - Vite Dev Server                      │
└──────────────┬──────────────────────────┘
               │
               │ HTTP Requests
               │
┌──────────────▼──────────────────────────┐
│   Node.js Backend (Port 5000)           │
│   - Express Server                       │
│   - API Routes                           │
│   - Authentication                       │
│   - Database (Supabase)                  │
└──────────────┬──────────────────────────┘
               │
               │ Proxy Requests
               │
┌──────────────▼──────────────────────────┐
│   Python Analytics (Port 5001)          │
│   - Flask Server                         │
│   - EOQ Calculations                     │
│   - Demand Forecasting                   │
│   - Inventory Analytics                  │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Port 5000 Already in Use?

**Solution:** Change the port in `backend/Server/server.js` or kill the process using the port:

```bash
# Windows (PowerShell)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### Port 5001 Already in Use?

**Solution:** Use a different port for the Python server:

```bash
python -m flask --app analytics.app run --port 5002
```

Then update the `ANALYTICS_URL` in `backend/Server/routes/analytics.js` to point to port 5002.

### Python Module Not Found?

**Solution:** Make sure you're in a virtual environment and dependencies are installed:

```bash
cd analytics
pip install -r requirements.txt
```

### Node.js Server Not Starting?

**Solution:** Check if dependencies are installed:

```bash
cd backend/Server
npm install
```

### "Cannot find module" Errors?

**Solution:** Make sure you're running commands from the correct directory:

- Node.js server: `cd backend/Server` then `npm run dev`
- Python server: `cd analytics` then `python -m flask --app analytics.app run --port 5001`

---

## 🎯 Quick Start Commands Summary

### Development (Recommended)

**Terminal 1:**
```bash
cd backend/Server
npm run dev
```

**Terminal 2:**
```bash
cd analytics
python -m flask --app analytics.app run --port 5001
```

**Terminal 3:**
```bash
npm run dev  # or npm run tauri dev
```

### Production

**Node.js Backend:**
```bash
cd backend/Server
npm start
```

**Python Analytics:**
```bash
cd analytics
gunicorn --bind 0.0.0.0:5001 --workers 4 'analytics.app:create_app()'
```

---

## 📝 Important Notes

1. **Order Matters:** Start the Python analytics server **before** using the analytics features in the frontend.

2. **CORS:** The Python server has CORS enabled, so it should accept requests from the Node.js backend.

3. **Environment Variables:** Make sure your `.env` file in `backend/Server` has the correct `ANALYTICS_URL` pointing to `http://localhost:5001`.

4. **Hot Reload:**
   - Node.js: Uses `nodemon` for auto-restart on file changes
   - Python: Flask's debug mode auto-reloads (default in development)

5. **Logs:** Check both terminal windows for error messages if something isn't working.

---

## ✅ Verification Checklist

Before using the analytics features, verify:

- [ ] Node.js server is running on port 5000
- [ ] Python analytics server is running on port 5001
- [ ] Health check endpoint responds: `curl http://localhost:5001/api/health`
- [ ] Frontend can connect to backend (check browser console)
- [ ] No CORS errors in browser console
- [ ] Analytics dashboard loads at `http://localhost:5173/analytics`

---

## 🎉 You're All Set!

Once both servers are running, you can:

1. Access the frontend at `http://localhost:5173`
2. Navigate to `/analytics` to use the EOQ Analytics Dashboard
3. Upload CSV files for sales data analysis
4. Calculate EOQ, demand forecasts, and inventory health metrics

**Happy coding! 🚀**

