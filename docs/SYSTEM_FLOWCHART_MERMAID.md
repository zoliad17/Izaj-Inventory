# IZAJ Inventory Management System - Complete Flowchart

## Full System Flow

```mermaid
flowchart TD
    START([Start]) --> USER_LOGIN[User Login]

    USER_LOGIN --> LOGIN_CHECK{Login Successful?}

    LOGIN_CHECK -->|No| LOGIN_FAILED[Login Failed]
    LOGIN_FAILED --> USER_LOGIN

    LOGIN_CHECK -->|Yes| DETERMINE_TYPE{Determine User Type}

    DETERMINE_TYPE -->|Super Admin| DASHBOARD[Dashboard]
    DETERMINE_TYPE -->|Branch Manager| DASHBOARD
    DETERMINE_TYPE -->|Admin| DASHBOARD

    %% Super Admin Functions
    DASHBOARD --> CREATE_BRANCHES[Create Branches]
    CREATE_BRANCHES --> BRANCH_DATA[Branch Data]
    BRANCH_DATA --> AUDIT_LOGS

    DASHBOARD --> VIEW_STOCKS[View Stocks Per Branch]
    VIEW_STOCKS --> STOCKS_DATA[Stocks Data]
    STOCKS_DATA --> EXPORT_PRODUCTS[Export Products]
    EXPORT_PRODUCTS --> AUDIT_LOGS

    DASHBOARD --> CREATE_USERS[Create Users]
    CREATE_USERS --> USER_CREDENTIALS[User Credential and Roles]
    USER_CREDENTIALS --> AUDIT_LOGS

    %% Branch Manager Functions
    DASHBOARD --> REQUEST_STOCKS[Request Stocks]
    REQUEST_STOCKS --> REQUEST_DETAILS[Request Details]
    REQUEST_DETAILS --> APPROVE_DISAPPROVE[Approve / Disapprove Requests]
    APPROVE_DISAPPROVE --> VIEW_UPDATED[View Updated Products]
    VIEW_UPDATED --> AUDIT_LOGS

    DASHBOARD --> EOQ_ANALYTICS[EOQ Analytics]
    EOQ_ANALYTICS --> IMPORT_SALES[Import Sales]
    IMPORT_SALES --> AUDIT_LOGS

    DASHBOARD --> MANAGE_STOCKS[Manage Stocks]
    MANAGE_STOCKS --> CURRENT_STOCKS[Current Stocks]
    CURRENT_STOCKS --> IMPORT_EXPORT[Import / Export Stocks]
    IMPORT_EXPORT --> AUDIT_LOGS

    %% Admin Functions
    DASHBOARD --> ADMIN_EXPORT[Export Products]
    ADMIN_EXPORT --> AUDIT_LOGS

    %% All paths converge to Audit Logs, then can return to Dashboard or Log Out
    AUDIT_LOGS --> CONTINUE{Continue Working?}
    CONTINUE -->|Yes| DASHBOARD
    CONTINUE -->|No| LOGOUT[Log Out]
```

---

## Authentication Flow

```mermaid
flowchart LR
    A[Login Form] --> B[Submit Credentials]
    B --> C[POST /api/login]
    C --> D[Validate Input]
    D --> E[Check Password Hash]
    E --> F[(users table)]
    F --> G{Valid?}
    G -->|Yes| H[Return user + token]
    G -->|No| I[Return error]
    H --> J[Save to AuthContext]
    I --> A
    F --> K[(audit_logs)]
```

---

## Product Request Lifecycle

