# SuggestionChips Component - Data Flow Documentation

## Component Overview

The `SuggestionChips` component displays clickable suggestion chips for user input assistance (e.g., country selection).

## Frontend Component Structure

**File**: `apps/upswitch-valuation-tester/src/components/SuggestionChips.tsx`

### Props Interface
```typescript
interface SuggestionChipsProps {
  suggestions: Suggestion[]  // Array of suggestion objects
  originalValue: string       // Original user input (for "Keep original" button)
  onSelect: (suggestion: string) => void  // Callback when chip is clicked
  onDismiss: () => void       // Callback for "Keep original" button
}

interface Suggestion {
  text: string        // Display text (e.g., "Belgium")
  confidence: number  // Confidence score (0-1)
  reason: string      // Tooltip reason text
}
```

### Component Behavior
- Displays suggestion chips with text, confidence indicator, and hover tooltip
- When clicked: calls `onSelect(suggestion.text)` - **sends the text value**
- Shows "Keep original" button if `originalValue` is provided

## Data Flow: Python → Node.js → Frontend

### 1. Python Backend (Response Coordinator)

**File**: `apps/upswitch-valuation-engine/src/services/triage/engines/coordinators/response_coordinator.py`

**Creates suggestions**:
```python
suggestions.append({
    'text': country_name,        # "Belgium" (display name)
    'value': country_code,       # "BE" (for backend processing)
    'confidence': 1.0,
    'reason': f'Primary operating country ({country_code})'
})
metadata['suggestions'] = suggestions
metadata['suggestion_type'] = 'country'
```

**Sent in `message_complete` event**:
```json
{
  "type": "message_complete",
  "content": "",
  "field": "country_code",
  "session_id": "...",
  "metadata": {
    "suggestions": [
      {
        "text": "Belgium",
        "value": "BE",
        "confidence": 1.0,
        "reason": "Primary operating country (BE)"
      }
    ],
    "suggestion_type": "country"
  }
}
```

### 2. Node.js Proxy

**File**: `apps/upswitch-backend/src/controllers/valuation.controller.ts`

- Receives SSE stream from Python
- **Passes through unchanged** (no modification)
- Pipes to frontend

### 3. Frontend Event Handler

**File**: `apps/upswitch-valuation-tester/src/services/chat/StreamEventHandler.ts`

- Receives `message_complete` event
- Stores message with metadata in `useConversationStore`
- Metadata includes `suggestions` array

### 4. Frontend Message Rendering

**File**: `apps/upswitch-valuation-tester/src/components/chat/MessageItem.tsx`

**Extracts suggestions**:
```typescript
const suggestions = getMetadataValue<unknown[]>('suggestions') || []
const suggestionType = getMetadataString('suggestion_type')

// Maps to SuggestionChips format
suggestions.map((s: unknown) => {
  if (typeof s === 'string') {
    return { text: s, confidence: 0, reason: '' }
  }
  return {
    text: (s as any)?.text || (s as any)?.company_name || (s as any)?.title || String(s),
    confidence: (s as any)?.confidence || 0,
    reason: (s as any)?.reason || '',
  }
})
```

**Renders SuggestionChips**:
```tsx
<SuggestionChips
  suggestions={mappedSuggestions}
  originalValue={getMetadataString('originalValue', '')}
  onSelect={onSuggestionSelect}  // Calls handleSuggestionSelect
  onDismiss={onSuggestionDismiss}
/>
```

### 5. User Selection Flow

**File**: `apps/upswitch-valuation-tester/src/components/StreamingChat.tsx`

**When chip is clicked**:
```typescript
handleSuggestionSelect: (suggestion: string) => {
  setInput(suggestion)        // Sets input to "Belgium"
  submitStream(suggestion)    // Sends "Belgium" to backend
}
```

**Backend receives**: `"Belgium"` (text value)

### 6. Backend Processing

**File**: `apps/upswitch-valuation-engine/src/services/triage/extractors/field_extraction_coordinator.py`

**Extracts country_code from user input**:
- Input: `"Belgium"` or `"belgium"`
- Extracts: `"BE"` using country name mapping
- Stores: `country_code = "BE"`

**Country name mapping**:
```python
country_name_to_code = {
    'BELGIUM': 'BE',
    'BELGIË': 'BE',
    'BELGIE': 'BE',
    'FRANCE': 'FR',
    # ... etc
}
```

## Current Issue

### Problem
When user clicks "Belgium" chip:
1. Frontend sends `"Belgium"` (text) to backend
2. Backend extracts `"BE"` from `"Belgium"` ✅ (works correctly)
3. **BUT**: Suggestions might not be showing because:
   - Metadata might not be properly merged from `decision.metadata`
   - `allowed_countries` might not be in the right place

### Solution Applied
- Enhanced logging to debug metadata flow
- Check both `metadata` and `decision.metadata` for `allowed_countries`
- Ensure suggestions are included in `message_complete` event

## Data Requirements Summary

### Python Backend Must Send:
```json
{
  "metadata": {
    "suggestions": [
      {
        "text": "Belgium",      // Required: Display name
        "value": "BE",          // Optional: Backend value (currently not used by frontend)
        "confidence": 1.0,      // Optional: Confidence score
        "reason": "..."         // Optional: Tooltip text
      }
    ],
    "suggestion_type": "country"  // Required: Type identifier
  }
}
```

### Frontend Expects:
- `suggestions`: Array of objects with `text`, `confidence`, `reason`
- `suggestion_type`: String (not "business_type" or "kbo")
- `originalValue`: Optional string for "Keep original" button

### Node.js:
- **No changes needed** - passes through SSE stream unchanged

## Testing Checklist

- [ ] Suggestions appear when country question is asked
- [ ] Clicking "Belgium" chip sends "Belgium" to backend
- [ ] Backend extracts "BE" from "Belgium" correctly
- [ ] Conversation continues after selection
- [ ] "Keep original" button works (if originalValue provided)

