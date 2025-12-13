/**
 * ValuationFlowSelector Component
 *
 * Selects and renders the appropriate valuation flow based on session state.
 * Single Responsibility: Flow selection and conditional rendering.
 *
 * @module components/ValuationFlowSelector
 */

'use client'

// Dynamic imports are handled with lazy in Vite
import React, { lazy, Suspense, useMemo } from 'react'
import type { ValuationResponse, ValuationSession } from '../types/valuation'
import { LoadingState } from './LoadingState'
import { INITIALIZATION_STEPS } from './LoadingState.constants'

/**
 * Valuation flow stage types
 */
type Stage = 'loading' | 'data-entry' | 'processing' | 'flow-selection'

/**
 * ValuationFlowSelector Component Props
 */
interface ValuationFlowSelectorProps {
  /** Current valuation session data */
  session: ValuationSession | null
  /** Current UI stage determining what to render */
  stage: Stage
  /** Error message if session initialization failed */
  error: string | null
  /** Prefilled query for conversational flow */
  prefilledQuery: string | null
  /** Whether to auto-send prefilled query */
  autoSend: boolean
  /** Callback when valuation completes */
  onComplete: (result: ValuationResponse) => void
}

// Lazy load unified flow component
const ValuationFlow = lazy(() =>
  import('../features/valuation/components/ValuationFlow').then((module) => ({
    default: module.ValuationFlow,
  }))
)

/**
 * Valuation Flow Selector Component
 *
 * Conditionally renders the appropriate valuation flow based on session state.
 * Handles loading states, error conditions, and smooth transitions between flows.
 *
 * ## Stage-Based Rendering
 * - **'loading'**: Shows initialization progress with steps
 * - **'data-entry'**: Renders manual or conversational flow based on session
 * - **'processing'**: Shows calculation progress (future use)
 * - **'flow-selection'**: Flow picker (future use)
 *
 * ## Error Handling
 * - Displays user-friendly error messages
 * - Provides reload option for recovery
 * - Logs errors with context for debugging
 *
 * ## Performance Features
 * - Memoized flow type calculation
 * - Lazy loading of flow components with monitoring
 * - Smooth animations between flow transitions
 * - Suspense boundaries for loading states
 *
 * ## Animation Strategy
 * - Fade-in transitions when flows mount
 * - Key-based re-mounting for flow changes
 * - Loading fallbacks during component switches
 *
 * @param props - Component props
 * @returns Appropriate valuation flow interface based on session state
 *
 * @example
 * ```tsx
 * <ValuationFlowSelector
 *   session={currentSession}
 *   stage="data-entry"
 *   error={null}
 *   prefilledQuery="SaaS company"
 *   autoSend={true}
 *   onComplete={(result) => handleValuationComplete(result)}
 * />
 * ```
 *
 * @since 2.0.0
 * @author UpSwitch UI Team
 */
export const ValuationFlowSelector: React.FC<ValuationFlowSelectorProps> = React.memo(
  ({ session, stage, error, prefilledQuery, autoSend, onComplete }) => {
    // Memoize flow type calculation
    const flowType = useMemo(() => {
      return session?.currentView === 'manual' ? 'manual' : 'conversational'
    }, [session?.currentView])

    // Memoize flow key for animations
    const flowKey = useMemo(() => {
      return session ? `${session.currentView}-flow` : 'no-session-flow'
    }, [session?.currentView, session])

    // Render based on stage
    if (stage === 'loading') {
      return <LoadingState steps={INITIALIZATION_STEPS} variant="dark" />
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-rust-500/20 border border-rust-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-rust-400 mb-2">Error</h3>
              <p className="text-rust-300 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-rust-600 hover:bg-rust-700 text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (stage === 'data-entry' && session) {
      return (
        <div className="relative h-full w-full">
          {/* Render unified flow component based on session view */}
          {/* Smooth fade-in animation when component mounts */}
          <div key={flowKey} className="absolute inset-0 animate-in fade-in duration-200 ease-out">
            <Suspense fallback={null}>
              <ValuationFlow
                reportId={session.reportId}
                flowType={flowType}
                onComplete={onComplete}
                initialQuery={prefilledQuery}
                autoSend={autoSend}
              />
            </Suspense>
          </div>
        </div>
      )
    }

    // Fallback for unexpected states
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading valuation interface...</p>
        </div>
      </div>
    )
  }
)

ValuationFlowSelector.displayName = 'ValuationFlowSelector'
