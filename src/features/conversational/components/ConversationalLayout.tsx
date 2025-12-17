/**
 * ConversationalLayout Component
 *
 * Main layout component for conversational valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/conversational/components/ConversationalLayout
 */

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AssetInspector } from '../../../components/debug/AssetInspector'
import { FullScreenModal } from '../../../components/FullScreenModal'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { MOBILE_BREAKPOINT } from '../../../constants/panelConstants'
import { useAuth } from '../../../hooks/useAuth'
import { useConversationalToolbar } from '../../../hooks/useConversationalToolbar'
import { usePanelResize } from '../../../hooks/usePanelResize'
import { useReportIdTracking } from '../../../hooks/useReportIdTracking'
import { useToast } from '../../../hooks/useToast'
import { conversationAPI } from '../../../services/api/conversation/ConversationAPI'
import { guestCreditService } from '../../../services/guestCreditService'
import { useConversationalChatStore, useConversationalResultsStore } from '../../../store/conversational'
import { useSessionStore } from '../../../store/useSessionStore'
import type { Message } from '../../../types/message'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'
import { CreditGuard } from '../../auth/components/CreditGuard'
import {
    ConversationProvider,
    useConversationActions,
    useConversationState,
} from '../context/ConversationContext'
import { useConversationRestoration } from '../hooks'
import { generateImportSummaryMessage, shouldGenerateImportSummary } from '../utils/generateImportSummary'
import { BusinessProfileSection } from './BusinessProfileSection'
import { ConversationPanel } from './ConversationPanel'
import { ErrorDisplay } from './ErrorDisplay'
import { MobilePanelSwitcher } from './MobilePanelSwitcher'
import { ReportPanel } from './ReportPanel'

