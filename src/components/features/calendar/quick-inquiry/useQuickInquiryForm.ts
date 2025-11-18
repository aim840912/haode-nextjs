import { useState, useEffect, useCallback } from 'react'
import { fetchFarmTourActivities } from '@/lib/api/farm-tour-api'
import { inquiryApi } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { formatDate } from '@/lib/utils/formatters'
import { FarmTourActivity } from '@/types/farmTour'
import { ApiResponse } from '@/types/infrastructure.types'
import {
  CreateInquiryRequest,
  CreateInquiryItemRequest,
  InquiryType,
  InquiryWithItems,
} from '@/types/inquiry'
import { QuickInquiryFormData, QuickInquiryFormErrors, UseQuickInquiryFormReturn } from './types'

/**
 * 快速詢價表單業務邏輯 Hook
 *
 * 負責：
 * - 表單狀態管理
 * - 農場導覽選項載入
 * - 表單驗證
 * - 詢價單建立
 *
 * @param isOpen - Modal 是否開啟
 * @param selectedDate - 選擇的預約日期
 * @param onSuccess - 成功回調
 * @param onClose - 關閉回調
 */
export function useQuickInquiryForm(
  isOpen: boolean,
  selectedDate: Date | null,
  onSuccess?: (inquiryId: string) => void,
  onClose?: () => void
): UseQuickInquiryFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [farmTours, setFarmTours] = useState<FarmTourActivity[]>([])
  const [formData, setFormData] = useState<QuickInquiryFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    visitor_count: 1,
    farm_tour_id: '',
    visit_date: '',
    notes: '',
  })
  const [errors, setErrors] = useState<QuickInquiryFormErrors>({})

  // 載入農場導覽選項
  const loadFarmTours = useCallback(async () => {
    try {
      const tours = await fetchFarmTourActivities()
      const availableTours = tours.filter(tour => tour.available !== false)

      setFarmTours(availableTours)
      logger.info('農場導覽選項載入成功', {
        metadata: {
          totalCount: tours.length,
          availableCount: availableTours.length,
        },
      })
    } catch (error) {
      logger.error('載入農場導覽選項失敗', error as Error)
      setErrors(prev => ({ ...prev, general: '載入農場導覽選項失敗，請稍後再試' }))
    }
  }, [])

  // Modal 開啟時載入農場導覽選項
  useEffect(() => {
    if (isOpen) {
      loadFarmTours()
    }
  }, [isOpen, loadFarmTours])

  // 重置表單
  const resetForm = useCallback((date: Date | null) => {
    const defaultDate = date ? date.toISOString().split('T')[0] : ''
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      visitor_count: 1,
      farm_tour_id: '',
      visit_date: defaultDate,
      notes: date ? `預設預約日期：${formatDate(date, 'short')}` : '',
    })
    setErrors({})
  }, [])

  // Modal 開啟時重置表單
  useEffect(() => {
    if (isOpen) {
      resetForm(selectedDate)
    }
  }, [isOpen, selectedDate, resetForm])

  // 表單驗證
  const validateForm = useCallback((): boolean => {
    const newErrors: QuickInquiryFormErrors = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '請填寫客戶姓名'
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = '請填寫聯絡信箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = '請填寫有效的信箱格式'
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = '請填寫聯絡電話'
    }

    if (!formData.farm_tour_id) {
      newErrors.farm_tour_id = '請選擇農場導覽活動'
    }

    if (!formData.visit_date) {
      newErrors.visit_date = '請選擇預約日期'
    } else {
      const selectedVisitDate = new Date(formData.visit_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedVisitDate < today) {
        newErrors.visit_date = '預約日期不能早於今天'
      }
    }

    if (formData.visitor_count < 1) {
      newErrors.visitor_count = '參觀人數至少為 1 人'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 處理表單輸入變更
  const handleInputChange = useCallback(
    (field: keyof QuickInquiryFormData, value: string | number) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))

      // 清除該欄位的錯誤訊息
      if (errors[field as keyof QuickInquiryFormErrors]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field as keyof QuickInquiryFormErrors]
          return newErrors
        })
      }
    },
    [errors]
  )

  // 提交表單
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // 建立詢價項目
      const selectedTour = farmTours.find(t => t.id === formData.farm_tour_id)
      const inquiryItem: CreateInquiryItemRequest = {
        product_id: formData.farm_tour_id,
        product_name: selectedTour?.title || '農場導覽',
        quantity: formData.visitor_count,
        notes: `農場導覽預約 - ${formData.visitor_count} 人`,
      }

      // 建立詢價請求
      const inquiryRequest: CreateInquiryRequest = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        inquiry_type: 'farm_tour' as InquiryType,
        notes: formData.notes,
        delivery_address: '',
        preferred_delivery_date: formData.visit_date,
        items: [inquiryItem],
        activity_title: selectedTour?.title,
        visit_date: formData.visit_date,
        visitor_count: formData.visitor_count.toString(),
      }

      logger.info('提交快速農場導覽預約', {
        module: 'useQuickInquiryForm',
        action: 'submit',
        metadata: {
          date: formData.visit_date,
          customerName: formData.customer_name,
          visitorCount: formData.visitor_count,
        },
      })

      const result = (await inquiryApi.create(inquiryRequest)) as ApiResponse<InquiryWithItems>

      if (result.success) {
        logger.info('快速預約建立成功', {
          module: 'useQuickInquiryForm',
          action: 'success',
          metadata: { inquiryId: result.data?.id },
        })

        if (onSuccess && result.data?.id) {
          onSuccess(result.data.id)
        }

        onClose?.()
      } else {
        throw new Error(result.error || '建立預約失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失敗，請稍後再試'
      setErrors({ general: errorMessage })
      logger.error('快速預約建立失敗', error as Error, {
        module: 'useQuickInquiryForm',
        action: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, formData, farmTours, onSuccess, onClose])

  return {
    formData,
    errors,
    isSubmitting,
    farmTours,
    handleInputChange,
    handleSubmit,
    resetForm,
  }
}
