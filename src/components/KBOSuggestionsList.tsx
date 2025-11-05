import { Building2, X } from 'lucide-react';
import React from 'react';

interface KBOSuggestion {
  number: number;
  companyName: string;
  registrationNumber?: string;
}

interface KBOSuggestionsListProps {
  suggestions: KBOSuggestion[];
  onSelect: (selection: string) => void;
}

/**
 * Parses a clarification message to extract numbered KBO suggestions
 * Pattern: "1. **Company Name** (Registration)"
 */
export function parseKBOSuggestions(message: string): KBOSuggestion[] {
  const suggestions: KBOSuggestion[] = [];
  
  // Pattern to match: "1. **Company Name** (Registration)" or "1. **Company Name**"
  // Backend format: "1. **MixMa Sportkampen** (0724.724.018)"
  const pattern = /(\d+)\.\s+\*\*(.+?)\*\*(?:\s+\(([^)]+)\))?/g;
  
  let match;
  while ((match = pattern.exec(message)) !== null) {
    const companyName = match[2].trim();
    // Skip if it's not a real company name (too short or contains question text)
    if (companyName.length > 1 && !companyName.toLowerCase().includes('did you mean')) {
      suggestions.push({
        number: parseInt(match[1], 10),
        companyName: companyName,
        registrationNumber: match[3]?.trim(),
      });
    }
  }
  
  return suggestions;
}

/**
 * Detects if a message contains KBO suggestions
 */
export function hasKBOSuggestions(message: string): boolean {
  // Check for KBO registry mention and numbered list pattern
  const hasKBOKeyword = /KBO registry|Did you mean/i.test(message);
  const hasNumberedList = /\d+\.\s+\*\*.*\*\*/i.test(message);
  
  return hasKBOKeyword && hasNumberedList;
}

export const KBOSuggestionsList: React.FC<KBOSuggestionsListProps> = ({
  suggestions,
  onSelect,
}) => {
  const handleSelect = (selection: string) => {
    onSelect(selection);
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-zinc-400 mb-3">
        Select a company from the list below:
      </div>
      
      {/* Suggestion Cards */}
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.number}
            onClick={() => handleSelect(suggestion.number.toString())}
            className="w-full text-left group relative"
            aria-label={`Select ${suggestion.companyName}`}
          >
            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-primary-500/50 hover:bg-zinc-800/70 transition-all duration-200 cursor-pointer">
              {/* Number Badge */}
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
                {suggestion.number}
              </div>
              
              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                    {suggestion.companyName}
                  </span>
                </div>
                {suggestion.registrationNumber && (
                  <div className="text-xs text-zinc-400 mt-1 ml-6">
                    {suggestion.registrationNumber}
                  </div>
                )}
              </div>
              
              {/* Hover Indicator */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* None of these button */}
      <button
        onClick={() => handleSelect('none')}
        className="w-full mt-3 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg hover:border-zinc-600 hover:bg-zinc-800/50 transition-all duration-200 text-center"
        aria-label="None of these companies match"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white">
          <X className="w-4 h-4" />
          <span>None of these match</span>
        </div>
      </button>
    </div>
  );
};

