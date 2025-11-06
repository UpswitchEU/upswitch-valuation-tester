# Valuation Calculation Audit Report
**Date:** January 2025  
**Auditor:** Senior McKinsey Valuation Expert / Senior CTO  
**Valuation ID:** #500  
**Company:** Domotics Installation Inc.

## Executive Summary

This audit verifies the valuation calculation for Domotics Installation Inc., an electrical services company with €951K revenue and €163K EBITDA. The valuation shows a mid-point equity value of €483,132 with 73% confidence.

### Key Findings

✅ **CORRECT:**
- Enterprise Value calculation (€847,600) is mathematically correct
- DCF exclusion logic is correct per McKinsey standards (<€5M revenue threshold)
- Multiples selection (1.2x revenue, 5.2x EBITDA) appears reasonable for home-services industry
- Build errors have been fixed - frontend compiles successfully

⚠️ **REQUIRES INVESTIGATION:**
- **CRITICAL:** Equity value (€483K) is 57% of enterprise value (€847.6K) - significant discrepancy
- **CRITICAL:** CAGR calculation shows 11.1% but manual calculation yields 0.37% - formula or data issue
- Owner concentration adjustments may explain equity value reduction but need verification

---

## Phase 1: Build Fixes ✅ COMPLETE

### TypeScript Errors Fixed

1. **AIAssistedValuation.tsx**
   - Fixed `collected_data` property access using proper type narrowing
   - Fixed function declaration order issues

2. **RangeCalculationSection.tsx**
   - Fixed JSX structure error (ternary operator missing fragment wrapper)

3. **MultiplesTransparencySection.tsx**
   - Fixed undefined `adjustedRevenueMultiple` and `adjustedEbitdaMultiple` variables
   - Added `risk_level` property to `owner_concentration` type
   - Added `enterprise_value` property to `multiples_valuation` type

4. **ValuationForm.tsx**
   - Fixed boolean type conversion issue

**Result:** Build now completes successfully with zero TypeScript errors.

---

## Phase 2: Input Data Verification

### Given Data
- **Company:** Domotics Installation Inc.
- **Business Type:** Electrical Services (ID: `electrical`)
- **Industry:** Home Services
- **Country:** Belgium (€)
- **Revenue (2025):** €951,000
- **EBITDA (2025):** €163,000
- **EBITDA Margin:** 17.1% (163,000 / 951,000) ✓
- **Historical Data:**
  - 2023: Revenue €944,000, EBITDA €262,000
  - 2024: Revenue €1,188,000, EBITDA €144,000
- **Founding Year:** 2015
- **Equity Stake:** 100%
- **Active Owner-Managers:** 2
- **FTE Employees:** Not provided

### Data Quality Assessment
✅ Revenue and EBITDA provided  
✅ Industry selected  
✅ Business model selected  
✅ Founding year provided  
✅ Historical data provided (2 years)  
✅ Data quality score: 100%

---

## Phase 3: Multiples Selection Audit

### Reported Multiples
- **Revenue Multiple:** 1.2x
- **EBITDA Multiple:** 5.2x
- **Comparables:** 15 similar companies

### Verification

**Source Priority (from code):**
1. Business type DB multiples (if UUID provided)
2. Business-type hardcoded defaults
3. Industry multiples from business rules
4. Hardcoded fallback defaults

**Industry Benchmarks (Home Services):**
- Revenue Multiple: 0.8-1.5x (1.2x is within range) ✓
- EBITDA Multiple: 5.0-8.0x (5.2x is within range) ✓

**Assessment:** Multiples appear reasonable for home-services/electrical services industry. The 1.2x revenue multiple is conservative, and 5.2x EBITDA multiple is appropriate for a service business with 17.1% EBITDA margin.

**Recommendation:** Verify that electrical services has specific multiples in database, or confirm industry mapping to home-services is correct.

---

## Phase 4: Enterprise Value Calculation

### Reported Result
**Enterprise Value:** €847,600

