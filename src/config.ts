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

// AI Agent Configuration
export const AI_CONFIG = {
  enabled: import.meta.env.VITE_AI_ENHANCED_MODE === 'true' || true,
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  showReasoning: import.meta.env.VITE_SHOW_AI_REASONING === 'true' || true,
  showHelpText: import.meta.env.VITE_SHOW_AI_HELP_TEXT === 'true' || true,
  showNarratives: import.meta.env.VITE_SHOW_VALUATION_NARRATIVES === 'true' || true,
  branding: {
    expertTitle: 'AI Valuation Expert',
    levelIndicator: 'Big 4 Level',
    showLevelBadge: import.meta.env.VITE_SHOW_LEVEL_BADGE === 'true' || true
  }
};

