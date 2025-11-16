/**
 * 快取系統型別定義
 */

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale while revalidate in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  hitRate: string
}

export interface AdvancedCacheMetrics extends CacheMetrics {
  memoryHits: number
  kvHits: number
  sets: number
  deletes: number
  invalidations: number
  warmups: number
  backgroundRefreshes: number
  averageResponseTime: number
  peakMemorySize: number
  totalOperations: number
  uptime: number
  lastActivity: string
  layerDistribution: {
    memory: number
    kv: number
  }
}

export interface CacheEntry {
  data: unknown
  expires: number
  tags: string[]
}

export interface WarmupTask {
  key: string
  fetcher: () => Promise<unknown>
  options?: CacheOptions
}

export interface BackgroundRefreshTask extends WarmupTask {
  threshold?: number // 剩餘時間閾值（秒），預設60秒
}

export interface MetricsData {
  hits: number
  misses: number
  errors: number
  memoryHits: number
  kvHits: number
  sets: number
  deletes: number
  invalidations: number
  warmups: number
  backgroundRefreshes: number
  responseTimes: number[]
  peakMemorySize: number
  startTime: number
  lastActivity: number
}
