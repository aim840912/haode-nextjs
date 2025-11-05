import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { createFarmTourInquiry } from '@/lib/api/farm-tour-api'
import { validatePhone } from '@/lib/utils/validation'
import type { User } from '@/types/auth'
import type { FarmTourActivity } from '@/types/farmTour'

export interface FarmTourFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  visit_date: string
  visitor_count: string
  notes: string
}

export interface FarmTourFormErrors {
  customer_name: string
  customer_email: string
  customer_phone: string
  visit_date: string
}

export interface UseFarmTourFormReturn {
  formData: FarmTourFormData
  fieldErrors: FarmTourFormErrors
  isSubmitting: boolean
  submitError: string | null
  handleFormChange: (field: string, value: string) => void
  handleFieldBlur: (field: string, value: string) => void
  handleSubmit: (activity: FarmTourActivity) => Promise<void>
  resetForm: () => void
  validateAllFields: () => boolean
}

const INITIAL_FORM_DATA: FarmTourFormData = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  visit_date: '',
  visitor_count: '1人',
  notes: '',
}

const INITIAL_ERRORS: FarmTourFormErrors = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  visit_date: '',
}

/**
 * 農場導覽表單管理 Hook
 * 負責表單狀態、驗證邏輯、欄位更新和表單提交
 */
export function useFarmTourForm(user: User | null): UseFarmTourFormReturn {
  const router = useRouter()
  const [formData, setFormData] = useState<FarmTourFormData>({
    ...INITIAL_FORM_DATA,
    customer_email: user?.email || '',
  })
  const [fieldErrors, setFieldErrors] = useState<FarmTourFormErrors>(INITIAL_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 當使用者狀態改變時，更新表單中的 email
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        customer_email: user.email,
      }))
    }
  }, [user])

  // 驗證單一欄位
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'customer_name':
        if (!value.trim()) return '請輸入姓名'
        if (value.trim().length < 2) return '姓名至少需要 2 個字元'
        return ''

      case 'customer_email':
        if (!value.trim()) return '請輸入 Email'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return '請輸入有效的 Email 格式'
        return ''

      case 'customer_phone':
        // 電話為選填，但如果填寫則需驗證格式
        if (value.trim()) {
          const result = validatePhone(value)
          if (!result.valid) return result.message || '請輸入有效的電話號碼'
        }
        return ''

      case 'visit_date':
        if (!value) return '請選擇參觀日期'
        const selectedDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) return '參觀日期不可早於今天'
        return ''

      default:
        return ''
    }
  }, [])

  // 處理表單欄位變更
  const handleFormChange = useCallback(
    (field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))

      // 如果有錯誤訊息，清除它
      if (fieldErrors[field as keyof FarmTourFormErrors]) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: '',
        }))
      }
    },
    [fieldErrors]
  )

  // 處理欄位失焦（驗證）
  const handleFieldBlur = useCallback(
    (field: string, value: string) => {
      const error = validateField(field, value)
      setFieldErrors(prev => ({
        ...prev,
        [field]: error,
      }))
    },
    [validateField]
  )

  // 驗證所有必填欄位
  const validateAllFields = useCallback((): boolean => {
    const errors: FarmTourFormErrors = {
      customer_name: validateField('customer_name', formData.customer_name),
      customer_email: validateField('customer_email', formData.customer_email),
      customer_phone: validateField('customer_phone', formData.customer_phone),
      visit_date: validateField('visit_date', formData.visit_date),
    }

    setFieldErrors(errors)

    // 檢查是否有任何錯誤
    return !Object.values(errors).some(error => error !== '')
  }, [formData, validateField])

  // 提交表單
  const handleSubmit = useCallback(
    async (activity: FarmTourActivity) => {
      // 驗證使用者是否登入
      if (!user) {
        setSubmitError('請先登入以提交預約詢問')
        return
      }

      // 驗證活動是否選中
      if (!activity) {
        setSubmitError('未選中活動')
        return
      }

      // 驗證所有欄位
      if (!validateAllFields()) {
        setSubmitError('請修正表單中的錯誤後再提交')
        return
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        logger.info('開始提交農場參觀預約詢問', {
          module: 'useFarmTourForm',
          action: 'handleSubmit',
          metadata: { activityTitle: activity.title },
        })

        // ✅ 使用 API Client Layer
        const result = await createFarmTourInquiry({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          activity_title: activity.title,
          visit_date: formData.visit_date,
          visitor_count: formData.visitor_count,
          notes: formData.notes,
        })

        logger.info('農場參觀預約詢問提交成功', {
          module: 'useFarmTourForm',
          action: 'handleSubmit',
          metadata: { inquiryId: result.id },
        })

        // 成功提交，導向詢問單詳情頁
        router.push(`/inquiries/${result.id}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '提交預約詢問時發生錯誤'
        setSubmitError(errorMessage)

        logger.error('提交農場參觀預約詢問失敗', error as Error, {
          module: 'useFarmTourForm',
          action: 'handleSubmit',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [user, formData, validateAllFields, router]
  )

  // 重置表單
  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_DATA,
      customer_email: user?.email || '',
    })
    setFieldErrors(INITIAL_ERRORS)
    setSubmitError(null)
  }, [user])

  return {
    formData,
    fieldErrors,
    isSubmitting,
    submitError,
    handleFormChange,
    handleFieldBlur,
    handleSubmit,
    resetForm,
    validateAllFields,
  }
}
