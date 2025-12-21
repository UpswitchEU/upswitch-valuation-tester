# Race Condition Fix - ValuationSessionManager URL Sync

## 🐛 Bug Description

**Location**: `apps/upswitch-valuation-tester/src/components/ValuationSessionManager.tsx:185-188`

**Issue**: The `setTimeout` delay was reduced from 300ms (original) to 100ms when resetting the `isUpdatingUrl` flag after calling `router.replace()`. This creates a race condition where:

1. `router.replace()` is called to update the URL
2. After only 100ms, the `isUpdatingUrl` flag is reset
3. Next.js hasn't finished updating the URL and propagating changes back through `useSearchParams()` yet
4. The effect runs again with stale `searchParams` (still showing old flow)
5. Effect detects a mismatch and attempts another URL update
6. **Result**: Infinite loop of URL updates

## 🔍 Root Cause Analysis

### The Problem Flow

```
Time 0ms:   router.replace(newUrl) called
            isUpdatingUrl = true
            searchParams still shows old flow (stale)

Time 100ms: setTimeout fires → isUpdatingUrl = false
            Effect runs again (searchParams dependency changed)
            searchParams still shows old flow (Next.js hasn't updated yet)
            Effect detects mismatch → calls router.replace() again
            → INFINITE LOOP
```

### Why 100ms is Too Short

Next.js `router.replace()` is asynchronous and needs time to:
1. Update the browser URL (immediate)
2. Propagate changes back through `useSearchParams()` hook (delayed)
3. Re-render components with new `searchParams` (delayed)

On slower devices or with complex component trees, this can take 200-500ms or more.

## ✅ Solution Implemented

### 1. Increased Timeout to 500ms
- Changed from 100ms to 500ms to give Next.js adequate time
- Conservative approach ensures router has completed

### 2. Early Reset Detection
- Added `targetFlowRef` to track which flow we're updating to
- When `searchParams` updates (effect re-runs), check if they match target
- If match is detected, reset flag immediately (no need to wait for timeout)
- This provides the best of both worlds: fast when it works, safe timeout as fallback

### 3. Proper Cleanup
- Clear pending timeouts when effect re-runs
- Prevent multiple timeouts from accumulating
- Use refs to track state across effect re-runs

### 4. Enhanced Logging
- Added debug logs to track URL update flow
- Helps identify if race conditions occur in production
- Logs when early reset happens vs timeout reset

## 📝 Code Changes

### Before (Buggy)
```typescript
router.replace(newUrl, { scroll: false })

// Reset flag after Next.js updates (simple delay)
setTimeout(() => {
  setUpdatingUrl(false)
}, 100) // ❌ Too short - race condition
```

### After (Fixed)
```typescript
// Track target flow for early reset detection
targetFlowRef.current = targetFlow

router.replace(newUrl, { scroll: false })

// Early reset check when searchParams update
if (normalizedCurrentFlow === targetFlow) {
  if (targetFlowRef.current === targetFlow) {
    targetFlowRef.current = null
    setUpdatingUrl(false)
    return // ✅ Early exit - no timeout needed
  }
}

// Conservative timeout as fallback
updateTimeoutRef.current = setTimeout(() => {
  if (targetFlowRef.current === targetFlow) {
    targetFlowRef.current = null
    setUpdatingUrl(false)
  }
}, 500) // ✅ Increased from 100ms to 500ms
```

## 🧪 Testing Checklist

- [x] Build passes (`yarn build`)
- [x] No TypeScript errors
- [x] No linter errors
- [ ] Manual testing: Switch between manual/conversational flows
- [ ] Verify no infinite URL updates in browser console
- [ ] Verify URL updates correctly after flow switch
- [ ] Test on slower devices/network conditions
- [ ] Monitor logs for early reset vs timeout reset

## 🎯 Expected Behavior

### Normal Case (Fast Update)
```
1. router.replace() called
2. Next.js updates URL quickly (< 500ms)
3. searchParams updates → effect re-runs
4. Early reset detected → flag reset immediately
5. No timeout needed
```

### Slow Case (Timeout Fallback)
```
1. router.replace() called
2. Next.js takes time to update (> 500ms)
3. Timeout fires after 500ms
4. Flag reset safely
5. Effect re-runs when searchParams finally update
6. Early reset check prevents duplicate update
```

## 📊 Impact

- ✅ **Prevents infinite loops**: Flag properly managed
- ✅ **Faster updates**: Early reset when possible
- ✅ **More reliable**: Conservative timeout as fallback
- ✅ **Better debugging**: Enhanced logging
- ✅ **Cleaner code**: Proper cleanup and ref management

## 🔗 Related Issues

- Original issue: Race condition in URL sync
- Related: Session persistence and restoration
- Related: Flow switching between manual/conversational

## 📚 References

- Next.js App Router: `router.replace()` behavior
- React hooks: `useEffect` dependency management
- Zustand: State management for `isUpdatingUrl` flag

---

**Fixed**: 2025-12-15  
**File**: `apps/upswitch-valuation-tester/src/components/ValuationSessionManager.tsx`  
**Lines**: 141-237






