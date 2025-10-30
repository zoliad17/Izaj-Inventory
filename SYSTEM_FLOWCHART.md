# IZAJ-INVENTORY SYSTEM - REVISED FLOW DIAGRAM

## High-Level System Flow (Mermaid)

```mermaid
flowchart TD
  %% Clients
  U[User] --> FE[React + Tauri App]

  %% Auth
  FE -->|Login creds| BE_POST_LOGIN[/POST /api/login/]
  BE_POST_LOGIN -->|Validate email+password, fetch role| DB[(Supabase/Postgres)]
  BE_POST_LOGIN -->|Audit USER_LOGIN| DB
  BE_POST_LOGIN -->|user, role, branchId| FE
  FE -->|Save session (AuthContext)| FE_DASH[Role-based Dashboard]

  %% Protected API pattern
  subgraph Backend
    direction TB
    BE[Express Server]
    MW[authenticateUser(user_id)]
    VAL[Validation & Rate Limits]
  end

  FE -->|user_id in body/query| MW
  MW -->|Load active user| DB
  MW --> BE

  %% Inventory CRUD
  subgraph Inventory CRUD
    direction TB
    BE_POST_PROD[/POST /api/products/]
    BE_PUT_PROD[/PUT /api/products/:id]
    BE_DEL_PROD[/DELETE /api/products/:id]
  end

  FE --> BE_POST_PROD -->|insert centralized_product| DB
  FE --> BE_PUT_PROD -->|update centralized_product| DB
  FE --> BE_DEL_PROD -->|delete centralized_product| DB
  BE_POST_PROD -->|Audit PRODUCT_CREATED| DB
  BE_PUT_PROD  -->|Audit PRODUCT_UPDATED| DB
  BE_DEL_PROD  -->|Audit PRODUCT_DELETED| DB

  %% Product Request Flow
  subgraph Product Request
    direction TB
    FE_REQ[Create Request]
    BE_POST_REQ[/POST /api/product-requests/]
    BE_REVIEW[/PUT /api/product-requests/:id/review]
    BE_ARRIVED[/PUT /api/product-requests/:id/mark-arrived]
  end

  FE_REQ --> BE_POST_REQ -->|validate stock & reserve reserved_quantity| DB
  BE_POST_REQ -->|Insert product_requisition + items| DB
  BE_POST_REQ -->|Email notify & Audit| DB

  FE --> BE_REVIEW -->|approved?| DEC{Approved?}
  DEC -- Yes -->|deduct quantity; reset reserved; transfer/add to dest| DB
  DEC -- No  -->|release reserved; set status denied| DB
  BE_REVIEW -->|Audit & Email| DB

  FE --> BE_ARRIVED -->|Insert product_transfers; mark arrived| DB

  %% Audit Logs
  FE --> BE_GET_AUDIT[/GET /api/audit-logs/]
  BE_GET_AUDIT --> DB

  %% Logout
  FE -.->|Clear session| FE
```

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
