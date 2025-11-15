/**
 * Backend Integration Layer for Glimpsy
 * Extends the existing DataInsightsDashboard class with backend API calls
 */

// Initialize API client
const api = new GlimpsyAPI();

// Extend DataInsightsDashboard with backend integration
if (typeof DataInsightsDashboard !== 'undefined') {
    // Store original methods
    const originalHandleFileUpload = DataInsightsDashboard.prototype.handleFileUpload;
    const originalHandleUploadForm = DataInsightsDashboard.prototype.handleUploadForm;
    const originalLoadDataset = DataInsightsDashboard.prototype.loadDataset;
    
    // Override handleFileUpload to use backend
    DataInsightsDashboard.prototype.handleFileUpload = async function(file) {
        if (!file) return;
        
        // Check if backend is available
        try {
            await api.healthCheck();
            
            // Use backend upload
            const name = file.name.replace(/\.[^/.]+$/, "");
            const description = `Uploaded ${new Date().toLocaleString()}`;
            
            this.showNotification('Uploading file to server...', 'info');
            
            const result = await api.uploadDataset(file, name, description);
            
            this.currentData = result.columns.map(col => ({})); // Initialize with columns
            this.currentDataset = result.id;
            this.datasetId = result.id;
            
            // Load the full dataset
            const dataset = await api.getDataset(result.id);
            this.currentData = dataset.data;
            this.filteredData = [...dataset.data];
            this.columns = dataset.columns;
            
            // Update UI
            this.updateVisualization();
            this.updateSummaryStats();
            this.updateDataTable();
            this.populateFilters();
            
            this.showNotification('File uploaded successfully!', 'success');
            
            // Refresh dataset lists
            this.loadDatasetList();
            this.loadPortfolioDatasetList();
            
        } catch (error) {
            console.error('Backend upload failed, falling back to client-side:', error);
            // Fallback to original client-side upload
            if (originalHandleFileUpload) {
                originalHandleFileUpload.call(this, file);
            }
        }
    };
    
    // Override handleUploadForm to use backend
    DataInsightsDashboard.prototype.handleUploadForm = async function() {
        const uploadForm = document.getElementById('uploadForm');
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
            await this.handleFileUpload(file);
            this.hideUploadModal();
            
            // Reset form
            if (uploadForm) uploadForm.reset();
        } catch (error) {
            this.showNotification('Upload failed: ' + error.message, 'error');
        }
    };
    
    // Add method to load dataset list
    DataInsightsDashboard.prototype.loadDatasetList = async function() {
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
                    option.textContent = dataset.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load dataset list:', error);
        }
    };
    
    // Add method to load portfolio dataset list
    DataInsightsDashboard.prototype.loadPortfolioDatasetList = async function() {
        try {
            const datasets = await api.getDatasets();
            const select1 = document.getElementById('portfolioDataset1');
            const select2 = document.getElementById('portfolioDataset2');
            
            [select1, select2].forEach(select => {
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
            });
        } catch (error) {
            console.error('Failed to load portfolio dataset list:', error);
        }
    };
    
    // Override loadDataset to use backend
    DataInsightsDashboard.prototype.loadDataset = async function(datasetId) {
        // If it's a string (old sample data), use original method
        if (typeof datasetId === 'string' && ['sales', 'finance', 'health', 'custom'].includes(datasetId)) {
            if (originalLoadDataset) {
                return originalLoadDataset.call(this, datasetId);
            }
        }
        
        // Otherwise, load from backend
        try {
            const dataset = await api.getDataset(datasetId);
            
            this.currentData = dataset.data;
            this.filteredData = [...dataset.data];
            this.currentDataset = dataset.id;
            this.datasetId = dataset.id;
            this.columns = dataset.columns;
            
            this.updateVisualization();
            this.updateSummaryStats();
            this.updateDataTable();
            this.populateFilters();
            
            this.showNotification(`Loaded dataset: ${dataset.name}`, 'success');
        } catch (error) {
            this.showNotification('Failed to load dataset: ' + error.message, 'error');
            console.error('Load dataset error:', error);
        }
    };
    
    // Add portfolio comparison methods
    DataInsightsDashboard.prototype.createPortfolioComparison = async function() {
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
            const comparison = await api.createPortfolioComparison(dataset1Id, dataset2Id, name);
            await this.displayPortfolioComparison(comparison.id);
            await this.loadSavedComparisons();
            this.showNotification('Portfolio comparison created!', 'success');
        } catch (error) {
            this.showNotification('Failed to create comparison: ' + error.message, 'error');
        }
    };
    
    DataInsightsDashboard.prototype.displayPortfolioComparison = async function(comparisonId) {
        try {
            const comparison = await api.getPortfolioComparison(comparisonId);
            
            // Show comparison view
            const view = document.getElementById('comparisonView');
            if (view) view.style.display = 'block';
            
            // Set title
            const title = document.getElementById('comparisonTitle');
            if (title) title.textContent = comparison.name;
            
            // Display dataset 1
            this.displayComparisonDataset(comparison.dataset1, 'dataset1');
            
            // Display dataset 2
            this.displayComparisonDataset(comparison.dataset2, 'dataset2');
            
        } catch (error) {
            this.showNotification('Failed to load comparison: ' + error.message, 'error');
        }
    };
    
    DataInsightsDashboard.prototype.displayComparisonDataset = function(dataset, prefix) {
        const nameEl = document.getElementById(`${prefix}Name`);
        const statsEl = document.getElementById(`${prefix}Stats`);
        const chartEl = document.getElementById(`${prefix}Chart`);
        const tableEl = document.getElementById(`${prefix}Table`);
        
        if (nameEl) nameEl.textContent = dataset.name;
        
        // Display stats
        if (statsEl && dataset.data.length > 0) {
            const numericColumns = dataset.columns.filter(col => {
                return dataset.data.some(row => !isNaN(parseFloat(row[col])));
            });
            
            let statsHTML = '';
            numericColumns.slice(0, 4).forEach(col => {
                const values = dataset.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = sum / values.length;
                    statsHTML += `
                        <div class="stat-item">
                            <div class="stat-value">${avg.toFixed(2)}</div>
                            <div class="stat-label">Avg ${col}</div>
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
                    name: dataset.name
                };
                
                const layout = {
                    title: `${xCol} vs ${yCol}`,
                    height: 300,
                    margin: { l: 50, r: 50, t: 50, b: 50 }
                };
                
                Plotly.newPlot(chartEl, [trace], layout);
            }
        }
        
        // Display table
        if (tableEl && dataset.data.length > 0) {
            let tableHTML = '<table class="data-table"><thead><tr>';
            dataset.columns.forEach(col => {
                tableHTML += `<th>${col}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            
            dataset.data.slice(0, 10).forEach(row => {
                tableHTML += '<tr>';
                dataset.columns.forEach(col => {
                    tableHTML += `<td>${row[col] || ''}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';
            tableEl.innerHTML = tableHTML;
        }
    };
    
    DataInsightsDashboard.prototype.loadSavedComparisons = async function() {
        try {
            const comparisons = await api.getPortfolioComparisons();
            const listEl = document.getElementById('comparisonsList');
            
            if (!listEl) return;
            
            if (comparisons.length === 0) {
                listEl.innerHTML = '<p class="empty-message">No saved comparisons yet. Create one above to get started.</p>';
                return;
            }
            
            let html = '';
            comparisons.forEach(comp => {
                html += `
                    <div class="comparison-card" onclick="dashboard.displayPortfolioComparison(${comp.id})">
                        <h4>${comp.name}</h4>
                        <p>${comp.dataset1_name} vs ${comp.dataset2_name}</p>
                        <p style="font-size: 0.75rem; color: #9ca3af;">Created: ${new Date(comp.created_at).toLocaleDateString()}</p>
                    </div>
                `;
            });
            listEl.innerHTML = html;
        } catch (error) {
            console.error('Failed to load saved comparisons:', error);
        }
    };
    
    // Initialize backend integration on page load
    function initializeBackendIntegration() {
        // Wait for dashboard to be initialized
        const checkDashboard = setInterval(() => {
            if (window.dashboard) {
                clearInterval(checkDashboard);
                
                // Load dataset lists
                if (window.dashboard.loadDatasetList) {
                    window.dashboard.loadDatasetList();
                }
                if (window.dashboard.loadPortfolioDatasetList) {
                    window.dashboard.loadPortfolioDatasetList();
                }
                if (window.dashboard.loadSavedComparisons) {
                    window.dashboard.loadSavedComparisons();
                }
                
                // Add portfolio comparison button handler
                const createBtn = document.getElementById('createComparisonBtn');
                if (createBtn) {
                    createBtn.addEventListener('click', () => {
                        if (window.dashboard.createPortfolioComparison) {
                            window.dashboard.createPortfolioComparison();
                        }
                    });
                }
                
                // Add close comparison button handler
                const closeBtn = document.getElementById('closeComparisonBtn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        const view = document.getElementById('comparisonView');
                        if (view) view.style.display = 'none';
                    });
                }
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkDashboard), 10000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeBackendIntegration);
    } else {
        initializeBackendIntegration();
    }
}

