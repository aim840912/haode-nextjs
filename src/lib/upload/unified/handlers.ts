/**
 * Unified Upload API - Business Logic Handlers
 *
 * 統一圖片上傳 API 的業務邏輯處理器
 */

import { NextRequest } from 'next/server'
import { getModuleConfig, isValidModule } from '@/config/image-modules.config'
import { created, success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import type { User } from '@/lib/middleware/api-middleware'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'
import { checkUploadPermission, checkDeletePermission } from './permissions'
import {
  UploadFormSchema,
  QuerySchema,
  UpdateSchema,
  DeleteSchema,
  type UploadFormInput,
  type QueryInput,
  type UpdateInput,
  type DeleteInput,
} from './schemas'

/**
 * 驗證並解析 FormData
 *
 * @param formData - FormData 物件
 * @returns 驗證後的參數
 */
function parseFormData(formData: FormData): UploadFormInput {
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

  return result.data
}

/**
 * 驗證並解析查詢參數
 */
function parseQueryParams(searchParams: URLSearchParams): QueryInput {
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

  return result.data
}

/**
 * 驗證並解析更新參數
 */
function parseUpdateBody(body: unknown): UpdateInput {
  const result = UpdateSchema.safeParse(body)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`更新參數驗證失敗: ${errorMessage}`)
  }

  return result.data
}

/**
 * 驗證並解析刪除參數
 */
function parseDeleteBody(body: unknown): DeleteInput {
  const result = DeleteSchema.safeParse(body)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`刪除參數驗證失敗: ${errorMessage}`)
  }

  return result.data
}

/**
 * 驗證模組名稱
 */
function validateModule(module: string): void {
  if (!isValidModule(module)) {
    throw new ValidationError(`不支援的圖片模組: ${module}`)
  }
}

/**
 * POST Handler - 上傳圖片
 */
export async function handleUpload(request: NextRequest, user: User) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證表單參數
  const { module, entityId, size, display_position, generateMultipleSizes, alt_text } =
    parseFormData(formData)

  // 驗證模組
  validateModule(module)

  // 權限檢查
  checkUploadPermission(module, user)

  const config = getModuleConfig(module)

  apiLogger.info('開始圖片上傳', {
    module: 'UnifiedImageAPI',
    metadata: {
      module,
      entityId,
      fileName: file.name,
      fileSize: file.size,
      generateMultipleSizes,
      userId: user?.id,
    },
  })

  if (generateMultipleSizes && config.generateSizes.length > 1) {
    // 上傳多個尺寸
    const results = await unifiedImageService.uploadMultipleSizes(
      file,
      module,
      entityId,
      display_position
    )

    // 如果有 alt_text,更新第一個圖片的替代文字
    if (alt_text && results.length > 0) {
      await unifiedImageService.updateImageInfo(results[0].id, { alt_text })
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

    // 如果有 alt_text,更新圖片的替代文字
    if (alt_text) {
      await unifiedImageService.updateImageInfo(result.id, { alt_text })
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
}

/**
 * GET Handler - 查詢圖片列表
 */
export async function handleGetImages(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // 驗證查詢參數
  const { module, entityId } = parseQueryParams(searchParams)

  // 驗證模組
  validateModule(module)

  apiLogger.debug('查詢圖片列表', {
    module: 'UnifiedImageAPI',
    metadata: { module, entityId },
  })

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
}

/**
 * PATCH Handler - 更新圖片資訊
 */
export async function handleUpdateImages(request: NextRequest) {
  const body = await request.json()

  // 驗證更新參數
  const { action, module, entityId } = parseUpdateBody(body)

  // 驗證模組
  validateModule(module)

  apiLogger.info('開始圖片更新操作', {
    module: 'UnifiedImageAPI',
    metadata: { action, module, entityId },
  })

  try {
    switch (action) {
      case 'reorder': {
        const { images } = body as UpdateInput
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
        const { imageId, data } = body as UpdateInput
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
 * DELETE Handler - 刪除圖片
 */
export async function handleDeleteImage(request: NextRequest, user: User) {
  const body = await request.json()

  // 驗證刪除參數
  const { imageId } = parseDeleteBody(body)

  apiLogger.info('開始刪除圖片', {
    module: 'UnifiedImageAPI',
    metadata: { imageId, userId: user?.id },
  })

  // 先取得圖片資訊以檢查模組
  const imageInfo = await unifiedImageService.getImageById(imageId)
  if (!imageInfo) {
    throw new ValidationError(`圖片不存在: ${imageId}`)
  }

  // 權限檢查
  checkDeletePermission(imageInfo.module, user)

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
}
