'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import { MomentItem } from '@/types/moments'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'
import Breadcrumbs, { createMomentsBreadcrumbs } from '@/components/ui/navigation/Breadcrumbs'

export default function MomentsPage() {
  const [momentItems, setMomentItems] = useState<MomentItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MomentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // 載入精彩時刻資料
  useEffect(() => {
    const fetchMomentItems = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/moments')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setMomentItems(data.data || data)
      } catch (error) {
        logger.error(
          'Error fetching moment items:',
          error instanceof Error ? error : new Error('Unknown error')
        )
        setError('無法載入精彩時刻資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }

    fetchMomentItems()
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
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs items={createMomentsBreadcrumbs()} enableStructuredData={true} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-blue-600 mb-4">精彩時刻</h1>
              <p className="text-xl text-gray-700">
                用鏡頭記錄農家生活的美好瞬間，每一張照片都是精彩時光的見證
              </p>
            </div>
            {user && user.role === 'admin' && (
              <div className="flex space-x-3">
                <a
                  href="/admin/moments"
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
                >
                  管理時刻
                </a>
                <a
                  href="/admin/moments/add"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors"
                >
                  新增時刻
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 精彩時刻內容 */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {momentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">尚無精彩時刻</h2>
              <p className="text-gray-600">等待添加更多美好的回憶...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {momentItems.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* 圖片區域 */}
                  <div
                    className={`relative h-64 ${!item.imageUrl ? 'bg-gradient-to-br from-blue-400 to-purple-400' : ''}`}
                  >
                    {item.imageUrl ? (
                      <SimpleImage
                        src={item.imageUrl}
                        alt={item.title}
                        fill={true}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <span className="text-4xl">{item.emoji}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 詳細內容彈出層 */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 圖片 */}
            <div className="relative h-64 md:h-80">
              {selectedItem.imageUrl ? (
                <SimpleImage
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  width={800}
                  height={400}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center rounded-t-lg">
                  <span className="text-6xl">{selectedItem.emoji}</span>
                </div>
              )}
            </div>

            {/* 內容 */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.title}</h2>
              {selectedItem.subtitle && (
                <p className="text-lg text-gray-600 mb-4">{selectedItem.subtitle}</p>
              )}
              <p className="text-gray-700 leading-relaxed mb-4">{selectedItem.description}</p>

              {/* 關閉按鈕 */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
