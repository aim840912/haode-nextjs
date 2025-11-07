/**
 * Generic Form Hook
 *
 * 可重用的表單狀態管理 hook
 * 提供表單值、驗證、提交和重置功能
 */

import { useState, useCallback, ChangeEvent } from 'react'

export interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void> | void
}

export interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldError: (field: keyof T, error: string) => void
  setFieldTouched: (field: keyof T, touched: boolean) => void
  resetForm: () => void
  setValues: (values: T) => void
}

/**
 * useForm Hook
 *
 * @example
 * ```tsx
 * interface LoginForm {
 *   email: string
 *   password: string
 * }
 *
 * function LoginPage() {
 *   const form = useForm<LoginForm>({
 *     initialValues: { email: '', password: '' },
 *     validate: (values) => {
 *       const errors: Partial<Record<keyof LoginForm, string>> = {}
 *       if (!values.email) errors.email = 'Email is required'
 *       if (!values.password) errors.password = 'Password is required'
 *       return errors
 *     },
 *     onSubmit: async (values) => {
 *       await login(values)
 *     }
 *   })
 *
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       <input
 *         name="email"
 *         value={form.values.email}
 *         onChange={form.handleChange}
 *         onBlur={form.handleBlur}
 *       />
 *       {form.touched.email && form.errors.email && (
 *         <span>{form.errors.email}</span>
 *       )}
 *     </form>
 *   )
 * }
 * ```
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 驗證表單
  const validateForm = useCallback(
    (formValues: T): Partial<Record<keyof T, string>> => {
      if (validate) {
        return validate(formValues)
      }
      return {}
    },
    [validate]
  )

  // 檢查表單是否有效
  const isValid = Object.keys(errors).length === 0

  // 處理輸入變更
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

      setValues(prev => {
        const newValues = { ...prev, [name]: fieldValue }
        // 即時驗證
        if (validate && touched[name as keyof T]) {
          const newErrors = validate(newValues)
          setErrors(newErrors)
        }
        return newValues
      })
    },
    [validate, touched]
  )

  // 處理失焦事件
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target
      setTouched(prev => ({ ...prev, [name]: true }))

      // 失焦時驗證該欄位
      if (validate) {
        const newErrors = validate(values)
        setErrors(newErrors)
      }
    },
    [validate, values]
  )

  // 處理表單提交
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      // 標記所有欄位為已觸碰
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      )
      setTouched(allTouched)

      // 驗證表單
      const validationErrors = validateForm(values)
      setErrors(validationErrors)

      // 如果有錯誤，不提交
      if (Object.keys(validationErrors).length > 0) {
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validateForm, onSubmit]
  )

  // 設定單一欄位值
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  // 設定單一欄位錯誤
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  // 設定單一欄位觸碰狀態
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  // 重置表單
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    setValues,
  }
}
