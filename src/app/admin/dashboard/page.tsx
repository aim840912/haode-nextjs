'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface VisitorStats {
  total_visits: number
  unique_visitors: number
  today_visits: number
  date: string
  weekly_stats?: Array<{
    date: string
    today_visits: number
    unique_visitors: number
  }>
  top_visitors?: Array<{
    visitor_id: string
    visit_count: number
    first_visit: string
    last_visit: string
    ip_address: string
  }>
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      fetchStats()
    }
  }, [isLoading, user])

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


  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats/visitors')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch visitor stats')
      }
    } catch (error) {
      console.error('Error fetching visitor stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">網站統計儀表板</h1>
              <p className="text-gray-600 mt-2">管理和監控網站訪客數據</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={refreshStats}
                disabled={refreshing}
                className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                {refreshing ? '更新中...' : '🔄 重新整理'}
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                回到首頁
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">載入統計資料中...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 主要統計數據 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">總訪客數</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.unique_visitors?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">總瀏覽次數</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.total_visits?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <span className="text-2xl">🗓️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">今日訪客</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.today_visits || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 最近7天趨勢 */}
            {stats?.weekly_stats && stats.weekly_stats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">最近7天訪客趨勢</h2>
                <div className="grid grid-cols-7 gap-4">
                  {stats.weekly_stats.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        {formatDate(day.date).split('/').slice(1).join('/')}
                      </div>
                      <div className="bg-amber-100 rounded-lg p-3">
                        <div className="text-lg font-semibold text-amber-900">
                          {day.today_visits}
                        </div>
                        <div className="text-xs text-amber-700">
                          訪客數
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 熱門訪客 */}
            {stats?.top_visitors && stats.top_visitors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">活躍訪客排行</h2>
                <div className="space-y-4">
                  {stats.top_visitors.map((visitor, index) => (
                    <div key={visitor.visitor_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-amber-900 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            訪客 #{visitor.visitor_id.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-600">
                            首次訪問：{formatDateTime(visitor.first_visit)}
                          </p>
                          <p className="text-sm text-gray-600">
                            最後訪問：{formatDateTime(visitor.last_visit)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-900">
                          {visitor.visit_count}
                        </p>
                        <p className="text-sm text-gray-600">次訪問</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 管理功能 */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">管理功能</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/products"
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">產品管理</h3>
                      <p className="text-sm text-gray-600">管理商品資料</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/inquiries"
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">詢價管理</h3>
                      <p className="text-sm text-gray-600">管理客戶詢價</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">審計日誌</h3>
                      <p className="text-sm text-gray-600">系統操作記錄</p>
                    </div>
                  </div>
                </Link>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <Link
                  href="/admin/news"
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📰</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">新聞管理</h3>
                      <p className="text-sm text-gray-600">發布農產新聞</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/culture"
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏛️</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">文化典藏</h3>
                      <p className="text-sm text-gray-600">管理文化資產</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/locations"
                  className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">地點管理</h3>
                      <p className="text-sm text-gray-600">管理展示地點</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}