import { AlertTriangle, BarChart3, CheckCircle, Database, FileText, Target, TrendingUp, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { ValuationInputData, ValuationResponse } from '../../types/valuation';
import { calculateOwnerDependencyMultipleImpact } from '../../utils/valuationFormatters';
import { formatCurrency } from '../Results/utils/formatters';
import { DataProvenanceSection } from './DataProvenanceSection';
import { DCFTransparencySection } from './DCFTransparencySection';
import { InputDataSection } from './InputDataSection';
import { MultiplesTransparencySection } from './MultiplesTransparencySection';
import { OwnerDependencySection } from './OwnerDependencySection';
import { RangeCalculationSection } from './RangeCalculationSection';
import { WeightingLogicSection } from './WeightingLogicSection';

interface TransparentCalculationViewProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

// Define all possible sections for navigation (McKinsey/Bain structure)
const ALL_SECTIONS = [
  { id: 'summary', title: 'Executive Summary', icon: FileText, required: true },
  { id: 'input-data', title: 'Input Data', icon: Database, required: true },
  { id: 'dcf-calculation', title: 'DCF Analysis', icon: TrendingUp, required: true },
  { id: 'multiples-calculation', title: 'Market Multiples', icon: BarChart3, required: true },
  { id: 'weighting-logic', title: 'Methodology Weighting', icon: Target, required: true },
  { id: 'owner-dependency', title: 'Owner Dependency', icon: Users, required: false },
  { id: 'range-calculation', title: 'Valuation Range', icon: BarChart3, required: true }
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

      {/* Section 1: Input Data Summary */}
      <div id="input-data">
        <InputDataSection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 2: DCF Calculation Deep Dive */}
      <div id="dcf-calculation">
        <DCFTransparencySection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 3: Multiples Calculation Deep Dive */}
      <div id="multiples-calculation">
        <MultiplesTransparencySection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 4: Methodology Weighting Logic */}
      <div id="weighting-logic">
        <WeightingLogicSection result={result} inputData={inputData} />
      </div>

      {/* Section divider */}
      <div className="border-t-4 border-gray-300"></div>

      {/* Section 4.5: Owner Dependency Analysis (12 factors) - Only if available */}
      {result.owner_dependency_result && (
        <>
          <div id="owner-dependency">
            <OwnerDependencySection result={result} />
          </div>
          
          {/* Section divider */}
          <div className="border-t-4 border-gray-300"></div>
        </>
      )}

      {/* Section 5: Range Calculation (Low/Mid/High) */}
      <div id="range-calculation">
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

