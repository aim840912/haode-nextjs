import { NextRequest, NextResponse } from 'next/server'
import {
  uploadNewsImage,
  uploadNewsImageServer,
  uploadNewsImageWithThumbnail,
  deleteNewsImage,
  listNewsImages,
  initializeNewsBucket,
} from '@/lib/news-storage'
import { SupabaseStorageError } from '@/lib/supabase-storage'
import { validateImageFile } from '@/lib/image-utils'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { ValidationError } from '@/lib/errors'

// 初始化 news bucket
let bucketInitialized = false

async function ensureNewsBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeNewsBucket()
      bucketInitialized = true
    } catch (error) {
      apiLogger.error('無法初始化新聞 storage bucket:', error as Error, {
        module: 'NewsImageAPI',
        action: 'initializeBucket',
      })
      // 繼續執行，可能 bucket 已存在
    }
  }
}

async function handlePOST(request: NextRequest) {
  apiLogger.info('開始新聞圖片上傳', {
    module: 'NewsImages',
    action: 'POST',
  })

  await ensureNewsBucketExists()

  const formData = await request.formData()
  const file = formData.get('file') as File
  const newsId = formData.get('newsId') as string
  const generateThumbnail = formData.get('generateThumbnail') === 'true'

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new ValidationError(validation.error || '圖片檔案驗證失敗')
  }

  if (generateThumbnail) {
    // 上傳主圖片和縮圖
    apiLogger.info(`📸 開始新聞圖片多檔案上傳，新聞ID: ${newsId}, 檔案: ${file.name}`)
    const results = await uploadNewsImageWithThumbnail(file, newsId)
    apiLogger.info('📸 新聞圖片多檔案上傳完成:', {
      module: 'NewsImages',
      action: 'POST',
      metadata: { results },
    })

    return success(
      {
        multiple: true,
        urls: results,
      },
      '新聞圖片上傳成功'
    )
  } else {
    // 單一檔案上傳（使用伺服器端函數繞過 RLS）
    apiLogger.info(`📸 開始新聞圖片上傳，新聞ID: ${newsId}, 檔案: ${file.name}`)
    const result = await uploadNewsImageServer(file, newsId)
    apiLogger.info('📸 新聞圖片上傳完成:', {
      module: 'NewsImages',
      action: 'POST',
      metadata: { result },
    })

    return success(
      {
        multiple: false,
        url: result.url,
        path: result.path,
      },
      '新聞圖片上傳成功'
    )
  }
}

// 處理新聞圖片刪除
async function handleDELETE(request: NextRequest) {
  apiLogger.info('開始新聞圖片刪除', {
    module: 'NewsImages',
    action: 'DELETE',
  })

  const { filePath } = await request.json()

  if (!filePath) {
    throw new ValidationError('檔案路徑是必需的')
  }

  apiLogger.info('刪除新聞圖片', {
    module: 'NewsImages',
    action: 'DELETE',
    metadata: { filePath },
  })

  await deleteNewsImage(filePath)

  apiLogger.info('新聞圖片刪除成功', {
    module: 'NewsImages',
    action: 'DELETE',
    metadata: { filePath },
  })

  return success({ success: true }, '新聞圖片刪除成功')
}

// 列出新聞圖片
async function handleGET(request: NextRequest) {
  apiLogger.info('開始列出新聞圖片', {
    module: 'NewsImages',
    action: 'GET',
  })

  const { searchParams } = new URL(request.url)
  const newsId = searchParams.get('newsId')

  if (!newsId) {
    throw new ValidationError('新聞 ID 是必需的')
  }

  apiLogger.info('查詢新聞圖片', {
    module: 'NewsImages',
    action: 'GET',
    metadata: { newsId },
  })

  const images = await listNewsImages(newsId)

  apiLogger.info('新聞圖片列出成功', {
    module: 'NewsImages',
    action: 'GET',
    metadata: { newsId, imageCount: images.length },
  })

  return success(images, '列出新聞圖片成功')
}

// 導出使用 withErrorHandler 中間件的處理器
export const GET = withErrorHandler(handleGET, { module: 'NewsImages' })
export const POST = withErrorHandler(handlePOST, { module: 'NewsImages' })
export const DELETE = withErrorHandler(handleDELETE, { module: 'NewsImages' })
