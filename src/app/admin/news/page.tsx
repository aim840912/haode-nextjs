'use client'

import { useState, useEffect } from 'react'
import { NewsItem } from '@/types/news'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function NewsAdmin() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      setNews(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此新聞嗎？')) return
    
    try {
      await fetch(`/api/news/${id}`, { method: 'DELETE' })
      setNews(news.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('刪除失敗')
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured })
      })
      fetchNews()
    } catch (error) {
      console.error('Error updating news:', error)
      alert('更新失敗')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">新聞管理</h1>
          <div className="space-x-4">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/news/add"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                發布新聞
              </Link>
            )}
            <Link 
              href="/news"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              查看新聞頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  新聞標題
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  發布時間
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
              {news.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-10 h-10 object-cover rounded-lg mr-3"
                        />
                      ) : (
                        <div className="text-2xl mr-3">{item.image}</div>
                      )}
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {item.summary}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.publishedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user?.role === 'admin' ? (
                      <button
                        onClick={() => toggleFeatured(item.id, item.featured)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.featured
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.featured ? '⭐ 精選' : '📄 一般'}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.featured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.featured ? '⭐ 精選' : '📄 一般'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user?.role === 'admin' ? (
                      <div className="flex space-x-2">
                        <Link
                          href={`/news/${item.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          預覽
                        </Link>
                        <Link
                          href={`/admin/news/${item.id}/edit`}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Link
                          href={`/news/${item.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          預覽
                        </Link>
                        <span className="text-gray-400">需要管理員權限</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{news.length}</div>
                <div className="text-sm text-gray-500">總新聞數</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⭐</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {news.filter(n => n.featured).length}
                </div>
                <div className="text-sm text-gray-500">精選新聞</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📝</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(news.map(n => n.category)).size}
                </div>
                <div className="text-sm text-gray-500">新聞分類</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(news.map(n => n.author)).size}
                </div>
                <div className="text-sm text-gray-500">作者人數</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}