```mermaid
flowchart TD
    subgraph Step1[1. CREATE REQUEST]
        A[Admin selects products] --> B[Enter quantities]
        B --> C[Choose destination branch]
        C --> D{Stock >= Requested?}
        D -->|No| E[Error: Insufficient]
        D -->|Yes| F[Reserve inventory]
        F --> G[Save requisition]
        G --> H[Email Manager]
    end

    subgraph Step2[2. MANAGER REVIEW]
        I[Manager views request] --> J{Decision}
        J -->|Deny| K[Release reserved qty]
        K --> L[Status: DENIED]
        J -->|Approve| M[Deduct source branch]
        M --> N[Add to destination]
        N --> O[Status: APPROVED]
    end

    subgraph Step3[3. COMPLETION]
        L --> P[Notify requester]
        O --> P
        P --> Q[Log audit trail]
        Q --> R[Complete]
    end

    H --> I
```

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client[Client Layer]
        USER[User Browser]
        TAURI[Tauri Desktop App]
    end

    subgraph Frontend[React Frontend]
        REACT[React + TypeScript]
        AUTH[AuthContext]
        ROUTES[Protected Routes]
        UI[Tailwind Components]
    end

    subgraph Backend[Node.js Backend]
        EXPRESS[Express Server :5000]
        MIDDLEWARE[Auth Middleware]
        VALIDATION[Input Validation]
        EMAIL[Nodemailer Service]
    end

    subgraph Analytics[Python Analytics]
        FLASK[Flask Server :5001]
        EOQ_CALC[EOQ Calculator]
        FORECAST[Demand Forecaster]
        NUMPY[NumPy/SciPy/Pandas]
    end

    subgraph Database[Supabase Database]
        POSTGRES[(PostgreSQL)]
        TABLES[Tables and Views]
        TRIGGERS[Triggers and Functions]
    end

    USER --> REACT
    TAURI --> REACT
    REACT --> AUTH
    AUTH --> ROUTES
    ROUTES --> UI

    UI --> EXPRESS
    EXPRESS --> MIDDLEWARE
    MIDDLEWARE --> VALIDATION
    VALIDATION --> EMAIL

    EXPRESS --> FLASK
    FLASK --> EOQ_CALC
    FLASK --> FORECAST
    EOQ_CALC --> NUMPY
    FORECAST --> NUMPY

    VALIDATION --> POSTGRES
    POSTGRES --> TABLES
    TABLES --> TRIGGERS
```

---

## Role-Based Access Control

```mermaid
flowchart LR
    subgraph Roles[User Roles]
        SA[Super Admin]
        BM[Branch Manager]
        AD[Admin]
    end

    subgraph Permissions[Permissions]
        P1[All Branches Access]
        P2[User Management]
        P3[Product CRUD]
        P4[Approve Requests]
        P5[View Audit Logs]
        P6[Create Requests]
        P7[View Products]
    end

    SA --> P1
    SA --> P2
    SA --> P3
    SA --> P4
    SA --> P5
    SA --> P6
    SA --> P7

    BM --> P3
    BM --> P4
    BM --> P5
    BM --> P6
    BM --> P7

    AD --> P6
    AD --> P7
