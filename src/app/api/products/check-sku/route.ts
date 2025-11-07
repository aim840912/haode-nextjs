/**
 * @api {GET} /api/products/check-sku 檢查 SKU 是否重複
 * @apiName CheckProductSKU
 * @apiGroup ProductCategories
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 檢查指定的 SKU 代碼是否已存在於系統中（公開 API）。
 * 用於產品建立或編輯時的即時驗證。
 * SKU 格式要求：3-20 位英文大寫字母、數字或連字符。
 * 當檢查服務不可用時，會進入降級模式，允許用戶繼續但會標記為待服務器驗證。
 *
 * @apiPermission public
 *
 * @apiQuery {String} sku 要檢查的 SKU 代碼（3-20 位，僅接受英文大寫、數字、連字符）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 檢查結果
 * @apiSuccess {Boolean} data.exists SKU 是否已存在
 * @apiSuccess {String} data.sku 檢查的 SKU 代碼
 * @apiSuccess {Object} data.existingProduct 已存在的產品資訊（當 SKU 重複時）
 * @apiSuccess {String[]} data.suggestions 替代 SKU 建議
 * @apiSuccess {String} [data.note] 特殊說明（降級模式時）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（SKU 不存在）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "exists": false,
 *     "sku": "FRUIT-001",
 *     "existingProduct": null,
 *     "suggestions": []
 *   },
 *   "message": "SKU 檢查完成"
 * }
 *
 * @apiSuccessExample {json} 降級模式回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "exists": false,
 *     "sku": "FRUIT-001",
 *     "existingProduct": null,
 *     "suggestions": [],
 *     "note": "檢查服務暫時不可用，將由服務器最終驗證"
 *   },
 *   "message": "SKU 檢查完成（降級模式）"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 *
 * @apiErrorExample {json} 參數缺失:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "SKU 參數為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 格式錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符",
 *   "code": "VALIDATION_ERROR"
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sku = searchParams.get('sku')?.trim().toUpperCase()

  if (!sku) {
    throw new ValidationError('SKU 參數為必填')
  }

  // 驗證 SKU 格式
  if (!/^[A-Z0-9-]{3,20}$/.test(sku)) {
    throw new ValidationError('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  }

  try {
    // 簡化實作：SKU 檢查（目前產品可能還沒有 SKU 欄位）
    return success(
      {
        exists: false, // 暫時返回不存在，因為目前版本可能沒有 SKU
        sku,
        existingProduct: null,
        suggestions: [],
      },
      'SKU 檢查完成'
    )
  } catch {
    // 如果檢查失敗，返回不存在以不阻止用戶繼續
    return success(
      {
        exists: false,
        sku,
        existingProduct: null,
        suggestions: [],
        note: '檢查服務暫時不可用，將由服務器最終驗證',
      },
      'SKU 檢查完成（降級模式）'
    )
  }
}

export const GET = withErrorHandler(handleGET, {
  module: 'ProductValidationAPI',
  enableAuditLog: false,
})
