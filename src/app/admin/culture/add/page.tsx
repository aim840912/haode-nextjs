'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function AddCulture() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    height: 'h-64',
    textColor: 'text-white',
    imageUrl: ''  // 改名為 imageUrl
  })
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

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
    { name: '小型 (h-48)', value: 'h-48' },
    { name: '緊湊 (h-52)', value: 'h-52' },
    { name: '中小 (h-56)', value: 'h-56' },
    { name: '中等 (h-60)', value: 'h-60' },
    { name: '標準 (h-64)', value: 'h-64' },
    { name: '中大 (h-68)', value: 'h-68' },
    { name: '大型 (h-72)', value: 'h-72' },
    { name: '特大 (h-76)', value: 'h-76' }
  ]


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/culture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/culture')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      console.error('Error adding culture item:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin/culture"
              className="text-orange-600 hover:text-orange-800"
            >
              ← 回到文化管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">新增文化典藏</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* 基本資訊 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                典藏標題 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入典藏內容標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                副標題 *
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                placeholder="輸入副標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                詳細描述 *
              </label>
              <textarea
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
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
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

            {/* 圖片上傳 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                或上傳圖片檔案
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-orange-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="mb-4">
                      <img 
                        src={imagePreview} 
                        alt="預覽圖片" 
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('')
                          setImageFile(null)
                          setFormData(prev => ({ ...prev, image: '' }))
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        移除圖片
                      </button>
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500">
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
                </div>
              </div>
            </div>


            {/* 卡片高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                卡片高度
              </label>
              <select
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {heightOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 文字顏色 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                文字顏色
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="textColor"
                    value="text-white"
                    checked={formData.textColor === 'text-white'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  白色文字
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="textColor"
                    value="text-gray-800"
                    checked={formData.textColor === 'text-gray-800'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  深色文字
                </label>
              </div>
            </div>

            {/* 色彩選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                背景色彩
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.color === color.value ? 'border-orange-500 shadow-lg' : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-full h-12 rounded bg-gradient-to-br ${color.preview} mb-2`}></div>
                    <div className="text-xs text-gray-900">{color.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/culture"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增典藏內容'}
              </button>
            </div>
          </form>

          {/* Preview */}
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
                          <span className="mr-2">📖</span>
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