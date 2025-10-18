/**
 * Calculation utilities for Results components
 */

import type { ValuationResponse } from '../../../types/valuation';

export const calculateOwnershipAdjustment = (result: ValuationResponse) => {
  // For now, return default values since ownership_percentage is not in the type
  const ownershipPercentage = 0; // result.ownership_percentage || 0;
  const equityValue = result.equity_value_mid || 0;
  
  return {
    ownershipValue: (equityValue * ownershipPercentage) / 100,
    ownershipPercentage,
    equityValue
  };
};

export const calculateGrowthMetrics = (_result: ValuationResponse) => {
  // For now, return no historical data since these properties are not in the type
  return { cagr: 0, hasHistoricalData: false, years: 0 };
};

export const getValueDrivers = (_result: ValuationResponse): Array<{
  label: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}> => {
  // For now, return empty array since these properties are not in the type
  return [];
};

export const getRiskFactors = (_result: ValuationResponse): Array<{
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}> => {
  // For now, return empty array since these properties are not in the type
  return [];
};
