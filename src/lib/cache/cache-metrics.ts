/**
 * 快取統計指標管理
 */

import type { CacheMetrics, AdvancedCacheMetrics, MetricsData } from './cache-types'

export class CacheMetricsManager {
  private metrics: MetricsData = {
    hits: 0,
    misses: 0,
    errors: 0,
    memoryHits: 0,
    kvHits: 0,
    sets: 0,
    deletes: 0,
    invalidations: 0,
    warmups: 0,
    backgroundRefreshes: 0,
    responseTimes: [],
    peakMemorySize: 0,
    startTime: Date.now(),
    lastActivity: Date.now(),
  }

  /**
   * 記錄快取命中
   */
  recordHit(layer: 'memory' | 'kv'): void {
    this.metrics.hits++
    if (layer === 'memory') {
      this.metrics.memoryHits++
    } else {
      this.metrics.kvHits++
    }
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄快取未命中
   */
  recordMiss(): void {
    this.metrics.misses++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄錯誤
   */
  recordError(): void {
    this.metrics.errors++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄設定操作
   */
  recordSet(): void {
    this.metrics.sets++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄刪除操作
   */
  recordDelete(): void {
    this.metrics.deletes++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄失效操作
   */
  recordInvalidation(): void {
    this.metrics.invalidations++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄預熱操作
   */
  recordWarmup(): void {
    this.metrics.warmups++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄背景更新
   */
  recordBackgroundRefresh(): void {
    this.metrics.backgroundRefreshes++
    this.metrics.lastActivity = Date.now()
  }

  /**
   * 記錄回應時間
   */
  recordResponseTime(time: number): void {
    this.metrics.responseTimes.push(time)
    // 保持最近 1000 筆記錄
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift()
    }
  }

  /**
   * 更新記憶體峰值大小
   */
  updatePeakMemorySize(size: number): void {
    if (size > this.metrics.peakMemorySize) {
      this.metrics.peakMemorySize = size
    }
  }

  /**
   * 取得基礎統計資訊
   */
  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      hitRate: total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) + '%' : '0.0%',
    }
  }

  /**
   * 取得進階統計資訊
   */
  getAdvancedStats(): AdvancedCacheMetrics {
    const total = this.metrics.hits + this.metrics.misses
    const uptime = Date.now() - this.metrics.startTime
    const averageResponseTime =
      this.metrics.responseTimes.length > 0
        ? this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
          this.metrics.responseTimes.length
        : 0

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      errors: this.metrics.errors,
      hitRate: total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) + '%' : '0.0%',
      memoryHits: this.metrics.memoryHits,
      kvHits: this.metrics.kvHits,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      invalidations: this.metrics.invalidations,
      warmups: this.metrics.warmups,
      backgroundRefreshes: this.metrics.backgroundRefreshes,
      averageResponseTime,
      peakMemorySize: this.metrics.peakMemorySize,
      totalOperations: this.metrics.hits + this.metrics.misses + this.metrics.sets,
      uptime,
      lastActivity: new Date(this.metrics.lastActivity).toISOString(),
      layerDistribution: {
        memory: total > 0 ? (this.metrics.memoryHits / total) * 100 : 0,
        kv: total > 0 ? (this.metrics.kvHits / total) * 100 : 0,
      },
    }
  }

  /**
   * 重設統計資訊
   */
  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      memoryHits: 0,
      kvHits: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      warmups: 0,
      backgroundRefreshes: 0,
      responseTimes: [],
      peakMemorySize: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
    }
  }
}
