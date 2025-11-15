/**
 * Glimpsy API Client
 * Handles all communication with the Flask backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

class GlimpsyAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Dataset operations
    async getDatasets() {
        return this.request('/datasets');
    }

    async getDataset(datasetId) {
        return this.request(`/datasets/${datasetId}`);
    }

    async uploadDataset(file, name, description = '') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('description', description);

        const url = `${this.baseURL}/datasets`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    async deleteDataset(datasetId) {
        return this.request(`/datasets/${datasetId}`, {
            method: 'DELETE'
        });
    }

    async filterDataset(datasetId, filters) {
        return this.request(`/datasets/${datasetId}/filter`, {
            method: 'POST',
            body: { filters }
        });
    }

    async exportDataset(datasetId, filters = {}) {
        const params = new URLSearchParams({ filters: JSON.stringify(filters) });
        const url = `${this.baseURL}/datasets/${datasetId}/export?${params}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `dataset_${datasetId}_export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    // Portfolio comparison operations
    async getPortfolioComparisons() {
        return this.request('/portfolio-comparisons');
    }

    async getPortfolioComparison(comparisonId) {
        return this.request(`/portfolio-comparisons/${comparisonId}`);
    }

    async createPortfolioComparison(dataset1Id, dataset2Id, name) {
        return this.request('/portfolio-comparisons', {
            method: 'POST',
            body: {
                dataset1_id: dataset1Id,
                dataset2_id: dataset2Id,
                name: name
            }
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlimpsyAPI;
}
