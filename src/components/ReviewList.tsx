'use client'

import { useState, useEffect } from 'react'
import { Review } from '@/types/review'

interface ReviewListProps {
  approved?: boolean
  featured?: boolean
  category?: string
  productId?: string
  limit?: number
  showWriteReview?: boolean
  className?: string
}

export default function ReviewList({
  approved = true,
  featured,
  category,
  productId,
  limit,
  showWriteReview = false,
  className = ''
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [approved, featured, category, productId, limit])

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams()
      if (approved !== undefined) params.set('approved', approved.toString())
      if (featured !== undefined) params.set('featured', featured.toString())
      if (category) params.set('category', category)
      if (productId) params.set('productId', productId)
      if (limit) params.set('limit', limit.toString())

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryBadge = (category: string) => {
    const styles = {
      product: 'bg-amber-100 text-amber-800',
      'farm-tour': 'bg-green-100 text-green-800',
      general: 'bg-blue-100 text-blue-800'
    }

    const labels = {
      product: '產品評價',
      'farm-tour': '農場體驗',
      general: '一般留言'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[category as keyof typeof styles] || styles.general}`}>
        {labels[category as keyof typeof labels] || '一般留言'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-600">載入中...</div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 mb-4">
          {showWriteReview ? '還沒有評價，成為第一位留言的顧客吧！' : '目前沒有評價'}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review) => (
        <div
          key={review.id}
          className={`bg-white rounded-lg shadow-md p-6 ${
            review.isFeatured ? 'ring-2 ring-amber-200 bg-amber-50' : ''
          }`}
        >
          {/* 頭部資訊 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-semibold">
                    {review.customerName.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {review.customerName}
                  </h4>
                  {review.isFeatured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                      ⭐ 精選
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            {getCategoryBadge(review.category)}
          </div>

          {/* 標題 */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {review.title}
          </h3>

          {/* 內容 */}
          <div className="text-gray-700 mb-4 leading-relaxed">
            {review.content}
          </div>

          {/* 照片 (如果有) */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex space-x-2 mb-4">
              {review.photos.map((photo, index) => (
                <div
                  key={index}
                  className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"
                >
                  <span className="text-gray-500 text-xs">照片</span>
                </div>
              ))}
            </div>
          )}

          {/* 管理員回覆 */}
          {review.adminReply && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">管</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    豪德茶業 回覆
                  </span>
                  <span className="text-xs text-gray-500">
                    {review.adminReplyAt && formatDate(review.adminReplyAt)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {review.adminReply}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}