from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import pandas as pd
from io import BytesIO

# Handle both relative and absolute imports
try:
    from .eoq_calculator import EOQCalculator, EOQInput, DemandForecaster, InventoryAnalytics
    from . import db as db_module
except ImportError:
    from eoq_calculator import EOQCalculator, EOQInput, DemandForecaster, InventoryAnalytics
    import db as db_module

logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Mock database - In production, use Supabase client
class Database:
    """Mock database for storing analytics results"""
    def __init__(self):
        self.eoq_results = {}
        self.forecasts = {}
        self.inventory_analysis = {}
    
    def store_eoq(self, product_id, branch_id, result):
        key = f"{product_id}_{branch_id}"
        self.eoq_results[key] = {
            'product_id': product_id,
            'branch_id': branch_id,
            'data': result.__dict__,
            'timestamp': datetime.now().isoformat()
        }
    
    def store_forecast(self, product_id, branch_id, forecast):
        key = f"{product_id}_{branch_id}"
        self.forecasts[key] = {
            'product_id': product_id,
            'branch_id': branch_id,
            'data': forecast,
            'timestamp': datetime.now().isoformat()
        }
    
    def store_analysis(self, product_id, branch_id, analysis):
        key = f"{product_id}_{branch_id}"
        self.inventory_analysis[key] = {
            'product_id': product_id,
            'branch_id': branch_id,
            'data': analysis,
            'timestamp': datetime.now().isoformat()
        }

# Initialize database
db = Database()


