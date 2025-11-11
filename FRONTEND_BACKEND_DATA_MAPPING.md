# Frontend-Backend Data Mapping Documentation

**Date:** January 2025  
**Purpose:** Complete mapping between backend modular calculation system and frontend display

---

## Overview

This document maps all backend data structures to frontend display components, ensuring complete transparency and synchronization between the refactored backend and frontend tester.

---

## Backend Response Structure

### 1. Modular System Object

**Location:** `result.modular_system`

```typescript
interface ModularSystem {
  enabled: boolean;
  total_steps: number;
  steps_completed: number;
  steps_skipped: number;
  steps_failed?: number;
  total_execution_time_ms: number;
  step_details: StepDetail[];
}
```

**Frontend Usage:**
- Primary source for step execution metadata
- Used in main report for calculation journey overview
- Used in info tab for step status indicators

**Fallback:** `transparency.calculation_steps` → legacy fields

---

### 2. Transparency Report

**Location:** `result.transparency` or `result.transparency_report`

```typescript
interface TransparencyData {
  calculation_steps: EnhancedCalculationStep[];
  data_sources: DataSource[];
  confidence_breakdown: ConfidenceBreakdown;
  range_methodology: RangeMethodology;
  adjustments_applied?: AdjustmentDetail[];
  standards_compliance?: string[];
  methodology_statement?: string;
  academic_sources?: AcademicSource[];
  professional_review_ready?: ProfessionalReviewReady;
}
```

**Frontend Usage:**
- Secondary source for step data (fallback from modular_system)
- Used for transparency report display
- Used for academic sources and methodology statement

---

### 3. Enhanced Calculation Steps

**Location:** `transparency.calculation_steps[]` or `modular_system.step_details[]`

```typescript
interface EnhancedCalculationStep {
  step: number; // 0-11
  step_number?: number; // Alias
  name: string;
  description: string;
  status: 'completed' | 'skipped' | 'failed' | 'not_executed';
  execution_time_ms: number;
  key_outputs?: Record<string, any>;
  reason?: string; // Skip reason
  error?: string; // Error message
  methodology_note?: string;
  formula?: string; // Legacy
  inputs?: Record<string, any>; // Legacy
  outputs?: Record<string, any>; // Legacy
  explanation?: string; // Legacy
}
```

**Frontend Usage:**
- Info tab: Step-by-step display
- Main report: Calculation journey overview
- Status indicators throughout UI

---

## Step-by-Step Data Mapping

### Step 0: Data Quality Assessment

**Backend Source:**
- `modular_system.step_details[0]` (primary)
- `transparency.calculation_steps[0]` (fallback)
- `transparency.confidence_breakdown.data_quality` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep0_HistoricalTrends.tsx` (or new component)
- Main Report: Data Quality & Confidence section

**Data Fields:**
- `quality_score`: Overall quality score (0-100)
- `dimension_scores`: 5-dimension breakdown
- `dcf_eligible`: DCF eligibility boolean
- `warnings`: Quality warnings array
- `status`: Step execution status
- `execution_time_ms`: Execution time

**Missing Data Handling:**
- If step not found: Show "Not Available" with explanation
- If status is 'skipped': Show skip reason
- If status is 'failed': Show error message

---

### Step 1: Input Data & Business Profile

**Backend Source:**
- `modular_system.step_details[1]`
- `transparency.calculation_steps[1]`
- `result.current_year_data` (legacy)
- `result.financial_metrics` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep1_Inputs.tsx`
- Main Report: High-level summary

**Data Fields:**
- `revenue`: Current year revenue
- `ebitda`: Current year EBITDA
- `ebitda_margin`: EBITDA margin percentage
- `weighted_revenue`: Weighted average revenue (if available)
- `weighted_ebitda`: Weighted average EBITDA (if available)
- `using_weighted_metrics`: Boolean flag
- `company_name`, `industry`, `country`, `founded_year`, `num_employees`

**Missing Data Handling:**
- Weighted metrics: Show "Not Available" if not calculated
- Fallback to current year data if weighted not available

---

### Step 2: Industry Benchmarking

