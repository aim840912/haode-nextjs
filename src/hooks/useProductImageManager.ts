/**
 * useProductImageManager Hook
 *
 * 統一的產品圖片管理 hook，支援三種操作模式：
 * - database: 立即上傳到 Supabase
 * - memory: 僅在記憶體中處理（產品建立流程）
 * - edit: 追蹤待處理變更（編輯模式）
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCSRFTokenValue } from '@/hooks/useCSRFToken'
import { logger } from '@/lib/logger'
import { ProductImage } from '@/types/product'

export interface PendingImageChanges {
  deletedIds: string[]
  newImages: File[]
  reorderedImages: { id: string; position: number }[]
}

interface UseProductImageManagerOptions {
  productId: string
  mode?: 'database' | 'memory' | 'edit'
  maxImages?: number
  onImagesChange?: (images: ProductImage[]) => void
  onPendingChanges?: (hasPendingChanges: boolean) => void
}

interface UseProductImageManagerReturn {
  // 圖片狀態
  images: ProductImage[]
  isLoading: boolean
  isUploading: boolean
  error: string | null

  // 操作方法
  handleUpload: (files: FileList) => Promise<void>
  handleDelete: (imageId: string) => Promise<void>
  handleReorder: (newImages: ProductImage[]) => void
  handleSetPrimary: (imageId: string) => Promise<void>
  handleCancelDelete: (imageId: string) => void

  // Edit 模式專用
  getPendingChanges: () => PendingImageChanges
  pendingDeletes: Set<string>
  pendingUploads: File[]
  hasReordered: boolean

  // 記憶體管理
  cleanup: () => void
}

/**
 * useProductImageManager Hook
 */
