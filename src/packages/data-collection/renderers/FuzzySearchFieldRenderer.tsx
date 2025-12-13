/**
 * @package @upswitch/data-collection
 *
 * Fuzzy Search Field Renderer - Renders fields with search and select functionality.
 */

import React, { useState } from 'react';
import type { FieldRendererProps, ValidationRule } from '../types';

export const FuzzySearchFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  errors = [],
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const hasErrors = errors.length > 0;
  const errorMessage = errors.find(e => e.severity === 'error')?.message;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue, 'fuzzy_search');
    setSearchQuery('');
  };

  // Mock search results - in a real implementation, this would search a dataset
  const searchResults = field.options?.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) || [];

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

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-400 pr-10
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${hasErrors ? 'border-red-500' : 'border-zinc-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        <div className="absolute right-3 top-2 text-zinc-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 max-h-48 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors border-b border-zinc-700/50 last:border-b-0"
            >
              <div className="font-medium">{result.label}</div>
              {result.description && (
                <div className="text-xs text-zinc-500">{result.description}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-3">
          <p className="text-sm text-zinc-500">No results found for "{searchQuery}"</p>
        </div>
      )}

      {/* Current Value Display */}
      {value && (
        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
          <p className="text-sm text-zinc-300">
            Selected: <span className="text-white font-medium">{value}</span>
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