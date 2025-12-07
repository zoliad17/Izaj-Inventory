# Notifications System Documentation

## Overview

The notifications system is fully integrated with both frontend and backend components. It provides real-time notifications to users with support for:

- ✅ Database persistence (PostgreSQL/Supabase)
- ✅ Real-time updates (Supabase subscriptions with polling fallback)
- ✅ Mark as read functionality
- ✅ Delete individual and bulk notifications
- ✅ Search and filtering
- ✅ Multiple notification types (product, transfer, alert, general)
- ✅ Unread count tracking

---

## Database Schema

### notifications table

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  type text DEFAULT 'general'::text,
  read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id) ON DELETE CASCADE
);
```

**Indexes for Performance:**

- `idx_notifications_user_id` - Fast user lookups
- `idx_notifications_created_at` - Recent notifications
- `idx_notifications_read` - Filter by read status
- `idx_notifications_user_read_created` - Combined index for common queries

---

## Backend API Endpoints

All endpoints require authentication via `authenticateUser` middleware.

### 1. Get Unread Notifications Count

```
GET /api/notifications/unread/me
```

**Query Parameters:**

- `user_id` (optional) - For query string authentication as fallback

**Response:**

```json
{
  "count": 5
}
```

### 2. Get Unread Count by User

```
GET /api/notifications/unread/:userId
```

**Response:**

```json
{
  "count": 5
}
```

### 3. Get Paginated Notifications List

```
GET /api/notifications?limit=20&offset=0&link=&read=
```

**Query Parameters:**

- `limit` (default: 20, max: 100) - Items per page
- `offset` (default: 0) - Pagination offset
- `link` (optional) - Filter by specific link
- `read` (optional) - Filter by read status (true/false)

**Response:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "New Product Request",
      "message": "Product request #123 from John",
      "link": "/pending_request",
      "type": "product_request",
      "read": false,
      "metadata": { "request_id": 123 },
      "created_at": "2025-12-07T10:30:00Z"
    }
  ],
  "total": 25
}
```

### 4. Mark Notifications as Read

```
PUT /api/notifications/mark-read
```

**Request Body:**

```json
{
  "link": "/pending_request" // optional - mark only notifications with this link
}
```

**Response:**

```json
{
  "updated": 3
}
```

### 5. Delete Single Notification

```
DELETE /api/notifications/:notificationId
```

**Response:**

```json
{
  "deleted": 1
}
```

### 6. Delete Multiple Notifications

```
DELETE /api/notifications?read_status=read
```

**Query Parameters:**

- `read_status` (optional) - 'read', 'unread', or omit for all

**Response:**

```json
{
  "deleted": 10
}
```

### 7. Create Notification (Admin/System)

```
POST /api/notifications/create
```

**Request Body:**

```json
{
  "user_id": "uuid",
  "title": "String (required)",
  "message": "Optional message",
  "link": "Optional URL",
  "type": "general|product|transfer|alert|product_request",
  "metadata": { "any": "data" }
}
```

**Response:**

```json
{
  "notification": { ... }
}
```

### 8. Get Current User ID

```
GET /api/whoami
```

**Response:**

```json
{
  "user_id": "uuid"
}
```

---

## Frontend Components

### NotificationsPage Component

**Location:** `src/components/Notifications/NotificationsPage.tsx`

**Features:**

- Displays all user notifications
- Search by title/message
- Filter by notification type
- Mark as read (individually or all at once)
- Delete notifications (with confirmation)
- Click on notifications to navigate to related pages
- Real-time updates via Supabase subscriptions
- Fallback to polling if real-time unavailable
- Pagination support

**Usage:**

```tsx
import NotificationsPage from "./components/Notifications/NotificationsPage";

// Use as a page component in routing
```

### useNotifications Hook

**Location:** `src/hooks/useNotifications.ts`

**Features:**

- Fetches notifications from backend
- Tracks unread count
- Supports polling and Supabase real-time
- Mark as read functionality
- Automatic refresh capability

**Usage:**

