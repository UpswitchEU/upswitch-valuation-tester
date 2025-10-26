/**
 * Financial Constants
 * 
 * Centralized configuration for valuation assumptions.
 * Update quarterly or as market conditions change.
 */

export const FINANCIAL_CONSTANTS = {
  // Risk-Free Rate (ECB 10-year bond)
  // Last updated: 2025-01-15
  // Source: European Central Bank
  // Update frequency: Quarterly
  ECB_RISK_FREE_RATE: 2.5,
  
  // Market Risk Premium
  // Last updated: 2025-01-15
  // Source: Damodaran (NYU Stern)
  // Update frequency: Annually
  MARKET_RISK_PREMIUM: 5.5,
  
  // Default Beta (Industry Average)
  // Last updated: 2025-01-15
  // Source: Industry comparables
  // Update frequency: Annually
  DEFAULT_BETA: 1.2,
  
  // Default WACC
  // Last updated: 2025-01-15
  // Calculation: Risk-free rate + Beta * Market risk premium
  DEFAULT_WACC: 12.1,
  
  // Default Terminal Growth Rate
  // Last updated: 2025-01-15
  // Source: ECB GDP growth projections
  // Update frequency: Quarterly
  DEFAULT_TERMINAL_GROWTH: 2.9,
  
  // Default Cost of Equity
  // Last updated: 2025-01-15
  // Calculation: Risk-free rate + Beta * Market risk premium
  DEFAULT_COST_OF_EQUITY: 12.1,
  
  // Metadata
  LAST_UPDATED: '2025-01-15',
  NEXT_REVIEW_DATE: '2025-04-15'
} as const;

// Type-safe access
export type FinancialConstant = keyof typeof FINANCIAL_CONSTANTS;
