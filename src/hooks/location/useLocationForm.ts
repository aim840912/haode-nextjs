import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'

export interface LocationFormData {
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

export interface FieldErrors {
  name: string
  title: string
  address: string
  phone: string
  hours: string
}

const initialFormData: LocationFormData = {
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
    lat: 23.5519, // 台灣中心點作為預設值
    lng: 120.5564,
  },
  image: '',
  isMain: false,
}

const initialFieldErrors: FieldErrors = {
  name: '',
  title: '',
  address: '',
  phone: '',
  hours: '',
}

// 驗證函數
const validateField = (field: string, value: unknown): string => {
  const stringValue = String(value)
  switch (field) {
    case 'name':
      return !stringValue.trim() ? '請輸入門市名稱' : ''
    case 'title':
      return !stringValue.trim() ? '請輸入完整標題' : ''
    case 'address':
      return !stringValue.trim() ? '請輸入門市地址' : ''
    case 'phone':
      if (!stringValue.trim()) return '請輸入電話號碼'
      // 台灣電話格式簡單驗證 (09xxxxxxxx 或 0x-xxxxxxx)
      const phoneRegex = /^(09\d{8}|0\d{1,2}-\d{6,8})$/
      return !phoneRegex.test(stringValue.replace(/\s+/g, '')) ? '電話格式不正確' : ''
    case 'hours':
      return !stringValue.trim() ? '請輸入營業時間' : ''
    default:
      return ''
  }
}

export const useLocationForm = (locationId: string) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<LocationFormData>(initialFormData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(initialFieldErrors)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // 處理欄位變更
  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除對應欄位錯誤
    if (field in initialFieldErrors) {
      const error = validateField(field, value)
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [])

  // 處理輸入變更
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

      handleFieldChange(name, newValue)
    },
    [handleFieldChange]
  )

  // 處理欄位失焦驗證
  const handleFieldBlur = useCallback(
    (field: keyof FieldErrors) => {
      const error = validateField(field, formData[field])
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    },
    [formData]
  )

  // 動態欄位管理 - Features
  const addFeatureField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }, [])

  const removeFeatureField = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }, [])

  const updateFeatureField = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }))
  }, [])

  // 動態欄位管理 - Specialties
  const addSpecialtyField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, ''],
    }))
  }, [])

  const removeSpecialtyField = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }))
  }, [])

  const updateSpecialtyField = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.map((specialty, i) => (i === index ? value : specialty)),
    }))
  }, [])

  // 表單提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent, uploadedImageUrl: string) => {
      e.preventDefault()
      setLoading(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      // 欄位級驗證
      const newFieldErrors: FieldErrors = {
        name: validateField('name', formData.name),
        title: validateField('title', formData.title),
        address: validateField('address', formData.address),
        phone: validateField('phone', formData.phone),
        hours: validateField('hours', formData.hours),
      }

      setFieldErrors(newFieldErrors)

      // 檢查是否有任何錯誤
      const hasErrors = Object.values(newFieldErrors).some(error => error !== '')
      if (hasErrors) {
        setSubmitError('請修正表單中的錯誤後再提交')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: locationId, // 包含前端生成的 UUID
            ...formData,
            image: uploadedImageUrl || formData.image || '',
            features: formData.features.filter(feature => feature.trim() !== ''),
            specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
            coordinates:
              formData.coordinates.lat && formData.coordinates.lng
                ? formData.coordinates
                : { lat: 23.5519, lng: 120.5564 }, // 台灣中心點作為預設值
          }),
        })

        if (response.ok) {
          setSubmitSuccess('門市新增成功！正在跳轉...')
          setTimeout(() => {
            router.push('/admin/locations')
          }, 1500)
        } else {
          const errorData = await response.json().catch(() => ({}))
          setSubmitError(errorData.message || '新增失敗，請稍後再試')
        }
      } catch (error) {
        logger.error(
          'Error creating location:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        setSubmitError('網路連線錯誤，請檢查網路後再試')
      } finally {
        setLoading(false)
      }
    },
    [formData, locationId, router]
  )

  return {
    formData,
    fieldErrors,
    submitError,
    submitSuccess,
    loading,
    handleFieldChange,
    handleInputChange,
    handleFieldBlur,
    handleSubmit,
    // Features management
    addFeatureField,
    removeFeatureField,
    updateFeatureField,
    // Specialties management
    addSpecialtyField,
    removeSpecialtyField,
    updateSpecialtyField,
  }
}
