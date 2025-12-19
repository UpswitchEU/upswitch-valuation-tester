/**
 * EBITDA Normalization Modal
 * 
 * Main modal for entering EBITDA normalization adjustments
 * Displays 12 category inputs with live preview
 */

import React, { useEffect, useState } from 'react';
import { NORMALIZATION_CATEGORIES } from '../../config/normalizationCategories';
import { useEbitdaNormalizationStore } from '../../store/useEbitdaNormalizationStore';
import { NormalizationCategory } from '../../types/ebitdaNormalization';
import { NormalizationPreview } from './NormalizationPreview';

interface NormalizationModalProps {
  isOpen: boolean;
  year: number;
  sessionId: string;
  onClose: () => void;
  onSave?: () => void;
}

export const NormalizationModal: React.FC<NormalizationModalProps> = ({
  isOpen,
  year,
  sessionId,
  onClose,
  onSave,
}) => {
  const {
    normalizations,
    marketRateSuggestions,
    isSaving,
    updateAdjustment,
    addCustomAdjustment,
    updateCustomAdjustment,
    removeCustomAdjustment,
    saveNormalization,
    getTotalAdjustments,
    getNormalizedEbitda,
  } = useEbitdaNormalizationStore();
  
  const normalization = normalizations[year];
  const suggestions = marketRateSuggestions[year] || [];
  
  const [expandedCategories, setExpandedCategories] = useState<Set<NormalizationCategory>>(new Set());
  const [localAdjustments, setLocalAdjustments] = useState<Record<string, { amount: string; note: string }>>({});
  
  useEffect(() => {
    if (normalization) {
      // Initialize local state from store
      const adjustmentsMap: Record<string, { amount: string; note: string }> = {};
      normalization.adjustments.forEach(adj => {
        adjustmentsMap[adj.category] = {
          amount: adj.amount.toString(),
          note: adj.note || '',
        };
      });
      setLocalAdjustments(adjustmentsMap);
    }
  }, [normalization?.adjustments]);
  
  if (!isOpen || !normalization) return null;
  
  const handleAmountChange = (category: NormalizationCategory, value: string) => {
    setLocalAdjustments(prev => ({
      ...prev,
      [category]: {
        amount: value,
        note: prev[category]?.note || '',
      },
    }));
    
    // Update store with parsed value
    const numValue = parseFloat(value) || 0;
    updateAdjustment(year, category, numValue, localAdjustments[category]?.note);
  };
  
  const handleNoteChange = (category: NormalizationCategory, note: string) => {
    setLocalAdjustments(prev => ({
      ...prev,
      [category]: {
        amount: prev[category]?.amount || '0',
        note,
      },
    }));
    
    const numValue = parseFloat(localAdjustments[category]?.amount || '0') || 0;
    updateAdjustment(year, category, numValue, note);
  };
  
  const toggleCategory = (category: NormalizationCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const handleSave = async () => {
    try {
      await saveNormalization(sessionId, year);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save normalization', error);
      // Error handling is in the store
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Normalize EBITDA for {year}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Adjust reported EBITDA to reflect true earning power
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full overflow-y-auto">
              {/* Left: Categories */}
              <div className="lg:col-span-2 space-y-4">
                {NORMALIZATION_CATEGORIES.map((categoryDef) => {
                  const isExpanded = expandedCategories.has(categoryDef.id);
                  const localValue = localAdjustments[categoryDef.id];
                  const amount = localValue?.amount || '0';
                  const note = localValue?.note || '';
                  
                  return (
                    <div key={categoryDef.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      {/* Category Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{categoryDef.label}</h4>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600"
                              title={categoryDef.description}
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{categoryDef.description}</p>
                          
                          {/* Expandable details */}
                          {isExpanded && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                              <div>
                                <p className="text-gray-700">{categoryDef.detailedDescription}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Examples:</p>
                                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                                  {categoryDef.examples.map((example, idx) => (
                                    <li key={idx}>{example}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryDef.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            {isExpanded ? 'Show less' : 'Learn more'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Amount Input */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adjustment Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => handleAmountChange(categoryDef.id, e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter positive for additions, negative for reductions
                        </p>
                      </div>
                      
                      {/* Note Input */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Note (optional)
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => handleNoteChange(categoryDef.id, e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Add context or rationale for this adjustment..."
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* Custom Adjustments Section */}
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Custom Adjustments
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add your own adjustments with custom descriptions for business-specific normalizations
                  </p>
                  
                  {(normalization.custom_adjustments || []).map((custom) => (
                    <div key={custom.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="flex items-start justify-between mb-3">
                        <input
                          type="text"
                          value={custom.description}
                          onChange={(e) => updateCustomAdjustment(year, custom.id!, e.target.value, custom.amount, custom.note)}
                          placeholder="Enter adjustment description (e.g., 'Seasonal adjustment for Q4')"
                          className="flex-1 mr-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomAdjustment(year, custom.id!)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Remove custom adjustment"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                          <input
                            type="number"
                            value={custom.amount || 0}
                            onChange={(e) => updateCustomAdjustment(year, custom.id!, custom.description, parseFloat(e.target.value) || 0, custom.note)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Positive adds, negative reduces</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                          <input
                            type="text"
                            value={custom.note || ''}
                            onChange={(e) => updateCustomAdjustment(year, custom.id!, custom.description, custom.amount, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Additional context..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addCustomAdjustment(year)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Custom Adjustment
                  </button>
                </div>
              </div>
              
              {/* Right: Preview */}
              <div className="lg:col-span-1">
                <NormalizationPreview
                  reportedEbitda={normalization.reported_ebitda}
                  totalAdjustments={getTotalAdjustments(year)}
                  normalizedEbitda={getNormalizedEbitda(year)}
                  confidenceScore={normalization.confidence_score}
                  year={year}
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {normalization.adjustments.length + (normalization.custom_adjustments?.length || 0)} active adjustment{(normalization.adjustments.length + (normalization.custom_adjustments?.length || 0)) !== 1 ? 's' : ''}
                {(normalization.custom_adjustments?.length || 0) > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({normalization.custom_adjustments?.length} custom)
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Normalization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
