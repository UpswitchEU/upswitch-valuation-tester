/**
 * DynamicQuestionFlow Component
 * 
 * Main orchestrator for dynamic question flows based on business type.
 * Handles:
 * - Phase-based question progression
 * - Real-time validation
 * - Conditional logic
 * - Progress tracking
 * 
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useBusinessTypeQuestions } from '../hooks/useBusinessTypeQuestions';
import { useRealTimeValidation } from '../hooks/useRealTimeValidation';
import { DynamicQuestionRenderer } from './DynamicQuestionRenderer';
import { PhaseProgress } from './PhaseProgress';
import { ValidationMessageList } from './ValidationMessage';
import { logger as generalLogger } from '../utils/loggers';

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicQuestionFlowProps {
  businessTypeId: string;
  flowType?: 'manual' | 'ai_guided';
  initialData?: Record<string, any>;
  onDataChange?: (data: Record<string, any>) => void;
  onComplete?: (data: Record<string, any>) => void;
  className?: string;
}

const PHASES = [
  { id: 'basic', label: 'Basic Info', icon: '📋' },
  { id: 'financials', label: 'Financials', icon: '💰' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
  { id: 'strategic', label: 'Strategic', icon: '🎯' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const DynamicQuestionFlow: React.FC<DynamicQuestionFlowProps> = ({
  businessTypeId,
  flowType = 'manual',
  initialData = {},
  onDataChange,
  onComplete,
  className = '',
}) => {
  const [currentPhase, setCurrentPhase] = useState('basic');
  const [answers, setAnswers] = useState<Record<string, any>>(initialData);
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);

  // Fetch questions with current answers for conditional logic
  const { questions, metadata, loading, error } = useBusinessTypeQuestions(
    businessTypeId,
    {
      flow_type: flowType,
      phase: 'all', // Get all phases, we'll filter client-side
      existing_data: answers,
    }
  );

  // Real-time validation
  const { validation, validate, validating } = useRealTimeValidation(businessTypeId);

  // Get questions for current phase
  const currentPhaseQuestions = useMemo(() => {
    return questions.filter((q) => q.phase === currentPhase);
  }, [questions, currentPhase]);

  // Check if current phase is complete (all required questions answered)
  const isPhaseComplete = useMemo(() => {
    const requiredQuestions = currentPhaseQuestions.filter((q) => q.required);
    return requiredQuestions.every((q) => {
      const answer = answers[q.question_id];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }, [currentPhaseQuestions, answers]);

  // Update answer and trigger validation
  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      const newAnswers = { ...answers, [questionId]: value };
      setAnswers(newAnswers);

      // Notify parent
      if (onDataChange) {
        onDataChange(newAnswers);
      }

      // Trigger validation (debounced internally)
      validate(newAnswers);

      generalLogger.debug('[DynamicQuestionFlow] Answer updated', {
        questionId,
        value,
      });
    },
    [answers, onDataChange, validate]
  );

  // Move to next phase
  const handleNextPhase = useCallback(() => {
    if (!isPhaseComplete) {
      return;
    }

    // Mark current phase as completed
    if (!completedPhases.includes(currentPhase)) {
      setCompletedPhases([...completedPhases, currentPhase]);
    }

    const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
    if (currentIndex < PHASES.length - 1) {
      setCurrentPhase(PHASES[currentIndex + 1].id);
      generalLogger.info('[DynamicQuestionFlow] Moved to next phase', {
        from: currentPhase,
        to: PHASES[currentIndex + 1].id,
      });
    } else {
      // All phases complete
      if (onComplete) {
        onComplete(answers);
      }
      generalLogger.info('[DynamicQuestionFlow] All phases complete', {
        answers,
      });
    }
  }, [currentPhase, isPhaseComplete, completedPhases, answers, onComplete]);

  // Move to previous phase
  const handlePreviousPhase = useCallback(() => {
    const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
    if (currentIndex > 0) {
      setCurrentPhase(PHASES[currentIndex - 1].id);
      generalLogger.info('[DynamicQuestionFlow] Moved to previous phase', {
        from: currentPhase,
        to: PHASES[currentIndex - 1].id,
      });
    }
  }, [currentPhase]);

  // Check if we can go to previous phase
  const canGoPrevious = useMemo(() => {
    const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
    return currentIndex > 0;
  }, [currentPhase]);

  // Check if this is the last phase
  const isLastPhase = useMemo(() => {
    const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
    return currentIndex === PHASES.length - 1;
  }, [currentPhase]);

  // Combine all validation messages
  const validationMessages = useMemo(() => {
    if (!validation) return [];
    return [...validation.errors, ...validation.warnings, ...validation.suggestions];
  }, [validation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading questions: {error}</p>
      </div>
    );
  }

  return (
    <div className={`dynamic-question-flow ${className}`}>
      {/* Phase Progress */}
      <PhaseProgress
        phases={PHASES}
        currentPhase={currentPhase}
        completedPhases={completedPhases}
        className="mb-8"
      />

      {/* Metadata */}
      {metadata && (
        <div className="mb-6 text-sm text-gray-600">
          <p>
            {metadata.total_required} required questions • Estimated time:{' '}
            {metadata.estimated_time}
          </p>
        </div>
      )}

      {/* Validation Messages */}
      {validationMessages.length > 0 && (
        <ValidationMessageList
          validations={validationMessages}
          className="mb-6"
        />
      )}

      {/* Questions for Current Phase */}
      <div className="space-y-6">
        {currentPhaseQuestions.length > 0 ? (
          currentPhaseQuestions.map((question) => (
            <DynamicQuestionRenderer
              key={question.id}
              question={question}
              value={answers[question.question_id]}
              onChange={(value) => handleAnswerChange(question.question_id, value)}
              validation={validationMessages.filter(
                (v) => v.field === question.question_id
              )}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No questions for this phase.</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={handlePreviousPhase}
          disabled={!canGoPrevious}
          className={`
            px-6 py-2 rounded-md font-medium transition-colors
            ${
              canGoPrevious
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          ← Previous
        </button>

        {/* Progress Info */}
        <div className="text-sm text-gray-600">
          Phase {PHASES.findIndex((p) => p.id === currentPhase) + 1} of{' '}
          {PHASES.length}
        </div>

        {/* Next/Complete Button */}
        <button
          onClick={handleNextPhase}
          disabled={!isPhaseComplete || validating}
          className={`
            px-6 py-2 rounded-md font-medium transition-colors
            ${
              isPhaseComplete && !validating
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {validating ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Validating...
            </span>
          ) : isLastPhase ? (
            'Complete →'
          ) : (
            'Next →'
          )}
        </button>
      </div>
    </div>
  );
};

export default DynamicQuestionFlow;

