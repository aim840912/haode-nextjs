'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { CultureItem } from '@/types/culture'

export default function CulturePage() {
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([])
  const [selectedItem, setSelectedItem] = useState<CultureItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // 載入時光典藏資料
  useEffect(() => {
    const fetchCultureItems = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/culture')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setCultureItems(data)
      } catch (error) {
        console.error('Error fetching culture items:', error)
        setError('無法載入時光典藏資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }

    fetchCultureItems()
  }, [])

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">載入失敗</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-amber-900 mb-4">歲月留影</h1>
              <p className="text-xl text-gray-700">用鏡頭記錄農家生活的點點滴滴，每一張照片都是時光的見證</p>
            </div>
            {user && user.role === 'admin' && (
              <div className="flex space-x-3">
                <a 
                  href="/admin/culture"
                  className="px-4 py-2 bg-orange-600 text-white rounded-full text-sm hover:bg-orange-700 transition-colors"
                >
                  影像管理
                </a>
                <a 
                  href="/admin/culture/add"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors"
                >
                  新增照片
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Culture Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-6 pt-4 pb-12 w-full">
        {cultureItems.length === 0 ? (
          // 空狀態
          <div className="text-center py-20">
            <div className="text-6xl mb-8">📷</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">尚無時光典藏內容</h2>
            <p className="text-gray-600 mb-8">目前還沒有任何時光典藏項目，請稍後再來查看。</p>
            {user && user.role === 'admin' && (
              <a 
                href="/admin/culture/add"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                新增第一個項目
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cultureItems.map((item) => (
              <div
                key={item.id}
                className="h-80 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl rounded-lg overflow-hidden relative"
                onClick={() => setSelectedItem(item)}
              >
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    onError={(e) => {
                      // 圖片載入失敗時的處理
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  // 沒有圖片時的預設背景
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 z-0"></div>
                )}
                
                <div className="h-full flex flex-col justify-between relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="relative z-10 p-6 text-white">
                    <div className="text-sm opacity-80 mb-2">{item.subtitle}</div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 relative z-10 p-6 pt-0 text-white">
                    <div className="inline-flex items-center text-sm opacity-80">
                      了解更多
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{selectedItem.subtitle}</div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Large Image */}
              <div className="aspect-video rounded-xl mb-6 relative overflow-hidden">
                {selectedItem.imageUrl ? (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="relative z-10 text-white text-center h-full flex items-center justify-center">
                  <div>
                    <div className="text-xl font-semibold">{selectedItem.title}</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                {/* Extended content */}
                <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-400">
                  <h4 className="font-semibold text-amber-900 mb-3">時光典藏</h4>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <div className="bg-amber-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">想親身體驗這些美好時光？</h2>
          <p className="text-amber-100 mb-8 text-lg">
            歡迎參加我們的農場導覽活動，一起創造屬於您的美好回憶
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="/farm-tour"
              className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              預約農場體驗
            </a>
            <a 
              href="/schedule"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition-colors"
            >
              查看擺攤行程
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}