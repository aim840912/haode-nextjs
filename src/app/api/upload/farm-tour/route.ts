import { NextRequest } from 'next/server'
import { SupabaseStorageError, initializeStorageBucket } from '@/lib/supabase-storage'
import { validateImageFile, generateFileName } from '@/lib/image-utils'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'
import { supabase } from '@/lib/supabase-auth'

// 初始化 storage bucket
let bucketInitialized = false

async function ensureBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeStorageBucket()
      bucketInitialized = true
      apiLogger.info('Storage bucket 初始化成功', { module: 'FarmTourUpload' })
    } catch (error) {
      apiLogger.warn('無法初始化 storage bucket', {
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
    // 生成檔案名稱（使用 farm-tour 前綴）
    const fileName = generateFileName(file.name, `farm-tour-${activityId}`)
    const filePath = `farm-tour/${activityId}/${fileName}`

    // 上傳檔案到 Supabase Storage
    const { error } = await supabase.storage
      .from('products') // 使用同一個 bucket，但不同路徑
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new SupabaseStorageError('圖片上傳失敗', error)
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath)

    const uploadResult = {
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName,
      size: file.size,
    }

    apiLogger.info('農場體驗活動圖片上傳成功', {
      module: 'FarmTourUpload',
      metadata: {
        activityId,
        fileName,
        url: uploadResult.url,
      },
    })

    return success(uploadResult, '圖片上傳成功')
  } catch (error) {
    apiLogger.error('農場體驗活動圖片上傳失敗', error as Error, {
      module: 'FarmTourUpload',
      metadata: { activityId, fileName: file.name },
    })

    if (error instanceof SupabaseStorageError || error instanceof ValidationError) {
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
