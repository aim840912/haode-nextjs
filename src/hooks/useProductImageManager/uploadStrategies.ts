/**
 * 圖片上傳策略
 * 根據不同模式 (database/memory/edit) 執行對應的上傳邏輯
 */

import { logger } from '@/lib/logger'
import { ProductImage } from '@/types/product'
import { createPreviewImage } from './imageUtils'

export interface UploadContext {
  files: FileList
  productId: string
  images: ProductImage[]
  blobUrlTracker: Set<string>
  csrfToken: string | null
  onImagesChange?: (images: ProductImage[]) => void
  setPendingUploads: (updater: (prev: File[]) => File[]) => void
  loadImages: () => Promise<void>
}

/**
 * Edit 模式上傳策略
 * 只在記憶體中處理，追蹤待上傳檔案
 */
export async function uploadInEditMode(context: UploadContext): Promise<ProductImage[]> {
  const { files, productId, images, blobUrlTracker, onImagesChange, setPendingUploads } = context

  const newImages = Array.from(files).map((file, index) =>
    createPreviewImage(file, index, productId, images.length, blobUrlTracker, 'pending')
  )

  const updatedImages = [...images, ...newImages]
  onImagesChange?.(updatedImages)
  setPendingUploads(prev => [...prev, ...Array.from(files)])

  logger.info('圖片新增完成（編輯模式）', {
    metadata: {
      context: 'useProductImageManager',
      productId,
      uploadCount: files.length,
    },
  })

  return updatedImages
}

/**
 * Memory 模式上傳策略
 * 只在記憶體中處理，不追蹤待上傳狀態
 */
export async function uploadInMemoryMode(context: UploadContext): Promise<ProductImage[]> {
  const { files, productId, images, blobUrlTracker, onImagesChange } = context

  const newImages = Array.from(files).map((file, index) =>
    createPreviewImage(file, index, productId, images.length, blobUrlTracker, 'temp')
  )

  const updatedImages = [...images, ...newImages]
  onImagesChange?.(updatedImages)

  logger.info('圖片上傳完成（記憶體模式）', {
    metadata: {
      context: 'useProductImageManager',
      productId,
      uploadCount: files.length,
    },
  })

  return updatedImages
}

/**
 * Database 模式上傳策略
 * 實際上傳到 Supabase Storage
 */
export async function uploadToDatabaseMode(context: UploadContext): Promise<void> {
  const { files, productId, images, csrfToken, loadImages } = context

  const uploadPromises = Array.from(files).map(async (file, index) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('module', 'products')
    formData.append('entityId', productId)
    formData.append('size', 'medium')
    formData.append('display_position', String(images.length + index))
    formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''))

    const headers: HeadersInit = {}
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    const uploadResponse = await fetch('/api/upload/unified', {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(errorData.message || '上傳檔案失敗')
    }

    const uploadResult = await uploadResponse.json()
    if (!uploadResult.success || !uploadResult.data.image) {
      throw new Error('上傳回應格式不正確')
    }

    return uploadResult.data.image
  })

  await Promise.all(uploadPromises)

  logger.info('產品圖片上傳完成（資料庫模式）', {
    metadata: {
      context: 'useProductImageManager',
      productId,
      uploadCount: files.length,
    },
  })

  await loadImages()
}
