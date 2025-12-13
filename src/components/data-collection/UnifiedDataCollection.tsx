/**
 * Data Collection Component
 *
 * Single Responsibility: Orchestrate data collection across all methods and flows
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * This component provides a consistent interface for collecting business valuation data
 * that works seamlessly across manual forms, conversational AI, suggestions, and future file uploads.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  DataCollector,
  ManualFormCollector,
  ConversationalCollector,
  SuggestionCollector,
  FuzzySearchCollector,
  FileUploadCollector,
  DataField,
  DataResponse,
  CollectionSession,
  CollectionProgress,
  BUSINESS_DATA_FIELDS,
  DataCollectionMethod
} from '../../engines/data-collection';
import { AdaptiveFieldRenderer } from './AdaptiveFieldRenderer';

interface DataCollectionProps {
  method: DataCollectionMethod;
  onDataCollected: (responses: DataResponse[]) => void;
  onProgressUpdate?: (progress: CollectionProgress) => void;
  onComplete?: (responses: DataResponse[]) => void;
  initialData?: Partial<Record<string, any>>;
  disabled?: boolean;
  className?: string;
}

export const DataCollection: React.FC<DataCollectionProps> = ({
  method,
  onDataCollected,
  onProgressUpdate,
  onComplete,
  initialData = {},
  disabled = false,
  className = ''
}) => {
  // Initialize the data collector
  const [collector] = useState(() => {
    const collector = new DataCollector();

    // Register all available collectors
    collector.registerCollector('manual_form', new ManualFormCollector());
    collector.registerCollector('conversational', new ConversationalCollector());
    collector.registerCollector('suggestion', new SuggestionCollector());
    collector.registerCollector('fuzzy_search', new FuzzySearchCollector());
    collector.registerCollector('file_upload', new FileUploadCollector());

    return collector;
  });

  // Session state
  const [session, setSession] = useState<CollectionSession | null>(null);
  const [responses, setResponses] = useState<Map<string, DataResponse>>(new Map());

  // Initialize session on mount
  useEffect(() => {
    const newSession = collector.createSession(method);
    setSession(newSession);

    // Pre-populate with initial data
    Object.entries(initialData).forEach(([fieldId, value]) => {
      if (value !== undefined && value !== null) {
        const field = BUSINESS_DATA_FIELDS[fieldId];
        if (field) {
          const response: DataResponse = {
            fieldId,
            value,
            method,
            confidence: 0.8, // Initial data has good confidence
            source: 'initial_data',
            timestamp: new Date()
          };
          handleDataResponse(response);
        }
      }
    });
  }, [method, collector]);

  // Handle data response from any collection method
  const handleDataResponse = useCallback((response: DataResponse) => {
    if (!session) return;

    // Update session with new response
    const updatedSession = collector.updateSession(session, response);
    setSession(updatedSession);

    // Update local responses
    setResponses(prev => new Map(prev.set(response.fieldId, response)));

    // Calculate and report progress
    const progress = calculateProgress(updatedSession);
    onProgressUpdate?.(progress);

    // Notify parent of data collection
    onDataCollected?.(Array.from(responses.values()));

    // Check if collection is complete
    if (updatedSession.isComplete) {
      onComplete?.(Array.from(responses.values()));
    }
  }, [session, collector, responses, onDataCollected, onProgressUpdate, onComplete]);

  // Calculate collection progress
  const calculateProgress = (session: CollectionSession): CollectionProgress => {
    const totalFields = session.fields.length;
    const completedFields = session.completedFieldIds.size;
    const requiredFields = session.fields.filter(f => f.required).length;
    const completedRequiredFields = session.fields
      .filter(f => f.required && session.completedFieldIds.has(f.id))
      .length;

    return {
      totalFields,
      completedFields,
      requiredFields,
      completedRequiredFields,
      overallProgress: completedFields / totalFields,
      currentField: collector.getNextField(session),
      blockingErrors: Array.from(session.validationErrors.values()).flat()
    };
  };

  // Get fields to display based on collection method and progress
  const getFieldsToDisplay = (): DataField[] => {
    if (!session) return [];

    switch (method) {
      case 'manual_form':
        // Show all fields in a form layout
        return session.fields;

      case 'conversational':
        // Show one field at a time as a question
        const nextField = collector.getNextField(session);
        return nextField ? [nextField] : [];

      case 'suggestion':
        // Show fields that support suggestions
        return session.fields.filter(field =>
          field.collectionMethods.includes('suggestion') &&
          !session.completedFieldIds.has(field.id)
        );

      case 'fuzzy_search':
        // Show fields that support fuzzy search
        return session.fields.filter(field =>
          field.collectionMethods.includes('fuzzy_search') &&
          !session.completedFieldIds.has(field.id)
        );

      case 'file_upload':
        // Show fields that support file upload
        return session.fields.filter(field =>
          field.collectionMethods.includes('file_upload') &&
          !session.completedFieldIds.has(field.id)
        );

      default:
        return [];
    }
  };

  const fieldsToDisplay = getFieldsToDisplay();

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Indicator */}
      <CollectionProgressIndicator
        progress={calculateProgress(session)}
        method={method}
      />

      {/* Field Renderers */}
      <div className="space-y-4">
        {fieldsToDisplay.map(field => (
          <AdaptiveFieldRenderer
            key={field.id}
            field={field}
            value={responses.get(field.id)?.value}
            onChange={(value, responseMethod) => {
              const response: DataResponse = {
                fieldId: field.id,
                value,
                method: responseMethod || method,
                confidence: 1.0, // User input is considered 100% confident
                source: 'user_input',
                timestamp: new Date()
              };
              handleDataResponse(response);
            }}
            errors={session.validationErrors.get(field.id) || []}
            context={{
              session,
              previousResponses: Array.from(responses.values()),
              method
            }}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Completion Summary */}
      {session.isComplete && (
        <CompletionSummary
          responses={Array.from(responses.values())}
          method={method}
        />
      )}
    </div>
  );
};

