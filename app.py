"""
Glimpsy - Full-Stack Data Exploration Application
Backend: Flask with SQLite
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import pandas as pd
import json
import os
import io
from datetime import datetime
from werkzeug.utils import secure_filename
import uuid

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
DATABASE = 'glimpsy.db'
ALLOWED_EXTENSIONS = {'csv', 'parquet'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Datasets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            columns TEXT NOT NULL,
            row_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Dataset records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dataset_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id INTEGER NOT NULL,
            record_data TEXT NOT NULL,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        )
    ''')
    
    # Portfolio comparisons table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS portfolio_comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dataset1_id INTEGER NOT NULL,
            dataset2_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dataset1_id) REFERENCES datasets(id) ON DELETE CASCADE,
            FOREIGN KEY (dataset2_id) REFERENCES datasets(id) ON DELETE CASCADE
        )
    ''')
    
    # API ingestion rules (for future use)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_ingestion_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            api_url TEXT NOT NULL,
            constraints TEXT,
            formatting_rules TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()


def apply_filters(data, filters, columns):
    """Apply filters to dataset - general purpose filter engine"""
    filtered = data.copy()
    
    if not filters:
        return filtered
    
    # Date range filters - check all date-like columns
    if filters.get('start_date') or filters.get('end_date'):
        date_columns = [col for col in columns if any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated'])]
        if date_columns:
            for date_col in date_columns:
                try:
                    if filters.get('start_date'):
                        start_date = pd.to_datetime(filters['start_date'])
                        filtered = [
                            row for row in filtered
                            if pd.to_datetime(row.get(date_col, ''), errors='coerce') >= start_date
                        ]
                    if filters.get('end_date'):
                        end_date = pd.to_datetime(filters['end_date'])
                        filtered = [
                            row for row in filtered
                            if pd.to_datetime(row.get(date_col, ''), errors='coerce') <= end_date
                        ]
                except:
                    pass
    
    # Column-specific filters (general format: column_name: [values])
    for column_name, filter_value in filters.items():
        if column_name in ['start_date', 'end_date']:
            continue  # Already handled
        
        if column_name not in columns:
            continue
        
        # Skip empty filters
        if filter_value is None or filter_value == '' or (isinstance(filter_value, list) and len(filter_value) == 0):
            continue
        
        # Categorical filter (list of values)
        if isinstance(filter_value, list):
            if 'all' not in [str(v).lower() for v in filter_value]:
                filtered = [
                    row for row in filtered
                    if str(row.get(column_name, '')).lower() in [str(v).lower() for v in filter_value]
                ]
        
        # Range filter (min/max object)
        elif isinstance(filter_value, dict):
            if 'min' in filter_value and filter_value['min'] is not None:
                try:
                    min_val = float(filter_value['min'])
                    filtered = [
                        row for row in filtered
                        if pd.to_numeric(row.get(column_name, 0), errors='coerce') >= min_val
                    ]
                except:
                    pass
            
            if 'max' in filter_value and filter_value['max'] is not None:
                try:
                    max_val = float(filter_value['max'])
                    filtered = [
                        row for row in filtered
                        if pd.to_numeric(row.get(column_name, 0), errors='coerce') <= max_val
                    ]
                except:
                    pass
        
        # Single value filter (exact match)
        elif filter_value:
            filtered = [
                row for row in filtered
                if str(row.get(column_name, '')).lower() == str(filter_value).lower()
            ]
    
    return filtered


# ==================== ROUTES ====================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'message': 'Glimpsy API Server',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'datasets': '/api/datasets',
            'portfolio_comparisons': '/api/portfolio-comparisons'
        }
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Glimpsy backend is running',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    """Get all datasets"""
    try:
        conn = get_db_connection()
        datasets = conn.execute('''
            SELECT id, name, description, file_type, row_count, created_at
            FROM datasets
            ORDER BY created_at DESC
        ''').fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in datasets])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/datasets/<int:dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """Get specific dataset with data"""
    try:
        conn = get_db_connection()
        dataset = conn.execute('SELECT * FROM datasets WHERE id = ?', (dataset_id,)).fetchone()
        
        if not dataset:
            conn.close()
            return jsonify({'error': 'Dataset not found'}), 404
        
        # Get records
        records = conn.execute('''
            SELECT record_data FROM dataset_records WHERE dataset_id = ?
        ''', (dataset_id,)).fetchall()
        conn.close()
        
        # Parse records
        data = [json.loads(record['record_data']) for record in records]
        columns = json.loads(dataset['columns'])
        
        return jsonify({
            'id': dataset['id'],
            'name': dataset['name'],
            'description': dataset['description'],
            'columns': columns,
            'data': data,
            'row_count': dataset['row_count'],
            'file_type': dataset['file_type'],
            'created_at': dataset['created_at']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/datasets', methods=['POST'])
def upload_dataset():
    """Upload a new dataset"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Only CSV and Parquet files are supported.'}), 400
        
        # Get metadata
        name = request.form.get('name', file.filename.rsplit('.', 1)[0])
        description = request.form.get('description', '')
        
        # Secure filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Read file based on type
        file_ext = filename.rsplit('.', 1)[1].lower()
        try:
            if file_ext == 'csv':
                df = pd.read_csv(file_path)
            elif file_ext == 'parquet':
                df = pd.read_parquet(file_path)
            else:
                os.remove(file_path)
                return jsonify({'error': 'Unsupported file type'}), 400
        except Exception as e:
            os.remove(file_path)
            return jsonify({'error': f'Error reading file: {str(e)}'}), 400
        
        # Process data
        df = df.fillna('')
        records = df.to_dict('records')
        columns = list(df.columns)
        row_count = len(records)
        
        # Store in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO datasets (name, description, filename, file_path, file_type, columns, row_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, description, filename, file_path, file_ext, json.dumps(columns), row_count))
        
        dataset_id = cursor.lastrowid
        
        # Store records
        for record in records:
            cursor.execute('''
                INSERT INTO dataset_records (dataset_id, record_data)
                VALUES (?, ?)
            ''', (dataset_id, json.dumps(record)))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': dataset_id,
            'name': name,
            'message': 'Dataset uploaded successfully',
            'row_count': row_count,
            'columns': columns
        }), 201
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500


