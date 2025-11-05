'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminProtection from '@/components/features/admin/AdminProtection'

// Hooks
import { useScheduleForm } from './_hooks/useScheduleForm'
import { useScheduleFormValidation } from './_hooks/useScheduleFormValidation'
import { useScheduleFormSubmit } from './_hooks/useScheduleFormSubmit'

// Components
import { BasicInfoSection } from './_components/BasicInfoSection'
import { DateTimeSection } from './_components/DateTimeSection'
import { ProductsSection } from './_components/ProductsSection'
import { AdditionalInfoSection } from './_components/AdditionalInfoSection'
import { SchedulePreview } from './_components/SchedulePreview'

export default function EditSchedule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [scheduleId, setScheduleId] = useState<string>('')

  // Custom hooks
  const {
    formData,
    timeRange,
    newProduct,
    initialLoading,
    setNewProduct,
    formatTimeRange,
    fetchSchedule,
    handleInputChange,
    handleTimeChange,
    handleAddProduct,
    handleRemoveProduct,
  } = useScheduleForm()

  const {
    errors,
    touched,
    validateField,
    validateForm,
    handleBlur: baseHandleBlur,
    updateFieldError,
    clearFieldError,
  } = useScheduleFormValidation()

  const { loading, handleSubmit: baseHandleSubmit } = useScheduleFormSubmit(
    scheduleId,
    formatTimeRange
  )

  // 市集建議列表
  const marketSuggestions = [
    '台中逢甲夜市',
    '台北士林夜市',
    '高雄六合夜市',
    '彰化員林市集',
    '台南花園夜市',
    '桃園中壢夜市',
  ]

  // 載入行程資料
  useEffect(() => {
    params.then(({ id }) => {
      setScheduleId(id)
      fetchSchedule(id, router)
    })
  }, [params, fetchSchedule, router])

  // 處理欄位失焦事件（帶驗證）
  const handleBlur = (fieldName: string) => {
    baseHandleBlur(fieldName, formData, timeRange)
  }

  // 處理欄位變更（帶即時驗證）
  const handleInputChangeWithValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    handleInputChange(e)
    const { name, value } = e.target
    // 即時驗證（如果欄位已被觸碰過）
    if (touched[name]) {
      const error = validateField(name, value, formData, timeRange)
      updateFieldError(name, error)
    }
  }

  // 處理時間變更（帶即時驗證）
  const handleTimeChangeWithValidation = (timeType: 'startTime' | 'endTime', value: string) => {
    handleTimeChange(timeType, value)
    // 即時驗證時間欄位
    if (touched[timeType]) {
      const updatedTimeRange = { ...timeRange, [timeType]: value }
      const error = validateField(timeType, value, formData, updatedTimeRange)
      updateFieldError(timeType, error)
    }
  }

  // 處理新增商品（帶驗證更新）
  const handleAddProductWithValidation = (): string[] => {
    const updatedProducts = handleAddProduct()
    // 清除 products 欄位的錯誤（如果有的話）
    if (touched.products && updatedProducts.length > 0) {
      clearFieldError('products')
    }
    return updatedProducts
  }

  // 處理移除商品（帶驗證更新）
  const handleRemoveProductWithValidation = (product: string): string[] => {
    const updatedProducts = handleRemoveProduct(product)
    // 即時驗證 products 欄位
    if (touched.products) {
      const error = validateField('products', updatedProducts, {
        ...formData,
        products: updatedProducts,
      })
      updateFieldError('products', error)
    }
    return updatedProducts
  }

  // 處理按 Enter 新增商品
  const handleProductKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddProductWithValidation()
    }
  }

  // 提交表單
  const handleSubmit = (e: React.FormEvent) => {
    const isValid = validateForm(formData, timeRange)
    baseHandleSubmit(e, formData, timeRange, () => isValid)
  }

  // 載入中狀態
  if (initialLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/admin/schedule" className="text-purple-600 hover:text-purple-800">
                ← 回到行程管理
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">編輯擺攤行程</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* 基本資訊 */}
            <BasicInfoSection
              formData={formData}
              errors={errors}
              touched={touched}
              marketSuggestions={marketSuggestions}
              handleInputChange={handleInputChangeWithValidation}
              handleBlur={handleBlur}
            />

            {/* 日期時間 */}
            <DateTimeSection
              formData={formData}
              timeRange={timeRange}
              errors={errors}
              touched={touched}
              handleInputChange={handleInputChangeWithValidation}
              handleTimeChange={handleTimeChangeWithValidation}
              handleBlur={handleBlur}
              formatTimeRange={formatTimeRange}
            />

            {/* 描述 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">地點描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChangeWithValidation}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="攤位位置、交通資訊等補充說明"
              />
            </div>

            {/* 販售商品 */}
            <ProductsSection
              formData={formData}
              newProduct={newProduct}
              errors={errors}
              touched={touched}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProductWithValidation}
              handleRemoveProduct={handleRemoveProductWithValidation}
              handleBlur={handleBlur}
              handleProductKeyPress={handleProductKeyPress}
            />

            {/* 聯絡資訊和額外資訊 */}
            <AdditionalInfoSection
              formData={formData}
              errors={errors}
              touched={touched}
              handleInputChange={handleInputChangeWithValidation}
              handleBlur={handleBlur}
            />

            {/* 預覽區 */}
            <SchedulePreview
              formData={formData}
              formatTimeRange={formatTimeRange}
              timeRange={timeRange}
            />

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/schedule"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading || formData.products.length === 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '更新行程'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
