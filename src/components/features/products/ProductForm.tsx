'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { ArrowLeftIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { useProductForm } from '@/hooks/useProductForm'
import { useSkuValidation } from '@/hooks/useSkuValidation'
import CategorySelector from './CategorySelector'
import PriceCalculator from './PriceCalculator'
import UnifiedImageUploader from './UnifiedImageUploader'

interface ProductFormProps {
  /** 是否為編輯模式 */
  isEdit?: boolean
  /** 編輯時的產品 ID */
  productId?: string
  /** 表單提交後的回調 */
  onSubmitSuccess?: (productId: string) => void
  /** 表單提交失敗的回調 */
  onSubmitError?: (error: string) => void
  /** 自定義樣式 */
  className?: string
}

export default function ProductForm({
  isEdit = false,
  productId: editProductId,
  onSubmitSuccess,
  onSubmitError,
  className = '',
}: ProductFormProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  // 使用自定義 hooks
  const {
    formData,
    fieldErrors,
    isSubmitting,
    updateField,
    updateFields,
    validateForm,
    resetForm,
    setSubmitting,
    getFormCompleteness,
  } = useProductForm()

  const { validationState: skuValidation, validateSku } = useSkuValidation()

  // 表單狀態
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [productId] = useState(() => editProductId || uuidv4())

  // 上傳統計
  const [uploadStats, setUploadStats] = useState({
    totalImages: 0,
    uploadedImages: 0,
    queuedImages: 0,
    failedImages: 0,
    savedSpace: 0,
    savedTime: 0,
  })

  // 處理 SKU 變更
  const handleSkuChange = useCallback(
    (sku: string) => {
      updateField('sku', sku)
      if (sku.trim()) {
        validateSku(sku)
      }
    },
    [updateField, validateSku]
  )

  // 處理圖片上傳成功
  const handleImageUploadSuccess = useCallback(
    (images: any[]) => {
      const imageUrls = images.map(img => img.url || img.path || img).filter(Boolean)
      updateField('images', imageUrls)
    },
    [updateField]
  )

  // 處理表單提交
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 基本驗證
      if (isSubmitting || csrfLoading || !csrfToken) return

      if (csrfError) {
        setSubmitError('安全驗證失敗，請重新整理頁面')
        return
      }

      // 表單驗證
      if (!validateForm()) {
        setSubmitError('請檢查並修正表單中的錯誤')
        return
      }

      // SKU 驗證（如果有設定）
      if (formData.sku && skuValidation.isValid === false) {
        setSubmitError('SKU 驗證失敗，請檢查 SKU 設定')
        return
      }

      setSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      try {
        // 準備提交資料
        const submitData = {
          ...formData,
          // 確保數值欄位為正確的型別
          price: Number(formData.price),
          salePrice: formData.isOnSale ? Number(formData.salePrice) : 0,
          inventory: Number(formData.inventory),
          unitQuantity: Number(formData.unitQuantity),
          // 過濾空的圖片 URL
          images: formData.images.filter(img => img && img.trim()),
        }

        logger.info('提交產品表單', {
          module: 'ProductForm',
          metadata: {
            isEdit,
            productId,
            hasImages: submitData.images.length > 0,
            formCompleteness: getFormCompleteness(),
          },
        })

        const url = isEdit ? `/api/products/${editProductId}` : '/api/products'
        const method = isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify(submitData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}`)
        }

        // 提交成功
        const createdProductId = result.data?.id || productId
        setSubmitSuccess(isEdit ? '產品已成功更新' : '產品已成功建立')

        logger.info('產品表單提交成功', {
          module: 'ProductForm',
          metadata: {
            isEdit,
            productId: createdProductId,
            uploadStats,
          },
        })

        // 執行成功回調
        if (onSubmitSuccess) {
          onSubmitSuccess(createdProductId)
        } else {
          // 默認行為：跳轉到產品管理頁
          setTimeout(() => {
            router.push('/admin/products')
          }, 1500)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '提交失敗'
        setSubmitError(errorMessage)

        logger.error('產品表單提交失敗', error as Error, {
          module: 'ProductForm',
          metadata: {
            isEdit,
            productId,
            formData: formData.name, // 只記錄產品名稱，避免敏感資料
          },
        })

        if (onSubmitError) {
          onSubmitError(errorMessage)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [
      isSubmitting,
      csrfLoading,
      csrfToken,
      csrfError,
      validateForm,
      formData,
      skuValidation,
      setSubmitting,
      getFormCompleteness,
      isEdit,
      editProductId,
      productId,
      uploadStats,
      onSubmitSuccess,
      onSubmitError,
      router,
    ]
  )

  // 載入中狀態
  if (isLoading || csrfLoading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-gray-500">載入表單中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 表單標題 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '編輯產品' : '新增產品'}</h1>
            <p className="text-gray-600 mt-1">{isEdit ? '修改產品資訊' : '建立新的產品項目'}</p>
          </div>
        </div>

        {/* 完整度指示器 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">表單完整度</span>
            <span className="text-amber-600">{getFormCompleteness()}%</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getFormCompleteness()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 錯誤和成功訊息 */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{submitSuccess}</p>
        </div>
      )}

      {/* 主表單 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本資訊 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本資訊</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 產品名稱 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                產品名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${fieldErrors.name ? 'border-red-300' : 'border-gray-300'}
                  ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
                placeholder="請輸入產品名稱"
              />
              {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
            </div>

            {/* 產品分類 */}
            <CategorySelector
              value={formData.category}
              onChange={category => updateField('category', category)}
              error={fieldErrors.category}
              disabled={isSubmitting}
            />

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (可選)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => handleSkuChange(e.target.value)}
                disabled={isSubmitting}
                maxLength={20}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${fieldErrors.sku || skuValidation.isValid === false ? 'border-red-300' : 'border-gray-300'}
                  ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
                placeholder="例: ORG-VEG-001"
              />
              {fieldErrors.sku && <p className="mt-1 text-sm text-red-600">{fieldErrors.sku}</p>}
              {skuValidation.message && (
                <p
                  className={`mt-1 text-sm ${
                    skuValidation.isValid === false
                      ? 'text-red-600'
                      : skuValidation.isValid === true
                        ? 'text-green-600'
                        : 'text-gray-500'
                  }`}
                >
                  {skuValidation.isChecking ? '檢查中...' : skuValidation.message}
                </p>
              )}
            </div>
          </div>

          {/* 產品描述 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              產品描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={1000}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none
                ${fieldErrors.description ? 'border-red-300' : 'border-gray-300'}
                ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
              `}
              placeholder="請詳細描述產品特色、品質、來源等資訊"
            />
            <div className="mt-1 flex justify-between items-center">
              {fieldErrors.description ? (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              ) : (
                <span></span>
              )}
              <span className="text-xs text-gray-500">{formData.description.length}/1000</span>
            </div>
          </div>
        </div>

        {/* 價格設定 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">價格設定</h2>

          <PriceCalculator
            price={formData.price}
            salePrice={formData.salePrice}
            isOnSale={formData.isOnSale}
            saleEndDate={formData.saleEndDate}
            priceUnit={formData.priceUnit}
            unitQuantity={formData.unitQuantity}
            onPriceChange={price => updateField('price', price)}
            onSalePriceChange={salePrice => updateField('salePrice', salePrice)}
            onSaleToggle={isOnSale => updateField('isOnSale', isOnSale)}
            onSaleEndDateChange={date => updateField('saleEndDate', date)}
            onPriceUnitChange={unit => updateField('priceUnit', unit)}
            onUnitQuantityChange={quantity => updateField('unitQuantity', quantity)}
            priceError={fieldErrors.price}
            disabled={isSubmitting}
          />
        </div>

        {/* 庫存管理 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">庫存管理</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">庫存數量</label>
              <input
                type="number"
                value={formData.inventory}
                onChange={e => updateField('inventory', parseInt(e.target.value) || 0)}
                disabled={isSubmitting}
                min="0"
                max="9999"
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${fieldErrors.inventory ? 'border-red-300' : 'border-gray-300'}
                  ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
                placeholder="0"
              />
              {fieldErrors.inventory && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.inventory}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上架狀態</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={e => updateField('isActive', e.target.value === 'active')}
                disabled={isSubmitting}
                className={`
                  w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                  ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
                `}
              >
                <option value="active">立即上架</option>
                <option value="inactive">暫不上架</option>
              </select>
            </div>
          </div>
        </div>

        {/* 產品圖片 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">產品圖片</h2>

          <UnifiedImageUploader
            productId={productId}
            onUploadSuccess={handleImageUploadSuccess}
            onStatsChange={setUploadStats}
            maxFiles={10}
            disabled={isSubmitting}
            csrfToken={csrfToken}
            className="w-full"
          />

          {fieldErrors.images && <p className="mt-2 text-sm text-red-600">{fieldErrors.images}</p>}

          {/* 上傳統計 */}
          {uploadStats.totalImages > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>總圖片: {uploadStats.totalImages}</div>
                <div>已上傳: {uploadStats.uploadedImages}</div>
                <div>佇列中: {uploadStats.queuedImages}</div>
                <div>失敗: {uploadStats.failedImages}</div>
              </div>
            </div>
          )}
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>

          <button
            type="submit"
            disabled={isSubmitting || skuValidation.isChecking || getFormCompleteness() < 80}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <BeakerIcon className="w-4 h-4 animate-spin" />
                <span>{isEdit ? '更新中...' : '建立中...'}</span>
              </>
            ) : (
              <span>{isEdit ? '更新產品' : '建立產品'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
