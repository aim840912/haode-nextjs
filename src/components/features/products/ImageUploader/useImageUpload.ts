import { useState, useCallback } from 'react'
import { useCSRFTokenValue } from '@/hooks/useCSRFToken'
import { logger } from '@/lib/logger'
import { imageUrlValidator } from '@/lib/utils/image-url-validator'
import { validateImageFile, compressImage, getImagePreviewUrl } from '@/lib/utils/image-utils'
import type { UploadedImage, UploadResult } from './types'

interface UseImageUploadOptions {
  productId: string
  maxFiles: number
  generateMultipleSizes: boolean
  enableCompression: boolean
  useUnifiedAPI: boolean
  finalApiEndpoint: string
  finalIdParamName: string
  module?: string
  previewImages: UploadedImage[]
  onUploadSuccess?: (images: UploadedImage[]) => void
  onUploadError?: (error: string) => void
}

interface UseImageUploadReturn {
  isUploading: boolean
  uploadProgress: number
  errorMessage: string | null
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error'
  upload: (files: FileList | null) => Promise<UploadedImage[]>
  setPreviewImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>
}

export function useImageUpload(options: UseImageUploadOptions): UseImageUploadReturn {
  const {
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
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  )
  const [_previewImages, _setPreviewImages] = useState<UploadedImage[]>([])

  const csrfToken = useCSRFTokenValue()

  const upload = useCallback(
    async (files: FileList | null): Promise<UploadedImage[]> => {
      if (!files || files.length === 0) return []

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

      if (validFiles.length === 0) return []

      // 檢查檔案數量限制
      if (previewImages.length + validFiles.length > maxFiles) {
        const errorMsg = `檔案數量超過限制：最多只能上傳 ${maxFiles} 個檔案，目前已有 ${previewImages.length} 個，新增 ${validFiles.length} 個`
        setErrorMessage(errorMsg)
        setUploadStatus('error')
        onUploadError?.(errorMsg)
        return []
      }

      setIsUploading(true)
      setUploadProgress(0)
      setErrorMessage(null)
      setUploadStatus('uploading')

      try {
        const newImages: UploadedImage[] = []
        const MAX_CONCURRENT_UPLOADS = 2 // 限制並發上傳數量
        const UPLOAD_DELAY = 500 // 上傳間隔延遲 (毫秒)

        // 分批上傳以避免 429 錯誤
        for (let i = 0; i < validFiles.length; i += MAX_CONCURRENT_UPLOADS) {
          const batch = validFiles.slice(i, i + MAX_CONCURRENT_UPLOADS)

          // 處理當前批次
          const batchPromises = batch.map(async (file, batchIndex) => {
            const globalIndex = i + batchIndex
            setUploadProgress(((globalIndex + 1) / validFiles.length) * 100)

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
              id: `temp-${productId}-${Date.now()}-${globalIndex}`,
              url: '',
              path: '',
              size: 'medium',
              file: processedFile,
              preview: preview,
              position: previewImages.length + globalIndex,
              alt: `${processedFile.name} 預覽`,
            }

            // 立即添加到預覽列表
            _setPreviewImages(prev => [...prev, tempImage])

            try {
              // 準備上傳數據
              const formData = new FormData()
              formData.append('file', processedFile)

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

              // 上傳到伺服器
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

              const responseData = await response.json()
              const result = responseData.data as UploadResult

              if (useUnifiedAPI) {
                // 統一 API 回應格式
                if (result.multiple && result.images) {
                  // 多尺寸上傳結果
                  const uploadedImages: UploadedImage[] = result.images.map(
                    (img, index: number) => {
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
                  _setPreviewImages(prev => [
                    ...prev.filter(img => img.id !== tempImage.id),
                    ...uploadedImages,
                  ])
                  return uploadedImages
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
                  _setPreviewImages(prev =>
                    prev.map(img => (img.id === tempImage.id ? uploadedImage : img))
                  )
                  return [uploadedImage]
                }
              } else {
                // 舊 API 回應格式（向後相容）
                if (generateMultipleSizes && result.multiple) {
                  // 多尺寸上傳結果 - 直接替換臨時預覽
                  const uploadedImages: UploadedImage[] = []
                  Object.entries(result.urls || {}).forEach(([size, urlData], index) => {
                    const url = imageUrlValidator.clean(urlData.url) // 清理和驗證 URL
                    uploadedImages.push({
                      id: `${productId}-${size}-${Date.now()}-${globalIndex}`,
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
                  _setPreviewImages(prev => [
                    ...prev.filter(img => img.id !== tempImage.id),
                    ...uploadedImages,
                  ])
                  return uploadedImages
                } else {
                  // 單一尺寸上傳結果
                  const cleanUrl = imageUrlValidator.clean(result.url || '')
                  const uploadedImage: UploadedImage = {
                    id: `${productId}-${result.size || 'unknown'}-${Date.now()}-${globalIndex}`,
                    url: cleanUrl,
                    path: result.path || '',
                    size: result.size || 'medium',
                    file: processedFile,
                    preview: cleanUrl, // 使用清理後的 Supabase URL
                    position: tempImage.position,
                    alt: `${processedFile.name} (${result.size || 'medium'})`,
                  }

                  // 用上傳成功的圖片替換臨時預覽
                  _setPreviewImages(prev =>
                    prev.map(img => (img.id === tempImage.id ? uploadedImage : img))
                  )
                  return [uploadedImage]
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
              _setPreviewImages(prev =>
                prev.map(img =>
                  img.id === tempImage.id
                    ? {
                        ...img,
                        id: `local-${productId}-${Date.now()}-${globalIndex}`,
                        alt: `${processedFile.name} (上傳失敗)`,
                      }
                    : img
                )
              )
              throw uploadError // 重新拋出錯誤，讓外層 catch 處理
            }
            return []
          })

          // 等待當前批次完成
          const batchResults = await Promise.allSettled(batchPromises)

          // 處理批次結果
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              newImages.push(...result.value)
            }
          })

          // 如果不是最後一個批次，添加延遲避免速率限制
          if (i + MAX_CONCURRENT_UPLOADS < validFiles.length) {
            logger.info('批次上傳延遲', {
              metadata: {
                currentBatch: Math.floor(i / MAX_CONCURRENT_UPLOADS) + 1,
                totalBatches: Math.ceil(validFiles.length / MAX_CONCURRENT_UPLOADS),
                delay: UPLOAD_DELAY,
              },
            })
            await new Promise(resolve => setTimeout(resolve, UPLOAD_DELAY))
          }
        }

        setUploadStatus('success')
        onUploadSuccess?.(newImages)
        return newImages
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知錯誤'

        // 特別處理 429 錯誤
        let detailedError = `圖片上傳失敗: ${errorMsg}`
        if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('too many requests')) {
          detailedError = '上傳請求過於頻繁，請稍候再試。系統已自動限制上傳速度以確保穩定性。'
        } else if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
          detailedError = '上傳超時，請檢查網路連線或減少同時上傳的檔案數量。'
        } else {
          detailedError += '。請檢查網路連線後再試。'
        }

        logger.error('圖片上傳失敗', error instanceof Error ? error : new Error('Unknown error'), {
          metadata: {
            fileCount: validFiles.length,
            errorMessage: errorMsg,
            is429Error: errorMsg.includes('429'),
            maxConcurrentUploads: 2, // 記錄當前限制設定
          },
        })

        setErrorMessage(detailedError)
        setUploadStatus('error')
        onUploadError?.(detailedError)
        return []
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
      useUnifiedAPI,
      finalApiEndpoint,
      finalIdParamName,
      module,
    ]
  )

  return {
    isUploading,
    uploadProgress,
    errorMessage,
    uploadStatus,
    upload,
    setPreviewImages: _setPreviewImages,
  }
}
