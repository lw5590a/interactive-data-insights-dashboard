# Troubleshooting Guide

## "Not Found" Error

If you're seeing "Not Found" errors, it usually means:

1. **The Flask backend is not running**
   - Make sure you've started the Flask server: `python app.py`
   - You should see: `* Running on http://0.0.0.0:5000`
   - Keep that terminal window open while using the app

2. **Wrong URL being accessed**
   - The backend API is at: `http://localhost:5000/api/...`
   - The frontend should be opened separately (index.html)

3. **Port conflict**
   - If port 5000 is in use, change it in `app.py` line 495:
     ```python
     app.run(debug=True, host='0.0.0.0', port=5001)
     ```
   - Then update `api.js` line 6:
     ```javascript
     const API_BASE_URL = 'http://localhost:5001/api';
     ```

## Common Issues

### Flask Server Won't Start

**Error: "ModuleNotFoundError: No module named 'flask'"**
```bash
python -m pip install -r requirements.txt
```

**Error: "Address already in use"**
- Another process is using port 5000
- Close other applications or change the port (see above)

**Error: "Python was not found"**
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### Frontend Can't Connect to Backend

**Check:**
1. Is Flask server running? (You should see output in terminal)
2. Open browser console (F12) and check for errors
3. Try accessing: http://localhost:5000/api/health in your browser
4. Check CORS errors in console

**Solution:**
- Make sure `flask-cors` is installed: `python -m pip install flask-cors`
- Verify `app.py` has `CORS(app)` on line 18

### File Upload Fails

**Error: "File type not allowed"**
- Only CSV and Parquet files are supported
- Check file extension is `.csv` or `.parquet`

**Error: "File too large"**
- Maximum file size is 10MB
- Split large files or increase limit in `app.py` line 24

### Database Errors

**Error: "database is locked"**
- Close other connections to the database
- Restart the Flask server

**Error: "no such table"**
- Delete `glimpsy.db` and restart the server
- The database will be recreated automatically

## Step-by-Step Startup

1. **Terminal 1 - Start Backend:**
   ```bash
   python app.py
   ```
   Should see: `* Running on http://0.0.0.0:5000`

2. **Terminal 2 - Start Frontend Server (optional):**
   ```bash
   python -m http.server 8000
   ```
   Then open: http://localhost:8000

3. **Or just open `index.html` directly in your browser**

## Testing the Backend

Test if the backend is working:

1. **In browser, go to:** http://localhost:5000/api/health
   - Should see: `{"status":"healthy","message":"Glimpsy backend is running"}`

2. **In browser, go to:** http://localhost:5000/
   - Should see API information

3. **Check browser console (F12):**
   - Look for any red error messages
   - Check Network tab to see if API calls are failing

## Still Having Issues?

1. Check Python version: `python --version` (should be 3.8+)
2. Check all dependencies: `python -m pip list`
3. Check Flask is running: Look for terminal output
4. Check browser console for JavaScript errors
5. Verify file paths are correct