// Progress indicator component
interface CollectionProgressIndicatorProps {
  progress: CollectionProgress;
  method: DataCollectionMethod;
}

const CollectionProgressIndicator: React.FC<CollectionProgressIndicatorProps> = ({
  progress,
  method
}) => {
  const getMethodTitle = () => {
    switch (method) {
      case 'manual_form': return 'Complete the Form';
      case 'conversational': return 'Answer the Questions';
      case 'suggestion': return 'Select Options';
      case 'fuzzy_search': return 'Search and Select';
      case 'file_upload': return 'Upload Files';
      default: return 'Collect Data';
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white">{getMethodTitle()}</h3>
        <span className="text-xs text-zinc-400">
          {progress.completedFields}/{progress.totalFields} fields
        </span>
      </div>

      <div className="w-full bg-zinc-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.overallProgress * 100}%` }}
        />
      </div>

      {progress.requiredFields > 0 && (
        <p className="text-xs text-zinc-400 mt-2">
          {progress.completedRequiredFields}/{progress.requiredFields} required fields completed
        </p>
      )}

      {progress.blockingErrors.length > 0 && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded">
          <p className="text-xs text-red-400">
            {progress.blockingErrors.length} validation error(s) need to be fixed
          </p>
        </div>
      )}
    </div>
  );
};

// Completion summary component
interface CompletionSummaryProps {
  responses: DataResponse[];
  method: DataCollectionMethod;
}

const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  responses,
  method
}) => {
  const getMethodSuccessMessage = () => {
    switch (method) {
      case 'manual_form': return 'Form completed successfully!';
      case 'conversational': return 'All questions answered!';
      case 'suggestion': return 'All selections made!';
      case 'fuzzy_search': return 'All searches completed!';
      case 'file_upload': return 'All files processed!';
      default: return 'Data collection complete!';
    }
  };

  return (
    <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-green-400">{getMethodSuccessMessage()}</h3>
          <p className="text-xs text-zinc-400">
            Collected {responses.length} data points
          </p>
        </div>
      </div>
    </div>
  );
};