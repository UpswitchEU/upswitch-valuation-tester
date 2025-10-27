import { useState, useCallback, useEffect } from 'react';
import { Section } from '../components/valuation/ProgressiveReportSection';

interface SectionLoadingEvent {
  sectionId: string;
  sectionName: string;
  html: string;
  phase?: number;
}

interface SectionCompleteEvent {
  sectionId: string;
  sectionName: string;
  html: string;
  progress: number;
  phase?: number;
}

interface UseProgressiveReportReturn {
  sections: Section[];
  overallProgress: number;
  handleSectionLoading: (event: SectionLoadingEvent) => void;
  handleSectionComplete: (event: SectionCompleteEvent) => void;
  handleSectionError: (sectionId: string, error: string) => void;
  clearSections: () => void;
  retrySection: (sectionId: string) => void;
}

/**
 * useProgressiveReport Hook
 * 
 * Manages state for progressive valuation report sections.
 * Handles section loading, completion, errors, and progress tracking.
 * 
 * Features:
 * - Section state management (loading, complete, error)
 * - Overall progress calculation
 * - Section retry functionality
 * - Automatic section ordering by phase
 * 
 * @returns Hook interface with sections state and handlers
 */
export const useProgressiveReport = (): UseProgressiveReportReturn => {
  const [sections, setSections] = useState<Section[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  /**
   * Handle section loading event
   * Adds or updates a section with loading state
   */
  const handleSectionLoading = useCallback((event: SectionLoadingEvent) => {
    setSections(prev => {
      const existingIndex = prev.findIndex(s => s.id === event.sectionId);
      
      const newSection: Section = {
        id: event.sectionId,
        name: event.sectionName,
        phase: event.phase || 0,
        status: 'loading',
        html: event.html,
        progress: 0,
        timestamp: new Date()
      };

      if (existingIndex >= 0) {
        // Update existing section
        const updated = [...prev];
        updated[existingIndex] = newSection;
        return updated;
      } else {
        // Add new section and sort by phase
        return [...prev, newSection].sort((a, b) => a.phase - b.phase);
      }
    });
  }, []);

  /**
   * Handle section complete event
   * Updates section with completed HTML and progress
   */
  const handleSectionComplete = useCallback((event: SectionCompleteEvent) => {
    setSections(prev => {
      const existingIndex = prev.findIndex(s => s.id === event.sectionId);
      
      const completedSection: Section = {
        id: event.sectionId,
        name: event.sectionName,
        phase: event.phase || 0,
        status: 'complete',
        html: event.html,
        progress: event.progress,
        timestamp: new Date()
      };

      if (existingIndex >= 0) {
        // Update existing section
        const updated = [...prev];
        updated[existingIndex] = completedSection;
        return updated;
      } else {
        // Add new section and sort by phase
        return [...prev, completedSection].sort((a, b) => a.phase - b.phase);
      }
    });

    // Update overall progress
    setOverallProgress(event.progress);
  }, []);

  /**
   * Handle section error
   * Marks a section as failed with error message
   */
  const handleSectionError = useCallback((sectionId: string, error: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId
          ? { ...s, status: 'error' as const, error }
          : s
      )
    );
  }, []);

  /**
   * Clear all sections
   * Resets the report to initial state
   */
  const clearSections = useCallback(() => {
    setSections([]);
    setOverallProgress(0);
  }, []);

  /**
   * Retry a failed section
   * Marks section as loading to trigger regeneration
   */
  const retrySection = useCallback((sectionId: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId
          ? { ...s, status: 'loading' as const, error: undefined }
          : s
      )
    );
  }, []);

  // Auto-scroll to latest section when new section completes
  useEffect(() => {
    const latestSection = sections
      .filter(s => s.status === 'complete')
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))[0];

    if (latestSection) {
      const element = document.querySelector(`[data-section-id="${latestSection.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [sections]);

  return {
    sections,
    overallProgress,
    handleSectionLoading,
    handleSectionComplete,
    handleSectionError,
    clearSections,
    retrySection
  };
};

