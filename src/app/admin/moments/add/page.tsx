'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import { useCSRFToken } from '@/hooks/useCSRFToken'
import { v4 as uuidv4 } from 'uuid'

// 動態載入圖片上傳器，減少初始 bundle 大小
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

function AddMoment() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [momentId] = useState(() => uuidv4()) // 使用 UUID 作為精彩時刻 ID
  const { user, isLoading } = useAuth()
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCSRFToken()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'moments',
    year: new Date().getFullYear(),
    is_featured: true,
    images: [] as string[],
  })

  // 錯誤狀態管理
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState({
    title: '',
    description: '',
  })

  // 驗證函數
  const validateField = useCallback((field: string, value: any) => {
    switch (field) {
      case 'title':
        return !value.trim() ? '請輸入標題' : ''
      case 'description':
        return !value.trim() ? '請輸入簡短描述' : ''
      default:
        return ''
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const newValue =
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseInt(value) || 0
            : value

      setFormData(prev => ({
        ...prev,
        [name]: newValue,
      }))

      // 清除對應欄位錯誤
      if (fieldErrors[name as keyof typeof fieldErrors]) {
        const error = validateField(name, newValue)
        setFieldErrors(prev => ({ ...prev, [name]: error }))
      }
    },
    [fieldErrors, validateField]
  )

  const handleUploadSuccess = useCallback(
    (images: any[]) => {
      const newImageUrls = images.map(img => img.url || img.path)
      setUploadedImages(prev => [...prev, ...newImageUrls])
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
      }))

      logger.info('精彩時刻圖片上傳成功', {
        metadata: { momentId, imageCount: images.length },
      })
    },
    [momentId]
  )

  const handleUploadError = useCallback(
    (error: string) => {
      setSubmitError(`圖片上傳失敗: ${error}`)
      logger.error('精彩時刻圖片上傳失敗', new Error(error), {
        metadata: { momentId },
      })
    },
    [momentId]
  )

  const handleDeleteSuccess = useCallback(
    (deletedImage: any) => {
      const deletedUrl = deletedImage.url || deletedImage.path
      setUploadedImages(prev => prev.filter(url => url !== deletedUrl))
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== deletedUrl),
      }))

      logger.info('精彩時刻圖片刪除成功', {
        metadata: { momentId, deletedUrl },
      })
    },
    [momentId]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (loading || csrfLoading) return

      setSubmitError(null)
      setSubmitSuccess(null)

      // 欄位級驗證
      const newFieldErrors = {
        title: validateField('title', formData.title),
        description: validateField('description', formData.description),
      }

      setFieldErrors(newFieldErrors)

      // 檢查是否有任何錯誤
      const hasErrors = Object.values(newFieldErrors).some(error => error !== '')
      if (hasErrors) {
        setSubmitError('請修正表單中的錯誤後再提交')
        return
      }

      setLoading(true)

      try {
        logger.info('開始建立精彩時刻', {
          metadata: {
            momentId,
            title: formData.title,
            imageCount: formData.images.length,
          },
        })

        const response = await fetch('/api/moments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          body: JSON.stringify({
            ...formData,
            id: momentId,
            imageUrl: formData.images[0] || undefined, // 添加 imageUrl 欄位
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || '建立精彩時刻失敗')
        }

        logger.info('精彩時刻建立成功', {
          metadata: { momentId, title: formData.title },
        })

        setSubmitSuccess('精彩時刻建立成功！正在跳轉...')
        setTimeout(() => {
          router.push('/admin/moments')
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '建立精彩時刻失敗'
        setSubmitError(errorMessage)
        logger.error('建立精彩時刻失敗', error as Error, {
          metadata: { momentId, formData },
        })
      } finally {
        setLoading(false)
      }
    },
    [loading, csrfLoading, formData, momentId, csrfToken, router, validateField]
  )

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
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

  // CSRF Token 載入錯誤
  if (csrfError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">安全驗證失敗</h1>
          <p className="text-gray-600 mb-8">無法載入安全驗證令牌，請重新整理頁面</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
          >
            重新整理
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">新增精彩時刻</h1>
          <Link
            href="/admin/moments"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* 錯誤訊息顯示 */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">基本資訊</h2>

            <div className="grid grid-cols-1 gap-6">
              {/* 標題 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={() => {
                    const error = validateField('title', formData.title)
                    setFieldErrors(prev => ({ ...prev, title: error }))
                  }}
                  required
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
                    fieldErrors.title
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  placeholder="請輸入精彩時刻的標題"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                )}
              </div>

              {/* 描述 */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  簡短描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  onBlur={() => {
                    const error = validateField('description', formData.description)
                    setFieldErrors(prev => ({ ...prev, description: error }))
                  }}
                  required
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
                    fieldErrors.description
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  placeholder="請輸入簡短描述（會顯示在卡片上）"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* 詳細內容 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  詳細內容
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="請輸入詳細內容（可選）"
                />
              </div>

              {/* 年份和分類 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    年份
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min={2000}
                    max={2030}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    分類
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="moments">精彩時刻</option>
                  </select>
                </div>
              </div>

              {/* 是否精選 */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">設為精選項目</span>
                </label>
              </div>
            </div>
          </div>

          {/* 圖片上傳 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">圖片</h2>

            <ImageUploader
              productId={momentId}
              module="moments"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onDeleteSuccess={handleDeleteSuccess}
              maxFiles={10}
              allowMultiple={true}
              className="border-2 border-dashed border-gray-300 rounded-lg"
            />

            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">已上傳 {uploadedImages.length} 張圖片</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {uploadedImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`上傳圖片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-between items-center pt-6">
            <Link
              href="/admin/moments"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              取消
            </Link>

            <div className="space-x-4">
              <button
                type="submit"
                disabled={loading || csrfLoading}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '建立中...' : '建立精彩時刻'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMoment
