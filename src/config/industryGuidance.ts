/**
 * Industry-Specific Guidance
 * 
 * Provides contextual tips and validation for different industries
 * to improve data quality and demonstrate domain expertise.
 */

export interface FieldGuidance {
  tip: string;
  why: string;
  warning?: string;
}

export interface IndustryBenchmarks {
  ebitdaMargin: { min: number; max: number };
  note: string;
}

export interface IndustryGuidanceConfig {
  revenue: FieldGuidance;
  ebitda: FieldGuidance;
  benchmarks: IndustryBenchmarks;
}

export const INDUSTRY_GUIDANCE: Record<string, IndustryGuidanceConfig> = {
  technology: {
    revenue: {
      tip: "Include all recurring revenue (MRR × 12 for SaaS)",
      why: "Technology valuations heavily weight recurring revenue streams",
      warning: "Don't include one-time setup fees or professional services"
    },
    ebitda: {
      tip: "Exclude customer acquisition costs (CAC) for normalized margin",
      why: "High-growth tech companies often have elevated CAC that distorts EBITDA"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.15, max: 0.30 },
      note: "High-growth SaaS often has negative EBITDA in early stages - this is normal"
    }
  },
  
  manufacturing: {
    revenue: {
      tip: "Include all product sales, exclude raw material pass-throughs",
      why: "Manufacturing valuations focus on value-added revenue, not total throughput"
    },
    ebitda: {
      tip: "Include depreciation of manufacturing equipment in calculations",
      why: "Equipment depreciation is a real operating cost in manufacturing"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.10, max: 0.20 },
      note: "Manufacturing margins typically range 10-20% depending on automation level"
    }
  },
  
  services: {
    revenue: {
      tip: "Include all billable hours, retainer fees, and project revenue",
      why: "Services revenue should reflect actual client billing and contracts"
    },
    ebitda: {
      tip: "Normalize owner's salary to market rate (typically €80K-€150K)",
      why: "Owner-dependent businesses need normalized EBITDA for accurate valuation"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.25, max: 0.40 },
      note: "Services/consulting should be high-margin (25-40%) due to low overhead"
    }
  },
  
  retail: {
    revenue: {
      tip: "Include all sales revenue, both in-store and online",
      why: "Omnichannel revenue demonstrates market reach and customer base"
    },
    ebitda: {
      tip: "Include cost of goods sold (COGS) but exclude inventory write-downs",
      why: "Retail margins are typically lower; focus on consistent operational profit"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.05, max: 0.15 },
      note: "Retail margins are typically 5-15% due to high COGS and overhead"
    }
  },
  
  healthcare: {
    revenue: {
      tip: "Include all patient revenue, insurance reimbursements, and contracts",
      why: "Healthcare valuations consider both direct patient revenue and institutional contracts"
    },
    ebitda: {
      tip: "Include all operating costs including compliance and regulatory expenses",
      why: "Healthcare has higher regulatory costs that must be reflected in EBITDA"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.15, max: 0.25 },
      note: "Healthcare margins vary by specialty; private practices typically 15-25%"
    }
  },
  
  // Default guidance for other industries
  other: {
    revenue: {
      tip: "Use your most recent fiscal year's total revenue",
      why: "Revenue is the foundation of valuation across all industries"
    },
    ebitda: {
      tip: "Earnings before interest, taxes, depreciation & amortization",
      why: "EBITDA measures operational profitability independent of capital structure"
    },
    benchmarks: {
      ebitdaMargin: { min: 0.10, max: 0.25 },
      note: "EBITDA margins vary widely by industry; 10-25% is typical for SMEs"
    }
  }
};

/**
 * Get industry-specific guidance for a field
 */
export const getIndustryGuidance = (
  industry: string,
  field: 'revenue' | 'ebitda'
): FieldGuidance => {
  const guidance = INDUSTRY_GUIDANCE[industry] || INDUSTRY_GUIDANCE.other;
  return guidance[field];
};

/**
 * Get industry-specific benchmarks
 */
export const getIndustryBenchmarks = (industry: string): IndustryBenchmarks => {
  const guidance = INDUSTRY_GUIDANCE[industry] || INDUSTRY_GUIDANCE.other;
  return guidance.benchmarks;
};

/**
 * Validate EBITDA margin against industry benchmarks
 */
export const validateEbitdaMargin = (
  revenue: number,
  ebitda: number,
  industry: string
): {
  isValid: boolean;
  message: string;
  severity: 'success' | 'warning' | 'info';
} => {
  if (!revenue || !ebitda) {
    return { isValid: true, message: '', severity: 'info' };
  }

  const margin = ebitda / revenue;
  const benchmarks = getIndustryBenchmarks(industry);

  if (margin < 0) {
    return {
      isValid: true,
      message: `Negative EBITDA margin (${(margin * 100).toFixed(1)}%). ${benchmarks.note}`,
      severity: 'info'
    };
  }

  if (margin < benchmarks.ebitdaMargin.min) {
    return {
      isValid: true,
      message: `EBITDA margin is ${(margin * 100).toFixed(1)}% (${industry} average: ${(benchmarks.ebitdaMargin.min * 100).toFixed(0)}-${(benchmarks.ebitdaMargin.max * 100).toFixed(0)}%)`,
      severity: 'warning'
    };
  }

  if (margin > benchmarks.ebitdaMargin.max) {
    return {
      isValid: true,
      message: `EBITDA margin is ${(margin * 100).toFixed(1)}% - excellent! Above ${industry} average (${(benchmarks.ebitdaMargin.min * 100).toFixed(0)}-${(benchmarks.ebitdaMargin.max * 100).toFixed(0)}%)`,
      severity: 'success'
    };
  }

  return {
    isValid: true,
    message: `EBITDA margin is ${(margin * 100).toFixed(1)}% - within ${industry} average (${(benchmarks.ebitdaMargin.min * 100).toFixed(0)}-${(benchmarks.ebitdaMargin.max * 100).toFixed(0)}%)`,
    severity: 'success'
  };
};

