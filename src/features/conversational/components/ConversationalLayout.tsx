/**
 * ConversationalLayout Component
 *
 * Main layout component for conversational valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/conversational/components/ConversationalLayout
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FullScreenModal } from '../../../components/FullScreenModal'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { MOBILE_BREAKPOINT } from '../../../constants/panelConstants'
import { useAuth } from '../../../hooks/useAuth'
import { useConversationalToolbar } from '../../../hooks/useConversationalToolbar'
import { usePanelResize } from '../../../hooks/usePanelResize'
import { useReportIdTracking } from '../../../hooks/useReportIdTracking'
import { guestCreditService } from '../../../services/guestCreditService'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'
import { CreditGuard } from '../../auth/components/CreditGuard'
import { ConversationProvider, useConversationActions, useConversationState } from '../context/ConversationContext'
import { useConversationRestoration } from '../hooks'
import { BusinessProfileSection } from './BusinessProfileSection'
import { ConversationPanel } from './ConversationPanel'
import { ReportPanel } from './ReportPanel'

/**
 * Conversational Layout Component Props
 */
interface ConversationalLayoutProps {
  /** Unique report identifier for the conversation session */
  reportId: string
  /** Callback when conversational valuation completes */
  onComplete: (result: ValuationResponse) => void
  /** Optional initial query to start the conversation */
  initialQuery?: string | null
  /** Whether to automatically send the initial query */
  autoSend?: boolean
  /** Initial version to load (M&A workflow) */
  initialVersion?: number
  /** Initial mode (edit/view) */
  initialMode?: 'edit' | 'view'
}

/**
 * Inner ConversationalLayout Component (wrapped by Provider)
 */
