import { NextResponse } from 'next/server'
import { resetServiceInstances, getCurrentServiceType, healthCheck } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'

export async function POST() {
  try {
    apiLogger.info('重置服務實例...', { module: 'ResetService', action: 'POST /api/reset-service' })
    
    // 重置服務實例
    resetServiceInstances()
    
    // 執行健康檢查（這會觸發重新初始化）
    const health = await healthCheck()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      message: '服務實例已重置',
      currentService: getCurrentServiceType(),
      health
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Reset failed'
    }, { status: 500 })
  }
}