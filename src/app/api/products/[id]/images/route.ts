import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ProductImageService } from '@/services/core/product/productImageService'

/**
 * @api {GET} /api/products/:id/images 取得產品圖片列表
 * @apiName GetProductImages
 * @apiGroup ProductImages
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得指定產品的所有圖片。
 * 此 API 為公開端點，無需認證即可訪問。
 * 圖片會依照 display_position 排序，position 0 為主要圖片。
 *
 * @apiPermission public
 *
 * @apiParam {String} id 產品 ID (UUID)
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 圖片資料
 * @apiSuccess {String} data.productId 產品 ID
 * @apiSuccess {Object[]} data.images 圖片列表
 * @apiSuccess {String} data.images.id 圖片 ID
 * @apiSuccess {String} data.images.url 圖片 URL
 * @apiSuccess {Number} data.images.display_position 顯示順序
 * @apiSuccess {Number} data.count 圖片總數
 * @apiSuccess {Object} data.primaryImage 主要圖片（position 0）
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "productId": "550e8400-e29b-41d4-a716-446655440000",
 *     "images": [
 *       {
 *         "id": "img-001",
 *         "url": "https://example.com/image1.jpg",
 *         "display_position": 0
 *       }
 *     ],
 *     "count": 1,
 *     "primaryImage": {
 *       "id": "img-001",
 *       "url": "https://example.com/image1.jpg",
 *       "display_position": 0
 *     }
 *   },
 *   "message": "圖片列表獲取成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 產品 ID 驗證失敗
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "產品 ID 不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handleGET(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
  if (!context || !context.params) {
    throw new ValidationError('缺少路由參數')
  }

  const { id: productId } = await context.params

  // 驗證產品 ID
  if (!productId || productId.trim() === '') {
    throw new ValidationError('產品 ID 不能為空')
  }

  try {
    apiLogger.debug('獲取產品圖片列表', { metadata: { productId } })

    // 獲取產品圖片（從 images 表）
    const images = await ProductImageService.getProductImages(productId)

    apiLogger.info('產品圖片列表獲取成功', {
      metadata: {
        productId,
        imageCount: images.length,
        hasPrimaryImage: images.some(img => img.display_position === 0),
      },
    })

    return success(
      {
        productId,
        images,
        count: images.length,
        primaryImage: images.find(img => img.display_position === 0) || null,
      },
      '圖片列表獲取成功'
    )
  } catch (error) {
    apiLogger.error(
      '獲取產品圖片列表失敗',
      error instanceof Error ? error : new Error(String(error)),
      { metadata: { productId } }
    )
    throw error
  }
}

// 整合錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'ProductImagesAPI',
  enableAuditLog: false,
})

// POST 和 DELETE 已移除，請使用統一圖片上傳 API：
// POST /api/upload/unified
// DELETE /api/upload/unified (透過 body 傳遞 imageId)
