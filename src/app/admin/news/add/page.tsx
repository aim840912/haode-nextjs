'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
// 圖片上傳現在通過 API 路由處理

export default function AddNews() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    author: '豪德農場',
    category: '產品動態',
    tags: '',
    imageUrl: '',
    featured: false
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

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

  const categories = [
    '產品動態',
    '永續農業',
    '活動資訊'
  ]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      let imageUrl = formData.imageUrl
      
      // 如果有新選擇的圖片，先上傳到 Storage
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile)
      }

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          tags: tagsArray
        })
      })

      if (response.ok) {
        router.push('/admin/news')
      } else {
        alert('發布失敗')
      }
    } catch (error) {
      console.error('Error adding news:', error)
      alert('發布失敗')
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // 建立預覽 URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      // 通過 API 路由上傳圖片（確保 bucket 初始化）
      const formData = new FormData()
      formData.append('file', file)
      formData.append('newsId', `news_${Date.now()}`)
      
      const response = await fetch('/api/news/images', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '圖片上傳失敗')
      }
      
      const result = await response.json()
      console.log('圖片上傳成功:', result)
      return result.data.url
    } catch (error) {
      console.error('圖片上傳失敗:', error)
      alert('圖片上傳失敗，請重試')
      throw error
    } finally {
      setUploading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">發布新聞</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
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

          {/* 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              新聞圖片
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="mb-4">
                    <img 
                      src={imagePreview} 
                      alt="預覽" 
                      className="mx-auto h-32 w-auto object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('')
                        setImageFile(null)
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-500"
                      disabled={uploading}
                    >
                      移除圖片
                    </button>
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>上傳圖片</span>
                        <input
                          id="image-upload" 
                          name="image-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">或拖拽檔案到此處</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 分類和作者 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
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

          {/* 標籤 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
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
            <div className="mt-2 text-sm text-gray-500">
              標籤預覽：{formData.tags.split(',').filter(tag => tag.trim()).map(tag => `#${tag.trim()}`).join(' ')}
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
            <label className="ml-2 block text-sm text-gray-900">
              設為精選新聞 (會在首頁顯示)
            </label>
          </div>

          {/* 預覽區 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">預覽</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-3">
                {formData.imageUrl && (
                  <img 
                    src={formData.imageUrl} 
                    alt="預覽" 
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
                作者：{formData.author} | 發布時間：{new Date().toLocaleDateString('zh-TW')}
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/news"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {uploading ? '上傳圖片中...' : loading ? '發布中...' : '發布新聞'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}