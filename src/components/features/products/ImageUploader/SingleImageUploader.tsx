'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageUploader } from './ImageUploader'
import type { SingleImageUploaderProps, UploadedImage } from './types'

export function SingleImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  onDelete,
  initialImage,
  size = 'medium',
  className = '',
  module,
  apiEndpoint,
  idParamName = 'productId',
  enableDelete = false,
}: SingleImageUploaderProps) {
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(
    initialImage
      ? {
          id: 'initial',
          url: initialImage,
          path: '',
          size,
          position: 0,
          alt: '當前圖片',
        }
      : null
  )

  const handleUploadSuccess = (images: UploadedImage[]) => {
    if (images.length > 0) {
      const newImage = images[0]
      setCurrentImage(newImage)
      onUploadSuccess?.(newImage)
    }
  }

  const handleDelete = () => {
    if (currentImage && window.confirm('確定要刪除這張圖片嗎？此操作無法復原。')) {
      setCurrentImage(null)
      onDelete?.()
    }
  }

  return (
    <div className={className}>
      {currentImage && (
        <div className="mb-4">
          <div className="aspect-square w-32 rounded-lg overflow-hidden border border-gray-200 relative group">
            <Image
              src={currentImage.url || '/images/placeholder.jpg'}
              alt="當前圖片"
              fill
              className="object-cover"
            />
            {enableDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="刪除圖片"
              >
                ×
              </button>
            )}
          </div>
          {enableDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              刪除圖片
            </button>
          )}
        </div>
      )}

      {!currentImage && (
        <ImageUploader
          productId={productId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={onUploadError}
          maxFiles={1}
          allowMultiple={false}
          generateMultipleSizes={false}
          module={module}
          apiEndpoint={apiEndpoint}
          idParamName={idParamName}
        />
      )}
    </div>
  )
}
