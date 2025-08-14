'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NewsItem } from '@/types/news'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [newsId, setNewsId] = useState<string>('')
  const { user, isLoading } = useAuth()

  // 載入中狀態
  if (isLoading || initialLoading) {
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
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    author: '豪德農場',
    category: '產品動態',
    tags: '',
    image: '📰',
    featured: false
  })

  const categories = [
    '產品動態',
    '產品研發', 
    '永續農業',
    '活動資訊',
    '市場動態',
    '公司動態'
  ]

  const emojiOptions = [
    '📰', '🍑', '☕', '🥬', '🌱', '🏪', '🏆', 
    '🌾', '🚜', '🌿', '🍎', '🥕', '🌽', '🍓'
  ]

  const fetchNews = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/news/${id}`)
      if (response.ok) {
        const news: NewsItem = await response.json()
        setFormData({
          title: news.title,
          summary: news.summary,
          content: news.content,
          author: news.author,
          category: news.category,
          tags: news.tags.join(', '),
          image: news.image,
          featured: news.featured
        })
      } else {
        alert('新聞不存在')
        router.push('/admin/news')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      alert('載入失敗')
    } finally {
      setInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    params.then(({ id }) => {
      setNewsId(id)
      fetchNews(id)
    })
  }, [params, fetchNews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch(`/api/news/${newsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      })

      if (response.ok) {
        router.push('/admin/news')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating news:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin/news"
              className="text-blue-600 hover:text-blue-800"
            >
              ← 回到新聞管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">編輯新聞</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              新聞標題 *
            </label>
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              新聞摘要 *
            </label>
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              新聞內容 *
            </label>
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

          {/* 分類和作者 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                新聞分類 *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                作者 *
              </label>
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

          {/* 圖示和標籤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                新聞圖示
              </label>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: emoji }))}
                    className={`p-2 text-2xl border rounded-md hover:bg-gray-50 transition-colors ${
                      formData.image === emoji ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="或自定義 emoji"
              />
            </div>

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
                標籤預覽：{formData.tags.split(',').filter(tag => tag.trim()).map(tag => `#${tag.trim()}`).join(' ')}
              </div>
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
                <span className="text-3xl mr-3">{formData.image}</span>
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
  )
}