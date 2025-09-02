import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/productImageService'

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
        hasPrimaryImage: images.some(img => img.position === 0)
      }
    })

    return success(
      {
        productId,
        images,
        count: images.length,
        primaryImage: images.find(img => img.position === 0) || null
      },
      '圖片列表獲取成功'
    )

  } catch (error) {
    apiLogger.error('獲取產品圖片列表失敗', 
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
        clearedCount: existingImages.length
      }
    })

    return success(
      {
        productId,
        clearedCount: existingImages.length,
        message: '產品圖片已全部清除'
      },
      '產品圖片清除成功'
    )

  } catch (error) {
    apiLogger.error('清除產品圖片失敗', 
      error instanceof Error ? error : new Error(String(error)), 
      { metadata: { productId } }
    )
    throw error
  }
}

// 整合錯誤處理中間件
export const GET = withErrorHandler(handleGET, {
  module: 'ProductImagesAPI',
  enableAuditLog: false, // GET 請求通常不需要審計日誌
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'ProductImagesAPI', 
  enableAuditLog: true, // 刪除操作需要審計日誌
})