/**
 * Environment Variable Utilities
 * 
 * Provides Next.js-compatible environment variable access
 * Replaces Vite's import.meta.env with Next.js process.env
 */

/**
 * Get environment variable value
 * Works in both client and server contexts
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  // Next.js: Client-side uses NEXT_PUBLIC_ prefix, server-side uses any prefix
  // Check both NEXT_PUBLIC_ prefixed and non-prefixed versions
  if (typeof window !== 'undefined') {
    // Client-side: prefer NEXT_PUBLIC_ prefixed
    return process.env[`NEXT_PUBLIC_${key}`] || process.env[key] || defaultValue
  }
  // Server-side: can use any env var
  return process.env[key] || defaultValue
}

/**
 * Check if running in development mode
 */
export const isDev = process.env.NODE_ENV === 'development'

/**
 * Check if running in production mode
 */
export const isProd = process.env.NODE_ENV === 'production'

/**
 * Get the current environment mode
 */
export const mode = process.env.NODE_ENV || 'development'

/**
 * Environment variable accessor object (compatible with import.meta.env)
 */
export const env = {
  MODE: mode,
  DEV: isDev,
  PROD: isProd,
  // VITE_ prefixed vars map to NEXT_PUBLIC_ in Next.js
  VITE_BACKEND_URL: getEnv('VITE_BACKEND_URL') || getEnv('NEXT_PUBLIC_BACKEND_URL'),
  VITE_API_BASE_URL: getEnv('VITE_API_BASE_URL') || getEnv('NEXT_PUBLIC_API_BASE_URL'),
  VITE_API_URL: getEnv('VITE_API_URL') || getEnv('NEXT_PUBLIC_API_URL'),
  VITE_VALUATION_ENGINE_URL: getEnv('VITE_VALUATION_ENGINE_URL') || getEnv('NEXT_PUBLIC_VALUATION_ENGINE_URL'),
  VITE_VALUATION_API_URL: getEnv('VITE_VALUATION_API_URL') || getEnv('NEXT_PUBLIC_VALUATION_API_URL'),
  VITE_PYTHON_ENGINE_URL: getEnv('VITE_PYTHON_ENGINE_URL') || getEnv('NEXT_PUBLIC_PYTHON_ENGINE_URL'),
  VITE_PARENT_DOMAIN: getEnv('VITE_PARENT_DOMAIN') || getEnv('NEXT_PUBLIC_PARENT_DOMAIN'),
  VITE_UNLIMITED_CREDITS_MODE: getEnv('VITE_UNLIMITED_CREDITS_MODE') || getEnv('NEXT_PUBLIC_UNLIMITED_CREDITS_MODE'),
}

