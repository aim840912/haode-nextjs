/**
 * @api {GET} /api/products/categories 取得產品分類列表
 * @apiName GetProductCategories
 * @apiGroup ProductCategories
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有產品分類列表（公開 API）。
 * 系統會合併實際使用的分類與預設分類，並自動去重和排序。
 * 如果資料庫中沒有任何產品，則返回預設分類列表。
 *
 * @apiPermission public
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {String[]} data 產品分類列表（已排序）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（有現有分類）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     "季節水果",
 *     "有機蔬菜",
 *     "農特產品"
 *   ],
 *   "message": "成功取得產品分類"
 * }
 *
 * @apiSuccessExample {json} 成功回應（使用預設分類）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     "季節水果",
 *     "有機蔬菜"
 *   ],
 *   "message": "成功取得產品分類（使用預設分類）"
 * }
 *
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "success": false,
 *   "error": "資料庫查詢失敗",
 *   "code": "DATABASE_ERROR"
 * }
 */

import { getDefaultCategories } from '@/constants/productCategories'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { adminProductService } from '@/services/core/product/productService'

async function handleGET() {
  const products = await adminProductService.getProducts()

  // 提取所有唯一的分類
  const existingCategories = [...new Set(products.map(product => product.category))]
    .filter(category => category && category.trim() !== '')
    .sort()

  // 如果沒有現有分類，返回預設分類
  if (existingCategories.length === 0) {
    const defaultCategories = getDefaultCategories()
    return success(defaultCategories, '成功取得產品分類（使用預設分類）')
  }

  // 合併現有分類和預設分類，去重並排序
  const defaultCategories = getDefaultCategories()
  const allCategories = [...new Set([...existingCategories, ...defaultCategories])].sort()

  return success(allCategories, '成功取得產品分類')
}

export const GET = withErrorHandler(handleGET, {
  module: 'ProductCategories',
  enableAuditLog: false,
})
