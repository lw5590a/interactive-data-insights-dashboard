// Interactive Data Insights Dashboard - JavaScript

class DataInsightsDashboard {
    constructor() {
        this.currentData = null;
        this.filteredData = null;
        this.currentDataset = null;
        this.chartInstance = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.settings = this.loadSettings();
        this.interestRateAdjustment = 0; // in basis points
        this.adjustedData = null;
        this.currentPortfolio = 'original'; // 'original' or 'adjusted'
        
        // Initialize fixed seed for consistent data generation
        this.seed = 12345; // Fixed seed for reproducible results
        this.random = this.seededRandom();
        
        this.initializeEventListeners();
        this.loadSampleData();
    }

    // Seeded random number generator for consistent data generation
    seededRandom() {
        let seed = this.seed;
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    initializeEventListeners() {
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
                console.log('Dataset select changed to:', e.target.value);
                this.loadDataset(e.target.value);
            });
        } else {
            console.error('Dataset select element not found!');
        }

        // Upload functionality
        document.getElementById('uploadDatasetBtn').addEventListener('click', () => {
            this.showUploadModal();
        });

        // Test filter visibility
        document.getElementById('testFilterBtn').addEventListener('click', () => {
            console.log('Test button clicked');
            this.showFilterSection();
        });

        document.getElementById('browseFilesBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Filter controls
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Chart controls
        document.getElementById('chartType').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('xAxis').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('yAxis').addEventListener('change', () => {
            this.updateVisualization();
        });

        // Export functionality
        document.getElementById('exportChartBtn').addEventListener('click', () => {
            this.exportChart();
        });

        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Table controls
        document.getElementById('tableSearch').addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.nextPage();
        });

        // Modal controls
        document.getElementById('closeUploadModal').addEventListener('click', () => {
            this.hideUploadModal();
        });

        document.getElementById('cancelUploadBtn').addEventListener('click', () => {
            this.hideUploadModal();
        });

        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUploadForm();
        });

        // Dataset items
        document.querySelectorAll('.dataset-item button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dataset = e.target.closest('.dataset-item').dataset.dataset;
                this.loadDataset(dataset);
            });
        });

        // Settings
        document.querySelectorAll('.setting-item input, .setting-item select').forEach(input => {
            input.addEventListener('change', () => {
                this.saveSettings();
            });
        });

        // Interest rate adjustment buttons
        document.getElementById('decrease200bps')?.addEventListener('click', () => this.adjustInterestRate(-200));
        document.getElementById('decrease100bps')?.addEventListener('click', () => this.adjustInterestRate(-100));
        document.getElementById('decrease50bps')?.addEventListener('click', () => this.adjustInterestRate(-50));
        document.getElementById('resetRate')?.addEventListener('click', () => this.resetInterestRate());
        document.getElementById('increase50bps')?.addEventListener('click', () => this.adjustInterestRate(50));
        document.getElementById('increase100bps')?.addEventListener('click', () => this.adjustInterestRate(100));
        document.getElementById('increase200bps')?.addEventListener('click', () => this.adjustInterestRate(200));

        // Portfolio selection
        document.querySelectorAll('input[name="portfolio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentPortfolio = e.target.value;
                this.updateDataBasedOnPortfolio();
            });
        });

        // Theme selector
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }

        // Test filter button
        const testFilterBtn = document.getElementById('testFilterBtn');
        if (testFilterBtn) {
            testFilterBtn.addEventListener('click', () => {
                alert('Filter section should be visible now');
            });
        }

        // Test settings button
        const testSettingsBtn = document.getElementById('testSettingsBtn');
        if (testSettingsBtn) {
            testSettingsBtn.addEventListener('click', () => {
                this.navigateToSection('settings');
                alert('Settings section should be visible now');
            });
        }

        // Debug spacing button
        const debugSpacingBtn = document.getElementById('debugSpacingBtn');
        if (debugSpacingBtn) {
            debugSpacingBtn.addEventListener('click', () => {
                this.debugSpacing();
            });
        }

        // Drag and drop for file upload
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
        }
    }

    navigateToSection(sectionId) {
        console.log('Navigating to section:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            console.log('Removed active from section:', section.id);
        });
        
        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Added active to section:', sectionId);
        } else {
            console.error('Section not found:', sectionId);
        }

        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('Updated active nav link to:', sectionId);
        } else {
            console.error('Nav link not found for:', sectionId);
        }
    }

    loadSampleData() {
        this.sampleDatasets = {
            sales: this.generateSalesData(),
            finance: this.generateFinanceData(),
            health: this.generateHealthData()
        };
        
        // Initialize filter section visibility
        this.initializeFilterSection();
    }

    // Initialize filter section visibility
    initializeFilterSection() {
        const filterSection = document.getElementById('filterSection');
        if (filterSection) {
            // Hide filter section by default
            filterSection.classList.add('hidden');
            console.log('Filter section initialized as hidden');
        }
    }

    // Show filter section
    showFilterSection() {
        const filterSection = document.getElementById('filterSection');
        if (filterSection) {
            filterSection.classList.remove('hidden');
            console.log('Filter section should now be visible');
        } else {
            console.error('Filter section not found!');
        }
    }

    // Generate sample sales data
    generateSalesData() {
        const data = [];
        const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];
        
        for (let i = 0; i < 120; i++) {
            data.push({
                id: i + 1,
                date: `2024-${String(Math.floor(i / 10) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
                category: categories[i % categories.length],
                product: `Product ${i + 1}`,
                revenue: Math.floor(Math.random() * 10000) + 1000,
                units: Math.floor(Math.random() * 100) + 10,
                region: ['North', 'South', 'East', 'West'][i % 4]
            });
        }
        return data;
    }

    // Generate realistic Certificate of Deposit (CD) account data
    generateFinanceData() {
        const data = [];
        const banks = [
            'Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank',
            'PNC Bank', 'Capital One', 'TD Bank', 'Goldman Sachs', 'Morgan Stanley',
            'American Express Bank', 'Ally Bank', 'Marcus by Goldman Sachs', 'Discover Bank',
            'Synchrony Bank', 'Barclays Bank', 'HSBC Bank', 'Citizens Bank', 'Regions Bank',
            'Fifth Third Bank', 'KeyBank', 'BB&T Bank', 'SunTrust Bank', 'Huntington Bank'
        ];
        
        const cdTypes = ['Traditional CD', 'Jumbo CD', 'Bump-up CD', 'Step-up CD', 'Liquid CD'];
        const terms = [3, 6, 12, 18, 24, 36, 48, 60]; // months
        const statuses = ['Active', 'Matured', 'Early Withdrawal', 'Rolled Over'];
        
        // Generate CD accounts with bias towards the filter settings shown in the image
        for (let i = 0; i < 1000; i++) {
            // Bias towards 2024 dates for Active status
            const originationYear = this.random() > 0.6 ? 2024 : (2020 + Math.floor(this.random() * 5));
            const originationMonth = Math.floor(this.random() * 12) + 1;
            const originationDay = Math.floor(this.random() * 28) + 1;
            const originationDate = new Date(originationYear, originationMonth - 1, originationDay);
            
            // Select CD term
            const term = terms[Math.floor(this.random() * terms.length)];
            
            // Calculate maturity date
            const maturityDate = new Date(originationDate);
            maturityDate.setMonth(maturityDate.getMonth() + term);
            
            // Generate realistic interest rates based on term and market conditions
            const interestRate = this.generateInterestRate(term, originationYear);
            
            // Generate principal amount
            const principal = this.generatePrincipalAmount();
            
            // Calculate interest earned
            const interestEarned = (principal * interestRate * term / 12) / 100;
            
            // Bias towards Active status for 2024 dates
            const currentDate = new Date();
            let status = 'Active';
            if (maturityDate < currentDate) {
                status = this.random() > 0.4 ? 'Matured' : 'Rolled Over';
            } else if (this.random() > 0.98) { // Reduced early withdrawal probability
                status = 'Early Withdrawal';
            }
            
            // Generate account number
            const accountNumber = this.generateAccountNumber();
            
            // Bias towards Personal customer type (as shown in the image)
            const customerType = this.random() > 0.3 ? 'Personal' : 'Business';
            const customerSegment = this.generateCustomerSegment(principal);
            
            // Bias towards Citibank (as shown in the image)
            const bankSelection = this.random() > 0.4 ? 'Citibank' : banks[Math.floor(this.random() * banks.length)];
            
            data.push({
                id: i + 1,
                account_number: accountNumber,
                customer_type: customerType,
                customer_segment: customerSegment,
                bank_name: bankSelection,
                cd_type: cdTypes[Math.floor(this.random() * cdTypes.length)],
                origination_date: originationDate.toISOString().split('T')[0],
                maturity_date: maturityDate.toISOString().split('T')[0],
                term_months: term,
                principal_amount: Math.round(principal * 100) / 100,
                interest_rate: Math.round(interestRate * 10000) / 10000, // 4 decimal places
                interest_earned: Math.round(interestEarned * 100) / 100,
                total_value: Math.round((principal + interestEarned) * 100) / 100,
                status: status,
                early_withdrawal_penalty: Math.round((principal * 0.03) * 100) / 100, // 3% penalty
                apy: Math.round((Math.pow(1 + interestRate / 100, 12) - 1) * 10000) / 10000,
                days_to_maturity: Math.max(0, Math.floor((maturityDate - currentDate) / (1000 * 60 * 60 * 24))),
                origination_year: originationYear,
                origination_month: originationMonth,
                maturity_year: maturityDate.getFullYear(),
                maturity_month: maturityDate.getMonth() + 1
            });
        }
        
        return data;
    }
    
    // Generate realistic interest rates based on term and year
    generateInterestRate(term, year) {
        // Base rates by term (longer terms typically have higher rates)
        const baseRates = {
            3: 0.5,   // 3 months
            6: 1.0,   // 6 months
            12: 1.5,  // 12 months
            18: 1.8,  // 18 months
            24: 2.0,  // 24 months
            36: 2.2,  // 36 months
            48: 2.3,  // 48 months
            60: 2.4   // 60 months
        };
        
        const baseRate = baseRates[term] || 1.5;
        
        // Add some variation based on year (simulating market conditions)
        const yearAdjustment = (year - 2020) * 0.1; // Rates generally increased over time
        const randomVariation = (this.random() - 0.5) * 0.5; // ±0.25% random variation
        
        return Math.max(0.1, baseRate + yearAdjustment + randomVariation);
    }
    
    generatePrincipalAmount() {
        const rand = this.random();
        if (rand < 0.4) {
            return Math.floor(this.random() * 50000) + 10000; // $10k-$60k
        } else if (rand < 0.7) {
            return Math.floor(this.random() * 100000) + 50000; // $50k-$150k
        } else if (rand < 0.9) {
            return Math.floor(this.random() * 500000) + 100000; // $100k-$600k
        } else {
            return Math.floor(this.random() * 1000000) + 500000; // $500k-$1.5M
        }
    }
    
    generateCustomerSegment(principal) {
        if (principal < 50000) return 'Standard';
        if (principal < 250000) return 'Premium';
        if (principal < 1000000) return 'High Net Worth';
        return 'Ultra High Net Worth';
    }
    
    generateAccountNumber() {
        const prefix = Math.floor(this.random() * 900) + 100;
        const middle = Math.floor(this.random() * 9000) + 1000;
        const suffix = Math.floor(this.random() * 9000) + 1000;
        return `${prefix}-${middle}-${suffix}`;
    }

    // Generate sample health data
    generateHealthData() {
        const data = [];
        const conditions = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Cancer', 'Obesity'];
        const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
        const genders = ['Male', 'Female', 'Other'];
        const severities = ['Low', 'Medium', 'High', 'Critical'];
        
        for (let i = 0; i < 150; i++) {
            data.push({
                id: i + 1,
                date: `2024-${String(Math.floor(i / 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
                condition: conditions[i % conditions.length],
                age_group: ageGroups[i % ageGroups.length],
                gender: genders[i % genders.length],
                severity: severities[i % severities.length],
                cases: Math.floor(Math.random() * 100) + 10,
                mortality_rate: Math.random() * 0.1,
                recovery_rate: 0.7 + Math.random() * 0.3
            });
        }
        return data;
    }

    loadDataset(datasetName) {
        if (!datasetName || datasetName === '') return;

        console.log('Loading dataset:', datasetName);

        this.currentDataset = datasetName;
        this.currentData = this.sampleDatasets[datasetName] || [];
        this.filteredData = [...this.currentData];

        // Update dataset selector
        document.getElementById('datasetSelect').value = datasetName;

        // Update dataset date range display
        this.updateDatasetDateRange();

        // Show filter section
        this.showFilterSection();

        // Update filter content based on dataset
        this.updateFilterContent();

        // Populate filter options
        this.populateFilterOptions();

        // Update visualization
        this.updateVisualization();

        // Update summary statistics
        this.updateSummaryStats();

        // Show visualization area
        document.getElementById('visualizationArea').style.display = 'block';
        document.getElementById('summaryStats').style.display = 'block';

        // Initialize interest rate adjustment for CD data
        if (datasetName === 'finance') {
            this.interestRateAdjustment = 0;
            this.updateInterestRateDisplay();
            this.createAdjustedData();
            this.currentPortfolio = 'original';
            document.getElementById('originalPortfolio').checked = true;
        }

        this.showNotification('Dataset loaded successfully!', 'success');
    }

    // Update dataset date range display
    updateDatasetDateRange() {
        const dateRangeElement = document.getElementById('datasetDateRangeValue');
        if (!dateRangeElement || !this.currentData || this.currentData.length === 0) {
            return;
        }

        let dateField = 'date';
        if (this.currentDataset === 'finance') {
            dateField = 'origination_date';
        }

        // Find min and max dates
        const dates = this.currentData
            .map(row => row[dateField])
            .filter(date => date && date !== '')
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));

        if (dates.length === 0) {
            dateRangeElement.textContent = 'No date data available';
            return;
        }

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const dateRangeText = `${formatDate(minDate)} to ${formatDate(maxDate)}`;
        dateRangeElement.textContent = dateRangeText;
    }

    // Update filter content based on dataset type
    updateFilterContent() {
        console.log('updateFilterContent called for dataset:', this.currentDataset);
        const metricSelector = document.getElementById('metricSelector');
        if (!metricSelector) {
            console.error('metricSelector element not found!');
            return;
        }
        console.log('Found metricSelector element');

        // Clear existing content
        metricSelector.innerHTML = '';

        if (this.currentDataset === 'finance') {
            // CD data metrics - restore original working structure
            const cdMetrics = [
                { id: 'metricCdType', label: 'CD Type' },
                { id: 'metricCustomerType', label: 'Customer Type' },
                { id: 'metricCustomerSegment', label: 'Customer Segment' },
                { id: 'metricBank', label: 'Bank' },
                { id: 'metricStatus', label: 'Status' }
            ];
            this.createMetricCheckboxes(cdMetrics);
            
            // Setup CD filters and metric selector
            this.setupCDFilters();
            this.setupMetricSelector();
        } else if (this.currentDataset === 'sales') {
            // Sales data metrics
            const salesMetrics = [
                { id: 'metricCategory', label: 'Product Category' },
                { id: 'metricRegion', label: 'Region' },
                { id: 'metricProduct', label: 'Product' }
            ];
            this.createMetricCheckboxes(salesMetrics);
        } else if (this.currentDataset === 'health') {
            // Health data metrics
            const healthMetrics = [
                { id: 'metricCondition', label: 'Medical Condition' },
                { id: 'metricAgeGroup', label: 'Age Group' },
                { id: 'metricGender', label: 'Gender' },
                { id: 'metricSeverity', label: 'Severity Level' }
            ];
            this.createMetricCheckboxes(healthMetrics);
        } else {
            // For other datasets, dynamically detect categorical columns
            if (this.currentData && this.currentData.length > 0) {
                const columns = Object.keys(this.currentData[0]);
                const categoricalColumns = columns.filter(col => 
                    col !== 'id' && 
                    col !== 'date' && 
                    typeof this.currentData[0][col] === 'string'
                );
                
                const metrics = categoricalColumns.map(col => ({
                    id: `metric${col.charAt(0).toUpperCase() + col.slice(1)}`,
                    label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')
                }));
                
                this.createMetricCheckboxes(metrics);
            }
        }
    }

    // Create metric checkboxes
    createMetricCheckboxes(metrics) {
        console.log('createMetricCheckboxes called with metrics:', metrics);
        const metricSelector = document.getElementById('metricSelector');
        if (!metricSelector) {
            console.error('metricSelector not found in createMetricCheckboxes');
            return;
        }
        console.log('Found metricSelector in createMetricCheckboxes');

        metrics.forEach(metric => {
            console.log('Creating checkbox for metric:', metric);
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'metric-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = metric.id;
            checkbox.className = 'form-checkbox';
            checkbox.checked = true;
            
            const label = document.createElement('label');
            label.htmlFor = metric.id;
            label.textContent = metric.label;
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            metricSelector.appendChild(checkboxDiv);
            console.log('Added checkbox for:', metric.label);
        });
        console.log('Finished creating metric checkboxes');
    }

    // Setup CD filters
    setupCDFilters() {
        const filterConfigs = [
            { id: 'cdTypeFilter', field: 'cd_type', label: 'CD Type' },
            { id: 'customerTypeFilter', field: 'customer_type', label: 'Customer Type' },
            { id: 'customerSegmentFilter', field: 'customer_segment', label: 'Customer Segment' },
            { id: 'bankFilter', field: 'bank_name', label: 'Bank' },
            { id: 'statusFilter', field: 'status', label: 'Status' }
        ];
        
        filterConfigs.forEach(config => {
            const filter = document.getElementById(config.id);
            if (filter && this.currentData[0] && this.currentData[0][config.field]) {
                filter.innerHTML = `<option value="all">All ${config.label}s</option>`;
                
                const uniqueValues = [...new Set(this.currentData.map(row => row[config.field]))];
                uniqueValues.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    option.selected = false; // No default selection
                    filter.appendChild(option);
                });
                
                // Setup "All" logic for this filter
                this.setupFilterLogic(filter);
            }
        });
    }

    // Setup filter logic for "All" functionality
    setupFilterLogic(filter) {
        filter.addEventListener('change', (e) => {
            const selectedOptions = Array.from(filter.selectedOptions);
            const hasAll = selectedOptions.some(option => option.value === 'all');
            
            if (hasAll) {
                // If "All" is selected, select all other options
                Array.from(filter.options).forEach(option => {
                    if (option.value !== 'all') {
                        option.selected = true;
                    }
                });
            } else {
                // If "All" is deselected, deselect it
                const allOption = filter.querySelector('option[value="all"]');
                if (allOption) {
                    allOption.selected = false;
                }
            }
        });
    }

    // Setup metric selector functionality
    setupMetricSelector() {
        const metricCheckboxes = [
            { id: 'metricCdType', filterGroup: 'cdTypeFilterGroup' },
            { id: 'metricCustomerType', filterGroup: 'customerTypeFilterGroup' },
            { id: 'metricCustomerSegment', filterGroup: 'customerSegmentFilterGroup' },
            { id: 'metricBank', filterGroup: 'bankFilterGroup' },
            { id: 'metricStatus', filterGroup: 'statusFilterGroup' }
        ];
        
        metricCheckboxes.forEach(config => {
            const checkbox = document.getElementById(config.id);
            const filterGroup = document.getElementById(config.filterGroup);
            
            if (checkbox && filterGroup) {
                // Set initial visibility based on checkbox state
                filterGroup.classList.toggle('hidden', !checkbox.checked);
                
                // Add event listener
                checkbox.addEventListener('change', (e) => {
                    filterGroup.classList.toggle('hidden', !e.target.checked);
                    
                    // If hiding a filter, clear all selections
                    if (!e.target.checked) {
                        const filter = filterGroup.querySelector('select');
                        if (filter) {
                            Array.from(filter.options).forEach(option => {
                                option.selected = false;
                            });
                        }
                    }
                });
            }
        });
    }

    // Populate filter options based on current data
    populateFilterOptions() {
        if (!this.currentData || this.currentData.length === 0) return;

        const columns = Object.keys(this.currentData[0]);
        
        // Populate axis selectors
        const xAxis = document.getElementById('xAxis');
        const yAxis = document.getElementById('yAxis');
        
        xAxis.innerHTML = '';
        yAxis.innerHTML = '';

        columns.forEach(col => {
            if (col !== 'id') {
                const xOption = document.createElement('option');
                xOption.value = col;
                xOption.textContent = col;
                xAxis.appendChild(xOption);

                const yOption = document.createElement('option');
                yOption.value = col;
                yOption.textContent = col;
                yAxis.appendChild(yOption);
            }
        });

        // Set default axes
        if (columns.includes('date')) {
            xAxis.value = 'date';
        } else if (columns.includes('month')) {
            xAxis.value = 'month';
        }

        const numericColumns = columns.filter(col => 
            typeof this.currentData[0][col] === 'number'
        );
        if (numericColumns.length > 0) {
            yAxis.value = numericColumns[0];
        }
    }

    // Apply filters
    applyFilters() {
        if (!this.currentData) return;

        let filtered = [...this.currentData];

        // Date range filter
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate || endDate) {
            filtered = filtered.filter(row => {
                // For CD data, check both origination and maturity dates
                if (this.currentDataset === 'finance') {
                    const originationDate = row.origination_date;
                    const maturityDate = row.maturity_date;
                    
                    if (startDate && endDate) {
                        return (originationDate >= startDate && originationDate <= endDate) ||
                               (maturityDate >= startDate && maturityDate <= endDate);
                    } else if (startDate) {
                        return originationDate >= startDate || maturityDate >= startDate;
                    } else if (endDate) {
                        return originationDate <= endDate || maturityDate <= endDate;
                    }
                } else {
                    // For other datasets, use the date field
                    const rowDate = row.date;
                    if (startDate && endDate) {
                        return rowDate >= startDate && rowDate <= endDate;
                    } else if (startDate) {
                        return rowDate >= startDate;
                    } else if (endDate) {
                        return rowDate <= endDate;
                    }
                }
                return true;
            });
        }

        // Apply dataset-specific filters
        if (this.currentDataset === 'finance') {
            filtered = this.applyFinanceFilters(filtered);
        } else if (this.currentDataset === 'sales') {
            filtered = this.applySalesFilters(filtered);
        } else if (this.currentDataset === 'health') {
            filtered = this.applyHealthFilters(filtered);
        }

        // Numerical threshold filters for CD data
        if (this.currentDataset === 'finance') {
            // Interest rate range
            const minRate = document.getElementById('minRate').value;
            const maxRate = document.getElementById('maxRate').value;
            if (minRate) {
                filtered = filtered.filter(row => row.interest_rate >= parseFloat(minRate));
            }
            if (maxRate) {
                filtered = filtered.filter(row => row.interest_rate <= parseFloat(maxRate));
            }

            // Principal amount range
            const minPrincipal = document.getElementById('minPrincipal').value;
            const maxPrincipal = document.getElementById('maxPrincipal').value;
            if (minPrincipal) {
                filtered = filtered.filter(row => row.principal_amount >= parseFloat(minPrincipal));
            }
            if (maxPrincipal) {
                filtered = filtered.filter(row => row.principal_amount <= parseFloat(maxPrincipal));
            }

            // Days to maturity range
            const minDays = document.getElementById('minDays').value;
            const maxDays = document.getElementById('maxDays').value;
            if (minDays) {
                filtered = filtered.filter(row => row.days_to_maturity >= parseFloat(minDays));
            }
            if (maxDays) {
                filtered = filtered.filter(row => row.days_to_maturity <= parseFloat(maxDays));
            }
        } else {
            // Generic numerical threshold for other datasets
            const minValue = document.getElementById('minValue')?.value;
            const maxValue = document.getElementById('maxValue')?.value;
            const yAxis = document.getElementById('yAxis')?.value;

            if (minValue && yAxis) {
                filtered = filtered.filter(row => row[yAxis] >= parseFloat(minValue));
            }
            if (maxValue && yAxis) {
                filtered = filtered.filter(row => row[yAxis] <= parseFloat(maxValue));
            }
        }

        this.filteredData = filtered;
        this.updateVisualization();
        this.updateSummaryStats();
        this.updateDataTable();

        this.showNotification(`Filtered to ${filtered.length} records`, 'success');
    }

    // Apply finance filters
    applyFinanceFilters(data) {
        const filterConfigs = [
            { id: 'cdTypeFilter', field: 'cd_type', metricId: 'metricCdType' },
            { id: 'customerTypeFilter', field: 'customer_type', metricId: 'metricCustomerType' },
            { id: 'customerSegmentFilter', field: 'customer_segment', metricId: 'metricCustomerSegment' },
            { id: 'bankFilter', field: 'bank_name', metricId: 'metricBank' },
            { id: 'statusFilter', field: 'status', metricId: 'metricStatus' }
        ];
        
        return data.filter(row => {
            return filterConfigs.every(config => {
                // Check if this metric is enabled
                const metricCheckbox = document.getElementById(config.metricId);
                if (!metricCheckbox || !metricCheckbox.checked) {
                    return true; // Skip filtering for disabled metrics
                }
                
                const filter = document.getElementById(config.id);
                if (!filter) return true;
                
                const selectedOptions = Array.from(filter.selectedOptions).map(option => option.value);
                
                // If "All" is selected or no options selected, don't filter
                if (selectedOptions.includes('all') || selectedOptions.length === 0) {
                    return true;
                }
                
                // Check if row matches any selected option
                return selectedOptions.includes(row[config.field]);
            });
        });
    }

    // Apply sales filters
    applySalesFilters(data) {
        // For now, return all data - sales filters will be implemented later
        return data;
    }

    // Apply health filters
    applyHealthFilters(data) {
        // For now, return all data - health filters will be implemented later
        return data;
    }

    // Interest rate adjustment methods
    adjustInterestRate(bpsChange) {
        if (this.currentDataset !== 'finance') return;
        
        this.interestRateAdjustment += bpsChange;
        this.updateInterestRateDisplay();
        this.createAdjustedData();
        this.updateDataBasedOnPortfolio();
        
        this.showNotification(`Interest rate adjusted by ${bpsChange > 0 ? '+' : ''}${bpsChange} bps`, 'success');
    }

    resetInterestRate() {
        this.interestRateAdjustment = 0;
        this.updateInterestRateDisplay();
        this.createAdjustedData();
        this.updateDataBasedOnPortfolio();
        
        this.showNotification('Interest rate reset to original values', 'success');
    }

    updateInterestRateDisplay() {
        const display = document.getElementById('currentAdjustment');
        if (display) {
            display.textContent = `${this.interestRateAdjustment > 0 ? '+' : ''}${this.interestRateAdjustment} bps`;
        }
    }

    createAdjustedData() {
        if (!this.currentData || this.currentDataset !== 'finance') return;
        
        this.adjustedData = this.currentData.map(row => {
            const adjustedRow = { ...row };
            
            // Adjust interest rate
            const newRate = row.interest_rate + (this.interestRateAdjustment / 100);
            adjustedRow.interest_rate = Math.max(0.001, newRate); // Minimum 0.1%
            
            // Recalculate interest earned
            const termInYears = row.term_months / 12;
            adjustedRow.interest_earned = (row.principal_amount * adjustedRow.interest_rate * termInYears) / 100;
            
            // Recalculate total value
            adjustedRow.total_value = row.principal_amount + adjustedRow.interest_earned;
            
            // Recalculate APY
            adjustedRow.apy = Math.pow(1 + adjustedRow.interest_rate / 100, 12) - 1;
            
            return adjustedRow;
        });
    }

    updateDataBasedOnPortfolio() {
        if (this.currentPortfolio === 'adjusted' && this.adjustedData) {
            this.filteredData = [...this.adjustedData];
        } else {
            this.filteredData = [...this.currentData];
        }
        
        this.updateVisualization();
        this.updateSummaryStats();
        this.updateDataTable();
    }

    // Get category column for filtering
    getCategoryColumn() {
        const categoryFilter = document.getElementById('categoryFilter');
        const selectedValue = categoryFilter.value;
        if (!selectedValue) return null;

        const columns = Object.keys(this.currentData[0]);
        for (let col of columns) {
            if (typeof this.currentData[0][col] === 'string' && 
                this.currentData.some(row => row[col] === selectedValue)) {
                return col;
            }
        }
        return null;
    }

    // Clear filters
    clearFilters() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        // Clear filter selections for CD data
        if (this.currentDataset === 'finance') {
            const filterIds = ['cdTypeFilter', 'customerTypeFilter', 'customerSegmentFilter', 'bankFilter', 'statusFilter'];
            filterIds.forEach(filterId => {
                const filter = document.getElementById(filterId);
                if (filter) {
                    Array.from(filter.options).forEach(option => {
                        option.selected = false;
                    });
                }
            });
            
            // Clear numerical thresholds
            document.getElementById('minRate').value = '';
            document.getElementById('maxRate').value = '';
            document.getElementById('minPrincipal').value = '';
            document.getElementById('maxPrincipal').value = '';
            document.getElementById('minDays').value = '';
            document.getElementById('maxDays').value = '';
        } else {
            const minValueElement = document.getElementById('minValue');
            const maxValueElement = document.getElementById('maxValue');
            if (minValueElement) minValueElement.value = '';
            if (maxValueElement) maxValueElement.value = '';
        }

        this.filteredData = [...this.currentData];
        this.updateVisualization();
        this.updateSummaryStats();
        this.updateDataTable();

        this.showNotification('Filters cleared', 'success');
    }

    // Update visualization
    updateVisualization() {
        if (!this.filteredData || this.filteredData.length === 0) return;

        const chartType = document.getElementById('chartType').value;
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');
        const xAxis = xAxisSelect.value;
        const yAxis = yAxisSelect.value;

        // Handle axis selectors based on chart type
        if (chartType === 'table') {
            // Disable axis selectors for data table
            xAxisSelect.disabled = true;
            yAxisSelect.disabled = true;
            xAxisSelect.style.opacity = '0.5';
            yAxisSelect.style.opacity = '0.5';
            
            this.showDataTable();
            return;
        } else {
            // Enable axis selectors for charts
            xAxisSelect.disabled = false;
            yAxisSelect.disabled = false;
            xAxisSelect.style.opacity = '1';
            yAxisSelect.style.opacity = '1';
        }

        if (!xAxis || !yAxis) return;

        const chartArea = document.getElementById('chartArea');
        chartArea.innerHTML = '';

        // Prepare data for visualization
        const data = this.prepareChartData(xAxis, yAxis, chartType);
        
        // Create chart using Plotly with responsive layout
        const layout = {
            title: {
                text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                x: 0.5,
                xanchor: 'center'
            },
            xaxis: { 
                title: {
                    text: xAxis,
                    standoff: 20
                },
                automargin: true,
                tickangle: -45,
                tickmode: 'auto',
                nticks: 10, // Limit number of ticks
                side: 'bottom',
                showgrid: false,
                domain: [0, 1] // Use full width
            },
            yaxis: { 
                title: {
                    text: yAxis,
                    standoff: 20
                },
                automargin: true,
                side: 'left',
                showgrid: true,
                domain: [0, 1] // Use full height
            },
            margin: { 
                t: 60, 
                b: 100, 
                l: 80, 
                r: 50 
            },
            height: 500,
            autosize: true,
            showlegend: false,
            bargap: 0.01, // Minimal gap between bars
            bargroupgap: 0.005, // Minimal gap between bar groups
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)'
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            useResizeHandler: true
        };

        Plotly.newPlot(chartArea, data, layout, config);
        
        // Force a resize to ensure proper layout
        setTimeout(() => {
            Plotly.Plots.resize(chartArea);
        }, 100);
    }

    // Prepare chart data
    prepareChartData(xAxis, yAxis, chartType) {
        const data = this.filteredData;
        
        if (chartType === 'line' || chartType === 'scatter') {
            const sortedData = data.sort((a, b) => a[xAxis] > b[xAxis] ? 1 : -1);
            
            return [{
                x: sortedData.map(row => row[xAxis]),
                y: sortedData.map(row => row[yAxis]),
                type: chartType,
                mode: chartType === 'scatter' ? 'markers' : 'lines+markers',
                marker: {
                    color: '#667eea',
                    size: 8
                },
                line: {
                    color: '#667eea',
                    width: 3
                }
            }];
        } else if (chartType === 'bar') {
            // Group data by x-axis for bar chart
            const grouped = {};
            const counts = {};
            
            data.forEach(row => {
                const xValue = row[xAxis];
                if (!grouped[xValue]) {
                    grouped[xValue] = 0;
                    counts[xValue] = 0;
                }
                grouped[xValue] += row[yAxis];
                counts[xValue]++;
            });

            // Calculate average for interest_rate, otherwise use sum
            const yValues = Object.keys(grouped).map(key => {
                if (yAxis === 'interest_rate') {
                    return grouped[key] / counts[key]; // Average
                } else {
                    return grouped[key]; // Sum
                }
            });

            return [{
                x: Object.keys(grouped),
                y: yValues,
                type: 'bar',
                marker: {
                                    color: '#4facfe', // Blue ocean color
                width: 0.6 // Wider bars for the centered domain
                }
            }];
        } else if (chartType === 'pie') {
            // Group data for pie chart
            const grouped = {};
            data.forEach(row => {
                const xValue = row[xAxis];
                if (!grouped[xValue]) {
                    grouped[xValue] = 0;
                }
                grouped[xValue] += row[yAxis];
            });

            return [{
                labels: Object.keys(grouped),
                values: Object.values(grouped),
                type: 'pie',
                marker: {
                    colors: ['#4facfe', '#00f2fe', '#667eea', '#764ba2', '#f093fb']
                }
            }];
        }

        return [];
    }

    // Show data table
    showDataTable() {
        const chartArea = document.getElementById('chartArea');
        
        if (!this.filteredData || this.filteredData.length === 0) {
            chartArea.innerHTML = '<div class="placeholder-message"><i class="fas fa-table"></i><p>No data available</p></div>';
            return;
        }

        // Create table HTML
        const columns = Object.keys(this.filteredData[0]);
        const tableHTML = `
            <div class="data-table-container">
                <h3>Data Table</h3>
                <div class="table-controls">
                    <div class="search-box">
                        <input type="text" id="tableSearch" class="form-control" placeholder="Search data...">
                    </div>
                    <div class="table-pagination">
                        <button class="btn btn-sm" id="prevPage">Previous</button>
                        <span id="pageInfo">Page 1 of 1</span>
                        <button class="btn btn-sm" id="nextPage">Next</button>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Data rows will be populated by updateDataTable() -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        chartArea.innerHTML = tableHTML;
        
        // Update the data table with current data
        this.updateDataTable();
        
        // Add event listeners for table controls
        this.addTableEventListeners();
    }

    // Add event listeners for table controls
    addTableEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('tableSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTable(e.target.value);
            });
        }

        // Pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousPage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextPage();
            });
        }
    }

    // Update data table
    updateDataTable() {
        if (!this.filteredData) return;

        const tableBody = document.querySelector('.data-table tbody');
        if (!tableBody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tableBody.innerHTML = '';

        pageData.forEach(row => {
            const tr = document.createElement('tr');
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        this.updatePagination();
    }

    // Update pagination
    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
    }

    // Filter table
    filterTable(searchTerm) {
        if (!this.currentData) return;

        const filtered = this.currentData.filter(row => {
            return Object.values(row).some(value => 
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );
        });

        this.filteredData = filtered;
        this.currentPage = 1;
        this.updateDataTable();
    }

    // Previous page
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDataTable();
        }
    }

    // Next page
    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateDataTable();
        }
    }

    // Update summary statistics
    updateSummaryStats() {
        if (!this.filteredData || this.filteredData.length === 0) return;

        const stats = document.getElementById('summaryStats');
        if (!stats) return;

        const totalDatasetRecords = this.currentData ? this.currentData.length : 0;
        const filteredRecords = this.filteredData.length;

        let statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${totalDatasetRecords}</h4>
                        <span class="stat-label">Total Dataset Records</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-filter"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${filteredRecords}</h4>
                        <span class="stat-label">Records After Filters</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${totalDatasetRecords > 0 ? ((filteredRecords / totalDatasetRecords) * 100).toFixed(1) : 0}%</h4>
                        <span class="stat-label">Filtered Percentage</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h4>${totalDatasetRecords - filteredRecords}</h4>
                        <span class="stat-label">Records Filtered Out</span>
                    </div>
                </div>
            </div>
        `;

        stats.innerHTML = statsHTML;
    }

    // Export chart
    exportChart() {
        const chartArea = document.getElementById('chartArea');
        if (!chartArea || chartArea.children.length === 0) {
            this.showNotification('No chart to export', 'warning');
            return;
        }

        // For now, just show a notification
        this.showNotification('Chart export functionality coming soon!', 'info');
    }

    // Export data
    exportData() {
        if (!this.filteredData || this.filteredData.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        const csv = this.convertToCSV(this.filteredData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentDataset}_data.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    // Convert data to CSV
    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    // Handle file upload
    handleFileUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const data = this.parseCSV(csv);
                
                if (data && data.length > 0) {
                    this.currentData = data;
                    this.filteredData = [...data];
                    this.currentDataset = 'custom';
                    
                    this.updateVisualization();
                    this.updateSummaryStats();
                    this.updateDataTable();
                    
                    this.showNotification('File uploaded successfully!', 'success');
                } else {
                    this.showNotification('Invalid file format', 'error');
                }
            } catch (error) {
                this.showNotification('Error processing file', 'error');
                console.error('File processing error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Parse CSV data
    parseCSV(csv) {
        const lines = csv.split('\n');
        if (lines.length < 2) return null;

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                row[header] = isNaN(value) ? value : parseFloat(value);
            });
            
            data.push(row);
        }

        return data;
    }

    // Show upload modal
    showUploadModal() {
        document.getElementById('uploadModal').classList.add('active');
    }

    // Hide upload modal
    hideUploadModal() {
        document.getElementById('uploadModal').classList.remove('active');
    }

    // Handle upload form
    handleUploadForm() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length > 0) {
            this.handleFileUpload(fileInput.files[0]);
            this.hideUploadModal();
        }
    }

    // Settings management
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            this.settings = {
                theme: 'blue', // Set default to blue ocean
                autoSave: true,
                notifications: true
            };
        }

        // Apply saved theme
        if (this.settings.theme) {
            this.changeTheme(this.settings.theme);
        }

        // Update theme selector
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.value = this.settings.theme || 'blue';
        }
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect').value,
            chartTheme: document.getElementById('chartTheme').value,
            autoRefresh: document.getElementById('autoRefresh').checked,
            maxRecords: parseInt(document.getElementById('maxRecords').value),
            decimalPlaces: parseInt(document.getElementById('decimalPlaces').value),
            dateFormat: document.getElementById('dateFormat').value,
            exportFormat: document.getElementById('exportFormat').value,
            exportQuality: document.getElementById('exportQuality').value
        };

        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        this.settings = settings;
    }

    // Notification system
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Theme switching
    changeTheme(theme) {
        document.body.className = ''; // Remove all existing classes
        document.body.classList.add(`theme-${theme}`);
        this.settings.theme = theme;
        this.saveSettings();
        this.showNotification(`Theme changed to ${theme}`, 'success');
    }

    // Debug spacing
    debugSpacing() {
        console.log('=== DEBUG SPACING ===');
        
        // Check main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const styles = window.getComputedStyle(mainContent);
            console.log('Main content padding:', styles.padding);
            console.log('Main content margin:', styles.margin);
        }
        
        // Check settings section
        const settingsSection = document.getElementById('settings');
        if (settingsSection) {
            const styles = window.getComputedStyle(settingsSection);
            console.log('Settings section padding:', styles.padding);
            console.log('Settings section margin:', styles.margin);
            console.log('Settings section display:', styles.display);
        }
        
        // Check section header
        const sectionHeader = document.querySelector('#settings .section-header');
        if (sectionHeader) {
            const styles = window.getComputedStyle(sectionHeader);
            console.log('Section header margin:', styles.margin);
            console.log('Section header padding:', styles.padding);
        }
        
        // Check settings grid
        const settingsGrid = document.querySelector('#settings .settings-grid');
        if (settingsGrid) {
            const styles = window.getComputedStyle(settingsGrid);
            console.log('Settings grid margin:', styles.margin);
            console.log('Settings grid padding:', styles.padding);
        }
        
        // Add temporary visual debugging
        this.addDebugStyles();
        
        alert('Check console for spacing details. Added red borders to debug elements.');
    }
    
    // Add temporary debug styles
    addDebugStyles() {
        const debugCSS = `
            .main-content { border: 2px solid red !important; }
            #settings { border: 2px solid blue !important; }
            .section-header { border: 2px solid green !important; }
            .settings-grid { border: 2px solid orange !important; }
        `;
        
        const style = document.createElement('style');
        style.textContent = debugCSS;
        document.head.appendChild(style);
        
        // Remove debug styles after 5 seconds
        setTimeout(() => {
            document.head.removeChild(style);
        }, 5000);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DataInsightsDashboard();
});

// Additional utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart, 'ms');
        }
    }
});

performanceObserver.observe({ entryTypes: ['navigation'] });

// Error handling
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    if (window.dashboard) {
        window.dashboard.showNotification('An error occurred. Please refresh the page.', 'error');
    }
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 