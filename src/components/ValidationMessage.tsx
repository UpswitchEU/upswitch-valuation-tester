/**
 * ValidationMessage Component
 * 
 * Displays real-time validation feedback (errors, warnings, suggestions).
 * Supports different severity levels with appropriate styling.
 * 
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationMessageData {
  field?: string;
  rule?: string;
  message: string;
  severity: ValidationSeverity;
}

interface ValidationMessageProps {
  validation: ValidationMessageData;
  className?: string;
  onDismiss?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  validation,
  className = '',
  onDismiss,
}) => {
  const { message, severity } = validation;

  // Severity-based styling
  const severityStyles = {
    error: {
      container: 'bg-red-50 border-red-400 text-red-800',
      icon: '❌',
      iconBg: 'bg-red-100',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
    },
    info: {
      container: 'bg-blue-50 border-blue-400 text-blue-800',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      className={`
        flex items-start p-3 border-l-4 rounded-r-md
        ${styles.container}
        ${className}
      `}
      role="alert"
    >
      {/* Icon */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
          ${styles.iconBg}
        `}
      >
        <span className="text-lg">{styles.icon}</span>
      </div>

      {/* Message */}
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// ============================================================================
// VALIDATION MESSAGE LIST
// ============================================================================

interface ValidationMessageListProps {
  validations: ValidationMessageData[];
  className?: string;
  onDismissAll?: () => void;
}

export const ValidationMessageList: React.FC<ValidationMessageListProps> = ({
  validations,
  className = '',
  onDismissAll,
}) => {
  if (validations.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with dismiss all button */}
      {onDismissAll && validations.length > 1 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {validations.length} validation message{validations.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={onDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Dismiss all
          </button>
        </div>
      )}

      {/* Messages */}
      {validations.map((validation, index) => (
        <ValidationMessage
          key={`${validation.field}-${validation.rule}-${index}`}
          validation={validation}
        />
      ))}
    </div>
  );
};

export default ValidationMessage;

