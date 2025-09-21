'use client'

import { useState, useEffect } from 'react'
// 使用 HTML 符號替代 lucide-react
// import { X } from 'lucide-react'
import { logger } from '@/lib/logger'
import { inquiryApi } from '@/lib/api-client'
import {
  CreateInquiryRequest,
  CreateInquiryItemRequest,
  InquiryType,
  InquiryWithItems,
} from '@/types/inquiry'
import { ApiResponse } from '@/types/infrastructure.types'

interface QuickAddInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  onSuccess?: (inquiryId: string) => void
}

interface FarmTourOption {
  id: string
  title: string
  season: string
  available?: boolean
}

export default function QuickAddInquiryModal({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}: QuickAddInquiryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [farmTours, setFarmTours] = useState<FarmTourOption[]>([])
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    visitor_count: 1,
    farm_tour_id: '',
    visit_date: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 載入農場導覽選項
  useEffect(() => {
    if (isOpen) {
      loadFarmTours()
    }
  }, [isOpen])

  // 重置表單
  useEffect(() => {
    if (isOpen) {
      const defaultDate = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        visitor_count: 1,
        farm_tour_id: '',
        visit_date: defaultDate,
        notes: selectedDate ? `預設預約日期：${selectedDate.toLocaleDateString('zh-TW')}` : '',
      })
      setErrors({})
    }
  }, [isOpen, selectedDate])

  const loadFarmTours = async () => {
    try {
      const response = await fetch('/api/farm-tour')
      if (response.ok) {
        const data = await response.json()
        const tours = data.success ? data.data : data

        // 過濾可用的農場導覽，如果沒有 available 屬性則預設為可用
        const availableTours = tours.filter(
          (tour: FarmTourOption) => tour.available !== false // 只排除明確設為 false 的項目
        )

        setFarmTours(availableTours)
        logger.info('農場導覽選項載入成功', {
          metadata: {
            totalCount: tours.length,
            availableCount: availableTours.length,
          },
        })
      } else {
        throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      logger.error('載入農場導覽選項失敗', error as Error)
      setErrors(prev => ({ ...prev, general: '載入農場導覽選項失敗，請稍後再試' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

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
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    const visitDate = new Date(formData.visit_date)

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
        delivery_address: '', // 農場導覽不需要配送地址
        preferred_delivery_date: formData.visit_date, // 使用使用者選擇的日期
        items: [inquiryItem],
        // 農場導覽相關欄位
        activity_title: selectedTour?.title,
        visit_date: formData.visit_date,
        visitor_count: formData.visitor_count.toString(),
      }

      logger.info('提交快速農場導覽預約', {
        module: 'QuickAddInquiryModal',
        action: 'submit',
        metadata: {
          date: visitDate.toISOString(),
          customerName: formData.customer_name,
          visitorCount: formData.visitor_count,
        },
      })

      const result = (await inquiryApi.create(inquiryRequest)) as ApiResponse<InquiryWithItems>

      if (result.success) {
        logger.info('快速預約建立成功', {
          module: 'QuickAddInquiryModal',
          action: 'success',
          metadata: { inquiryId: result.data?.id },
        })

        if (onSuccess && result.data?.id) {
          onSuccess(result.data.id)
        }

        onClose()
      } else {
        throw new Error(result.error || '建立預約失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失敗，請稍後再試'
      setErrors({ general: errorMessage })
      logger.error('快速預約建立失敗', error as Error, {
        module: 'QuickAddInquiryModal',
        action: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // 清除該欄位的錯誤訊息
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">快速新增預約</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl w-8 h-8 flex items-center justify-center"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        {/* 表單內容 */}
        <div className="p-6 space-y-4">
          {/* 預約日期輸入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">預約日期 *</label>
            <input
              type="date"
              value={formData.visit_date}
              onChange={e => handleInputChange('visit_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]} // 最小日期為今天
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.visit_date ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.visit_date && <p className="text-red-600 text-sm mt-1">{errors.visit_date}</p>}
          </div>

          {/* 一般錯誤訊息 */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* 客戶姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客戶姓名 *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={e => handleInputChange('customer_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customer_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="請輸入客戶姓名"
              disabled={isSubmitting}
            />
            {errors.customer_name && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_name}</p>
            )}
          </div>

          {/* 聯絡信箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">聯絡信箱 *</label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={e => handleInputChange('customer_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customer_email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
              disabled={isSubmitting}
            />
            {errors.customer_email && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_email}</p>
            )}
          </div>

          {/* 聯絡電話 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話 *</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={e => handleInputChange('customer_phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customer_phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="09xx-xxx-xxx"
              disabled={isSubmitting}
            />
            {errors.customer_phone && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_phone}</p>
            )}
          </div>

          {/* 農場導覽活動 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">農場導覽活動 *</label>
            <select
              value={formData.farm_tour_id}
              onChange={e => handleInputChange('farm_tour_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.farm_tour_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">請選擇農場導覽活動</option>
              {farmTours.length === 0 ? (
                <option value="" disabled>
                  目前無可用的農場導覽活動
                </option>
              ) : (
                farmTours.map(tour => (
                  <option key={tour.id} value={tour.id}>
                    {tour.title} ({tour.season})
                  </option>
                ))
              )}
            </select>
            {errors.farm_tour_id && (
              <p className="text-red-600 text-sm mt-1">{errors.farm_tour_id}</p>
            )}
          </div>

          {/* 參觀人數 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">參觀人數 *</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.visitor_count}
              onChange={e => handleInputChange('visitor_count', parseInt(e.target.value) || 1)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.visitor_count ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.visitor_count && (
              <p className="text-red-600 text-sm mt-1">{errors.visitor_count}</p>
            )}
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="其他特殊需求或說明..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* 按鈕列 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>提交中...</span>
              </>
            ) : (
              <span>建立預約</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
