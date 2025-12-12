/**
 * useReportGeneration Hook
 * 
 * Manages progressive report generation and streaming updates.
 * Handles section loading, completion, and final report assembly.
 * 
 * @module features/reports/hooks/useReportGeneration
 */

import { useCallback, useState } from 'react';
import { chatLogger } from '../../../utils/logger';

interface ReportSection {
  id: string;
  section: string;
  phase: number;
  html: string;
  progress?: number;
  status?: 'loading' | 'complete' | 'error';
  is_fallback?: boolean;
  is_error?: boolean;
  error_message?: string;
  timestamp: Date;
}

interface UseReportGenerationReturn {
  reportSections: ReportSection[];
  reportPhase: number;
  finalReportHtml: string;
  finalValuationId: string;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  handleSectionLoading: (section: string, html: string, phase: number, data?: any) => void;
  handleSectionComplete: (event: {
    sectionId?: string;
    sectionName?: string;
    html?: string;
    progress?: number;
    phase?: number;
  }) => void;
  handleReportSectionUpdate: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void;
  handleReportComplete: (html: string, valuationId: string) => void;
  resetReport: () => void;
}

/**
 * Hook for managing progressive report generation
 * 
 * Features:
 * - Tracks section-by-section report building
 * - Handles loading, completion, and error states
 * - Manages phase progression
 * - Assembles final report
 * 
 * @returns Report state and event handlers
 */
export function useReportGeneration(): UseReportGenerationReturn {
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [reportPhase, setReportPhase] = useState(0);
  const [finalReportHtml, setFinalReportHtml] = useState<string>('');
  const [finalValuationId, setFinalValuationId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Handle section loading event
   */
  const handleSectionLoading = useCallback((
    section: string | undefined | null,
    html: string | undefined | null,
    phase: number | undefined | null,
    data?: any
  ) => {
    const sectionId = section || data?.section_id || 'unknown';
    const sectionHtml = html || '';
    const sectionPhase = phase ?? 0;
    
    if (!sectionId || sectionId === 'unknown') {
      chatLogger.warn('Section loading received with invalid section ID', { 
        section, 
        section_id: data?.section_id,
      });
      return;
    }
    
    chatLogger.info('Section loading received', { section: sectionId, phase: sectionPhase });
    
    setReportSections(prevSections => {
      const existingIndex = prevSections.findIndex(
        s => s.section === sectionId && s.phase === sectionPhase
      );
      
      if (existingIndex >= 0) {
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html: sectionHtml,
          status: 'loading'
        };
        return updated;
      } else {
        return [...prevSections, {
          id: sectionId,
          section: sectionId,
          phase: sectionPhase,
          html: sectionHtml,
          status: 'loading',
          timestamp: new Date()
        }];
      }
    });
  }, []);

  /**
   * Handle section complete event
   */
  const handleSectionComplete = useCallback((event: {
    sectionId?: string;
    sectionName?: string;
    html?: string;
    progress?: number;
    phase?: number;
  }) => {
    const sectionId = event.sectionId || event.sectionName || 'unknown';
    const html = event.html || '';
    const progress = event.progress || 0;
    
    if (!sectionId || sectionId === 'unknown') {
      chatLogger.warn('Section complete received with invalid sectionId', { event });
      return;
    }
    
    chatLogger.info('✅ Section complete received', { sectionId, progress });
    
    setReportSections(prevSections => {
      const existingIndex = prevSections.findIndex(
        s => s.id === sectionId || s.section === sectionId
      );
      
      if (existingIndex >= 0) {
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html,
          status: 'complete',
          timestamp: new Date()
        };
        return updated;
      } else {
        return [...prevSections, {
          id: sectionId,
          section: sectionId,
          phase: event.phase || 0,
          html,
          status: 'complete',
          timestamp: new Date()
        }];
      }
    });
    
    setReportPhase(event.phase || 0);
  }, []);

  /**
   * Handle report section update (for progress updates)
   */
  const handleReportSectionUpdate = useCallback((
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => {
    chatLogger.info('Report section update received', { section, phase, progress, is_fallback, is_error });
    
    setReportSections(prevSections => {
      const existingIndex = prevSections.findIndex(
        s => s.section === section && s.phase === phase
      );
      
      if (existingIndex >= 0) {
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html,
          progress,
          is_fallback,
          is_error,
          error_message,
          timestamp: new Date()
        };
        return updated;
      } else {
        return [...prevSections, {
          id: section,
          section,
          phase,
          html,
          progress,
          is_fallback,
          is_error,
          error_message,
          timestamp: new Date()
        }];
      }
    });
    setReportPhase(phase);
  }, []);

  /**
   * Handle report completion
   */
  const handleReportComplete = useCallback((html: string, valuationId: string) => {
    chatLogger.info('Report complete received', { valuationId, htmlLength: html.length });
    setFinalReportHtml(html);
    setFinalValuationId(valuationId);
    setIsGenerating(false);
  }, []);

  /**
   * Reset report state
   */
  const resetReport = useCallback(() => {
    setReportSections([]);
    setReportPhase(0);
    setFinalReportHtml('');
    setFinalValuationId('');
    setIsGenerating(false);
  }, []);

  return {
    reportSections,
    reportPhase,
    finalReportHtml,
    finalValuationId,
    isGenerating,
    setIsGenerating,
    handleSectionLoading,
    handleSectionComplete,
    handleReportSectionUpdate,
    handleReportComplete,
    resetReport,
  };
}

