import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface Suggestion {
  text: string;
  confidence: number;
  reason: string;
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  originalValue: string;
  field: string;
  onSelect: (suggestion: string) => void;
  onDismiss: () => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  originalValue,
  field,
  onSelect,
  onDismiss,
}) => {
  return (
    <div className="suggestion-chips-container my-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-sm">?</span>
        </div>
        <p className="text-sm text-gray-700">
          Did you mean one of these?
        </p>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 ml-8">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.text)}
            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 rounded-full hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {/* Suggestion Text */}
            <span className="text-sm font-medium text-gray-900">
              {suggestion.text}
            </span>

            {/* Confidence Indicator */}
            {suggestion.confidence > 0.9 && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {suggestion.reason}
            </div>
          </button>
        ))}

        {/* Keep Original Button */}
        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
        >
          <span className="text-sm font-medium text-gray-600">
            Keep "{originalValue}"
          </span>
          <XCircle className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};
