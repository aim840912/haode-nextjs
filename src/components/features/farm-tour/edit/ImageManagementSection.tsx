/**
 * Image Management Section Component
 *
 * 圖片管理區塊元件
 * 處理現有圖片顯示、刪除、新圖片上傳
 */

'use client'

import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'

// 動態載入圖片上傳器
const ImageUploader = dynamic(
  () => import('@/components/features/products/ImageUploader').then(mod => mod.ImageUploader),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-900 dark:text-gray-100">
        載入圖片上傳器...
      </div>
    ),
    ssr: false,
  }
)

interface ImageManagementSectionProps {
  activityId: string
  existingImages: string[]
  uploadedImages: string[]
  imageDeleted: boolean
  onDeleteExistingImage: () => void
  onImageUploadSuccess: (
    images: {
      id: string
      url?: string
      path: string
      size: 'thumbnail' | 'medium' | 'large'
      file?: File
      preview?: string
      position: number
      alt?: string
    }[]
  ) => void
  onImageUploadError: (error: string) => void
}

export function ImageManagementSection({
  activityId,
  existingImages,
  uploadedImages,
  imageDeleted,
  onDeleteExistingImage,
  onImageUploadSuccess,
  onImageUploadError,
}: ImageManagementSectionProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-3">
        活動圖片(限一張)
      </label>

      {existingImages.length > 0 && !imageDeleted ? (
        // 顯示現有圖片
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={existingImages[0]}
              alt="現有活動圖片"
              className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-slate-600"
            />
            <button
              type="button"
              onClick={onDeleteExistingImage}
              className="absolute top-2 right-2 bg-red-500 dark:bg-red-600 text-white p-1.5 rounded-full hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
              title="刪除圖片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">如需更換圖片，請先刪除現有圖片</p>
        </div>
      ) : (
        // 顯示上傳區域
        <div className="space-y-3">
          <ImageUploader
            productId={activityId || uuidv4()}
            module="farm-tour"
            onUploadSuccess={onImageUploadSuccess}
            onUploadError={onImageUploadError}
            maxFiles={1}
            allowMultiple={false}
            generateMultipleSizes={false}
            enableCompression={true}
            className="mb-4"
          />
          {uploadedImages.length > 0 ? (
            <div className="text-sm text-green-600 dark:text-green-400">✓ 已上傳新圖片</div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">請上傳一張活動圖片</p>
          )}
        </div>
      )}
    </div>
  )
}
