'use client'

import { useState } from 'react'
import { ReviewSubmission } from '@/types/review'

interface ReviewFormProps {
  productId?: string
  category?: 'product' | 'farm-tour' | 'general'
  onSubmitSuccess?: () => void
  className?: string
}

export default function ReviewForm({ 
  productId, 
  category = 'general', 
  onSubmitSuccess,
  className = '' 
}: ReviewFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ReviewSubmission>({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    photos: [],
    productId,
    category
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('感謝您的留言！我們會盡快審核並回覆。')
        setFormData({
          customerName: '',
          customerEmail: '',
          rating: 5,
          title: '',
          content: '',
          photos: [],
          productId,
          category
        })
        onSubmitSuccess?.()
      } else {
        alert('提交失敗，請稍後再試')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('提交失敗，請檢查網路連線')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }))
  }

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
            className={`text-2xl transition-colors ${
              star <= formData.rating 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-3 text-sm text-gray-600">
          {formData.rating} 顆星
        </span>
      </div>
    )
  }

  const getCategoryText = () => {
    switch (category) {
      case 'product': return '產品評價'
      case 'farm-tour': return '農場體驗心得'
      default: return '一般留言'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">分享您的心得</h3>
        <p className="text-gray-600">您的意見對我們很重要，請留下您的寶貴評價</p>
        <div className="text-sm text-amber-600 mt-1">
          類別：{getCategoryText()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              姓名 *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="請輸入您的姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Email (選填)
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              placeholder="您的電子信箱"
            />
          </div>
        </div>

        {/* 評分 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            整體評分 *
          </label>
          {renderStars()}
        </div>

        {/* 標題 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            評價標題 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            placeholder="簡短描述您的體驗"
          />
        </div>

        {/* 內容 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            詳細內容 *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            placeholder="請詳細分享您的體驗、感受或建議..."
          />
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '提交中...' : '提交評價'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>* 您的評價將在審核後顯示</p>
        <p>* 我們保護您的隱私，不會公開您的電子信箱</p>
      </div>
    </div>
  )
}