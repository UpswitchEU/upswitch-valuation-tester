/**
 * Shared Feature Resources
 *
 * Contains reusable components, hooks, services, and utilities that are used across multiple features.
 * Follows the dependency rule: shared components should not depend on feature-specific code.
 */

// Error Boundaries (hierarchical error handling)
export {
  ErrorBoundary,
  AppErrorBoundary,
  FeatureErrorBoundary,
  ComponentErrorBoundary,
  NetworkErrorBoundary,
} from './components/ErrorBoundary'

// This will be populated with more shared components as we identify them
export {}
