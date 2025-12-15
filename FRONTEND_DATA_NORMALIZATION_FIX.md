# Frontend Data Normalization Fix

## Issue
The frontend is sending `industry: 'services'` and `business_model: 'services'` as defaults when `business_type` is selected but `industry` and `business_model` are not explicitly set. This may cause Python backend to not recognize the business type correctly, potentially affecting HTML generation.

## Root Cause
In `buildValuationRequest.ts`:
```typescript
// Normalize industry and business model (defaults)
const industry = formData.industry || 'services'
const businessModel = formData.business_model || 'services'
```

When a business type like "Restaurant" is selected, the form should extract `industry` and `business_model` from the business type metadata, but this mapping may not be happening correctly.

## Solution
Ensure that when `business_type_id` is present, we extract `industry` and `business_model` from the business type metadata before falling back to defaults.

## Files to Check
1. `apps/upswitch-valuation-tester/src/components/ValuationForm/sections/BasicInformationSection.tsx` - Business type selector
2. `apps/upswitch-valuation-tester/src/utils/buildValuationRequest.ts` - Request builder
3. `apps/upswitch-valuation-tester/src/hooks/useBusinessTypeFull.ts` - Business type metadata hook

## Next Steps
1. Verify that business type selection sets `industry` and `business_model` correctly
2. Update `buildValuationRequest` to extract industry/business_model from business_type_id if available
3. Add logging to verify the correct values are being sent to Python backend