### Calculation Verification

**Method 1: EBITDA-Based (Primary)**
```
EV = EBITDA × EBITDA Multiple
EV = €163,000 × 5.2
EV = €847,600 ✓ CORRECT
```

**Method 2: Revenue-Based (Secondary)**
```
EV = Revenue × Revenue Multiple
EV = €951,000 × 1.2
EV = €1,141,200
```

**Weighted Average (if both used):**
- From `multiples_engine.py`: 60% EBITDA, 30% Revenue
- Weighted: (847,600 × 0.6) + (1,141,200 × 0.3) = €850,920

**Actual Calculation:**
The report shows €847,600, which matches the EBITDA-based calculation exactly. This indicates the system used EBITDA multiple as the primary method, which is correct for a profitable company.

**Conclusion:** ✅ Enterprise Value calculation is **MATHEMATICALLY CORRECT**

---

## Phase 5: Equity Value Calculation ⚠️ DISCREPANCY

### Reported Result
**Equity Value (Mid-Point):** €483,132

### Expected Calculation
```
Equity Value = Enterprise Value - Net Debt + Cash
Equity Value = €847,600 - Net Debt + Cash
```

**If no debt/cash data provided:**
- Expected: Equity Value ≈ Enterprise Value = €847,600
- Actual: €483,132
- **Discrepancy: €364,468 (43% reduction)**

### Possible Explanations

1. **Owner Concentration Adjustment**
   - 2 active owner-managers
   - FTE employees: Not provided (required for calculation)
   - Owner/employee ratio cannot be calculated without employee count
   - **Status:** Cannot verify without employee data

2. **Small Firm Discount**
   - Revenue €951K is <€5M threshold
   - Small firm discounts typically 10-20%
   - Would explain part but not all of the reduction

3. **Net Debt**
   - If company has significant debt: Net Debt = €364,468
   - This would be 38% of revenue, which is high but possible

4. **Other Adjustments**
   - Size discount
   - Liquidity discount
   - Country adjustment
   - Growth premium/discount

### Code Analysis

From `multiples_calculator.py` line 506:
```python
equity_value = enterprise_value - net_debt + cash
```

The code returns `adjusted_equity_value` which may include owner concentration adjustments. The adjustment factor from owner concentration can be -7% to -20% depending on owner/employee ratio.

**Recommendation:** 
1. Verify if employee count was provided in the request
2. Check if owner concentration adjustment was applied
3. Verify net debt calculation
4. Review all adjustment factors applied

---

## Phase 6: Valuation Range

### Reported Range
- **Low:** €361,383
- **Mid:** €483,132
- **High:** €604,881
- **Range Width:** ±25% (based on 73% confidence)

### Calculation Verification

**Range Width:**
```
Total Range = High - Low = €604,881 - €361,383 = €243,498
Range as % of Mid = €243,498 / €483,132 = 50.4%
±25.2% each side
```

**Confidence-Based Ranges (PwC Standards):**
- High Confidence (>80%): ±12% spread
- Medium Confidence (60-80%): ±18% spread
- Low Confidence (<60%): ±22% spread

**Reported:** 73% confidence with ±25% spread

**Assessment:** The ±25% spread is wider than the typical ±18% for medium confidence (60-80%). This may be due to:
- Data quality factors
- Methodology limitations (Multiples only, no DCF)
- Market uncertainty

**Conclusion:** Range width is reasonable but on the wider side for 73% confidence. Verify range calculation methodology matches PwC standards.

---

## Phase 7: DCF Exclusion Logic

### Reported
"Market Multiples only" - DCF excluded

### Code Verification

From `valuation_orchestrator.py` line 699-762:
```python
def _should_calculate_dcf(self, request: ValuationRequest) -> tuple[bool, Optional[str]]:
    revenue = request.current_year_data.revenue
    
    # Exclude DCF for small companies (€1M-€5M) per McKinsey standards
    if revenue < 5_000_000:
        return False, f"Revenue €{revenue:,.0f} below €5M threshold (DCF not reliable for small companies, Multiples more accurate per McKinsey standards)"
```

