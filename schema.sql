-- Izaj-Inventory Database Schema with Performance Optimizations
-- This schema includes tables, indexes, constraints, and triggers for optimal performance
-- Safe to run on existing databases - uses IF NOT EXISTS and DROP IF EXISTS

-- =============================================
-- TABLE CREATION (Safe for existing databases)
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  entity_type text,
  entity_id text,
  ip_address inet,
  user_agent text,
  old_values jsonb,
  new_values jsonb,
  notes text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id)
);
CREATE TABLE IF NOT EXISTS public.branch (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  location text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  map_snapshot_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT branch_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.category (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_name text NOT NULL,
  CONSTRAINT category_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.centralized_product (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_name text NOT NULL,
  quantity bigint,
  price real,
  category_id integer,
  status character varying,
  branch_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  reserved_quantity bigint DEFAULT 0,
  CONSTRAINT centralized_product_pkey PRIMARY KEY (id),
  CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES public.branch(id),
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.category(id)
);
CREATE TABLE IF NOT EXISTS public.pending_user (
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  contact numeric NOT NULL,
  role_id integer NOT NULL,
  branch_id integer,
  setup_token text NOT NULL UNIQUE,
  token_expiry timestamp with time zone NOT NULL,
  pending_user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pending_user_pkey PRIMARY KEY (pending_user_id),
  CONSTRAINT pending_user_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id),
  CONSTRAINT pending_user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id)
);
CREATE TABLE IF NOT EXISTS public.product_requisition (
  request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_from uuid NOT NULL,
  request_to uuid NOT NULL,
  updated_at timestamp with time zone,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  notes text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_requisition_pkey PRIMARY KEY (request_id),
  CONSTRAINT product_requisition_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user(user_id),
  CONSTRAINT product_requisition_request_from_fkey FOREIGN KEY (request_from) REFERENCES public.user(user_id),
  CONSTRAINT product_requisition_request_to_fkey FOREIGN KEY (request_to) REFERENCES public.user(user_id)
);
CREATE TABLE IF NOT EXISTS public.product_requisition_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  CONSTRAINT product_requisition_items_pkey PRIMARY KEY (id),
  CONSTRAINT product_requisition_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.product_requisition(request_id),
  CONSTRAINT product_requisition_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.centralized_product(id)
);
CREATE TABLE IF NOT EXISTS public.role (
  role_name character varying NOT NULL UNIQUE,
  id integer NOT NULL DEFAULT nextval('role_id_seq'::regclass),
  CONSTRAINT role_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS public.user (
  contact numeric,
  status text,
  name character varying,
  branch_id integer,
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  password text,
  email character varying NOT NULL UNIQUE,
  role_id integer,
  created_at timestamp with time zone DEFAULT now(),
  setup_token text UNIQUE,
  token_expiry timestamp with time zone,
  CONSTRAINT user_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id),
  CONSTRAINT user_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON public.user(email);
CREATE INDEX IF NOT EXISTS idx_user_role_id ON public.user(role_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_id ON public.user(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_status ON public.user(status);

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_centralized_product_branch_id ON public.centralized_product(branch_id);
CREATE INDEX IF NOT EXISTS idx_centralized_product_category_id ON public.centralized_product(category_id);
CREATE INDEX IF NOT EXISTS idx_centralized_product_status ON public.centralized_product(status);
CREATE INDEX IF NOT EXISTS idx_centralized_product_created_at ON public.centralized_product(created_at);
CREATE INDEX IF NOT EXISTS idx_centralized_product_quantity ON public.centralized_product(quantity);

-- Audit logs indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- Product requisition indexes
CREATE INDEX IF NOT EXISTS idx_product_requisition_request_from ON public.product_requisition(request_from);
CREATE INDEX IF NOT EXISTS idx_product_requisition_request_to ON public.product_requisition(request_to);
CREATE INDEX IF NOT EXISTS idx_product_requisition_status ON public.product_requisition(status);
CREATE INDEX IF NOT EXISTS idx_product_requisition_created_at ON public.product_requisition(created_at);
CREATE INDEX IF NOT EXISTS idx_product_requisition_reviewed_by ON public.product_requisition(reviewed_by);

-- Product requisition items indexes
CREATE INDEX IF NOT EXISTS idx_product_requisition_items_request_id ON public.product_requisition_items(request_id);
CREATE INDEX IF NOT EXISTS idx_product_requisition_items_product_id ON public.product_requisition_items(product_id);

-- Pending user indexes
CREATE INDEX IF NOT EXISTS idx_pending_user_email ON public.pending_user(email);
CREATE INDEX IF NOT EXISTS idx_pending_user_setup_token ON public.pending_user(setup_token);
CREATE INDEX IF NOT EXISTS idx_pending_user_token_expiry ON public.pending_user(token_expiry);
CREATE INDEX IF NOT EXISTS idx_pending_user_status ON public.pending_user(status);

-- Branch indexes
CREATE INDEX IF NOT EXISTS idx_branch_location ON public.branch(location);
CREATE INDEX IF NOT EXISTS idx_branch_latitude ON public.branch(latitude);
CREATE INDEX IF NOT EXISTS idx_branch_longitude ON public.branch(longitude);
CREATE INDEX IF NOT EXISTS idx_branch_coordinates ON public.branch(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_branch_created_at ON public.branch(created_at);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_category_name ON public.category(category_name);

-- Role indexes
CREATE INDEX IF NOT EXISTS idx_role_name ON public.role(role_name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_centralized_product_branch_status ON public.centralized_product(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_centralized_product_branch_category ON public.centralized_product(branch_id, category_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_product_requisition_to_status ON public.product_requisition(request_to, status);

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_centralized_product_low_stock ON public.centralized_product(branch_id, quantity) 
WHERE quantity < 20 AND quantity > 0;

CREATE INDEX IF NOT EXISTS idx_centralized_product_out_of_stock ON public.centralized_product(branch_id, quantity) 
WHERE quantity = 0;

-- Note: Recent audit logs index removed due to NOW() not being immutable
-- Consider creating this index manually with a specific date if needed
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(timestamp) 
-- WHERE timestamp > '2024-01-01'::timestamp;

-- =============================================
-- DATA INTEGRITY CONSTRAINTS
-- =============================================

-- Add constraints for data integrity (safe for existing tables)
DO $$ 
BEGIN
    -- Add quantity constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_quantity_non_negative' 
        AND conrelid = 'public.centralized_product'::regclass
    ) THEN
        ALTER TABLE public.centralized_product 
        ADD CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0);
    END IF;

    -- Add reserved quantity constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_reserved_quantity_non_negative' 
        AND conrelid = 'public.centralized_product'::regclass
    ) THEN
        ALTER TABLE public.centralized_product 
        ADD CONSTRAINT chk_reserved_quantity_non_negative CHECK (reserved_quantity >= 0);
    END IF;

    -- Add price constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_price_positive' 
        AND conrelid = 'public.centralized_product'::regclass
    ) THEN
        ALTER TABLE public.centralized_product 
        ADD CONSTRAINT chk_price_positive CHECK (price > 0);
    END IF;

    -- Add latitude constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_latitude_range' 
        AND conrelid = 'public.branch'::regclass
    ) THEN
        ALTER TABLE public.branch 
        ADD CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
    END IF;

    -- Add longitude constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_longitude_range' 
        AND conrelid = 'public.branch'::regclass
    ) THEN
        ALTER TABLE public.branch 
        ADD CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
    END IF;

    -- Add coordinate consistency constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_coordinates_consistency' 
        AND conrelid = 'public.branch'::regclass
    ) THEN
        ALTER TABLE public.branch 
        ADD CONSTRAINT chk_coordinates_consistency CHECK (
            (latitude IS NULL AND longitude IS NULL) OR 
            (latitude IS NOT NULL AND longitude IS NOT NULL)
        );
    END IF;
