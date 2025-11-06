import { useState, useCallback } from 'react'
import { createFarmTourWithImages } from '@/lib/api/admin-api'
import { logger } from '@/lib/logger'
import { ProductImage } from '@/types/product'

export interface FarmTourFormData {
  start_month: number
  end_month: number
  title: string
  activities: string[]
  price: number
  available: boolean
  note: string
}

export interface FarmTourFieldErrors {
  title: string
  activities: string
  price: string
  start_month: string
  end_month: string
}

export interface UseFarmTourSubmitReturn {
  submitError: string | null
  submitSuccess: string | null
  loading: boolean
  submitActivity: (
    activityId: string,
    formData: FarmTourFormData,
    images: ProductImage[]
  ) => Promise<boolean>
}

/**
 * Farm Tour 活動提交邏輯 Hook
 * 負責處理活動建立的 API 呼叫和圖片處理
 */
export function useFarmTourSubmit(): UseFarmTourSubmitReturn {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

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

  // 提交活動
  const submitActivity = useCallback(
    async (
      activityId: string,
      formData: FarmTourFormData,
      images: ProductImage[]
    ): Promise<boolean> => {
      setLoading(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      try {
        // 檢查圖片（必須有）
        if (images.length === 0) {
          setSubmitError('請先上傳活動圖片')
          setLoading(false)
          return false
        }

        // 處理圖片資料
        let imageData = null
        const img = images[0]

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

          imageData = {
            base64Data,
            fileName: file.name,
            alt: img.alt_text || `${formData.title} - 圖片`,
            size: img.size || 'medium',
            file_size: file.size,
          }
        } else if (img.storage_url) {
          // 已上傳模式：使用現有的 URL
          imageData = {
            url: img.storage_url,
            alt: img.alt_text || `${formData.title} - 圖片`,
            size: img.size || 'medium',
          }
        }

        if (!imageData) {
          throw new Error('無法處理圖片資料')
        }

        // 準備活動資料
        const activityData = {
          id: activityId,
          start_month: formData.start_month,
          end_month: formData.end_month,
          title: formData.title,
          activities: formData.activities.filter(activity => activity.trim() !== ''),
          price: formData.price,
          available: formData.available,
          note: formData.note || '',
        }

        logger.info('開始事務式建立農場體驗活動', {
          metadata: {
            activityId,
            activityTitle: formData.title,
            hasImage: !!imageData,
          },
        })

        // 提交到事務式 API
        await createFarmTourWithImages({
          activity: activityData,
          image: imageData,
        })

        setSubmitSuccess('農場活動新增成功！')

        logger.info('農場體驗活動建立成功', {
          metadata: {
            activityId,
            activityTitle: formData.title,
            hasImage: !!imageData,
          },
        })

        return true
      } catch (error) {
        logger.error(
          'Error creating farm tour activity:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        setSubmitError(
          error instanceof Error ? `錯誤：${error.message}` : '網路錯誤，請檢查網路連線後再試'
        )
        return false
      } finally {
        setLoading(false)
      }
    },
    [convertImageToBase64]
  )

  return {
    submitError,
    submitSuccess,
    loading,
    submitActivity,
  }
}
