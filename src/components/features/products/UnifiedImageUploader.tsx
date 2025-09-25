'use client'

import { useState, useEffect, useCallback } from 'react'
import SmartImageUploader from './SmartImageUploader'
import ImageUploader from './ImageUploader'

interface UploadedImage {
  id: string
  url?: string
  path: string
  size: 'thumbnail' | 'medium' | 'large'
  file?: File
  preview?: string
  position: number
  alt?: string
}

interface UnifiedImageUploaderProps {
  productId: string
  onUploadSuccess?: (images: UploadedImage[]) => void
  onUploadError?: (error: string) => void
  onDeleteSuccess?: (deletedImage: UploadedImage) => void
  maxFiles?: number
  allowMultiple?: boolean
  generateMultipleSizes?: boolean
  enableCompression?: boolean
  className?: string
  acceptedTypes?: string[]
  module?: string
  apiEndpoint?: string
  idParamName?: string
  initialImages?: string[]
  onDeleteInitialImage?: (imageUrl: string) => void
  csrfToken?: string | null
  /** 是否使用智慧上傳器 (默認 true) */
  useSmart?: boolean
  /** 統計回調 (僅智慧上傳器) */
  onStatsChange?: (stats: any) => void
  /** 是否禁用上傳器 */
  disabled?: boolean
}

/**
 * 統一圖片上傳元件
 *
 * 根據使用情境自動選擇：
 * - 產品模組：優先使用 SmartImageUploader
 * - 其他模組：使用傳統 ImageUploader
 */
export default function UnifiedImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  maxFiles = 5,
  allowMultiple = true,
  generateMultipleSizes = false,
  enableCompression = true,
  className = '',
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  module = 'products',
  apiEndpoint,
  idParamName,
  initialImages = [],
  onDeleteInitialImage,
  csrfToken,
  useSmart = true,
  onStatsChange,
  disabled = false,
}: UnifiedImageUploaderProps) {
  // 處理 SmartImageUploader 的圖片變更
  const handleSmartImagesChange = useCallback(
    (images: string[]) => {
      if (onUploadSuccess) {
        const convertedImages: UploadedImage[] = images.map((url, index) => ({
          id: `smart-${index}`,
          url,
          path: url,
          size: 'large' as const,
          position: index,
        }))
        onUploadSuccess(convertedImages)
      }
    },
    [onUploadSuccess]
  )

  // 處理統計（如果有提供回調）
  const handleStatsChange = useCallback(
    (stats: any) => {
      if (onStatsChange) {
        onStatsChange(stats)
      }
    },
    [onStatsChange]
  )

  // 產品模組且使用智慧上傳器
  if (module === 'products' && useSmart) {
    return (
      <div className={className}>
        <SmartImageUploader
          productId={productId}
          onImagesChange={handleSmartImagesChange}
          onStatsChange={handleStatsChange}
          maxImages={maxFiles}
          enabled={true}
          csrfToken={csrfToken}
        />
      </div>
    )
  }

  // 使用傳統 ImageUploader
  return (
    <ImageUploader
      productId={productId}
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      onDeleteSuccess={onDeleteSuccess}
      maxFiles={maxFiles}
      allowMultiple={allowMultiple}
      generateMultipleSizes={generateMultipleSizes}
      enableCompression={enableCompression}
      className={className}
      acceptedTypes={acceptedTypes}
      module={module}
      apiEndpoint={apiEndpoint}
      idParamName={idParamName}
      initialImages={initialImages}
      onDeleteInitialImage={onDeleteInitialImage}
    />
  )
}
