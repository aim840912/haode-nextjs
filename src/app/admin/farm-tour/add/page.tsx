'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function AddFarmTourActivity() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageType, setImageType] = useState<'emoji' | 'upload'>('emoji')
  const { user, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    season: '春季',
    months: '',
    title: '',
    highlight: '',
    activities: [''],
    price: 0,
    duration: '',
    includes: [''],
    image: '🌱',
    available: true,
    note: ''
  })

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

  const seasonOptions = [
    { value: '春季', label: '春季 (3-5月)', months: '3-5月' },
    { value: '夏季', label: '夏季 (6-8月)', months: '6-8月' },
    { value: '秋季', label: '秋季 (9-11月)', months: '9-11月' },
    { value: '冬季', label: '冬季 (12-2月)', months: '12-2月' }
  ]

  const emojiOptions = [
    '🌱', '🌸', '🍑', '🍎', '🫖', '🌾', '🌿', '🍃',
    '🌽', '🥕', '🍓', '🍄', '🌻', '☘️', '🦋', '🐝'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/farm-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          activities: formData.activities.filter(activity => activity.trim() !== ''),
          includes: formData.includes.filter(include => include.trim() !== '')
        })
      })

      if (response.ok) {
        router.push('/admin/farm-tour')
      } else {
        alert('新增失敗')
      }
    } catch (error) {
      console.error('Error adding farm tour activity:', error)
      alert('新增失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSeasonChange = (season: string) => {
    const selectedSeason = seasonOptions.find(s => s.value === season)
    setFormData(prev => ({
      ...prev,
      season,
      months: selectedSeason?.months || ''
    }))
  }

  const addActivityField = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, '']
    }))
  }

  const removeActivityField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }))
  }

  const updateActivityField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) => i === index ? value : activity)
    }))
  }

  const addIncludeField = () => {
    setFormData(prev => ({
      ...prev,
      includes: [...prev.includes, '']
    }))
  }

  const removeIncludeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index)
    }))
  }

  const updateIncludeField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.map((include, i) => i === index ? value : include)
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查檔案大小 (限制 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片檔案大小不能超過 5MB')
        return
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案')
        return
      }

      setImageFile(file)
      setImageType('upload')

      // 創建預覽
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setImageType('emoji')
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image: emoji }))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageType('emoji')
    setFormData(prev => ({ ...prev, image: '🌱' }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin/farm-tour"
              className="text-green-600 hover:text-green-800"
            >
              ← 回到果園管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">新增體驗活動</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">基本資訊</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    季節 *
                  </label>
                  <select
                    name="season"
                    value={formData.season}
                    onChange={(e) => handleSeasonChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  >
                    {seasonOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    月份 *
                  </label>
                  <input
                    type="text"
                    name="months"
                    value={formData.months}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                    placeholder="例：3-5月"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活動標題 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="輸入體驗活動標題"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活動亮點 *
                </label>
                <input
                  type="text"
                  name="highlight"
                  value={formData.highlight}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="簡短描述活動特色"
                />
              </div>
            </div>

            {/* 活動內容 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">活動內容</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活動項目
                </label>
                {formData.activities.map((activity, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => updateActivityField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                      placeholder="輸入活動項目"
                    />
                    {formData.activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivityField(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addActivityField}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  + 新增項目
                </button>
              </div>
            </div>

            {/* 費用與時間 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">費用與時間</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    價格 (NT$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    活動時長 *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                    placeholder="例：3小時"
                  />
                </div>
              </div>
            </div>

            {/* 費用包含 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">費用包含</h3>
              
              <div className="mb-4">
                {formData.includes.map((include, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={include}
                      onChange={(e) => updateIncludeField(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                      placeholder="輸入包含項目"
                    />
                    {formData.includes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIncludeField(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIncludeField}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  + 新增項目
                </button>
              </div>
            </div>

            {/* 其他設定 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">其他設定</h3>
              
              {/* 圖片選擇方式 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  活動圖片
                </label>
                
                {/* 選擇類型 */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center text-gray-900 font-medium">
                    <input
                      type="radio"
                      name="imageType"
                      value="emoji"
                      checked={imageType === 'emoji'}
                      onChange={() => setImageType('emoji')}
                      className="mr-2"
                    />
                    使用表情符號
                  </label>
                  <label className="flex items-center text-gray-900 font-medium">
                    <input
                      type="radio"
                      name="imageType"
                      value="upload"
                      checked={imageType === 'upload'}
                      onChange={() => setImageType('upload')}
                      className="mr-2"
                    />
                    上傳圖片
                  </label>
                </div>

                {imageType === 'emoji' ? (
                  <>
                    <div className="grid grid-cols-8 gap-2 mb-3">
                      {emojiOptions.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className={`p-2 text-2xl border rounded-md hover:bg-gray-50 transition-colors ${
                            formData.image === emoji && imageType === 'emoji' ? 'bg-green-100 border-green-500' : 'border-gray-300'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      name="image"
                      value={imageType === 'emoji' ? formData.image : ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      placeholder="或自定義 emoji"
                    />
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">點擊上傳</span> 或拖拽圖片到此處
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (最大 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="圖片預覽"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注意事項
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="輸入參加注意事項"
                />
              </div>

              <div>
                <label className="flex items-center text-gray-700 font-medium">
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  立即開放預約
                </label>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/farm-tour"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? '新增中...' : '新增活動'}
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Preview Card */}
              <div className="bg-gradient-to-br from-green-100 to-amber-100 p-6 text-center">
                <div className="mb-3">
                  {imageType === 'upload' && imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="活動圖片" 
                      className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="text-4xl">{formData.image}</div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {formData.title || '活動標題預覽'}
                </h3>
                <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                  <span className="bg-white px-2 py-1 rounded-full">
                    {formData.season}
                  </span>
                  <span className="bg-white px-2 py-1 rounded-full">
                    {formData.months || '月份'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded-r-lg">
                  <p className="text-amber-800 font-medium text-sm">
                    {formData.highlight || '活動亮點預覽'}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">活動內容</h4>
                  <div className="space-y-1">
                    {formData.activities.filter(a => a.trim()).map((activity, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <span className="mr-2 text-green-500">✓</span>
                        <span>{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">💰</span>
                    <span className="font-bold text-amber-900">
                      NT$ {formData.price || 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">⏱️</span>
                    <span>{formData.duration || '時長'}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">費用包含</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.includes.filter(i => i.trim()).map((include, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {include}
                      </span>
                    ))}
                  </div>
                </div>

                {formData.note && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-xs">💡 {formData.note}</p>
                  </div>
                )}

                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  formData.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {formData.available ? '✅ 開放預約' : '❌ 暫停開放'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}