/**
 * Migration script to add Google Maps fields to the branch table
 * This script safely adds the new columns without affecting existing data
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local in the project root
const envPath = path.join(__dirname, '../../.env.local');
require('dotenv').config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Please check your environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBranchMapFields() {
    try {
        console.log('Starting migration: Adding Google Maps fields to branch table...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

        // Add new columns to branch table
        const { error: addColumnsError } = await supabase.rpc('exec_sql', {
            sql: `
        -- Add new columns if they don't exist
        DO $$ 
        BEGIN
            -- Add latitude column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'branch' 
                AND column_name = 'latitude'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.branch ADD COLUMN latitude double precision;
            END IF;

            -- Add longitude column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'branch' 
                AND column_name = 'longitude'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.branch ADD COLUMN longitude double precision;
            END IF;

            -- Add map_snapshot_url column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'branch' 
                AND column_name = 'map_snapshot_url'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.branch ADD COLUMN map_snapshot_url text;
            END IF;

            -- Add created_at column
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'branch' 
                AND column_name = 'created_at'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.branch ADD COLUMN created_at timestamp with time zone DEFAULT now();
            END IF;
        END $$;
      `
        });

        if (addColumnsError) {
            throw addColumnsError;
        }

        console.log('✅ Successfully added new columns to branch table');

        // Add indexes
        const { error: addIndexesError } = await supabase.rpc('exec_sql', {
            sql: `
        -- Add indexes for new columns
        CREATE INDEX IF NOT EXISTS idx_branch_latitude ON public.branch(latitude);
        CREATE INDEX IF NOT EXISTS idx_branch_longitude ON public.branch(longitude);
        CREATE INDEX IF NOT EXISTS idx_branch_coordinates ON public.branch(latitude, longitude);
        CREATE INDEX IF NOT EXISTS idx_branch_created_at ON public.branch(created_at);
      `
        });

        if (addIndexesError) {
            throw addIndexesError;
        }

        console.log('✅ Successfully added indexes for new columns');

        // Add constraints
        const { error: addConstraintsError } = await supabase.rpc('exec_sql', {
            sql: `
        -- Add constraints for data integrity
        DO $$ 
        BEGIN
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
      `
        });

        if (addConstraintsError) {
            throw addConstraintsError;
        }

        console.log('✅ Successfully added constraints for new columns');

        // Add utility functions
        const { error: addFunctionsError } = await supabase.rpc('exec_sql', {
            sql: `
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
      `
        });

        if (addFunctionsError) {
            throw addFunctionsError;
        }

        console.log('✅ Successfully added utility functions');

        // Create branch analytics view
        const { error: addViewError } = await supabase.rpc('exec_sql', {
            sql: `
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
      `
        });

        if (addViewError) {
            throw addViewError;
        }

        console.log('✅ Successfully created branch analytics view');

        // Update table statistics
        const { error: analyzeError } = await supabase.rpc('exec_sql', {
            sql: 'ANALYZE public.branch;'
        });

        if (analyzeError) {
            throw analyzeError;
        }

        console.log('✅ Successfully updated table statistics');

        console.log('\n🎉 Migration completed successfully!');
        console.log('\nNew features available:');
        console.log('- Interactive map picker for branch locations');
        console.log('- Automatic address geocoding');
        console.log('- Static map snapshot generation');
        console.log('- Distance calculation between branches');
        console.log('- Nearby branch search functionality');
        console.log('- Enhanced branch analytics with map data');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Run the migration
addBranchMapFields();
