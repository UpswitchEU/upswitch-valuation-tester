# Frontend Architecture

## Overview

The Upswitch Valuation Tester is a React-based frontend application that provides an AI-powered business valuation interface. The architecture follows modern React patterns with clean separation of concerns, reusable components, and structured logging.

## Component Structure

### Core Components

- **StreamingChat**: Real-time AI conversation with SSE streaming
- **AIAssistedValuation**: Main orchestrator for the instant valuation flow
- **ErrorBoundary**: Error handling and graceful degradation
- **ValuationProgressTracker**: Progress visualization through 7 valuation steps

### Supporting Components

- **ContextualTip**: Dynamic help text and guidance
- **LiveValuationReport**: Real-time report generation display
- **ManualValuationFlow**: Alternative manual data entry flow
- **DocumentUploadFlow**: File upload and parsing flow

## Data Flow

```
User Input → StreamingChat → useStreamingChat Hook → streamingChatService → Backend SSE
                ↓
        Progress Updates → useProgressTracking Hook → ValuationProgressTracker
                ↓
        Report Updates → LiveValuationReport
                ↓
        Valuation Complete → AIAssistedValuation → Results Stage
```

## Hooks & Utilities

### Custom Hooks

- **useStreamingChat**: Manages streaming conversation state and logic
- **useProgressTracking**: Handles valuation progress through predefined steps
- **useAuth**: Authentication state management
- **useAnalytics**: Analytics tracking

### Utilities

- **messageUtils**: Message validation, creation, and manipulation
- **logger**: Structured logging with Pino (replaces all console.logs)
- **api**: Centralized API client
- **businessDataService**: Business profile data management

## State Management

### Context Providers

- **AuthContext**: Cross-domain authentication and user state
- **ValuationStore**: Valuation data and form state (Zustand)

### Local State

- Component-level state for UI interactions
- Streaming state managed by useStreamingChat hook
- Progress state managed by useProgressTracking hook

## Logging Architecture

### Structured Logging

- **Pino**: Industry-standard, performant logging library
- **Context-aware loggers**: authLogger, chatLogger, apiLogger, serviceLogger
- **Log levels**: debug, info, warn, error
- **Zero console.logs**: All logging goes through structured logger

### Log Categories

- **auth**: Authentication flows and user sessions
- **chat**: Conversation and streaming events
- **api**: API calls and responses
- **service**: Business logic and data processing

## Error Handling

### Typed Error System

- **50+ Error Classes**: Specific error types for different scenarios
- **AppError Base Class**: Consistent error structure with context
- **Error Codes**: Standardized error identification
- **Status Codes**: HTTP-compatible error responses

### Error Handler

- **Centralized Processing**: Single point for error handling
- **User-friendly Messages**: Clear, actionable error messages
- **Recovery Strategies**: Automatic retry logic and recovery
- **Context Preservation**: Maintains error context for debugging

### Error Recovery

- **Automatic Recovery**: Built-in strategies for common errors
- **Retry Logic**: Exponential backoff with jitter

## Recent Improvements (Week 3)

### Component Optimization
- **Extracted Components**: HistoricalDataInputs, useBusinessProfile, FileProcessingService
- **React.memo**: Added to 5 pure components (ContextualTip, DataSourceBadge, UserAvatar, etc.)
- **Performance Hooks**: useMemo and useCallback optimizations in ValuationForm
- **Result**: 3 large components reduced by 30-40%, 400 lines moved to utilities

### Code Splitting & Bundle Optimization
- **Lazy Loading**: Heavy routes (AIAssistedValuation, ManualValuationFlow, DocumentUploadFlow)
- **Vendor Splitting**: React, UI libraries, utilities in separate chunks
- **Bundle Size**: 496.91 kB → ~420 kB (15% reduction)
- **Loading Fallbacks**: Smooth loading experience with skeleton screens

### Accessibility Improvements
- **Keyboard Navigation**: Full support in CustomDropdown with arrow keys, Enter, Escape
- **Focus Management**: useFocusTrap hook for modal focus trapping
- **Skip Links**: Navigation shortcuts for keyboard users
- **ARIA Labels**: Screen reader support for all interactive elements
- **Live Regions**: Dynamic content announcements for screen readers
- **Form Validation**: Accessible error messages with role="alert"
- **Result**: WCAG 2.1 critical issues addressed
- **Circuit Breaker**: Prevents cascading failures
- **Graceful Degradation**: Fallback UI for failed components

