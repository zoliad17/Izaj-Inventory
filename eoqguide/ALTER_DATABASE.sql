-- =============================================
-- ALTER DATABASE TABLES - Inventory Analytics Update
-- This script updates the inventory_analytics table to sync with centralized_product
-- =============================================

-- Step 1: Drop the v_inventory_health_summary view first (it depends on current_stock column)
DROP VIEW IF EXISTS public.v_inventory_health_summary CASCADE;

-- Step 2: Add updated_at column to inventory_analytics if it doesn't exist
ALTER TABLE public.inventory_analytics
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 3: Drop the current_stock column from inventory_analytics
-- Note: This column will no longer be needed as we'll get real-time stock from centralized_product
DO $$
BEGIN
    -- Check if current_stock column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_analytics' 
        AND column_name = 'current_stock'
    ) THEN
        ALTER TABLE public.inventory_analytics 
        DROP COLUMN current_stock;
    END IF;
END $$;

-- Step 4: Recreate the v_inventory_health_summary view to pull current stock from centralized_product

CREATE VIEW public.v_inventory_health_summary AS
SELECT 
    ia.product_id,
    cp.product_name,
    ia.branch_id,
    b.location,
    cp.quantity as current_stock,
    ia.avg_daily_usage,
    ia.stock_adequacy_days,
    ia.turnover_ratio,
    ia.stockout_risk_percentage,
    ia.recommendation,
    CASE 
        WHEN ia.stockout_risk_percentage >= 75 THEN 'CRITICAL'
        WHEN ia.stockout_risk_percentage >= 50 THEN 'HIGH'
        WHEN ia.stockout_risk_percentage >= 25 THEN 'MEDIUM'
        ELSE 'LOW'
    END as risk_level,
    ia.analysis_date,
    ia.created_at,
    ia.updated_at
FROM public.inventory_analytics ia
LEFT JOIN public.centralized_product cp ON ia.product_id = cp.id
LEFT JOIN public.branch b ON ia.branch_id = b.id
ORDER BY ia.analysis_date DESC, ia.stockout_risk_percentage DESC;

-- Step 4: Create trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_inventory_analytics_updated_at ON public.inventory_analytics;

CREATE TRIGGER update_inventory_analytics_updated_at
    BEFORE UPDATE ON public.inventory_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Update indexes for better performance on new queries
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_product_quantity 
ON public.inventory_analytics(product_id) 
WHERE stockout_risk_percentage > 0;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these queries to verify the changes:

-- Check table structure
-- SELECT * FROM information_schema.columns 
-- WHERE table_name = 'inventory_analytics' 
-- ORDER BY ordinal_position;

-- Check the new view structure
-- SELECT * FROM public.v_inventory_health_summary LIMIT 1;

-- Check trigger exists
-- SELECT * FROM information_schema.triggers 
-- WHERE trigger_name = 'update_inventory_analytics_updated_at';