**Backend Source:**
- `modular_system.step_details[2]`
- `transparency.calculation_steps[2]`
- `result.multiples_valuation` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep2_Benchmarking.tsx`
- Main Report: Methodology Breakdown section

**Data Fields:**
- `primary_method`: 'EV/EBITDA' or 'EV/Revenue'
- `primary_method_reason`: Explanation
- `ev_ebitda_multiple`: EBITDA multiple
- `ev_revenue_multiple`: Revenue multiple
- `p25_ebitda_multiple`, `p50_ebitda_multiple`, `p75_ebitda_multiple`: Percentiles
- `p25_revenue_multiple`, `p50_revenue_multiple`, `p75_revenue_multiple`: Percentiles
- `comparables_count`: Number of comparables found
- `data_source`: Source of multiples data
- `dcf_eligible`: DCF eligibility (from Step 0)
- `suitability_score`: DCF suitability score breakdown
- `methodology_decision`: 'MULTIPLES_ONLY' | 'HYBRID_MULTIPLES_PRIMARY' | 'HYBRID_DCF_PRIMARY'

**Missing Data Handling:**
- If no comparables: Show "Using industry benchmarks"
- If percentiles missing: Show estimated values with note

---

### Step 3: Base Enterprise Value

**Backend Source:**
- `modular_system.step_details[3]`
- `transparency.calculation_steps[3]`
- `result.multiples_valuation.enterprise_value` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep3_BaseEV.tsx`
- Main Report: Calculation Journey Overview

**Data Fields:**
- `enterprise_value_low`: Low estimate
- `enterprise_value_mid`: Mid-point
- `enterprise_value_high`: High estimate
- `metric_used`: 'Revenue' or 'EBITDA'
- `metric_value`: Actual metric value
- `multiple_low`, `multiple_mid`, `multiple_high`: Multiples used
- `percentile_source`: 'real' or 'estimated'

**Missing Data Handling:**
- If range invalid: Show auto-correction note
- If percentiles missing: Show estimated with warning

---

### Step 4: Owner Concentration Adjustment

**Backend Source:**
- `modular_system.step_details[4]`
- `transparency.calculation_steps[4]`
- `result.multiples_valuation.owner_concentration` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep4_OwnerConcentration.tsx`
- Main Report: Adjustments Summary section

**Data Fields:**
- `owner_employee_ratio`: Ratio calculation
- `adjustment_percentage`: Adjustment factor (decimal)
- `risk_level`: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- `calibration_type`: 'industry-specific' | 'universal'
- `business_type_id`: Business type used for calibration
- `owner_dependency_impact`: Calibration factor
- `ev_before`: Enterprise value before adjustment
- `ev_after`: Enterprise value after adjustment

**Missing Data Handling:**
- If step skipped: Show skip reason (e.g., "Insufficient data")
- If calibration not available: Show "Universal calibration used"

---

### Step 5: Size Discount

**Backend Source:**
- `modular_system.step_details[5]`
- `transparency.calculation_steps[5]`
- `result.multiples_valuation.size_discount` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep5_SizeDiscount.tsx`
- Main Report: Adjustments Summary section

**Data Fields:**
- `revenue_tier`: Size tier determination
- `base_discount`: Base discount from tier
- `business_type_multiplier`: Business-type adjustment
- `sole_trader_adjustment`: Additional discount for sole traders
- `size_discount_percentage`: Final discount (decimal)
- `ev_before`: Enterprise value before adjustment
- `ev_after`: Enterprise value after adjustment

**Missing Data Handling:**
- If step skipped: Show skip reason
- If tier not determined: Show "Standard discount applied"

---

### Step 6: Liquidity Discount

**Backend Source:**
- `modular_system.step_details[6]`
- `transparency.calculation_steps[6]`
- `result.multiples_valuation.liquidity_discount` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep6_LiquidityDiscount.tsx`
- Main Report: Adjustments Summary section

**Data Fields:**
- `base_discount`: Business-type-specific base discount
- `margin_bonus`: Profitability adjustment
- `growth_bonus`: Growth rate adjustment
- `recurring_revenue_bonus`: Recurring revenue adjustment
- `size_bonus`: Company size adjustment
- `total_discount_percentage`: Final discount (decimal)
- `ev_before`: Enterprise value before adjustment
- `ev_after`: Enterprise value after adjustment

**Missing Data Handling:**
- If adjustments not available: Show base discount only
- If step skipped: Show skip reason

---

### Step 7: EV to Equity Conversion

**Backend Source:**
- `modular_system.step_details[7]`
- `transparency.calculation_steps[7]`
- `result.equity_value_mid` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep7_EVToEquity.tsx`
- Main Report: Calculation Journey Overview

