'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddCulture() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    height: 'h-64',
    textColor: 'text-white',
    emoji: '🎨'
  })

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

  const emojiOptions = [
    '🎨', '🏮', '🍃', '🌾', '🔥', '🏡', '🛠️', '🎉', 
    '👨‍🏫', '⚙️', '📚', '🔬', '🌱', '🌿', '🚜', '🌽',
    '🍎', '🥕', '🍓', '☘️', '🌸', '🍄', '🐝', '🦋'
  ]

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                典藏標題 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="輸入典藏內容標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                副標題 *
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="輸入副標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                詳細描述 *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="詳細描述文化典藏內容"
              />
            </div>

            {/* Emoji 選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                選擇圖示
              </label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                    className={`p-2 text-2xl border rounded-md hover:bg-gray-50 transition-colors ${
                      formData.emoji === emoji ? 'bg-orange-100 border-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="emoji"
                value={formData.emoji}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="或自定義 emoji"
              />
            </div>

            {/* 卡片高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                卡片高度
              </label>
              <select
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文字顏色
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
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
                <label className="flex items-center">
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    <div className="text-xs text-gray-600">{color.name}</div>
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
              <div className={`${formData.color} ${formData.height} p-6 rounded-lg`}>
                <div className={`${formData.textColor} h-full flex flex-col justify-between`}>
                  <div>
                    <div className="text-4xl mb-3">{formData.emoji}</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}