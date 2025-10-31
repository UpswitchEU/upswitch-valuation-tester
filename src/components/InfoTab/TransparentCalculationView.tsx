import { AlertTriangle, BarChart3, Database, FileText, Target, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { ValuationInputData, ValuationResponse } from '../../types/valuation';
import { calculateOwnerDependencyMultipleImpact } from '../../utils/valuationFormatters';
import { ErrorBoundary } from '../ErrorBoundary';
import { formatCurrency } from '../Results/utils/formatters';
import { InputDataSection } from './InputDataSection';
import { OwnerDependencySection } from './OwnerDependencySection';
import { RangeCalculationSection } from './RangeCalculationSection';
import { ValidationWarnings } from './ValidationWarnings';
import { ValuationMethodsSection } from './ValuationMethodsSection';
import { WeightingLogicSection } from './WeightingLogicSection';

interface TransparentCalculationViewProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

// Define all possible sections for navigation (McKinsey/Bain structure)
// Consolidated from 8 sections to 7 for better flow and reduced redundancy
const ALL_SECTIONS = [
  { id: 'summary', title: 'Executive Summary', icon: FileText, required: true },
  { id: 'input-data', title: 'Input Data', icon: Database, required: true },
  { id: 'valuation-methods', title: 'Valuation Methods', icon: BarChart3, required: true },
  { id: 'methodology-weighting', title: 'Methodology Weighting', icon: Target, required: true },
  { id: 'owner-dependency', title: 'Owner Dependency', icon: Users, required: false },
  { id: 'range-confidence', title: 'Range & Confidence', icon: Target, required: true }
];

export const TransparentCalculationView: React.FC<TransparentCalculationViewProps> = ({
  result,
  inputData,
}) => {
  const [activeSection, setActiveSection] = useState('summary');

  // Determine which sections to show based on available data
  const SECTIONS = ALL_SECTIONS.filter(section => {
    if (section.required) return true;
    if (section.id === 'owner-dependency') return !!result.owner_dependency_result;
    return true;
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="relative">
      {/* Sticky Horizontal Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Report Contents
            </h3>
            <div className="text-xs text-gray-500">
              {SECTIONS.length} Sections
            </div>
          </div>
          
          {/* Horizontal Navigation */}
          <div className="overflow-x-auto">
            <nav className="flex space-x-1 min-w-max">
              {SECTIONS.map((section, index) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <span className="text-xs text-gray-400 font-mono">{String(index + 1).padStart(2, '0')}</span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="hidden sm:inline">{section.title}</span>
                    <span className="sm:hidden">{section.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8 bg-white p-6">
      {/* Introduction */}
      <div id="summary" className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-500 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Complete Calculation Transparency
        </h1>
        <p className="text-gray-700 mb-4">
          This comprehensive breakdown shows every calculation, formula, data source, and logic touchpoint 
          that contributes to the final valuation. Each step is documented with academic sources and 
          industry standards for full transparency.
        </p>
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-sm text-gray-600 block mb-1">Low Estimate</span>
              <p className="text-xl font-bold text-red-600">{formatCurrency(result.equity_value_low)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">Mid-Point Estimate</span>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.equity_value_mid)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">High Estimate</span>
              <p className="text-xl font-bold text-green-600">{formatCurrency(result.equity_value_high)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Dependency Impact in Final Summary */}
      {result.owner_dependency_result && (() => {
        const preAdjustmentValue = result.equity_value_mid / (1 + result.owner_dependency_result.valuation_adjustment);
        // Estimate EBITDA from valuation and margin
        // Use equity value as a proxy since we don't have direct revenue access
        const ebitdaMargin = result.financial_metrics?.ebitda_margin || 0.15;
        const ebitda = result.equity_value_mid * ebitdaMargin;
        const multipleImpact = calculateOwnerDependencyMultipleImpact(
          preAdjustmentValue,
          result.equity_value_mid,
          ebitda
        );
        
        return (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 my-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-900">
                  Owner Dependency Adjustment Applied
                </h4>
                <div className="mt-2 text-sm text-orange-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{multipleImpact.percentageFormat}</span>
                    {multipleImpact.isApplicable && (
                      <>
                        <span>|</span>
                        <span className="font-semibold">{multipleImpact.multipleFormat}</span>
                        <span className="text-xs text-orange-600">
                          ({multipleImpact.baseMultiple}x → {multipleImpact.adjustedMultiple}x)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs">
                    {result.owner_dependency_result.risk_level} risk level
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Validation Warnings - Prominently displayed if any exist */}
      {result.validation_warnings && result.validation_warnings.length > 0 && (
        <>
          <div id="validation-warnings">
            <ValidationWarnings warnings={result.validation_warnings} />
          </div>
          
          {/* Section divider */}
          <div className="border-t-4 border-gray-300"></div>
        </>
      )}

      {/* Section 1: Input Data Summary */}
      <div id="input-data">
        <InputDataSection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 2: Valuation Methods (Combined DCF + Market Multiples) */}
      <div id="valuation-methods">
        <ErrorBoundary componentName="Valuation Methods">
          <ValuationMethodsSection result={result} inputData={inputData} />
        </ErrorBoundary>
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 3: Methodology Weighting Logic */}
      <div id="methodology-weighting">
        <WeightingLogicSection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 4: Owner Dependency Analysis (12 factors) - Only if available */}
      {result.owner_dependency_result && (
        <>
          <div id="owner-dependency">
            <OwnerDependencySection result={result} />
          </div>
          
          {/* Section divider */}
          <div className="border-t-4 border-gray-300"></div>
        </>
      )}

      {/* Section 5: Range & Confidence (Combined Range Calculation + Confidence Scoring) */}
      <div id="range-confidence">
        <RangeCalculationSection result={result} inputData={inputData} />
      </div>

      {/* Footer with academic references */}
      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Academic & Industry Standards</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Valuation Methodology:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>McKinsey & Company (2020), "Valuation: Measuring and Managing the Value of Companies", 7th Edition</li>
            <li>Damodaran, A. (2012), "Investment Valuation: Tools and Techniques for Determining the Value of Any Asset"</li>
            <li>Koller, T., Goedhart, M., & Wessels, D. (2020), "Valuation", 7th Edition</li>
          </ul>

          <p className="mt-4"><strong>Range Calculation & Risk Modeling:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Damodaran, A. (2018), "The Dark Side of Valuation: Valuing Young, Distressed, and Complex Businesses"</li>
            <li>PwC (2024), "Business Valuation Standards", Valuation Handbook</li>
            <li>OECD (2023), "SME and Entrepreneurship Outlook 2023"</li>
          </ul>

          <p className="mt-4"><strong>Industry Standards Compliance:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>IFRS 13 - Fair Value Measurement</li>
            <li>IVS 2017 - International Valuation Standards</li>
            <li>Big 4 Methodology - EY, Deloitte, PwC, KPMG standards</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};
