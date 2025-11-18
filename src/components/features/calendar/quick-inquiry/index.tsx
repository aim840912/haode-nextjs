'use client'

import React from 'react'
import { FormField } from './FormField'
import { QuickAddInquiryModalProps } from './types'
import { useQuickInquiryForm } from './useQuickInquiryForm'

/**
 * 快速新增農場導覽預約 Modal
 *
 * **重構說明**:
 * - 原始 410 行縮減為 ~150 行
 * - 業務邏輯抽取到 useQuickInquiryForm hook
 * - 表單欄位統一使用 FormField 元件
 * - 主元件只負責 UI 編排
 */
export function QuickAddInquiryModal({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}: QuickAddInquiryModalProps) {
  const { formData, errors, isSubmitting, farmTours, handleInputChange, handleSubmit } =
    useQuickInquiryForm(isOpen, selectedDate, onSuccess, onClose)

  if (!isOpen) return null

  // 轉換農場導覽為 Select 選項
  const farmTourOptions = [
    { value: '', label: '請選擇農場導覽活動', disabled: farmTours.length === 0 },
    ...farmTours.map(tour => ({
      value: tour.id,
      label: `${tour.title} (${tour.start_month}月-${tour.end_month}月)`,
    })),
  ]

  if (farmTours.length === 0) {
    farmTourOptions.push({
      value: '',
      label: '目前無可用的農場導覽活動',
      disabled: true,
    })
  }

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
          {/* 一般錯誤訊息 */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* 預約日期 */}
          <FormField
            label="預約日期"
            type="date"
            value={formData.visit_date}
            onChange={value => handleInputChange('visit_date', value)}
            min={new Date().toISOString().split('T')[0]}
            required
            error={errors.visit_date}
            disabled={isSubmitting}
          />

          {/* 客戶姓名 */}
          <FormField
            label="客戶姓名"
            type="text"
            value={formData.customer_name}
            onChange={value => handleInputChange('customer_name', value)}
            placeholder="請輸入客戶姓名"
            required
            error={errors.customer_name}
            disabled={isSubmitting}
          />

          {/* 聯絡信箱 */}
          <FormField
            label="聯絡信箱"
            type="email"
            value={formData.customer_email}
            onChange={value => handleInputChange('customer_email', value)}
            placeholder="example@email.com"
            required
            error={errors.customer_email}
            disabled={isSubmitting}
          />

          {/* 聯絡電話 */}
          <FormField
            label="聯絡電話"
            type="tel"
            value={formData.customer_phone}
            onChange={value => handleInputChange('customer_phone', value)}
            placeholder="09xx-xxx-xxx"
            required
            error={errors.customer_phone}
            disabled={isSubmitting}
          />

          {/* 農場導覽活動 */}
          <FormField
            label="農場導覽活動"
            type="select"
            value={formData.farm_tour_id}
            onChange={value => handleInputChange('farm_tour_id', value)}
            options={farmTourOptions}
            required
            error={errors.farm_tour_id}
            disabled={isSubmitting}
          />

          {/* 參觀人數 */}
          <FormField
            label="參觀人數"
            type="number"
            value={formData.visitor_count}
            onChange={value => handleInputChange('visitor_count', value)}
            min={1}
            max={50}
            required
            error={errors.visitor_count}
            disabled={isSubmitting}
          />

          {/* 備註 */}
          <FormField
            label="備註"
            type="textarea"
            value={formData.notes}
            onChange={value => handleInputChange('notes', value)}
            placeholder="其他特殊需求或說明..."
            rows={3}
            disabled={isSubmitting}
          />
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
