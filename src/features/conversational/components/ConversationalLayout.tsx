/**
 * ConversationalLayout Component
 *
 * Main layout component for conversational valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/conversational/components/ConversationalLayout
 */

import React, { useCallback, useEffect, useState } from 'react'
<<<<<<< HEAD
import {
    DataCollection,
    DataResponse
} from '../../../components/data-collection'
=======
>>>>>>> refactor-gtm
import { FullScreenModal } from '../../../components/FullScreenModal'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../../../constants/panelConstants'
import { useAuth } from '../../../hooks/useAuth'
<<<<<<< HEAD
import { guestCreditService } from '../../../services/guestCreditService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationStore } from '../../../store/useValuationStore'
import type { ValuationResponse } from '../../../types/valuation'
import { convertDataResponsesToFormData } from '../../../utils/dataCollectionUtils'
import { chatLogger } from '../../../utils/logger'
import { generateReportId } from '../../../utils/reportIdGenerator'
import { CreditGuard } from '../../auth/components/CreditGuard'
import { useConversationActions, useConversationState } from '../context/ConversationContext'
=======
import {
    useValuationToolbarDownload,
    useValuationToolbarFullscreen,
    useValuationToolbarRefresh,
    useValuationToolbarTabs,
} from '../../../hooks/valuationToolbar'
import { guestCreditService } from '../../../services/guestCreditService'
import { RefreshService } from '../../../services/toolbar/refreshService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'
import { generateReportId } from '../../../utils/reportIdGenerator'
import { CreditGuard } from '../../auth/components/CreditGuard'
import { ConversationProvider, useConversationActions, useConversationState } from '../context/ConversationContext'
import { useConversationRestoration } from '../hooks'
>>>>>>> refactor-gtm
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
<<<<<<< HEAD
 * Conversational Layout Component
 *
 * Orchestrates the main layout for conversational valuation with AI-guided data collection.
 * Provides a chat-like interface for natural business valuation conversations.
 *
 * ## Layout Architecture
 * - **Left Panel**: Conversation chat interface with AI assistant
 * - **Right Panel**: Live preview of valuation results and business profile
 * - **Toolbar**: Export controls, refresh, and fullscreen options
 * - **Resizable Divider**: Adjustable panel sizes with persistence
 *
 * ## Data Collection Flow
 * 1. AI assistant asks contextual questions based on business type
 * 2. User responds naturally (text, suggestions, or examples)
 * 3. Real-time validation and progress tracking
 * 4. Automatic data conversion to valuation format
 * 5. Live preview updates as data is collected
 *
 * ## State Management
 * - Conversation context with message history
 * - Business profile data aggregation
 * - Valuation result streaming and updates
 * - UI state (panel sizes, mobile view, etc.)
 *
 * ## Performance Optimizations
 * - Memoized event handlers and calculations
 * - Lazy loading of heavy preview components
 * - Efficient re-rendering with stable references
 * - Local storage persistence for UI preferences
 *
 * ## Accessibility Features
 * - Keyboard navigation support
 * - Screen reader friendly chat interface
 * - High contrast mode support
 * - Focus management for panel switching
 *
 * ## Mobile Responsiveness
 * - Collapsible panels for small screens
 * - Touch-friendly controls and gestures
 * - Optimized chat interface for mobile
 *
 * @param props - Component props
 * @returns Conversational valuation interface with chat and preview panels
 *
 * @example
 * ```tsx
 * <ConversationalLayout
 *   reportId="rpt-456"
 *   onComplete={(result) => {
 *     console.log('Conversational valuation complete:', result);
 *     navigate('/results');
 *   }}
 *   initialQuery="I run a SaaS company with 50 employees"
 *   autoSend={true}
 * />
 * ```
 *
 * @since 2.0.0
 * @author UpSwitch Conversational AI Team
 */
