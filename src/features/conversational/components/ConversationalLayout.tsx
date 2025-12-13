/**
 * ConversationalLayout Component
 *
 * Main layout component for conversational valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/conversational/components/ConversationalLayout
 */

import React, { useCallback, useEffect, useState } from 'react'
import { FullScreenModal } from '../../../components/FullScreenModal'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../../../constants/panelConstants'
import { useAuth } from '../../../hooks/useAuth'
import { guestCreditService } from '../../../services/guestCreditService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'
import { generateReportId } from '../../../utils/reportIdGenerator'
import { CreditGuard } from '../../auth/components/CreditGuard'
import { ConversationProvider, useConversationActions, useConversationState } from '../context/ConversationContext'
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
}

/**
 * Inner ConversationalLayout Component (wrapped by Provider)
 */
const ConversationalLayoutInner: React.FC<ConversationalLayoutProps> = ({
  reportId,
  onComplete,
  initialQuery = null,
  autoSend = false,
}) => {
  const { user } = useAuth()
  const state = useConversationState()
  const actions = useConversationActions()

  // Use split stores instead of monolithic useValuationStore
  const { setCollectedData } = useValuationFormStore()
  const { isCalculating } = useValuationApiStore()
  const { result, setResult } = useValuationResultsStore()

  // UI State
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat')
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview')

  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('upswitch-panel-width')
      if (saved) {
        const parsed = parseFloat(saved)
        if (
          !isNaN(parsed) &&
          parsed >= PANEL_CONSTRAINTS.MIN_WIDTH &&
          parsed <= PANEL_CONSTRAINTS.MAX_WIDTH
        ) {
          return parsed
        }
      }
    } catch (error) {
      chatLogger.warn('Failed to load saved panel width', { error })
    }
    return PANEL_CONSTRAINTS.DEFAULT_WIDTH
  })

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save panel width
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString())
    } catch (error) {
      chatLogger.warn('Failed to save panel width', { error })
    }
  }, [leftPanelWidth])

  // Sync valuation result from conversation context to results store
  useEffect(() => {
    if (state.valuationResult) {
      setResult(state.valuationResult)
    }
  }, [state.valuationResult, setResult])

  // Handle panel resize
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(
      PANEL_CONSTRAINTS.MIN_WIDTH,
      Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth)
    )
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH)
    } else {
      setLeftPanelWidth(constrainedWidth)
    }
  }, [])

  // Toolbar handlers
  const handleRefresh = useCallback(() => {
    const newReportId = generateReportId()
    window.location.href = UrlGeneratorService.reportById(newReportId)
  }, [])

  const handleDownload = useCallback(async () => {
    // Read from results store (same as manual flow)
    const currentResult = result || useValuationResultsStore.getState().result
    if (currentResult && currentResult.html_report) {
      try {
        const { DownloadService } = await import('../../../services/downloadService')
        const valuationData = {
          companyName: state.businessProfile?.company_name || currentResult.company_name || 'Company',
          valuationAmount: currentResult.equity_value_mid,
          valuationDate: new Date(),
          method: currentResult.methodology || 'DCF Analysis',
          confidenceScore: currentResult.confidence_score,
          htmlContent: currentResult.html_report || '',
        }
        await DownloadService.downloadPDF(valuationData, {
          format: 'pdf',
          filename: DownloadService.getDefaultFilename(
            state.businessProfile?.company_name || currentResult.company_name,
            'pdf'
          ),
        })
      } catch (error) {
        chatLogger.error('PDF download failed', { error, reportId })
      }
    }
  }, [result, state.businessProfile, reportId])

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
        {/* Toolbar */}
        <ValuationToolbar
          onRefresh={handleRefresh}
          onDownload={handleDownload}
          onFullScreen={() => setIsFullScreen(true)}
          isGenerating={isGeneratingState}
          user={user}
          valuationName="Valuation"
          valuationId={result?.valuation_id || state.valuationResult?.valuation_id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
                restoredMessages={state.messages.filter((m) => m.isComplete)}
                isRestoring={false}
                isRestorationComplete={state.isRestored}
                isSessionInitialized={state.isInitialized}
                pythonSessionId={state.pythonSessionId}
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
            <ReportPanel activeTab={activeTab} onTabChange={setActiveTab} />
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
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          title="Valuation - Full Screen"
        >
          <ReportPanel className="h-full" activeTab={activeTab} onTabChange={setActiveTab} />
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
    return (
      <ConversationProvider initialSessionId={reportId}>
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
