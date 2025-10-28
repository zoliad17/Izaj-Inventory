# IZAJ-INVENTORY SYSTEM - REVISED FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IZAJ-INVENTORY MANAGEMENT SYSTEM                     │
└─────────────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────┐
│   User Registration │
│   (Pending User)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐        ┌──────────────────────┐
│  Setup Account Page │        │   Forgot Password   │
│  (Email Token)      │        │   (Password Reset)  │
└──────────┬──────────┘        └──────────┬──────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐        ┌──────────────────────┐
│  Set Password       │        │  Reset Link Sent     │
└──────────┬──────────┘        │  Reset Password      │
           │                    └──────────┬──────────┘
           │                               │
           └───────────────────┬──────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    User Login        │
                    │  (Email & Password)  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Verify Credentials  │
                    │  Create Session      │
                    │  Log Audit Trail     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │    Select Role-Based         │
                    │        Dashboard             │
                    │                              │
                    │  [Super Admin] [Branch Mgr]  │
                    │  [Admin]                     │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │   Dashboard: View Branches  │
                    │   • Select Branch A         │
                    │   • Select Branch B         │
                    │   • Select Branch C         │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │   Branch Dashboard           │
                    │   • Stock Overview          │
                    │   • Products List           │
                    │   • Pending Requests        │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │      USER ACTION             │
                    │   (Decision Diamond)         │
                    └──────────┬───────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ View Products│    │ Create       │    │ View Audit  │
│              │    │ Product      │    │ Trail        │
│              │    │ Request      │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                  │
       └─────────┬─────────┼──────────┬───────┘
                 │         │          │
                 ▼         │          │
       ┌──────────────────┐│          │
       │   PRODUCT        ││          │
       │   MANAGEMENT     ││          │
       │                  ││          │
       │  ┌─────────────┐│          │
       │  │ Add Product ││          │
       │  │ - Name      ││          │
       │  │ - Category  ││          │
       │  │ - Price     ││          │
       │  │ - Quantity  ││          │
       │  │ - Branch    ││          │
       │  └──────┬──────┘│          │
       │         │       │          │
       │         ▼       │          │
       │  ┌─────────────────┐     │
       │  │ Update Product  │     │
       │  │ (Edit Details)  │     │
       │  └──────┬──────────┘     │
       │         │                │
       │         ▼                │
       │  ┌─────────────────┐     │
       │  │ Delete Product  │     │
       │  │ (With Checks)   │     │
       │  └─────────────────┘     │
       │                           │
       └────────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │   PRODUCT REQUEST           │
         │   MANAGEMENT FLOW           │
         │                             │
         │  ┌────────────────────────┐ │
         │  │ STEP 1: CREATE REQ    │ │
         │  │ • Select Source Branch │ │
         │  │ • Choose Products      │ │
         │  │ • Enter Quantities     │ │
         │  │ • Add Notes (optional) │ │
         │  └───────┬────────────────┘ │
         │          │                  │
         │          ▼                   │
         │  ┌────────────────────────┐ │
         │  │ Validate Inventory     │ │
         │  │ Check:                 │ │
         │  │ • Available Quantity   │ │
         │  │ • Reserved Quantity   │ │
         │  └───────┬────────────────┘ │
         │          │                  │
         │          ▼                   │
         │  ┌────────────────────────┐ │
         │  │ Reserve Inventory      │ │
         │  │ Update:                │ │
         │  │ • reserved_qty += qty  │ │
         │  │ • Status: pending      │ │
         │  │ • Send Email Notification│ │
         │  │ • Log Audit Trail      │ │
         │  └───────┬────────────────┘ │
         │          │                  │
         │          ▼                   │
         │  ┌────────────────────────┐ │
         │  │ STEP 2: REVIEW REQUEST │ │
         │  │ Branch Manager         │ │
         │  │ Reviews Request        │ │
         │  └───────┬────────────────┘ │
         │          │                  │
         │          ▼                   │
         │  ┌──────────────────────┐   │
         │  │  DECISION: Approved? │   │
         │  └──────┬───────────────┘   │
         │         │                   │
         │    ┌────┴────┐              │
         │    │         │              │
         │   YES       NO              │
         │    │         │              │
         │    ▼         ▼              │
         │  ┌──────┐  ┌──────────────┐ │
         │  │      │  │              │ │
         │  │      │  │  Deny Flow: │ │
         │  │      │  │  • Status → │ │
         │  │      │  │    denied   │ │
         │  │      │  │  • Reset    │ │
         │  │      │  │    reserved │ │
         │  │      │  │    qty = 0  │ │
         │  │      │  │  • Notify   │ │
         │  │      │  │    requester│ │
         │  │      │  │  • Log Audit│ │
         │  │      │  └──────┬───────┘ │
         │  │      │         │         │
         │  │      └─────────┼─────────┘
         │  │                │
         │  ▼                │
         │  ┌──────────────────────────────────┐
         │  │ Approve Flow:                    │
         │  │                                  │
         │  │ 1. Source Branch Updates:        │
         │  │    • quantity -= reserved_qty    │
         │  │    • reserved_qty -= qty         │
         │  │                                  │
         │  │ 2. Destination Branch Updates:   │
         │  │    • If product exists:          │
         │  │      quantity += qty             │
         │  │    • Else: Create new entry      │
         │  │                                  │
         │  │ 3. Update Request:               │
         │  │    • status → approved           │
         │  │    • reviewed_by                 │
         │  │    • reviewed_at                 │
         │  │                                  │
         │  │ 4. Send Email Notification       │
         │  │                                  │
         │  │ 5. Log Audit Trail               │
         │  └──────┬───────────────────────────┘
         │         │                           │
         │         │                           │
         │         └───────────────────────────┘
         │                                     │
         │                                     │
         │                                     │
         └──────────────────┬──────────────────┘
                            │
                            ▼
                ┌───────────────────────────┐
                │   AUDIT TRAIL             │
                │   (View All Activities)   │
                │                           │
                │  • User Actions           │
                │  • Product Changes        │
                │  • Request Decisions     │
                │  • Login/Logout           │
                │  • All System Events      │
                └───────┬───────────────────┘
                        │
                        ▼
                ┌───────────────────────────┐
                │   SYSTEM MONITORING       │
                │                           │
                │  • Session Management     │
                │  • Security Checks        │
                │  • Email Notifications    │
                │  • Data Validation         │
                └───────┬───────────────────┘
                        │
                        ▼
                ┌───────────────────────────┐
                │   LOGOUT / SESSION END    │
                │   Clear Session Data      │
                │   Log Audit Trail         │
                └───────┬───────────────────┘
                        │
                        ▼
                        END

