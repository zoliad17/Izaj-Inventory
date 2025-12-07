# Notifications System Integration Guide

## Quick Start

### 1. Deploy Database Changes

Run the schema.sql file to create the notifications table:

```bash
# Using psql
psql -U postgres -d izaj_inventory -f schema.sql

# Or through Supabase dashboard
# Navigate to SQL Editor → Run the notifications table creation script
```

### 2. Verify Backend Endpoints

Test the new endpoints to ensure they're working:

```bash
# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/notifications/unread/me

# Get notifications list
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/notifications?limit=10&offset=0

# Create a test notification
curl -X POST http://localhost:3001/api/notifications/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_UUID",
    "title": "Test Notification",
    "message": "This is a test",
    "type": "general"
  }'
```

### 3. Start Using Notifications

Import and use the helper functions throughout your app:
