'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { v4 as uuidv4 } from 'uuid'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import { LockClosedIcon, BeakerIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

// 動態載入智慧圖片上傳器，減少初始 bundle 大小
const SmartImageUploader = dynamic(
  () => import('@/components/features/products/SmartImageUploader'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
        <div className="flex items-center space-x-2 text-gray-500">
          <BeakerIcon className="w-5 h-5 animate-spin" />
          <span>載入智慧上傳器...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

function AddProductV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [totalImages, setTotalImages] = useState<number>(0) // 包含本地圖片的總數
  const [productId] = useState(() => uuidv4()) // 使用 UUID 作為產品 ID
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  // 版本切換狀態
  const [isV2Enabled, setIsV2Enabled] = useState(true)
  const [showVersionWarning, setShowVersionWarning] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    priceUnit: '斤',
    unitQuantity: 1,
    salePrice: 0,
    isOnSale: false,
    saleEndDate: '',
    inventory: 0,
    images: [''],
    isActive: true,
    sku: '', // 新增 SKU 欄位
  })

  // 錯誤狀態管理
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    inventory: '',
    images: '',
    sku: '', // 新增 SKU 錯誤狀態
  })

  // SKU 驗證狀態
  const [skuValidation, setSkuValidation] = useState<{
    isChecking: boolean
    isValid: boolean | null
    message: string
  }>({ isChecking: false, isValid: null, message: '' })

  // 智慧上傳統計
  const [uploadStats, setUploadStats] = useState({
    totalImages: 0,
    uploadedImages: 0,
    queuedImages: 0,
    failedImages: 0,
    savedSpace: 0, // 節省的儲存空間 (bytes)
    savedTime: 0, // 節省的時間 (ms)
  })

  // 載入分類資料
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const result = await response.json()
        const categoriesData = result.data || result // 支援統一回應格式和直接陣列格式
        setCategories(categoriesData)
        // 如果有分類資料且目前分類為空，設定第一個分類為預設值
        if (categoriesData.length > 0) {
          setFormData(prev => {
            if (!prev.category) {
              return { ...prev, category: categoriesData[0] }
            }
            return prev
          })
        }
      }
    } catch (error) {
      logger.warn('載入分類資料失敗', { metadata: { error: String(error) } })
    }
  }, [])

  // 檢查 URL 參數中的版本切換
  useEffect(() => {
    const v2Param = searchParams?.get('v2')
    const enableV2 = v2Param !== 'false'

    setIsV2Enabled(enableV2)

    if (!enableV2) {
      setShowVersionWarning(true)
      setTimeout(() => setShowVersionWarning(false), 5000)
    }

    // 保存版本偏好到 localStorage
    try {
      localStorage.setItem('product-page-version', enableV2 ? 'v2' : 'v1')
    } catch (error) {
      logger.debug('無法保存版本偏好', { metadata: { error: String(error) } })
    }
  }, [searchParams])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 使用增強的表單驗證（保留向後相容）
  const validateForm = () => {
    const errors = {
      name: '',
      description: '',
      category: '',
      price: '',
      inventory: '',
      images: '',
      sku: '',
    }

    let hasErrors = false

    if (!formData.name.trim()) {
      errors.name = '產品名稱為必填項目'
      hasErrors = true
    }

    if (!formData.description.trim()) {
      errors.description = '產品描述為必填項目'
      hasErrors = true
    }

    if (!formData.category) {
      errors.category = '請選擇產品分類'
      hasErrors = true
    }

    if (formData.price <= 0) {
      errors.price = '價格必須大於 0'
      hasErrors = true
    }

    // 特價驗證
    if (formData.isOnSale) {
      if (formData.salePrice <= 0) {
        errors.price = '特價必須大於 0'
        hasErrors = true
      } else if (formData.salePrice >= formData.price) {
        errors.price = '特價必須小於原價'
        hasErrors = true
      }
    }

    if (formData.inventory < 0) {
      errors.inventory = '庫存不能為負數'
      hasErrors = true
    }

    if (totalImages === 0) {
      errors.images = '請至少上傳一張產品圖片'
      hasErrors = true
    }

    // SKU 驗證 - 如果有輸入 SKU 但驗證失敗
    if (formData.sku.trim() && skuValidation.isValid === false) {
      errors.sku = skuValidation.message || 'SKU 驗證失敗'
      hasErrors = true
    }

    setFieldErrors(errors)
    return !hasErrors
  }

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setSubmitError('請修正表單中的錯誤')
      return
    }

    if (!csrfToken) {
      setSubmitError('安全驗證失敗，請重新整理頁面')
      return
    }

    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      // 使用智慧提交流程
      const { submitProductWithSmartUpload } = await import(
        '@/lib/services/productSubmissionService'
      )

      // 準備提交數據（轉換為統一格式，與 V1 功能對等）
      const productFormData = {
        id: productId, // 明確指定產品 ID，確保與圖片上傳時使用的 entityId 一致
        name: formData.name,
        description: formData.description,
        category: formData.category,
        // 智慧價格處理：如果是特價商品，設定特價為當前售價，原價為 originalPrice
        price: formData.isOnSale ? formData.salePrice : formData.price,
        originalPrice: formData.isOnSale ? formData.price : null,
        priceUnit: formData.priceUnit,
        unitQuantity: formData.unitQuantity,
        inventory: formData.inventory,
        images: uploadedImages,
        isActive: formData.isActive, // 現在可由用戶控制
        isOnSale: formData.isOnSale,
        saleEndDate: formData.saleEndDate || null,
        tags: [],
        sku: formData.sku.trim() || undefined, // V2 現在支援 SKU
        weight: undefined,
      }

      // 執行智慧提交
      const result = await submitProductWithSmartUpload(
        productFormData,
        uploadedImages,
        [] // 目前版本先不處理 pending uploads，未來可整合 SmartImageUploader
      )

      if (result.success) {
        setSubmitSuccess(result.message)

        logger.info('產品建立成功 (V2 智慧提交)', {
          metadata: {
            productId: result.productId,
            productName: formData.name,
            imagesCount: result.uploadStatus.completed,
            version: 'v2',
            uploadStats: result.uploadStatus,
            warnings: result.warnings,
          },
        })

        // 顯示警告訊息（如有）
        if (result.warnings.length > 0) {
          logger.warn('產品提交完成但有警告', {
            metadata: {
              productId: result.productId,
              warnings: result.warnings,
            },
          })
        }

        // 3 秒後跳轉到產品列表
        setTimeout(() => {
          router.push('/admin/products')
        }, 3000)
      } else {
        setSubmitError(result.message)

        // 記錄提交失敗詳情
        if (result.errors.length > 0) {
          logger.error('產品提交驗證失敗', new Error(result.errors.join(', ')), {
            metadata: {
              productName: formData.name,
              errors: result.errors,
            },
          })
        }
      }
    } catch (error) {
      logger.error('產品建立失敗', error as Error)
      setSubmitError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // SKU 驗證函數
  const validateSKU = async (sku: string) => {
    if (!sku.trim()) {
      setSkuValidation({ isChecking: false, isValid: null, message: '' })
      return
    }

    setSkuValidation({ isChecking: true, isValid: null, message: '驗證中...' })

    try {
      const response = await fetch(`/api/products/check-sku?sku=${encodeURIComponent(sku)}`)
      const result = await response.json()

      if (response.ok) {
        if (result.available) {
          setSkuValidation({ isChecking: false, isValid: true, message: 'SKU 可用' })
        } else {
          setSkuValidation({
            isChecking: false,
            isValid: false,
            message: 'SKU 已存在，請使用其他 SKU',
          })
        }
      } else {
        setSkuValidation({ isChecking: false, isValid: false, message: 'SKU 驗證失敗' })
      }
    } catch (error) {
      logger.warn('SKU 驗證失敗', { metadata: { sku, error: String(error) } })
      setSkuValidation({ isChecking: false, isValid: null, message: 'SKU 驗證服務暫時不可用' })
    }
  }

  // 處理輸入變化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除對應欄位的錯誤
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }

    // SKU 輸入時觸發驗證
    if (field === 'sku' && typeof value === 'string') {
      // 使用防抖來避免過於頻繁的 API 請求
      const timeoutId = setTimeout(() => validateSKU(value), 500)
      return () => clearTimeout(timeoutId)
    }
  }

  // 處理圖片上傳完成
  const handleImagesChange = (images: string[]) => {
    setUploadedImages(images)
    setFormData(prev => ({ ...prev, images }))

    // 清除圖片錯誤
    if (fieldErrors.images && (images.length > 0 || totalImages > 0)) {
      setFieldErrors(prev => ({ ...prev, images: '' }))
    }
  }

  // 處理上傳統計更新
  const handleUploadStatsChange = (stats: typeof uploadStats) => {
    setUploadStats(stats)
    // 更新總圖片數（包含本地暫存的圖片）
    setTotalImages(stats.totalImages)
  }

  // 載入中狀態
  if (isLoading || csrfLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入智慧產品管理介面中..." />
      </AdminProtection>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex justify-center mb-8">
            <LockClosedIcon className="w-16 h-16 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
          <p className="text-gray-600 mb-8">請登入後再訪問產品管理功能</p>
          <Link
            href="/admin/login"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            立即登入
          </Link>
        </div>
      </div>
    )
  }

  // CSRF 錯誤處理
  if (csrfError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">安全驗證失敗</h1>
          <p className="text-gray-600 mb-8">請重新整理頁面再試一次</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新整理頁面
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50">
        {/* 版本警告橫幅 */}
        {showVersionWarning && (
          <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BeakerIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    注意：智慧上傳功能已停用，將使用傳統上傳方式
                  </p>
                </div>
                <button
                  onClick={() => setShowVersionWarning(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 導航欄 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/products"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  返回產品列表
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <BeakerIcon className="w-5 h-5 text-green-600" />
                  <h1 className="text-xl font-semibold text-gray-900">新增產品</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    智慧上傳
                  </span>
                </div>
              </div>

              {/* 版本切換 */}
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/products/add-v1"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  切換到傳統版本
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 主要內容 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 智慧上傳統計面板 */}
          {(uploadStats.totalImages > 0 || uploadStats.savedSpace > 0) && (
            <div className="bg-white rounded-lg shadow-sm border mb-8 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">智慧上傳統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadStats.uploadedImages}
                  </div>
                  <div className="text-sm text-gray-600">已上傳</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadStats.queuedImages}</div>
                  <div className="text-sm text-gray-600">佇列中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {uploadStats.savedSpace > 0
                      ? `${(uploadStats.savedSpace / 1024 / 1024).toFixed(1)}MB`
                      : '0MB'}
                  </div>
                  <div className="text-sm text-gray-600">節省空間</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {uploadStats.savedTime > 0
                      ? `${(uploadStats.savedTime / 1000).toFixed(1)}s`
                      : '0s'}
                  </div>
                  <div className="text-sm text-gray-600">節省時間</div>
                </div>
              </div>
            </div>
          )}

          {/* 產品表單 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">產品資訊</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 成功/錯誤訊息 */}
              {submitSuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-800">{submitSuccess}</div>
                </div>
              )}

              {submitError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{submitError}</div>
                </div>
              )}

              {/* 產品名稱 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  產品名稱 *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="請輸入產品名稱"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* 產品描述 */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  產品描述 *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    fieldErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="請輸入產品描述"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* 分類和價格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    產品分類 *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="category"
                      list="category-options"
                      value={formData.category}
                      onChange={e => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        fieldErrors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="選擇現有分類或輸入新分類"
                    />
                    <datalist id="category-options">
                      {categories.map(category => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {/* 分類提示 */}
                    {formData.category && !categories.includes(formData.category) && (
                      <div className="absolute z-10 w-full mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                        <p className="text-xs text-blue-700">
                          💡 將建立新分類：「{formData.category}」
                        </p>
                      </div>
                    )}
                  </div>
                  {fieldErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    可從下拉選單選擇現有分類，或直接輸入新的分類名稱
                  </p>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    價格 *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={e => handleInputChange('price', parseInt(e.target.value) || 0)}
                      min="0"
                      className={`flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        fieldErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    <select
                      value={formData.priceUnit}
                      onChange={e => handleInputChange('priceUnit', e.target.value)}
                      className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="斤">斤</option>
                      <option value="台斤">台斤</option>
                      <option value="公斤">公斤</option>
                      <option value="包">包</option>
                      <option value="盒">盒</option>
                      <option value="箱">箱</option>
                      <option value="顆">顆</option>
                      <option value="瓶">瓶</option>
                      <option value="罐">罐</option>
                      <option value="袋">袋</option>
                      <option value="束">束</option>
                      <option value="件">件</option>
                    </select>
                  </div>
                  {fieldErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
                  )}
                </div>
              </div>

              {/* SKU 和庫存 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    產品 SKU（選填）
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="sku"
                      value={formData.sku}
                      onChange={e => handleInputChange('sku', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        fieldErrors.sku
                          ? 'border-red-500'
                          : skuValidation.isValid === true
                            ? 'border-green-500'
                            : skuValidation.isValid === false
                              ? 'border-red-500'
                              : 'border-gray-300'
                      }`}
                      placeholder="輸入產品 SKU（如：PROD-001）"
                    />
                    {skuValidation.isChecking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {skuValidation.message && (
                    <p
                      className={`mt-1 text-sm ${
                        skuValidation.isValid === true
                          ? 'text-green-600'
                          : skuValidation.isValid === false
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {skuValidation.message}
                    </p>
                  )}
                  {fieldErrors.sku && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.sku}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">SKU 用於產品識別，留空將自動生成</p>
                </div>

                <div>
                  <label
                    htmlFor="inventory"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    庫存數量 *
                  </label>
                  <input
                    type="number"
                    id="inventory"
                    value={formData.inventory}
                    onChange={e => handleInputChange('inventory', parseInt(e.target.value) || 0)}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      fieldErrors.inventory ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="請輸入庫存數量"
                  />
                  {fieldErrors.inventory && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.inventory}</p>
                  )}
                </div>
              </div>

              {/* 特價設定 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onChange={e => handleInputChange('isOnSale', e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mr-3"
                  />
                  <label htmlFor="isOnSale" className="text-sm font-medium text-gray-800">
                    設為特價商品
                  </label>
                </div>

                {formData.isOnSale && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="salePrice"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          特價 (NT$) *
                        </label>
                        <input
                          type="number"
                          id="salePrice"
                          value={formData.salePrice}
                          onChange={e =>
                            handleInputChange('salePrice', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="輸入特價"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="saleEndDate"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          特價結束日期
                        </label>
                        <input
                          type="date"
                          id="saleEndDate"
                          value={formData.saleEndDate}
                          onChange={e => handleInputChange('saleEndDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* 折扣計算顯示 */}
                    {formData.price > 0 &&
                      formData.salePrice > 0 &&
                      formData.price > formData.salePrice && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm text-green-800">
                            <span className="font-medium">折扣：</span>
                            {Math.round((1 - formData.salePrice / formData.price) * 100)}% OFF
                            <span className="ml-2">
                              （省 NT$ {formData.price - formData.salePrice}）
                            </span>
                          </div>
                        </div>
                      )}

                    {formData.salePrice >= formData.price &&
                      formData.price > 0 &&
                      formData.salePrice > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-sm text-red-800">
                            <span className="font-medium">注意：</span>
                            特價不能大於或等於原價
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* 智慧圖片上傳 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">產品圖片 *</label>
                <SmartImageUploader
                  productId={productId}
                  onImagesChange={handleImagesChange}
                  onStatsChange={handleUploadStatsChange}
                  maxImages={5}
                  enabled={isV2Enabled}
                  csrfToken={csrfToken}
                />
                {fieldErrors.images && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.images}</p>
                )}
              </div>

              {/* 上架設定 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <div>
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-800">
                      立即上架販售
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      取消勾選將儲存為草稿，不會在前台顯示
                    </p>
                  </div>
                </div>
              </div>

              {/* 提交按鈕 */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/admin/products"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={loading || skuValidation.isChecking}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && <BeakerIcon className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading
                      ? '建立中...'
                      : skuValidation.isChecking
                        ? 'SKU 驗證中...'
                        : formData.isActive
                          ? '建立並上架產品'
                          : '儲存草稿'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AdminProtection>
  )
}

export default AddProductV2
