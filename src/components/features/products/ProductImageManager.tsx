'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { ProductImage } from '@/types/product'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='))
  return csrfCookie ? csrfCookie.split('=')[1] : null
}

interface ProductImageManagerProps {
  productId: string
  onImagesChange?: (images: ProductImage[]) => void
  maxImages?: number
  className?: string
  mode?: 'database' | 'memory'
}

export default function ProductImageManager({
  productId,
  onImagesChange,
  maxImages = 10,
  className = '',
  mode = 'database',
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 載入產品圖片
  const loadImages = useCallback(async () => {
    // 驗證 productId
    if (!productId || productId.trim() === '') {
      logger.warn('ProductImageManager: productId 為空，跳過載入', {
        metadata: { context: 'ProductImageManager', productId },
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
            context: 'ProductImageManager',
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

  useEffect(() => {
    // 記憶體模式不載入資料庫圖片
    if (mode === 'memory') {
      setIsLoading(false)
      return
    }

    // 只有當 productId 有效時才載入
    if (productId && productId.trim() !== '') {
      loadImages()
    } else {
      setIsLoading(false)
    }
  }, [productId, loadImages, mode])

  // 處理圖片上傳
  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return
    if (images.length + files.length > maxImages) {
      setError(`最多只能上傳 ${maxImages} 張圖片`)
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      logger.info('開始上傳產品圖片', {
        metadata: {
          context: 'ProductImageManager',
          productId,
          fileCount: files.length,
          mode,
        },
      })

      const csrfToken = getCSRFTokenFromCookie()

      // 上傳檔案到 Storage
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

      const uploadedImages = await Promise.all(uploadPromises)

      // 記憶體模式：只更新本地狀態
      if (mode === 'memory') {
        const newImages = uploadedImages.map((img, index) => ({
          id: `temp-${Date.now()}-${index}`,
          entity_id: productId,
          storage_url: img.url || img.storage_url,
          file_path: img.path || img.file_path,
          alt_text: img.alt || img.alt_text || `產品圖片 ${index + 1}`,
          display_position: images.length + index,
          size: 'medium' as const,
          width: img.width,
          height: img.height,
          file_size: img.file_size,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          module: 'products',
        }))

        const updatedImages = [...images, ...newImages]
        setImages(updatedImages)
        onImagesChange?.(updatedImages)

        logger.info('圖片上傳完成（記憶體模式）', {
          metadata: {
            context: 'ProductImageManager',
            productId,
            uploadCount: files.length,
            totalImages: updatedImages.length,
          },
        })

        return
      }

      // 資料庫模式：統一 API 已經完成所有操作，直接重新載入
      logger.info('產品圖片上傳完成（資料庫模式）', {
        metadata: {
          context: 'ProductImageManager',
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
  }

  // 刪除圖片
  const handleDelete = async (imageId: string) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return

    try {
      // 記憶體模式：只更新本地狀態
      if (mode === 'memory') {
        const newImages = images.filter(img => img.id !== imageId)
        setImages(newImages)
        onImagesChange?.(newImages)

        logger.info('刪除圖片成功（記憶體模式）', {
          metadata: {
            context: 'ProductImageManager',
            productId,
            imageId,
          },
        })
        return
      }

      // 資料庫模式：使用統一 API 刪除
      const csrfToken = getCSRFTokenFromCookie()
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
          context: 'ProductImageManager',
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
  }

  // 設定主圖
  const handleSetPrimary = async (imageId: string) => {
    try {
      const targetImage = images.find(img => img.id === imageId)
      if (!targetImage) return

      // 重新排序: 目標圖片設為 position 0，其他順延
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

      const csrfToken = getCSRFTokenFromCookie()
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
          context: 'ProductImageManager',
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
  }

  // 拖放排序
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    // 更新 display_position
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      display_position: idx,
    }))

    setImages(updatedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    try {
      const imageOrders = images.map((img, index) => ({
        id: img.id,
        position: index,
      }))

      const csrfToken = getCSRFTokenFromCookie()
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
        throw new Error('更新排序失敗')
      }

      onImagesChange?.(images)

      logger.info('圖片排序更新成功', {
        metadata: {
          context: 'ProductImageManager',
          productId,
          imageCount: images.length,
        },
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新排序失敗'
      setError(errorMsg)
      logger.error('更新圖片排序失敗', err instanceof Error ? err : new Error(errorMsg), {
        metadata: { productId },
      })
      loadImages()
    } finally {
      setDraggedIndex(null)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 上傳區域 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={isUploading || images.length >= maxImages}
          onChange={e => e.target.files && handleUpload(e.target.files)}
          className="hidden"
          id={`image-upload-${productId}`}
        />
        <label
          htmlFor={`image-upload-${productId}`}
          className="flex flex-col items-center cursor-pointer"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm text-gray-600">
            {isUploading ? '上傳中...' : `點擊上傳圖片 (${images.length}/${maxImages})`}
          </p>
          <p className="text-xs text-gray-500 mt-1">支援 JPG, PNG, WebP 格式</p>
        </label>
      </div>

      {/* 圖片網格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                image.display_position === 0
                  ? 'border-amber-500 ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-gray-300'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* 主圖標籤 */}
              {image.display_position === 0 && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full z-10">
                  主圖
                </div>
              )}

              {/* 圖片 */}
              <div className="aspect-square relative">
                <Image
                  src={image.storage_url}
                  alt={image.alt_text || '產品圖片'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              {/* 操作按鈕 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {image.display_position !== 0 && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="設為主圖"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  title="刪除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* 位置指示器 */}
              <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空狀態 */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>尚未上傳任何圖片</p>
          <p className="text-sm mt-1">請點擊上方區域上傳產品圖片</p>
        </div>
      )}
    </div>
  )
}
