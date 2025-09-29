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
import {
  LockClosedIcon,
  BeakerIcon,
  ArrowLeftIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// 動態載入產品圖片管理器，減少初始 bundle 大小
const ProductImageManager = dynamic(
  () => import('@/components/features/products/ProductImageManager'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
        <div className="flex items-center space-x-2 text-gray-500">
          <BeakerIcon className="w-5 h-5 animate-spin" />
          <span>載入圖片管理器...</span>
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
  const [productId] = useState(() => uuidv4()) // 使用 UUID 作為產品 ID
  const [tempImages, setTempImages] = useState<any[]>([]) // 記憶體暫存圖片
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
    inventory: 0,
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

  // 智慧上傳統計
  const [uploadStats, setUploadStats] = useState({
    totalImages: 0,
    uploadedImages: 0,
    queuedImages: 0,
    failedImages: 0,
    savedSpace: 0, // 節省的儲存空間 (bytes)
    savedTime: 0, // 節省的時間 (ms)
  })

  // === 統一狀態管理系統 ===
  // 統一提交狀態機
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  )

  // 防重複提交標記
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // 資源清理標記
  const [shouldCleanup, setShouldCleanup] = useState(false)

  // === 狀態重置函數 ===
  const resetFormState = useCallback(() => {
    setSubmitStatus('idle')
    setLoading(false)
    setSubmitError(null)
    setSubmitSuccess(null)
    setHasSubmitted(false)
    setShouldCleanup(false)
  }, [])

  const resetToInitialState = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      priceUnit: '斤',
      unitQuantity: 1,
      inventory: 0,
      isActive: true,
    })
    setTempImages([])
    setFieldErrors({
      name: '',
      description: '',
      category: '',
      price: '',
      inventory: '',
      images: '',
    })
    resetFormState()
  }, [resetFormState])

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

  // === 資源清理與記憶體管理 ===
  // Blob URL 清理效果
  useEffect(() => {
    if (shouldCleanup) {
      logger.info('開始清理資源', {
        metadata: {
          imageCount: tempImages.length,
          productId,
          submitStatus,
        },
      })

      // 清理 Blob URLs 防止記憶體泄漏
      tempImages.forEach((img, index) => {
        if (img.storage_url && img.storage_url.startsWith('blob:')) {
          URL.revokeObjectURL(img.storage_url)
          logger.debug(`已清理 Blob URL ${index + 1}`, {
            metadata: { blobUrl: img.storage_url.substring(0, 50) + '...' },
          })
        }
      })

      // 延遲清空數據，在跳轉前完成
      setTimeout(() => {
        setTempImages([])
        setFormData(prev => ({
          ...prev,
          name: '',
          description: '',
          category: '',
        }))
        logger.info('表單資料已清理', { metadata: { productId } })
      }, 1500) // 在 2 秒跳轉前清理
    }
  }, [shouldCleanup, tempImages, productId, submitStatus])

  // 頁面離開保護
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 只在有未儲存資料且未成功提交時警告
      if (tempImages.length > 0 && submitStatus !== 'success') {
        e.preventDefault()
        e.returnValue = '您有未儲存的圖片，確定要離開嗎？'
        return '您有未儲存的圖片，確定要離開嗎？'
      }
    }

    // 監聽頁面關閉/重新整理
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 清理函數
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      // 組件卸載時清理所有 Blob URLs
      tempImages.forEach(img => {
        if (img.storage_url && img.storage_url.startsWith('blob:')) {
          URL.revokeObjectURL(img.storage_url)
        }
      })
    }
  }, [tempImages, submitStatus])

  // 使用增強的表單驗證（保留向後相容）
  const validateForm = () => {
    const errors = {
      name: '',
      description: '',
      category: '',
      price: '',
      inventory: '',
      images: '',
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

    if (formData.inventory < 0) {
      errors.inventory = '庫存不能為負數'
      hasErrors = true
    }

    setFieldErrors(errors)
    return !hasErrors
  }

  // 處理圖片變更（記憶體暫存）
  const handleImageChange = useCallback(
    (images: any[]) => {
      setTempImages(images)
      logger.debug('圖片列表更新（記憶體暫存）', {
        metadata: { imageCount: images.length, productId },
      })
    },
    [productId]
  )

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

    // 📋 表單驗證
    if (!validateForm()) {
      setSubmitError('請修正表單中的錯誤')
      return
    }

    if (tempImages.length === 0) {
      setFieldErrors(prev => ({ ...prev, images: '至少需要上傳一張產品圖片' }))
      setSubmitError('請至少上傳一張產品圖片')
      return
    }

    if (!csrfToken) {
      setSubmitError('安全驗證失敗，請重新整理頁面')
      return
    }

    // 🔒 鎖定狀態 - 統一狀態管理
    setSubmitStatus('submitting')
    setLoading(true)
    setHasSubmitted(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const productData = {
        id: productId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: formData.price,
        priceUnit: formData.priceUnit,
        unitQuantity: formData.unitQuantity,
        inventory: formData.inventory,
        isActive: formData.isActive,
      }

      // 處理圖片資料：記憶體模式轉換為 Base64，已上傳模式使用 URL/path
      const imagesData = await Promise.all(
        tempImages.map(async (img, index) => {
          if (img._originalFile) {
            // 記憶體模式：轉換 File 為 Base64
            const file = img._originalFile

            // 檔案大小檢查 (5MB = 5 * 1024 * 1024 bytes)
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(
                `圖片檔案 "${file.name}" 過大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，請選擇小於 5MB 的圖片`
              )
            }

            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result
                if (typeof result === 'string') {
                  resolve(result)
                } else {
                  reject(new Error(`圖片 "${file.name}" 讀取失敗：結果格式錯誤`))
                }
              }
              reader.onerror = () => {
                const error = reader.error
                reject(new Error(`圖片 "${file.name}" 讀取失敗：${error?.message || '未知錯誤'}`))
              }
              reader.readAsDataURL(file)
            })

            return {
              base64Data,
              fileName: img._originalFile.name,
              alt: img.alt || `${formData.name} - 圖片 ${index + 1}`,
              position: img.position ?? index,
              size: img.size || 'medium',
              width: img.width,
              height: img.height,
              file_size: img.file_size || img._originalFile.size,
            }
          } else {
            // 已上傳模式：使用現有的 URL/path
            return {
              url: img.storage_url || img.url,
              path: img.file_path || img.path,
              alt: img.alt || `${formData.name} - 圖片 ${index + 1}`,
              position: img.position ?? index,
              size: img.size || 'medium',
              width: img.width,
              height: img.height,
              file_size: img.file_size,
            }
          }
        })
      )

      logger.info('開始事務式建立產品', {
        metadata: {
          productId,
          productName: formData.name,
          imageCount: imagesData.length,
          submitStatus,
        },
      })

      const response = await fetch('/api/admin/products/create-with-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: productData,
          images: imagesData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '建立失敗' }))
        throw new Error(errorData.message || `建立失敗 (${response.status})`)
      }

      const result = await response.json()

      // ✅ 成功處理 - 設置成功狀態
      setSubmitStatus('success')
      setSubmitSuccess('產品建立成功！即將跳轉...')
      setShouldCleanup(true)

      logger.info('產品建立成功', {
        metadata: {
          productId: productId,
          productName: formData.name,
          imageCount: imagesData.length,
          executionTime: result.data?.meta?.executionTime,
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
      const errorMessage = error instanceof Error ? error.message : '建立失敗，請重試'
      setSubmitError(errorMessage)

      // 重置提交標記，允許重試
      setHasSubmitted(false)

      // 錯誤時立即重置 loading 狀態
      setLoading(false)

      logger.error('產品建立失敗', error as Error, {
        metadata: {
          formData: { name: formData.name, category: formData.category },
          submitStatus: 'error',
        },
      })
    }
    // 🎯 修復競態條件：移除 finally block，成功時保持 loading=true 直到跳轉
  }

  // 處理輸入變化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 清除對應欄位的錯誤
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // 圖片變更處理已整合到 handleImageChange

  // 處理上傳統計更新
  const handleUploadStatsChange = (stats: typeof uploadStats) => {
    setUploadStats(stats)
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
                <h1 className="text-xl font-semibold text-gray-900">新增產品</h1>
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
          <div className="bg-white rounded-lg shadow-sm border relative">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">產品資訊</h2>
            </div>

            {/* 成功狀態覆蓋層 */}
            {submitStatus === 'success' && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="text-center p-8">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">產品建立成功！</h3>
                  <p className="text-lg text-gray-600 mb-4">即將跳轉到產品列表...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

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

              {/* 庫存 */}
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* 產品圖片管理 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">產品圖片 *</label>
                <p className="text-xs text-gray-600 mb-3">
                  支援批量上傳、拖放排序、設定主圖等功能。建議圖片尺寸為 800x800 像素以上。
                </p>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <ProductImageManager
                    productId={productId}
                    maxImages={10}
                    mode="memory"
                    onImagesChange={handleImageChange}
                  />
                </div>
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
                  disabled={loading || submitStatus === 'submitting' || submitStatus === 'success'}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 font-medium ${
                    submitStatus === 'success'
                      ? 'bg-green-600 text-white cursor-not-allowed ring-2 ring-green-300'
                      : loading || submitStatus === 'submitting'
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                  }`}
                >
                  {(loading || submitStatus === 'submitting') && (
                    <BeakerIcon className="w-4 h-4 animate-spin" />
                  )}
                  {submitStatus === 'success' && <CheckIcon className="w-4 h-4 animate-pulse" />}
                  <span>
                    {submitStatus === 'submitting'
                      ? '建立中...'
                      : submitStatus === 'success'
                        ? '跳轉中...'
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