const ConversationalLayoutInner: React.FC<ConversationalLayoutProps> = ({
  reportId,
  onComplete,
  initialQuery = null,
  autoSend = false,
  initialVersion,
  initialMode = 'edit',
}) => {
  const { user } = useAuth()
  const state = useConversationState()
  const actions = useConversationActions()

  // Use split stores instead of monolithic useValuationStore
  const { setCollectedData } = useValuationFormStore()
  const { isCalculating } = useValuationApiStore()
  const { result, setResult } = useValuationResultsStore()
  const { isSaving, lastSaved, hasUnsavedChanges, syncError } = useValuationSessionStore()

  // Restore conversation from Python backend
  // FIX: Use refs to stabilize callbacks and prevent infinite loops
  const actionsRef = useRef(actions)
  actionsRef.current = actions // Always keep ref up to date
  
  const reportIdRef = useRef(reportId)
  reportIdRef.current = reportId // Always keep ref up to date
  
  const restoration = useConversationRestoration({
    sessionId: reportId,
    enabled: true,
    onRestored: useCallback(
      (messages: import('../../../types/message').Message[], pythonSessionId: string | null) => {
        chatLogger.info('Conversation restored in ConversationalLayout', {
          reportId: reportIdRef.current,
          messageCount: messages.length,
          pythonSessionId,
        })
        actionsRef.current.setMessages(messages)
        if (pythonSessionId) {
          actionsRef.current.setPythonSessionId(pythonSessionId)
        }
        actionsRef.current.setRestored(true)
        actionsRef.current.setInitialized(true)
      },
      [] // Empty deps - use refs instead
    ),
    onError: useCallback(
      (error: string) => {
        chatLogger.error('Failed to restore conversation', { reportId: reportIdRef.current, error })
        actionsRef.current.setError(error)
        actionsRef.current.setRestored(true)
        actionsRef.current.setInitialized(true)
      },
      [] // Empty deps - use refs instead
    ),
  })

  // Custom hooks for modular responsibilities
  const { leftPanelWidth, handleResize } = usePanelResize()
  const toolbar = useConversationalToolbar({
    reportId,
    restoration,
    actions,
    state,
    result,
  })

  // UI State
  const [isMobile, setIsMobile] = useState(false)
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat')
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync valuation result from conversation context to results store
  useEffect(() => {
    if (state.valuationResult) {
      setResult(state.valuationResult)
    }
  }, [state.valuationResult, setResult])

  // Sync restored messages to conversation context
  useEffect(() => {
    if (restoration.state.messages.length > 0 && state.messages.length === 0) {
      actions.setMessages(restoration.state.messages)
    }
    if (restoration.state.pythonSessionId && !state.pythonSessionId) {
      actions.setPythonSessionId(restoration.state.pythonSessionId)
    }
  }, [restoration.state.messages.length, restoration.state.pythonSessionId, state.messages.length, state.pythonSessionId, actions])

  // Track reportId changes and reset when needed
  useReportIdTracking({
    reportId,
    onReportIdChange: useCallback(
      (isNewReport) => {
        if (!isNewReport) {
          // Same reportId - just ensure session ID is set
          if (state.sessionId !== reportId) {
            actions.setSessionId(reportId)
          }
          return
        }

        // Don't reset if restoration is in progress
        if (restoration.state.isRestoring || restoration.state.isRestored) {
          chatLogger.debug('Skipping reset - restoration in progress or already restored', {
            reportId,
            isRestoring: restoration.state.isRestoring,
            isRestored: restoration.state.isRestored,
          })
          return
        }

        // Reset for new report
        restoration.reset()
        actions.setMessages([])
        actions.setValuationResult(null)
        actions.setGenerating(false)
        actions.setError(null)
        actions.setRestored(false)
        actions.setInitialized(false)
        actions.setPythonSessionId(null)
        actions.setSessionId(reportId)
      },
      [reportId, state.sessionId, restoration, actions]
    ),
  })


  // Handle Python session ID updates from conversation
  const handlePythonSessionIdReceived = useCallback(
    (sessionId: string) => {
      chatLogger.info('Python session ID received, updating conversation state', {
        sessionId,
        reportId,
      })
      actions.setPythonSessionId(sessionId)
    },
    [actions, reportId]
  )

  // Handle valuation completion
  const handleValuationComplete = useCallback(
    async (result: ValuationResponse) => {
      actions.setValuationResult(result)
      actions.setGenerating(false)
      
      // Store in results store (same as manual flow)
      setResult(result)
      
      onComplete(result)

      // Update frontend credit count for guests
      if (!user && (result as any).creditsRemaining !== undefined) {
        guestCreditService.setCredits((result as any).creditsRemaining)
      }
    },
    [actions, onComplete, user, setResult]
  )

  // Credit guard state
  const hasCredits = user ? true : guestCreditService.hasCredits()

  // Determine generating state (from API store or conversation context)
  const isGeneratingState = isCalculating || state.isGenerating

  return (
    <CreditGuard
      hasCredits={hasCredits}
      isBlocked={false}
      showOutOfCreditsModal={false}
      onCloseModal={() => {}}
      onSignUp={() => {
        chatLogger.info('User clicked sign up from out of credits modal')
      }}
      onTryManual={() => {
        chatLogger.info('User clicked try manual flow from out of credits modal')
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar (Save Status integrated inside toolbar) */}
        <ValuationToolbar
          onRefresh={toolbar.handleRefresh}
          onDownload={toolbar.handleDownload}
          onFullScreen={toolbar.handleOpenFullscreen}
          isGenerating={isGeneratingState || toolbar.isDownloading}
          user={user}
          valuationName="Valuation"
          valuationId={result?.valuation_id || state.valuationResult?.valuation_id}
          activeTab={toolbar.activeTab}
          onTabChange={(tab: 'source' | 'preview' | 'info' | 'history') => {
            if (tab !== 'history') {
              toolbar.handleTabChange(tab)
            }
          }}
          companyName={state.businessProfile?.company_name || result?.company_name}
        />

        {/* Error Display */}
        {state.error && (
          <div className="mx-4 mb-4">
            <div className="bg-rust-500/20 border border-rust-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-rust-300">
                <span className="text-rust-400">⚠️</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-rust-200 text-sm mt-1">{state.error}</p>
            </div>
          </div>
        )}

        {/* Business Profile Section */}
        <BusinessProfileSection
          showPreConversationSummary={showPreConversationSummary}
          onTogglePreConversationSummary={() => setShowPreConversationSummary(false)}
        />

        {/* Split Panel */}
        <div
          className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800"
          style={{ transition: 'width 150ms ease-out' }}
        >
          {/* Left Panel: Chat */}
          <div
            className={`${
              isMobile ? (mobileActivePanel === 'chat' ? 'w-full' : 'hidden') : ''
            } h-full flex flex-col bg-zinc-900 border-r border-zinc-800 w-full lg:w-auto`}
            style={{
              width: isMobile ? '100%' : `${leftPanelWidth}%`,
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <ConversationPanel
                sessionId={state.sessionId || reportId}
                userId={user?.id}
                restoredMessages={
                  restoration.state.messages.length > 0
                    ? restoration.state.messages.filter((m: import('../../../types/message').Message) => m.isComplete)
                    : state.messages.filter((m: import('../../../types/message').Message) => m.isComplete)
                }
                isRestoring={restoration.state.isRestoring}
                isRestorationComplete={restoration.state.isRestored && state.isRestored}
                isSessionInitialized={restoration.state.isRestored && state.isInitialized}
                pythonSessionId={restoration.state.pythonSessionId || state.pythonSessionId}
                onPythonSessionIdReceived={handlePythonSessionIdReceived}
                onValuationComplete={handleValuationComplete}
                onValuationStart={() => actions.setGenerating(true)}
                onReportUpdate={() => {}}
                onDataCollected={(data) => {
                  // Handle data collection - sync to form store
                  if (data.field && data.value !== undefined) {
                    chatLogger.debug('Data collected from conversational flow', {
                      field: data.field,
                      value: data.value,
                    })
                    // Data will be synced through StreamingChat's onDataCollected callback
                  }
                }}
                onValuationPreview={() => {}}
                onCalculateOptionAvailable={() => {}}
                onProgressUpdate={() => {}}
                onReportSectionUpdate={() => {}}
                onSectionLoading={() => {}}
                onSectionComplete={() => {}}
                onReportComplete={() => {}}
                onContextUpdate={() => {}}
                onHtmlPreviewUpdate={() => {}}
                initialMessage={initialQuery}
                autoSend={autoSend}
              />
            </div>
          </div>

          {/* Resizable Divider */}
          <ResizableDivider
            onResize={handleResize}
            leftWidth={leftPanelWidth}
            isMobile={isMobile}
          />

          {/* Right Panel: Report Display */}
          <div
            className={`${
              isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
            } h-full min-h-[400px] lg:min-h-0 w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
            style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
          >
            <ReportPanel activeTab={toolbar.activeTab} onTabChange={toolbar.handleTabChange} />
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        {isMobile && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-zinc-800 p-1 rounded-full shadow-lg">
            <button
              onClick={() => setMobileActivePanel('chat')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'chat'
                  ? 'bg-accent-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileActivePanel('preview')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'preview'
                  ? 'bg-accent-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        {/* Full Screen Modal */}
        <FullScreenModal
          isOpen={toolbar.isFullScreen}
          onClose={toolbar.handleCloseFullscreen}
          title="Valuation - Full Screen"
        >
          <ReportPanel className="h-full" activeTab={toolbar.activeTab} onTabChange={toolbar.handleTabChange} />
        </FullScreenModal>
      </div>
    </CreditGuard>
  )
}

/**
 * Conversational Layout Component (with Provider wrapper)
 *
 * Orchestrates the main layout for conversational valuation with AI-guided data collection.
 * Provides a chat-like interface for natural business valuation conversations.
 */
export const ConversationalLayout: React.FC<ConversationalLayoutProps> = React.memo(
  ({ reportId, onComplete, initialQuery = null, autoSend = false }) => {
    // Use key prop to force remount when reportId changes
    // This ensures clean state for each new report
    return (
      <ConversationProvider key={reportId} initialSessionId={reportId}>
        <ConversationalLayoutInner
          reportId={reportId}
          onComplete={onComplete}
          initialQuery={initialQuery}
          autoSend={autoSend}
        />
      </ConversationProvider>
    )
  }
)

ConversationalLayout.displayName = 'ConversationalLayout'
