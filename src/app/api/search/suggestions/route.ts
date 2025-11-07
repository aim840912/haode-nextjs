/**
 * @api {GET} /api/search/suggestions 取得搜尋建議
 * @apiName GetSearchSuggestions
 * @apiGroup Search
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得即時搜尋建議（公開 API）。
 * 用於搜尋框的自動完成功能。
 * 根據使用者輸入的部分關鍵字，提供相關的搜尋建議。
 * 最少需要 2 個字元才能觸發建議。
 *
 * @apiPermission public
 *
 * @apiQuery {String} q 搜尋關鍵字（必填，至少 2 個字元）
 * @apiQuery {Number} [limit=5] 返回的建議數量（1-20）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建議資料
 * @apiSuccess {String[]} data.suggestions 搜尋建議列表
 * @apiSuccess {String} data.query 查詢關鍵字
 * @apiSuccess {Number} data.count 建議數量
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": [
 *       "有機草莓",
 *       "有機蔬菜",
 *       "有機水果",
 *       "有機農產品"
 *     ],
 *     "query": "有機",
 *     "count": 4
 *   },
 *   "message": "取得搜尋建議成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（無建議）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": [],
 *     "query": "xyz",
 *     "count": 0
 *   },
 *   "message": "取得搜尋建議成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 *
 * @apiErrorExample {json} 關鍵字為空:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "搜尋關鍵字不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 關鍵字太短:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "搜尋關鍵字至少需要 2 個字元",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 建議數量範圍錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "建議數量必須在 1-20 之間",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { fullTextSearchService } from '@/lib/full-text-search'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '5')

  // 驗證參數
  if (!query) {
    throw new ValidationError('搜尋關鍵字不能為空')
  }

  if (query.length < 2) {
    throw new ValidationError('搜尋關鍵字至少需要 2 個字元')
  }

  if (limit < 1 || limit > 20) {
    throw new ValidationError('建議數量必須在 1-20 之間')
  }

  apiLogger.info('搜尋建議請求', {
    module: 'SearchSuggestionsAPI',
    metadata: { query: query.substring(0, 20), limit },
  })

  // 獲取搜尋建議
  const suggestions = await fullTextSearchService.getSearchSuggestions(query, 'products', limit)

  return success(
    {
      suggestions,
      query,
      count: suggestions.length,
    },
    '取得搜尋建議成功'
  )
}

export const GET = withErrorHandler(handleGET, {
  module: 'SearchSuggestionsAPI',
})
