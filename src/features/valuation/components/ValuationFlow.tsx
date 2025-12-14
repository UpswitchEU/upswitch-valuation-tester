/**
 * ValuationFlow Component
 * 
 * Unified flow component that handles both manual and conversational flows.
 * Single Responsibility: Flow routing and orchestration.
 */

'use client'

import React, { lazy, Suspense } from 'react'
import { LoadingState } from '../../../components/LoadingState'
import { GENERATION_STEPS } from '../../../components/LoadingState.constants'
import type { ValuationResponse } from '../../../types/valuation'

export type ValuationFlowType = 'manual' | 'conversational'

interface ValuationFlowProps {
  /** Unique report identifier */
  reportId: string
  /** Flow type to render */
  flowType: ValuationFlowType
  /** Callback when valuation completes */
  onComplete: (result: ValuationResponse) => void
  /** Optional initial query for conversational flow */
  initialQuery?: string | null
  /** Whether to automatically send initial query */
  autoSend?: boolean
}

// Lazy load flow components
const ConversationalLayout = lazy(() =>
  import('../../conversational/components/ConversationalLayout').then((module) => ({
    default: module.ConversationalLayout,
  }))
)

// Manual flow component - using DataCollection for now
const ManualFlow = lazy(() =>
  import('../../../components/data-collection/DataCollection').then((module) => ({
    default: module.DataCollection,
  }))
)

/**
 * ValuationFlow Component
 * 
 * Routes to appropriate flow component based on flowType prop.
 */
export const ValuationFlow: React.FC<ValuationFlowProps> = ({
  reportId,
  flowType,
  onComplete,
  initialQuery,
  autoSend = false,
}) => {
  if (flowType === 'conversational') {
    return (
      <Suspense fallback={<LoadingState steps={GENERATION_STEPS} variant="dark" />}>
        <ConversationalLayout
          reportId={reportId}
          onComplete={onComplete}
          initialQuery={initialQuery}
          autoSend={autoSend}
        />
      </Suspense>
    )
  }

  // Manual flow - render data collection component
  // TODO: Create proper ManualFlow component if needed
  return (
    <Suspense fallback={<LoadingState steps={GENERATION_STEPS} variant="dark" />}>
      <div className="flex flex-col h-full">
        <ManualFlow
          method="manual_form"
          onDataCollected={() => {}}
          onComplete={() => {}}
        />
      </div>
    </Suspense>
  )
}
