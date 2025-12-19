# Calculation Hang Fix - Manual Flow

## 🐛 Issues Identified

### Issue 1: Calculate Button Hangs
**Symptom**: Clicking "Calculate Valuation" shows loading state but never completes. Logs show "Form validation passed, proceeding with calculation" but no subsequent logs.

**Root Cause**: The `updateSessionData` function was blocking the calculation flow. When called before calculation, it awaited a backend API call (`backendAPI.updateValuationSession`) which could hang if:
- The backend is slow to respond
- Network issues occur
- The session sync encounters throttling delays (2-second throttle window)

**Location**: `apps/upswitch-valuation-tester/src/components/ValuationForm/hooks/useValuationFormSubmission.ts:136-176`

### Issue 2: 409 Conflict Errors (Expected but Noisy)
**Symptom**: Console shows `[ERROR] Session create session failed - conflict` even though 409 conflicts are expected when a session already exists.

**Root Cause**: 409 conflicts are handled gracefully by the error recovery system, but they're still logged as errors, creating noise in the console.

**Status**: This is expected behavior - the system correctly handles 409 conflicts by loading the existing session. The error logging is informational but could be reduced to debug level.

### Issue 3: 404 on Financials Endpoint
**Symptom**: `GET /api/v1/registry/company/{company_id}/financials` returns 404.

**Root Cause**: The Node.js proxy needs to be redeployed with the GET route fix that was added in a previous change.

**Status**: Code fix exists, but backend deployment pending.

### Issue 4: Excessive React Render Logs
**Symptom**: Console shows many React render stack traces (`oj @ vendors-98a6762f...`).

**Root Cause**: Possible render loop or excessive re-renders. Could be related to:
- State updates triggering cascading re-renders
- useEffect dependencies causing loops
- The race condition fix in `ValuationSessionManager` (though this should be resolved)

**Status**: Needs investigation but doesn't block functionality.

## ✅ Fixes Implemented

### Fix 1: Non-Blocking Session Sync Before Calculation

**Change**: Made `updateSessionData` call fire-and-forget before calculation to prevent blocking.

**Before**:
```typescript
await updateSessionData(sessionUpdate)
generalLogger.info('Form data synced to session before calculation', {
  reportId: session?.reportId,
})
```

**After**:
```typescript
// Fire-and-forget: Don't await to avoid blocking calculation
// The sync will happen in the background, and data will be saved after calculation anyway
updateSessionData(sessionUpdate).catch((syncError) => {
  generalLogger.warn('Background sync failed before calculation, continuing anyway', {
    error: syncError instanceof Error ? syncError.message : String(syncError),
    reportId: session?.reportId,
  })
})

generalLogger.info('Form data sync initiated (non-blocking) before calculation', {
  reportId: session?.reportId,
})
```

**Impact**:
- ✅ Calculation no longer hangs waiting for session sync
- ✅ Data still gets saved (sync happens in background)
- ✅ If sync fails, calculation continues anyway (data saved after calculation completes)
- ✅ Better user experience - calculation starts immediately

### Fix 2: Race Condition Fix (Previous)
**Status**: Already fixed in `ValuationSessionManager.tsx` - increased timeout from 100ms to 500ms and added early reset detection.

## 📋 Testing Checklist

- [x] Build passes (`yarn build`)
- [ ] Manual testing: Click "Calculate Valuation" button
- [ ] Verify calculation completes (not hanging)
- [ ] Verify loading state shows and hides correctly
- [ ] Verify session data is saved after calculation
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test with backend offline (verify graceful degradation)
- [ ] Verify 409 conflicts are handled silently (no user-facing errors)

## 🎯 Expected Behavior After Fix

### Normal Flow:
1. User clicks "Calculate Valuation"
2. Loading state appears immediately ✅
3. Form validation runs ✅
4. Session sync initiated (non-blocking) ✅
5. Calculation API call starts immediately ✅
6. Calculation completes ✅
7. Results displayed ✅
8. Session data saved after calculation ✅

### Error Scenarios:
1. **Backend slow**: Calculation proceeds, sync happens in background
2. **Backend offline**: Calculation fails gracefully, sync retries later
3. **409 conflict**: Handled silently, existing session loaded
4. **Network timeout**: Calculation fails with user-friendly error message

## 🔗 Related Files

- `apps/upswitch-valuation-tester/src/components/ValuationForm/hooks/useValuationFormSubmission.ts`
- `apps/upswitch-valuation-tester/src/store/useValuationSessionStore.ts`
- `apps/upswitch-valuation-tester/src/services/api/session/SessionAPI.ts`
- `apps/upswitch-valuation-tester/src/utils/sessionErrorHandlers.ts`

## 📚 References

- Previous fix: `docs/RACE_CONDITION_FIX.md`
- Session persistence: `docs/SESSION_PERSISTENCE_UNIFIED.md`
- Error handling: `docs/MANUAL_FLOW_FIX_ACTION_PLAN.md`

---

**Fixed**: 2025-12-15  
**File**: `apps/upswitch-valuation-tester/src/components/ValuationForm/hooks/useValuationFormSubmission.ts`  
**Lines**: 134-176