**Data Fields:**
- `enterprise_value_mid`: Source EV value
- `total_debt`: Total debt amount
- `cash`: Cash and cash equivalents
- `operating_cash`: Operating cash threshold (if exemption applied)
- `excess_cash`: Excess cash (cash - operating_cash)
- `net_debt`: Net debt calculation
- `equity_value_low`: Low equity value
- `equity_value_mid`: Mid equity value
- `equity_value_high`: High equity value
- `exemption_applied`: Boolean flag
- `exemption_rationale`: Explanation

**Missing Data Handling:**
- If balance sheet data missing: Show "Using default assumptions"
- If negative equity: Show warning and explanation

---

### Step 8: Ownership Adjustment

**Backend Source:**
- `modular_system.step_details[8]`
- `transparency.calculation_steps[8]`
- `result.ownership_adjustment` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep8_OwnershipAdjustment.tsx`
- Main Report: Adjustments Summary section

**Data Fields:**
- `ownership_percentage`: Shares for sale percentage
- `adjustment_type`: 'control_premium' | 'minority_discount' | 'deadlock_discount'
- `adjustment_percentage`: Adjustment factor
- `business_type_calibration`: Business-type-specific adjustment
- `revenue_adjustment`: Revenue-based adjustment
- `equity_before`: Equity value before adjustment
- `equity_after`: Equity value after adjustment
- `tier_description`: Tier explanation

**Missing Data Handling:**
- If step skipped: Show skip reason (e.g., "100% ownership" or "Not applicable")
- If 50% ownership: Show deadlock risk explanation

---

### Step 9: Confidence Score Analysis

**Backend Source:**
- `modular_system.step_details[9]`
- `transparency.calculation_steps[9]`
- `result.confidence_score` (legacy)
- `result.transparency.confidence_breakdown` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep9_ConfidenceScore.tsx`
- Main Report: Data Quality & Confidence section

**Data Fields:**
- `overall_confidence_score`: Overall score (0-100)
- `confidence_level`: 'HIGH' | 'MEDIUM' | 'LOW'
- `factor_scores`: 8-factor breakdown:
  - `data_quality`: 20% weight
  - `historical_data`: 15% weight
  - `methodology_agreement`: 10% weight
  - `industry_benchmarks`: 15% weight
  - `company_profile`: 15% weight
  - `market_conditions`: 10% weight
  - `geographic_data`: 7.5% weight
  - `business_model_clarity`: 7.5% weight
- `quality_checkpoint`: Quality validation result

**Missing Data Handling:**
- If factors missing: Show default values with note
- If checkpoint failed: Show warning

---

### Step 10: Range Methodology Selection

**Backend Source:**
- `modular_system.step_details[10]`
- `transparency.calculation_steps[10]`
- `result.range_methodology` (legacy)

**Frontend Display:**
- Info Tab: `JourneyStep10_RangeMethodology.tsx`
- Main Report: Calculation Journey Overview

**Data Fields:**
- `methodology`: 'Multiple Dispersion' | 'Confidence Spread' | 'Asymmetric Range'
- `equity_low`: Low valuation
- `equity_mid`: Mid valuation
- `equity_high`: High valuation
- `percentile_ratios`: If dispersion used
- `confidence_spread`: If confidence spread used
- `asymmetric_factors`: If asymmetric used
- `business_type_multipliers`: Business-type adjustments
- `growth_adjustments`: Growth rate adjustments
- `profitability_adjustments`: Profitability adjustments

**Missing Data Handling:**
- If methodology not determined: Show "Confidence Spread (default)"
- If range invalid: Show auto-correction note

---

### Step 11: Final Valuation Synthesis

**Backend Source:**
- `modular_system.step_details[11]`
- `transparency.calculation_steps[11]`
- `result.equity_value_low/mid/high` (legacy)
- `result.methodology_statement` (new)
- `result.academic_sources` (new)
- `result.professional_review_ready` (new)

**Frontend Display:**
- Info Tab: `JourneyStep11_FinalValuation.tsx`
- Main Report: High-level summary

**Data Fields:**
- `valuation_low`: Final low estimate
- `valuation_mid`: Final mid-point
- `valuation_high`: Final high estimate
- `confidence_score`: Final confidence score
- `methodology_statement`: Full methodology statement
- `academic_sources`: Array of academic sources
- `professional_review_ready`: Review readiness assessment
- `value_chain_validated`: Value chain consistency check
- `rounding_impact`: Rounding impact details