END $$;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add function to automatically update product status based on quantity
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity = 0 THEN
        NEW.status = 'Out of Stock';
    ELSIF NEW.quantity < 20 THEN
        NEW.status = 'Low Stock';
    ELSE
        NEW.status = 'In Stock';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add function to validate reserved quantity doesn't exceed available quantity
CREATE OR REPLACE FUNCTION validate_reserved_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reserved_quantity > NEW.quantity THEN
        RAISE EXCEPTION 'Reserved quantity cannot exceed available quantity';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
)
RETURNS double precision AS $$
DECLARE
    earth_radius double precision := 6371; -- Earth's radius in kilometers
    dlat double precision;
    dlon double precision;
    a double precision;
    c double precision;
BEGIN
    -- Convert degrees to radians
    lat1 := radians(lat1);
    lon1 := radians(lon1);
    lat2 := radians(lat2);
    lon2 := radians(lon2);
    
    -- Calculate differences
    dlat := lat2 - lat1;
    dlon := lon2 - lon1;
    
    -- Haversine formula
    a := sin(dlat/2)^2 + cos(lat1) * cos(lat2) * sin(dlon/2)^2;
    c := 2 * asin(sqrt(a));
    
    RETURN earth_radius * c;
END;
$$ language 'plpgsql';

