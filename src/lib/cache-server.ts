import { kv } from '@vercel/kv'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale while revalidate in seconds
}

/**
 * Server-side cache manager that supports both local memory cache and Vercel KV/Upstash Redis
 */
export class CacheManager {
  private static memoryCache = new Map<string, { data: unknown; expires: number }>()

  /**
   * Check if KV/Redis is available
   */
  private static isKVAvailable(): boolean {
    return !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  }

  /**
   * Get data from cache (KV first, then memory fallback)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Try Vercel KV/Upstash Redis first if available
      if (this.isKVAvailable()) {
        const cached = await kv.get<T>(key)
        if (cached !== null) {
          return cached
        }
      }
    } catch (error) {
      console.warn('KV cache read error:', error)
    }

    // Fallback to memory cache
    const memoryCached = this.memoryCache.get(key)
    if (memoryCached && memoryCached.expires > Date.now()) {
      return memoryCached.data as T
    }

    return null
  }

  /**
   * Set data in cache
   */
  static async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300 } = options // Default 5 minutes

    try {
      // Set in Vercel KV/Upstash Redis if available
      if (this.isKVAvailable()) {
        await kv.set(key, data, { ex: ttl })
      }
    } catch (error) {
      console.warn('KV cache write error:', error)
    }

    // Always set in memory cache as fallback
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    })
  }

  /**
   * Delete data from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      if (this.isKVAvailable()) {
        await kv.del(key)
      }
    } catch (error) {
      console.warn('KV cache delete error:', error)
    }

    this.memoryCache.delete(key)
  }

  /**
   * Delete multiple keys by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isKVAvailable()) {
        const keys = await kv.keys(pattern)
        if (keys.length > 0) {
          await kv.del(...keys)
        }
      }
    } catch (error) {
      console.warn('KV cache pattern delete error:', error)
    }

    // Clear matching keys from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Clean expired entries from memory cache
   */
  static cleanExpired(): void {
    const now = Date.now()
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires <= now) {
        this.memoryCache.delete(key)
      }
    }
  }
}

/**
 * Higher-order function to add caching to API responses
 */
export function withCache<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: CacheOptions = {}
) {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = await CacheManager.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()
    
    // Cache the result
    await CacheManager.set(cacheKey, data, options)
    
    return data
  }
}

// Clean expired memory cache every 5 minutes (only in server environment)
declare global {
  var cacheCleanupStarted: boolean | undefined
}

if (typeof globalThis !== 'undefined' && !globalThis.cacheCleanupStarted) {
  globalThis.cacheCleanupStarted = true
  setInterval(() => {
    CacheManager.cleanExpired()
  }, 5 * 60 * 1000)
}