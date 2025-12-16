'use client'

import { AuthProvider } from '../src/contexts/AuthContext'
import { ToastProvider } from '../src/hooks/useToast'

/**
 * Root Providers Component
 * 
 * Centralizes all context providers for the application.
 * This is used in the root layout to wrap all pages.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
