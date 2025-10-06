import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProductImage } from '@/types/product'
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
  closedDays: string
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

interface UseLocationFormOptions {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  locationId: string
  images: ProductImage[]
  setImages: React.Dispatch<React.SetStateAction<ProductImage[]>>
  existingImageUrl: string
  setExistingImageUrl: React.Dispatch<React.SetStateAction<string>>
  csrfToken: string | null
}

export function useLocationForm({
  formData,
  setFormData,
  locationId,
  images,
  setImages,
  existingImageUrl,
  setExistingImageUrl,
  csrfToken,
}: UseLocationFormOptions) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  /**
   * 處理輸入欄位變更
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }))
    },
    [setFormData]
  )

  /**
   * Features 欄位管理
   */
  const addFeatureField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }, [setFormData])

  const removeFeatureField = useCallback(
    (index: number) => {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index),
      }))
    },
    [setFormData]
  )

  const updateFeatureField = useCallback(
    (index: number, value: string) => {
      setFormData(prev => ({
        ...prev,
        features: prev.features.map((feature, i) => (i === index ? value : feature)),
      }))
    },
    [setFormData]
  )

  /**
   * Specialties 欄位管理
   */
  const addSpecialtyField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, ''],
    }))
  }, [setFormData])

  const removeSpecialtyField = useCallback(
    (index: number) => {
      setFormData(prev => ({
        ...prev,
        specialties: prev.specialties.filter((_, i) => i !== index),
      }))
    },
    [setFormData]
  )

  const updateSpecialtyField = useCallback(
    (index: number, value: string) => {
      setFormData(prev => ({
        ...prev,
        specialties: prev.specialties.map((specialty, i) => (i === index ? value : specialty)),
      }))
    },
    [setFormData]
  )

  /**
   * 處理圖片變更
   */
  const handleImagesChange = useCallback(
    (newImages: ProductImage[]) => {
      setImages(newImages)
      // 當選擇新圖片時，清除現有圖片 URL
      if (newImages.length > 0) {
        setExistingImageUrl('')
      }
    },
    [setImages, setExistingImageUrl]
  )

  /**
   * 處理刪除現有圖片
   */
  const handleDeleteExistingImage = useCallback(() => {
    if (confirm('確定要刪除現有圖片嗎？刪除後可以上傳新圖片。')) {
      setExistingImageUrl('')
      setFormData(prev => ({ ...prev, image: '' }))
      logger.info('現有圖片已標記為刪除', {
        metadata: { locationId },
      })
    }
  }, [locationId, setExistingImageUrl, setFormData])

  /**
   * 處理圖片刪除（從 Storage 完整刪除）
   */
  const handleImageDelete = useCallback(async () => {
    if (!locationId || !formData.image) {
      alert('沒有圖片可以刪除')
      return
    }

    // 顯示確認對話框
    if (!confirm('確定要刪除這張圖片嗎？')) {
      return
    }

    // 從 URL 提取 Storage 路徑
    const actualPath = extractStoragePathFromUrl(formData.image)

    if (!actualPath) {
      alert('無法確定檔案路徑，刪除失敗')
      return
    }

    try {
      logger.info('開始刪除門市圖片', {
        metadata: {
          locationId,
          imageUrl: formData.image,
          actualPath,
        },
      })

      const response = await fetch('/api/upload/locations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({
          locationId,
          path: actualPath,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setFormData(prev => ({ ...prev, image: '' }))
        setExistingImageUrl('')
        alert('圖片已成功刪除')
      } else {
        alert(result.error || '刪除失敗')
      }
    } catch (error) {
      logger.error('刪除圖片時發生錯誤', error instanceof Error ? error : new Error(String(error)))
      alert('刪除圖片時發生錯誤')
    }
  }, [locationId, formData.image, csrfToken, setFormData, setExistingImageUrl])

  /**
   * 提交表單
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
        // 決定要使用的圖片 URL：優先使用新上傳的圖片，否則使用現有圖片
        let imageUrl = ''
        if (images.length > 0) {
          imageUrl = images[0].storage_url // 使用新上傳的圖片
          logger.info('使用新上傳的圖片', {
            metadata: { imageUrl, locationId },
          })
        } else if (existingImageUrl) {
          imageUrl = existingImageUrl // 保持現有圖片
        }

        const response = await fetch(`/api/locations/${locationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            image: imageUrl,
            features: formData.features.filter(feature => feature.trim() !== ''),
            specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
            coordinates:
              formData.coordinates.lat || formData.coordinates.lng
                ? formData.coordinates
                : { lat: 23.5519, lng: 120.5564 }, // 台灣中心點作為預設值
          }),
        })
        const result = await response.json()

        if (result.success) {
          router.push('/admin/locations')
        } else {
          const errorMessage = result.error || '更新失敗'
          alert(errorMessage)
        }
      } catch (error) {
        logger.error(
          'Error updating location:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        alert('更新失敗')
      } finally {
        setLoading(false)
      }
    },
    [formData, images, existingImageUrl, locationId, router]
  )

  return {
    loading,
    handleInputChange,
    addFeatureField,
    removeFeatureField,
    updateFeatureField,
    addSpecialtyField,
    removeSpecialtyField,
    updateSpecialtyField,
    handleImagesChange,
    handleDeleteExistingImage,
    handleImageDelete,
    handleSubmit,
  }
}