@analytics_bp.route('/eoq/calculate', methods=['POST'])
def calculate_eoq():
    """Calculate EOQ for a product"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['annual_demand', 'holding_cost', 'ordering_cost', 'unit_cost']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': f'Missing required fields. Need: {", ".join(required_fields)}'
            }), 400
        
        eoq_input = EOQInput(
            annual_demand=float(data.get('annual_demand', 0)),
            holding_cost=float(data.get('holding_cost', 0)),
            ordering_cost=float(data.get('ordering_cost', 50)),
            unit_cost=float(data.get('unit_cost', 0)),
            lead_time_days=int(data.get('lead_time_days', 7)),
            confidence_level=float(data.get('confidence_level', 0.95))
        )
        
        # Calculate EOQ
        result = EOQCalculator.calculate_eoq(eoq_input)
        
        # Store in both mock database and persistent database
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        if product_id and branch_id:
            # Store in mock database (for backward compatibility)
            db.store_eoq(product_id, branch_id, result)
            
            # Also persist to real database so it's available on page refresh
            try:
                result_dict = {
                    'annual_demand': float(data.get('annual_demand', 0)),
                    'holding_cost': float(data.get('holding_cost', 50)),
                    'ordering_cost': float(data.get('ordering_cost', 100)),
                    'unit_cost': float(data.get('unit_cost', 0)),
                    'eoq_quantity': result.eoq_quantity,
                    'reorder_point': result.reorder_point,
                    'safety_stock': result.safety_stock,
                    'annual_holding_cost': result.annual_holding_cost,
                    'annual_ordering_cost': result.annual_ordering_cost,
                    'total_annual_cost': result.total_annual_cost,
                    'max_stock_level': result.max_stock_level,
                    'min_stock_level': result.min_stock_level,
                    'average_inventory': result.average_inventory,
                    'lead_time_days': int(data.get('lead_time_days', 7)),
                    'confidence_level': float(data.get('confidence_level', 0.95))
                }
                db_module.insert_eoq_calculation(product_id, branch_id, result_dict)
                logger.info(f'EOQ persisted to database for product {product_id}, branch {branch_id}')
            except Exception as e:
                logger.error(f'Failed to persist EOQ to database for product {product_id}, branch {branch_id}: {str(e)}', exc_info=True)
                # Continue even if persistence fails - at least return the calculation
        
        logger.info(f'EOQ calculated for product {product_id}, branch {branch_id}')
        
        return jsonify({
            'success': True,
            'data': {
                'eoq_quantity': result.eoq_quantity,
                'reorder_point': result.reorder_point,
                'safety_stock': result.safety_stock,
                'annual_holding_cost': result.annual_holding_cost,
                'annual_ordering_cost': result.annual_ordering_cost,
                'total_annual_cost': result.total_annual_cost,
                'max_stock_level': result.max_stock_level,
                'min_stock_level': result.min_stock_level,
                'average_inventory': result.average_inventory
            }
        }), 200
    
    except ValueError as e:
        logger.error(f'Validation error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error calculating EOQ: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to calculate EOQ'}), 500


@analytics_bp.route('/forecast/demand', methods=['POST'])
def forecast_demand():
    """Forecast future demand based on historical data"""
    try:
        data = request.json
        historical_data = data.get('historical_data', [])
        periods_ahead = int(data.get('periods_ahead', 3))
        method = data.get('method', 'exponential')
        
        if not historical_data:
            return jsonify({
                'success': False,
                'error': 'Historical data is required'
            }), 400
        
        if len(historical_data) < 2:
            return jsonify({
                'success': False,
                'error': 'At least 2 data points are required for forecasting'
            }), 400
        
        # Convert to float list
        historical_data = [float(x) for x in historical_data]
        
        # Generate forecast
        forecast_result = DemandForecaster.forecast_multiple_periods(
            historical_data,
            periods_ahead,
            method
        )
        
        # Store in mock database
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        if product_id and branch_id:
            db.store_forecast(product_id, branch_id, forecast_result)
        
        logger.info(f'Forecast generated for product {product_id}, branch {branch_id}')
        
        return jsonify({
            'success': True,
            'data': {
                'forecasts': forecast_result['forecasts'],
                'trend': round(forecast_result['trend'], 2),
                'base_forecast': round(forecast_result['base_forecast'], 2),
                'confidence_intervals': {
                    'lower': [round(x, 2) for x in forecast_result['confidence_intervals']['lower']],
                    'upper': [round(x, 2) for x in forecast_result['confidence_intervals']['upper']]
                }
            }
        }), 200
    
    except ValueError as e:
        logger.error(f'Validation error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error forecasting demand: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to forecast demand'}), 500


@analytics_bp.route('/inventory/health', methods=['POST'])
def analyze_inventory_health():
    """Analyze inventory health and get recommendations"""
    try:
        data = request.json
        
        analysis = InventoryAnalytics.analyze_inventory_health(
            current_stock=float(data.get('current_stock', 0)),
            daily_usage=float(data.get('daily_usage', 0)),
            reorder_point=float(data.get('reorder_point', 0)),
            safety_stock=float(data.get('safety_stock', 0)),
            eoq=float(data.get('eoq', 0))
        )
        
        # Store in mock database
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        if product_id and branch_id:
            db.store_analysis(product_id, branch_id, analysis)
        
        logger.info(f'Inventory analysis for product {product_id}, branch {branch_id}: {analysis["status"]}')
        
        return jsonify({
            'success': True,
            'data': analysis
        }), 200
    
    except ValueError as e:
        logger.error(f'Validation error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error analyzing inventory: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to analyze inventory'}), 500


@analytics_bp.route('/abc-analysis', methods=['POST'])
def abc_analysis():
    """Perform ABC analysis on products"""
    try:
        data = request.json
        products = data.get('products', [])
        
        if not products:
            return jsonify({
                'success': False,
                'error': 'Products list is required'
            }), 400
        
        analysis = InventoryAnalytics.calculate_abc_analysis(products)
        
        logger.info(f'ABC Analysis completed: {len(analysis["A_items"])} A items, {len(analysis["B_items"])} B items, {len(analysis["C_items"])} C items')
        
        return jsonify({
            'success': True,
            'data': analysis
        }), 200
    
    except Exception as e:
        logger.error(f'Error in ABC analysis: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to perform ABC analysis'}), 500


@analytics_bp.route('/sales-data/import', methods=['POST'])
def import_sales_data():
    """Import and analyze sales data from CSV/Excel"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        logger.info(f'Processing sales data import from file: {file.filename} (content_type: {file.content_type})')
        
        # Read file - ensure we read from the uploaded file stream, not a cached version
        # Flask's FileStorage object needs to be handled carefully
        # Always read the file bytes first, then create a fresh BytesIO for pandas
        try:
            # Reset file position to ensure we read from the beginning
            file.seek(0)
            file_bytes = file.read()
            
            # If read() returns empty, try reading again after reset
            if not file_bytes or len(file_bytes) == 0:
                logger.warning(f'First read returned empty, trying again...')
                file.seek(0)
                file_bytes = file.read()
        except Exception as e:
            logger.error(f'Error reading file: {str(e)}')
            return jsonify({
                'success': False,
                'error': f'Failed to read uploaded file: {str(e)}'
            }), 400
        
        # Verify we got the file content
        if not file_bytes or len(file_bytes) == 0:
            logger.error(f'File {file.filename} is empty (0 bytes) after reading')
            return jsonify({
                'success': False,
                'error': 'Uploaded file is empty or could not be read'
            }), 400
        
        logger.info(f'Read {len(file_bytes)} bytes from uploaded file: {file.filename}')
        # Log file signature to verify it's a valid Excel file
        if len(file_bytes) >= 4:
            file_signature = file_bytes[:4].hex()
            logger.info(f'File signature (first 4 bytes): {file_signature}')
            # Excel files start with PK (ZIP signature) - 504b0304
            if file_signature.startswith('504b'):
                logger.info('File appears to be a valid Excel/ZIP file')
            else:
                logger.warning(f'File signature {file_signature} does not match Excel format (expected PK/ZIP)')
        
        if file.filename.endswith('.csv'):
            # Reset BytesIO position to beginning
            file_content = BytesIO(file_bytes)
            file_content.seek(0)
            df = pd.read_csv(file_content)
            logger.info(f'Read CSV file: {len(df)} rows loaded')
        elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            # For Excel files, read into BytesIO first to ensure we get the actual uploaded content
            # Create a fresh BytesIO from the file bytes
            file_content = BytesIO(file_bytes)
            file_content.seek(0)  # Ensure we start from the beginning
            
            try:
                df = pd.read_excel(file_content, engine='openpyxl')
            except Exception as e:
                logger.error(f'Error reading Excel file with pandas: {str(e)}')
                logger.error(f'File size: {len(file_bytes)} bytes, File signature: {file_bytes[:4].hex() if len(file_bytes) >= 4 else "N/A"}')
                return jsonify({
                    'success': False,
                    'error': f'Failed to read Excel file: {str(e)}'
                }), 400
            
            logger.info(f'Read Excel file: {len(df)} rows, {len(df.columns)} columns loaded from {file.filename}')
            logger.info(f'Excel columns: {list(df.columns)}')
            
            if len(df) > 0:
                logger.info(f'Sample row: {df.iloc[0].to_dict()}')
            else:
                logger.error(f'Excel file {file.filename} has 0 rows after reading! File size: {len(file_bytes)} bytes')
                logger.error(f'This might indicate the file is corrupted or was not uploaded correctly')
                # Try to read it again with different engine as fallback
                try:
                    file_content.seek(0)
                    df_fallback = pd.read_excel(file_content, engine='xlrd')
                    if len(df_fallback) > 0:
                        logger.info(f'Fallback engine (xlrd) successfully read {len(df_fallback)} rows')
                        df = df_fallback
                    else:
                        return jsonify({
                            'success': False,
                            'error': f'Excel file appears to be empty. File size: {len(file_bytes)} bytes. Please check the file and try again.'
                        }), 400
                except Exception:
                    return jsonify({
                        'success': False,
                        'error': f'Excel file appears to be empty or could not be read. File size: {len(file_bytes)} bytes. Please regenerate the file and try again.'
                    }), 400
        else:
            return jsonify({
                'success': False,
                'error': 'Unsupported file format. Use CSV or Excel'
            }), 400
        
        # Expected columns - allow common date column names from different POS exports
        if 'quantity' not in df.columns:
            return jsonify({'success': False, 'error': 'Missing column: quantity'}), 400

        # find a date column among common alternatives
        date_candidates = ['date', 'transaction_date', 'sale_date', 'timestamp', 'transactiondatetime', 'created_at']
        date_col = next((c for c in date_candidates if c in df.columns), None)
        if not date_col:
            return jsonify({'success': False, 'error': f'Missing date column. Provide one of: {", ".join(date_candidates)}'}), 400

        # Convert to numeric and normalize date into `date` column used below
        original_row_count = len(df)
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
        
        # Handle date conversion - if already datetime, use it directly; otherwise parse
        if pd.api.types.is_datetime64_any_dtype(df[date_col]):
            df['date'] = df[date_col]
            logger.info(f'Date column {date_col} is already datetime type')
        else:
            df['date'] = pd.to_datetime(df[date_col], errors='coerce')
            logger.info(f'Parsed date column {date_col} to datetime')
        
        # Log before filtering for debugging
        quantity_nulls = df['quantity'].isna().sum()
        date_nulls = df['date'].isna().sum()
        logger.info(f'Before filtering: {original_row_count} rows, quantity nulls: {quantity_nulls}, date nulls: {date_nulls}')
        logger.info(f'Sample data - quantity: {df["quantity"].head(3).tolist()}, date: {df["date"].head(3).tolist()}')
        
        # Remove invalid rows
        df = df.dropna(subset=['quantity', 'date'])
        
        if df.empty:
            logger.error(f'No valid data after filtering. Original rows: {original_row_count}, quantity nulls: {quantity_nulls}, date nulls: {date_nulls}')
            logger.error(f'Available columns: {list(df.columns)}')
            logger.error(f'File: {file.filename}, File size: {len(file_bytes) if "file_bytes" in locals() else "unknown"} bytes')
            if original_row_count > 0:
                logger.error(f'Sample raw data before conversion: quantity={df["quantity"].head(3).tolist() if len(df) > 0 else "N/A"}, date={df[date_col].head(3).tolist() if len(df) > 0 else "N/A"}')
            return jsonify({
                'success': False,
                'error': f'No valid data found in file. Original rows: {original_row_count}, filtered out: {quantity_nulls} invalid quantities, {date_nulls} invalid dates. Check server logs for details.'
            }), 400
        
        # Log date range of imported data for debugging
        valid_row_count = len(df)
        if valid_row_count == 0:
            logger.error(f'CRITICAL: DataFrame is empty after filtering! Original rows: {original_row_count}, quantity nulls: {quantity_nulls}, date nulls: {date_nulls}')
            logger.error(f'DataFrame info: {df.info() if hasattr(df, "info") else "N/A"}')
            logger.error(f'DataFrame shape: {df.shape}')
            logger.error(f'DataFrame columns: {list(df.columns)}')
        date_min = df['date'].min() if valid_row_count > 0 else None
        date_max = df['date'].max() if valid_row_count > 0 else None
        logger.info(f'Imported data date range: {date_min} to {date_max} ({valid_row_count} valid rows)')
        
        # Calculate metrics
        total_quantity = df['quantity'].sum()
        average_daily = df['quantity'].mean()
        days_of_data = (df['date'].max() - df['date'].min()).days + 1
        annual_demand = (total_quantity / days_of_data) * 365 if days_of_data > 0 else 0
        
        # Extract product-level analytics if product identifier column exists
        top_products = []
        restock_recommendations = []

        if 'product' in df.columns or 'product_name' in df.columns or 'product_id' in df.columns:
            product_col = (
                'product' if 'product' in df.columns else (
                    'product_name' if 'product_name' in df.columns else 'product_id'
                )
            )
            product_analytics = df.groupby(product_col)['quantity'].agg(['sum', 'mean', 'count']).reset_index()
            # normalize columns; if grouped by product_id we will resolve names below
            product_analytics.columns = [product_col, 'total_sold', 'avg_daily', 'transaction_count']
            product_analytics = product_analytics.sort_values('total_sold', ascending=False)
            
            # If grouped by numeric product_id, attempt to resolve product names
            if product_col == 'product_id':
                try:
                    ids = [int(x) for x in product_analytics['product_id'].unique() if pd.notna(x)]
                    id_to_name = db_module.get_product_names(ids)
                except Exception:
                    id_to_name = {}

                # map product_id to product_name column for display
                product_analytics['product_name'] = product_analytics['product_id'].apply(lambda x: id_to_name.get(int(x)) if pd.notna(x) and int(str(x)) in id_to_name else (str(int(x)) if pd.notna(x) else None))
            else:
                product_analytics['product_name'] = product_analytics[product_col]

            # Top 5 products
            top_products = product_analytics.head(5).to_dict('records')
            for item in top_products:
                # ensure numeric conversions
                item['total_sold'] = int(item.get('total_sold') or 0)
                item['avg_daily'] = round(float(item.get('avg_daily') or 0), 2)
                item['transaction_count'] = int(item.get('transaction_count') or 0)
                # ensure product_name exists
                if not item.get('product_name'):
                    # fallback to product_id string if present
                    item['product_name'] = str(item.get(product_col))
            
            # Low stock products (bottom 5 by sales = slow movers needing attention)
            slow_movers = product_analytics.tail(5).to_dict('records')
            restock_recommendations = [
                {
                    'product_name': (item.get('product_name') or str(item.get(product_col))),
                    'last_sold_qty': int(item.get('total_sold') or 0),
                    'daily_rate': round(float(item.get('avg_daily') or 0), 2),
                    'recommendation': f"Monitor closely - selling {round(float(item.get('avg_daily') or 0), 1)} units/day",
                    'priority': 'medium' if (item.get('avg_daily') or 0) > 0 else 'low'
                }
                for item in slow_movers
            ]
        
        logger.info(f'Sales data imported: {len(df)} records, annual demand: {annual_demand}')
        logger.info(f'DataFrame still has {len(df)} rows at this point (valid_row_count was {valid_row_count})')

        # Persist raw sales rows into Postgres if DB configured
        inserted_count = 0
        db_warning = None
        try:
            # Read JSON payload safely (may be multipart/form-data for file uploads)
            json_payload = request.get_json(silent=True)
            # Determine branch_id provided in form/json or default to 1
            branch_id = None
            if request.form.get('branch_id'):
                try:
                    branch_id = int(request.form.get('branch_id'))
                except Exception:
                    branch_id = None
            if not branch_id and json_payload and json_payload.get('branch_id'):
                try:
                    branch_id = int(json_payload.get('branch_id'))
                except Exception:
                    branch_id = None
            if not branch_id:
                branch_id = 1

            rows = []
            now_iso = datetime.utcnow().isoformat()
            for _, r in df.iterrows():
                # Try to map possible product identifier columns
                product_id = None
                if 'product_id' in df.columns:
                    try:
                        product_id = int(r.get('product_id')) if not pd.isna(r.get('product_id')) else None
                    except Exception:
                        product_id = None

                # Get branch_id from CSV row if present, otherwise use form/json/default
                row_branch_id = branch_id  # default to form/json/default branch_id
                if 'branch_id' in df.columns:
                    try:
                        row_branch_id = int(r.get('branch_id')) if not pd.isna(r.get('branch_id')) else branch_id
                    except Exception:
                        row_branch_id = branch_id

                quantity = float(r['quantity'])
                transaction_date = r['date'].to_pydatetime() if hasattr(r['date'], 'to_pydatetime') else r['date']
                unit_price = None
                total_amount = None
                payment_method = None

                if 'unit_price' in df.columns:
                    unit_price = r.get('unit_price')
                if 'price' in df.columns and unit_price is None:
                    unit_price = r.get('price')
                if 'total_amount' in df.columns:
                    total_amount = r.get('total_amount')
                if 'amount' in df.columns and total_amount is None:
                    total_amount = r.get('amount')
                if 'payment_method' in df.columns:
                    payment_method = r.get('payment_method')

                created_at = now_iso

                rows.append((product_id, row_branch_id, quantity, transaction_date, unit_price, total_amount, payment_method, created_at))

            try:
                inserted_count = db_module.insert_sales_rows(rows)
            except ValueError as e:
                # Negative stock validation error - check if it's the specific error we're looking for
                error_msg = str(e)
                if 'Stock deduction would result in negative quantities' in error_msg:
                    logger.error(f'Stock validation failed: {error_msg}')
                    # Return error without inserting any data
                    return jsonify({
                        'success': False,
                        'error': 'Failed analyzing and importing sales data',
                        'details': error_msg
                    }), 400
                else:
                    db_warning = error_msg
            except Exception as e:
                db_warning = str(e)

            # After inserting raw sales, aggregate and persist to demand history, forecast, and inventory analytics
            try:
                # Only proceed if product_id column exists and there are numeric product ids
                if 'product_id' in df.columns:
                    pid_df = df.dropna(subset=['product_id']).copy()
                    # coerce product_id to int where possible
                    pid_df['product_id'] = pid_df['product_id'].apply(lambda x: int(x) if (pd.notna(x) and str(x).strip() != '') else None)
                    pid_df = pid_df.dropna(subset=['product_id'])
                    
                    # Add branch_id column if not present (use form/json/default)
                    if 'branch_id' not in pid_df.columns:
                        pid_df['branch_id'] = branch_id
                    else:
                        # Ensure branch_id is numeric
                        pid_df['branch_id'] = pid_df['branch_id'].apply(lambda x: int(x) if pd.notna(x) else branch_id)

                    if not pid_df.empty:
                        # period_date as date (YYYY-MM-DD)
                        pid_df['period_date'] = pid_df['date'].dt.date
                        # ensure numeric columns
                        if 'total_amount' not in pid_df.columns:
                            pid_df['total_amount'] = None
                        if 'unit_price' not in pid_df.columns:
                            pid_df['unit_price'] = None

                        grouped = pid_df.groupby(['product_id', 'branch_id', 'period_date']).agg({
                            'quantity': 'sum',
                            'total_amount': 'sum',
                            'unit_price': 'mean'
                        }).reset_index()

                        demand_entries = []
                        forecast_entries = []
                        inventory_entries = []
                        from datetime import date
                        # forecast month: first day of next month
                        today = datetime.utcnow().date()
                        if today.month == 12:
                            fm = date(today.year + 1, 1, 1)
                        else:
                            fm = date(today.year, today.month + 1, 1)

                        for _, g in grouped.iterrows():
                            try:
                                pid = int(g['product_id'])
                                bid = int(g['branch_id'])
                                period = g['period_date']
                                qty = int(float(g['quantity'] or 0))
                                revenue = float(g['total_amount'] or 0.0) if g['total_amount'] is not None else 0.0
                                avg_price = float(g['unit_price'] or 0.0) if g['unit_price'] is not None else 0.0

                                demand_entries.append({
                                    'product_id': pid,
                                    'branch_id': bid,
                                    'period_date': period.isoformat() if hasattr(period, 'isoformat') else period,
                                    'quantity_sold': qty,
                                    'revenue': revenue,
                                    'avg_price': avg_price,
                                    'source': 'bitpos_import'
                                })

                                # simple projection: monthly forecast based on average daily * 30
                                avg_daily = (qty / days_of_data) if days_of_data > 0 else 0
                                forecast_qty = float(avg_daily * 30)
                                forecast_entries.append({
                                    'product_id': pid,
                                    'branch_id': bid,
                                    'forecast_month': fm.isoformat(),
                                    'forecasted_quantity': forecast_qty,
                                    'confidence_interval_lower': max(0.0, forecast_qty * 0.8),
                                    'confidence_interval_upper': forecast_qty * 1.2,
                                    'forecast_method': 'simple_projection'
                                })

                                # inventory analytics minimal info
                                # Calculate inventory analytics fields from aggregated sales (g)
                                total_sold_qty = float(qty)  # qty already extracted from g['quantity']
                                avg_daily = (qty / days_of_data) if days_of_data > 0 else 0
                                avg_unit_price = avg_price  # avg_price already extracted from g['unit_price']
                                
                                # ALWAYS get current_stock from centralized_product table - never use estimation
                                current_stock_actual = 0
                                stock_found = False
                                try:
                                    stock_map = db_module.get_product_stock([pid], [bid])
                                    fetched_stock = stock_map.get((pid, bid), None)
                                    if fetched_stock is not None:
                                        # Product exists in centralized_product - use actual stock
                                        current_stock_actual = int(fetched_stock) if fetched_stock is not None else 0
                                        stock_found = True
                                        logger.info('✓ Fetched actual stock from centralized_product for product %s branch %s: %s', pid, bid, current_stock_actual)
                                    else:
                                        # Product NOT found in centralized_product - use 0 (not estimation)
                                        current_stock_actual = 0
                                        logger.warning('✗ Product %s branch %s NOT FOUND in centralized_product table. current_stock set to 0. Please ensure product exists in centralized_product.', pid, bid)
                                except Exception as e:
                                    # Database lookup failed - use 0 (not estimation)
                                    current_stock_actual = 0
                                    logger.error('✗ Failed to fetch stock from centralized_product for product %s branch %s: %s. current_stock set to 0.', pid, bid, str(e))
                                
                                # Ensure current_stock_actual is never None (should always be 0 or positive number)
                                if current_stock_actual is None:
                                    current_stock_actual = 0
                                
                                # stock_adequacy_days: how many days of stock we have based on actual stock
                                stock_adequacy = int(current_stock_actual / max(avg_daily, 0.001)) if current_stock_actual > 0 and avg_daily > 0 else 0
                                
                                # turnover_ratio: times inventory turned over
                                turnover = (total_sold_qty / max(current_stock_actual, 1)) if current_stock_actual > 0 else 0
                                
                                # carrying_cost: estimated holding cost (assume 0.25 per unit per year)
                                carrying = current_stock_actual * avg_unit_price * 0.25 / 365 if current_stock_actual > 0 else 0
                                
                                # stockout_risk_percentage: inverse of stock adequacy; if we have 30 days stock, risk ~3%
                                stockout_risk = (1.0 / max(stock_adequacy, 1)) * 100 if stock_adequacy > 0 else 5.0
                                
                                inventory_entries.append({
                                    'product_id': pid,
                                    'branch_id': bid,
                                    'analysis_date': datetime.utcnow().date().isoformat(),
                                    'current_stock': current_stock_actual,
                                    'avg_daily_usage': round(avg_daily, 2),
                                    'stock_adequacy_days': stock_adequacy,
                                    'turnover_ratio': round(turnover, 2),
                                    'carrying_cost': round(carrying, 2),
                                    'stockout_risk_percentage': round(stockout_risk, 2),
                                    'recommendation': f'Daily usage: {avg_daily:.2f} units, Stock covers ~{stock_adequacy} days'
                                })
                            except Exception:
                                logger.exception('Failed to prepare demand/forecast/inventory entry for group %s', g)

                        try:
                            if demand_entries:
                                inserted_demand = db_module.insert_product_demand_history(demand_entries)
                                # Log date range of inserted demand entries
                                if demand_entries:
                                    period_dates = [e.get('period_date') for e in demand_entries if e.get('period_date')]
                                    if period_dates:
                                        logger.info('Inserted %s product_demand_history rows with period dates from %s to %s', 
                                                  inserted_demand, min(period_dates), max(period_dates))
                                    else:
                                        logger.info('Inserted %s product_demand_history rows', inserted_demand)
                        except Exception:
                            logger.exception('Failed to persist product demand history')

                        try:
                            if forecast_entries:
                                inserted_forecasts = db_module.insert_sales_forecasts(forecast_entries)
                                logger.info('Inserted %s sales_forecast rows', inserted_forecasts)
                        except Exception:
                            logger.exception('Failed to persist sales forecasts')

                        try:
                            if inventory_entries:
                                inserted_inv = db_module.insert_inventory_analytics(inventory_entries)
                                logger.info('Inserted %s inventory_analytics rows', inserted_inv)
                        except Exception:
                            logger.exception('Failed to persist inventory analytics')
            except Exception:
                logger.exception('Failed to persist aggregated analytics after import')

            # For each product in file, run EOQ calculation and persist
            try:
                if 'product' in df.columns or 'product_name' in df.columns or 'product_id' in df.columns:
                    # group by product and compute annual demand
                    prod_col = 'product' if 'product' in df.columns else ('product_name' if 'product_name' in df.columns else 'product_id')
                    # Include branch_id in grouping if present
                    group_cols = [prod_col]
                    if 'branch_id' in df.columns:
                        group_cols.append('branch_id')
                    grouped = df.groupby(group_cols)['quantity'].agg(['sum']).reset_index()
                    for _, prod in grouped.iterrows():
                        try:
                            product_identifier = prod[prod_col]
                            # Get branch_id from grouped row if present, otherwise use default
                            prod_branch_id = int(prod.get('branch_id', branch_id)) if 'branch_id' in prod else branch_id
                            product_annual_demand = float((prod['sum'] / days_of_data) * 365) if days_of_data > 0 else 0
                            # prepare EOQ input using defaults or provided overrides
                            holding_cost = float(request.form.get('holding_cost') or (json_payload.get('holding_cost') if json_payload else None) or 50)
                            ordering_cost = float(request.form.get('ordering_cost') or (json_payload.get('ordering_cost') if json_payload else None) or 100)
                            unit_cost = float(request.form.get('unit_cost') or (json_payload.get('unit_cost') if json_payload else None) or 25)
                            lead_time_days = int(request.form.get('lead_time_days') or (json_payload.get('lead_time_days') if json_payload else None) or 7)
                            confidence_level = float(request.form.get('confidence_level') or (json_payload.get('confidence_level') if json_payload else None) or 0.95)

                            eoq_input = EOQInput(
                                annual_demand=product_annual_demand,
                                holding_cost=holding_cost,
                                ordering_cost=ordering_cost,
                                unit_cost=unit_cost,
                                lead_time_days=lead_time_days,
                                confidence_level=confidence_level
                            )
                            result_obj = EOQCalculator.calculate_eoq(eoq_input)

                            # convert EOQResult dataclass to dict
                            # Include all required fields for database persistence
                            result_dict = {
                                'annual_demand': product_annual_demand,
                                'holding_cost': holding_cost,
                                'ordering_cost': ordering_cost,
                                'unit_cost': unit_cost,
                                'lead_time_days': lead_time_days,
                                'confidence_level': confidence_level,
                                'eoq_quantity': result_obj.eoq_quantity,
                                'reorder_point': result_obj.reorder_point,
                                'safety_stock': result_obj.safety_stock,
                                'annual_holding_cost': result_obj.annual_holding_cost,
                                'annual_ordering_cost': result_obj.annual_ordering_cost,
                                'total_annual_cost': result_obj.total_annual_cost,
                                'max_stock_level': result_obj.max_stock_level,
                                'min_stock_level': result_obj.min_stock_level,
                                'average_inventory': result_obj.average_inventory
                            }

                            # Persist EOQ calculation - try to get product_id
                            try:
                                pid = None
                                if prod_col == 'product_id':
                                    try:
                                        pid = int(product_identifier)
                                    except Exception:
                                        pid = None
                                else:
                                    # If product column is a name, try to look up product_id by name
                                    try:
                                        pid = db_module.get_product_id_by_name(str(product_identifier), prod_branch_id)
                                        if pid:
                                            logger.info(f'Found product_id {pid} for product name "{product_identifier}"')
                                        else:
                                            logger.warning(f'Could not find product_id for product name "{product_identifier}" - EOQ will not be persisted')
                                    except Exception as e:
                                        logger.warning(f'Failed to look up product_id for "{product_identifier}": {str(e)}')
                                
                                # Persist to database if we have a product_id
                                if pid:
                                    db_module.insert_eoq_calculation(pid, prod_branch_id, result_dict)
                                    logger.info(f'EOQ persisted to database for product {pid} (name: "{product_identifier}"), branch {prod_branch_id} from file upload')
                                else:
                                    # fall back to storing in mock DB for non-numeric product identifiers
                                    logger.warning(f'EOQ stored in mock DB only (no product_id found) for product "{product_identifier}"')
                                    db.store_eoq(product_identifier, prod_branch_id, result_obj)
                            except Exception:
                                logger.exception('Failed to persist EOQ for product %s', product_identifier)
                        except Exception:
                            logger.exception('EOQ calc failed for a product group')
            except Exception:
                logger.exception('EOQ persistence step failed')

        except Exception:
            logger.exception('Failed while attempting to persist sales to DB')

        # Persist restock recommendations to database
        try:
            inserted_count = 0
            for rec in restock_recommendations:
                # Try to find product_id from the dataframe
                product_identifier = rec.get('product_name')
                if not product_identifier:
                    continue
                    
                try:
                    pid = None
                    # First check if product_identifier is a numeric product_id
                    try:
                        pid = int(product_identifier)
                    except ValueError:
                        # If not, try to look up product_id by name
                        try:
                            pid = db_module.get_product_id_by_name(str(product_identifier), branch_id)
                            if pid:
                                logger.info(f'Found product_id {pid} for restock recommendation product "{product_identifier}"')
                        except Exception as e:
                            logger.warning(f'Failed to look up product_id for restock recommendation "{product_identifier}": {str(e)}')
                    
                    # Persist to database (with or without product_id)
                    # If no product_id found, pass None and let the insert handle it
                    success = db_module.insert_restock_recommendations(pid or None, branch_id, rec)
                    if success:
                        inserted_count += 1
                        logger.info(f'✓ Restock recommendation persisted for product {pid or "unknown"} (name: "{product_identifier}"), branch {branch_id}')
                    else:
                        logger.error(f'✗ Failed to persist restock recommendation for product {pid or "unknown"} (name: "{product_identifier}"), branch {branch_id}')
                except Exception:
                    logger.exception('Failed to persist restock recommendation for product %s', product_identifier)
            logger.info(f'Restock recommendations insertion complete: {inserted_count}/{len(restock_recommendations)} inserted')
        except Exception:
            logger.exception('Restock recommendation persistence step failed')

        # Ensure we have the correct count - df might have been modified
        final_row_count = len(df) if 'df' in locals() and df is not None else 0
        logger.info(f'Final row count for response: {final_row_count} (valid_row_count was: {valid_row_count})')

        response = {
            'success': True,
            'message': f'Imported {final_row_count} sales records',
            'metrics': {
                'total_quantity': float(total_quantity),
                'average_daily': round(float(average_daily), 2),
                'annual_demand': round(float(annual_demand), 2),
                'days_of_data': int(days_of_data),
                'date_range': {
                    'start': df['date'].min().isoformat(),
                    'end': df['date'].max().isoformat()
                }
            },
            'top_products': top_products,
            'restock_recommendations': restock_recommendations
        }

        if inserted_count:
            response['db_inserted'] = int(inserted_count)
        if db_warning:
            response['db_warning'] = db_warning

        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f'Error importing sales data: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to import sales data'}), 500


