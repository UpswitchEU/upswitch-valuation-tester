/**
 * ConversationPanel Component
 *
 * Single Responsibility: Wrapper around StreamingChat with error boundary and context integration
 * SOLID Principles: SRP - Only handles chat UI wrapper and error handling
 *
 * @module features/conversational/components/ConversationPanel
 */

import React, { useCallback, useMemo } from 'react'
import { StreamingChat } from '../../../components/StreamingChat'
import { valuationAuditService } from '../../../services/audit/ValuationAuditService'
import { valuationService, reportService } from '../../../services'
import { useConversationalResultsStore, useConversationalSessionStore, useConversationalChatStore } from '../../../store/conversational'
import { useVersionHistoryStore } from '../../../store/useVersionHistoryStore'
import type { Message } from '../../../types/message'
import type { ValuationResponse } from '../../../types/valuation'
import { buildValuationRequest } from '../../../utils/buildValuationRequest'
import { chatLogger } from '../../../utils/logger'
import {
  areChangesSignificant,
  detectVersionChanges,
  generateAutoLabel,
} from '../../../utils/versionDiffDetection'
import { ComponentErrorBoundary } from '../../shared/components/ErrorBoundary'
import { useConversationActions, useConversationState } from '../context/ConversationContext'
import { ConversationSummaryBlock } from './ConversationSummaryBlock'

/**
 * ConversationPanel Props
 */
export interface ConversationPanelProps {
  sessionId: string
  userId?: string
  restoredMessages?: Message[]
  isRestoring?: boolean
  isRestorationComplete?: boolean
  isSessionInitialized?: boolean
  pythonSessionId?: string | null
  onPythonSessionIdReceived?: (pythonSessionId: string) => void
  onValuationComplete?: (result: ValuationResponse) => void
  onValuationStart?: () => void
  onReportUpdate?: (htmlContent: string, progress: number) => void
  onDataCollected?: (data: { field: string; value: unknown }) => void
  onValuationPreview?: (data: unknown) => void
  onCalculateOptionAvailable?: (data: unknown) => void
  onProgressUpdate?: (data: unknown) => void
  onReportSectionUpdate?: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void
  onSectionLoading?: (section: string, html: string, phase: number, data?: unknown) => void
  onSectionComplete?: (event: {
    sectionId: string
    sectionName: string
    html: string
    progress: number
    phase?: number
  }) => void
  onReportComplete?: (html: string, valuationId: string) => void
  onContextUpdate?: (context: unknown) => void
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void
  initialMessage?: string | null
  autoSend?: boolean
}

/**
 * ConversationPanel Component
 *
 * Wraps StreamingChat component with error boundary and connects to ConversationContext.
 * Handles data collection callbacks and syncs to valuation stores.
 */
