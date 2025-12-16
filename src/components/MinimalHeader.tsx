'use client'

import Link from 'next/link'
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { generalLogger } from '../utils/logger'
import { UserDropdown } from './UserDropdown'

/**
 * Minimal Header Component for Home Page
 *
 * Ilara-style invisible header with Upswitch logo, title, and BETA badge.
 * Uses transparent background with backdrop blur for seamless integration.
 * No navigation links - clean landing page experience.
 */
export const MinimalHeader: React.FC = () => {
  const { user, refreshAuth } = useAuth()

  const handleLogout = async () => {
    try {
      generalLogger.info('Logging out user')

      // Get backend URL from environment
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'https://web-production-8d00b.up.railway.app'

      // Call backend logout endpoint
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send authentication cookie
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        generalLogger.info('Logout successful')
        // Refresh auth state to clear user data
        await refreshAuth()
      } else {
        generalLogger.warn('Logout request failed', { status: response.status })
        // Still refresh auth state in case session is already invalid
        await refreshAuth()
      }
    } catch (error) {
      generalLogger.error('Logout failed', { error })
      // Still refresh auth state to clear local state
      await refreshAuth()
    }
  }

  return (
    <>
      {/* Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 flex px-6 py-4 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-between max-w-full overflow-visible bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        {/* Logo and Title */}
        <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
          <Link className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 group" href="/">
            {/* Logo container with hover animation - desktop only */}
            <div className="relative h-6 sm:h-6 flex-shrink-0">
              {/* Default logo (white variant) */}
              <img
                src="/logo_upswitch_white_var2.svg"
                alt="Upswitch Logo"
                className="h-6 sm:h-6 flex-shrink-0 transition-opacity duration-300 ease-in-out lg:group-hover:opacity-0"
                style={{
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: 1,
                  visibility: 'visible',
                  display: 'block',
                }}
              />
              {/* Hover logo (dark variant) - desktop only */}
              <img
                src="/logo_upswitch_dark.svg"
                alt="Upswitch Logo"
                className="absolute top-0 left-0 h-6 sm:h-6 flex-shrink-0 transition-opacity duration-300 ease-in-out opacity-0 lg:group-hover:opacity-100"
                style={{
                  width: 'auto',
                  objectFit: 'contain',
                  visibility: 'visible',
                  display: 'block',
                }}
              />
            </div>

            {/* BETA Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800/50 text-zinc-200 border border-zinc-700/50 ml-0">
              BETA
            </span>
          </Link>
        </div>

        {/* User Avatar - Right side */}
        <div className="flex items-center">
          <UserDropdown user={user} onLogout={handleLogout} />
        </div>
      </header>
    </>
  )
}
