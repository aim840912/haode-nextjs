/**
 * @api {post} /api/reset-service 重置服務實例
 * @apiName ResetService
 * @apiGroup System
 * @apiPermission admin
 *
 * @apiDescription 重置所有服務實例並執行健康檢查。需要管理員權限
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 重置結果
 * @apiSuccess {String} data.timestamp 重置時間
 * @apiSuccess {String} data.message 重置訊息
 * @apiSuccess {String} data.currentService 當前服務類型 (supabase/mock/cache)
 * @apiSuccess {Object} data.health 健康檢查結果
 * @apiSuccess {String} data.health.status 健康狀態 (ok/error)
 * @apiSuccess {Number} data.health.responseTime 回應時間（毫秒）
 * @apiSuccess {String} [data.health.error] 錯誤訊息（如果有）
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "服務實例重置成功",
 *   "data": {
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "message": "服務實例已重置",
 *     "currentService": "supabase",
 *     "health": {
 *       "status": "ok",
 *       "responseTime": 45
 *     }
 *   }
 * }
 *
 * @apiError (403) AuthorizationError 需要管理員權限
 *
 * @apiErrorExample {json} 權限不足:
 * {
 *   "success": false,
 *   "message": "需要管理員權限",
 *   "error": {
 *     "code": "AUTHORIZATION_ERROR"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError } from '@/lib/middleware/api-middleware'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'

async function handlePOST(request: NextRequest, user: { id: string }) {
  apiLogger.info('管理員開始重置服務實例', {
    module: 'ResetService',
    action: 'POST',
    metadata: { adminId: user.id },
  })

  // 注意: 服務架構已簡化,不再有服務實例快取需要重置
  apiLogger.info('架構已簡化,直接執行健康檢查', {
    module: 'ResetService',
    action: 'POST',
    metadata: { adminId: user.id },
  })

  // 簡化的健康檢查 - 直接測試 Supabase 連接
  const startTime = Date.now()
  let health: { status: string; responseTime: number; error?: string }
  try {
    const admin = getSupabaseAdmin()
    if (!admin) {
      throw new Error('Supabase admin client not initialized')
    }
    await admin.from('products').select('id').limit(1).single()
    health = {
      status: 'ok',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    health = {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    message: '服務架構已簡化,無需重置實例',
    currentService: 'supabase',
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

// 導出使用組合函數的 POST 處理器：權限檢查 + 錯誤處理
export const POST = withAdminAndError(handlePOST, {
  module: 'ResetServiceAPI',
  enableAuditLog: true,
})
