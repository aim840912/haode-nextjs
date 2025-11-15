import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { extractStoragePathFromUrl } from '@/lib/utils/image-url-utils'

interface FormData {
  name: string
  title: string
  address: string
  landmark: string
  phone: string
  lineId: string
  hours: string
  closedDays: string[]
  parking: string
  publicTransport: string
  features: string[]
  specialties: string[]
  coordinates: {
    lat: number
    lng: number
  }
  image: string
  isMain: boolean
}

interface UseLocationFormSubmitProps {
  locationId: string
  uploadedImages: string[]
  existingImages: string[]
  imagePaths: Map<string, string>
}

export function useLocationFormSubmit({
  locationId,
  uploadedImages,
  existingImages,
  imagePaths,
}: UseLocationFormSubmitProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  /**
   * 處理表單提交
   */
  const handleSubmit = useCallback(
    async (formData: FormData): Promise<{ success: boolean; error?: string }> => {
      if (!locationId) {
        return { success: false, error: '無效的門市 ID' }
      }

      setLoading(true)

      try {
        // 決定要使用的圖片 URL
        let imageUrl = ''
        if (uploadedImages.length > 0) {
          imageUrl = uploadedImages[0]
        } else if (existingImages.length > 0) {
          imageUrl = existingImages[0]
        }

        // 準備提交資料
        const submitData = {
          ...formData,
          image: imageUrl,
          features: formData.features.filter(feature => feature.trim() !== ''),
          specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
          coordinates:
            formData.coordinates.lat || formData.coordinates.lng
              ? formData.coordinates
              : { lat: 23.5519, lng: 120.5564 }, // 台灣中心點作為預設值
        }

        const response = await fetch(`/api/locations/${locationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })

        const result = await response.json()

        if (result.success) {
          router.push('/admin/locations')
          router.refresh()
          return { success: true }
        } else {
          return { success: false, error: result.error || '更新失敗' }
        }
      } catch (error) {
        logger.error('更新門市失敗', error instanceof Error ? error : new Error('Unknown error'), {
          module: 'LocationFormSubmit',
          action: 'handleSubmit',
          metadata: { locationId },
        })
        return { success: false, error: '更新失敗，請稍後再試' }
      } finally {
        setLoading(false)
      }
    },
    [locationId, uploadedImages, existingImages, router]
  )

  /**
   * 處理圖片刪除
   */
  const handleImageDelete = useCallback(
    async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
      if (!locationId || !imageUrl) {
        return { success: false, error: '沒有圖片可以刪除' }
      }

      // 確認刪除
      if (!confirm('確定要刪除這張圖片嗎？')) {
        return { success: false, error: '取消刪除' }
      }

      // 獲取實際的儲存路徑
      let actualPath = imagePaths.get(imageUrl)
      if (!actualPath) {
        actualPath = extractStoragePathFromUrl(imageUrl)
      }

      if (!actualPath) {
        return { success: false, error: '無法確定檔案路徑，刪除失敗' }
      }

      try {
        const response = await fetch('/api/images/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: actualPath }),
        })

        const result = await response.json()

        if (result.success) {
          return { success: true }
        } else {
          return { success: false, error: result.error || '刪除圖片失敗' }
        }
      } catch (error) {
        logger.error('刪除圖片失敗', error instanceof Error ? error : new Error('Unknown error'), {
          module: 'LocationFormSubmit',
          action: 'handleImageDelete',
          metadata: { locationId, imagePath: actualPath },
        })
        return { success: false, error: '刪除圖片失敗，請稍後再試' }
      }
    },
    [locationId, imagePaths]
  )

  return {
    handleSubmit,
    handleImageDelete,
    isSubmitting: loading,
  }
}
