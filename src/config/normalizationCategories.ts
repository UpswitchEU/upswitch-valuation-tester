/**
 * EBITDA Normalization Categories Configuration
 * 
 * Defines all 12 adjustment categories with complete metadata for UI and validation
 * These categories transform reported EBITDA to economic truth
 */

import { NormalizationCategory, NormalizationCategoryDefinition } from '../types/ebitdaNormalization';

export const NORMALIZATION_CATEGORIES: NormalizationCategoryDefinition[] = [
  {
    id: NormalizationCategory.OWNER_COMPENSATION,
    label: 'Owner Compensation Adjustment',
    description: 'Adjust owner salary to market rate for equivalent role',
    detailedDescription: 
      'SME owners often take below-market salaries to minimize tax. This adjustment normalizes owner compensation to market rates for equivalent roles (CEO, CFO, COO), reflecting true operating costs. If the owner performs billable work or operational duties, this should also include replacement cost.',
    examples: [
      'Owner takes €50k salary but market rate for CEO is €120k → +€70k adjustment',
      'Owner-operator in service business does billable work → Add replacement cost',
      'Family members on payroll doing minimal work → Reduce to actual value',
      'Owner takes no salary but works full-time → Add full market rate',
      'Multiple owners sharing duties → Normalize each to market rates for their actual roles',
    ],
    marketRateLogic: 'Query industry salary benchmarks for C-level roles based on company size, industry, and location. Typical CEO salaries range from €60k (micro SME) to €150k+ (larger SME).',
    validationRules: {
      min: -500000,
      max: 500000,
      warningThreshold: 100000,
      warningMessage: 'Large owner compensation adjustments (>€100k) may be questioned by buyers. Ensure strong documentation and market rate justification.',
    },
    confidenceFactors: [
      'Owner role clarity (single role vs. multiple roles)',
      'Industry benchmark availability',
      'Company size alignment with benchmarks',
      'Geographic location data quality',
    ],
    helpText: 'Add back if owner is underpaid compared to market. Subtract if family members are overpaid for minimal work.',
  },
  
  {
    id: NormalizationCategory.ONE_TIME_EXPENSES,
    label: 'One-Time Expenses',
    description: 'Remove non-recurring expenses that won\'t repeat',
    detailedDescription: 
      'One-time expenses (legal fees for disputes, restructuring costs, fire damage repairs, moving costs, extraordinary consulting fees) distort true earning power. These should be added back to show normalized performance as they won\'t recur in future operations.',
    examples: [
      'Legal settlement or litigation costs: €30k',
      'Office relocation or renovation costs: €15k',
      'Equipment replacement after fire or flood: €25k',
      'One-time consulting fees for restructuring: €20k',
      'Contract termination penalties: €10k',
    ],
    marketRateLogic: 'No market rate - user identifies from financial records. Review income statement for unusual or non-recurring expense items.',
    validationRules: {
      min: 0,
      max: 1000000,
      warningThreshold: 50000,
      warningMessage: 'One-time expenses >€50k should be clearly documented with supporting evidence for buyer due diligence.',
    },
    helpText: 'Add back expenses that won\'t repeat in normal operations. Document the nature and date of each expense.',
  },
  
  {
    id: NormalizationCategory.PERSONAL_EXPENSES,
    label: 'Personal Expenses',
    description: 'Remove personal expenses run through business',
    detailedDescription: 
      'SME owners often run personal expenses through the business for tax optimization (home office beyond reasonable allocation, personal vehicle usage, personal travel labeled as business, family meals, personal insurance). These should be removed to show true business operating costs.',
    examples: [
      'Personal vehicle expenses (beyond business use): €10k',
      'Home office expenses (excessive allocation): €5k',
      'Personal travel labeled as business travel: €8k',
      'Family vacations booked as "business trips": €12k',
      'Personal phone, internet beyond business needs: €3k',
    ],
    marketRateLogic: 'Estimate based on revenue size. Typical range: 1-3% of revenue for micro SMEs (<€1M), 0.5-1.5% for larger SMEs (€1M-€5M).',
    validationRules: {
      min: 0,
      max: 100000,
      warningThreshold: 20000,
      warningMessage: 'Personal expenses >€20k require detailed documentation and clear business/personal allocation methodology.',
    },
    helpText: 'Add back personal expenses that would not be incurred by a new owner. Be conservative and well-documented.',
  },
  
  {
    id: NormalizationCategory.RELATED_PARTY,
    label: 'Related Party Transactions',
    description: 'Adjust non-arm\'s length transactions to market rates',
    detailedDescription: 
      'Transactions with related parties (family members, other businesses owned by same person, shareholder loans) may not be at market rates. Adjust to arm\'s length pricing to reflect true cost of operations under independent ownership.',
    examples: [
      'Rent paid to owner-owned property above market: -€20k (reduce expense)',
      'Services purchased from owner\'s other company below market: +€15k (increase to market rate)',
      'Interest on shareholder loans above market rates: -€10k (reduce to market rate)',
      'Management fees to related company (not at market): adjust to market rate',
      'Below-market rent if owner owns the property: increase to market rent',
    ],
    marketRateLogic: 'Compare to market rates for equivalent services, assets, or financing. Use local commercial real estate data for rent, bank rates for loans, and industry rates for services.',
    validationRules: {
      min: -200000,
      max: 200000,
      warningThreshold: 30000,
      warningMessage: 'Related party adjustments >€30k require clear market rate justification with comparable transaction evidence.',
    },
    helpText: 'Adjust to market rates. Can be positive (underpaying for services) or negative (overpaying to related parties).',
  },
  
  {
    id: NormalizationCategory.NON_RECURRING_REVENUE,
    label: 'Non-Recurring Revenue',
    description: 'Remove one-time revenue that won\'t repeat',
    detailedDescription: 
      'One-time revenue sources (asset sales, insurance payouts, contract termination payments, government grants, lawsuit settlements) should be removed to show sustainable revenue base. These inflate reported EBITDA but won\'t recur in future operations.',
    examples: [
      'Sale of old equipment or machinery: €40k',
      'Insurance payout for business interruption: €25k',
      'One-time contract termination fee received: €50k',
      'Government COVID-19 support grants (non-recurring): €30k',
      'Lawsuit settlement received: €35k',
    ],
    marketRateLogic: 'No market rate - user identifies from financial records. Review income statement for unusual revenue items or other income category.',
    validationRules: {
      min: -1000000,
      max: 0,
      warningThreshold: -50000,
      warningMessage: 'Removing revenue >€50k significantly reduces EBITDA. Document clearly why this revenue won\'t recur.',
    },
    helpText: 'SUBTRACT one-time revenue (enter as negative). This reduces normalized EBITDA to show sustainable earning power.',
  },
  
  {
    id: NormalizationCategory.NON_RECURRING_COSTS,
    label: 'Non-Recurring Cost Savings',
    description: 'Adjust for temporary cost reductions that won\'t continue',
    detailedDescription: 
      'Temporary cost reductions (COVID rent forgiveness, temporary wage reductions, one-time supplier discounts, deferred maintenance) should be adjusted to show normal cost structure. Future operations will incur these costs at normal levels.',
    examples: [
      'Temporary rent reduction during COVID (will revert): -€15k (negative = increase cost)',
      'One-time supplier volume discount (not sustainable): -€10k',
      'Deferred maintenance that will catch up next year: +€20k (positive = cost will increase)',
      'Temporary wage reductions that have since normalized: -€25k',
      'Promotional pricing that will return to normal: adjust accordingly',
    ],
    marketRateLogic: 'No market rate - user assesses normal cost structure. Compare to historical cost levels and industry norms.',
    validationRules: {
      min: -100000,
      max: 100000,
      warningThreshold: 20000,
      warningMessage: 'Cost adjustments >€20k should be supported by historical data and explanation of cost normalization.',
    },
    helpText: 'Adjust costs to normal levels. Negative values reduce EBITDA (temporary savings), positive values increase EBITDA (deferred costs).',
  },
  
  {
    id: NormalizationCategory.DEPRECIATION,
    label: 'Depreciation & Amortization Adjustment',
    description: 'Adjust D&A to reflect actual capital needs',
    detailedDescription: 
      'If depreciation doesn\'t reflect actual capital expenditure needs, adjust to normalized level. While EBITDA excludes D&A, significant mismatches between D&A and actual capex requirements affect quality of earnings. Accelerated depreciation for tax purposes or fully-depreciated assets still in use may need adjustment.',
    examples: [
      'Accelerated depreciation for tax purposes (not reflecting economic reality)',
      'Old fully-depreciated assets still in use (understated D&A)',
      'Recent large capex not yet showing in D&A schedule',
      'Intangible amortization from past acquisitions (non-cash)',
    ],
    marketRateLogic: 'Compare annual D&A to actual capital expenditures over 3-5 years. Sustainable capex should approximately equal D&A over time.',
    validationRules: {
      min: -100000,
      max: 100000,
      warningThreshold: 30000,
      warningMessage: 'D&A adjustments >€30k suggest significant capital structure issues. Provide detailed explanation and capex analysis.',
    },
    helpText: 'Typically small adjustments. Focus on D&A/capex mismatch analysis. This is an advanced adjustment.',
  },
  
  {
    id: NormalizationCategory.FAMILY_EXPENSES,
    label: 'Family & Friends on Payroll',
    description: 'Adjust family member compensation to market rates',
    detailedDescription: 
      'Family members on payroll may be overpaid (nepotism) or underpaid (family labor). Adjust to market rates for actual roles performed. This is separate from owner compensation - it covers additional family members who may be overcompensated for minimal work or undercompensated for significant contributions.',
    examples: [
      'Owner\'s spouse as "admin" at €80k but does minimal work → -€50k (reduce cost)',
      'Owner\'s child learning the business at below-market rate → +€20k (increase cost)',
      'Retired parent as "consultant" but not working → -€30k (remove cost)',
      'Multiple family members in nominal roles with high salaries → adjust each to market',
      'Family member doing real work but underpaid → increase to market rate',
    ],
    marketRateLogic: 'Market rates for actual roles performed, not job titles. Research comparable roles in local market for company size.',
    validationRules: {
      min: -200000,
      max: 200000,
      warningThreshold: 40000,
      warningMessage: 'Family compensation adjustments >€40k require detailed role descriptions and market rate analysis.',
    },
    helpText: 'Adjust family member compensation to market rates for work actually performed. Can be positive or negative.',
  },
  
  {
    id: NormalizationCategory.UNUSUAL_TRANSACTIONS,
    label: 'Unusual or Distorted Transactions',
    description: 'Remove impact of unusual transactions',
    detailedDescription: 
      'Unusual transactions that distort normal operations should be normalized. This includes litigation costs, regulatory penalties, extraordinary gains/losses, significant bad debt write-offs, or accounting adjustments from prior periods. These are non-operating items that don\'t reflect sustainable earning power.',
    examples: [
      'Regulatory fine or penalty: €25k (add back)',
      'Gain on foreign exchange (not normal business activity): -€15k (remove)',
      'Write-off of uncollectible receivables (unusual amount): €20k (add back)',
      'Prior period accounting adjustment: adjust to normalize',
      'Extraordinary loss from business interruption: add back',
    ],
    marketRateLogic: 'No market rate - user judgment based on nature and recurrence likelihood of transactions.',
    validationRules: {
      min: -500000,
      max: 500000,
      warningThreshold: 50000,
      warningMessage: 'Unusual transaction adjustments >€50k require extensive documentation and clear explanation of non-recurring nature.',
    },
    helpText: 'Remove unusual items that distort EBITDA. Document why each item is truly unusual and non-recurring.',
  },
  
  {
    id: NormalizationCategory.TAX_OPTIMIZATION,
    label: 'Tax Optimization Reversal',
    description: 'Reverse aggressive tax optimization strategies',
    detailedDescription: 
      'SMEs often optimize for minimum taxes, not accurate EBITDA. Reverse strategies like excessive provisioning, accelerated expense recognition, income deferral, or aggressive bad debt reserves. The goal is to show economic earnings, not tax-minimized earnings.',
    examples: [
      'Excessive bad debt reserves beyond historical experience: +€10k',
      'Front-loaded marketing expenses (timing optimization): +€15k',
      'Delayed revenue recognition for tax purposes: -€20k',
      'Aggressive inventory write-downs: +€12k',
      'Excessive warranty or legal reserves: +€8k',
    ],
    marketRateLogic: 'Compare provisions and reserves to industry norms and historical company patterns. Typical reserves: 1-2% of revenue.',
    validationRules: {
      min: -100000,
      max: 100000,
      warningThreshold: 25000,
      warningMessage: 'Tax optimization reversals >€25k require comparison to industry norms and historical company averages.',
    },
    helpText: 'Reverse tax-motivated accounting policies to show economic reality. Requires accounting expertise.',
  },
  
  {
    id: NormalizationCategory.DISCRETIONARY_EXPENSES,
    label: 'Discretionary Expenses',
    description: 'Adjust discretionary spending above/below normal levels',
    detailedDescription: 
      'Discretionary expenses that vary with owner preference (charitable donations, excessive entertainment, luxury perks, club memberships, excessive vehicle costs) should be normalized to industry averages. While legitimate business expenses, they may be higher or lower than necessary based on owner preferences.',
    examples: [
      'Excessive entertainment expenses above industry norms: +€12k',
      'Owner\'s luxury car lease (personal portion): +€18k',
      'Excessive charitable donations: +€10k',
      'Country club memberships with limited business use: +€8k',
      'Premium office space beyond business needs: +€15k',
    ],
    marketRateLogic: 'Compare to industry average discretionary spending as % of revenue. Typical range: 0.5-2% of revenue depending on industry.',
    validationRules: {
      min: 0,
      max: 100000,
      warningThreshold: 20000,
      warningMessage: 'Discretionary expense adjustments >€20k require industry comparison data and clear business vs. personal allocation.',
    },
    helpText: 'Add back excessive discretionary spending that a new owner wouldn\'t incur. Focus on owner preference items.',
  },
  
  {
    id: NormalizationCategory.OTHER_ADJUSTMENTS,
    label: 'Other Adjustments',
    description: 'Other normalization adjustments not covered above',
    detailedDescription: 
      'Catch-all category for adjustments that don\'t fit other categories. This might include industry-specific adjustments, accounting policy changes, currency adjustments, or other unique items. Require detailed documentation as these will receive extra scrutiny from buyers.',
    examples: [
      'Industry-specific seasonal adjustment',
      'Accounting policy change impact',
      'Currency translation adjustment for multi-currency operations',
      'Normalization for company in transition',
      'Other justified economic adjustments',
    ],
    marketRateLogic: 'No standard logic - case-by-case evaluation required. Must be justified with clear rationale.',
    validationRules: {
      min: -500000,
      max: 500000,
      warningThreshold: 30000,
      warningMessage: 'Other adjustments >€30k require extremely detailed explanation and strong justification. Buyers will scrutinize these heavily.',
    },
    helpText: 'Use sparingly. Only for legitimate adjustments that don\'t fit other categories. Must be very well documented.',
  },
];

/**
 * Get category definition by ID
 */
export function getCategoryDefinition(categoryId: NormalizationCategory): NormalizationCategoryDefinition | undefined {
  return NORMALIZATION_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Get human-readable label for category
 */
export function getCategoryLabel(categoryId: NormalizationCategory): string {
  const definition = getCategoryDefinition(categoryId);
  return definition?.label || categoryId;
}

/**
 * Validate adjustment amount against category rules
 */
export function validateAdjustment(
  categoryId: NormalizationCategory,
  amount: number
): { valid: boolean; warning?: string; error?: string } {
  const definition = getCategoryDefinition(categoryId);
  if (!definition) {
    return { valid: false, error: 'Unknown category' };
  }
  
  const { validationRules } = definition;
  
  // Check min/max bounds
  if (amount < validationRules.min || amount > validationRules.max) {
    return {
      valid: false,
      error: `Amount must be between €${validationRules.min.toLocaleString()} and €${validationRules.max.toLocaleString()}`,
    };
  }
  
  // Check warning threshold
  if (validationRules.warningThreshold && Math.abs(amount) > validationRules.warningThreshold) {
    return {
      valid: true,
      warning: validationRules.warningMessage,
    };
  }
  
  return { valid: true };
}