export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  sessionId,
  userId,
  restoredMessages = [],
  isRestoring = false,
  isRestorationComplete = false,
  isSessionInitialized = false,
  pythonSessionId,
  onPythonSessionIdReceived,
  onValuationComplete,
  onValuationStart,
  onReportUpdate,
  onDataCollected,
  onValuationPreview,
  onCalculateOptionAvailable,
  onProgressUpdate,
  onReportSectionUpdate,
  onSectionLoading,
  onSectionComplete,
  onReportComplete,
  onContextUpdate,
  onHtmlPreviewUpdate,
  initialMessage = null,
  autoSend = false,
}) => {
  const state = useConversationState()
  const actions = useConversationActions()
  const { updateCollectedData } = useConversationalChatStore()

  // Handle data collection - sync to conversational chat store
  const handleDataCollected = useCallback(
    (data: { field: string; value: unknown }) => {
      chatLogger.debug('[Conversational] Data collected', {
        field: data.field,
        value: data.value,
      })

      // Sync to conversational chat store if field and value are present
      // Note: StreamingChat manages its own collectedData state internally
      // This callback is for external notification, but we can also sync here if needed
      if (data.field && data.value !== undefined) {
        // Call parent callback (used by ConversationalLayout for logging)
        onDataCollected?.(data)

        // Update collected data in conversational store
        updateCollectedData({ [data.field]: data.value })
      }
    },
    [onDataCollected, updateCollectedData]
  )

  // Handle valuation complete - sync to context and conversational results store
  const { isCalculating, setResult, trySetCalculating, setCalculating } = useConversationalResultsStore()
  const { session } = useConversationalSessionStore()
  const { createVersion, getLatestVersion } = useVersionHistoryStore()

  const handleValuationComplete = useCallback(
    async (result: ValuationResponse) => {
      chatLogger.info('ConversationPanel: Valuation complete', {
        valuationId: result.valuation_id,
      })

      // Update conversation context
      actions.setValuationResult(result)
      actions.setGenerating(false)

      // Sync to results store (same as manual flow)
      setResult(result)

      // CRITICAL: Save complete session atomically (using Conversational flow stores)
      // Uses sessionService for consistency with Manual flow
      const { setSaving, markSaved, setError: setSessionError } = useConversationalSessionStore.getState()
      setSaving(true)

      if (session?.reportId) {
        try {
          // Get collected data from session for restoration
          const sessionStore = useConversationalSessionStore.getState()
          const sessionData = sessionStore.session?.sessionData || {}

          // ATOMIC SAVE: Save complete package in single API call
          // - sessionData: Collected data from conversation for restoration
          // - valuationResult: Calculation result
          // - htmlReport: Main report HTML
          // - infoTabHtml: Info tab HTML
          await reportService.saveReportAssets(session.reportId, {
            sessionData: sessionData,  // ✅ NEW: Include collected data
            valuationResult: result,
            htmlReport: result.html_report || '',
            infoTabHtml: result.info_tab_html || '',
          })

          chatLogger.info('[Conversational] Complete report package saved atomically', {
            reportId: session.reportId,
            hasSessionData: !!sessionData,
            sessionDataKeys: sessionData ? Object.keys(sessionData) : [],
            hasResult: !!result,
            hasHtmlReport: !!result.html_report,
            htmlReportLength: result.html_report?.length || 0,
            hasInfoTabHtml: !!result.info_tab_html,
            infoTabHtmlLength: result.info_tab_html?.length || 0,
          })

          markSaved()
        } catch (error) {
          chatLogger.error('[Conversational] Failed to save complete report package', {
            reportId: session.reportId,
            error: error instanceof Error ? error.message : String(error),
          })
          setSessionError(error instanceof Error ? error.message : 'Save failed')
        }
      } else {
        markSaved()
      }

      // M&A Workflow: Create new version if this is a regeneration (conversational flow)
      const reportId = session?.reportId
      if (reportId) {
        try {
          const previousVersion = getLatestVersion(reportId)

          // CRITICAL FIX: Get complete formData from session, not just result
          // The result only has calculated fields, but formData needs all input fields
          const sessionStore = useConversationalSessionStore.getState()
          const sessionData = (sessionStore.session?.sessionData || sessionStore.session?.partialData || {}) as any
          
          // Build complete formData from session + result
          // Session has the collected data, result has calculated/computed fields
          const resultAny = result as any
          const newFormData = {
            // From session (collected during conversation)
            company_name: sessionData.company_name || result.company_name || '',
            business_type: sessionData.business_type || '',
            business_type_id: sessionData.business_type_id || '',
            industry: sessionData.industry || resultAny.industry || '',
            business_model: sessionData.business_model || '',
            country_code: sessionData.country_code || resultAny.country_code || 'BE',
            founding_year: sessionData.founding_year || 0,
            number_of_employees: sessionData.number_of_employees || 0,
            number_of_owners: sessionData.number_of_owners || 0,
            shares_for_sale: sessionData.shares_for_sale || 100,
            recurring_revenue_percentage: sessionData.recurring_revenue_percentage || 0,
            
            // Financial data from session (preferred) or result
            current_year_data: {
              year: sessionData.current_year_data?.year || new Date().getFullYear(),
              revenue: sessionData.current_year_data?.revenue || sessionData.revenue || resultAny.revenue || 0,
              ebitda: sessionData.current_year_data?.ebitda || sessionData.ebitda || resultAny.ebitda || 0,
              net_income: sessionData.current_year_data?.net_income || 0,
              total_assets: sessionData.current_year_data?.total_assets || 0,
              total_debt: sessionData.current_year_data?.total_debt || 0,
              cash: sessionData.current_year_data?.cash || 0,
            },
            
            // Historical data if available
            historical_years_data: sessionData.historical_years_data || [],
            
            // Additional context
            business_description: sessionData.business_description || '',
            business_highlights: sessionData.business_highlights || '',
            reason_for_selling: sessionData.reason_for_selling || '',
            city: sessionData.city || '',
          } as any

          if (previousVersion) {
            const changes = detectVersionChanges(previousVersion.formData, newFormData)

            if (areChangesSignificant(changes)) {
              const newVersion = await createVersion({
                reportId,
                formData: newFormData,
                valuationResult: result,
                htmlReport: result.html_report || undefined,
                changesSummary: changes,
                versionLabel: generateAutoLabel(previousVersion.versionNumber + 1, changes),
              })

              chatLogger.info('New version created on conversational valuation', {
                reportId,
                versionNumber: newVersion.versionNumber,
                versionLabel: newVersion.versionLabel,
                totalChanges: changes.totalChanges,
                significantChanges: changes.significantChanges,
              })

              // Log regeneration to audit trail
              valuationAuditService.logRegeneration(
                reportId,
                newVersion.versionNumber,
                changes,
                undefined // Duration not tracked in conversational flow
              )
            }
          } else {
            // First version - create it
            await createVersion({
              reportId,
              formData: newFormData,
              valuationResult: result,
              htmlReport: result.html_report || undefined,
              changesSummary: { totalChanges: 0, significantChanges: [] },
              versionLabel: 'v1 - Initial valuation',
            })
          }
        } catch (versionError) {
          // Don't fail the valuation if versioning fails
          chatLogger.error('Failed to create version on conversational valuation', {
            reportId,
            error: versionError instanceof Error ? versionError.message : 'Unknown error',
          })
        }
      }

      // Call parent callback
      onValuationComplete?.(result)
    },
    [actions, onValuationComplete, setResult, session, getLatestVersion, createVersion]
  )

  // Handle valuation start
  const handleValuationStart = useCallback(() => {
    chatLogger.info('ConversationPanel: Valuation started')
    actions.setGenerating(true)
    onValuationStart?.()
  }, [actions, onValuationStart])

  // Handle Python session ID
  const handlePythonSessionIdReceived = useCallback(
    (newPythonSessionId: string) => {
      chatLogger.info('ConversationPanel: Python session ID received', {
        pythonSessionId: newPythonSessionId,
      })
      actions.setPythonSessionId(newPythonSessionId)
      onPythonSessionIdReceived?.(newPythonSessionId)
    },
    [actions, onPythonSessionIdReceived]
  )

  // Handle message complete - sync to context
  const handleMessageComplete = useCallback((message: Message) => {
    chatLogger.debug('ConversationPanel: Message complete', {
      messageId: message.id,
      type: message.type,
    })
    // Messages are managed by StreamingChat internally
    // We can add to context if needed for cross-component access
  }, [])

  // Get valuation data for summary block (Conversational flow)
  const valuationResult = useConversationalResultsStore((state) => state.result)

  // Determine if we should show summary block
  const showSummaryBlock = useMemo(() => {
    // Show if we have restored messages AND collected data
    const hasRestoredMessages = restoredMessages && restoredMessages.length > 0
    const hasCollectedData = session?.sessionData && Object.keys(session.sessionData).length > 0
    return hasRestoredMessages && hasCollectedData && isRestorationComplete
  }, [restoredMessages, session?.sessionData, isRestorationComplete])

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!session?.sessionData) return 0

    const data = session.sessionData as any
    let filledFields = 0
    const totalFields = 8 // Key fields we track

    if (data.company_name) filledFields++
    if (data.industry) filledFields++
    if (data.country_code) filledFields++
    if (data.current_year_data?.revenue || data.revenue) filledFields++
    if (data.current_year_data?.ebitda !== undefined || data.ebitda !== undefined) filledFields++
    if (data.business_type_id) filledFields++
    if (data.number_of_employees) filledFields++
    if (data.number_of_owners) filledFields++

    return Math.round((filledFields / totalFields) * 100)
  }, [session?.sessionData])

  // Handle continue action
  const handleContinue = useCallback(() => {
    // Scroll to bottom of chat to continue conversation
    const chatContainer = document.querySelector('[data-chat-container]')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [])

  // Handle view report action
  const handleViewReport = useCallback(() => {
    // Trigger report panel to show
    onReportComplete?.(valuationResult?.html_report || '', valuationResult?.valuation_id || '')
  }, [valuationResult, onReportComplete])

  // Handle manual calculate action (same as manual flow)
  const handleManualCalculate = useCallback(async () => {
    if (!session?.sessionData) {
      chatLogger.warn('[Conversational] Cannot calculate: no session data')
      return
    }

    // CRITICAL: Use atomic check-and-set (Conversational flow)
    const wasSet = trySetCalculating()
    if (!wasSet) {
      chatLogger.warn('[Conversational] Calculation already in progress')
      return
    }

    chatLogger.info('[Conversational] Loading state set atomically', { wasSet })

    try {
      chatLogger.info('[Conversational] Manual calculate triggered', {
        sessionId,
        hasSessionData: !!session.sessionData,
      })

      // Mark conversation as generating
      actions.setGenerating(true)
      onValuationStart?.()

      // Build ValuationRequest from session data (same as manual flow)
      const sessionData = session.sessionData as any
      const formData = {
        company_name: sessionData.company_name || '',
        industry: sessionData.industry || '',
        country_code: sessionData.country_code || 'BE',
        business_model: sessionData.business_model || '',
        founding_year: sessionData.founding_year || 0,
        revenue: sessionData.current_year_data?.revenue || sessionData.revenue || 0,
        ebitda: sessionData.current_year_data?.ebitda || sessionData.ebitda || 0,
        current_year_data: {
          year: sessionData.current_year_data?.year || new Date().getFullYear(),
          revenue: sessionData.current_year_data?.revenue || sessionData.revenue || 0,
          ebitda: sessionData.current_year_data?.ebitda || sessionData.ebitda || 0,
          net_income: sessionData.current_year_data?.net_income || 0,
          total_assets: sessionData.current_year_data?.total_assets || 0,
          total_debt: sessionData.current_year_data?.total_debt || 0,
          cash: sessionData.current_year_data?.cash || 0,
        },
        historical_years_data: sessionData.historical_years_data || [],
        number_of_employees: sessionData.number_of_employees || 0,
        number_of_owners: sessionData.number_of_owners || 0,
        recurring_revenue_percentage: sessionData.recurring_revenue_percentage || 0,
        comparables: sessionData.comparables || [],
        business_type_id: sessionData.business_type_id || '',
        business_type: sessionData.business_type || '',
        shares_for_sale: sessionData.shares_for_sale || 100,
        business_context: sessionData.business_context || '',
      } as any

      // Build request using unified function
      const request = buildValuationRequest(formData)
      ;(request as any).dataSource = 'ai-guided' // Conversational flow

      // Validate required fields
      if (!request.current_year_data?.revenue || !request.current_year_data?.ebitda || !request.industry || !request.country_code) {
        const missingFields = []
        if (!request.current_year_data?.revenue) missingFields.push('Revenue')
        if (!request.current_year_data?.ebitda) missingFields.push('EBITDA')
        if (!request.industry) missingFields.push('Industry')
        if (!request.country_code) missingFields.push('Country')

        chatLogger.warn('[Conversational] Cannot calculate: missing required fields', { missingFields })
        actions.setError(`Please provide: ${missingFields.join(', ')}`)
        actions.setGenerating(false)
        setCalculating(false) // Reset on validation error
        return
      }

      // Calculate valuation using service (Conversational flow)
      const result = await valuationService.calculateValuation(request)

      if (result) {
        // Call handleValuationComplete directly (it's already defined above)
        await handleValuationComplete(result)
        // CRITICAL: Reset loading state after successful completion
        setCalculating(false)
        actions.setGenerating(false)
      } else {
        chatLogger.error('[Conversational] Manual calculate returned no result')
        actions.setError('Calculation failed')
        actions.setGenerating(false)
        setCalculating(false) // Reset on failure
      }
    } catch (error) {
      chatLogger.error('[Conversational] Manual calculate failed', { error })
      actions.setError(
        error instanceof Error ? `Calculation failed: ${error.message}` : 'Calculation failed. Please try again.'
      )
      actions.setGenerating(false)
      setCalculating(false) // Reset on error
    } finally {
      // CRITICAL: Always reset loading state, even if handleValuationComplete throws
      // This ensures the UI doesn't get stuck in loading state
      const finalState = useConversationalResultsStore.getState()
      if (finalState.isCalculating) {
        setCalculating(false)
        chatLogger.debug('[Conversational] Loading state reset in finally block')
      }
    }
  }, [
    session,
    sessionId,
    trySetCalculating,
    handleValuationComplete,
    actions,
    onValuationStart,
    setCalculating,
  ])

  return (
    <ComponentErrorBoundary component="ConversationPanel">
      <div className="flex flex-col h-full">
        {/* Summary Block (shown at top when restoring existing session) */}
        {showSummaryBlock && (
          <div className="flex-shrink-0 p-4 overflow-y-auto">
            <ConversationSummaryBlock
              collectedData={session?.sessionData || {}}
              completionPercentage={completionPercentage}
              calculatedAt={session?.completedAt}
              valuationResult={valuationResult}
              onContinue={handleContinue}
              onViewReport={valuationResult ? handleViewReport : undefined}
            />
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
      <StreamingChat
        sessionId={sessionId}
        userId={userId}
        initialMessages={restoredMessages}
        isRestoring={isRestoring}
        isRestorationComplete={isRestorationComplete}
        isSessionInitialized={isSessionInitialized}
        pythonSessionId={pythonSessionId ?? state.pythonSessionId}
        onPythonSessionIdReceived={handlePythonSessionIdReceived}
        onValuationComplete={handleValuationComplete}
        onValuationStart={handleValuationStart}
        onMessageComplete={handleMessageComplete}
        onReportUpdate={onReportUpdate}
        onDataCollected={handleDataCollected}
        onValuationPreview={onValuationPreview}
        onCalculateOptionAvailable={onCalculateOptionAvailable}
        onProgressUpdate={onProgressUpdate}
        onReportSectionUpdate={onReportSectionUpdate}
        onSectionLoading={onSectionLoading}
        onSectionComplete={onSectionComplete}
        onReportComplete={onReportComplete}
        onContextUpdate={onContextUpdate}
        onHtmlPreviewUpdate={onHtmlPreviewUpdate}
        onCalculate={handleManualCalculate}
        isCalculating={isCalculating || state.isGenerating}
        initialMessage={initialMessage}
        autoSend={autoSend}
      />
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}