**Given Data:**
- Revenue: €951,000
- Threshold: €5,000,000
- €951,000 < €5,000,000 ✓

**Conclusion:** ✅ DCF exclusion is **CORRECT** per McKinsey standards. Revenue below €5M threshold correctly triggers DCF exclusion.

**Business Context Preferences:**
- `dcfPreference`: 0.40
- `multiplesPreference`: 0.80
- These preferences were correctly overridden by the small firm exclusion logic.

---

## Phase 8: Confidence Score (73%)

### Reported
**Confidence Score:** 73%

### Code Analysis

From `confidence_scorer.py`:
- Base confidence for Multiples-only: 0.75 (75%)
- Factors affecting confidence:
  - Data completeness
  - Financial health
  - Market data quality
  - Historical data availability

**Given Factors:**
- ✅ Revenue & EBITDA provided
- ✅ Industry selected
- ✅ Business model selected
- ✅ Founding year provided
- ✅ Historical data provided (2 years)
- ⚠️ Employee count missing (affects owner concentration calculation)
- ⚠️ DCF excluded (reduces methodology agreement)

**Assessment:** 73% confidence is reasonable for:
- Multiples-only methodology (base 75%)
- Good data completeness (100%)
- Missing employee data (reduces confidence slightly)
- Limited historical data (2 years vs 3+ preferred)

**Conclusion:** ✅ Confidence score of 73% is **REASONABLE**

---

## Phase 9: Growth Metrics ⚠️ DISCREPANCY

### Reported
**CAGR:** 11.1% over 2 years

### Manual Calculation

**Given Data:**
- 2023 Revenue: €944,000
- 2025 Revenue: €951,000
- Periods: 2 years

**CAGR Formula:**
```
CAGR = (Ending Value / Beginning Value)^(1/periods) - 1
CAGR = (951,000 / 944,000)^(1/2) - 1
CAGR = (1.0074)^0.5 - 1
CAGR = 1.0037 - 1
CAGR = 0.0037 = 0.37%
```

**Reported:** 11.1%  
**Calculated:** 0.37%  
**Discrepancy:** 10.73 percentage points

### Possible Explanations

1. **Wrong Years Used**
   - If using 2024→2025: (951,000 / 1,188,000) - 1 = -20.0% (negative)
   - If using 2023→2024: (1,188,000 / 944,000) - 1 = 25.8% (too high)

2. **Wrong Formula**
   - Simple average growth: ((25.8% + (-20.0%)) / 2) = 2.9% (still not 11.1%)
   - Geometric mean: √(1.258 × 0.8008) - 1 = 0.006 = 0.6% (still not 11.1%)

3. **Different Data Source**
   - May be using different revenue figures
   - May be calculating from EBITDA instead of revenue

### Code Analysis

From `financial_metrics.py` line 302:
```python
cagr = (ending_revenue / beginning_revenue) ** (1.0 / periods) - 1.0
```

From `metrics_builder.py` line 75:
```python
revenue_cagr_3y = ((revenue / first_revenue) ** (1.0 / periods) - 1.0) * 100
```

**Issue:** The code calculates periods as `len(request.historical_years_data)`, which would be 2 for [2023, 2024]. But the actual periods between 2023 and 2025 should be 2, which is correct.

**Recommendation:**
1. Verify which years are being used in the CAGR calculation
2. Check if the calculation is using EBITDA CAGR instead of revenue CAGR
3. Verify the periods calculation is correct
4. Add logging to track CAGR calculation inputs

---

## Phase 10: Methodology Selection

### Reported
**Methodology:** HYBRID (but DCF excluded = Multiples only)

### Code Verification

From `valuation_orchestrator.py`:
1. Methodology determined as "HYBRID" based on `use_dcf=True` and `use_multiples=True`
2. DCF exclusion check runs: Revenue <€5M → DCF excluded
3. Weights set: `dcf_weight=0.0`, `multiples_weight=1.0`
4. Only multiples calculation executed

