import { NextResponse } from 'next/server'
import { resetServiceInstances, getCurrentServiceType, healthCheck } from '@/services/serviceFactory'

export async function POST() {
  try {
    console.log('🔄 重置服務實例...')
    
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