import os
import logging
from datetime import datetime
from typing import Optional

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from typing import Iterable, Sequence, Any

# optional supabase client
try:
    from supabase import create_client
except Exception:
    create_client = None

# Load environment variables. Attempt `.env` first, then `.env.local` for overrides.
# Try multiple locations: current directory, analytics directory, and repo root
import pathlib

# Get the analytics directory (where this file is located)
analytics_dir = pathlib.Path(__file__).parent.absolute()
# Get the repo root (parent of analytics directory)
repo_root = analytics_dir.parent.absolute()

# Load .env files in order of precedence (later files override earlier ones)
env_files = [
    analytics_dir / '.env',           # analytics/.env
    repo_root / '.env',                # repo root .env
    analytics_dir / '.env.local',      # analytics/.env.local
    repo_root / '.env.local',          # repo root .env.local (highest priority)
]

# Initialize logger first (before using it)
logger = logging.getLogger(__name__)

for env_file in env_files:
    if env_file.exists():
        logger.info(f'Loading environment from: {env_file}')
        load_dotenv(env_file, override=True)
    else:
        logger.debug(f'Environment file not found: {env_file}')

SUPABASE_URL = os.getenv('SUPABASE_URL')
# Prefer SERVICE key for server-side writes; fall back to anon if only anon present
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
_supabase_client = None
logger.info('Supabase env present: url=%s, key=%s, supabase_pkg=%s', bool(os.getenv('SUPABASE_URL')), bool(os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')), bool(create_client))
if SUPABASE_URL and SUPABASE_KEY and create_client:
    try:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info('Supabase client initialized (url=%s, using_service_key=%s)', SUPABASE_URL, bool(os.getenv('SUPABASE_SERVICE_KEY')))
    except Exception:
        _supabase_client = None
        logger.exception('Failed to initialize Supabase client')


def get_conn():
    """Get a new psycopg2 connection using environment variables.

    Expects: ANALYTICS_DB_DSN or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
    """
    dsn = os.getenv('ANALYTICS_DB_DSN')
    if dsn:
        return psycopg2.connect(dsn)

    host = os.getenv('DB_HOST')
    port = os.getenv('DB_PORT', '5432')
    dbname = os.getenv('DB_NAME')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')

    if not (host and dbname and user):
        raise RuntimeError('Database configuration incomplete; set ANALYTICS_DB_DSN or DB_HOST/DB_NAME/DB_USER')

    return psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)


def deduct_stock_from_sales(tuples: list, conn):
    """Deduct stock from centralized_product when sales are inserted.
    
    tuples: list of tuples in format (product_id, branch_id, quantity_sold, ...)
    conn: psycopg2 connection object
    
    Validates that no product's quantity would go negative before making any updates.
    Raises ValueError if any deduction would result in negative stock.
    """
    if not tuples:
        return
    
    cur = None
    try:
        cur = conn.cursor()
        
        # Group sales by product_id and branch_id to aggregate quantities
        stock_deductions = {}
        for row in tuples:
            product_id = row[0]  # product_id
            branch_id = row[1]   # branch_id
            quantity_sold = row[2]  # quantity_sold
            
            if product_id is None or quantity_sold is None:
                continue
                
            key = (product_id, branch_id)
            if key not in stock_deductions:
                stock_deductions[key] = 0
            stock_deductions[key] += quantity_sold
        
        # VALIDATION: Check that no product would go negative
        negative_products = []
        for (product_id, branch_id), total_qty in stock_deductions.items():
            check_sql = '''
            SELECT quantity FROM public.centralized_product
            WHERE id = %s AND branch_id = %s
            '''
            cur.execute(check_sql, (product_id, branch_id))
            result = cur.fetchone()
            
            if result:
                current_qty = result[0]
                if current_qty - total_qty < 0:
                    negative_products.append({
                        'product_id': product_id,
                        'branch_id': branch_id,
                        'current_quantity': current_qty,
                        'quantity_to_deduct': total_qty,
                        'would_result_in': current_qty - total_qty
                    })
            else:
                # Product not found
                negative_products.append({
                    'product_id': product_id,
                    'branch_id': branch_id,
                    'current_quantity': 0,
                    'quantity_to_deduct': total_qty,
                    'would_result_in': -total_qty,
                    'error': 'Product not found'
                })
        
        if negative_products:
            error_msg = f'Stock deduction would result in negative quantities for {len(negative_products)} product(s): '
            details = []
            for p in negative_products:
                details.append(f"Product {p['product_id']} (Branch {p['branch_id']}): {p['current_quantity']} - {p['quantity_to_deduct']} = {p['would_result_in']}")
            error_msg += '; '.join(details)
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Update stock for each product/branch combination
        for (product_id, branch_id), total_qty in stock_deductions.items():
            update_sql = '''
            UPDATE public.centralized_product 
            SET quantity = quantity - %s,
                updated_at = NOW()
            WHERE id = %s AND branch_id = %s
            '''
            cur.execute(update_sql, (total_qty, product_id, branch_id))
            logger.info(f'Deducted {total_qty} units from product {product_id} (branch {branch_id})')
        
        # Commit the deductions
        conn.commit()
        logger.info(f'Stock deductions completed for {len(stock_deductions)} product/branch combinations')
        
    except Exception as e:
        logger.error(f'Error in deduct_stock_from_sales: {str(e)}')
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()


def insert_sales_rows(rows: Iterable[Sequence[Any]] | Iterable[dict], commit: bool = True):
    """Insert multiple sales rows into `public.sales`.

    rows: iterable of tuples matching (product_id, branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at, import_batch_id)
          or iterable of dicts matching column names when using Supabase client.
          import_batch_id is optional (can be None for backward compatibility).
    """
    rows_list = list(rows)
    if not rows_list:
        return 0

    # If Supabase client is configured, insert using REST client
    if _supabase_client:
        try:
            # convert tuple rows to dicts if needed
            payload = []
            for r in rows_list:
                if isinstance(r, dict):
                    payload.append(r)
                else:
                    # expected tuple order: product_id, branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at, import_batch_id (optional)
                    # Map our in-code field names to the DB schema: use `quantity_sold` and `transaction_date` as in schema.sql
                    # Coerce numeric types to match DB column types (bigint for ids/quantity)
                    prod = r[0]
                    br = r[1]
                    qty = r[2]
                    tdate = r[3]
                    uprice = r[4]
                    tamount = r[5]
                    pmethod = r[6]
                    created = r[7]
                    import_batch_id = r[8] if len(r) > 8 else None

                    # try to coerce product_id and branch_id to int when possible
                    try:
                        product_id_val = int(prod) if prod is not None else None
                    except Exception:
                        product_id_val = None
                    try:
                        branch_id_val = int(br) if br is not None else None
                    except Exception:
                        branch_id_val = None

                    # quantity_sold must be integer (bigint). coerce floats like 5.0 -> 5
                    try:
                        if qty is None:
                            quantity_val = None
                        else:
                            # handle numpy types or strings
                            quantity_val = int(float(qty))
                    except Exception:
                        quantity_val = None

                    # skip rows that cannot satisfy required not-null columns (product_id, quantity)
                    if product_id_val is None or quantity_val is None:
                        logger.warning('Skipping sales row due to missing product_id or quantity: %s', r)
                        continue

                    # unit_price and total_amount are NOT NULL - provide defaults
                    unit_price_val = 0.0
                    total_amount_val = 0.0
                    try:
                        if uprice is not None:
                            unit_price_val = float(uprice)
                    except (ValueError, TypeError):
                        unit_price_val = 0.0
                    try:
                        if tamount is not None:
                            total_amount_val = float(tamount)
                    except (ValueError, TypeError):
                        total_amount_val = 0.0
                    
                    # If total_amount is 0, calculate from unit_price * quantity
                    if total_amount_val == 0.0 and unit_price_val > 0:
                        total_amount_val = unit_price_val * quantity_val
                    
                    payload.append({
                        'product_id': product_id_val,
                        'branch_id': branch_id_val,
                        'quantity_sold': quantity_val,
                        'transaction_date': tdate.isoformat() if hasattr(tdate, 'isoformat') else tdate,
                        'unit_price': unit_price_val,
                        'total_amount': total_amount_val,
                        'payment_method': pmethod,
                        'created_at': created.isoformat() if hasattr(created, 'isoformat') else created,
                        'import_batch_id': import_batch_id
                    })

            if not payload:
                logger.info('No valid sales rows to insert to Supabase after coercion/validation')
                return 0

            resp = _supabase_client.table('sales').insert(payload).execute()
            # supabase-py returns an object with .error and .data in older versions; newer versions may vary
            resp_error = getattr(resp, 'error', None)
            resp_data = getattr(resp, 'data', None)
            if resp_error:
                logger.error('Supabase insert error: %s', resp_error)
                # Return detailed message for debugging
                raise RuntimeError(f'Supabase insert error: {resp_error}')
            inserted = len(resp_data or payload)
            logger.info('Inserted %d sales rows to Supabase (data length=%s)', inserted, len(resp_data) if resp_data is not None else 'N/A')
            
            # Deduct stock from centralized_product after successful insert
            if inserted > 0:
                try:
                    stock_deductions = {}
                    for item in payload:
                        product_id = item.get('product_id')
                        branch_id = item.get('branch_id')
                        quantity_sold = item.get('quantity_sold')
                        
                        if product_id is None or quantity_sold is None:
                            continue
                        
                        key = (product_id, branch_id)
                        if key not in stock_deductions:
                            stock_deductions[key] = 0
                        stock_deductions[key] += quantity_sold
                    
                    # VALIDATION: Check that no product would go negative before updating
                    negative_products = []
                    for (product_id, branch_id), total_qty in stock_deductions.items():
                        try:
                            resp = _supabase_client.table('centralized_product').select('quantity').eq('id', product_id).eq('branch_id', branch_id).execute()
                            if resp.data:
                                current_qty = resp.data[0].get('quantity', 0)
                                if current_qty - total_qty < 0:
                                    negative_products.append({
                                        'product_id': product_id,
                                        'branch_id': branch_id,
                                        'current_quantity': current_qty,
                                        'quantity_to_deduct': total_qty,
                                        'would_result_in': current_qty - total_qty
                                    })
                            else:
                                # Product not found - also invalid
                                negative_products.append({
                                    'product_id': product_id,
                                    'branch_id': branch_id,
                                    'current_quantity': 0,
                                    'quantity_to_deduct': total_qty,
                                    'would_result_in': -total_qty,
                                    'error': 'Product not found'
                                })
                        except Exception as e:
                            logger.error(f'Error checking stock for product {product_id} branch {branch_id}: {str(e)}')
                            raise
                    
                    if negative_products:
                        error_msg = f'Stock deduction would result in negative quantities for {len(negative_products)} product(s): '
                        details = []
                        for p in negative_products:
                            details.append(f"Product {p['product_id']} (Branch {p['branch_id']}): {p['current_quantity']} - {p['quantity_to_deduct']} = {p['would_result_in']}")
                        error_msg += '; '.join(details)
                        logger.error(error_msg)
                        # Delete the inserted sales rows since we can't deduct stock
                        try:
                            for item in payload:
                                product_id = item.get('product_id')
                                branch_id = item.get('branch_id')
                                quantity_sold = item.get('quantity_sold')
                                transaction_date = item.get('transaction_date')
                                if product_id and quantity_sold and transaction_date:
                                    _supabase_client.table('sales').delete().eq('product_id', product_id).eq('branch_id', branch_id).eq('quantity_sold', quantity_sold).eq('transaction_date', transaction_date).execute()
                        except Exception as e:
                            logger.error(f'Error cleaning up inserted sales: {str(e)}')
                        raise ValueError(error_msg)
                    
                    # Update stock via Supabase - all validations passed
                    for (product_id, branch_id), total_qty in stock_deductions.items():
                        try:
                            resp = _supabase_client.table('centralized_product').select('quantity').eq('id', product_id).eq('branch_id', branch_id).execute()
                            if resp.data:
                                current_qty = resp.data[0].get('quantity', 0)
                                new_qty = current_qty - total_qty
                                
                                # Update via Supabase
                                update_resp = _supabase_client.table('centralized_product').update({
                                    'quantity': new_qty,
                                    'updated_at': datetime.utcnow().isoformat()
                                }).eq('id', product_id).eq('branch_id', branch_id).execute()
                                
                                logger.info(f'Deducted {total_qty} units from product {product_id} (branch {branch_id}) via Supabase: {current_qty} -> {new_qty}')
                            else:
                                logger.warning(f'Product {product_id} branch {branch_id} not found in centralized_product')
                        except Exception as e:
                            logger.error(f'Error deducting stock for product {product_id} branch {branch_id}: {str(e)}')
                            raise
                except Exception as e:
                    logger.error(f'Error in stock deduction batch: {str(e)}', exc_info=True)
                    raise
            
            return inserted
        except Exception:
            logger.exception('Failed to insert sales rows to Supabase')
            raise

    # Fallback to psycopg2 bulk insert
    insert_sql = '''
    INSERT INTO public.sales (
        product_id, branch_id, quantity_sold, transaction_date, unit_price, total_amount, payment_method, created_at, import_batch_id
    ) VALUES %s
    RETURNING id
    '''

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        # if dicts provided, map to tuples
        tuples = []
        skipped = 0
        for r in rows_list:
            if isinstance(r, dict):
                prod = r.get('product_id')
                br = r.get('branch_id')
                qty = r.get('quantity_sold') if r.get('quantity_sold') is not None else r.get('quantity')
                try:
                    product_id_val = int(prod) if prod is not None else None
                except Exception:
                    product_id_val = None
                try:
                    branch_id_val = int(br) if br is not None else None
                except Exception:
                    branch_id_val = None
                try:
                    quantity_val = int(float(qty)) if qty is not None else None
                except Exception:
                    quantity_val = None
                if product_id_val is None or quantity_val is None:
                    skipped += 1
                    logger.warning('Skipping sales dict row due to missing product_id or quantity: %s', r)
                    continue
                # unit_price and total_amount are NOT NULL - provide defaults
                unit_price_val = 0.0
                total_amount_val = 0.0
                try:
                    if r.get('unit_price') is not None:
                        unit_price_val = float(r.get('unit_price'))
                except (ValueError, TypeError):
                    unit_price_val = 0.0
                try:
                    if r.get('total_amount') is not None:
                        total_amount_val = float(r.get('total_amount'))
                except (ValueError, TypeError):
                    total_amount_val = 0.0
                
                # If total_amount is 0, calculate from unit_price * quantity
                if total_amount_val == 0.0 and unit_price_val > 0:
                    total_amount_val = unit_price_val * quantity_val
                
                tuples.append((
                    product_id_val,
                    branch_id_val,
                    quantity_val,
                    r.get('transaction_date'),
                    unit_price_val,
                    total_amount_val,
                    r.get('payment_method'),
                    r.get('created_at'),
                    r.get('import_batch_id')
                ))
            else:
                # tuple path: coerce elements similarly
                # Handle both old format (8 elements) and new format (9 elements with import_batch_id)
                if len(r) >= 9:
                    prod, br, qty, tdate, uprice, tamount, pmethod, created, import_batch_id = r[:9]
                else:
                    prod, br, qty, tdate, uprice, tamount, pmethod, created = r[:8]
                    import_batch_id = None
                try:
                    product_id_val = int(prod) if prod is not None else None
                except Exception:
                    product_id_val = None
                try:
                    branch_id_val = int(br) if br is not None else None
                except Exception:
                    branch_id_val = None
                try:
                    quantity_val = int(float(qty)) if qty is not None else None
                except Exception:
                    quantity_val = None
                if product_id_val is None or quantity_val is None:
                    skipped += 1
                    logger.warning('Skipping sales tuple row due to missing product_id or quantity: %s', r)
                    continue
                tuples.append((product_id_val, branch_id_val, quantity_val, tdate, float(uprice) if uprice is not None else None, float(tamount) if tamount is not None else None, pmethod, created, import_batch_id))

        if not tuples:
            logger.info('No valid sales rows to insert (psycopg2) after coercion; skipped %d rows', skipped)
            return 0
        execute_values(cur, insert_sql, tuples, template=None, page_size=100)
        inserted = cur.rowcount
        
        # Deduct stock from centralized_product for each sale
        if inserted > 0:
            try:
                deduct_stock_from_sales(tuples, conn)
            except Exception as e:
                logger.error(f'Error deducting stock: {str(e)}')
                if commit:
                    conn.rollback()
                raise
        
        if commit:
            conn.commit()
        logger.info(f'Inserted {inserted} sales rows (psycopg2)')
        return inserted
    except Exception as e:
        if conn:
            conn.rollback()
        logger.exception('Failed to insert sales rows')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def insert_eoq_calculation(product_id: int, branch_id: int, result: dict):
    """Persist EOQ calculation into `public.eoq_calculations` using UPSERT.

    result: dictionary containing EOQ values produced by EOQCalculator
           Must include: annual_demand, holding_cost, ordering_cost, unit_cost,
                        eoq_quantity, reorder_point, safety_stock, etc.
           Optional: status (defaults to 'valid'), reason (for invalid inputs)
    
    Validates that product exists in centralized_product before inserting.
    Uses ON CONFLICT to update existing records based on (product_id, branch_id).
    """
    # Note: We attempt to save EOQ even if product doesn't exist in centralized_product
    # The foreign key constraint will handle validation. This allows EOQ to be saved
    # for products that may be added later or for forecasting purposes.
    product_exists = False
    if _supabase_client:
        try:
            # Check if product exists (for logging only, don't block insertion)
            resp = _supabase_client.table('centralized_product').select('id').eq('id', product_id).eq('branch_id', branch_id).execute()
            product_exists = bool(getattr(resp, 'data', None))
            if not product_exists:
                logger.warning('Product %s branch %s not found in centralized_product. Will attempt EOQ insertion anyway (FK constraint will validate).', product_id, branch_id)
        except Exception as e:
            logger.warning('Could not validate product existence: %s. Will attempt EOQ insertion anyway.', str(e))
    else:
        # For psycopg2, check product exists (for logging only)
        try:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute('SELECT id FROM centralized_product WHERE id = %s AND branch_id = %s LIMIT 1', (product_id, branch_id))
            product_exists = bool(cur.fetchone())
            if not product_exists:
                logger.warning('Product %s branch %s not found in centralized_product. Will attempt EOQ insertion anyway (FK constraint will validate).', product_id, branch_id)
            cur.close()
            conn.close()
        except Exception as e:
            logger.warning('Could not validate product existence: %s. Will attempt EOQ insertion anyway.', str(e))
    
    # Use UPSERT with ON CONFLICT to update existing records
    sql = '''
    INSERT INTO public.eoq_calculations (
        product_id, branch_id, annual_demand, holding_cost, ordering_cost, unit_cost,
        eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, 
        calculated_at, valid_until, status, reason
    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (product_id, branch_id) 
    DO UPDATE SET
        annual_demand = EXCLUDED.annual_demand,
        holding_cost = EXCLUDED.holding_cost,
        ordering_cost = EXCLUDED.ordering_cost,
        unit_cost = EXCLUDED.unit_cost,
        eoq_quantity = EXCLUDED.eoq_quantity,
        reorder_point = EXCLUDED.reorder_point,
        safety_stock = EXCLUDED.safety_stock,
        lead_time_days = EXCLUDED.lead_time_days,
        confidence_level = EXCLUDED.confidence_level,
        calculated_at = EXCLUDED.calculated_at,
        valid_until = EXCLUDED.valid_until,
        status = EXCLUDED.status,
        reason = EXCLUDED.reason
    '''

    now = datetime.utcnow()
    valid_until = now.replace(year=now.year + 1)
    
    # Extract values with defaults
    annual_demand = result.get('annual_demand') or 0
    holding_cost = result.get('holding_cost') or result.get('annual_holding_cost') or 50
    ordering_cost = result.get('ordering_cost') or result.get('annual_ordering_cost') or 100
    unit_cost = result.get('unit_cost') or 0
    status = result.get('status', 'valid')
    reason = result.get('reason')

    params = (
        product_id,
        branch_id,
        annual_demand,
        holding_cost,
        ordering_cost,
        unit_cost,
        result.get('eoq_quantity'),
        result.get('reorder_point'),
        result.get('safety_stock'),
        result.get('lead_time_days') or 7,
        result.get('confidence_level') or 0.95,
        now,
        valid_until,
        status,
        reason
    )

    # If Supabase is configured, use it
    if _supabase_client:
        try:
                    # Map our EOQ result to the actual DB schema for `eoq_calculations`.
                    # The project's schema expects: annual_demand, holding_cost, ordering_cost, unit_cost,
                    # eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, calculated_at, valid_until
                    payload = {
                        'product_id': product_id,
                        'branch_id': branch_id,
                        'annual_demand': annual_demand,
                        'holding_cost': holding_cost,
                        'ordering_cost': ordering_cost,
                        'unit_cost': unit_cost,
                        'eoq_quantity': result.get('eoq_quantity'),
                        'reorder_point': result.get('reorder_point'),
                        'safety_stock': result.get('safety_stock'),
                        'lead_time_days': result.get('lead_time_days') or result.get('lead_time') or 7,
                        'confidence_level': result.get('confidence_level') or 0.95,
                        'calculated_at': now.isoformat(),
                        'valid_until': valid_until.isoformat(),
                        'status': status,
                        'reason': reason
                    }
                    # Use upsert for Supabase (insert with on_conflict)
                    resp = _supabase_client.table('eoq_calculations').upsert(
                        payload,
                        on_conflict='product_id,branch_id'
                    ).execute()
                    if getattr(resp, 'error', None):
                        logger.error('Supabase EOQ insert error: %s', getattr(resp, 'error', None))
                        raise RuntimeError(str(getattr(resp, 'error', None)))
                    logger.info('Stored EOQ calculation for product %s branch %s in Supabase', product_id, branch_id)
                    return
        except Exception:
            logger.exception('Failed to store EOQ calculation to Supabase')
            raise

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        logger.info(f'Stored EOQ calculation for product {product_id} branch {branch_id}')
    except Exception:
        if conn:
            conn.rollback()
        logger.exception('Failed to store EOQ calculation')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_eoq_calculations(limit: int = 100, branch_id: int | None = None):
    """Fetch recent EOQ calculations from DB. Returns list of dicts.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    if _supabase_client:
        try:
            query = _supabase_client.table('eoq_calculations').select('*').order('calculated_at', desc=True)
            if branch_id is not None:
                query = query.eq('branch_id', branch_id)
            resp = query.limit(limit).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch eoq error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return getattr(resp, 'data', []) or []
        except Exception as e:
            logger.exception('Failed to fetch EOQ calculations from Supabase: %s', str(e))
            # Fall through to psycopg2 path if Supabase fails
            logger.info('Falling back to psycopg2 connection')

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_id is not None:
            cur.execute("SELECT id, product_id, branch_id, annual_demand, holding_cost, ordering_cost, unit_cost, eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, calculated_at, valid_until FROM public.eoq_calculations WHERE branch_id = %s ORDER BY calculated_at DESC LIMIT %s", (branch_id, limit))
        else:
            cur.execute("SELECT id, product_id, branch_id, annual_demand, holding_cost, ordering_cost, unit_cost, eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, calculated_at, valid_until FROM public.eoq_calculations ORDER BY calculated_at DESC LIMIT %s", (limit,))
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        results = [dict(zip(cols, r)) for r in rows]
        return results
    except (RuntimeError, Exception) as e:
        # Catch all database errors (connection failures, configuration errors, etc.)
        error_msg = str(e)
        if 'Database configuration incomplete' in error_msg:
            logger.warning('Database not configured, returning empty EOQ calculations list')
        else:
            logger.warning('Database connection failed (%s), returning empty EOQ calculations list', error_msg)
        # Return empty list to prevent frontend crash
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_sales_summary(days: int = 30, branch_id: int | None = None):
    """Return aggregated sales metrics over the last `days` days.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    if _supabase_client:
        try:
            # PostgREST aggregate queries can be fragile across client versions.
            # Instead fetch recent rows and aggregate in Python to ensure compatibility.
            from datetime import datetime, timedelta
            from_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
            # fetch up to a reasonable number of rows for aggregation
            query = _supabase_client.table('sales').select('quantity_sold,transaction_date').gte('transaction_date', from_date)
            if branch_id is not None:
                query = query.eq('branch_id', branch_id)
            resp = query.limit(10000).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch sales rows error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            rows = getattr(resp, 'data', []) or []
            if not rows:
                return {'total_quantity': 0.0, 'records': 0, 'average_daily': 0.0, 'days_of_data': days, 'date_range': {'start': None, 'end': None}}

            total_quantity = 0.0
            records = 0
            min_date = None
            max_date = None
            for r in rows:
                q = r.get('quantity_sold')
                try:
                    qf = float(q) if q is not None else 0.0
                except Exception:
                    qf = 0.0
                total_quantity += qf
                records += 1
                td = r.get('transaction_date')
                # transaction_date may be an ISO string; keep min/max as strings
                if td:
                    if min_date is None or td < min_date:
                        min_date = td
                    if max_date is None or td > max_date:
                        max_date = td

            average_daily = (total_quantity / days) if days > 0 else 0
            return {
                'total_quantity': total_quantity,
                'records': records,
                'average_daily': average_daily,
                'days_of_data': days,
                'date_range': {'start': min_date, 'end': max_date},
            }
        except Exception as e:
            logger.exception('Failed to fetch sales summary from Supabase: %s', str(e))
            # Fall through to psycopg2 path if Supabase fails
            logger.info('Falling back to psycopg2 connection')

    # psycopg2 fallback
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_id is not None:
            cur.execute("SELECT SUM(quantity_sold) as total_quantity, COUNT(id) as records, MIN(transaction_date) as start_date, MAX(transaction_date) as end_date FROM public.sales WHERE transaction_date >= (CURRENT_DATE - %s::int) AND branch_id = %s", (days, branch_id))
        else:
            cur.execute("SELECT SUM(quantity_sold) as total_quantity, COUNT(id) as records, MIN(transaction_date) as start_date, MAX(transaction_date) as end_date FROM public.sales WHERE transaction_date >= (CURRENT_DATE - %s::int)", (days,))
        row = cur.fetchone()
        total_quantity = float(row[0] or 0)
        records = int(row[1] or 0)
        start = row[2].isoformat() if row[2] else None
        end = row[3].isoformat() if row[3] else None
        days_of_data = days
        average_daily = (total_quantity / days_of_data) if days_of_data > 0 else 0
        return {
            'total_quantity': total_quantity,
            'records': records,
            'average_daily': average_daily,
            'days_of_data': days_of_data,
            'date_range': {'start': start, 'end': end},
        }
    except (RuntimeError, Exception) as e:
        # Catch all database errors (connection failures, configuration errors, etc.)
        error_msg = str(e)
        if 'Database configuration incomplete' in error_msg:
            logger.warning('Database not configured, returning empty sales summary')
        else:
            logger.warning('Database connection failed (%s), returning empty sales summary', error_msg)
        # Return empty summary to prevent frontend crash
        return {'total_quantity': 0.0, 'records': 0, 'average_daily': 0.0, 'days_of_data': days, 'date_range': {'start': None, 'end': None}}
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def insert_product_demand_history(entries: Iterable[dict]):
    """Insert aggregated product demand history rows.

    entries: iterable of dicts with keys: product_id, branch_id, period_date (date or iso string), quantity_sold, revenue, avg_price, source
    """
    rows = list(entries)
    if not rows:
        return 0

    if _supabase_client:
        try:
            # Clean rows: replace NaN values with 0 or None for JSON compatibility
            import math
            cleaned_rows = []
            for row in rows:
                cleaned = {}
                for key, value in row.items():
                    if isinstance(value, float):
                        if math.isnan(value):
                            cleaned[key] = 0.0 if key in ['revenue', 'avg_price'] else None
                        else:
                            cleaned[key] = value
                    else:
                        cleaned[key] = value
                cleaned_rows.append(cleaned)
            
            # Use UPSERT with ON CONFLICT for product_demand_history
            resp = _supabase_client.table('product_demand_history').upsert(
                cleaned_rows,
                on_conflict='product_id,branch_id,period_date'
            ).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase upsert product_demand_history error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return len(getattr(resp, 'data', []) or cleaned_rows)
        except Exception:
            logger.exception('Failed to insert product_demand_history to Supabase')
            raise

    # psycopg2 fallback
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        # Clean rows: replace NaN values with 0 or None
        import math
        cleaned_rows = []
        for row in rows:
            cleaned = []
            for i, value in enumerate(row):
                if isinstance(value, float) and math.isnan(value):
                    # revenue and avg_price should be 0.0, others can be None
                    if i in [3, 4]:  # revenue, avg_price positions
                        cleaned.append(0.0)
                    else:
                        cleaned.append(None)
                else:
                    cleaned.append(value)
            cleaned_rows.append(tuple(cleaned))
        
        insert_sql = '''
        INSERT INTO public.product_demand_history (product_id, branch_id, period_date, quantity_sold, revenue, avg_price, source, created_at)
        VALUES %s
        ON CONFLICT (product_id, branch_id, period_date) DO UPDATE SET quantity_sold = EXCLUDED.quantity_sold, revenue = EXCLUDED.revenue, avg_price = EXCLUDED.avg_price, created_at = EXCLUDED.created_at
        '''
        tuples = []
        import math
        for e in rows:
            # Clean NaN values
            revenue = e.get('revenue', 0.0)
            avg_price = e.get('avg_price', 0.0)
            if isinstance(revenue, float) and math.isnan(revenue):
                revenue = 0.0
            if isinstance(avg_price, float) and math.isnan(avg_price):
                avg_price = 0.0
            
            period_date = e.get('period_date')
            if isinstance(period_date, str):
                # Already a string, use as-is
                pass
            elif hasattr(period_date, 'isoformat'):
                period_date = period_date.isoformat()
            else:
                period_date = str(period_date)
            tuples.append((
                int(e.get('product_id')),
                int(e.get('branch_id')),
                period_date,
                int(float(e.get('quantity_sold') or 0)),
                float(revenue),
                float(avg_price),
                e.get('source') or 'bitpos_import',
                datetime.utcnow()
            ))
        execute_values(cur, insert_sql, tuples, template=None, page_size=100)
        if conn:
            conn.commit()
        return cur.rowcount
    except Exception:
        if conn:
            conn.rollback()
        logger.exception('Failed to insert product_demand_history')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def insert_sales_forecasts(entries: Iterable[dict]):
    """Insert simple sales forecast rows into `sales_forecast`.

    entries: iterable of dicts with keys: product_id, branch_id, forecast_month (date), forecasted_quantity, confidence_interval_lower, confidence_interval_upper, forecast_method
    """
    rows = list(entries)
    if not rows:
        return 0

    if _supabase_client:
        try:
            resp = _supabase_client.table('sales_forecast').insert(rows).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase insert sales_forecast error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return len(getattr(resp, 'data', []) or rows)
        except Exception:
            logger.exception('Failed to insert sales_forecast to Supabase')
            raise

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        insert_sql = '''
        INSERT INTO public.sales_forecast (product_id, branch_id, forecast_month, forecasted_quantity, confidence_interval_lower, confidence_interval_upper, forecast_method, created_at)
        VALUES %s
        '''
        tuples = []
        for e in rows:
            tuples.append((
                int(e.get('product_id')),
                int(e.get('branch_id')),
                e.get('forecast_month'),
                float(e.get('forecasted_quantity') or 0.0),
                float(e.get('confidence_interval_lower') or 0.0),
                float(e.get('confidence_interval_upper') or 0.0),
                e.get('forecast_method') or 'simple_projection',
                datetime.utcnow()
            ))
        execute_values(cur, insert_sql, tuples, template=None, page_size=100)
        if conn:
            conn.commit()
        return cur.rowcount
    except Exception:
        if conn:
            conn.rollback()
        logger.exception('Failed to insert sales_forecast')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def insert_inventory_analytics(entries: Iterable[dict]):
    """Insert inventory analytics summary rows into `inventory_analytics`.

    entries: iterable of dicts with keys: product_id, branch_id, analysis_date, current_stock, avg_daily_usage, stock_adequacy_days, turnover_ratio, carrying_cost, stockout_risk_percentage, recommendation
    """
    rows = list(entries)
    if not rows:
        return 0

    if _supabase_client:
        try:
            # Prepare rows - normalize current_stock, but exclude it from insert if column doesn't exist
            normalized_rows = []
            for e in rows:
                normalized = dict(e)
                # Keep current_stock for local processing, but may remove from Supabase insert
                current_stock_val = normalized.get('current_stock')
                if current_stock_val is None:
                    normalized['current_stock'] = 0
                else:
                    try:
                        normalized['current_stock'] = int(current_stock_val)
                    except (ValueError, TypeError):
                        normalized['current_stock'] = 0
                # Replace NaN values with 0 for JSON compatibility
                for key, value in normalized.items():
                    if isinstance(value, float) and (pd.isna(value) if 'pd' in globals() else (value != value)):
                        normalized[key] = 0.0
                normalized_rows.append(normalized)
            
            # Use UPSERT with ON CONFLICT for inventory_analytics
            try:
                resp = _supabase_client.table('inventory_analytics').upsert(
                    normalized_rows,
                    on_conflict='product_id,branch_id,analysis_date'
                ).execute()
                if getattr(resp, 'error', None):
                    logger.error('Supabase upsert inventory_analytics error: %s', getattr(resp, 'error', None))
                    raise RuntimeError(str(getattr(resp, 'error', None)))
                return len(getattr(resp, 'data', []) or normalized_rows)
            except Exception as e:
                # If column doesn't exist, try without current_stock
                if 'current_stock' in str(e):
                    logger.warning('current_stock column not found, inserting without it. Please run: ALTER TABLE inventory_analytics ADD COLUMN current_stock INTEGER DEFAULT 0;')
                    # Remove current_stock from all rows
                    for row in normalized_rows:
                        row.pop('current_stock', None)
                    resp = _supabase_client.table('inventory_analytics').insert(normalized_rows).execute()
                    return len(getattr(resp, 'data', []) or normalized_rows)
                else:
                    raise
        except Exception:
            logger.exception('Failed to insert inventory_analytics to Supabase')
            raise

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        insert_sql = '''
        INSERT INTO public.inventory_analytics (product_id, branch_id, analysis_date, current_stock, avg_daily_usage, stock_adequacy_days, turnover_ratio, carrying_cost, stockout_risk_percentage, recommendation, created_at)
        VALUES %s
        ON CONFLICT (product_id, branch_id, analysis_date) DO UPDATE SET
            avg_daily_usage = EXCLUDED.avg_daily_usage,
            stock_adequacy_days = EXCLUDED.stock_adequacy_days,
            turnover_ratio = EXCLUDED.turnover_ratio,
            carrying_cost = EXCLUDED.carrying_cost,
            stockout_risk_percentage = EXCLUDED.stockout_risk_percentage,
            recommendation = EXCLUDED.recommendation,
            updated_at = EXCLUDED.updated_at
        '''
        tuples = []
        for e in rows:
            # Ensure current_stock is always a number (0 if None or missing)
            current_stock_val = e.get('current_stock')
            if current_stock_val is None:
                current_stock_val = 0
            else:
                try:
                    current_stock_val = int(current_stock_val)
                except (ValueError, TypeError):
                    current_stock_val = 0
            
            tuples.append((
                int(e.get('product_id')),
                int(e.get('branch_id')),
                e.get('analysis_date'),
                current_stock_val,  # Always a number, never None
                float(e.get('avg_daily_usage') or 0.0),
                int(e.get('stock_adequacy_days')) if e.get('stock_adequacy_days') is not None else None,
                float(e.get('turnover_ratio') or 0.0),
                float(e.get('carrying_cost') or 0.0),
                float(e.get('stockout_risk_percentage') or 0.0),
                e.get('recommendation'),
                datetime.utcnow()
            ))
        execute_values(cur, insert_sql, tuples, template=None, page_size=100)
        if conn:
            conn.commit()
        return cur.rowcount
    except Exception:
        if conn:
            conn.rollback()
        logger.exception('Failed to insert inventory_analytics')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_product_names(product_ids: Iterable[int]):
    """Return a mapping of product_id -> product_name for given ids.

    Attempts to read `name`, `product_name`, or `title` fields from `centralized_product`.
    """
    ids = list(set(int(x) for x in product_ids if x is not None))
    if not ids:
        return {}

    # Supabase path
    if _supabase_client:
        try:
            # select all columns to avoid PostgREST errors when a specific column
            # (e.g. `name`) may not exist in the table schema for some projects
            resp = _supabase_client.table('centralized_product').select('*').in_('id', ids).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch centralized_product error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            rows = getattr(resp, 'data', []) or []
            mapping = {}
            # prefer common name-like fields if present
            name_candidates = ('product_name', 'title', 'name', 'product', 'label', 'display_name')
            for r in rows:
                pid = r.get('id')
                name = None
                for k in name_candidates:
                    v = r.get(k)
                    if v:
                        name = v
                        break
                mapping[int(pid)] = name
            return mapping
        except Exception:
            logger.exception('Failed to fetch product names from Supabase')
            # fall through to SQL path

    # psycopg2 path - coalesce only columns that are expected to exist
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        # avoid referencing `name` if it doesn't exist; prefer `product_name` then `title`
        cur.execute("SELECT id, COALESCE(product_name, title) as product_name FROM public.centralized_product WHERE id = ANY(%s)", (ids,))
        rows = cur.fetchall()
        mapping = {int(r[0]): (r[1] if r[1] is not None else None) for r in rows}
        return mapping
    except Exception:
        logger.exception('Failed to fetch product names from Postgres')
        return {}
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_product_id_by_name(product_name: str, branch_id: int = None):
    """Return product_id for a given product name.
    
    Searches for product_name field with exact match (case-insensitive).
    If branch_id is provided, also filters by branch_id.
    Returns the first matching product_id, or None if not found.
    """
    if not product_name:
        return None
    
    # Supabase path
    if _supabase_client:
        try:
            query = _supabase_client.table('centralized_product').select('id, branch_id, product_name')
            
            # For Supabase, fetch all and filter in Python
            resp = query.execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch centralized_product error: %s', getattr(resp, 'error', None))
                return None
            rows = getattr(resp, 'data', []) or []
            for r in rows:
                # Check if branch_id matches (if provided)
                if branch_id is not None:
                    if int(r.get('branch_id', 0)) != int(branch_id):
                        continue
                # Check product_name field (case-insensitive)
                if r.get('product_name') and str(r.get('product_name')).strip().lower() == str(product_name).strip().lower():
                    logger.info(f'Found product_id {r.get("id")} for product_name "{product_name}"')
                    return int(r.get('id'))
            logger.warning(f'No product found for name "{product_name}" in branch {branch_id}')
            return None
        except Exception as e:
            logger.exception('Failed to fetch product_id by name from Supabase: %s', str(e))
            return None
    
    # psycopg2 path
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        # Search in product_name field using ILIKE for case-insensitive matching
        if branch_id is not None:
            cur.execute("""
                SELECT id FROM public.centralized_product 
                WHERE branch_id = %s 
                AND LOWER(COALESCE(product_name, '')) = LOWER(%s)
                LIMIT 1
            """, (branch_id, product_name))
        else:
            cur.execute("""
                SELECT id FROM public.centralized_product 
                WHERE LOWER(COALESCE(product_name, '')) = LOWER(%s)
                LIMIT 1
            """, (product_name,))
        row = cur.fetchone()
        if row:
            logger.info(f'Found product_id {row[0]} for product_name "{product_name}"')
            return int(row[0])
        logger.warning(f'No product found for name "{product_name}" in branch {branch_id}')
        return None
    except Exception as e:
        logger.exception('Failed to fetch product_id by name from Postgres: %s', str(e))
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def validate_products_exist(product_ids: Iterable[int], branch_ids: Iterable[int] = None):
    """Return a set of (product_id, branch_id) tuples that exist in centralized_product.
    
    Used to filter sales data to only include products that exist in the database.
    Returns set of (product_id, branch_id) tuples.
    """
    ids = list(set(int(x) for x in product_ids if x is not None))
    if not ids:
        return set()
    
    branch_filter = None
    if branch_ids:
        branch_filter = list(set(int(x) for x in branch_ids if x is not None))
        if not branch_filter:
            return set()

    # Supabase path
    if _supabase_client:
        try:
            query = _supabase_client.table('centralized_product').select('id, branch_id')
            query = query.in_('id', ids)
            if branch_filter:
                query = query.in_('branch_id', branch_filter)
            resp = query.execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch centralized_product validation error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            rows = getattr(resp, 'data', []) or []
            valid_products = set()
            for r in rows:
                pid = int(r.get('id'))
                bid = int(r.get('branch_id'))
                valid_products.add((pid, bid))
            return valid_products
        except Exception:
            logger.exception('Failed to validate products from Supabase')
            # fall through to SQL path

    # psycopg2 path
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_filter:
            cur.execute(
                "SELECT id, branch_id FROM public.centralized_product WHERE id = ANY(%s) AND branch_id = ANY(%s)",
                (ids, branch_filter)
            )
        else:
            cur.execute(
                "SELECT id, branch_id FROM public.centralized_product WHERE id = ANY(%s)",
                (ids,)
            )
        rows = cur.fetchall()
        valid_products = set()
        for row in rows:
            valid_products.add((int(row[0]), int(row[1])))
        return valid_products
    except Exception:
        logger.exception('Failed to validate products from database')
        return set()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_product_stock(product_ids: Iterable[int], branch_ids: Iterable[int] = None):
    """Return a mapping of (product_id, branch_id) -> quantity from centralized_product.
    
    If branch_ids is None, returns stock for all branches for the given product_ids.
    Returns dict with keys as (product_id, branch_id) tuples and values as quantity (bigint).
    """
    ids = list(set(int(x) for x in product_ids if x is not None))
    if not ids:
        return {}
    
    branch_filter = None
    if branch_ids:
        branch_filter = list(set(int(x) for x in branch_ids if x is not None))
        if not branch_filter:
            return {}

    # Supabase path
    if _supabase_client:
        try:
            query = _supabase_client.table('centralized_product').select('id, branch_id, quantity')
            query = query.in_('id', ids)
            if branch_filter:
                query = query.in_('branch_id', branch_filter)
            resp = query.execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch centralized_product stock error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            rows = getattr(resp, 'data', []) or []
            mapping = {}
            for r in rows:
                pid = int(r.get('id'))
                bid = int(r.get('branch_id'))
                qty = r.get('quantity')
                mapping[(pid, bid)] = int(qty) if qty is not None else 0
            return mapping
        except Exception:
            logger.exception('Failed to fetch product stock from Supabase')
            # fall through to SQL path

    # psycopg2 path
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_filter:
            cur.execute(
                "SELECT id, branch_id, quantity FROM public.centralized_product WHERE id = ANY(%s) AND branch_id = ANY(%s)",
                (ids, branch_filter)
            )
        else:
            cur.execute(
                "SELECT id, branch_id, quantity FROM public.centralized_product WHERE id = ANY(%s)",
                (ids,)
            )
        rows = cur.fetchall()
        mapping = {}
        for r in rows:
            pid = int(r[0])
            bid = int(r[1])
            qty = r[2]
            mapping[(pid, bid)] = int(qty) if qty is not None else 0
        return mapping
    except Exception:
        logger.exception('Failed to fetch product stock from Postgres')
        return {}
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_inventory_analytics(days: int = 30, limit: int = 100, branch_id: int | None = None):
    """Fetch recent inventory_analytics rows within the last `days` days.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    from datetime import datetime, timedelta
    from_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()

    if _supabase_client:
        try:
            query = _supabase_client.table('inventory_analytics').select('*').gte('created_at', from_date).order('created_at', desc=True)
            if branch_id is not None:
                query = query.eq('branch_id', branch_id)
            resp = query.limit(limit).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch inventory_analytics error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return getattr(resp, 'data', []) or []
        except Exception as e:
            logger.exception('Failed to fetch inventory_analytics from Supabase: %s', str(e))
            # Fall through to psycopg2 path if Supabase fails
            logger.info('Falling back to psycopg2 connection')

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_id is not None:
            cur.execute("SELECT id, product_id, branch_id, analysis_date, current_stock, avg_daily_usage, stock_adequacy_days, turnover_ratio, carrying_cost, stockout_risk_percentage, recommendation, created_at FROM public.inventory_analytics WHERE created_at >= %s::date AND branch_id = %s ORDER BY created_at DESC LIMIT %s", (from_date, branch_id, limit))
        else:
            cur.execute("SELECT id, product_id, branch_id, analysis_date, current_stock, avg_daily_usage, stock_adequacy_days, turnover_ratio, carrying_cost, stockout_risk_percentage, recommendation, created_at FROM public.inventory_analytics WHERE created_at >= %s::date ORDER BY created_at DESC LIMIT %s", (from_date, limit))
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        results = [dict(zip(cols, r)) for r in rows]
        return results
    except (RuntimeError, Exception) as e:
        # Catch all database errors (connection failures, configuration errors, etc.)
        error_msg = str(e)
        if 'Database configuration incomplete' in error_msg:
            logger.warning('Database not configured, returning empty inventory analytics list')
        else:
            logger.warning('Database connection failed (%s), returning empty inventory analytics list', error_msg)
        # Return empty list to prevent frontend crash
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_top_products(days: int = 30, limit: int = 10, branch_id: int | None = None):
    """Return top products aggregated from product_demand_history for the last `days` days.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    from datetime import datetime, timedelta
    from_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    logger.info(f'Fetching top products: days={days}, branch_id={branch_id}, from_date={from_date}')

    if _supabase_client:
        try:
            # PostgREST aggregate expressions are fragile across client versions.
            # Fetch recent product_demand_history rows and aggregate in Python for compatibility.
            query = _supabase_client.table('product_demand_history').select('product_id,quantity_sold,period_date,branch_id').gte('period_date', from_date).limit(10000)
            if branch_id is not None:
                query = query.eq('branch_id', branch_id)
            resp = query.execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch product_demand_history rows error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            rows = getattr(resp, 'data', []) or []
            if not rows:
                logger.info('No product_demand_history rows found for the specified date range')
                return []
            
            # Log date range of fetched rows for debugging
            if rows:
                period_dates = [r.get('period_date') for r in rows if r.get('period_date')]
                if period_dates:
                    logger.info(f'Fetched {len(rows)} product_demand_history rows with period dates from {min(period_dates)} to {max(period_dates)}')

            # aggregate by product_id
            agg = {}
            counts = {}
            for r in rows:
                pid = r.get('product_id')
                try:
                    pid_int = int(pid) if pid is not None else None
                except Exception:
                    continue
                qty = r.get('quantity_sold')
                try:
                    qf = float(qty) if qty is not None else 0.0
                except Exception:
                    qf = 0.0
                agg[pid_int] = agg.get(pid_int, 0.0) + qf
                counts[pid_int] = counts.get(pid_int, 0) + 1

            # prepare results sorted by total_sold desc
            items = sorted(agg.items(), key=lambda x: x[1], reverse=True)
            top_items = items[:limit]
            ids = [pid for pid, _ in top_items]
            id_to_name = get_product_names(ids)
            results = []
            for pid, total in top_items:
                records = counts.get(pid, 0)
                avg_daily = total / max(1, days)
                results.append({
                    'product_id': pid,
                    'product_name': id_to_name.get(pid) if pid in id_to_name else str(pid),
                    'total_sold': float(total),
                    'avg_daily': round(avg_daily, 2),
                    'transaction_count': int(records)
                })
            return results
        except Exception as e:
            logger.exception('Failed to fetch top products from Supabase: %s', str(e))
            # Fall through to psycopg2 path if Supabase fails
            logger.info('Falling back to psycopg2 connection')

    # psycopg2 path
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_id is not None:
            cur.execute("SELECT product_id, SUM(quantity_sold) as total_sold, COUNT(id) as records FROM public.product_demand_history WHERE period_date >= %s::date AND branch_id = %s GROUP BY product_id ORDER BY total_sold DESC LIMIT %s", (from_date, branch_id, limit))
        else:
            cur.execute("SELECT product_id, SUM(quantity_sold) as total_sold, COUNT(id) as records FROM public.product_demand_history WHERE period_date >= %s::date GROUP BY product_id ORDER BY total_sold DESC LIMIT %s", (from_date, limit))
        rows = cur.fetchall()
        results = []
        ids = [int(r[0]) for r in rows]
        id_to_name = get_product_names(ids)
        for r in rows:
            pid = int(r[0])
            total = float(r[1] or 0)
            records = int(r[2] or 0)
            avg_daily = total / max(1, days)
            results.append({'product_id': pid, 'product_name': id_to_name.get(pid) if pid in id_to_name else str(pid), 'total_sold': total, 'avg_daily': round(avg_daily,2), 'transaction_count': records})
        return results
    except (RuntimeError, Exception) as e:
        # Catch all database errors (connection failures, configuration errors, etc.)
        error_msg = str(e)
        if 'Database configuration incomplete' in error_msg:
            logger.warning('Database not configured, returning empty top products list')
        else:
            logger.warning('Database connection failed (%s), returning empty top products list', error_msg)
        # Return empty list to prevent frontend crash
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def insert_restock_recommendations(product_id: int | None, branch_id: int, recommendations: dict):
    """Insert restock recommendation into restock_recommendations table.
    
    product_id can be None if product not found in system.
    
    recommendations dict should contain:
      - last_sold_qty: quantity last sold
      - daily_rate: average daily usage
      - recommendation: recommendation text
      - priority: 'high', 'medium', or 'low'
      - product_name: product name (optional, for logging)
    """
    if _supabase_client:
        try:
            payload = {
                'product_id': product_id,
                'branch_id': branch_id,
                'last_sold_qty': recommendations.get('last_sold_qty', 0),
                'daily_rate': recommendations.get('daily_rate', 0),
                'recommendation': recommendations.get('recommendation', ''),
                'priority': recommendations.get('priority', 'low'),
                'product_name': recommendations.get('product_name', ''),
                'created_at': datetime.utcnow().isoformat()
            }
            logger.info(f'Inserting restock recommendation to Supabase: {payload}')
            resp = _supabase_client.table('restock_recommendations').insert(payload).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase insert restock recommendation error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            logger.info(f'Successfully inserted restock recommendation to Supabase')
            return True
        except Exception as e:
            logger.exception('Failed to insert restock recommendation to Supabase: %s', str(e))
            return False

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()
        logger.info(f'Inserting restock recommendation to PostgreSQL: product_id={product_id}, branch_id={branch_id}, product_name={recommendations.get("product_name", "")}')
        cur.execute(
            """INSERT INTO public.restock_recommendations 
               (product_id, branch_id, last_sold_qty, daily_rate, recommendation, priority, product_name, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (product_id, branch_id, recommendations.get('last_sold_qty', 0), 
             recommendations.get('daily_rate', 0), recommendations.get('recommendation', ''),
             recommendations.get('priority', 'low'), recommendations.get('product_name', ''), now)
        )
        conn.commit()
        logger.info(f'Successfully inserted restock recommendation to PostgreSQL')
        return True
    except Exception as e:
        logger.exception('Failed to insert restock recommendation to PostgreSQL: %s', str(e))
        if conn:
            conn.rollback()
        return False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_restock_recommendations(days: int = 30, branch_id: int | None = None, limit: int = 100):
    """Fetch recent restock recommendations from the database.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    from datetime import datetime, timedelta
    from_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()

    if _supabase_client:
        try:
            query = _supabase_client.table('restock_recommendations').select('*').gte('created_at', from_date).order('created_at', desc=True)
            if branch_id is not None:
                query = query.eq('branch_id', branch_id)
            resp = query.limit(limit).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch restock_recommendations error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return getattr(resp, 'data', []) or []
        except Exception as e:
            logger.exception('Failed to fetch restock recommendations from Supabase: %s', str(e))
            # Fall through to psycopg2 path if Supabase fails
            logger.info('Falling back to psycopg2 connection')

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        if branch_id is not None:
            cur.execute(
                """SELECT id, product_id, branch_id, last_sold_qty, daily_rate, recommendation, priority, product_name, created_at 
                   FROM public.restock_recommendations 
                   WHERE created_at >= %s::date AND branch_id = %s 
                   ORDER BY created_at DESC LIMIT %s""",
                (from_date, branch_id, limit)
            )
        else:
            cur.execute(
                """SELECT id, product_id, branch_id, last_sold_qty, daily_rate, recommendation, priority, product_name, created_at 
                   FROM public.restock_recommendations 
                   WHERE created_at >= %s::date 
                   ORDER BY created_at DESC LIMIT %s""",
                (from_date, limit)
            )
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        results = [dict(zip(cols, r)) for r in rows]
        return results
    except (RuntimeError, Exception) as e:
        # Catch all database errors (connection failures, configuration errors, etc.)
        error_msg = str(e)
        if 'Database configuration incomplete' in error_msg:
            logger.warning('Database not configured, returning empty restock recommendations list')
        else:
            logger.warning('Database connection failed (%s), returning empty restock recommendations list', error_msg)
        # Return empty list to prevent frontend crash
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_stock_deductions_by_batch(import_batch_id: str):
    """Get stock deduction details for a specific import batch.
    
    Returns list of dicts with product_id, product_name, branch_id, quantity_deducted, 
    previous_quantity, updated_quantity.
    """
    if not import_batch_id:
        return []
    
    if _supabase_client:
        try:
            # Query sales for this batch, grouped by product
            resp = _supabase_client.table('sales').select(
                'product_id, branch_id, quantity_sold'
            ).eq('import_batch_id', import_batch_id).execute()
            
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch stock deductions error: %s', getattr(resp, 'error', None))
                return []
            
            if not resp.data:
                return []
            
            # Group by product_id and branch_id
            deductions = {}
            for sale in resp.data:
                product_id = sale.get('product_id')
                branch_id = sale.get('branch_id')
                quantity = sale.get('quantity_sold', 0)
                
                if product_id is None:
                    continue
                
                key = (product_id, branch_id)
                if key not in deductions:
                    deductions[key] = {
                        'product_id': product_id,
                        'branch_id': branch_id,
                        'quantity_deducted': 0
                    }
                deductions[key]['quantity_deducted'] += quantity
            
            # Get product names and current stock
            product_ids = list(set([d['product_id'] for d in deductions.values()]))
            branch_ids = list(set([d['branch_id'] for d in deductions.values()]))
            
            # Get product names
            product_names = {}
            try:
                prod_resp = _supabase_client.table('centralized_product').select(
                    'id, product_name, branch_id, quantity'
                ).in_('id', product_ids).in_('branch_id', branch_ids).execute()
                
                if prod_resp.data:
                    for prod in prod_resp.data:
                        key = (prod['id'], prod['branch_id'])
                        product_names[key] = {
                            'name': prod.get('product_name', f"Product {prod['id']}"),
                            'current_quantity': prod.get('quantity', 0)
                        }
            except Exception as e:
                logger.warning(f'Failed to fetch product names: {str(e)}')
            
            # Build result list
            result = []
            for key, ded in deductions.items():
                product_id, branch_id = key
                product_info = product_names.get(key, {})
                current_qty = product_info.get('current_quantity', 0)
                quantity_deducted = ded['quantity_deducted']
                
                result.append({
                    'product_id': product_id,
                    'product_name': product_info.get('name', f"Product {product_id}"),
                    'branch_id': branch_id,
                    'quantity_deducted': quantity_deducted,
                    'previous_quantity': current_qty + quantity_deducted,  # Before deduction
                    'updated_quantity': current_qty  # After deduction
                })
            
            return result
        except Exception as e:
            logger.error(f'Error fetching stock deductions by batch: {str(e)}')
            return []
    
    # psycopg2 fallback
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        # Query sales grouped by product
        cur.execute('''
            SELECT 
                s.product_id,
                s.branch_id,
                SUM(s.quantity_sold) as quantity_deducted,
                cp.product_name,
                cp.quantity as current_quantity
            FROM public.sales s
            LEFT JOIN public.centralized_product cp 
                ON s.product_id = cp.id AND s.branch_id = cp.branch_id
            WHERE s.import_batch_id = %s
            GROUP BY s.product_id, s.branch_id, cp.product_name, cp.quantity
        ''', (import_batch_id,))
        
        rows = cur.fetchall()
        result = []
        for row in rows:
            product_id, branch_id, quantity_deducted, product_name, current_quantity = row
            result.append({
                'product_id': product_id,
                'product_name': product_name or f"Product {product_id}",
                'branch_id': branch_id,
                'quantity_deducted': int(quantity_deducted) if quantity_deducted else 0,
                'previous_quantity': (current_quantity or 0) + (quantity_deducted or 0),
                'updated_quantity': current_quantity or 0
            })
        
        return result
    except Exception as e:
        logger.error(f'Error fetching stock deductions by batch: {str(e)}')
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
