# Valuation Tester Refactoring & Next.js Migration - Execution Plan

## Overview

**Goal**: Finalize valuation tester by removing all calculation logic, cleaning legacy code, breaking down large files, and migrating to Next.js App Router.

**Core Principle**: Frontend ONLY collects data and displays HTML reports from Python backend. Zero calculation logic.

## Current Flow Analysis

```
HomePage (/)
  ↓
ValuationReport (/reports/:reportId)
  ↓
ValuationSessionManager (manages session, credits, auth)
  ↓
ValuationFlowSelector (routes to manual/conversational)
  ↓
ManualValuationFlow OR ConversationalValuationFlow
  ↓
ValuationForm (collects data) → Backend API → Python Engine
  ↓
Results Component (displays html_report + info_tab_html from backend)
```

## Phase 1: Remove Calculation Logic & Legacy Code

### 1.1 Remove Calculation Logic from ValuationProcessor

**File**: `src/engines/stream/valuation-processor/ValuationProcessor.ts`

**Remove**:
- `recommendCalculationMethod()` - Python backend handles this
- `scoreMethodologySuitability()` - Python backend handles this  
- `assessValuationQuality()` - Python backend handles this
- `detectValuationAnomalies()` - Python backend handles this
- `METHODOLOGY_SCORES` constant - Calculation logic

**Keep**:
- `processValuationPreview()` - Just extracts data from backend response
- `processValuationComplete()` - Just extracts data from backend response
- `validatePreview()` - Basic validation only (not calculation)
- `validateValuationResult()` - Basic validation only (not calculation)

**Action**: Refactor to only extract and validate data, no calculation logic.

### 1.2 Review Financial Constants & Config

**Files**: 
- `src/config/financialConstants.ts`
- `src/config/valuationConfig.ts`

**Decision**: 
- If used only for display/validation thresholds → Keep
- If used for calculations → Remove

**Action**: Check usage with grep, remove if calculation-related.

### 1.3 Remove Deprecated Calculation Functions

**File**: `src/utils/valuationDataExtractor.ts`

**Already deprecated**:
- `getStepData()` - Returns null (good)
- `getAllStepData()` - Returns empty array (good)

**Action**: Verify no code calls these, remove if unused.

### 1.4 Clean Transformation Service

**File**: `src/services/transformationService.ts`

**Keep**:
- `transformRegistryDataToValuationRequest()` - Data transformation (OK)
- `validateDataForValuation()` - Validation (OK)

**Review**:
- `calculateDataQuality()` - If just for display/validation → Keep, if for calculation → Remove
- `inferBusinessModel()` - If just for API request → Keep

**Action**: Review and simplify if needed.

## Phase 2: Remove Legacy & Unused Code

### 2.1 Remove Unused Engines

**Check**: `src/engines/` folder

**Files to review**:
- `src/engines/valuation/ValuationCallbacks.ts` - Check if used
- `src/engines/data-collection/DataCollectionEngine.ts` - Check if used
- `src/engines/ui-rendering/MessageRenderer.ts` - Check if used
- `src/engines/streaming/StreamingCoordinator.ts` - Check if duplicates StreamEventHandler

**Action**: 
1. Grep for imports
2. Remove if unused
3. Consolidate duplicates

### 2.2 Remove Backup Files

**Files**:
- `src/features/manual-valuation/components/ManualValuationFlow.tsx.backup`

**Action**: Delete backup files.

### 2.3 Remove Duplicate Components

**Check for duplicates**:
- `StreamingChat.tsx` vs `StreamingChat.Modular.tsx`
- `api.ts` vs `api.enhanced.ts`

**Action**: Keep one, remove duplicate.

## Phase 3: Break Down Large Files

### 3.1 StreamingChat.tsx (1723 lines)

**Break into**:
```
src/features/conversational-valuation/components/chat/
├── StreamingChat.tsx (orchestrator, ~200 lines)
├── ChatInput.tsx (~150 lines)
├── ChatMessages.tsx (~200 lines)
├── ChatMessage.tsx (~100 lines)
├── TypingIndicator.tsx (~50 lines)
├── hooks/
│   ├── useStreamingChat.ts (~200 lines)
│   └── useChatState.ts (~150 lines)
└── utils/
    ├── messageFormatter.ts (~100 lines)
    └── chatHelpers.ts (~100 lines)
```

### 3.2 StreamEventHandler.ts (1460 lines)

