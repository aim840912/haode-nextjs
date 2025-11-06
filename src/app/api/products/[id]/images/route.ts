import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ProductImageService } from '@/services/core/product/productImageService'

/**
 * GET /api/products/[id]/images
 * 查詢產品圖片列表（公開端點）
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
