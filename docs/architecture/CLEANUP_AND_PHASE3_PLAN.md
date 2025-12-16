# Cleanup & Phase 3 Plan - Complete Migration

**Status**: 📋 Planning  
**Date**: December 16, 2025  
**Goal**: Remove all legacy code, complete Conversational Flow migration, ensure clean setup

---

## Context

**Current State**:
- ✅ Phase 1 Complete: Manual stores and services created
- ✅ Phase 2 Complete: Manual Flow migrated
- ⚠️ **Problem**: 32 files still reference old shared stores
- ⚠️ **Problem**: Conversational Flow still uses old stores (causes races)
- ⚠️ **Problem**: Old stores still exist (unused legacy code)

**Goal**:
- Remove ALL legacy store code
- Migrate Conversational Flow to isolated stores
- Ensure 100% clean codebase with zero legacy dependencies
- Verify all 4 flows work perfectly

---

## Files Using Old Stores (32 files)

### Category 1: Conversational Flow Components (Must Migrate - Phase 3)
1. `src/features/conversational/components/ConversationalLayout.tsx`
2. `src/features/conversational/components/ConversationPanel.tsx`
3. `src/features/conversational/hooks/useConversationRestoration.ts`
4. `src/hooks/useConversationalToolbar.ts`
5. `src/store/useConversationStore.ts`

### Category 2: Shared/Utility Components (Must Update)
6. `src/components/results/Results.tsx`
7. `src/components/ValuationInfoPanel.tsx`
8. `src/components/ValuationToolbar.tsx`
9. `src/components/ValuationSessionManager.tsx`
10. `src/hooks/useSessionRestoration.ts`
11. `src/hooks/useFormSessionSync.ts`

### Category 3: Legacy Stores (Must Archive/Remove)
12. `src/store/useValuationApiStore.ts` ⚠️ OLD - Replace with Manual/Conversational
13. `src/store/useValuationFormStore.ts` ⚠️ OLD - Replace with Manual/Conversational
14. `src/store/useValuationResultsStore.ts` ⚠️ OLD - Replace with Manual/Conversational
15. `src/store/useValuationSessionStore.ts` ⚠️ OLD - Replace with Manual/Conversational

### Category 4: Chat/Streaming Services (Update to use Conversational stores)
16. `src/services/chat/handlers/ui/UIHandlers.ts`
17. `src/services/chat/handlers/valuation/ValuationHandlers.ts`
18. `src/services/chat/StreamEventHandler.ts`
19. `src/hooks/chat/useStreamingCoordinator.ts`

### Category 5: Utility Files (Update imports only)
20. `src/utils/sessionHelpers.ts`
21. `src/utils/sessionVerification.ts`
22. `src/utils/newReportDetector.ts`
23. `src/hooks/valuationToolbar/useValuationToolbarName.ts`
24. `src/hooks/valuationToolbar/useValuationToolbarFlow.ts`

### Category 6: Other Components (Update or Remove)
25. `src/features/manual/hooks/useManualToolbar.ts`
26. `src/store/useReportsStore.ts`
27. `src/features/valuation/services/sessionService.ts`
28. `src/components/registry/RegistryDataPreview.tsx`

### Category 7: Documentation/Backup (Safe to keep or remove)
29. `src/features/manual/README.md`
30. `src/features/conversational/README.md`
31. `src/features/conversational/components/ReportPanel.tsx.backup`
32. `src/components/ValuationForm/hooks/useValuationFormSubmission.ts` (already migrated)

---

## Migration Strategy

### Phase 3A: Migrate Conversational Flow (Priority 1)
**Goal**: Complete flow isolation for Conversational Flow

**Steps**:
1. Update `ConversationalLayout.tsx` to use `useConversationalResultsStore`, `useConversationalSessionStore`, `useConversationalChatStore`
2. Update `ConversationPanel.tsx` to use conversational stores
3. Update `useConversationalToolbar.ts` to use conversational stores
4. Update chat handlers to use conversational stores
5. Update streaming coordinator to use conversational stores

**Expected Time**: 2-3 hours

### Phase 3B: Update Shared Components (Priority 2)
**Goal**: Make shared components flow-agnostic (prop-driven)

**Steps**:
1. `Results.tsx` - Make prop-driven (no direct store access)
2. `ValuationInfoPanel.tsx` - Make prop-driven
3. `ValuationToolbar.tsx` - Make prop-driven
4. `ValuationSessionManager.tsx` - Update to detect flow and use correct stores
5. `useSessionRestoration.ts` - Update to use flow-specific stores

**Expected Time**: 2 hours

### Phase 3C: Archive Legacy Stores (Priority 3)
**Goal**: Remove old shared stores completely

**Steps**:
1. Create `src/store/_archived/` folder
2. Move old stores to archive:
   - `useValuationApiStore.ts` → `_archived/`
   - `useValuationFormStore.ts` → `_archived/`
   - `useValuationResultsStore.ts` → `_archived/`
   - `useValuationSessionStore.ts` → `_archived/`
3. Update all remaining imports to use new stores
4. Verify build passes
5. Run tests

**Expected Time**: 1 hour

### Phase 3D: Cleanup & Verification (Priority 4)
**Goal**: Ensure clean, working codebase

