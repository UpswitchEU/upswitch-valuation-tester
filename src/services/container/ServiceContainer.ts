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

// Concrete implementations
// NOTE: These services are not yet implemented - ServiceContainer is legacy/unused code
// import { AnalyticsService } from '../analytics/AnalyticsService' // Not implemented yet
// import { CacheService } from '../cache/CacheService' // Not implemented yet
// import { CreditService } from '../credit/CreditService' // Not implemented yet
// import { Logger } from '../logger/Logger' // Not implemented yet
// import { SessionService } from '../session/SessionService' // Not implemented yet
// import { ValuationService } from '../valuation/ValuationService' // Not implemented yet
// import { IAnalyticsService } from './interfaces/IAnalyticsService' // Not implemented yet
// import { ICacheService } from './interfaces/ICacheService' // Not implemented yet
// import { ILogger } from './interfaces/ILogger' // Not implemented yet

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
    // NOTE: ServiceContainer is legacy/unused code - services are not implemented
    // This is kept for potential future use but currently disabled
    // Core infrastructure services
    // this.register('ILogger', new Logger())
    // this.register('ICacheService', new CacheService())
    // this.register('IAnalyticsService', new AnalyticsService()) // Not implemented yet

    // Business services - depend on infrastructure
    // const logger = this.resolve<ILogger>('ILogger')
    // const cache = this.resolve<ICacheService>('ICacheService')
    // const analytics = this.resolve<IAnalyticsService>('IAnalyticsService') // Not implemented yet

    // this.register('IValuationService', new ValuationService(logger, cache))
    // this.register('ISessionService', new SessionService(logger, cache, null as any)) // TODO: Add analytics when implemented
    // this.register('ICreditService', new CreditService(logger))
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
