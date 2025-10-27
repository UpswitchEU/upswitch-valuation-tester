# Validation Utilities

This directory contains validation utilities extracted from the StreamingChat component to improve modularity and reusability.

## Utilities Overview

### `InputValidator.ts`
Centralized input validation class that handles all user input validation for the streaming chat.

**Features:**
- Length validation (min/max character limits)
- PII (Personally Identifiable Information) detection
- Profanity filtering
- Business logic validation based on conversation context
- Content safety checks
- Comprehensive error and warning reporting

**Validation Rules:**
- **Length**: 1-1000 characters
- **PII Detection**: SSN, credit card, email, phone number patterns
- **Profanity**: Basic profanity word filtering
- **Business Logic**: Numeric validation for financial fields
- **Content Safety**: Professional conversation requirements

**Usage:**
```typescript
const validator = new InputValidator();

const validation = await validator.validateInput(
  userInput,
  previousMessages,
  sessionId
);

if (!validation.is_valid) {
  // Handle validation errors
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}
```

**Validation Result Structure:**
```typescript
interface InputValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_input: string;
  detected_pii: boolean;
  confidence: number;
}
```

## Validation Methods

### `validateInput(input, messages?, sessionId?)`
Main validation method that performs all validation checks.

### `validateLength(input, validation)`
Validates input length against min/max limits.

### `detectPII(input, validation)`
Detects potential PII using regex patterns.

### `checkContentSafety(input, validation)`
Checks for profanity and inappropriate content.

### `validateBusinessLogic(input, messages, validation)`
Validates business-specific logic based on conversation context.

## Private Helper Methods

### `containsPII(input)`
Checks if input contains PII patterns.

### `containsProfanity(input)`
Checks if input contains profanity.

### `isValidNumber(input)`
Validates if input is a valid positive number.

## Configuration

Validation constants can be accessed via `getConstants()`:
```typescript
const constants = validator.getConstants();
// { maxMessageLength: 1000, minMessageLength: 1 }
```

## Error Handling

The validator provides detailed error and warning messages:

**Common Errors:**
- "Message too long (max 1000 characters)"
- "Message cannot be empty"
- "Please keep conversation professional"
- "Please enter a valid number"

**Common Warnings:**
- "Detected potential sensitive information"

## Logging

All validation operations are logged with:
- Session ID for tracking
- Validation results (valid/invalid)
- Error and warning counts
- PII detection status
- Confidence scores

## Security Considerations

1. **PII Protection**: Detects and warns about potential sensitive information
2. **Content Safety**: Filters inappropriate content
3. **Input Sanitization**: Trims and sanitizes input
4. **Business Logic**: Validates financial data appropriately

## Testing

The validator should be tested with:
- Valid inputs (should pass)
- Invalid inputs (should fail with appropriate errors)
- Edge cases (empty strings, very long strings)
- PII detection (various formats)
- Profanity detection (different languages, variations)
- Business logic validation (numeric fields)

## Future Enhancements

- Add more sophisticated PII detection
- Implement ML-based content filtering
- Add support for different languages
- Create custom validation rules
- Add validation rule configuration
- Implement validation caching for performance

## Dependencies

- Custom logger utility
- No external dependencies (pure TypeScript)

## Performance

The validator is designed for performance:
- Regex patterns are compiled once
- Validation methods are optimized
- Minimal memory allocation
- Fast execution for real-time chat
