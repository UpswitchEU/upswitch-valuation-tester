# Root Cause Analysis: Asset Loading Fix

**Date**: December 15, 2025  
**Status**: ✅ Complete  
**Build**: ✅ Passing  

---

## Problem Summary

When refreshing an existing report page, **no assets load** (no form fields, no main report, no info tab, no versions) even though:
- Backend returns 200 OK with session data
- Backend has `valuationResult`, `htmlReport`, `infoTabHtml` as separate top-level fields
- Session is successfully fetched and stored in Zustand
- Restoration hook runs and logs "Form data restored from session"
- But UI shows empty forms and no reports

## Root Cause Analysis

### Issue 1: Using Wrong Data Source for Restoration

**Location**: `apps/upswitch-valuation-tester/src/hooks/useSessionRestoration.ts`

**Problem**: The restoration hook was calling `getSessionData()` which:
1. Filters to **form fields only** (returns `ValuationRequest | null`)
2. **Excludes** `html_report`, `info_tab_html`, `valuation_result` (these aren't form fields)
3. Returns `null` if sessionData is empty or only has non-form fields

**Impact**: 
- `restoreResults()` received filtered data without `html_report`, `info_tab_html`, `valuation_result`
- HTML reports and valuation results were never restored
- Form fields might also be missing if `getSessionData()` filtered them out

**Fix**: Changed to use `session.sessionData` directly (the merged version with all fields)

```typescript
// BEFORE (WRONG):
const sessionData = getSessionData()  // Filtered to form fields only

// AFTER (CORRECT):
const sessionData = session.sessionData as any  // Full merged sessionData
```

### Issue 2: Using Unmerged Data After Merge

**Location**: `apps/upswitch-valuation-tester/src/store/useValuationSessionStore.ts` (multiple locations)

**Problem**: After merging top-level fields (`valuationResult`, `htmlReport`, `infoTabHtml`) into `sessionData`, the restoration code was still using the **unmerged** `existingSession.sessionData`:

```typescript
// We merge fields:
const mergedSessionData = {
  ...existingSession.sessionData,
  ...(existingSession.valuationResult && { valuation_result: existingSession.valuationResult }),
  ...
}

// But then restore using OLD unmerged data:
const sessionData = existingSession.sessionData as any  // ❌ WRONG - unmerged!
const valuationResult = sessionData?.valuation_result || ...  // ❌ Won't find it!
```

**Impact**: HTML reports and valuation results were never restored because we were reading from the wrong source

**Fix**: Use `mergedSessionData` and check top-level fields directly:

```typescript
// AFTER (CORRECT):
const valuationResult = mergedSessionData?.valuation_result || existingSession.valuationResult
const htmlReport = mergedSessionData?.html_report || existingSession.htmlReport
const infoTabHtml = mergedSessionData?.info_tab_html || existingSession.infoTabHtml
```

### Issue 3: Missing Session Parameter in restoreResults

**Location**: `apps/upswitch-valuation-tester/src/hooks/useSessionRestoration.ts`

**Problem**: `restoreResults()` only checked `sessionData` but didn't check top-level `session` fields as fallback

**Fix**: Added `session` parameter and check both sources:

```typescript
function restoreResults(
  reportId: string,
  sessionData: any,
  session: any,  // ✅ Added session parameter
  ...
) {
  // Check both merged sessionData AND top-level fields
  const valuationResult = sessionData?.valuation_result || session?.valuationResult
  const htmlReport = sessionData?.html_report || session?.htmlReport
  const infoTabHtml = sessionData?.info_tab_html || session?.infoTabHtml
}
```

## Solution Architecture

### Data Flow (Fixed)

```
Backend Response
├── sessionData: {} (form fields)
├── valuationResult: {...} (top-level)
├── htmlReport: "..." (top-level)
└── infoTabHtml: "..." (top-level)
         ↓
Merge into sessionData
├── sessionData: {
│     ...formFields,
│     valuation_result: {...},
│     html_report: "...",
│     info_tab_html: "..."
│   }
         ↓
Store in Zustand
├── session.sessionData (merged)
         ↓
Restoration Hook
├── Reads session.sessionData (full merged data) ✅
├── restoreFormData(sessionData) ✅
└── restoreResults(sessionData, session) ✅
         ↓
UI Populated
├── Form fields ✅
├── Main report ✅
├── Info tab ✅
└── Versions ✅
```

## Files Changed

1. **`apps/upswitch-valuation-tester/src/hooks/useSessionRestoration.ts`**
   - Changed from `getSessionData()` to `session.sessionData` (merged data)
   - Updated `restoreResults()` to accept `session` parameter
   - Check both merged `sessionData` and top-level `session` fields

2. **`apps/upswitch-valuation-tester/src/store/useValuationSessionStore.ts`**
   - Fixed restoration after backend load (cache age check path)
   - Fixed restoration after direct backend load
   - Use `mergedSessionData` instead of `existingSession.sessionData`

3. **`apps/upswitch-valuation-tester/src/utils/sessionHelpers.ts`**
   - Fixed restoration after 409 conflict resolution
   - Check both merged `sessionData` and top-level fields

## Testing Checklist

- [x] Refresh report with only form data → Form fields load
- [x] Refresh report with valuation result → Report loads
- [x] Refresh report with both form data and result → Everything loads
- [x] Refresh report with only `htmlReport` (no form data) → Report loads
- [x] Create new report → Shows empty forms (no false restoration)
- [x] Click report from home page → All data loads correctly

## Key Principles Applied

1. **Single Source of Truth**: `session.sessionData` (merged) is the single source
2. **Defensive Checks**: Check both merged `sessionData` AND top-level fields for backward compatibility
3. **No Filtering**: Don't filter sessionData before restoration - use full merged data
4. **Consistent Access**: All restoration code uses the same data source

## Build Status

✅ Build successful - no TypeScript or lint errors




