// Centralized type definitions for the entire application
// This prevents duplicate interfaces and ensures consistency

// User related types
export interface User {
    user_id: string;
    name: string;
    email: string;
    role_id: number;
    branch_id: number | null;
    status: string;
    role_name?: string;
}

export interface NewUser {
    name: string;
    email: string;
    contact: string;
    role_id: number;
    branch_id?: number | null;
    password?: string;
}

// Product related types
export interface Product {
    id: number;
    product_name?: string;
    name?: string; // For backward compatibility
    quantity?: number;
    total_quantity?: number;
    reserved_quantity?: number;
    stock?: number; // Alternative to quantity for UI components
    price: number | string;
    status: "In Stock" | "Out of Stock" | "Low Stock" | "in-stock" | "low-stock" | "out-of-stock";
    category_id?: number;
    category?: number;
    category_name?: string;
    branch_id: number;
    created_at?: string;
    updated_at?: string;
    // Additional UI-specific properties
    detailsPage?: string;
    source?: "Local" | "Transferred";
    transferred_from?: string;
    transferred_at?: string;
    request_id?: number;
}

// Branch related types
export interface Branch {
    id: number;
    location: string;
    address: string | null;
    created_at?: string;
}

// Request related types
export interface RequestItem {
    product_id: number;
    product_name: string;
    quantity: number;
    category_name?: string;
}

export interface PendingRequest {
    request_id: number;
    request_from: string;
    request_to: string;
    status: string;
    created_at: string;
    updated_at?: string;
    reviewed_at?: string;
    notes?: string;
    requester_name?: string;
    requester_email?: string;
    requester_branch?: string;
    recipient_name?: string;
    recipient_branch?: string;
    reviewer_name?: string;
    items: RequestItem[];
}

// Audit Log types
export interface AuditLog {
    id: number;
    user_id: string;
    action: string;
    description: string;
    metadata?: any;
    entity_type?: string;
    entity_id?: string;
    ip_address?: string;
    user_agent?: string;
    old_values?: any;
    new_values?: any;
    notes?: string;
    timestamp: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
    user_status?: string;
    role_name?: string;
    branch_location?: string;
    branch_address?: string;
    action_category?: string;
    severity_level?: string;
    seconds_ago?: number;
    time_period?: string;
    user?: {
        name: string;
        email: string;
        role?: {
            role_name: string;
        };
        branch?: {
            location: string;
            address?: string;
        };
    };
}

// Dashboard types
export interface DashboardStats {
    totalStock: number;
    totalProducts: number;
    totalCategories: number;
    totalBranches: number;
    lowStockCount: number;
    outOfStockCount: number;
    recentActivity: number;
    lastUpdated: string;
}

// API Response types
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

// Form types
export interface BranchFormData {
    location: string;
    address: string;
}

export interface ProductFormData {
    name: string;
    category: number;
    price: number;
    stock: number;
    status: "In Stock" | "Out of Stock" | "Low Stock";
    branch_id: number;
}

// User roles
export type UserRole = "Admin" | "Branch Manager" | "Super Admin";

// Route permissions
export interface RouteRoles {
    [key: string]: UserRole[];
}
