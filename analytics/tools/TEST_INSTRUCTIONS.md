# Testing the Excel Import

## Step 1: Start the Analytics Service

Open a terminal and run:

```bash
cd analytics
pixi run python app.py
```

Or if using npm from project root:

```bash
npm run analytics-dev
```

The service should start on `http://localhost:5001`

## Step 2: Run the Test Script

In another terminal:

```bash
cd analytics/tools
pixi run python test_import.py
```

## Step 3: Verify Results

The test script will:

1. Upload `test_sales_new.xlsx` to the import endpoint
2. Show import metrics (total quantity, date range, etc.)
3. Display top products from the import response
4. Query the top products endpoint to verify data was saved to database

## Expected Results

After importing `test_sales_new.xlsx`, you should see:

- **Total quantity:** 125 units
- **Date range:** 2025-12-17 to 2025-12-19
- **Top Products:**
  1. Product 386: 47 units
  2. Product 402: 43 units
  3. Product 409: 18 units
  4. Product 412: 12 units
  5. Product 394: 5 units

## Manual Testing via Frontend

You can also test by:

1. Opening the Analytics Dashboard in your frontend
2. Using the "Import Sales Data" feature
3. Uploading `analytics/tools/test_sales_new.xlsx`
4. Checking if the top products update dynamically

## Troubleshooting

- **Connection Error:** Make sure the analytics service is running on port 5001
- **Import Fails:** Check server logs for detailed error messages
- **No Top Products:** Verify the dates in the Excel file are recent (within last 30 days)
