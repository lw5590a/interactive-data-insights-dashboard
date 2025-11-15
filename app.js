/**
 * Glimpsy - Main Application JavaScript
 * Clean, organized frontend code
 */

// Initialize API client
const api = new GlimpsyAPI();

// Main Application Class
class GlimpsyApp {
    constructor() {
        this.currentDataset = null;
        this.currentData = null;
        this.filteredData = null;
        this.columns = [];
        this.chartInstance = null;
        this.settings = this.loadSettings();
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkBackend();
        await this.loadDatasets();
        await this.loadPortfolioComparisons();
    }

    async checkBackend() {
        try {
            await api.healthCheck();
            this.showNotification('Backend connected', 'success');
        } catch (error) {
            this.showNotification('Backend not available. Please start the Flask server.', 'error');
            console.error('Backend check failed:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(link.getAttribute('href').substring(1));
            });
        });

        // Dataset selection
        const datasetSelect = document.getElementById('datasetSelect');
        if (datasetSelect) {
            datasetSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value && !isNaN(value)) {
                    this.loadDataset(parseInt(value));
                }
            });
        }

        // Upload
        const uploadBtn = document.getElementById('uploadDatasetBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }

        // Filters
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Chart controls
        const chartType = document.getElementById('chartType');
        if (chartType) {
            chartType.addEventListener('change', () => this.updateVisualization());
        }

        const xAxis = document.getElementById('xAxis');
        if (xAxis) {
            xAxis.addEventListener('change', () => this.updateVisualization());
        }

        const yAxis = document.getElementById('yAxis');
        if (yAxis) {
            yAxis.addEventListener('change', () => this.updateVisualization());
        }

        // Export
        const exportChartBtn = document.getElementById('exportChartBtn');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', () => this.exportChart());
        }

        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        // Portfolio comparison
        const createComparisonBtn = document.getElementById('createComparisonBtn');
        if (createComparisonBtn) {
            createComparisonBtn.addEventListener('click', () => this.createPortfolioComparison());
        }

        const quickCompareBtn = document.getElementById('quickCompareBtn');
        if (quickCompareBtn) {
            quickCompareBtn.addEventListener('click', () => this.quickCompare());
        }

        // Modal controls
        const closeModal = document.getElementById('closeUploadModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideUploadModal());
        }
    }

    navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    async loadDatasets() {
        try {
            const datasets = await api.getDatasets();
            const select = document.getElementById('datasetSelect');
            if (select) {
                // Clear existing options except the first one
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // Add datasets
                datasets.forEach(dataset => {
                    const option = document.createElement('option');
                    option.value = dataset.id;
                    option.textContent = `${dataset.name} (${dataset.row_count} rows)`;
                    select.appendChild(option);
                });
            }

            // Update portfolio selects
            this.updatePortfolioSelects(datasets);
        } catch (error) {
            console.error('Failed to load datasets:', error);
        }
    }

    updatePortfolioSelects(datasets) {
        const select1 = document.getElementById('portfolioDataset1');
        const select2 = document.getElementById('portfolioDataset2');

        [select1, select2].forEach(select => {
            if (select) {
                while (select.options.length > 1) {
                    select.remove(1);
                }

                datasets.forEach(dataset => {
                    const option = document.createElement('option');
                    option.value = dataset.id;
                    option.textContent = `${dataset.name} (${dataset.row_count} rows)`;
                    select.appendChild(option);
                });
            }
        });
    }

    async loadDataset(datasetId) {
        try {
            const dataset = await api.getDataset(datasetId);
            
            this.currentDataset = dataset;
            this.currentData = dataset.data;
            this.filteredData = [...dataset.data];
            this.columns = dataset.columns;

            // Show filter section
            const filterSection = document.getElementById('filterSection');
            if (filterSection) {
                filterSection.style.display = 'block';
                filterSection.classList.remove('hidden');
            }

            // Populate and display filters
            this.populateFilters();
            
            // Show visualization area
            const vizArea = document.getElementById('visualizationArea');
            if (vizArea) vizArea.style.display = 'block';
            
            this.updateVisualization();
            this.updateSummaryStats();
            this.updateDataTable();

            this.showNotification(`Loaded: ${dataset.name}`, 'success');
        } catch (error) {
            this.showNotification('Failed to load dataset: ' + error.message, 'error');
        }
    }

    populateFilters() {
        const container = document.getElementById('dynamicFiltersContainer');
        if (!container) {
            console.warn('Dynamic filters container not found');
            return;
        }

        if (!this.currentData || this.currentData.length === 0) {
            container.innerHTML = '<p class="empty-message">No data available for filtering</p>';
            return;
        }

        // Clear existing dynamic filters
        container.innerHTML = '';

        // Detect column types
        const columnTypes = this.detectColumnTypes();
        
        console.log('Column types detected:', columnTypes);

        // Populate date range if date columns exist
        const dateColumns = columnTypes.date;
        const startDateEl = document.getElementById('startDate');
        const dateRangeGroup = startDateEl ? startDateEl.closest('.filter-group') : null;
        const dateRangeDisplay = document.getElementById('datasetDateRange');
        
        if (dateColumns.length > 0) {
            const dates = this.currentData
                .map(row => row[dateColumns[0]])
                .filter(d => d)
                .map(d => new Date(d))
                .filter(d => !isNaN(d));

            if (dates.length > 0) {
                const minDate = new Date(Math.min(...dates));
                const maxDate = new Date(Math.max(...dates));
                
                const endDateEl = document.getElementById('endDate');
                if (startDateEl) {
                    startDateEl.min = minDate.toISOString().split('T')[0];
                    startDateEl.max = maxDate.toISOString().split('T')[0];
                }
                if (endDateEl) {
                    endDateEl.min = minDate.toISOString().split('T')[0];
                    endDateEl.max = maxDate.toISOString().split('T')[0];
                }
                
                const dateRangeValue = document.getElementById('datasetDateRangeValue');
                if (dateRangeValue) {
                    dateRangeValue.textContent = 
                        `${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`;
                }

                // Show date filter controls
                if (dateRangeGroup) dateRangeGroup.style.display = 'flex';
                if (dateRangeDisplay) dateRangeDisplay.style.display = 'block';
            } else {
                // Hide if no valid dates
                if (dateRangeGroup) dateRangeGroup.style.display = 'none';
                if (dateRangeDisplay) dateRangeDisplay.style.display = 'none';
            }
        } else {
            // Hide date filters if no date columns
            if (dateRangeGroup) dateRangeGroup.style.display = 'none';
            if (dateRangeDisplay) dateRangeDisplay.style.display = 'none';
        }

        // Create filters for each column
        let filtersCreated = 0;
        this.columns.forEach(column => {
            // Skip date columns (handled separately)
            if (columnTypes.date.includes(column)) {
                return;
            }

            const colType = columnTypes.categorical.includes(column) ? 'categorical' :
                          columnTypes.numerical.includes(column) ? 'numerical' : null;
            
            if (colType === 'categorical') {
                this.createCategoricalFilter(container, column);
                filtersCreated++;
            } else if (colType === 'numerical') {
                this.createNumericalFilter(container, column);
                filtersCreated++;
            }
        });

        // Show message if no filters were created
        if (filtersCreated === 0) {
            container.innerHTML = '<p class="empty-message" style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 1rem;">No filterable columns detected. All columns are text-based or have too many unique values.</p>';
        } else {
            // Add a summary
            const summary = document.createElement('div');
            summary.className = 'filter-summary';
            summary.style.cssText = 'grid-column: 1 / -1; padding: 0.75rem; background: #f0f9ff; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; color: #0369a1;';
            summary.innerHTML = `<i class="fas fa-info-circle"></i> ${filtersCreated} filter${filtersCreated > 1 ? 's' : ''} available for this dataset`;
            container.insertBefore(summary, container.firstChild);
        }

        // Populate axis selectors
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');

        if (xAxisSelect) {
            xAxisSelect.innerHTML = '<option value="">Select X-Axis</option>';
            this.columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                xAxisSelect.appendChild(option);
            });
        }

        if (yAxisSelect) {
            yAxisSelect.innerHTML = '<option value="">Select Y-Axis</option>';
            this.columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                yAxisSelect.appendChild(option);
            });
        }
    }

    detectColumnTypes() {
        const types = {
            date: [],
            numerical: [],
            categorical: [],
            text: []
        };

        this.columns.forEach(column => {
            // Check if date column
            if (column.toLowerCase().includes('date') || 
                column.toLowerCase().includes('time') ||
                column.toLowerCase().includes('created') ||
                column.toLowerCase().includes('updated')) {
                types.date.push(column);
                return;
            }

            // Sample data to determine type
            const sampleValues = this.currentData
                .slice(0, 100)
                .map(row => row[column])
                .filter(v => v !== null && v !== undefined && v !== '');

            if (sampleValues.length === 0) {
                types.text.push(column);
                return;
            }

            // Check if numerical
            const numericCount = sampleValues.filter(v => !isNaN(parseFloat(v))).length;
            const numericRatio = numericCount / sampleValues.length;

            if (numericRatio > 0.8) {
                types.numerical.push(column);
                return;
            }

            // Check if categorical (limited unique values)
            const uniqueValues = [...new Set(sampleValues.map(v => String(v).toLowerCase()))];
            const uniqueRatio = uniqueValues.length / sampleValues.length;

            if (uniqueRatio < 0.3 && uniqueValues.length <= 50) {
                types.categorical.push(column);
            } else {
                types.text.push(column);
            }
        });

        return types;
    }

    createCategoricalFilter(container, column) {
        const uniqueValues = [...new Set(this.currentData.map(row => String(row[column] || '')).filter(v => v))];
        
        if (uniqueValues.length === 0) {
            console.log(`Skipping ${column}: no values`);
            return;
        }
        
        if (uniqueValues.length > 100) {
            console.log(`Skipping ${column}: too many unique values (${uniqueValues.length})`);
            return;
        }

        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group dynamic-filter';
        filterGroup.dataset.column = column;
        filterGroup.dataset.type = 'categorical';

        const label = document.createElement('label');
        label.textContent = column;
        label.setAttribute('for', `filter_${column}`);

        const selectContainer = document.createElement('div');
        selectContainer.className = 'multi-select-container';

        const select = document.createElement('select');
        select.id = `filter_${column}`;
        select.className = 'form-control';
        select.multiple = true;
        select.dataset.column = column;

        // Add "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All';
        allOption.selected = true;
        select.appendChild(allOption);

        // Add unique values
        uniqueValues.sort().forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        const info = document.createElement('div');
        info.className = 'multi-select-info';
        info.innerHTML = `<small>${uniqueValues.length} unique values</small>`;

        selectContainer.appendChild(select);
        selectContainer.appendChild(info);
        filterGroup.appendChild(label);
        filterGroup.appendChild(selectContainer);
        container.appendChild(filterGroup);
    }

    createNumericalFilter(container, column) {
        const values = this.currentData
            .map(row => parseFloat(row[column]))
            .filter(v => !isNaN(v));

        if (values.length === 0) {
            console.log(`Skipping ${column}: no numerical values`);
            return;
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group dynamic-filter';
        filterGroup.dataset.column = column;
        filterGroup.dataset.type = 'numerical';

        const label = document.createElement('label');
        label.textContent = `${column} (Range: ${min.toFixed(2)} - ${max.toFixed(2)})`;

        const rangeContainer = document.createElement('div');
        rangeContainer.className = 'threshold-inputs';

        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.id = `min_${column}`;
        minInput.className = 'form-control';
        minInput.placeholder = `Min (${min.toFixed(2)})`;
        minInput.step = (max - min) / 1000;
        minInput.min = min;
        minInput.max = max;
        minInput.dataset.column = column;
        minInput.dataset.type = 'min';

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.id = `max_${column}`;
        maxInput.className = 'form-control';
        maxInput.placeholder = `Max (${max.toFixed(2)})`;
        maxInput.step = (max - min) / 1000;
        maxInput.min = min;
        maxInput.max = max;
        maxInput.dataset.column = column;
        maxInput.dataset.type = 'max';

        const span = document.createElement('span');
        span.textContent = 'to';

        rangeContainer.appendChild(minInput);
        rangeContainer.appendChild(span);
        rangeContainer.appendChild(maxInput);

        const info = document.createElement('div');
        info.className = 'filter-info';
        info.innerHTML = `<small>Avg: ${avg.toFixed(2)}</small>`;

        filterGroup.appendChild(label);
        filterGroup.appendChild(rangeContainer);
        filterGroup.appendChild(info);
        container.appendChild(filterGroup);
    }

    async applyFilters() {
        if (!this.currentDataset) return;

        const filters = this.getFilterValues();
        
        try {
            const result = await api.filterDataset(this.currentDataset.id, filters);
            this.filteredData = result.data;
            this.updateVisualization();
            this.updateSummaryStats();
            this.updateDataTable();
            this.showNotification(`Filtered to ${result.row_count} rows`, 'success');
        } catch (error) {
            this.showNotification('Filter failed: ' + error.message, 'error');
        }
    }

    getFilterValues() {
        const filters = {};

        // Date range
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        if (startDate) filters.start_date = startDate;
        if (endDate) filters.end_date = endDate;

        // Get all dynamic filters
        const dynamicFilters = document.querySelectorAll('.dynamic-filter');
        dynamicFilters.forEach(filterGroup => {
            const column = filterGroup.dataset.column;
            const type = filterGroup.dataset.type;

            if (type === 'categorical') {
                const select = filterGroup.querySelector('select');
                if (select) {
                    const selected = Array.from(select.selectedOptions).map(opt => opt.value);
                    if (selected.length > 0 && !selected.includes('all')) {
                        filters[column] = selected;
                    }
                }
            } else if (type === 'numerical') {
                const minInput = filterGroup.querySelector('input[data-type="min"]');
                const maxInput = filterGroup.querySelector('input[data-type="max"]');
                
                const min = minInput?.value ? parseFloat(minInput.value) : null;
                const max = maxInput?.value ? parseFloat(maxInput.value) : null;

                if (min !== null || max !== null) {
                    filters[column] = {};
                    if (min !== null) filters[column].min = min;
                    if (max !== null) filters[column].max = max;
                }
            }
        });

        return filters;
    }

    clearFilters() {
        // Clear date filters
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';

        // Clear all dynamic filters
        const dynamicFilters = document.querySelectorAll('.dynamic-filter');
        dynamicFilters.forEach(filterGroup => {
            const type = filterGroup.dataset.type;
            if (type === 'categorical') {
                const select = filterGroup.querySelector('select');
                if (select) {
                    select.selectedIndex = 0; // Select "All"
                }
            } else if (type === 'numerical') {
                const inputs = filterGroup.querySelectorAll('input[type="number"]');
                inputs.forEach(input => input.value = '');
            }
        });

        this.filteredData = [...this.currentData];
        this.updateVisualization();
        this.updateSummaryStats();
        this.updateDataTable();
        this.showNotification('Filters cleared', 'success');
    }

    updateVisualization() {
        if (!this.filteredData || this.filteredData.length === 0) {
            const chartArea = document.getElementById('chartArea');
            if (chartArea) {
                chartArea.innerHTML = `
                    <div class="placeholder-message">
                        <i class="fas fa-chart-bar"></i>
                        <p>Select axes to create visualization</p>
                    </div>
                `;
            }
            return;
        }

        const chartType = document.getElementById('chartType')?.value || 'line';
        const xAxis = document.getElementById('xAxis')?.value;
        const yAxis = document.getElementById('yAxis')?.value;

        if (!xAxis || !yAxis) {
            const chartArea = document.getElementById('chartArea');
            if (chartArea) {
                chartArea.innerHTML = `
                    <div class="placeholder-message">
                        <i class="fas fa-chart-bar"></i>
                        <p>Select X and Y axes to create visualization</p>
                    </div>
                `;
            }
            return;
        }

        const chartArea = document.getElementById('chartArea');
        if (!chartArea) return;

        const xData = this.filteredData.map(row => row[xAxis]);
        const yData = this.filteredData.map(row => parseFloat(row[yAxis]) || 0);

        let trace;
        let layout = {
            title: `${xAxis} vs ${yAxis}`,
            height: 500,
            margin: { l: 50, r: 50, t: 50, b: 50 }
        };

        switch (chartType) {
            case 'line':
                trace = { x: xData, y: yData, type: 'scatter', mode: 'lines+markers' };
                break;
            case 'bar':
                trace = { x: xData, y: yData, type: 'bar' };
                break;
            case 'scatter':
                trace = { x: xData, y: yData, type: 'scatter', mode: 'markers' };
                break;
            case 'pie':
                trace = { labels: xData, values: yData, type: 'pie' };
                break;
            default:
                trace = { x: xData, y: yData, type: 'scatter', mode: 'lines+markers' };
        }

        Plotly.newPlot(chartArea, [trace], layout);
    }

    updateSummaryStats() {
        if (!this.filteredData || this.filteredData.length === 0) return;

        const numericColumns = this.columns.filter(col => {
            return this.filteredData.some(row => !isNaN(parseFloat(row[col])));
        });

        if (numericColumns.length > 0) {
            const col = numericColumns[0];
            const values = this.filteredData.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const max = Math.max(...values);
                const min = Math.min(...values);

                document.getElementById('totalRecords').textContent = this.filteredData.length;
                document.getElementById('avgValue').textContent = avg.toFixed(2);
                document.getElementById('maxValue').textContent = max.toFixed(2);
                document.getElementById('minValue').textContent = min.toFixed(2);

                const summaryStats = document.getElementById('summaryStats');
                if (summaryStats) summaryStats.style.display = 'block';
            }
        }
    }

    updateDataTable() {
        // Simplified table update
        const tableContainer = document.getElementById('dataTableContainer');
        if (tableContainer && this.filteredData) {
            tableContainer.style.display = 'block';
            // Add table rendering logic here
        }
    }

    async handleUpload() {
        const fileInput = document.getElementById('uploadFile');
        const nameInput = document.getElementById('uploadFileName');
        const descInput = document.getElementById('uploadFileDescription');

        if (!fileInput || !fileInput.files.length) {
            this.showNotification('Please select a file', 'error');
            return;
        }

        const file = fileInput.files[0];
        const name = nameInput?.value || file.name.replace(/\.[^/.]+$/, "");
        const description = descInput?.value || '';

        try {
            this.showNotification('Uploading...', 'info');
            const result = await api.uploadDataset(file, name, description);
            this.showNotification('Upload successful!', 'success');
            this.hideUploadModal();
            await this.loadDatasets();
            await this.loadDataset(result.id);
        } catch (error) {
            this.showNotification('Upload failed: ' + error.message, 'error');
        }
    }

    async quickCompare() {
        const dataset1Id = document.getElementById('portfolioDataset1')?.value;
        const dataset2Id = document.getElementById('portfolioDataset2')?.value;

        if (!dataset1Id || !dataset2Id) {
            this.showNotification('Please select both datasets', 'error');
            return;
        }

        if (dataset1Id === dataset2Id) {
            this.showNotification('Please select two different datasets', 'error');
            return;
        }

        try {
            // Load both datasets directly
            const dataset1 = await api.getDataset(parseInt(dataset1Id));
            const dataset2 = await api.getDataset(parseInt(dataset2Id));

            // Show comparison view
            const view = document.getElementById('comparisonView');
            if (view) view.style.display = 'block';

            const title = document.getElementById('comparisonTitle');
            if (title) title.textContent = `Quick Compare: ${dataset1.name} vs ${dataset2.name}`;

            // Display both datasets
            this.displayComparisonDataset(dataset1, 'dataset1');
            this.displayComparisonDataset(dataset2, 'dataset2');

            // Generate comparison metrics
            this.generateComparisonMetrics(dataset1, dataset2);
            
            // Generate side-by-side comparison chart
            this.generateSideBySideChart(dataset1, dataset2);

            this.showNotification('Quick comparison loaded!', 'success');
        } catch (error) {
            this.showNotification('Failed to compare datasets: ' + error.message, 'error');
        }
    }

    async createPortfolioComparison() {
        const dataset1Id = document.getElementById('portfolioDataset1')?.value;
        const dataset2Id = document.getElementById('portfolioDataset2')?.value;
        const name = document.getElementById('comparisonName')?.value || 
                    `Comparison ${new Date().toLocaleString()}`;

        if (!dataset1Id || !dataset2Id) {
            this.showNotification('Please select both datasets', 'error');
            return;
        }

        if (dataset1Id === dataset2Id) {
            this.showNotification('Please select two different datasets', 'error');
            return;
        }

        try {
            const comparison = await api.createPortfolioComparison(
                parseInt(dataset1Id),
                parseInt(dataset2Id),
                name
            );
            await this.displayPortfolioComparison(comparison.id);
            await this.loadPortfolioComparisons();
            this.showNotification('Comparison created and saved!', 'success');
        } catch (error) {
            this.showNotification('Failed to create comparison: ' + error.message, 'error');
        }
    }

    async displayPortfolioComparison(comparisonId) {
        try {
            const comparison = await api.getPortfolioComparison(comparisonId);
            
            const view = document.getElementById('comparisonView');
            if (view) view.style.display = 'block';

            const title = document.getElementById('comparisonTitle');
            if (title) title.textContent = comparison.name;

            // Display both datasets
            this.displayComparisonDataset(comparison.dataset1, 'dataset1');
            this.displayComparisonDataset(comparison.dataset2, 'dataset2');

            // Generate comparison metrics
            this.generateComparisonMetrics(comparison.dataset1, comparison.dataset2);
            
            // Generate side-by-side comparison chart
            this.generateSideBySideChart(comparison.dataset1, comparison.dataset2);
        } catch (error) {
            this.showNotification('Failed to load comparison: ' + error.message, 'error');
        }
    }

    generateSideBySideChart(dataset1, dataset2) {
        const chartContainer = document.getElementById('sideBySideChart');
        if (!chartContainer) return;

        // Find common numerical columns
        const numericCols1 = dataset1.columns.filter(col => {
            return dataset1.data.some(row => !isNaN(parseFloat(row[col])));
        });
        const numericCols2 = dataset2.columns.filter(col => {
            return dataset2.data.some(row => !isNaN(parseFloat(row[col])));
        });
        const commonNumericCols = numericCols1.filter(col => numericCols2.includes(col));

        if (commonNumericCols.length === 0) {
            chartContainer.innerHTML = '<p class="placeholder-message">No common numerical columns to compare</p>';
            return;
        }

        // Use first common numerical column for comparison
        const compareCol = commonNumericCols[0];
        const values1 = dataset1.data.map(row => parseFloat(row[compareCol])).filter(v => !isNaN(v));
        const values2 = dataset2.data.map(row => parseFloat(row[compareCol])).filter(v => !isNaN(v));

        if (values1.length === 0 || values2.length === 0) {
            chartContainer.innerHTML = '<p class="placeholder-message">Insufficient data for comparison</p>';
            return;
        }

        // Create histogram/comparison chart
        const trace1 = {
            x: values1,
            type: 'histogram',
            name: dataset1.name,
            opacity: 0.7,
            marker: { color: '#667eea' }
        };

        const trace2 = {
            x: values2,
            type: 'histogram',
            name: dataset2.name,
            opacity: 0.7,
            marker: { color: '#764ba2' }
        };

        const layout = {
            title: `Distribution Comparison: ${compareCol}`,
            barmode: 'overlay',
            height: 400,
            xaxis: { title: compareCol },
            yaxis: { title: 'Frequency' },
            margin: { l: 50, r: 50, t: 50, b: 50 }
        };

        Plotly.newPlot(chartContainer, [trace1, trace2], layout);
    }

    generateComparisonMetrics(dataset1, dataset2) {
        const comparisonMetrics = document.getElementById('comparisonMetrics');
        if (!comparisonMetrics) return;

        let metricsHTML = '<h4>Comparison Metrics</h4><div class="metrics-grid">';

        // Row count comparison
        const rowDiff = dataset2.row_count - dataset1.row_count;
        const rowDiffPercent = dataset1.row_count > 0 ? ((rowDiff / dataset1.row_count) * 100).toFixed(1) : 0;
        metricsHTML += `
            <div class="metric-card">
                <div class="metric-label">Row Count</div>
                <div class="metric-values">
                    <span>Dataset 1: ${dataset1.row_count}</span>
                    <span>Dataset 2: ${dataset2.row_count}</span>
                    <span class="metric-diff ${rowDiff >= 0 ? 'positive' : 'negative'}">
                        ${rowDiff >= 0 ? '+' : ''}${rowDiff} (${rowDiffPercent}%)
                    </span>
                </div>
            </div>
        `;

        // Column comparison
        const commonColumns = dataset1.columns.filter(col => dataset2.columns.includes(col));
        const uniqueTo1 = dataset1.columns.filter(col => !dataset2.columns.includes(col));
        const uniqueTo2 = dataset2.columns.filter(col => !dataset1.columns.includes(col));
        
        metricsHTML += `
            <div class="metric-card">
                <div class="metric-label">Columns</div>
                <div class="metric-values">
                    <span>Common: ${commonColumns.length}</span>
                    <span>Unique to Dataset 1: ${uniqueTo1.length}</span>
                    <span>Unique to Dataset 2: ${uniqueTo2.length}</span>
                </div>
            </div>
        `;

        // Numerical column comparisons
        const numericCols1 = dataset1.columns.filter(col => {
            return dataset1.data.some(row => !isNaN(parseFloat(row[col])));
        });
        const numericCols2 = dataset2.columns.filter(col => {
            return dataset2.data.some(row => !isNaN(parseFloat(row[col])));
        });
        const commonNumericCols = numericCols1.filter(col => numericCols2.includes(col));

        commonNumericCols.slice(0, 3).forEach(col => {
            const values1 = dataset1.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            const values2 = dataset2.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            
            if (values1.length > 0 && values2.length > 0) {
                const avg1 = values1.reduce((a, b) => a + b, 0) / values1.length;
                const avg2 = values2.reduce((a, b) => a + b, 0) / values2.length;
                const diff = avg2 - avg1;
                const diffPercent = avg1 > 0 ? ((diff / avg1) * 100).toFixed(1) : 0;

                metricsHTML += `
                    <div class="metric-card">
                        <div class="metric-label">${col} (Average)</div>
                        <div class="metric-values">
                            <span>Dataset 1: ${avg1.toFixed(2)}</span>
                            <span>Dataset 2: ${avg2.toFixed(2)}</span>
                            <span class="metric-diff ${diff >= 0 ? 'positive' : 'negative'}">
                                ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${diffPercent}%)
                            </span>
                        </div>
                    </div>
                `;
            }
        });

        metricsHTML += '</div>';
        comparisonMetrics.innerHTML = metricsHTML;
    }

    displayComparisonDataset(dataset, prefix) {
        const nameEl = document.getElementById(`${prefix}Name`);
        const statsEl = document.getElementById(`${prefix}Stats`);
        const chartEl = document.getElementById(`${prefix}Chart`);
        const tableEl = document.getElementById(`${prefix}Table`);

        if (nameEl) nameEl.textContent = `${dataset.name} (${dataset.row_count} rows)`;

        // Display comprehensive statistics
        if (statsEl && dataset.data.length > 0) {
            const numericColumns = dataset.columns.filter(col => {
                return dataset.data.some(row => !isNaN(parseFloat(row[col])));
            });

            let statsHTML = '';
            
            // Row count
            statsHTML += `
                <div class="stat-item">
                    <div class="stat-value">${dataset.row_count}</div>
                    <div class="stat-label">Total Rows</div>
                </div>
            `;

            // Column count
            statsHTML += `
                <div class="stat-item">
                    <div class="stat-value">${dataset.columns.length}</div>
                    <div class="stat-label">Columns</div>
                </div>
            `;

            // Numerical column statistics
            numericColumns.slice(0, 3).forEach(col => {
                const values = dataset.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = sum / values.length;
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    
                    statsHTML += `
                        <div class="stat-item">
                            <div class="stat-value">${avg.toFixed(2)}</div>
                            <div class="stat-label">Avg ${col}</div>
                            <div class="stat-range">${min.toFixed(2)} - ${max.toFixed(2)}</div>
                        </div>
                    `;
                }
            });
            statsEl.innerHTML = statsHTML;
        }

        // Display chart
        if (chartEl && dataset.data.length > 0) {
            const numericColumns = dataset.columns.filter(col => {
                return dataset.data.some(row => !isNaN(parseFloat(row[col])));
            });

            if (numericColumns.length >= 2) {
                const xCol = numericColumns[0];
                const yCol = numericColumns[1];

                const trace = {
                    x: dataset.data.map(row => row[xCol]),
                    y: dataset.data.map(row => parseFloat(row[yCol]) || 0),
                    type: 'scatter',
                    mode: 'markers',
                    name: dataset.name,
                    marker: {
                        size: 6,
                        opacity: 0.7
                    }
                };

                const layout = {
                    title: `${xCol} vs ${yCol}`,
                    height: 300,
                    margin: { l: 50, r: 50, t: 50, b: 50 },
                    xaxis: { title: xCol },
                    yaxis: { title: yCol }
                };

                Plotly.newPlot(chartEl, [trace], layout);
            } else {
                chartEl.innerHTML = '<p class="placeholder-message">Not enough numerical columns for chart</p>';
            }
        }

        // Display data table
        if (tableEl && dataset.data.length > 0) {
            let tableHTML = '<table class="data-table"><thead><tr>';
            dataset.columns.slice(0, 6).forEach(col => {
                tableHTML += `<th>${col}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            
            dataset.data.slice(0, 10).forEach(row => {
                tableHTML += '<tr>';
                dataset.columns.slice(0, 6).forEach(col => {
                    const value = row[col];
                    const displayValue = value !== null && value !== undefined ? String(value).substring(0, 30) : '';
                    tableHTML += `<td>${displayValue}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';
            if (dataset.data.length > 10) {
                tableHTML += `<p style="text-align: center; padding: 0.5rem; color: #6b7280; font-size: 0.875rem;">Showing first 10 of ${dataset.data.length} rows</p>`;
            }
            tableEl.innerHTML = tableHTML;
        }
    }

    async loadPortfolioComparisons() {
        try {
            const comparisons = await api.getPortfolioComparisons();
            const listEl = document.getElementById('comparisonsList');

            if (!listEl) return;

            if (comparisons.length === 0) {
                listEl.innerHTML = '<p class="empty-message">No saved comparisons yet.</p>';
                return;
            }

            let html = '';
            comparisons.forEach(comp => {
                html += `
                    <div class="comparison-card" onclick="app.displayPortfolioComparison(${comp.id})">
                        <h4>${comp.name}</h4>
                        <p>${comp.dataset1_name} vs ${comp.dataset2_name}</p>
                        <p style="font-size: 0.75rem; color: #9ca3af;">
                            ${new Date(comp.created_at).toLocaleDateString()}
                        </p>
                    </div>
                `;
            });
            listEl.innerHTML = html;
        } catch (error) {
            console.error('Failed to load comparisons:', error);
        }
    }

    exportChart() {
        const chartArea = document.getElementById('chartArea');
        if (chartArea) {
            try {
                Plotly.downloadImage(chartArea, {
                    format: 'png',
                    width: 800,
                    height: 600,
                    filename: 'glimpsy-chart'
                });
                this.showNotification('Chart exported', 'success');
            } catch (error) {
                this.showNotification('Export failed: ' + error.message, 'error');
            }
        } else {
            this.showNotification('No chart to export', 'error');
        }
    }

    async exportData() {
        if (!this.currentDataset) {
            this.showNotification('No dataset loaded', 'error');
            return;
        }

        try {
            const filters = this.getFilterValues();
            await api.exportDataset(this.currentDataset.id, filters);
            this.showNotification('Data exported', 'success');
        } catch (error) {
            this.showNotification('Export failed: ' + error.message, 'error');
        }
    }

    showUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) modal.classList.add('active');
    }

    hideUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) modal.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    loadSettings() {
        const saved = localStorage.getItem('glimpsySettings');
        return saved ? JSON.parse(saved) : {};
    }

    saveSettings() {
        localStorage.setItem('glimpsySettings', JSON.stringify(this.settings));
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GlimpsyApp();
    window.app = app; // Make available globally
});

