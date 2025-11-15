# Sample Data Files

This directory contains sample CSV files for testing Glimpsy.

## Available Datasets

### 1. sales_data.csv
- **Description**: Sales data with products, categories, regions, and financial metrics
- **Rows**: 50
- **Columns**: Date, Product, Category, Region, Units_Sold, Revenue, Cost, Profit
- **Use Cases**: 
  - Analyze sales trends over time
  - Compare performance by region or category
  - Visualize revenue vs profit relationships

### 2. finance_portfolio.csv
- **Description**: Financial portfolio data with CD accounts, savings, and investment details
- **Rows**: 60
- **Columns**: Date, Account_Type, Customer_Segment, Bank, Principal, Interest_Rate, Days_to_Maturity, Status, Expected_Return
- **Use Cases**:
  - Portfolio comparison (perfect for testing portfolio comparison feature!)
  - Interest rate analysis
  - Customer segment analysis
  - Bank performance comparison

### 3. health_metrics.csv
- **Description**: Public health data with cases, mortality rates, and demographics
- **Rows**: 180
- **Columns**: Date, Region, Age_Group, Gender, Condition, Cases, Mortality_Rate, Hospitalizations, Recovery_Time_Days
- **Use Cases**:
  - Health trend analysis
  - Demographic comparisons
  - Regional health metrics
  - Condition-specific analysis

## How to Use

1. **Start Glimpsy backend:**
   ```bash
   python app.py
   ```

2. **Open the frontend** (index.html in browser)

3. **Upload a sample file:**
   - Go to "Datasets" section
   - Click "Upload Dataset"
   - Select one of the CSV files from the `samples/` directory
   - Enter a name and description
   - Click "Upload"

4. **Try Portfolio Comparison:**
   - Upload `finance_portfolio.csv` twice with different names
   - Or upload `sales_data.csv` and `health_metrics.csv`
   - Go to "Portfolio Comparison" section
   - Select both datasets
   - Create comparison

## Testing Features

### With sales_data.csv:
- ✅ Date range filtering (Jan 15 - Mar 1, 2024)
- ✅ Category filtering (Electronics, Accessories, Tools)
- ✅ Region filtering (North, South, East, West)
- ✅ Numerical filtering (Revenue, Profit, Units_Sold)
- ✅ Visualizations: Revenue over time, Profit by Category, etc.

### With finance_portfolio.csv:
- ✅ Date range filtering
- ✅ Account type filtering (CD, Savings)
- ✅ Customer segment filtering (Retail, Corporate)
- ✅ Bank filtering (First National, City Bank, Community Bank)
- ✅ Interest rate analysis
- ✅ Perfect for portfolio comparison feature!

### With health_metrics.csv:
- ✅ Date range filtering
- ✅ Region filtering (North, South, East, West)
- ✅ Age group filtering (18-30, 31-50, 51-70)
- ✅ Gender filtering (Male, Female)
- ✅ Condition filtering (Respiratory, Cardiovascular)
- ✅ Mortality rate analysis
- ✅ Cases vs Hospitalizations visualization

## Tips

- **For Portfolio Comparison**: Upload `finance_portfolio.csv` as two separate datasets (e.g., "Portfolio Q1" and "Portfolio Q2") to compare them side-by-side
- **For Filtering Tests**: Use `health_metrics.csv` - it has many categorical columns perfect for testing filters
- **For Time Series**: Use `sales_data.csv` - it has consistent daily data perfect for trend analysis

Enjoy exploring your data! 📊

