import { NextRequest } from 'next/server'
import {
  uploadMomentImageToStorage,
  deleteMomentImageFromStorage,
  initializeMomentStorageBucket,
  MomentStorageError,
} from '@/lib/moments-storage'
import { validateImageFile } from '@/lib/image-utils'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'

// 初始化 storage bucket
let bucketInitialized = false

async function ensureMomentsBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeMomentStorageBucket()
      bucketInitialized = true
      apiLogger.info('精彩時刻 Storage bucket 已存在', {
        module: 'MomentsUpload',
        action: 'initializeMomentsBucket',
        metadata: { bucket: 'moments' },
      })
    } catch (error) {
      apiLogger.warn('無法初始化精彩時刻 storage bucket', {
        metadata: { error: (error as Error).message },
      })
      // 繼續執行，可能 bucket 已存在
    }
  }
}

async function handlePOST(request: NextRequest) {
  await ensureMomentsBucketExists()

  const formData = await request.formData()
  const file = formData.get('file') as File
  const momentId = formData.get('momentId') as string

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  if (!momentId) {
    throw new ValidationError('精彩時刻 ID 為必填')
  }

  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new ValidationError(validation.error || '圖片檔案驗證失敗')
  }

  try {
    apiLogger.info('開始上傳精彩時刻圖片', {
      module: 'MomentsUpload',
      metadata: {
        momentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    })

    const result = await uploadMomentImageToStorage(file, momentId)

    apiLogger.info('精彩時刻圖片上傳成功', {
      module: 'MomentsUpload',
      metadata: {
        momentId,
        fileName: file.name,
        url: result.url,
      },
    })

    return success(result, '精彩時刻圖片上傳成功')
  } catch (error) {
    const errorMessage = error instanceof MomentStorageError ? error.message : '圖片上傳失敗'

    apiLogger.error('精彩時刻圖片上傳失敗', error as Error, {
      metadata: { momentId, fileName: file.name },
    })

    throw new ValidationError(errorMessage)
  }
}

async function handleDELETE(request: NextRequest) {
  const { filePath, momentId } = await request.json()

  if (!filePath) {
    throw new ValidationError('檔案路徑為必填')
  }

  try {
    apiLogger.info('開始刪除精彩時刻圖片', {
      module: 'MomentsUpload',
      action: 'DELETE',
      metadata: { momentId, filePath },
    })

    await deleteMomentImageFromStorage(filePath)

    apiLogger.info('精彩時刻圖片刪除成功', {
      module: 'MomentsUpload',
      action: 'DELETE',
      metadata: { momentId, filePath },
    })

    return success({ deleted: true }, '精彩時刻圖片刪除成功')
  } catch (error) {
    const errorMessage = error instanceof MomentStorageError ? error.message : '圖片刪除失敗'

    apiLogger.error('精彩時刻圖片刪除失敗', error as Error, {
      metadata: { momentId, filePath },
    })

    throw new ValidationError(errorMessage)
  }
}

export const POST = withErrorHandler(handlePOST, {
  module: 'MomentsUpload',
  enableAuditLog: true,
})

export const DELETE = withErrorHandler(handleDELETE, {
  module: 'MomentsUpload',
  enableAuditLog: true,
})
