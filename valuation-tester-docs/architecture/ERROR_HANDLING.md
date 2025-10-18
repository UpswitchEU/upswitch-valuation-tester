# Error Handling Guide

This document provides a comprehensive guide to the error handling system implemented in the upswitch-valuation-tester application.

## Overview

The error handling system provides:
- **Typed Error Classes**: Specific error types for different scenarios
- **Centralized Error Handling**: Consistent error processing across the application
- **User-Friendly Messages**: Clear, actionable error messages for users
- **Recovery Strategies**: Automatic retry logic and error recovery
- **Structured Logging**: Detailed error logging with context

## Error Types

### Base Error Class

All custom errors extend the `AppError` base class:

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>,
    public isOperational: boolean = true
  )
}
```

### Network Errors

- **NetworkError**: Connection failures, DNS errors
- **TimeoutError**: Request timeouts
- **CircuitBreakerError**: Circuit breaker open
- **RetryExhaustedError**: All retry attempts failed

### Registry Errors

- **RegistryError**: API failures, invalid responses
- **NotFoundError**: Company not found
- **ExternalServiceError**: External service unavailable

### Validation Errors

- **ValidationError**: Invalid user input
- **FormatError**: Invalid data format
- **ParameterError**: Invalid parameters
- **QueryError**: Invalid search query

### Authentication Errors

- **AuthenticationError**: Auth failures
- **TokenError**: Token expired/invalid
- **SessionError**: Session invalid
- **PermissionError**: Access denied
- **SecurityError**: Security violations

### Rate Limiting

- **RateLimitError**: Too many requests
- **TooManyRequestsError**: Rate limit exceeded
- **QuotaExceededError**: Request quota exceeded

### Server Errors

- **ServerError**: Generic server errors
- **InternalServerError**: Internal server error
- **BadGatewayError**: Bad gateway
- **ServiceUnavailableError**: Service unavailable
- **GatewayTimeoutError**: Gateway timeout

### Business Logic Errors

- **BusinessLogicError**: Invalid business operations
- **DataQualityError**: Insufficient data quality
- **ConflictError**: Resource conflicts
- **UnsupportedError**: Unsupported features
- **NotImplementedError**: Feature not implemented

### Data Processing Errors

- **TransformationError**: Data transformation failures
- **SerializationError**: Data serialization errors
- **DeserializationError**: Data deserialization errors
- **CompressionError**: Data compression errors
- **DecompressionError**: Data decompression errors

### Cache Errors

- **CacheError**: Cache operation failures
- **DatabaseError**: Database operation failures
- **FileSystemError**: File system errors

## Usage

### Throwing Errors

```typescript
import { ValidationError, NetworkError, RegistryError } from '../utils/errors';

// Validation error
if (!companyName || companyName.trim().length < 2) {
  throw new ValidationError('Company name must be at least 2 characters', { 
    companyName,
    minLength: 2 
  });
}

// Network error
if (response.status === 503) {
  throw new NetworkError('Service unavailable', { 
    endpoint: '/api/companies',
    status: response.status 
  });
}

// Registry error
if (response.status === 404) {
  throw new RegistryError('Company not found', 404, { 
    companyId,
    searchQuery 
  });
}
```

### Handling Errors

```typescript
import { ErrorHandler } from '../utils/errors';

try {
  const result = await registryService.searchCompanies(query, country);
  return result;
} catch (error) {
  const handled = ErrorHandler.handle(error, { query, country });
  
  // Show user-friendly message
  showToast(handled.message, 'error');
  
  // Optionally retry
  if (handled.canRetry) {
    // Implement retry logic
    setTimeout(() => retryOperation(), 1000);
  }
  
  // Log for debugging
  console.error('Error details:', handled.technicalDetails);
}
```

### API Error Handling

```typescript
import { ErrorHandler } from '../utils/errors';

try {
  const response = await fetch('/api/companies', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new RegistryError(`API failed: ${response.statusText}`, response.status);
  }
  
  return await response.json();
} catch (error) {
  const handled = ErrorHandler.handleApiError(error, '/api/companies');
  
  // Handle based on error type
  if (handled.code === 'NETWORK_ERROR') {
    // Show network error message
  } else if (handled.code === 'REGISTRY_ERROR') {
    // Show registry error message
  }
  
  throw error; // Re-throw if needed
}
```

### Specific Error Handlers

```typescript
import { ErrorHandler } from '../utils/errors';

// Network errors
const networkResult = ErrorHandler.handleNetworkError(error, { endpoint: '/api/test' });

// Validation errors
const validationResult = ErrorHandler.handleValidationError('Invalid email', { field: 'email' });

// Authentication errors
const authResult = ErrorHandler.handleAuthError('Token expired', { userId: '123' });

// Registry errors
const registryResult = ErrorHandler.handleRegistryError('API failed', 503, { companyId: '123' });
```

## Error Recovery

### Automatic Recovery Strategies

The system includes built-in recovery strategies for common error types:

```typescript
import { ErrorRecoveryManager } from '../utils/errors';

// Network errors: Check connection and retry
// Timeout errors: Wait and retry
// Server errors: Wait for server recovery
// Rate limit errors: Wait for rate limit reset
// Auth errors: Try to refresh token
// Cache errors: Clear cache and continue
```

### Manual Recovery

```typescript
import { ErrorRecoveryManager } from '../utils/errors';

