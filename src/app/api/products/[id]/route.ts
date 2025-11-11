/**
 * @api {GET} /api/products/:id 取得單一產品詳情
 * @apiName GetProductById
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得指定 ID 的產品詳細資訊（公開 API）。
 * 成功查詢後會自動記錄產品瀏覽指標。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 產品 ID（UUID 格式）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 產品詳細資料
 * @apiSuccess {String} data.id 產品 ID
 * @apiSuccess {String} data.name 產品名稱
 * @apiSuccess {String} data.description 產品描述
 * @apiSuccess {Number} data.price 產品價格
 * @apiSuccess {String} data.priceUnit 價格單位
 * @apiSuccess {Number} data.unitQuantity 單位數量
 * @apiSuccess {String} data.category 產品分類
 * @apiSuccess {Object[]} data.productImages 產品圖片列表
 * @apiSuccess {Number} data.inventory 庫存數量
 * @apiSuccess {Boolean} data.isActive 是否啟用
 * @apiSuccess {String} data.createdAt 建立時間
 * @apiSuccess {String} data.updatedAt 更新時間
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "name": "有機草莓",
 *     "description": "新鮮有機草莓",
 *     "price": 300,
 *     "priceUnit": "斤",
 *     "unitQuantity": 1,
 *     "category": "季節水果",
 *     "productImages": [],
 *     "inventory": 100,
 *     "isActive": true,
 *     "createdAt": "2025-01-07T00:00:00Z",
 *     "updatedAt": "2025-01-07T00:00:00Z"
 *   },
 *   "message": "查詢成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 產品 ID 格式不正確
 * @apiError (錯誤 4xx) {Object} NotFoundError 產品不存在
 *
 * @apiErrorExample {json} ID 格式錯誤:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "參數驗證失敗: id: 必須是有效的 UUID",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 產品不存在:
 * HTTP/1.1 404 Not Found
 * {
 *   "success": false,
 *   "error": "產品不存在",
 *   "code": "NOT_FOUND"
 * }
 */

/**
 * @api {PUT} /api/products/:id 更新產品
 * @apiName UpdateProduct
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新指定 ID 的產品資訊（需要管理員權限）。
 * 成功更新後會自動清除產品快取。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 產品 ID（URL 參數，UUID 格式）
 *
 * @apiBody {String} [name] 產品名稱
 * @apiBody {String} [description] 產品描述
 * @apiBody {Number} [price] 產品價格
 * @apiBody {String} [priceUnit] 價格單位
 * @apiBody {Number} [unitQuantity] 單位數量
 * @apiBody {String} [category] 產品分類
 * @apiBody {Number} [inventory] 庫存數量
 * @apiBody {Boolean} [isActive] 是否啟用
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新後的產品資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "name": "有機草莓（更新）",
 *     "price": 350
 *   },
 *   "message": "產品更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 產品不存在
 *
 * @apiErrorExample {json} 權限錯誤:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "需要管理員權限",
 *   "code": "FORBIDDEN"
 * }
 */

/**
 * @api {DELETE} /api/products/:id 刪除產品
 * @apiName DeleteProduct
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定 ID 的產品（需要管理員權限）。
 * 會同時刪除產品的所有圖片（資料庫記錄和 Storage 檔案）。
 * 成功刪除後會自動清除產品快取。
 *
 * @apiPermission admin
 *
 * @apiParam {String} id 產品 ID（UUID 格式）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.id 被刪除的產品 ID
 * @apiSuccess {Number} data.deletedImages 刪除的圖片數量
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "deletedImages": 3
 *   },
 *   "message": "產品刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 產品 ID 格式不正確
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 * @apiError (錯誤 4xx) {Object} NotFoundError 產品不存在
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
import { success } from '@/lib/api-response'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { requireAdmin, User } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { AdminProductSchemas, CommonValidations } from '@/lib/validation'
import { productService } from '@/services/core/product/productService'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('查詢單一產品', {
    metadata: { productId: id },
  })

  const product = await productService.getProductById(id)
  if (!product) {
    throw new NotFoundError('產品不存在')
  }

  // 記錄產品瀏覽指標
  const { recordProductView } = await import('@/lib/metrics')
  recordProductView(id)

  return success(product, '查詢成功')
}

/**
 * PUT /api/products/[id] - 更新產品（需要管理員權限）
 */
async function handlePUT(request: NextRequest, user: User & { isAdmin: true }, context?: unknown) {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  // 驗證 UUID 格式
  const paramResult = CommonValidations.uuidParam.safeParse({ id })
  if (!paramResult.success) {
    const errors = paramResult.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  // 解析並驗證請求資料
  const body = await request.json()
  const result = AdminProductSchemas.update.safeParse(body)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  apiLogger.info('管理員更新產品', {
    metadata: {
      userId: user.id,
      email: user.email,
      productId: id,
      changes: Object.keys(result.data),
    },
  })

  const product = await productService.updateProduct(id, result.data)

  // 手動清除產品相關的快取
  try {
    const { CacheManager } = await import('@/lib/cache/cache-server')
    await CacheManager.deletePattern('products:*')
  } catch (cacheError) {
    apiLogger.warn('清除快取失敗', {
      metadata: { errorMessage: (cacheError as Error).message },
    })
  }

  return success(product, '產品更新成功')
}

/**
 * DELETE /api/products/[id] - 刪除產品（需要管理員權限）
 */
async function handleDELETE(
  request: NextRequest,
  user: User & { isAdmin: true },
  context?: unknown
) {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('管理員開始刪除產品', {
    metadata: {
      userId: user.id,
      email: user.email,
      productId: id,
    },
  })

  // 清理產品圖片（資料庫記錄 + Storage 檔案）
  try {
    const deletedCount = await unifiedImageService.deleteEntityImages('products', id)
    apiLogger.info('產品圖片清理完成', {
      metadata: { productId: id, deletedCount },
    })
  } catch (imageError) {
    apiLogger.warn('產品圖片清理失敗，但繼續刪除產品', {
      metadata: {
        productId: id,
        error: (imageError as Error).message,
      },
    })
  }

  // 刪除產品記錄
  await productService.deleteProduct(id)

  // 手動清除產品相關的快取
  try {
    const { CacheManager } = await import('@/lib/cache/cache-server')
    await CacheManager.deletePattern('products:*')
  } catch (cacheError) {
    apiLogger.warn('清除快取失敗', {
      metadata: { errorMessage: (cacheError as Error).message },
    })
  }

  // 準備回應資料
  const responseData = {
    id,
    message: '產品刪除成功',
  }

  apiLogger.info('產品刪除完成', {
    metadata: { productId: id },
  })

  return success(responseData, '產品刪除成功')
}

// 導出處理器
// GET 保持公開（任何人都可以查看產品）
export const GET = withErrorHandler(handleGET, {
  module: 'ProductAPI',
  enableAuditLog: false,
})

// PUT 和 DELETE 需要管理員權限
const handlePUTWithAuth = requireAdmin(handlePUT)
export const PUT = withErrorHandler(handlePUTWithAuth, {
  module: 'ProductAPI',
  enableAuditLog: true,
})

const handleDELETEWithAuth = requireAdmin(handleDELETE)
export const DELETE = withErrorHandler(handleDELETEWithAuth, {
  module: 'ProductAPI',
  enableAuditLog: true,
})
