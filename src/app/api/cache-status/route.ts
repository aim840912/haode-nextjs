/**
 * @api {get} /api/cache-status 取得快取狀態資訊
 * @apiName GetCacheStatus
 * @apiGroup System
 * @apiPermission public
 *
 * @apiDescription 查詢統一快取管理器的狀態、指標和健康資訊
 *
 * @apiQuery {Boolean} [detailed=false] 是否返回詳細的快取統計資訊
 * @apiQuery {Boolean} [benchmark=false] 是否執行效能基準測試
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 快取狀態資料
 * @apiSuccess {String} data.timestamp 時間戳記
 * @apiSuccess {Boolean} data.cacheEnabled 快取是否啟用
 * @apiSuccess {Object} data.health 健康評分資訊
 * @apiSuccess {Number} data.health.score 健康評分 (0-100)
 * @apiSuccess {String} data.health.status 狀態 (excellent/good/fair/poor)
 * @apiSuccess {String[]} data.health.factors 影響因素
 * @apiSuccess {Object} data.config 快取配置
 * @apiSuccess {Boolean} data.config.kvAvailable KV 快取是否可用
 * @apiSuccess {Object} data.stats 快取統計資訊
 * @apiSuccess {Object} data.stats.unified 統一快取指標
 * @apiSuccess {String} data.stats.unified.hitRate 命中率
 * @apiSuccess {String[]} data.recommendations 改善建議
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "快取狀態查詢成功",
 *   "data": {
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "cacheEnabled": true,
 *     "health": {
 *       "score": 85,
 *       "status": "good",
 *       "factors": ["優秀的命中率", "快取使用活躍"]
 *     },
 *     "config": {
 *       "kvAvailable": true,
 *       "memoryFallback": true,
 *       "environment": "production"
 *     },
 *     "stats": {
 *       "unified": {
 *         "hitRate": "75.5%",
 *         "hits": 302,
 *         "misses": 98
 *       }
 *     },
 *     "recommendations": [
 *       "✅ 統一快取系統已啟用，支援多層快取和智慧型失效"
 *     ]
 *   }
 * }
 *
 * @apiErrorExample {json} 錯誤回應:
 * {
 *   "success": false,
 *   "message": "快取狀態查詢失敗",
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "details": "無法連接快取服務"
 *   }
 * }
 */

/**
 * @api {post} /api/cache-status 快取管理操作
 * @apiName ManageCacheStatus
 * @apiGroup System
 * @apiPermission public
 *
 * @apiDescription 執行快取管理操作（清除、預熱、基準測試、重設統計）
 *
 * @apiBody {String} action 操作類型 (clear/warmup/benchmark/reset-metrics)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 操作結果資料
 * @apiSuccess {String} data.timestamp 操作時間
 * @apiSuccess {String} data.action 執行的操作
 *
 * @apiSuccessExample {json} 清除快取成功:
 * {
 *   "success": true,
 *   "message": "快取已清除",
 *   "data": {
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "action": "clear"
 *   }
 * }
 *
 * @apiSuccessExample {json} 預熱快取成功:
 * {
 *   "success": true,
 *   "message": "統一快取預熱完成",
 *   "data": {
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "action": "warmup",
 *     "duration": 1250,
 *     "method": "unified-cache-manager",
 *     "tasksCompleted": 2
 *   }
 * }
 *
 * @apiError (400) ValidationError 無效的操作類型
 *
 * @apiErrorExample {json} 無效操作:
 * {
 *   "success": false,
 *   "message": "Invalid action. Available actions: clear, warmup, benchmark, reset-metrics",
 *   "error": {
 *     "code": "VALIDATION_ERROR"
 *   }
 * }
 */

