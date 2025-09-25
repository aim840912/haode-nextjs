import { NextRequest } from 'next/server'
import { productService } from '@/services/core/product/productService'
import { AdminProductSchemas, CommonValidations } from '@/lib/validation-schemas'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { apiLogger } from '@/lib/logger'

/**
 * GET /api/products/[id] - 取得單一產品
 */
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
 * PUT /api/products/[id] - 更新產品
 */
async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  apiLogger.info('更新產品', {
    metadata: {
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
 * DELETE /api/products/[id] - 刪除產品
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 驗證 UUID 格式
  const result = CommonValidations.uuidParam.safeParse({ id })
  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new ValidationError(`參數驗證失敗: ${errors}`)
  }

  apiLogger.info('開始刪除產品', {
    metadata: { productId: id },
  })

  // 使用完整的圖片清理服務
  let cleanupResult
  try {
    const { productImageCleanupService } = await import(
      '@/services/infrastructure/product-image-cleanup-service'
    )
    cleanupResult = await productImageCleanupService.cleanupProductImages(id)

    apiLogger.info('產品圖片清理完成', {
      metadata: {
        productId: id,
        totalImages: cleanupResult.totalImages,
        deletedFromStorage: cleanupResult.deletedFromStorage,
        deletedFromDatabase: cleanupResult.deletedFromDatabase,
        errorCount: cleanupResult.errors.length,
        legacyImagesCount: cleanupResult.details.legacyImages.length,
        unifiedImagesCount: cleanupResult.details.unifiedImages.length,
      },
    })

    // 如果有清理錯誤，記錄警告但不阻塞刪除
    if (cleanupResult.errors.length > 0) {
      apiLogger.warn('圖片清理過程中發生部分錯誤', {
        metadata: {
          productId: id,
          errors: cleanupResult.errors,
          failedPaths: cleanupResult.details.failedPaths,
        },
      })
    }
  } catch (imageError) {
    apiLogger.warn('產品圖片清理失敗，但繼續刪除產品', {
      metadata: {
        productId: id,
        error: (imageError as Error).message,
        errorType: (imageError as Error).constructor.name,
      },
    })
    // 即使圖片清理完全失敗，也繼續刪除產品（避免阻塞）
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
    ...(cleanupResult && {
      imageCleanup: {
        totalImages: cleanupResult.totalImages,
        deletedFromStorage: cleanupResult.deletedFromStorage,
        deletedFromDatabase: cleanupResult.deletedFromDatabase,
        hasErrors: cleanupResult.errors.length > 0,
      },
    }),
  }

  // 生成回應訊息
  let message = '產品刪除成功'
  if (cleanupResult && cleanupResult.totalImages > 0) {
    const totalDeleted = cleanupResult.deletedFromStorage + cleanupResult.deletedFromDatabase
    message += `，已清理 ${totalDeleted} 張圖片`

    if (cleanupResult.errors.length > 0) {
      message += ` (${cleanupResult.errors.length} 個清理錯誤)`
    }
  }

  apiLogger.info('產品刪除完成', {
    metadata: {
      productId: id,
      ...(cleanupResult && {
        totalImages: cleanupResult.totalImages,
        cleanupErrors: cleanupResult.errors.length,
      }),
    },
  })

  return success(responseData, message)
}

// 導出處理器
export const GET = withErrorHandler(handleGET, {
  module: 'ProductAPI',
  enableAuditLog: false,
})

export const PUT = withErrorHandler(handlePUT, {
  module: 'ProductAPI',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'ProductAPI',
  enableAuditLog: true,
})
