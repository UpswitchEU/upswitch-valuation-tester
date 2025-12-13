# Valuation Feature

**Purpose**: Unified orchestration of valuation workflows across manual and conversational flows.

## What

The Valuation feature provides a unified interface for handling business valuation workflows. It consolidates the previously separate ManualValuationFlow and ConversationalValuationFlow into a single, configurable ValuationFlow component that can handle both flow types based on configuration.

## Why

- **Reduced Code Duplication**: Eliminates duplicate logic between manual and conversational flows
- **Unified Interface**: Single component API for all valuation workflows
- **Maintainability**: Centralized flow orchestration logic
- **Extensibility**: Easy to add new flow types in the future

## How

```tsx
import { ValuationFlow } from '@/features/valuation';

// Manual flow
<ValuationFlow
  reportId="report-123"
  flowType="manual"
  onComplete={(result) => console.log(result)}
/>

// Conversational flow
<ValuationFlow
  reportId="report-123"
  flowType="conversational"
  initialQuery="What type of business?"
  autoSend={true}
  onComplete={(result) => console.log(result)}
/>
```

## Architecture

### Components

- **`ValuationFlow`**: Main unified component that orchestrates flow selection and rendering

### Flow Types

- **`manual`**: Traditional form-based data collection with structured inputs
- **`conversational`**: AI-assisted chat interface for natural data collection

### Data Flow

1. Flow selection based on `flowType` prop
2. Data collection via appropriate method (forms vs. chat)
3. Backend valuation calculation
4. Results display via unified Results component

---

## 📁 Directory Structure

```
features/valuation/
├── components/
│   └── ValuationFlow.tsx    # Unified flow component
├── index.ts                 # Public exports
└── README.md               # This file
```

## 🔧 Usage Examples

### Basic Manual Flow

```tsx
function ManualValuation({ reportId, onComplete }) {
  return (
    <ValuationFlow
      reportId={reportId}
      flowType="manual"
      onComplete={onComplete}
    />
  );
}
```

### Conversational Flow with Initial Query

```tsx
function ConversationalValuation({ reportId, initialQuery, onComplete }) {
  return (
    <ValuationFlow
      reportId={reportId}
      flowType="conversational"
      initialQuery={initialQuery}
      autoSend={true}
      onComplete={onComplete}
    />
  );
}
```

## 📚 Related Documentation

- [Frontend Refactoring Guide](../../../../../docs/refactoring/02-FRONTEND-REFACTORING-GUIDE.md)
- [Bank-Grade Excellence Framework](../../../../../docs/refactoring/BANK_GRADE_EXCELLENCE_FRAMEWORK.md)
- [Manual Valuation Flow](../manual-valuation/)
- [Conversational Valuation Flow](../conversational-valuation/)

---

**Last Updated**: December 13, 2025
**Status**: Production Ready
**Maintainer**: Frontend Team