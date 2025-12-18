# Notifications with Redirect Links - Codebase Scan

This document provides a comprehensive overview of all notifications in the codebase that include redirect links.

## Summary

The notification system supports redirect links that allow users to navigate directly to relevant pages when clicking on notifications. Links are stored in the `link` field of the notifications table and are used by both the Dashboard notification panel and the NotificationsPage component.

---

## Backend Notification Creation Points

### 1. Product Request Notification

**Location:** `backend/Server/server.js` (Line ~1487)

**Trigger:** When a new product request is created

**Redirect Link:** `/pending_request`

```javascript
await supabase.from("notifications").insert([
  {
    user_id: requestTo,
    title: "New Product Request",
    message: `New product request #${requestData.request_id} from ${
      requesterData?.name || "Unknown"
    }`,
    link: "/pending_request",
    type: "product_request",
    read: false,
    metadata: {
      request_id: requestData.request_id,
      item_count: items.length,
      total_quantity: items.reduce((s, it) => s + it.quantity, 0),
    },
  },
]);
```

---

### 2. Request Approval/Denial Notification

**Location:** `backend/Server/server.js` (Line ~2106)

**Trigger:** When a product request is approved or denied

**Redirect Links:**

- Approved: `/transferred`
- Denied: `/requested_item`

```javascript
await supabase.from("notifications").insert([
  {
    user_id: requestData.request_from,
    title: action === "approved" ? "Request Approved" : "Request Denied",
    message:
      action === "approved"
        ? `Your request #${requestId} was approved by ${
            reviewerData?.name || "Reviewer"
          }`
        : `Your request #${requestId} was denied by ${
            reviewerData?.name || "Reviewer"
          }`,
    link: action === "approved" ? "/transferred" : "/requested_item",
    type: action === "approved" ? "request_approved" : "request_denied",
    read: false,
    metadata: {
      request_id: requestId,
      reviewer: reviewerData?.name || null,
      notes: notes || null,
    },
  },
]);
```

---

### 3. Transfer Received Notification

**Location:** `backend/Server/server.js` (Line ~2475)

**Trigger:** When a transfer request is merged into inventory

**Redirect Link:** `/pending_request`

```javascript
await supabase.from("notifications").insert([
  {
    user_id: requestData.request_to,
    title: "Transfer Received",
    message: `${
      requesterUser?.name || "A branch"
    } merged request #${requestId} into their inventory`,
    link: "/pending_request",
    type: "transfer_update",
    read: false,
    metadata: {
      request_id: requestId,
      destination_branch: requesterUser?.branch?.location || "Unknown",
      item_count: mergeSummary.length,
      total_quantity: mergeSummary.reduce(
        (sum, item) => sum + item.added_quantity,
        0
      ),
    },
  },
]);
```

---

### 4. Generic Notification Creation API

**Location:** `backend/Server/server.js` (Line ~4180)

**Endpoint:** `POST /api/notifications/create`

**Redirect Link:** Configurable (passed in request body)

```javascript
const { data, error } = await supabase.from("notifications").insert([
  {
    user_id,
    title,
    message: message || null,
    link: link || null, // Optional redirect link
    type: type || "general",
    metadata: metadata || null,
    read: false,
  },
]);
```

---

## Frontend Notification Helper Functions

**Location:** `src/utils/notificationHelper.ts`

**Note:** These helper functions are defined but **not currently used** in the codebase. All notifications are currently created directly in the backend. These functions are available for future frontend use.

### 1. Product Request Notification

**Function:** `createProductRequestNotification()`

**Redirect Link:** `/pending_request`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "New Product Request",
  message: `Product request #${requestId} from ${requesterName} with ${itemCount} item(s) (${totalQuantity} units total)`,
  link: "/pending_request",
  type: "product_request",
  metadata: { ... },
});
```

---

### 2. Low Stock Alert Notification

**Function:** `createLowStockNotification()`

**Redirect Link:** `/inventory`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "Low Stock Alert",
  message: `${productName} stock is running low (${currentStock} units remaining)`,
  link: "/inventory",
  type: "alert",
  metadata: { ... },
});
```

---

### 3. Stock Transfer Notification

**Function:** `createStockTransferNotification()`

