'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddFarmTourActivity() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  選擇圖示
                </label>
                <div className="grid grid-cols-8 gap-2 mb-3">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: emoji }))}
                      className={`p-2 text-2xl border rounded-md hover:bg-gray-50 transition-colors ${
                        formData.image === emoji ? 'bg-green-100 border-green-500' : 'border-gray-300'
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="或自定義 emoji"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="輸入參加注意事項"
                />
              </div>

              <div>
                <label className="flex items-center">
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
                <div className="text-4xl mb-3">{formData.image}</div>
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