/**
 * ValuationFlowSelector Component
 *
 * Selects and renders the appropriate valuation flow based on session state.
 * Single Responsibility: Flow selection and conditional rendering.
 *
 * @module components/ValuationFlowSelector
 */

import React, { Suspense } from 'react';
import type { ValuationResponse } from '../types/valuation';
import { createMonitoredLazy } from '../hooks/usePerformanceMonitor';
import { LoadingState } from './LoadingState';
import { INITIALIZATION_STEPS } from './LoadingState.constants';

type Stage = 'loading' | 'data-entry' | 'processing' | 'flow-selection';

interface ValuationFlowSelectorProps {
  session: any;
  stage: Stage;
  error: string | null;
  prefilledQuery: string | null;
  autoSend: boolean;
  onComplete: (result: ValuationResponse) => void;
}

// Lazy load flow components with performance monitoring
const ManualValuationFlow = createMonitoredLazy(
  () => import('../features/manual-valuation/components/ManualValuationFlow').then(module => ({
    default: module.ManualValuationFlow
  })),
  'ManualValuationFlow'
);

const ConversationalValuationFlow = createMonitoredLazy(
  () => import('../features/conversational-valuation/components/ConversationalValuationFlow').then(module => ({
    default: module.ConversationalValuationFlow
  })),
  'ConversationalValuationFlow'
);

/**
 * Valuation Flow Selector
 *
 * Conditionally renders the appropriate valuation flow based on session state.
 * Handles loading states and error conditions.
 */
export const ValuationFlowSelector: React.FC<ValuationFlowSelectorProps> = React.memo(({
  session,
  stage,
  error,
  prefilledQuery,
  autoSend,
  onComplete,
}) => {
  // Render based on stage
  if (stage === 'loading') {
    return (
      <LoadingState
        steps={INITIALIZATION_STEPS}
        variant="dark"
      />
    );
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
    );
  }

  if (stage === 'data-entry' && session) {
    return (
      <div className="relative h-full w-full">
        {/* Conditionally render only the active flow component for better performance */}
        {/* Smooth fade-in animation when component mounts */}
        {session.currentView === 'manual' && (
          <div
            key="manual-flow"
            className="absolute inset-0 animate-in fade-in duration-200 ease-out"
          >
            <Suspense fallback={null}>
              <ManualValuationFlow
                reportId={session.reportId}
                onComplete={onComplete}
              />
            </Suspense>
          </div>
        )}

        {session.currentView === 'conversational' && (
          <div
            key="conversational-flow"
            className="absolute inset-0 animate-in fade-in duration-200 ease-out"
          >
            <Suspense fallback={null}>
              <ConversationalValuationFlow
                reportId={session.reportId}
                onComplete={onComplete}
                initialQuery={prefilledQuery}
                autoSend={autoSend}
              />
            </Suspense>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unexpected states
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading valuation interface...</p>
      </div>
    </div>
  );
});

ValuationFlowSelector.displayName = 'ValuationFlowSelector';
