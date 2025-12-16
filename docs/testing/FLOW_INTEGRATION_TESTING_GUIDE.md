# Flow Integration Testing Guide - Manual Testing Checklist

**Date**: December 16, 2025  
**Status**: 🧪 Ready for Manual Testing  
**Purpose**: Comprehensive guide for testing Manual and Conversational flows end-to-end

---

## Overview

This guide provides **step-by-step testing instructions** for both valuation flows, covering:
- Frontend → Node.js → Python integration
- Error handling at each layer
- Data persistence and restoration
- User experience validation

---

## Architecture Quick Reference

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW OVERVIEW                        │
└─────────────────────────────────────────────────────────────┘

1. Frontend (React/TypeScript)
   ├─ Manual Flow: ValuationForm → useManualResultsStore
   ├─ Conversational Flow: StreamingChat → useConversationalResultsStore
   └─ Common: Zustand stores (isolated per flow)
      │
      ▼
2. Node.js Backend (Proxy/Auth)
   ├─ Endpoint: POST /api/valuations/calculate
   ├─ Controller: ValuationController.calculateValuation()
   ├─ Credit Check: Manual = FREE, Conversational = 1 credit
   ├─ Data Enhancement: Defaults, normalization
   └─ Service: pythonEngineService.calculateValuation()
      │
      ▼
3. Python Engine (Calculation)
   ├─ Endpoint: POST /api/v1/valuation/calculate
   ├─ Handler: calculate_valuation()
   ├─ Orchestrator: ValuationOrchestrator.process_comprehensive_valuation()
   ├─ Calculation: 11-step valuation process
   └─ Report: HTML generation (preview + info tab)
      │
      ▼
4. Response Back to Frontend
   ├─ ValuationResponse object
   ├─ HTML reports (preview + info tab)
   └─ Store: useManualResultsStore / useConversationalResultsStore
      │
      ▼
5. UI Display
   ├─ ReportPanel: Preview tab (HTML report)
   ├─ ReportPanel: Info tab (info tab HTML)
   └─ Version History: M&A workflow
```

---

## Pre-Testing Checklist

### 1. Environment Setup ✅

**Backend Services Running**:
```bash
# Terminal 1: Node.js Backend
cd apps/upswitch-backend
npm run dev
# Should show: Server running on port 3001

# Terminal 2: Python Engine
cd apps/upswitch-valuation-engine
python -m uvicorn main:app --reload --port 8000
# Should show: Application startup complete