@app.route('/api/datasets/<int:dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """Delete a dataset"""
    try:
        conn = get_db_connection()
        dataset = conn.execute('SELECT file_path FROM datasets WHERE id = ?', (dataset_id,)).fetchone()
        
        if not dataset:
            conn.close()
            return jsonify({'error': 'Dataset not found'}), 404
        
        # Delete file
        if os.path.exists(dataset['file_path']):
            os.remove(dataset['file_path'])
        
        # Delete from database
        conn.execute('DELETE FROM datasets WHERE id = ?', (dataset_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Dataset deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/datasets/<int:dataset_id>/filter', methods=['POST'])
def filter_dataset(dataset_id):
    """Apply filters to a dataset"""
    try:
        conn = get_db_connection()
        dataset = conn.execute('SELECT * FROM datasets WHERE id = ?', (dataset_id,)).fetchone()
        
        if not dataset:
            conn.close()
            return jsonify({'error': 'Dataset not found'}), 404
        
        # Get records
        records = conn.execute('''
            SELECT record_data FROM dataset_records WHERE dataset_id = ?
        ''', (dataset_id,)).fetchall()
        conn.close()
        
        # Parse records
        data = [json.loads(record['record_data']) for record in records]
        columns = json.loads(dataset['columns'])
        
        # Get filter parameters
        filters = request.json.get('filters', {})
        
        # Apply filters
        filtered_data = apply_filters(data, filters, columns)
        
        return jsonify({
            'data': filtered_data,
            'row_count': len(filtered_data),
            'original_count': len(data)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/datasets/<int:dataset_id>/export', methods=['GET'])
def export_dataset(dataset_id):
    """Export filtered dataset as CSV"""
    try:
        conn = get_db_connection()
        dataset = conn.execute('SELECT * FROM datasets WHERE id = ?', (dataset_id,)).fetchone()
        
        if not dataset:
            conn.close()
            return jsonify({'error': 'Dataset not found'}), 404
        
        # Get filter parameters
        filters_str = request.args.get('filters', '{}')
        filters = json.loads(filters_str) if filters_str else {}
        
        # Get records
        records = conn.execute('''
            SELECT record_data FROM dataset_records WHERE dataset_id = ?
        ''', (dataset_id,)).fetchall()
        conn.close()
        
        # Parse records
        data = [json.loads(record['record_data']) for record in records]
        columns = json.loads(dataset['columns'])
        
        # Apply filters
        filtered_data = apply_filters(data, filters, columns)
        
        # Create DataFrame and convert to CSV
        df = pd.DataFrame(filtered_data)
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f"{dataset['name']}_export.csv"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio-comparisons', methods=['GET'])
def get_portfolio_comparisons():
    """Get all portfolio comparisons"""
    try:
        conn = get_db_connection()
        comparisons = conn.execute('''
            SELECT pc.*, 
                   d1.name as dataset1_name,
                   d2.name as dataset2_name
            FROM portfolio_comparisons pc
            JOIN datasets d1 ON pc.dataset1_id = d1.id
            JOIN datasets d2 ON pc.dataset2_id = d2.id
            ORDER BY pc.created_at DESC
        ''').fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in comparisons])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio-comparisons', methods=['POST'])
def create_portfolio_comparison():
    """Create a new portfolio comparison"""
    try:
        data = request.json
        dataset1_id = data.get('dataset1_id')
        dataset2_id = data.get('dataset2_id')
        name = data.get('name', f'Comparison {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        
        if not dataset1_id or not dataset2_id:
            return jsonify({'error': 'Both dataset IDs are required'}), 400
        
        if dataset1_id == dataset2_id:
            return jsonify({'error': 'Please select two different datasets'}), 400
        
        conn = get_db_connection()
        
        # Verify datasets exist
        dataset1 = conn.execute('SELECT id FROM datasets WHERE id = ?', (dataset1_id,)).fetchone()
        dataset2 = conn.execute('SELECT id FROM datasets WHERE id = ?', (dataset2_id,)).fetchone()
        
        if not dataset1 or not dataset2:
            conn.close()
            return jsonify({'error': 'One or both datasets not found'}), 404
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO portfolio_comparisons (name, dataset1_id, dataset2_id)
            VALUES (?, ?, ?)
        ''', (name, dataset1_id, dataset2_id))
        
        comparison_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': comparison_id,
            'name': name,
            'dataset1_id': dataset1_id,
            'dataset2_id': dataset2_id,
            'message': 'Portfolio comparison created successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio-comparisons/<int:comparison_id>', methods=['GET'])
def get_portfolio_comparison(comparison_id):
    """Get portfolio comparison with both datasets"""
    try:
        conn = get_db_connection()
        comparison = conn.execute('''
            SELECT * FROM portfolio_comparisons WHERE id = ?
        ''', (comparison_id,)).fetchone()
        
        if not comparison:
            conn.close()
            return jsonify({'error': 'Portfolio comparison not found'}), 404
        
        # Get dataset 1
        dataset1_row = conn.execute('SELECT * FROM datasets WHERE id = ?', (comparison['dataset1_id'],)).fetchone()
        records1 = conn.execute('''
            SELECT record_data FROM dataset_records WHERE dataset_id = ?
        ''', (comparison['dataset1_id'],)).fetchall()
        data1 = [json.loads(record['record_data']) for record in records1]
        
        # Get dataset 2
        dataset2_row = conn.execute('SELECT * FROM datasets WHERE id = ?', (comparison['dataset2_id'],)).fetchone()
        records2 = conn.execute('''
            SELECT record_data FROM dataset_records WHERE dataset_id = ?
        ''', (comparison['dataset2_id'],)).fetchall()
        data2 = [json.loads(record['record_data']) for record in records2]
        
        conn.close()
        
        dataset1 = {
            'id': dataset1_row['id'],
            'name': dataset1_row['name'],
            'description': dataset1_row['description'],
            'columns': json.loads(dataset1_row['columns']),
            'data': data1,
            'row_count': dataset1_row['row_count'],
            'file_type': dataset1_row['file_type']
        }
        
        dataset2 = {
            'id': dataset2_row['id'],
            'name': dataset2_row['name'],
            'description': dataset2_row['description'],
            'columns': json.loads(dataset2_row['columns']),
            'data': data2,
            'row_count': dataset2_row['row_count'],
            'file_type': dataset2_row['file_type']
        }
        
        return jsonify({
            'id': comparison['id'],
            'name': comparison['name'],
            'dataset1': dataset1,
            'dataset2': dataset2,
            'created_at': comparison['created_at']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    init_db()
    print("=" * 50)
    print("Glimpsy Backend Server")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("API endpoints available at http://localhost:5000/api")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
