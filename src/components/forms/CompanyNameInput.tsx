/**
 * Company Name Input Component with KBO Search
 * 
 * Enhanced input field that performs fuzzy KBO company name search
 * Shows suggestions, match indicators, and company details tooltip
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registryService } from '../../services/registry/registryService';
import type { CompanySearchResult } from '../../services/registry/types';
import { debounce } from '../../utils/debounce';
import { generalLogger } from '../../utils/logger';
import type { CustomInputFieldProps } from './CustomInputField';
import CustomInputField from './CustomInputField';

export interface CompanyNameInputProps extends Omit<CustomInputFieldProps, 'onChange' | 'rightIcon'> {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCompanySelect?: (company: CompanySearchResult) => void;
}

export const CompanyNameInput: React.FC<CompanyNameInputProps> = ({
  value,
  onChange,
  countryCode = 'BE',
  onCompanySelect,
  ...inputProps
}) => {
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [exactMatch, setExactMatch] = useState<CompanySearchResult | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function - memoized with useRef to persist across renders
  const performSearchRef = useRef<((query: string, country: string) => void) | null>(null);

  useEffect(() => {
    // Create debounced function once
    if (!performSearchRef.current) {
      performSearchRef.current = debounce(async (query: string, country: string) => {
        if (!query || query.trim().length < 2) {
          setSearchResults([]);
          setExactMatch(null);
          setIsLoading(false);
          return;
        }

        // Only search for Belgium (KBO is Belgium-specific)
        if (country !== 'BE') {
          setSearchResults([]);
          setExactMatch(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          const response = await registryService.searchCompanies(query.trim(), country, 10);
          
          if (response.success && response.results) {
            const results = response.results;
            setSearchResults(results);

            // Check for exact match (case-insensitive)
            const match = results.find(
              (r) => r.company_name.toLowerCase() === query.trim().toLowerCase()
            );
            setExactMatch(match || null);
            
            // Show suggestions dropdown if we have results
            // Keep it visible if user is still typing/focused, or was just typing
            if (results.length > 0) {
              setShowSuggestions(true);
              generalLogger.debug('KBO suggestions ready', {
                count: results.length,
                query,
                hasExactMatch: !!match
              });
            }
          } else {
            setSearchResults([]);
            setExactMatch(null);
          }
        } catch (error) {
          generalLogger.warn('KBO search failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            query,
            country
          });
          // Silently fail - don't block user input
          setSearchResults([]);
          setExactMatch(null);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    }
  }, []);

  const performSearch = useCallback((query: string, country: string) => {
    performSearchRef.current?.(query, country);
  }, []);

  // Trigger search when value changes
  useEffect(() => {
    if (value) {
      performSearch(value, countryCode);
    } else {
      setSearchResults([]);
      setExactMatch(null);
      setSelectedCompany(null);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }, [value, countryCode, performSearch]);

  // Reset highlighted index when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      setHighlightedIndex(-1);
    }
  }, [searchResults]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    setExactMatch(null); // Clear exact match until search completes
    setSelectedCompany(null); // Clear selected company when typing
    setHighlightedIndex(-1); // Reset highlight when typing
  };

  // Handle company selection
  const handleSelectCompany = useCallback((company: CompanySearchResult) => {
    onChange(company.company_name);
    setExactMatch(company);
    setSelectedCompany(company);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onCompanySelect?.(company);
    
    generalLogger.info('Company selected from KBO search', {
      company_name: company.company_name,
      registration_number: company.registration_number
    });
  }, [onChange, onCompanySelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchResults.length === 0) {
      if (e.key === 'ArrowDown' && searchResults.length > 0) {
        setShowSuggestions(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    const totalItems = searchResults.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
          handleSelectCompany(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, searchResults, highlightedIndex, handleSelectCompany]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render checkmark icon
  const renderCheckmark = () => {
    if (!exactMatch) return null;

    return (
      <div className="relative group">
        <svg
          className="w-5 h-5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
        
        {/* Tooltip on hover - Kept dark for high contrast overlay */}
        <div className="absolute right-0 bottom-full mb-2 w-72 p-4 bg-gray-900 border border-gray-800 text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Verified Company</span>
            {exactMatch.status === 'Active' && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">ACTIVE</span>
            )}
          </div>
          <div className="font-serif text-base mb-3 text-white">{exactMatch.company_name}</div>
          <div className="space-y-2 text-gray-400 border-t border-gray-800 pt-2">
            <div className="flex justify-between">
              <span>Registration:</span>
              <span className="font-mono text-gray-300">{exactMatch.registration_number}</span>
            </div>
            {exactMatch.legal_form && (
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="text-gray-300">{exactMatch.legal_form}</span>
              </div>
            )}
            {exactMatch.address && (
              <div className="block mt-1">
                <span className="block mb-0.5">Address:</span>
                <span className="text-gray-300 leading-tight">{exactMatch.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render loading spinner
  const renderLoadingSpinner = () => {
    if (!isLoading) return null;

    return (
      <div className="w-4 h-4 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin" />
    );
  };

  // Render company summary card (shown after selection)
  const renderCompanySummary = () => {
    if (!selectedCompany) return null;

    return (
      <div className="mt-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
        {/* Header with verified badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Verified Company</p>
              <p className="text-sm font-medium text-gray-600">KBO/BCE Belgium</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCompany(null);
              setExactMatch(null);
              onChange('');
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100/50 rounded-lg transition-all duration-200 ease-in-out"
            aria-label="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Company details */}
        <div className="space-y-2">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{selectedCompany.company_name}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {selectedCompany.registration_number && (
                <span className="inline-flex items-center gap-1.5 text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="font-mono font-medium">{selectedCompany.registration_number}</span>
                </span>
              )}
              {selectedCompany.legal_form && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">{selectedCompany.legal_form}</span>
                </>
              )}
              {selectedCompany.status && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedCompany.status.toLowerCase() === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCompany.status}
                  </span>
                </>
              )}
            </div>
          </div>

          {selectedCompany.address && (
            <div className="pt-2 border-t border-emerald-200/50">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="leading-relaxed">{selectedCompany.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render suggestions dropdown
  const renderSuggestions = () => {
    if (!showSuggestions || searchResults.length === 0 || isLoading || selectedCompany) return null;

    return (
      <div 
        id="company-suggestions-list"
        role="listbox"
        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200/75 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[9999] max-h-72 overflow-y-auto transform transition-all duration-200 origin-top animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5"
      >
        <div className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/95 border-b border-gray-100 sticky top-0 backdrop-blur-md z-10 shadow-sm">
          Did you mean this company?
        </div>
        <div className="py-1">
          {searchResults.map((company, index) => {
            const isExactMatch = exactMatch?.company_id === company.company_id;
            const isHighlighted = highlightedIndex === index;
            
            return (
              <button
                key={company.company_id || index}
                type="button"
                role="option"
                aria-selected={isExactMatch}
                className={`w-full text-left px-4 py-3 transition-all duration-150 group relative border-l-2 ${
                  isHighlighted 
                    ? 'bg-gray-50 border-primary-500' 
                    : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                } ${
                  isExactMatch ? 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-500' : ''
                }`}
                onClick={() => handleSelectCompany(company)}
                onMouseEnter={() => {
                  setHighlightedIndex(index);
                }}
              >
                <div className={`font-medium text-base transition-colors ${isExactMatch ? 'text-emerald-900' : 'text-gray-900'}`}>
                  {company.company_name}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {company.registration_number && (
                    <span className={`font-mono ${isExactMatch ? 'text-emerald-700/70' : 'text-gray-400'}`}>
                      {company.registration_number}
                    </span>
                  )}
                  {company.legal_form && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={`${isExactMatch ? 'text-emerald-700/70' : 'text-gray-500'}`}>
                        {company.legal_form}
                      </span>
                    </>
                  )}
                </div>
                {company.address && (
                  <div className={`text-xs mt-1 truncate ${isExactMatch ? 'text-emerald-700/60' : 'text-gray-400'}`}>
                    {company.address}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine right icon (loading spinner or checkmark)
  const rightIcon = isLoading ? renderLoadingSpinner() : renderCheckmark();

  return (
    <div ref={containerRef} className="relative">
      <CustomInputField
        {...inputProps}
        value={value}
        onChange={handleChange}
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-controls="company-suggestions-list"
        aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
        onKeyDown={(e) => {
          handleKeyDown(e);
          inputProps.onKeyDown?.(e);
        }}
        onFocus={() => {
          if (searchResults.length > 0 && !selectedCompany) {
            setShowSuggestions(true);
          }
          inputProps.onFocus?.({} as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          // Delay closing suggestions to allow click events to register
          setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setShowSuggestions(false);
              setHighlightedIndex(-1);
            }
          }, 200);
          inputProps.onBlur?.(e);
        }}
        rightIcon={rightIcon}
        inputRef={inputRef}
      />
      {renderSuggestions()}
      {renderCompanySummary()}
    </div>
  );
};

export default CompanyNameInput;