/**
 * QuickAddInquiryModal 型別定義
 */

import { FarmTourActivity } from '@/types/farmTour'

/**
 * 表單資料結構
 */
export interface QuickInquiryFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  visitor_count: number
  farm_tour_id: string
  visit_date: string
  notes: string
}

/**
 * 表單錯誤結構
 */
export interface QuickInquiryFormErrors {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  visitor_count?: string
  farm_tour_id?: string
  visit_date?: string
  general?: string
}

/**
 * Modal Props
 */
export interface QuickAddInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  onSuccess?: (inquiryId: string) => void
}

/**
 * 業務邏輯 Hook 回傳值
 */
export interface UseQuickInquiryFormReturn {
  // 狀態
  formData: QuickInquiryFormData
  errors: QuickInquiryFormErrors
  isSubmitting: boolean
  farmTours: FarmTourActivity[]

  // 方法
  handleInputChange: (field: keyof QuickInquiryFormData, value: string | number) => void
  handleSubmit: () => Promise<void>
  resetForm: (date: Date | null) => void
}
