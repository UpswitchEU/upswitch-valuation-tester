/**
 * useCreditGuard Hook
 *
 * Manages credit checking and blocking for guest users.
 * Prevents access to features when credits are exhausted.
 *
 * @module features/auth/hooks/useCreditGuard
 */

import { useCallback, useEffect, useState } from 'react'
import { guestCreditService } from '../../../services/guestCreditService'
import { chatLogger } from '../../../utils/logger'

interface UseCreditGuardOptions {
  isAuthenticated: boolean
  onOutOfCredits?: () => void
}

interface UseCreditGuardReturn {
  hasCredits: boolean
  creditsRemaining: number
  isBlocked: boolean
  checkCredits: () => boolean
  showOutOfCreditsModal: boolean
  setShowOutOfCreditsModal: (show: boolean) => void
}

/**
 * Hook for managing credit-based access control
 *
 * Features:
 * - Checks credits on mount for guest users
 * - Provides blocking state for UI
 * - Manages out-of-credits modal display
 * - Authenticated users bypass credit checks
 *
 * @param options Configuration options
 * @returns Credit state and control functions
 */
export function useCreditGuard({
  isAuthenticated,
  onOutOfCredits,
}: UseCreditGuardOptions): UseCreditGuardReturn {
  const [hasCredits, setHasCredits] = useState(true)
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)

  /**
   * Check if user has credits
   */
  const checkCredits = useCallback((): boolean => {
    if (isAuthenticated) {
      // Authenticated users have unlimited credits
      return true
    }

    const credits = guestCreditService.hasCredits()
    const remaining = guestCreditService.getCreditsRemaining()

    setHasCredits(credits)
    setCreditsRemaining(remaining)

    return credits
  }, [isAuthenticated])

  /**
   * Check credits on mount for guest users
   */
  useEffect(() => {
    if (!isAuthenticated) {
      const credits = checkCredits()

      if (!credits) {
        chatLogger.warn('Guest user out of credits - blocking conversation')
        setShowOutOfCreditsModal(true)
        setIsBlocked(true)

        if (onOutOfCredits) {
          onOutOfCredits()
        }
      }
    } else {
      // Authenticated users always have access
      setHasCredits(true)
      setIsBlocked(false)
    }
  }, [isAuthenticated, checkCredits, onOutOfCredits])

  return {
    hasCredits,
    creditsRemaining,
    isBlocked,
    checkCredits,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
  }
}
