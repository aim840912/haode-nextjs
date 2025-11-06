import { useCallback } from 'react'

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

export type ValidationErrors = Record<string, string>

export function useLocationFormValidation() {
  /**
   * 驗證電話號碼格式
   */
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // 非必填欄位
    const cleaned = phone.replace(/[\s\-()]/g, '')
    return /^09\d{8}$/.test(cleaned) || /^0[2-9]\d{7,8}$/.test(cleaned)
  }

  /**
   * 驗證營業時間格式
   */
  const validateHours = (hours: string): boolean => {
    if (!hours) return false // 必填欄位
    // 簡單驗證格式，例如: "09:00-18:00" 或 "09:00 - 18:00"
    const timeRangePattern = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/
    return timeRangePattern.test(hours.trim())
  }

  /**
   * 驗證座標格式
   */
  const validateCoordinates = (coordinates: { lat: number; lng: number }): boolean => {
    if (!coordinates) return false
    const { lat, lng } = coordinates

    // 台灣座標範圍
    // 緯度 (lat): 約 21.9~25.3
    // 經度 (lng): 約 119.3~122.0
    const isValidLat = lat >= 21 && lat <= 26
    const isValidLng = lng >= 119 && lng <= 123

    return isValidLat && isValidLng
  }

  /**
   * 驗證表單資料
   */
  const validate = useCallback((formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {}

    // 必填欄位驗證
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '門市名稱為必填'
    } else if (formData.name.length > 50) {
      errors.name = '門市名稱不得超過 50 字元'
    }

    if (!formData.title || formData.title.trim() === '') {
      errors.title = '門市標題為必填'
    } else if (formData.title.length > 100) {
      errors.title = '門市標題不得超過 100 字元'
    }

    if (!formData.address || formData.address.trim() === '') {
      errors.address = '地址為必填'
    } else if (formData.address.length > 200) {
      errors.address = '地址不得超過 200 字元'
    }

    // 電話號碼驗證
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = '請輸入有效的台灣電話號碼（手機或市話）'
    }

    // 營業時間驗證
    if (!formData.hours) {
      errors.hours = '營業時間為必填'
    } else if (!validateHours(formData.hours)) {
      errors.hours = '營業時間格式不正確（例如: 09:00-18:00）'
    }

    // 座標驗證（如果有提供的話）
    if (formData.coordinates.lat && formData.coordinates.lng) {
      if (!validateCoordinates(formData.coordinates)) {
        errors.coordinates = '座標超出台灣範圍，請檢查經緯度設定'
      }
    }

    // 陣列欄位長度驗證
    if (formData.features.length > 20) {
      errors.features = '門市特色項目不得超過 20 項'
    }

    if (formData.specialties.length > 20) {
      errors.specialties = '特色產品項目不得超過 20 項'
    }

    // 停車資訊長度驗證
    if (formData.parking && formData.parking.length > 200) {
      errors.parking = '停車資訊不得超過 200 字元'
    }

    // 大眾運輸資訊長度驗證
    if (formData.publicTransport && formData.publicTransport.length > 300) {
      errors.publicTransport = '大眾運輸資訊不得超過 300 字元'
    }

    return errors
  }, [])

  /**
   * 檢查是否有錯誤
   */
  const hasErrors = useCallback((errors: ValidationErrors): boolean => {
    return Object.keys(errors).length > 0
  }, [])

  /**
   * 取得欄位錯誤訊息
   */
  const getFieldError = useCallback(
    (errors: ValidationErrors, field: string): string | undefined => {
      return errors[field]
    },
    []
  )

  return {
    validate,
    hasErrors,
    getFieldError,
    validatePhone,
    validateHours,
    validateCoordinates,
  }
}
