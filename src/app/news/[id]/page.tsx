'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArticleStructuredData } from '@/components/StructuredData'
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

export default function NewsDetailPage() {
  const params = useParams()
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchNewsDetail(params.id as string)
    }
  }, [params.id])

  const fetchNewsDetail = async (id: string) => {
    try {
      // 從 API 獲取新聞詳情
      const response = await fetch(`/api/news/${id}`)
      
      if (response.ok) {
        const result = await response.json()
        const currentNews = result.data || result
        setNewsItem(currentNews)
        
        // 取得相關新聞（同類別的其他新聞）
        if (currentNews) {
          const allNewsResponse = await fetch('/api/news')
          if (allNewsResponse.ok) {
            const allNewsResult = await allNewsResponse.json()
            const allNews = allNewsResult.data || []
            const related = allNews
              .filter((item: NewsItem) => 
                item.category === currentNews.category && item.id !== id
              )
              .slice(0, 3)
            setRelatedNews(related)
          }
        }
      } else if (response.status === 404) {
        setNewsItem(null)
      } else {
        logger.error('Failed to fetch news', new Error(`HTTP ${response.status}: ${response.statusText}`), { 
          module: 'NewsDetailPage', 
          action: 'fetchNewsDetail',
          metadata: { newsId: id }
        })
        setNewsItem(null)
      }
    } catch (error) {
      logger.error('Error fetching news detail', error as Error, { 
        module: 'NewsDetailPage', 
        action: 'fetchNewsDetail',
        metadata: { newsId: id }
      })
      setNewsItem(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') {
        return <br key={index} />
      }
      
      // 處理項目符號列表
      if (paragraph.startsWith('•') || paragraph.startsWith('→') || paragraph.startsWith('✓')) {
        return (
          <div key={index} className="ml-4 mb-2">
            <span className="text-amber-600 mr-2">{paragraph.charAt(0)}</span>
            <span>{paragraph.slice(1).trim()}</span>
          </div>
        )
      }
      
      return (
        <p key={index} className="mb-4 leading-relaxed">
          {paragraph}
        </p>
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入新聞內容中...</div>
      </div>
    )
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">找不到該新聞</h2>
          <Link 
            href="/news"
            className="text-amber-900 hover:text-amber-800 font-medium"
          >
            回到新聞列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Structured Data */}
      <ArticleStructuredData 
        article={{
          title: newsItem.title,
          summary: newsItem.summary,
          imageUrl: newsItem.imageUrl || newsItem.image,
          publishedDate: newsItem.publishedAt,
          modifiedDate: newsItem.publishedAt // 假設沒有單獨的更新時間
        }} 
      />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Breadcrumbs 
            items={createNewsBreadcrumbs(newsItem.title)}
            enableStructuredData={true}
          />
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Article Header */}
          <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
            {newsItem.imageUrl && (
              <img 
                src={newsItem.imageUrl} 
                alt={newsItem.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="p-8">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                {newsItem.category}
              </span>
              <span className="text-gray-600 text-sm">
                {formatDate(newsItem.publishedAt)}
              </span>
              <span className="text-gray-600 text-sm">
                作者：{newsItem.author}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {newsItem.title}
            </h1>

            {/* Summary */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                {newsItem.summary}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-700">
              {formatContent(newsItem.content)}
            </div>

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">相關標籤</h4>
              <div className="flex flex-wrap gap-2">
                {newsItem.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-amber-100 hover:text-amber-800 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">相關新聞</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-amber-600 mb-2">{item.category}</div>
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-xs line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link 
            href="/news"
            className="inline-flex items-center px-6 py-3 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition-colors font-medium"
          >
            ← 回到新聞列表
          </Link>
        </div>
      </article>
    </div>
  )
}