@analytics_bp.route('/eoq/recommendations', methods=['GET'])
def get_eoq_recommendations():
    """Get all EOQ recommendations"""
    try:
        recommendations = list(db.eoq_results.values())
        
        return jsonify({
            'success': True,
            'data': recommendations
        }), 200
    
    except Exception as e:
        logger.error(f'Error retrieving recommendations: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to retrieve recommendations'}), 500


@analytics_bp.route('/restock-recommendations', methods=['GET'])
def list_restock_recommendations():
    """Return restock recommendations from persistent store.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    try:
        limit = int(request.args.get('limit', 100))
        days = int(request.args.get('days', 30))
        branch_id = request.args.get('branch_id', None)
        if branch_id is not None:
            try:
                branch_id = int(branch_id)
            except ValueError:
                branch_id = None
        
        results = db_module.fetch_restock_recommendations(days=days, branch_id=branch_id, limit=limit)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        logger.warning('Error fetching restock recommendations: %s, returning empty list', str(e))
        # Return empty data instead of 500 error to prevent frontend crash
        return jsonify({'success': True, 'data': []}), 200


@analytics_bp.route('/eoq-calculations', methods=['GET'])
def list_eoq_calculations():
    """Return recent EOQ calculations from persistent store.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    try:
        limit = int(request.args.get('limit', 100))
        branch_id = request.args.get('branch_id', None)
        if branch_id is not None:
            try:
                branch_id = int(branch_id)
            except ValueError:
                branch_id = None
        results = db_module.fetch_eoq_calculations(limit=limit, branch_id=branch_id)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        logger.warning('Error fetching eoq calculations: %s, returning empty list', str(e))
        # Return empty data instead of 500 error to prevent frontend crash
        return jsonify({'success': True, 'data': []}), 200


