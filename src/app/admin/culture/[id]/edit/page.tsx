'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CultureItem } from '@/types/culture'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function EditCulture({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [cultureId, setCultureId] = useState<string>('')

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    height: 'h-64',
    textColor: 'text-white',
    imageUrl: ''
  })

  const fetchCultureItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/culture/${id}`)
      if (response.ok) {
        const cultureItem: CultureItem = await response.json()
        setFormData({
          title: cultureItem.title,
          subtitle: cultureItem.subtitle,
          description: cultureItem.description,
          color: cultureItem.color,
          height: cultureItem.height,
          textColor: cultureItem.textColor,
          imageUrl: cultureItem.imageUrl || ''
        })
      } else {
        alert('找不到該文化典藏項目')
        router.push('/admin/culture')
      }
    } catch (error) {
      console.error('Error fetching culture item:', error)
      alert('載入失敗')
      router.push('/admin/culture')
    }
  }, [router])

  // 取得參數並載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params
        setCultureId(id)
        await fetchCultureItem(id)
      } catch (error) {
        console.error('Error loading data:', error)
        alert('載入失敗')
        router.push('/admin/culture')
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()
  }, [params, router, fetchCultureItem])

  // 載入中狀態
  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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

  const colorOptions = [
    { name: '琥珀色', value: 'bg-gradient-to-br from-amber-400 to-amber-600', preview: 'from-amber-400 to-amber-600' },
    { name: '綠色', value: 'bg-gradient-to-br from-green-400 to-green-600', preview: 'from-green-400 to-green-600' },
    { name: '青色', value: 'bg-gradient-to-br from-teal-400 to-teal-600', preview: 'from-teal-400 to-teal-600' },
    { name: '橙色', value: 'bg-gradient-to-br from-orange-400 to-orange-600', preview: 'from-orange-400 to-orange-600' },
    { name: '玫瑰色', value: 'bg-gradient-to-br from-rose-400 to-rose-600', preview: 'from-rose-400 to-rose-600' },
    { name: '棕色', value: 'bg-gradient-to-br from-brown-400 to-brown-600', preview: 'from-brown-400 to-brown-600' },
    { name: '黃橙色', value: 'bg-gradient-to-br from-yellow-500 to-orange-500', preview: 'from-yellow-500 to-orange-500' },
    { name: '靛青色', value: 'bg-gradient-to-br from-indigo-400 to-indigo-600', preview: 'from-indigo-400 to-indigo-600' },
    { name: '紫色', value: 'bg-gradient-to-br from-purple-400 to-purple-600', preview: 'from-purple-400 to-purple-600' },
    { name: '青藍色', value: 'bg-gradient-to-br from-cyan-400 to-cyan-600', preview: 'from-cyan-400 to-cyan-600' },
    { name: '藍色', value: 'bg-gradient-to-br from-blue-400 to-blue-600', preview: 'from-blue-400 to-blue-600' },
    { name: '翠綠色', value: 'bg-gradient-to-br from-emerald-400 to-emerald-600', preview: 'from-emerald-400 to-emerald-600' }
  ]

  const heightOptions = [
    { name: '中等', value: 'h-64' },
    { name: '較高', value: 'h-80' },
    { name: '很高', value: 'h-96' }
  ]

  const textColorOptions = [
    { name: '白色', value: 'text-white' },
    { name: '黑色', value: 'text-black' },
    { name: '灰色', value: 'text-gray-700' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/culture/${cultureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/culture')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating culture item:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">編輯文化典藏</h1>
              <p className="text-gray-600 mt-2">修改典藏內容的詳細資訊</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin/culture"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                form="edit-culture-form"
                disabled={loading}
                className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 編輯表單 */}
          <form id="edit-culture-form" onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* 標題 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                標題
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入標題"
              />
            </div>

            {/* 副標題 */}
            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-900 mb-2">
                副標題
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入副標題"
              />
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="詳細描述文化典藏內容"
              />
            </div>

            {/* 圖片 URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-900 mb-2">
                典藏圖片 URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="https://example.com/image.jpg (選填，留空則使用色塊背景)"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={formData.imageUrl} 
                    alt="圖片預覽" 
                    className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 背景色選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                背景色彩
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.color === color.value 
                        ? 'border-orange-500 shadow-md' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className={`w-full h-12 rounded bg-gradient-to-br ${color.preview} mb-2`}></div>
                    <div className="text-xs text-gray-700 text-center">{color.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 高度選擇 */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-900 mb-2">
                卡片高度
              </label>
              <select
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {heightOptions.map((height) => (
                  <option key={height.value} value={height.value}>
                    {height.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 文字色彩 */}
            <div>
              <label htmlFor="textColor" className="block text-sm font-medium text-gray-900 mb-2">
                文字色彩
              </label>
              <select
                id="textColor"
                name="textColor"
                value={formData.textColor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {textColorOptions.map((textColor) => (
                  <option key={textColor.value} value={textColor.value}>
                    {textColor.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* 即時預覽 */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className={`relative ${formData.height} rounded-lg overflow-hidden`}>
                {formData.imageUrl ? (
                  // 顯示圖片背景
                  <div className="relative w-full h-full">
                    <img 
                      src={formData.imageUrl} 
                      alt="背景圖片" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 p-6 flex flex-col justify-between">
                      <div>
                        <div className="text-white text-sm opacity-90 mb-2">
                          {formData.subtitle || '副標題預覽'}
                        </div>
                        <h3 className="text-white text-xl font-bold mb-3 drop-shadow-lg">
                          {formData.title || '標題預覽'}
                        </h3>
                        <p className="text-white text-sm opacity-90 leading-relaxed drop-shadow">
                          {formData.description || '描述內容預覽...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 顯示色塊背景
                  <div className={`${formData.color} h-full p-6 rounded-lg relative overflow-hidden`}>
                    <div className={`${formData.textColor} h-full flex flex-col justify-between relative z-10`}>
                      <div>
                        <div className="text-sm opacity-80 mb-2">
                          {formData.subtitle || '副標題預覽'}
                        </div>
                        <h3 className="text-xl font-bold mb-3">
                          {formData.title || '標題預覽'}
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                          {formData.description || '描述內容預覽...'}
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="inline-flex items-center text-sm opacity-80">
                          了解更多
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}