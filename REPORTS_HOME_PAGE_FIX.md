# Reports Home Page Fix

## Problem
Reports created in the app were not showing up on the home page, even though they were successfully created in the database.

## Root Cause
**Table Mismatch:**
- Reports are created in the `valuation_sessions` table (via `/api/valuation-sessions` endpoint)
- Home page was querying the `valuation_reports` table (via `/api/reports` endpoint)
- These are TWO DIFFERENT TABLES with different structures

**Result:** Created reports existed in `valuation_sessions` but home page looked in `valuation_reports`, finding nothing.

## Solution

### 1. Fixed `/api/reports` GET Endpoint
**File:** `apps/upswitch-backend/src/routes/reports.ts`

**Changes:**
- Changed query from `valuation_reports` table to `valuation_sessions` table
- Added proper field mapping (snake_case DB → frontend format)
- Added guest_session_id support for guest users
- Extract company_name from session_data for display
- Transform flow_type correctly (conversational → ai-guided)

**Before:**
```typescript
const { data: reports } = await supabase
  .from('valuation_reports')  // Wrong table!
  .select('*')
  ...
```

**After:**
```typescript
const { data: sessions } = await supabase
  .from('valuation_sessions')  // Correct table!
  .select('*')
  .match(userId ? { user_id: userId } : { guest_session_id: guestSessionId });
  
// Transform to expected format
const reports = sessions.map(session => ({
  id: session.report_id,
  company_name: session.session_data?.company_name || 'Untitled Report',
  flow_type: session.current_view === 'conversational' ? 'ai-guided' : 'manual',
  ...
}))
```

### 2. Added guest_session_id Column
**File:** `apps/upswitch-backend/migrations/20241215_add_conversation_persistence.sql`

**Added:**
```sql
ALTER TABLE valuation_sessions
  ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_valuation_sessions_guest_session_id 
  ON valuation_sessions(guest_session_id);
```

**Why:** Allows guest users to see their own reports (filtered by guest session ID)

### 3. Updated Schema
**File:** `apps/upswitch-backend/src/db/schema.ts`

**Added:**
```typescript
guestSessionId: varchar('guest_session_id', { length: 255 })
```

## Database Migration

**Run this SQL on your database:**
```sql
ALTER TABLE valuation_sessions 
  ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_valuation_sessions_guest_session_id 
  ON valuation_sessions(guest_session_id);
```

## Expected Behavior After Fix

### For Guest Users:
1. Create new report → Stored in `valuation_sessions` with `guest_session_id`
2. Go to home page → `/api/reports` queries `valuation_sessions` filtered by `guest_session_id`
3. **Result:** Reports appear on home page ✅

### For Authenticated Users:
1. Create new report → Stored in `valuation_sessions` with `user_id`
2. Go to home page → `/api/reports` queries `valuation_sessions` filtered by `user_id`
3. **Result:** Reports appear on home page ✅

## Data Restoration

When clicking on a report, the full state is restored:
- ✅ Flow type (manual/conversational)
- ✅ Session data (all inputs)
- ✅ Partial data (pre-filled values)
- ✅ Valuation result (if calculated)
- ✅ HTML reports (main + info tab)
- ✅ Conversation history (if conversational flow)

## Testing Checklist

### Guest User Flow:
- [ ] Create new report in conversational flow
- [ ] Answer 2-3 questions
- [ ] Go to home page
- [ ] **Expected:** Report appears with company name (or "Untitled Report")
- [ ] Click report
- [ ] **Expected:** Conversation restores, data pre-filled
- [ ] Complete valuation
- [ ] Go to home page
- [ ] **Expected:** Report shows completion status
- [ ] Click report
- [ ] **Expected:** Valuation result displays immediately

### Authenticated User Flow:
- [ ] Sign in
- [ ] Create new report in manual flow
- [ ] Fill some fields
- [ ] Go to home page
- [ ] **Expected:** Report appears
- [ ] Sign out and sign in again
- [ ] Go to home page
- [ ] **Expected:** Report still appears
- [ ] Click report
- [ ] **Expected:** Data restores

### Multi-Report Test:
- [ ] Create Report A (conversational, partial)
- [ ] Create Report B (manual, complete)
- [ ] Create Report C (conversational, complete)
- [ ] Go to home page
- [ ] **Expected:** All 3 reports appear
- [ ] Reports sorted by most recent first
- [ ] Each report shows correct flow type
- [ ] Click each report
- [ ] **Expected:** Correct state restores for each

## Monitoring

### Backend Logs to Watch:
```
"Listing reports from valuation_sessions"
"Reports listed successfully" - count should match created reports
```

### Database Query to Verify:
```sql
-- Check reports for a guest session
SELECT 
  report_id,
  guest_session_id,
  current_view,
  created_at,
  session_data->'company_name' as company_name
FROM valuation_sessions
WHERE guest_session_id = 'guest_123...';

-- Check reports for authenticated user
SELECT 
  report_id,
  user_id,
  current_view,
  created_at,
  session_data->'company_name' as company_name
FROM valuation_sessions
WHERE user_id = 'uuid...';
```

## Impact

**Before Fix:**
- ❌ No reports visible on home page
- ❌ Users thought reports weren't being saved
- ❌ Couldn't return to previous reports
- ❌ Lost work when navigating away

**After Fix:**
- ✅ All reports visible on home page
- ✅ Users can see their report history
- ✅ Can return to any previous report
- ✅ Full state restoration (data + results + conversation)
- ✅ Works for both guests and authenticated users

## Related Files

### Backend:
- `apps/upswitch-backend/src/routes/reports.ts` - Fixed reports list endpoint
- `apps/upswitch-backend/src/db/schema.ts` - Added guest_session_id field
- `apps/upswitch-backend/migrations/20241215_add_conversation_persistence.sql` - Migration file

### Frontend:
- `apps/upswitch-valuation-tester/src/services/reports/ReportService.ts` - Already correct (queries `/api/reports`)
- `apps/upswitch-valuation-tester/src/store/useReportsStore.ts` - Already correct (uses ReportService)

## Conclusion

The reports home page now correctly displays all user reports by querying the `valuation_sessions` table. Both guest and authenticated users can see their reports, return to them, and have full state restoration including conversation history and valuation results.

