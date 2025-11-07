import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { getPoolStats } from '@/lib/supabase/connection-factory'

// 連線池統計資料類型
interface PoolStats {
  poolUtilization: number
  averageAcquireTime: number
  totalRequests: number
  failedRequests: number
  totalConnections: number
  unhealthyConnections: number
  activeConnections: number
}

/**
 * @api {GET} /api/admin/pool-status 取得連線池詳細狀態
 * @apiName GetPoolStatus
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得連線池的詳細狀態和統計資訊，包含健康分數、效能指標和優化建議。
 * 僅限管理員訪問。
 *
 * @apiPermission admin
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 連線池狀態
 * @apiSuccess {Boolean} data.enabled 連線池是否啟用
 * @apiSuccess {Object} data.stats 統計資料
 * @apiSuccess {Number} data.stats.poolUtilization 使用率（%）
 * @apiSuccess {Number} data.stats.averageAcquireTime 平均取得時間（ms）
 * @apiSuccess {Number} data.stats.totalRequests 總請求數
 * @apiSuccess {Object} data.analysis 分析結果
 * @apiSuccess {Number} data.analysis.healthScore 健康分數 (0-100)
 * @apiSuccess {String} data.analysis.utilizationLevel 使用率等級
 * @apiSuccess {String[]} data.analysis.recommendations 優化建議
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "enabled": true,
 *     "stats": {
 *       "poolUtilization": 45,
 *       "averageAcquireTime": 15.5,
 *       "totalRequests": 1000
 *     },
 *     "analysis": {
 *       "healthScore": 95,
 *       "utilizationLevel": "normal",
 *       "recommendations": ["連線池運行正常，無需調整"]
 *     }
 *   },
 *   "message": "連線池狀態查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(_request: NextRequest, _user: User) {
  try {
    // 動態導入 connectionFactory 避免全域實例創建
    const { shouldUseConnectionPool } = await import('@/lib/supabase/connection-factory')
    const isPoolEnabled = await shouldUseConnectionPool()

    if (!isPoolEnabled) {
      return success(
        {
          enabled: false,
          message: '連線池未啟用，使用傳統單例模式',
          fallbackMode: true,
        },
        '連線池狀態查詢成功'
      )
    }

    const stats = await getPoolStats()

    if (!stats) {
      return success(
        {
          enabled: true,
          message: '連線池已啟用但統計資訊不可用',
          error: '無法取得統計資訊',
        },
        '連線池狀態查詢完成'
      )
    }

    // 計算額外的統計資訊
    const additionalStats = {
      healthScore: calculateHealthScore(stats),
      utilizationLevel: getUtilizationLevel(stats.poolUtilization),
      performance: {
        averageAcquireTime: `${stats.averageAcquireTime.toFixed(2)}ms`,
        successRate:
          stats.totalRequests > 0
            ? (((stats.totalRequests - stats.failedRequests) / stats.totalRequests) * 100).toFixed(
                2
              ) + '%'
            : '100%',
      },
      recommendations: generateRecommendations(stats),
    }

    apiLogger.info('連線池狀態查詢', {
      module: 'PoolStatusAPI',
      action: 'getStatus',
      metadata: {
        poolUtilization: stats.poolUtilization,
        totalConnections: stats.totalConnections,
        totalRequests: stats.totalRequests,
        healthScore: additionalStats.healthScore,
      },
    })

    return success(
      {
        enabled: true,
        timestamp: new Date().toISOString(),
        stats,
        analysis: additionalStats,
      },
      '連線池狀態查詢成功'
    )
  } catch (error) {
    apiLogger.error('連線池狀態查詢失敗', error as Error, {
      module: 'PoolStatusAPI',
      action: 'getStatus',
    })

    return success(
      {
        enabled: false,
        error: (error as Error).message,
        fallbackMode: true,
      },
      '連線池狀態查詢失敗，返回後備資訊'
    )
  }
}

/**
 * 計算連線池健康分數 (0-100)
 */
function calculateHealthScore(stats: PoolStats): number {
  let score = 100

  // 失敗率扣分（每 1% 失敗率扣 10 分）
  if (stats.totalRequests > 0) {
    const failureRate = (stats.failedRequests / stats.totalRequests) * 100
    score -= failureRate * 10
  }

  // 不健康連線扣分（每個不健康連線扣 20 分）
  score -= stats.unhealthyConnections * 20

  // 高使用率扣分（使用率超過 80% 開始扣分）
  if (stats.poolUtilization > 80) {
    score -= (stats.poolUtilization - 80) * 2
  }

  // 平均取得時間過長扣分（超過 100ms 開始扣分）
  if (stats.averageAcquireTime > 100) {
    score -= Math.min((stats.averageAcquireTime - 100) / 10, 20)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * 取得使用率等級
 */
function getUtilizationLevel(utilization: number): string {
  if (utilization < 30) return 'low' // 低使用率
  if (utilization < 60) return 'normal' // 正常使用率
  if (utilization < 80) return 'high' // 高使用率
  return 'critical' // 臨界使用率
}

/**
 * 生成優化建議
 */
function generateRecommendations(stats: PoolStats): string[] {
  const recommendations: string[] = []

  // 使用率建議
  if (stats.poolUtilization > 80) {
    recommendations.push('連線池使用率過高，建議增加最大連線數或優化查詢效能')
  } else if (stats.poolUtilization < 10 && stats.totalConnections > 2) {
    recommendations.push('連線池使用率較低，可考慮減少最小連線數以節省資源')
  }

  // 效能建議
  if (stats.averageAcquireTime > 100) {
    recommendations.push('連線取得時間較長，建議檢查連線池配置或資料庫效能')
  }

  // 錯誤率建議
  if (stats.totalRequests > 0) {
    const errorRate = (stats.failedRequests / stats.totalRequests) * 100
    if (errorRate > 5) {
      recommendations.push('連線失敗率較高，建議檢查資料庫連線穩定性')
    }
  }

  // 不健康連線建議
  if (stats.unhealthyConnections > 0) {
    recommendations.push('存在不健康的連線，建議檢查資料庫狀態和網路連線')
  }

  // 連線數建議
  if (stats.totalConnections === stats.activeConnections && stats.totalRequests > 100) {
    recommendations.push('所有連線都在使用中，建議增加連線池大小')
  }

  if (recommendations.length === 0) {
    recommendations.push('連線池運行正常，無需調整')
  }

  return recommendations
}

// 匯出 API 路由 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAdminAndError(handleGET, { module: 'PoolStatusAPI' })
