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

### Error Boundaries

- **Global Error Boundary**: Catches JavaScript errors in component tree
- **Route-level Error Elements**: React Router error handling
- **Component-level Error Handling**: Try-catch blocks in async operations

### Error Recovery

- **Graceful Degradation**: Fallback UI for failed components
- **Retry Mechanisms**: Automatic retry for transient failures
- **User-friendly Messages**: Clear error communication

## Performance Optimizations

### Code Splitting

- **Route-based splitting**: Each route loads only necessary code
- **Component lazy loading**: Heavy components loaded on demand
- **Bundle optimization**: Tree shaking and minification

### Caching

- **API response caching**: 5-minute TTL for company lookups
- **Component memoization**: React.memo for expensive renders
- **State optimization**: Minimal re-renders through proper dependencies

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
│   ├── messageUtils.ts
│   ├── logger.ts
│   └── api.ts
├── services/           # Business logic
│   ├── chat/
│   ├── businessDataService.ts
│   └── registryService.ts
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

## Recent Improvements (Week 1)

### Chat Component Consolidation

- **Removed**: 3 legacy chat components (2,117 lines deleted)
- **Consolidated**: Single StreamingChat component with modern architecture
- **Bundle reduction**: 10 kB smaller bundle size

### Structured Logging

- **Replaced**: 62 console.log statements with structured logging
- **Added**: Context-aware loggers with proper log levels
- **Improved**: Debugging and monitoring capabilities

### Code Organization

- **Extracted**: Reusable utilities and hooks
- **Refactored**: StreamingChat from 537 to ~300 lines (44% reduction)
- **Added**: 3 new utility modules for better maintainability

## Future Enhancements

1. **Testing**: Comprehensive test coverage
2. **Performance**: Further optimization and monitoring
3. **Accessibility**: Enhanced a11y features
4. **Internationalization**: Multi-language support
5. **Analytics**: Enhanced user behavior tracking
