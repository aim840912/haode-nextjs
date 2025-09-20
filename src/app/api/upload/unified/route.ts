/**
 * 統一圖片上傳 API
 * 整合所有模組的圖片管理功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success, created } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { unifiedImageService } from '@/lib/unified-image-service'
import { getModuleConfig, isValidModule } from '@/config/image-modules.config'
import { z } from 'zod'

// 定義驗證 Schema
const UploadFormSchema = z.object({
  module: z.string().min(1, '模組名稱為必填'),
  entityId: z.string().min(1, '實體ID為必填'),
  size: z.string().optional().default('medium'),
  display_position: z.coerce.number().optional().default(0),
  generateMultipleSizes: z.coerce.boolean().optional().default(false),
  altText: z.string().optional(),
})

const QuerySchema = z.object({
  module: z.string().min(1, '模組名稱為必填'),
  entityId: z.string().min(1, '實體ID為必填'),
})

const DeleteSchema = z.object({
  imageId: z.string().min(1, '圖片ID為必填'),
})

const UpdateSchema = z.object({
  action: z.enum(['reorder', 'update']),
  module: z.string().min(1, '模組名稱為必填'),
  entityId: z.string().min(1, '實體ID為必填'),
  // reorder 操作的參數
  images: z
    .array(
      z.object({
        id: z.string(),
        display_position: z.number(),
      })
    )
    .optional(),
  // update 操作的參數
  imageId: z.string().optional(),
  data: z
    .object({
      altText: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
})

/**
 * POST - 上傳圖片
 */
async function handlePOST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證表單參數
  const formParams: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key !== 'file') {
      formParams[key] = value.toString()
    }
  }

  const result = UploadFormSchema.safeParse(formParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`上傳參數驗證失敗: ${errorMessage}`)
  }

  const { module, entityId, size, display_position, generateMultipleSizes, altText } = result.data

  // 驗證模組
  if (!isValidModule(module)) {
    throw new ValidationError(`不支援的圖片模組: ${module}`)
  }

  const config = getModuleConfig(module)

  apiLogger.info('開始圖片上傳', {
    module: 'UnifiedImageAPI',
    metadata: {
      module,
      entityId,
      fileName: file.name,
      fileSize: file.size,
      generateMultipleSizes,
    },
  })

  try {
    if (generateMultipleSizes && config.generateSizes.length > 1) {
      // 上傳多個尺寸
      const results = await unifiedImageService.uploadMultipleSizes(
        file,
        module,
        entityId,
        display_position
      )

      // 如果有 altText，更新第一個圖片的替代文字
      if (altText && results.length > 0) {
        await unifiedImageService.updateImageInfo(results[0].id, { alt_text: altText })
      }

      apiLogger.info('多尺寸圖片上傳完成', {
        module: 'UnifiedImageAPI',
        metadata: {
          module,
          entityId,
          uploadCount: results.length,
          sizes: results.map(r => r.size),
        },
      })

      return created(
        {
          multiple: true,
          images: results,
          uploadCount: results.length,
        },
        '多尺寸圖片上傳成功'
      )
    } else {
      // 單一尺寸上傳
      const result = await unifiedImageService.uploadImage(
        file,
        module,
        entityId,
        size,
        display_position
      )

      // 如果有 altText，更新圖片的替代文字
      if (altText) {
        await unifiedImageService.updateImageInfo(result.id, { alt_text: altText })
      }

      apiLogger.info('單一尺寸圖片上傳完成', {
        module: 'UnifiedImageAPI',
        metadata: {
          module,
          entityId,
          size,
          imageId: result.id,
          url: result.url,
        },
      })

      return created(
        {
          multiple: false,
          image: result,
        },
        '圖片上傳成功'
      )
    }
  } catch (error) {
    apiLogger.error('圖片上傳失敗', error as Error, {
      module: 'UnifiedImageAPI',
      metadata: { module, entityId, fileName: file.name },
    })
    throw error
  }
}

/**
 * GET - 查詢圖片列表
 */
