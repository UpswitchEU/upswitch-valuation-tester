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
  onSelect: (suggestion: string) => void;
  onDismiss: () => void;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  originalValue,
  onSelect,
  onDismiss,
}) => {
  return (
    <div className="suggestion-chips-container my-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center">
          <span className="text-primary-400 text-sm">?</span>
        </div>
        <p className="text-sm text-zinc-300">
          Did you mean one of these?
        </p>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 ml-8">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.text)}
            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-2 border-primary-600/30 rounded-full hover:border-primary-500 hover:bg-zinc-700/60 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {/* Suggestion Text */}
            <span className="text-sm font-medium text-white">
              {suggestion.text}
            </span>

            {/* Confidence Indicator */}
            {suggestion.confidence > 0.9 && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-zinc-700">
              {suggestion.reason}
            </div>
          </button>
        ))}

        {/* Keep Original Button */}
        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-full hover:border-zinc-600 hover:bg-zinc-700/60 transition-all duration-200"
        >
          <span className="text-sm font-medium text-zinc-300">
            Keep "{originalValue}"
          </span>
          <XCircle className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </div>
  );
};