-- Add function to find nearby branches within a specified radius
CREATE OR REPLACE FUNCTION find_nearby_branches(
    target_lat double precision,
    target_lon double precision,
    radius_km double precision DEFAULT 50
)
RETURNS TABLE(
    branch_id integer,
    location text,
    address text,
    latitude double precision,
    longitude double precision,
    distance_km double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.location,
        b.address,
        b.latitude,
        b.longitude,
        calculate_distance(target_lat, target_lon, b.latitude, b.longitude) as distance_km
    FROM public.branch b
    WHERE b.latitude IS NOT NULL 
      AND b.longitude IS NOT NULL
      AND calculate_distance(target_lat, target_lon, b.latitude, b.longitude) <= radius_km
    ORDER BY distance_km;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================

-- Apply trigger to product_requisition table
DROP TRIGGER IF EXISTS update_product_requisition_updated_at ON public.product_requisition;
CREATE TRIGGER update_product_requisition_updated_at
    BEFORE UPDATE ON public.product_requisition
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to centralized_product table for status updates
DROP TRIGGER IF EXISTS update_centralized_product_status ON public.centralized_product;
CREATE TRIGGER update_centralized_product_status
    BEFORE INSERT OR UPDATE ON public.centralized_product
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status();

-- Apply trigger to centralized_product table for reservation validation
DROP TRIGGER IF EXISTS validate_centralized_product_reserved ON public.centralized_product;
CREATE TRIGGER validate_centralized_product_reserved
    BEFORE INSERT OR UPDATE ON public.centralized_product
    FOR EACH ROW
    EXECUTE FUNCTION validate_reserved_quantity();

-- =============================================
-- TABLE STATISTICS UPDATE
-- =============================================

-- =============================================
-- AUDIT TRAIL OVERVIEW VIEW
-- =============================================

-- Create a comprehensive audit trail overview view
CREATE OR REPLACE VIEW public.audit_trail_overview AS
SELECT 
    al.id,
    al.timestamp,
    al.action,
    al.description,
    al.entity_type,
    al.entity_id,
    al.ip_address,
    al.user_agent,
    al.notes,
    al.metadata,
    al.old_values,
    al.new_values,
    
    -- User information
    u.name as user_name,
    u.email as user_email,
    u.status as user_status,
    
    -- Role information
    r.role_name,
    
    -- Branch information
    b.location as branch_location,
    b.address as branch_address,
    
    -- Action categorization
    CASE 
        WHEN al.action LIKE '%LOGIN%' THEN 'Authentication'
        WHEN al.action LIKE '%PRODUCT%' THEN 'Product Management'
        WHEN al.action LIKE '%REQUEST%' THEN 'Request Management'
        WHEN al.action LIKE '%USER%' THEN 'User Management'
        WHEN al.action LIKE '%BRANCH%' THEN 'Branch Management'
        WHEN al.action LIKE '%CATEGORY%' THEN 'Category Management'
        ELSE 'Other'
    END as action_category,
    
    -- Severity level
    CASE 
        WHEN al.action LIKE '%DELETE%' OR al.action LIKE '%REMOVE%' THEN 'High'
        WHEN al.action LIKE '%UPDATE%' OR al.action LIKE '%EDIT%' THEN 'Medium'
        WHEN al.action LIKE '%CREATE%' OR al.action LIKE '%ADD%' THEN 'Low'
        WHEN al.action LIKE '%LOGIN%' OR al.action LIKE '%VIEW%' THEN 'Info'
        ELSE 'Medium'
    END as severity_level,
    
    -- Time-based information
    EXTRACT(EPOCH FROM (NOW() - al.timestamp)) as seconds_ago,
    CASE 
        WHEN al.timestamp > NOW() - INTERVAL '1 hour' THEN 'Just now'
        WHEN al.timestamp > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN al.timestamp > NOW() - INTERVAL '7 days' THEN 'This week'
        WHEN al.timestamp > NOW() - INTERVAL '30 days' THEN 'This month'
        ELSE 'Older'
    END as time_period

FROM public.audit_logs al
LEFT JOIN public.user u ON al.user_id = u.user_id
LEFT JOIN public.role r ON u.role_id = r.id
LEFT JOIN public.branch b ON u.branch_id = b.id
ORDER BY al.timestamp DESC;

-- Create detailed audit logs view (used by backend API)
-- Drop the view first if it exists to avoid column name conflicts
DROP VIEW IF EXISTS public.v_audit_logs_detailed CASCADE;

CREATE VIEW public.v_audit_logs_detailed AS
SELECT 
    al.id,
    al.user_id,
    al.action,
    al.description,
    al.metadata,
    al.entity_type,
    al.entity_id,
    al.ip_address,
    al.user_agent,
    al.old_values,
    al.new_values,
    al.notes,
    al.timestamp,
    al.created_at,
    
    -- User information
    u.name as user_name,
    u.email as user_email,
    u.status as user_status,
    u.branch_id,
    u.role_id,
    
    -- Role information
    r.role_name,
    r.id as role_table_id,
    
    -- Branch information
    b.location as branch_location,
    b.address as branch_address
    
FROM public.audit_logs al
LEFT JOIN public.user u ON al.user_id = u.user_id
LEFT JOIN public.role r ON u.role_id = r.id
LEFT JOIN public.branch b ON u.branch_id = b.id
ORDER BY al.timestamp DESC;

-- Create a summary view for dashboard statistics
CREATE OR REPLACE VIEW public.audit_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    action_category,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_type) as entity_types_affected
FROM public.audit_trail_overview
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), action_category
ORDER BY date DESC, action_count DESC;

