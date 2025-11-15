# Glimpsy

A locally deployed, full-stack web application for data exploration and analysis. Built for students, researchers, and analysts who need local, private data exploration without heavy enterprise tooling.

## 🎯 Features

### Current Capabilities
- ✅ **Dataset Upload**: Upload CSV or Parquet files (max 10MB)
- ✅ **Data Filtering**: Apply date ranges, category filters, and numerical thresholds
- ✅ **Interactive Visualizations**: Create line, bar, scatter, and pie charts using Plotly
- ✅ **Export Results**: Export filtered data as CSV or visualizations as PNG
- ✅ **Portfolio Comparison**: Upload two datasets and explore them side-by-side
- ✅ **SQLite Database**: All data stored locally in SQLite

### Planned Features
- 📋 Live data ingestion via API (with constraints and formatting rules)
- 📋 Enhanced visualization engine
- 📋 Enhanced filter engine
- 📋 Forecasting module (time series, anomaly detection)

## 🏗️ Architecture

- **Backend**: Flask (Python) with SQLite database
- **Frontend**: Plain HTML + JavaScript + Plotly
- **File Support**: CSV and Parquet formats
- **Data Storage**: All data stays local on your machine

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

### Installation

1. **Install dependencies:**
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **Start the Flask backend:**
   ```bash
   python app.py
   ```
   You should see:
   ```
   ==================================================
   Glimpsy Backend Server
   ==================================================
   Starting server on http://localhost:5000
   ```

3. **Open the frontend:**
   - Open `index.html` in your web browser
   - Or run a local server: `python -m http.server 8000` and visit `http://localhost:8000`

## 📁 Project Structure

```
glimpsy/
├── app.py              # Flask backend
├── api.js              # API client
├── app.js              # Main frontend application
├── index.html          # Frontend HTML
├── styles.css          # CSS styling
├── requirements.txt      # Python dependencies
├── glimpsy.db         # SQLite database (auto-created)
└── uploads/           # Uploaded files directory
```

## 📊 Usage

### Upload a Dataset
1. Go to **Datasets** section
2. Click **Upload Dataset**
3. Select a CSV or Parquet file
4. Enter name and description
5. Click **Upload**

### Create Visualizations
1. Select a dataset from dropdown
2. Choose chart type (Line, Bar, Scatter, Pie)
3. Select X and Y axes
4. Chart updates automatically

### Filter Data
1. Set date range (if applicable)
2. Apply category filters
3. Set numerical thresholds
4. Click **Apply Filters**

### Portfolio Comparison
1. Go to **Portfolio Comparison** section
2. Select two datasets
3. Enter comparison name
4. Click **Create Comparison**
5. View side-by-side analysis

### Export
- **Export Chart**: Download visualization as PNG
- **Export Data**: Download filtered data as CSV

## 🔌 API Endpoints

- `GET /api/health` - Health check
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/<id>` - Get dataset with data
- `POST /api/datasets` - Upload new dataset
- `DELETE /api/datasets/<id>` - Delete dataset
- `POST /api/datasets/<id>/filter` - Apply filters
- `GET /api/datasets/<id>/export` - Export as CSV
- `GET /api/portfolio-comparisons` - List comparisons
- `POST /api/portfolio-comparisons` - Create comparison
- `GET /api/portfolio-comparisons/<id>` - Get comparison

## 🔒 Privacy & Security

- **100% Local**: All data stays on your machine
- **No External Calls**: No data transmission to external servers
- **File Size Limit**: 10MB maximum per file
- **Input Validation**: All inputs validated and sanitized

## 🐛 Troubleshooting

### "Not Found" Error
- Make sure Flask server is running: `python app.py`
- Keep the terminal window open while using the app

### Backend Won't Start
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `python -m pip install -r requirements.txt`

### File Upload Fails
- Check file size (max 10MB)
- Verify file format (CSV or Parquet)
- Check browser console for errors

### Port Already in Use
- Change port in `app.py` (line 508): `port=5001`
- Update `api.js` (line 6): `http://localhost:5001/api`

## 📝 Requirements

- Flask 3.0.0
- flask-cors 4.0.0
- pandas 2.1.3
- pyarrow 14.0.1 (for Parquet support)
- Werkzeug 3.0.1

## 📄 License

This project is created for educational purposes as part of a final project.

---

**Glimpsy** - Making data exploration accessible, private, and powerful.
