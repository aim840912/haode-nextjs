import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import {
  schemaMonitor,
  startSchemaMonitoring,
  stopSchemaMonitoring,
  checkSchemaChanges,
} from '@/lib/database/schema-monitor'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import {
  refreshConnectionPoolSchema,
  resetAllConnections,
  getSchemaVersion,
  shouldUseConnectionPool,
  getPoolStats,
} from '@/lib/supabase/connection-factory'

interface ConnectionPoolOperation {
  operation:
    | 'refresh'
    | 'reset'
    | 'status'
    | 'monitor-start'
    | 'monitor-stop'
    | 'monitor-status'
    | 'monitor-check'
  force?: boolean
  checkInterval?: number
}

/**
 * @api {POST} /api/admin/connection-pool 執行連線池操作
 * @apiName AdminConnectionPoolOperation
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 管理員專用的連線池管理工具。
 * 支援多種操作：刷新 Schema、重置連線、啟動/停止監控等。
 *
 * @apiPermission admin
 *
 * @apiBody {String="refresh","reset","status","monitor-start","monitor-stop","monitor-status","monitor-check"} operation 操作類型
 * @apiBody {Boolean} [force] 是否強制執行
 * @apiBody {Number} [checkInterval] 監控檢查間隔（毫秒，僅 monitor-start 使用）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 操作結果
 * @apiSuccess {String} data.operation 執行的操作
 * @apiSuccess {String} data.message 操作訊息
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（refresh）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "operation": "refresh",
 *     "message": "Schema 重新整理完成",
 *     "schemaVersion": "v2.0.1",
 *     "timestamp": "2025-01-07T10:30:00Z"
 *   },
 *   "message": "Schema 重新整理成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 操作類型無效
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "operation 必須是 refresh、reset、status 其中之一",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handlePOST(req: NextRequest, user: User): Promise<NextResponse> {
  const body = (await req.json()) as ConnectionPoolOperation

  // 輸入驗證
  const validOperations = [
    'refresh',
    'reset',
    'status',
    'monitor-start',
    'monitor-stop',
    'monitor-status',
    'monitor-check',
  ]
  if (!body.operation || !validOperations.includes(body.operation)) {
    throw new ValidationError(`operation 必須是 ${validOperations.join('、')} 其中之一`)
  }

  apiLogger.info('管理員操作連線池', {
    module: 'ConnectionPoolAdminAPI',
    action: 'POST /api/admin/connection-pool',
    metadata: {
      operation: body.operation,
      userId: user.id,
      userEmail: user.email,
      force: body.force || false,
    },
  })

  try {
    switch (body.operation) {
      case 'refresh':
        await refreshConnectionPoolSchema()

        return success(
          {
            operation: 'refresh',
            message: 'Schema 重新整理完成',
            schemaVersion: await getSchemaVersion(),
            timestamp: new Date().toISOString(),
          },
          'Schema 重新整理成功'
        )

      case 'reset':
        await resetAllConnections()

        return success(
          {
            operation: 'reset',
            message: '所有連線已重置',
            schemaVersion: await getSchemaVersion(),
            timestamp: new Date().toISOString(),
          },
          '連線重置成功'
        )

      case 'status':
        const isPoolEnabled = await shouldUseConnectionPool()
        const poolStats = isPoolEnabled ? await getPoolStats() : null
        const schemaVersion = await getSchemaVersion()
        const monitorStatus = schemaMonitor.getStatus()

        return success(
          {
            operation: 'status',
            poolEnabled: isPoolEnabled,
            schemaVersion,
            poolStats,
            schemaMonitor: monitorStatus,
            timestamp: new Date().toISOString(),
          },
          '連線池狀態查詢成功'
        )

      case 'monitor-start':
        const checkInterval = body.checkInterval || 60000 // 預設 60 秒
        await startSchemaMonitoring(checkInterval)

        return success(
          {
            operation: 'monitor-start',
            message: 'Schema 監控已啟動',
            checkInterval,
            monitorStatus: schemaMonitor.getStatus(),
            timestamp: new Date().toISOString(),
          },
          'Schema 監控啟動成功'
        )

      case 'monitor-stop':
        stopSchemaMonitoring()

        return success(
          {
            operation: 'monitor-stop',
            message: 'Schema 監控已停止',
            monitorStatus: schemaMonitor.getStatus(),
            timestamp: new Date().toISOString(),
          },
          'Schema 監控停止成功'
        )

      case 'monitor-status':
        return success(
          {
            operation: 'monitor-status',
            monitorStatus: schemaMonitor.getStatus(),
            timestamp: new Date().toISOString(),
          },
          'Schema 監控狀態查詢成功'
        )

      case 'monitor-check':
        const hasChanges = await checkSchemaChanges()

        return success(
          {
            operation: 'monitor-check',
            hasChanges,
            message: hasChanges ? 'Schema 有變更，已自動重新整理連線池' : 'Schema 無變更',
            monitorStatus: schemaMonitor.getStatus(),
            timestamp: new Date().toISOString(),
          },
          'Schema 變更檢查完成'
        )

      default:
        throw new ValidationError('不支援的操作')
    }
  } catch (error) {
    apiLogger.error('連線池操作失敗', error as Error, {
      module: 'ConnectionPoolAdminAPI',
      action: 'POST /api/admin/connection-pool',
      metadata: {
        operation: body.operation,
        userId: user.id,
        userEmail: user.email,
      },
    })
    throw error
  }
}

/**
 * @api {GET} /api/admin/connection-pool 取得連線池狀態
 * @apiName GetConnectionPoolStatus
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 查詢當前連線池的狀態和配置資訊。
 * 包含連線池統計、Schema 版本、監控狀態等。
 *
 * @apiPermission admin
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 連線池狀態
 * @apiSuccess {Boolean} data.poolEnabled 連線池是否啟用
 * @apiSuccess {String} data.schemaVersion Schema 版本
 * @apiSuccess {Object} data.poolStats 連線池統計
 * @apiSuccess {Object} data.schemaMonitor 監控狀態
 * @apiSuccess {String[]} data.availableOperations 可用操作列表
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "poolEnabled": true,
 *     "schemaVersion": "v2.0.1",
 *     "poolStats": {...},
 *     "availableOperations": ["refresh", "reset", "status", "monitor-start"]
 *   },
 *   "message": "連線池狀態查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(_req: NextRequest, _user: User): Promise<NextResponse> {
  apiLogger.info('查詢連線池狀態', {
    module: 'ConnectionPoolAdminAPI',
    action: 'GET /api/admin/connection-pool',
  })

  const isPoolEnabled = await shouldUseConnectionPool()
  const poolStats = isPoolEnabled ? await getPoolStats() : null
  const schemaVersion = await getSchemaVersion()
  const monitorStatus = schemaMonitor.getStatus()

  return success(
    {
      poolEnabled: isPoolEnabled,
      schemaVersion,
      poolStats,
      schemaMonitor: monitorStatus,
      availableOperations: [
        'refresh',
        'reset',
        'status',
        'monitor-start',
        'monitor-stop',
        'monitor-status',
        'monitor-check',
      ],
      documentation: {
        refresh: 'Schema 重新整理（清除快取後重建連線）',
        reset: '重置所有連線（強制重新建立所有連線）',
        status: '查詢連線池和監控狀態',
        'monitor-start': '啟動 Schema 自動監控（可選參數：checkInterval）',
        'monitor-stop': '停止 Schema 自動監控',
        'monitor-status': '查詢 Schema 監控狀態',
        'monitor-check': '手動檢查 Schema 變更',
      },
      timestamp: new Date().toISOString(),
    },
    '連線池狀態查詢成功'
  )
}

export const POST = withAdminAndError(handlePOST, {
  module: 'ConnectionPoolAdminAPI',
  enableAuditLog: true,
})
export const GET = withAdminAndError(handleGET, { module: 'ConnectionPoolAdminAPI' })
