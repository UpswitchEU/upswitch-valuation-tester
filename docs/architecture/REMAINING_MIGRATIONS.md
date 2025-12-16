# Remaining Migrations - Legacy Store References

**Status**: 🔄 In Progress  
**Date**: December 16, 2025

---

## Files Still Using Old Stores (21 files)

### Category A: Can Be Deleted (Backup/Docs)
1. ✅ `src/features/conversational/components/ReportPanel.tsx.backup` - Delete
2. ✅ `src/features/manual/README.md` - Update or keep
3. ✅ `src/store/_archived/README.md` - Keep (documentation)
4. ✅ `src/store/_archived/useValuationSessionStore.ts` - Keep (archived)

### Category B: Utility Files (Update Imports)
5. `src/utils/sessionHelpers.ts` - Make flow-agnostic or update
6. `src/utils/newReportDetector.ts` - Update to use flow-specific stores
7. `src/hooks/useSessionRestoration.ts` - Update to detect flow and use correct stores
8. `src/hooks/useFormSessionSync.ts` - Update for Manual flow only
9. `src/hooks/valuationToolbar/useValuationToolbarName.ts` - Make prop-driven
10. `src/hooks/valuationToolbar/useValuationToolbarFlow.ts` - Make prop-driven

### Category C: Shared Components (Make Prop-Driven)
11. `src/components/results/Results.tsx` - Make prop-driven
12. `src/components/ValuationInfoPanel.tsx` - Make prop-driven
13. `src/components/ValuationToolbar.tsx` - Make prop-driven
14. `src/components/ValuationSessionManager.tsx` - Update to detect flow

### Category D: Conversational Flow (Update to Conversational Stores)
15. `src/features/conversational/hooks/useConversationRestoration.ts` - Update
16. `src/hooks/useConversationalToolbar.ts` - Update
17. `src/hooks/chat/useStreamingCoordinator.ts` - Update
18. `src/services/chat/StreamEventHandler.ts` - Already flow-agnostic (verify)

### Category E: Manual Flow (Update to Manual Stores)
19. `src/features/manual/hooks/useManualToolbar.ts` - Update

### Category F: Other Services (Update or Remove)
20. `src/features/valuation/services/sessionService.ts` - Verify if needed
21. `src/components/registry/RegistryDataPreview.tsx` - Update or verify

---

## Strategy

**Phase 1: Quick Wins (Delete/Skip)**
- Delete `.backup` files
- Skip archived stores (they're supposed to reference old stores)

**Phase 2: Critical Path (Conversational Flow)**
- Update conversational hooks to use `useConversational*` stores
- Ensure Conversational flow works end-to-end

**Phase 3: Shared Components**
- Make shared components prop-driven (no direct store access)
- Parent components pass data from appropriate stores

**Phase 4: Cleanup**
- Update utility files
- Remove unused services
- Verify build passes

---

## Execution Order

1. ✅ Delete backup files
2. ✅ Update Conversational hooks
3. ✅ Update Manual hooks
4. ⏳ Make shared components prop-driven
5. ⏳ Update utility files
6. ⏳ Verify build and tests