**Assessment:** ✅ Logic is correct. HYBRID methodology was selected, but DCF was correctly excluded due to small firm effect, resulting in Multiples-only execution.

---

## Phase 11: Code Quality Review

### Strengths
1. ✅ Clear separation of concerns (calculators, orchestrators, validators)
2. ✅ Comprehensive logging for debugging
3. ✅ Proper error handling with fallbacks
4. ✅ Type safety with proper type definitions
5. ✅ Documentation in code comments

### Areas for Improvement
1. ⚠️ CAGR calculation needs verification - discrepancy found
2. ⚠️ Equity value calculation needs transparency - large discrepancy from EV
3. ⚠️ Owner concentration adjustment calculation needs employee data validation
4. ⚠️ Range calculation methodology should be more explicit

---

## Phase 12: Industry Standards Compliance

### McKinsey Standards ✅
- ✅ Small firm effect handling (<€5M revenue)
- ✅ DCF exclusion for small companies
- ✅ Multiples selection methodology
- ✅ Confidence scoring approach

### PwC Standards ⚠️
- ⚠️ Range calculation methodology needs verification
- ⚠️ Transparency reporting could be more detailed
- ⚠️ Range width (±25%) is wider than typical for 73% confidence

---

## Critical Issues Requiring Immediate Attention

### 1. Equity Value Discrepancy (CRITICAL)
**Issue:** Equity value (€483K) is 57% of enterprise value (€847.6K)  
**Impact:** High - affects final valuation  
**Action Required:**
- Verify if employee count was provided
- Check owner concentration adjustment calculation
- Verify net debt calculation
- Review all adjustment factors

### 2. CAGR Calculation Discrepancy (HIGH)
**Issue:** Reported CAGR (11.1%) vs calculated (0.37%)  
**Impact:** Medium - affects growth metrics display  
**Action Required:**
- Verify CAGR calculation formula
- Check which years are being used
- Verify if EBITDA CAGR is being displayed instead of revenue CAGR
- Add validation logging

### 3. Range Width Verification (MEDIUM)
**Issue:** ±25% spread is wider than typical for 73% confidence  
**Impact:** Low - affects range interpretation  
**Action Required:**
- Verify range calculation methodology
- Confirm PwC standards compliance
- Review confidence-to-range mapping

---

## Recommendations

### Immediate Actions
1. **Fix CAGR Calculation**
   - Add logging to track CAGR inputs
   - Verify formula and year selection
   - Test with known data

2. **Clarify Equity Value Calculation**
   - Add transparency logging for all adjustments
   - Document owner concentration adjustment calculation
   - Verify employee count requirement

3. **Improve Range Calculation Documentation**
   - Document range methodology explicitly
   - Verify PwC standards compliance
   - Add confidence-to-range mapping explanation

### Long-Term Improvements
1. Add comprehensive unit tests for all calculations
2. Implement calculation transparency logging
3. Add validation warnings for missing critical data
4. Document all adjustment factors and their impact

---

## Conclusion

The valuation calculation is **mostly correct** with two critical discrepancies requiring investigation:

1. ✅ Enterprise Value: **CORRECT** (€847,600)
2. ⚠️ Equity Value: **REQUIRES INVESTIGATION** (€483,132 vs expected ~€847,600)
3. ⚠️ CAGR: **REQUIRES FIX** (11.1% vs calculated 0.37%)
4. ✅ DCF Exclusion: **CORRECT** (per McKinsey standards)
5. ✅ Confidence Score: **REASONABLE** (73%)
6. ✅ Multiples Selection: **REASONABLE** (1.2x revenue, 5.2x EBITDA)

**Overall Assessment:** The core calculation logic is sound, but transparency and validation improvements are needed to explain the equity value discrepancy and fix the CAGR calculation.

---

**Report Generated:** January 2025  
**Next Review:** After fixes implemented