**Missing Data Handling:**
- If transparency report missing: Show basic summary
- If academic sources missing: Show default sources

---

## Data Source Priority

### Priority Order (Highest to Lowest):

1. **`modular_system.step_details[N]`** - Primary source for step metadata
2. **`transparency.calculation_steps[N]`** - Secondary source for step data
3. **Legacy fields** - Fallback for backward compatibility

### Extraction Utility:

Use `valuationDataExtractor.ts` utilities:
- `getStepData(result, stepNumber)` - Get step data with fallback
- `getStepResultData(result, stepNumber)` - Get step calculation results
- `getStepStatus(result, stepNumber)` - Get step status
- `getStepExecutionTime(result, stepNumber)` - Get execution time

---

## Missing Data Handling

### Strategy:

1. **Step Not Found:**
   - Show step with "Not Executed" status
   - Display explanation: "Step not executed in this calculation"

2. **Step Skipped:**
   - Show step with "Skipped" status
   - Display skip reason from `reason` field
   - Example: "Skipped: Insufficient data" or "Skipped: Not applicable for this business type"

3. **Step Failed:**
   - Show step with "Failed" status
   - Display error message from `error` field
   - Show fallback values if available

4. **Data Field Missing:**
   - Show "Not Available" with explanation
   - Use estimated values with warning if appropriate
   - Never break UI - always show something meaningful

---

## Frontend Components Mapping

### Main Report (Preview Right Panel):

- **High-Level Summary:** `ProgressiveValuationReport.tsx` or `LiveValuationReport.tsx`
- **Calculation Journey Overview:** `CalculationJourneyOverview.tsx` (new)
- **Methodology Breakdown:** `MethodologyBreakdown.tsx` (new)
- **Adjustments Summary:** `AdjustmentsSummary.tsx` (new)
- **Data Quality & Confidence:** `DataQualityConfidence.tsx` (new)

### Info Tab (Step-by-Step):

- **Step 0:** `JourneyStep0_HistoricalTrends.tsx` (enhance or create new)
- **Step 1:** `JourneyStep1_Inputs.tsx` (enhance)
- **Step 2:** `JourneyStep2_Benchmarking.tsx` (enhance)
- **Step 3:** `JourneyStep3_BaseEV.tsx` (enhance)
- **Step 4:** `JourneyStep4_OwnerConcentration.tsx` (enhance)
- **Step 5:** `JourneyStep5_SizeDiscount.tsx` (enhance)
- **Step 6:** `JourneyStep6_LiquidityDiscount.tsx` (enhance)
- **Step 7:** `JourneyStep7_EVToEquity.tsx` (enhance)
- **Step 8:** `JourneyStep8_OwnershipAdjustment.tsx` (enhance)
- **Step 9:** `JourneyStep9_ConfidenceScore.tsx` (enhance)
- **Step 10:** `JourneyStep10_RangeMethodology.tsx` (enhance)
- **Step 11:** `JourneyStep11_FinalValuation.tsx` (enhance)

### Shared Components:

- **StepStatusIndicator:** `StepStatusIndicator.tsx` (new)
- **StepMetadata:** `StepMetadata.tsx` (new)
- **AcademicSources:** `AcademicSources.tsx` (new)
- **MethodologyStatement:** `MethodologyStatement.tsx` (new)
- **ProfessionalReviewReadiness:** `ProfessionalReviewReadiness.tsx` (new)

---

## Testing Checklist

- [ ] All 12 steps display correctly with modular_system data
- [ ] Fallback to transparency.calculation_steps works
- [ ] Legacy fields still work for backward compatibility
- [ ] Skipped steps show skip reason
- [ ] Failed steps show error message
- [ ] Missing data fields show "Not Available" gracefully
- [ ] Execution times display correctly
- [ ] Status indicators are accurate
- [ ] Main report and info tab show identical data
- [ ] All formulas and calculations match backend

---

## Notes

- Always use `valuationDataExtractor.ts` utilities for data access
- Never access backend fields directly - use extraction functions
- Always handle missing data gracefully
- Show status indicators for all steps
- Display execution times when available
- Link to academic sources for all methodologies
- Show methodology statement prominently
- Display professional review readiness status

---

**Last Updated:** January 2025  
**Maintained by:** UpSwitch CTO Team

