import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createLocationWithImages } from '@/lib/api/admin-api'
import { logger } from '@/lib/logger'
import { validatePhone } from '@/lib/utils/validation'
import { ProductImage } from '@/types/product'

export interface LocationFormData {
  name: string
  title: string
  address: string
  landmark: string
  phone: string
  lineId: string
  hours: string
  closedDays: string[] // 改為陣列以支援多選星期
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
  hours: '08:00-18:00', // 預設營業時間：早上8點到下午6點
  closedDays: [], // 預設無公休日
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

/**
 * 將公休日陣列轉換為顯示字串
 * @param days - 公休日陣列，例如：["週一", "週三"]
 * @returns 格式化的字串，例如："週一、週三公休"
 */
const formatClosedDays = (days: string[]): string => {
  if (days.length === 0) {
    return '' // 空字串表示未設定，顯示為全年無休
  }

  if (days.includes('全年無休')) {
    return '全年無休'
  }

  if (days.includes('不定期公休')) {
    const otherDays = days.filter(d => d !== '不定期公休')
    if (otherDays.length > 0) {
      return `${otherDays.join('、')}及不定期公休`
    }
    return '不定期公休'
  }

  return `${days.join('、')}公休`
}

/**
 * 將公休日字串解析為陣列（用於載入現有資料）
 * @param closedDaysStr - 公休日字串，例如："週一、週三公休"
 * @returns 公休日陣列，例如：["週一", "週三"]
 */
const parseClosedDays = (closedDaysStr: string): string[] => {
  if (!closedDaysStr || closedDaysStr === '' || closedDaysStr === '全年無休') {
    return []
  }

  if (closedDaysStr === '不定期公休') {
    return ['不定期公休']
  }

  // 解析格式如 "週一、週三公休" 或 "週一及不定期公休"
  const cleanStr = closedDaysStr.replace(/公休$/, '').trim()

  if (cleanStr.includes('及不定期公休')) {
    const parts = cleanStr.split('及不定期公休')
    const days = parts[0]
      .split('、')
      .map(d => d.trim())
      .filter(d => d)
    return [...days, '不定期公休']
  }

  return cleanStr
    .split('、')
    .map(d => d.trim())
    .filter(d => d)
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
      const result = validatePhone(stringValue)
      if (!result.valid) {
        return result.message || '請輸入有效的台灣電話號碼（手機或市話）'
      }
      return ''
    case 'hours':
      if (!stringValue.trim()) return '請輸入營業時間'

      // 驗證時間範圍格式：HH:mm-HH:mm
      const timeRangeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRangeRegex.test(stringValue)) {
        return '營業時間格式錯誤（格式：HH:mm-HH:mm）'
      }

      // 驗證時間範圍（支援跨日營業）
      const [start, end] = stringValue.split('-')
      const [startHour, startMinute] = start.split(':').map(Number)
      const [endHour, endMinute] = end.split(':').map(Number)
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      // 不允許開始和結束時間完全相同（0小時營業）
      if (endMinutes === startMinutes) {
        return '營業時間不能為0小時'
      }

      // 允許跨日營業（例如：22:00-02:00 表示晚上10點到隔天凌晨2點）
      return ''
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
      let newValue: unknown

      if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked
      } else if (type === 'array') {
        // 支援陣列型別（用於 WeekdaySelector）
        newValue = value
      } else {
        newValue = value
      }

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

  // 表單提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent, images: ProductImage[]) => {
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
        // 處理圖片資料（如果有）
        let imageData = null
        if (images.length > 0) {
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
              alt: img.alt_text || `${formData.name} - 圖片`,
              size: img.size || 'medium',
              file_size: file.size,
            }
          } else if (img.storage_url) {
            // 已上傳模式：使用現有的 URL
            imageData = {
              url: img.storage_url,
              alt: img.alt_text || `${formData.name} - 圖片`,
              size: img.size || 'medium',
            }
          }
        }

        // 準備門市資料
        const locationData = {
          id: locationId,
          name: formData.name,
          title: formData.title,
          address: formData.address,
          landmark: formData.landmark || '',
          phone: formData.phone,
          lineId: formData.lineId || '',
          hours: formData.hours,
          closedDays: formatClosedDays(formData.closedDays), // 將陣列轉換為字串
          parking: formData.parking || '',
          publicTransport: formData.publicTransport || '',
          features: formData.features.filter(feature => feature.trim() !== ''),
          specialties: formData.specialties.filter(specialty => specialty.trim() !== ''),
          coordinates:
            formData.coordinates.lat && formData.coordinates.lng
              ? formData.coordinates
              : { lat: 23.5519, lng: 120.5564 },
          isMain: formData.isMain,
        }

        logger.info('開始事務式建立門市', {
          metadata: {
            locationId,
            locationName: formData.name,
            hasImage: !!imageData,
          },
        })

        // 提交到事務式 API
        await createLocationWithImages({
          location: locationData,
          image: imageData,
        })

        setSubmitSuccess('門市新增成功！正在跳轉...')

        logger.info('門市建立成功', {
          metadata: {
            locationId,
            locationName: formData.name,
            hasImage: !!imageData,
          },
        })

        setTimeout(() => {
          router.push('/admin/locations')
        }, 1500)
      } catch (error) {
        logger.error(
          'Error creating location:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        setSubmitError(
          error instanceof Error ? `錯誤：${error.message}` : '網路連線錯誤，請檢查網路後再試'
        )
      } finally {
        setLoading(false)
      }
    },
    [formData, locationId, router, convertImageToBase64]
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

// 匯出工具函數供外部使用
export { parseClosedDays, formatClosedDays }
