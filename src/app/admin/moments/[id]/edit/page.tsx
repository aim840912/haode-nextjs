'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import { useCSRFToken } from '@/hooks/useCSRFToken'

// 動態載入圖片上傳器
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})

interface EditMomentProps {
  params: Promise<{ id: string }>
}

function EditMoment({ params }: EditMomentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingMoment, setLoadingMoment] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [momentId, setMomentId] = useState<string>('')
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

  // 解析 params
  useEffect(() => {
    params.then(({ id }) => {
      setMomentId(id)
    })
  }, [params])

  // 載入現有精彩時刻資料
  useEffect(() => {
    if (!momentId) return

    const fetchMoment = async () => {
      try {
        setLoadingMoment(true)
        const response = await fetch(`/api/moments/${momentId}`)

        if (!response.ok) {
          if (response.status === 404) {
            alert('找不到此精彩時刻')
            router.push('/admin/moments')
            return
          }
          throw new Error('載入精彩時刻失敗')
        }

        const result = await response.json()
        if (result.success) {
          const moment = result.data
          // 處理圖片資料：優先使用 images 陣列，如果沒有則從 imageUrl 創建陣列
          const existingImages =
            moment.images && moment.images.length > 0
              ? moment.images
              : moment.imageUrl
                ? [moment.imageUrl]
                : []

          setFormData({
            title: moment.title || '',
            description: moment.description || moment.subtitle || '',
            content: moment.content || '',
            category: moment.category || 'moments',
            year: moment.year || new Date().getFullYear(),
            is_featured: moment.is_featured !== false,
            images: existingImages,
          })
          setUploadedImages(existingImages)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '載入精彩時刻失敗'
        alert(errorMessage)
        logger.error('載入精彩時刻失敗', error as Error, {
          metadata: { momentId },
        })
      } finally {
        setLoadingMoment(false)
      }
    }

    fetchMoment()
  }, [momentId, router])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      setFormData(prev => ({
        ...prev,
        [name]:
          type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : type === 'number'
              ? parseInt(value) || 0
              : value,
      }))
    },
    []
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
      alert(`圖片上傳失敗: ${error}`)
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

  const handleRemoveImage = useCallback(
    async (imageUrl: string) => {
      try {
        // 從 URL 提取檔案路徑用於 Storage 刪除
        const urlParts = new URL(imageUrl)
        const pathMatch = urlParts.pathname.match(/\/moments\/(.+)$/)
        const filePath = pathMatch ? pathMatch[1] : null

        if (filePath) {
          logger.info('開始刪除 Storage 圖片', {
            metadata: { momentId, imageUrl: imageUrl.substring(0, 50) + '...', filePath },
          })

          // 呼叫 DELETE API 刪除 storage 中的檔案
          const response = await fetch('/api/upload/moments', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken || '',
            },
            body: JSON.stringify({
              filePath,
              momentId,
            }),
          })

          if (!response.ok) {
            const result = await response.json()
            throw new Error(result.message || '刪除圖片失敗')
          }

          logger.info('Storage 圖片刪除成功', {
            metadata: { momentId, filePath },
          })
        }

        // 成功刪除後，從 state 移除
        setUploadedImages(prev => prev.filter(url => url !== imageUrl))
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter(url => url !== imageUrl),
        }))

        logger.info('圖片已從列表移除', {
          metadata: { momentId, imageUrl: imageUrl.substring(0, 50) + '...' },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '刪除圖片失敗'
        alert(`刪除圖片失敗: ${errorMessage}`)
        logger.error('圖片刪除失敗', error as Error, {
          metadata: { momentId, imageUrl },
        })
      }
    },
    [momentId, csrfToken]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (loading || csrfLoading) return

      // 表單驗證
      if (!formData.title.trim()) {
        alert('請輸入標題')
        return
      }

      if (!formData.description.trim()) {
        alert('請輸入描述')
        return
      }

      setLoading(true)

      try {
        logger.info('開始更新精彩時刻', {
          metadata: {
            momentId,
            title: formData.title,
            imageCount: formData.images.length,
          },
        })

        const response = await fetch(`/api/moments/${momentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          body: JSON.stringify({
            ...formData,
            imageUrl: formData.images[0] || undefined, // 添加 imageUrl 欄位
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || '更新精彩時刻失敗')
        }

        logger.info('精彩時刻更新成功', {
          metadata: { momentId, title: formData.title },
        })

        alert('精彩時刻更新成功！')
        router.push('/admin/moments')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新精彩時刻失敗'
        alert(errorMessage)
        logger.error('更新精彩時刻失敗', error as Error, {
          metadata: { momentId, formData },
        })
      } finally {
        setLoading(false)
      }
    },
    [loading, csrfLoading, formData, momentId, csrfToken, router]
  )

  const handleDelete = useCallback(async () => {
    if (!confirm('確定要刪除這個精彩時刻嗎？此操作無法復原。')) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/moments/${momentId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || '刪除失敗')
      }

      logger.info('精彩時刻刪除成功', {
        metadata: { momentId },
      })

      alert('精彩時刻已刪除')
      router.push('/admin/moments')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除失敗'
      alert(errorMessage)
      logger.error('刪除精彩時刻失敗', error as Error, {
        metadata: { momentId },
      })
      setLoading(false)
    }
  }, [momentId, csrfToken, router, setLoading])

  // 載入中狀態
  if (isLoading || loadingMoment) {
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
          <h1 className="text-3xl font-bold text-gray-900">編輯精彩時刻</h1>
          <Link
            href="/admin/moments"
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="請輸入精彩時刻的標題"
                />
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
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="請輸入簡短描述（會顯示在卡片上）"
                />
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

          {/* 現有圖片 */}
          {uploadedImages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">現有圖片</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`圖片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新增圖片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">新增圖片</h2>

            <ImageUploader
              productId={momentId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onDeleteSuccess={handleDeleteSuccess}
              maxFiles={10}
              allowMultiple={true}
              apiEndpoint="/api/upload/moments"
              idParamName="momentId"
              className="border-2 border-dashed border-gray-300 rounded-lg"
            />
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              刪除精彩時刻
            </button>

            <div className="space-x-4">
              <Link
                href="/admin/moments"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </Link>

              <button
                type="submit"
                disabled={loading || csrfLoading}
                className="bg-amber-900 text-white px-8 py-3 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '更新中...' : '更新精彩時刻'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMoment
