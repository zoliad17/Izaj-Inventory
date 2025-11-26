# Transfer Workflow Example: Lucena → San Pablo

## Complete Step-by-Step Flow

### **Scenario Setup**
- **Requester Branch**: Lucena (Branch ID: 2)
- **Requester Manager**: John (user_id: `abc-123`)
- **Source Branch**: San Pablo (Branch ID: 1)
- **Source Manager**: Maria (user_id: `xyz-789`)

---

## **STEP 1: Lucena Creates Request** 📝

### User Action
John (Lucena Manager) navigates to the request page and creates a new product request to San Pablo.

### Request Details
```json
{
  "request_from": "abc-123",  // John's user_id
  "request_to": "xyz-789",    // Maria's user_id
  "items": [
    {
      "product_id": 101,
      "product_name": "LED Bulb 10W",
      "quantity": 10,
      "price": 150.00
    },
    {
      "product_id": 202,
      "product_name": "Smart Switch",
      "quantity": 5,
      "price": 350.00
    }
  ],
  "notes": "Urgent request for upcoming project"
}
```

### System Actions
1. ✅ Request created in `product_requisition` table
   - `request_id`: 1234
   - `status`: "pending"
   - `created_at`: 2025-01-15 10:00:00

2. ✅ Items added to `product_requisition_items` table

3. ✅ San Pablo's inventory reserved:
   - LED Bulb 10W: `reserved_quantity` increased by 10
   - Smart Switch: `reserved_quantity` increased by 5

4. ✅ Email sent to Maria (San Pablo)
   - Subject: "New Product Request - Izaj Inventory"
   - Content: "John has sent you a new product request (Request ID: 1234)"

5. ✅ In-app notification created for Maria
   - Title: "New Product Request"
   - Message: "New product request #1234 from John"
   - Link: `/pending_request`

### What Each Branch Sees

