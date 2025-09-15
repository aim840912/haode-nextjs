import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import {
  refreshConnectionPoolSchema,
  resetAllConnections,
  getSchemaVersion,
  shouldUseConnectionPool,
  getPoolStats,
} from '@/lib/supabase/connection-factory'
import {
  schemaMonitor,
  startSchemaMonitoring,
  stopSchemaMonitoring,
  checkSchemaChanges,
} from '@/lib/schema-monitor'
import { apiLogger } from '@/lib/logger'

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

async function handlePOST(req: NextRequest, user: any): Promise<NextResponse> {
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

async function handleGET(): Promise<NextResponse> {
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

export const POST = requireAdmin(handlePOST)
export const GET = requireAdmin(handleGET)
