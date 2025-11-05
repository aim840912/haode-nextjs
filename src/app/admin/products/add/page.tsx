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
import { LockClosedIcon, BeakerIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'

// Hooks
import { useProductForm } from './hooks/useProductForm'
import { useProductSubmit } from './hooks/useProductSubmit'

// Components
import { ProductFormFields } from './components/ProductFormFields'
import { UploadStatsPanel } from './components/UploadStatsPanel'
import { SuccessOverlay } from './components/SuccessOverlay'

// 動態載入產品圖片管理器
const ProductImageManager = dynamic(
  () => import('@/components/features/products/ProductImageManager'),
  {
    loading: () => (
      <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center animate-pulse">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
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
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  // Product ID
  const [productId] = useState(() => uuidv4())

  // 使用自定義 hooks
  const { formData, fieldErrors, updateField, setFieldError, validateForm } = useProductForm()
  const { submitStatus, submitError, submitSuccess, submitProduct } = useProductSubmit()

  // 圖片和分類狀態
  const [tempImages, setTempImages] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [uploadStats] = useState({
    totalImages: 0,
    uploadedImages: 0,
    queuedImages: 0,
    failedImages: 0,
    savedSpace: 0,
    savedTime: 0,
  })

  // 載入分類資料
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const result = await response.json()
        const categoriesData = result.data || result
        setCategories(categoriesData)
        // 設定預設分類
        if (categoriesData.length > 0 && !formData.category) {
          updateField('category', categoriesData[0])
        }
      }
    } catch (error) {
      logger.warn('載入分類資料失敗', { metadata: { error: String(error) } })
    }
  }, [formData.category, updateField])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Blob URL 清理
  useEffect(() => {
    return () => {
      tempImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(img.url)
          } catch (error) {
            logger.debug('清理 Blob URL 失敗', { metadata: { error: String(error) } })
          }
        }
      })
    }
  }, [tempImages])

  // 處理圖片變更
  const handleImageChange = useCallback(
    (images: any[]) => {
      setTempImages(images)
      // 清除圖片錯誤訊息
      if (images.length > 0) {
        setFieldError('images', '')
      }
    },
    [setFieldError]
  )

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表單驗證
    if (!validateForm()) {
      return
    }

    // 圖片驗證
    if (tempImages.length === 0) {
      setFieldError('images', '至少需要上傳一張產品圖片')
      return
    }

    // CSRF 驗證
    if (!csrfToken) {
      return
    }

    // 提交產品
    const success = await submitProduct(productId, formData, tempImages)

    if (success) {
      // 延遲跳轉
      setTimeout(() => {
        router.push('/admin/products')
      }, 2000)
    }
  }

  // 載入狀態
  if (isLoading || csrfLoading) {
    return <AdminPageLoader />
  }

  // 未登入
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="flex justify-center mb-8">
            <LockClosedIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">需要登入</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">請登入後再訪問產品管理功能</p>
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

  // CSRF 錯誤
  if (csrfError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">安全驗證失敗</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">請重新整理頁面再試一次</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* 導航欄 */}
        <nav className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/products"
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  返回產品列表
                </Link>
                <div className="h-6 w-px bg-gray-300 dark:border-slate-600" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">新增產品</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* 主要內容 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 上傳統計面板 */}
          <UploadStatsPanel stats={uploadStats} />

          {/* 產品表單 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 relative">
            <div className="px-6 py-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">產品資訊</h2>
            </div>

            {/* 成功狀態覆蓋層 */}
            <SuccessOverlay show={submitStatus === 'success'} />

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 成功/錯誤訊息 */}
              {submitSuccess && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
                  <div className="text-sm text-green-800 dark:text-green-400">{submitSuccess}</div>
                </div>
              )}

              {submitError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <div className="text-sm text-red-800 dark:text-red-400">{submitError}</div>
                </div>
              )}

              {/* 基本欄位 */}
              <ProductFormFields
                formData={formData}
                fieldErrors={fieldErrors}
                categories={categories}
                onFieldChange={updateField}
              />

              {/* 產品圖片管理 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  產品圖片 *
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  支援批量上傳、拖放排序、設定主圖等功能。建議圖片尺寸為 800x800 像素以上。
                </p>
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-700">
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

              {/* 提交按鈕 */}
              <div className="flex justify-end space-x-4 pt-6 border-t dark:border-slate-700">
                <Link
                  href="/admin/products"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  disabled={submitStatus === 'submitting' || submitStatus === 'success'}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 font-medium ${
                    submitStatus === 'submitting' || submitStatus === 'success'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {submitStatus === 'submitting' ? (
                    <>
                      <BeakerIcon className="w-5 h-5 animate-spin" />
                      <span>建立中...</span>
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>已建立</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>建立產品</span>
                    </>
                  )}
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
