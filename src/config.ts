// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_VALUATION_ENGINE_URL || 
           import.meta.env.VITE_VALUATION_API_URL || 
           'https://web-production-8d00b.up.railway.app',
  timeout: 30000,
  streaming: {
    enabled: import.meta.env.VITE_ENABLE_STREAMING === 'true' || true,
    timeout: parseInt(import.meta.env.VITE_STREAMING_TIMEOUT || '30000'),
    maxRetries: parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS || '3')
  }
};

// App Configuration
export const APP_CONFIG = {
  name: 'Upswitch Valuation Engine',
  version: '1.0.0-beta',
  environment: import.meta.env.MODE || 'development',
};

