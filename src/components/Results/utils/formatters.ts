/**
 * Currency and number formatting utilities for Results components
 */

export const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyCompact = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

export const formatPercent = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value?: number): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('de-DE').format(value);
};
