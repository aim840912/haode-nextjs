'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import { useProductImageManager, PendingImageChanges } from '@/hooks/useProductImageManager'
import { ProductImage } from '@/types/product'

export type { PendingImageChanges } from '@/hooks/useProductImageManager'

interface ProductImageManagerProps {
  productId: string
  onImagesChange?: (images: ProductImage[]) => void
  maxImages?: number
  className?: string
  mode?: 'database' | 'memory' | 'edit'
  onPendingChanges?: (hasPendingChanges: boolean) => void
  onGetPendingChanges?: React.MutableRefObject<() => PendingImageChanges>
}

export default function ProductImageManager({
  productId,
  onImagesChange,
  maxImages = 10,
  className = '',
  mode = 'database',
  onPendingChanges,
  onGetPendingChanges,
}: ProductImageManagerProps) {
  const {
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
  } = useProductImageManager({
    productId,
    mode,
    maxImages,
    onImagesChange,
    onPendingChanges,
  })

  // 拖放狀態
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // 提供 getPendingChanges 給父元件
  useEffect(() => {
    if (onGetPendingChanges && mode === 'edit') {
      onGetPendingChanges.current = getPendingChanges
    }
  }, [onGetPendingChanges, getPendingChanges, mode])

  // 拖放處理
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

    handleReorder(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 上傳區域 */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
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
            className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isUploading ? '上傳中...' : `點擊上傳圖片 (${images.length}/${maxImages})`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            支援 JPG, PNG, WebP 格式，單檔最大 5MB
          </p>
        </label>
      </div>

      {/* 圖片網格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const isPendingDelete = mode === 'edit' && pendingDeletes.has(image.id)

            return (
              <div
                key={image.id}
                draggable={!isPendingDelete}
                onDragStart={() => !isPendingDelete && handleDragStart(index)}
                onDragOver={e => !isPendingDelete && handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-lg overflow-hidden transition-all ${
                  isPendingDelete
                    ? 'border-2 border-dashed border-red-400 opacity-60 cursor-not-allowed'
                    : `cursor-move border-2 ${
                        image.display_position === 0
                          ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                {/* 待刪除標籤 */}
                {isPendingDelete && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    待刪除
                  </div>
                )}

                {/* 主圖標籤 */}
                {!isPendingDelete && image.display_position === 0 && (
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
                  {isPendingDelete ? (
                    <button
                      onClick={() => handleCancelDelete(image.id)}
                      className="bg-green-500 text-white px-3 py-2 rounded-full hover:bg-green-600 transition-colors text-sm font-medium"
                      title="取消刪除"
                    >
                      取消刪除
                    </button>
                  ) : (
                    <>
                      {image.display_position !== 0 && mode === 'database' && (
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
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* 位置指示器 */}
                {!isPendingDelete && (
                  <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 空狀態 */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
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
