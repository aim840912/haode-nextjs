'use client'

import { useState, useEffect } from 'react'
import { CultureItem } from '@/types/culture'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import OptimizedImage from '@/components/OptimizedImage'
import AdminProtection from '@/components/AdminProtection'

export default function CultureAdmin() {
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
    if (!user) {
      alert('請先登入')
      return
    }
    
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
    <AdminProtection>
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">文化典藏管理</h1>
          <div className="space-x-4">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/culture/add"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                新增典藏內容
              </Link>
            )}
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
              <div className={`relative ${item.height} overflow-hidden`}>
                {item.imageUrl ? (
                  // 顯示實際圖片
                  <div className="relative w-full h-full">
                    <OptimizedImage
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={true}
                      lazy={false}
                      onError={() => {
                        console.error(`❌ 圖片載入失敗 - ${item.title}:`, item.imageUrl?.substring(0, 100) + '...');
                      }}
                      onLoad={() => {
                        console.log(`✅ 圖片載入成功 - ${item.title}`);
                      }}
                    />
                    {/* 圖片上的文字覆蓋層 - 調整透明度讓圖片更清楚 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 p-4 flex flex-col justify-between pointer-events-none">
                      <div>
                        <div className="text-white text-xs opacity-90 mb-1">{item.subtitle}</div>
                        <h3 className="text-white text-sm font-bold mb-2 drop-shadow-lg">{item.title}</h3>
                        <p className="text-white text-xs opacity-90 leading-relaxed line-clamp-3 drop-shadow">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 沒有圖片時顯示原本的色塊設計
                  <div className={`${item.color} h-full p-4 flex flex-col justify-between`}>
                    <div>
                      <div className={`${item.textColor} text-xs opacity-80 mb-1`}>{item.subtitle}</div>
                      <h3 className={`${item.textColor} text-sm font-bold mb-2`}>{item.title}</h3>
                      <p className={`${item.textColor} text-xs opacity-90 leading-relaxed line-clamp-3`}>
                        {item.description}
                      </p>
                    </div>
                    <div className={`${item.textColor} text-xs opacity-60`}>
                      🎨 無圖片
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-white">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>建立：{formatDate(item.createdAt)}</span>
                  <span>高度：{item.height}</span>
                </div>
                
                {user?.role === 'admin' ? (
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/culture/${item.id}/edit`}
                      className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm inline-flex items-center justify-center h-10 hover:bg-orange-700 transition-colors"
                    >
                      編輯
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm inline-flex items-center justify-center h-10 hover:bg-red-700 transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-2">
                    需要管理員權限
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {cultureItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">尚無典藏內容</p>
            {user?.role === 'admin' && (
              <Link 
                href="/admin/culture/add"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                新增第一個典藏內容
              </Link>
            )}
          </div>
        )}

        {/* 統計資訊 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{cultureItems.length}</div>
                <div className="text-sm text-gray-500">總典藏內容</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cultureItems.filter(item => item.imageUrl).length}
                </div>
                <div className="text-sm text-gray-500">有圖片項目</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cultureItems.filter(item => item.imageUrl?.startsWith('data:image/')).length}
                </div>
                <div className="text-sm text-gray-500">Base64 圖片</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {cultureItems.filter(item => item.imageUrl && !item.imageUrl.startsWith('data:image/')).length}
                </div>
                <div className="text-sm text-gray-500">URL 圖片</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminProtection>
  )
}