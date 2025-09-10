'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { SimpleImage } from '@/components/OptimizedImage'
import Breadcrumbs, { createNewsBreadcrumbs } from '@/components/Breadcrumbs'
import { logger } from '@/lib/logger'

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  author: string
  publishedAt: string
  category: string
  tags: string[]
  image: string
  imageUrl?: string
  featured: boolean
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      // 讀取本地 JSON 資料
      const response = await fetch('/api/news')
      if (response.ok) {
        const result = await response.json()

        // 處理統一 API 回應格式
        const data = result.data || result

        // 確保 data 是陣列
        if (Array.isArray(data)) {
          setNews(data)
        } else {
          logger.error('API 回應格式錯誤：news data 不是陣列', new Error('非陣列格式'), {
            module: 'NewsPage',
            action: 'fetchNews',
            metadata: { result },
          })
          setNews([])
        }
      } else {
        logger.warn('新聞 API 回應異常，設定空陣列', {
          module: 'NewsPage',
          action: 'fetchNews',
        })
        setNews([])
      }
    } catch (error) {
      logger.error('Error fetching news', error as Error, {
        module: 'NewsPage',
        action: 'fetchNews',
      })
      // API 錯誤時設定空陣列
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const categories = ['全部', '產品動態', '永續農業', '活動資訊']

  const filteredNews =
    selectedCategory === '全部' ? news : news.filter(item => item.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入新聞中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs items={createNewsBreadcrumbs()} enableStructuredData={true} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-amber-900 mb-4">農產新聞</h1>
              <p className="text-xl text-gray-700">最新農場動態、產品資訊與活動消息</p>
            </div>
            {user && user.role === 'admin' && (
              <div className="flex space-x-3">
                <a
                  href="/admin/news"
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>新聞管理</span>
                </a>
                <a
                  href="/admin/news/add"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>發布新聞</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-amber-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-100 hover:text-amber-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured News */}
        {selectedCategory === '全部' && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">精選新聞</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news
                .filter(item => item.featured)
                .map(item => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer block"
                  >
                    <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden relative">
                      {item.imageUrl && (
                        <SimpleImage
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={filteredNews.indexOf(item) < 3}
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-500 ml-auto">
                          {formatDate(item.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.summary}</p>
                      <div className="inline-flex items-center text-amber-900 hover:text-amber-800 text-sm font-medium">
                        閱讀更多 →
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All News */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            {selectedCategory === '全部' ? '所有新聞' : selectedCategory}
          </h2>

          {filteredNews.length > 0 ? (
            <div className="space-y-8">
              {filteredNews.map(item => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer block"
                >
                  <div className="md:flex">
                    <div className="md:w-48 aspect-video md:aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden relative">
                      {item.imageUrl && (
                        <SimpleImage
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 192px"
                        />
                      )}
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.publishedAt)}
                        </span>
                        <span className="text-sm text-gray-500">by {item.author}</span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">{item.summary}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="inline-flex items-center text-amber-900 hover:text-amber-800 font-medium">
                        閱讀完整內容 →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">此分類目前沒有新聞</p>
              <button
                onClick={() => setSelectedCategory('全部')}
                className="text-amber-900 hover:text-amber-800 font-medium"
              >
                查看所有新聞
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
