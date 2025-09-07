import { NextRequest } from 'next/server'
import {
  uploadImageToStorage,
  uploadMultipleSizeImages,
  SupabaseStorageError,
  initializeStorageBucket,
} from '@/lib/supabase-storage'
import { validateImageFile } from '@/lib/image-utils'
import { withErrorHandler } from '@/lib/error-handler'
import { ImageUploadSchemas } from '@/lib/validation-schemas'
import { ValidationError } from '@/lib/errors'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { ProductImageService } from '@/services/productImageService'

// 初始化 storage bucket
let bucketInitialized = false

async function ensureBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeStorageBucket()
      bucketInitialized = true
      apiLogger.info('Storage bucket 初始化成功')
    } catch (error) {
      apiLogger.warn('無法初始化 storage bucket', { metadata: { error: (error as Error).message } })
      // 繼續執行，可能 bucket 已存在
    }
  }
}

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

  const result = ImageUploadSchemas.uploadForm.safeParse(formParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`上傳參數驗證失敗: ${errorMessage}`)
  }

  const { productId, generateMultipleSizes, compress, size } = result.data

  if (!file) {
    throw new ValidationError('請選擇要上傳的圖片檔案')
  }

  // 驗證檔案
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new ValidationError(validation.error || '圖片檔案驗證失敗')
  }

  const processedFile = file

  // 可選的圖片壓縮
  if (compress) {
    try {
      // 注意：server-side 壓縮需要不同的實作
      // 這裡我們先跳過壓縮，在客戶端處理
      apiLogger.debug('伺服器端圖片壓縮暫未實作')
    } catch (compressionError) {
      apiLogger.warn('圖片壓縮失敗，使用原檔案', {
        metadata: { error: (compressionError as Error).message },
      })
    }
  }

  try {
    if (generateMultipleSizes) {
      // 上傳多個尺寸
      apiLogger.info(`開始多尺寸圖片上傳`, { metadata: { productId, fileName: file.name } })
      const results = await uploadMultipleSizeImages(processedFile, productId)
      apiLogger.info('多尺寸圖片上傳完成', { metadata: { productId, sizes: Object.keys(results) } })

      // 獲取當前產品已有圖片數量來決定位置
      const existingImages = await ProductImageService.getProductImages(productId)
      let position = existingImages.length

      // 保存圖片資訊到資料庫
      const imageRecords = []
      for (const [sizeKey, sizeResult] of Object.entries(results)) {
        const imageData = {
          product_id: productId,
          url: sizeResult.url,
          path: sizeResult.path,
          alt: `${file.name} (${sizeKey})`,
          position: position,
          size: sizeKey as 'thumbnail' | 'medium' | 'large',
          file_size: file.size
        }

        try {
          const imageRecord = await ProductImageService.createProductImage(imageData)
          imageRecords.push(imageRecord)
        } catch (dbError) {
          apiLogger.warn('保存圖片記錄到資料庫失敗，但檔案已上傳成功', {
            metadata: { 
              productId, 
              url: imageData.url,
              error: (dbError as Error).message 
            }
          })
        }
        position++ // 每個尺寸佔用一個位置
      }

      return success(
        {
          multiple: true,
          urls: results,
          records: imageRecords, // 返回資料庫記錄
        },
        '圖片上傳成功'
      )
    } else {
      // 單一尺寸上傳
      apiLogger.info(`開始單一尺寸圖片上傳`, { metadata: { productId, size, fileName: file.name } })
      const uploadResult = await uploadImageToStorage(processedFile, productId, size)
      apiLogger.info('單一尺寸圖片上傳完成', { metadata: { productId, size, url: uploadResult.url } })

      // 獲取當前產品已有圖片數量來決定位置
      const existingImages = await ProductImageService.getProductImages(productId)
      const position = existingImages.length

      // 保存圖片資訊到資料庫
      let imageRecord = null
      try {
        const imageData = {
          product_id: productId,
          url: uploadResult.url,
          path: uploadResult.path,
          alt: `${file.name} (${size})`,
          position: position,
          size: size,
          file_size: file.size
        }

        imageRecord = await ProductImageService.createProductImage(imageData)
        apiLogger.info('圖片記錄已保存到資料庫', { 
          metadata: { imageId: imageRecord.id, productId, position } 
        })
      } catch (dbError) {
        apiLogger.warn('保存圖片記錄到資料庫失敗，但檔案已上傳成功', {
          metadata: { 
            productId, 
            url: uploadResult.url,
            error: (dbError as Error).message 
          }
        })
      }

      return success(
        {
          multiple: false,
          url: uploadResult.url,
          path: uploadResult.path,
          size,
          record: imageRecord, // 返回資料庫記錄
        },
        '圖片上傳成功'
      )
    }
  } catch (error) {
    // 如果是 Supabase Storage 錯誤，直接重新拋出
    if (error instanceof SupabaseStorageError) {
      throw error
    }
    
    // 其他錯誤包裝為 Storage 錯誤
    throw new SupabaseStorageError(
      `圖片上傳失敗: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

// 處理圖片刪除
async function handleDELETE(request: NextRequest) {
  const body = await request.json()
  const result = ImageUploadSchemas.deleteParams.safeParse(body)

  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`刪除參數驗證失敗: ${errorMessage}`)
  }

  const { filePath } = result.data

  apiLogger.info(`開始刪除圖片`, { metadata: { filePath } })

  const { deleteImageFromStorage } = await import('@/lib/supabase-storage')
  await deleteImageFromStorage(filePath)

  apiLogger.info('圖片刪除成功', { metadata: { filePath } })

  return success(null, '圖片刪除成功')
}

// 列出產品圖片
async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // 將 URLSearchParams 轉換為物件
  const queryParams: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    queryParams[key] = value
  }

  const result = ImageUploadSchemas.query.safeParse(queryParams)
  if (!result.success) {
    const errorMessage = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ')
    throw new ValidationError(`查詢參數驗證失敗: ${errorMessage}`)
  }

  const { productId } = result.data

  apiLogger.debug(`查詢產品圖片`, { metadata: { productId } })

  const { listProductImages } = await import('@/lib/supabase-storage')
  const images = await listProductImages(productId)

  apiLogger.info(`產品圖片查詢完成`, { metadata: { productId, imageCount: images.length } })

  return success(images, '圖片列表取得成功')
}

// 整合錯誤處理中間件
const handlePOSTWithError = withErrorHandler(handlePOST, {
  module: 'ImageUploadAPI',
  enableAuditLog: true, // 圖片上傳需要審計日誌
})

const handleGETWithError = withErrorHandler(handleGET, {
  module: 'ImageUploadAPI',
  enableAuditLog: false, // GET 請求通常不需要審計日誌
})

const handleDELETEWithError = withErrorHandler(handleDELETE, {
  module: 'ImageUploadAPI',
  enableAuditLog: true, // 刪除操作需要審計日誌
})

// 導出 API 處理器
export const POST = handlePOSTWithError
export const GET = handleGETWithError
export const DELETE = handleDELETEWithError
