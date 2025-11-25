-- =============================================
-- STOCK DEDUCTION TRIGGER (Optional but Recommended)
-- Auto-deduct stock when sales are inserted into the database
-- This ensures consistency even if Python code fails
-- =============================================

-- Create function to deduct stock on sales insert
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sales()
RETURNS TRIGGER AS $$
DECLARE
    current_qty bigint;
    new_qty bigint;
BEGIN
    -- Get current quantity for the product/branch
    SELECT quantity INTO current_qty
    FROM public.centralized_product
    WHERE id = NEW.product_id
      AND branch_id = NEW.branch_id
    FOR UPDATE;
    
    -- If product not found, raise error
    IF current_qty IS NULL THEN
        RAISE EXCEPTION 'Product ID % not found in branch %', NEW.product_id, NEW.branch_id;
    END IF;
    
    -- Calculate new quantity
    new_qty := current_qty - NEW.quantity_sold;
    
    -- Check if there's enough stock
    IF new_qty < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
            NEW.product_id, current_qty, NEW.quantity_sold;
    END IF;
    
    -- Update stock in centralized_product
    UPDATE public.centralized_product
    SET quantity = new_qty,
        updated_at = NOW()
    WHERE id = NEW.product_id
      AND branch_id = NEW.branch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function after each sale insert
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sales_insert ON public.sales;

CREATE TRIGGER trigger_deduct_stock_on_sales_insert
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_stock_on_sales();

-- =============================================
-- VERIFICATION
-- =============================================

-- To verify the trigger is working:
-- 1. Check trigger exists:
--    SELECT trigger_name FROM information_schema.triggers 
--    WHERE event_object_table = 'sales' AND trigger_name = 'trigger_deduct_stock_on_sales_insert';
--
-- 2. Test with sample sale:
--    INSERT INTO public.sales (product_id, branch_id, quantity_sold, transaction_date)
--    VALUES (1, 1, 5, NOW())
--    RETURNING *;
--
-- 3. Verify stock was deducted:
--    SELECT id, quantity FROM public.centralized_product WHERE id = 1 AND branch_id = 1;
