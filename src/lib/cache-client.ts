'use client'

import { useState, useEffect } from 'react'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale while revalidate in seconds
}

/**
 * Client-side memory cache for React components
 */
class ClientCacheManager {
  private static memoryCache = new Map<string, { data: unknown; expires: number }>()

  static get<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data as T
    }
    return null
  }

  static set<T>(key: string, data: T, ttl: number = 300): void {
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    })
  }

  static delete(key: string): void {
    this.memoryCache.delete(key)
  }

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
 * React hook for cached data fetching
 */
export function useCachedData<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setError(null)
        
        // Check cache first
        const cached = ClientCacheManager.get<T>(cacheKey)
        if (cached && mounted) {
          setData(cached)
          setLoading(false)
          return
        }

        // Fetch fresh data
        const result = await fetcher()
        if (mounted) {
          setData(result)
          // Cache the result
          ClientCacheManager.set(cacheKey, result, options.ttl)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [cacheKey, fetcher, options.ttl])

  return { data, loading, error }
}

/**
 * Hook for manual cache management
 */
export function useCache() {
  const invalidate = (key: string) => {
    ClientCacheManager.delete(key)
  }

  const invalidatePattern = (pattern: string) => {
    const keys = Array.from(ClientCacheManager['memoryCache'].keys())
    keys.forEach(key => {
      if (key.includes(pattern.replace('*', ''))) {
        ClientCacheManager.delete(key)
      }
    })
  }

  const clear = () => {
    ClientCacheManager['memoryCache'].clear()
  }

  return { invalidate, invalidatePattern, clear }
}

// Clean expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    ClientCacheManager.cleanExpired()
  }, 5 * 60 * 1000)
}