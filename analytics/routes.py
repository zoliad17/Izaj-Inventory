from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import pandas as pd
from io import BytesIO

from .eoq_calculator import EOQCalculator, EOQInput, DemandForecaster, InventoryAnalytics

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
        
        # Store in mock database
        product_id = data.get('product_id')
        branch_id = data.get('branch_id')
        if product_id and branch_id:
            db.store_eoq(product_id, branch_id, result)
        
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
        
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(file)
        else:
            return jsonify({
                'success': False,
                'error': 'Unsupported file format. Use CSV or Excel'
            }), 400
        
        # Expected columns
        required_columns = ['quantity', 'date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                'success': False,
                'error': f'Missing columns: {", ".join(missing_columns)}'
            }), 400
        
        # Convert to numeric
        df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        # Remove invalid rows
        df = df.dropna(subset=['quantity', 'date'])
        
        if df.empty:
            return jsonify({
                'success': False,
                'error': 'No valid data found in file'
            }), 400
        
        # Calculate metrics
        total_quantity = df['quantity'].sum()
        average_daily = df['quantity'].mean()
        days_of_data = (df['date'].max() - df['date'].min()).days + 1
        annual_demand = (total_quantity / days_of_data) * 365 if days_of_data > 0 else 0
        
        # Extract product-level analytics if product column exists
        top_products = []
        restock_recommendations = []
        
        if 'product' in df.columns or 'product_name' in df.columns:
            product_col = 'product' if 'product' in df.columns else 'product_name'
            product_analytics = df.groupby(product_col)['quantity'].agg(['sum', 'mean', 'count']).reset_index()
            product_analytics.columns = ['product_name', 'total_sold', 'avg_daily', 'transaction_count']
            product_analytics = product_analytics.sort_values('total_sold', ascending=False)
            
            # Top 5 products
            top_products = product_analytics.head(5).to_dict('records')
            for item in top_products:
                item['total_sold'] = int(item['total_sold'])
                item['avg_daily'] = round(float(item['avg_daily']), 2)
                item['transaction_count'] = int(item['transaction_count'])
            
            # Low stock products (bottom 5 by sales = slow movers needing attention)
            slow_movers = product_analytics.tail(5).to_dict('records')
            restock_recommendations = [
                {
                    'product_name': item['product_name'],
                    'last_sold_qty': int(item['total_sold']),
                    'daily_rate': round(float(item['avg_daily']), 2),
                    'recommendation': f"Monitor closely - selling {round(float(item['avg_daily']), 1)} units/day",
                    'priority': 'medium' if item['avg_daily'] > 0 else 'low'
                }
                for item in slow_movers
            ]
        
        logger.info(f'Sales data imported: {len(df)} records, annual demand: {annual_demand}')
        
        return jsonify({
            'success': True,
            'message': f'Imported {len(df)} sales records',
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
        }), 200
    
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