try {
  const result = await operation();
  return result;
} catch (error) {
  if (error instanceof AppError) {
    const recovered = await ErrorRecoveryManager.attemptRecovery(error);
    if (recovered) {
      // Retry the operation
      return await operation();
    }
  }
  
  // Handle unrecoverable errors
  throw error;
}
```

### Retry Logic

```typescript
import { ErrorRecoveryManager } from '../utils/errors';

// Automatic retry with exponential backoff
const result = await ErrorRecoveryManager.retry(
  () => fetch('/api/companies'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  }
);
```

## Best Practices

### 1. Always Use Typed Errors

```typescript
// ✅ Good
throw new ValidationError('Invalid input', { field: 'email' });

// ❌ Bad
throw new Error('Invalid input');
```

### 2. Include Context

```typescript
// ✅ Good
throw new NetworkError('Connection failed', { 
  endpoint: '/api/companies',
  method: 'POST',
  timeout: 5000 
});

// ❌ Bad
throw new NetworkError('Connection failed');
```

### 3. Handle Errors at Boundaries

```typescript
// ✅ Good - Handle at component/service boundaries
export const CompanySearch = () => {
  const handleSearch = async (query: string) => {
    try {
      const results = await registryService.searchCompanies(query);
      setResults(results);
    } catch (error) {
      const handled = ErrorHandler.handle(error);
      setError(handled.message);
    }
  };
};

// ❌ Bad - Don't handle every error individually
```

### 4. Provide User-Friendly Messages

```typescript
// ✅ Good
const handled = ErrorHandler.handle(error);
showToast(handled.message, 'error');

// ❌ Bad
showToast(error.message, 'error');
```

### 5. Log for Debugging

```typescript
// ✅ Good
const handled = ErrorHandler.handle(error, { userId, sessionId });
console.error('Error details:', handled.technicalDetails);

// ❌ Bad
console.error('Error:', error);
```

### 6. Use Recovery Strategies

```typescript
// ✅ Good
if (handled.canRetry) {
  setTimeout(() => retryOperation(), 1000);
}

// ❌ Bad
// Always retry without checking if it makes sense
```

## Error Codes Reference

| Code | Description | Can Retry | User Action |
|------|-------------|-----------|-------------|
| NETWORK_ERROR | Connection failed | Yes | Check internet connection |
| TIMEOUT_ERROR | Request timed out | Yes | Try again |
| REGISTRY_ERROR | Registry API failed | Yes | Try different search |
| VALIDATION_ERROR | Invalid input | No | Check input |
| AUTH_ERROR | Authentication failed | No | Log in again |
| RATE_LIMIT_ERROR | Too many requests | Yes | Wait and try again |
| SERVER_ERROR | Server error | Yes | Try again later |
| NOT_FOUND_ERROR | Resource not found | No | Check search terms |
| BUSINESS_LOGIC_ERROR | Invalid operation | No | Check input |
| DATA_QUALITY_ERROR | Poor data quality | No | Provide more data |

## Testing

The error handling system includes comprehensive tests:

```typescript
// Test error handling
describe('ErrorHandler', () => {
  it('should handle NetworkError correctly', () => {
    const error = new NetworkError('Connection failed');
    const result = ErrorHandler.handle(error);
    
    expect(result.message).toBe('Connection error. Please check your internet connection and try again.');
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.canRetry).toBe(true);
  });
});
```

## Migration Guide

### From Console.log to Structured Logging

```typescript
// Before
console.log('Searching companies:', { query, country });
console.error('Search failed:', error);

// After
import { serviceLogger } from '../utils/logger';
serviceLogger.info('Searching companies', { query, country });
serviceLogger.error('Search failed', { error: error.message, query, country });
```

### From Generic Errors to Typed Errors

```typescript
// Before
if (!response.ok) {
  throw new Error(`Request failed: ${response.statusText}`);
}

// After
if (!response.ok) {
  throw new RegistryError(`Request failed: ${response.statusText}`, response.status, { 
    endpoint: '/api/companies',
    status: response.status 
  });
}
```

### From Manual Error Handling to ErrorHandler

```typescript
// Before
try {
  const result = await operation();
} catch (error) {
  if (error.message.includes('network')) {
    showToast('Network error. Please check your connection.');
  } else if (error.message.includes('auth')) {
    showToast('Please log in again.');
  } else {
    showToast('An error occurred. Please try again.');
  }
}

// After
try {
  const result = await operation();
} catch (error) {
  const handled = ErrorHandler.handle(error);
  showToast(handled.message, 'error');
  
  if (handled.canRetry) {
    // Implement retry logic
  }
}
```

## Troubleshooting

### Common Issues

1. **Error not being caught**: Ensure you're using try-catch blocks around async operations
2. **Generic error messages**: Use specific error types instead of generic Error
3. **Missing context**: Always include relevant context when throwing errors
4. **Infinite retry loops**: Check `canRetry` before implementing retry logic
5. **User sees technical errors**: Use `ErrorHandler.handle()` to get user-friendly messages

### Debug Mode

Enable debug logging to see detailed error information:

```typescript
// In development
const handled = ErrorHandler.handle(error);
console.log('Error details:', {
  message: handled.message,
  code: handled.code,
  canRetry: handled.canRetry,
  technicalDetails: handled.technicalDetails
});
```

## Conclusion

The error handling system provides a robust foundation for managing errors in the application. By following the patterns and best practices outlined in this guide, you can ensure consistent, user-friendly error handling throughout the codebase.

For more information, see the test files in `src/utils/errors/__tests__/` and the implementation in `src/utils/errors/`.
