'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { logger } from '@/lib/logger'

export type ValidationRule<T = any> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  customValidator?: (value: T) => string | null
  message?: string
  asyncValidator?: (value: T) => Promise<string | null>
}

export type ValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export type ValidationErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string
}

export type ValidationMode = 'onSubmit' | 'onChange' | 'onBlur' | 'onFocus'

export interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T
  validationRules: ValidationRules<T>
  mode?: ValidationMode
  revalidateMode?: ValidationMode
  debounceMs?: number
  onValidationChange?: (isValid: boolean, errors: ValidationErrors<T>) => void
}

export interface UseFormValidationResult<T extends Record<string, any>> {
  values: T
  errors: ValidationErrors<T>
  isValid: boolean
  isValidating: boolean
  touched: { [K in keyof T]?: boolean }

  // Methods
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  validateField: <K extends keyof T>(field: K) => Promise<string | null>
  validateForm: () => Promise<boolean>
  reset: (newValues?: Partial<T>) => void
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void
  clearErrors: (fields?: (keyof T)[]) => void

  // Event handlers
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void
  handleBlur: <K extends keyof T>(field: K) => () => void
  handleFocus: <K extends keyof T>(field: K) => () => void
}

const debounceTimeout: { [key: string]: NodeJS.Timeout } = {}

/**
 * 增強的表單驗證 Hook
 *
 * 功能特色：
 * - 即時驗證 (onChange, onBlur, onFocus)
 * - 防抖驗證避免過度觸發
 * - 非同步驗證支援
 * - 自定義驗證規則
 * - 觸摸狀態追蹤
 * - 完整的錯誤狀態管理
 */