# Terminal 3: Frontend
cd apps/upswitch-valuation-tester
npm run dev
# Should show: ready on http://localhost:3000
```

**Health Checks**:
- [ ] Node.js: http://localhost:3001/health → {"status":"ok"}
- [ ] Python: http://localhost:8000/health → {"status":"healthy"}
- [ ] Frontend: http://localhost:3000 → Home page loads

### 2. Browser Setup ✅

**Required**:
- Open Chrome/Firefox DevTools (F12)
- Go to Console tab
- Enable "Preserve log" option
- Clear cache (Cmd+Shift+R / Ctrl+Shift+R)

**Look for these log tags**:
- `[Manual]` - Manual flow logs
- `[Conversational]` - Conversational flow logs
- `[Backend]` - Node.js logs
- `[Python]` - Python engine logs

---

## Test Suite 1: Manual Flow End-to-End

### Test 1.1: New Report Creation (Happy Path) ✅

**Objective**: Verify complete flow from form submission to report display

**Steps**:
1. **Navigate to Manual Flow**
   - Go to http://localhost:3000
   - Click "Manual Valuation" button
   - Verify: Form loads with empty fields

2. **Fill Form (Minimal Required Fields)**
   - Company Name: `Test Company ABC`
   - Industry: Select `Technology`
   - Country: Select `Belgium`
   - Revenue (Current Year): `1000000`
   - EBITDA (Current Year): `150000`

3. **Submit Calculation**
   - Click "Calculate Valuation" button
   - Verify in Console:
     ```
     [Manual] Loading state set to true immediately (< 16ms)
     [Manual] Form submit triggered
     POST /api/valuations/calculate → 200 OK
     [Manual] Valuation result set
     ```
   - Verify UI:
     - [ ] Button shows "Calculating..." immediately
     - [ ] Button is disabled
     - [ ] Preview panel shows loading spinner
     - [ ] No error messages

4. **Wait for Calculation (2-5 seconds)**
   - Verify in Console:
     ```
     [Backend] Calculation started
     [Python] Processing valuation
     [Python] Calculation complete
     [Backend] Response received
     [Manual] Calculation complete
     ```

5. **Verify Report Display**
   - Verify UI:
     - [ ] Button returns to "Calculate Valuation" (enabled)
     - [ ] Preview tab shows HTML report
     - [ ] Info tab is clickable
     - [ ] Version history shows "v1 - Initial valuation"
   - Verify in Console:
     ```
     [Manual] Valuation result set {valuationId: "...", hasHtmlReport: true}
     [Manual] HTML report updated
     [Manual] Session saved successfully
     ```

6. **Verify Report Content**
   - Click through sections in Preview:
     - [ ] Company Overview section visible
     - [ ] Valuation Summary section visible
     - [ ] Financial Analysis section visible
     - [ ] Methodology section visible
   - Click "Info" tab:
     - [ ] Valuation details displayed
     - [ ] Methodology breakdown visible

**Expected Result**: ✅ Report generated successfully, all sections display correctly

**Success Criteria**:
- < 16ms button disable time
- 2-5s total calculation time
- HTML report renders correctly
- No console errors

---

### Test 1.2: Form Validation (Error Handling) ✅

**Objective**: Verify frontend validation catches invalid inputs

**Steps**:
1. **Navigate to Manual Flow**
   - Go to http://localhost:3000
   - Click "Manual Valuation" button

2. **Test Missing Required Fields**
   - Leave all fields empty
   - Click "Calculate Valuation"
   - Verify: Error message appears
   - Verify: Button does NOT disable
   - Verify: No API call made (check Network tab)

3. **Test Invalid Revenue**
   - Fill required fields but set Revenue = `0`
   - Click "Calculate Valuation"
   - Verify: Error message "Revenue must be greater than 0"
   - Verify: No API call made

4. **Test Invalid EBITDA**
   - Set Revenue = `1000000`
   - Set EBITDA = `1500000` (greater than revenue)
   - Click "Calculate Valuation"
   - Verify: Error message "EBITDA cannot exceed revenue"
   - Verify: No API call made

5. **Test Negative EBITDA (Should Work)**
   - Set Revenue = `1000000`
   - Set EBITDA = `-50000`
   - Click "Calculate Valuation"
   - Verify: Calculation proceeds
   - Verify: Report generated successfully

**Expected Result**: ✅ Validation prevents invalid submissions, allows valid negative EBITDA

---

### Test 1.3: Page Reload & Session Restoration ✅

**Objective**: Verify data persists and restores after page reload

**Steps**:
1. **Complete Test 1.1** (create a report)
   - Verify report is displayed
   - Note the Report ID from URL: `/reports/{reportId}`

2. **Reload Page**
   - Press Cmd+R / Ctrl+R
   - Verify in Console:
     ```
     [Manual] Starting parallel session load {reportId: "..."}
     [Manual] Session loaded successfully
     [Manual] Restored valuation result from session
     ```

3. **Verify Form Data Restored**
   - Verify: All form fields contain previous values
   - Verify: Company Name = `Test Company ABC`
   - Verify: Revenue = `1000000`
   - Verify: EBITDA = `150000`

4. **Verify Report Restored**
   - Verify: Preview tab shows HTML report (same as before reload)
   - Verify: Info tab works
   - Verify: Version history shows "v1 - Initial valuation"

5. **Test Re-calculation**
   - Change Revenue to `1500000`
   - Click "Calculate Valuation"
   - Verify: New calculation runs
   - Verify: New report displays
   - Verify: Version history now shows "v2 - Updated valuation"

**Expected Result**: ✅ All data restored correctly, re-calculation creates new version

---

### Test 1.4: Error Handling - Backend Failure ✅

**Objective**: Verify graceful error handling when backend fails

**Steps**:
1. **Simulate Backend Failure**
   - Stop Node.js backend (Ctrl+C in Terminal 1)
   - Keep frontend running

2. **Attempt Calculation**
   - Fill form with valid data
   - Click "Calculate Valuation"
   - Verify UI:
     - [ ] Button disables immediately (< 16ms)
     - [ ] Loading spinner shows
     - [ ] After timeout, error message displays
     - [ ] Button re-enables
     - [ ] Error message: "Network error. Please check your connection."

3. **Restart Backend**
   - Restart Node.js backend (`npm run dev`)
   - Wait for "Server running on port 3001"

4. **Retry Calculation**
   - Click "Calculate Valuation" again
   - Verify: Calculation succeeds
   - Verify: Report displays correctly

**Expected Result**: ✅ Graceful error handling, recovery after backend restart

---

### Test 1.5: Auto-Save Functionality ✅

**Objective**: Verify form data auto-saves as user types

**Steps**:
1. **Start New Report**
   - Navigate to Manual Flow
   - Fill Company Name: `Auto Save Test`

2. **Monitor Auto-Save**
   - Wait 500ms after typing
   - Verify in Console:
     ```
     [Manual] Session data updated (in-memory)
     [Manual] Synced form data to session
     ```

3. **Verify Save Indicator**
   - Verify: "Saving..." indicator appears briefly
   - Verify: Changes to "Saved" after successful save
   - Verify: Timestamp shows last saved time

4. **Test Unsaved Changes Indicator**
   - Type in Revenue field: `1000000`
   - Verify: "Unsaved changes" indicator appears immediately
   - Wait 500ms
   - Verify: Changes to "Saved" after auto-save completes

**Expected Result**: ✅ Auto-save works, indicators update correctly

---

## Test Suite 2: Conversational Flow End-to-End

### Test 2.1: New Report Creation (AI-Guided) ✅

**Objective**: Verify conversational flow from chat to report

**Steps**:
1. **Navigate to Conversational Flow**
   - Go to http://localhost:3000
   - Click "Conversational Valuation" button
   - Verify: Chat interface loads
   - Verify: AI greeting message appears

2. **Provide Business Information**
   - Type: `I want to value my tech company`
   - Press Enter
   - Verify: AI asks for company name
   - Type: `TechStartup Inc`
   - Press Enter
   - Verify: AI asks for revenue
   - Type: `1 million euros`
   - Press Enter
   - Continue answering AI questions (EBITDA, industry, etc.)

3. **Trigger Calculation**
   - After all data collected, AI shows "Calculate Valuation" button
   - Click "Calculate Valuation"
   - Verify in Console:
     ```
     [Conversational] Loading state set to true immediately (< 16ms)
     [Conversational] Manual calculate triggered
     POST /api/valuations/calculate → 200 OK
     [Conversational] Valuation result set
     ```

4. **Verify Report Display**
   - Verify: Preview tab shows HTML report
   - Verify: Info tab is clickable
   - Verify: Chat history preserved
   - Verify: "Calculate Valuation" button disappears after calculation

**Expected Result**: ✅ AI guides user through data collection, generates report

**Success Criteria**:
- < 16ms button disable
- Chat history persists
- Report displays correctly
- No console errors

---

### Test 2.2: Session Restoration (Conversational) ✅

**Objective**: Verify conversation and report restore after reload

**Steps**:
1. **Complete Test 2.1** (create AI-guided report)
   - Note Report ID from URL

2. **Reload Page**
   - Press Cmd+R / Ctrl+R
   - Verify in Console:
     ```
     [Conversational] Session loaded successfully
     [Conversational] Restored valuation result from session
     [Conversational] Restored X messages
     ```

3. **Verify Chat Restored**
   - Verify: All previous messages visible
   - Verify: Conversation history in correct order
   - Verify: Data collection summary shows all collected data

4. **Verify Report Restored**
   - Verify: Preview tab shows HTML report
   - Verify: Info tab works
   - Verify: Can continue conversation if needed

**Expected Result**: ✅ Chat history and report both restored correctly

---

## Test Suite 3: Cross-Flow Testing

### Test 3.1: Switching Between Flows ✅

**Objective**: Verify flows don't interfere with each other

**Steps**:
1. **Create Manual Report**
   - Go to Manual Flow
   - Create report with Company Name: `Manual Flow Test`
   - Note Report ID: `report-manual-123`

2. **Create Conversational Report**
   - Go back to Home (click logo)
   - Go to Conversational Flow
   - Create report with Company Name: `Conversational Flow Test`
   - Note Report ID: `report-conv-456`

3. **Navigate Between Reports**
   - Go to `/reports/report-manual-123`
   - Verify: Manual report displays correctly
   - Verify: Form has "Manual Flow Test" data
   - Go to `/reports/report-conv-456`
   - Verify: Conversational report displays correctly
   - Verify: Chat has "Conversational Flow Test" data

4. **Verify No Data Leakage**
   - Verify in Console: No errors about wrong store access
   - Verify: Manual report doesn't show chat data
   - Verify: Conversational report doesn't show form data

**Expected Result**: ✅ Flows are completely isolated, no data leakage

---

### Test 3.2: Concurrent Operations ✅

**Objective**: Verify UI remains responsive during calculations

**Steps**:
1. **Start Manual Calculation**
   - Fill form in Manual Flow
   - Click "Calculate Valuation"
   - Verify: Button disables immediately

2. **Try to Click Button Again (During Calculation)**
   - Click "Calculate Valuation" button multiple times
   - Verify in Console:
     ```
     [Manual] Already calculating, preventing duplicate submission
     ```
   - Verify: No duplicate API calls (check Network tab)

3. **Navigate to Other Tab During Calculation**
   - While calculation running, click "Info" tab
   - Verify: Tab switches successfully
   - Verify: Loading continues in background
   - When calculation completes, go back to Preview tab
   - Verify: Report displays correctly

**Expected Result**: ✅ No duplicate submissions, UI remains responsive

---

## Test Suite 4: Error Scenarios

### Test 4.1: Python Engine Failure ✅

**Objective**: Verify graceful handling of Python engine failures

**Steps**:
1. **Stop Python Engine**
   - Stop Python server (Ctrl+C in Terminal 2)

2. **Attempt Calculation**
   - Fill form with valid data
   - Click "Calculate Valuation"
   - Verify: Button disables immediately
   - Verify: After timeout, error message displays
   - Verify: Error message includes "calculation service" or "temporarily unavailable"

3. **Restart Python Engine**
   - Restart Python server
   - Retry calculation
   - Verify: Succeeds

**Expected Result**: ✅ Clear error message, recovery after restart

---

### Test 4.2: Network Timeout ✅

**Objective**: Verify handling of slow network

**Steps**:
1. **Simulate Slow Network** (Chrome DevTools)
   - Open DevTools → Network tab
   - Select "Slow 3G" from throttling dropdown

2. **Attempt Calculation**
   - Fill form
   - Click "Calculate Valuation"
   - Verify: Loading state shows
   - Verify: Progress indicator updates (if implemented)
   - Wait for response (may take 30-60 seconds)
   - Verify: Eventually completes or times out gracefully

3. **Reset Network**
   - Select "No throttling"
   - Verify: Next calculation is fast

**Expected Result**: ✅ Handles slow network gracefully

---

## Test Suite 5: M&A Workflow (Version History)

### Test 5.1: Version Creation ✅

**Objective**: Verify version history tracks changes

**Steps**:
1. **Create Initial Valuation**
   - Fill form: Company Name: `Versioning Test`, Revenue: `1000000`, EBITDA: `150000`
   - Click "Calculate Valuation"
   - Verify: Version history shows "v1 - Initial valuation"

2. **Modify and Recalculate**
   - Change Revenue to `1500000`
   - Click "Calculate Valuation"
   - Verify: Version history shows:
     - "v2 - Updated valuation" (active)
     - "v1 - Initial valuation"

3. **Load Previous Version**
   - Click "History" tab
   - Click on "v1 - Initial valuation"
   - Verify: Form data changes to v1 values (Revenue = `1000000`)
   - Verify: Report shows v1 calculation
   - Verify: Version indicator shows "Viewing v1"

4. **Return to Latest Version**
   - Click on "v2 - Updated valuation"
   - Verify: Form and report restore to v2

**Expected Result**: ✅ Version history tracks all changes, can view any version

---

## Test Suite 6: UI/UX Validation

### Test 6.1: Loading States ✅

**Objective**: Verify all loading states are visually clear

**Steps**:
1. **Button States**
   - Before calculation: "Calculate Valuation" (enabled, blue)
   - During calculation: "Calculating..." (disabled, gray)
   - After calculation: "Calculate Valuation" (enabled, blue)

2. **Preview Panel States**
   - Before calculation: Empty state with icon and text
   - During calculation: Loading spinner with "Calculating..." text
   - After calculation: HTML report

3. **Progress Indicators**
   - Verify: Progress bar shows during long operations (if implemented)
   - Verify: Percentage updates in real-time

**Expected Result**: ✅ Clear visual feedback at every stage

---

### Test 6.2: Responsive Design ✅

**Objective**: Verify UI works on different screen sizes

**Steps**:
1. **Desktop (1920x1080)**
   - Verify: Form and preview side-by-side
   - Verify: All fields visible
   - Verify: Report renders correctly

2. **Tablet (768x1024)**
   - Resize browser window
   - Verify: Layout adjusts
   - Verify: Form and preview may stack vertically
   - Verify: All functionality works

3. **Mobile (375x667)**
   - Resize to mobile size
   - Verify: Mobile-optimized layout
   - Verify: Tabs switch between form and preview
   - Verify: Can complete full flow on mobile

**Expected Result**: ✅ Responsive design works across all screen sizes

---

## Console Monitoring Guide

### Expected Logs (Happy Path)

**Manual Flow Calculation**:
```
[Manual] Form onSubmit handler called
[Manual] Loading state set to true immediately (< 16ms)
[Manual] Form submit triggered
[Backend] POST /api/valuations/calculate
[Backend] Calculation started {dataSource: "manual", creditCost: 0}
[Python] Processing valuation
[Python] Step 1: Validation complete
[Python] Step 2-11: Calculations complete
[Python] Report generation complete
[Backend] Response received {status: 200, hasHtmlReport: true}
[Manual] Valuation result set {valuationId: "...", hasHtmlReport: true}
[Manual] Session saved successfully
```

**Conversational Flow Calculation**:
```
[Conversational] Manual calculate triggered
[Conversational] Loading state set to true immediately (< 16ms)
[Backend] POST /api/valuations/calculate
[Backend] Calculation started {dataSource: "ai-guided", creditCost: 1}
[Python] Processing valuation
[Python] Calculation complete
[Backend] Response received
[Conversational] Complete session saved atomically
[Conversational] Background save succeeded
```

### Error Logs to Watch For

**🔴 Critical Errors** (Must Fix):
```
[ERROR] Calculation failed: Network error
[ERROR] Failed to save session
[ERROR] Race condition detected
[ERROR] CRITICAL: html_report missing or empty
```

**🟡 Warnings** (Investigate):
```
[WARN] Already calculating, preventing duplicate submission
[WARN] Cannot update session data: no active session
[WARN] Slow operation detected {duration: "XYZms"}
```

**🟢 Info** (Normal):
```
[INFO] Session loaded successfully
[INFO] Valuation result stored
[INFO] Version created
```

---

## Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| Button Click → Loading State | < 16ms | < 50ms | < 100ms |
| Form Submit → API Call | < 100ms | < 200ms | < 500ms |
| Total Calculation Time | < 2s | < 5s | < 10s |
| Page Load → Interactive | < 1s | < 2s | < 3s |
| Auto-save Trigger | ~500ms | < 1s | < 2s |
| Session Restore Time | < 500ms | < 1s | < 2s |

### How to Measure

**Chrome DevTools Performance**:
1. Open DevTools → Performance tab
2. Click "Record" button
3. Perform action (e.g., click Calculate)
4. Click "Stop" button
5. Analyze timeline:
   - Look for "Click" event
   - Measure time to first visual change (< 16ms)
   - Measure time to API call (< 100ms)

---

## Sign-Off Checklist

### Manual Flow ✅
- [ ] Test 1.1: New report creation works
- [ ] Test 1.2: Form validation works
- [ ] Test 1.3: Session restoration works
- [ ] Test 1.4: Error handling works
- [ ] Test 1.5: Auto-save works
- [ ] No console errors during normal flow
- [ ] Performance targets met
- [ ] UI states are clear

### Conversational Flow ✅
- [ ] Test 2.1: AI-guided report creation works
- [ ] Test 2.2: Session restoration works
- [ ] Chat history persists
- [ ] No console errors during normal flow
- [ ] Performance targets met
- [ ] UI states are clear

### Cross-Flow ✅
- [ ] Test 3.1: Flows are isolated
- [ ] Test 3.2: Concurrent operations handled
- [ ] No data leakage between flows
- [ ] No race conditions detected

### Error Handling ✅
- [ ] Test 4.1: Backend failure handled gracefully
- [ ] Test 4.2: Network timeout handled gracefully
- [ ] Error messages are clear and actionable
- [ ] Recovery after errors works

### M&A Workflow ✅
- [ ] Test 5.1: Version history works
- [ ] Can view previous versions
- [ ] Can return to latest version
- [ ] Version labels are clear

### UI/UX ✅
- [ ] Test 6.1: Loading states are clear
- [ ] Test 6.2: Responsive design works
- [ ] No layout issues
- [ ] All interactive elements work

---

## Sign-Off Statement

**I certify that**:
1. ✅ All tests in this guide have been completed
2. ✅ All critical tests passed (no blockers)
3. ✅ Performance targets met or exceeded
4. ✅ Error handling is graceful and clear
5. ✅ UI/UX is smooth and responsive
6. ✅ No race conditions or data leakage detected
7. ✅ Documentation is accurate and up-to-date

**Status**: 🟢 **APPROVED FOR PRODUCTION**

**Signed By**: _________________  
**Date**: December 16, 2025  
**Role**: QA Engineer / CTO

---

## Quick Reference: Test Commands

```bash
# Start all services
npm run dev:all

# Or individually:
cd apps/upswitch-backend && npm run dev
cd apps/upswitch-valuation-engine && python -m uvicorn main:app --reload
cd apps/upswitch-valuation-tester && npm run dev

# Check health
curl http://localhost:3001/health
curl http://localhost:8000/health

# Run tests
cd apps/upswitch-valuation-tester
npm test

# Check TypeScript
npm run type-check

# Check linter
npm run lint
```

---

**Last Updated**: December 16, 2025  
**Next Review**: After manual testing complete  
**Status**: 📋 Ready for Testing

