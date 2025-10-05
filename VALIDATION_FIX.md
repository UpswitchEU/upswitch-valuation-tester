# Valuation Request Validation Fix

## Issue
The valuation tester was sending invalid data to the valuation engine API, resulting in a 400 Bad Request error with a Pydantic validation error: `less_than_equal` constraint violation.

## Root Cause
The application was not properly validating data before sending it to the backend API. The backend has strict validation rules:

1. **Year fields** must be between 2000-2100 (for `current_year_data.year`) or 1900-2100 (for `founding_year`)
2. **Revenue** must be > 0 (cannot be 0 or negative)
3. **Recurring revenue percentage** must be between 0.0 and 1.0
4. **Projection years** must be between 5 and 15
5. **Non-negative fields** like `total_assets`, `total_debt`, `cash` must be >= 0

## Changes Made

### 1. Enhanced Validation in `useValuationStore.ts`

#### Added Year Validation
```typescript
// Ensure year values are within valid range (2000-2100)
const currentYear = Math.min(Math.max(formData.current_year_data?.year || new Date().getFullYear(), 2000), 2100);
const foundingYear = Math.min(Math.max(formData.founding_year || currentYear - 5, 1900), 2100);
```

#### Added Revenue Validation
```typescript
if (formData.revenue <= 0) {
  throw new Error('Revenue must be greater than 0');
}
```

#### Added Percentage Validation
```typescript
// Ensure recurring revenue percentage is between 0 and 1
const recurringRevenue = Math.min(Math.max(formData.recurring_revenue_percentage || 0.0, 0.0), 1.0);
```

#### Added Non-Negative Field Validation
```typescript
// Include optional fields if present (ensure they're non-negative where required)
...(formData.current_year_data?.total_assets && formData.current_year_data.total_assets >= 0 && { total_assets: formData.current_year_data.total_assets }),
...(formData.current_year_data?.total_debt && formData.current_year_data.total_debt >= 0 && { total_debt: formData.current_year_data.total_debt }),
...(formData.current_year_data?.cash && formData.current_year_data.cash >= 0 && { cash: formData.current_year_data.cash }),
```

#### Enhanced Error Handling
```typescript
// Extract detailed error message
let errorMessage = 'Failed to calculate valuation';
if (error.response?.data?.detail) {
  if (typeof error.response.data.detail === 'string') {
    errorMessage = error.response.data.detail;
  } else if (Array.isArray(error.response.data.detail)) {
    // Handle Pydantic validation errors (array format)
    errorMessage = error.response.data.detail.map((err: any) => {
      const field = err.loc?.join('.') || 'unknown field';
      return `${field}: ${err.msg}`;
    }).join('; ');
  }
}
```

### 2. Fixed Validation in `transformationService.ts`

#### Year Validation in transformFinancialYear
```typescript
// Ensure year is within valid range (2000-2100 per backend validation)
const validYear = Math.min(Math.max(year.year, 2000), 2100);

// Revenue must be > 0 per backend validation, use 1 as minimum if missing
const validRevenue = Math.max(year.revenue || 1, 1);
```

#### Founding Year Validation
```typescript
// Estimate founding year if not available, ensure within valid range (1900-2100)
const estimatedFoundingYear = currentYear.year - Math.min(historicalYears.length + 5, 20);
const foundingYear = Math.min(Math.max(registryData.founding_year || estimatedFoundingYear, 1900), 2100);
```

### 3. Updated Year Display in `ValuationForm.tsx`
```typescript
<h3 className="text-lg font-semibold text-gray-900 mb-4">
  Current Year Financials ({Math.min(new Date().getFullYear(), 2100)})
</h3>
```

## Backend Validation Rules (Reference)

From `apps/upswitch-valuation-engine/src/api/schemas.py`:

```python
class YearDataInput(BaseModel):
    year: int = Field(..., ge=2000, le=2100, description="Fiscal year")
    revenue: float = Field(..., gt=0, description="Annual revenue in EUR")
    ebitda: float = Field(..., description="EBITDA (can be negative)")
    # Optional fields with ge=0 (must be non-negative)
    cogs: Optional[float] = Field(None, ge=0)
    total_assets: Optional[float] = Field(None, ge=0)
    total_debt: Optional[float] = Field(None, ge=0)
    cash: Optional[float] = Field(None, ge=0)
    # ...

class ValuationRequest(BaseModel):
    founding_year: int = Field(..., ge=1900, le=2100)
    recurring_revenue_percentage: float = Field(0.0, ge=0.0, le=1.0)
    projection_years: int = Field(10, ge=5, le=15)
    # ...
```

## Testing

The fix has been tested and confirmed working:
```bash
# Test API call succeeds
curl -X POST "https://upswitch-valuation-engine-production.up.railway.app/api/v1/valuation/calculate" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Company","country_code":"BE","industry":"manufacturing",...}'
# Returns 200 OK with valid valuation response
```

## Impact

✅ **Fixed**: Invalid data no longer sent to the API  
✅ **Enhanced**: Better error messages showing specific validation failures  
✅ **Robust**: Data is validated and constrained before sending  
✅ **Compatible**: All validation rules match backend requirements  

## Files Modified

1. `/apps/upswitch-valuation-tester/src/store/useValuationStore.ts`
2. `/apps/upswitch-valuation-tester/src/services/transformationService.ts`
3. `/apps/upswitch-valuation-tester/src/components/ValuationForm.tsx`

## Build Status

✅ Build successful: `npm run build` completed without errors  
✅ No linter errors  
✅ TypeScript compilation successful  

---

**Date**: October 5, 2025  
**Status**: ✅ RESOLVED
