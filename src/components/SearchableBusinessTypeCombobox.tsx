import { ChevronDown, Lightbulb, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { BusinessType } from '../services/businessTypesApi';

interface SearchableBusinessTypeComboboxProps {
  value?: string; // business_type_id
  businessTypes: BusinessType[];
  onChange: (businessType: BusinessType) => void;
  onSuggest?: (suggestion: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
}

export const SearchableBusinessTypeCombobox: React.FC<SearchableBusinessTypeComboboxProps> = ({
  value,
  businessTypes,
  onChange,
  onSuggest,
  placeholder = "Search for your business type...",
  disabled = false,
  required = false,
  loading = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected business type when value changes
  useEffect(() => {
    if (value) {
      const found = businessTypes.find(bt => bt.id === value);
      if (found) {
        setSelectedType(found);
      }
    } else {
      setSelectedType(null);
    }
  }, [value, businessTypes]);

  // Filter and rank business types by search query
  const filteredTypes = React.useMemo(() => {
    if (!query.trim()) {
      // Show popular types first when no query
      const popular = businessTypes.filter(bt => bt.popular).slice(0, 10);
      const others = businessTypes.filter(bt => !bt.popular).slice(0, 10);
      return [...popular, ...others];
    }

    const lowerQuery = query.toLowerCase();
    
    return businessTypes
      .map(bt => {
        let score = 0;
        
        // Title match (highest priority)
        if (bt.title.toLowerCase().includes(lowerQuery)) {
          score += 100;
          if (bt.title.toLowerCase().startsWith(lowerQuery)) {
            score += 50; // Bonus for starts with
          }
        }
        
        // Keywords match
        if (bt.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery))) {
          score += 50;
        }
        
        // Description match
        if (bt.description?.toLowerCase().includes(lowerQuery)) {
          score += 25;
        }
        
        // Category match
        if (bt.category?.toLowerCase().includes(lowerQuery)) {
          score += 10;
        }

        return { type: bt, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.type);
  }, [query, businessTypes]);

  // Group types by category
  const groupedTypes = React.useMemo(() => {
    const groups: Record<string, BusinessType[]> = {};
    
    filteredTypes.forEach(type => {
      const category = type.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(type);
    });
    
    return groups;
  }, [filteredTypes]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredTypes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTypes[highlightedIndex]) {
          handleSelect(filteredTypes[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (type: BusinessType) => {
    setSelectedType(type);
    setQuery('');
    setIsOpen(false);
    onChange(type);
  };

  const handleClear = () => {
    setSelectedType(null);
    setQuery('');
    onChange({} as BusinessType); // Clear selection
    inputRef.current?.focus();
  };

  const handleSuggest = () => {
    if (onSuggest && query.trim()) {
      onSuggest(query.trim());
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input Container - Match CustomInputField pattern */}
      <div className={`relative border rounded-xl shadow-sm transition-all duration-200 ${
        disabled 
          ? 'border-gray-200 bg-gray-50' 
          : 'border-gray-300 bg-white hover:border-gray-400 focus-within:border-gray-900'
      }`}>
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={selectedType ? selectedType.title : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || " "}
          disabled={disabled || loading}
          required={required}
          className="
            w-full h-14 px-4 pt-6 pb-2 text-base pr-20
            border-none rounded-xl 
            focus:outline-none focus:ring-0
            transition-all duration-200 ease-in-out
            disabled:cursor-not-allowed disabled:text-gray-400
            bg-transparent text-gray-900
          "
        />

        {/* Clear button */}
        {selectedType && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Label - Fixed at top like CustomInputField */}
        <label className={`
          absolute left-4 top-2 text-xs text-gray-600 font-medium pointer-events-none
          ${disabled ? 'text-gray-400' : ''}
        `}>
          Business Type
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-2 text-sm text-gray-500">
          Loading business types...
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {filteredTypes.length > 0 ? (
            <>
              {/* Popular types section (when no query) */}
              {!query && businessTypes.filter(bt => bt.popular).length > 0 && (
                <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                  Popular Types
                </div>
              )}

              {/* Grouped results */}
              {Object.entries(groupedTypes).map(([category, types]) => (
                <div key={category}>
                  {query && (
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                      {category}
                    </div>
                  )}
                  
                  {types.map((type) => {
                    const globalIndex = filteredTypes.findIndex(t => t.id === type.id);
                    const isHighlighted = globalIndex === highlightedIndex;
                    
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelect(type)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isHighlighted
                            ? 'bg-blue-50 text-gray-900'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{type.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{type.title}</div>
                            <div className={`text-sm mt-0.5 line-clamp-2 ${
                              isHighlighted ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {type.short_description || type.description}
                            </div>
                            {type.popular && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded font-medium">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          ) : (
            /* No results - show suggestion option */
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 mb-4">
                No business types found for "{query}"
              </p>
              {onSuggest && query.trim() && (
                <button
                  type="button"
                  onClick={handleSuggest}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <Lightbulb className="w-4 h-4" />
                  Suggest "{query.trim()}" as a new type
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected type info */}
      {selectedType && !isOpen && (
        <div className="mt-2 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 shadow-sm">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-xl">{selectedType.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-gray-900 mb-1.5 leading-tight">
                  {selectedType.description}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 backdrop-blur-sm border border-blue-200/50 text-gray-700">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-medium text-gray-900">{selectedType.industry || selectedType.industryMapping}</span>
                  </span>
                  {selectedType.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 backdrop-blur-sm border border-indigo-200/50 text-gray-700">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium text-gray-900">{selectedType.category}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

