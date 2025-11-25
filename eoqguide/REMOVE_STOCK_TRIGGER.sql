-- =============================================
-- REMOVE STOCK DEDUCTION TRIGGER
-- This trigger is blocking CSV imports because it requires stock availability
-- We're handling stock deduction in the Python layer instead
-- =============================================

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sales_insert ON public.sales;

-- Optionally drop the function (if it's not used elsewhere)
DROP FUNCTION IF EXISTS public.deduct_stock_on_sales();

-- Verify the trigger has been removed
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_table = 'sales' AND trigger_name = 'trigger_deduct_stock_on_sales_insert';
