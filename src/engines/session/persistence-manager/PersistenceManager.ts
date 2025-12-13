/**
 * PersistenceManager Engine - Backend Persistence & Caching
 *
 * Single Responsibility: Handle all backend API calls, caching, and data persistence
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/session/persistence-manager/PersistenceManager
 */

import { useCallback, useMemo } from 'react';
import type { ValuationRequest, ValuationSession } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PersistenceConfig {
  enableCaching?: boolean;
  cacheTimeout?: number; // ms
  retryAttempts?: number;
  retryDelay?: number; // ms
  enableOptimisticUpdates?: boolean;
}

export interface PersistenceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  retryCount?: number;
  duration: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
}

export interface PersistenceManager {
  // Session operations
  saveSession(session: ValuationSession): Promise<PersistenceResult<ValuationSession>>;
  loadSession(sessionId: string): Promise<PersistenceResult<ValuationSession>>;
  deleteSession(sessionId: string): Promise<PersistenceResult<boolean>>;

  // Data operations
  savePartialData(sessionId: string, data: Partial<ValuationRequest>): Promise<PersistenceResult<ValuationRequest>>;
  loadPartialData(sessionId: string): Promise<PersistenceResult<ValuationRequest>>;

  // Cache management
  getCachedSession(sessionId: string): ValuationSession | null;
  invalidateCache(sessionId?: string): void;
  clearExpiredCache(): void;

  // Health checks
  ping(): Promise<PersistenceResult<boolean>>;
  getHealthStatus(): PersistenceHealthStatus;

  // Statistics
  getPersistenceStats(): PersistenceStats;
}

// ============================================================================
// HEALTH STATUS TYPE
// ============================================================================

export interface PersistenceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: number;
  errorCount: number;
  cacheHitRate: number;
}

// ============================================================================
// PERSISTENCE STATS TYPE
// ============================================================================

