/**
 * 圖片管理工具函數
 * 提供檔案驗證、預覽圖片建立等工具
 */

import { ProductImage } from '@/types/product'

/**
 * 檢查檔案大小
 * @returns 過大的檔案列表
 */
export function validateFileSize(files: FileList, maxSizeMB: number = 5) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  const oversizedFiles = Array.from(files).filter(file => file.size > maxSizeBytes)

  if (oversizedFiles.length > 0) {
    const fileNames = oversizedFiles
      .map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`)
      .join(', ')
    return { isValid: false, error: `以下檔案過大，請選擇小於 ${maxSizeMB}MB 的圖片：${fileNames}` }
  }

  return { isValid: true, error: null }
}

/**
 * 建立預覽圖片物件
 */
export function createPreviewImage(
  file: File,
  index: number,
  productId: string,
  currentImageCount: number,
  blobUrlTracker: Set<string>,
  idPrefix: 'pending' | 'temp'
): ProductImage {
  const previewUrl = URL.createObjectURL(file)
  blobUrlTracker.add(previewUrl)

  return {
    id: `${idPrefix}-${Date.now()}-${index}`,
    entity_id: productId,
    storage_url: previewUrl,
    file_path: `${idPrefix}/${file.name}`,
    alt_text: file.name.replace(/\.[^/.]+$/, '') || `產品圖片 ${index + 1}`,
    display_position: currentImageCount + index,
    size: 'medium' as const,
    width: undefined,
    height: undefined,
    file_size: file.size,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    module: 'products',
    _originalFile: file,
  }
}

/**
 * 清理 Blob URL
 */
export function revokeBlobUrl(url: string, blobUrlTracker: Set<string>) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
    blobUrlTracker.delete(url)
  }
}

/**
 * 清理所有 Blob URLs
 */
export function cleanupAllBlobUrls(blobUrlTracker: Set<string>) {
  blobUrlTracker.forEach(url => {
    URL.revokeObjectURL(url)
  })
  blobUrlTracker.clear()
}
