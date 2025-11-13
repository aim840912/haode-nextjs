/**
 * @api {GET} /api/products 取得產品列表
 * @apiName GetProducts
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有已啟用的產品列表（公開 API）。
 * 支援快取機制以提升效能，可選擇繞過快取獲取最新資料。
 * 管理員若需查看包含未啟用產品，請使用 /api/admin/products。
 *
 * @apiPermission public
 *
 * @apiQuery {Boolean} [nocache=false] 是否繞過快取，直接從資料庫查詢最新資料
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 產品列表
 * @apiSuccess {String} data.id 產品 ID
 * @apiSuccess {String} data.name 產品名稱
 * @apiSuccess {String} data.description 產品描述
 * @apiSuccess {Number} data.price 產品價格
 * @apiSuccess {String} data.priceUnit 價格單位（如：斤、公斤）
 * @apiSuccess {Number} data.unitQuantity 單位數量
 * @apiSuccess {String} data.category 產品分類
 * @apiSuccess {Object[]} data.productImages 產品圖片列表
 * @apiSuccess {Number} data.inventory 庫存數量
 * @apiSuccess {Boolean} data.isActive 是否啟用（公開 API 固定為 true）
 * @apiSuccess {String} data.createdAt 建立時間
 * @apiSuccess {String} data.updatedAt 更新時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "有機草莓",
 *       "description": "新鮮有機草莓",
 *       "price": 300,
 *       "priceUnit": "斤",
 *       "unitQuantity": 1,
 *       "category": "季節水果",
 *       "productImages": [],
 *       "inventory": 100,
 *       "isActive": true,
 *       "createdAt": "2025-01-07T00:00:00Z",
 *       "updatedAt": "2025-01-07T00:00:00Z"
 *     }
 *   ],
 *   "message": "產品清單取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "查詢參數驗證失敗: nocache: 必須是布林值",
 *   "code": "VALIDATION_ERROR"
 * }
 */

/**
 * @api {POST} /api/products 建立產品
 * @apiName CreateProduct
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新產品（需要管理員權限）。
 * 成功建立後會自動清除產品快取，並記錄業務指標。
 *
 * @apiPermission admin
 *
 * @apiBody {String} name 產品名稱（必填）
 * @apiBody {String} description 產品描述
 * @apiBody {Number} price 產品價格（必填）
 * @apiBody {String} [priceUnit=斤] 價格單位
 * @apiBody {Number} [unitQuantity=1] 單位數量
 * @apiBody {String} category 產品分類（必填）
 * @apiBody {String[]} [images] 產品圖片 URL 列表
 * @apiBody {Number} [inventory=0] 庫存數量
 * @apiBody {Boolean} [isActive=true] 是否啟用
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的產品資料
 * @apiSuccess {String} data.id 產品 ID
 * @apiSuccess {String} data.name 產品名稱
 * @apiSuccess {String} data.category 產品分類
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "name": "有機草莓",
 *     "category": "季節水果",
 *     "price": 300
 *   },
 *   "message": "產品建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 產品資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足，需要管理員權限
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫操作失敗
 *
 * @apiErrorExample {json} 驗證錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "產品建立資料驗證失敗: name: 產品名稱為必填",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 權限錯誤:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "需要管理員權限",
 *   "code": "FORBIDDEN"
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { withAdminAndError } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { PublicProductSchemas } from '@/lib/validation'
import { productService } from '@/services/core/product/productService'

async function handleGET(request: NextRequest) {
  // 驗證查詢參數
  const { searchParams } = new URL(request.url)

  // 將 URLSearchParams 轉換為物件
  const queryParams: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    queryParams[key] = value
  }

  const result = PublicProductSchemas.query.safeParse(queryParams)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`查詢參數驗證失敗: ${errorMessage}`)
  }

  // 安全修復：公開 API 只返回已啟用的產品
  // 管理員應使用 /api/admin/products 獲取所有產品
  const products = await productService.getProducts()

  const response = success(products, '產品清單取得成功')

  // 加入 no-cache 標頭確保資料是最新的
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

async function handlePOST(request: NextRequest) {
  // 驗證請求資料
  const body = await request.json()
  const result = PublicProductSchemas.create.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`產品建立資料驗證失敗: ${errorMessage}`)
  }

  const productData = {
    ...result.data,
    images: result.data.images || [], // 確保 images 不是 undefined
  }
  const product = await productService.addProduct(productData)

  // 記錄新產品建立指標
  const { recordBusinessAction } = await import('@/lib/metrics')
  recordBusinessAction('product_created', { productId: product.id, category: product.category })

  return created(product, '產品建立成功')
}

// 整合錯誤處理中間件
const handleGETWithError = withErrorHandler(handleGET, {
  module: 'PublicProductsAPI',
  enableAuditLog: false, // 公開 GET 請求通常不需要審計日誌
})

// 導出 API 處理器
export const GET = handleGETWithError
// POST 需要管理員權限 - 使用組合函數：權限檢查 + 錯誤處理
export const POST = withAdminAndError(handlePOST, {
  module: 'PublicProductsAPI',
  enableAuditLog: true,
})