┌───────────────────────────────────────────────────────────────────────────────┐
│                          KEY SYSTEM COMPONENTS                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│  FRONTEND (React)   │◄──►│  BACKEND (Node.js)   │◄──►│  DATABASE (Supabase) │
│                     │    │                       │    │                       │
│  • Tauri Desktop    │    │  • Express Server     │    │  • PostgreSQL         │
│  • User Interface   │    │  • API Endpoints      │    │  • Tables & Views    │
│  • Auth Context     │    │  • Authentication     │    │  • Triggers & Funcs │
│  • Protected Routes │    │  • Validation         │    │  • Audit Logs        │
│  • Real-time Updates│    │  • Email Service      │    │  • Indexes           │
└──────────────────────┘    │  • Security Layer     │    └───────────────────────┘
                            └───────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                           USER ROLES & PERMISSIONS                            │
└───────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌───────────────┐     ┌──────────────────┐
│  SUPER ADMIN     │     │ BRANCH MGR    │     │      ADMIN       │
│  (Full Access)   │     │               │     │                  │
│                  │     │  • Product    │     │  • View Products │
│  • Branch Mgmt   │     │    Management │     │  • Create        │
│  • User Mgmt     │     │  • Approve/Deny│     │    Requests      │
│  • Audit Logs    │     │    Requests   │     │  • View Sales    │
│  • All Products  │     │  • View Audit │     │  • View Stock    │
│  • All Requests  │     │    Trail      │     └──────────────────┘
└──────────────────┘     └───────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE FLOW                                       │
└───────────────────────────────────────────────────────────────────────────────┘

user ─┬─► centralized_product ◄─── category
      │         │
      │         │
      ├─► branch
      │         │
      │         │
      └─► product_requisition
                 │
                 ├─► product_requisition_items
                 │         │
                 │         └─► centralized_product
                 │
                 └─► audit_logs ◄─── user

┌───────────────────────────────────────────────────────────────────────────────┐
│                          NOTIFICATION FLOW                                    │
└───────────────────────────────────────────────────────────────────────────────┘

Request Created → Email to Branch Manager → Review Decision → Email to Requester
       │                    │                        │                 │
       │                    │                        │                 │
       └─ Audit Logged      └─ Audit Logged         └─ Audit Logged    └─ Audit Logged

```

---

## Key Improvements in Revised Flowchart

### 1. **Complete User Lifecycle**

- Added pending user creation
- Email-based account setup
- Password reset flow

### 2. **Role-Based Access**

- Role-specific dashboards
- Permission-based actions

### 3. **Inventory Reservation**

- Reserve quantities during request creation
- Prevents over-committing stock

### 4. **Two-Stage Request Process**

- Create Request (reserves inventory)
- Review Request (approve or deny)

### 5. **Inventory Transfer Logic**

- Approve:
  - Deduct from source
  - Reset reserved quantity
  - Add to destination
  - Create new entry if missing
- Deny:
  - Release reserved quantity
  - No quantity change

### 6. **Audit Trail**

- All actions logged
- Includes metadata and timestamps
- Searchable and filterable

### 7. **Email Notifications**

- Request creation
- Approval/denial updates
- Account setup reminders

### 8. **Session & Security**

- 24-hour session expiry
- Token validation
- Protected routes
- Security headers
