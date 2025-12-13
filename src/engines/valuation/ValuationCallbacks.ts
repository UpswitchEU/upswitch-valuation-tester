/**
 * ValuationCallbacks Engine - Business Logic Coordination
 *
 * Single Responsibility: Handle valuation-specific callbacks and business logic coordination
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/ValuationCallbacks
 */

import { useCallback, useRef } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import type { CollectedData } from '../data-collection/DataCollectionEngine';
import { chatLogger } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValuationProgressData {
  stage: string;
  progress: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

export interface ValuationPreviewData {
  estimatedValue?: number;
  confidence?: number;
  methodology?: string;
  assumptions?: Record<string, any>;
}

export interface CalculateOptionData {
  method: string;
  parameters: Record<string, any>;
  estimatedValue?: number;
}

export interface ValuationCallbacksConfig {
  onValuationComplete?: (result: ValuationResponse) => void;
  onValuationStart?: () => void;
  onDataCollected?: (data: CollectedData) => void;
  onProgressUpdate?: (data: ValuationProgressData) => void;
  onValuationPreview?: (data: ValuationPreviewData) => void;
  onCalculateOptionAvailable?: (data: CalculateOptionData) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onReportSectionUpdate?: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    isFallback?: boolean,
    isError?: boolean,
    errorMessage?: string
  ) => void;
  onSectionLoading?: (section: string, html: string, phase: number, data?: any) => void;
  onSectionComplete?: (event: {
    sectionId: string;
    sectionName: string;
    html: string;
    progress: number;
    phase?: number;
  }) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  onMessageComplete?: (message: any) => void;
}

export interface ValuationCallbacks {
  // Core valuation callbacks
  handleValuationComplete(result: ValuationResponse): void;
  handleValuationStart(): void;

  // Data collection callbacks
  handleDataCollected(data: CollectedData): void;

  // Progress callbacks
  handleProgressUpdate(data: ValuationProgressData): void;
  handleValuationPreview(data: ValuationPreviewData): void;
  handleCalculateOptionAvailable(data: CalculateOptionData): void;

  // Report callbacks
  handleReportUpdate(htmlContent: string, progress: number): void;
  handleReportSectionUpdate(
    section: string,
    html: string,
    phase: number,
    progress: number,
    isFallback?: boolean,
    isError?: boolean,
    errorMessage?: string
  ): void;
  handleSectionLoading(section: string, html: string, phase: number, data?: any): void;
  handleSectionComplete(event: {
    sectionId: string;
    sectionName: string;
    html: string;
    progress: number;
    phase?: number;
  }): void;
  handleReportComplete(html: string, valuationId: string): void;
  handleHtmlPreviewUpdate(html: string, previewType: string): void;

  // Message callbacks
  handleMessageComplete(message: any): void;

