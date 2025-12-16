# Archived Stores

**Date Archived**: December 16, 2025  
**Reason**: Replaced by flow-isolated stores to prevent race conditions

---

## What Happened?

These stores were part of the original shared-state architecture where both Manual and Conversational flows used the same Zustand stores. This caused race conditions when:
- Loading existing reports while creating new ones
- Switching between Manual and Conversational flows
- Multiple users accessing the same session

## New Architecture

**Flow-Isolated Stores** (December 2025):
- Manual Flow: `src/store/manual/`
- Conversational Flow: `src/store/conversational/`
- Shared Services: `src/services/`

## Replacement Mapping

| Old Store (Archived) | New Store (Manual) | New Store (Conversational) |
|---------------------|-------------------|---------------------------|
| `useValuationApiStore` | `useManualResultsStore` | `useConversationalResultsStore` |
| `useValuationFormStore` | `useManualFormStore` | N/A (chat-based) |
| `useValuationResultsStore` | `useManualResultsStore` | `useConversationalResultsStore` |
| `useValuationSessionStore` | `useManualSessionStore` | `useConversationalSessionStore` |

## Key Improvements

1. **Zero Race Conditions**: Manual and Conversational flows cannot interfere with each other
2. **Atomic Operations**: All Zustand updates use functional updates (`set((state) => ...)`)
3. **Service Layer**: Shared business logic through `SessionService`, `ValuationService`, `ReportService`, `VersionService`
4. **Type Safety**: Better TypeScript types for flow-specific data
5. **Testability**: Each flow can be tested independently

## Migration Guide

### Before (Old Shared Stores)
```typescript
import { useValuationApiStore } from '../store/useValuationApiStore'
import { useValuationFormStore } from '../store/useValuationFormStore'

const { isCalculating, error } = useValuationApiStore()
const { formData, updateFormData } = useValuationFormStore()
```

### After (Flow-Isolated Stores)

**Manual Flow:**
```typescript
import { useManualResultsStore, useManualFormStore } from '../store/manual'

const { isCalculating, error } = useManualResultsStore()
const { formData, updateFormData } = useManualFormStore()
```

**Conversational Flow:**
```typescript
import { useConversationalResultsStore, useConversationalChatStore } from '../store/conversational'

const { isCalculating, error } = useConversationalResultsStore()
const { collectedData, updateCollectedData } = useConversationalChatStore()
```

## Do NOT Use These Stores

⚠️ **WARNING**: These archived stores are kept for reference only. Do not import or use them in new code.

If you need to access valuation state:
1. Determine which flow you're in (Manual or Conversational)
2. Use the appropriate flow-isolated store
3. Use shared services for backend communication

## Questions?

See:
- `docs/architecture/PHASE_1_IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `docs/architecture/PHASE_2_MIGRATION_PLAN.md` - Manual flow migration
- `docs/architecture/CLEANUP_AND_PHASE3_PLAN.md` - Conversational flow migration

---

**Last Updated**: December 16, 2025

