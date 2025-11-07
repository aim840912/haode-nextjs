/**
 * @api {get} /api/data-strategy 取得資料策略資訊
 * @apiName GetDataStrategy
 * @apiGroup System
 * @apiPermission public
 *
 * @apiDescription 查詢當前資料策略配置、服務類型和健康狀態
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 資料策略資訊
 * @apiSuccess {String} data.timestamp 時間戳記
 * @apiSuccess {Object} data.strategy 策略配置
 * @apiSuccess {String} data.strategy.environment 環境 (development/production)
 * @apiSuccess {Boolean} data.strategy.useSupabase 是否使用 Supabase
 * @apiSuccess {Boolean} data.strategy.hasSupabaseConfig 是否有 Supabase 配置
 * @apiSuccess {String} data.strategy.primaryDataSource 主要資料來源
 * @apiSuccess {Boolean} data.strategy.cacheEnabled 是否啟用快取
 * @apiSuccess {Boolean} data.strategy.fallbackEnabled 是否啟用降級模式
 * @apiSuccess {Object} data.service 服務資訊
 * @apiSuccess {String} data.service.type 服務類型 (supabase/mock/cache)
 * @apiSuccess {String} data.service.status 健康狀態 (ok/error)
 * @apiSuccess {Number} data.service.responseTime 回應時間（毫秒）
 * @apiSuccess {String[]} data.recommendations 配置建議
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "資料策略查詢成功",
 *   "data": {
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "strategy": {
 *       "environment": "production",
 *       "useSupabase": true,
 *       "hasSupabaseConfig": true,
 *       "primaryDataSource": "Supabase",
 *       "cacheEnabled": true,
 *       "fallbackEnabled": true
 *     },
 *     "service": {
 *       "type": "supabase",
 *       "status": "ok",
 *       "responseTime": 45
 *     },
 *     "config": {
 *       "useSupabase": true,
 *       "useCache": true,
 *       "useMock": false
 *     },
 *     "recommendations": [
 *       "資料策略配置正常，運行良好！"
 *     ]
 *   }
 * }
 *
 * @apiErrorExample {json} 錯誤回應:
 * {
 *   "success": false,
 *   "message": "資料策略查詢失敗",
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "details": "無法取得策略資訊"
 *   }
 * }
 */

// import { NextRequest } from 'next/server' // 未使用
import { getStrategyInfo } from '@/config/data-strategy'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { getCurrentServiceType, healthCheck } from '@/services/factory/serviceFactory'

async function handleGET() {
  apiLogger.info('開始查詢資料策略資訊', {
    module: 'DataStrategy',
    action: 'GET',
  })

  // 獲取策略資訊
  const strategyInfo = getStrategyInfo()

  // 執行健康檢查
  const health = await healthCheck()

  // 獲取當前服務類型
  const currentService = getCurrentServiceType()

  const result = {
    timestamp: new Date().toISOString(),
    strategy: {
      environment: strategyInfo.environment,
      useSupabase: strategyInfo.useSupabase,
      hasSupabaseConfig: strategyInfo.hasSupabaseConfig,
      primaryDataSource: strategyInfo.summary.primaryDataSource,
      cacheEnabled: strategyInfo.summary.cacheEnabled,
      fallbackEnabled: strategyInfo.summary.fallbackEnabled,
    },
    service: {
      type: currentService,
      status: health.status,
      responseTime: health.responseTime,
      error: health.error,
    },
    config: strategyInfo.strategy,
    recommendations: generateRecommendations(strategyInfo, health),
  }

  apiLogger.info('資料策略查詢完成', {
    module: 'DataStrategy',
    action: 'GET',
    metadata: {
      environment: strategyInfo.environment,
      serviceType: currentService,
      healthStatus: health.status,
      responseTime: health.responseTime,
    },
  })

  return success(result, '資料策略查詢成功')
}

// 導出使用 withErrorHandler 中間件的 GET 處理器
export const GET = withErrorHandler(handleGET, {
  module: 'DataStrategy',
  enableAuditLog: false, // 為公開 API，不需要審計日誌
})

function generateRecommendations(
  strategyInfo: ReturnType<typeof getStrategyInfo>,
  health: Awaited<ReturnType<typeof healthCheck>>
): string[] {
  const recommendations: string[] = []

  // 環境建議
  if (strategyInfo.environment === 'development' && strategyInfo.useSupabase) {
    recommendations.push('開發環境建議設定 USE_SUPABASE=false 以節省流量')
  }

  if (strategyInfo.environment === 'production' && !strategyInfo.useSupabase) {
    recommendations.push('生產環境建議啟用 Supabase 以獲得完整功能')
  }

  // 配置建議
  if (strategyInfo.useSupabase && !strategyInfo.hasSupabaseConfig) {
    recommendations.push('已啟用 Supabase 但缺少必要環境變數')
  }

  if (!strategyInfo.strategy.useCache) {
    recommendations.push('考慮啟用 Vercel KV 快取以提升效能')
  }

  // 健康狀態建議
  if (health.status === 'error') {
    recommendations.push('服務健康檢查失敗，請檢查資料庫連線')
  }

  if (health.responseTime > 1000) {
    recommendations.push('響應時間較慢，建議啟用快取或檢查網路')
  }

  // 無問題時的建議
  if (recommendations.length === 0) {
    recommendations.push('資料策略配置正常，運行良好！')
  }

  return recommendations
}
