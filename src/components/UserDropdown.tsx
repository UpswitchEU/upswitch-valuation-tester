import { Home, Info, LogOut, Settings, User, UserPlus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { User as UserType } from '../contexts/AuthContextTypes'
import UrlGeneratorService from '../services/urlGenerator'
import { useSessionStore } from '../store/useSessionStore'
import { generalLogger } from '../utils/logger'
import { hasMeaningfulSessionData } from '../utils/sessionDataUtils'
import { ExitReportConfirmationModal } from './modals/ExitReportConfirmationModal'

interface UserDropdownProps {
  user: UserType | null
  onLogout: () => Promise<void>
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null) // Track button position

  // Get session state to check report status
  const session = useSessionStore((state) => state.session)
  const hasUnsavedChanges = useSessionStore((state) => state.hasUnsavedChanges)
  const isSaving = useSessionStore((state) => state.isSaving)
  const saveSession = useSessionStore((state) => state.saveSession)
  const clearSession = useSessionStore((state) => state.clearSession)

  // Check if we're on a report page
  const isOnReportPage = pathname?.startsWith('/reports/') && pathname !== '/reports/new'
  const reportId = session?.reportId || (isOnReportPage ? pathname?.split('/reports/')[1]?.split('?')[0] : null)

  // Calculate dropdown position based on button
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8, // 8px below button
        right: window.innerWidth - rect.right, // Align right edge
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  // Close exit modal when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setShowExitModal(false)
    }
  }, [isOpen])

  // Get user initials for placeholder
  const getUserInitials = () => {
    if (!user?.name) return '?'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Use avatar from user object directly
  const avatarUrl = user?.avatar_url || user?.avatar
  const hasAvatar = !!avatarUrl

  const handleUserClick = () => {
    setIsOpen((prev) => !prev)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await onLogout()
  }

  // Removed handleSignIn since Sign In menu item was removed

  const handleCreateAccount = () => {
    setIsOpen(false)
    // Open parent window to sign up
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'OPEN_SIGNUP' }, '*')
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/signup', '_blank')
    }
  }

  const handleBackToDashboard = () => {
    setIsOpen(false)
    // Navigate to parent window dashboard
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_DASHBOARD' }, '*')
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/my-business', '_blank')
    }
  }

  const handleAccountSettings = () => {
    setIsOpen(false)
    // Navigate to parent window settings
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_SETTINGS' }, '*')
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/users/profile', '_blank')
    }
  }

  const handleLearnMore = () => {
    setIsOpen(false)
    // Navigate to parent window valuation page
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'NAVIGATE_TO_VALUATION' }, '*')
    } else {
      // Fallback: open in same window
      window.open('https://upswitch.biz/valuation', '_blank')
    }
  }

  /**
   * Handle "Back to Home" click
   * Checks report state and shows appropriate confirmation modal
   */
  const handleBackToHome = () => {
    setIsOpen(false)

    // If not on a report page, just navigate to home
    if (!isOnReportPage || !reportId) {
      router.push(UrlGeneratorService.root())
      return
    }

    // Check report state
    const hasValuationResults =
      !!session?.valuationResult || !!session?.htmlReport || !!session?.infoTabHtml
    const hasMeaningfulData = hasMeaningfulSessionData(session?.sessionData || {}, session)

    // Empty report (no meaningful data, no results) -> Just exit
    if (!hasMeaningfulData && !hasValuationResults) {
      generalLogger.info('[UserDropdown] Empty report detected, exiting without confirmation', {
        reportId,
      })
      handleExitReport()
      return
    }

    // Show confirmation modal for reports with data
    setShowExitModal(true)
  }

  /**
   * Exit report without saving
   */
  const handleExitReport = async () => {
    try {
      if (reportId) {
        // Clear session
        clearSession()
        generalLogger.info('[UserDropdown] Session cleared', { reportId })
      }
      // Navigate to home
      router.push(UrlGeneratorService.root())
    } catch (error) {
      generalLogger.error('[UserDropdown] Error exiting report', {
        reportId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Still navigate even if cleanup fails
      router.push(UrlGeneratorService.root())
    }
  }

  /**
   * Save report and exit
   */
  const handleSaveAndExit = async () => {
    if (!reportId) {
      handleExitReport()
      return
    }

    try {
      generalLogger.info('[UserDropdown] Saving report before exit', { reportId })
      // Save session
      await saveSession('user')
      generalLogger.info('[UserDropdown] Report saved successfully', { reportId })
      // Exit
      handleExitReport()
    } catch (error) {
      generalLogger.error('[UserDropdown] Error saving report before exit', {
        reportId,
        error: error instanceof Error ? error.message : String(error),
      })
      // Still exit even if save fails
      handleExitReport()
    }
  }

  /**
   * Close exit modal
   */
  const handleCloseExitModal = () => {
    setShowExitModal(false)
  }

  // Menu items for authenticated users
  const authenticatedMenuItems = [
    // Show "Back to Home" when on report page, otherwise "Back to Dashboard"
    ...(isOnReportPage
      ? [
          {
            key: 'back-to-home',
            icon: Home,
            label: 'Back to Home',
            action: handleBackToHome,
          },
        ]
      : [
          {
            key: 'back-to-dashboard',
            icon: Home,
            label: 'Back to Dashboard',
            action: handleBackToDashboard,
          },
        ]),
    {
      key: 'account-settings',
      icon: Settings,
      label: 'Account Settings',
      action: handleAccountSettings,
    },
    {
      key: 'divider-1',
      isDivider: true,
    },
    {
      key: 'logout',
      icon: LogOut,
      label: 'Log Out',
      action: handleLogout,
    },
  ]

  // Menu items for guest users
  const guestMenuItems = [
    // Show "Back to Home" when on report page
    ...(isOnReportPage
      ? [
          {
            key: 'back-to-home',
            icon: Home,
            label: 'Back to Home',
            action: handleBackToHome,
          },
          {
            key: 'divider-home',
            isDivider: true,
          },
        ]
      : []),
    {
      key: 'create-account',
      icon: UserPlus,
      label: 'Create Account',
      action: handleCreateAccount,
    },
    {
      key: 'divider-1',
      isDivider: true,
    },
    {
      key: 'learn-more',
      icon: Info,
      label: 'Learn More',
      action: handleLearnMore,
    },
  ]

  const menuItems = user ? authenticatedMenuItems : guestMenuItems

  return (
    <div ref={dropdownRef} className="relative" style={{ zIndex: 99999 }}>
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={handleUserClick}
        className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={user ? `${user.name || user.email} - Account Menu` : 'Guest - Account Menu'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{ position: 'relative', zIndex: 101 }}
      >
        {user ? (
          <>
            {hasAvatar ? (
              <img
                src={avatarUrl || ''}
                alt={user?.name || 'User'}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <span className={hasAvatar ? 'hidden' : 'block'}>{getUserInitials()}</span>
          </>
        ) : (
          <User className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          {/* ✅ FIX: Use very high z-index to ensure dropdown appears above report content */}
          <div
            className="fixed w-56 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 py-2 z-[99999]"
            style={{
              top: `${dropdownPosition.top}px`, // Dynamic position
              right: `${dropdownPosition.right}px`, // Dynamic position
            }}
          >
            {/* User Profile Header */}
            <div className="px-4 py-3 border-b border-zinc-800">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {hasAvatar ? (
                      <img
                        src={avatarUrl || ''}
                        alt={user?.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <span className={hasAvatar ? 'hidden' : 'block text-white text-sm font-medium'}>
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">{user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white">Welcome, Guest</p>
                  <p className="text-xs text-zinc-400">Sign in to access your dashboard</p>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                if (item.isDivider) {
                  return <div key={index} className="h-px bg-zinc-800 my-1" role="separator" />
                }

                const Icon = item.icon
                const isFirst = index === 0
                const isLast = index === menuItems.length - 1

                const isLogout = item.key === 'logout'
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      item.action?.()
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-4 sm:py-3 text-base sm:text-sm font-medium text-left border-0 bg-transparent
                      transition-colors duration-150
                      ${isFirst ? 'rounded-t-xl' : ''}
                      ${isLast ? 'rounded-b-xl' : ''}
                      ${
                        isLogout
                          ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                          : 'hover:bg-zinc-800/50 text-zinc-300 hover:text-white'
                      }
                    `}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {Icon && (
                      <Icon
                        className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${isLogout ? 'text-red-400' : 'text-zinc-400'}`}
                      />
                    )}
                    <span className="flex-1">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Exit Confirmation Modal */}
      <ExitReportConfirmationModal
        isOpen={showExitModal}
        onClose={handleCloseExitModal}
        onConfirm={handleExitReport}
        onSaveAndExit={handleSaveAndExit}
        hasUnsavedChanges={hasUnsavedChanges}
        hasValuationResults={
          !!session?.valuationResult || !!session?.htmlReport || !!session?.infoTabHtml
        }
        isSaving={isSaving}
      />
    </div>
  )
}
