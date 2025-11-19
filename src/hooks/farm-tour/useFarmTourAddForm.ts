import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProductImage } from '@/types/product'
import { useFarmTourSubmit, FarmTourFormData, FarmTourFieldErrors } from './useFarmTourSubmit'

/**
 * Farm Tour 新增表單邏輯 Hook
 *
 * 封裝表單狀態管理、欄位驗證和提交邏輯。
 * 與 useScheduleForm 保持一致的架構模式。
 *
 * @returns 表單狀態和處理函數
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   fieldErrors,
 *   submitError,
 *   submitSuccess,
 *   loading,
 *   handleFieldChange,
 *   handleFieldBlur,
 *   handleSubmit,
 *   addActivityField,
 *   removeActivityField,
 *   updateActivityField,
 * } = useFarmTourAddForm()
 *
 * // 在 JSX 中使用
 * <form onSubmit={(e) => handleSubmit(e, activityId, images)}>
 *   <input
 *     value={formData.title}
 *     onChange={(e) => handleFieldChange('title', e.target.value)}
 *     onBlur={(e) => handleFieldBlur('title', e.target.value)}
 *   />
 * </form>
 * ```
 */
export function useFarmTourAddForm() {
  const router = useRouter()

  // 整合提交邏輯 Hook
  const { submitError, submitSuccess, loading, submitActivity } = useFarmTourSubmit()

  // 表單狀態
  const [formData, setFormData] = useState<FarmTourFormData>({
    start_month: 1,
    end_month: 12,
    title: '',
    activities: [''],
    price: 0,
    available: true,
    note: '',
  })

  // 欄位錯誤狀態
  const [fieldErrors, setFieldErrors] = useState<FarmTourFieldErrors>({
    title: '',
    activities: '',
    price: '',
    start_month: '',
    end_month: '',
  })

  /**
   * 驗證單一欄位
   *
   * @param field - 欄位名稱
   * @param value - 欄位值
   * @returns 錯誤訊息，無錯誤則返回空字串
   */
  const validateField = useCallback((field: string, value: unknown): string => {
    switch (field) {
      case 'title':
        return !String(value).trim() ? '請輸入活動標題' : ''

      case 'activities': {
        const validActivities = Array.isArray(value)
          ? value.filter(activity => String(activity).trim() !== '')
          : []
        return validActivities.length === 0 ? '至少需要一個活動項目' : ''
      }

      case 'price':
        return Number(value) < 0 ? '價格不能為負數' : ''

      case 'start_month':
        return Number(value) < 1 || Number(value) > 12 ? '開始月份必須是 1-12' : ''

      case 'end_month':
        return Number(value) < 1 || Number(value) > 12 ? '結束月份必須是 1-12' : ''

      default:
        return ''
    }
  }, [])

  /**
   * 處理欄位變更
   *
   * @param field - 欄位名稱
   * @param value - 新值
   */
  const handleFieldChange = useCallback(
    (field: keyof FarmTourFormData, value: unknown) => {
      setFormData(prev => ({ ...prev, [field]: value }))

      // 清除該欄位的錯誤訊息
      if (fieldErrors[field as keyof FarmTourFieldErrors]) {
        setFieldErrors(prev => ({ ...prev, [field]: '' }))
      }
    },
    [fieldErrors]
  )

  /**
   * 處理欄位失焦驗證
   *
   * @param field - 欄位名稱
   * @param value - 欄位值
   */
  const handleFieldBlur = useCallback(
    (field: string, value: unknown) => {
      const error = validateField(field, value)
      setFieldErrors(prev => ({ ...prev, [field]: error }))
    },
    [validateField]
  )

  /**
   * 新增活動項目欄位
   */
  const addActivityField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, ''],
    }))
  }, [])

  /**
   * 移除活動項目欄位
   *
   * @param index - 要移除的項目索引
   */
  const removeActivityField = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }))
  }, [])

  /**
   * 更新活動項目欄位
   *
   * @param index - 項目索引
   * @param value - 新值
   */
  const updateActivityField = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) => (i === index ? value : act)),
    }))
  }, [])

  /**
   * 處理表單提交
   *
   * @param e - 表單事件
   * @param activityId - 活動 ID
   * @param images - 圖片列表
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent, activityId: string, images: ProductImage[]) => {
      e.preventDefault()

      // 驗證所有欄位
      const errors: FarmTourFieldErrors = {
        title: validateField('title', formData.title),
        activities: validateField('activities', formData.activities),
        price: validateField('price', formData.price),
        start_month: validateField('start_month', formData.start_month),
        end_month: validateField('end_month', formData.end_month),
      }

      setFieldErrors(errors)

      // 檢查是否有任何錯誤
      if (Object.values(errors).some(error => error !== '')) {
        return
      }

      // 調用提交邏輯
      const success = await submitActivity(activityId, formData, images)

      // 成功後跳轉
      if (success) {
        setTimeout(() => {
          router.push('/admin/farm-tour')
        }, 1500)
      }
    },
    [formData, validateField, submitActivity, router]
  )

  /**
   * 處理通用 input 變更（支援 input/textarea/select）
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const newValue =
        type === 'number'
          ? Number(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : name === 'start_month' || name === 'end_month' || name === 'price'
              ? Number(value)
              : value

      handleFieldChange(name as keyof FarmTourFormData, newValue)
    },
    [handleFieldChange]
  )

  return {
    // 狀態
    formData,
    fieldErrors,
    submitError,
    submitSuccess,
    loading,

    // 處理函數
    handleFieldChange,
    handleFieldBlur,
    handleInputChange,
    handleSubmit,

    // 活動項目管理
    addActivityField,
    removeActivityField,
    updateActivityField,

    // 工具函數
    validateField,
  }
}
