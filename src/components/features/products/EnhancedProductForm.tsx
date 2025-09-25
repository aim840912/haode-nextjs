'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useFormValidation } from '@/hooks/useFormValidation'
import {
  productValidationRules,
  initialProductFormData,
  calculateFormCompleteness,
  validateProductForSubmission,
  ProductFormData,
} from '@/lib/validation/productValidation'
import { logger } from '@/lib/logger'

interface EnhancedProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>
  onFormChange?: (data: Partial<ProductFormData>) => void
  onValidationChange?: (isValid: boolean, completeness: number) => void
  isSubmitting?: boolean
  categories: string[]
  initialData?: Partial<ProductFormData>
  enableRealTimeValidation?: boolean
  showCompleteness?: boolean
}

/**
 * 增強的產品表單元件
 *
 * 功能特色：
 * - 即時驗證與錯誤提示
 * - 表單完成度指示器
 * - 智慧提示與建議
 * - 無障礙支援
 * - 響應式設計
 */
export function EnhancedProductForm({
  onSubmit,
  onFormChange,
  onValidationChange,
  isSubmitting = false,
  categories,
  initialData = {},
  enableRealTimeValidation = true,
  showCompleteness = true,
}: EnhancedProductFormProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [completeness, setCompleteness] = useState({
    completeness: 0,
    requiredFieldsCount: 0,
    completedFieldsCount: 0,
  })

  // 初始化表單驗證
  const formValidation = useFormValidation<ProductFormData>({
    initialValues: { ...initialProductFormData, ...initialData },
    validationRules: productValidationRules,
    mode: enableRealTimeValidation ? 'onBlur' : 'onSubmit',
    revalidateMode: 'onChange',
    debounceMs: 300,
    onValidationChange: (isValid, errors) => {
      if (onValidationChange) {
        onValidationChange(isValid, completeness.completeness)
      }
    },
  })

  const {
    values,
    errors,
    isValid,
    isValidating,
    touched,
    handleChange,
    handleBlur,
    handleFocus,
    validateForm,
    reset,
  } = formValidation

  // 計算表單完成度
  const updateCompleteness = useCallback(() => {
    const stats = calculateFormCompleteness(values)
    setCompleteness(stats)

    if (onValidationChange) {
      onValidationChange(isValid, stats.completeness)
    }
  }, [values, isValid, onValidationChange])

  // 監聽表單變化
  useEffect(() => {
    updateCompleteness()
    if (onFormChange) {
      onFormChange(values)
    }
  }, [values, updateCompleteness, onFormChange])

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    try {
      // 執行完整驗證
      const isFormValid = await validateForm()

      if (!isFormValid) {
        logger.warn('表單驗證失敗', {
          metadata: {
            errors: Object.keys(errors),
            values: Object.keys(values),
          },
        })
        return
      }

      // 最終提交前驗證
      const submissionValidation = validateProductForSubmission(values)

      if (!submissionValidation.isValid) {
        logger.warn('提交前驗證失敗', {
          metadata: {
            errors: submissionValidation.errors,
          },
        })
        return
      }

      // 顯示警告（不阻止提交）
      if (submissionValidation.warnings.length > 0) {
        logger.info('表單提交警告', {
          metadata: {
            warnings: submissionValidation.warnings,
          },
        })
      }

      await onSubmit(values)
    } catch (error) {
      logger.error('表單提交失敗', error as Error)
    }
  }

  // 重置表單
  const handleReset = () => {
    reset({ ...initialProductFormData, ...initialData })
    setSubmitAttempted(false)
  }

  // 取得欄位錯誤狀態
  const getFieldErrorState = (fieldName: keyof ProductFormData) => {
    const hasError = errors[fieldName] && (touched[fieldName] || submitAttempted)
    return {
      hasError,
      errorMessage: hasError ? errors[fieldName] : '',
      className: hasError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-green-500',
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 表單完成度指示器 */}
      {showCompleteness && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">表單完成度</h3>
            <span className="text-sm text-gray-600">
              {Math.round(completeness.completeness * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completeness.completeness * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>
              必填 {completeness.completedFieldsCount}/{completeness.requiredFieldsCount}
            </span>
            <span>{isValid ? '✓ 有效' : '⚠ 需要修正'}</span>
          </div>
        </div>
      )}

      {/* 表單內容 */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 產品名稱 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            產品名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={values.name}
            onChange={e => handleChange('name')(e.target.value)}
            onBlur={handleBlur('name')}
            onFocus={handleFocus('name')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
              getFieldErrorState('name').className
            }`}
            placeholder="請輸入產品名稱"
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
          />
          {getFieldErrorState('name').hasError && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {getFieldErrorState('name').errorMessage}
            </p>
          )}
          {!errors.name && values.name && (
            <p className="mt-1 text-sm text-green-600">✓ 名稱格式正確</p>
          )}
        </div>

        {/* 產品描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            產品描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={e => handleChange('description')(e.target.value)}
            onBlur={handleBlur('description')}
            onFocus={handleFocus('description')}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
              getFieldErrorState('description').className
            }`}
            placeholder="請輸入詳細的產品描述"
            aria-describedby={errors.description ? 'description-error' : 'description-help'}
            aria-invalid={!!errors.description}
          />
          <div className="mt-1 flex justify-between text-sm">
            <div>
              {getFieldErrorState('description').hasError ? (
                <p id="description-error" className="text-red-600" role="alert">
                  {getFieldErrorState('description').errorMessage}
                </p>
              ) : (
                <p id="description-help" className="text-gray-500">
                  詳細的描述有助於提升產品吸引力
                </p>
              )}
            </div>
            <span className="text-gray-400">{values.description.length}/1000</span>
          </div>
        </div>

        {/* 分類和價格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 產品分類 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              產品分類 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={values.category}
              onChange={e => handleChange('category')(e.target.value)}
              onBlur={handleBlur('category')}
              onFocus={handleFocus('category')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                getFieldErrorState('category').className
              }`}
              aria-describedby={errors.category ? 'category-error' : undefined}
              aria-invalid={!!errors.category}
            >
              <option value="">請選擇分類</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {getFieldErrorState('category').hasError && (
              <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldErrorState('category').errorMessage}
              </p>
            )}
          </div>

          {/* 價格 */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              價格 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                NT$
              </span>
              <input
                type="number"
                id="price"
                value={values.price || ''}
                onChange={e => handleChange('price')(Number(e.target.value))}
                onBlur={handleBlur('price')}
                onFocus={handleFocus('price')}
                min="0"
                step="0.01"
                className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  getFieldErrorState('price').className
                }`}
                placeholder="0.00"
                aria-describedby={errors.price ? 'price-error' : undefined}
                aria-invalid={!!errors.price}
              />
            </div>
            {getFieldErrorState('price').hasError && (
              <p id="price-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldErrorState('price').errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* 庫存和 SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 庫存 */}
          <div>
            <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-2">
              庫存數量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="inventory"
              value={values.inventory || ''}
              onChange={e => handleChange('inventory')(Number(e.target.value))}
              onBlur={handleBlur('inventory')}
              onFocus={handleFocus('inventory')}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                getFieldErrorState('inventory').className
              }`}
              placeholder="0"
              aria-describedby={errors.inventory ? 'inventory-error' : undefined}
              aria-invalid={!!errors.inventory}
            />
            {getFieldErrorState('inventory').hasError && (
              <p id="inventory-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldErrorState('inventory').errorMessage}
              </p>
            )}
          </div>

          {/* SKU (選填) */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
              SKU 代碼
              <span className="text-gray-400 text-xs ml-1">(選填)</span>
            </label>
            <input
              type="text"
              id="sku"
              value={values.sku || ''}
              onChange={e => handleChange('sku')(e.target.value.toUpperCase())}
              onBlur={handleBlur('sku')}
              onFocus={handleFocus('sku')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                getFieldErrorState('sku').className
              }`}
              placeholder="例如: PROD-001"
              aria-describedby={errors.sku ? 'sku-error' : 'sku-help'}
              aria-invalid={!!errors.sku}
            />
            {getFieldErrorState('sku').hasError ? (
              <p id="sku-error" className="mt-1 text-sm text-red-600" role="alert">
                {getFieldErrorState('sku').errorMessage}
              </p>
            ) : (
              <p id="sku-help" className="mt-1 text-sm text-gray-500">
                格式：3-20 位英文大寫字母、數字或連字符
              </p>
            )}
          </div>
        </div>

        {/* 圖片上傳區域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            產品圖片 <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2">拖拽圖片到此處或點擊上傳</p>
              <p className="text-sm text-gray-400">支援 JPG、PNG 格式，建議大小 1MB 以內</p>
            </div>
          </div>
          {getFieldErrorState('images').hasError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {getFieldErrorState('images').errorMessage}
            </p>
          )}
          <div className="mt-2 text-sm text-gray-600">
            已上傳 {Array.isArray(values.images) ? values.images.length : 0} 張圖片
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            重置表單
          </button>

          <div className="flex items-center space-x-4">
            {isValidating && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                驗證中...
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isValidating}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '提交中...' : '新增產品'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
