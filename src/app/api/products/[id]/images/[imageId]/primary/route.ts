import { NextRequest } from 'next/server'
import { requireAdmin, User } from '@/lib/middleware/api-middleware'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/core/product/productImageService'

async function handlePATCH(
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
    apiLogger.info('開始設定產品主圖', {
      metadata: { productId, imageId },
    })

    await ProductImageService.setPrimaryImage(productId, imageId)

    apiLogger.info('產品主圖設定成功', {
      metadata: { productId, imageId },
    })

    return success(
      {
        productId,
        imageId,
        message: '主圖設定成功',
      },
      '主圖設定成功'
    )
  } catch (error) {
    apiLogger.error('設定產品主圖失敗', error instanceof Error ? error : new Error(String(error)), {
      metadata: { productId, imageId },
    })
    throw error
  }
}

export const PATCH = requireAdmin(handlePATCH)
