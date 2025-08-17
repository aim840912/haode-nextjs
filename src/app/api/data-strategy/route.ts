import { NextResponse } from 'next/server'
import { getStrategyInfo } from '@/config/data-strategy'
import { getCurrentServiceType, healthCheck } from '@/services/serviceFactory'

export async function GET() {
  try {
    // 獲取策略資訊
    const strategyInfo = getStrategyInfo()
    
    // 執行健康檢查
    const health = await healthCheck()
    
    // 獲取當前服務類型
    const currentService = getCurrentServiceType()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      strategy: {
        environment: strategyInfo.environment,
        useSupabase: strategyInfo.useSupabase,
        hasSupabaseConfig: strategyInfo.hasSupabaseConfig,
        primaryDataSource: strategyInfo.summary.primaryDataSource,
        cacheEnabled: strategyInfo.summary.cacheEnabled,
        fallbackEnabled: strategyInfo.summary.fallbackEnabled
      },
      service: {
        type: currentService,
        status: health.status,
        responseTime: health.responseTime,
        error: health.error
      },
      config: strategyInfo.strategy,
      recommendations: generateRecommendations(strategyInfo, health)
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '資料策略檢查失敗'
    }, { status: 500 })
  }
}

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