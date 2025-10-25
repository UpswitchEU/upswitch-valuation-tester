/**
 * Progressive Report Service
 * Handles communication with the backend for progressive report generation
 */

import { chatLogger } from '../utils/logger';

interface ProgressiveReportSection {
  type: 'report_section' | 'report_complete' | 'error';
  section?: string;
  phase?: number;
  html?: string;
  progress?: number;
  valuation_id?: string;
  session_id?: string;
  timestamp?: string;
  message?: string;
  error?: string;
}

interface ProgressiveReportService {
  startReportGeneration(sessionId: string, conversationContext: any): Promise<void>;
  streamReportSections(
    sessionId: string,
    onSectionUpdate: (section: string, html: string, phase: number, progress: number) => void,
    onReportComplete: (html: string, valuationId: string) => void,
    onError: (error: string) => void
  ): EventSource;
}

class ProgressiveReportServiceImpl implements ProgressiveReportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async startReportGeneration(sessionId: string, conversationContext: any): Promise<void> {
    try {
      chatLogger.info('Starting progressive report generation', { sessionId });

      const response = await fetch(`${this.baseUrl}/api/valuations/progressive-report/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          conversationContext
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start report generation: ${response.statusText}`);
      }

      const result = await response.json();
      chatLogger.info('Progressive report generation started', { sessionId, result });

    } catch (error) {
      chatLogger.error('Failed to start progressive report generation', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  streamReportSections(
    sessionId: string,
    onSectionUpdate: (section: string, html: string, phase: number, progress: number) => void,
    onReportComplete: (html: string, valuationId: string) => void,
    onError: (error: string) => void
  ): EventSource {
    const streamUrl = `${this.baseUrl}/api/valuations/progressive-report/stream/${sessionId}`;
    
    chatLogger.info('Starting progressive report stream', { sessionId, streamUrl });

    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        if (event.data === '[DONE]') {
          chatLogger.info('Progressive report stream completed', { sessionId });
          eventSource.close();
          return;
        }

        const data: ProgressiveReportSection = JSON.parse(event.data);
        chatLogger.debug('Received progressive report data', { sessionId, type: data.type });

        switch (data.type) {
          case 'report_section':
            if (data.section && data.html && data.phase !== undefined && data.progress !== undefined) {
              onSectionUpdate(data.section, data.html, data.phase, data.progress);
            }
            break;

          case 'report_complete':
            if (data.html && data.valuation_id) {
              onReportComplete(data.html, data.valuation_id);
            }
            break;

          case 'error':
            onError(data.message || data.error || 'Unknown error');
            break;

          default:
            chatLogger.warn('Unknown progressive report event type', { 
              sessionId, 
              type: data.type 
            });
        }

      } catch (error) {
        chatLogger.error('Failed to parse progressive report data', { 
          sessionId, 
          error: error instanceof Error ? error.message : 'Unknown error',
          data: event.data
        });
        onError('Failed to parse report data');
      }
    };

    eventSource.onerror = (error) => {
      chatLogger.error('Progressive report stream error', { sessionId, error });
      onError('Stream connection failed');
      eventSource.close();
    };

    eventSource.onopen = () => {
      chatLogger.info('Progressive report stream opened', { sessionId });
    };

    return eventSource;
  }

  async getReportStatus(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/valuations/progressive-report/status/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get report status: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      chatLogger.error('Failed to get report status', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}

// Export singleton instance
export const progressiveReportService = new ProgressiveReportServiceImpl();
export type { ProgressiveReportSection, ProgressiveReportService };

