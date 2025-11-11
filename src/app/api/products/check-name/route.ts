/**
 * @api {GET} /api/products/check-name 檢查產品名稱是否重複
 * @apiName CheckProductName
 * @apiGroup ProductCategories
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 檢查指定的產品名稱是否已存在於系統中（公開 API）。
 * 用於產品建立或編輯時的即時驗證。
 * 如果名稱重複，會提供替代建議。
 * 當檢查服務不可用時，會進入降級模式，允許用戶繼續但會標記為待服務器驗證。
 *
 * @apiPermission public
 *
 * @apiQuery {String} name 要檢查的產品名稱（至少 2 個字元）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 檢查結果
 * @apiSuccess {Boolean} data.exists 名稱是否已存在
 * @apiSuccess {String} data.name 檢查的產品名稱
 * @apiSuccess {String[]} data.suggestions 替代名稱建議（當名稱重複時）
 * @apiSuccess {Object[]} data.similarProducts 相似產品列表
 * @apiSuccess {String} [data.note] 特殊說明（降級模式時）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（名稱不存在）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "exists": false,
 *     "name": "有機草莓",
 *     "suggestions": [],
 *     "similarProducts": []
 *   },
 *   "message": "產品名稱檢查完成"
 * }
 *
 * @apiSuccessExample {json} 成功回應（名稱已存在）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "exists": true,
 *     "name": "有機草莓",
 *     "suggestions": [
 *       "有機草莓 (特別版)",
 *       "有機草莓 (新款)",
 *       "有機草莓 V2"
 *     ],
 *     "similarProducts": []
 *   },
 *   "message": "產品名稱檢查完成"
 * }
 *
 * @apiSuccessExample {json} 降級模式回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "exists": false,
 *     "name": "有機草莓",
 *     "suggestions": [],
 *     "similarProducts": [],
 *     "note": "檢查服務暫時不可用，將由服務器最終驗證"
 *   },
 *   "message": "產品名稱檢查完成（降級模式）"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "產品名稱至少需要 2 個字元",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    throw new ValidationError('產品名稱參數為必填')
  }

  if (name.length < 2) {
    throw new ValidationError('產品名稱至少需要 2 個字元')
  }

  try {
    // 使用現有 API 搜尋產品（簡化實作）
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/products?search=${encodeURIComponent(name)}`,
      {
        method: 'GET',
      }
    )

    let exactMatch = false
    if (response.ok) {
      const data = await response.json()
      const products = data.data || []

      // 檢查是否有完全相同的名稱
      exactMatch = products.some(
        (product: { name: string }) =>
          product.name.toLowerCase().trim() === name.toLowerCase().trim()
      )
    }

    return success(
      {
        exists: exactMatch,
        name,
        suggestions: exactMatch ? [`${name} (特別版)`, `${name} (新款)`, `${name} V2`] : [],
        similarProducts: [],
      },
      '產品名稱檢查完成'
    )
  } catch {
    // 如果檢查失敗，返回不存在以不阻止用戶繼續
    return success(
      {
        exists: false,
        name,
        suggestions: [],
        similarProducts: [],
        note: '檢查服務暫時不可用，將由服務器最終驗證',
      },
      '產品名稱檢查完成（降級模式）'
    )
  }
}

// 使用 GET 方法以支援簡單查詢
export const GET = withErrorHandler(handleGET, {
  module: 'ProductValidationAPI',
  enableAuditLog: false, // 名稱檢查不需要審計日誌
})
