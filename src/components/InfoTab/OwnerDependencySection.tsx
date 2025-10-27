import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, TrendingDown, Shield } from 'lucide-react';
import type { ValuationResponse } from '../../types/valuation';
import { calculateOwnerDependencyMultipleImpact, formatCurrency } from '../../utils/valuationFormatters';

interface OwnerDependencySectionProps {
  result: ValuationResponse;
}

export const OwnerDependencySection: React.FC<OwnerDependencySectionProps> = ({ result }) => {
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());
  const [showCalculation, setShowCalculation] = useState(false);
  
  const odResult = result.owner_dependency_result;
  
  // If no owner dependency assessment
  if (!odResult) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Info className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Owner Dependency Assessment Not Completed
            </h3>
            <p className="text-blue-800 mb-4">
              Complete the Owner Dependency assessment (Phase 4) to get a more accurate valuation 
              that accounts for key person risk. This assessment evaluates 12 critical factors 
              that can impact business value by up to 40%.
            </p>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What's Included:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Client concentration analysis</li>
                <li>• Operational knowledge dependency</li>
                <li>• Sales relationship assessment</li>
                <li>• Team capability evaluation</li>
                <li>• Succession planning review</li>
                <li>• And 7 more critical factors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const toggleFactor = (factor: string) => {
    const newExpanded = new Set(expandedFactors);
    if (newExpanded.has(factor)) {
      newExpanded.delete(factor);
    } else {
      newExpanded.add(factor);
    }
    setExpandedFactors(newExpanded);
  };
  
  // Determine risk color scheme
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'MINIMAL':
        return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100' };
      case 'LOW':
        return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-100' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-900', badge: 'bg-yellow-100' };
      case 'HIGH':
        return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-900', badge: 'bg-orange-100' };
      case 'CRITICAL':
        return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', badge: 'bg-red-100' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-100' };
    }
  };
  
  const riskColors = getRiskColor(odResult.risk_level);
  
  // Factor display names and descriptions
  const factorInfo: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
    client_concentration: {
      name: 'Client Concentration',
      description: 'Revenue concentration in top clients',
      icon: <TrendingDown className="w-5 h-5" />
    },
    operational_knowledge: {
      name: 'Operational Knowledge',
      description: 'Owner\'s critical operational expertise',
      icon: <Shield className="w-5 h-5" />
    },
    sales_relationship: {
      name: 'Sales Relationships',
      description: 'Owner\'s role in client relationships',
      icon: <CheckCircle className="w-5 h-5" />
    },
    technical_expertise: {
      name: 'Technical Expertise',
      description: 'Owner\'s unique technical skills',
      icon: <Shield className="w-5 h-5" />
    },
    industry_network: {
      name: 'Industry Network',
      description: 'Dependency on owner\'s connections',
      icon: <CheckCircle className="w-5 h-5" />
    },
    decision_making: {
      name: 'Decision Making',
      description: 'Centralization of authority',
      icon: <AlertTriangle className="w-5 h-5" />
    },
    brand_reputation: {
      name: 'Brand vs Personal',
      description: 'Company brand independence',
      icon: <Shield className="w-5 h-5" />
    },
    process_documentation: {
      name: 'Process Documentation',
      description: 'Documentation quality (inverse)',
      icon: <CheckCircle className="w-5 h-5" />
    },
    team_capability: {
      name: 'Team Capability',
      description: 'Team independence (inverse)',
      icon: <CheckCircle className="w-5 h-5" />
    },
    succession_planning: {
      name: 'Succession Planning',
      description: 'Transition plan quality (inverse)',
      icon: <CheckCircle className="w-5 h-5" />
    },
    business_scalability: {
      name: 'Business Scalability',
      description: 'Growth without owner (inverse)',
      icon: <CheckCircle className="w-5 h-5" />
    },
    contract_transferability: {
      name: 'Contract Transfer',
      description: 'Contract portability (inverse)',
      icon: <CheckCircle className="w-5 h-5" />
    }
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'very_high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'very_low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getLevelLabel = (level: string) => {
    return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Owner Dependency Analysis</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${riskColors.badge} ${riskColors.text}`}>
          12-Factor Assessment
        </span>
      </div>
      
      {/* Overall Score Card */}
      <div className={`${riskColors.bg} border-2 ${riskColors.border} rounded-lg p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dependency Score */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Overall Dependency Score</div>
            <div className="text-5xl font-bold text-gray-900">
              {odResult.overall_score.toFixed(0)}<span className="text-2xl">/100</span>
            </div>
            <div className={`text-xl font-semibold mt-2 ${riskColors.text}`}>
              {odResult.risk_level} RISK
            </div>
          </div>
          
          {/* Valuation Adjustment - Dual Format */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Valuation Adjustment</div>
            
            {/* Calculate multiple impact */}
            {(() => {
              const preAdjustmentValue = result.equity_value_mid / (1 + odResult.valuation_adjustment);
              const ebitda = result.financial_metrics?.ebitda || 0;
              const multipleImpact = calculateOwnerDependencyMultipleImpact(
                preAdjustmentValue,
                result.equity_value_mid,
                ebitda
              );
              
              return (
                <>
                  {/* Primary Display - Both Formats */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="text-4xl font-bold text-red-600">
                      {multipleImpact.percentageFormat}
                    </div>
                    {multipleImpact.isApplicable && (
                      <>
                        <div className="text-2xl text-gray-400">|</div>
                        <div className="text-4xl font-bold text-red-600">
                          {multipleImpact.multipleFormat}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Detailed Breakdown */}
                  {multipleImpact.isApplicable && (
                    <div className="text-xs text-gray-600 space-y-1 mt-3">
                      <div>{multipleImpact.baseMultiple}x → {multipleImpact.adjustedMultiple}x</div>
                      <div className="text-gray-500">EBITDA multiple impact</div>
                    </div>
                  )}
                  
                  {!multipleImpact.isApplicable && (
                    <div className="text-xs text-gray-500 mt-2">
                      Multiple format not applicable (pre-revenue/negative EBITDA)
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          
          {/* Risk Level Indicator */}
          <div className="text-center flex flex-col justify-center">
            <div className="text-sm text-gray-600 mb-2">Transition Risk</div>
            <div className="flex justify-center mb-2">
              {odResult.risk_level === 'CRITICAL' || odResult.risk_level === 'HIGH' ? (
                <XCircle className="w-16 h-16 text-red-600" />
              ) : odResult.risk_level === 'MEDIUM' ? (
                <AlertTriangle className="w-16 h-16 text-yellow-600" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-600" />
              )}
            </div>
            <div className="text-sm text-gray-700">
              {odResult.overall_score >= 80 ? 'Low transition risk' :
               odResult.overall_score >= 60 ? 'Moderate risk' :
               odResult.overall_score >= 40 ? 'Significant risk' :
               'High transition risk'}
            </div>
          </div>
        </div>
        
        {/* Explanation */}
        <div className="mt-6 pt-6 border-t border-gray-300">
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {odResult.explanation}
          </div>
        </div>
        
        {/* Calculation Details - Expandable */}
        <div className="mt-6 pt-6 border-t border-gray-300">
          <button
            onClick={() => setShowCalculation(!showCalculation)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-semibold text-gray-900">
              How is this calculated?
            </h4>
            {showCalculation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showCalculation && (() => {
            const preAdjustmentValue = result.equity_value_mid / (1 + odResult.valuation_adjustment);
            const ebitda = result.financial_metrics?.ebitda || 0;
            const multipleImpact = calculateOwnerDependencyMultipleImpact(
              preAdjustmentValue,
              result.equity_value_mid,
              ebitda
            );
            
            return (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-3">Multiple Impact Calculation</div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Pre-adjustment valuation:</span>
                      <span className="font-mono">{formatCurrency(preAdjustmentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EBITDA:</span>
                      <span className="font-mono">{formatCurrency(ebitda)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Base multiple:</span>
                      <span className="font-mono font-semibold">{multipleImpact.baseMultiple}x</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>({formatCurrency(preAdjustmentValue)} ÷ {formatCurrency(ebitda)})</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="font-semibold text-gray-900 mb-3">After Owner Dependency Adjustment</div>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Adjusted valuation:</span>
                      <span className="font-mono">{formatCurrency(result.equity_value_mid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EBITDA:</span>
                      <span className="font-mono">{formatCurrency(ebitda)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Adjusted multiple:</span>
                      <span className="font-mono font-semibold">{multipleImpact.adjustedMultiple}x</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>({formatCurrency(result.equity_value_mid)} ÷ {formatCurrency(ebitda)})</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-2">Impact Summary</div>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Percentage impact:</span>
                      <span className="font-mono font-semibold text-red-600">{multipleImpact.percentageFormat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiple impact:</span>
                      <span className="font-mono font-semibold text-red-600">{multipleImpact.multipleFormat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value reduction:</span>
                      <span className="font-mono font-semibold text-red-600">
                        {formatCurrency(result.equity_value_mid - preAdjustmentValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* 12 Factors Breakdown */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">12-Factor Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(odResult.factors).map(([factor, level]) => {
            const info = factorInfo[factor] || { 
              name: factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
              description: '', 
              icon: <Info className="w-5 h-5" /> 
            };
            const isExpanded = expandedFactors.has(factor);
            
            return (
              <div
                key={factor}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => toggleFactor(factor)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-gray-600 mt-1">
                      {info.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{info.name}</h4>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(level)}`}>
                      {getLevelLabel(level)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      <strong>Level:</strong> {getLevelLabel(level)} dependency
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This factor contributes to the overall owner dependency risk assessment.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Key Risks */}
      {odResult.key_risks && odResult.key_risks.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-3">Key Transition Risks</h3>
              <ul className="space-y-2">
                {odResult.key_risks.map((risk, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-yellow-700 font-bold">•</span>
                    <span className="text-yellow-800 text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {odResult.recommendations && odResult.recommendations.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-blue-700 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-3">Recommendations to Reduce Dependency</h3>
              <ul className="space-y-2">
                {odResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-blue-700 font-bold">✓</span>
                    <span className="text-blue-800 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Academic Citation */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <strong>Methodology:</strong> Key Person Risk Assessment based on Damodaran (2012) - 
            <em>Investment Valuation, Chapter 12: "Valuing Small and Private Companies"</em>. 
            This 12-factor model is standard practice in Big 4 valuation methodologies, 
            adapted for SME-specific risk factors.
          </div>
        </div>
      </div>
    </div>
  );
};

