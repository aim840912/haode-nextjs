import { useState, useEffect } from 'react'

// 簡單的記憶體快取實作
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 預設5分鐘
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 檢查是否過期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清理過期項目
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 獲取快取統計
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 全域快取實例
export const apiCache = new ApiCache()

// 快取裝飾器 - 用於包裝API函數
export function withCache<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = 5 * 60 * 1000
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)

    // 嘗試從快取取得
    const cached = apiCache.get<R>(key)
    if (cached !== null) {
      return cached
    }

    // 執行原函數並快取結果
    const result = await fn(...args)
    apiCache.set(key, result, ttl)

    return result
  }
}

// React Hook 用於帶快取的 API 呼叫
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // 檢查快取
        const cached = apiCache.get<T>(key)
        if (cached !== null) {
          setData(cached)
          setLoading(false)
          return
        }

        // 從 API 取得資料
        const result = await fetcher()
        apiCache.set(key, result, ttl)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [key, ttl, fetcher])

  const refetch = async () => {
    apiCache.delete(key)
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      apiCache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// 定期清理過期快取
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      apiCache.cleanup()
    },
    10 * 60 * 1000
  ) // 每10分鐘清理一次
}

// 預設快取鍵產生器
export const cacheKeys = {
  products: () => 'products:list',
  product: (id: string) => `products:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  locations: () => 'locations:list',
  reviews: (productId?: string) => (productId ? `reviews:${productId}` : 'reviews:all'),
  news: () => 'news:list',
}
