import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Location } from '@/types/location'
import { logger } from '@/lib/logger'
import { parseClosedDays } from '@/hooks/location/useLocationForm'

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

export function useLocationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagePaths, setImagePaths] = useState<Map<string, string>>(new Map())

  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    address: '',
    landmark: '',
    phone: '',
    lineId: '',
    hours: '',
    closedDays: [],
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
            closedDays: parseClosedDays(location.closedDays || ''),
            parking: location.parking || '',
            publicTransport: location.publicTransport || '',
            features: location.features || [''],
            specialties: location.specialties || [''],
            coordinates: location.coordinates || { lat: 0, lng: 0 },
            image: location.image || '',
            isMain: location.isMain || false,
          })

          if (location.image) {
            setExistingImages([location.image])
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    let newValue: unknown

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked
    } else {
      newValue = value
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const updateFeatureField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }))
  }

  const addFeatureField = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const removeFeatureField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const updateSpecialtyField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.map((specialty, i) => (i === index ? value : specialty)),
    }))
  }

  const addSpecialtyField = () => {
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, ''],
    }))
  }

  const removeSpecialtyField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }))
  }

  const handleImageUploadSuccess = (
    images: {
      id: string
      url?: string
      path?: string
      size?: 'thumbnail' | 'medium' | 'large'
      file?: File
      preview?: string
      position?: number
      alt?: string
    }[]
  ) => {
    if (images.length > 0) {
      const image = images[0]
      const imageUrl = image.url || image.path
      if (imageUrl && image.path) {
        setImagePaths(prev => new Map(prev).set(imageUrl, image.path!))
        setUploadedImages([imageUrl])
        setFormData(prev => ({ ...prev, image: imageUrl }))
      }
    }
  }

  const handleImageUploadError = (error: string) => {
    logger.error('圖片上傳失敗', new Error(error))
    alert(`圖片上傳失敗: ${error}`)
  }

  return {
    formData,
    loading,
    initialLoading,
    uploadedImages,
    existingImages,
    imagePaths,
    setFormData,
    setLoading,
    setUploadedImages,
    setExistingImages,
    setImagePaths,
    fetchLocation,
    handleInputChange,
    updateFeatureField,
    addFeatureField,
    removeFeatureField,
    updateSpecialtyField,
    addSpecialtyField,
    removeSpecialtyField,
    handleImageUploadSuccess,
    handleImageUploadError,
  }
}
