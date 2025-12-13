# @upswitch/data-collection

**Purpose**: Unified data collection engine for business valuation workflows.

## What

A reusable, extensible package that provides consistent data collection interfaces across different UI methods (manual forms, conversational AI, suggestions, fuzzy search, file upload).

## Why

- **Unified Interface**: Single API for all data collection methods
- **Extensible**: Easy to add new collection methods
- **Reusable**: Can be used across different applications (tester, popup, subdomain)
- **Type-Safe**: Full TypeScript support with comprehensive validation
- **Modular**: Clean separation between collection logic and UI rendering

## How

```typescript
import {
  DataCollection,
  DataCollector,
  ManualFormCollector,
  ConversationalCollector,
  BUSINESS_DATA_FIELDS
} from '@upswitch/data-collection';

// Create collector and register methods
const collector = new DataCollector();
collector.registerCollector('manual_form', new ManualFormCollector());
collector.registerCollector('conversational', new ConversationalCollector());

// Use in React component
function ValuationForm() {
  return (
    <DataCollection
      method="manual_form"
      onDataCollected={(responses) => console.log(responses)}
      onComplete={(responses) => submitValuation(responses)}
    />
  );
}
```

## Architecture

### Core Components

#### DataCollector
Central orchestrator that manages collection sessions and delegates to method-specific collectors.

#### Collectors
- **ManualFormCollector**: Traditional form inputs
- **ConversationalCollector**: AI chat-based extraction
- **SuggestionCollector**: Click-based selection
- **FuzzySearchCollector**: Search and select from datasets
- **FileUploadCollector**: File processing and parsing

#### Renderers
UI components that render fields according to collection method:
- **ManualFormFieldRenderer**: Traditional form controls
- **ConversationalFieldRenderer**: Question-based interface
- **SuggestionFieldRenderer**: Clickable suggestions
- **FuzzySearchFieldRenderer**: Search interface
- **FileUploadFieldRenderer**: File upload UI

### Data Flow

```
User Input → DataCollection Component → FieldRenderer → Collector → Validation → Response
```

## Usage Examples

### Manual Form Collection

```tsx
import { DataCollection } from '@upswitch/data-collection';

function ManualValuationForm({ onComplete }) {
  return (
    <DataCollection
      method="manual_form"
      onDataCollected={(responses) => {
        // Handle partial data collection
        console.log('Collected:', responses);
      }}
      onComplete={onComplete}
      initialData={{
        company_name: 'Pre-filled Company',
        industry: 'technology'
      }}
    />
  );
}
```

### Conversational Collection

```tsx
function ConversationalValuation({ onComplete, conversationHistory }) {
  return (
    <DataCollection
      method="conversational"
      onDataCollected={(responses) => {
        // Handle AI-extracted data
        console.log('AI extracted:', responses);
      }}
      onComplete={onComplete}
      initialData={{
        conversationHistory: conversationHistory
      }}
    />
  );
}
```

### Custom Collector Implementation

```typescript
import { DataCollector } from '@upswitch/data-collection';

class CustomCollector implements DataCollector {
  async collect(field, context) {
    // Custom collection logic
    return {
      fieldId: field.id,
      value: 'custom_value',
      method: 'custom',
      confidence: 1.0,
      source: 'custom_source',
      timestamp: new Date()
    };
  }

  validate(field, value) {
    // Custom validation
    return [];
  }

  // ... other required methods
}

// Register custom collector
const collector = new DataCollector();
collector.registerCollector('custom', new CustomCollector());
```

## Configuration

### Business Data Fields

The package includes predefined field configurations for business valuation:

```typescript
import { BUSINESS_DATA_FIELDS } from '@upswitch/data-collection';

// Access field definitions
const revenueField = BUSINESS_DATA_FIELDS.revenue;
const employeeField = BUSINESS_DATA_FIELDS.number_of_employees;
```

### Custom Field Definition

```typescript
import type { DataField } from '@upswitch/data-collection';

const customField: DataField = {
  id: 'custom_metric',
  label: 'Custom Metric',
  description: 'A custom business metric',
  type: 'number',
  required: false,
  validation: [
    {
      type: 'min',
      value: 0,
      message: 'Must be positive',
      severity: 'error'
    }
  ],
  collectionMethods: ['manual_form', 'conversational'],
  priority: 10
};
```

