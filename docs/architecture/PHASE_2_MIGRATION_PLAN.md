# Phase 2 Migration Plan - Manual Flow

**Status**: 🚧 In Progress  
**Date**: December 16, 2025  
**Framework**: Flow-Isolated Zustand Architecture

---

## Context

**Challenge**: Migrate existing Manual Flow components from shared/legacy stores to new flow-isolated stores.

**Current State**:
- Manual Flow uses shared stores (`useValuationApiStore`, `useValuationSessionStore`, `useValuationResultsStore`)
- These stores are shared with Conversational Flow
- Race conditions occur when both flows operate simultaneously
- State updates can conflict between flows

**Goal**:
- Replace shared stores with flow-isolated Manual stores
- Maintain all existing functionality
- Ensure smooth, predictable behavior
- Zero breaking changes for users

---

## Risks & Constraints

### Risks
1. **Breaking Changes**: Incorrect migration could break existing functionality
2. **Race Conditions During Migration**: Partial migration could create new race conditions
3. **State Mismatch**: Old and new stores could have incompatible state structures
4. **Import Errors**: Missing or incorrect imports could break the build
5. **Testing Gaps**: Insufficient testing could miss edge cases

### Constraints
1. **Zero Downtime**: Users must be able to use the app during migration
2. **Backwards Compatibility**: Existing sessions must load correctly
3. **Performance**: No regression in load/calculation times
4. **Bank-Grade Standards**: Maintain all error handling, logging, audit trails

---

## Migration Strategy

### Option A: Big Bang Migration (NOT RECOMMENDED)
- **Pros**: Fast, complete isolation immediately
- **Cons**: High risk, difficult to test, hard to rollback
- **Trade-offs**: Speed vs. Safety

### Option B: Incremental Migration with Feature Flags (NOT NEEDED)
- **Pros**: Gradual rollout, easy rollback, A/B testing possible
- **Cons**: Complex, requires feature flag infrastructure, longer timeline
- **Trade-offs**: Safety vs. Complexity

### Option C: Component-by-Component Migration (RECOMMENDED)
- **Pros**: Controlled, testable, incremental validation, easy rollback
- **Cons**: Moderate timeline (1-2 days), requires careful coordination
- **Trade-offs**: Balance of speed and safety

**Recommendation**: **Option C** - Component-by-Component Migration

**Reasoning**:
- Provides safety without excessive complexity
- Each component can be tested independently
- Easy to identify issues and rollback specific changes
- Maintains system stability throughout migration
- Follows bank-grade standards for change management

---

## Architecture

### Before (Current)
```
ManualLayout
  ├─ useValuationApiStore (shared)
  ├─ useValuationSessionStore (shared)
  └─ useValuationResultsStore (shared)
        ↓
  [Race conditions possible with Conversational Flow]
```

### After (Target)
```
ManualLayout
  ├─ useManualFormStore (isolated)
  ├─ useManualSessionStore (isolated)
  └─ useManualResultsStore (isolated)
        ↓
  SessionService → Backend API
  ValuationService → Backend API
  ReportService → Backend API
        ↓
  [Complete isolation from Conversational Flow]
```

---

## Implementation Plan

### Step 2.1: Identify All Manual Flow Components ✅

**Components to Migrate**:
1. `ManualLayout.tsx` - Main layout orchestrator
2. `ValuationForm/` - Form components and hooks
3. `useValuationFormSubmission.ts` - Form submission logic
4. `ReportPanel.tsx` - Results display
5. `ValuationReport.tsx` - Top-level report page

**Files to Update**:
- `apps/upswitch-valuation-tester/src/features/manual/components/ManualLayout.tsx`
- `apps/upswitch-valuation-tester/src/components/ValuationForm/ValuationForm.tsx`
- `apps/upswitch-valuation-tester/src/components/ValuationForm/hooks/useValuationFormSubmission.ts`
- `apps/upswitch-valuation-tester/src/features/conversational/components/ReportPanel.tsx`
- `apps/upswitch-valuation-tester/src/components/ValuationReport.tsx`

### Step 2.2: Update useValuationFormSubmission Hook

**Current Dependencies**:
```typescript
import { useValuationApiStore } from '@/store/useValuationApiStore'
import { useValuationSessionStore } from '@/store/useValuationSessionStore'
import { useValuationFormStore } from '@/store/useValuationFormStore'
```

