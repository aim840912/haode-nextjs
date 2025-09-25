'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { v4 as uuidv4 } from 'uuid'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import { LockClosedIcon } from '@heroicons/react/24/outline'

// 動態載入圖片上傳器，減少初始 bundle 大小
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

function AddProduct() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [productId] = useState(() => uuidv4()) // 使用 UUID 作為產品 ID
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

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
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        // 如果有分類資料且目前分類為空，設定第一個分類為預設值
        if (data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: data[0] }))
        }
      }
    } catch {
      // 忽略分類載入錯誤，不影響表單功能
    }
  }, [formData.category])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 載入中狀態
  if (isLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入產品管理介面中..." />
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
          <p className="text-gray-600 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 驗證函數
  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'name':
        return !value.trim() ? '請輸入產品名稱' : ''
      case 'description':
        return !value.trim() ? '請輸入產品描述' : ''
      case 'category':
        return !value.trim() ? '請選擇產品分類' : ''
      case 'price':
        return value < 0 ? '價格不能為負數' : ''
      case 'inventory':
        return value < 0 ? '庫存數量不能為負數' : ''
      case 'images':
        const validImages = Array.isArray(value) ? value.filter(img => img.trim() !== '') : []
        const hasUploadedImages = uploadedImages.length > 0
        return !hasUploadedImages && validImages.length === 0 ? '請至少上傳一張產品圖片' : ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除該欄位的錯誤訊息
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
    // 清除總體錯誤
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const handleFieldBlur = (field: string, value: any) => {
    const error = validateField(field, value)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 清除之前的錯誤
    setSubmitError(null)
    setSubmitSuccess(null)

    // 防止在 CSRF token 未準備好時提交
    if (csrfLoading || !csrfToken) {
      setSubmitError('請稍候，正在初始化安全驗證...')
      return
    }

    if (csrfError) {
      setSubmitError('安全驗證初始化失敗，請重新整理頁面')
      return
    }

    // 欄位級驗證
    const newFieldErrors = {
      name: validateField('name', formData.name),
      description: validateField('description', formData.description),
      category: validateField('category', formData.category),
      price: validateField('price', formData.price),
      inventory: validateField('inventory', formData.inventory),
      images: validateField('images', formData.images),
    }

    setFieldErrors(newFieldErrors)

    // 檢查是否有任何錯誤
    const hasErrors = Object.values(newFieldErrors).some(error => error !== '')
    if (hasErrors) {
      const allErrors = Object.values(newFieldErrors).filter(error => error !== '')
      setSubmitError(`請修正以下問題：${allErrors.join('、')}`)
      return
    }

    setLoading(true)

    try {
      // 根據是否為特價商品設定正確的價格，但保留 priceUnit 和 unitQuantity
      const { salePrice: _unusedSalePrice, ...restData } = formData
      const productData = {
        ...restData,
        id: productId, // 指定產品 ID
        images:
          uploadedImages.length > 0
            ? uploadedImages
            : formData.images.filter(img => img.trim() !== ''),
        // 如果是特價商品，設定特價為當前售價，原價為 originalPrice
        // 如果不是特價商品，設定原價為當前售價，originalPrice 為 null
        price: formData.isOnSale ? formData.salePrice : formData.price,
        originalPrice: formData.isOnSale ? formData.price : null,
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
        if (process.env.NODE_ENV === 'development') {
          logger.info('[DEBUG] CSRF token being sent', {
            metadata: { token: csrfToken.substring(0, 8) + '...' },
          })
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          logger.error('[DEBUG] No CSRF token available!')
        }
      }

      if (process.env.NODE_ENV === 'development') {
        logger.info('[DEBUG] Request headers', {
          metadata: { headerKeys: Object.keys(headers) },
        })
      }

      const response = await fetch('/api/admin-proxy/products', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const result = await response.json()
        logger.info(`✅ 產品建立成功: ${result.product?.id || productId}`)
        setSubmitSuccess('產品新增成功！')
        // 延遲跳轉讓使用者看到成功訊息
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setSubmitError(`新增失敗：${errorData.error || response.status}`)
      }
    } catch {
      setSubmitError('網路錯誤，請檢查網路連線後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'number'
          ? Number(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }))
  }

  const handleImageUploadSuccess = (images: Array<{ url?: string; preview?: string }>) => {
    const urls = images.map(img => img.url).filter((url): url is string => Boolean(url))
    setUploadedImages(prev => [...prev, ...urls])
  }

  const handleImageUploadError = (error: string) => {
    setSubmitError(`圖片上傳失敗: ${error}`)
  }

  const handleImageDelete = (deletedImage: { url?: string; path?: string }) => {
    // 從 uploadedImages 中移除已刪除的圖片 URL
    if (deletedImage.url) {
      setUploadedImages(prev => prev.filter(url => url !== deletedImage.url))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 過時版本提示 */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">使用傳統版本</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>您正在使用舊版產品新增頁面。新版本提供更好的使用體驗和智慧上傳功能。</p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <Link
                    href="/admin/products/add-v2"
                    className="bg-green-600 text-white px-3 py-2 text-xs rounded-lg hover:bg-green-700 transition-colors"
                  >
                    切換至新版
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/products" className="text-amber-600 hover:text-amber-800">
              ← 回到產品列表
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">新增產品 (傳統版)</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          {/* 錯誤訊息顯示 */}
          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* 成功訊息顯示 */}
          {submitSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{submitSuccess}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品名稱 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={() => {
                const error = validateField('name', formData.name)
                setFieldErrors(prev => ({ ...prev, name: error }))
              }}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                fieldErrors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-amber-500'
              }`}
              placeholder="輸入產品名稱"
            />
            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onBlur={() => {
                const error = validateField('description', formData.description)
                setFieldErrors(prev => ({ ...prev, description: error }))
              }}
              required
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                fieldErrors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-amber-500'
              }`}
              placeholder="輸入產品描述"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品分類 *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => {
                // 延遲隱藏建議，讓點擊建議項目有時間執行
                setTimeout(() => {
                  setShowCategorySuggestions(false)
                  const error = validateField('category', formData.category)
                  setFieldErrors(prev => ({ ...prev, category: error }))
                }, 200)
              }}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                fieldErrors.category
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-amber-500'
              }`}
              placeholder="輸入產品分類或選擇現有分類"
            />

            {/* 分類建議下拉列表 */}
            {showCategorySuggestions && categories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
                  現有分類（點擊選擇）
                </div>
                {categories
                  .filter(category =>
                    category.toLowerCase().includes(formData.category.toLowerCase())
                  )
                  .map((category, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category }))
                        setShowCategorySuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none text-gray-900"
                    >
                      {category}
                    </button>
                  ))}
                {categories.filter(category =>
                  category.toLowerCase().includes(formData.category.toLowerCase())
                ).length === 0 &&
                  formData.category && (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      將建立新分類：&ldquo;{formData.category}&rdquo;
                    </div>
                  )}
              </div>
            )}

            {fieldErrors.category && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
            )}
            <div className="text-xs text-gray-500 mt-1">可輸入新分類或從現有分類中選擇</div>
          </div>

          {/* 價格設定 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">價格設定</h3>

            {/* 單位價格設定 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">單位價格</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                {/* 價格 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    單位價格 (NT$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    onBlur={() => {
                      const error = validateField('price', formData.price)
                      setFieldErrors(prev => ({ ...prev, price: error }))
                    }}
                    required
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                      fieldErrors.price
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-amber-500'
                    }`}
                    placeholder="輸入單位價格"
                  />
                  {fieldErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
                  )}
                </div>

                {/* 單位 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    價格單位 *
                  </label>
                  <select
                    name="priceUnit"
                    value={formData.priceUnit}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
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
              </div>

              {/* 價格預覽 */}
              {formData.price > 0 && (
                <div className="bg-white border border-blue-200 rounded p-3">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">價格顯示：</span>
                    NT$ {formData.price} / {formData.priceUnit}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                設定每個銷售單位的價格，例如：NT$ 150 / 斤
              </div>
            </div>

            {/* 特價設定 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="isOnSale"
                  checked={formData.isOnSale}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mr-2"
                />
                <label className="text-sm font-medium text-gray-800">設為特價商品</label>
              </div>

              {formData.isOnSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        特價 (NT$) *
                      </label>
                      <input
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        required={formData.isOnSale}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                        placeholder="輸入特價"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        特價結束日期
                      </label>
                      <input
                        type="date"
                        name="saleEndDate"
                        value={formData.saleEndDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {formData.price > 0 &&
                    formData.salePrice > 0 &&
                    formData.price > formData.salePrice && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
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
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="text-sm text-red-800">
                          <span className="font-medium">注意：</span>
                          特價不能大於或等於原價
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">庫存數量 *</label>
            <input
              type="number"
              name="inventory"
              value={formData.inventory}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="0"
            />
          </div>

          {/* 圖片上傳區域 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品圖片</label>
            <ImageUploader
              productId={productId}
              module="products"
              onUploadSuccess={handleImageUploadSuccess}
              onUploadError={handleImageUploadError}
              onDeleteSuccess={handleImageDelete}
              maxFiles={5}
              allowMultiple={true}
              generateMultipleSizes={false}
              enableCompression={true}
              className="mb-4"
            />
            {uploadedImages.length > 0 && (
              <div className="text-sm text-green-600">已上傳 {uploadedImages.length} 張圖片</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">立即上架販售</label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || csrfLoading || !csrfToken}
              className="px-6 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              {loading ? '新增中...' : csrfLoading ? '初始化中...' : '新增產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

AddProduct.displayName = 'AddProduct'

export default AddProduct
