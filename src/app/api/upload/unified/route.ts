/**
 * @api {POST} /api/upload/unified 上傳圖片
 * @apiName UploadImage
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 統一圖片上傳 API（需要使用者認證）。
 * 支援多種模組的圖片上傳：產品、地點、網站設定等。
 * 可選擇上傳單一尺寸或多個尺寸的圖片。
 * 產品和網站設定模組需要管理員權限。
 *
 * @apiPermission user (產品和網站設定需要 admin)
 *
 * @apiBody {File} file 圖片檔案（必填）
 * @apiBody {String} module 模組名稱（必填，如：products, locations, site-settings）
 * @apiBody {String} entityId 實體 ID（必填）
 * @apiBody {String} [size=medium] 圖片尺寸（small, medium, large）
 * @apiBody {Number} [display_position=0] 顯示順序
 * @apiBody {Boolean} [generateMultipleSizes=false] 是否生成多個尺寸
 * @apiBody {String} [alt_text] 圖片替代文字
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object|Object[]} data 上傳結果（單一圖片或多個尺寸）
 * @apiSuccess {String} data.id 圖片 ID
 * @apiSuccess {String} data.storage_url 圖片 URL
 * @apiSuccess {String} data.module 模組名稱
 * @apiSuccess {String} data.size 圖片尺寸
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（單一尺寸）:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "storage_url": "https://storage.example.com/image.jpg",
 *     "module": "products",
 *     "size": "medium",
 *     "display_position": 0
 *   },
 *   "message": "圖片上傳成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（多個尺寸）:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "uuid-1", "storage_url": "image-small.jpg", "size": "small" },
 *     { "id": "uuid-2", "storage_url": "image-medium.jpg", "size": "medium" },
 *     { "id": "uuid-3", "storage_url": "image-large.jpg", "size": "large" }
 *   ],
 *   "message": "圖片上傳成功（3 個尺寸）"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 上傳參數驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足（產品/網站設定需管理員）
 * @apiError (錯誤 5xx) {Object} UploadError 圖片上傳失敗
 *
 * @apiErrorExample {json} 缺少檔案:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "請選擇要上傳的圖片檔案",
 *   "code": "VALIDATION_ERROR"
 * }
 *
 * @apiErrorExample {json} 權限不足:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "產品圖片上傳需要管理員權限",
 *   "code": "FORBIDDEN"
 * }
 */

/**
 * @api {GET} /api/upload/unified 查詢圖片列表
 * @apiName GetImages
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 查詢指定模組和實體的所有圖片（需要使用者認證）。
 *
 * @apiPermission user
 *
 * @apiQuery {String} module 模組名稱（必填）
 * @apiQuery {String} entityId 實體 ID（必填）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 圖片列表
 * @apiSuccess {String} data.id 圖片 ID
 * @apiSuccess {String} data.storage_url 圖片 URL
 * @apiSuccess {Number} data.display_position 顯示順序
 * @apiSuccess {String} data.alt_text 替代文字
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "storage_url": "https://storage.example.com/image.jpg",
 *       "display_position": 0,
 *       "alt_text": "產品圖片"
 *     }
 *   ],
 *   "message": "圖片列表取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 查詢參數驗證失敗
 */

/**
 * @api {PUT} /api/upload/unified 更新圖片資訊或重新排序
 * @apiName UpdateImages
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 更新圖片資訊或重新排序圖片（需要使用者認證）。
 * 支援兩種操作：reorder（重新排序）、update（更新單一圖片資訊）。
 *
 * @apiPermission user
 *
 * @apiBody {String} action 操作類型（reorder 或 update）
 * @apiBody {String} module 模組名稱（必填）
 * @apiBody {String} entityId 實體 ID（必填）
 * @apiBody {Object[]} [images] 圖片列表（reorder 操作時必填）
 * @apiBody {String} images.id 圖片 ID
 * @apiBody {Number} images.display_position 新的顯示順序
 * @apiBody {String} [imageId] 圖片 ID（update 操作時必填）
 * @apiBody {Object} [data] 更新資料（update 操作時必填）
 * @apiBody {String} [data.alt_text] 新的替代文字
 * @apiBody {Object} [data.metadata] 新的元資料
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 更新結果
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（重新排序）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": { "updated": 3 },
 *   "message": "圖片順序更新成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 參數驗證失敗
 */

