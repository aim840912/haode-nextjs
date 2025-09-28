import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { requireAdmin } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/core/product/productImageService'

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

async function handleDELETE(request: NextRequest, _user: unknown, routeContext?: unknown) {
  const context = routeContext as { params: Promise<{ id: string }> } | undefined

  if (!context || !context.params) {
    throw new ValidationError('缺少路由參數')
  }

  const { id: productId } = await context.params

  // 驗證產品 ID
  if (!productId || productId.trim() === '') {
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

async function handlePOST(request: NextRequest, _user: unknown, routeContext?: unknown) {
  const context = routeContext as { params: Promise<{ id: string }> } | undefined

  if (!context || !context.params) {
    throw new ValidationError('缺少路由參數')
  }

  const { id: productId } = await context.params

  if (!productId || productId.trim() === '') {
    throw new ValidationError('產品 ID 不能為空')
  }

  try {
    const body = await request.json()

    // 檢查是批量上傳還是單張上傳
    if (Array.isArray(body)) {
      // 批量上傳多張圖片
      if (body.length === 0) {
        throw new ValidationError('圖片列表不能為空')
      }

      // 驗證每張圖片的必填欄位
      for (const [index, img] of body.entries()) {
        if (!img.url || !img.path) {
          throw new ValidationError(`第 ${index + 1} 張圖片缺少 url 或 path 欄位`)
        }
      }

      apiLogger.info('開始批量上傳產品圖片', {
        metadata: { productId, imageCount: body.length },
      })

      // 準備圖片資料
      const imagesData = body.map((img, index) => ({
        product_id: productId,
        url: img.url,
        path: img.path,
        alt: img.alt || `產品圖片 ${index + 1}`,
        position: img.position ?? index,
        size: img.size || 'medium',
        width: img.width,
        height: img.height,
        file_size: img.file_size,
      }))

      // 批量建立圖片
      const images = await ProductImageService.createProductImages(imagesData)

      apiLogger.info('產品圖片批量上傳成功', {
        metadata: {
          productId,
          uploadedCount: images.length,
          imageIds: images.map(img => img.id),
        },
      })

      return created(
        {
          productId,
          images,
          count: images.length,
          message: `成功上傳 ${images.length} 張圖片`,
        },
        '批量圖片上傳成功'
      )
    } else {
      // 單張圖片上傳（保持向後相容）
      if (!body.url || !body.path) {
        throw new ValidationError('url 和 path 為必填欄位')
      }

      apiLogger.info('開始上傳單張產品圖片', {
        metadata: { productId, url: body.url },
      })

      const image = await ProductImageService.createProductImage({
        product_id: productId,
        url: body.url,
        path: body.path,
        alt: body.alt || '產品圖片',
        position: body.position,
        size: body.size || 'medium',
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
    }
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
export const POST = requireAdmin(async (req, user, context) => {
  return await handlePOST(req, user, context)
})

export const DELETE = requireAdmin(async (req, user, context) => {
  return await handleDELETE(req, user, context)
})
