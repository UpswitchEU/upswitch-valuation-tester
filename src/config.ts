// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_VALUATION_ENGINE_URL || 
           import.meta.env.VITE_VALUATION_API_URL || 
           'https://web-production-8d00b.up.railway.app',
  timeout: 30000,
};

// App Configuration
export const APP_CONFIG = {
  name: 'Upswitch Valuation Engine',
  version: '1.0.0-beta',
  environment: import.meta.env.MODE || 'development',
};