**Break into**:
```
src/services/chat/stream/
├── StreamEventHandler.ts (orchestrator, ~200 lines)
├── EventParser.ts (~200 lines)
├── EventRouter.ts (~150 lines)
├── handlers/
│   ├── ValuationEventHandler.ts (~200 lines)
│   ├── MessageEventHandler.ts (~150 lines)
│   ├── ErrorEventHandler.ts (~100 lines)
│   └── ProgressEventHandler.ts (~100 lines)
└── types/
    └── streamEvents.ts (~100 lines)
```

### 3.3 ValuationForm.tsx (961 lines)

**Break into**:
```
src/features/manual-valuation/components/form/
├── ValuationForm.tsx (orchestrator, ~150 lines)
├── CompanyInfoSection.tsx (~150 lines)
├── FinancialDataSection.tsx (~200 lines)
├── HistoricalDataSection.tsx (~150 lines)
├── BusinessDetailsSection.tsx (~100 lines)
├── hooks/
│   ├── useValuationForm.ts (~150 lines)
│   └── useFormValidation.ts (~100 lines)
└── utils/
    └── formHelpers.ts (~100 lines)
```

### 3.4 ValuationProcessor.ts (735 lines)

**After removing calculation logic, break into**:
```
src/features/valuation/services/
├── ValuationDataExtractor.ts (~200 lines) - Extract data from responses
├── ValuationValidator.ts (~150 lines) - Validate responses
└── types/
    └── valuationData.ts (~100 lines)
```

### 3.5 Store Files (798 + 730 lines)

**Break into**:
```
src/store/valuation/
├── useValuationStore.ts (main store, ~200 lines)
├── slices/
│   ├── valuationSlice.ts (~150 lines)
│   ├── formSlice.ts (~150 lines)
│   └── uiSlice.ts (~100 lines)
└── selectors.ts (~100 lines)

src/store/session/
├── useValuationSessionStore.ts (main store, ~200 lines)
├── slices/
│   ├── sessionSlice.ts (~150 lines)
│   └── viewSlice.ts (~100 lines)
└── selectors.ts (~100 lines)
```

## Phase 4: Apply Refactoring Standards

### 4.1 Feature-Based Architecture

**Structure**:
```
src/
├── app/                          # Next.js App Router
│   ├── (tester)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # HomePage
│   │   └── reports/[id]/
│   │       └── page.tsx          # ValuationReport
│   └── api/                       # API routes if needed
├── features/
│   ├── manual-valuation/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.ts
│   ├── conversational-valuation/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.ts
│   ├── reports/
│   │   ├── components/
│   │   └── hooks/
│   └── auth/
│       ├── components/
│       └── hooks/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
└── config/
```

### 4.2 Error Handling

**Implement**:
- Specific error types: `ValidationError`, `NetworkError`, `CreditError`
- Error boundaries per route
- Zero generic error handling

### 4.3 Type Safety

**Implement**:
- Remove all `any` types
- Add Zod schemas for API responses
- Type guards for runtime validation

### 4.4 Component Size Limits

**Enforce**:
- Components: <250 lines (max 300)
- Hooks: <100 lines (max 150)
- Services: <300 lines (max 500)

## Phase 5: Next.js Migration

### 5.1 Initialize Next.js

**Steps**:
1. Create `next.config.js`
2. Set up `app/` directory structure
3. Configure TypeScript for Next.js
4. Set up Tailwind CSS
5. Configure path aliases

### 5.2 Migrate Routes

**Current** → **Next.js**:
- `/` → `app/(tester)/page.tsx` (HomePage)
- `/reports/:reportId` → `app/(tester)/reports/[id]/page.tsx` (ValuationReport)
- `/reports/new` → `app/(tester)/reports/new/page.tsx` (redirect)

### 5.3 Convert Components

**Server Components** (static content):
- Report display components
- Static pages

**Client Components** (`'use client'`):
- Forms
- Interactive components
- Zustand stores

### 5.4 Implement Server Actions

**Convert**:
- Form submissions → Server Actions
- API calls → Route Handlers or Server Actions

## Phase 6: Testing & Documentation

### 6.1 Testing

- Component tests
- Integration tests
- E2E tests

### 6.2 Documentation

- Update README.md
- Component documentation
- Migration guide
- Refactoring log

## Execution Order

1. **Week 1**: Remove calculation logic & legacy code
2. **Week 2**: Break down large files
3. **Week 3**: Apply refactoring standards
4. **Week 4**: Next.js migration setup
5. **Week 5**: Migrate components & routes
6. **Week 6**: Testing & polish

## Success Criteria

- ✅ Zero calculation logic in frontend
- ✅ All files <300 lines
- ✅ Feature-based architecture
- ✅ Next.js App Router implemented
- ✅ Zero TypeScript errors
- ✅ Zero generic error handling
- ✅ All tests passing
- ✅ Documentation complete