```tsx
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    refresh,
  } = useNotifications({
    userId: user?.user_id || null,
    enabled: true,
    pollInterval: 30000, // 30 seconds
    realtime: true,
  });

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map((n) => (
        <div key={n.id}>
          {n.title} - {n.message}
        </div>
      ))}
    </div>
  );
}
```

---

## Helper Functions

**Location:** `src/utils/notificationHelper.ts`

Provides convenient functions to create notifications throughout your app:

### 1. Generic Notification

```typescript
import { createNotification } from "../utils/notificationHelper";

await createNotification({
  user_id: "user-uuid",
  title: "Custom Title",
  message: "Custom message",
  link: "/some-page",
  type: "general",
  metadata: { custom_field: "value" },
});
```

### 2. Product Request Notification

```typescript
import { createProductRequestNotification } from "../utils/notificationHelper";

await createProductRequestNotification(
  userId,
  requestId,
  requesterName,
  itemCount,
  totalQuantity
);
```

### 3. Low Stock Alert

```typescript
import { createLowStockNotification } from "../utils/notificationHelper";

await createLowStockNotification(userId, productName, currentStock);
```

### 4. Stock Transfer Notification

```typescript
import { createStockTransferNotification } from "../utils/notificationHelper";

await createStockTransferNotification(
  userId,
  fromBranch,
  toBranch,
  quantity,
  productName,
  transferId
);
```

### 5. Out of Stock Alert

```typescript
import { createOutOfStockNotification } from "../utils/notificationHelper";

await createOutOfStockNotification(userId, productName);
```

### 6. Request Approved Notification

```typescript
import { createRequestApprovedNotification } from "../utils/notificationHelper";

await createRequestApprovedNotification(userId, requestId, approverName);
```

### 7. Request Rejected Notification

```typescript
import { createRequestRejectedNotification } from "../utils/notificationHelper";

await createRequestRejectedNotification(
  userId,
  requestId,
  rejecterName,
  "Optional rejection reason"
);
```

### 8. System Notification

```typescript
import { createSystemNotification } from "../utils/notificationHelper";

await createSystemNotification(
  userId,
  "System Message",
  "This is a system notification",
  "/system-page",
  { system_data: "value" }
);
```

---

## Usage Examples

### Example 1: Create Notification After Product Request

In `backend/Server/server.js`:

```javascript
import { createProductRequestNotification } from "../path/to/notificationHelper";

// After creating a product request
try {
  await createProductRequestNotification(
    requestTo,
    requestData.request_id,
    requesterData?.name || "Unknown",
    items.length,
    items.reduce((s, it) => s + it.quantity, 0)
  );
} catch (error) {
  console.error("Failed to create notification:", error);
}
```

### Example 2: Display Badge with Unread Count

```tsx
import { useNotifications } from "../hooks/useNotifications";

function NotificationBell() {
  const { unreadCount } = useNotifications({ userId: currentUser?.user_id });

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
```

### Example 3: Mark Notifications as Read

```tsx
const { notifications, markRead } = useNotifications({
  userId: currentUser?.user_id,
});

const handleNotificationClick = async (notification) => {
  // Mark as read
  await markRead([notification.id]);

  // Navigate to page if link exists
  if (notification.link) {
    navigate(notification.link);
  }
};
```

---

## Notification Types

The system supports the following notification types:

| Type              | Usage                                 | Icon        |
| ----------------- | ------------------------------------- | ----------- |
| `product`         | Product-related updates               | Package     |
| `product_request` | Product request notifications         | Package     |
| `transfer`        | Stock transfer notifications          | Building    |
| `alert`           | Alert notifications (low stock, etc.) | AlertCircle |
| `low_stock`       | Specific low stock alerts             | AlertCircle |
| `out_of_stock`    | Out of stock alerts                   | AlertCircle |
| `general`         | General notifications                 | AlertCircle |

---

## Real-Time Sync & Polling

### Real-Time Updates (Supabase)

If Supabase environment variables are configured, notifications will sync in real-time:

