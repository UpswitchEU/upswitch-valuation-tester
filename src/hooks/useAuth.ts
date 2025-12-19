import { useEffect } from 'react'
import { useAuth as useAuthFromProvider } from '../contexts/AuthProvider'
import { authLogger } from '../utils/logger'

/**
 * Hook to access authentication context
 * Re-exported from AuthProvider for backward compatibility
 */
export const useAuth = () => {
  return useAuthFromProvider()
}

/**
 * Hook to require authentication
 * Redirects or shows message if not authenticated
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Handle unauthenticated state
      authLogger.warn('Authentication required')
    }
  }, [isAuthenticated, isLoading])

  return { isAuthenticated, isLoading }
}