**New Dependencies**:
```typescript
import { useManualFormStore } from '@/store/manual'
import { useManualSessionStore } from '@/store/manual'
import { useManualResultsStore } from '@/store/manual'
import { valuationService, sessionService } from '@/services'
```

**Changes Required**:
1. Replace store imports with manual-specific stores
2. Replace direct API calls with service layer calls
3. Update `trySetCalculating()` usage to new store
4. Ensure `saveCompleteSession` uses `sessionService`

### Step 2.3: Update ManualLayout Component

**Current Dependencies**:
```typescript
import { useValuationApiStore } from '@/store/useValuationApiStore'
import { useValuationResultsStore } from '@/store/useValuationResultsStore'
```

**New Dependencies**:
```typescript
import { useManualResultsStore } from '@/store/manual'
```

**Changes Required**:
1. Replace `useValuationApiStore` with `useManualResultsStore`
2. Update `isCalculating` reference
3. Update `error` reference
4. Pass correct props to `ReportPanel`

### Step 2.4: Update ValuationForm Component

**Current Dependencies**:
```typescript
import { useValuationFormStore } from '@/store/useValuationFormStore'
```

**New Dependencies**:
```typescript
import { useManualFormStore } from '@/store/manual'
```

**Changes Required**:
1. Replace `useValuationFormStore` with `useManualFormStore`
2. Update `formData`, `updateFormData`, etc.
3. Ensure autosave uses `sessionService`

### Step 2.5: Update ValuationReport Component

**Changes Required**:
1. Ensure session initialization uses correct flow
2. Update `onComplete` callback to use services
3. Remove any direct session API calls (use services)

### Step 2.6: Update ReportPanel Component

**Changes Required**:
1. Ensure `isCalculating` prop is correctly passed
2. Update loading/error state handling
3. Ensure results display uses correct store

---

## Testing Strategy

### Unit Tests
```typescript
describe('useManualFormStore', () => {
  it('should update form data atomically', () => {
    const { result } = renderHook(() => useManualFormStore())
    
    act(() => {
      result.current.updateFormData({ company_name: 'Test Corp' })
    })
    
    expect(result.current.formData.company_name).toBe('Test Corp')
    expect(result.current.isDirty).toBe(true)
  })
})

describe('useManualResultsStore', () => {
  it('should prevent double submission with trySetCalculating', () => {
    const { result } = renderHook(() => useManualResultsStore())
    
    const first = result.current.trySetCalculating()
    const second = result.current.trySetCalculating()
    
    expect(first).toBe(true)
    expect(second).toBe(false)
  })
})
```

### Integration Tests
```typescript
describe('Manual Flow - End to End', () => {
  it('should complete full flow: create → calculate → save → reload', async () => {
    // 1. Create new report
    const reportId = 'test-report-123'
    
    // 2. Fill form
    const { result: formResult } = renderHook(() => useManualFormStore())
    act(() => {
      formResult.current.updateFormData({
        company_name: 'Test Corp',
        revenue: 1000000,
        ebitda: 100000,
      })
    })
    
    // 3. Calculate valuation
    const { result: resultsResult } = renderHook(() => useManualResultsStore())
    await act(async () => {
      // Trigger calculation
      // Verify calculation completes
    })
    
    expect(resultsResult.current.result).toBeDefined()
    
    // 4. Reload and verify persistence
    // Verify session loads correctly
    // Verify form data is restored
    // Verify results are displayed
  })
})
```

### Manual Testing Checklist
- [ ] Create new manual report
- [ ] Fill in form data
- [ ] Validate form fields
- [ ] Click "Calculate" button
- [ ] Verify loading spinner appears immediately
- [ ] Verify calculation completes successfully
- [ ] Verify results display correctly
- [ ] Verify info tab displays correctly
- [ ] Reload page
- [ ] Verify all data persists (form + results)
- [ ] Navigate away and back
- [ ] Verify everything still works
- [ ] Test autosave functionality
- [ ] Test error scenarios (invalid data, network errors)

---

## Monitoring & Observability

### Logging
```typescript
// All logs should have [Manual] prefix
logger.info('[Manual] Form data updated', {
  fieldsUpdated: Object.keys(updates),
  reportId,
})

logger.info('[Manual] Calculation started', {
  reportId,
  companyName: request.company_name,
})

logger.info('[Manual] Results saved', {
  reportId,
  valuationId: result.valuation_id,
})
```

