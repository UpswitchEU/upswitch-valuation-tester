/**
 * Step Metadata Component
 * 
 * Displays execution metadata for a calculation step:
 * - Execution time
 * - Status badge
 * - Warnings/errors
 * - Data source indicators
 * - Calibration type
 * 
 * Phase 4: Data Synchronization & Fallback Logic
 */

import React from 'react';
import { StepStatusIndicator, StepStatusBadge } from './StepStatusIndicator';
import { Clock, AlertTriangle, Info, Database, Calculator } from 'lucide-react';
import { formatExecutionTime } from '../../utils/stepDataMapper';
import type { EnhancedCalculationStep } from '../../types/valuation';

interface StepMetadataProps {
  stepData: EnhancedCalculationStep | null;
  stepNumber: number;
  showExecutionTime?: boolean;
  showStatus?: boolean;
  showWarnings?: boolean;
  showDataSource?: boolean;
  showCalibration?: boolean;
  calibrationType?: 'industry-specific' | 'universal' | null;
  dataSource?: 'real' | 'estimated' | 'cache' | null;
  className?: string;
}

export const StepMetadata: React.FC<StepMetadataProps> = ({
  stepData,
  stepNumber,
  showExecutionTime = true,
  showStatus = true,
  showWarnings = true,
  showDataSource = true,
  showCalibration = true,
  calibrationType = null,
  dataSource = null,
  className = ''
}) => {
  if (!stepData) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span className="inline-flex items-center gap-1">
          <Info className="w-4 h-4" />
          Step metadata not available
        </span>
      </div>
    );
  }

  const hasWarnings = stepData.status === 'skipped' && stepData.reason;
  const hasErrors = stepData.status === 'failed' && stepData.error;

  return (
    <div className={`flex flex-wrap items-center gap-3 text-sm ${className}`}>
      {/* Status Badge */}
      {showStatus && (
        <StepStatusBadge
          status={stepData.status || 'unknown'}
          size="sm"
        />
      )}

      {/* Execution Time */}
      {showExecutionTime && stepData.execution_time_ms > 0 && stepData.status === 'completed' && (
        <span className="inline-flex items-center gap-1 text-gray-600">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatExecutionTime(stepData.execution_time_ms)}</span>
        </span>
      )}

      {/* Data Source Indicator */}
      {showDataSource && dataSource && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            dataSource === 'real'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : dataSource === 'cache'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}
          title={
            dataSource === 'real'
              ? 'Real-time data from market sources'
              : dataSource === 'cache'
              ? 'Cached data from previous request'
              : 'Estimated data based on industry benchmarks'
          }
        >
          <Database className="w-3 h-3" />
          {dataSource === 'real' ? 'Real Data' : dataSource === 'cache' ? 'Cached' : 'Estimated'}
        </span>
      )}

      {/* Calibration Type */}
      {showCalibration && calibrationType && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            calibrationType === 'industry-specific'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
          title={
            calibrationType === 'industry-specific'
              ? 'Industry-specific calibration applied'
              : 'Universal calibration applied'
          }
        >
          <Calculator className="w-3 h-3" />
          {calibrationType === 'industry-specific' ? 'Industry Calibrated' : 'Universal'}
        </span>
      )}

      {/* Warnings */}
      {showWarnings && hasWarnings && (
        <span className="inline-flex items-center gap-1 text-yellow-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-xs italic">{stepData.reason}</span>
        </span>
      )}

      {/* Errors */}
      {showWarnings && hasErrors && (
        <span className="inline-flex items-center gap-1 text-red-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-xs italic">{stepData.error}</span>
        </span>
      )}

      {/* Methodology Note */}
      {stepData.methodology_note && (
        <span className="text-xs text-gray-500 italic">
          {stepData.methodology_note}
        </span>
      )}
    </div>
  );
};

/**
 * Compact metadata display (single line)
 */
export const StepMetadataCompact: React.FC<{
  stepData: EnhancedCalculationStep | null;
  dataSource?: 'real' | 'estimated' | 'cache' | null;
}> = ({ stepData, dataSource = null }) => {
  if (!stepData) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <StepStatusBadge status={stepData.status || 'unknown'} size="sm" />
      {stepData.execution_time_ms > 0 && stepData.status === 'completed' && (
        <span>{formatExecutionTime(stepData.execution_time_ms)}</span>
      )}
      {dataSource && (
        <span className="capitalize">{dataSource}</span>
      )}
    </div>
  );
};

