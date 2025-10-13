import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContextTypes';

/**
 * Hook to access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Hook to require authentication
 * Redirects or shows message if not authenticated
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Handle unauthenticated state
      console.warn('Authentication required');
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
};
