import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { clearServiceClientCache, refreshServiceClient } from '@/lib/supabase-server'
import {
  clearAdminClientCache,
  refreshAdminClient,
  clearAllClientCaches,
} from '@/lib/supabase-auth'
import { refreshConnectionPoolSchema } from '@/lib/supabase/connection-factory'
import { apiLogger } from '@/lib/logger'

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const operation = body.operation || 'all'

  apiLogger.info('清除快取操作', {
    module: 'DebugClearCacheAPI',
    action: 'POST /api/debug/clear-cache',
    metadata: { operation },
  })

  const results: Record<string, any> = {}

  try {
    switch (operation) {
      case 'service':
        clearServiceClientCache()
        results.serviceClient = '已清除服務客戶端快取'
        break

      case 'admin':
        clearAdminClientCache()
        results.adminClient = '已清除管理員客戶端快取'
        break

      case 'pool':
        await refreshConnectionPoolSchema()
        results.connectionPool = '已重新整理連線池 schema'
        break

      case 'all':
      default:
        // 清除所有 Supabase 客戶端快取
        clearAllClientCaches()
        clearServiceClientCache()
        results.allClients = '已清除所有客戶端快取'

        // 重新整理連線池（如果啟用）
        try {
          await refreshConnectionPoolSchema()
          results.connectionPool = '已重新整理連線池 schema'
        } catch (poolError) {
          results.connectionPool = `連線池重新整理失敗: ${(poolError as Error).message}`
        }
        break
    }

    // 測試新的客戶端是否正常工作
    try {
      const testServiceClient = refreshServiceClient()
      const testAdminClient = refreshAdminClient()

      results.validation = {
        serviceClient: !!testServiceClient,
        adminClient: !!testAdminClient,
        timestamp: new Date().toISOString(),
      }

      apiLogger.info('快取清除操作成功', {
        module: 'DebugClearCacheAPI',
        action: 'POST /api/debug/clear-cache',
        metadata: { operation, results },
      })

      return success(
        {
          operation,
          results,
          message: '快取清除完成，準備測試門市新增功能',
          nextSteps: [
            '1. 測試門市新增功能（使用 11 位數電話號碼）',
            '2. 驗證圖片上傳功能',
            '3. 檢查所有功能是否正常',
          ],
        },
        '快取清除成功'
      )
    } catch (error) {
      results.validation = {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      }

      return success(
        {
          operation,
          results,
          warning: '快取已清除但客戶端驗證失敗',
        },
        '快取清除完成（有警告）'
      )
    }
  } catch (error) {
    apiLogger.error('快取清除操作失敗', error as Error, {
      module: 'DebugClearCacheAPI',
      action: 'POST /api/debug/clear-cache',
      metadata: { operation },
    })

    throw error
  }
}

async function handleGET(): Promise<NextResponse> {
  return success(
    {
      availableOperations: ['all', 'service', 'admin', 'pool'],
      description: {
        all: '清除所有快取（推薦）',
        service: '清除服務客戶端快取',
        admin: '清除管理員客戶端快取',
        pool: '重新整理連線池 schema',
      },
      usage: 'POST { "operation": "all" }',
    },
    '快取清除 API 說明'
  )
}

export const POST = withErrorHandler(handlePOST, { module: 'DebugClearCacheAPI' })
export const GET = withErrorHandler(handleGET, { module: 'DebugClearCacheAPI' })