1. **Setup:** Supabase RLS policies configured on notifications table
2. **Subscription:** Hook subscribes to `INSERT` events filtered by user_id
3. **Auto-Update:** New notifications appear instantly without refresh

### Polling Fallback

If real-time is unavailable:

1. **Default Interval:** 30 seconds (configurable)
2. **On Success:** Updates unread count and notification list
3. **Graceful Degradation:** App remains functional

**Configure Polling Interval:**

```tsx
const { notifications } = useNotifications({
  userId: currentUser?.user_id,
  pollInterval: 60000, // 60 seconds
  realtime: true, // Enable real-time with polling fallback
});
```

---

## Best Practices

### 1. Always Use Helper Functions

Instead of manual API calls, use the helper functions:

```typescript
// ❌ Don't do this
fetch(`${API_BASE_URL}/api/notifications/create`, { ... });

// ✅ Do this
import { createProductRequestNotification } from "../utils/notificationHelper";
await createProductRequestNotification(userId, requestId, name, items, qty);
```

### 2. Provide Meaningful Links

Always include a link when possible so users can navigate to related content:

```typescript
{
  title: "Product Request #123",
  link: "/pending_request", // Users can click to view
}
```

### 3. Use Metadata for Additional Context

Store relevant data in metadata for future filtering/querying:

```typescript
metadata: {
  request_id: 123,
  item_count: 5,
  total_quantity: 100,
  requester_name: "John Doe"
}
```

### 4. Clean Up Old Notifications

Periodically clean up old, read notifications:

```typescript
// Delete all read notifications
await fetch(`${API_BASE_URL}/api/notifications?read_status=read`, {
  method: "DELETE",
  credentials: "include",
});
```

### 5. Handle Errors Gracefully

```typescript
try {
  await createProductRequestNotification(...);
} catch (error) {
  console.error("Notification failed (non-critical):", error);
  // App should continue working even if notification fails
}
```

---

## Testing

### Test Notification Creation

```bash
# Create a test notification
curl -X POST http://localhost:3001/api/notifications/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user-uuid",
    "title": "Test Notification",
    "message": "This is a test",
    "type": "general"
  }'
```

### Test Unread Count

```bash
curl http://localhost:3001/api/notifications/unread/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test List Notifications

```bash
curl "http://localhost:3001/api/notifications?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Future Enhancements

- [ ] Email notifications
- [ ] Push notifications (WebPush)
- [ ] Notification preferences (per user settings)
- [ ] Bulk notification creation
- [ ] Notification scheduling
- [ ] Notification templates
- [ ] Analytics dashboard for notification metrics

---

## Troubleshooting

### Notifications Not Appearing

1. **Check Backend:** Ensure server is running on correct port (3001)
2. **Check Auth:** Verify user is authenticated
3. **Check Database:** Verify notifications table exists and has data
4. **Check Browser Console:** Look for fetch errors
5. **Check Network Tab:** Verify API requests are successful

### Real-Time Not Working

1. **Check Supabase:** Verify SUPABASE_URL and SUPABASE_KEY are set
2. **Check RLS:** Ensure notifications table has correct RLS policies
3. **Check Console:** Look for Supabase subscription errors
4. **Fallback to Polling:** App should automatically poll instead

### Performance Issues

1. **Reduce Poll Interval:** Increase to 60000+ ms
2. **Implement Pagination:** Use `limit` and `offset` parameters
3. **Clean Old Notifications:** Delete old read notifications
4. **Check Database:** Verify indexes exist and database is healthy

---

## Related Files

- Backend: `backend/Server/server.js` (API endpoints)
- Frontend: `src/components/Notifications/NotificationsPage.tsx` (UI component)
- Hook: `src/hooks/useNotifications.ts` (Data fetching logic)
- Utils: `src/utils/notificationHelper.ts` (Helper functions)
- Schema: `schema.sql` (Database definition)

---

## Support

For issues or questions about the notifications system, please check:

1. Console errors in browser DevTools
2. Server logs for backend errors
3. Database logs for query issues
4. This documentation file for common patterns
