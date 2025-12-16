'use client'

import { AppErrorBoundary } from './_components/AppErrorBoundary'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Boundary for the App Router
 * 
 * Catches errors in the root layout and pages.
 * Reuses shared AppErrorBoundary component to avoid duplication.
 */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <AppErrorBoundary
      error={error}
      reset={reset}
      context="app-level"
    />
  )
}
