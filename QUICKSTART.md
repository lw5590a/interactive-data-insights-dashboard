# Glimpsy Quick Start Guide

Get Glimpsy up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Start the Backend

```bash
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
```

## Step 3: Open the Frontend

### Option A: Direct File Open
Simply open `index.html` in your web browser.

### Option B: Local Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

## Step 4: Test the Application

1. **Check Backend Connection**
   - Open browser console (F12)
   - You should see API calls to `http://localhost:5000`

2. **Upload a Dataset**
   - Go to **Datasets** section
   - Click **Upload Dataset**
   - Select a CSV or Parquet file
   - Enter a name and click **Upload**

3. **Create a Visualization**
   - Go to **Dashboard** section
   - Select your uploaded dataset
   - Choose chart type and axes
   - View your visualization!

4. **Try Portfolio Comparison**
   - Upload two datasets
   - Go to **Portfolio Comparison** section
   - Select both datasets
   - Click **Create Comparison**
   - View side-by-side comparison

## Troubleshooting

### Backend won't start
- Check if port 5000 is in use: `netstat -an | findstr 5000` (Windows) or `lsof -i :5000` (Mac/Linux)
- Change port in `app.py` if needed

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:5000`
- Check `api.js` - API_BASE_URL should be `http://localhost:5000/api`
- Check browser console for CORS errors

### File upload fails
- Check file size (max 10MB)
- Verify file format (CSV or Parquet)
- Check backend console for errors

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints in `app.py`
- Customize the frontend in `script.js` and `styles.css`

Happy exploring! 🚀