## Validation

### Built-in Validation

The package provides comprehensive validation:

```typescript
import { DataCollector } from '@upswitch/data-collection';

const collector = new DataCollector();
const field = BUSINESS_DATA_FIELDS.revenue;

// Validate a value
const errors = collector.validate(field, -100);
// Returns: [{ type: 'min', message: 'Revenue cannot be negative', severity: 'error' }]
```

### Custom Validation Rules

```typescript
const customField: DataField = {
  id: 'complex_metric',
  validation: [
    {
      type: 'custom',
      value: (val: number) => val > 0 && val % 2 === 0,
      message: 'Must be positive even number',
      severity: 'error'
    }
  ]
};
```

## Extending the Package

### Adding New Collection Methods

1. **Create Collector Class**:
```typescript
class NewMethodCollector implements DataCollector {
  // Implement required methods
}
```

2. **Create Renderer Component**:
```tsx
const NewMethodFieldRenderer: React.FC<FieldRendererProps> = (props) => {
  // Implement rendering logic
};
```

3. **Register with DataCollector**:
```typescript
collector.registerCollector('new_method', new NewMethodCollector());
```

4. **Update FieldRenderer**:
```typescript
// Add case to FieldRenderer switch statement
case 'new_method':
  return NewMethodFieldRenderer;
```

## Testing

### Unit Tests

```typescript
import { DataCollector, ManualFormCollector } from '@upswitch/data-collection';

describe('DataCollector', () => {
  it('should collect data using registered collectors', async () => {
    const collector = new DataCollector();
    collector.registerCollector('manual_form', new ManualFormCollector());

    const response = await collector.collect(BUSINESS_DATA_FIELDS.company_name);
    expect(response.method).toBe('manual_form');
  });
});
```

### Integration Tests

```typescript
describe('DataCollection Component', () => {
  it('should render manual form fields', () => {
    render(<DataCollection method="manual_form" onComplete={mockComplete} />);

    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
  });
});
```

## API Reference

### DataCollection Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `method` | `DataCollectionMethod` | Yes | Collection method to use |
| `onDataCollected` | `(responses: DataResponse[]) => void` | Yes | Called when data is collected |
| `onProgressUpdate` | `(progress: CollectionProgress) => void` | No | Progress update callback |
| `onComplete` | `(responses: DataResponse[]) => void` | No | Called when collection is complete |
| `initialData` | `Partial<Record<string, any>>` | No | Pre-populate field values |
| `disabled` | `boolean` | No | Disable all interactions |

### DataCollector Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `collect(field, context?)` | `Promise<DataResponse>` | Collect data for a field |
| `validate(field, value)` | `ValidationRule[]` | Validate a field value |
| `createSession(method, fieldIds?)` | `CollectionSession` | Create collection session |
| `updateSession(session, response)` | `CollectionSession` | Update session with response |

---

## 📁 Directory Structure

```
packages/data-collection/
├── index.ts                    # Public API exports
├── package.json               # Package metadata
├── README.md                  # This file
├── types/
│   └── index.ts              # TypeScript type definitions
├── config/
│   └── businessDataFields.ts # Field configurations
├── engine/
│   └── DataCollector.ts      # Core collection engine
├── collectors/               # Collection method implementations
│   ├── ManualFormCollector.ts
│   ├── ConversationalCollector.ts
│   ├── SuggestionCollector.ts
│   ├── FuzzySearchCollector.ts
│   └── FileUploadCollector.ts
├── renderers/                # UI rendering components
│   ├── ManualFormFieldRenderer.tsx
│   ├── ConversationalFieldRenderer.tsx
│   ├── SuggestionFieldRenderer.tsx
│   ├── FuzzySearchFieldRenderer.tsx
│   └── FileUploadFieldRenderer.tsx
└── components/               # React components
    ├── DataCollection.tsx
    └── FieldRenderer.tsx
```

## 🔧 Dependencies

### Peer Dependencies
- `react: ^18.0.0`
- `typescript: ^5.0.0`

### Dev Dependencies
- `@types/react`
- `@types/node`

## 🤝 Contributing

1. **Add New Collection Methods**: Follow the existing patterns
2. **Maintain Type Safety**: All additions must be fully typed
3. **Add Tests**: Include unit and integration tests
4. **Update Documentation**: Keep README and API docs current

---

**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: Frontend Team