import { success } from '@/lib/api-response'
import {
  calculateHealthScore,
  getDetailedCacheStats,
  runCacheBenchmark,
  generateCacheRecommendations,
} from '@/lib/cache/cache-stats-helpers'
import { UnifiedCacheManager } from '@/lib/cache/unified-cache-manager'
import { ValidationError } from '@/lib/errors'
import { cacheLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { productService } from '@/services/core/product/productService'

async function handleGET(request: Request) {
  const url = new URL(request.url)
  const detailed = url.searchParams.get('detailed') === 'true'
  const benchmark = url.searchParams.get('benchmark') === 'true'

  // 獲取統一快取管理器的資訊
  const unifiedInfo = UnifiedCacheManager.getInfo()
  const unifiedMetrics = UnifiedCacheManager.getMetrics()

  // 獲取服務實例並檢查快取統計
  let serviceStats: { unified?: unknown } | null = null

  // 檢查是否是快取服務
  if ('getCacheStats' in productService && typeof productService.getCacheStats === 'function') {
    const stats = (productService as { getCacheStats: () => unknown }).getCacheStats()
    serviceStats = stats as { unified?: unknown } | null
  }

  // 快取配置檢查
  const cacheConfig = {
    kvAvailable: unifiedInfo.kvAvailable,
    kvUrl: unifiedInfo.kvAvailable ? '***configured***' : null,
    memoryFallback: true,
    unifiedCacheEnabled: true,
    environment: process.env.NODE_ENV || 'development',
  }

  // 基本回應
  const response = {
    timestamp: new Date().toISOString(),
    cacheEnabled: true,
    health: calculateHealthScore(unifiedMetrics),
    config: cacheConfig,
    stats: {
      unified: unifiedMetrics,
      service: serviceStats,
      info: unifiedInfo,
    },
    recommendations: generateCacheRecommendations(
      unifiedInfo.kvAvailable,
      unifiedMetrics,
      serviceStats
    ),
  }

  // 詳細監控資訊
  if (detailed) {
    const detailedStats = await getDetailedCacheStats()
    ;(response as typeof response & { detailed: unknown }).detailed = detailedStats
  }

  // 效能基準測試
  if (benchmark) {
    const benchmarkResults = await runCacheBenchmark()
    ;(response as typeof response & { benchmark: unknown }).benchmark = benchmarkResults
  }

  return success(response, '快取狀態查詢成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'CacheStatus',
  enableAuditLog: false,
})

async function handlePOST(request: Request) {
  const { action } = await request.json()

  if (action === 'clear') {
    // 清除快取

    if ('clearCache' in productService && typeof productService.clearCache === 'function') {
      await (productService as { clearCache: () => Promise<void> }).clearCache()

      return success(
        {
          timestamp: new Date().toISOString(),
          action: 'clear',
        },
        '快取已清除'
      )
    } else {
      throw new ValidationError('快取服務不支援清除功能')
    }
  }

  if (action === 'warmup') {
    // 使用統一快取管理器的預熱功能
    const start = Date.now()

    // 擴展預熱任務，涵蓋更多關鍵資料
    await UnifiedCacheManager.warmUp([
      {
        key: 'products:list',
        fetcher: async () => {
          return productService.getProducts()
        },
        options: { ttl: 600, tags: ['products', 'product-list'] },
      },
      {
        key: 'products:all',
        fetcher: async () => {
          return productService.getAllProducts
            ? productService.getAllProducts()
            : productService.getProducts()
        },
        options: { ttl: 300, tags: ['products', 'admin'] },
      },
    ])

    const duration = Date.now() - start

    cacheLogger.info('快取預熱操作完成', { metadata: { duration, action: 'warmup' } })

    return success(
      {
        timestamp: new Date().toISOString(),
        action: 'warmup',
        duration,
        method: 'unified-cache-manager',
        tasksCompleted: 2,
      },
      '統一快取預熱完成'
    )
  }

  if (action === 'benchmark') {
    // 執行效能基準測試
    const benchmarkResults = await runCacheBenchmark()

    return success(
      {
        timestamp: new Date().toISOString(),
        action: 'benchmark',
        results: benchmarkResults,
      },
      '快取效能基準測試完成'
    )
  }

  if (action === 'reset-metrics') {
    // 重設統計指標
    UnifiedCacheManager.resetMetrics()

    cacheLogger.info('快取統計指標已重設', { metadata: { action: 'reset-metrics' } })

    return success(
      {
        timestamp: new Date().toISOString(),
        action: 'reset-metrics',
      },
      '快取統計指標已重設'
    )
  }

  throw new ValidationError(
    `Invalid action. Available actions: clear, warmup, benchmark, reset-metrics`
  )
}

export const POST = withErrorHandler(handlePOST, {
  module: 'CacheStatus',
  enableAuditLog: true,
})
