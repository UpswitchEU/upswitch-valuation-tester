# Valuation Engine Integration - Testing Guide

**Date:** January 2025  
**Purpose:** Comprehensive testing guide for backend-frontend integration  
**Audience:** QA Engineers, Developers, Valuation Experts

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Expert Validation](#expert-validation)
6. [Performance Testing](#performance-testing)
7. [Test Scenarios](#test-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Testing Overview

### Objectives
- Verify backend generates complete transparency data for all 12 steps
- Verify frontend displays all backend data without errors
- Validate calculation accuracy against McKinsey/Bain standards
- Ensure professional review readiness

### Test Pyramid
```
         ┌─────────────────┐
         │  Expert Review  │  ← Manual validation by valuation experts
         │   (1-2 days)    │
         └─────────────────┘
              ┌─────────────────────┐
              │ Integration Testing │  ← End-to-end user flows
              │     (4-6 hours)     │
              └─────────────────────┘
                    ┌───────────────────────┐
                    │   Component Testing   │  ← UI component validation
                    │     (2-3 hours)       │
                    └───────────────────────┘
                          ┌─────────────────────────┐
                          │     Unit Testing        │  ← Data extraction functions
                          │      (1-2 hours)        │
                          └─────────────────────────┘
```

---

## Backend Testing

### Test 1: API Response Structure Validation

**Objective:** Verify backend returns complete transparency data

**Endpoint:** `POST /api/v1/valuation/calculate`

**Test Data:**
```json
{
  "company_name": "Test Company A",
  "industry": "professional-services",
  "country": "BE",
  "current_year_data": {
    "year": 2024,
    "revenue": 1000000,
    "ebitda": 100000,
    "total_debt": 50000,
    "cash": 20000,
    "number_of_employees": 5
  },
  "number_of_owners": 2,
  "shares_for_sale": 100
}
```

**Expected Response Fields:**
- `transparency` (object)
- `transparency.calculation_steps` (array with 12 elements)
- `modular_system` (object)
- `modular_system.step_details` (array with 12 elements)

**Validation Script:**
```bash
# Test API response
curl -X POST http://localhost:8000/api/v1/valuation/calculate \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  | jq '.transparency.calculation_steps | length'

# Expected output: 12
```

**Assertions:**
```python
# Python test
def test_transparency_data_complete(response):
    assert 'transparency' in response
    assert 'calculation_steps' in response['transparency']
    assert len(response['transparency']['calculation_steps']) == 12
    
    # Check each step has required fields
    for step in response['transparency']['calculation_steps']:
        assert 'step' in step or 'step_number' in step
        assert 'name' in step
        assert 'status' in step
        assert 'key_outputs' in step or 'outputs' in step
        
        # If step completed, must have key_outputs
        if step['status'] == 'completed':
            assert 'key_outputs' in step
            assert len(step['key_outputs']) > 0
```

---

### Test 2: Step 11 Transparency Report Extraction

**Objective:** Verify Step 11 generates comprehensive transparency report

**Backend Log Checks:**
```bash
# Check logs for transparency extraction
grep "✅ Transparency report extracted from Step 11" backend.log

# Expected: Should find this log message
# Should also show:
# - has_calculation_steps: True
# - calculation_steps_count: 12
# - has_confidence_breakdown: True
```

**Assertions:**
- Step 11 result includes `transparency_report` field
- `transparency_report.calculation_steps` has 12 elements
- Each step in calculation_steps has comprehensive `key_outputs`

---

### Test 3: Step-by-Step Data Completeness

**Objective:** Verify each of the 12 steps returns complete data

**Test Script:**
```python
def test_step_data_completeness(response):
    steps = response['transparency']['calculation_steps']
    
    # Step 0: Data Quality
    step0 = next((s for s in steps if s['step'] == 0), None)
    assert step0 is not None
    assert 'quality_score' in step0['key_outputs']
    assert 'dimension_scores' in step0['key_outputs']
    assert 'dcf_eligible' in step0['key_outputs']
    
    # Step 1: Input Validation
    step1 = next((s for s in steps if s['step'] == 1), None)
    assert step1 is not None
    assert 'revenue' in step1['key_outputs']
    assert 'ebitda' in step1['key_outputs']
    
    # Step 2: Industry Benchmarking
    step2 = next((s for s in steps if s['step'] == 2), None)
    assert step2 is not None
    assert 'primary_method' in step2['key_outputs']
    assert 'ev_ebitda_multiple' in step2['key_outputs']
    
    # Step 3: Base Enterprise Value
    step3 = next((s for s in steps if s['step'] == 3), None)
    assert step3 is not None
    assert 'enterprise_value_low' in step3['key_outputs']
    assert 'enterprise_value_mid' in step3['key_outputs']
    assert 'enterprise_value_high' in step3['key_outputs']
    
    # ... Continue for all 12 steps
```

---

### Test 4: Multiple Company Profiles

**Objective:** Test with diverse company scenarios

**Test Cases:**
1. **Micro Company (< €1M revenue)**
   - Revenue: €500K
   - EBITDA: €50K
   - Expected: Size discount applied, simplified methodology
   
2. **Small Company (€1M-€5M)**
   - Revenue: €2M
   - EBITDA: €200K
   - Expected: All adjustments applied, full methodology
   
3. **Unprofitable Company**
   - Revenue: €1M
   - EBITDA: -€50K (negative)
   - Expected: Revenue multiple used, specific warnings

4. **High Owner Concentration**
   - Revenue: €1M
   - Employees: 2
   - Owners: 2
   - Expected: Owner concentration adjustment applied

5. **Partial Sale**
   - Shares for sale: 51%
   - Expected: Ownership adjustment applied (control premium)

**Validation:**
- All scenarios return complete 12-step data
- No backend errors or warnings
- Appropriate steps skipped when not applicable
- Skip reasons clearly documented

---

## Frontend Testing

### Test 5: Main Report Preview Panel Display

**Objective:** Verify all main report components display correctly

**Test Steps:**
1. Open tester at `/reports/{valuation_id}?flow=manual`
2. Navigate to "Preview" tab
3. Verify following components visible:
   - ResultsHeader with final valuation range
   - ValuationWaterfall with all adjustment steps
   - OwnerConcentrationSummaryCard (if applicable)
   - CalculationJourneyOverview with all 12 steps
   - AdjustmentsSummary with detail cards
   - DataQualityConfidence with 5-dimension breakdown
   - MethodologyBreakdown

**Visual Checks:**
- No "undefined" or "NaN" values
- No missing components (error boundaries not triggered)
- All values properly formatted (currency, percentages)
- Colors correctly reflect status (green=good, yellow=warning, red=error)

---

### Test 6: Calculation Journey Overview

**Objective:** Verify 12-step calculation journey displays correctly

**Test Steps:**
1. In Preview tab, locate "12-Step Calculation Journey" section
2. Click to expand
3. Verify:
   - Summary shows: Total Steps = 12, Completed = X, Skipped = Y
   - Total execution time displayed
   - All 12 steps listed (0-11)
   - Each step shows:
     - Step number and name
     - Status badge (completed/skipped/failed)
     - Execution time (if completed)
     - Expand/collapse icon
4. Click to expand individual steps
5. Verify:
   - Description displayed
   - Key outputs shown
   - Skip reasons shown (if skipped)
   - Error messages shown (if failed)

**Screenshots:** Take screenshots of expanded journey for documentation

---

### Test 7: Info Tab Step Components

**Objective:** Verify all 12 info tab step components display correctly

**Test Steps:**
1. Navigate to "Info" tab
2. For each step (0-11):
   - Verify step card displays
   - Verify step title correct
   - Verify status indicator matches backend
   - Expand step details
   - Verify key information displayed:
     - Formulas (where applicable)
     - Input values
     - Output values
     - Before/after comparisons (for adjustment steps)
     - Academic sources
     - Methodology notes

**Specific Step Checks:**

**Step 0 (Data Quality):**
- Overall quality score displayed (0-100%)
- 5-dimension breakdown shown
- DCF eligibility determination shown
- Quality warnings listed

**Step 1 (Input Validation):**
- All input fields displayed
- Weighted metrics shown (if available)
- Company profile summary

**Step 2 (Industry Benchmarking):**
- Primary method (EBITDA/Revenue) displayed
- Percentile multiples shown (P25/P50/P75)
- Comparable companies count
- Data source indicated

**Step 3 (Base Enterprise Value):**
- Three values shown: Low/Mid/High
- Metric used (EBITDA or Revenue)
- Multiples used for each value
- Auto-correction notice (if applicable)

**Step 4 (Owner Concentration):**
- Owner/employee ratio shown
- Risk level indicated
- Adjustment percentage shown
- Before/after values displayed

**Step 5 (Size Discount):**
- Revenue tier shown
- Base discount percentage
- Business type multiplier (if applied)
- Before/after values

**Step 6 (Liquidity Discount):**
- Base discount shown
- Adjustment factors (margin, growth, recurring, size)
- Total discount percentage
- Before/after values

**Step 7 (EV to Equity Conversion):**
- Net debt calculation shown
- Balance sheet items (debt, cash)
- Operating cash exemption (if applied)
- Before/after values

**Step 8 (Ownership Adjustment):**
- Shares for sale percentage
- Adjustment type (control/minority/deadlock)
- Adjustment percentage
- Before/after values
- Skip indicator (if 100% sale)

**Step 9 (Confidence Score):**
- Overall confidence score (0-100%)
- 8-factor breakdown with weights
- Confidence level (HIGH/MEDIUM/LOW)

**Step 10 (Range Methodology):**
- Methodology used (Multiple Dispersion/Confidence Spread/Asymmetric)
- Base spread calculation
- All adjustment factors
- Final spread percentage

**Step 11 (Final Valuation):**
- Final valuation range (Low/Mid/High)
- Confidence score
- Methodology statement
- Academic sources
- Professional review readiness

---

### Test 8: Data Fallback Behavior

**Objective:** Test graceful degradation with incomplete data

**Test Scenarios:**

1. **Missing transparency.calculation_steps**
   - Mock API response without `transparency.calculation_steps`
   - Expected: Frontend uses legacy fields from `multiples_valuation`
   - Expected: UI does not break, shows available data

2. **Missing key_outputs in step**
   - Mock step without `key_outputs` field
   - Expected: Mapper falls back to legacy fields
   - Expected: Component displays "Not Available" where data missing

3. **Skipped step**
   - Step with status = "skipped"
   - Expected: Skip reason displayed
   - Expected: No calculation details shown
   - Expected: Clear visual indicator

4. **Failed step**
   - Step with status = "failed"
   - Expected: Error message displayed
   - Expected: Clear visual warning
   - Expected: Subsequent steps show impact

---

## Integration Testing

### Test 9: End-to-End User Flow

**Objective:** Test complete user journey from data input to results

**Test Scenario:**
1. User opens tester
2. User enters company data in manual flow
3. User submits for valuation
4. System processes request (backend)
5. Frontend receives response
6. Frontend displays results in Preview tab
7. User reviews main report
8. User switches to Info tab
9. User reviews detailed step-by-step calculation
10. User is satisfied with transparency and exports report

**Success Criteria:**
- No errors at any step
- All 12 steps visible and complete
- User can understand entire calculation journey
- Professional review ready

---

### Test 10: Cross-Tab Consistency

**Objective:** Verify data consistency between Preview and Info tabs

**Test Steps:**
1. Note values in Preview tab:
   - Final valuation range
   - Confidence score
   - Adjustments applied
2. Switch to Info tab
3. Verify same values in detailed steps
4. Cross-reference:
   - Step 11 final values = Preview header values
   - Step 9 confidence = Preview confidence
   - Adjustments in Steps 4-6-8 = Preview adjustment summary

**Assertions:**
- No discrepancies between tabs
- Values match to the cent (for currency)
- Percentages match to 0.1%

---

## Expert Validation

### Test 11: McKinsey/Bain Standards Review

**Objective:** Validate against professional valuation standards

**Review Checklist:**
- [ ] All calculations follow McKinsey methodology
- [ ] Academic sources properly cited
- [ ] Adjustments within acceptable ranges
- [ ] Range methodology appropriate
- [ ] Confidence scoring comprehensive
- [ ] Suitable for audit by Big 4 accountant

**Expert Review Questions:**
1. Is the methodology statement comprehensive?
2. Are all assumptions clearly documented?
3. Can the calculation be replicated from displayed data?
4. Are academic sources appropriate and current?
5. Would this pass professional peer review?

---

## Performance Testing

### Test 12: Render Performance

**Objective:** Ensure UI renders quickly

**Metrics:**
- Initial page load: < 2 seconds
- Tab switch (Preview → Info): < 500ms
- Step expansion: < 100ms
- Scroll performance: 60 FPS

**Test Tools:**
- Chrome DevTools Performance tab
- Lighthouse audit
- React DevTools Profiler

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

---

## Test Scenarios

### Scenario A: Profitable Small Business (€2M Revenue)

```json
{
  "company_name": "Healthy Services Co",
  "industry": "professional-services",
  "country": "BE",
  "current_year_data": {
    "year": 2024,
    "revenue": 2000000,
    "ebitda": 300000,
    "total_debt": 100000,
    "cash": 50000,
    "number_of_employees": 10
  },
  "number_of_owners": 2,
  "recurring_revenue_percentage": 0.6,
  "shares_for_sale": 100
}
```

**Expected Results:**
- DCF Eligible: Likely NO (small firm effect)
- Primary Method: EV/EBITDA
- Owner Concentration: Applied (2 owners / 10 employees = 0.2 ratio)
- Size Discount: Applied (~20% for small company)
- Liquidity Discount: Applied (~15% base, adjusted for recurring revenue)
- All 12 steps completed

---

### Scenario B: Unprofitable Startup (€500K Revenue)

```json
{
  "company_name": "Growing Tech Startup",
  "industry": "technology",
  "country": "BE",
  "current_year_data": {
    "year": 2024,
    "revenue": 500000,
    "ebitda": -50000,
    "total_debt": 0,
    "cash": 100000,
    "number_of_employees": 3
  },
  "number_of_owners": 2,
  "shares_for_sale": 100
}
```

**Expected Results:**
- DCF Eligible: NO (unprofitable, small)
- Primary Method: EV/Revenue (EBITDA negative)
- Owner Concentration: Applied (HIGH risk)
- Size Discount: Applied (HIGH discount ~25%)
- Liquidity Discount: Applied
- Step 4 may be skipped or adjusted due to negative EBITDA

---

### Scenario C: Large Profitable Company (€30M Revenue)

```json
{
  "company_name": "Established Corp",
  "industry": "manufacturing",
  "country": "BE",
  "current_year_data": {
    "year": 2024,
    "revenue": 30000000,
    "ebitda": 4500000,
    "total_debt": 5000000,
    "cash": 2000000,
    "number_of_employees": 100
  },
  "number_of_owners": 3,
  "shares_for_sale": 100
}
```

**Expected Results:**
- DCF Eligible: Likely YES (large, profitable, stable)
- Primary Method: EV/EBITDA
- Owner Concentration: Applied (LOW risk, 3 owners / 100 employees)
- Size Discount: NOT applied or MINIMAL (large company)
- Liquidity Discount: Applied (MODERATE)
- DCF and Multiples both calculated, hybrid approach

---

## Troubleshooting

### Issue: Missing transparency.calculation_steps

**Symptom:** Frontend shows "Not Available" for many fields

**Diagnosis:**
```bash
# Check backend logs
grep "transparency_report" backend.log

# Check API response
curl ... | jq '.transparency.calculation_steps'
```

**Solution:**
1. Verify Step 11 is executing
2. Check Step 11 log for "✅ Transparency report extracted"
3. Verify MultiplesCalculator extracts transparency_report
4. Verify ValuationOrchestrator uses transparency_report

---

### Issue: Step shows "Not Executed"

**Symptom:** Step card shows status "not_executed" in Info tab

**Diagnosis:**
- Check if step is in modular_system.step_details
- Check if step should be skipped (conditional execution)

**Solution:**
- Verify CalculationTriage executes step
- Check step dependencies are met
- Review step.should_execute() logic

---

### Issue: Values Don't Match Between Tabs

**Symptom:** Preview shows different values than Info tab

**Diagnosis:**
- Check which data source each component uses
- Verify no duplicate calculations in frontend

**Solution:**
- Ensure both tabs use same data extractors
- Check for frontend calculation overrides
- Verify backend Step 7 mid-point preservation

---

### Issue: Performance is Slow

**Symptom:** Page takes > 2s to render

**Diagnosis:**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Check data extraction complexity

**Solution:**
- Memoize expensive calculations
- Use React.memo for components
- Optimize data extraction (cache results)
- Consider virtualization for long lists

---

## Test Execution Tracking

### Test Run Template

**Date:** _____________  
**Tester:** _____________  
**Environment:** Staging / Production  
**Backend Version:** _____________  
**Frontend Version:** _____________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | API Response Structure | ⬜ | |
| 2 | Step 11 Extraction | ⬜ | |
| 3 | Step Data Completeness | ⬜ | |
| 4 | Multiple Profiles | ⬜ | |
| 5 | Main Report Display | ⬜ | |
| 6 | Calculation Journey | ⬜ | |
| 7 | Info Tab Steps | ⬜ | |
| 8 | Data Fallbacks | ⬜ | |
| 9 | End-to-End Flow | ⬜ | |
| 10 | Cross-Tab Consistency | ⬜ | |
| 11 | Expert Review | ⬜ | |
| 12 | Performance | ⬜ | |

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

---

## Automated Testing (Future)

### Unit Tests Needed
- [ ] valuationDataExtractor.ts functions
- [ ] stepDataMapper.ts functions
- [ ] CalculationJourneyOverview component
- [ ] Each JourneyStep component
- [ ] Results components

### Integration Tests Needed
- [ ] Full API flow test
- [ ] Tab switching test
- [ ] Data consistency test
- [ ] Error handling test

### E2E Tests Needed
- [ ] Complete user journey (Cypress/Playwright)
- [ ] Multiple company scenarios
- [ ] Export functionality
- [ ] Mobile responsiveness

---

## Sign-Off

**QA Lead:** _______________ Date: _______________  
**Lead Developer:** _______________ Date: _______________  
**Valuation Expert:** _______________ Date: _______________  
**CTO:** _______________ Date: _______________

---

**Document Version:** 1.0  
**Last Updated:** January 2025

