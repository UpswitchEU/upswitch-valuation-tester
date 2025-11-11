/**
 * Step Status Indicator Component
 * 
 * Displays step execution status with appropriate visual indicators.
 * Shows: completed, skipped, failed, or not_executed status.
 * 
 * Phase 4: Data Synchronization & Fallback Logic
 */

import React from 'react';
import { CheckCircle, XCircle, SkipForward, Clock, AlertCircle } from 'lucide-react';

export type StepStatusType = 'completed' | 'skipped' | 'failed' | 'not_executed' | 'unknown';

interface StepStatusIndicatorProps {
  status: StepStatusType;
  executionTimeMs?: number;
  reason?: string | null;
  error?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTime?: boolean;
  className?: string;
}

export const StepStatusIndicator: React.FC<StepStatusIndicatorProps> = ({
  status,
  executionTimeMs,
  reason,
  error,
  size = 'md',
  showLabel = true,
  showTime = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed',
          labelColor: 'text-green-700'
        };
      case 'skipped':
        return {
          icon: SkipForward,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Skipped',
          labelColor: 'text-yellow-700'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Failed',
          labelColor: 'text-red-700'
        };
      case 'not_executed':
        return {
          icon: Clock,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Not Executed',
          labelColor: 'text-gray-500'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          labelColor: 'text-gray-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border ${sizeClasses[size]}`}
        title={status === 'skipped' && reason ? `Skipped: ${reason}` : status === 'failed' && error ? `Failed: ${error}` : config.label}
      >
        <Icon className={`${config.color} ${sizeClasses[size]}`} />
      </div>
      
      {showLabel && (
        <span className={`${config.labelColor} ${textSizeClasses[size]} font-medium`}>
          {config.label}
        </span>
      )}
      
      {showTime && executionTimeMs !== undefined && executionTimeMs > 0 && status === 'completed' && (
        <span className={`text-gray-500 ${textSizeClasses.sm}`}>
          ({formatTime(executionTimeMs)})
        </span>
      )}
      
      {status === 'skipped' && reason && (
        <span className={`text-yellow-600 ${textSizeClasses.sm} italic`} title={reason}>
          {reason}
        </span>
      )}
      
      {status === 'failed' && error && (
        <span className={`text-red-600 ${textSizeClasses.sm} italic`} title={error}>
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * Step Status Badge (compact version)
 */
export const StepStatusBadge: React.FC<{
  status: StepStatusType;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const config = {
    completed: { color: 'bg-green-100 text-green-800 border-green-200' },
    skipped: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    failed: { color: 'bg-red-100 text-red-800 border-red-200' },
    not_executed: { color: 'bg-gray-100 text-gray-600 border-gray-200' },
    unknown: { color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }[status] || config.unknown;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses} font-medium`}
    >
      {status === 'completed' && '✓'}
      {status === 'skipped' && '⊘'}
      {status === 'failed' && '✗'}
      {status === 'not_executed' && '○'}
      {status === 'unknown' && '?'}
    </span>
  );
};

