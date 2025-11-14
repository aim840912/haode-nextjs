'use client'

import { useState, useEffect, useCallback } from 'react'
import { SortableImageGallery } from '@/components/ui/image/SortableImageGallery'
import { useCSRFTokenValue } from '@/hooks/useCSRFToken'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { imageUrlValidator } from '@/lib/utils/image-url-validator'
import { UploadArea } from './UploadArea'
import { useImageUpload } from './useImageUpload'
import type { ImageUploaderProps, UploadedImage } from './types'

export function ImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  maxFiles = 5,
  allowMultiple = true,
  generateMultipleSizes = false,
  enableCompression = true,
  className = '',
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  // 統一 API 相關
  module,
  // 向後相容 props
  apiEndpoint,
  idParamName = 'productId',
  // 初始圖片相關
  initialImages = [],
  onDeleteInitialImage,
}: ImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<UploadedImage[]>([])
  const csrfToken = useCSRFTokenValue()

  // 決定使用統一 API 還是舊 API
  const useUnifiedAPI = !!module
  const finalApiEndpoint = useUnifiedAPI
    ? '/api/upload/unified'
    : apiEndpoint || '/api/upload/images'
  const finalIdParamName = useUnifiedAPI ? 'entityId' : idParamName

  // 載入初始圖片
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      const initialPreviewImages: UploadedImage[] = initialImages.map((url, index) => ({
        id: `initial-${productId}-${index}`,
        url: imageUrlValidator.clean(url),
        path: url, // 使用 URL 作為 path，讓 handleRemoveImage 知道要刪除
        size: 'medium' as const,
        position: index,
        alt: `初始圖片 ${index + 1}`,
        preview: imageUrlValidator.clean(url),
      }))

      setPreviewImages(initialPreviewImages)
      logger.info('載入初始圖片成功', {
        metadata: {
          context: 'ImageUploader',
          productId,
          initialImageCount: initialImages.length,
        },
      })
    }
  }, [initialImages, productId])

  // 使用上傳 Hook
  const {
    isUploading,
    uploadProgress,
    upload,
    setPreviewImages: updatePreviewFromHook,
  } = useImageUpload({
    productId,
    maxFiles,
    generateMultipleSizes,
    enableCompression,
    useUnifiedAPI,
    finalApiEndpoint,
    finalIdParamName,
    module,
    previewImages,
    onUploadSuccess,
    onUploadError,
  })

  // 同步 Hook 內部的 previewImages 更新到外部狀態
  useEffect(() => {
    const unsubscribe = () => {
      updatePreviewFromHook(prev => {
        setPreviewImages(prev)
        return prev
      })
    }
    return unsubscribe
  }, [updatePreviewFromHook])

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      const uploadedImages = await upload(files)
      if (uploadedImages.length > 0) {
        setPreviewImages(prev => [...prev, ...uploadedImages])
      }
    },
    [upload]
  )

  const handleRemoveImage = async (imageId: string) => {
    const imageToRemove = previewImages.find(img => img.id === imageId)
    if (!imageToRemove) return

    try {
      // 判斷是否為初始圖片
      if (imageId.startsWith('initial-')) {
        // 通知父元件刪除初始圖片
        onDeleteInitialImage?.(imageToRemove.url || imageToRemove.path)

        logger.info('刪除初始圖片', {
          metadata: {
            context: 'ImageUploader',
            imageId,
            imageUrl: imageToRemove.url || imageToRemove.path,
          },
        })
      } else {
        // 刪除已上傳的新圖片（如果有路径）
        if (imageToRemove.path) {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }
          if (csrfToken) {
            headers['x-csrf-token'] = csrfToken
          }

          if (useUnifiedAPI) {
            // 使用統一 API 刪除
            await fetch(finalApiEndpoint, {
              method: 'DELETE',
              headers,
              body: JSON.stringify({
                imageId: imageToRemove.id,
              }),
            })
          } else {
            // 使用舊 API 刪除（向後相容）
            await fetch(finalApiEndpoint, {
              method: 'DELETE',
              headers,
              body: JSON.stringify({
                [finalIdParamName]: productId,
                filePath: imageToRemove.path,
              }),
            })
          }

          logger.info('刪除上傳圖片', {
            metadata: {
              context: 'ImageUploader',
              imageId,
              imagePath: imageToRemove.path,
            },
          })
        }
      }

      // 從預覽中移除並重新計算位置
      setPreviewImages(prev => {
        const filtered = prev.filter(img => img.id !== imageId)
        // 重新計算位置索引
        return filtered.map((img, index) => ({
          ...img,
          position: index,
        }))
      })

      // 通知上層組件圖片已刪除
      onDeleteSuccess?.(imageToRemove)
    } catch (error) {
      logger.error('刪除圖片失敗', error instanceof Error ? error : new Error('Unknown error'), {
        metadata: {
          imageId,
          imagePath: imageToRemove.path,
          isInitialImage: imageId.startsWith('initial-'),
        },
      })
      onUploadError?.('刪除圖片失敗')
    }
  }

  const handleImagesReorder = (reorderedImages: UploadedImage[]) => {
    setPreviewImages(reorderedImages)

    // 通知上層組件排序已更改
    if (onUploadSuccess) {
      onUploadSuccess(reorderedImages)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上傳區域 */}
      <UploadArea
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        allowMultiple={allowMultiple}
        maxFiles={maxFiles}
        acceptedTypes={acceptedTypes}
        onFileSelect={handleFileSelect}
      />

      {/* 可排序的圖片預覽 */}
      {previewImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">已上傳的圖片</h4>
          <SortableImageGallery
            images={previewImages}
            onImagesReorder={handleImagesReorder}
            onImageRemove={handleRemoveImage}
            layout="grid"
            maxColumns={4}
          />
        </div>
      )}

      {/* 上傳統計 */}
      {previewImages.length > 0 && (
        <div className="text-sm text-gray-500 border-t pt-3">
          已上傳 {previewImages.length} 個檔案
          {maxFiles > 0 && ` / 最多 ${maxFiles} 個`}
        </div>
      )}
    </div>
  )
}