/**
 * @api {DELETE} /api/upload/unified 刪除圖片
 * @apiName DeleteImage
 * @apiGroup Upload
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 刪除指定圖片（需要使用者認證）。
 * 會同時刪除資料庫記錄和 Storage 檔案。
 *
 * @apiPermission user
 *
 * @apiQuery {String} imageId 圖片 ID（必填）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 刪除結果
 * @apiSuccess {String} data.imageId 被刪除的圖片 ID
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": { "imageId": "uuid" },
 *   "message": "圖片刪除成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 圖片 ID 為必填
 * @apiError (錯誤 4xx) {Object} NotFoundError 圖片不存在
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getModuleConfig, isValidModule } from '@/config/image-modules.config'
import { success, created } from '@/lib/api-response'
import { ValidationError, AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { requireAuth, User } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { unifiedImageService } from '@/services/infrastructure/unified-image-service'

// 定義驗證 Schema
const UploadFormSchema = z.object({
  module: z.string().min(1, '模組名稱為必填'),
  entityId: z.string().min(1, '實體ID為必填'),
  size: z.string().optional().default('medium'),
  display_position: z.coerce.number().optional().default(0),
  generateMultipleSizes: z.coerce.boolean().optional().default(false),
  alt_text: z.string().optional(),
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
      alt_text: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
})

/**
 * POST - 上傳圖片 (需要認證)
 */
async function handlePOST(request: NextRequest, user: User) {
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

  const { module, entityId, size, display_position, generateMultipleSizes, alt_text } = result.data

  // 驗證模組
  if (!isValidModule(module)) {
    throw new ValidationError(`不支援的圖片模組: ${module}`)
  }

  // 權限檢查：產品和網站設定模組需要管理員權限
  if ((module === 'products' || module === 'site-settings') && !user.isAdmin) {
    throw new AuthorizationError(
      `${module === 'products' ? '產品' : '網站設定'}圖片上傳需要管理員權限`
    )
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
      userId: user?.id,
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

      // 如果有 alt_text，更新第一個圖片的替代文字
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

      // 如果有 alt_text，更新圖片的替代文字
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
 * DELETE - 刪除圖片 (需要認證)
 */
async function handleDELETE(request: NextRequest, user: User) {
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
    metadata: { imageId, userId: user?.id },
  })

  try {
    // 先取得圖片資訊以檢查模組
    const imageInfo = await unifiedImageService.getImageById(imageId)
    if (!imageInfo) {
      throw new ValidationError(`圖片不存在: ${imageId}`)
    }

    // 權限檢查：產品和網站設定模組需要管理員權限
    if (
      (imageInfo.module === 'products' || imageInfo.module === 'site-settings') &&
      !user.isAdmin
    ) {
      throw new AuthorizationError(
        `${imageInfo.module === 'products' ? '產品' : '網站設定'}圖片刪除需要管理員權限`
      )
    }

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

// 整合認證和錯誤處理中間件
const handlePOSTWithAuth = requireAuth(handlePOST)

const handleGETWithError = withErrorHandler(handleGET, {
  module: 'UnifiedImageAPI',
  enableAuditLog: false, // GET 請求通常不需要審計日誌
})

const handlePATCHWithError = withErrorHandler(handlePATCH, {
  module: 'UnifiedImageAPI',
  enableAuditLog: true, // 更新操作需要審計日誌
})

// 整合認證和錯誤處理中間件
const handleDELETEWithAuth = requireAuth(handleDELETE)

/**
 * OPTIONS - CORS 預檢請求處理
 */
export async function OPTIONS(_request: NextRequest) {
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
export const POST = handlePOSTWithAuth
export const GET = handleGETWithError
export const PATCH = handlePATCHWithError
export const DELETE = handleDELETEWithAuth
