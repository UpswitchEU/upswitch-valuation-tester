# Valuation Tester Cleanup & Refactoring Progress

## Phase 1: Remove Calculation Logic ✅ IN PROGRESS

### Completed:
- ✅ Removed calculation methods from ValuationProcessor.ts:
  - `recommendCalculationMethod()` - Removed (Python backend handles)
  - `scoreMethodologySuitability()` - Removed (Python backend handles)
  - `assessValuationQuality()` - Removed (Python backend handles)
  - `detectValuationAnomalies()` - Removed (Python backend handles)
  - `METHODOLOGY_SCORES` constant - Removed
  - Private helper methods removed
- ✅ Updated exports in `engines/stream/index.ts`
- ✅ Removed backup file: `ManualValuationFlow.tsx.backup`

### To Do:
- [ ] Check if `financialConstants.ts` is used (only imported in itself)
- [ ] Check if `valuationConfig.ts` is used (only imported in itself)
- [ ] Remove if unused

## Phase 2: Remove Legacy & Duplicate Code

### Files to Review:
- [ ] `src/services/api.enhanced.ts` - Not imported anywhere, likely unused
- [ ] `src/components/StreamingChat.Modular.tsx` - Check if used vs StreamingChat.tsx
- [ ] `src/App.enhanced.tsx` - Check if used vs App.tsx

### Engines to Review:
- [ ] Check if all engines in `src/engines/` are actually used
- [ ] Remove unused engines

## Phase 3: Break Down Large Files

### Priority Files (>500 lines):
1. **StreamingChat.tsx** (1723 lines) → Break into:
   - ChatInput.tsx
   - ChatMessages.tsx
   - ChatMessage.tsx
   - hooks/useStreamingChat.ts
   - hooks/useChatState.ts

2. **StreamEventHandler.ts** (1460 lines) → Break into:
   - EventParser.ts
   - EventRouter.ts
   - handlers/ValuationEventHandler.ts
   - handlers/MessageEventHandler.ts

3. **ValuationForm.tsx** (961 lines) → Break into:
   - CompanyInfoSection.tsx
   - FinancialDataSection.tsx
   - HistoricalDataSection.tsx
   - hooks/useValuationForm.ts

4. **useValuationSessionStore.ts** (798 lines) → Break into slices

5. **useValuationStore.ts** (730 lines) → Break into slices

6. **ValuationProcessor.ts** (735 lines) → Already cleaned, now ~400 lines ✅

## Next Steps

1. Complete Phase 1 cleanup
2. Remove unused files
3. Start breaking down large files
4. Then proceed with Next.js migration

