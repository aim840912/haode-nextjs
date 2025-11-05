import { useState } from 'react'

interface TimeRange {
  startTime: string
  endTime: string
}

interface FormData {
  title: string
  location: string
  date: string
  contact: string
  products: string[]
  [key: string]: any
}

export function useScheduleFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /**
   * 驗證單一欄位
   */
  const validateField = (
    name: string,
    value: any,
    formData?: FormData,
    timeRange?: TimeRange
  ): string => {
    switch (name) {
      case 'title':
        return !value || !value.trim() ? '請輸入市集或夜市名稱' : ''

      case 'location':
        return !value || !value.trim() ? '請輸入詳細地址' : ''

      case 'date':
        return !value ? '請選擇日期' : ''

      case 'contact':
        if (!value || !value.trim()) return '請輸入聯絡電話'

        // 台灣電話格式增強驗證
        const cleanPhone = value.replace(/[\s\-()]/g, '')
        const phoneRegex =
          /^(\+?886)?0?(9\d{8}|[2-8]\d{7,8}|800\d{6}|204\d{6}|70\d{7})((?:#|ext\.?|轉)\d+)?$/i

        if (!phoneRegex.test(cleanPhone)) {
          return '電話格式不正確'
        }
        return ''

      case 'startTime':
        return !timeRange?.startTime ? '請選擇開始時間' : ''

      case 'endTime':
        if (!timeRange?.endTime) return '請選擇結束時間'
        // 檢查結束時間是否晚於開始時間
        if (timeRange.startTime && timeRange.endTime) {
          const start = timeRange.startTime.split(':').map(Number)
          const end = timeRange.endTime.split(':').map(Number)
          const startMinutes = start[0] * 60 + start[1]
          const endMinutes = end[0] * 60 + end[1]
          if (endMinutes <= startMinutes) {
            return '結束時間必須晚於開始時間'
          }
        }
        return ''

      case 'products':
        return formData && formData.products.length === 0 ? '請至少新增一項販售商品' : ''

      default:
        return ''
    }
  }

  /**
   * 驗證所有欄位
   */
  const validateForm = (formData: FormData, timeRange: TimeRange): boolean => {
    const newErrors: Record<string, string> = {}
    const fieldsToValidate = [
      'title',
      'location',
      'date',
      'contact',
      'startTime',
      'endTime',
      'products',
    ]

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field], formData, timeRange)
      if (error) {
        newErrors[field] = error
      }
    })

    setErrors(newErrors)
    // 標記所有欄位為已觸碰
    const newTouched: Record<string, boolean> = {}
    fieldsToValidate.forEach(field => {
      newTouched[field] = true
    })
    setTouched(newTouched)

    return Object.keys(newErrors).length === 0
  }

  /**
   * 處理欄位失焦事件
   */
  const handleBlur = (fieldName: string, formData: FormData, timeRange?: TimeRange) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }))
    // 驗證欄位
    const value =
      fieldName === 'startTime' || fieldName === 'endTime'
        ? timeRange?.[fieldName]
        : formData[fieldName]
    const error = validateField(fieldName, value, formData, timeRange)
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }))
  }

  /**
   * 更新特定欄位的錯誤
   */
  const updateFieldError = (fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }))
  }

  /**
   * 清除特定欄位的錯誤
   */
  const clearFieldError = (fieldName: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: '',
    }))
  }

  return {
    errors,
    touched,
    validateField,
    validateForm,
    handleBlur,
    updateFieldError,
    clearFieldError,
  }
}
