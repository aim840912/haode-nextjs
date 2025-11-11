/**
 * @api {GET} /api/search/stats 取得搜尋統計
 * @apiName GetSearchStats
 * @apiGroup Search
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得搜尋統計數據（公開 API）。
 * 提供熱門搜尋關鍵字、搜尋次數、平均執行時間等統計資訊。
 * 支援自訂統計時間範圍和結果數量。
 * 如果資料庫 RPC 函數不可用，會返回模擬數據以確保服務可用性。
 *
 * @apiPermission public
 *
 * @apiQuery {Number} [days=7] 統計過去幾天的數據（1-365）
 * @apiQuery {Number} [limit=10] 返回的熱門搜尋數量（1-50）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 統計資料
 * @apiSuccess {Object[]} data.popularSearches 熱門搜尋列表
 * @apiSuccess {String} data.popularSearches.query 搜尋關鍵字
 * @apiSuccess {Number} data.popularSearches.count 搜尋次數
 * @apiSuccess {Number} data.popularSearches.avgExecutionTime 平均執行時間（毫秒）
 * @apiSuccess {Number} data.popularSearches.avgResultCount 平均結果數量
 * @apiSuccess {Object} data.period 統計時間範圍
 * @apiSuccess {Number} data.period.daysBack 統計天數
 * @apiSuccess {String} data.period.startDate 開始日期
 * @apiSuccess {String} data.period.endDate 結束日期
 * @apiSuccess {Object} data.summary 統計摘要
 * @apiSuccess {Number} data.summary.totalSearches 總搜尋次數
 * @apiSuccess {Number} data.summary.uniqueQueries 唯一查詢數
 * @apiSuccess {Number} data.summary.averageExecutionTime 平均執行時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（真實數據）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "popularSearches": [
 *       {
 *         "query": "有機蔬菜",
 *         "count": 45,
 *         "avgExecutionTime": 28,
 *         "avgResultCount": 12
 *       },
 *       {
 *         "query": "高山茶葉",
 *         "count": 32,
 *         "avgExecutionTime": 22,
 *         "avgResultCount": 8
 *       }
 *     ],
 *     "period": {
 *       "daysBack": 7,
 *       "startDate": "2025-01-01T00:00:00Z",
 *       "endDate": "2025-01-07T00:00:00Z"
 *     },
 *     "summary": {
 *       "totalSearches": 147,
 *       "uniqueQueries": 38,
 *       "averageExecutionTime": 28.5
 *     }
 *   },
 *   "message": "取得搜尋統計成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（模擬數據）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "popularSearches": [...],
 *     "period": {...},
 *     "summary": {...}
 *   },
 *   "message": "取得搜尋統計成功（模擬數據）"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 *
 * @apiErrorExample {json} 天數範圍錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "天數必須在 1-365 之間",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 結果數量錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "結果數量必須在 1-50 之間",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const daysBack = parseInt(searchParams.get('days') || '7')
  const limit = parseInt(searchParams.get('limit') || '10')

  // 驗證參數
  if (daysBack < 1 || daysBack > 365) {
    throw new ValidationError('天數必須在 1-365 之間')
  }

  if (limit < 1 || limit > 50) {
    throw new ValidationError('結果數量必須在 1-50 之間')
  }

  apiLogger.info('搜尋統計請求', {
    module: 'SearchStatsAPI',
    metadata: { daysBack, limit },
  })

  const supabase = createServiceSupabaseClient()

  try {
    // 使用搜尋統計 RPC 函數
    // 為了避免 Supabase 類型檢查問題，使用類型斷言
    const { data: stats, error } = (await (
      supabase as unknown as {
        rpc: (
          name: string,
          params: Record<string, unknown>
        ) => Promise<{
          data: Array<{
            query: string
            count: number
            avgExecutionTime: number
            avgResultCount: number
          }> | null
          error: unknown
        }>
      }
    ).rpc('get_popular_searches', {
      days_back: daysBack,
      result_limit: limit,
    })) as {
      data: Array<{
        query?: string
        search_count?: number
        avg_execution_time?: number
        avg_result_count?: number
      }> | null
      error: unknown
    }

    if (error) {
      apiLogger.warn('搜尋統計 RPC 失敗，返回模擬數據', {
        module: 'SearchStatsAPI',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          daysBack,
          limit,
        },
      })

      // 如果 RPC 函數不可用，返回模擬數據
      return success(
        {
          popularSearches: [
            { query: '有機蔬菜', count: 45, avgExecutionTime: 28, avgResultCount: 12 },
            { query: '高山茶葉', count: 32, avgExecutionTime: 22, avgResultCount: 8 },
            { query: '季節水果', count: 28, avgExecutionTime: 35, avgResultCount: 15 },
            { query: '無農藥', count: 24, avgExecutionTime: 30, avgResultCount: 10 },
            { query: '手工製作', count: 18, avgExecutionTime: 25, avgResultCount: 7 },
          ].slice(0, limit),
          period: {
            daysBack,
            startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
          summary: {
            totalSearches: 147,
            uniqueQueries: 38,
            averageExecutionTime: 28.5,
          },
        },
        '取得搜尋統計成功（模擬數據）'
      )
    }

    return success(
      {
        popularSearches: stats || [],
        period: {
          daysBack,
          startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          totalSearches:
            stats?.reduce((sum: number, item) => sum + (item.search_count || 0), 0) || 0,
          uniqueQueries: stats?.length || 0,
          averageExecutionTime:
            (stats?.reduce((sum: number, item) => sum + (item.avg_execution_time || 0), 0) || 0) /
            (stats?.length || 1),
        },
      },
      '取得搜尋統計成功'
    )
  } catch (error) {
    apiLogger.error('搜尋統計錯誤', error as Error, {
      module: 'SearchStatsAPI',
      metadata: { daysBack, limit },
    })

    // 發生錯誤時返回基本統計
    return success(
      {
        popularSearches: [],
        period: {
          daysBack,
          startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          totalSearches: 0,
          uniqueQueries: 0,
          averageExecutionTime: 0,
        },
      },
      '取得搜尋統計成功（無數據）'
    )
  }
}

export const GET = withErrorHandler(handleGET, {
  module: 'SearchStatsAPI',
})
