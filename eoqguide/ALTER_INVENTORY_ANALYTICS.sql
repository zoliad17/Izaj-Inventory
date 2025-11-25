-- Add missing current_stock column to inventory_analytics table
-- This column stores the actual current stock from centralized_product
-- reflecting the real inventory level at analysis time

ALTER TABLE public.inventory_analytics
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_product_branch 
ON public.inventory_analytics(product_id, branch_id);

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'inventory_analytics' AND column_name = 'current_stock';