### Metrics
- Time to calculate (should be <2s)
- Time to load session (should be <1s)
- Time to save session (should be <500ms)
- Success rate for calculations
- Cache hit rate for sessions

### Alerts
- Calculation failures (threshold: >5% failure rate)
- Slow calculations (threshold: >3s)
- Save failures (threshold: >1% failure rate)
- Cache misses (threshold: >20% miss rate)

---

## Rollback Plan

### If Issues Are Detected

**Immediate Rollback** (< 5 minutes):
1. Revert last commit
2. Deploy previous version
3. Verify system functionality
4. Document issue for post-mortem

**Partial Rollback** (component-specific):
1. Identify problematic component
2. Revert only that component's changes
3. Keep other migrated components
4. Continue migration after fix

**Database Rollback** (if needed):
- No schema changes in Phase 2
- Session data format unchanged
- No data migration required
- Rollback is purely code changes

---

## Success Criteria

### Technical ✅
- [ ] All Manual Flow components use new stores
- [ ] Zero shared state with Conversational Flow
- [ ] All API calls use service layer
- [ ] No direct store access from components
- [ ] All functional updates use atomic pattern

### Quality ✅
- [ ] Zero linter errors
- [ ] All TypeScript checks pass
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Manual testing checklist complete

### Performance ✅
- [ ] Calculation time <2s (unchanged)
- [ ] Session load time <1s (improved via cache)
- [ ] Save time <500ms (unchanged)
- [ ] No memory leaks detected
- [ ] Bundle size unchanged or reduced

### User Experience ✅
- [ ] UI behavior identical to before
- [ ] Loading states work correctly
- [ ] Error messages display properly
- [ ] All features work as expected
- [ ] No user-facing issues

---

## Timeline

**Total Estimated Time**: 4-6 hours

### Day 1 (2-3 hours)
- ✅ Phase 1 Complete (stores and services created)
- ⏳ Step 2.1: Identify components (30 min)
- ⏳ Step 2.2: Update useValuationFormSubmission (1 hour)
- ⏳ Step 2.3: Update ManualLayout (30 min)
- ⏳ Step 2.4: Update ValuationForm (30 min)

### Day 1 Continued (2-3 hours)
- ⏳ Step 2.5: Update ValuationReport (30 min)
- ⏳ Step 2.6: Update ReportPanel (30 min)
- ⏳ Testing: Unit tests (1 hour)
- ⏳ Testing: Integration tests (1 hour)
- ⏳ Testing: Manual testing (30 min)

---

## Post-Migration Verification

### Smoke Tests (Run Immediately After Deployment)
```bash
# 1. Create new manual report
# 2. Fill form with valid data
# 3. Click Calculate
# 4. Verify results display
# 5. Reload page
# 6. Verify data persists
# 7. Check browser console for errors
# 8. Check network tab for failed requests
```

### Performance Benchmarks
```bash
# Run Lighthouse audit
npm run lighthouse

# Expected scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >95
# SEO: >90
```

### Load Testing
```bash
# Simulate 10 concurrent users
# Each user:
# - Creates report
# - Fills form
# - Calculates valuation
# - Saves results

# Expected:
# - All requests succeed
# - P95 latency <2s
# - No memory growth
# - No error spikes
```

---

## Next Steps After Phase 2

### Phase 3: Migrate Conversational Flow
- Update conversational components
- Use conversational-specific stores
- Test both flows simultaneously
- Verify complete isolation

### Phase 4: Integration Testing
- Test all 4 flows simultaneously
- Performance testing under load
- Edge case testing
- Stress testing

### Phase 5: Cleanup
- Remove old stores (archive first)
- Update all documentation
- Complete migration guide
- Team training session

---

## Summary

Phase 2 migrates the Manual Flow from shared stores to flow-isolated stores, following a **component-by-component approach** for safety and predictability. The migration maintains all existing functionality while eliminating race conditions and setting the foundation for robust, concurrent operations.

**Key Principles**:
- **Safety First**: Test each component independently
- **Bank-Grade Standards**: Comprehensive error handling and logging
- **Zero Regression**: Maintain or improve performance
- **User Experience**: No visible changes to users
- **Developer Experience**: Clear, maintainable code

The migration follows CTO thinking patterns (Context → Risks → Options → Recommendation → Architecture → Implementation → Testing → Monitoring) and Developer code quality standards (Type Safety, Error Handling, Testing, Documentation).

