# Shared Data Collection Abstraction

## Purpose

This module provides a unified data collection abstraction that extracts ~60% of duplicated logic between different collection methods (manual forms, conversational AI, file uploads, etc.).

## Problem Solved

**Before**: Duplication between renderers
```typescript
// ManualFormFieldRenderer.tsx (~150 lines)
// - Validation logic: 40 lines
// - Normalization logic: 35 lines  
// - Type conversion: 25 lines
// - UI rendering: 50 lines

// ConversationalFieldRenderer.tsx (~120 lines)
// - Validation logic: 40 lines (DUPLICATE)
// - Normalization logic: 35 lines (DUPLICATE)
// - Type conversion: 25 lines (DUPLICATE)
// - UI rendering: 20 lines (different)

// Total: ~100 lines of duplication
```

**After**: Shared base class
```typescript
// DataCollectorBase.ts (~350 lines)
// - Validation logic: 100 lines (SHARED)
// - Normalization logic: 100 lines (SHARED)
// - Type conversion: 80 lines (SHARED)
// - Abstract methods: 20 lines

// ManualFormFieldRenderer.tsx (~80 lines)
// - Uses formCollector.validateField()
// - Uses formCollector.normalizeValue()
// - UI rendering: 50 lines (unique)

// ConversationalFieldRenderer.tsx (~50 lines)
// - Uses chatCollector.validateField()
// - Uses chatCollector.normalizeValue()
// - UI rendering: 20 lines (unique)

// Reduction: ~100 lines of duplication removed
```

## Architecture

### Base Class: `DataCollectorBase`

```typescript
abstract class DataCollectorBase {
  // SHARED LOGIC (same for all collectors)
  validateField(field, value): ValidationError[]
  normalizeValue(field, value): ParsedFieldValue
  formatValue(field, value): string
  
  // ABSTRACT (each collector implements)
  abstract getCollectionMethod(): DataCollectionMethod
  abstract getDisplayName(): string
}
```

### Concrete Implementations

```typescript
class FormDataCollector extends DataCollectorBase {
  // Manual form input
}

class ChatDataCollector extends DataCollectorBase {
  // Conversational AI extraction
}

class SuggestionDataCollector extends DataCollectorBase {
  // Click-based selection
}

class FileDataCollector extends DataCollectorBase {
  // Future: file upload parsing
}
```

## Usage

### In Manual Form Renderer

```typescript
import { formCollector } from '@/features/shared/dataCollection'

const ManualFormFieldRenderer = ({ field, value, onChange }) => {
  // Validate using shared logic
  const errors = formCollector.validateField(field, value)
  
  // Normalize using shared logic
  const normalizedValue = formCollector.normalizeValue(field, rawInput)
  
  // Format for display using shared logic
  const displayValue = formCollector.formatValue(field, value)
  
  // Render UI (unique to form)
  return <input ... />
}
```

### In Conversational Renderer

```typescript
import { chatCollector } from '@/features/shared/dataCollection'

const ConversationalFieldRenderer = ({ field, value, onChange }) => {
  // Validate using SAME shared logic
  const errors = chatCollector.validateField(field, value)
  
  // Normalize using SAME shared logic
  const normalizedValue = chatCollector.normalizeValue(field, chatResponse)
  
  // Format for display using SAME shared logic
  const displayValue = chatCollector.formatValue(field, value)
  
  // Render UI (unique to chat)
  return <ChatBubble ... />
}
```

## Benefits

### 1. DRY (Don't Repeat Yourself)
- Validation logic written once, used everywhere
- Normalization logic written once, used everywhere
- Bug fixes in one place benefit all collectors

### 2. Consistency
- All collection methods use same validation rules
- All collection methods normalize data identically
- Guaranteed consistent behavior across flows

### 3. Extensibility
- Adding new collection method (e.g., voice input):
  ```typescript
  class VoiceDataCollector extends DataCollectorBase {
    getCollectionMethod() { return 'voice_input' }
    getDisplayName() { return 'Voice Input' }
    // Inherits all validation/normalization logic ✅
  }
  ```

### 4. Testability
- Test validation logic once in `DataCollectorBase.test.ts`
- Test UI rendering separately in renderer tests
- Clear separation of concerns

## What's NOT Shared (Intentionally)

### UI Rendering
Each renderer keeps its own UI:
- Forms use `<input>`, `<select>`, `<textarea>`
- Chat uses `<ChatBubble>`, `<UserResponse>`
- Suggestions use `<SuggestionChips>`

**Why**: Different UX patterns require different rendering

### Examples & Questions
- Form fields show placeholder text
- Chat fields ask natural language questions
- Suggestion fields show pre-defined options

**Why**: Different user experiences, same underlying data

## Testing Strategy

```typescript
// Test shared logic once
describe('DataCollectorBase', () => {
  describe('validateField', () => {
    it('validates required fields')
    it('validates min/max constraints')
    it('validates custom rules')
  })
  
  describe('normalizeValue', () => {
    it('normalizes currency values')
    it('normalizes percentages')
    it('normalizes dates')
  })
})

// Test UI separately
describe('ManualFormFieldRenderer', () => {
  it('renders input correctly')
  it('shows error messages')
})

describe('ConversationalFieldRenderer', () => {
  it('renders chat bubble correctly')
  it('shows AI avatar')
})
```

## Migration Guide

### Before (Duplicated)
```typescript
// ManualFormFieldRenderer.tsx
const handleChange = (rawValue) => {
  // Inline validation
  if (!rawValue) {
    setError('Required')
    return
  }
  
  // Inline normalization
  const cleaned = rawValue.replace(/[$,]/g, '')
  const number = parseFloat(cleaned)
  
  onChange(number)
}
```

### After (Using Abstraction)
```typescript
// ManualFormFieldRenderer.tsx
import { formCollector } from '@/features/shared/dataCollection'

const handleChange = (rawValue) => {
  // Validation (shared)
  const errors = formCollector.validateField(field, rawValue)
  if (errors.length > 0) {
    setErrors(errors)
    return
  }
  
  // Normalization (shared)
  const normalized = formCollector.normalizeValue(field, rawValue)
  
  onChange(normalized, formCollector.getCollectionMethod())
}
```

## File Structure

```
src/features/shared/dataCollection/
├── DataCollectorBase.ts      # Base class + implementations
├── index.ts                    # Barrel export
└── README.md                   # This file
```

## Maintenance

**When adding a new field type**:
1. Update `DataFieldType` in `types/data-collection.ts`
2. Add normalization logic to `normalizeValue()`
3. Add validation logic to `validateFieldType()`
4. Add formatting logic to `formatValue()`
5. All collectors inherit new behavior ✅

**When adding a new collection method**:
1. Extend `DataCollectorBase`
2. Implement `getCollectionMethod()` and `getDisplayName()`
3. Inherit all validation/normalization ✅

## References

- **Types**: `src/types/data-collection.ts`
- **Manual Renderer**: `src/components/data-collection/renderers/ManualFormFieldRenderer.tsx`
- **Chat Renderer**: `src/components/data-collection/renderers/ConversationalFieldRenderer.tsx`
- **SOLID Principles**: Follows SRP, OCP, LSP, ISP, DIP

---

**Created**: December 2024  
**Status**: ✅ Production Ready  
**Maintainer**: Frontend Team
