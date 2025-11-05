import { useState, useCallback } from 'react'
import { validatePhone } from '@/lib/utils/validation'

export interface TimeRange {
  startTime: string
  endTime: string
}

export interface FieldErrors {
  title: string
  location: string
  date: string
  contact: string
  startTime: string
  endTime: string
  products: string
}

export function useScheduleValidation(timeRange: TimeRange) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /**
   * 驗證單一欄位
   */
  const validateField = useCallback(
    (name: string, value: unknown): string => {
      switch (name) {
        case 'title':
          return !value || !(value as string).trim() ? '請輸入市集或夜市名稱' : ''

        case 'location':
          return !value || !(value as string).trim() ? '請輸入詳細地址' : ''

        case 'date':
          return !value ? '請選擇日期' : ''

        case 'contact':
          if (!value || !(value as string).trim()) return '請輸入聯絡電話'
          const result = validatePhone(value as string)
          if (!result.valid) {
            return result.message || '請輸入有效的台灣電話號碼（手機或市話）'
          }
          return ''

        case 'startTime':
          return !timeRange.startTime ? '請選擇開始時間' : ''

        case 'endTime':
          if (!timeRange.endTime) return '請選擇結束時間'
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
          return (value as string[]).length === 0 ? '請至少新增一項販售商品' : ''

        default:
          return ''
      }
    },
    [timeRange]
  )

  /**
   * 驗證所有欄位
   */
  const validateForm = useCallback(
    (formData: { products: string[]; [key: string]: unknown }): boolean => {
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
        const error = validateField(
          field,
          field === 'products' ? formData.products : formData[field]
        )
        if (error) {
          newErrors[field] = error
        }
      })

      setErrors(newErrors)
      // 標記所有欄位為已觸碰，以顯示錯誤
      const newTouched: Record<string, boolean> = {}
      fieldsToValidate.forEach(field => {
        newTouched[field] = true
      })
      setTouched(newTouched)

      return Object.keys(newErrors).length === 0
    },
    [validateField]
  )

  /**
   * 清除特定欄位的錯誤
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: '',
    }))
  }, [])

  return {
    errors,
    touched,
    setTouched,
    validateField,
    validateForm,
    clearFieldError,
    setErrors,
  }
}
