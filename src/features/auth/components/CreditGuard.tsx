/**
 * CreditGuard Component
 *
 * Wrapper component that blocks content when user is out of credits.
 * Shows out-of-credits modal for guest users.
 *
 * @module features/auth/components/CreditGuard
 */

import React, { ReactNode } from 'react'
import { OutOfCreditsModal } from '../../../components/OutOfCreditsModal'

interface CreditGuardProps {
  children: ReactNode
  hasCredits: boolean
  isBlocked: boolean
  showOutOfCreditsModal: boolean
  onCloseModal: () => void
  onSignUp: () => void
  onTryManual: () => void
}

/**
 * Credit guard wrapper component
 *
 * Blocks access to children when user is out of credits
 * and displays out-of-credits modal.
 */
export const CreditGuard: React.FC<CreditGuardProps> = ({
  children,
  showOutOfCreditsModal,
  onCloseModal,
  onSignUp,
  onTryManual,
}) => {
  return (
    <>
      {children}

      {/* Out of Credits Modal */}
      <OutOfCreditsModal
        isOpen={showOutOfCreditsModal}
        onClose={onCloseModal}
        onSignUp={onSignUp}
        onTryManual={onTryManual}
      />
    </>
  )
}
