import { NextRequest } from 'next/server'
import { initializeFarmTourBucket, uploadFarmTourImage } from '@/lib/farm-tour-storage'
import { validateImageFile } from '@/lib/image-utils'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

// 初始化 storage bucket
let bucketInitialized = false

async function ensureBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeFarmTourBucket()
      bucketInitialized = true
      apiLogger.info('農場體驗活動 Storage bucket 初始化成功', { module: 'FarmTourUpload' })
    } catch (error) {
      apiLogger.warn('無法初始化農場體驗活動 storage bucket', {
        module: 'FarmTourUpload',
        metadata: { error: (error as Error).message },
      })
      // 繼續執行，可能 bucket 已存在
    }
  }
}

// 驗證表單參數的 schema
const FarmTourUploadSchema = z.object({
  activityId: z.string().min(1, 'activityId 必填'),
  compress: z.string().optional().default('true'),
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

  const result = FarmTourUploadSchema.safeParse(formParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`上傳參數驗證失敗: ${errorMessage}`)
  }

  const { activityId } = result.data

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new ValidationError(validation.error || '圖片檔案驗證失敗')
  }

  apiLogger.info('開始上傳農場體驗活動圖片', {
    module: 'FarmTourUpload',
    metadata: {
      activityId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  })

  try {
    // 使用專屬的農場體驗活動圖片上傳功能
    const uploadResult = await uploadFarmTourImage(file, activityId)

    // 添加檔案大小到結果中
    const result = {
      ...uploadResult,
      size: file.size,
    }

    apiLogger.info('農場體驗活動圖片上傳成功', {
      module: 'FarmTourUpload',
      metadata: {
        activityId,
        fileName: result.fileName,
        url: result.url,
      },
    })

    return success(result, '圖片上傳成功')
  } catch (error) {
    apiLogger.error('農場體驗活動圖片上傳失敗', error as Error, {
      module: 'FarmTourUpload',
      metadata: { activityId, fileName: file.name },
    })

    if (error instanceof ValidationError) {
      throw error
    }

    throw new Error('圖片上傳過程中發生錯誤')
  }
}

// 導出使用 withErrorHandler 中間件的處理器
export const POST = withErrorHandler(handlePOST, {
  module: 'FarmTourUpload',
  enableAuditLog: false, // 圖片上傳不需要稽核日誌
})
