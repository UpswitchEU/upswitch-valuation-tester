/**
 * ICacheService Interface - Caching Abstraction
 *
 * Defines the contract for caching services.
 * Components depend on this interface, not concrete implementations.
 */

export interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
}
