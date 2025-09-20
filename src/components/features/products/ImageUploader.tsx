'use client'

import { useState, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { validateImageFile, compressImage, getImagePreviewUrl } from '@/lib/image-utils'
import { imageUrlValidator } from '@/lib/image-url-validator'
import { useCSRFTokenValue } from '@/hooks/useCSRFToken'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'
import SortableImageGallery from '@/components/ui/image/SortableImageGallery'

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

interface UploadUrlData {
  url: string
  path: string
}

interface UploadResult {
  multiple?: boolean
  urls?: Record<string, UploadUrlData>
  // 統一 API 多圖結果
  images?: Array<{
    id: string
    url: string
    path: string
    size: 'thumbnail' | 'medium' | 'large'
  }>
  // 統一 API 單圖結果
  image?: {
    id: string
    url: string
    path: string
    size: 'thumbnail' | 'medium' | 'large'
  }
  // 單一上傳結果
  url?: string
  path?: string
  size?: 'thumbnail' | 'medium' | 'large'
}

interface ImageUploaderProps {
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
  // 新增統一 API 支援
  module?: string
  // 向後相容的舊 props
  apiEndpoint?: string
  idParamName?: string
}

export default function ImageUploader({
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
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewImages, setPreviewImages] = useState<UploadedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csrfToken = useCSRFTokenValue()

  // 決定使用統一 API 還是舊 API
  const useUnifiedAPI = !!module
  const finalApiEndpoint = useUnifiedAPI
    ? '/api/upload/unified'
    : apiEndpoint || '/api/upload/images'
  const finalIdParamName = useUnifiedAPI ? 'entityId' : idParamName

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const validFiles: File[] = []

      // 驗證檔案
      for (const file of fileArray) {
        const validation = await validateImageFile(file)
        if (validation.valid) {
          validFiles.push(file)
        } else {
          const errorMsg = `檔案「${file.name}」驗證失敗: ${validation.error || '未知錯誤'}`
          setErrorMessage(errorMsg)
          setUploadStatus('error')
          onUploadError?.(errorMsg)
        }
      }

      if (validFiles.length === 0) return

      // 檢查檔案數量限制
      if (previewImages.length + validFiles.length > maxFiles) {
        const errorMsg = `檔案數量超過限制：最多只能上傳 ${maxFiles} 個檔案，目前已有 ${previewImages.length} 個，新增 ${validFiles.length} 個`
        setErrorMessage(errorMsg)
        setUploadStatus('error')
        onUploadError?.(errorMsg)
        return
      }

      setIsUploading(true)
      setUploadProgress(0)
      setErrorMessage(null)
      setUploadStatus('uploading')

      try {
        const newImages: UploadedImage[] = []

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i]
          setUploadProgress(((i + 1) / validFiles.length) * 100)

          // 可選的圖片壓縮
          let processedFile = file
          if (enableCompression) {
            try {
              processedFile = await compressImage(file)
            } catch (error) {
              logger.warn('圖片壓縮失敗，使用原檔案', {
                metadata: {
                  context: 'compressImage',
                  error: error instanceof Error ? error.message : 'Unknown compression error',
                },
              })
            }
          }

          // 生成本地預覽（立即顯示）
          const preview = await getImagePreviewUrl(processedFile)

          // 先創建本地預覽圖片對象，讓用戶立即看到
          const tempImage: UploadedImage = {
            id: `temp-${productId}-${Date.now()}-${i}`,
            url: '',
            path: '',
            size: 'medium',
            file: processedFile,
            preview: preview,
            position: previewImages.length + i,
            alt: `${processedFile.name} 預覽`,
          }

          // 立即添加到預覽列表
          setPreviewImages(prev => [...prev, tempImage])

          try {
            // 上傳到伺服器
            const result = (await uploadImageToServer(
              processedFile,
              productId,
              generateMultipleSizes,
              csrfToken
            )) as UploadResult

            if (useUnifiedAPI) {
              // 統一 API 回應格式
              if (result.multiple && result.images) {
                // 多尺寸上傳結果
                const uploadedImages: UploadedImage[] = result.images.map(
                  (img: any, index: number) => {
                    const url = imageUrlValidator.clean(img.url)
                    return {
                      id: img.id,
                      url: url,
                      path: img.path,
                      size: img.size as 'thumbnail' | 'medium' | 'large',
                      file: processedFile,
                      preview: url,
                      position: tempImage.position + index,
                      alt: `${processedFile.name} (${img.size})`,
                    }
                  }
                )

                // 用上傳成功的圖片替換臨時預覽
                setPreviewImages(prev => [
                  ...prev.filter(img => img.id !== tempImage.id),
                  ...uploadedImages,
                ])
                newImages.push(...uploadedImages)
              } else if (result.image) {
                // 單一尺寸上傳結果
                const cleanUrl = imageUrlValidator.clean(result.image.url)
                const uploadedImage: UploadedImage = {
                  id: result.image.id,
                  url: cleanUrl,
                  path: result.image.path,
                  size: result.image.size,
                  file: processedFile,
                  preview: cleanUrl,
                  position: tempImage.position,
                  alt: `${processedFile.name} (${result.image.size})`,
                }

                // 用上傳成功的圖片替換臨時預覽
                setPreviewImages(prev =>
                  prev.map(img => (img.id === tempImage.id ? uploadedImage : img))
                )
                newImages.push(uploadedImage)
              }
            } else {
              // 舊 API 回應格式（向後相容）
              if (generateMultipleSizes && result.multiple) {
                // 多尺寸上傳結果 - 直接替換臨時預覽
                const uploadedImages: UploadedImage[] = []
                Object.entries(result.urls || {}).forEach(([size, urlData], index) => {
                  const url = imageUrlValidator.clean(urlData.url) // 清理和驗證 URL
                  uploadedImages.push({
                    id: `${productId}-${size}-${Date.now()}-${i}`,
                    url: url,
                    path: urlData.path,
                    size: size as 'thumbnail' | 'medium' | 'large',
                    file: processedFile,
                    preview: url, // 使用清理後的 Supabase URL
                    position: tempImage.position + index,
                    alt: `${processedFile.name} (${size})`,
                  })
                })

                // 用上傳成功的圖片替換臨時預覽
                setPreviewImages(prev => [
                  ...prev.filter(img => img.id !== tempImage.id),
                  ...uploadedImages,
                ])
                newImages.push(...uploadedImages)
              } else {
                // 單一尺寸上傳結果
                const cleanUrl = imageUrlValidator.clean(result.url || '')
                const uploadedImage: UploadedImage = {
                  id: `${productId}-${result.size || 'unknown'}-${Date.now()}-${i}`,
                  url: cleanUrl,
                  path: result.path || '',
                  size: result.size || 'medium',
                  file: processedFile,
                  preview: cleanUrl, // 使用清理後的 Supabase URL
                  position: tempImage.position,
                  alt: `${processedFile.name} (${result.size || 'medium'})`,
                }

                // 用上傳成功的圖片替換臨時預覽
                setPreviewImages(prev =>
                  prev.map(img => (img.id === tempImage.id ? uploadedImage : img))
                )
                newImages.push(uploadedImage)
              }
            }
          } catch (uploadError) {
            // 上傳失敗，保留本地預覽並更新 ID
            logger.error(
              '上傳失敗，保留本地預覽',
              uploadError instanceof Error ? uploadError : new Error('Unknown upload error'),
              {
                metadata: {
                  fileName: processedFile.name,
                  tempImageId: tempImage.id,
                },
              }
            )
            setPreviewImages(prev =>
              prev.map(img =>
                img.id === tempImage.id
                  ? {
                      ...img,
                      id: `local-${productId}-${Date.now()}-${i}`,
                      alt: `${processedFile.name} (上傳失敗)`,
                    }
                  : img
              )
            )
            throw uploadError // 重新拋出錯誤，讓外層 catch 處理
          }
        }

        setUploadStatus('success')
        onUploadSuccess?.(newImages)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知錯誤'
        const detailedError = `圖片上傳失敗: ${errorMsg}。請檢查網路連線後再試。`

        logger.error('圖片上傳失敗', error instanceof Error ? error : new Error('Unknown error'), {
          metadata: {
            fileCount: validFiles.length,
            errorMessage: errorMsg,
          },
        })

        setErrorMessage(detailedError)
        setUploadStatus('error')
        onUploadError?.(detailedError)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [
      productId,
      maxFiles,
      previewImages.length,
      generateMultipleSizes,
      enableCompression,
      onUploadSuccess,
      onUploadError,
      csrfToken,
    ]
  ) // uploadImageToServer 穩定，不需要在依賴中

  const uploadImageToServer = useCallback(
    async (
      file: File,
      productId: string,
      generateMultipleSizes: boolean,
      csrfToken: string | null
    ) => {
      const formData = new FormData()
      formData.append('file', file)

      if (useUnifiedAPI) {
        // 使用統一 API
        formData.append('module', module!)
        formData.append('entityId', productId)
        formData.append('generateMultipleSizes', generateMultipleSizes.toString())
        formData.append('position', '0')
      } else {
        // 使用舊 API (向後相容)
        formData.append(finalIdParamName, productId)
        formData.append('generateMultipleSizes', generateMultipleSizes.toString())
        formData.append('compress', 'false') // 已在前端壓縮
      }

      const headers: HeadersInit = {}
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch(finalApiEndpoint, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '上傳失敗')
      }

      const result = await response.json()
      return result.data
    },
    [useUnifiedAPI, module, finalIdParamName, finalApiEndpoint]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      handleFileSelect(files)
    },
    [handleFileSelect]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // 清空 input 值，允許重新選擇相同檔案
    e.target.value = ''
  }

  const handleRemoveImage = async (imageId: string) => {
    const imageToRemove = previewImages.find(img => img.id === imageId)
    if (!imageToRemove) return

    try {
      // 從伺服器刪除（如果有路径）
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

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳區域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? '放開以上傳圖片' : '拖放圖片到這裡'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              或者{' '}
              <button
                type="button"
                onClick={openFileDialog}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                點擊選擇檔案
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              支援 JPEG、PNG、WebP、AVIF 格式，單檔最大 10MB
              {allowMultiple && ` (最多 ${maxFiles} 個檔案)`}
            </p>
          </div>
        </div>

        {/* 上傳進度 */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <div className="mt-2 text-sm text-gray-600">
                上傳中... {Math.round(uploadProgress)}%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

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

// 簡化版的單圖片上傳元件
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
}: {
  productId: string
  onUploadSuccess?: (image: UploadedImage) => void
  onUploadError?: (error: string) => void
  onDelete?: () => void
  initialImage?: string
  size?: 'thumbnail' | 'medium' | 'large'
  className?: string
  module?: string
  apiEndpoint?: string
  idParamName?: string
  enableDelete?: boolean
}) {
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