-- =============================================
-- AVAILABLE STOCK VIEW
-- =============================================

-- Create a view for available stock information
CREATE OR REPLACE VIEW public.available_stock AS
SELECT
  centralized_product.id,
  centralized_product.product_name,
  centralized_product.quantity,
  centralized_product.reserved_quantity,
  centralized_product.quantity - COALESCE(centralized_product.reserved_quantity, 0::bigint) as available_quantity,
  centralized_product.price,
  centralized_product.status,
  centralized_product.category_id,
  centralized_product.branch_id,
  centralized_product.created_at    
FROM
  centralized_product
WHERE
  centralized_product.quantity > 0;

-- =============================================
-- BRANCH ANALYTICS VIEW
-- =============================================

-- Create a comprehensive branch analytics view
CREATE OR REPLACE VIEW public.branch_analytics AS
SELECT
    b.id as branch_id,
    b.location,
    b.address,
    b.latitude,
    b.longitude,
    b.map_snapshot_url,
    b.created_at,
    
    -- Product statistics
    COUNT(cp.id) as total_products,
    COUNT(CASE WHEN cp.status = 'In Stock' THEN 1 END) as in_stock_products,
    COUNT(CASE WHEN cp.status = 'Low Stock' THEN 1 END) as low_stock_products,
    COUNT(CASE WHEN cp.status = 'Out of Stock' THEN 1 END) as out_of_stock_products,
    COALESCE(SUM(cp.quantity), 0) as total_quantity,
    COALESCE(SUM(cp.reserved_quantity), 0) as total_reserved,
    COALESCE(SUM(cp.quantity - COALESCE(cp.reserved_quantity, 0)), 0) as available_quantity,
    COALESCE(AVG(cp.price), 0) as average_price,
    COALESCE(SUM(cp.quantity * cp.price), 0) as total_value,
    
    -- User statistics
    COUNT(DISTINCT u.user_id) as total_users,
    COUNT(CASE WHEN u.status = 'Active' THEN 1 END) as active_users,
    
    -- Request statistics
    COUNT(DISTINCT pr.request_id) as total_requests,
    COUNT(CASE WHEN pr.status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN pr.status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN pr.status = 'rejected' THEN 1 END) as rejected_requests,
    
    -- Recent activity
    MAX(pr.created_at) as last_request_date,
    MAX(cp.created_at) as last_product_added,
    MAX(al.timestamp) as last_activity

FROM public.branch b
LEFT JOIN public.centralized_product cp ON b.id = cp.branch_id
LEFT JOIN public.user u ON b.id = u.branch_id
LEFT JOIN public.product_requisition pr ON u.user_id = pr.request_from
LEFT JOIN public.audit_logs al ON u.user_id = al.user_id
GROUP BY b.id, b.location, b.address, b.latitude, b.longitude, b.map_snapshot_url, b.created_at
ORDER BY b.location;

-- =============================================
-- TABLE STATISTICS UPDATE
-- =============================================

-- Update table statistics for better query planning
ANALYZE public.user;
ANALYZE public.centralized_product;
ANALYZE public.audit_logs;
ANALYZE public.product_requisition;
ANALYZE public.product_requisition_items;
ANALYZE public.pending_user;
ANALYZE public.branch;
ANALYZE public.category;
ANALYZE public.role;