```

---

## Database Schema Relationships

```mermaid
erDiagram
    users ||--o{ audit_logs : creates
    users ||--o{ product_requisition : creates
    users }|--|| branch : belongs_to

    branch ||--o{ centralized_product : has
    branch ||--o{ product_requisition : source
    branch ||--o{ product_requisition : destination

    category ||--o{ centralized_product : categorizes

    product_requisition ||--|{ requisition_items : contains
    centralized_product ||--o{ requisition_items : referenced_in

    product_requisition ||--o{ product_transfers : generates

    users {
        uuid id PK
        string email
        string password_hash
        string role
        uuid branch_id FK
        timestamp created_at
    }

    branch {
        uuid id PK
        string name
        string location
        boolean is_active
    }

    centralized_product {
        uuid id PK
        string name
        uuid category_id FK
        uuid branch_id FK
        decimal price
        int quantity
        int reserved_quantity
    }

    category {
        uuid id PK
        string name
        string description
    }

    product_requisition {
        uuid id PK
        uuid requester_id FK
        uuid source_branch_id FK
        uuid dest_branch_id FK
        string status
        timestamp created_at
        timestamp reviewed_at
        uuid reviewed_by FK
    }

    requisition_items {
        uuid id PK
        uuid requisition_id FK
        uuid product_id FK
        int quantity
        int reserved_qty
    }

    product_transfers {
        uuid id PK
        uuid requisition_id FK
        uuid product_id FK
        int quantity
        timestamp transferred_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        jsonb metadata
        timestamp created_at
    }
```

---

## Request Review Flow (Manager)

```mermaid
flowchart TD
    START[View Pending Requests] --> REVIEW{Approve?}

    REVIEW -->|Deny| DENY_FLOW
    REVIEW -->|Approve| APPROVE_FLOW

    subgraph DENY_FLOW[Deny Flow]
        D1[Release reserved_qty] --> D2[Set status DENIED]
        D2 --> D3[Email requester]
    end

    subgraph APPROVE_FLOW[Approve Flow]
        A1[Deduct from source branch] --> A2[Add to destination branch]
        A2 --> A3[Create transfer record]
        A3 --> A4[Set status APPROVED]
        A4 --> A5[Email requester]
    end

    D3 --> LOG[(Log audit trail)]
    A5 --> LOG
    LOG --> END_STATE[Complete]
```

---

## Analytics Data Flow

```mermaid
flowchart LR
    subgraph Input[Input]
        SALES[Sales Data CSV]
        PARAMS[EOQ Parameters]
    end

    subgraph Processing[Python Processing]
        IMPORT[Import and Validate]
        PANDAS[Pandas DataFrame]
        CALC[Calculations]
    end

    subgraph Algorithms[Algorithms]
        EOQ_FORMULA[EOQ Formula]
        SAFETY[Safety Stock]
        REORDER[Reorder Point]
        SMOOTH[Exponential Smoothing]
    end

    subgraph Output[Output]
        JSON[JSON Response]
        CHARTS[Recharts Visualization]
    end

    SALES --> IMPORT
    PARAMS --> IMPORT
    IMPORT --> PANDAS
    PANDAS --> CALC

    CALC --> EOQ_FORMULA
    CALC --> SAFETY
    CALC --> REORDER
    CALC --> SMOOTH

    EOQ_FORMULA --> JSON
    SAFETY --> JSON
    REORDER --> JSON
    SMOOTH --> JSON
    JSON --> CHARTS
```

---

## Notification Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant EM as Email Service
    participant MGR as Manager

    U->>FE: Create Product Request
    FE->>BE: POST /api/product-requests
    BE->>DB: Validate and Reserve Stock
    DB-->>BE: Success
    BE->>DB: Save Requisition
    BE->>DB: Log Audit
    BE->>EM: Send Notification
    EM-->>MGR: New Request Email
    BE-->>FE: Request Created
    FE-->>U: Success Message

    Note over MGR: Manager Reviews Request

    MGR->>FE: Approve/Deny Request
    FE->>BE: PUT /api/product-requests/:id/review
    BE->>DB: Update Stock if approved
    BE->>DB: Update Status
    BE->>DB: Log Audit
    BE->>EM: Send Notification
    EM-->>U: Request Status Email
    BE-->>FE: Review Complete
```

---

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticating: Submit Login
    Authenticating --> Authenticated: Valid Credentials
    Authenticating --> Unauthenticated: Invalid Credentials

    Authenticated --> Active: Session Created
    Active --> Active: User Actions
    Active --> Warning: Session Near Expiry
    Warning --> Active: Session Refreshed
    Warning --> Expired: No Refresh

    Active --> LoggingOut: User Logout
    Expired --> Unauthenticated: Auto Logout
    LoggingOut --> Unauthenticated: Session Cleared

    Unauthenticated --> [*]
```

---

## API Endpoints Overview

```mermaid
flowchart LR
    subgraph Auth[Authentication]
        A1[POST /api/login]
        A2[POST /api/register]
        A3[POST /api/setup-account]
        A4[POST /api/forgot-password]
    end

    subgraph Products[Products]
        P1[GET /api/products]
        P2[POST /api/products]
        P3[PUT /api/products/:id]
        P4[DELETE /api/products/:id]
    end

    subgraph Requests[Requests]
        R1[GET /api/product-requests]
        R2[POST /api/product-requests]
        R3[PUT /api/product-requests/:id/review]
        R4[PUT /api/product-requests/:id/mark-arrived]
    end

    subgraph AnalyticsAPI[Analytics]
        AN1[POST /api/analytics/eoq/calculate]
        AN2[POST /api/analytics/forecast/demand]
        AN3[POST /api/analytics/inventory/health]
        AN4[GET /api/analytics/recommendations]
    end
```

---

## File Structure

```
IZAJ-Inventory/
├── src/                          # React Frontend
│   ├── components/
│   │   ├── Analytics/            # EOQ Dashboard
│   │   ├── AuditLogs/            # Activity logs
│   │   ├── Auth/                 # Login/Register
│   │   ├── Branch/               # Branch management
│   │   ├── Dashboard/            # Main dashboards
│   │   ├── Notifications/        # Alert system
│   │   └── Stock_Components/     # Inventory UI
│   ├── contexts/
│   │   └── AuthContext.tsx       # Session management
│   └── hooks/                    # Custom hooks
│
├── backend/Server/               # Node.js Backend
│   ├── server.js                 # Express app
│   ├── supabase.node.js          # DB client
│   ├── routes/
│   │   └── analytics.js          # Flask proxy
│   └── utils/                    # Helpers
│
├── analytics/                    # Python Analytics
│   ├── app.py                    # Flask app
│   ├── routes.py                 # API endpoints
│   └── eoq_calculator.py         # Algorithms
│
└── docs/                         # Documentation
    └── SYSTEM_FLOWCHART_MERMAID.md
```

---

**How to View:**

- **GitHub** - Renders Mermaid natively
- **VS Code** - Install "Markdown Preview Mermaid Support" extension
- **Online** - Paste at [mermaid.live](https://mermaid.live/)
