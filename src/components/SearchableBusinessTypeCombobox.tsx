import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Lightbulb, X } from 'lucide-react';
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
      {/* Label */}
      <label className="block text-sm font-semibold text-zinc-200 mb-2">
        Business Type {required && <span className="text-red-400">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        
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
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Clear button */}
        {selectedType && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-10 flex items-center pr-2"
          >
            <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
          </button>
        )}

        {/* Dropdown indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-2 text-sm text-zinc-400">
          Loading business types...
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {filteredTypes.length > 0 ? (
            <>
              {/* Popular types section (when no query) */}
              {!query && businessTypes.filter(bt => bt.popular).length > 0 && (
                <div className="sticky top-0 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-700">
                  Popular Types
                </div>
              )}

              {/* Grouped results */}
              {Object.entries(groupedTypes).map(([category, types]) => (
                <div key={category}>
                  {query && (
                    <div className="sticky top-0 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-700">
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
                            ? 'bg-primary-600 text-white'
                            : 'text-zinc-200 hover:bg-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{type.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{type.title}</div>
                            <div className={`text-sm mt-0.5 line-clamp-2 ${
                              isHighlighted ? 'text-white/90' : 'text-zinc-400'
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
              <p className="text-zinc-400 mb-4">
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
        <div className="mt-2 text-sm text-zinc-400 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">{selectedType.icon}</span>
            <div className="flex-1">
              <div className="text-zinc-200 font-medium">{selectedType.description}</div>
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