**Lucena (John's View):**
```
📍 Page: /requested_item
📋 Request #1234
   Status: Pending ⏳
   Items: 2 products
   Total Value: ₱3,250.00
   Created: Jan 15, 2025 10:00 AM
```

**San Pablo (Maria's View):**
```
📍 Page: /pending_request
📧 Email received: "New Product Request #1234"
🔔 Notification badge: 1 unread
📋 Request #1234
   From: John (Lucena Branch)
   Status: Pending ⏳
   Items: 
     - LED Bulb 10W: 10 units
     - Smart Switch: 5 units
   [Approve] [Deny] buttons visible
```

---

## **STEP 2: San Pablo Approves Request** ✅

### User Action
Maria (San Pablo Manager) reviews the request and clicks **"Approve"**.

### System Actions
1. ✅ Request status updated:
   - `status`: "approved"
   - `reviewed_by`: "xyz-789" (Maria's user_id)
   - `reviewed_at`: 2025-01-15 10:30:00
   - `notes`: (optional review notes)

2. ✅ San Pablo's inventory updated:
   - LED Bulb 10W: 
     - `quantity`: 50 → 40 (deducted 10)
     - `reserved_quantity`: 10 → 0 (reset)
   - Smart Switch:
     - `quantity`: 20 → 15 (deducted 5)
     - `reserved_quantity`: 5 → 0 (reset)

3. ✅ Lucena's inventory prepared (items in transit):
   - Products added to Lucena's branch with status "in transit"
   - Not yet merged into active inventory

4. ✅ Email sent to John (Lucena)
   - Subject: "Product Request Approved - Izaj Inventory"
   - Content: "Your product request (Request ID: 1234) has been approved by Maria"

5. ✅ In-app notification created for John
   - Title: "Request Approved"
   - Message: "Your request #1234 was approved by Maria"
   - Link: `/requested_item`

### What Each Branch Sees

**San Pablo (Maria's View):**
```
📍 Page: /pending_request
📋 Request #1234
   Status: Approved ✓
   Reviewed by: Maria
   Reviewed at: Jan 15, 2025 10:30 AM
   Items ready for shipment
```

**Lucena (John's View):**
```
📍 Page: /requested_item
📧 Email received: "Product Request Approved"
🔔 Notification: "Request #1234 approved"
📋 Request #1234
   Status: Approved ✓
   Items: In Transit 🚚
   [Mark as Arrived] button now visible! ← KEY BUTTON
```

---

## **STEP 3: Physical Items Arrive at Lucena** 📦

### User Action
John (Lucena Manager) receives the physical items and clicks **"Mark as Arrived"** button.

### System Actions (Automated Process)

#### 3.1 Inventory Merge & Tagging

**For Item 1: LED Bulb 10W (Existing Product)**
```javascript
// System checks: Does "LED Bulb 10W" exist in Lucena?
// Answer: YES (already has 25 units)

// Action: UPDATE existing product
{
  product_id: 501,  // Existing product in Lucena
  previous_quantity: 25,
  added_quantity: 10,
  new_quantity: 35,
  transfer_tag: "Updated Stock (Transfer)",  // 🏷️ TAG APPLIED
  transfer_tag_set_at: "2025-01-15 14:00:00"
}
```

**For Item 2: Smart Switch (New Product)**
```javascript
// System checks: Does "Smart Switch" exist in Lucena?
// Answer: NO (first time in Lucena)

// Action: CREATE new product entry
{
  product_id: 502,  // New product created
  product_name: "Smart Switch",
  quantity: 5,
  price: 350.00,
  category_id: 2,
  branch_id: 2,  // Lucena's branch
  transfer_tag: "New Item from Transfer",  // 🏷️ TAG APPLIED
  transfer_tag_set_at: "2025-01-15 14:00:00"
}
```

#### 3.2 Request Status Update
```sql
UPDATE product_requisition
SET status = 'arrived',
    arrived_at = '2025-01-15 14:00:00'
WHERE request_id = 1234;
```

#### 3.3 Transfer History Recorded
```json
[
  {
    "product_id": 501,
    "quantity": 10,
    "branch_id": 2,
    "transferred_at": "2025-01-15 14:00:00",
    "request_id": 1234,
    "status": "Completed",
    "change_type": "updated_stock"
  },
  {
    "product_id": 502,
    "quantity": 5,
    "branch_id": 2,
    "transferred_at": "2025-01-15 14:00:00",
    "request_id": 1234,
    "status": "Completed",
    "change_type": "new_item"
  }
]
```

#### 3.4 Email Notification to San Pablo
**Recipient**: Maria (San Pablo Manager)
**Subject**: "Request #1234 Received - Izaj Inventory"

**Email Content**:
```
Hello Maria,

Branch Lucena has confirmed that request #1234 arrived and has been 
merged into their local inventory.

Items merged:
• LED Bulb 10W - Updated Stock (Transfer) (+10)
• Smart Switch - New Item from Transfer (+5)

[View Request] button
```

#### 3.5 In-App Notification to San Pablo
```json
{
  "user_id": "xyz-789",  // Maria's user_id
  "title": "Transfer Received",
  "message": "John merged request #1234 into their inventory",
  "link": "/pending_request",
  "type": "transfer_update",
  "read": false,
  "metadata": {
    "request_id": 1234,
    "destination_branch": "Lucena",
    "item_count": 2,
    "total_quantity": 15
  }
}
```

#### 3.6 Audit Log Entry
```json
{
  "user_id": "abc-123",  // John's user_id
  "action": "INVENTORY_TRANSFER",
  "description": "Request #1234 arrived with 2 items merged into Lucena",
  "entity_type": "product_requisition",
  "entity_id": "1234",
  "metadata": {
    "request_id": 1234,
    "requester_branch_id": 2,
    "source_branch_name": "San Pablo",
    "items_merged": [
      {
        "product_id": 501,
        "product_name": "LED Bulb 10W",
        "added_quantity": 10,
        "previous_quantity": 25,
        "new_quantity": 35,
        "tag": "Updated Stock (Transfer)"
      },
      {
        "product_id": 502,
        "product_name": "Smart Switch",
        "added_quantity": 5,
        "previous_quantity": 0,
        "new_quantity": 5,
        "tag": "New Item from Transfer"
      }
    ]
  }
}
```

### What Each Branch Sees After "Mark as Arrived"

**Lucena (John's View):**

**1. Stock List Page (`/stock`):**
```
Product Name                    | Quantity | Tag
--------------------------------|----------|----------------------------
LED Bulb 10W                    | 35       | [Updated Stock (Transfer)] 🟡
Smart Switch                     | 5        | [New Item from Transfer] 🟢
```

**Visual Tags:**
- 🟡 **Amber badge**: "Updated Stock (Transfer)" - shows existing product got more stock
- 🟢 **Green badge**: "New Item from Transfer" - shows brand new product added

**2. Requested Items Page (`/requested_item`):**
```
Request #1234
Status: Arrived ✓
Arrived at: Jan 15, 2025 2:00 PM
Items successfully merged into inventory
```

**3. Transferred Items Page (`/transferred`):**
```
Transferred Items
─────────────────────────────────────────────
LED Bulb 10W        | +10 | [Updated Stock (Transfer)]
Smart Switch        | +5  | [New Item from Transfer]
─────────────────────────────────────────────
Total: 2 items, 15 units
```

**San Pablo (Maria's View):**

**1. Email Notification:**
```
📧 Subject: Request #1234 Received - Izaj Inventory

Branch Lucena has confirmed that request #1234 arrived and has been 
merged into their local inventory.

Items merged:
• LED Bulb 10W - Updated Stock (Transfer) (+10)
• Smart Switch - New Item from Transfer (+5)

[View Request] button
```

**2. In-App Notification:**
```
🔔 Transfer Received
"John merged request #1234 into their inventory"
[View Details] → /pending_request
```

**3. Pending Requests Page (`/pending_request`):**
```
Request #1234
Status: Arrived ✓
Destination: Lucena Branch
Items: 2 products successfully received
```

---

## **Visual Summary**

### Timeline Flow
```
10:00 AM ──────────────────────────────────────────────── 2:00 PM
    │                                                          │
    │                                                          │
    ▼                                                          ▼
[Request Created] → [Approved] → [Items Shipped] → [Mark as Arrived]
    │                  │              │                    │
    │                  │              │                    │
    ▼                  ▼              ▼                    ▼
Pending            Approved      In Transit          Arrived ✓
```

### Database State Changes

**Before "Mark as Arrived":**
```
Lucena Inventory:
- LED Bulb 10W: 25 units (no tag)
- Smart Switch: Does not exist

Request Status: "approved"
```

**After "Mark as Arrived":**
```
Lucena Inventory:
- LED Bulb 10W: 35 units [Updated Stock (Transfer)] 🟡
- Smart Switch: 5 units [New Item from Transfer] 🟢

Request Status: "arrived"
arrived_at: 2025-01-15 14:00:00
```

### Tag Visibility

**In Stock List:**
```
┌─────────────────────────────────────────────────┐
│ LED Bulb 10W  [Updated Stock (Transfer)] 🟡    │
│ Smart Switch  [New Item from Transfer] 🟢       │
└─────────────────────────────────────────────────┘
```

**Tag Colors:**
- 🟢 **Green/Emerald**: New Item from Transfer
- 🟡 **Amber/Yellow**: Updated Stock (Transfer)

---

## **Key Features Demonstrated**

✅ **Automatic Inventory Merge**
- Existing products: Quantity updated
- New products: Automatically created

✅ **Visual Tagging System**
- Clear badges showing transfer status
- Color-coded for quick identification

✅ **Real-Time Notifications**
- Email to source branch (San Pablo)
- In-app notification for instant visibility

✅ **Complete Audit Trail**
- All actions logged with timestamps
- Full merge summary in metadata

✅ **Branch Synchronization**
- Both branches see updated status
- No manual inventory updates needed

---

## **Testing Checklist**

To test this flow:

1. ✅ Create request from Lucena to San Pablo
2. ✅ Verify San Pablo receives notification
3. ✅ Approve request from San Pablo
4. ✅ Verify Lucena sees "Mark as Arrived" button
5. ✅ Click "Mark as Arrived" from Lucena
6. ✅ Verify inventory updated with tags
7. ✅ Verify San Pablo receives email + notification
8. ✅ Check tags appear in stock list
9. ✅ Verify audit logs created
10. ✅ Check transferred items page shows tags

---

**End of Example Flow**

