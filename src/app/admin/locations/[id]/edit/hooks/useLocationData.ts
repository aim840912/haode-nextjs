import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Location } from '@/types/location'
import { ProductImage } from '@/types/product'
import { logger } from '@/lib/logger'

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

export function useLocationData(params: Promise<{ id: string }>) {
  const router = useRouter()

  const [initialLoading, setInitialLoading] = useState(true)
  const [locationId, setLocationId] = useState<string>('')
  const [images, setImages] = useState<ProductImage[]>([])
  const [existingImageUrl, setExistingImageUrl] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    address: '',
    landmark: '',
    phone: '',
    lineId: '',
    hours: '',
    closedDays: '',
    parking: '',
    publicTransport: '',
    features: [''],
    specialties: [''],
    coordinates: {
      lat: 0,
      lng: 0,
    },
    image: '',
    isMain: false,
  })

  /**
   * 從 API 獲取門市資料
   */
  const fetchLocation = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/locations/${id}`)
        const result = await response.json()

        if (response.ok && (result.success ? result.data : result)) {
          const location: Location = result.success ? result.data : result
          setFormData({
            name: location.name || '',
            title: location.title || '',
            address: location.address || '',
            landmark: location.landmark || '',
            phone: location.phone || '',
            lineId: location.lineId || '',
            hours: location.hours || '',
            closedDays: location.closedDays || '',
            parking: location.parking || '',
            publicTransport: location.publicTransport || '',
            features: location.features || [''],
            specialties: location.specialties || [''],
            coordinates: location.coordinates || { lat: 0, lng: 0 },
            image: location.image || '',
            isMain: location.isMain || false,
          })

          // 設定現有圖片
          if (location.image) {
            setExistingImageUrl(location.image)
          }
        } else {
          const errorMessage = result.error || '門市不存在'
          alert(errorMessage)
          router.push('/admin/locations')
        }
      } catch (error) {
        logger.error(
          'Error fetching location:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        alert('載入失敗')
      } finally {
        setInitialLoading(false)
      }
    },
    [router]
  )

  /**
   * 處理 params Promise 並獲取資料
   */
  useEffect(() => {
    params.then(({ id }) => {
      setLocationId(id)
      fetchLocation(id)
    })
  }, [params, fetchLocation])

  return {
    initialLoading,
    locationId,
    formData,
    setFormData,
    images,
    setImages,
    existingImageUrl,
    setExistingImageUrl,
    fetchLocation,
  }
}
