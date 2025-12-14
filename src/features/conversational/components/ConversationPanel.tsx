/**
 * ConversationPanel Component
 *
<<<<<<< HEAD
 * Left panel containing the streaming chat interface.
 * Handles conversation display, input, and streaming updates.
 *
 * @module features/conversation/components/ConversationPanel
 */

import { memo } from 'react'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { StreamingChat } from '../../../components/StreamingChat'
import type { ValuationResponse } from '../../../types/valuation'

interface ConversationPanelProps {
  sessionId: string
  userId?: string
  restoredMessages: any[]
  isRestoring: boolean
  isRestorationComplete: boolean
  isSessionInitialized: boolean
  pythonSessionId?: string | null // NEW: Current Python sessionId (for restoration coordination)
  onPythonSessionIdReceived: (pythonSessionId: string) => void
  onValuationComplete: (result: ValuationResponse) => void
  onValuationStart: () => void
  onReportUpdate: (htmlContent: string, progress: number) => void
  onDataCollected: (data: any) => void
  onValuationPreview: (data: any) => void
  onCalculateOptionAvailable: (data: any) => void
  onProgressUpdate: (data: any) => void
  onReportSectionUpdate: (
=======
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
import {
    convertDataPointToDataResponse,
    mergeDataResponse,
} from '../../../utils/dataCollectionAdapter'
import { convertDataResponsesToFormData } from '../../../utils/dataCollectionUtils'
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
>>>>>>> refactor-gtm
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void
<<<<<<< HEAD
  onSectionLoading: (section: string, html: string, phase: number, data?: any) => void
  onSectionComplete: (event: any) => void
  onReportComplete: (html: string, valuationId: string) => void
  onContextUpdate: (context: any) => void
  onHtmlPreviewUpdate: (html: string, previewType: string) => void
  initialMessage?: string | null
  autoSend?: boolean
  initialData?: any
}

/**
 * Conversation panel component
 *
 * Wraps StreamingChat with error boundary and responsive layout.
 */
export const ConversationPanel = memo<ConversationPanelProps>(
  ({
    sessionId,
    userId,
    restoredMessages,
    isRestoring,
    isRestorationComplete,
    isSessionInitialized,
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
    initialMessage,
    autoSend,
    initialData,
  }) => {
    return (
      <div className="h-full">
        <ErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-zinc-400 mb-4">Chat temporarily unavailable. Please refresh.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          }
        >
          <StreamingChat
            sessionId={sessionId}
            userId={userId}
            initialMessages={restoredMessages}
            isRestoring={isRestoring && !isRestorationComplete}
            isSessionInitialized={isSessionInitialized}
            pythonSessionId={pythonSessionId}
            isRestorationComplete={isRestorationComplete}
            onPythonSessionIdReceived={onPythonSessionIdReceived}
            onValuationComplete={onValuationComplete}
            onValuationStart={onValuationStart}
            onReportUpdate={onReportUpdate}
            onDataCollected={onDataCollected}
            onValuationPreview={onValuationPreview}
            onCalculateOptionAvailable={onCalculateOptionAvailable}
            onProgressUpdate={onProgressUpdate}
            onReportSectionUpdate={onReportSectionUpdate}
            onSectionLoading={onSectionLoading}
            onSectionComplete={onSectionComplete}
            onReportComplete={onReportComplete}
            onContextUpdate={onContextUpdate}
            onHtmlPreviewUpdate={onHtmlPreviewUpdate}
            className="h-full"
            placeholder="Ask about your business valuation..."
            initialMessage={initialMessage}
            autoSend={autoSend}
            initialData={initialData}
          />
        </ErrorBoundary>
      </div>
    )
  }
)

ConversationPanel.displayName = 'ConversationPanel'
=======
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
  const { setCollectedData, updateFormData } = useValuationFormStore()

  // Handle data collection - sync to form store
  const handleDataCollected = useCallback(
    (data: { field: string; value: unknown; confidence?: number; source?: string }) => {
      chatLogger.debug('ConversationPanel: Data collected', {
        field: data.field,
        value: data.value,
        confidence: data.confidence,
        source: data.source,
      })

      // Convert to DataResponse format and sync to form store (same as manual flow)
      if (data.field && data.value !== undefined) {
        // Convert single data point to DataResponse format
        const dataResponse = convertDataPointToDataResponse(
          {
            field: data.field,
            value: data.value,
            confidence: data.confidence,
            source: data.source,
          },
          'conversational'
        )

        // Get current collected data from form store
        const currentData = useValuationFormStore.getState().collectedData

        // Merge new response into existing data (updates if fieldId exists, adds if new)
        const updatedData = mergeDataResponse(currentData, dataResponse)

        // Sync collectedData to form store (same as manual flow)
        setCollectedData(updatedData)

        // Also update formData for consistency (calculateValuation uses formData)
        const formDataUpdate = convertDataResponsesToFormData([dataResponse])
        if (Object.keys(formDataUpdate).length > 0) {
          updateFormData(formDataUpdate)
        }

        chatLogger.debug('ConversationPanel: Data synced to form store', {
          field: data.field,
          totalResponses: updatedData.length,
          formDataFields: Object.keys(formDataUpdate),
        })

        // Call parent callback (used by ConversationalLayout for logging)
        onDataCollected?.(data)
      }
    },
    [setCollectedData, updateFormData, onDataCollected]
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
>>>>>>> refactor-gtm