@analytics_bp.route('/inventory-analytics', methods=['GET'])
def list_inventory_analytics():
    """Return recent inventory analytics rows for dashboard display."""
    try:
        days = int(request.args.get('days', 30))
        limit = int(request.args.get('limit', 100))
        branch_id = request.args.get('branch_id', None)
        if branch_id is not None:
            try:
                branch_id = int(branch_id)
            except ValueError:
                branch_id = None
        results = db_module.fetch_inventory_analytics(days=days, limit=limit, branch_id=branch_id)
        # attach a timeframe label
        timeframe = 'Annual' if days >= 365 else 'Monthly'
        return jsonify({'success': True, 'timeframe': timeframe, 'data': results}), 200
    except Exception as e:
        logger.warning('Error fetching inventory analytics: %s, returning empty list', str(e))
        # Return empty data instead of 500 error to prevent frontend crash
        timeframe = 'Annual' if days >= 365 else 'Monthly'
        return jsonify({'success': True, 'timeframe': timeframe, 'data': []}), 200


@analytics_bp.route('/top-products', methods=['GET'])
def get_top_products():
    """Return top products aggregated over the last `days` days."""
    try:
        days = int(request.args.get('days', 30))
        limit = int(request.args.get('limit', 10))
        branch_id = request.args.get('branch_id', None)
        if branch_id is not None:
            try:
                branch_id = int(branch_id)
            except ValueError:
                branch_id = None
        results = db_module.fetch_top_products(days=days, limit=limit, branch_id=branch_id)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        logger.warning('Error fetching top products: %s, returning empty list', str(e))
        # Return empty data instead of 500 error to prevent frontend crash
        return jsonify({'success': True, 'data': []}), 200


