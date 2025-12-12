/**
 * ConversationPanel Component
 * 
 * Left panel containing the streaming chat interface.
 * Handles conversation display, input, and streaming updates.
 * 
 * @module features/conversation/components/ConversationPanel
 */

import { memo } from 'react';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { StreamingChat } from '../../../components/StreamingChat';
import type { ValuationResponse } from '../../../types/valuation';

interface ConversationPanelProps {
  sessionId: string;
  userId?: string;
  restoredMessages: any[];
  isRestoring: boolean;
  isRestorationComplete: boolean;
  isSessionInitialized: boolean;
  onPythonSessionIdReceived: (pythonSessionId: string) => void;
  onValuationComplete: (result: ValuationResponse) => void;
  onValuationStart: () => void;
  onReportUpdate: (htmlContent: string, progress: number) => void;
  onDataCollected: (data: any) => void;
  onValuationPreview: (data: any) => void;
  onCalculateOptionAvailable: (data: any) => void;
  onProgressUpdate: (data: any) => void;
  onReportSectionUpdate: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onSectionLoading: (section: string, html: string, phase: number, data?: any) => void;
  onSectionComplete: (event: any) => void;
  onReportComplete: (html: string, valuationId: string) => void;
  onContextUpdate: (context: any) => void;
  onHtmlPreviewUpdate: (html: string, previewType: string) => void;
  initialMessage?: string | null;
  autoSend?: boolean;
  initialData?: any;
}

/**
 * Conversation panel component
 * 
 * Wraps StreamingChat with error boundary and responsive layout.
 */
export const ConversationPanel = memo<ConversationPanelProps>(({
  sessionId,
  userId,
  restoredMessages,
  isRestoring,
  isRestorationComplete,
  isSessionInitialized,
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
  );
});

ConversationPanel.displayName = 'ConversationPanel';