**Steps**:
1. Remove backup files (`.backup` files)
2. Update all documentation
3. Run full build: `npm run build`
4. Run type check: `npm run type-check`
5. Run linter: `npm run lint`
6. Run tests: `npm test`
7. Manual testing of all 4 flows

**Expected Time**: 1 hour

---

## Detailed Implementation Plan

### Step 1: Update ConversationalLayout (30 min)

**File**: `src/features/conversational/components/ConversationalLayout.tsx`

**Changes**:
```typescript
// BEFORE
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'

// AFTER
import { useConversationalResultsStore, useConversationalSessionStore, useConversationalChatStore } from '../../../store/conversational'
```

### Step 2: Update ConversationPanel (30 min)

**File**: `src/features/conversational/components/ConversationPanel.tsx`

**Changes**:
```typescript
// BEFORE
import { useValuationApiStore } from '../../../store/useValuationApiStore'

// AFTER
import { useConversationalResultsStore, useConversationalChatStore } from '../../../store/conversational'
```

### Step 3: Update Chat Handlers (1 hour)

**Files**:
- `src/services/chat/handlers/valuation/ValuationHandlers.ts`
- `src/services/chat/handlers/ui/UIHandlers.ts`
- `src/services/chat/StreamEventHandler.ts`

**Changes**: Use `valuationService`, `sessionService` instead of direct store access

### Step 4: Archive Legacy Stores (30 min)

**Create Archive Structure**:
```bash
mkdir -p src/store/_archived
mv src/store/useValuationApiStore.ts src/store/_archived/
mv src/store/useValuationFormStore.ts src/store/_archived/
mv src/store/useValuationResultsStore.ts src/store/_archived/
mv src/store/useValuationSessionStore.ts src/store/_archived/
```

**Add README**:
```markdown
# Archived Stores

These stores were replaced by flow-isolated stores in December 2025.

**Replacement**:
- `useValuationApiStore` → `useManualResultsStore` / `useConversationalResultsStore`
- `useValuationFormStore` → `useManualFormStore` (manual only)
- `useValuationResultsStore` → `useManualResultsStore` / `useConversationalResultsStore`
- `useValuationSessionStore` → `useManualSessionStore` / `useConversationalSessionStore`

Do not use these stores. They are kept for reference only.
```

### Step 5: Clean Build Verification

**Verification Steps**:
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Build
npm run build

# 5. Test
npm test

# 6. Start dev server
npm run dev
```

**Expected**: All commands pass with zero errors

---

## Success Criteria

### Code Quality ✅
- [ ] Zero files using old shared stores
- [ ] Zero linter errors
- [ ] Zero TypeScript errors
- [ ] All tests pass
- [ ] Build succeeds

### Architecture ✅
- [ ] Manual Flow uses `useManual*` stores only
- [ ] Conversational Flow uses `useConversational*` stores only
- [ ] All backend calls through services (no direct API calls)
- [ ] All shared components are prop-driven
- [ ] Zero legacy code in active codebase

### Performance ✅
- [ ] Calculation time <2s
- [ ] Load time <1s
- [ ] No memory leaks
- [ ] No race conditions
- [ ] Smooth UI interactions

---

## Rollback Plan

If issues are detected:

1. **Immediate Rollback** (< 5 min):
   ```bash
   git revert HEAD~N  # N = number of commits
   npm install
   npm run build
   ```

2. **Restore Archived Stores** (if needed):
   ```bash
   cp src/store/_archived/* src/store/
   git add src/store/
   git commit -m "Restore archived stores temporarily"
   ```

3. **Verify System**:
   - Test Manual Flow
   - Test Conversational Flow
   - Check console for errors

---

## Timeline

**Total Estimated Time**: 6-7 hours

### Day 1 (3-4 hours)
- ✅ Phase 3A: Migrate Conversational Flow (2-3 hours)
- ✅ Phase 3B: Update Shared Components (1 hour)

### Day 2 (3 hours)
- ✅ Phase 3C: Archive Legacy Stores (1 hour)
- ✅ Phase 3D: Cleanup & Verification (1 hour)
- ✅ Testing: Manual testing all 4 flows (1 hour)

---

## Next Actions

**Immediate (Start Now)**:
1. Migrate ConversationalLayout
2. Migrate ConversationPanel
3. Update chat handlers
4. Test Conversational Flow

**After Conversational Migration**:
1. Update shared components
2. Archive legacy stores
3. Clean build verification
4. Complete testing

---

## Risk Assessment

### Risks
- **Breaking Changes**: Conversational Flow might break during migration
- **Import Errors**: Missing or incorrect imports
- **Type Errors**: TypeScript might catch type mismatches
- **Runtime Errors**: Logic errors might only appear at runtime

### Mitigation
- **Test After Each Component**: Test immediately after migrating each component
- **Use Linter**: Run linter after each change
- **Incremental Commits**: Commit after each successful migration
- **Keep Backup**: Don't delete archived stores until fully verified

---

## Summary

This plan will:
1. ✅ **Complete Flow Isolation**: Conversational Flow will use isolated stores
2. ✅ **Remove Legacy Code**: Old shared stores will be archived
3. ✅ **Ensure Clean Setup**: Zero unused dependencies
4. ✅ **Verify Everything Works**: Comprehensive testing

**Expected Outcome**: Clean, robust codebase with complete flow isolation and zero legacy code.

