import axios from 'axios';

// Determine the API base URL
const getApiBaseUrl = (): string => {
    if (import.meta.env.PROD) {
        // In production, use the same origin
        return window.location.origin;
    }
    // In development, use the backend URL (default: http://localhost:5000)
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

const client = axios.create({
    baseURL: API_BASE_URL + '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration and 401 errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            // Redirect to login page
            window.location.href = '/admin';
        }
        return Promise.reject(error);
    }
);

// Helper function to get full URL for assets
export const getFullAssetUrl = (assetPath: string): string => {
    if (!assetPath) return '';
    if (assetPath.startsWith('data:')) return assetPath;
    if (assetPath.startsWith('http')) return assetPath;
    
    // Use API base URL instead of window.location.origin
    return `${API_BASE_URL}${assetPath}`;
};

export default client;
