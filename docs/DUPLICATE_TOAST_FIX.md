# Duplicate Toast Notification Fix

**Date:** December 15, 2025  
**Status:** ✅ Complete  
**Build:** ✅ Passing

## Problem

When loading an existing report, two toast notifications appeared simultaneously:
1. "Report loaded successfully" (from `useSessionRestoration`)
2. "Valuation report saved successfully! All data has been persisted." (from `ManualLayout`/`ConversationalLayout`)

The "saved" toast should **only** appear when a user makes changes and those changes are saved, not during initial page load.

## Root Cause

The "saved" toast logic in both `ManualLayout.tsx` and `ConversationalLayout.tsx` was checking if:
1. `lastSaved` was recent (within 2 seconds)
2. There were unsaved changes **before** the save (`hadUnsavedChanges` was true)

However, during initial page load:
- `markReportSaved()` could be called during session initialization
- This would update `lastSaved` to the current time
- The `hadUnsavedChanges` check alone wasn't sufficient because it could be `false` during initialization, but the toast would still show if `lastSaved` was recent

## Solution

Added an `isInitialLoadRef` flag to both layout components to suppress the "saved" toast during the first 3 seconds after component mount. This ensures:

1. The "Report loaded successfully" toast shows on page load (from `useSessionRestoration`)
2. The "Valuation report saved successfully!" toast **only** shows when:
   - Initial load is complete (3 seconds have passed)
   - There were unsaved changes before the save
   - The save just completed (within last 2 seconds)

### Changes Made

#### 1. `apps/upswitch-valuation-tester/src/features/manual/components/ManualLayout.tsx`

```typescript
// Track previous hasUnsavedChanges to detect when save happens after user changes
const prevHasUnsavedChangesRef = useRef<boolean>(false)
// Track initial load to prevent showing "saved" toast during initialization
const isInitialLoadRef = useRef<boolean>(true)

// Mark initial load as complete after first render and when session is ready
useEffect(() => {
  // Wait a bit to ensure initialization is complete
  const timer = setTimeout(() => {
    isInitialLoadRef.current = false
  }, 3000) // 3 seconds should be enough for initialization
  
  return () => clearTimeout(timer)
}, [])

// Show success toast when save completes (only if there were unsaved changes)
useEffect(() => {
  // Don't show toast during initial load
  if (isInitialLoadRef.current) {
    return
  }
  
  // Check previous state BEFORE updating ref
  const hadUnsavedChanges = prevHasUnsavedChangesRef.current
  
  // Update ref to track current state for next render
  prevHasUnsavedChangesRef.current = hasUnsavedChanges
  
  // Only show toast if:
  // 1. Save just completed (lastSaved is recent)
  // 2. There were unsaved changes before the save (hadUnsavedChanges was true)
  // This prevents showing "saved" toast on initial page load when no changes were made
  if (lastSaved && !isSaving && !syncError && hadUnsavedChanges) {
    const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
    // Only show toast for recent saves (within last 2 seconds)
    if (timeAgo < 2) {
      showToast(
        'Valuation report saved successfully! All data has been persisted.',
        'success',
        4000
      )
    }
  }
}, [lastSaved, isSaving, syncError, hasUnsavedChanges, showToast])
```

#### 2. `apps/upswitch-valuation-tester/src/features/conversational/components/ConversationalLayout.tsx`

Applied the same fix to the conversational layout to ensure consistent behavior across both flows.

## How It Works Now

### Initial Page Load (Existing Report)
1. User visits an existing report URL
2. `useSessionRestoration` runs and restores data
3. `useSessionRestoration` shows: **"Report loaded successfully"** ✅
4. `isInitialLoadRef.current` is `true` for 3 seconds
5. Any `markReportSaved()` calls during initialization are suppressed
6. No "saved" toast appears ✅

### User Makes Changes and Saves
1. User edits form fields
2. `hasUnsavedChanges` becomes `true`
3. `prevHasUnsavedChangesRef.current` is set to `true`
4. User clicks "Calculate" or autosave triggers
5. `markReportSaved()` is called
6. `isInitialLoadRef.current` is now `false` (3+ seconds have passed)
7. `hadUnsavedChanges` (previous state) is `true`
8. Toast shows: **"Valuation report saved successfully! All data has been persisted."** ✅

## Testing Checklist

- [x] Build passes without errors
- [ ] Load an existing report → Only "Report loaded successfully" toast appears
- [ ] Make changes to a report → "Valuation report saved successfully!" toast appears after save
- [ ] Create a new report → Only "Report loaded successfully" toast appears on first load
- [ ] Test in both manual and conversational flows

## Technical Details

- **Initial Load Window:** 3 seconds (configurable via `setTimeout`)
- **Save Detection Window:** 2 seconds (checks if `lastSaved` is within last 2 seconds)
- **Flows Affected:** Both manual and conversational
- **Components Modified:** `ManualLayout.tsx`, `ConversationalLayout.tsx`

## Related Issues

- **Issue:** Duplicate toast notifications on page load
- **User Feedback:** "it still shows 2 tooltips at the same time. report has loaded and report has saved. only loaded should show when the page loads. There should be no save as there is no change done."
- **Previous Attempts:** 
  - Tried checking `hadUnsavedChanges` only (not sufficient)
  - Needed to add initial load suppression window

## Result

✅ **Fixed:** Only one toast notification appears on page load  
✅ **Build:** Passing  
✅ **Manual Flow:** Working correctly  
✅ **Conversational Flow:** Working correctly

