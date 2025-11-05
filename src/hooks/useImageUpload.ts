/**
 * useImageUpload Hook
 *
 * 統一的圖片上傳處理 hook
 * 整合圖片壓縮、預覽、拖放排序和刪除功能
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { compressImage, validateImageFile } from '@/lib/utils/image-utils'

export interface ImageFile {
  id: string
  file?: File
  preview: string
  url?: string
  path?: string
  position: number
  alt?: string
  width?: number
  height?: number
  size?: number
}

export interface UseImageUploadOptions {
  maxSize?: number // MB
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxImages?: number
  enableCompression?: boolean
  acceptedTypes?: string[]
}

export interface UseImageUploadReturn {
  images: ImageFile[]
  isCompressing: boolean
  isUploading: boolean
  uploadProgress: number
  error: string | null
  handleFiles: (files: FileList | File[]) => Promise<void>
  removeImage: (id: string) => void
  reorderImages: (startIndex: number, endIndex: number) => void
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>
  cleanup: () => void
  clearError: () => void
}

/**
 * useImageUpload Hook
 *
 * @example
 * ```tsx
 * function ProductImageManager() {
 *   const {
 *     images,
 *     isCompressing,
 *     handleFiles,
 *     removeImage,
 *     reorderImages,
 *   } = useImageUpload({
 *     maxSize: 5,
 *     maxWidth: 1920,
 *     maxHeight: 1080,
 *     maxImages: 10,
 *   })
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         multiple
 *         onChange={(e) => e.target.files && handleFiles(e.target.files)}
 *       />
 *       {images.map((img) => (
 *         <img key={img.id} src={img.preview} alt={img.alt} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    maxSize = 5,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxImages = 10,
    enableCompression = true,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  } = options

  const [images, setImages] = useState<ImageFile[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 追蹤 Blob URLs 以便清理記憶體
  const blobUrlsRef = useRef<Set<string>>(new Set())

  /**
   * 處理檔案選擇或拖放
   */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsCompressing(true)
      setError(null)
      const fileArray = Array.from(files)

      // 檢查檔案數量限制
      if (images.length + fileArray.length > maxImages) {
        setError(`最多只能上傳 ${maxImages} 張圖片`)
        setIsCompressing(false)
        return
      }

      const newImages: ImageFile[] = []
      const totalFiles = fileArray.length

      for (let i = 0; i < totalFiles; i++) {
        const file = fileArray[i]

        // 驗證檔案
        const validation = await validateImageFile(file, {
          maxSize,
          allowedTypes: acceptedTypes,
        })

        if (!validation.valid) {
          logger.warn('圖片檔案驗證失敗', {
            metadata: {
              context: 'useImageUpload',
              fileName: file.name,
              error: validation.error,
            },
          })
          setError(validation.error || '檔案驗證失敗')
          continue
        }

        try {
          // 壓縮圖片
          let processedFile = file
          if (enableCompression) {
            processedFile = await compressImage(file, {
              maxSizeMB: maxSize,
              maxWidthOrHeight: Math.max(maxWidth, maxHeight),
              quality,
            })
          }

          // 生成預覽 URL
          const preview = URL.createObjectURL(processedFile)
          blobUrlsRef.current.add(preview)

          // 取得圖片尺寸
          const dimensions = await getImageDimensions(processedFile)

          newImages.push({
            id: `image-${Date.now()}-${i}`,
            file: processedFile,
            preview,
            position: images.length + i,
            alt: file.name.replace(/\.[^/.]+$/, '') || `圖片 ${i + 1}`,
            width: dimensions.width,
            height: dimensions.height,
            size: processedFile.size,
          })

          // 更新進度
          setUploadProgress(((i + 1) / totalFiles) * 100)
        } catch (err) {
          logger.error('處理圖片失敗', err instanceof Error ? err : new Error('Unknown error'), {
            metadata: { fileName: file.name },
          })
          setError(`處理 ${file.name} 失敗`)
        }
      }

      setImages(prev => [...prev, ...newImages])
      setIsCompressing(false)
      setUploadProgress(0)

      logger.info('圖片處理完成', {
        metadata: {
          context: 'useImageUpload',
          processedCount: newImages.length,
          totalCount: images.length + newImages.length,
        },
      })
    },
    [
      images.length,
      maxImages,
      maxSize,
      maxWidth,
      maxHeight,
      quality,
      enableCompression,
      acceptedTypes,
    ]
  )

  /**
   * 刪除圖片
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
        blobUrlsRef.current.delete(image.preview)
      }
      return prev
        .filter(img => img.id !== id)
        .map((img, index) => ({
          ...img,
          position: index,
        }))
    })

    logger.info('圖片已刪除', {
      metadata: {
        context: 'useImageUpload',
        imageId: id,
      },
    })
  }, [])

  /**
   * 重新排序圖片
   */
  const reorderImages = useCallback((startIndex: number, endIndex: number) => {
    setImages(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)

      // 更新 position
      return result.map((img, index) => ({
        ...img,
        position: index,
      }))
    })

    logger.info('圖片順序已更新', {
      metadata: {
        context: 'useImageUpload',
        startIndex,
        endIndex,
      },
    })
  }, [])

  /**
   * 清理所有預覽 URL
   */
  const cleanup = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url)
    })
    blobUrlsRef.current.clear()

    logger.info('已清理所有預覽 URL', {
      metadata: { context: 'useImageUpload' },
    })
  }, [])

  /**
   * 清除錯誤訊息
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 元件卸載時清理所有 Blob URLs
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    images,
    isCompressing,
    isUploading,
    uploadProgress,
    error,
    handleFiles,
    removeImage,
    reorderImages,
    setImages,
    cleanup,
    clearError,
  }
}

/**
 * 取得圖片尺寸
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('無法載入圖片'))
    }

    img.src = url
  })
}