  // State queries
  isValuationInProgress(): boolean;
  getLastValuationResult(): ValuationResponse | null;
  getProgressStats(): {
    totalCallbacks: number;
    valuationCompletions: number;
    dataCollections: number;
    averageProcessingTime: number;
  };
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ValuationCallbacksImpl implements ValuationCallbacks {
  private config: ValuationCallbacksConfig;
  private valuationInProgress: boolean = false;
  private lastValuationResult: ValuationResponse | null = null;
  private progressStats = {
    totalCallbacks: 0,
    valuationCompletions: 0,
    dataCollections: 0,
    processingTimes: [] as number[],
  };
  private lastCallbackTime: number = Date.now();

  constructor(config: ValuationCallbacksConfig = {}) {
    this.config = config;
  }

  // Core valuation callbacks
  handleValuationComplete(result: ValuationResponse): void {
    const processingTime = Date.now() - this.lastCallbackTime;
    this.lastCallbackTime = Date.now();

    this.valuationInProgress = false;
    this.lastValuationResult = result;
    this.progressStats.valuationCompletions++;
    this.progressStats.processingTimes.push(processingTime);

    // Keep only last 10 processing times for average calculation
    if (this.progressStats.processingTimes.length > 10) {
      this.progressStats.processingTimes.shift();
    }

    chatLogger.info('[ValuationCallbacks] Valuation completed', {
      valuationId: result.valuation_id,
      processingTime,
      totalCompletions: this.progressStats.valuationCompletions,
    });

    this.config.onValuationComplete?.(result);
  }

  handleValuationStart(): void {
    this.valuationInProgress = true;
    this.lastCallbackTime = Date.now();

    chatLogger.info('[ValuationCallbacks] Valuation started');

    this.config.onValuationStart?.();
  }

  // Data collection callbacks
  handleDataCollected(data: CollectedData): void {
    this.progressStats.totalCallbacks++;
    this.progressStats.dataCollections++;

    chatLogger.debug('[ValuationCallbacks] Data collected', {
      field: data.field,
      source: data.source,
      confidence: data.confidence,
      totalCollections: this.progressStats.dataCollections,
    });

    this.config.onDataCollected?.(data);
  }

  // Progress callbacks
  handleProgressUpdate(data: ValuationProgressData): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Progress update', {
      stage: data.stage,
      progress: data.progress,
      message: data.message,
    });

    this.config.onProgressUpdate?.(data);
  }

  handleValuationPreview(data: ValuationPreviewData): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Valuation preview', {
      estimatedValue: data.estimatedValue,
      confidence: data.confidence,
      methodology: data.methodology,
    });

    this.config.onValuationPreview?.(data);
  }

  handleCalculateOptionAvailable(data: CalculateOptionData): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Calculate option available', {
      method: data.method,
      estimatedValue: data.estimatedValue,
    });

    this.config.onCalculateOptionAvailable?.(data);
  }

  // Report callbacks
  handleReportUpdate(htmlContent: string, progress: number): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Report update', {
      htmlLength: htmlContent.length,
      progress,
    });

    this.config.onReportUpdate?.(htmlContent, progress);
  }

  handleReportSectionUpdate(
    section: string,
    html: string,
    phase: number,
    progress: number,
    isFallback?: boolean,
    isError?: boolean,
    errorMessage?: string
  ): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Report section update', {
      section,
      phase,
      progress,
      htmlLength: html.length,
      isFallback,
      isError,
      errorMessage: errorMessage ? 'Present' : 'None',
    });

    this.config.onReportSectionUpdate?.(
      section,
      html,
      phase,
      progress,
      isFallback,
      isError,
      errorMessage
    );
  }

  handleSectionLoading(section: string, html: string, phase: number, data?: any): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Section loading', {
      section,
      phase,
      htmlLength: html.length,
      hasData: !!data,
    });

    this.config.onSectionLoading?.(section, html, phase, data);
  }

  handleSectionComplete(event: {
    sectionId: string;
    sectionName: string;
    html: string;
    progress: number;
    phase?: number;
  }): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Section complete', {
      sectionId: event.sectionId,
      sectionName: event.sectionName,
      progress: event.progress,
      phase: event.phase,
      htmlLength: event.html.length,
    });

    this.config.onSectionComplete?.(event);
  }

  handleReportComplete(html: string, valuationId: string): void {
    this.progressStats.totalCallbacks++;

    chatLogger.info('[ValuationCallbacks] Report complete', {
      valuationId,
      htmlLength: html.length,
    });

    this.config.onReportComplete?.(html, valuationId);
  }

  handleHtmlPreviewUpdate(html: string, previewType: string): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] HTML preview update', {
      previewType,
      htmlLength: html.length,
    });

    this.config.onHtmlPreviewUpdate?.(html, previewType);
  }

  // Message callbacks
  handleMessageComplete(message: any): void {
    this.progressStats.totalCallbacks++;

    chatLogger.debug('[ValuationCallbacks] Message complete', {
      messageType: message?.role || 'unknown',
      contentLength: message?.content?.length || 0,
    });

    this.config.onMessageComplete?.(message);
  }

  // State queries
  isValuationInProgress(): boolean {
    return this.valuationInProgress;
  }

  getLastValuationResult(): ValuationResponse | null {
    return this.lastValuationResult;
  }

  getProgressStats(): {
    totalCallbacks: number;
    valuationCompletions: number;
    dataCollections: number;
    averageProcessingTime: number;
  } {
    const averageProcessingTime =
      this.progressStats.processingTimes.length > 0
        ? this.progressStats.processingTimes.reduce((a, b) => a + b, 0) /
          this.progressStats.processingTimes.length
        : 0;

    return {
      totalCallbacks: this.progressStats.totalCallbacks,
      valuationCompletions: this.progressStats.valuationCompletions,
      dataCollections: this.progressStats.dataCollections,
      averageProcessingTime,
    };
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseValuationCallbacksResult {
  callbacks: ValuationCallbacks;
  actions: {
    handleValuationComplete: (result: ValuationResponse) => void;
    handleValuationStart: () => void;
    handleDataCollected: (data: CollectedData) => void;
    handleProgressUpdate: (data: ValuationProgressData) => void;
    handleValuationPreview: (data: ValuationPreviewData) => void;
    handleCalculateOptionAvailable: (data: CalculateOptionData) => void;
    handleReportUpdate: (htmlContent: string, progress: number) => void;
    handleReportSectionUpdate: (
      section: string,
      html: string,
      phase: number,
      progress: number,
      isFallback?: boolean,
      isError?: boolean,
      errorMessage?: string
    ) => void;
    handleSectionLoading: (section: string, html: string, phase: number, data?: any) => void;
    handleSectionComplete: (event: {
      sectionId: string;
      sectionName: string;
      html: string;
      progress: number;
      phase?: number;
    }) => void;
    handleReportComplete: (html: string, valuationId: string) => void;
    handleHtmlPreviewUpdate: (html: string, previewType: string) => void;
    handleMessageComplete: (message: any) => void;
  };
  state: {
    isValuationInProgress: boolean;
    lastValuationResult: ValuationResponse | null;
    progressStats: {
      totalCallbacks: number;
      valuationCompletions: number;
      dataCollections: number;
      averageProcessingTime: number;
    };
  };
}

/**
 * useValuationCallbacks Hook
 *
 * React hook interface for ValuationCallbacks engine
 * Provides reactive valuation callback handling
 */
export const useValuationCallbacks = (
  config: ValuationCallbacksConfig = {}
): UseValuationCallbacksResult => {
  const callbacksRef = useRef(new ValuationCallbacksImpl(config));

  // Update config when it changes
  useRef(config).current = config;

  const actions = {
    handleValuationComplete: useCallback(
      (result: ValuationResponse) => callbacksRef.current.handleValuationComplete(result),
      []
    ),
    handleValuationStart: useCallback(
      () => callbacksRef.current.handleValuationStart(),
      []
    ),
    handleDataCollected: useCallback(
      (data: CollectedData) => callbacksRef.current.handleDataCollected(data),
      []
    ),
    handleProgressUpdate: useCallback(
      (data: ValuationProgressData) => callbacksRef.current.handleProgressUpdate(data),
      []
    ),
    handleValuationPreview: useCallback(
      (data: ValuationPreviewData) => callbacksRef.current.handleValuationPreview(data),
      []
    ),
    handleCalculateOptionAvailable: useCallback(
      (data: CalculateOptionData) => callbacksRef.current.handleCalculateOptionAvailable(data),
      []
    ),
    handleReportUpdate: useCallback(
      (htmlContent: string, progress: number) =>
        callbacksRef.current.handleReportUpdate(htmlContent, progress),
      []
    ),
    handleReportSectionUpdate: useCallback(
      (
        section: string,
        html: string,
        phase: number,
        progress: number,
        isFallback?: boolean,
        isError?: boolean,
        errorMessage?: string
      ) =>
        callbacksRef.current.handleReportSectionUpdate(
          section,
          html,
          phase,
          progress,
          isFallback,
          isError,
          errorMessage
        ),
      []
    ),
    handleSectionLoading: useCallback(
      (section: string, html: string, phase: number, data?: any) =>
        callbacksRef.current.handleSectionLoading(section, html, phase, data),
      []
    ),
    handleSectionComplete: useCallback(
      (event: {
        sectionId: string;
        sectionName: string;
        html: string;
        progress: number;
        phase?: number;
      }) => callbacksRef.current.handleSectionComplete(event),
      []
    ),
    handleReportComplete: useCallback(
      (html: string, valuationId: string) =>
        callbacksRef.current.handleReportComplete(html, valuationId),
      []
    ),
    handleHtmlPreviewUpdate: useCallback(
      (html: string, previewType: string) =>
        callbacksRef.current.handleHtmlPreviewUpdate(html, previewType),
      []
    ),
    handleMessageComplete: useCallback(
      (message: any) => callbacksRef.current.handleMessageComplete(message),
      []
    ),
  };

  const state = {
    isValuationInProgress: callbacksRef.current.isValuationInProgress(),
    lastValuationResult: callbacksRef.current.getLastValuationResult(),
    progressStats: callbacksRef.current.getProgressStats(),
  };

  return {
    callbacks: callbacksRef.current,
    actions,
    state,
  };
};