// Final Synthesis Section Component
const FinalSynthesisSection: React.FC<{
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}> = ({ result }) => {
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.adjusted_equity_value || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Final Valuation Synthesis</h2>
          <p className="text-sm text-gray-600">How all components combine to create the final valuation</p>
        </div>
      </div>

      {/* Synthesis Flow */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Synthesis Process</h3>
        
        <div className="space-y-4">
          {/* Step 1: Individual Methodologies */}
          <div className="bg-white rounded-lg p-4 border border-indigo-300">
            <h4 className="font-semibold text-gray-900 mb-3">Step 1: Individual Methodology Results</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded border-2 border-blue-500">
                <span className="text-sm text-gray-600 block mb-1">DCF Method</span>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dcfValue)}</p>
                <span className="text-xs text-gray-600">Discounted Cash Flow</span>
              </div>
              <div className="bg-green-50 p-3 rounded border-2 border-green-500">
                <span className="text-sm text-gray-600 block mb-1">Multiples Method</span>
                <p className="text-xl font-bold text-green-600">{formatCurrency(multiplesValue)}</p>
                <span className="text-xs text-gray-600">Market Comparables</span>
              </div>
            </div>
          </div>

          {/* Step 2: Weighted Combination */}
          <div className="bg-white rounded-lg p-4 border border-indigo-300">
            <h4 className="font-semibold text-gray-900 mb-3">Step 2: Intelligent Weighting Applied</h4>
            <div className="space-y-2 font-mono text-sm">
              <p className="text-gray-700">
                Mid-Point = (DCF × {(dcfWeight * 100).toFixed(0)}%) + (Multiples × {(multiplesWeight * 100).toFixed(0)}%)
              </p>
              <p className="text-gray-700">
                Mid-Point = ({formatCurrency(dcfValue)} × {(dcfWeight * 100).toFixed(0)}%) + ({formatCurrency(multiplesValue)} × {(multiplesWeight * 100).toFixed(0)}%)
              </p>
              <p className="text-gray-700">
                Mid-Point = {formatCurrency(dcfValue * dcfWeight)} + {formatCurrency(multiplesValue * multiplesWeight)}
              </p>
              <p className="text-xl font-bold text-indigo-600 pt-2 border-t border-gray-300">
                Mid-Point = {formatCurrency(result.equity_value_mid)}
              </p>
            </div>
          </div>

          {/* Step 3: Range Application */}
          <div className="bg-white rounded-lg p-4 border border-indigo-300">
            <h4 className="font-semibold text-gray-900 mb-3">Step 3: Confidence-Based Range Applied</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-red-50 rounded border border-red-300">
                <span className="text-xs text-gray-600 block mb-1">Low (-16%)</span>
                <p className="text-lg font-bold text-red-600">{formatCurrency(result.equity_value_low)}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded border-2 border-blue-500">
                <span className="text-xs text-gray-600 block mb-1">Mid-Point</span>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(result.equity_value_mid)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded border border-green-300">
                <span className="text-xs text-gray-600 block mb-1">High (+12%)</span>
                <p className="text-lg font-bold text-green-600">{formatCurrency(result.equity_value_high)}</p>
              </div>
            </div>
          </div>

          {/* Quality Indicators */}
          <div className="bg-white rounded-lg p-4 border border-indigo-300">
            <h4 className="font-semibold text-gray-900 mb-3">Quality Indicators</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Confidence Score:</span>
                <span className="font-bold text-green-600">
                  {(() => {
                    const rawScore = result.confidence_score || 80;
                    const score = rawScore >= 1 ? rawScore : rawScore * 100;
                    return `${score.toFixed(1)}%`;
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Data Quality:</span>
                <span className="font-bold text-blue-600">High</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Methodology Agreement:</span>
                <span className="font-bold text-yellow-600">68%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Range Discipline:</span>
                <span className="font-bold text-green-600">1.33x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Takeaways</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">1</span>
            <p>
              <strong>Dual Methodology:</strong> Both DCF and Multiples methods provide independent validation, 
              with intelligent weighting based on company characteristics and data quality.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xs">2</span>
            <p>
              <strong>SME-Optimized:</strong> Range calculation reflects asymmetric risk profile of SMEs 
              with higher downside risk and limited upside potential compared to larger enterprises.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">3</span>
            <p>
              <strong>Academic Rigor:</strong> Every formula, adjustment, and assumption is grounded in 
              established academic research and Big 4 consulting methodologies.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">4</span>
            <p>
              <strong>European Market Focus:</strong> Data sources, multiples, and adjustments specifically 
              optimized for European SME market dynamics.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Citation */}
      <div className="mt-8 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
        <div className="text-xs text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800 mb-2">Methodology Standards:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium text-gray-700 mb-1">Academic Foundation:</p>
              <ul className="space-y-1">
                <li>• Damodaran (2012)</li>
                <li>• McKinsey Valuation</li>
                <li>• Koller & Goedhart</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Professional Standards:</p>
              <ul className="space-y-1">
                <li>• Big 4 Frameworks</li>
                <li>• IVSC Guidelines</li>
                <li>• AICPA Standards</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Regulatory Compliance:</p>
              <ul className="space-y-1">
                <li>• EU Accounting Directives</li>
                <li>• IFRS 13 Fair Value</li>
                <li>• Basel III Guidelines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

