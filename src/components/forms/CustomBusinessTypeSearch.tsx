import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Lightbulb, X } from 'lucide-react';
import type { BusinessType } from '../../services/businessTypesApi';

interface CustomBusinessTypeSearchProps {
  value?: string; // business_type_id
  businessTypes: BusinessType[];
  onChange: (businessType: BusinessType) => void;
  onSuggest?: (suggestion: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
}

export const CustomBusinessTypeSearch: React.FC<CustomBusinessTypeSearchProps> = ({
  value,
  businessTypes,
  onChange,
  onSuggest,
  placeholder = "Search for your business type...",
  disabled = false,
  required = false,
  loading = false,
  label = "Business Type",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected business type when value changes
  useEffect(() => {
    if (value) {
      const found = businessTypes.find(bt => bt.id === value);
      if (found) {
        setSelectedType(found);
        setQuery(found.title);
      }
    } else {
      setSelectedType(null);
      setQuery('');
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

    const searchTerm = query.toLowerCase();
    return businessTypes
      .filter(bt => 
        bt.title.toLowerCase().includes(searchTerm) ||
        bt.description?.toLowerCase().includes(searchTerm) ||
        bt.industryMapping?.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase() === searchTerm;
        const bExact = b.title.toLowerCase() === searchTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize popular types
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        
        // Then by title match position
        const aIndex = a.title.toLowerCase().indexOf(searchTerm);
        const bIndex = b.title.toLowerCase().indexOf(searchTerm);
        return aIndex - bIndex;
      })
      .slice(0, 20);
  }, [query, businessTypes]);

  // Group filtered types by category
  const groupedTypes = React.useMemo(() => {
    const groups: { [key: string]: BusinessType[] } = {};
    
    filteredTypes.forEach(type => {
      const category = type.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(type);
    });
    
    return groups;
  }, [filteredTypes]);

  // Handle selection
  const handleSelect = useCallback((type: BusinessType) => {
    setSelectedType(type);
    setQuery(type.title);
    setIsOpen(false);
    setHighlightedIndex(0);
    onChange(type);
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedType(null);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  }, []);

  // Handle suggest
  const handleSuggest = useCallback(() => {
    if (onSuggest && query.trim()) {
      onSuggest(query.trim());
      setQuery('');
      setIsOpen(false);
    }
  }, [onSuggest, query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    const totalItems = filteredTypes.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTypes[highlightedIndex]) {
          handleSelect(filteredTypes[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(0);
        break;
    }
  }, [isOpen, filteredTypes, highlightedIndex, handleSelect]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setHighlightedIndex(0);
  }, []);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Delay closing to allow for click events
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Input Container - Match CustomInputField pattern */}
      <div className={`relative border rounded-xl shadow-sm transition-all duration-200 ${
        disabled 
          ? 'border-gray-200 bg-gray-50' 
          : 'border-gray-300 bg-white hover:border-gray-400 focus-within:border-gray-900'
      }`}>
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <Search className="h-4 w-4" />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || " "}
          disabled={disabled || loading}
          required={required}
          className="
            w-full h-14 px-4 pt-6 pb-2 text-base pl-10 pr-20
            border-none rounded-xl 
            focus:outline-none focus:ring-0
            transition-all duration-200 ease-in-out
            disabled:cursor-not-allowed disabled:text-gray-400
            bg-transparent text-gray-900
          "
        />

        {/* Clear Button */}
        {selectedType && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown Indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Label - Fixed at top like CustomInputField */}
        <label className={`
          absolute left-4 top-2 text-xs text-gray-600 font-medium pointer-events-none
          ${disabled ? 'text-gray-400' : ''}
        `}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-2 text-sm text-gray-500">
          Loading business types...
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !loading && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
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
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary-500/20 text-primary-300 rounded">
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
        <div className="mt-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">{selectedType.icon}</span>
            <div className="flex-1">
              <div className="text-gray-700 font-medium">{selectedType.description}</div>
              <div className="mt-1 text-xs">
                <span className="font-semibold">Industry:</span> {selectedType.industryMapping}
                {selectedType.category && (
                  <> • <span className="font-semibold">Category:</span> {selectedType.category}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
