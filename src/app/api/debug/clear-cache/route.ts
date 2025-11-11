/**
 * @api {post} /api/debug/clear-cache 清除快取（除錯用）
 * @apiName ClearCache
 * @apiGroup Debug
 * @apiPermission public
 *
 * @apiDescription 清除 Supabase 客戶端快取和連線池。支援清除特定類型或全部快取
 *
 * @apiBody {String} [operation=all] 操作類型 (all/service/admin/pool)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 清除結果
 * @apiSuccess {String} data.operation 執行的操作
 * @apiSuccess {Object} data.results 各項清除結果
 * @apiSuccess {String} data.results.allClients 所有客戶端清除狀態
 * @apiSuccess {String} data.results.connectionPool 連線池重新整理狀態
 * @apiSuccess {Object} data.results.validation 驗證結果
 * @apiSuccess {Boolean} data.results.validation.serviceClient 服務客戶端是否正常
 * @apiSuccess {Boolean} data.results.validation.adminClient 管理員客戶端是否正常
 * @apiSuccess {String[]} data.nextSteps 後續步驟建議
 *
 * @apiSuccessExample {json} 清除全部成功:
 * {
 *   "success": true,
 *   "message": "快取清除成功",
 *   "data": {
 *     "operation": "all",
 *     "results": {
 *       "allClients": "已清除所有客戶端快取",
 *       "connectionPool": "已重新整理連線池 schema",
 *       "validation": {
 *         "serviceClient": true,
 *         "adminClient": true,
 *         "timestamp": "2025-01-07T10:30:00.000Z"
 *       }
 *     },
 *     "message": "快取清除完成，準備測試門市新增功能",
 *     "nextSteps": [
 *       "1. 測試門市新增功能（使用 11 位數電話號碼）",
 *       "2. 驗證圖片上傳功能",
 *       "3. 檢查所有功能是否正常"
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} 清除服務快取:
 * {
 *   "success": true,
 *   "message": "快取清除成功",
 *   "data": {
 *     "operation": "service",
 *     "results": {
 *       "serviceClient": "已清除服務客戶端快取"
 *     }
 *   }
 * }
 *
 * @apiError (500) InternalServerError 清除快取失敗
 *
 * @apiErrorExample {json} 清除失敗:
 * {
 *   "success": false,
 *   "message": "快取清除失敗",
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "details": "連線池重新整理失敗"
 *   }
 * }
 */

/**
 * @api {get} /api/debug/clear-cache 取得清除快取說明
 * @apiName GetClearCacheInfo
 * @apiGroup Debug
 * @apiPermission public
 *
 * @apiDescription 取得清除快取 API 的說明和可用操作
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 說明資料
 * @apiSuccess {String[]} data.availableOperations 可用的操作類型
 * @apiSuccess {Object} data.description 操作說明
 * @apiSuccess {String} data.description.all 清除所有快取說明
 * @apiSuccess {String} data.description.service 清除服務客戶端快取說明
 * @apiSuccess {String} data.description.admin 清除管理員客戶端快取說明
 * @apiSuccess {String} data.description.pool 重新整理連線池說明
 * @apiSuccess {String} data.usage 使用範例
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "快取清除 API 說明",
 *   "data": {
 *     "availableOperations": ["all", "service", "admin", "pool"],
 *     "description": {
 *       "all": "清除所有快取（推薦）",
 *       "service": "清除服務客戶端快取",
 *       "admin": "清除管理員客戶端快取",
 *       "pool": "重新整理連線池 schema"
 *     },
 *     "usage": "POST { \"operation\": \"all\" }"
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import {
  clearAdminClientCache,
  refreshAdminClient,
  clearAllClientCaches,
} from '@/lib/database/supabase-auth'
import { clearServiceClientCache, refreshServiceClient } from '@/lib/database/supabase-server'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { refreshConnectionPoolSchema } from '@/lib/supabase/connection-factory'

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
