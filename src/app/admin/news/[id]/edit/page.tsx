'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NewsItem } from '@/types/news'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
import AdminProtection from '@/components/features/admin/AdminProtection'

// 動態載入圖片上傳器，減少初始 bundle 大小
const ImageUploader = dynamic(() => import('@/components/features/products/ImageUploader'), {
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      載入圖片上傳器...
    </div>
  ),
  ssr: false,
})
// 圖片上傳現在通過 API 路由處理

export default function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [newsId, setNewsId] = useState<string>('')
  const { user, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    author: '豪德農場',
    category: '產品動態',
    tags: '',
    imageUrl: '',
    featured: false,
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const categories = ['產品動態', '永續農業', '活動資訊']

  const fetchNews = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/news/${id}`)
        if (response.ok) {
          const result = await response.json()

          // 處理統一 API 格式
          if (!result.success || !result.data) {
            logger.error('新聞資料格式錯誤', undefined, { metadata: { result } })
            alert('資料格式錯誤')
            router.push('/admin/news')
            return
          }

          const news: NewsItem = result.data // 從 data 屬性取得新聞資料

          setFormData({
            title: news.title,
            summary: news.summary,
            content: news.content,
            author: news.author,
            category: news.category,
            tags: Array.isArray(news.tags) ? news.tags.join(', ') : '',
            imageUrl: news.imageUrl || '',
            featured: news.featured,
          })

          logger.info('新聞資料載入成功', {
            metadata: { newsId: id, newsTitle: news.title },
          })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.error('新聞載入失敗', undefined, {
            metadata: { newsId: id, status: response.status, error: errorText },
          })
          alert(`新聞不存在 (${response.status})`)
          router.push('/admin/news')
        }
      } catch (error) {
        logger.error(
          '新聞載入發生錯誤',
          error instanceof Error ? error : new Error(String(error)),
          { metadata: { newsId: id } }
        )
        alert(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
      } finally {
        setInitialLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    params.then(({ id }) => {
      setNewsId(id)
      fetchNews(id)
    })
  }, [params, fetchNews])

  if (initialLoading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // 使用上傳成功的圖片 URL（與產品上傳邏輯一致，過濾空字串）
      const imageUrl =
        uploadedImages.length > 0
          ? uploadedImages[0]
          : formData.imageUrl && formData.imageUrl.trim() !== ''
            ? formData.imageUrl
            : undefined

      // 準備提交資料，只包含有效的欄位
      const submitData: Record<string, any> = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        author: formData.author,
        category: formData.category,
        tags: tagsArray,
        featured: formData.featured,
      }

      // 只有當 imageUrl 有值且不為空字串時才包含
      if (imageUrl && imageUrl.trim() !== '') {
        submitData.imageUrl = imageUrl
      }

      const response = await fetch(`/api/news/${newsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push('/admin/news')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      logger.error(
        'Error updating news:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert('更新失敗')
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageUploadSuccess = (images: Array<{ url?: string; preview?: string }>) => {
    const urls = images
      .map(img => img.url || img.preview)
      .filter((url): url is string => Boolean(url))

    setUploadedImages(prev => [...prev, ...urls])

    // 如果是單圖上傳（新聞只允許一張圖），更新 formData.imageUrl
    if (urls.length > 0) {
      setFormData(prev => ({
        ...prev,
        imageUrl: urls[0], // 新聞只使用第一張圖片
      }))
    }
  }

  const handleImageUploadError = (error: string) => {
    alert(`圖片上傳失敗: ${error}`)
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/admin/news" className="text-blue-600 hover:text-blue-800">
                ← 回到新聞管理
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">編輯新聞</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* 標題 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">新聞標題 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="輸入新聞標題"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">新聞摘要 *</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="輸入新聞摘要，用於列表顯示"
              />
            </div>

            {/* 內容 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">新聞內容 *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="輸入新聞完整內容&#10;&#10;支援格式：&#10;• 項目符號列表&#10;→ 箭頭列表&#10;✓ 勾選列表&#10;&#10;段落間用空行分隔"
              />
            </div>

            {/* 圖片管理 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">新聞圖片</label>
              <ImageUploader
                productId={newsId}
                module="news"
                initialImages={formData.imageUrl ? [formData.imageUrl] : []}
                onUploadSuccess={handleImageUploadSuccess}
                onUploadError={handleImageUploadError}
                onDeleteInitialImage={() => {
                  // 刪除初始圖片時，清空 formData.imageUrl
                  setFormData(prev => ({ ...prev, imageUrl: '' }))
                }}
                onDeleteSuccess={deletedImage => {
                  // 如果刪除的是當前圖片，清空 formData.imageUrl
                  if (deletedImage.url === formData.imageUrl) {
                    setFormData(prev => ({ ...prev, imageUrl: '' }))
                  }
                }}
                maxFiles={1}
                allowMultiple={false}
                generateMultipleSizes={false}
                enableCompression={true}
                className="mb-4"
              />
              {uploadedImages.length > 0 && (
                <div className="text-sm text-green-600">
                  已上傳 {uploadedImages.length} 張新圖片
                  {formData.imageUrl && ' （將替換原有圖片）'}
                </div>
              )}
            </div>

            {/* 分類和作者 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">新聞分類 *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">作者 *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="輸入作者名稱"
                />
              </div>
            </div>

            {/* 標籤 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                標籤 (用逗號分隔)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="例如：紅肉李,有機農業,豐收"
              />
              <div className="mt-2 text-sm text-gray-600">
                標籤預覽：
                {formData.tags
                  .split(',')
                  .filter(tag => tag.trim())
                  .map(tag => `#${tag.trim()}`)
                  .join(' ')}
              </div>
            </div>

            {/* 精選新聞 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-gray-800">
                設為精選新聞 (會在首頁顯示)
              </label>
            </div>

            {/* 預覽區 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  {formData.imageUrl && (
                    <Image
                      src={formData.imageUrl}
                      alt="預覽"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-lg mr-3"
                    />
                  )}
                  <div>
                    <div className="text-xs text-blue-600 mb-1">{formData.category}</div>
                    <h4 className="font-semibold text-gray-900">{formData.title || '新聞標題'}</h4>
                  </div>
                  {formData.featured && (
                    <span className="ml-auto bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      ⭐ 精選
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {formData.summary || '新聞摘要會顯示在這裡'}
                </p>
                <div className="text-xs text-gray-500">
                  作者：{formData.author} | 更新時間：{new Date().toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/news"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '更新中...' : '更新新聞'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminProtection>
  )
}
