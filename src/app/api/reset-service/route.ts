import { NextRequest } from 'next/server'
import {
  resetServiceInstances,
  getCurrentServiceType,
  healthCheck,
} from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'
import { requireAdmin } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'

async function handlePOST(request: NextRequest, { user }: { user: { id: string } }) {
  apiLogger.info('管理員開始重置服務實例', {
    module: 'ResetService',
    action: 'POST',
    metadata: { adminId: user.id },
  })

  // 重置服務實例
  resetServiceInstances()

  apiLogger.info('服務實例重置完成，執行健康檢查', {
    module: 'ResetService',
    action: 'POST',
    metadata: { adminId: user.id },
  })

  // 執行健康檢查（這會觸發重新初始化）
  const health = await healthCheck()

  const result = {
    timestamp: new Date().toISOString(),
    message: '服務實例已重置',
    currentService: getCurrentServiceType(),
    health,
  }

  apiLogger.info('服務重置作業完成', {
    module: 'ResetService',
    action: 'POST',
    metadata: {
      adminId: user.id,
      newServiceType: result.currentService,
      healthStatus: health.status,
      responseTime: health.responseTime,
    },
  })

  return success(result, '服務實例重置成功')
}

// 導出使用 requireAdmin 中間件的 POST 處理器
export const POST = requireAdmin(handlePOST)
