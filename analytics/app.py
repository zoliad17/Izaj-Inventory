from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import pandas as pd
from io import BytesIO
import logging

# Handle both relative and absolute imports
try:
    from .eoq_calculator import EOQCalculator, EOQInput, DemandForecaster, InventoryAnalytics
except ImportError:
    from eoq_calculator import EOQCalculator, EOQInput, DemandForecaster, InventoryAnalytics

# Load environment variables from multiple locations
# Try: analytics/.env, repo root .env, analytics/.env.local, repo root .env.local
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

for env_file in env_files:
    if env_file.exists():
        load_dotenv(env_file, override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # Register blueprints
    try:
        from .routes import analytics_bp
    except ImportError:
        from routes import analytics_bp
    app.register_blueprint(analytics_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'service': 'analytics'}), 200
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'success': False, 'error': 'Bad request'}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f'Internal error: {str(error)}')
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)