async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const queryParams: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    queryParams[key] = value
  }

  const result = QuerySchema.safeParse(queryParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`查詢參數驗證失敗: ${errorMessage}`)
  }

  const { module, entityId } = result.data

  // 驗證模組
  if (!isValidModule(module)) {
    throw new ValidationError(`不支援的圖片模組: ${module}`)
  }

  apiLogger.debug('查詢圖片列表', {
    module: 'UnifiedImageAPI',
    metadata: { module, entityId },
  })

  try {
    const images = await unifiedImageService.getImages(module, entityId)

    apiLogger.info('圖片列表查詢完成', {
      module: 'UnifiedImageAPI',
      metadata: {
        module,
        entityId,
        imageCount: images.length,
      },
    })

    return success(
      {
        images,
        count: images.length,
        module,
        entityId,
      },
      '圖片列表取得成功'
    )
  } catch (error) {
    apiLogger.error('查詢圖片列表失敗', error as Error, {
      module: 'UnifiedImageAPI',
      metadata: { module, entityId },
    })
    throw error
  }
}

/**
 * PATCH - 更新圖片資訊（排序、替代文字等）
 */
async function handlePATCH(request: NextRequest) {
  const body = await request.json()
  const result = UpdateSchema.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`更新參數驗證失敗: ${errorMessage}`)
  }

  const { action, module, entityId } = result.data

  // 驗證模組
  if (!isValidModule(module)) {
    throw new ValidationError(`不支援的圖片模組: ${module}`)
  }

  apiLogger.info('開始圖片更新操作', {
    module: 'UnifiedImageAPI',
    metadata: { action, module, entityId },
  })

  try {
    switch (action) {
      case 'reorder': {
        const { images } = result.data
        if (!images || images.length === 0) {
          throw new ValidationError('排序操作需要提供圖片位置列表')
        }

        await unifiedImageService.updateImagePositions(images)

        apiLogger.info('圖片排序更新完成', {
          module: 'UnifiedImageAPI',
          metadata: {
            module,
            entityId,
            updateCount: images.length,
          },
        })

        return success(
          {
            action: 'reorder',
            updateCount: images.length,
          },
          '圖片排序更新成功'
        )
      }

      case 'update': {
        const { imageId, data } = result.data
        if (!imageId || !data) {
          throw new ValidationError('更新操作需要提供圖片ID和更新資料')
        }

        await unifiedImageService.updateImageInfo(imageId, data)

        apiLogger.info('圖片資訊更新完成', {
          module: 'UnifiedImageAPI',
          metadata: {
            module,
            entityId,
            imageId,
          },
        })

        return success(
          {
            action: 'update',
            imageId,
          },
          '圖片資訊更新成功'
        )
      }

      default:
        throw new ValidationError(`不支援的更新操作: ${action}`)
    }
  } catch (error) {
    apiLogger.error('圖片更新操作失敗', error as Error, {
      module: 'UnifiedImageAPI',
      metadata: { action, module, entityId },
    })
    throw error
  }
}

/**
 * DELETE - 刪除圖片
 */
async function handleDELETE(request: NextRequest) {
  const body = await request.json()
  const result = DeleteSchema.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`刪除參數驗證失敗: ${errorMessage}`)
  }

  const { imageId } = result.data

  apiLogger.info('開始刪除圖片', {
    module: 'UnifiedImageAPI',
    metadata: { imageId },
  })

  try {
    await unifiedImageService.deleteImage(imageId)

    apiLogger.info('圖片刪除完成', {
      module: 'UnifiedImageAPI',
      metadata: { imageId },
    })

    return success(
      {
        imageId,
        deleted: true,
      },
      '圖片刪除成功'
    )
  } catch (error) {
    apiLogger.error('圖片刪除失敗', error as Error, {
      module: 'UnifiedImageAPI',
      metadata: { imageId },
    })
    throw error
  }
}

// 整合錯誤處理中間件
const handlePOSTWithError = withErrorHandler(handlePOST, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true, // 圖片上傳需要審計日誌
})

const handleGETWithError = withErrorHandler(handleGET, {
  module: 'UnifiedImageAPI',
  enableAuditLog: false, // GET 請求通常不需要審計日誌
})

const handlePATCHWithError = withErrorHandler(handlePATCH, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true, // 更新操作需要審計日誌
})

const handleDELETEWithError = withErrorHandler(handleDELETE, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true, // 刪除操作需要審計日誌
})

/**
 * OPTIONS - CORS 預檢請求處理
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
      'Access-Control-Max-Age': '86400', // 24 小時
    },
  })
}

// 導出 API 處理器
export const POST = handlePOSTWithError
export const GET = handleGETWithError
export const PATCH = handlePATCHWithError
export const DELETE = handleDELETEWithError
