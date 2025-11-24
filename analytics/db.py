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
load_dotenv()
# If a `.env.local` file exists at the repo root, load it to allow local overrides.
try:
    load_dotenv('.env.local', override=True)
except Exception:
    # best-effort; don't fail if file not present
    pass

logger = logging.getLogger(__name__)

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


def insert_sales_rows(rows: Iterable[Sequence[Any]] | Iterable[dict], commit: bool = True):
    """Insert multiple sales rows into `public.sales`.

    rows: iterable of tuples matching (product_id, branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at)
          or iterable of dicts matching column names when using Supabase client.
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
                    # expected tuple order: product_id, branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at
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

                    payload.append({
                        'product_id': product_id_val,
                        'branch_id': branch_id_val,
                        'quantity_sold': quantity_val,
                        'transaction_date': tdate.isoformat() if hasattr(tdate, 'isoformat') else tdate,
                        'unit_price': float(uprice) if uprice is not None else None,
                        'total_amount': float(tamount) if tamount is not None else None,
                        'payment_method': pmethod,
                        'created_at': created.isoformat() if hasattr(created, 'isoformat') else created
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
            return inserted
        except Exception:
            logger.exception('Failed to insert sales rows to Supabase')
            raise

    # Fallback to psycopg2 bulk insert
    insert_sql = '''
    INSERT INTO public.sales (
        product_id, branch_id, quantity_sold, transaction_date, unit_price, total_amount, payment_method, created_at
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
                tuples.append((
                    product_id_val,
                    branch_id_val,
                    quantity_val,
                    r.get('transaction_date'),
                    float(r.get('unit_price')) if r.get('unit_price') is not None else None,
                    float(r.get('total_amount')) if r.get('total_amount') is not None else None,
                    r.get('payment_method'),
                    r.get('created_at')
                ))
            else:
                # tuple path: coerce elements similarly
                prod, br, qty, tdate, uprice, tamount, pmethod, created = r
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
                tuples.append((product_id_val, branch_id_val, quantity_val, tdate, float(uprice) if uprice is not None else None, float(tamount) if tamount is not None else None, pmethod, created))

        if not tuples:
            logger.info('No valid sales rows to insert (psycopg2) after coercion; skipped %d rows', skipped)
            return 0
        execute_values(cur, insert_sql, tuples, template=None, page_size=100)
        inserted = cur.rowcount
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
    """Persist EOQ calculation into `public.eoq_calculations`.

    result: dictionary containing EOQ values produced by EOQCalculator
    """
    sql = '''
    INSERT INTO public.eoq_calculations (
        product_id, branch_id, annual_demand, holding_cost, ordering_cost, unit_cost,
        eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, calculated_at, valid_until
    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    '''

    now = datetime.utcnow()
    valid_until = now.replace(year=now.year + 1)

    params = (
        product_id,
        branch_id,
        result.get('annual_demand') or 0,
        result.get('holding_cost') or result.get('annual_holding_cost') or 50,
        result.get('ordering_cost') or result.get('annual_ordering_cost') or 100,
        result.get('unit_cost') or 0,
        result.get('eoq_quantity'),
        result.get('reorder_point'),
        result.get('safety_stock'),
        result.get('lead_time_days') or 7,
        result.get('confidence_level') or 0.95,
        now,
        valid_until
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
                        'annual_demand': result.get('annual_demand') or result.get('annualDemand') or 0,
                        'holding_cost': result.get('holding_cost') or result.get('annual_holding_cost') or result.get('holdingCost') or 50,
                        'ordering_cost': result.get('ordering_cost') or result.get('annual_ordering_cost') or result.get('orderingCost') or 100,
                        'unit_cost': result.get('unit_cost') or result.get('unit_cost_estimate') or result.get('unitCost') or 0,
                        'eoq_quantity': result.get('eoq_quantity'),
                        'reorder_point': result.get('reorder_point'),
                        'safety_stock': result.get('safety_stock'),
                        'lead_time_days': result.get('lead_time_days') or result.get('lead_time') or 7,
                        'confidence_level': result.get('confidence_level') or 0.95,
                        'calculated_at': now.isoformat(),
                        'valid_until': valid_until.isoformat()
                    }
                    resp = _supabase_client.table('eoq_calculations').insert(payload).execute()
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


def fetch_eoq_calculations(limit: int = 100):
    """Fetch recent EOQ calculations from DB. Returns list of dicts."""
    if _supabase_client:
        try:
            resp = _supabase_client.table('eoq_calculations').select('*').order('calculated_at', desc=True).limit(limit).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch eoq error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return getattr(resp, 'data', []) or []
        except Exception:
            logger.exception('Failed to fetch EOQ calculations from Supabase')
            raise

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, product_id, branch_id, annual_demand, holding_cost, ordering_cost, unit_cost, eoq_quantity, reorder_point, safety_stock, lead_time_days, confidence_level, calculated_at, valid_until FROM public.eoq_calculations ORDER BY calculated_at DESC LIMIT %s", (limit,))
        cols = [c[0] for c in cur.description]
        rows = cur.fetchall()
        results = [dict(zip(cols, r)) for r in rows]
        return results
    except Exception:
        logger.exception('Failed to fetch EOQ calculations')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def fetch_sales_summary(days: int = 30):
    """Return aggregated sales metrics over the last `days` days."""
    if _supabase_client:
        try:
            # PostgREST aggregate queries can be fragile across client versions.
            # Instead fetch recent rows and aggregate in Python to ensure compatibility.
            from datetime import datetime, timedelta
            from_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
            # fetch up to a reasonable number of rows for aggregation
            resp = _supabase_client.table('sales').select('quantity_sold,transaction_date').gte('transaction_date', from_date).limit(10000).execute()
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
        except Exception:
            logger.exception('Failed to fetch sales summary from Supabase')
            raise

    # psycopg2 fallback
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
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
    except Exception:
        logger.exception('Failed to fetch sales summary')
        raise
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
            resp = _supabase_client.table('product_demand_history').insert(rows).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase insert product_demand_history error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return len(getattr(resp, 'data', []) or rows)
        except Exception:
            logger.exception('Failed to insert product_demand_history to Supabase')
            raise

    # psycopg2 fallback
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        insert_sql = '''
        INSERT INTO public.product_demand_history (product_id, branch_id, period_date, quantity_sold, revenue, avg_price, source, created_at)
        VALUES %s
        ON CONFLICT (product_id, branch_id, period_date) DO UPDATE SET quantity_sold = EXCLUDED.quantity_sold, revenue = EXCLUDED.revenue, avg_price = EXCLUDED.avg_price, created_at = EXCLUDED.created_at
        '''
        tuples = []
        for e in rows:
            tuples.append((
                int(e.get('product_id')),
                int(e.get('branch_id')),
                e.get('period_date'),
                int(float(e.get('quantity_sold') or 0)),
                float(e.get('revenue') or 0.0),
                float(e.get('avg_price') or 0.0),
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
            # Ensure current_stock is always a number, never None
            normalized_rows = []
            for e in rows:
                normalized = dict(e)
                current_stock_val = normalized.get('current_stock')
                if current_stock_val is None:
                    normalized['current_stock'] = 0
                else:
                    try:
                        normalized['current_stock'] = int(current_stock_val)
                    except (ValueError, TypeError):
                        normalized['current_stock'] = 0
                normalized_rows.append(normalized)
            
            resp = _supabase_client.table('inventory_analytics').insert(normalized_rows).execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase insert inventory_analytics error: %s', getattr(resp, 'error', None))
                raise RuntimeError(str(getattr(resp, 'error', None)))
            return len(getattr(resp, 'data', []) or normalized_rows)
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
    
    Searches in common name fields: product_name, title, name, product, label, display_name.
    If branch_id is provided, also filters by branch_id.
    Returns the first matching product_id, or None if not found.
    """
    if not product_name:
        return None
    
    # Supabase path
    if _supabase_client:
        try:
            query = _supabase_client.table('centralized_product').select('id, branch_id')
            # Search in multiple name fields
            name_candidates = ('product_name', 'title', 'name', 'product', 'label', 'display_name')
            # Use OR conditions for name matching
            name_filters = []
            for field in name_candidates:
                name_filters.append(f"{field}.ilike.{product_name}")
            
            # For Supabase, we need to use a different approach - select all and filter in Python
            # or use multiple queries. Let's use a simpler approach: select all and filter.
            resp = _supabase_client.table('centralized_product').select('id, branch_id, product_name, title, name, product, label, display_name').execute()
            if getattr(resp, 'error', None):
                logger.error('Supabase fetch centralized_product error: %s', getattr(resp, 'error', None))
                return None
            rows = getattr(resp, 'data', []) or []
            for r in rows:
                # Check if branch_id matches (if provided)
                if branch_id is not None:
                    if int(r.get('branch_id', 0)) != int(branch_id):
                        continue
                # Check name fields
                for field in name_candidates:
                    if r.get(field) and str(r.get(field)).strip().lower() == str(product_name).strip().lower():
                        return int(r.get('id'))
            return None
        except Exception:
            logger.exception('Failed to fetch product_id by name from Supabase')
            return None
    
    # psycopg2 path
    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        # Search in multiple name fields using ILIKE for case-insensitive matching
        if branch_id is not None:
            cur.execute("""
                SELECT id FROM public.centralized_product 
                WHERE branch_id = %s 
                AND (
                    LOWER(COALESCE(product_name, '')) = LOWER(%s)
                    OR LOWER(COALESCE(title, '')) = LOWER(%s)
                    OR LOWER(COALESCE(name, '')) = LOWER(%s)
                    OR LOWER(COALESCE(product, '')) = LOWER(%s)
                    OR LOWER(COALESCE(label, '')) = LOWER(%s)
                    OR LOWER(COALESCE(display_name, '')) = LOWER(%s)
                )
                LIMIT 1
            """, (branch_id, product_name, product_name, product_name, product_name, product_name, product_name))
        else:
            cur.execute("""
                SELECT id FROM public.centralized_product 
                WHERE (
                    LOWER(COALESCE(product_name, '')) = LOWER(%s)
                    OR LOWER(COALESCE(title, '')) = LOWER(%s)
                    OR LOWER(COALESCE(name, '')) = LOWER(%s)
                    OR LOWER(COALESCE(product, '')) = LOWER(%s)
                    OR LOWER(COALESCE(label, '')) = LOWER(%s)
                    OR LOWER(COALESCE(display_name, '')) = LOWER(%s)
                )
                LIMIT 1
            """, (product_name, product_name, product_name, product_name, product_name, product_name))
        row = cur.fetchone()
        if row:
            return int(row[0])
        return None
    except Exception:
        logger.exception('Failed to fetch product_id by name from Postgres')
        return None
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
        except Exception:
            logger.exception('Failed to fetch inventory_analytics from Supabase')
            raise

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
    except Exception:
        logger.exception('Failed to fetch inventory_analytics')
        raise
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
                return []

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
        except Exception:
            logger.exception('Failed to fetch top products from Supabase')
            raise

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
    except Exception:
        logger.exception('Failed to fetch top products')
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