export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  mode = 'onBlur',
  revalidateMode = 'onChange',
  debounceMs = 300,
  onValidationChange,
}: UseFormValidationOptions<T>): UseFormValidationResult<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors<T>>({})
  const [touched, setTouchedState] = useState<{ [K in keyof T]?: boolean }>({})
  const [isValidating, setIsValidating] = useState(false)

  // 計算表單是否有效
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 || Object.values(errors).every(error => !error)
  }, [errors])

  // 驗證單個欄位
  const validateField = useCallback(
    async <K extends keyof T>(field: K): Promise<string | null> => {
      const rule = validationRules[field]
      const value = values[field]

      if (!rule) return null

      // 必填驗證
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return rule.message || `${String(field)} 為必填項目`
      }

      // 如果值為空且不是必填，跳過其他驗證
      if (!value && !rule.required) return null

      // 字串長度驗證
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          return rule.message || `${String(field)} 至少需要 ${rule.minLength} 個字元`
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return rule.message || `${String(field)} 不能超過 ${rule.maxLength} 個字元`
        }
      }

      // 數值範圍驗證
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          return rule.message || `${String(field)} 不能小於 ${rule.min}`
        }
        if (rule.max !== undefined && value > rule.max) {
          return rule.message || `${String(field)} 不能大於 ${rule.max}`
        }
      }

      // 正則表達式驗證
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          return rule.message || `${String(field)} 格式不正確`
        }
      }

      // 自定義同步驗證
      if (rule.customValidator) {
        const customError = rule.customValidator(value)
        if (customError) return customError
      }

      // 非同步驗證
      if (rule.asyncValidator) {
        try {
          setIsValidating(true)
          const asyncError = await rule.asyncValidator(value)
          if (asyncError) return asyncError
        } catch (error) {
          logger.warn('非同步驗證失敗', {
            metadata: {
              field: String(field),
              error: String(error),
            },
          })
          return '驗證失敗，請重試'
        } finally {
          setIsValidating(false)
        }
      }

      return null
    },
    [values, validationRules]
  )

  // 更新欄位錯誤
  const updateFieldError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[field] = error
      } else {
        delete newErrors[field]
      }
      return newErrors
    })
  }, [])

  // 防抖驗證
  const debouncedValidateField = useCallback(
    <K extends keyof T>(field: K, immediate = false) => {
      const key = String(field)

      if (debounceTimeout[key]) {
        clearTimeout(debounceTimeout[key])
      }

      if (immediate) {
        validateField(field).then(error => updateFieldError(field, error))
        return
      }

      debounceTimeout[key] = setTimeout(async () => {
        const error = await validateField(field)
        updateFieldError(field, error)
      }, debounceMs)
    },
    [validateField, updateFieldError, debounceMs]
  )

  // 設定單個欄位值
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState(prev => ({ ...prev, [field]: value }))

      // 根據模式觸發驗證
      if ((mode === 'onChange' && touched[field]) || revalidateMode === 'onChange') {
        debouncedValidateField(field)
      }
    },
    [mode, revalidateMode, touched, debouncedValidateField]
  )

  // 設定多個欄位值
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState(prev => ({ ...prev, ...newValues }))

      // 驗證受影響的欄位
      Object.keys(newValues).forEach(key => {
        const field = key as keyof T
        if ((mode === 'onChange' && touched[field]) || revalidateMode === 'onChange') {
          debouncedValidateField(field)
        }
      })
    },
    [mode, revalidateMode, touched, debouncedValidateField]
  )

  // 驗證整個表單
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true)
    const newErrors: ValidationErrors<T> = {}
    let hasErrors = false

    try {
      // 並行驗證所有欄位
      const validationPromises = Object.keys(validationRules).map(async key => {
        const field = key as keyof T
        const error = await validateField(field)
        if (error) {
          newErrors[field] = error
          hasErrors = true
        }
      })

      await Promise.all(validationPromises)
      setErrors(newErrors)

      const formIsValid = !hasErrors

      // 觸發驗證狀態變化回調
      if (onValidationChange) {
        onValidationChange(formIsValid, newErrors)
      }

      return formIsValid
    } catch (error) {
      logger.error('表單驗證失敗', error as Error)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [validationRules, validateField, onValidationChange])

  // 重置表單
  const reset = useCallback(
    (newValues?: Partial<T>) => {
      const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues
      setValuesState(resetValues)
      setErrors({})
      setTouchedState({})
      setIsValidating(false)

      // 清理防抖計時器
      Object.values(debounceTimeout).forEach(timeout => clearTimeout(timeout))
    },
    [initialValues]
  )

  // 設定欄位觸摸狀態
  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }))
  }, [])

  // 清除錯誤
  const clearErrors = useCallback((fields?: (keyof T)[]) => {
    if (fields) {
      setErrors(prev => {
        const newErrors = { ...prev }
        fields.forEach(field => delete newErrors[field])
        return newErrors
      })
    } else {
      setErrors({})
    }
  }, [])

  // 處理欄位變更
  const handleChange = useCallback(
    <K extends keyof T>(field: K) =>
      (value: T[K]) => {
        setValue(field, value)
      },
    [setValue]
  )

  // 處理欄位失焦
  const handleBlur = useCallback(
    <K extends keyof T>(field: K) =>
      () => {
        setTouched(field, true)

        if (mode === 'onBlur' || (touched[field] && revalidateMode === 'onBlur')) {
          debouncedValidateField(field, true) // 失焦時立即驗證
        }
      },
    [mode, revalidateMode, touched, setTouched, debouncedValidateField]
  )

  // 處理欄位聚焦
  const handleFocus = useCallback(
    <K extends keyof T>(field: K) =>
      () => {
        if (mode === 'onFocus') {
          debouncedValidateField(field, true)
        }
      },
    [mode, debouncedValidateField]
  )

  // 監聽驗證狀態變化
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid, errors)
    }
  }, [isValid, errors, onValidationChange])

  return {
    values,
    errors,
    isValid,
    isValidating,
    touched,
    setValue,
    setValues,
    validateField,
    validateForm,
    reset,
    setTouched,
    clearErrors,
    handleChange,
    handleBlur,
    handleFocus,
  }
}

/**
 * 常用驗證規則工廠函數
 */
export const validationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message,
  }),

  email: (message = 'Email 格式不正確'): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message,
  }),

  phone: (message = '手機號碼格式不正確'): ValidationRule => ({
    pattern: /^09\d{8}$/,
    message,
  }),

  positiveNumber: (message = '請輸入正數'): ValidationRule => ({
    customValidator: (value: any) => {
      const num = Number(value)
      return isNaN(num) || num <= 0 ? message : null
    },
  }),

  nonNegativeNumber: (message = '數值不能為負'): ValidationRule => ({
    customValidator: (value: any) => {
      const num = Number(value)
      return isNaN(num) || num < 0 ? message : null
    },
  }),

  url: (message = 'URL 格式不正確'): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message,
  }),
}
