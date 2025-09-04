import { NextRequest } from 'next/server'
import { getStrategyInfo } from '@/config/data-strategy'
import { getCurrentServiceType, healthCheck } from '@/services/serviceFactory'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

async function handleGET(request: NextRequest) {
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