// Chat skeleton component
const ChatSkeleton: React.FC = () => (
  <div className="flex flex-col h-full p-4 space-y-4">
    <div className="flex items-start space-x-2">
      <div className="w-8 h-8 rounded-full bg-zinc-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-700 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-zinc-700 rounded w-1/2 animate-pulse" />
      </div>
    </div>
    <div className="flex items-start space-x-2 justify-end">
      <div className="flex-1 space-y-2 items-end flex flex-col">
        <div className="h-4 bg-zinc-700 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-zinc-700 rounded w-1/2 animate-pulse" />
      </div>
      <div className="w-8 h-8 rounded-full bg-zinc-700 animate-pulse" />
    </div>
  </div>
)

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
  const { showToast } = useToast()

  // Use Conversational Flow isolated stores
  const { isCalculating, error, result, setResult, clearError } = useConversationalResultsStore()
  const { collectedData, updateCollectedData } = useConversationalChatStore()
  
  // Unified session store
  const session = useSessionStore((state) => state.session)
  const isSaving = useSessionStore((state) => state.isSaving)
  const lastSaved = useSessionStore((state) => state.lastSaved)
  const hasUnsavedChanges = useSessionStore((state) => state.hasUnsavedChanges)
  const syncError = useSessionStore((state) => state.error)

  // NEW: Asset orchestrator for progressive loading
  // Asset orchestration removed - data loaded directly from session store
  // Session loads via SessionManager, data populates reactively

  // Restore results from session when reportId changes (new session loaded)
  const lastRestoredReportIdRef = useRef<string | null>(null)
  useEffect(() => {
    const currentSession = useSessionStore.getState().session
    if (!currentSession?.reportId) {
      return
    }

    const reportId = currentSession.reportId

    // Only restore once per reportId (when new session loads)
    if (lastRestoredReportIdRef.current === reportId) {
      return
    }

    // Update tracked reportId
    lastRestoredReportIdRef.current = reportId

    // Restore results if session has them and we don't have a result yet
    if (currentSession.valuationResult && !result) {
      setResult(currentSession.valuationResult as any)
      chatLogger.info('[Conversational] Restored valuation result from session', {
        reportId,
      })
    }
  }, [session?.reportId, result, setResult])

  // Mark conversation changes as unsaved (for save status indicator)
  useEffect(() => {
    if (state.messages.length > 0) {
      useSessionStore.getState().markUnsaved()
    }
  }, [state.messages.length])

  // Track previous hasUnsavedChanges to detect when save happens after user changes
  const prevHasUnsavedChangesRef = useRef<boolean>(false)
  // Track initial load to prevent showing "saved" toast during initialization
  const isInitialLoadRef = useRef<boolean>(true)
  
  // Mark initial load as complete after first render and when session is ready
  useEffect(() => {
    // Wait a bit to ensure initialization is complete
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false
    }, 3000) // 3 seconds should be enough for initialization
    
    return () => clearTimeout(timer)
  }, [])
  
  // Show success toast when save completes (only if there were unsaved changes)
  useEffect(() => {
    // Don't show toast during initial load
    if (isInitialLoadRef.current) {
      return
    }
    
    // Check previous state BEFORE updating ref
    const hadUnsavedChanges = prevHasUnsavedChangesRef.current
    
    // Update ref to track current state for next render
    prevHasUnsavedChangesRef.current = hasUnsavedChanges
    
    // Only show toast if:
    // 1. Save just completed (lastSaved is recent)
    // 2. There were unsaved changes before the save (hadUnsavedChanges was true)
    // This prevents showing "saved" toast on initial page load when no changes were made
    if (lastSaved && !isSaving && !syncError && hadUnsavedChanges) {
      const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      // Only show toast for recent saves (within last 2 seconds)
      if (timeAgo < 2) {
        showToast(
          'Valuation report saved successfully! All data has been persisted.',
          'success',
          4000
        )
      }
    }
  }, [lastSaved, isSaving, syncError, hasUnsavedChanges, showToast])

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
  }, [
    restoration.state.messages.length,
    restoration.state.pythonSessionId,
    state.messages.length,
    state.pythonSessionId,
    actions,
  ])

  // Generate import summary when switching from manual → conversational with data
  // Failproof: Comprehensive error handling and validation
  const hasGeneratedSummaryRef = useRef(false)
  useEffect(() => {
    // Failproof: Validate all prerequisites
    if (!reportId) {
      return
    }

    // Only run after restoration is complete
    if (!restoration.state.isRestored) {
      return
    }

    // Only run once per report
    if (hasGeneratedSummaryRef.current) {
      return
    }

    // Read session from store inside effect to avoid dependency on session object
    const currentSession = useSessionStore.getState().session
    if (!currentSession) {
      chatLogger.debug('Skipping import summary: session not available', { reportId })
      return
    }

    // Check if we should generate an import summary
    const sessionData = currentSession.sessionData
    if (!sessionData) {
      chatLogger.debug('Skipping import summary: no session data', { reportId })
      return
    }

    try {
      if (shouldGenerateImportSummary(sessionData, state.messages)) {
        chatLogger.info('Generating import summary for manual → conversational switch', {
          reportId,
          hasCompanyName: !!sessionData?.company_name,
          hasRevenue: !!sessionData?.current_year_data?.revenue,
        })

        // Generate summary message with unique ID
        const messageId = `import_summary_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        // Failproof: Wrap in try-catch
        let summaryMessagePartial
        try {
          summaryMessagePartial = generateImportSummaryMessage(sessionData)
        } catch (error) {
          chatLogger.error('Failed to generate import summary message', {
            reportId,
            error: error instanceof Error ? error.message : String(error),
          })
          return // Don't proceed if generation fails
        }

        const summaryMessage: Message = {
          ...summaryMessagePartial,
          id: messageId,
          timestamp: new Date(),
        }
        
        // Failproof: Validate message before adding
        if (!summaryMessage.content || !summaryMessage.type) {
          chatLogger.warn('Invalid summary message generated, skipping', {
            reportId,
            hasContent: !!summaryMessage.content,
            hasType: !!summaryMessage.type,
          })
          return
        }
        
        // Add to conversation
        try {
          actions.addMessage(summaryMessage)
        } catch (error) {
          chatLogger.error('Failed to add import summary message to conversation', {
            reportId,
            error: error instanceof Error ? error.message : String(error),
          })
          return // Don't proceed if adding fails
        }

        // Persist to database (non-blocking)
        if (reportId && summaryMessage.id && summaryMessage.content) {
          conversationAPI.saveMessage({
            reportId,
            messageId: summaryMessage.id,
            role: summaryMessage.role || 'assistant',
            type: summaryMessage.type,
            content: summaryMessage.content,
            metadata: summaryMessage.metadata || {},
          }).catch((error) => {
            chatLogger.warn('Failed to persist import summary message', {
              reportId,
              messageId: summaryMessage.id,
              error: error instanceof Error ? error.message : String(error),
            })
            // Don't throw - persistence failure shouldn't break UI
          })
        }

        hasGeneratedSummaryRef.current = true
      }
    } catch (error) {
      // Failproof: Never let import summary generation break the app
      chatLogger.error('Unexpected error generating import summary', {
        reportId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      // Continue execution - don't break the flow
    }
  }, [
    restoration.state.isRestored,
    session?.reportId, // Only depend on reportId, read sessionData inside effect
    state.messages.length,
    reportId,
    actions,
  ])

  // Reset summary generation flag when reportId changes
  useEffect(() => {
    hasGeneratedSummaryRef.current = false
  }, [reportId])

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
      try {
        actions.setValuationResult(result)
        actions.setGenerating(false)

        // Store in results store (Conversational flow)
        setResult(result)

        // Call parent completion handler (may be async)
        await onComplete(result)

        // Mark as saved in unified store
        useSessionStore.getState().markSaved()

        // Update frontend credit count for guests
        if (!user && (result as any).creditsRemaining !== undefined) {
          guestCreditService.setCredits((result as any).creditsRemaining)
        }
      } catch (error) {
        chatLogger.error('[Conversational] Completion handler failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
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
          onTabChange={(tab: 'preview' | 'info' | 'history') => {
              toolbar.handleTabChange(tab)
          }}
          companyName={state.businessProfile?.company_name || result?.company_name}
        />

        {/* Error Display - Show both conversation context errors and API errors */}
        <ErrorDisplay error={state.error || error || null} />

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
              <Suspense fallback={<ChatSkeleton />}>
                <ConversationPanel
                  sessionId={state.sessionId || reportId}
                  userId={user?.id}
                  restoredMessages={
                    restoration.state.messages.length > 0
                      ? restoration.state.messages.filter(
                          (m: import('../../../types/message').Message) => m.isComplete
                        )
                      : state.messages.filter(
                          (m: import('../../../types/message').Message) => m.isComplete
                        )
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
              </Suspense>
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
            <ReportPanel
              reportId={reportId}
              activeTab={toolbar.activeTab}
              onTabChange={toolbar.handleTabChange}
              isCalculating={isGeneratingState}
              error={error}
              result={result || state.valuationResult || null}
              onClearError={clearError}
            />
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        {isMobile && (
          <MobilePanelSwitcher
            activePanel={mobileActivePanel}
            onPanelChange={setMobileActivePanel}
          />
        )}

        {/* Full Screen Modal */}
        <FullScreenModal
          isOpen={toolbar.isFullScreen}
          onClose={toolbar.handleCloseFullscreen}
          title="Valuation - Full Screen"
        >
          <ReportPanel
            reportId={reportId}
            className="h-full"
            activeTab={toolbar.activeTab}
            onTabChange={toolbar.handleTabChange}
            isCalculating={isGeneratingState}
            error={error}
            result={result || state.valuationResult || null}
            onClearError={clearError}
          />
        </FullScreenModal>

        {/* Asset Inspector (dev only) */}
        <AssetInspector />
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
