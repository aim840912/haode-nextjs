'use client'

import { useState, useEffect } from 'react'
import { Review } from '@/types/review'
import Link from 'next/link'

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedReviews()
  }, [])

  const fetchFeaturedReviews = async () => {
    try {
      const response = await fetch('/api/reviews?approved=true&featured=true&limit=6')
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Error fetching featured reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex justify-center">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return '🛒'
      case 'farm-tour': return '🌱'
      default: return '💬'
    }
  }

  if (loading || reviews.length === 0) {
    return null // 載入中或沒有評價時不顯示區塊
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-white to-amber-50">
      <div className="max-w-7xl mx-auto">
        {/* 標題區 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-amber-900 mb-4">顧客心聲</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            聽聽我們珍貴顧客的真實分享，每一個笑容都是我們最大的成就
          </p>
        </div>

        {/* 評價卡片網格 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {reviews.slice(0, 3).map((review, index) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow relative group"
            >
              {/* 精選標籤 */}
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  ⭐ 精選
                </span>
              </div>

              {/* 分類圖標 */}
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">{getCategoryIcon(review.category)}</div>
                {renderStars(review.rating)}
              </div>

              {/* 評價標題 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center line-clamp-2">
                {review.title}
              </h3>

              {/* 評價內容 */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                "{review.content}"
              </p>

              {/* 顧客資訊 */}
              <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-amber-600 font-semibold text-sm">
                      {review.customerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {review.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 管理員回覆預覽 */}
              {review.adminReply && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-semibold">管</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        豪德茶業回覆
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {review.adminReply}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 更多評價展示 */}
        {reviews.length > 3 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {reviews.slice(3, 6).map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-md p-4 border border-amber-100"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 font-semibold text-sm">
                        {review.customerName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {review.customerName}
                      </h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      "{review.content}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 統計資訊 */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-8 mb-12">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-900 mb-2">500+</div>
              <div className="text-sm text-amber-800">滿意顧客</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-900 mb-2">4.8</div>
              <div className="text-sm text-amber-800">平均評分</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-900 mb-2">95%</div>
              <div className="text-sm text-amber-800">推薦率</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-900 mb-2">200+</div>
              <div className="text-sm text-amber-800">回頭客數</div>
            </div>
          </div>
        </div>

        {/* 行動呼籲 */}
        <div className="text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-amber-900 mb-3">
              您的意見對我們很重要
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              無論是產品體驗、農場參觀或是服務感受，我們都很想聽聽您的想法
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/reviews"
              className="inline-block bg-amber-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-800 transition-colors"
            >
              查看更多評價
            </Link>
            <Link 
              href="/reviews?tab=write"
              className="inline-block bg-white text-amber-900 border-2 border-amber-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              分享您的心得
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}