/**
 * 快取統計輔助函數
 *
 * 提供快取健康評分、詳細統計、效能基準測試和建議生成功能
 * 從 API Routes 中抽取出來，便於重用和測試
 */

import { cacheLogger } from '@/lib/logger'
import { UnifiedCacheManager } from './unified-cache-manager'

/**
 * 計算快取健康評分 (0-100)
 *
 * @param metrics - 快取指標（命中率、錯誤數等）
 * @returns 健康評分、狀態和影響因素
 */
export function calculateHealthScore(metrics: {
  hitRate: string
  hits?: number
  misses?: number
  errors?: number
  memorySize?: number
}): {
  score: number
  status: string
  factors: string[]
} {
  let score = 100
  const factors: string[] = []

  if (!metrics) {
    return { score: 0, status: 'unknown', factors: ['無法獲取快取指標'] }
  }

  const hitRate = parseFloat(metrics.hitRate)

  // 命中率評分 (40% 權重)
  if (hitRate < 30) {
    score -= 40
    factors.push('命中率過低')
  } else if (hitRate < 60) {
    score -= 20
    factors.push('命中率偏低')
  } else if (hitRate > 90) {
    factors.push('優秀的命中率')
  }

  // 錯誤率評分 (30% 權重)
  const totalRequests = (metrics.hits || 0) + (metrics.misses || 0)
  if (totalRequests > 0 && metrics.errors) {
    const errorRate = (metrics.errors / totalRequests) * 100
    if (errorRate > 5) {
      score -= 30
      factors.push('錯誤率過高')
    } else if (errorRate > 1) {
      score -= 15
      factors.push('錯誤率偏高')
    }
  }

  // 使用狀況評分 (30% 權重)
  if (totalRequests === 0) {
    score -= 30
    factors.push('快取未被使用')
  } else if (totalRequests < 10) {
    score -= 15
    factors.push('快取使用率較低')
  } else {
    factors.push('快取使用活躍')
  }

  // 確定狀態
  let status = 'excellent'
  if (score < 50) status = 'poor'
  else if (score < 70) status = 'fair'
  else if (score < 90) status = 'good'

  return { score: Math.max(0, score), status, factors }
}

/**
 * 獲取詳細的快取統計資訊
 *
 * @returns 詳細的快取層級、效能和記憶體使用資訊
 */
export async function getDetailedCacheStats() {
  const now = Date.now()
  const unifiedInfo = UnifiedCacheManager.getInfo()

  return {
    timestamp: new Date().toISOString(),
    memory: {
      size: unifiedInfo.memorySize,
      // 無法直接獲取記憶體使用量，但可以提供大小資訊
      estimated_size_mb: (unifiedInfo.memorySize * 0.1).toFixed(2), // 估算
    },
    performance: {
      uptime_seconds: Math.floor(
        (now - ((global as Record<string, unknown>).__cacheStartTime as number) || now) / 1000
      ),
      last_cleanup: '每5分鐘自動清理',
      kv_available: unifiedInfo.kvAvailable,
    },
    layers: {
      memory: {
        enabled: true,
        size: unifiedInfo.memorySize,
        ttl_default: 300,
      },
      kv: {
        enabled: unifiedInfo.kvAvailable,
        provider: unifiedInfo.kvAvailable ? 'Vercel KV' : null,
      },
    },
  }
}

/**
 * 執行快取效能基準測試
 *
 * 測試 SET、GET (未命中)、GET (命中) 操作的效能
 *
 * @returns 基準測試結果（操作延遲統計）
 */
export async function runCacheBenchmark() {
  const testKey = `benchmark:test:${Date.now()}`
  const testData = { test: 'benchmark', timestamp: Date.now() }
  const iterations = 10

  const results = {
    set_operations: [] as number[],
    get_operations: [] as number[],
    hit_operations: [] as number[],
    summary: {} as Record<string, unknown>,
  }

  try {
    // 測試 SET 操作效能
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await UnifiedCacheManager.set(`${testKey}:${i}`, testData, { ttl: 60 })
      const duration = performance.now() - start
      results.set_operations.push(duration)
    }

    // 測試 GET 操作效能 (未命中)
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await UnifiedCacheManager.get(`${testKey}:miss:${i}`)
      const duration = performance.now() - start
      results.get_operations.push(duration)
    }

    // 測試 GET 操作效能 (命中)
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await UnifiedCacheManager.get(`${testKey}:${i}`)
      const duration = performance.now() - start
      results.hit_operations.push(duration)
    }

    // 計算統計摘要
    const calculateStats = (ops: number[]) => ({
      avg: ops.reduce((a, b) => a + b, 0) / ops.length,
      min: Math.min(...ops),
      max: Math.max(...ops),
      median: ops.sort((a, b) => a - b)[Math.floor(ops.length / 2)],
    })

    results.summary = {
      set_ms: calculateStats(results.set_operations),
      get_miss_ms: calculateStats(results.get_operations),
      get_hit_ms: calculateStats(results.hit_operations),
      iterations,
      timestamp: new Date().toISOString(),
    }

    // 清理測試資料
    for (let i = 0; i < iterations; i++) {
      await UnifiedCacheManager.delete(`${testKey}:${i}`)
    }

    cacheLogger.info('快取效能基準測試完成', {
      metadata: {
        iterations,
        avgSetTime: (results.summary.set_ms as { avg: number }).avg.toFixed(2),
        avgGetHitTime: (results.summary.get_hit_ms as { avg: number }).avg.toFixed(2),
      },
    })

    return results
  } catch (error) {
    cacheLogger.warn('快取效能基準測試失敗', { metadata: { error: (error as Error).message } })
    throw error
  }
}

/**
 * 生成快取系統改善建議
 *
 * @param hasKV - 是否啟用 KV Storage
 * @param unifiedMetrics - 統一快取指標
 * @param serviceStats - 服務層快取統計
 * @returns 建議列表
 */
export function generateCacheRecommendations(
  hasKV: boolean,
  unifiedMetrics: { hitRate: string; errors?: number; size?: number },
  serviceStats: { unified?: unknown } | null
): string[] {
  const recommendations: string[] = []

  if (!hasKV) {
    recommendations.push('建議在 Vercel Dashboard 設定 KV Storage 以獲得更好的快取效能')
    recommendations.push('目前使用內存快取，重新部署時快取會清空')
  } else {
    recommendations.push('✅ 統一快取系統已啟用，支援多層快取和智慧型失效')
  }

  // 統一快取的建議
  if (unifiedMetrics) {
    const hitRate = parseFloat(unifiedMetrics.hitRate)

    if (hitRate < 50) {
      recommendations.push('快取命中率較低，考慮使用 warmUp() 預熱功能或增加 TTL 時間')
    } else if (hitRate > 90) {
      recommendations.push('✨ 統一快取命中率優秀！系統效能良好')
    }

    if (unifiedMetrics.errors && unifiedMetrics.errors > 0) {
      recommendations.push('⚠️ 偵測到快取錯誤，請檢查 KV 連線狀態')
    }

    if (unifiedMetrics.size && unifiedMetrics.size > 1000) {
      recommendations.push('快取項目較多，考慮使用標籤失效機制清理過期內容')
    }
  }

  // 服務層統計
  if (serviceStats && serviceStats.unified) {
    recommendations.push('✅ 產品服務已整合統一快取系統')
  }

  // 新功能建議
  recommendations.push('✨ 可使用新增功能: 快取預熱、背景更新、標籤失效')

  if (recommendations.length === 1) {
    recommendations.push('🚀 快取系統運行狀態良好！')
  }

  return recommendations
}
