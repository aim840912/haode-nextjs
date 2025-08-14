'use client'

import { useState, useEffect } from 'react'
import { Review } from '@/types/review'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    averageRating: 0
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [filter])

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams()
      if (filter === 'approved') params.set('approved', 'true')
      if (filter === 'pending') params.set('approved', 'false')

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApprove = async (id: string) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    try {
      await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true })
      })
      fetchReviews()
      fetchStats()
    } catch (error) {
      console.error('Error approving review:', error)
      alert('審核失敗')
    }
  }

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    try {
      await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !featured })
      })
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      alert('更新失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    if (!confirm('確定要刪除此評價嗎？')) return
    
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
      setReviews(reviews.filter(r => r.id !== id))
      fetchStats()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('刪除失敗')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">評價管理</h1>
          <div className="space-x-4">
            <Link 
              href="/reviews"
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              查看顧客頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">總評價數</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-500">已審核</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⏳</div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">待審核</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⭐</div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.averageRating}</div>
                <div className="text-sm text-gray-500">平均評分</div>
              </div>
            </div>
          </div>
        </div>

        {/* 篩選按鈕 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部評價
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-green-50'
            }`}
          >
            已審核
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-orange-50'
            }`}
          >
            待審核 ({stats.pending})
          </button>
        </div>

        {/* 評價列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  評價內容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分類/評分
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {review.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {review.content}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      {getCategoryBadge(review.category)}
                      {renderStars(review.rating)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {review.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {review.isApproved ? '已審核' : '待審核'}
                      </span>
                      {review.isFeatured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ 精選
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user ? (
                      <div className="flex space-x-2">
                        {!review.isApproved && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            審核通過
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleFeatured(review.id, review.isFeatured)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          {review.isFeatured ? '取消精選' : '設為精選'}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">需要登入</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {reviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">沒有符合條件的評價</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}