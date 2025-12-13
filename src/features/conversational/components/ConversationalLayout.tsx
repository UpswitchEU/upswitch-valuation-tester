/**
 * ConversationalLayout Component
 *
 * Placeholder component for conversational valuation flow.
 * TODO: Implement full conversational AI interface.
 */

import React from 'react'
import type { ValuationResponse } from '../../../types/valuation'

interface ConversationalLayoutProps {
  reportId: string
  onComplete: (result: ValuationResponse) => void
  initialQuery?: string | null
  autoSend?: boolean
}

export const ConversationalLayout: React.FC<ConversationalLayoutProps> = ({
  reportId,
  onComplete,
  initialQuery,
  autoSend
}) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Conversational Valuation</h2>
        <p className="text-gray-600 mb-4">
          Conversational AI interface coming soon...
        </p>
        <p className="text-sm text-gray-500">
          Report ID: {reportId}
          {initialQuery && <br />}Initial Query: {initialQuery}
        </p>
      </div>
    </div>
  )
}