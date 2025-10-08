/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string; // Node.js backend (upswitch.biz) - for auth & saving valuations
  readonly VITE_VALUATION_API_URL?: string; // Python valuation engine (Railway) - for calculations
  readonly VITE_VALUATION_ENGINE_URL?: string; // Python valuation engine (Railway) - alias for VITE_VALUATION_API_URL
  readonly VITE_API_BASE_URL?: string; // Node.js backend - primary in production (web-production-8d00b.up.railway.app)
  readonly VITE_PARENT_DOMAIN?: string; // Main platform domain for postMessage (upswitch.biz)
  readonly VITE_SUPABASE_URL?: string; // Supabase project URL
  readonly VITE_SUPABASE_ANON_KEY?: string; // Supabase anonymous key
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

