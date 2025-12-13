/**
 * ConversationPanel Component
 *
 * Single Responsibility: Wrapper around StreamingChat with error boundary and context integration
 * SOLID Principles: SRP - Only handles chat UI wrapper and error handling
 *
 * @module features/conversational/components/ConversationPanel
 */

import React, { useCallback } from 'react'
import { StreamingChat } from '../../../components/StreamingChat'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { Message } from '../../../types/message'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'
import { ComponentErrorBoundary } from '../../shared/components/ErrorBoundary'
import { useConversationActions, useConversationState } from '../context/ConversationContext'

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
  const { setCollectedData } = useValuationFormStore()

  // Handle data collection - sync to form store
  const handleDataCollected = useCallback(
    (data: { field: string; value: unknown }) => {
      chatLogger.debug('ConversationPanel: Data collected', {
        field: data.field,
        value: data.value,
      })

      // Sync to form store if field and value are present
      // Note: StreamingChat manages its own collectedData state internally
      // This callback is for external notification, but we can also sync here if needed
      if (data.field && data.value !== undefined) {
        // Call parent callback (used by ConversationalLayout for logging)
        onDataCollected?.(data)
        
        // Data will be synced to session store through StreamingChat's internal mechanisms
        // When valuation is triggered, the collected data will be used
      }
    },
    [onDataCollected]
  )

  // Handle valuation complete - sync to context and results store
  const { setResult } = useValuationResultsStore()
  const handleValuationComplete = useCallback(
    (result: ValuationResponse) => {
      chatLogger.info('ConversationPanel: Valuation complete', {
        valuationId: result.valuation_id,
      })

      // Update conversation context
      actions.setValuationResult(result)
      actions.setGenerating(false)

      // Sync to results store (same as manual flow)
      setResult(result)

      // Call parent callback
      onValuationComplete?.(result)
    },
    [actions, onValuationComplete, setResult]
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
  const handleMessageComplete = useCallback(
    (message: Message) => {
      chatLogger.debug('ConversationPanel: Message complete', {
        messageId: message.id,
        type: message.type,
      })
      // Messages are managed by StreamingChat internally
      // We can add to context if needed for cross-component access
    },
    []
  )

  return (
    <ComponentErrorBoundary component="ConversationPanel">
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
        initialMessage={initialMessage}
        autoSend={autoSend}
      />
    </ComponentErrorBoundary>
  )
}
