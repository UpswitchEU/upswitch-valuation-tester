# Back to Home - Debug Guide

## Issue
"Back to Home" button in user dropdown not working when clicked (nothing happens).

## Debug Steps Added

### 1. Console Logging
Added comprehensive debug logging to track the entire flow:

```typescript
// When dropdown opens
[UserDropdown] On report page detected

// When menu item is clicked
[UserDropdown] Menu item clicked { key: 'back-to-home', label: 'Back to Home', hasAction: true }

// When handler is called
[UserDropdown] Back to Home action called from guest menu
[UserDropdown] Back to Home clicked { pathname, isOnReportPage, reportId, hasSession }

// Report state check
[UserDropdown] Report state check { reportId, hasValuationResults, hasMeaningfulData, hasUnsavedChanges }

// Modal shown or navigation
[UserDropdown] Showing exit confirmation modal
// OR
[UserDropdown] Empty report detected, exiting without confirmation
[UserDropdown] Exiting report
[UserDropdown] Navigating to home
```

### 2. Modal Logging
Added logging when modal opens:

```typescript
[ExitReportConfirmationModal] Modal opened { hasUnsavedChanges, hasValuationResults, isSaving }
```

## How to Debug

### Step 1: Open Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Filter by `[UserDropdown]` or `[ExitReportConfirmationModal]`

### Step 2: Click "Back to Home"
1. Open user dropdown (click avatar)
2. Click "Back to Home" button
3. Watch console logs

### Step 3: Identify Issue

#### Scenario A: No logs at all
**Issue**: Handler not being called
**Check**:
- Is the menu item rendered? Look for "Back to Home" in the dropdown
- Is `isOnReportPage` true? Check pathname
- Is the action wired correctly?

**Solution**: Check menu items array in console:
```
[UserDropdown] Menu items updated { 
  userType: 'guest', 
  menuItemCount: 4, 
  menuItemKeys: ['back-to-home', 'divider-home', 'create-account', ...] 
}
```

#### Scenario B: Logs show but no modal
**Issue**: Modal not rendering or conditions not met
**Check console logs**:
```
[UserDropdown] Report state check { 
  reportId: 'val_xxx',
  hasValuationResults: false,  // No results yet
  hasMeaningfulData: false,    // No data yet
  hasUnsavedChanges: false 
}
[UserDropdown] Empty report detected, exiting without confirmation
[UserDropdown] Exiting report
[UserDropdown] Navigating to home
```

**Expected**: Should navigate to home immediately (empty report)

#### Scenario C: Modal shows but nothing happens
**Issue**: Modal action buttons not working
**Check**:
- Click "Exit" or "Save and exit" button
- Watch for navigation logs:
  ```
  [UserDropdown] Exiting report
  [UserDropdown] Session cleared
  [UserDropdown] Navigating to home { homeUrl: '/' }
  ```

#### Scenario D: Navigation fails
**Issue**: Router not navigating
**Check**:
- Is `useRouter` from 'next/navigation' imported correctly?
- Is `UrlGeneratorService.root()` returning '/'?
- Is there a Next.js routing error?

**Solution**: Check Network tab for navigation request

## Common Issues

### Issue 1: Menu item not rendered
**Cause**: `isOnReportPage` is false
**Debug**: Check pathname value:
```
[UserDropdown] On report page detected { 
  pathname: '/reports/val_xxx',  // Should start with '/reports/'
  isOnReportPage: true,          // Should be true
  reportId: 'val_xxx'            // Should exist
}
```

**Fix**: Verify pathname detection logic works

### Issue 2: Modal doesn't close exit modal
**Cause**: Exit modal state not resetting
**Debug**: Check if modal closes when dropdown closes:
```
// Should see modal close automatically when dropdown closes
```

**Fix**: Added `useEffect` to close modal when dropdown closes (line 82-86)

### Issue 3: Navigation doesn't happen
**Cause**: Router.push fails silently
**Debug**: Check console for router errors

**Fix**: Added try-catch with navigation even if error occurs

## Testing Checklist

- [ ] Empty report (no data) → Should exit immediately without modal
- [ ] Report with unsaved changes → Should show "Save and exit?" modal
- [ ] Saved report with results → Should show "Are you sure?" modal
- [ ] Modal "Cancel" button → Should close modal and stay on page
- [ ] Modal "Exit" button → Should navigate to home
- [ ] Modal "Save and exit" button → Should save then navigate to home
- [ ] Modal Escape key → Should close modal
- [ ] Dropdown closes → Should close modal

## What Logs Should You See

### Empty Report (No Confirmation)
```
[UserDropdown] Menu item clicked { key: 'back-to-home' }
[UserDropdown] Back to Home action called from guest menu
[UserDropdown] Back to Home clicked
[UserDropdown] Report state check { hasValuationResults: false, hasMeaningfulData: false }
[UserDropdown] Empty report detected, exiting without confirmation
[UserDropdown] Exiting report
[UserDropdown] Session cleared
[UserDropdown] Navigating to home { homeUrl: '/' }
// Page navigates to home
```

### Report with Unsaved Changes
```
[UserDropdown] Menu item clicked { key: 'back-to-home' }
[UserDropdown] Back to Home action called from guest menu
[UserDropdown] Back to Home clicked
[UserDropdown] Report state check { hasValuationResults: true, hasUnsavedChanges: true }
[UserDropdown] Showing exit confirmation modal
[ExitReportConfirmationModal] Modal opened { hasUnsavedChanges: true, hasValuationResults: true }
// Modal appears with "Save and exit?" option
```

### Saved Report
```
[UserDropdown] Menu item clicked { key: 'back-to-home' }
[UserDropdown] Back to Home action called from guest menu
[UserDropdown] Back to Home clicked
[UserDropdown] Report state check { hasValuationResults: true, hasUnsavedChanges: false }
[UserDropdown] Showing exit confirmation modal
[ExitReportConfirmationModal] Modal opened { hasUnsavedChanges: false, hasValuationResults: true }
// Modal appears with "Are you sure?" message
```

---

## If Nothing Happens

### Check 1: Is the menu item rendered?
Open React DevTools → Find UserDropdown component → Check `guestMenuItems` array

### Check 2: Is the handler defined?
Console: `console.log(typeof handleBackToHome)` should be 'function'

### Check 3: Is the click event firing?
Add temporary `console.log('CLICKED!')` at the start of `handleBackToHome`

### Check 4: Is pathname detected correctly?
Check console logs for pathname value - should be `/reports/val_xxx`

---

## Current Implementation Status

✅ Modal component created (`ExitReportConfirmationModal.tsx`)
✅ UserDropdown updated with "Back to Home" menu item
✅ Logic to check report state implemented
✅ Navigation and cleanup handlers implemented
✅ Debug logging added throughout
✅ Modal closes on Escape key
✅ Modal closes when dropdown closes

---

## Next Action

1. Open valuation.upswitch.biz
2. Create or open a report
3. Click user avatar (top right)
4. Click "Back to Home"
5. Check browser console for debug logs
6. Share the logs to identify the issue

---

**Status**: Debug logging added, awaiting user testing
**Priority**: High
