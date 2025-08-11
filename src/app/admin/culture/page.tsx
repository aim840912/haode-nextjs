'use client'

import { useState, useEffect } from 'react'
import { CultureItem } from '@/types/culture'
import Link from 'next/link'

export default function CultureAdmin() {
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCultureItems()
  }, [])

  const fetchCultureItems = async () => {
    try {
      const response = await fetch('/api/culture')
      const data = await response.json()
      setCultureItems(data)
    } catch (error) {
      console.error('Error fetching culture items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此文化內容嗎？')) return
    
    try {
      await fetch(`/api/culture/${id}`, { method: 'DELETE' })
      setCultureItems(cultureItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting culture item:', error)
      alert('刪除失敗')
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
          <h1 className="text-3xl font-bold text-gray-900">文化典藏管理</h1>
          <div className="space-x-4">
            <Link 
              href="/admin/culture/add"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              新增典藏內容
            </Link>
            <Link 
              href="/culture"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              查看典藏頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cultureItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Preview Card */}
              <div className={`${item.color} ${item.height} p-4 flex flex-col justify-between`}>
                <div>
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className={`${item.textColor} text-xs opacity-80 mb-1`}>{item.subtitle}</div>
                  <h3 className={`${item.textColor} text-sm font-bold mb-2`}>{item.title}</h3>
                  <p className={`${item.textColor} text-xs opacity-90 leading-relaxed line-clamp-3`}>
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 bg-white">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>建立：{formatDate(item.createdAt)}</span>
                  <span>高度：{item.height}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/culture/${item.id}/edit`}
                    className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-orange-700 transition-colors"
                  >
                    編輯
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cultureItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">尚無典藏內容</p>
            <Link 
              href="/admin/culture/add"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              新增第一個典藏內容
            </Link>
          </div>
        )}

        {/* 統計資訊 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎨</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{cultureItems.length}</div>
                <div className="text-sm text-gray-500">總典藏內容</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📏</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(cultureItems.map(item => item.height)).size}
                </div>
                <div className="text-sm text-gray-500">不同高度</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🌈</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(cultureItems.map(item => item.color)).size}
                </div>
                <div className="text-sm text-gray-500">色彩方案</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}