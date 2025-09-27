import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { requireAdmin } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/core/product/productImageService'

async function handleGET(request: NextRequest, params?: unknown) {
  const context = params as { params: Promise<{ id: string }> } | undefined
  const { id: productId } = await (context?.params || Promise.resolve({ id: '' }))

  // 驗證產品 ID
  if (!productId) {
    throw new ValidationError('產品 ID 不能為空')
  }

  try {
    apiLogger.debug('獲取產品圖片列表', { metadata: { productId } })

    // 獲取產品圖片
    const images = await ProductImageService.getProductImages(productId)

    apiLogger.info('產品圖片列表獲取成功', {
      metadata: {
        productId,
        imageCount: images.length,
        hasPrimaryImage: images.some(img => img.position === 0),
      },
    })

    return success(
      {
        productId,
        images,
        count: images.length,
        primaryImage: images.find(img => img.position === 0) || null,
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

async function handleDELETE(request: NextRequest, params?: unknown) {
  const context = params as { params: Promise<{ id: string }> } | undefined
  const { id: productId } = await (context?.params || Promise.resolve({ id: '' }))

  // 驗證產品 ID
  if (!productId) {
    throw new ValidationError('產品 ID 不能為空')
  }

  try {
    apiLogger.info('開始清除產品所有圖片', { metadata: { productId } })

    // 獲取現有圖片 (用於記錄)
    const existingImages = await ProductImageService.getProductImages(productId)

    // 清除產品的所有圖片
    await ProductImageService.clearProductImages(productId)

    apiLogger.info('產品圖片清除成功', {
      metadata: {
        productId,
        clearedCount: existingImages.length,
      },
    })

    return success(
      {
        productId,
        clearedCount: existingImages.length,
        message: '產品圖片已全部清除',
      },
      '產品圖片清除成功'
    )
  } catch (error) {
    apiLogger.error('清除產品圖片失敗', error instanceof Error ? error : new Error(String(error)), {
      metadata: { productId },
    })
    throw error
  }
}

async function handlePOST(request: NextRequest, params?: unknown) {
  const context = params as { params: Promise<{ id: string }> } | undefined
  const { id: productId } = await (context?.params || Promise.resolve({ id: '' }))

  if (!productId) {
    throw new ValidationError('產品 ID 不能為空')
  }

  try {
    const body = await request.json()

    if (!body.url || !body.path) {
      throw new ValidationError('url 和 path 為必填欄位')
    }

    apiLogger.info('開始上傳產品圖片', {
      metadata: { productId, url: body.url },
    })

    const image = await ProductImageService.createProductImage({
      product_id: productId,
      url: body.url,
      path: body.path,
      alt: body.alt,
      position: body.position,
      size: body.size,
      width: body.width,
      height: body.height,
      file_size: body.file_size,
    })

    apiLogger.info('產品圖片上傳成功', {
      metadata: {
        productId,
        imageId: image.id,
      },
    })

    return created(image, '圖片上傳成功')
  } catch (error) {
    apiLogger.error('上傳產品圖片失敗', error instanceof Error ? error : new Error(String(error)), {
      metadata: { productId },
    })
    throw error
  }
}

// 整合錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'ProductImagesAPI',
  enableAuditLog: false,
})

// POST 和 DELETE 需要管理員權限
export const POST = requireAdmin(async (req, context) => {
  return await handlePOST(req, context)
})

export const DELETE = requireAdmin(async (req, context) => {
  return await handleDELETE(req, context)
})
