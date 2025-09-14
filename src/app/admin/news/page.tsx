'use client'

import { useState, useEffect } from 'react'
import { NewsItem } from '@/types/news'
import Link from 'next/link'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import AdminProtection from '@/components/features/admin/AdminProtection'

export default function NewsAdmin() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setError(null) // 清除之前的錯誤
      const response = await fetch('/api/news')
      const result = await response.json()

      // 處理新的統一回應格式
      if (result.success && result.data) {
        setNews(result.data) // 從 data 屬性取得新聞陣列
      } else {
        // 向後相容：如果是舊格式（直接陣列）
        setNews(Array.isArray(result) ? result : [])
      }
    } catch (error) {
      logger.error(
        'Error fetching news:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setError(error instanceof Error ? error.message : '載入新聞時發生錯誤')
      setNews([]) // 錯誤時設為空陣列
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此新聞嗎？')) return

    try {
      const response = await fetch(`/api/news/${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        setNews(news.filter(n => n.id !== id))
      } else {
        throw new Error(result.error || '刪除失敗')
      }
    } catch (error) {
      logger.error(
        'Error deleting news:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert(error instanceof Error ? error.message : '刪除失敗')
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured }),
      })
      const result = await response.json()

      if (result.success) {
        fetchNews()
      } else {
        throw new Error(result.error || '更新失敗')
      }
    } catch (error) {
      logger.error(
        'Error updating news:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert(error instanceof Error ? error.message : '更新失敗')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  // 錯誤處理顯示
  if (error) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 pt-24">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">載入錯誤</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <button
                      onClick={fetchNews}
                      className="bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200"
                    >
                      重新載入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 頁面標題和操作按鈕 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">新聞管理</h1>

              {/* 操作按鈕組 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/news/add"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    發布新聞
                  </Link>
                )}
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  查看新聞頁面
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  回到首頁
                </Link>
              </div>
            </div>
          </div>

          {/* 新聞列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 桌面版表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      新聞標題
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分類
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作者
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      發布時間
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {news.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">{item.summary}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.author}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.publishedAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user?.role === 'admin' ? (
                          <button
                            onClick={() => toggleFeatured(item.id, item.featured)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              item.featured
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {item.featured ? '精選' : '一般'}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.featured
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.featured ? '精選' : '一般'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user?.role === 'admin' ? (
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/news/${item.id}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              預覽
                            </Link>
                            <Link
                              href={`/admin/news/${item.id}/edit`}
                              className="text-amber-600 hover:text-amber-800 transition-colors"
                            >
                              編輯
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              刪除
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/news/${item.id}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              預覽
                            </Link>
                            <span className="text-gray-400 text-xs">需要管理員權限</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 手機版卡片布局 */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {news.map(item => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={56}
                          height={56}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                            {item.title}
                          </h3>
                          {user?.role === 'admin' ? (
                            <button
                              onClick={() => toggleFeatured(item.id, item.featured)}
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                item.featured
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {item.featured ? '★' : '•'}
                            </button>
                          ) : (
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.featured
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.featured ? '★' : '•'}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                              {item.category}
                            </span>
                            <span>{item.author}</span>
                            <span>{formatDate(item.publishedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Link
                              href={`/news/${item.id}`}
                              target="_blank"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              預覽
                            </Link>

                            {user?.role === 'admin' && (
                              <>
                                <Link
                                  href={`/admin/news/${item.id}/edit`}
                                  className="inline-flex items-center text-sm text-amber-600 hover:text-amber-800 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  編輯
                                </Link>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="inline-flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  刪除
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {news.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">尚無新聞資料</p>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/news/add"
                    className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    發布第一則新聞
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 統計資訊 */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">統計概覽</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{news.length}</div>
                    <div className="text-xs sm:text-sm text-gray-500">總新聞數</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">
                      {news.filter(n => n.featured).length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">精選新聞</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">
                      {new Set(news.map(n => n.category)).size}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">新聞分類</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">
                      {new Set(news.map(n => n.author)).size}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">作者人數</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
