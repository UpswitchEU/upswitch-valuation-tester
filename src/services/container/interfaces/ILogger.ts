/**
 * ILogger Interface - Logging Service Abstraction
 *
 * Defines the contract for logging services.
 * Components depend on this interface, not concrete implementations.
 */

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
}
