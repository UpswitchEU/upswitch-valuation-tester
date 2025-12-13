/**
 * Service Container - Dependency Injection Implementation
 *
 * Bank-Grade Excellence Framework Implementation:
 * - Dependency Inversion Principle: Components depend on abstractions, not concretions
 * - Clean Architecture: Centralized service registration and resolution
 * - SOLID Principles: Single responsibility for service lifecycle management
 *
 * Provides dependency injection for all application services,
 * enabling better testability and maintainability.
 */

import { IAnalyticsService } from './interfaces/IAnalyticsService'
import { ICacheService } from './interfaces/ICacheService'
import { ILogger } from './interfaces/ILogger'

// Concrete implementations
import { AnalyticsService } from '../analytics/AnalyticsService'
import { CacheService } from '../cache/CacheService'
import { CreditService } from '../credit/CreditService'
import { Logger } from '../logger/Logger'
import { SessionService } from '../session/SessionService'
import { ValuationService } from '../valuation/ValuationService'

/**
 * Service Container - Singleton pattern for dependency injection
 *
 * Centralizes service registration and provides type-safe service resolution.
 * All services are registered with their interfaces, allowing for easy mocking in tests.
 */
export class ServiceContainer {
  private static instance: ServiceContainer
  private services = new Map<string, unknown>()

  private constructor() {
    this.registerServices()
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * Register all application services
   * Called once during container initialization
   */
  private registerServices(): void {
    // Core infrastructure services
    this.register('ILogger', new Logger())
    this.register('ICacheService', new CacheService())
    this.register('IAnalyticsService', new AnalyticsService())

    // Business services - depend on infrastructure
    const logger = this.resolve<ILogger>('ILogger')
    const cache = this.resolve<ICacheService>('ICacheService')
    const analytics = this.resolve<IAnalyticsService>('IAnalyticsService')

    this.register('IValuationService', new ValuationService(logger, cache))
    this.register('ISessionService', new SessionService(logger, cache, analytics))
    this.register('ICreditService', new CreditService(logger))
  }

  /**
   * Register a service with its interface name
   */
  private register<T>(interfaceName: string, implementation: T): void {
    this.services.set(interfaceName, implementation)
  }

  /**
   * Resolve a service by its interface name
   * Returns the concrete implementation cast to the interface type
   */
  public resolve<T>(interfaceName: string): T {
    const service = this.services.get(interfaceName)
    if (!service) {
      throw new Error(`Service not registered: ${interfaceName}`)
    }
    return service as T
  }

  /**
   * Replace a service implementation (primarily for testing)
   */
  public replace<T>(interfaceName: string, implementation: T): void {
    this.services.set(interfaceName, implementation)
  }

  /**
   * Reset container (primarily for testing)
   */
  public reset(): void {
    this.services.clear()
    this.registerServices()
  }
}

/**
 * Convenience function to get services from container
 * Usage: const logger = getService<ILogger>('ILogger');
 */
export function getService<T>(interfaceName: string): T {
  return ServiceContainer.getInstance().resolve<T>(interfaceName)
}

/**
 * Hook for React components to get services
 * Usage: const valuationService = useService<IValuationService>('IValuationService');
 */
export function useService<T>(interfaceName: string): T {
  // In a real implementation, this would use React context
  // For now, return from container directly
  return getService<T>(interfaceName)
}
