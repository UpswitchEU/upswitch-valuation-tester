# 🔍 Cache Diagnostic Guide

**Use this to verify the cache fix is working**

---

## Step 1: Open Browser Console

Press `F12` or `Cmd+Option+I` (Mac) to open DevTools

---

## Step 2: Clear Old Cache (CRITICAL!)

```javascript
// Run this BEFORE testing:
localStorage.clear()
console.log('✅ All caches cleared')

// Or clear just your specific report:
const reportId = 'val_YOUR_REPORT_ID_HERE'
localStorage.removeItem(`upswitch_session_cache_${reportId}`)
console.log(`✅ Cache cleared for ${reportId}`)
```

---

## Step 3: Enable Verbose Logging

Paste this in console to see all logs:

```javascript
// Make all logs visible (override WARN filtering)
const originalWarn = console.warn
const originalInfo = console.info
const originalDebug = console.debug

console.warn = function(...args) {
  if (args[0]?.includes?.('[ReportService]') || 
      args[0]?.includes?.('[Session]') ||
      args[0]?.includes?.('[Manual]')) {
    console.log('📝', ...args)
  }
  originalWarn.apply(console, args)
}

console.info = function(...args) {
  if (args[0]?.includes?.('[ReportService]') || 
      args[0]?.includes?.('[Session]') ||
      args[0]?.includes?.('[Manual]')) {
    console.log('ℹ️', ...args)
  }
  originalInfo.apply(console, args)
}

console.log('✅ Verbose logging enabled')
```

---

## Step 4: Create New Valuation

1. Go to: `https://valuation.upswitch.biz/reports/new?flow=manual&prefilledQuery=Test+Company`
2. Fill in the form:
   - Company name: "Test Company"
   - Revenue: 1000000
   - EBITDA: 200000
   - Country: Belgium
   - Employees: 10
3. Click "Calculate Valuation"

---

## Step 5: Watch for These Logs (During Calculation)

You MUST see ALL of these in order:

### ✅ Stage 1: Result Received
```
[Manual] Valuation result set {
  hasHtmlReport: true,     ← MUST BE TRUE
  htmlReportLength: >0     ← MUST BE > 0
}
```

### ✅ Stage 2: Optimistic Update
```
[Manual] Session cache updated optimistically
[Session] Starting optimistic cache update
[Session] Cache updated optimistically (SUCCESS) {
  hasHtmlReport: true,     ← MUST BE TRUE
  htmlReportLength: >0     ← MUST BE > 0
}
```

### ✅ Stage 3: Backend Save
```
[ReportService] Complete report package saved successfully
[ReportService] Starting cache update after report save
[ReportService] Cache cleared, fetching fresh session from backend
```

### ✅ Stage 4: Cache Update (CRITICAL!)
```
[ReportService] Cache updated with fresh valuation data after report save (SUCCESS) {
  reportId: 'val_xxx',
  hasHtmlReport: true,        ← MUST BE TRUE
  htmlReportLength: 102482,   ← MUST BE > 0
  hasInfoTabHtml: true,       ← MUST BE TRUE
  infoTabHtmlLength: 145541   ← MUST BE > 0
}
```

**If you DON'T see Stage 4, something is wrong!**

---

## Step 6: Verify Cache in Console

```javascript
// Get current report ID from URL
const reportId = window.location.pathname.split('/')[2]
console.log('Report ID:', reportId)

// Check if cache exists
const cacheKey = `upswitch_session_cache_${reportId}`
const cache = localStorage.getItem(cacheKey)

if (!cache) {
  console.error('❌ NO CACHE FOUND!')
} else {
  const parsed = JSON.parse(cache)
  console.log('✅ Cache found:', {
    hasSession: !!parsed.session,
    hasHtmlReport: !!parsed.session?.htmlReport,
    htmlReportLength: parsed.session?.htmlReport?.length || 0,
    hasInfoTabHtml: !!parsed.session?.infoTabHtml,
    infoTabHtmlLength: parsed.session?.infoTabHtml?.length || 0,
    hasValuationResult: !!parsed.session?.valuationResult,
    hasSessionData: !!parsed.session?.sessionData,
    version: parsed.version,
    cacheAge_minutes: Math.floor((Date.now() - parsed.cachedAt) / 60000)
  })
  
  // EXPECTED OUTPUT:
  // {
  //   hasSession: true,
  //   hasHtmlReport: true,      ✅ MUST BE TRUE
  //   htmlReportLength: 102482, ✅ MUST BE > 0
  //   hasInfoTabHtml: true,     ✅ MUST BE TRUE
  //   infoTabHtmlLength: 145541,✅ MUST BE > 0
  //   hasValuationResult: true, ✅ MUST BE TRUE
  //   hasSessionData: true,     ✅ MUST BE TRUE
  //   version: "...",
  //   cacheAge_minutes: 0
  // }
}
```