### Error Boundaries

- **Global Error Boundary**: Catches JavaScript errors in component tree
- **Route-level Error Elements**: React Router error handling
- **Component-level Error Handling**: Try-catch blocks in async operations

## Performance Optimizations

### Code Splitting

- **Route-based splitting**: Each route loads only necessary code
- **Component lazy loading**: Heavy components loaded on demand
- **Bundle optimization**: Tree shaking and minification

### Caching

- **LRU Cache**: Least Recently Used cache with TTL
- **Registry Cache**: 5-minute TTL for company lookups
- **Request Deduplication**: Prevents duplicate concurrent requests
- **Component memoization**: React.memo for expensive renders
- **State optimization**: Minimal re-renders through proper dependencies

### Registry Service Architecture

- **Unified Service**: Single source of truth for registry operations
- **Type Safety**: Full TypeScript support with IntelliSense
- **Error Handling**: Typed errors with recovery strategies
- **Performance**: LRU cache and request deduplication
- **Monitoring**: Structured logging for all operations

## Security

### Data Protection

- **Input validation**: All user inputs validated and sanitized
- **XSS prevention**: React's built-in XSS protection
- **CSRF protection**: Secure API calls with proper headers

### Authentication

- **Cross-domain auth**: Token exchange with main platform
- **Session management**: Secure session handling
- **Guest mode**: Anonymous usage without authentication

## Development Workflow

### Code Quality

- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Testing

- **Unit tests**: Component and utility testing
- **Integration tests**: API and service testing
- **E2E tests**: Full user flow testing

### Deployment

- **Vercel**: Automatic deployments from git
- **Environment variables**: Secure configuration management
- **Build optimization**: Production-ready bundles

## File Structure

```
src/
├── components/          # React components
│   ├── StreamingChat.tsx
│   ├── AIAssistedValuation.tsx
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
│   ├── useStreamingChat.ts
│   ├── useProgressTracking.ts
│   └── useAuth.ts
├── utils/              # Utility functions
│   ├── errors/         # Error handling system
│   │   ├── types.ts
│   │   ├── handler.ts
│   │   ├── recovery.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   ├── messageUtils.ts
│   ├── logger.ts
│   └── api.ts
├── services/           # Business logic
│   ├── chat/
│   ├── registry/       # Unified registry service
│   │   ├── registryService.ts
│   │   ├── cache.ts
│   │   └── types.ts
│   ├── businessDataService.ts
│   └── registryService.ts  # Legacy (deprecated)
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── store/              # State management
│   └── useValuationStore.ts
└── types/              # TypeScript types
    ├── valuation.ts
    └── registry.ts
```

## Key Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Reusability**: Extracted hooks and utilities for common patterns
3. **Testability**: Pure functions and isolated components
4. **Maintainability**: Clean code with proper documentation
5. **Performance**: Optimized rendering and minimal re-renders
6. **Accessibility**: WCAG compliant components
7. **Security**: Input validation and secure data handling

## Recent Improvements (Week 1-2)

### Chat Component Consolidation

- **Removed**: 3 legacy chat components (2,117 lines deleted)
- **Consolidated**: Single StreamingChat component with modern architecture
- **Bundle reduction**: 10 kB smaller bundle size

### Structured Logging

- **Replaced**: 75 console.log statements with structured logging (100% elimination)
- **Added**: Context-aware loggers with proper log levels
- **Improved**: Debugging and monitoring capabilities

### Registry Service Consolidation

- **Unified**: 3 fragmented registry services into 1 unified service
- **Added**: LRU cache with TTL for optimal performance
- **Implemented**: Request deduplication to prevent duplicate API calls
- **Reduced**: ~400 lines of duplicate code (50% reduction)

### Error Handling Standardization

- **Created**: 50+ typed error classes for specific scenarios
- **Implemented**: Centralized error handler with user-friendly messages
- **Added**: Automatic recovery strategies and retry logic
- **Improved**: Error boundaries and graceful degradation

### Code Organization

- **Extracted**: Reusable utilities and hooks
- **Refactored**: StreamingChat from 537 to ~300 lines (44% reduction)
- **Added**: 6 new utility modules for better maintainability
- **Created**: Comprehensive error handling system

## Future Enhancements

1. **Testing**: Comprehensive test coverage
2. **Performance**: Further optimization and monitoring
3. **Accessibility**: Enhanced a11y features
4. **Internationalization**: Multi-language support
5. **Analytics**: Enhanced user behavior tracking
