# Frontend Calculation Policy

**Status**: ✅ ENFORCED  
**Last Verified**: December 2024  
**Severity**: 🔴 CRITICAL

---

## 🚨 CRITICAL RULE: Zero Frontend Calculations

This frontend **MUST NOT** contain valuation calculation logic.

### ✅ What Frontend Does

**Data Collection**:
- Collect company name, industry, revenue, EBITDA
- Validate input formats (e.g., revenue > 0)
- Normalize data for backend

**Display Results**:
- Render valuation reports from backend
- Show valuation ranges, confidence scores
- Display PDF downloads, info tabs

**User Experience**:
- Progress indicators, loading states
- Error handling, retry logic
- Session management

### ❌ What Frontend MUST NOT Do

**Valuation Calculations**:
- ❌ Revenue multiples (e.g., `revenue * 3.5`)
- ❌ EBITDA adjustments (e.g., `EBITDA * (1 + growth)`)
- ❌ Valuation ranges (e.g., `min = revenue * 2, max = revenue * 5`)
- ❌ Confidence scoring
- ❌ Industry-specific multipliers
- ❌ DCF calculations
- ❌ Comparable analysis

**Why This Matters**:
1. **Accuracy**: Python backend has vetted calculation logic
2. **Auditability**: All valuations must be traceable to backend
3. **Compliance**: Bank-grade systems require single source of truth
4. **Maintenance**: One place to update calculation logic

---

## 🔍 How to Verify Compliance

### Automated Check (Run Before Commit)

```bash
# Check for calculation patterns in source code
cd apps/upswitch-valuation-tester

# Should return NO matches for valuation calculations:
grep -r "Math\.(round|floor|ceil).*\(.*revenue\|ebitda\)" src/

# Should return NO matches for financial operations:
grep -r "const.*valuation.*=.*\*.*revenue" src/
grep -r "const.*price.*=.*\*.*ebitda" src/

# Only boundary checks are allowed (e.g., Math.min, Math.max for UI)
```

### Manual Review Checklist

When reviewing code, verify:
- [ ] No `Math.*` operations on `revenue`, `ebitda`, `valuation` variables
- [ ] No multiplication/division of financial metrics
- [ ] No hardcoded multipliers (e.g., `const REVENUE_MULTIPLE = 3.5`)
- [ ] All valuation data comes from API responses
- [ ] All calculations happen via backend API calls

---

## 📐 Architecture Pattern

### ✅ Correct Pattern (What We Have)

```typescript
// Frontend: Collect data
const formData = {
  company_name: "ACME Corp",
  revenue: 1000000,
  ebitda: 200000,
  industry: "technology"
}

// Frontend: Send to backend
const response = await backendAPI.calculateValuation(formData)

// Frontend: Display result
const { valuation_range, confidence } = response
return <ValuationReport range={valuation_range} confidence={confidence} />
```

### ❌ Incorrect Pattern (What to Avoid)

```typescript
// ❌ WRONG - Calculation in frontend
const formData = { revenue: 1000000, industry: "technology" }

// ❌ WRONG - Frontend calculates valuation
const multiplier = getIndustryMultiplier(formData.industry)  // ❌ NO!
const valuation = formData.revenue * multiplier  // ❌ NO!

return <ValuationReport value={valuation} />  // ❌ NO!
```

---

## 🛡️ Enforcement

### Code Review Requirements

**All PRs must**:
1. Pass automated calculation checks (grep patterns above)
2. Have no `Math.*` operations on financial data
3. Have reviewer confirmation: "✅ No frontend calculations"

### Pre-Commit Hook (Recommended)

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "🔍 Checking for frontend calculations..."

# Check for calculation patterns
if grep -r "Math\.(round|floor|ceil).*revenue\|ebitda" src/ 2>/dev/null; then
  echo "❌ BLOCKED: Found potential calculation logic"
  echo "Frontend must not perform valuation calculations"
  echo "See docs/NO_CALCULATIONS_POLICY.md"
  exit 1
fi

echo "✅ No frontend calculations detected"
exit 0
```

---

## 📚 Reference

**Current Verification Status**: ✅ COMPLIANT (December 2024, Verified December 2025)
- No `calculations.ts` file exists
- No Math operations on valuation data (only normalization/validation/display)
- All calculations properly delegated to Python backend

**Verification Details (December 2025)**:
- ✅ `buildValuationRequest.ts`: Only normalization (clamping, validation, defaults)
- ✅ `transformationService.ts`: Business model inference (margin for classification), NOT valuation
- ✅ `industryGuidance.ts`: Display formatting only (toFixed, toLocaleString)
- ✅ `valuationValidation.ts`: Validation checks only (revenue per employee validation)
- ✅ All valuation calculations via `/api/valuation/calculate-unified` endpoint
- ✅ Zero hardcoded multipliers or calculation formulas found

**Python Backend Location**: 
`apps/upswitch-valuation-engine/src/api/routes/valuation/`

**Backend Endpoints**:
- `/api/v1/valuation/calculate` - Main valuation
- `/api/v1/valuation/calculate/stream` - Streaming calculation
- `/api/v1/valuation/calculate-instant` - Quick preview

**Related Documentation**:
- [Architecture Quality Assessment](./ARCHITECTURE_QUALITY_ASSESSMENT.md)
- [Data Flow Documentation](./architecture/DATA_FLOW.md)
- [Bank-Grade Excellence Framework](../../docs/refactoring/BANK_GRADE_EXCELLENCE_FRAMEWORK.md)

---

## 🚨 What to Do If You Find a Violation

1. **Stop development immediately**
2. **Remove the calculation logic**
3. **Move logic to Python backend** if needed
4. **Update frontend to use backend API**
5. **Add test to prevent regression**
6. **Notify team lead**

**This is a CRITICAL policy violation. Treat it as a P0 bug.**

---

**Policy Owner**: CTO  
**Last Reviewed**: December 2024  
**Next Review**: Quarterly or after major features
