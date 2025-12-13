/**
 * @package @upswitch/data-collection
 *
 * Suggestion Field Renderer - Renders fields with clickable suggestions.
 */

import React from 'react';
import type { FieldRendererProps, ValidationRule } from '../types';

export const SuggestionFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  errors = [],
  disabled = false
}) => {
  const hasErrors = errors.length > 0;
  const errorMessage = errors.find(e => e.severity === 'error')?.message;
  const suggestions = field.suggestions || [];

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion, 'suggestion');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {field.description && (
          <p className="text-sm text-zinc-400">{field.description}</p>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Click to select:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  value === suggestion
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border-primary-600/30 hover:border-primary-600/50'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Value Display */}
      {value && (
        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
          <p className="text-sm text-zinc-300">
            Selected: <span className="text-white font-medium">{String(value)}</span>
          </p>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  );
};