---

## Step 7: Refresh Page

Press `Cmd+R` (Mac) or `F5` (Windows/Linux)

---

## Step 8: Check Logs After Refresh

You MUST see:

```
[SessionService] Session loaded from cache (instant) {
  reportId: 'val_xxx',
  loadTime_ms: '0.5',
  hasHtmlReport: true,    ← MUST BE TRUE!
  hasInfoTabHtml: true    ← MUST BE TRUE!
}

[Session] Session loaded successfully {
  hasHtmlReport: true,    ← MUST BE TRUE!
  hasInfoTabHtml: true    ← MUST BE TRUE!
}

[ManualLayout] Restoring result with HTML assets {
  hasHtmlReport: true,
  htmlReportLength: >0
}

[ManualLayout] RESTORATION SUCCESS: HTML report restored
```

---

## Step 9: Verify UI

Check that EVERYTHING is visible:

- [ ] Input fields are pre-filled
- [ ] Main report shows content (not "Complete the form..." message)
- [ ] Info tab button is clickable
- [ ] Final price is displayed at top
- [ ] Version dropdown shows "v1"
- [ ] No console errors

---

## 🚨 Troubleshooting

### Problem: Cache update logs missing

**Check:**
```javascript
// Verify ReportService is being called
console.log('Check network tab for:')
console.log('PUT /api/valuation-sessions/val_xxx/result')
```

If you see the PUT request but no cache update logs → There's an error being swallowed.

---

### Problem: Cache shows empty htmlReport

**Fix:**
```javascript
// Check backend logs for this line:
// "Complete valuation package saved to database successfully"

// If backend saved it but frontend cache is empty, try manual refresh:
const reportId = window.location.pathname.split('/')[2]
const { sessionService } = await import('./src/services/session/SessionService')
const fresh = await sessionService.loadSession(reportId)
console.log('Manual reload result:', {
  hasHtmlReport: !!fresh?.htmlReport,
  htmlReportLength: fresh?.htmlReport?.length || 0
})
```

---

### Problem: "Failed to reload session after report save"

This means the backend GET request is failing. Check:

1. Network tab for errors on: `GET /api/valuation-sessions/val_xxx`
2. Backend logs for database errors
3. Supabase dashboard - check if `html_report` column has data

---

### Problem: Cache exists but refresh still shows empty

**This means the restoration logic is broken, not the cache.**

Check:
```javascript
// Verify ManualLayout is reading from cache
const session = useSessionStore.getState().session
console.log('Session in store:', {
  hasHtmlReport: !!session?.htmlReport,
  hasValuationResult: !!session?.valuationResult
})
```

---

## 📊 Expected Full Flow

```
1. User calculates valuation
   ↓
2. setResult() → Cache updated OPTIMISTICALLY ✅
   ↓
3. saveReportAssets() → Backend saves ✅
   ↓
4. [100ms delay for DB consistency]
   ↓
5. loadSession() → Fetch fresh from backend ✅
   ↓
6. Check if complete (has HTML) ✅
   ↓
7. If incomplete → Retry after 200ms
   ↓
8. Cache.set() → localStorage updated ✅
   ↓
9. User refreshes
   ↓
10. Cache.get() → Data loaded INSTANTLY ✅
    ↓
11. UI renders with full report ✅
```

---

## 🎯 Success Criteria

- ✅ All 4 stages of logs appear during calculation
- ✅ Cache contains htmlReport and infoTabHtml
- ✅ Page refresh loads full report in < 1 second
- ✅ All input fields pre-filled
- ✅ No console errors

---

**If all checks pass, the fix is working! 🎉**

**If any check fails, share the console logs and I'll debug further.**

