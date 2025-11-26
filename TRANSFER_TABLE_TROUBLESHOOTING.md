# Troubleshooting Guide - Transferred Products Table

## ✅ FIXED - Issue & Solution

### The Problem

The transferred products table wasn't showing data because the backend endpoint was looking for a `product_transfers` table that might not have records, or wasn't properly tracking transferred quantities.

### The Solution

Updated the backend `/api/transfers/:branchId` endpoint to:

- ✅ Fetch transfer data directly from `audit_logs` table with `action = "INVENTORY_TRANSFER"`
- ✅ Filter for transfers destined to the requesting branch (`requester_branch_id` in metadata)
- ✅ Get old quantities from audit log `old_values` or `metadata`
- ✅ Get current product quantity from `centralized_product` table
- ✅ Calculate quantity changes (Added/Deducted)
- ✅ Return complete transfer information with all fields

## What Was Changed

### Backend Changes (`/api/transfers/:branchId`)

**File:** `backend/Server/server.js` (lines ~1945-2070)

**Changes:**

- Queries `audit_logs` table for `INVENTORY_TRANSFER` actions instead of `product_transfers`
- Extracts destination branch ID from `metadata.requester_branch_id`
- Retrieves old quantity from audit log data
- Gets current quantity from `centralized_product` table
- Calculates change type (Added/Deducted) based on quantity difference

### Frontend Changes (Already simplified)

**File:** `src/components/Stock_Components/OptimizedAll_Stock.tsx`

- Removed async/await loops
- Uses backend data directly
- Added console logging for debugging

## How to Test Now

1. **Restart the backend server**

   ```bash
   cd backend/Server
   npm start
   # or: node server.js
   ```

2. **Restart the frontend**

   ```bash
   npm run dev
   # or: bun dev
   ```

3. **Verify in Browser Console**

   - Open DevTools (F12)
   - Go to Console tab
   - You should see:
     - "Transformed transfers: X, [...]" ✅ (shows number of transfers found)
     - No error messages

4. **Check Backend Logs**
   - Should show:
     - "Fetching transfers for branch X"
     - "Found X INVENTORY_TRANSFER audit logs"
     - "Returning X transformed items"

## Expected Behavior Now

When a branch has approved transfer requests:

1. **Table will populate automatically**

   - No need to manually mark transfers as "arrived"
   - Fetches from audit trail of approved transfers

2. **Data displayed:**

   - Product Name
   - Category
   - Price
   - **Old Quantity** (before transfer)
   - **New Quantity** (after transfer)
   - **Change** (green "Added X units" or orange "Deducted X units")
   - From Branch (source)
   - Requester name
   - Transfer date/time

3. **Summary footer shows:**
   - Total products transferred
   - Total units added (sum of all additions)
   - Total units deducted (sum of all deductions)

## If Still No Data Shows

### Step 1: Verify transfers exist in audit_logs

```sql
SELECT * FROM audit_logs
WHERE action = 'INVENTORY_TRANSFER'
LIMIT 10;
```

Should return transfer records. If empty, no transfers have been approved yet.

### Step 2: Check your branch ID

```sql
SELECT * FROM audit_logs
WHERE action = 'INVENTORY_TRANSFER'
AND metadata->>'requester_branch_id' = '1';
-- Replace '1' with your actual branch ID
```

### Step 3: Test the API directly

```bash
curl http://localhost:5000/api/transfers/1
# Replace 1 with your branch ID
```

Should return JSON array with transfer data.

### Step 4: Check Network in DevTools

- Open DevTools Network tab
- Refresh page
- Look for `/api/transfers/X` request
- Check response - should contain transfer records with these fields:
  - `old_quantity`
  - `new_quantity`
  - `quantity_change`
  - `change_type`
  - `product`
  - `transferred_from`
  - `requester_name`
  - `transferred_at`

## How Transfer Data Flows

```
1. Branch A makes INVENTORY_TRANSFER request
2. Branch B (admin) approves request
3. Audit log created with INVENTORY_TRANSFER action
4. Product quantities updated in centralized_product
5. Frontend queries /api/transfers/branch_id
6. Backend fetches audit logs + product details
7. Table populates with transfer information
```

## Key Fields in Response

Each transfer record should contain:

```json
{
  "id": 123,
  "product_id": 5,
  "product": {
    "product_name": "LED Bulb 10W",
    "category_name": "Lighting",
    "price": 299.99
  },
  "quantity": 50,
  "old_quantity": 30,
  "new_quantity": 50,
  "quantity_change": 20,
  "change_type": "Added",
  "transferred_from": "Branch A",
  "transferred_at": "2025-11-26T10:30:00Z",
  "request_id": 123,
  "requester_name": "John Doe",
  "transfer_status": "Completed"
}
```

## Common Issues & Solutions

| Issue                      | Cause                        | Solution                                  |
| -------------------------- | ---------------------------- | ----------------------------------------- |
| No data in table           | No approved transfers        | Create a transfer request and approve it  |
| Old quantity shows 0       | Audit log missing old_values | Normal - backend shows 0 as fallback      |
| Quantities don't calculate | Wrong branch ID              | Check you're logged into correct branch   |
| 500 error in API           | Database issue               | Check Supabase connection in backend logs |
| Empty audit_logs           | Transfers not approved       | Follow request approval workflow          |

## Debugging Checklist

- [ ] Backend restarted after code changes
- [ ] Frontend restarted
- [ ] Correct branch ID being used
- [ ] At least one transfer has been approved
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] API endpoint returns data: `/api/transfers/X`
- [ ] Audit logs table has INVENTORY_TRANSFER records

## Need Help?

If table still shows no data after all steps:

1. Check browser console for errors
2. Check `/api/transfers/X` response in Network tab
3. Verify branch ID matches your login branch
4. Create a test transfer request and approve it
5. Restart both backend and frontend
6. Refresh browser page
