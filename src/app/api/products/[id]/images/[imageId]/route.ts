import { NextRequest } from 'next/server'
import { requireAdmin, User } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/core/product/productImageService'

async function handleDELETE(
  request: NextRequest,
  user: User & { isAdmin: true },
  context?: unknown
) {
  const params = (context as { params: Promise<{ id: string; imageId: string }> }).params
  const { id: productId, imageId } = await params

  if (!productId || !imageId) {
    throw new ValidationError('產品 ID 和圖片 ID 不能為空')
  }

  try {
    apiLogger.info('開始刪除產品圖片', {
      metadata: { productId, imageId },
    })

    await ProductImageService.deleteProductImage(imageId)

    apiLogger.info('產品圖片刪除成功', {
      metadata: { productId, imageId },
    })

    return success(
      {
        productId,
        imageId,
        message: '圖片刪除成功',
      },
      '圖片刪除成功'
    )
  } catch (error) {
    apiLogger.error('刪除產品圖片失敗', error instanceof Error ? error : new Error(String(error)), {
      metadata: { productId, imageId },
    })
    throw error
  }
}

export const DELETE = requireAdmin(handleDELETE)
