# Employee Count Integration

## Overview
This document describes how employee count data flows from the user profile database to the valuation form, ensuring a seamless user experience.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER PROFILE DATABASE                           │
│                  (from /my-business page)                            │
│                                                                       │
│  • company_name: "My Company"                                        │
│  • industry: "services"                                              │
│  • business_type: "other"                                            │
│  • founded_year: 2020                                                │
│  • employee_count_range: "11-50"  ← STORED AS STRING RANGE          │
│  • country: "Belgium"                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User authenticates & navigates
                                    │ to valuation tool
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          AuthContext                                 │
│                     (src/contexts/AuthContext.tsx)                   │
│                                                                       │
│  1. Fetches user data from API (/api/auth/me)                       │
│  2. Parses employee_count_range using parseEmployeeCount()          │
│                                                                       │
│     parseEmployeeCount("11-50") → 30                                 │
│     parseEmployeeCount("1-10")  → 5                                  │
│     parseEmployeeCount("200+")  → 200                                │
│                                                                       │
│  3. Creates businessCard object:                                     │
│     {                                                                 │
│       company_name: "My Company",                                    │
│       industry: "services",                                          │
│       business_model: "other",                                       │
│       founding_year: 2020,                                           │
│       country_code: "BE",                                            │
│       employee_count: 30  ← CONVERTED TO NUMBER                      │
│     }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ businessCard available
                                    │ via useAuth() hook
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        ValuationForm                                 │
│                  (src/components/ValuationForm.tsx)                  │
│                                                                       │
│  1. Detects businessCard in useAuth()                                │
│  2. Logs: "🏢 Pre-filling form with business card data"             │
│  3. Calls prefillFromBusinessCard(businessCard)                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Pre-fill triggered
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      useValuationStore                               │
│                  (src/store/useValuationStore.ts)                    │
│                                                                       │
│  prefillFromBusinessCard() updates formData:                         │
│    {                                                                  │
│      company_name: "My Company",                                     │
│      industry: "services",                                           │
│      business_model: "other",                                        │
│      founding_year: 2020,                                            │
│      country_code: "BE",                                             │
│      number_of_employees: 30  ← STORED IN FORM STATE                │
│    }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Form data ready
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     VALUATION FORM UI                                │
│                 (https://valuation.upswitch.biz/manual)              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Basic Information                                           │   │
│  │                                                              │   │
│  │  Company Name*     [My Company]                 ← PRE-FILLED│   │
│  │  Industry          [Services ▼]                 ← PRE-FILLED│   │
│  │  Business Model    [Other ▼]                    ← PRE-FILLED│   │
│  │  Founding Year     [2020]                       ← PRE-FILLED│   │
│  │  Country           [🇧🇪 Belgium (€) ▼]          ← PRE-FILLED│   │
│  │  Employees         [30]                         ← PRE-FILLED│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks "Calculate"
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   VALUATION API REQUEST                              │
│                                                                       │
│  POST /api/v1/valuation/calculate                                    │
│  {                                                                    │
│    "company_name": "My Company",                                     │
│    "industry": "services",                                           │
│    "business_model": "other",                                        │
│    "founding_year": 2020,                                            │
│    "country_code": "BE",                                             │
│    "number_of_employees": 30,  ← INCLUDED IN REQUEST                │
│    "current_year_data": { ... },                                     │
│    ...                                                               │
│  }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Employee Count Range Parsing

The `parseEmployeeCount()` function handles multiple formats:

```typescript
// Range format: "11-50" → 30 (middle of range)
parseEmployeeCount("11-50")   // Returns 30
parseEmployeeCount("1-10")    // Returns 5
parseEmployeeCount("51-200")  // Returns 125

// Plus format: "200+" → 200
parseEmployeeCount("200+")    // Returns 200
parseEmployeeCount("500+")    // Returns 500

// Direct number: "25" → 25
parseEmployeeCount("25")      // Returns 25

// Invalid/missing: undefined
parseEmployeeCount("")        // Returns undefined
parseEmployeeCount(undefined) // Returns undefined
```

### 2. Data Quality Impact

Employee count contributes to the data quality score:

- **Without employee count:** Max 95 points (100 - 5)
- **With employee count:** Full 100 points
- **Percentage impact:** +5% to data quality score

This encourages users to provide this information while keeping it optional.

### 3. Console Logging

When employee count is auto-filled, you'll see:

```
🏢 Pre-filling form with business card data: {
  company_name: "My Company",
  industry: "services",
  business_model: "other",
  founding_year: 2020,
  country_code: "BE",
  employee_count: "30 employees"
}
```

When the valuation request is sent:

```
Sending valuation request: {
  company_name: "My Company",
  ...
  number_of_employees: 30,  // No longer undefined!
  ...
}
```

## Benefits

### For Users
- ✅ **No re-entry required** - Data flows automatically from profile
- ✅ **Consistent data** - Same values across platform
- ✅ **Faster workflow** - Pre-filled forms save time
- ✅ **Better accuracy** - More complete data = better valuations

### For Business
- ✅ **Higher data quality** - More valuations with employee data
- ✅ **Better insights** - Company size benchmarking enabled
- ✅ **Improved UX** - Seamless integration between platforms
- ✅ **Data integrity** - Single source of truth (database)

## Testing Checklist

- [x] Employee count range "11-50" converts to 30
- [x] Employee count pre-fills in form
- [x] Data quality score includes employee count
- [x] Valuation request includes number_of_employees
- [x] Console logs show pre-filled data
- [x] TypeScript compilation successful
- [x] No linting errors
- [x] Production build successful

## Edge Cases Handled

1. **No employee data in profile** → Field remains empty (optional)
2. **Invalid range format** → Returns undefined, field empty
3. **User manually changes value** → User override respected
4. **Not authenticated** → No auto-fill (expected behavior)
5. **Incomplete business card** → Only available fields pre-filled

## Related Documentation

- User Profile: https://upswitch.biz/my-business
- Manual Valuation: https://valuation.upswitch.biz/manual
- Bug Fix Summary: `BUGFIX_SUMMARY.md`

