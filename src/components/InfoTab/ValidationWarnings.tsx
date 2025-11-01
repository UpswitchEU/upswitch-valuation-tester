import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import React from 'react';
import type { ValidationWarning } from '../../types/valuation';

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

/**
 * ValidationWarnings Component
 * 
 * Displays validation warnings from backend sanity checks for WACC, CAGR, 
 * growth consistency, methodology variance, and data quality issues.
 * 
 * Critical for transparency: surfaces calculation anomalies that could
 * indicate data quality issues or unreasonable assumptions.
 * 
 * Academic basis: PwC Valuation Handbook 2024 recommends prominently
 * displaying all calculation warnings to maintain professional standards.
 */
export const ValidationWarnings: React.FC<ValidationWarningsProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  // Group warnings by severity
  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const highWarnings = warnings.filter(w => w.severity === 'high');
  const mediumWarnings = warnings.filter(w => w.severity === 'medium');
  const lowWarnings = warnings.filter(w => w.severity === 'low');

  const getSeverityConfig = (severity: ValidationWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800',
          label: 'CRITICAL'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-900',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-800',
          label: 'HIGH'
        };
      case 'medium':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-400',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          label: 'MEDIUM'
        };
      case 'low':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-400',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-800',
          label: 'INFO'
        };
    }
  };

  const getTypeLabel = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'wacc': return 'WACC Validation';
      case 'cagr': return 'CAGR Validation';
      case 'growth_consistency': return 'Growth Consistency';
      case 'methodology_variance': return 'Methodology Variance';
      case 'data_quality': return 'Data Quality';
    }
  };

  const renderWarningGroup = (groupWarnings: ValidationWarning[], title: string) => {
    if (groupWarnings.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm">{title} ({groupWarnings.length})</h4>
        {groupWarnings.map((warning, index) => {
          const config = getSeverityConfig(warning.severity);
          const Icon = config.icon;

          return (
            <div
              key={`${warning.type}-${index}`}
              className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.badgeColor}`}>
                      {config.label}
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                      {getTypeLabel(warning.type)}
                    </span>
                  </div>
                  <p className={`text-sm ${config.textColor} font-medium mb-1`}>
                    {warning.message}
                  </p>
                  {warning.details && (
                    <p className={`text-xs ${config.textColor} opacity-90 mb-2`}>
                      {warning.details}
                    </p>
                  )}
                  {warning.recommended_action && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Recommended Action:
                      </p>
                      <p className="text-xs text-gray-700">
                        {warning.recommended_action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">Validation Warnings</h3>
          <p className="text-sm text-gray-600">
            Automated sanity checks flagged {warnings.length} potential {warnings.length === 1 ? 'issue' : 'issues'} requiring review
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Review Required</h4>
            <p className="text-sm text-red-800 mb-3">
              Our automated validation system has identified calculations that fall outside typical ranges 
              for SME valuations. This doesn't necessarily mean the valuation is incorrect, but these items 
              warrant additional review.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {criticalWarnings.length > 0 && (
                <div className="bg-red-100 rounded px-2 py-1">
                  <span className="font-bold text-red-900">{criticalWarnings.length}</span>
                  <span className="text-red-700 ml-1">Critical</span>
                </div>
              )}
              {highWarnings.length > 0 && (
                <div className="bg-orange-100 rounded px-2 py-1">
                  <span className="font-bold text-orange-900">{highWarnings.length}</span>
                  <span className="text-orange-700 ml-1">High</span>
                </div>
              )}
              {mediumWarnings.length > 0 && (
                <div className="bg-yellow-100 rounded px-2 py-1">
                  <span className="font-bold text-yellow-900">{mediumWarnings.length}</span>
                  <span className="text-yellow-700 ml-1">Medium</span>
                </div>
              )}
              {lowWarnings.length > 0 && (
                <div className="bg-blue-100 rounded px-2 py-1">
                  <span className="font-bold text-blue-900">{lowWarnings.length}</span>
                  <span className="text-blue-700 ml-1">Info</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Groups */}
      {renderWarningGroup(criticalWarnings, '🔴 Critical Issues')}
      {renderWarningGroup(highWarnings, '🟠 High Priority Warnings')}
      {renderWarningGroup(mediumWarnings, '🟡 Medium Priority Warnings')}
      {renderWarningGroup(lowWarnings, '🔵 Informational Notes')}

      {/* Footer: What This Means */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">What This Means</h4>
        <ul className="text-xs text-gray-700 space-y-1.5">
          <li>
            <strong>• WACC Warnings:</strong> Cost of capital outside typical 5-30% range for SMEs. 
            Review risk-free rate, beta, and market risk premium.
          </li>
          <li>
            <strong>• CAGR Warnings:</strong> Growth rates exceeding ±200% may indicate data entry errors 
            or exceptional circumstances requiring explanation.
          </li>
          <li>
            <strong>• Growth Consistency:</strong> Significant differences between single-year growth and 
            multi-year CAGR suggest volatile performance.
          </li>
          <li>
            <strong>• Methodology Variance:</strong> Large differences between DCF and Multiples valuations 
            (&gt;50%) indicate underlying assumption conflicts.
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3 italic">
          Source: PwC Valuation Handbook 2024, Section 5.3 - "Sanity Checks and Quality Control in Valuations"
        </p>
      </div>
    </div>
  );
};

