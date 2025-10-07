import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ui/feedback/Toast'
import { formatTimeRange } from './useScheduleData'

interface FormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

interface TimeRange {
  startTime: string
  endTime: string
}

interface UseScheduleFormOptions {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  timeRange: TimeRange
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>
  scheduleId: string
  errors: Record<string, string>
  touched: Record<string, boolean>
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  validateField: (name: string, value: unknown) => string
  validateForm: (formData: { products: string[]; [key: string]: unknown }) => boolean
  clearFieldError: (fieldName: string) => void
}

export function useScheduleForm({
  formData,
  setFormData,
  timeRange,
  setTimeRange,
  scheduleId,
  touched,
  setTouched,
  setErrors,
  validateField,
  validateForm,
  clearFieldError,
}: UseScheduleFormOptions) {
  const router = useRouter()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [newProduct, setNewProduct] = useState('')

  /**
   * 處理欄位失焦事件
   */
  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched(prev => ({
        ...prev,
        [fieldName]: true,
      }))
      // 驗證欄位
      const value =
        fieldName === 'startTime' || fieldName === 'endTime'
          ? timeRange[fieldName]
          : formData[fieldName as keyof typeof formData]
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error,
      }))
    },
    [formData, timeRange, setTouched, setErrors, validateField]
  )

  /**
   * 處理輸入欄位變更
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))

      // 即時驗證（如果欄位已被觸碰過）
      if (touched[name]) {
        const error = validateField(name, value)
        setErrors(prev => ({
          ...prev,
          [name]: error,
        }))
      }
    },
    [setFormData, touched, setErrors, validateField]
  )

  /**
   * 處理時間選擇器變更
   */
  const handleTimeChange = useCallback(
    (timeType: 'startTime' | 'endTime', value: string) => {
      setTimeRange(prev => ({
        ...prev,
        [timeType]: value,
      }))

      // 即時驗證時間欄位
      if (touched[timeType]) {
        const error = validateField(timeType, value)
        setErrors(prev => ({
          ...prev,
          [timeType]: error,
        }))
      }
    },
    [setTimeRange, touched, setErrors, validateField]
  )

  /**
   * 新增商品
   */
  const handleAddProduct = useCallback(() => {
    if (newProduct.trim() && !formData.products.includes(newProduct.trim())) {
      const updatedProducts = [...formData.products, newProduct.trim()]
      setFormData(prev => ({
        ...prev,
        products: updatedProducts,
      }))
      setNewProduct('')

      // 清除 products 欄位的錯誤（如果有的話）
      if (touched.products && updatedProducts.length > 0) {
        clearFieldError('products')
      }
    }
  }, [newProduct, formData.products, setFormData, touched.products, clearFieldError])

  /**
   * 移除商品
   */
  const handleRemoveProduct = useCallback(
    (productToRemove: string) => {
      const updatedProducts = formData.products.filter(p => p !== productToRemove)
      setFormData(prev => ({
        ...prev,
        products: updatedProducts,
      }))

      // 即時驗證 products 欄位
      if (touched.products) {
        validateField('products', updatedProducts)
      }
    },
    [formData.products, setFormData, touched.products, validateField]
  )

  /**
   * 處理 Enter 鍵新增商品
   */
  const handleProductKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddProduct()
      }
    },
    [handleAddProduct]
  )

  /**
   * 提交表單
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 執行完整表單驗證
      const isValid = validateForm(
        formData as unknown as { products: string[]; [key: string]: unknown }
      )
      if (!isValid) {
        toast.warning('表單驗證失敗', '請檢查並填寫所有必填欄位', [
          {
            label: '知道了',
            onClick: () => {},
            variant: 'primary',
          },
        ])
        return
      }

      setLoading(true)

      // 顯示載入提示
      const loadingToastId = toast.loading('更新中', '正在儲存行程資料...')

      try {
        const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)
        const submitData = {
          ...formData,
          time: formattedTime,
        }

        // 注意：空字串會直接傳給後端，由後端處理轉換為 null
        // 不需要在前端特殊處理

        const response = await fetch(`/api/schedule/${scheduleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })

        // 移除載入提示
        toast.removeToast(loadingToastId)

        if (response.ok) {
          // 顯示成功提示
          toast.success('更新成功！', '行程資料已成功更新，即將返回列表頁面')

          // 延遲跳轉讓用戶看到成功訊息
          setTimeout(() => {
            router.push('/admin/schedule')
          }, 1500)
        } else {
          // 解析錯誤響應
          const errorData = await response.json().catch(() => null)

          // 正確提取錯誤訊息（支援新舊錯誤格式）
          const errorMessage =
            errorData?.error?.message || // 新錯誤系統格式
            errorData?.message || // 舊格式相容
            errorData?.error || // 最後才嘗試直接使用 error
            '更新失敗，請稍後再試'

          // 確保 errorMessage 是字串
          const displayMessage =
            typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)

          // 針對驗證錯誤提供更詳細的訊息
          if (response.status === 400) {
            toast.error('資料驗證失敗', displayMessage, [
              {
                label: '查看錯誤',
                onClick: () => {
                  // 可以在這裡添加滾動到錯誤欄位的邏輯
                  logger.error('行程驗證錯誤', new Error(displayMessage), {
                    module: 'useScheduleForm',
                    action: 'handleValidationError',
                    metadata: { scheduleId, errorMessage: displayMessage },
                  })
                },
                variant: 'secondary',
              },
            ])
          } else {
            toast.error(`更新失敗 (${response.status})`, displayMessage)
          }

          logger.error(
            'Failed to update schedule:',
            new Error(`HTTP ${response.status}: ${displayMessage}`)
          )
        }
      } catch (error) {
        // 移除載入提示
        toast.removeToast(loadingToastId)

        const errorMsg = error instanceof Error ? error.message : '未知錯誤'
        toast.error('更新失敗', `網路錯誤：${errorMsg}。請檢查網路連線後重試。`)

        logger.error(
          'Error updating schedule:',
          error instanceof Error ? error : new Error('Unknown error')
        )
      } finally {
        setLoading(false)
      }
    },
    [formData, timeRange, scheduleId, validateForm, toast, router]
  )

  return {
    loading,
    newProduct,
    setNewProduct,
    handleBlur,
    handleInputChange,
    handleTimeChange,
    handleAddProduct,
    handleRemoveProduct,
    handleProductKeyPress,
    handleSubmit,
  }
}