export function useProductImageManager(
  options: UseProductImageManagerOptions
): UseProductImageManagerReturn {
  const { productId, mode = 'database', maxImages = 10, onImagesChange, onPendingChanges } = options

  // 狀態管理
  const [images, setImages] = useState<ProductImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit 模式狀態
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set())
  const [pendingUploads, setPendingUploads] = useState<File[]>([])
  const [hasReordered, setHasReordered] = useState(false)

  // Blob URLs 追蹤
  const blobUrlsRef = useRef<Set<string>>(new Set())

  // CSRF Token
  const csrfToken = useCSRFTokenValue()

  // 清理單一 Blob URL
  const revokeBlobUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
      blobUrlsRef.current.delete(url)
    }
  }, [])

  // 清理所有 Blob URLs
  const cleanup = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url)
    })
    blobUrlsRef.current.clear()
  }, [])

  // 載入圖片（database/edit 模式）
  const loadImages = useCallback(async () => {
    if (!productId || productId.trim() === '') {
      logger.warn('useProductImageManager: productId 為空，跳過載入', {
        metadata: { context: 'useProductImageManager', productId },
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/upload/unified?module=products&entityId=${encodeURIComponent(productId)}`
      )

      if (!response.ok) {
        throw new Error('載入圖片失敗')
      }

      const data = await response.json()
      if (data.success && data.data.images) {
        const sortedImages = data.data.images
        setImages(sortedImages)
        onImagesChange?.(sortedImages)

        logger.info('產品圖片載入成功', {
          metadata: {
            context: 'useProductImageManager',
            productId,
            imageCount: sortedImages.length,
          },
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '載入圖片失敗'
      setError(errorMsg)
      logger.error('載入產品圖片失敗', err instanceof Error ? err : new Error(errorMsg), {
        metadata: { productId },
      })
    } finally {
      setIsLoading(false)
    }
  }, [productId, onImagesChange])

  // 初始載入
  useEffect(() => {
    if (mode === 'memory') {
      setIsLoading(false)
      return
    }

    if (productId && productId.trim() !== '') {
      loadImages()
    } else {
      setIsLoading(false)
    }
  }, [productId, loadImages, mode])

  // Edit 模式：通知父元件變更狀態
  useEffect(() => {
    if (mode === 'edit') {
      const hasPendingChanges = pendingDeletes.size > 0 || pendingUploads.length > 0 || hasReordered
      onPendingChanges?.(hasPendingChanges)
    }
  }, [mode, pendingDeletes, pendingUploads, hasReordered, onPendingChanges])

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // 處理圖片上傳
  const handleUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return
      if (images.length + files.length > maxImages) {
        setError(`最多只能上傳 ${maxImages} 張圖片`)
        return
      }

      try {
        setIsUploading(true)
        setError(null)

        // 檢查檔案大小
        const oversizedFiles = Array.from(files).filter(file => file.size > 5 * 1024 * 1024)
        if (oversizedFiles.length > 0) {
          const fileNames = oversizedFiles
            .map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`)
            .join(', ')
          setError(`以下檔案過大，請選擇小於 5MB 的圖片：${fileNames}`)
          setIsUploading(false)
          return
        }

        logger.info('開始上傳產品圖片', {
          metadata: {
            context: 'useProductImageManager',
            productId,
            fileCount: files.length,
            mode,
          },
        })

        // Edit 模式：只在記憶體中處理
        if (mode === 'edit') {
          const newImages = Array.from(files).map((file, index) => {
            const previewUrl = URL.createObjectURL(file)
            blobUrlsRef.current.add(previewUrl)

            return {
              id: `pending-${Date.now()}-${index}`,
              entity_id: productId,
              storage_url: previewUrl,
              file_path: `pending/${file.name}`,
              alt_text: file.name.replace(/\.[^/.]+$/, '') || `產品圖片 ${index + 1}`,
              display_position: images.length + index,
              size: 'medium' as const,
              width: undefined,
              height: undefined,
              file_size: file.size,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              module: 'products',
              _originalFile: file,
            }
          })

          const updatedImages = [...images, ...newImages]
          setImages(updatedImages)
          onImagesChange?.(updatedImages)
          setPendingUploads(prev => [...prev, ...Array.from(files)])

          logger.info('圖片新增完成（編輯模式）', {
            metadata: {
              context: 'useProductImageManager',
              productId,
              uploadCount: files.length,
            },
          })

          return
        }

        // Memory 模式：只在記憶體中處理
        if (mode === 'memory') {
          const newImages = Array.from(files).map((file, index) => {
            const previewUrl = URL.createObjectURL(file)
            blobUrlsRef.current.add(previewUrl)

            return {
              id: `temp-${Date.now()}-${index}`,
              entity_id: productId,
              storage_url: previewUrl,
              file_path: `temp/${file.name}`,
              alt_text: file.name.replace(/\.[^/.]+$/, '') || `產品圖片 ${index + 1}`,
              display_position: images.length + index,
              size: 'medium' as const,
              width: undefined,
              height: undefined,
              file_size: file.size,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              module: 'products',
              _originalFile: file,
            }
          })

          const updatedImages = [...images, ...newImages]
          setImages(updatedImages)
          onImagesChange?.(updatedImages)

          logger.info('圖片上傳完成（記憶體模式）', {
            metadata: {
              context: 'useProductImageManager',
              productId,
              uploadCount: files.length,
            },
          })

          return
        }

        // Database 模式：實際上傳到 Supabase
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
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '上傳失敗'
        setError(errorMsg)
        logger.error('上傳產品圖片失敗', err instanceof Error ? err : new Error(errorMsg), {
          metadata: { productId, fileCount: files.length, mode },
        })
      } finally {
        setIsUploading(false)
      }
    },
    [mode, images, maxImages, productId, csrfToken, onImagesChange, loadImages]
  )

  // 取消刪除圖片（僅 edit 模式）
  const handleCancelDelete = useCallback(
    (imageId: string) => {
      setPendingDeletes(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })

      logger.info('取消刪除圖片', {
        metadata: {
          context: 'useProductImageManager',
          productId,
          imageId,
        },
      })
    },
    [productId]
  )

  // 刪除圖片
  const handleDelete = useCallback(
    async (imageId: string) => {
      try {
        // Edit 模式：標記為待刪除或直接移除
        if (mode === 'edit') {
          const imageToDelete = images.find(img => img.id === imageId)
          if (!imageToDelete) return

          if (imageId.startsWith('pending-')) {
            revokeBlobUrl(imageToDelete.storage_url)
            setPendingUploads(prev =>
              prev.filter((_, index) => `pending-${Date.now()}-${index}` !== imageId)
            )
            const newImages = images.filter(img => img.id !== imageId)
            setImages(newImages)
            onImagesChange?.(newImages)
          } else {
            setPendingDeletes(prev => new Set(prev).add(imageId))
          }

          logger.info('圖片標記為待刪除（編輯模式）', {
            metadata: {
              context: 'useProductImageManager',
              productId,
              imageId,
              isPending: imageId.startsWith('pending-'),
            },
          })
          return
        }

        // Memory 模式：只更新本地狀態
        if (mode === 'memory') {
          const imageToDelete = images.find(img => img.id === imageId)
          if (imageToDelete) {
            revokeBlobUrl(imageToDelete.storage_url)
          }

          const newImages = images.filter(img => img.id !== imageId)
          setImages(newImages)
          onImagesChange?.(newImages)

          logger.info('刪除圖片成功（記憶體模式）', {
            metadata: {
              context: 'useProductImageManager',
              productId,
              imageId,
            },
          })
          return
        }

        // Database 模式：使用統一 API 刪除
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken
        }

        const response = await fetch('/api/upload/unified', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ imageId }),
        })

        if (!response.ok) {
          throw new Error('刪除圖片失敗')
        }

        const newImages = images.filter(img => img.id !== imageId)
        setImages(newImages)
        onImagesChange?.(newImages)

        logger.info('刪除圖片成功（資料庫模式）', {
          metadata: {
            context: 'useProductImageManager',
            productId,
            imageId,
          },
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '刪除失敗'
        setError(errorMsg)
        logger.error('刪除圖片失敗', err instanceof Error ? err : new Error(errorMsg), {
          metadata: { productId, imageId, mode },
        })
      }
    },
    [mode, images, productId, csrfToken, onImagesChange, revokeBlobUrl]
  )

  // 重新排序
  const handleReorder = useCallback(
    (newImages: ProductImage[]) => {
      const updatedImages = newImages.map((img, index) => ({
        ...img,
        display_position: index,
      }))

      setImages(updatedImages)

      if (mode === 'edit') {
        setHasReordered(true)
        onImagesChange?.(updatedImages)

        logger.info('圖片排序更新（編輯模式）', {
          metadata: {
            context: 'useProductImageManager',
            productId,
            imageCount: updatedImages.length,
          },
        })
      } else if (mode === 'memory') {
        onImagesChange?.(updatedImages)
      }
      // Database 模式需要在拖放結束時調用 API
    },
    [mode, productId, onImagesChange]
  )

  // 設定主圖
  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      try {
        const targetImage = images.find(img => img.id === imageId)
        if (!targetImage) return

        // 重新排序: 目標圖片設為 position 0
        const imageOrders = images.map(img => {
          if (img.id === imageId) {
            return { id: img.id, position: 0 }
          }
          const currentPos = img.display_position
          return {
            id: img.id,
            position: currentPos < targetImage.display_position ? currentPos : currentPos + 1,
          }
        })

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken
        }

        const response = await fetch('/api/upload/unified', {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            action: 'reorder',
            module: 'products',
            entityId: productId,
            images: imageOrders.map(order => ({ id: order.id, display_position: order.position })),
          }),
        })

        if (!response.ok) {
          throw new Error('設定主圖失敗')
        }

        await loadImages()

        logger.info('設定主圖成功', {
          metadata: {
            context: 'useProductImageManager',
            productId,
            imageId,
          },
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '設定主圖失敗'
        setError(errorMsg)
        logger.error('設定主圖失敗', err instanceof Error ? err : new Error(errorMsg), {
          metadata: { productId, imageId },
        })
      }
    },
    [images, productId, csrfToken, loadImages]
  )

  // 取得待處理變更
  const getPendingChanges = useCallback((): PendingImageChanges => {
    return {
      deletedIds: Array.from(pendingDeletes),
      newImages: pendingUploads,
      reorderedImages: hasReordered
        ? images.map((img, index) => ({ id: img.id, position: index }))
        : [],
    }
  }, [pendingDeletes, pendingUploads, hasReordered, images])

  return {
    images,
    isLoading,
    isUploading,
    error,
    handleUpload,
    handleDelete,
    handleReorder,
    handleSetPrimary,
    handleCancelDelete,
    getPendingChanges,
    pendingDeletes,
    pendingUploads,
    hasReordered,
    cleanup,
  }
}
