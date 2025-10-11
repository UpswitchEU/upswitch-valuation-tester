import React from 'react';

/**
 * ValidationReport - Show data quality checks
 * 
 * Design: Traffic light system (green/yellow/red) with check results
 * Strategy: Build trust by showing what was validated
 */

interface ValidationCheck {
  check_name: string;
  check_type: 'data_quality' | 'consistency' | 'realism' | 'completeness';
  status: 'passed' | 'warning' | 'failed';
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation?: string;
}

interface ValidationReportProps {
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  checks: ValidationCheck[];
  validationScore: number;
  summary: string;
  compact?: boolean;
}

const STATUS_CONFIG = {
  passed: {
    icon: '✓',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: '⚠',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  failed: {
    icon: '✗',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export const ValidationReport: React.FC<ValidationReportProps> = ({
  totalChecks,
  passed,
  warnings,
  failed,
  checks,
  validationScore,
  summary,
  compact = false,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
        <span className="text-xs font-medium text-gray-700">Validation:</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getScoreColor(validationScore)}`}>
          {validationScore}/100
        </span>
        <span className="text-xs text-gray-500">
          {passed}/{totalChecks} checks passed
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-semibold text-gray-900">Data Validation Score</h5>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold px-3 py-1 rounded ${getScoreColor(validationScore)}`}>
              {validationScore}/100
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${
              validationScore >= 90 ? 'bg-green-500' :
              validationScore >= 70 ? 'bg-blue-500' :
              validationScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${validationScore}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="block font-semibold text-green-600">{passed}</span>
            <span className="text-gray-600">Passed</span>
          </div>
          <div>
            <span className="block font-semibold text-yellow-600">{warnings}</span>
            <span className="text-gray-600">Warnings</span>
          </div>
          <div>
            <span className="block font-semibold text-red-600">{failed}</span>
            <span className="text-gray-600">Failed</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-gray-600 mt-3 bg-gray-50 rounded p-2">
          {summary}
        </p>
      </div>

      {/* Individual Checks */}
      {checks && checks.length > 0 && (
        <div className="space-y-2">
          {checks.map((check, index) => {
            const config = STATUS_CONFIG[check.status];
            return (
              <div
                key={index}
                className={`
                  rounded-lg border p-3
                  ${config.bgColor} ${config.borderColor}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`flex-shrink-0 text-lg ${config.color}`}>
                    {config.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-900">
                        {check.check_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-600">
                        {check.check_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">
                      {check.message}
                    </p>
                    {check.recommendation && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        💡 {check.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

