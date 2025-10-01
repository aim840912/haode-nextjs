import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { ProductFormData } from './useProductForm'

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface UseProductSubmitReturn {
  submitStatus: SubmitStatus
  submitError: string | null
  submitSuccess: string | null
  isSubmitting: boolean
  submitProduct: (
    productId: string,
    formData: ProductFormData,
    tempImages: any[]
  ) => Promise<boolean>
  resetSubmitState: () => void
}

/**
 * 產品提交邏輯 Hook
 * 負責處理產品建立的 API 呼叫和圖片處理
 */
export function useProductSubmit(): UseProductSubmitReturn {
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // 將圖片檔案轉換為 Base64
  const convertImageToBase64 = useCallback(
    (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === 'string') {
            resolve(result)
          } else {
            reject(new Error(`圖片 "${file.name}" 讀取失敗：結果格式錯誤`))
          }
        }
        reader.onerror = () => {
          const error = reader.error
          reject(new Error(`圖片 "${file.name}" 讀取失敗：${error?.message || '未知錯誤'}`))
        }
        reader.readAsDataURL(file)
      }),
    []
  )

  // 處理圖片資料
  const processImages = useCallback(
    async (tempImages: any[], formData: ProductFormData) => {
      return Promise.all(
        tempImages.map(async (img, index) => {
          if (img._originalFile) {
            // 記憶體模式：轉換 File 為 Base64
            const file = img._originalFile

            // 檔案大小檢查 (5MB)
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(
                `圖片檔案 "${file.name}" 過大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，請選擇小於 5MB 的圖片`
              )
            }

            const base64Data = await convertImageToBase64(file)

            return {
              base64Data,
              fileName: file.name,
              alt: img.alt || `${formData.name} - 圖片 ${index + 1}`,
              position: img.position ?? index,
              size: img.size || 'medium',
              width: img.width,
              height: img.height,
              file_size: img.file_size || file.size,
            }
          } else {
            // 已上傳模式：使用現有的 URL/path
            return {
              url: img.storage_url || img.url,
              path: img.file_path || img.path,
              alt: img.alt || `${formData.name} - 圖片 ${index + 1}`,
              position: img.position ?? index,
              size: img.size || 'medium',
              width: img.width,
              height: img.height,
              file_size: img.file_size,
            }
          }
        })
      )
    },
    [convertImageToBase64]
  )

  // 提交產品
  const submitProduct = useCallback(
    async (productId: string, formData: ProductFormData, tempImages: any[]): Promise<boolean> => {
      // 防重複提交
      if (submitStatus !== 'idle' || hasSubmitted) {
        logger.warn('阻止重複提交', {
          metadata: {
            submitStatus,
            hasSubmitted,
            productId,
            timestamp: new Date().toISOString(),
          },
        })
        return false
      }

      // 鎖定狀態
      setSubmitStatus('submitting')
      setHasSubmitted(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      try {
        const productData = {
          id: productId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          priceUnit: formData.priceUnit,
          unitQuantity: formData.unitQuantity,
          inventory: formData.inventory,
          isActive: formData.isActive,
        }

        // 處理圖片資料
        const imagesData = await processImages(tempImages, formData)

        logger.info('開始事務式建立產品', {
          metadata: {
            productId,
            productName: formData.name,
            imageCount: imagesData.length,
            submitStatus: 'submitting',
          },
        })

        const response = await fetch('/api/admin/products/create-with-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product: productData,
            images: imagesData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '建立失敗' }))
          throw new Error(errorData.message || `建立失敗 (${response.status})`)
        }

        const result = await response.json()

        // 成功處理
        setSubmitStatus('success')
        setSubmitSuccess('產品建立成功！即將跳轉...')

        logger.info('產品建立成功', {
          metadata: {
            productId: productId,
            productName: formData.name,
            imageCount: imagesData.length,
            executionTime: result.data?.meta?.executionTime,
            submitStatus: 'success',
          },
        })

        return true
      } catch (error) {
        // 錯誤處理
        setSubmitStatus('error')
        const errorMessage = error instanceof Error ? error.message : '建立失敗，請重試'
        setSubmitError(errorMessage)

        // 重置提交標記，允許重試
        setHasSubmitted(false)

        logger.error('產品建立失敗', error as Error, {
          metadata: {
            formData: { name: formData.name, category: formData.category },
            submitStatus: 'error',
          },
        })

        return false
      }
    },
    [submitStatus, hasSubmitted, processImages]
  )

  // 重置提交狀態
  const resetSubmitState = useCallback(() => {
    setSubmitStatus('idle')
    setSubmitError(null)
    setSubmitSuccess(null)
    setHasSubmitted(false)
  }, [])

  return {
    submitStatus,
    submitError,
    submitSuccess,
    isSubmitting: submitStatus === 'submitting',
    submitProduct,
    resetSubmitState,
  }
}
