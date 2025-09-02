import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/productImageService'
import { z } from 'zod'

// 圖片排序請求 schema
const ReorderImagesSchema = z.object({
  imageOrders: z.array(z.object({
    id: z.string().uuid('無效的圖片 ID'),
    position: z.number().int().min(0, '位置必須大於等於 0')
  })).min(1, '至少需要一個圖片排序')
})

async function handlePOST(request: NextRequest, params?: unknown) {
  const context = params as { params: Promise<{ id: string }> } | undefined
  const { id: productId } = await (context?.params || Promise.resolve({ id: '' }))
  
  // 驗證產品 ID
  if (!productId) {
    throw new ValidationError('產品 ID 不能為空')
  }

  const body = await request.json()
  const result = ReorderImagesSchema.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`排序參數驗證失敗: ${errorMessage}`)
  }

  const { imageOrders } = result.data

  apiLogger.info('開始更新產品圖片排序', { 
    metadata: { productId, ordersCount: imageOrders.length } 
  })

  // 驗證所有圖片都屬於該產品
  const existingImages = await ProductImageService.getProductImages(productId)
  const existingImageIds = existingImages.map(img => img.id)
  
  const invalidImageIds = imageOrders.filter(order => !existingImageIds.includes(order.id))
  if (invalidImageIds.length > 0) {
    throw new ValidationError(`以下圖片不屬於該產品: ${invalidImageIds.map(o => o.id).join(', ')}`)
  }

  // 驗證位置不重複
  const positions = imageOrders.map(order => order.position)
  const uniquePositions = [...new Set(positions)]
  if (positions.length !== uniquePositions.length) {
    throw new ValidationError('圖片位置不能重複')
  }

  // 驗證位置連續（從 0 開始）
  const sortedPositions = [...uniquePositions].sort((a, b) => a - b)
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i) {
      throw new ValidationError('圖片位置必須從 0 開始且連續')
    }
  }

  try {
    // 更新圖片排序
    await ProductImageService.updateImagesOrder(productId, imageOrders)

    // 獲取更新後的圖片列表
    const updatedImages = await ProductImageService.getProductImages(productId)

    apiLogger.info('產品圖片排序更新成功', {
      metadata: { 
        productId, 
        updatedCount: imageOrders.length,
        newOrder: updatedImages.map(img => ({ id: img.id, position: img.position }))
      }
    })

    return success(
      {
        message: '圖片排序更新成功',
        images: updatedImages
      },
      '圖片排序更新成功'
    )

  } catch (error) {
    apiLogger.error('更新產品圖片排序失敗', 
      error instanceof Error ? error : new Error(String(error)), 
      { metadata: { productId } }
    )
    throw error
  }
}

// 整合錯誤處理中間件
export const POST = withErrorHandler(handlePOST, {
  module: 'ProductImageReorderAPI',
  enableAuditLog: true,
})