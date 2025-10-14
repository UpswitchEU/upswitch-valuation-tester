import React, { useState, useCallback, useEffect } from 'react';
import { useValuationStore } from '../store/useValuationStore';
import { debounce } from '../utils/debounce';
import { getSearchSuggestions, type SearchSuggestion } from '../services/registryService';

/**
 * CompanyLookup Component (Phase 2)
 * 
 * Searches company registries and databases to auto-fill business information.
 * Integrates with Companies House (UK), Handelsregister (DE), and other sources.
 * 
 * Status: UI complete, backend API needed
 * Required endpoint: GET /api/v1/companies/lookup?name=...&country=...
 */

interface CompanyResult {
  name: string;
  registrationNumber?: string;
  country: string;
  industry?: string;
  foundedYear?: number;
  employees?: number;
  confidence: number;
  source: string;
}

export const CompanyLookup: React.FC = () => {
  const { updateFormData } = useValuationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('BE');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const performSearch = useCallback(async (query: string, country: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // TODO: Call backend API
      // const response = await api.lookupCompany(query, country);
      // setResults(response);
      
      // Simulated results
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setResults([
        {
          name: query + ' GmbH',
          registrationNumber: 'HRB 123456',
          country: country,
          industry: 'technology',
          foundedYear: 2018,
          employees: 50,
          confidence: 95,
          source: 'Companies House',
        },
        {
          name: query + ' AG',
          registrationNumber: 'HRB 789012',
          country: country,
          industry: 'manufacturing',
          foundedYear: 2015,
          employees: 120,
          confidence: 85,
          source: 'Handelsregister',
        },
      ]);
    } catch (err) {
      setError('Failed to search companies. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const loadSuggestions = useCallback(async (query: string, country: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const suggestionData = await getSearchSuggestions(query, country);
      setSuggestions(suggestionData.suggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced search suggestions
  const debouncedLoadSuggestions = useCallback(
    debounce(loadSuggestions, 300),
    [loadSuggestions]
  );

  const debouncedSearch = useCallback(
    debounce((query: string, country: string) => {
      performSearch(query, country);
    }, 500),
    []
  );

  // Load suggestions when search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      debouncedLoadSuggestions(searchQuery, selectedCountry);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedCountry, debouncedLoadSuggestions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, selectedCountry);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    if (searchQuery.length >= 2) {
      performSearch(searchQuery, country);
    }
  };

  const handleSelectCompany = (company: CompanyResult) => {
    updateFormData({
      company_name: company.name,
      country_code: company.country,
      industry: company.industry,
      founding_year: company.foundedYear,
    });
    
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Company Lookup
        </h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          Phase 2 - Smart Search
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Search for your company to automatically fill in basic information from official registries.
      </p>

      {/* Search Input */}
      <div className="flex space-x-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter company name..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-3">
              <svg className="animate-spin h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
        
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="BE">🇧🇪 Belgium</option>
          <option value="DE">🇩🇪 Germany</option>
          <option value="GB">🇬🇧 UK</option>
          <option value="FR">🇫🇷 France</option>
          <option value="NL">🇳🇱 Netherlands</option>
          <option value="US">🇺🇸 USA</option>
        </select>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-lg">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Search Suggestions
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion.text);
                  setShowSuggestions(false);
                  debouncedSearch(suggestion.text, selectedCountry);
                }}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{suggestion.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      suggestion.type === 'variation' ? 'bg-blue-100 text-blue-800' :
                      suggestion.type === 'method' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {suggestion.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round((suggestion.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {isLoadingSuggestions && (
            <div className="p-3 text-center">
              <div className="inline-flex items-center text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading suggestions...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {results.map((company, index) => (
            <button
              key={index}
              onClick={() => handleSelectCompany(company)}
              className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{company.name}</h4>
                  <div className="mt-1 space-y-1">
                    {company.registrationNumber && (
                      <p className="text-xs text-gray-500">Reg: {company.registrationNumber}</p>
                    )}
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      {company.industry && <span className="capitalize">{company.industry}</span>}
                      {company.foundedYear && <span>Founded {company.foundedYear}</span>}
                      {company.employees && <span>{company.employees} employees</span>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {company.confidence}% match
                    </span>
                    <span className="text-xs text-gray-500">via {company.source}</span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
        <div className="border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No companies found</h3>
          <p className="text-sm text-gray-500 mb-4">
            We couldn't find "{searchQuery}" in the {selectedCountry === 'BE' ? '🇧🇪 Belgium' : selectedCountry === 'DE' ? '🇩🇪 Germany' : selectedCountry === 'GB' ? '🇬🇧 UK' : selectedCountry === 'FR' ? '🇫🇷 France' : selectedCountry === 'NL' ? '🇳🇱 Netherlands' : '🇺🇸 USA'} registry.
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Try:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Different spelling or company name</li>
              <li>Registration number if you have it</li>
              <li>Different country</li>
              <li>Manual data entry instead</li>
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-start">
          <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">Data Sources:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• 🇩🇪 Handelsregister (German company registry)</li>
              <li>• 🇬🇧 Companies House (UK official registry)</li>
              <li>• 🌐 Crunchbase (startups & funding data)</li>
              <li>• 🔍 LinkedIn (employee count estimates)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-xs text-yellow-800">
          <strong>Status:</strong> Backend API integration pending. UI is complete and ready for connection.
          <br />
          <strong>Required:</strong> <code className="bg-yellow-100 px-1 rounded">GET /api/v1/companies/lookup</code>
        </p>
      </div>
    </div>
  );
};

