import { NextRequest } from 'next/server'
import {
  initializeLocationsBucket,
  uploadLocationImage,
  deleteLocationImage,
} from '@/lib/locations-storage'
import { validateImageFile } from '@/lib/image-utils'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { locationServiceV2Simple as locationServiceAdapter } from '@/services/v2/locationServiceSimple'
import { z } from 'zod'

// 初始化 storage bucket
let bucketInitialized = false

async function ensureBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeLocationsBucket()
      bucketInitialized = true
      apiLogger.info('門市位置 Storage bucket 初始化成功', { module: 'LocationsUpload' })
    } catch (error) {
      apiLogger.warn('無法初始化門市位置 storage bucket', {
        module: 'LocationsUpload',
        metadata: { error: (error as Error).message },
      })
      // 繼續執行，可能 bucket 已存在
    }
  }
}

// 驗證表單參數的 schema
const LocationUploadSchema = z.object({
  locationId: z.string().min(1, 'locationId 必填'),
  compress: z.string().optional().default('true'),
})

// 驗證刪除請求的 schema
const LocationDeleteSchema = z.object({
  locationId: z.string().min(1, 'locationId 必填'),
  filePath: z.string().min(1, 'filePath 必填'),
})

async function handlePOST(request: NextRequest) {
  await ensureBucketExists()

  const formData = await request.formData()
  const file = formData.get('file') as File

  // 驗證表單資料
  const formParams: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key !== 'file') {
      formParams[key] = value.toString()
    }
  }

  const result = LocationUploadSchema.safeParse(formParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`上傳參數驗證失敗: ${errorMessage}`)
  }

  const { locationId } = result.data

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new ValidationError(validation.error || '圖片檔案驗證失敗')
  }

  apiLogger.info('開始上傳門市圖片', {
    module: 'LocationsUpload',
    metadata: {
      locationId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  })

  try {
    // 使用專屬的門市位置圖片上傳功能
    const uploadResult = await uploadLocationImage(file, locationId)

    // 返回 path 給前端（與重構計劃一致）
    const result = {
      url: uploadResult.url,
      path: uploadResult.path, // 新增：返回實際路徑
      fileName: uploadResult.fileName,
      size: file.size,
    }

    apiLogger.info('門市圖片上傳成功', {
      module: 'LocationsUpload',
      metadata: {
        locationId,
        fileName: result.fileName,
        url: result.url,
      },
    })

    return success(result, '圖片上傳成功')
  } catch (error) {
    apiLogger.error('門市圖片上傳失敗', error as Error, {
      module: 'LocationsUpload',
      metadata: { locationId, fileName: file.name },
    })

    if (error instanceof ValidationError) {
      throw error
    }

    throw new Error('圖片上傳過程中發生錯誤')
  }
}

async function handleDELETE(request: NextRequest) {
  apiLogger.info('開始刪除門市圖片', {
    module: 'LocationsUpload',
    action: 'DELETE',
  })

  const { locationId, filePath } = await request.json()

  // 驗證請求資料
  const result = LocationDeleteSchema.safeParse({ locationId, filePath })
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`刪除參數驗證失敗: ${errorMessage}`)
  }

  const { locationId: validLocationId, filePath: validFilePath } = result.data

  apiLogger.info('刪除門市圖片', {
    module: 'LocationsUpload',
    action: 'DELETE',
    metadata: { locationId: validLocationId, filePath: validFilePath },
  })

  try {
    // 1. 刪除實際檔案
    await deleteLocationImage(validFilePath)

    // 2. 更新資料庫記錄（僅限實際存在的地點，跳過臨時 location ID）
    const isTemporaryLocation = validLocationId.startsWith('location-')
    if (!isTemporaryLocation) {
      await locationServiceAdapter.updateLocation(parseInt(validLocationId), {
        image: '',
      })
    } else {
      apiLogger.info('跳過臨時地點的資料庫更新', {
        module: 'LocationsUpload',
        action: 'DELETE',
        metadata: { locationId: validLocationId, isTemporary: true },
      })
    }

    apiLogger.info('門市圖片刪除成功', {
      module: 'LocationsUpload',
      action: 'DELETE',
      metadata: { locationId: validLocationId, filePath: validFilePath },
    })

    return success({ success: true }, '門市圖片刪除成功')
  } catch (error) {
    apiLogger.error('門市圖片刪除失敗', error as Error, {
      module: 'LocationsUpload',
      metadata: { locationId: validLocationId, filePath: validFilePath },
    })

    if (error instanceof ValidationError) {
      throw error
    }

    throw new Error('圖片刪除過程中發生錯誤')
  }
}

// 導出使用 withErrorHandler 中間件的處理器
export const POST = withErrorHandler(handlePOST, {
  module: 'LocationsUpload',
  enableAuditLog: false, // 圖片上傳不需要稽核日誌
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'LocationsUpload',
  enableAuditLog: true, // 圖片刪除需要稽核日誌
})