export interface PersistenceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  retryCount: number;
  lastActivity: number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PersistenceManagerImpl implements PersistenceManager {
  private config: PersistenceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: PersistenceStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    retryCount: 0,
    lastActivity: Date.now(),
  };
  private healthStatus: PersistenceHealthStatus = {
    status: 'healthy',
    latency: 0,
    lastCheck: 0,
    errorCount: 0,
    cacheHitRate: 0,
  };

  constructor(config: PersistenceConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      enableOptimisticUpdates: true,
      ...config,
    };
  }

  /**
   * Save complete session to backend
   */
  async saveSession(session: ValuationSession): Promise<PersistenceResult<ValuationSession>> {
    const startTime = Date.now();

    try {
      this.stats.totalRequests++;
      this.stats.lastActivity = startTime;

      storeLogger.debug('[PersistenceManager] Saving session', {
        sessionId: session.sessionId,
        reportId: session.reportId,
        currentView: session.currentView,
      });

      // In real implementation, this would call backendAPI.saveValuationSession(session)
      // For now, simulate successful save
      const savedSession = { ...session, updatedAt: new Date() };

      // Update cache if enabled
      if (this.config.enableCaching) {
        this.setCache(`session_${session.sessionId}`, savedSession);
      }

      this.stats.successfulRequests++;
      this.updateAverageLatency(startTime);

      const result: PersistenceResult<ValuationSession> = {
        success: true,
        data: savedSession,
        duration: Date.now() - startTime,
      };

      storeLogger.info('[PersistenceManager] Session saved successfully', {
        sessionId: session.sessionId,
        duration: result.duration,
      });

      return result;

    } catch (error) {
      this.stats.failedRequests++;
      this.updateAverageLatency(startTime);
      this.updateHealthStatus(error);

      const result: PersistenceResult<ValuationSession> = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown save error',
        duration: Date.now() - startTime,
      };

      storeLogger.error('[PersistenceManager] Session save failed', {
        sessionId: session.sessionId,
        error: result.error,
        duration: result.duration,
      });

      return result;
    }
  }

  /**
   * Load session from backend with caching
   */
  async loadSession(sessionId: string): Promise<PersistenceResult<ValuationSession>> {
    const startTime = Date.now();

    try {
      this.stats.totalRequests++;
      this.stats.lastActivity = startTime;

      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getCache<ValuationSession>(`session_${sessionId}`);
        if (cached) {
          this.stats.cacheHits++;

          storeLogger.debug('[PersistenceManager] Session loaded from cache', {
            sessionId,
            cachedAt: new Date(cached.timestamp).toISOString(),
          });

          return {
            success: true,
            data: cached,
            cached: true,
            duration: Date.now() - startTime,
          };
        }
      }

      this.stats.cacheMisses++;

      storeLogger.debug('[PersistenceManager] Loading session from backend', {
        sessionId,
      });

      // In real implementation, this would call backendAPI.getValuationSession(sessionId)
      // For now, return null to simulate no existing session
      const session: ValuationSession | null = null;

      if (session && this.config.enableCaching) {
        this.setCache(`session_${sessionId}`, session);
      }

      this.stats.successfulRequests++;
      this.updateAverageLatency(startTime);

      return {
        success: true,
        data: session,
        cached: false,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      this.stats.failedRequests++;
      this.updateAverageLatency(startTime);
      this.updateHealthStatus(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete session from backend
   */
  async deleteSession(sessionId: string): Promise<PersistenceResult<boolean>> {
    const startTime = Date.now();

    try {
      this.stats.totalRequests++;
      this.stats.lastActivity = startTime;

      storeLogger.debug('[PersistenceManager] Deleting session', {
        sessionId,
      });

      // In real implementation, this would call backendAPI.deleteValuationSession(sessionId)
      // For now, simulate successful deletion

      // Clear from cache
      this.invalidateCache(sessionId);

      this.stats.successfulRequests++;
      this.updateAverageLatency(startTime);

      return {
        success: true,
        data: true,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      this.stats.failedRequests++;
      this.updateAverageLatency(startTime);
      this.updateHealthStatus(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error',
        data: false,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Save partial data with throttling
   */
  async savePartialData(sessionId: string, data: Partial<ValuationRequest>): Promise<PersistenceResult<ValuationRequest>> {
    const startTime = Date.now();

    try {
      this.stats.totalRequests++;
      this.stats.lastActivity = startTime;

      storeLogger.debug('[PersistenceManager] Saving partial data', {
        sessionId,
        fields: Object.keys(data),
      });

      // In real implementation, this would call backendAPI.updateValuationData(sessionId, data)
      // For now, simulate successful save
      const savedData = { ...data } as ValuationRequest;

      // Update cache
      if (this.config.enableCaching) {
        const cacheKey = `partial_${sessionId}`;
        this.setCache(cacheKey, savedData);
      }

      this.stats.successfulRequests++;
      this.updateAverageLatency(startTime);

      return {
        success: true,
        data: savedData,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      this.stats.failedRequests++;
      this.updateAverageLatency(startTime);
      this.updateHealthStatus(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown partial save error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Load partial data with caching
   */
  async loadPartialData(sessionId: string): Promise<PersistenceResult<ValuationRequest>> {
    const startTime = Date.now();

    try {
      this.stats.totalRequests++;
      this.stats.lastActivity = startTime;

      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getCache<ValuationRequest>(`partial_${sessionId}`);
        if (cached) {
          this.stats.cacheHits++;

          return {
            success: true,
            data: cached,
            cached: true,
            duration: Date.now() - startTime,
          };
        }
      }

      this.stats.cacheMisses++;

      // In real implementation, this would call backendAPI.getValuationData(sessionId)
      // For now, return empty object
      const data: ValuationRequest = {
        company_name: '',
        business_type: '',
        country_code: 'BE',
      };

      if (this.config.enableCaching) {
        this.setCache(`partial_${sessionId}`, data);
      }

      this.stats.successfulRequests++;
      this.updateAverageLatency(startTime);

      return {
        success: true,
        data,
        cached: false,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      this.stats.failedRequests++;
      this.updateAverageLatency(startTime);
      this.updateHealthStatus(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown partial load error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get cached session data
   */
  getCachedSession(sessionId: string): ValuationSession | null {
    const cached = this.getCache<ValuationSession>(`session_${sessionId}`);
    return cached || null;
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(sessionId?: string): void {
    if (sessionId) {
      this.cache.delete(`session_${sessionId}`);
      this.cache.delete(`partial_${sessionId}`);
      storeLogger.debug('[PersistenceManager] Cache invalidated for session', {
        sessionId,
      });
    } else {
      this.cache.clear();
      storeLogger.debug('[PersistenceManager] All cache invalidated');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      storeLogger.debug('[PersistenceManager] Expired cache entries cleared', {
        clearedCount: expiredKeys.length,
      });
    }
  }

  /**
   * Health check ping
   */
  async ping(): Promise<PersistenceResult<boolean>> {
    const startTime = Date.now();

    try {
      // In real implementation, this would ping the backend health endpoint
      // For now, simulate healthy response
      const latency = Date.now() - startTime;

      this.updateHealthStatus(null, latency);

      return {
        success: true,
        data: true,
        duration: latency,
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateHealthStatus(error, latency);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ping failed',
        data: false,
        duration: latency,
      };
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): PersistenceHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats(): PersistenceStats {
    const totalCacheRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? this.stats.cacheHits / totalCacheRequests : 0;

    return {
      ...this.stats,
      cacheHitRate,
    };
  }

  // Private helper methods
  private setCache<T>(key: string, data: T): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (this.config.cacheTimeout || 300000),
      version: 1,
    };

    this.cache.set(key, entry);
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private updateAverageLatency(startTime: number): void {
    const duration = Date.now() - startTime;
    const totalLatency = this.stats.averageLatency * (this.stats.totalRequests - 1) + duration;
    this.stats.averageLatency = totalLatency / this.stats.totalRequests;
  }

  private updateHealthStatus(error: Error | null | unknown, latency?: number): void {
    const now = Date.now();

    if (latency !== undefined) {
      this.healthStatus.latency = latency;
    }

    this.healthStatus.lastCheck = now;

    if (error) {
      this.healthStatus.errorCount++;

      // Determine status based on error count and recency
      if (this.healthStatus.errorCount > 5) {
        this.healthStatus.status = 'unhealthy';
      } else if (this.healthStatus.errorCount > 2) {
        this.healthStatus.status = 'degraded';
      }
    } else {
      this.healthStatus.errorCount = Math.max(0, this.healthStatus.errorCount - 1);

      if (this.healthStatus.errorCount === 0) {
        this.healthStatus.status = 'healthy';
      } else if (this.healthStatus.errorCount <= 2) {
        this.healthStatus.status = 'degraded';
      }
    }

    // Update cache hit rate
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    this.healthStatus.cacheHitRate = totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UsePersistenceManagerResult {
  manager: PersistenceManager;
  actions: {
    saveSession: (session: ValuationSession) => Promise<PersistenceResult<ValuationSession>>;
    loadSession: (sessionId: string) => Promise<PersistenceResult<ValuationSession>>;
    deleteSession: (sessionId: string) => Promise<PersistenceResult<boolean>>;
    savePartialData: (sessionId: string, data: Partial<ValuationRequest>) => Promise<PersistenceResult<ValuationRequest>>;
    loadPartialData: (sessionId: string) => Promise<PersistenceResult<ValuationRequest>>;
    ping: () => Promise<PersistenceResult<boolean>>;
  };
  cache: {
    getCachedSession: (sessionId: string) => ValuationSession | null;
    invalidateCache: (sessionId?: string) => void;
    clearExpiredCache: () => void;
  };
  status: {
    healthStatus: PersistenceHealthStatus;
    persistenceStats: PersistenceStats;
  };
}

/**
 * usePersistenceManager Hook
 *
 * React hook interface for PersistenceManager engine
 * Provides reactive backend persistence with caching
 */
export const usePersistenceManager = (
  config?: PersistenceConfig
): UsePersistenceManagerResult => {
  const manager = useMemo(() => new PersistenceManagerImpl(config), [config]);

  const actions = {
    saveSession: useCallback(
      (session: ValuationSession) => manager.saveSession(session),
      [manager]
    ),
    loadSession: useCallback(
      (sessionId: string) => manager.loadSession(sessionId),
      [manager]
    ),
    deleteSession: useCallback(
      (sessionId: string) => manager.deleteSession(sessionId),
      [manager]
    ),
    savePartialData: useCallback(
      (sessionId: string, data: Partial<ValuationRequest>) =>
        manager.savePartialData(sessionId, data),
      [manager]
    ),
    loadPartialData: useCallback(
      (sessionId: string) => manager.loadPartialData(sessionId),
      [manager]
    ),
    ping: useCallback(() => manager.ping(), [manager]),
  };

  const cache = {
    getCachedSession: useCallback(
      (sessionId: string) => manager.getCachedSession(sessionId),
      [manager]
    ),
    invalidateCache: useCallback(
      (sessionId?: string) => manager.invalidateCache(sessionId),
      [manager]
    ),
    clearExpiredCache: useCallback(() => manager.clearExpiredCache(), [manager]),
  };

  const status = {
    healthStatus: manager.getHealthStatus(),
    persistenceStats: manager.getPersistenceStats(),
  };

  return {
    manager,
    actions,
    cache,
    status,
  };
};
