# How to Start Glimpsy

## Quick Start

1. **Install dependencies (first time only):**
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **Start the Flask backend:**
   ```bash
   python app.py
   ```
   
   You should see:
   ```
   * Running on http://0.0.0.0:5000
   * Debug mode: on
   ```

3. **Keep that terminal window open** - the server needs to keep running

4. **Open the frontend:**
   - Option A: Double-click `index.html` to open in your browser
   - Option B: Run a local server:
     ```bash
     python -m http.server 8000
     ```
     Then open: http://localhost:8000

## Verify It's Working

1. **Test the backend:**
   - Open your browser
   - Go to: http://localhost:5000/api/health
   - You should see: `{"status":"healthy","message":"Glimpsy backend is running"}`

2. **Test the frontend:**
   - Open `index.html` in your browser
   - Open browser console (F12)
   - Check for any errors
   - Try uploading a dataset

## Common Issues

### "Not Found" Error
- **Cause:** Flask server is not running
- **Solution:** Start the server with `python app.py` and keep the terminal open

### "Connection Refused" Error
- **Cause:** Flask server stopped or crashed
- **Solution:** Check the terminal where you ran `python app.py` for error messages

### Port Already in Use
- **Cause:** Another application is using port 5000
- **Solution:** Change the port in `app.py` (line 510) to something else like 5001

## Two Terminal Windows Needed

You need **two separate terminal windows**:

**Terminal 1:** Flask Backend
```bash
python app.py
```
Keep this running!

**Terminal 2 (Optional):** Frontend Server
```bash
python -m http.server 8000
```
Or just open `index.html` directly in your browser.