@analytics_bp.route('/sales-summary', methods=['GET'])
def get_sales_summary():
    """Return aggregated sales summary for the last `days` days.
    
    If branch_id is provided, filter to that branch only (for Branch Manager).
    Otherwise, return all branches (for Super Admin).
    """
    try:
        days = int(request.args.get('days', 30))
        branch_id = request.args.get('branch_id', None)
        if branch_id is not None:
            try:
                branch_id = int(branch_id)
            except ValueError:
                branch_id = None
        summary = db_module.fetch_sales_summary(days=days, branch_id=branch_id)
        return jsonify({'success': True, 'data': summary}), 200
    except Exception as e:
        logger.warning('Error fetching sales summary: %s, returning empty summary', str(e))
        # Return empty summary instead of 500 error to prevent frontend crash
        empty_summary = {'total_quantity': 0.0, 'records': 0, 'average_daily': 0.0, 'days_of_data': days, 'date_range': {'start': None, 'end': None}}
        return jsonify({'success': True, 'data': empty_summary}), 200


@analytics_bp.route('/calculate-holding-cost', methods=['POST'])
def calculate_holding_cost():
    """Calculate annual holding cost from unit cost"""
    try:
        data = request.json
        unit_cost = float(data.get('unit_cost', 0))
        holding_cost_percentage = float(data.get('holding_cost_percentage', 0.25))
        
        holding_cost = EOQCalculator.calculate_holding_cost(unit_cost, holding_cost_percentage)
        
        return jsonify({
            'success': True,
            'data': {
                'unit_cost': unit_cost,
                'holding_cost_percentage': holding_cost_percentage,
                'annual_holding_cost': round(holding_cost, 2)
            }
        }), 200
    
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error calculating holding cost: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to calculate holding cost'}), 500


