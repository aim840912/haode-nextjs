'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'
import AdminProtection from '@/components/features/admin/AdminProtection'
import { useProductImageSync } from './hooks/useProductImageSync'
import type { PendingImageChanges } from '@/components/features/products/ProductImageManager'

// 動態載入產品圖片管理器，減少初始 bundle 大小
const ProductImageManager = dynamic(
  () => import('@/components/features/products/ProductImageManager'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        載入圖片管理器...
      </div>
    ),
    ssr: false,
  }
)

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [productId, setProductId] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [isDeletingImage] = useState<string | null>(null)
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  // 圖片同步相關
  const { syncAllChanges } = useProductImageSync(productId)
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false)
  const getPendingChangesRef = useRef<() => PendingImageChanges>(() => ({
    deletedIds: [],
    newImages: [],
    reorderedImages: [],
  }))

  // === 統一狀態管理系統 ===
  // 統一提交狀態機
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  )

  // 防重複提交標記
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // 資源清理標記
  const [shouldCleanup, setShouldCleanup] = useState(false)

  // 錯誤狀態管理
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '季節水果',
    price: 0,
    priceUnit: '斤',
    unitQuantity: 1,
    salePrice: 0,
    isOnSale: false,
    saleEndDate: '',
    inventory: 0,
    isActive: true,
  })

  // === 狀態重置函數 ===
  const resetFormState = useCallback(() => {
    setSubmitStatus('idle')
    setLoading(false)
    setSubmitError(null)
    setSubmitSuccess(null)
    setHasSubmitted(false)
    setShouldCleanup(false)
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch {
      // 忽略分類載入錯誤，不影響表單功能
    }
  }, [])

  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (response.ok) {
          const responseData = await response.json()

          // 檢查回應格式是否正確
          if (!responseData.success || !responseData.data) {
            logger.error('產品資料格式錯誤', undefined, { metadata: { responseData } })
            alert('產品資料格式錯誤')
            router.push('/admin/products')
            return
          }

          const product: Product = responseData.data

          // 根據是否為特價商品來設定正確的價格顯示
          const isOnSale = product.isOnSale || false
          const displayPrice = isOnSale ? product.originalPrice || product.price : product.price
          const displaySalePrice = isOnSale ? product.price : 0

          setFormData({
            name: product.name,
            description: product.description,
            category: product.category,
            price: displayPrice, // 顯示原價
            priceUnit: product.priceUnit || '斤', // 價格單位，預設為斤
            unitQuantity: product.unitQuantity || 1, // 單位數量，預設為1
            salePrice: displaySalePrice, // 顯示特價
            isOnSale: isOnSale,
            saleEndDate: product.saleEndDate || '',
            inventory: product.inventory,
            isActive: product.isActive,
          })

          logger.info('產品資料載入成功', {
            metadata: { productId: id, productName: product.name },
          })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.error('產品載入失敗', undefined, {
            metadata: { productId: id, status: response.status, error: errorText },
          })
          alert(`產品不存在 (${response.status})`)
          router.push('/admin/products')
        }
      } catch (error) {
        logger.error(
          '產品載入發生錯誤',
          error instanceof Error ? error : new Error(String(error)),
          { metadata: { productId: id } }
        )
        alert(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
      } finally {
        setInitialLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    fetchCategories()
    params.then(({ id }) => {
      setProductId(id)
      fetchProduct(id)
    })
  }, [params, fetchProduct, fetchCategories])

  // === 資源清理與記憶體管理 ===
  // 成功後資源清理
  useEffect(() => {
    if (shouldCleanup) {
      logger.info('開始清理資源', {
        metadata: {
          productId,
          submitStatus,
        },
      })

      // 延遲清理，在跳轉前完成
      setTimeout(() => {
        logger.info('編輯頁面資源已清理', { metadata: { productId } })
      }, 1500) // 在 2 秒跳轉前清理
    }
  }, [shouldCleanup, productId, submitStatus])

  // 頁面離開保護
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 只在有未儲存變更且未成功提交時警告
      if ((formData.name || formData.description) && submitStatus !== 'success') {
        e.preventDefault()
        e.returnValue = '您有未儲存的變更，確定要離開嗎？'
        return '您有未儲存的變更，確定要離開嗎？'
      }
    }

    // 監聽頁面關閉/重新整理
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 清理函數
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formData, submitStatus])

  // 載入中狀態
  if (isLoading || initialLoading) {
    return (
      <AdminProtection>
        <AdminPageLoader message="載入產品編輯資料中..." />
      </AdminProtection>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
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

  // === 增強版表單提交處理（防禦性編程 + 統一狀態管理）===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🛡️ 防禦性檢查 - 三重防護機制
    if (loading || submitStatus !== 'idle' || hasSubmitted) {
      logger.warn('阻止重複提交', {
        metadata: {
          loading,
          submitStatus,
          hasSubmitted,
          productId,
          timestamp: new Date().toISOString(),
        },
      })
      return
    }

    // 防止在 CSRF token 未準備好時提交
    if (csrfLoading || !csrfToken) {
      setSubmitError('請稍候，正在初始化安全驗證...')
      return
    }

    if (csrfError) {
      setSubmitError('安全驗證初始化失敗，請重新整理頁面')
      return
    }

    // 🔒 鎖定狀態 - 統一狀態管理
    setSubmitStatus('submitting')
    setLoading(true)
    setHasSubmitted(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      // 根據是否為特價商品設定正確的價格，但保留 priceUnit 和 unitQuantity
      const { salePrice: _unusedSalePrice, ...restData } = formData
      const productData = {
        ...restData,
        images: [],
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
      }

      logger.info('開始更新產品', {
        metadata: {
          productId,
          productName: formData.name,
          submitStatus,
          hasPendingImageChanges,
        },
      })

      // 先同步圖片變更（如果有）
      if (hasPendingImageChanges) {
        try {
          const pendingChanges = getPendingChangesRef.current()
          logger.info('同步圖片變更', {
            metadata: {
              productId,
              deletedCount: pendingChanges.deletedIds.length,
              newImagesCount: pendingChanges.newImages.length,
              reorderedCount: pendingChanges.reorderedImages.length,
            },
          })

          await syncAllChanges(
            pendingChanges.deletedIds,
            pendingChanges.newImages,
            pendingChanges.reorderedImages
          )

          logger.info('圖片變更同步完成', { metadata: { productId } })
        } catch (imageError) {
          logger.error('圖片同步失敗', imageError as Error, { metadata: { productId } })
          throw new Error(
            `圖片同步失敗: ${imageError instanceof Error ? imageError.message : '未知錯誤'}`
          )
        }
      }

      const response = await fetch(`/api/admin-proxy/products`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ id: productId, ...productData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '更新失敗' }))
        throw new Error(errorData.error || `更新失敗 (${response.status})`)
      }

      const result = await response.json()

      // ✅ 成功處理 - 設置成功狀態
      setSubmitStatus('success')
      setSubmitSuccess('產品更新成功！即將跳轉...')
      setShouldCleanup(true)

      logger.info('產品更新成功', {
        metadata: {
          productId: productId,
          productName: formData.name,
          submitStatus: 'success',
        },
      })

      // 延遲跳轉，確保狀態穩定
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)
    } catch (error) {
      // ❌ 錯誤處理 - 允許重試
      setSubmitStatus('error')
      const errorMessage = error instanceof Error ? error.message : '更新失敗，請重試'
      setSubmitError(errorMessage)

      // 重置提交標記，允許重試
      setHasSubmitted(false)

      // 錯誤時立即重置 loading 狀態
      setLoading(false)

      logger.error('產品更新失敗', error as Error, {
        metadata: {
          formData: { name: formData.name, category: formData.category },
          submitStatus: 'error',
        },
      })
    }
    // 🎯 修復競態條件：移除 finally block，成功時保持 loading=true 直到跳轉
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

    // 清除錯誤狀態當使用者開始輸入
    if (submitError) {
      setSubmitError(null)
    }
  }

  // 圖片管理已由 ProductImageManager 元件處理

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/products" className="text-amber-600 hover:text-amber-800">
              ← 回到產品列表
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">編輯產品</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品名稱 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入產品名稱"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="輸入產品描述"
            />
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
                setTimeout(() => setShowCategorySuggestions(false), 200)
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
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
                    required
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    placeholder="輸入單位價格"
                  />
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

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">產品圖片</label>
            <p className="text-xs text-gray-600 mb-3">
              支援批量上傳、拖放排序、設定主圖等功能。建議圖片尺寸為 800x800 像素以上。
            </p>

            {/* 新的產品圖片管理器 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              {productId ? (
                <ProductImageManager
                  productId={productId}
                  maxImages={10}
                  mode="edit"
                  onPendingChanges={setHasPendingImageChanges}
                  onGetPendingChanges={getPendingChangesRef}
                  onImagesChange={images => {
                    logger.info('圖片列表更新', {
                      metadata: {
                        context: 'EditProduct',
                        productId,
                        imageCount: images.length,
                      },
                    })
                  }}
                />
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mr-3"></div>
                  <span>載入圖片管理器...</span>
                </div>
              )}
            </div>
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
              <label className="ml-2 block text-sm font-medium text-gray-800">上架販售</label>
            </div>
          </div>

          {/* 錯誤和成功訊息顯示 */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-red-800 text-sm font-medium">{submitError}</div>
              </div>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-green-800 text-sm font-medium">{submitSuccess}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={
                loading ||
                csrfLoading ||
                !csrfToken ||
                isDeletingImage !== null ||
                submitStatus === 'submitting' ||
                hasSubmitted
              }
              className="px-6 py-2 bg-amber-900 text-white rounded-md hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              {loading || submitStatus === 'submitting'
                ? '更新中...'
                : csrfLoading
                  ? '初始化中...'
                  : isDeletingImage
                    ? '圖片處理中...'
                    : submitStatus === 'success'
                      ? '更新成功！'
                      : '更新產品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