export const ConversationalLayout: React.FC<ConversationalLayoutProps> = React.memo(
  ({ reportId, onComplete, initialQuery = null, autoSend = false }) => {
    const { user } = useAuth()
    const state = useConversationState()
    const actions = useConversationActions()
    const { setResult, updateFormData } = useValuationStore()

    // Data collection state
    const [_collectedData, setCollectedData] = useState<DataResponse[]>([])
    const [_showDataCollection, setShowDataCollection] = useState(false)

    // Memoize data collection handlers
    const handleDataCollected = useCallback(
      (responses: DataResponse[]) => {
        setCollectedData(responses)

        // Convert responses to form data format using shared utility
        const formData = convertDataResponsesToFormData(responses)

        // Update valuation store with collected data
        updateFormData(formData)

        chatLogger.info('Conversational flow collected data:', formData)
      },
      [updateFormData]
    )

    const handleCollectionComplete = useCallback(
      (responses: DataResponse[]) => {
        // Convert responses to form data format using shared utility
        const formData = convertDataResponsesToFormData(responses)

        // Update valuation store with final collected data
        updateFormData(formData)

        chatLogger.info('Conversational flow collection complete:', formData)
        setShowDataCollection(false)
      },
      [updateFormData]
    )

    const handleProgressUpdate = useCallback(
      (progress: { overallProgress: number; completedFields: number; totalFields: number }) => {
        chatLogger.debug('Conversational flow progress:', progress)
      },
      []
    )

    // UI State
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat')
    const [showPreConversationSummary, setShowPreConversationSummary] = useState(false)

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

    // Data collection method toggle (for demonstration)
    const [useDataCollection, setUseDataCollection] = useState(false)

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

    // Sync valuation result to global store
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
      if (state.valuationResult && state.valuationResult.html_report) {
        try {
          const { DownloadService } = await import('../../../services/downloadService')
          const valuationData = {
            companyName: state.businessProfile?.company_name || 'Company',
            valuationAmount: state.valuationResult.equity_value_mid,
            valuationDate: new Date(),
            method: state.valuationResult.methodology || 'DCF Analysis',
            confidenceScore: state.valuationResult.confidence_score,
            inputs: {
              revenue: state.businessProfile?.revenue,
              ebitda: state.businessProfile?.ebitda,
              industry: state.businessProfile?.industry,
              employees: state.businessProfile?.employees,
            },
            assumptions: {
              growth_rate: '5%',
              discount_rate: '10%',
              terminal_growth: '2%',
            },
            htmlContent: state.valuationResult.html_report || '',
          }
          await DownloadService.downloadPDF(valuationData, {
            format: 'pdf',
            filename: DownloadService.getDefaultFilename(
              state.businessProfile?.company_name,
              'pdf'
            ),
          })
        } catch (error) {
          chatLogger.error('PDF download failed', { error, reportId })
        }
      }
    }, [state.valuationResult, state.businessProfile, reportId])

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
      async (result: any) => {
        actions.setValuationResult(result)
        onComplete(result)

        // Update frontend credit count for guests
        if (!user && (result as any).creditsRemaining !== undefined) {
          guestCreditService.setCredits((result as any).creditsRemaining)
        }
      },
      [actions, onComplete, user]
    )

    // Credit guard state - using guest credit service for now
    const hasCredits = user ? true : guestCreditService.hasCredits()

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
            isGenerating={state.isGenerating}
            user={user}
            valuationName="Valuation"
            valuationId={state.valuationResult?.valuation_id}
            activeTab="preview" // This will be managed by ReportPanel
            onTabChange={() => {
              // Tab changes handled by ReportPanel
            }} // Tab changes handled by ReportPanel
            companyName={state.businessProfile?.company_name}
            valuationMethod={state.valuationResult?.methodology}
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
                {useDataCollection ? (
                  // Data Collection (Form-based)
                  <div className="p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Data Collection</h3>
                      <p className="text-sm text-zinc-400">
                        Using the same data collection system as manual forms, but in conversational
                        context.
                      </p>
                    </div>
                    <DataCollection
                      method="manual_form"
                      onDataCollected={handleDataCollected}
                      onProgressUpdate={handleProgressUpdate}
                      onComplete={handleCollectionComplete}
                      initialData={{
                        // Pre-populate with any existing data from conversation
                        company_name: state.businessProfile?.company_name,
                        revenue: state.businessProfile?.revenue,
                        ebitda: state.businessProfile?.ebitda,
                        number_of_employees: state.businessProfile?.number_of_employees,
                      }}
                    />
                  </div>
                ) : (
                  // Traditional Conversation Panel
                  <ConversationPanel
                    sessionId={state.sessionId}
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
                      // Handle data collection - sync to session
                      if (data.field && data.value !== undefined) {
                        // This would sync to session store
                        chatLogger.debug('Data collected from conversational flow', {
                          field: data.field,
                          value: data.value,
                        })
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
                )}
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
              <ReportPanel />
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
            <ReportPanel className="h-full" />
          </FullScreenModal>
        </div>
      </CreditGuard>
=======
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

  // Restore conversation from Python backend
  const restoration = useConversationRestoration({
    sessionId: reportId,
    enabled: true,
    onRestored: useCallback(
      (messages: import('../../../types/message').Message[], pythonSessionId: string | null) => {
        chatLogger.info('Conversation restored in ConversationalLayout', {
          reportId,
          messageCount: messages.length,
          pythonSessionId,
        })
        // Update conversation context with restored messages
        actions.setMessages(messages)
        if (pythonSessionId) {
          actions.setPythonSessionId(pythonSessionId)
        }
        actions.setRestored(true)
        actions.setInitialized(true)
      },
      [actions, reportId]
    ),
    onError: useCallback(
      (error: string) => {
        chatLogger.error('Failed to restore conversation', { reportId, error })
        actions.setError(error)
        // Still allow new conversation even if restoration fails
        actions.setRestored(true)
        actions.setInitialized(true)
      },
      [actions, reportId]
    ),
  })

  // Toolbar hooks
  const { handleRefresh: handleHookRefresh } = useValuationToolbarRefresh()
  const { handleDownload: handleHookDownload, isDownloading } = useValuationToolbarDownload()
  const {
    isFullScreen,
    handleOpenFullscreen: handleHookOpenFullscreen,
    handleCloseFullscreen: handleHookCloseFullscreen,
  } = useValuationToolbarFullscreen()
  const { activeTab, handleTabChange: handleHookTabChange } = useValuationToolbarTabs({
    initialTab: 'preview',
  })

  // UI State
  const [isMobile, setIsMobile] = useState(false)
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat')
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false)

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

  // Sync restored messages to conversation context
  useEffect(() => {
    if (restoration.state.messages.length > 0 && state.messages.length === 0) {
      actions.setMessages(restoration.state.messages)
    }
    if (restoration.state.pythonSessionId && !state.pythonSessionId) {
      actions.setPythonSessionId(restoration.state.pythonSessionId)
    }
  }, [restoration.state.messages, restoration.state.pythonSessionId, state.messages.length, state.pythonSessionId, actions])

  // Reset conversation context and restoration when reportId changes
  useEffect(() => {
    // Reset restoration hook when reportId changes
    restoration.reset()
    
    // Reset conversation context
    actions.setMessages([])
    actions.setValuationResult(null)
    actions.setGenerating(false)
    actions.setError(null)
    actions.setRestored(false)
    actions.setInitialized(false)
    actions.setPythonSessionId(null)
    
    // Update session ID in context
    actions.setSessionId(reportId)
  }, [reportId, restoration, actions])

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

  // Toolbar handlers - using hooks
  const handleRefresh = useCallback(() => {
    // Reset restoration state and start new conversation
    restoration.reset()
    actions.setMessages([])
    actions.setValuationResult(null)
    actions.setGenerating(false)
    actions.setError(null)
    actions.setRestored(false)
    actions.setInitialized(false)
    
    // Generate new report ID and navigate using RefreshService
    const newReportId = generateReportId()
    RefreshService.navigateTo(UrlGeneratorService.reportById(newReportId))
    handleHookRefresh()
  }, [restoration, actions, handleHookRefresh])

  const handleDownload = useCallback(async () => {
    // Read from results store (same as manual flow)
    const currentResult = result || useValuationResultsStore.getState().result
    if (currentResult && currentResult.html_report) {
      await handleHookDownload({
        companyName: state.businessProfile?.company_name || currentResult.company_name || 'Company',
        valuationAmount: currentResult.equity_value_mid,
        valuationDate: new Date(),
        method: currentResult.methodology || 'DCF Analysis',
        confidenceScore: currentResult.confidence_score,
        htmlContent: currentResult.html_report || '',
      })
    }
  }, [result, state.businessProfile, handleHookDownload])

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
          onFullScreen={handleHookOpenFullscreen}
          isGenerating={isGeneratingState || isDownloading}
          user={user}
          valuationName="Valuation"
          valuationId={result?.valuation_id || state.valuationResult?.valuation_id}
          activeTab={activeTab}
          onTabChange={handleHookTabChange}
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
            <ReportPanel activeTab={activeTab} onTabChange={handleHookTabChange} />
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
          onClose={handleHookCloseFullscreen}
          title="Valuation - Full Screen"
        >
          <ReportPanel className="h-full" activeTab={activeTab} onTabChange={handleHookTabChange} />
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
>>>>>>> refactor-gtm
    )
  }
)

ConversationalLayout.displayName = 'ConversationalLayout'