**Redirect Link:** `/transfers`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "Stock Transfer Notification",
  message: `${quantity} units of ${productName} transferred from ${fromBranch} to ${toBranch}`,
  link: "/transfers",
  type: "transfer",
  metadata: { ... },
});
```

---

### 4. Out of Stock Notification

**Function:** `createOutOfStockNotification()`

**Redirect Link:** `/inventory`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "Out of Stock",
  message: `${productName} is now out of stock`,
  link: "/inventory",
  type: "alert",
  metadata: { ... },
});
```

---

### 5. Request Approved Notification

**Function:** `createRequestApprovedNotification()`

**Redirect Link:** `/my_requests`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "Product Request Approved",
  message: `Your product request #${requestId} has been approved by ${approverName}`,
  link: "/my_requests",
  type: "product_request",
  metadata: { ... },
});
```

---

### 6. Request Rejected Notification

**Function:** `createRequestRejectedNotification()`

**Redirect Link:** `/my_requests`

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title: "Product Request Rejected",
  message: `Your product request #${requestId} has been rejected by ${rejecterName}${reason ? `: ${reason}` : ""}`,
  link: "/my_requests",
  type: "product_request",
  metadata: { ... },
});
```

---

### 7. System Notification (Generic)

**Function:** `createSystemNotification()`

**Redirect Link:** Configurable (optional parameter)

**Status:** ⚠️ Defined but not used

```typescript
await createNotification({
  user_id: userId,
  title,
  message,
  link, // Optional - can be any route
  type: "general",
  metadata,
});
```

---

## Frontend Components Handling Redirects

### 1. Dashboard Notification Panel

**Location:** `src/components/Dashboard/Dashboard.tsx` (Line ~396)

**Function:** `handleNotificationClick()`

**Behavior:**

- Marks notification as read if unread
- Navigates to the link if provided
- Closes the notification panel

```typescript
const handleNotificationClick = async (notification: NotificationItem) => {
  // Mark as read if unread
  if (!notification.read) {
    if (notification.link) {
      await markRead(undefined, notification.link);
    } else if (notification.id) {
      await markRead([notification.id]);
    }
  }

  // Navigate to the link if provided
  if (notification.link) {
    navigate(notification.link);
    setIsNotificationPanelOpen(false);
  }
};
```

---

### 2. NotificationsPage Component

**Location:** `src/components/Notifications/NotificationsPage.tsx` (Line ~347)

**Behavior:**

- Displays a "View" button if notification has a link
- Navigates to the link when clicked

```typescript
{
  notification.link && (
    <button
      onClick={() => navigate(notification.link || "/")}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
    >
      View
    </button>
  );
}
```

---

## Complete List of Redirect Links Used

### Currently Active (Backend Implementation)

| Redirect Link      | Used In                                     | Notification Type                    | Status    |
| ------------------ | ------------------------------------------- | ------------------------------------ | --------- |
| `/pending_request` | Product request creation, Transfer received | `product_request`, `transfer_update` | ✅ Active |
| `/transferred`     | Request approved                            | `request_approved`                   | ✅ Active |
| `/requested_item`  | Request denied                              | `request_denied`                     | ✅ Active |

### Defined but Not Currently Used (Frontend Helpers)

| Redirect Link  | Used In                       | Notification Type | Status                |
| -------------- | ----------------------------- | ----------------- | --------------------- |
| `/inventory`   | Low stock alert, Out of stock | `alert`           | ⚠️ Defined but unused |
| `/transfers`   | Stock transfer                | `transfer`        | ⚠️ Defined but unused |
| `/my_requests` | Request approved/rejected     | `product_request` | ⚠️ Defined but unused |
| Configurable   | Generic system notifications  | `general`         | ⚠️ Defined but unused |

---

## Database Schema

The `notifications` table includes a `link` field:

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  link text,  -- Redirect link field
  type text DEFAULT 'general'::text,
  read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ...
);
```

---

## Notes

1. **Link Format:** All links are relative paths (e.g., `/pending_request`) and are handled by React Router's `navigate()` function.

2. **Optional Links:** Not all notifications require links. The system gracefully handles notifications without links by not showing the "View" button.

3. **Mark as Read by Link:** The system can mark all notifications with a specific link as read, which is useful for bulk operations.

4. **Link Filtering:** The API supports filtering notifications by link using the query parameter: `GET /api/notifications?link=/pending_request`

---

## Testing Redirect Links

To verify redirect links work correctly:

1. Create a notification with a specific link
2. Click the notification in the Dashboard panel or NotificationsPage
3. Verify navigation to the correct route
4. Verify the notification is marked as read (if it was unread)

---

_Last Updated: Based on codebase scan of all notification creation points_
