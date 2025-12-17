/**
 * Cache Services - Centralized Exports
 *
 * Provides easy access to all caching utilities:
 * - Request deduplication
 * - Response caching with TTL
 * - Request coalescing
 *
 * @module services/cache
 */

export { RequestCoalescer, requestCoalescer } from './RequestCoalescer'
export { RequestDeduplicator, requestDeduplicator } from './RequestDeduplicator'
export { ResponseCache, responseCache } from './ResponseCache'