@analytics_bp.route('/calculate-ordering-cost', methods=['POST'])
def calculate_ordering_cost():
    """Calculate cost per order"""
    try:
        data = request.json
        products_per_order = int(data.get('products_per_order', 0))
        fixed_cost = float(data.get('fixed_cost', 50))
        variable_cost = float(data.get('variable_cost_per_item', 0.5))
        
        ordering_cost = EOQCalculator.calculate_ordering_cost(
            products_per_order,
            fixed_cost,
            variable_cost
        )
        
        return jsonify({
            'success': True,
            'data': {
                'products_per_order': products_per_order,
                'fixed_cost': fixed_cost,
                'variable_cost_per_item': variable_cost,
                'total_ordering_cost': round(ordering_cost, 2)
            }
        }), 200
    
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error calculating ordering cost: {str(e)}')
        return jsonify({'success': False, 'error': 'Failed to calculate ordering cost'}), 500


@analytics_bp.route('/stock-deductions', methods=['GET'])
def get_stock_deductions():
    """Get recent stock deductions from sales imports.
    
    Query Parameters:
    - branch_id: Filter by branch (required)
    - limit: Maximum number of results (default: 50)
    - days: Days back to look (default: 1)
    """
    try:
        branch_id = request.args.get('branch_id', type=int)
        limit = request.args.get('limit', default=50, type=int)
        days = request.args.get('days', default=1, type=int)
        
        if not branch_id:
            return jsonify({'success': False, 'error': 'branch_id is required'}), 400
        
        # Fetch recent sales grouped by product to show deductions
        if db_module._supabase_client:
            try:
                # Query sales from the past N days, grouped by product
                import datetime
                start_date = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).isoformat()
                
                resp = db_module._supabase_client.table('sales').select(
                    'product_id, branch_id, quantity_sold, transaction_date'
                ).eq('branch_id', branch_id).gte('transaction_date', start_date).execute()
                
                if getattr(resp, 'error', None):
                    logger.error('Supabase fetch sales error: %s', getattr(resp, 'error', None))
                    # Fall through to psycopg2 path
                    raise RuntimeError(str(getattr(resp, 'error', None)))
                
                if not resp.data:
                    # No sales found, return empty list
                    return jsonify({'success': True, 'data': []}), 200
                
                # Group sales by product_id and aggregate
                sales_by_product = {}
                for sale in resp.data:
                    product_id = sale['product_id']
                    if product_id not in sales_by_product:
                        sales_by_product[product_id] = {
                            'quantity_sold': 0,
                            'transaction_dates': []
                        }
                    sales_by_product[product_id]['quantity_sold'] += sale['quantity_sold']
                    sales_by_product[product_id]['transaction_dates'].append(sale['transaction_date'])
                
                # Get product names and current quantities
                product_ids = list(sales_by_product.keys())
                if not product_ids:
                    return jsonify({'success': True, 'data': []}), 200
                
                # Fetch product details
                resp_products = db_module._supabase_client.table('centralized_product').select(
                    'id, product_name, quantity'
                ).eq('branch_id', branch_id).in_('id', product_ids).execute()
                
                if getattr(resp_products, 'error', None):
                    logger.error('Supabase fetch products error: %s', getattr(resp_products, 'error', None))
                    # Fall through to psycopg2 path
                    raise RuntimeError(str(getattr(resp_products, 'error', None)))
                
                product_details = {p['id']: p for p in (resp_products.data or [])}
                
                # Build deduction records
                deductions = []
                for product_id, sales_info in sales_by_product.items():
                    product = product_details.get(product_id, {})
                    current_qty = product.get('quantity', 0)
                    quantity_deducted = sales_info['quantity_sold']
                    previous_qty = current_qty + quantity_deducted  # Estimate previous quantity
                    
                    deductions.append({
                        'product_id': product_id,
                        'product_name': product.get('product_name', f'Product {product_id}'),
                        'branch_id': branch_id,
                        'quantity_deducted': quantity_deducted,
                        'previous_quantity': previous_qty,
                        'updated_quantity': current_qty,
                        'first_transaction': min(sales_info['transaction_dates']),
                        'last_transaction': max(sales_info['transaction_dates'])
                    })
                
                # Sort by quantity deducted (descending)
                deductions.sort(key=lambda x: x['quantity_deducted'], reverse=True)
                
                return jsonify({
                    'success': True,
                    'data': deductions[:limit],
                    'count': len(deductions)
                }), 200
            except Exception as e:
                logger.warning('Supabase query failed, falling back to psycopg2: %s', str(e))
                # Fall through to psycopg2 path
                pass
        # Fallback to psycopg2 or if Supabase failed
        try:
            import datetime
            start_date = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).isoformat()
            
            conn = db_module.get_conn()
            cur = conn.cursor()
            
            # Query sales grouped by product
            cur.execute('''
                SELECT 
                    s.product_id,
                    SUM(s.quantity_sold) as total_quantity_sold,
                    MIN(s.transaction_date) as first_transaction,
                    MAX(s.transaction_date) as last_transaction,
                    cp.product_name,
                    cp.quantity as current_quantity
                FROM public.sales s
                JOIN public.centralized_product cp ON s.product_id = cp.id AND s.branch_id = cp.branch_id
                WHERE s.branch_id = %s AND s.transaction_date >= %s
                GROUP BY s.product_id, cp.product_name, cp.quantity
                ORDER BY total_quantity_sold DESC
                LIMIT %s
            ''', (branch_id, start_date, limit))
            
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            deductions = []
            for row in rows:
                product_id, total_qty_sold, first_trans, last_trans, product_name, current_qty = row
                deductions.append({
                    'product_id': product_id,
                    'product_name': product_name or f'Product {product_id}',
                    'branch_id': branch_id,
                    'quantity_deducted': int(total_qty_sold),
                    'previous_quantity': int(current_qty + total_qty_sold),
                    'updated_quantity': int(current_qty),
                    'first_transaction': first_trans.isoformat() if first_trans else None,
                    'last_transaction': last_trans.isoformat() if last_trans else None
                })
            
            return jsonify({
                'success': True,
                'data': deductions,
                'count': len(deductions)
            }), 200
            
        except RuntimeError as e:
            # Database configuration error - return empty list instead of crashing
            if 'Database configuration incomplete' in str(e):
                logger.warning('Database not configured, returning empty stock deductions list')
                return jsonify({'success': True, 'data': [], 'count': 0}), 200
            logger.error(f'Error fetching stock deductions: {str(e)}')
            return jsonify({'success': False, 'error': f'Failed to fetch stock deductions: {str(e)}'}), 500
        except Exception as e:
            logger.error(f'Error fetching stock deductions: {str(e)}')
            # If database connection fails, return empty list to prevent frontend crash
            logger.warning('Database connection failed, returning empty stock deductions list')
            return jsonify({'success': True, 'data': [], 'count': 0}), 200
    
    except Exception as e:
        logger.error(f'Error in get_stock_deductions: {str(e)}')
        # Return empty list instead of error to prevent frontend crash
        logger.warning('Unexpected error in get_stock_deductions, returning empty list')
        return jsonify({'success': True, 'data': [], 'count': 0, 'error': str(e)}), 200
